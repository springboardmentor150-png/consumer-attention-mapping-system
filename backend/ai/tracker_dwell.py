from ultralytics import YOLO
import supervision as sv
import cv2
import time
from ai.zone_tracker import get_shelf_zone
from ai.zones import SHELF_ZONES

from ai.db_logger import (
    create_tracking_session,
    update_tracking_session
)
# -----------------------------
# Load YOLO Model
# -----------------------------
model = YOLO("yolov8n.pt")

# -----------------------------
# Initialize ByteTrack
# -----------------------------
tracker = sv.ByteTrack()

# -----------------------------
# Open Webcam
# -----------------------------
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Could not open webcam")
    exit()

print("Webcam Started")

# -----------------------------
# Dictionaries
# -----------------------------
entry_times = {}
last_seen = {}
tracking_records = {}

# -----------------------------
# Main Loop
# -----------------------------
while True:

    success, frame = cap.read()

    if not success:
        break

    # ---------------------------------
# Draw Shelf Zones
# ---------------------------------

    for shelf_id, (x1, y1, x2, y2) in SHELF_ZONES.items():

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (255,255,0),
            2
        )

        cv2.putText(
            frame,
            f"Shelf {shelf_id}",
            (x1, y1-10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255,255,0),
            2
        )
    current_time = time.time()

    # -----------------------------
    # Run YOLO
    # -----------------------------
    results = model(frame, classes=[0], verbose=False)[0]

    detections = sv.Detections.from_ultralytics(results)

    tracked = tracker.update_with_detections(detections)

    # -----------------------------
    # Process detected persons
    # -----------------------------
    if tracked.tracker_id is not None:

        for xyxy, tracker_id in zip(
        tracked.xyxy,
        tracked.tracker_id):

            tracker_id = int(tracker_id)

            x1, y1, x2, y2 = map(int, xyxy)

            center_x = (x1 + x2) // 2
            center_y = (y1 + y2) // 2

            shelf_id = get_shelf_zone(center_x, center_y)

            # Update last seen time
            last_seen[tracker_id] = current_time

    # -----------------------------
    # Check disappeared persons
    # -----------------------------
    for tracker_id in list(last_seen.keys()):

        if current_time - last_seen[tracker_id] > 2:

            dwell_time = current_time - entry_times[tracker_id]

            print(
                f"ID {tracker_id} Left | "
                f"Dwell Time = {dwell_time:.2f} seconds"
            )

            # Update database
            update_tracking_session(
                tracking_records[tracker_id],
                dwell_time
            )

            print("Database Updated")

            del entry_times[tracker_id]
            del last_seen[tracker_id]
            del tracking_records[tracker_id]

    # -----------------------------
    # Draw Bounding Boxes
    # -----------------------------
    annotated_frame = frame.copy()

    box_annotator = sv.BoxAnnotator()
    label_annotator = sv.LabelAnnotator()

    labels = []

    if tracked.tracker_id is not None:
        for xyxy, tracker_id in zip(
            tracked.xyxy,
            tracked.tracker_id):

            x1, y1, x2, y2 = map(int, xyxy)

            center_x = (x1 + x2) // 2
            center_y = (y1 + y2) // 2

            shelf_id = get_shelf_zone(center_x, center_y)

            # Calculate live dwell time
            tracker_id = int(tracker_id)

            if tracker_id not in entry_times:
                continue

            dwell = current_time - entry_times[tracker_id]

            labels.append(
                f"ID {tracker_id} | {dwell:.1f}s | Shelf {shelf_id}"
            )

    annotated_frame = box_annotator.annotate(
        scene=annotated_frame,
        detections=tracked
    )

    annotated_frame = label_annotator.annotate(
        scene=annotated_frame,
        detections=tracked,
        labels=labels
    )

    cv2.imshow("Consumer Tracking + Dwell Time", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# -----------------------------
# Cleanup
# -----------------------------
cap.release()
cv2.destroyAllWindows()