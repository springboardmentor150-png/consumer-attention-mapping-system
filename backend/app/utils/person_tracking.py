from ultralytics import YOLO
import cv2

# Load YOLO model
model = YOLO("yolov8n.pt")

# Webcam (change to "videos/retail.mp4" when you have a valid video)
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Unable to open video source.")
    exit()

while True:
    ret, frame = cap.read()

    if not ret:
        break

    # Track people
    results = model.track(
        source=frame,
        persist=True,
        tracker="trackers/bytetrack.yaml",
        classes=[0],  # Detect only persons
        verbose=False
    )

    annotated = results[0].plot()

    cv2.imshow("Person Tracking", annotated)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()