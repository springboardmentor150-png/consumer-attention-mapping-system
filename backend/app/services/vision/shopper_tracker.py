import cv2
import numpy as np
from typing import List, Dict, Any
from loguru import logger

class ShopperTracker:
    def __init__(self):
        self.tracker = None
        self.frame_count = 0
        self.last_tracked_persons = []

    def initialize(self) -> None:
        """Initialize ByteTrack from supervision library."""
        try:
            import supervision as sv
            logger.info("Initializing ByteTrack tracker (increased buffer for stability)...")
            # Increase track_buffer to 120 frames (4 seconds at 30fps) to prevent ID switching
            self.tracker = sv.ByteTrack(track_thresh=0.25, track_buffer=120, match_thresh=0.8)
        except Exception as e:
            logger.error(f"Error initializing ByteTrack: {e}")
            raise e

    def update(self, detections: List[Dict[str, Any]], frame: np.ndarray) -> List[Dict[str, Any]]:
        """Update tracker with new detections."""
        if self.tracker is None:
            self.initialize()
            
        if not detections:
            self.last_tracked_persons = []
            return []
            
        self.frame_count += 1
        
        # Convert our detection format to supervision format
        xyxy_list = []
        conf_list = []
        class_id_list = []
        
        for det in detections:
            xyxy_list.append(det["bbox"])
            conf_list.append(det["confidence"])
            class_id_list.append(det["class_id"])
            
        xyxy_array = np.array(xyxy_list, dtype=np.float32)
        confidence_array = np.array(conf_list, dtype=np.float32)
        class_id_array = np.array(class_id_list, dtype=np.int32)
        
        import supervision as sv
        sv_detections = sv.Detections(
            xyxy=xyxy_array,
            confidence=confidence_array,
            class_id=class_id_array
        )
        
        # Update tracker
        tracked_detections = self.tracker.update_with_detections(sv_detections)
        
        tracked_persons = []
        if tracked_detections.tracker_id is not None:
            for bbox, conf, tid in zip(tracked_detections.xyxy, tracked_detections.confidence, tracked_detections.tracker_id):
                x1, y1, x2, y2 = bbox.tolist()
                tracked_persons.append({
                    "tracker_id": int(tid),
                    "bbox": [x1, y1, x2, y2],
                    "confidence": float(conf),
                    "center_x": (x1 + x2) / 2.0,
                    "center_y": (y1 + y2) / 2.0
                })
                
        self.last_tracked_persons = tracked_persons
        return tracked_persons

    def draw_tracks(self, frame: np.ndarray, tracked_persons: List[Dict[str, Any]]) -> np.ndarray:
        """Draw bounding boxes and unique Shopper ID labels on the frame."""
        annotated_frame = frame.copy()
        for person in tracked_persons:
            x1, y1, x2, y2 = person["bbox"]
            tid = person["tracker_id"]
            
            # Draw green rectangle
            cv2.rectangle(
                annotated_frame,
                (int(x1), int(y1)),
                (int(x2), int(y2)),
                (0, 255, 0),
                2
            )
            
            # Draw label
            label = f"Shopper #{tid}"
            cv2.putText(
                annotated_frame,
                label,
                (int(x1), int(y1) - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 255),
                2,
                cv2.LINE_AA
            )
            
        return annotated_frame

    def get_active_count(self) -> int:
        return len(self.last_tracked_persons)

    def reset(self) -> None:
        self.initialize()
        self.frame_count = 0
        self.last_tracked_persons = []
