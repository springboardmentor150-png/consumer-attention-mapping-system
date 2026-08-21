from datetime import datetime

from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey

from app.database.database import Base


class AttentionEvent(Base):

    __tablename__ = "attention_events"

    id = Column(Integer, primary_key=True)
    person_id = Column(Integer)
    store_id = Column(Integer)
    shelf_id = Column(Integer, ForeignKey("shelves.id"))
    dwell_time = Column(Float)
    attention_score = Column(Float)
    gaze_direction = Column(String)
    yaw = Column(Float)
    pitch = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
