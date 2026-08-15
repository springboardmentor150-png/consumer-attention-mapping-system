import cv2
from datetime import datetime


def start_video_stream():
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Unable to open camera.")
        return

    frame_count = 0

    while True:
        ret, frame = cap.read()

        if not ret:
            print("Failed to read frame.")
            break

        frame_count += 1

        frame = cv2.resize(frame, (640, 480))

        timestamp = datetime.now().strftime("%H:%M:%S")

        print(f"Frame: {frame_count} | Time: {timestamp}")

        cv2.imshow("Consumer Attention Mapping System", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    start_video_stream()