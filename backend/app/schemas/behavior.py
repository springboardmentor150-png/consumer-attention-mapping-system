from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from enum import Enum
from typing import List, Optional

class SegmentType(str, Enum):
    EXPLORER = "explorer"
    QUICK_BUYER = "quick_buyer"
    COMPARISON_SHOPPER = "comparison_shopper"
    IMPULSE_BUYER = "impulse_buyer"
    BRAND_LOYAL = "brand_loyal"

class ShopperFeatures(BaseModel):
    session_id: UUID
    path_length_meters: float
    total_store_dwell_seconds: float
    unique_zones_visited: int
    avg_gaze_shifts_per_minute: float

class SegmentationResult(BaseModel):
    session_id: UUID
    segment_type: SegmentType
    confidence_score: float
    classification_method: str
    features: ShopperFeatures

class BehaviorSegmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: UUID
    store_id: UUID
    segment_type: str
    path_length_meters: float
    total_store_dwell_seconds: float
    unique_zones_visited: int
    avg_gaze_shifts_per_minute: float
    confidence_score: float
    classification_method: str
    classified_at: datetime
    created_at: datetime

class SegmentDistribution(BaseModel):
    segment_type: str
    count: int
    percentage: float
    avg_dwell_seconds: float

class StoreSegmentSummary(BaseModel):
    store_id: UUID
    period: str
    total_sessions: int
    segments: List[SegmentDistribution]
    most_common_segment: str
