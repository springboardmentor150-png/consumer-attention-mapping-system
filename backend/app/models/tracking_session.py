import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Float, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.postgres import Base

class TrackingSession(Base):
    __tablename__ = "tracking_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    camera_id: Mapped[str] = mapped_column(String(36), ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False)
    store_id: Mapped[str] = mapped_column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    video_source: Mapped[str] = mapped_column(String(500), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_frames_processed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_persons_detected: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    unique_shoppers_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    avg_fps: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="running", nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    camera: Mapped["Camera"] = relationship("Camera")
    store: Mapped["Store"] = relationship("Store")
