import os
import cv2
from ultralytics import YOLO


def run_detection(source="0"):
    """Run person-only detection from a webcam or a video file."""
    model = YOLO("yolov8n.pt")

    video_path = os.path.join(os.path.dirname(__file__), "..", "..", "videos", "shopping.mp4")
    source_to_use = video_path if source == "video" else source

    cap = cv2.VideoCapture(source_to_use)

    if not cap.isOpened():
        raise RuntimeError(f"Unable to open source: {source_to_use}")

    try:
        while True:
            success, frame = cap.read()
            if not success:
                break

            results = model(frame, classes=[0])
            annotated_frame = results[0].plot()

            cv2.imshow("Consumer Attention - Person Detection", annotated_frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    run_detection("0")
