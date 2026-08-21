from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.database.database import Base


class TrackingSession(Base):
    __tablename__ = "tracking_sessions"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    shelf_id = Column(Integer, ForeignKey("shelves.id"), nullable=False)
    entry_time = Column(DateTime, default=datetime.utcnow)
    exit_time = Column(DateTime)
    dwell_time = Column(Float)

    store = relationship("Store")
    shelf = relationship("Shelf")
