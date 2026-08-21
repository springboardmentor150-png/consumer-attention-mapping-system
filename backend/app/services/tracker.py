import sys
import os
import math
import time
import cv2
import supervision as sv
from ultralytics import YOLO
from sqlmodel import Session, create_engine

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from app.models.models import AttentionLog
from app.services.gaze import estimate_gaze_direction
from app.services.heatmap import generate_store_heatmap

DATABASE_URL = "postgresql://postgres:Zxcvbnm%400@localhost:5432/postgres"
engine = create_engine(DATABASE_URL)

def classify_shopper(dwell_time, path_length, gaze_shifts):
    if dwell_time >= 15.0 and path_length > 300:
        return "Explorer"
    elif dwell_time >= 10.0 and gaze_shifts >= 3:
        return "Comparison Shopper"
    else:
        return "Quick Buyer"

def save_dwell_session(shopper_id, dwell_time, path_length, gaze_shifts):
    clean_id = int(shopper_id)
    clean_dwell = float(dwell_time)
    if clean_dwell < 1.0:
        return

    segment = classify_shopper(clean_dwell, path_length, gaze_shifts)
    with Session(engine) as session:
        log = AttentionLog(
            shopper_id=clean_id,
            dwell_time_seconds=round(clean_dwell, 2),
            segment_tag=segment
        )
        session.add(log)
        session.commit()
        print(f"Logged Shopper #{clean_id} | Dwell: {clean_dwell:.1f}s | Path: {int(path_length)}px | Segment: {segment}")

def start_shopper_tracker(video_source=0):
    model = YOLO("yolov8n.pt")
    tracker = sv.ByteTrack()
    box_annotator = sv.BoxAnnotator()
    label_annotator = sv.LabelAnnotator()

    cap = cv2.VideoCapture(video_source)
    entry_times, last_positions, path_lengths = {}, {}, {}
    last_gaze_states, gaze_shifts_count = {}, {}
    trajectory_points = []
    last_frame = None

    print("Shopper Behavior & Heatmap Tracker Active. Press 'q' to quit...")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        last_frame = frame
        results = model(frame, classes=[0], verbose=False)[0]
        detections = sv.Detections.from_ultralytics(results)
        detections = tracker.update_with_detections(detections)
        labels, current_time = [], time.time()

        if detections.tracker_id is not None:
            for idx, tracker_id in enumerate(detections.tracker_id):
                shopper_key = int(tracker_id)
                bbox = detections.xyxy[idx]
                center_x = (bbox[0] + bbox[2]) / 2.0
                center_y = (bbox[1] + bbox[3]) / 2.0
                
                # Collect spatial points for Task 2 Heatmap
                trajectory_points.append((center_x, center_y))

                if shopper_key not in entry_times:
                    entry_times[shopper_key] = current_time
                    path_lengths[shopper_key] = 0.0
                    last_positions[shopper_key] = (center_x, center_y)
                    gaze_shifts_count[shopper_key] = 0
                    last_gaze_states[shopper_key] = "Facing Away"

                prev_x, prev_y = last_positions[shopper_key]
                path_lengths[shopper_key] += math.hypot(center_x - prev_x, center_y - prev_y)
                last_positions[shopper_key] = (center_x, center_y)

                dwell_time = current_time - entry_times[shopper_key]
                gaze_status = estimate_gaze_direction(frame, bbox)

                if gaze_status != last_gaze_states[shopper_key]:
                    gaze_shifts_count[shopper_key] += 1
                    last_gaze_states[shopper_key] = gaze_status

                current_segment = classify_shopper(dwell_time, path_lengths[shopper_key], gaze_shifts_count[shopper_key])
                labels.append(f"#{shopper_key} | {dwell_time:.1f}s | {current_segment}")

        annotated_frame = box_annotator.annotate(scene=frame.copy(), detections=detections)
        annotated_frame = label_annotator.annotate(scene=annotated_frame, detections=detections, labels=labels)
        cv2.imshow("Tracker - Task 1 & 2 Active", annotated_frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            for shopper_id, entry_time in entry_times.items():
                save_dwell_session(shopper_id, time.time() - entry_time, path_lengths[shopper_id], gaze_shifts_count[shopper_id])
            break

    # Save spatial heatmap image upon exit
    if last_frame is not None:
        generate_store_heatmap(last_frame.shape, trajectory_points)

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    start_shopper_tracker(0)