from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict

class GazeResult(BaseModel):
    gaze_direction: Optional[List[float]] = None
    head_pose: Dict[str, float]  # yaw, pitch, roll
    is_looking_at_shelf: bool
    confidence: float
    attention_point: Optional[List[float]] = None

class AttentionEventCreate(BaseModel):
    session_id: UUID
    camera_id: UUID
    event_type: str
    attention_duration_seconds: float
    is_looking_at_shelf: bool
    shelf_id: Optional[UUID] = None
    zone_id: Optional[UUID] = None
    gaze_x: Optional[float] = None
    gaze_y: Optional[float] = None
    head_yaw: Optional[float] = None
    head_pitch: Optional[float] = None
    head_roll: Optional[float] = None
    confidence_score: Optional[float] = None

class AttentionEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: UUID
    camera_id: UUID
    shelf_id: Optional[UUID]
    zone_id: Optional[UUID]
    event_type: str
    gaze_x: Optional[float]
    gaze_y: Optional[float]
    head_yaw: Optional[float]
    head_pitch: Optional[float]
    head_roll: Optional[float]
    attention_duration_seconds: float
    is_looking_at_shelf: bool
    confidence_score: Optional[float]
    timestamp: datetime
