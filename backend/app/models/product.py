import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.postgres import Base

class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    shelf_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("shelves.id", ondelete="SET NULL"), nullable=True)
    sku: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    brand: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    subcategory: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    shelf_position: Mapped[dict] = mapped_column(JSON, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    barcode: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_promotional: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    shelf: Mapped[Optional["Shelf"]] = relationship("Shelf", back_populates="products")
