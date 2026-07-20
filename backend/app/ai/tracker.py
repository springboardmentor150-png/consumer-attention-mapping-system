from __future__ import annotations

import cv2
import supervision as sv
from ultralytics import YOLO


class PersonTracker:
    def __init__(self, model_path: str = "yolov8n.pt") -> None:
        self.model = YOLO(model_path)
        self.tracker = sv.ByteTrack()
        self.box_annotator = sv.BoxAnnotator()
        self.label_annotator = sv.LabelAnnotator()

    def track_frame(self, frame):
        result = self.model(frame, classes=[0], stream=False, conf=0.5)[0]
        detections = sv.Detections.from_ultralytics(result)
        detections = self.tracker.update_with_detections(detections)

        labels = [f"ID {tracker_id}" for tracker_id in detections.tracker_id]
        annotated_frame = self.box_annotator.annotate(frame, detections)
        annotated_frame = self.label_annotator.annotate(annotated_frame, detections, labels)
        return annotated_frame, detections


def run_tracker(source: str = "0"):
    tracker = PersonTracker()
    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        raise RuntimeError(f"Unable to open source: {source}")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            annotated_frame, _ = tracker.track_frame(frame)
            cv2.imshow("Tracking", annotated_frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()
