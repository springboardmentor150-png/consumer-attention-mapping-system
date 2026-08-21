from typing import Optional

from pydantic import BaseModel, Field


class ProductScoreCreate(BaseModel):

    shelf_name: str

    attention_duration: float = 0

    interaction_frequency: float = 0

    # Part 1 raw metrics
    total_views: int = Field(
        default=0,
        ge=0
    )

    total_pickups: int = Field(
        default=0,
        ge=0
    )

    total_purchases: int = Field(
        default=0,
        ge=0
    )

    # Calculated rates - kept for compatibility
    pickup_rate: Optional[float] = Field(
        default=None,
        ge=0
    )

    conversion_rate: Optional[float] = Field(
        default=None,
        ge=0
    )

    repeat_engagement: float = Field(
        default=0,
        ge=0
    )


class ProductScoreResponse(ProductScoreCreate):

    id: int

    attractiveness_score: float

    class Config:
        from_attributes = True