import enum
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Enum, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.postgres import Base

class CameraStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    maintenance = "maintenance"
    error = "error"

class Camera(Base):
    __tablename__ = "cameras"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    store_id: Mapped[str] = mapped_column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    zone_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("store_zones.id", ondelete="SET NULL"), nullable=True)
    shelf_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("shelves.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    camera_type: Mapped[str] = mapped_column(String(100), nullable=False)
    rtsp_url: Mapped[str] = mapped_column(String(500), nullable=False)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    location_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    mount_height_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    field_of_view_degrees: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    resolution: Mapped[str] = mapped_column(String(50), nullable=False)
    fps: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    status: Mapped[CameraStatus] = mapped_column(Enum(CameraStatus), nullable=False, default=CameraStatus.inactive)
    last_heartbeat: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    store: Mapped["Store"] = relationship("Store", back_populates="cameras")
    zone: Mapped[Optional["StoreZone"]] = relationship("StoreZone", back_populates="cameras")
    shelf: Mapped[Optional["Shelf"]] = relationship("Shelf", back_populates="cameras")
