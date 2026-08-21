import sys
import os
import time
import argparse
import cv2

# Set path so 'app.*' imports resolve when running the script directly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.vision.person_detector import PersonDetector
from app.services.vision.shopper_tracker import ShopperTracker
from app.services.vision.gaze_estimator import GazeEstimator
from app.services.tracking.dwell_calculator import DwellCalculator
from app.workers.video_processor.tasks import format_console_log
import asyncio
from datetime import datetime, timezone
from app.db.postgres import SessionLocal
from app.models.camera import Camera
from app.models.shopper_session import ShopperSession
from app.models.tracking_session import TrackingSession
from sqlalchemy.future import select

async def create_tracking_session(source: str):
    try:
        async with SessionLocal() as db:
            result = await db.execute(select(Camera).limit(1))
            camera = result.scalars().first()
            if not camera: return None
            
            session = TrackingSession(
                store_id=camera.store_id,
                camera_id=camera.id,
                video_source=str(source),
                status="running"
            )
            db.add(session)
            await db.commit()
            await db.refresh(session)
            return session.id
    except Exception as e:
        print(f"Failed to create TrackingSession: {e}")
        return None

async def close_tracking_session(ts_id: str, frames: int, shoppers: int, fps: float):
    if not ts_id: return
    try:
        async with SessionLocal() as db:
            result = await db.execute(select(TrackingSession).where(TrackingSession.id == ts_id))
            session = result.scalars().first()
            if session:
                session.status = "completed"
                session.ended_at = datetime.now(timezone.utc)
                session.total_frames_processed = frames
                session.unique_shoppers_count = shoppers
                session.avg_fps = fps
                await db.commit()
    except Exception as e:
        print(f"Failed to close TrackingSession: {e}")

async def save_shopper_to_db(tid: int, dwell_time: float, gaze_history: list = None):
    """Saves a tracked shopper session to the database."""
    try:
        async with SessionLocal() as db:
            # Get default camera/store for the script
            result = await db.execute(select(Camera).limit(1))
            camera = result.scalars().first()
            if not camera:
                print(f"Session closed — Shopper #{tid} | Total Dwell: {dwell_time:.1f}s | Saved to DB: Skipped (No cameras in DB)")
                return
                
            session = ShopperSession(
                store_id=camera.store_id,
                camera_id=camera.id,
                anonymous_id=f"{tid}-{int(time.time())}",
                entry_time=datetime.now(timezone.utc),
                total_dwell_time_seconds=dwell_time,
                is_active=False
            )
            db.add(session)
            await db.commit()
            print(f"Session closed — Shopper #{tid} | Total Dwell: {dwell_time:.1f}s | Saved to DB: ✅ Yes")
    except Exception as e:
        print(f"Failed to save shopper #{tid} to DB: {e}")

def main():
    parser = argparse.ArgumentParser(description="CAMS Consumer Tracking Demo Script")
    parser.add_argument(
        "--source",
        type=str,
        default="0",
        help="Video source: '0' for webcam, or path to an mp4 file, or RTSP stream URL"
    )
    parser.add_argument(
        "--no-display",
        action="store_true",
        help="Set to skip opening GUI window (headless modes)"
    )
    args = parser.parse_args()
    
    # Set up a persistent event loop for async DB calls
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    # Determine source type
    source = args.source
    if source.isdigit():
        source = int(source)

    # Initialize services
    print("Initializing CAMS vision modules...")
    detector = PersonDetector()
    tracker = ShopperTracker()
    gaze = GazeEstimator()
    dwell_calc = DwellCalculator()

    # Open video capture
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"Error: Could not open video source {args.source}.")
        print("Please check that your webcam index or video filepath is valid.")
        sys.exit(1)

    print(f"Video stream loaded successfully from: {args.source}")
    print("Processing stream... Press 'q' in the window to quit.")
    
    tracking_session_id = loop.run_until_complete(create_tracking_session(args.source))

    frame_count = 0
    start_time = time.time()
    all_tracker_ids = set()
    latest_gaze_cache = {}

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_count += 1
            
            # Detect and track
            detections = detector.detect(frame)
            tracked = tracker.update(detections, frame)
            active_ids = [p["tracker_id"] for p in tracked]
            
            # Update tracking states
            for person in tracked:
                tid = person["tracker_id"]
                bbox = person["bbox"]
                all_tracker_ids.add(tid)
                
                # Update dwell times
                dwell_calc.start_dwell(tid)
                dwell_calc.update_dwell(tid)
                
                # Estimate gaze and cache result
                gaze_res = gaze.estimate(frame, bbox)
                latest_gaze_cache[tid] = gaze_res

            # Clean up lost shopper states
            completed_records = dwell_calc.cleanup_lost_trackers(active_ids)
            for rec in completed_records:
                tid = rec["tracker_id"]
                dwell = rec["dwell_seconds"]
                loop.run_until_complete(save_shopper_to_db(tid, dwell))
                latest_gaze_cache.pop(tid, None)

            # Log periodic stats every 30 frames
            if frame_count % 30 == 0:
                print(f"\nFrame {frame_count} | Active Shoppers: {len(tracked)}")
                for person in tracked:
                    tid = person["tracker_id"]
                    dwell = dwell_calc.get_current_dwell(tid)
                    gaze_res = latest_gaze_cache.get(tid)
                    
                    is_looking = gaze_res["is_looking_at_shelf"] if gaze_res else False
                    yaw = gaze_res["yaw"] if gaze_res else None
                    
                    # Print stats line in exact format
                    print(format_console_log(tid, dwell, is_looking, yaw))

            # Annotate and show visual interface
            if not args.no_display:
                annotated = tracker.draw_tracks(frame, tracked)
                cv2.imshow("CAMS Tracking Demo", annotated)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

        # Process remaining sessions on end
        completed_records = dwell_calc.cleanup_lost_trackers([])
        for rec in completed_records:
            tid = rec["tracker_id"]
            dwell = rec["dwell_seconds"]
            loop.run_until_complete(save_shopper_to_db(tid, dwell))

    finally:
        cap.release()
        cv2.destroyAllWindows()
        
        elapsed = time.time() - start_time
        avg_fps = frame_count / max(elapsed, 1.0)
        
        loop.run_until_complete(close_tracking_session(tracking_session_id, frame_count, len(all_tracker_ids), avg_fps))
        
        print("\n" + "="*40)
        print("TRACKING SESSION COMPLETE")
        print(f"Total Frames Processed: {frame_count}")
        print(f"Average FPS: {avg_fps:.1f}")
        print(f"Unique Shoppers Detected: {len(all_tracker_ids)}")
        print(f"Total Time: {elapsed:.1f}s")
        print("="*40)
        
        # We don't close the loop here to prevent asyncpg pool errors when the program exits
        # The OS will clean up resources safely.

if __name__ == "__main__":
    main()
