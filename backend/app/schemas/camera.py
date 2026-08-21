from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.camera import CameraStatus


class CameraBase(BaseModel):
    store_id: str
    zone_id: Optional[str] = None
    shelf_id: Optional[str] = None
    name: str
    camera_type: str
    rtsp_url: str
    ip_address: str
    location_description: Optional[str] = None
    mount_height_cm: Optional[float] = None
    field_of_view_degrees: Optional[float] = None
    resolution: str
    fps: int = 30
    status: CameraStatus = CameraStatus.inactive


class CameraCreate(CameraBase):
    pass


class CameraUpdate(BaseModel):
    store_id: Optional[str] = None
    zone_id: Optional[str] = None
    shelf_id: Optional[str] = None
    name: Optional[str] = None
    camera_type: Optional[str] = None
    rtsp_url: Optional[str] = None
    ip_address: Optional[str] = None
    location_description: Optional[str] = None
    mount_height_cm: Optional[float] = None
    field_of_view_degrees: Optional[float] = None
    resolution: Optional[str] = None
    fps: Optional[int] = None
    status: Optional[CameraStatus] = None


class CameraStatusUpdate(BaseModel):
    status: CameraStatus


class CameraResponse(CameraBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    last_heartbeat: Optional[datetime] = None
    created_at: datetime
