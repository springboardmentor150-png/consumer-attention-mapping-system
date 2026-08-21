from ultralytics import YOLO
import cv2

# Load YOLO model
model = YOLO("yolov8n.pt")

# Detect only persons (class 0)
results = model("images/test.jpg", classes=[0])

# Draw bounding boxes
annotated_frame = results[0].plot()

# Display result
cv2.imshow("Person Detection", annotated_frame)

cv2.waitKey(0)
cv2.destroyAllWindows()
