from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from enum import Enum
from typing import List, Optional

class RecommendationType(str, Enum):
    SHELF_OPTIMIZATION = "shelf_optimization"
    PRODUCT_PLACEMENT = "product_placement"
    PROMOTIONAL_PLACEMENT = "promotional_placement"
    PRICING_REVIEW = "pricing_review"
    LAYOUT_IMPROVEMENT = "layout_improvement"
    RESTOCK_ALERT = "restock_alert"
    ENGAGEMENT_BOOST = "engagement_boost"

class PriorityLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class RecommendationItem(BaseModel):
    id: UUID
    store_id: UUID
    product_id: Optional[UUID] = None
    shelf_id: Optional[UUID] = None
    zone_id: Optional[UUID] = None
    recommendation_type: RecommendationType
    priority: PriorityLevel
    title: str
    description: str
    trigger_reason: str
    suggested_action: str
    expected_impact: Optional[str] = None
    composite_score_before: Optional[float] = None
    is_active: bool = True
    created_at: datetime

class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    store_id: UUID
    product_id: Optional[UUID] = None
    shelf_id: Optional[UUID] = None
    zone_id: Optional[UUID] = None
    recommendation_type: str
    priority: str
    title: str
    description: str
    trigger_reason: str
    suggested_action: str
    expected_impact: Optional[str] = None
    composite_score_before: Optional[float] = None
    is_active: bool
    dismissed_at: Optional[datetime] = None
    created_at: datetime

class StoreRecommendationSummary(BaseModel):
    store_id: UUID
    generated_at: datetime
    total_recommendations: int
    high_priority_count: int
    recommendations: List[RecommendationItem]
