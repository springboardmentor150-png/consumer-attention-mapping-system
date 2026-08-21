from sqlalchemy import Column, Integer, String, ForeignKey

from app.database.database import Base


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    camera_name = Column(String, index=True, nullable=False)
    ip_address = Column(String, nullable=False)
    location = Column(String, nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
