from ultralytics import YOLO
import supervision as sv
import cv2

from ai.zone_tracker import get_shelf_zone
from ai.zones import SHELF_ZONES

# ==========================
# Load YOLO Model
# ==========================
model = YOLO("yolov8n.pt")

# ==========================
# Initialize ByteTrack
# ==========================
tracker = sv.ByteTrack()

# ==========================
# Open Webcam
# ==========================
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Could not open webcam")
    exit()

print("Webcam Started")

# ==========================
# Annotators
# ==========================
box_annotator = sv.BoxAnnotator()
label_annotator = sv.LabelAnnotator()

# ==========================
# Main Loop
# ==========================
while True:

    success, frame = cap.read()

    if not success:
        break

    # --------------------------
    # Draw Shelf Zones
    # --------------------------
    for shelf_id, (zx1, zy1, zx2, zy2) in SHELF_ZONES.items():

        cv2.rectangle(
            frame,
            (zx1, zy1),
            (zx2, zy2),
            (255, 255, 0),
            2
        )

        cv2.putText(
            frame,
            f"Shelf {shelf_id}",
            (zx1, zy1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 0),
            2
        )

    # --------------------------
    # YOLO Detection
    # --------------------------
    results = model(
        frame,
        classes=[0],
        verbose=False
    )[0]

    detections = sv.Detections.from_ultralytics(results)

    # --------------------------
    # ByteTrack
    # --------------------------
    tracked = tracker.update_with_detections(detections)

    # --------------------------
    # Labels
    # --------------------------
    labels = []

    if tracked.tracker_id is not None:

        for xyxy, tracker_id in zip(
            tracked.xyxy,
            tracked.tracker_id
        ):

            x1, y1, x2, y2 = map(int, xyxy)

            center_x = (x1 + x2) // 2
            center_y = (y1 + y2) // 2

            shelf_id = get_shelf_zone(
                center_x,
                center_y
            )

            if shelf_id is not None:

                labels.append(
                    f"ID {tracker_id} | Shelf {shelf_id}"
                )

            else:

                labels.append(
                    f"ID {tracker_id}"
                )

    # --------------------------
    # Draw Bounding Boxes
    # --------------------------
    annotated_frame = box_annotator.annotate(
        scene=frame.copy(),
        detections=tracked
    )

    annotated_frame = label_annotator.annotate(
        scene=annotated_frame,
        detections=tracked,
        labels=labels
    )

    # --------------------------
    # Display
    # --------------------------
    cv2.imshow(
        "Consumer Attention Mapping System",
        annotated_frame
    )

    # Quit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# ==========================
# Cleanup
# ==========================
cap.release()
cv2.destroyAllWindows()