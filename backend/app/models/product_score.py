from sqlalchemy import Column, Integer, String, Float
from app.models.base import Base


class ProductScore(Base):

    __tablename__ = "product_scores"

    id = Column(Integer, primary_key=True, index=True)

    product_name = Column(String)

    attention_duration = Column(Float)

    interaction_frequency = Column(Integer)

    pickup_rate = Column(Float)

    conversion_rate = Column(Float)

    repeat_engagement = Column(Float)

    attractiveness_score = Column(Float)
