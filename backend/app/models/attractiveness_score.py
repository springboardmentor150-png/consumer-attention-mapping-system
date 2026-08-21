import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.postgres import Base

class ProductAttractivenessScore(Base):
    __tablename__ = "product_attractiveness_scores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    store_id: Mapped[str] = mapped_column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    shelf_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("shelves.id", ondelete="SET NULL"), nullable=True)
    attention_duration_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    interaction_frequency_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    pickup_rate_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    conversion_rate_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    repeat_engagement_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    composite_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    grade: Mapped[Optional[str]] = mapped_column(String(2), nullable=True)
    total_viewers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_interactions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_pickups: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_purchases: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    product: Mapped["Product"] = relationship("Product")
    store: Mapped["Store"] = relationship("Store")
    shelf: Mapped[Optional["Shelf"]] = relationship("Shelf")
