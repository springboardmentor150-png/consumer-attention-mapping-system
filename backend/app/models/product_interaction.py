from sqlalchemy import Column, Integer, String, Float
from app.models.base import Base


class ProductInteraction(Base):

    __tablename__ = "product_interactions"

    id = Column(Integer, primary_key=True, index=True)

    shopper_id = Column(Integer, nullable=False)

    product_name = Column(String, nullable=False)

    event_type = Column(String, nullable=False)

    duration = Column(Float, default=0)
