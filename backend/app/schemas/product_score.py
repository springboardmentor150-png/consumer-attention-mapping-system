from pydantic import BaseModel


class ProductScoreCreate(BaseModel):
    product_name: str
    shelf_name: str
    attention_duration: float
    interaction_frequency: float
    pickup_rate: float
    conversion_rate: float
    repeat_engagement: float


class ProductScoreResponse(ProductScoreCreate):
    id: int
    attractiveness_score: float

    class Config:
        from_attributes = True
