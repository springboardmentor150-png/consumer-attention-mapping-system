import cv2
from ultralytics import YOLO
import os

BASE_DIR = os.path.dirname(__file__)

MODEL_PATH = os.path.join(BASE_DIR, "models", "trained_models", "best.pt")

model = YOLO(MODEL_PATH)

print("Model path:", MODEL_PATH)
print("Exists:", os.path.exists(MODEL_PATH))

print("=" * 40)
print("Consumer Attention Mapping System")
print("=" * 40)

print("\nSelect Input Source")
print("1. Live Webcam")
print("2. Video File")

choice = input("\nEnter your choice (1 or 2): ")

if choice == "1":
    cap = cv2.VideoCapture(0)

elif choice == "2":
    path = input("Enter the full video path: ")
    cap = cv2.VideoCapture(path)

else:
    print("Invalid choice.")
    exit()

if not cap.isOpened():
    print("Error: Could not open camera/video.")
    exit()

print("\nStreaming started...")
print("Press 'q' to quit.\n")

while True:

    ret, frame = cap.read()

    if not ret:
        print("End of stream.")
        break

    # Resize frame
    frame = cv2.resize(frame, (800, 600))

    results = model(frame, conf=0.05, verbose=False)

    print("Detections:", len(results[0].boxes))

    annotated_frame = results[0].plot()

    frame = annotated_frame

    # Frame number
    frame_number = int(cap.get(cv2.CAP_PROP_POS_FRAMES))

    # Timestamp in seconds
    timestamp = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000

    # Display metadata on frame
    cv2.putText(
        frame,
        f"Frame: {frame_number}",
        (20, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 255, 0),
        2,
    )

    cv2.putText(
        frame,
        f"Time: {timestamp:.2f}s",
        (20, 60),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 0),
        2,
    )

    # Print metadata in terminal
    print(f"Frame: {frame_number} | Timestamp: {timestamp:.2f} sec")

    cv2.imshow("Consumer Attention Mapping System", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
