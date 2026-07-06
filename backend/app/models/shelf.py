from sqlalchemy import Column, ForeignKey, Integer, String
from app.database.database import Base

class Shelf(Base):
    __tablename__ = "shelves"

    id = Column(Integer, primary_key=True, index=True)
    shelf_name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"))
