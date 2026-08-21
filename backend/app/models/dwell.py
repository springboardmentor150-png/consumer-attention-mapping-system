from sqlalchemy import Column, Integer, Float, DateTime
from app.database.database import Base


class DwellTime(Base):
    __tablename__ = "dwell_time"

    id = Column(Integer, primary_key=True, index=True)
    shopper_id = Column(Integer)
    shelf_id = Column(Integer)
    store_id = Column(Integer)
    entry_time = Column(DateTime)
    exit_time = Column(DateTime)
    duration = Column(Float)
