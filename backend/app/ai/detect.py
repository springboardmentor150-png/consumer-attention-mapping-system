from __future__ import annotations

from ultralytics import YOLO


class PersonDetector:
    def __init__(self, model_path: str = "yolov8n.pt") -> None:
        self.model = YOLO(model_path)

    def detect(self, frame, conf: float = 0.5):
        results = self.model(frame, classes=[0], stream=False, conf=conf)
        detections = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().tolist()
                confidence = float(box.conf[0].cpu().item())
                detections.append({
                    "bbox": [x1, y1, x2, y2],
                    "confidence": confidence,
                    "class_id": int(box.cls[0].cpu().item()),
                })
        return detections
