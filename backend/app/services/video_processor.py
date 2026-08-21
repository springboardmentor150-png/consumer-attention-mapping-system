"""
Video Processing Pipeline
Orchestrates the complete CV pipeline:
  Frame extraction → Person detection (YOLOv11) → ByteTrack →
  Zone assignment → Dwell time → Head-pose attention →
  Product detection → Product interaction → Behavior segmentation →
  Heatmap accumulation → PostgreSQL persistence

Runs as a FastAPI BackgroundTask with WebSocket progress updates.
"""

import os
import cv2
import uuid
import time
import logging
import asyncio
import numpy as np
from datetime import datetime, timezone
from typing import Dict, Optional, List, Tuple, Set
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import (
    Video, ProcessingJob, ShopperSession, TrackingPoint,
    AttentionEvent, ProductInteraction, ConsumerBehavior, Alert
)
from ..ml.detection.yolo_detector import get_detector
from ..ml.tracking.bytetrack_tracker import ByteTracker, TrackedObject
from ..ml.attention.head_pose import get_attention_estimator
from ..ml.behavior.segmenter import get_segmenter, BehaviorFeatures

logger = logging.getLogger(__name__)

# Processing configuration
FRAME_SAMPLE_RATE = int(os.getenv("FRAME_SAMPLE_RATE", "2"))   # Process every Nth frame for balanced speed and tracking accuracy
ZONE_PROXIMITY_THRESHOLD = float(os.getenv("ZONE_PROXIMITY_THRESHOLD", "0.15"))
ATTENTION_MIN_DURATION = float(os.getenv("ATTENTION_MIN_DURATION", "1.5"))  # seconds


class VideoProcessor:
    """
    Full retail video analytics pipeline.
    Processes uploaded videos frame by frame and writes results to PostgreSQL.
    """

    def __init__(self, job_id: str, video_id: str, config: Optional[Dict] = None):
        self.job_id = job_id
        self.video_id = video_id
        self.config = config or {}

        # Pipeline components
        self.detector = get_detector()
        self.tracker = ByteTracker(track_thresh=0.15, low_track_thresh=0.05, track_buffer=750)
        self.attention_estimator = get_attention_estimator()
        self.segmenter = get_segmenter()

        # State tracking
        self.track_sessions: Dict[int, dict] = {}     # track_id -> session state
        # FIX Bug 4: secondary index so that if a shopper_code is already known under a
        # different track_id (e.g. after a tracker glitch), we reuse the existing session.
        self._shopper_code_to_tid: Dict[str, int] = {}   # shopper_code -> canonical track_id
        self.heatmap_accumulator: Optional[np.ndarray] = None
        self.frame_width = 0
        self.frame_height = 0
        self._person_counter = 0   # Sequential unique person counter for this video

        # FIX: Stable color/label index tied to session (shopper_code), not raw track_id.
        # This ensures the same physical person gets the same color even if track_id changes.
        self._tid_to_person_num: Dict[int, int] = {}     # track_id -> stable person number
        self._shopper_code_to_person_num: Dict[str, int] = {}  # shopper_code -> stable person number

        # WebSocket broadcaster (set externally)
        self._ws_broadcast = None

    def set_ws_broadcaster(self, broadcaster):
        """Set websocket broadcast function for progress updates."""
        self._ws_broadcast = broadcaster

    async def _broadcast(self, message: dict):
        """Send progress update via WebSocket if connected."""
        if self._ws_broadcast:
            try:
                await self._ws_broadcast(self.job_id, message)
            except Exception:
                pass

    def process(self):
        """
        Main synchronous processing function — called in background thread.
        Processes the video and writes all results to PostgreSQL.
        """
        db = SessionLocal()
        try:
            self._run_pipeline(db)
        except Exception as e:
            logger.error(f"Pipeline failed for job {self.job_id}: {e}")
            self._update_job_status(db, "failed", error_message=str(e))
        finally:
            db.close()

    def _run_pipeline(self, db: Session):
        """Execute the full pipeline."""
        # Load video metadata
        video = db.query(Video).filter(Video.video_id == self.video_id).first()
        if not video:
            raise ValueError(f"Video {self.video_id} not found")

        job = db.query(ProcessingJob).filter(ProcessingJob.job_id == self.job_id).first()
        if not job:
            raise ValueError(f"Job {self.job_id} not found")

        # Update job status
        job.status = "running"
        job.started_at = datetime.now(timezone.utc)
        db.commit()

        # Open video with robust absolute path resolution
        raw_path = video.file_path or ""
        fname = os.path.basename(raw_path)
        candidates = [
            raw_path,
            os.path.abspath(raw_path),
            os.path.join(os.getcwd(), raw_path),
            os.path.join("backend", "uploads", "videos", fname),
            os.path.join("uploads", "videos", fname),
            os.path.join("frontend", "public", fname),
            os.path.join("frontend", fname),
            os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "videos", fname),
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "public", fname),
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", fname),
        ]
        video_path = raw_path
        for cand in candidates:
            if cand and os.path.isfile(cand):
                video_path = os.path.abspath(cand)
                break

        # Open video with robust path resolution and fallback to imageio
        use_imageio_reader = False
        reader = None
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            try:
                import imageio
                reader = imageio.get_reader(video_path)
                use_imageio_reader = True
                meta = reader.get_meta_data()
                fps = meta.get("fps", 25.0) or 25.0
                try:
                    total_frames = int(reader.count_frames())
                except Exception:
                    total_frames = int(meta.get("duration", 10.0) * fps)
                sample_frame = reader.get_data(0)
                self.frame_height, self.frame_width = sample_frame.shape[:2]
                logger.info(f"Opened video via imageio reader: {self.frame_width}x{self.frame_height}, {fps}fps, {total_frames} frames")
            except Exception as read_err:
                raise IOError(
                    f"Cannot open video file: '{video.file_path}' (resolved: '{video_path}'). "
                    f"Error: {read_err}"
                )
        else:
            fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            self.frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            self.frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        # Update video metadata
        video.fps = fps
        video.frame_count = total_frames
        video.width = self.frame_width
        video.height = self.frame_height
        if fps > 0 and total_frames > 0:
            video.duration = total_frames / fps
        video.status = "processing"
        job.total_frames = total_frames
        db.commit()

        # Clean up any previous session records for this video to ensure fresh, accurate unique IDs
        old_sessions = db.query(ShopperSession).filter(ShopperSession.video_id == video.video_id).all()
        if old_sessions:
            logger.info(f"Cleaning up {len(old_sessions)} old sessions for video {video.video_id}")
            for old_s in old_sessions:
                db.query(TrackingPoint).filter(TrackingPoint.session_id == old_s.session_id).delete()
                db.query(AttentionEvent).filter(AttentionEvent.session_id == old_s.session_id).delete()
                db.query(ProductInteraction).filter(ProductInteraction.session_id == old_s.session_id).delete()
                db.query(ConsumerBehavior).filter(ConsumerBehavior.session_id == old_s.session_id).delete()
                db.delete(old_s)
            db.commit()

        # Initialize heatmap accumulator
        self.heatmap_accumulator = np.zeros(
            (max(1, self.frame_height // 4), max(1, self.frame_width // 4)), dtype=np.float32
        )

        # Load zones for this store
        zones = self._load_zones(db, str(video.store_id))
        shelves = self._load_shelves(db, str(video.store_id))

        # Initialize tracker
        self.tracker.reset()

        # Standardize annotated video directory for clean streaming
        backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        upload_dir = os.path.join(backend_dir, "uploads", "videos")
        os.makedirs(upload_dir, exist_ok=True)
        fname = os.path.basename(video_path)
        annotated_video_path = os.path.abspath(os.path.join(upload_dir, f"annotated_{fname}"))
        logger.info(f"Target annotated video path: {annotated_video_path}")

        writer = None
        is_imageio = False
        try:
            import imageio
            writer = imageio.get_writer(
                annotated_video_path,
                fps=fps,
                codec='libx264',
                quality=8,
                pixelformat='yuv420p',
                output_params=['-movflags', 'faststart']
            )
            is_imageio = True
        except Exception as w_err:
            try:
                fourcc = cv2.VideoWriter_fourcc(*'avc1')
                writer = cv2.VideoWriter(annotated_video_path, fourcc, fps, (self.frame_width, self.frame_height))
            except Exception:
                fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                writer = cv2.VideoWriter(annotated_video_path, fourcc, fps, (self.frame_width, self.frame_height))

        logger.info(f"Starting pipeline: {total_frames} frames, {fps:.1f}fps, "
                    f"{len(zones)} zones, {len(shelves)} shelves")

        frame_number = 0
        processed = 0
        persons_detected_total = 0
        tracked_persons = []
        # Cache of active boxes for smooth frame-by-frame video annotation interpolation
        active_annotated_tracks: Dict[int, dict] = {}
        frame_iter = iter(reader) if use_imageio_reader else None

        while True:
            if use_imageio_reader:
                try:
                    frame_rgb = next(frame_iter)
                    frame = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)
                    ret = True
                except StopIteration:
                    ret = False
                except Exception:
                    ret = False
            else:
                ret, frame = cap.read()

            if not ret:
                break

            frame_number += 1
            timestamp = frame_number / fps

            # Process AI detection & tracking on sampled frames for high performance
            if frame_number % FRAME_SAMPLE_RATE == 0 or processed == 0:
                processed += 1

                # 1. Detect & Track persons with YOLOv11 / RobustByteTrack
                person_detections = self.detector.track_persons(frame, persist=True)
                persons_detected_total += len(person_detections)

                # 2. Track persons (Robust Kalman + Appearance Re-ID ByteTrack)
                tracked_persons = self.tracker.update(
                    person_detections, frame_number, timestamp,
                    (self.frame_height, self.frame_width),
                    frame=frame
                )

                # 3. Update active boxes cache keyed directly by canonical track_id
                for tracked in tracked_persons:
                    tid = tracked.track_id
                    code = tracked.shopper_code or f"SHP-{tid:03d}"
                    canonical_tid = self._shopper_code_to_tid.get(code, tid)
                    session_state = self.track_sessions.get(canonical_tid, {})
                    canonical_code = session_state.get("shopper_code", code)
                    person_num = self._shopper_code_to_person_num.get(canonical_code, canonical_tid)

                    active_annotated_tracks[canonical_tid] = {
                        "track_id": canonical_tid,
                        "person_num": person_num,
                        "shopper_code": canonical_code,
                        "bbox": tracked.bbox,
                        "confidence": tracked.confidence,
                        "last_frame": frame_number,
                        "timestamp": timestamp
                    }

                # Retain active tracks across shelf/box occlusions (3.5 seconds = ~85 frames)
                max_retention_frames = max(int(fps * 3.5), 75)
                for tid in list(active_annotated_tracks.keys()):
                    if frame_number - active_annotated_tracks[tid]["last_frame"] > max_retention_frames:
                        active_annotated_tracks.pop(tid, None)

                # 4. Process each tracked person in DB
                for tracked in tracked_persons:
                    self._process_tracked_person(
                        db, tracked, frame, frame_number, timestamp,
                        str(video.video_id), zones, shelves, fps
                    )

            # 5. Draw person tracking bounding boxes & annotations on current frame
            ann_frame = frame.copy()

            # Draw HUD overlay header banner
            cv2.rectangle(ann_frame, (0, 0), (self.frame_width, 36), (10, 15, 25), -1)
            cv2.line(ann_frame, (0, 36), (self.frame_width, 36), (34, 45, 68), 1)
            cv2.putText(ann_frame, "AI PERSON TRACKING | YOLOv11 + ByteTrack",
                        (12, 23), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (57, 255, 20), 2, cv2.LINE_AA)

            ts_label = f"Frame {frame_number}/{total_frames} | {timestamp:.1f}s"
            (tl, _), _ = cv2.getTextSize(ts_label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            cv2.putText(ann_frame, ts_label, (self.frame_width - tl - 180, 23),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1, cv2.LINE_AA)

            color_palette = [
                (57, 255, 20),    # neon green (#1)
                (0, 242, 254),    # cyan (#2)
                (189, 0, 255),    # purple (#3)
                (255, 94, 54),    # orange (#4)
                (254, 242, 0),    # yellow (#5)
                (255, 0, 189),    # neon pink (#6)
                (0, 255, 180),    # mint (#7)
                (79, 172, 254),   # blue (#8)
                (255, 51, 102),   # rose (#9)
                (160, 255, 0),    # lime (#10)
                (255, 153, 0),    # amber (#11)
                (0, 229, 255),    # sky cyan (#12)
            ]

            # Render bounding boxes for each actively tracked person (interpolated & smooth)
            rendered_count = 0
            for canonical_tid, tinfo in active_annotated_tracks.items():
                bbox = tinfo["bbox"]
                x1 = max(0, min(self.frame_width - 1, int(bbox[0] * self.frame_width)))
                y1 = max(0, min(self.frame_height - 1, int(bbox[1] * self.frame_height)))
                x2 = max(0, min(self.frame_width - 1, int(bbox[2] * self.frame_width)))
                y2 = max(0, min(self.frame_height - 1, int(bbox[3] * self.frame_height)))

                if x2 <= x1 or y2 <= y1:
                    continue

                rendered_count += 1
                state = self.track_sessions.get(canonical_tid, {})
                shopper_code = tinfo["shopper_code"]
                person_num = tinfo.get("person_num") or self._shopper_code_to_person_num.get(shopper_code, canonical_tid)
                color = color_palette[(person_num - 1) % len(color_palette)]

                # Main Bounding Box (bold & clear)
                cv2.rectangle(ann_frame, (x1, y1), (x2, y2), color, 2)

                # High-contrast Corner Accents
                corner_len = min(14, max(6, (x2 - x1) // 5))
                for cx_c, cy_c, dx, dy in [(x1, y1, 1, 1), (x2, y1, -1, 1), (x1, y2, 1, -1), (x2, y2, -1, -1)]:
                    cv2.line(ann_frame, (cx_c, cy_c), (cx_c + dx * corner_len, cy_c), color, 4)
                    cv2.line(ann_frame, (cx_c, cy_c), (cx_c, cy_c + dy * corner_len), color, 4)

                # Top Unique Person ID Badge — GUARANTEED STABLE IDENTICAL ID ACROSS ALL FRAMES
                label = f"PERSON #{person_num} | {shopper_code} [{int(tinfo['confidence'] * 100)}%]"
                (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                badge_y = max(38, y1 - 22)
                cv2.rectangle(ann_frame, (x1, badge_y), (x1 + tw + 10, badge_y + 20), color, -1)
                cv2.putText(ann_frame, label, (x1 + 5, badge_y + 14),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 2, cv2.LINE_AA)

                # Bottom Dwell Time & Zone Badge
                dwell_sec = max(0.0, timestamp - state.get('entry_time', timestamp))
                zone_name = state.get('current_zone_name') or "Main Floor"
                sub_label = f"Dwell: {dwell_sec:.1f}s | {zone_name}"
                (sw, sh), _ = cv2.getTextSize(sub_label, cv2.FONT_HERSHEY_SIMPLEX, 0.40, 1)
                sub_y = min(self.frame_height - 22, y2 + 2)
                cv2.rectangle(ann_frame, (x1, sub_y), (x1 + sw + 10, sub_y + 18), (10, 15, 25), -1)
                cv2.rectangle(ann_frame, (x1, sub_y), (x1 + sw + 10, sub_y + 18), color, 1)
                cv2.putText(ann_frame, sub_label, (x1 + 5, sub_y + 13),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.40, color, 1, cv2.LINE_AA)

                # Center Tracking Anchor Dot
                cx_px = int((x1 + x2) / 2)
                cy_px = int((y1 + y2) / 2)
                cv2.circle(ann_frame, (cx_px, cy_px), 4, color, -1)

            # Active persons count HUD badge
            count_label = f"{rendered_count} Active Shoppers"
            (cl, _), _ = cv2.getTextSize(count_label, cv2.FONT_HERSHEY_SIMPLEX, 0.48, 1)
            cv2.rectangle(ann_frame, (self.frame_width - cl - 24, 4), (self.frame_width - 8, 32), (25, 30, 45), -1)
            cv2.rectangle(ann_frame, (self.frame_width - cl - 24, 4), (self.frame_width - 8, 32), (57, 255, 20), 1)
            cv2.putText(ann_frame, count_label, (self.frame_width - cl - 16, 23),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.48, (57, 255, 20), 1, cv2.LINE_AA)

            # Write annotated frame to video file
            if writer is not None:
                if is_imageio:
                    rgb_frame = cv2.cvtColor(ann_frame, cv2.COLOR_BGR2RGB)
                    writer.append_data(rgb_frame)
                else:
                    writer.write(ann_frame)

            # 6. Detect products (if model available)
            if self.detector.is_product_model_loaded:
                for shelf in shelves:
                    if shelf.get("coordinates"):
                        coords = shelf["coordinates"]
                        roi = (
                            coords.get("x1", 0), coords.get("y1", 0),
                            coords.get("x2", 1), coords.get("y2", 1)
                        )
                        product_dets = self.detector.detect_products(frame, roi)

            # 7. Update heatmap
            for tracked in tracked_persons:
                self._update_heatmap(tracked)

            # 8. Update job progress
            if processed % 10 == 0:
                progress = min((frame_number / total_frames) * 100, 99.0) if total_frames > 0 else 0
                job.progress = progress
                job.frames_processed = processed
                job.shoppers_detected = len(self.track_sessions)
                db.commit()

        if cap is not None:
            try:
                cap.release()
            except Exception:
                pass
        if reader is not None:
            try:
                reader.close()
            except Exception:
                pass
        if writer is not None:
            try:
                if is_imageio:
                    writer.close()
                else:
                    writer.release()
            except Exception as close_err:
                logger.warning(f"Error closing VideoWriter: {close_err}")
            logger.info(f"Annotated tracking video saved to: {annotated_video_path}")

        # 9. Finalize all sessions
        logger.info(f"Finalizing {len(self.track_sessions)} shopper sessions")
        self._finalize_all_sessions(db, str(video.video_id), fps)

        # 10. Run behavior segmentation for all sessions
        self._segment_all_behaviors(db, str(video.video_id))

        # 11. Mark job complete
        job.status = "completed"
        job.progress = 100.0
        job.frames_processed = processed
        job.shoppers_detected = len(self.track_sessions)
        job.completed_at = datetime.now(timezone.utc)
        video.status = "completed"
        db.commit()

        # 12. Generate alerts if anomalies detected
        self._check_and_create_alerts(db, video, len(self.track_sessions))

        # 13. Auto-generate recommendations based on processed video data
        try:
            from .recommendation_engine import get_recommendation_engine
            engine = get_recommendation_engine()
            engine.generate_for_store(db, str(video.store_id))
            logger.info(f"Auto-generated recommendations for store {video.store_id}")
        except Exception as rec_err:
            logger.warning(f"Could not auto-generate recommendations: {rec_err}")

        logger.info(
            f"Pipeline complete for job {self.job_id}: "
            f"{processed} frames, {len(self.track_sessions)} unique shoppers"
        )

    def _process_tracked_person(
        self,
        db: Session,
        tracked: TrackedObject,
        frame: np.ndarray,
        frame_number: int,
        timestamp: float,
        video_id: str,
        zones: List[dict],
        shelves: List[dict],
        fps: float
    ):
        """Process a single tracked person for this frame."""
        tid = tracked.track_id
        shopper_code = tracked.shopper_code or f"SHP-{tid:03d}"

        # FIX Bug 4: If this shopper_code is already registered under a DIFFERENT track_id
        # (can happen when the tracker reconnects a gallery entry with a new internal id),
        # redirect to the canonical track_id so we never create a duplicate session.
        if shopper_code in self._shopper_code_to_tid:
            canonical_tid = self._shopper_code_to_tid[shopper_code]
            if canonical_tid != tid and canonical_tid in self.track_sessions:
                # Point this new tid alias at the existing session state
                self.track_sessions[tid] = self.track_sessions[canonical_tid]
                logger.debug(
                    f"Re-ID merge: track_id={tid} → existing session for "
                    f"{shopper_code} (canonical track_id={canonical_tid})"
                )

        # Initialize session state if genuinely new track
        if tid not in self.track_sessions:
            # FIX: Spatial proximity deduplication — safety net for tracker-level re-ID failures.
            # Before creating a new DB session, check if any EXISTING active session's last
            # known position overlaps strongly with this detection. If yes, redirect this tid
            # to the existing session rather than creating a duplicate.
            existing_tid = self._find_nearby_active_session(
                tracked.center_x, tracked.center_y, tracked.bbox, timestamp
            )
            if existing_tid is not None and existing_tid in self.track_sessions:
                # Redirect this new track_id alias to the canonical existing session
                self.track_sessions[tid] = self.track_sessions[existing_tid]
                existing_code = self.track_sessions[existing_tid]["shopper_code"]
                # Also update the shopper_code index so future frames find this faster
                self._shopper_code_to_tid[existing_code] = existing_tid
                logger.info(
                    f"Spatial dedup: new track_id={tid} merged into existing session "
                    f"track_id={existing_tid} ({existing_code})"
                )
            else:
                session_id = str(uuid.uuid4())
                session = ShopperSession(
                    session_id=session_id,
                    video_id=video_id,
                    tracker_id=tid,
                    shopper_code=shopper_code,
                    entry_time=timestamp
                )
                db.add(session)
                db.flush()

                self.track_sessions[tid] = {
                    "session_id": session_id,
                    "shopper_code": shopper_code,
                    "entry_time": timestamp,
                    "last_seen": timestamp,
                    "zones_visited": {},   # zone_id -> {"enter": t, "dwell": 0}
                    "products_viewed": set(),
                    "interactions": 0,
                    "total_distance": 0.0,
                    "last_x": tracked.center_x,
                    "last_y": tracked.center_y,
                    "attention_events": [],
                    "current_attention": None,    # ongoing attention event
                    "current_zone_name": "",
                    "shelf_visits": 0,
                    "repeat_visits": 0
                }
                # Register in the shopper_code -> track_id index
                self._shopper_code_to_tid[shopper_code] = tid
                # Register stable person number for annotation color
                if shopper_code not in self._shopper_code_to_person_num:
                    self._person_counter += 1
                    self._shopper_code_to_person_num[shopper_code] = self._person_counter
                logger.info(f"New session created: {shopper_code} (track_id={tid})")

        state = self.track_sessions[tid]
        state["last_seen"] = timestamp

        # Determine current zone
        current_zone = self._find_zone(tracked.center_x, tracked.center_y, zones)
        zone_id = current_zone.get("zone_id") if current_zone else None
        zone_name = current_zone.get("zone_name") if current_zone else "Main Floor"
        state["current_zone_name"] = zone_name

        # Update zone dwell tracking
        if zone_id:
            if zone_id not in state["zones_visited"]:
                state["zones_visited"][zone_id] = {"enter": timestamp, "dwell": 0.0, "visits": 0, "name": zone_name}
            state["zones_visited"][zone_id]["dwell"] += FRAME_SAMPLE_RATE / fps
            state["zones_visited"][zone_id]["visits"] += 1

        # Calculate movement distance
        dx = tracked.center_x - state["last_x"]
        dy = tracked.center_y - state["last_y"]
        state["total_distance"] += (dx ** 2 + dy ** 2) ** 0.5
        state["last_x"] = tracked.center_x
        state["last_y"] = tracked.center_y

        # Save tracking point
        point = TrackingPoint(
            session_id=state["session_id"],
            frame_number=frame_number,
            timestamp=timestamp,
            x=tracked.center_x,
            y=tracked.center_y,
            width=tracked.bbox[2] - tracked.bbox[0],
            height=tracked.bbox[3] - tracked.bbox[1],
            zone_id=zone_id,
            confidence=tracked.confidence
        )
        db.add(point)

        # Attention analysis (every 5th sampled frame to save compute)
        if frame_number % (FRAME_SAMPLE_RATE * 5) == 0 and self.attention_estimator.is_available:
            self._analyze_attention(db, tracked, frame, timestamp, state, shelves)

        # Flush periodically
        if frame_number % 50 == 0:
            db.flush()

    def _analyze_attention(
        self, db: Session, tracked: TrackedObject, frame: np.ndarray,
        timestamp: float, state: dict, shelves: List[dict]
    ):
        """Estimate shopper attention toward shelves/products."""
        head_pose = self.attention_estimator.estimate_head_pose(frame, tracked.bbox)

        if not head_pose.detected:
            # Close any open attention event
            if state["current_attention"]:
                self._close_attention_event(db, state, timestamp)
            return

        # Check attention to each nearby shelf
        for shelf in shelves:
            if not shelf.get("coordinates"):
                continue
            coords = shelf["coordinates"]
            roi = {
                "x1": coords.get("x1", 0),
                "y1": coords.get("y1", 0),
                "x2": coords.get("x2", 1),
                "y2": coords.get("y2", 1)
            }
            is_attending, confidence = self.attention_estimator.is_attending_to_roi(
                head_pose, roi, tracked.bbox
            )

            if is_attending and confidence > 0.4:
                shelf_id = shelf.get("shelf_id")
                zone_id = shelf.get("zone_id")

                # Extend or start attention event
                if state["current_attention"] and state["current_attention"]["shelf_id"] == shelf_id:
                    state["current_attention"]["end_time"] = timestamp
                    state["current_attention"]["duration"] = (
                        timestamp - state["current_attention"]["start_time"]
                    )
                else:
                    # Close previous attention event
                    if state["current_attention"]:
                        self._close_attention_event(db, state, timestamp)
                    # Start new attention event
                    state["current_attention"] = {
                        "start_time": timestamp,
                        "end_time": timestamp,
                        "shelf_id": shelf_id,
                        "zone_id": zone_id,
                        "confidence": confidence,
                        "duration": 0.0
                    }
                return

        # Not attending any shelf — close current event if any
        if state["current_attention"]:
            self._close_attention_event(db, state, timestamp)

    def _close_attention_event(self, db: Session, state: dict, timestamp: float):
        """Save completed attention event to DB if duration meets threshold."""
        event = state["current_attention"]
        if not event:
            return

        duration = timestamp - event["start_time"]
        if duration >= ATTENTION_MIN_DURATION:
            att_event = AttentionEvent(
                session_id=state["session_id"],
                shelf_id=event.get("shelf_id"),
                zone_id=event.get("zone_id"),
                start_time=event["start_time"],
                end_time=event["end_time"],
                duration=duration,
                attention_type="shelf_view",
                confidence=event.get("confidence", 0.5),
                is_estimated=True
            )
            db.add(att_event)
            state["attention_events"].append(event)

        state["current_attention"] = None

    def _finalize_all_sessions(self, db: Session, video_id: str, fps: float):
        """Update all sessions with final metrics."""
        sessions = db.query(ShopperSession).filter(
            ShopperSession.video_id == video_id
        ).all()

        for session in sessions:
            tid = session.tracker_id
            if tid not in self.track_sessions:
                continue
            state = self.track_sessions[tid]

            duration = state["last_seen"] - state["entry_time"]
            zones_data = [
                {"zone_id": zid, "dwell": info["dwell"], "visits": info["visits"]}
                for zid, info in state["zones_visited"].items()
            ]

            # Movement speed (normalized distance per second)
            speed = state["total_distance"] / max(duration, 1.0)

            session.exit_time = state["last_seen"]
            session.total_dwell_time = duration
            session.zones_visited = zones_data
            session.movement_speed = speed

            # Close any open attention events
            if state["current_attention"]:
                self._close_attention_event(db, state, state["last_seen"])

        db.commit()

    def _segment_all_behaviors(self, db: Session, video_id: str):
        """Run behavior segmentation for all sessions in this video."""
        sessions = db.query(ShopperSession).filter(
            ShopperSession.video_id == video_id
        ).all()

        for session in sessions:
            tid = session.tracker_id
            state = self.track_sessions.get(tid, {})

            # Count attention events
            att_events = db.query(AttentionEvent).filter(
                AttentionEvent.session_id == str(session.session_id)
            ).count()

            interactions = db.query(ProductInteraction).filter(
                ProductInteraction.session_id == str(session.session_id)
            ).count()

            zones_visited = session.zones_visited or []
            zones_count = len(zones_visited)
            duration = session.total_dwell_time or 0.0
            speed = session.movement_speed or 0.0

            features = BehaviorFeatures(
                total_dwell_time=duration,
                zones_visited_count=zones_count,
                products_viewed_count=att_events,
                interactions_count=interactions,
                movement_speed=min(speed * 10, 1.0),  # normalize
                repeat_visits=state.get("repeat_visits", 0),
                comparison_behavior=interactions >= 3 and att_events >= 3,
                shelf_visits=att_events
            )

            result = self.segmenter.classify(features)

            # Persist segment + insight directly onto session for direct API access
            shopper_code = session.shopper_code or f"SHP-{session.tracker_id:03d}"
            session.behavior_segment = result.segment
            session.ai_insight = result.reason or (
                f"{shopper_code} spent {duration:.1f}s across {zones_count} zone(s) "
                f"with {att_events} attention event(s). "
                f"Classified as: {result.segment}."
            )

            existing_b = db.query(ConsumerBehavior).filter(
                ConsumerBehavior.session_id == str(session.session_id)
            ).first()

            if not existing_b:
                behavior = ConsumerBehavior(
                    session_id=str(session.session_id),
                    segment=result.segment,
                    segment_reason=result.reason,
                    zones_visited_count=zones_count,
                    products_viewed_count=att_events,
                    interactions_count=interactions,
                    total_dwell_time=duration,
                    movement_speed=speed,
                    repeat_visits=state.get("repeat_visits", 0),
                    comparison_behavior=features.comparison_behavior
                )
                db.add(behavior)
            else:
                existing_b.segment = result.segment
                existing_b.segment_reason = result.reason

        db.commit()

    def _find_nearby_active_session(
        self,
        cx: float, cy: float,
        bbox: Tuple[float, float, float, float],
        timestamp: float,
        max_dist: float = 0.55,
        max_age_sec: float = 60.0
    ) -> Optional[int]:
        """
        Spatial proximity deduplication helper.
        Checks whether any existing active session has a last-known position
        that corresponds to the given detection. Considers sessions seen within up to 60s.
        Returns the canonical track_id of the matching session, or None.
        """
        best_tid: Optional[int] = None
        best_score: float = 0.0

        for other_tid, state in self.track_sessions.items():
            # Only consider recently-seen sessions within 60s
            dt = timestamp - state.get("last_seen", 0.0)
            if dt > max_age_sec:
                continue

            other_cx = state.get("last_x", -1.0)
            other_cy = state.get("last_y", -1.0)

            # Centroid distance (normalized coords)
            dist = ((cx - other_cx) ** 2 + (cy - other_cy) ** 2) ** 0.5

            # Dynamic allowable distance based on elapsed time (walking speed ~0.10 units/s)
            allowable_dist = min(max_dist, 0.18 + (dt * 0.08))

            if dist < allowable_dist:
                score = 1.0 - (dist / allowable_dist)
                if score > best_score:
                    best_score = score
                    best_tid = other_tid

        if best_tid is not None and best_score > 0.0:
            logger.debug(
                f"Spatial proximity match: new detection at ({cx:.2f},{cy:.2f}) "
                f"-> existing track_id={best_tid} (score={best_score:.2f})"
            )
            return best_tid
        return None

    def _find_zone(
        self, cx: float, cy: float, zones: List[dict]
    ) -> Optional[dict]:
        """Find which zone a point (cx, cy) falls in (normalized coords)."""
        for zone in zones:
            coords = zone.get("coordinates", {})
            if not coords:
                continue
            x1, y1 = coords.get("x1", 0), coords.get("y1", 0)
            x2, y2 = coords.get("x2", 1), coords.get("y2", 1)
            if x1 <= cx <= x2 and y1 <= cy <= y2:
                return zone
        return None

    def _update_heatmap(self, tracked: TrackedObject):
        """Accumulate tracking point into heatmap grid."""
        if self.heatmap_accumulator is None:
            return
        h, w = self.heatmap_accumulator.shape
        px = int(tracked.center_x * w)
        py = int(tracked.center_y * h)
        px = min(max(px, 0), w - 1)
        py = min(max(py, 0), h - 1)
        self.heatmap_accumulator[py, px] += 1.0

    def get_heatmap(self) -> Optional[np.ndarray]:
        """Return normalized heatmap as float32 array."""
        if self.heatmap_accumulator is None:
            return None
        max_val = self.heatmap_accumulator.max()
        if max_val == 0:
            return self.heatmap_accumulator
        return self.heatmap_accumulator / max_val

    def _load_zones(self, db: Session, store_id: str) -> List[dict]:
        """Load store zones as dicts."""
        from ..models import StoreZone
        zones = db.query(StoreZone).filter(StoreZone.store_id == store_id).all()
        return [
            {
                "zone_id": str(z.zone_id),
                "zone_name": z.zone_name,
                "coordinates": z.coordinates
            }
            for z in zones
        ]

    def _load_shelves(self, db: Session, store_id: str) -> List[dict]:
        """Load store shelves as dicts."""
        from ..models import Shelf
        shelves = db.query(Shelf).filter(Shelf.store_id == store_id).all()
        return [
            {
                "shelf_id": str(s.shelf_id),
                "shelf_name": s.shelf_name,
                "zone_id": str(s.zone_id) if s.zone_id else None,
                "coordinates": s.coordinates
            }
            for s in shelves
        ]

    def _update_job_status(self, db: Session, status: str, error_message: str = None):
        """Update job status in DB."""
        job = db.query(ProcessingJob).filter(ProcessingJob.job_id == self.job_id).first()
        if job:
            job.status = status
            if error_message:
                job.error_message = error_message
            job.completed_at = datetime.now(timezone.utc)
            db.commit()

    def _check_and_create_alerts(self, db: Session, video, shopper_count: int):
        """Generate alerts based on processing results."""
        store_id = str(video.store_id)
        camera_id = str(video.camera_id) if video.camera_id else None

        # High traffic alert
        if shopper_count > 50:
            alert = Alert(
                store_id=store_id,
                camera_id=camera_id,
                alert_type="high_traffic",
                message=f"High traffic detected: {shopper_count} shoppers tracked in this video session.",
                severity="info"
            )
            db.add(alert)

        # No shoppers detected
        if shopper_count == 0:
            alert = Alert(
                store_id=store_id,
                camera_id=camera_id,
                alert_type="no_traffic",
                message="No shoppers detected in the processed video. Verify camera positioning or video quality.",
                severity="warning"
            )
            db.add(alert)

        db.commit()


# Active jobs registry for WebSocket status
active_jobs: Dict[str, VideoProcessor] = {}


def run_video_processing(job_id: str, video_id: str, config: Optional[Dict] = None):
    """
    Entry point for background processing task.
    Called from FastAPI BackgroundTasks.
    """
    processor = VideoProcessor(job_id, video_id, config)
    active_jobs[job_id] = processor
    try:
        processor.process()
    finally:
        active_jobs.pop(job_id, None)
