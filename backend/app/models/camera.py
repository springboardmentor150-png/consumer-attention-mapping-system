from sqlalchemy import Column, Integer, String, ForeignKey

from app.database.database import Base


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    shelf_id = Column(Integer, ForeignKey("shelves.id"))
    status = Column(String, default="active")
