from sqlalchemy import Column, Integer, String, Float
from app.database.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, nullable=False)
    shelf_name = Column(String, nullable=False)
    attractiveness_score = Column(Float)
    recommendation_type = Column(String)
    message = Column(String)
