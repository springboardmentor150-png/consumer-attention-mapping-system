from sqlalchemy import Column, Integer, Float, String

from app.core.database import Base


class ShopperAttention(Base):
    __tablename__ = "shopper_attention"

    id = Column(Integer, primary_key=True, index=True)

    track_id = Column(Integer, index=True)

    shelf_name = Column(String)

    attention = Column(String)

    yaw = Column(Float)

    pitch = Column(Float)

    roll = Column(Float)

    frame_number = Column(Integer)