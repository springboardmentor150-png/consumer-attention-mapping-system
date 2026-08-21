import cv2
import os
import time
import psutil

from app.services.vision.tracker import PersonTracker
from app.services.vision.dwell import DwellTimeTracker
from app.services.vision.shelf_mapper import ShelfMapper
from app.services.vision.gaze import GazeEstimator
from app.services.vision.attention import AttentionEngine
from datetime import datetime
from app.core.database import SessionLocal
from app.crud.analytics import create_session


def start_video_stream(source):

    cap = cv2.VideoCapture(source)

    tracker = PersonTracker()
    dwell_tracker = DwellTimeTracker()
    gaze_estimator = GazeEstimator()
    attention_engine = AttentionEngine()

    shelf_mapper = None

    if not cap.isOpened():
        print(f"Could not open source: {source}")
        return

    frame_count = 0
    start_time = time.time()
    prev_frame_time = start_time

    # Print terminal logs only once every second
    last_log_time = start_time

    print("\nStreaming started...")
    print("Press 'q' to quit.\n")

    while True:

        success, frame = cap.read()

        if not success:
            print("\nVideo finished or stream ended.")
            break

        if shelf_mapper is None:
            height, width = frame.shape[:2]

            shelf_mapper = ShelfMapper(
                frame_width=width,
                frame_height=height
            )

            print(f"\nFrame Resolution: {width} x {height}")

        frame_count += 1

        # --------------------------------------------------
        # Tracking
        # --------------------------------------------------

        results = tracker.track(frame)

        tracked_ids = []
        frame_regions = {}
        frame_focuses = {}

        for result in results:

            if result.boxes is None:
                continue

            for box in result.boxes:

                x1, y1, x2, y2 = map(int, box.xyxy[0])

                confidence = float(box.conf[0])

                if box.id is not None:
                    person_id = int(box.id[0])
                    tracked_ids.append(person_id)
                else:
                    person_id = -1

                # ----------------------------------------
                # Shelf Mapping
                # ----------------------------------------

                center_x = (x1 + x2) // 2
                bottom_y = y2

                shelf = shelf_mapper.get_shelf(center_x, bottom_y)

                # ----------------------------------------
                # Face Crop (Upper 40% of Person)
                # -------------------------------- --------

                person_crop = frame[
                    max(0, y1): max(0, y1 + int((y2 - y1) * 0.4)),
                    max(0, x1): min(frame.shape[1], x2)
                ]

                gaze = gaze_estimator.process(person_crop)

                if gaze["face_found"]:
                    attention = attention_engine.get_attention(
                        gaze["direction"]
                    )
                else:
                    attention = "Unknown"

                if person_id != -1:
                    frame_regions[person_id] = shelf
                    frame_focuses[person_id] = (
                        attention if gaze["face_found"] else None
                    )

                # ----------------------------------------
                # Draw Face Mesh
                # ----------------------------------------

                if gaze["face_found"]:

                    gaze_estimator.draw_landmarks(
                        person_crop,
                        gaze["landmarks"]
                    )

                    gaze_estimator.draw_keypoints(
                        person_crop,
                        gaze["image_points"]
                    )

                    frame[
                        max(0, y1): max(0, y1 + int((y2 - y1) * 0.4)),
                        max(0, x1): min(frame.shape[1], x2)
                    ] = person_crop

                # ----------------------------------------
                # Label
                # ----------------------------------------
                label = f"ID {person_id}"

                if shelf:
                    label += f"\nRegion : {shelf}"

                if gaze["face_found"]:
                    label += f"\nLooking : {gaze['direction']}"
                    label += f"\nFocus : {attention}"

                # label += f"\nConf : {confidence:.2f}"
                                
                # ----------------------------------------
                # Draw Bounding Box
                # ----------------------------------------

                cv2.rectangle(
                    frame,
                    (x1, y1),
                    (x2, y2),
                    (0, 255, 0),
                    2,
                )

                lines = label.split("\n")

                for i, line in enumerate(lines):

                    cv2.putText(
                        frame,
                        line,
                        (x1, y1 - 10 - (20 * (len(lines) - i - 1))),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.55,
                        (0, 255, 0),
                        2,
                    )
        # --------------------------------------------------
        # Dwell Time
        # --------------------------------------------------

        completed_sessions = dwell_tracker.update(
            tracked_ids,
            regions=frame_regions,
            focuses=frame_focuses,
        )

        if completed_sessions:

            db = SessionLocal()

            print("\n" + "=" * 60)

            for session in completed_sessions:

                print(
                    f"Shopper {session['person_id']} stayed "
                    f"{session['dwell_time']} seconds."
                )

                create_session(
                    db,
                    {
                        "shopper_id": session["person_id"],
                        "region": session["region"],
                        "focus": session["focus"],
                        "dwell_time": session["dwell_time"],
                        "entry_time": datetime.fromtimestamp(session["entry_time"]),
                        "exit_time": datetime.fromtimestamp(session["exit_time"]),
                        "timestamp": datetime.now(),
                    },
                )

            db.close()

            print("=" * 60 + "\n")

        # --------------------------------------------------
        # Metrics
        # --------------------------------------------------

        current_time = time.time()

        elapsed = current_time - start_time

        fps = (
            1 / (current_time - prev_frame_time)
            if current_time != prev_frame_time
            else 0
        )

        prev_frame_time = current_time

        memory = (
            psutil.Process(os.getpid()).memory_info().rss
            / (1024 * 1024)
        )

        # --------------------------------------------------
        # Shelf Regions
        # --------------------------------------------------

        for shelf_name, (x1, y1, x2, y2) in shelf_mapper.get_regions().items():

            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                (255, 0, 0),
                2
            )

            cv2.putText(
                frame,
                shelf_name,
                (x1 + 10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (255, 0, 0),
                2
            )

        # --------------------------------------------------
        # Overlay
        # --------------------------------------------------

        cv2.putText(
            frame,
            f"Frame: {frame_count}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2,
        )

        cv2.putText(
            frame,
            f"FPS: {fps:.2f}",
            (10, 65),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 0),
            2,
        )

        cv2.putText(
            frame,
            f"Time: {elapsed:.2f}s",
            (10, 100),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 165, 255),
            2,
        )

        # --------------------------------------------------
        # Terminal Logs (Once Per Second)
        # --------------------------------------------------

        if current_time - last_log_time >= 1:

            print(
                f"Frame={frame_count} | "
                f"FPS={fps:.2f} | "
                f"People={len(tracked_ids)} | "
                f"Memory={memory:.2f} MB"
            )

            last_log_time = current_time

        
        display_frame = cv2.resize(frame, (960, 540))

        cv2.imshow("Consumer Attention Mapping", display_frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            print("\nStopped by user.")
            break

    cap.release()
    cv2.destroyAllWindows()

    print("\nResources released successfully.")
    print("Video stream closed.")


if __name__ == "__main__":

    print("\n========= Consumer Attention Mapping =========")
    print("Choose Input Source:")
    print("1. Local Video File")
    print("2. Webcam")
    print("3. RTSP Stream")

    choice = input("\nEnter choice (1/2/3): ").strip()

    if choice == "1":

        video_path = input("\nEnter video path: ").strip().strip('"')

        if not os.path.exists(video_path):
            print("\nFile not found!")
        else:
            start_video_stream(video_path)

    elif choice == "2":

        print("\nOpening webcam...")
        start_video_stream(0)

    elif choice == "3":

        rtsp_url = input("\nEnter RTSP URL: ").strip()
        start_video_stream(rtsp_url)

    else:
        print("\nInvalid choice.")