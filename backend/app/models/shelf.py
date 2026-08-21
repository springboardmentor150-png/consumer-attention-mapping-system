from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database.database import Base


class Shelf(Base):
    __tablename__ = "shelves"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"))
    shelf_name = Column(String, index=True, nullable=False)
    category = Column(String, nullable=False)
    zone_coordinates = Column(JSON)

    store = relationship("Store")
