from sqlalchemy import Column, Integer, Float, String
from app.database.database import Base


class ShopperSession(Base):
    __tablename__ = "shopper_sessions"

    id = Column(Integer, primary_key=True, index=True)
    shopper_id = Column(Integer, index=True)
    path_length = Column(Float, default=0.0)
    total_dwell_time = Column(Float, default=0.0)
    shelf_dwell_time = Column(Float, default=0.0)
    gaze_shifts = Column(Integer, default=0)
    segment = Column(String, default="Unknown")
