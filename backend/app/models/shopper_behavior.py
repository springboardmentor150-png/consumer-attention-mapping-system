from sqlalchemy import Column, Integer, String, Float, DateTime
from app.core.database import Base


class ShopperBehavior(Base):
    __tablename__ = "shopper_behavior"

    id = Column(Integer, primary_key=True, index=True)

    track_id = Column(Integer, nullable=False, index=True)

    entry_time = Column(DateTime, nullable=False)
    exit_time = Column(DateTime, nullable=False)

    dwell_time = Column(Float, nullable=False)

    path_length = Column(Float, default=0)

    shelves_visited = Column(Integer, default=0)

    behavior_segment = Column(String, nullable=False)

    created_at = Column(DateTime)