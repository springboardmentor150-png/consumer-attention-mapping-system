from sqlalchemy import Column, Integer, String, ForeignKey
from app.core.database import Base


class Shelf(Base):

    __tablename__ = "shelves"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    category = Column(String)

    # -----------------------------------
    # Shelf Coordinates
    # -----------------------------------

    x1 = Column(Integer, nullable=False)

    y1 = Column(Integer, nullable=False)

    x2 = Column(Integer, nullable=False)

    y2 = Column(Integer, nullable=False)

    store_id = Column(
        Integer,
        ForeignKey("stores.id")
    )