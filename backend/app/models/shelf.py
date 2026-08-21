from sqlalchemy import Column, Integer, String, ForeignKey

from app.models.base import Base

class Shelf(Base):
    __tablename__ = "shelves"

    id = Column(Integer, primary_key=True, index=True)

    zone_name = Column(String, nullable=False)

    store_id = Column(Integer, ForeignKey("stores.id"))

    zone_coordinates = Column(String, nullable=True)