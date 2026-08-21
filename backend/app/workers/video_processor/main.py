import cv2
import time
from datetime import datetime, timezone
from typing import Optional, Union, Dict, Any
from loguru import logger

from app.db.postgres import SessionLocal
from app.services.vision.person_detector import PersonDetector
from app.services.vision.shopper_tracker import ShopperTracker
from app.services.vision.gaze_estimator import GazeEstimator
from app.services.tracking.dwell_calculator import DwellCalculator
from app.services.tracking.session_manager import SessionManager
from app.workers.video_processor.tasks import save_dwell_record, save_attention_event, format_console_log

class VideoProcessorWorker:
    def __init__(
        self,
        video_source: Union[str, int],
        display: bool = True,
        store_id: Optional[str] = None,
        camera_id: Optional[str] = None,
        shelf_id: Optional[str] = None,
        zone_id: Optional[str] = None
    ):
        self.video_source = video_source
        self.display = display
        self.store_id = store_id
        self.camera_id = camera_id
        self.shelf_id = shelf_id
        self.zone_id = zone_id

        # Services
        self.detector = PersonDetector()
        self.tracker = ShopperTracker()
        self.gaze = GazeEstimator()
        self.dwell_calc = DwellCalculator()
        
        # State
        self.frame_count = 0
        self.start_time = None
        self.is_running = False
        self._tid_gaze: Dict[int, Optional[Dict[str, Any]]] = {}
        self.db = None
        self.session_manager = None
        self.unique_shoppers = set()

    async def run(self) -> None:
        """Run the video processing loop asynchronously."""
        self.start_time = time.time()
        
        # Determine source
        source = self.video_source
        if isinstance(source, str) and source.isdigit():
            source = int(source)

        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            logger.error(f"Failed to open video source: {self.video_source}")
            return
            
        self.is_running = True
        logger.info(f"Video processor worker started. Source: {self.video_source}")

        # Initialize database session if configured
        if self.store_id and self.camera_id:
            self.db = SessionLocal()
            self.session_manager = SessionManager(self.db)

        try:
            while self.is_running:
                ret, frame = cap.read()
                if not ret:
                    break
                    
                self.frame_count += 1
                
                # Detect and track
                detections = self.detector.detect(frame)
                tracked = self.tracker.update(detections, frame)
                active_ids = [p["tracker_id"] for p in tracked]
                
                # Process active shopper events
                for person in tracked:
                    tid = person["tracker_id"]
                    bbox = person["bbox"]
                    self.unique_shoppers.add(tid)
                    
                    # Manage dwell timing
                    self.dwell_calc.start_dwell(tid, shelf_id=self.shelf_id, zone_id=self.zone_id)
                    self.dwell_calc.update_dwell(tid)
                    
                    # Manage database shopper session
                    if self.session_manager:
                        sess_id = await self.session_manager.get_session_id(tid)
                        if not sess_id:
                            await self.session_manager.create_session(self.store_id, self.camera_id, tid)
                            
                    # Estimate gaze
                    gaze_res = self.gaze.estimate(frame, bbox)
                    self._tid_gaze[tid] = gaze_res

                # Cleanup lost shoppers and save records
                completed_dwells = self.dwell_calc.cleanup_lost_trackers(active_ids)
                await self._save_completed_dwells(completed_dwells)

                # Periodically log active statistics & save attention snapshots
                if self.frame_count % 30 == 0:
                    await self._log_periodic_stats(tracked)
                    
                # Display output window
                annotated = self.tracker.draw_tracks(frame, tracked)
                if self.display:
                    cv2.imshow("CAMS Tracking Feed", annotated)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break

            # Process any remaining active trackers at the end of the video
            remaining_ids = list(self.dwell_calc._active_dwells.keys())
            completed_dwells = self.dwell_calc.cleanup_lost_trackers([])
            await self._save_completed_dwells(completed_dwells)

        finally:
            cap.release()
            cv2.destroyAllWindows()
            self.gaze.close()
            
            # Clean up db connection
            if self.db:
                await self.db.close()
                
            self.print_summary()

    async def _save_completed_dwells(self, completed: list) -> None:
        """Process and save closed tracking session results."""
        for comp in completed:
            tid = comp["tracker_id"]
            dwell = comp["dwell_seconds"]
            print(f"Session closed — Shopper #{tid} | Total Dwell: {dwell:.1f}s")
            
            if self.session_manager:
                sess_id = await self.session_manager.get_session_id(tid)
                if sess_id:
                    # Save completed DwellTimeRecord
                    await save_dwell_record(
                        db=self.db,
                        session_id=sess_id,
                        tracker_id=tid,
                        entry_timestamp=comp["entry_time"],
                        exit_timestamp=comp["exit_time"],
                        dwell_seconds=dwell,
                        store_id=self.store_id,
                        camera_id=self.camera_id,
                        shelf_id=self.shelf_id,
                        zone_id=self.zone_id
                    )
                    # Close the session in database
                    await self.session_manager.close_session(tid, dwell)

    async def _log_periodic_stats(self, tracked: list) -> None:
        """Log active consumer gaze/dwell states and record to database."""
        print(f"\nFrame {self.frame_count} | Active Shoppers: {len(tracked)}")
        
        for person in tracked:
            tid = person["tracker_id"]
            dwell = self.dwell_calc.get_current_dwell(tid)
            gaze_res = self._tid_gaze.get(tid)
            
            is_looking = gaze_res["is_looking_at_shelf"] if gaze_res else False
            yaw = gaze_res["head_yaw"] if gaze_res else None
            
            # Print standard format console line
            log_line = format_console_log(tid, dwell, is_looking, yaw)
            print(log_line)
            
            # Save periodic attention events in DB
            if self.session_manager:
                sess_id = await self.session_manager.get_session_id(tid)
                if sess_id and gaze_res:
                    await save_attention_event(
                        db=self.db,
                        session_id=sess_id,
                        camera_id=self.camera_id,
                        event_type="dwell",
                        attention_duration_seconds=1.0,  # 30 frames at ~30 FPS is 1.0 second duration
                        is_looking_at_shelf=is_looking,
                        head_yaw=yaw,
                        head_pitch=gaze_res.get("head_pitch"),
                        head_roll=gaze_res.get("head_roll"),
                        shelf_id=self.shelf_id,
                        zone_id=self.zone_id
                    )

    def print_summary(self) -> None:
        """Print worker session termination statistics summary."""
        elapsed = time.time() - self.start_time
        avg_fps = self.frame_count / max(elapsed, 1.0)
        
        print("\n" + "="*40)
        print("TRACKING WORKER PROCESS COMPLETED")
        print(f"Total Frames Processed: {self.frame_count}")
        print(f"Average FPS: {avg_fps:.1f}")
        print(f"Unique Shoppers Detected: {len(self.unique_shoppers)}")
        print(f"Total Process Time: {elapsed:.1f}s")
        print("="*40)
