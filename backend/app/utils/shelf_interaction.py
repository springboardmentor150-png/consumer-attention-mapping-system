import cv2
from ultralytics import YOLO

# ==========================================
# Load YOLOv8 Model
# ==========================================
model = YOLO("yolov8n.pt")

# ==========================================
# Shelf Regions (ROI)
# Format:
# "Shelf Name": (x1, y1, x2, y2)
# ==========================================
SHELVES = {
    "Shelf A": (40, 60, 250, 260),
    "Shelf B": (330, 60, 600, 260)
}

# ==========================================
# Open Webcam
# Use 0 for webcam
# Use "videos/retail.mp4" for video file
# ==========================================
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Unable to open video source.")
    exit()

print("Shelf Interaction Detection Started...")
print("Press Q to Exit\n")

# ==========================================
# Main Loop
# ==========================================
while True:

    ret, frame = cap.read()

    if not ret:
        print("Failed to read frame.")
        break

    # ==========================================
    # Detect & Track Persons
    # ==========================================
    results = model.track(
        frame,
        persist=True,
        classes=[0],          # Detect only persons
        verbose=False
    )

    # ==========================================
    # Draw Shelf ROIs
    # ==========================================
    for shelf_name, (sx1, sy1, sx2, sy2) in SHELVES.items():

        cv2.rectangle(
            frame,
            (sx1, sy1),
            (sx2, sy2),
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            shelf_name,
            (sx1, sy1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )

    # ==========================================
    # Process Persons
    # ==========================================
    boxes = results[0].boxes

    if boxes is not None:

        for box in boxes:

            # Bounding Box
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            # Tracking ID
            if box.id is not None:
                track_id = int(box.id.item())
            else:
                track_id = -1

            # Center Point
            center_x = (x1 + x2) // 2
            center_y = (y1 + y2) // 2

            # Draw Person Box
            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                (255, 0, 0),
                2
            )

            # Draw Center Point
            cv2.circle(
                frame,
                (center_x, center_y),
                5,
                (0, 0, 255),
                -1
            )

            # Draw Tracking ID
            cv2.putText(
                frame,
                f"ID {track_id}",
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 0),
                2
            )

            # ==========================================
            # Check Shelf Interaction
            # ==========================================
            for shelf_name, (sx1, sy1, sx2, sy2) in SHELVES.items():

                if sx1 <= center_x <= sx2 and sy1 <= center_y <= sy2:

                    print(f"Customer {track_id} entered {shelf_name}")

                    # Highlight Shelf
                    cv2.rectangle(
                        frame,
                        (sx1, sy1),
                        (sx2, sy2),
                        (0, 0, 255),
                        3
                    )

                    cv2.putText(
                        frame,
                        f"Customer {track_id} -> {shelf_name}",
                        (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.8,
                        (0, 0, 255),
                        2
                    )

    # ==========================================
    # Display Output
    # ==========================================
    cv2.imshow("Consumer Attention System", frame)

    # Press Q to Exit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# ==========================================
# Cleanup
# ==========================================
cap.release()
cv2.destroyAllWindows()