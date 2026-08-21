import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Float, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.postgres import Base

class BehaviorSegment(Base):
    __tablename__ = "behavior_segments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("shopper_sessions.id", ondelete="CASCADE"), unique=True, nullable=False)
    store_id: Mapped[str] = mapped_column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    segment_type: Mapped[str] = mapped_column(String(50), nullable=False)
    path_length_meters: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_store_dwell_seconds: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    unique_zones_visited: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    avg_gaze_shifts_per_minute: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    classification_method: Mapped[str] = mapped_column(String(50), default="rule_based", nullable=False)
    classified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    shopper_session: Mapped["ShopperSession"] = relationship("ShopperSession")
    store: Mapped["Store"] = relationship("Store")
