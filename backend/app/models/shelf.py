import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.postgres import Base

class Shelf(Base):
    __tablename__ = "shelves"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    store_id: Mapped[str] = mapped_column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    zone_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("store_zones.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    aisle_number: Mapped[str] = mapped_column(String(50), nullable=False)
    shelf_level: Mapped[int] = mapped_column(Integer, nullable=False)
    coordinates: Mapped[dict] = mapped_column(JSON, nullable=False)
    width_cm: Mapped[float] = mapped_column(Float, nullable=False)
    height_cm: Mapped[float] = mapped_column(Float, nullable=False)
    product_categories: Mapped[list] = mapped_column(JSON, nullable=False)
    planogram_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    store: Mapped["Store"] = relationship("Store", back_populates="shelves")
    zone: Mapped[Optional["StoreZone"]] = relationship("StoreZone", back_populates="shelves")
    cameras: Mapped[List["Camera"]] = relationship("Camera", back_populates="shelf")
    products: Mapped[List["Product"]] = relationship("Product", back_populates="shelf")
