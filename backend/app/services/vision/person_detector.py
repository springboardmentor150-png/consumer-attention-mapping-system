import os
import numpy as np
from typing import List, Dict, Any
from loguru import logger

class PersonDetector:
    def __init__(self, model_path: str = "yolov8n.pt", confidence_threshold: float = 0.5):
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.model = None

    def load_model(self) -> None:
        """Dynamically load the YOLOv8 model from ultralytics."""
        try:
            from ultralytics import YOLO
            logger.info(f"Loading YOLOv8 model from {self.model_path}...")
            
            # If the custom path does not exist, fall back to standard 'yolov8n.pt' which auto-downloads
            if not os.path.exists(self.model_path) and self.model_path != "yolov8n.pt":
                logger.warning(f"Model path {self.model_path} not found. Falling back to default 'yolov8n.pt'.")
                self.model = YOLO("yolov8n.pt")
            else:
                self.model = YOLO(self.model_path)
                
            logger.info("YOLOv8 model loaded successfully.")
        except FileNotFoundError as e:
            logger.error("Could not find the YOLOv8 weights file. Please ensure 'yolov8n.pt' is downloaded.")
            raise e
        except Exception as e:
            logger.error(f"Error loading YOLOv8 model: {e}")
            raise e

    def detect(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Run person detection on a single frame."""
        if self.model is None:
            self.load_model()
            
        results = self.model(frame, classes=[0], conf=self.confidence_threshold, verbose=False)
        detections = []
        
        if not results:
            return detections
            
        # Parse detections
        for result in results:
            for box in result.boxes:
                xyxy = box.xyxy[0].tolist()
                x1, y1, x2, y2 = xyxy
                confidence = float(box.conf[0])
                
                detections.append({
                    "bbox": [x1, y1, x2, y2],
                    "confidence": confidence,
                    "class_id": 0,
                    "class_name": "person",
                    "center_x": (x1 + x2) / 2.0,
                    "center_y": (y1 + y2) / 2.0
                })
                
        return detections

    def get_person_crops(self, frame: np.ndarray, detections: List[Dict[str, Any]]) -> List[np.ndarray]:
        """Crop head regions (upper 60% of person bounding box) for gaze estimation."""
        crops = []
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            h = y2 - y1
            # Crop upper 60% of person box
            head_y2 = y1 + (h * 0.6)
            crop = frame[int(y1):int(head_y2), int(x1):int(x2)]
            crops.append(crop)
        return crops

    def is_loaded(self) -> bool:
        return self.model is not None
