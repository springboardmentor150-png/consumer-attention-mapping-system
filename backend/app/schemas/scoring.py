from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict

class ScoringPeriod(str, Enum):
    TODAY = "today"
    WEEK = "week"
    MONTH = "month"

class ProductScoreInput(BaseModel):
    product_id: UUID
    store_id: UUID
    period: ScoringPeriod = ScoringPeriod.WEEK

class ProductScoreDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[UUID] = None
    product_id: UUID
    product_name: str
    sku: str
    shelf_name: Optional[str] = None
    attention_duration_score: float
    interaction_frequency_score: float
    pickup_rate_score: float
    conversion_rate_score: float
    repeat_engagement_score: float
    composite_score: float
    grade: str
    total_viewers: int
    total_interactions: int
    calculated_at: datetime

class ScoreRanking(BaseModel):
    rank: int
    product: ProductScoreDetail

class StoreScoreReport(BaseModel):
    store_id: UUID
    period: str
    generated_at: datetime
    total_products_scored: int
    avg_composite_score: float
    top_performers: List[ScoreRanking]
    low_performers: List[ScoreRanking]
    score_distribution: Dict[str, int]
