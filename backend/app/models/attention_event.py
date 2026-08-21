import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.postgres import Base

class AttentionEvent(Base):
    __tablename__ = "attention_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("shopper_sessions.id", ondelete="CASCADE"), nullable=False)
    camera_id: Mapped[str] = mapped_column(String(36), ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False)
    shelf_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("shelves.id", ondelete="SET NULL"), nullable=True)
    zone_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("store_zones.id", ondelete="SET NULL"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    gaze_x: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    gaze_y: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    head_yaw: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    head_pitch: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    head_roll: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    attention_duration_seconds: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    is_looking_at_shelf: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session: Mapped["ShopperSession"] = relationship("ShopperSession")
    camera: Mapped["Camera"] = relationship("Camera")
    shelf: Mapped[Optional["Shelf"]] = relationship("Shelf")
    zone: Mapped[Optional["StoreZone"]] = relationship("StoreZone")
