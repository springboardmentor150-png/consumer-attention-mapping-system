from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class ShelfAttentionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    shelf_id: UUID
    shelf_name: str
    total_attention_seconds: float
    unique_viewers: int
    avg_dwell_seconds: float
    engagement_rank: Optional[int] = None

class ZoneTrafficSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    zone_id: UUID
    zone_name: str
    total_visitors: int
    avg_time_seconds: float

class HourlyTrafficPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    hour: int
    visitor_count: int
    avg_dwell_seconds: float

class DashboardAnalytics(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    store_id: UUID
    period: str
    total_visitors: int
    avg_dwell_time_seconds: float
    top_attention_shelves: List[ShelfAttentionSummary]
    zone_traffic: List[ZoneTrafficSummary]
    hourly_traffic: List[HourlyTrafficPoint]
    active_shoppers_now: int

class AttentionReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    store_id: UUID
    generated_at: datetime
    period: str
    data: DashboardAnalytics
