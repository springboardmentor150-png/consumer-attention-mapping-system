import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.postgres import Base

class ShopperSession(Base):
    __tablename__ = "shopper_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    store_id: Mapped[str] = mapped_column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    camera_id: Mapped[str] = mapped_column(String(36), ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False)
    anonymous_id: Mapped[str] = mapped_column(String(100), nullable=False)
    entry_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    exit_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_dwell_time_seconds: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    path_data: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    zones_visited: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    consumer_segment: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    store: Mapped["Store"] = relationship("Store")
    camera: Mapped["Camera"] = relationship("Camera")
