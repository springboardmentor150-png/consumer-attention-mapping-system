import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Float, DateTime, ForeignKey, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.postgres import Base

class DwellTimeRecord(Base):
    __tablename__ = "dwell_time_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("shopper_sessions.id", ondelete="CASCADE"), nullable=False)
    store_id: Mapped[str] = mapped_column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    camera_id: Mapped[str] = mapped_column(String(36), ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False)
    shelf_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("shelves.id", ondelete="SET NULL"), nullable=True)
    zone_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("store_zones.id", ondelete="SET NULL"), nullable=True)
    tracker_id: Mapped[int] = mapped_column(Integer, nullable=False)
    entry_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    exit_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    dwell_seconds: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    is_complete: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session: Mapped["ShopperSession"] = relationship("ShopperSession")
    store: Mapped["Store"] = relationship("Store")
    camera: Mapped["Camera"] = relationship("Camera")
    shelf: Mapped[Optional["Shelf"]] = relationship("Shelf")
    zone: Mapped[Optional["StoreZone"]] = relationship("StoreZone")
