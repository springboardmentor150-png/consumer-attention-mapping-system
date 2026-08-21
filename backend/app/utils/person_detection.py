from ultralytics import YOLO
import cv2

# Load YOLOv8 model
model = YOLO("yolov8n.pt")

# Webcam (use "videos/retail.mp4" later for a video file)
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Unable to open video source.")
    exit()

while True:
    ret, frame = cap.read()

    if not ret:
        break

    # Run detection
    results = model(frame)

    # Draw bounding boxes
    annotated_frame = results[0].plot()

    cv2.imshow("Person Detection", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()