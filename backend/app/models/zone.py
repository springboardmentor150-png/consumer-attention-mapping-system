import enum
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Enum, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.postgres import Base

class ZoneType(str, enum.Enum):
    entrance = "entrance"
    aisle = "aisle"
    checkout = "checkout"
    promotional = "promotional"

class StoreZone(Base):
    __tablename__ = "store_zones"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    store_id: Mapped[str] = mapped_column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    zone_type: Mapped[ZoneType] = mapped_column(Enum(ZoneType), nullable=False, default=ZoneType.aisle)
    coordinates: Mapped[list] = mapped_column(JSON, nullable=False)
    area_sqft: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    store: Mapped["Store"] = relationship("Store", back_populates="zones")
    shelves: Mapped[List["Shelf"]] = relationship("Shelf", back_populates="zone")
    cameras: Mapped[List["Camera"]] = relationship("Camera", back_populates="zone")
