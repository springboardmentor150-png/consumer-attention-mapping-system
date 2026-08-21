from datetime import datetime

from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey

from app.database.database import Base


class CustomerPath(Base):

    __tablename__ = "customer_paths"

    id = Column(Integer, primary_key=True)
    person_id = Column(Integer)
    store_id = Column(Integer, ForeignKey("stores.id"))
    frame_no = Column(Integer)
    x = Column(Float)
    y = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
