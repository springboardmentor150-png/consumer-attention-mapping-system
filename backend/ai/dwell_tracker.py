from ultralytics import YOLO
import supervision as sv
import cv2
import time
from services.behavior_services import classify_behavior
from ai.zone_tracker import get_shelf_zone
from ai.zones import SHELF_ZONES

from ai.db_logger import (
    create_tracking_session,
    update_tracking_session
)

from analytics.heatmap_generator import (
    add_point,
    generate_heatmap
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
# Store shelves visited by each tracker
visited_shelves = {}

# -----------------------------
# Main Loop
# -----------------------------
while True:

    success, frame = cap.read()

    if not success:
        break

    # -----------------------------------
    # Draw Shelf Zones
    # -----------------------------------
    for shelf_id, (x1, y1, x2, y2) in SHELF_ZONES.items():

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (255, 255, 0),
            2
        )

        cv2.putText(
            frame,
            f"Shelf {shelf_id}",
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 0),
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
            tracked.tracker_id
        ):

            tracker_id = int(tracker_id)

            # Bounding box coordinates
            x1, y1, x2, y2 = map(int, xyxy)

            # Center point of the person
            center_x = (x1 + x2) // 2
            center_y = (y1 + y2) // 2

            
            # Add point to heatmap
            add_point(center_x, center_y)

            # Determine current shelf
            shelf_id = get_shelf_zone(
                center_x,
                center_y
            )



            # Store shelves visited
            if tracker_id not in visited_shelves:
                visited_shelves[tracker_id] = set()

            if shelf_id is not None:
                visited_shelves[tracker_id].add(shelf_id)

            # First appearance
            if tracker_id not in entry_times:

                entry_times[tracker_id] = current_time

                print(f"ID {tracker_id} Entered")

                record_id = create_tracking_session(
                    tracker_id=tracker_id,
                    store_id=1,
                    shelf_id=shelf_id if shelf_id else 1
                )

                tracking_records[tracker_id] = record_id

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
            shelves_visited = len(
                visited_shelves.get(tracker_id, set())
            )

            segment = classify_behavior(
                dwell_time,
                shelves_visited
            )

            update_tracking_session(
                tracking_records[tracker_id],
                dwell_time,
                segment
            )

            print("Database Updated")

            del entry_times[tracker_id]
            del last_seen[tracker_id]
            del tracking_records[tracker_id]
            if tracker_id in visited_shelves:
                del visited_shelves[tracker_id]

    # -----------------------------
    # Draw Bounding Boxes
    # -----------------------------
    annotated_frame = frame.copy()

    box_annotator = sv.BoxAnnotator()
    label_annotator = sv.LabelAnnotator()

    labels = []

    if tracked.tracker_id is not None:
        labels = [
            f"ID {int(i)}"
            for i in tracked.tracker_id
        ]

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


height, width = frame.shape[:2]
generate_heatmap(
    width,
    height
)
print("Heatmap saved successfully.")

# -----------------------------
# Cleanup
# -----------------------------
cap.release()
cv2.destroyAllWindows()