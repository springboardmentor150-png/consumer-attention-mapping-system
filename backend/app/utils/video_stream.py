import cv2
import time
from datetime import datetime

# ==========================================
# Choose ONE source:
# 0 = Webcam
# "sample.mp4" = Video file
# "rtsp://..." = RTSP Camera
# ==========================================

VIDEO_SOURCE = 0

cap = cv2.VideoCapture(VIDEO_SOURCE)

if not cap.isOpened():
    print("Error: Unable to open video source.")
    exit()

frame_count = 0
start_time = time.time()

print("Video stream started...\n")

while True:
    ret, frame = cap.read()

    if not ret:
        print("End of stream or failed to read frame.")
        break

    frame_count += 1

    # Resize frame
    frame = cv2.resize(frame, (640, 480))

    timestamp = datetime.now().strftime("%H:%M:%S")

    print(
        f"Frame: {frame_count} | "
        f"Timestamp: {timestamp} | "
        f"Resolution: {frame.shape[1]}x{frame.shape[0]}"
    )

    cv2.imshow("Video Stream", frame)
    if cv2.getWindowProperty("Video Stream", cv2.WND_PROP_VISIBLE) < 1:
        break

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

end_time = time.time()

print("\n========== SUMMARY ==========")
print(f"Frames Processed : {frame_count}")
print(f"Time Elapsed     : {round(end_time-start_time,2)} sec")
print("=============================")

cap.release()
cv2.destroyAllWindows()