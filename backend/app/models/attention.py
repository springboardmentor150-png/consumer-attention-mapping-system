from sqlalchemy import Column, Float, Integer, String

from app.database.database import Base


class Attention(Base):
    __tablename__ = "attention"

    id = Column(Integer, primary_key=True, index=True)
    shopper_id = Column(Integer, nullable=False, index=True)
    shelf = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
