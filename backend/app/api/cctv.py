import cv2
import numpy as np
import base64
import time
import os
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services.vision.tracker import PersonTracker
from app.services.vision.dwell import DwellTimeTracker
from app.services.vision.shelf_mapper import ShelfMapper
from app.services.vision.gaze import GazeEstimator
from app.services.vision.attention import AttentionEngine

router = APIRouter(prefix="/api/cctv", tags=["CCTV & Computer Vision"])

# Singleton AI Engine instances
_tracker: Optional[PersonTracker] = None
_dwell_tracker: Optional[DwellTimeTracker] = None
_gaze_estimator: Optional[GazeEstimator] = None
_attention_engine: Optional[AttentionEngine] = None
_shelf_mapper: Optional[ShelfMapper] = None


def get_ai_engines():
    global _tracker, _dwell_tracker, _gaze_estimator, _attention_engine, _shelf_mapper
    if _tracker is None:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
        model_path = os.path.join(base_dir, "yolov8n.pt")
        if not os.path.exists(model_path):
            model_path = "yolov8n.pt"
        _tracker = PersonTracker(model_path=model_path, confidence=0.4)
        _dwell_tracker = DwellTimeTracker()
        _gaze_estimator = GazeEstimator()
        _attention_engine = AttentionEngine()
        _shelf_mapper = ShelfMapper(frame_width=1280, frame_height=720)
    return _tracker, _dwell_tracker, _gaze_estimator, _attention_engine, _shelf_mapper


class FrameInferenceRequest(BaseModel):
    image_base64: str
    camera_id: Optional[str] = "CAM-01"
    confidence_threshold: Optional[float] = 0.45


class PersonDetectionResult(BaseModel):
    id: int
    box: List[int]
    confidence: float
    shelf_zone: Optional[str]
    gaze_detected: bool
    direction: str
    yaw: Optional[float]
    pitch: Optional[float]
    roll: Optional[float]
    attention_focus: Optional[str]
    dwell_seconds: float


class FrameInferenceResponse(BaseModel):
    count: int
    detections: List[PersonDetectionResult]
    fps: float
    model_name: str = "YOLOv8n + ByteTrack + MediaPipe Face Mesh"
    timestamp: float


@router.post("/infer-frame", response_model=FrameInferenceResponse)
async def infer_frame(payload: FrameInferenceRequest):
    """
    Run REAL YOLOv8 person detection and MediaPipe gaze estimation on an incoming video frame.
    Returns EXACT model detections, tracking IDs, confidence scores, and real gaze angles.
    Zero simulated or fabricated detections.
    """
    start_t = time.time()
    tracker, dwell_tracker, gaze_estimator, attention_engine, shelf_mapper = get_ai_engines()

    try:
        # Decode base64 image
        header_split = payload.image_base64.split(",")
        encoded_data = header_split[1] if len(header_split) > 1 else header_split[0]
        image_bytes = base64.b64decode(encoded_data)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image frame data")

        h, w = frame.shape[:2]

        # Update shelf mapper dimensions dynamically if changed
        if shelf_mapper.frame_width != w or shelf_mapper.frame_height != h:
            shelf_mapper = ShelfMapper(frame_width=w, frame_height=h)

        # 1. Real YOLOv8 + ByteTrack Inference
        results = tracker.track(frame)

        tracked_ids = []
        frame_regions = {}
        frame_focuses = {}
        detections: List[PersonDetectionResult] = []

        for result in results:
            if result.boxes is None:
                continue

            for box in result.boxes:
                conf = float(box.conf[0])
                if conf < (payload.confidence_threshold or 0.4):
                    continue

                x1, y1, x2, y2 = map(int, box.xyxy[0])
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w, x2), min(h, y2)

                person_id = int(box.id[0]) if box.id is not None else -1
                if person_id != -1:
                    tracked_ids.append(person_id)

                # 2. Real Shelf ROI Mapping
                center_x = (x1 + x2) // 2
                bottom_y = y2
                shelf = shelf_mapper.get_shelf(center_x, bottom_y)

                # 3. Real MediaPipe Face Mesh & Head Pose on Person Crop
                crop_h = int((y2 - y1) * 0.4)
                person_crop = frame[y1 : min(h, y1 + max(20, crop_h)), x1:x2]

                gaze = gaze_estimator.process(person_crop)

                if gaze["face_found"]:
                    direction = gaze["direction"]
                    attention = attention_engine.get_attention(direction)
                    yaw = round(float(gaze["yaw"]), 2)
                    pitch = round(float(gaze["pitch"]), 2)
                    roll = round(float(gaze["roll"]), 2)
                    gaze_detected = True
                else:
                    direction = "Unknown / Not Detected"
                    attention = "Unknown"
                    yaw = None
                    pitch = None
                    roll = None
                    gaze_detected = False

                if person_id != -1:
                    frame_regions[person_id] = shelf
                    frame_focuses[person_id] = attention if gaze_detected else None

                # Calculate dwell from real dwell tracker
                current_dwell = 0.0
                if person_id != -1 and person_id in dwell_tracker.active_shoppers:
                    current_dwell = round(
                        time.time() - dwell_tracker.active_shoppers[person_id]["entry_time"],
                        1,
                    )

                detections.append(
                    PersonDetectionResult(
                        id=person_id,
                        box=[x1, y1, x2, y2],
                        confidence=round(conf, 3),
                        shelf_zone=shelf,
                        gaze_detected=gaze_detected,
                        direction=direction,
                        yaw=yaw,
                        pitch=pitch,
                        roll=roll,
                        attention_focus=attention if gaze_detected else None,
                        dwell_seconds=current_dwell,
                    )
                )

        # Update real dwell tracker
        dwell_tracker.update(tracked_ids, regions=frame_regions, focuses=frame_focuses)

        elapsed = time.time() - start_t
        fps = round(1.0 / max(0.001, elapsed), 1)

        return FrameInferenceResponse(
            count=len(detections),
            detections=detections,
            fps=fps,
            model_name="YOLOv8n + ByteTrack + MediaPipe Face Mesh",
            timestamp=time.time(),
        )

    except Exception as e:
        print(f"Error during AI frame inference: {e}")
        raise HTTPException(status_code=500, detail=str(e))
