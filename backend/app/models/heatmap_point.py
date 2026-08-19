from datetime import datetime

from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey

from app.database.database import Base


class HeatmapPoint(Base):

    __tablename__ = "heatmap_points"

    id = Column(Integer, primary_key=True)
    person_id = Column(Integer)
    store_id = Column(Integer, ForeignKey("stores.id"))
    shelf_id = Column(Integer, ForeignKey("shelves.id"))
    x = Column(Float)
    y = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
