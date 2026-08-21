from sqlalchemy import Column, Integer, Float, DateTime,String
from sqlalchemy.sql import func

from app.core.database import Base


class ShopperTracking(Base):

    __tablename__ = "shopper_tracking"

    id = Column(Integer, primary_key=True, index=True)

    track_id = Column(Integer, nullable=False)

    x1 = Column(Integer)
    y1 = Column(Integer)

    x2 = Column(Integer)
    y2 = Column(Integer)

    confidence = Column(Float)

    frame_number = Column(Integer)
    shelf_name = Column(
    String(100),
    nullable=True
)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
  
