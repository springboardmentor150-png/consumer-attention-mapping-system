import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Boolean, Float, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.postgres import Base

class Store(Base):
    __tablename__ = "stores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    store_type: Mapped[str] = mapped_column(String(100), nullable=False)
    floor_plan_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    total_area_sqft: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    store_metadata: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    zones: Mapped[List["StoreZone"]] = relationship("StoreZone", back_populates="store", cascade="all, delete-orphan")
    shelves: Mapped[List["Shelf"]] = relationship("Shelf", back_populates="store", cascade="all, delete-orphan")
    cameras: Mapped[List["Camera"]] = relationship("Camera", back_populates="store", cascade="all, delete-orphan")
