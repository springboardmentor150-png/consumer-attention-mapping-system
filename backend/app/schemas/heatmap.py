from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from enum import Enum
from typing import List, Optional

class HeatmapType(str, Enum):
    TRAFFIC = "traffic"
    ATTENTION = "attention"
    DWELL = "dwell"
    ENGAGEMENT = "engagement"

class HeatmapGenerateRequest(BaseModel):
    store_id: UUID
    heatmap_type: HeatmapType = HeatmapType.TRAFFIC
    camera_id: Optional[UUID] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    width: int = 800
    height: int = 600

class HeatmapResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    store_id: UUID
    camera_id: Optional[UUID] = None
    heatmap_type: str
    file_path: str
    file_name: str
    resolution_width: int
    resolution_height: int
    data_points_count: int
    period_start: datetime
    period_end: datetime
    is_current: bool
    generated_at: datetime
    image_url: str

class HeatmapListResponse(BaseModel):
    store_id: UUID
    heatmaps: List[HeatmapResponse]
