from pydantic import BaseModel


class RecommendationResponse(BaseModel):
    id: int
    product_name: str
    shelf_name: str
    attractiveness_score: float
    recommendation_type: str
    message: str

    class Config:
        from_attributes = True
