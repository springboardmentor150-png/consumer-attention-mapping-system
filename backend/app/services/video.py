import cv2
import time

def test_camera_stream():
    # 0 is usually your laptop's default webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    frame_count = 0
    print("Starting video stream... Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame.")
            break
            
        frame_count += 1
        
        # Resize frame as requested by mentor for stable processing
        resized_frame = cv2.resize(frame, (640, 480))
        
        # Log metadata to console every 30 frames (about once a second)
        if frame_count % 30 == 0:
            print(f"Processed Frame: {frame_count} | Timestamp: {time.time()}")

        # Show the video feed
        cv2.imshow('Retail Stream - OpenCV Test', resized_frame)

        # Listen for the 'q' key to quit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Clean up securely
    cap.release()
    cv2.destroyAllWindows()
    print("Stream closed securely without memory leaks.")

if __name__ == "__main__":
    test_camera_stream()