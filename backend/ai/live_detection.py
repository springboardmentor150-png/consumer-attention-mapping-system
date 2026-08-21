from ultralytics import YOLO
import cv2

# Load YOLO model
model = YOLO("yolov8n.pt")

# Open webcam (0 = default webcam)
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Could not open webcam")
    exit()

print("✅ Webcam Started")

while True:

    success, frame = cap.read()

    if not success:
        break

    # Detect only persons
    results = model(frame, classes=[0])

    # Draw bounding boxes
    annotated_frame = results[0].plot()

    # Display frame
    cv2.imshow("Consumer Detection System", annotated_frame)

    # Press Q to exit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()