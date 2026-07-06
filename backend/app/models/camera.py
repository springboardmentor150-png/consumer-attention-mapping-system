from sqlalchemy import Column, ForeignKey, Integer, String
from app.database.database import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    camera_name = Column(String(100), nullable=False)
    ip_address = Column(String(50))
    location = Column(String(100))
    store_id = Column(Integer, ForeignKey("stores.id"))
