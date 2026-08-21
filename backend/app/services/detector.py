"""
detector.py

YOLOv8 Person Detection Service

This module loads the YOLOv8 model once and provides
functions to detect only people in an image/frame.
"""

from ultralytics import YOLO
import cv2


class PersonDetector:
    def __init__(self, model_path: str = "yolov8n.pt", confidence: float = 0.4):
        """
        Initialize the YOLO model.

        Args:
            model_path (str): Path to YOLO model.
            confidence (float): Minimum confidence threshold.
        """
        self.model = YOLO(model_path)
        self.confidence = confidence

    def detect(self, frame):
        """
        Detect persons in a frame.

        Args:
            frame: OpenCV image

        Returns:
            List of person detections.
        """

        results = self.model(
            frame,
            conf=self.confidence,
            verbose=False
        )

        detections = []

        for result in results:

            for box in result.boxes:

                class_id = int(box.cls[0])

                # Only detect PERSON (COCO Class 0)
                if class_id != 0:
                    continue

                confidence = float(box.conf[0])

                x1, y1, x2, y2 = map(
                    int,
                    box.xyxy[0]
                )

                detections.append({
                    "bbox": [x1, y1, x2, y2],
                    "confidence": confidence,
                    "class_id": class_id,
                    "class_name": "person"
                })

        return detections

    def draw_detections(self, frame, detections):
        """
        Draw bounding boxes on frame.

        Args:
            frame: OpenCV frame
            detections: List returned from detect()

        Returns:
            Annotated frame
        """

        for detection in detections:

            x1, y1, x2, y2 = detection["bbox"]
            confidence = detection["confidence"]

            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2
            )

            label = f"Person {confidence:.2f}"

            cv2.putText(
                frame,
                label,
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2
            )

        return frame


# Singleton instance
detector = PersonDetector()


if __name__ == "__main__":
    cap = cv2.VideoCapture(0)

    while True:

        success, frame = cap.read()

        if not success:
            break

        detections = detector.detect(frame)

        frame = detector.draw_detections(
            frame,
            detections
        )

        cv2.imshow("YOLO Person Detection", frame)

        key = cv2.waitKey(1)

        if key == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()