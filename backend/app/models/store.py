from sqlalchemy import Column, Integer, String
from app.database.database import Base

class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    store_name = Column(String(100), nullable=False)
    location = Column(String(200), nullable=False)
