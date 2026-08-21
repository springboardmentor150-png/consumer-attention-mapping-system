import cv2
import os
import time
import numpy as np
from typing import Dict, List, Any, Optional
from queue import Queue
from threading import Thread
from sqlalchemy.orm import Session
import torch

# ---------------------------------------------------------
# 4-Core CPU Optimization & Multi-Threading Configuration
# ---------------------------------------------------------
NUM_CORES = 4
os.environ["OMP_NUM_THREADS"] = str(NUM_CORES)
os.environ["MKL_NUM_THREADS"] = str(NUM_CORES)
os.environ["OPENBLAS_NUM_THREADS"] = str(NUM_CORES)
os.environ["VECLIB_MAXIMUM_THREADS"] = str(NUM_CORES)
os.environ["NUMEXPR_NUM_THREADS"] = str(NUM_CORES)

try:
    torch.set_num_threads(NUM_CORES)
    torch.set_num_interop_threads(NUM_CORES)
except Exception:
    pass

try:
    cv2.setNumThreads(NUM_CORES)
    cv2.ocl.setUseOpenCL(True)
except Exception:
    pass

from ultralytics import YOLO
from app.models.video_track import VideoRecord, PersonTrack, TrackingPoint


class VideoProcessorService:
    """
    High-Performance 4-Core Multi-Threaded YOLOv8 + ByteTrack Video Analytics Pipeline.
    
    Optimizations:
    1. 4-Core PyTorch & OpenCV CPU parallelism (OMP/MKL/OpenBLAS affinity).
    2. Multi-threaded asynchronous video frame reader queue.
    3. Multi-threaded asynchronous video writer queue.
    4. Fast batch vectorization for box rendering and PostgreSQL bulk operations.
    """

    def __init__(self, model_path: str = "yolov8n.pt", confidence: float = 0.35):
        self.confidence = confidence
        resolved_model_path = model_path
        if not os.path.exists(resolved_model_path):
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            candidate = os.path.join(base_dir, "yolov8n.pt")
            if os.path.exists(candidate):
                resolved_model_path = candidate

        print(f"[AI 4-CORE ENGINE] Loading YOLOv8 model on {NUM_CORES} CPU cores from {resolved_model_path}...")
        self.model = YOLO(resolved_model_path)
        print(f"[AI 4-CORE ENGINE] YOLOv8 + ByteTrack initialized with PyTorch threads = {torch.get_num_threads()}.")

    def process_video_file(
        self,
        db: Session,
        input_video_path: str,
        output_dir: str,
        store_id: int = 1,
        camera_id: str = "CAM-01",
        video_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not os.path.exists(input_video_path):
            raise FileNotFoundError(f"Input video file not found: {input_video_path}")

        os.makedirs(output_dir, exist_ok=True)
        filename = os.path.basename(input_video_path)
        base_name, _ = os.path.splitext(filename)
        output_filename = f"processed_{base_name}_{int(time.time())}.mp4"
        output_video_path = os.path.join(output_dir, output_filename)

        cap = cv2.VideoCapture(input_video_path)
        if not cap.isOpened():
            raise ValueError(f"OpenCV could not open video file: {input_video_path}")

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = round(total_frames / fps, 2) if fps > 0 else 0.0

        print(f"\n[AI 4-CORE ENGINE] Starting Accelerated Processing for Store #{store_id} ({camera_id}): {filename}")
        print(f"  • Cores Active: {NUM_CORES} CPU Threads")
        print(f"  • Resolution: {width}x{height} | FPS: {fps:.2f} | Frames: {total_frames} | Duration: {duration}s")

        # Create VideoRecord in database
        v_name = video_name or filename
        video_rec = VideoRecord(
            store_id=store_id,
            camera_id=camera_id,
            video_name=v_name,
            file_path=input_video_path,
            processed_path=output_video_path,
            resolution_w=width,
            resolution_h=height,
            fps=float(fps),
            duration_seconds=float(duration),
            total_frames=total_frames,
            status="PROCESSING",
        )
        db.add(video_rec)
        db.commit()
        db.refresh(video_rec)

        # Video Writer using H.264 / mp4v codec
        fourcc = cv2.VideoWriter_fourcc(*"avc1")
        out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
        if not out.isOpened():
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

        # ---------------------------------------------------------
        # Threaded Asynchronous I/O Pipeline
        # ---------------------------------------------------------
        read_queue: Queue = Queue(maxsize=128)
        write_queue: Queue = Queue(maxsize=128)
        read_done = [False]
        write_done = [False]

        def frame_reader():
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                read_queue.put(frame)
            read_done[0] = True
            cap.release()

        def frame_writer():
            while True:
                item = write_queue.get()
                if item is None:
                    break
                out.write(item)
                write_queue.task_done()
            write_done[0] = True
            out.release()

        reader_thread = Thread(target=frame_reader, daemon=True)
        writer_thread = Thread(target=frame_writer, daemon=True)
        reader_thread.start()
        writer_thread.start()

        track_stats: Dict[int, Dict[str, Any]] = {}
        points_to_insert: List[Dict[str, Any]] = []

        frame_idx = 0
        start_time = time.time()

        colors = [
            (6, 182, 212),    # Cyan
            (168, 85, 247),  # Purple
            (59, 130, 246),   # Blue
            (16, 185, 129),  # Emerald
            (245, 158, 11),  # Amber
            (236, 72, 153),  # Pink
            (239, 68, 68),   # Red
        ]

        with torch.inference_mode():
            while True:
                if read_queue.empty() and read_done[0]:
                    break

                try:
                    frame = read_queue.get(timeout=2.0)
                except Exception:
                    if read_done[0]:
                        break
                    continue

                frame_idx += 1
                timestamp_sec = round(frame_idx / fps, 3) if fps > 0 else 0.0

                # 1. Accelerated Multi-Core YOLOv8 + ByteTrack Inference
                results = self.model.track(
                    source=frame,
                    persist=True,
                    tracker="bytetrack.yaml",
                    classes=[0],
                    conf=self.confidence,
                    imgsz=640,
                    verbose=False,
                )

                active_ids_in_frame: List[int] = []

                if results and len(results) > 0 and results[0].boxes is not None:
                    boxes = results[0].boxes

                    for box in boxes:
                        conf = float(box.conf[0])
                        if conf < self.confidence:
                            continue

                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        x1, y1 = max(0, x1), max(0, y1)
                        x2, y2 = min(width, x2), min(height, y2)

                        track_id = int(box.id[0]) if box.id is not None else -1
                        center_x = (x1 + x2) / 2.0
                        center_y = (y1 + y2) / 2.0

                        if track_id != -1:
                            active_ids_in_frame.append(track_id)

                            if track_id not in track_stats:
                                track_stats[track_id] = {
                                    "first_seen_frame": frame_idx,
                                    "last_seen_frame": frame_idx,
                                    "first_seen_time": timestamp_sec,
                                    "last_seen_time": timestamp_sec,
                                    "total_frames": 1,
                                }
                            else:
                                track_stats[track_id]["last_seen_frame"] = frame_idx
                                track_stats[track_id]["last_seen_time"] = timestamp_sec
                                track_stats[track_id]["total_frames"] += 1

                            points_to_insert.append({
                                "video_id": video_rec.id,
                                "track_id": track_id,
                                "frame_number": frame_idx,
                                "timestamp_sec": timestamp_sec,
                                "x": center_x,
                                "y": center_y,
                                "box_x1": x1,
                                "box_y1": y1,
                                "box_x2": x2,
                                "box_y2": y2,
                                "confidence": round(conf, 3),
                            })

                        # Draw Real Bounding Box on Frame
                        color = colors[track_id % len(colors)] if track_id != -1 else (0, 255, 0)
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

                        # High-Tech Corner Accents
                        cl = min(14, (x2 - x1) // 3, (y2 - y1) // 3)
                        if cl > 2:
                            cv2.line(frame, (x1, y1), (x1 + cl, y1), color, 4)
                            cv2.line(frame, (x1, y1), (x1, y1 + cl), color, 4)
                            cv2.line(frame, (x2, y1), (x2 - cl, y1), color, 4)
                            cv2.line(frame, (x2, y1), (x2, y1 + cl), color, 4)
                            cv2.line(frame, (x1, y2), (x1 + cl, y2), color, 4)
                            cv2.line(frame, (x1, y2), (x1, y2 - cl), color, 4)
                            cv2.line(frame, (x2, y2), (x2 - cl, y2), color, 4)
                            cv2.line(frame, (x2, y2), (x2 - cl, y2), color, 4)

                        # Label Tag
                        label_text = f"PERSON ID: #{track_id}" if track_id != -1 else "PERSON"
                        full_label = f"{label_text} [{int(conf * 100)}%]"

                        (tw, th), _ = cv2.getTextSize(full_label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                        cv2.rectangle(
                            frame,
                            (x1, max(0, y1 - th - 8)),
                            (x1 + tw + 10, y1),
                            color,
                            -1,
                        )
                        cv2.putText(
                            frame,
                            full_label,
                            (x1 + 5, max(th + 2, y1 - 4)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.45,
                            (0, 0, 0),
                            1,
                            cv2.LINE_AA,
                        )

                # Draw Top HUD on Frame
                cv2.rectangle(frame, (0, 0), (width, 36), (10, 15, 25), -1)
                cv2.line(frame, (0, 36), (width, 36), (6, 182, 212), 1)

                hud_text = (
                    f"4-CORE ACCELERATED YOLOv8 | IN FRAME: {len(active_ids_in_frame)} "
                    f"| UNIQUE TRACKS: {len(track_stats)} | FRAME: {frame_idx}/{total_frames}"
                )
                cv2.putText(
                    frame,
                    hud_text,
                    (14, 24),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.52,
                    (6, 182, 212),
                    1,
                    cv2.LINE_AA,
                )

                write_queue.put(frame)

                if frame_idx % 90 == 0 or frame_idx == total_frames:
                    elapsed_batch = time.time() - start_time
                    curr_fps = frame_idx / max(0.001, elapsed_batch)
                    pct = (frame_idx / max(1, total_frames)) * 100
                    print(
                        f"  -> [{pct:.1f}%] Frame {frame_idx}/{total_frames} "
                        f"| Active: {len(active_ids_in_frame)} | Unique: {len(track_stats)} | Throughput: {curr_fps:.1f} FPS (4 Cores)"
                    )

        # Signal writer thread to finish
        write_queue.put(None)
        writer_thread.join(timeout=30.0)

        # Batch insert PersonTracks
        person_track_objs = [
            PersonTrack(
                video_id=video_rec.id,
                track_id=tid,
                first_seen_frame=s["first_seen_frame"],
                last_seen_frame=s["last_seen_frame"],
                first_seen_time=s["first_seen_time"],
                last_seen_time=s["last_seen_time"],
                total_frames=s["total_frames"],
                dwell_seconds=round(s["last_seen_time"] - s["first_seen_time"], 2),
            )
            for tid, s in track_stats.items()
        ]
        if person_track_objs:
            db.bulk_save_objects(person_track_objs)

        # Fast Bulk Insert Tracking Points into PostgreSQL
        if points_to_insert:
            db.bulk_insert_mappings(TrackingPoint, points_to_insert)

        # Finalize VideoRecord
        video_rec.status = "COMPLETED"
        video_rec.unique_tracks_count = len(track_stats)
        db.commit()
        db.refresh(video_rec)

        total_time = round(time.time() - start_time, 2)
        final_fps = round(total_frames / max(0.001, total_time), 1)
        print(f"\n[AI 4-CORE ENGINE] Accelerated Processing Finished in {total_time}s ({final_fps} FPS Average)!")
        print(f"  • Unique Tracks Identified: {len(track_stats)}")
        print(f"  • PostgreSQL Tracking Coordinates Saved: {len(points_to_insert)}")
        print(f"  • Output Video: {output_video_path}\n")

        return {
            "video_id": video_rec.id,
            "video_name": video_rec.video_name,
            "status": "COMPLETED",
            "resolution": f"{width}x{height}",
            "fps": fps,
            "duration_seconds": duration,
            "total_frames": total_frames,
            "unique_tracks_count": len(track_stats),
            "total_points_recorded": len(points_to_insert),
            "processed_video_path": output_video_path,
            "processed_filename": output_filename,
            "processing_time_seconds": total_time,
            "processing_fps": final_fps,
            "cores_utilized": NUM_CORES,
        }
