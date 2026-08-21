from sqlalchemy import Column, Integer, String, ForeignKey

from app.database.database import Base


class ShelfZone(Base):

    __tablename__ = "shelf_zones"

    id = Column(Integer, primary_key=True)
    shelf_id = Column(Integer, ForeignKey("shelves.id"))
    name = Column(String)
    x1 = Column(Integer)
    y1 = Column(Integer)
    x2 = Column(Integer)
    y2 = Column(Integer)
    x3 = Column(Integer)
    y3 = Column(Integer)
    x4 = Column(Integer)
    y4 = Column(Integer)
