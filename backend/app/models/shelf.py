from sqlalchemy import Column, Integer, String, ForeignKey

from app.database.database import Base


class Shelf(Base):
    __tablename__ = "shelves"

    id = Column(Integer, primary_key=True, index=True)
    shelf_name = Column(String, index=True, nullable=False)
    category = Column(String, nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"))
