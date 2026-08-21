from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime
from typing import List, Dict, Any, Optional

class TrackerDetection(BaseModel):
    tracker_id: int
    bbox: List[float]
    confidence: float
    center_x: float
    center_y: float

class ShopperSessionCreate(BaseModel):
    store_id: UUID
    camera_id: UUID
    anonymous_id: str
    entry_time: datetime

class ShopperSessionUpdate(BaseModel):
    exit_time: Optional[datetime] = None
    total_dwell_time_seconds: Optional[float] = None
    path_data: Optional[List[Dict[str, Any]]] = None
    zones_visited: Optional[List[str]] = None
    consumer_segment: Optional[str] = None
    is_active: Optional[bool] = None

class ShopperSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    store_id: UUID
    camera_id: UUID
    anonymous_id: str
    entry_time: datetime
    exit_time: Optional[datetime]
    total_dwell_time_seconds: float
    path_data: List[Dict[str, Any]]
    zones_visited: List[str]
    consumer_segment: Optional[str]
    is_active: bool
    created_at: datetime

class DwellTimeCreate(BaseModel):
    session_id: UUID
    store_id: UUID
    camera_id: UUID
    tracker_id: int
    entry_timestamp: datetime
    shelf_id: Optional[UUID] = None
    zone_id: Optional[UUID] = None

class DwellTimeUpdate(BaseModel):
    exit_timestamp: datetime
    dwell_seconds: float
    is_complete: bool = True

class DwellTimeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: UUID
    store_id: UUID
    camera_id: UUID
    shelf_id: Optional[UUID]
    zone_id: Optional[UUID]
    tracker_id: int
    entry_timestamp: datetime
    exit_timestamp: Optional[datetime]
    dwell_seconds: float
    is_complete: bool
    created_at: datetime

class TrackingSessionCreate(BaseModel):
    camera_id: UUID
    store_id: UUID
    video_source: str

class TrackingSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    camera_id: UUID
    store_id: UUID
    video_source: str
    started_at: datetime
    ended_at: Optional[datetime]
    total_frames_processed: int
    total_persons_detected: int
    unique_shoppers_count: int
    avg_fps: float
    status: str
    error_message: Optional[str]

class ActiveShopperInfo(BaseModel):
    tracker_id: int
    current_dwell_seconds: float
    is_looking_at_shelf: bool
    head_yaw: Optional[float] = None
