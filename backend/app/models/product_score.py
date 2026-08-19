from sqlalchemy import Column, Integer, String, Float
from app.database.database import Base


class ProductScore(Base):
    __tablename__ = "product_scores"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, nullable=False)
    shelf_name = Column(String, nullable=False)
    attention_duration = Column(Float, default=0.0)
    interaction_frequency = Column(Float, default=0.0)
    pickup_rate = Column(Float, default=0.0)
    conversion_rate = Column(Float, default=0.0)
    repeat_engagement = Column(Float, default=0.0)
    attractiveness_score = Column(Float, default=0.0)
