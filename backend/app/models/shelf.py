from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Shelf(Base):
    __tablename__ = "shelves"

    id = Column(Integer, primary_key=True, index=True)

    shelf_name = Column(String, nullable=False)

    zone_coordinates = Column(String, nullable=True)

    store_id = Column(Integer, ForeignKey("stores.id"))

    store = relationship("Store", back_populates="shelves")