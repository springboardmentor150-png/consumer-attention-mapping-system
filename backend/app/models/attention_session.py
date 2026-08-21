from sqlalchemy import Column, Integer, Float, String
from app.models.base import Base


class AttentionSession(Base):

    __tablename__ = "attention_sessions"

    id = Column(Integer, primary_key=True, index=True)

    shopper_id = Column(Integer)

    dwell_time = Column(Float)

    zone_a_time = Column(Float, default=0)

    zone_b_time = Column(Float, default=0)

    zone_c_time = Column(Float, default=0)

    most_viewed_zone = Column(String)

    segment = Column(String, default="Unknown")
