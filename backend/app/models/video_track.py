from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class VideoRecord(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, default=1, index=True)
    camera_id = Column(String, default="CAM-01", index=True)
    video_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    processed_path = Column(String, nullable=True)
    resolution_w = Column(Integer, default=1280)
    resolution_h = Column(Integer, default=720)
    fps = Column(Float, default=30.0)
    duration_seconds = Column(Float, default=0.0)
    total_frames = Column(Integer, default=0)
    unique_tracks_count = Column(Integer, default=0)
    status = Column(String, default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED
    created_at = Column(DateTime, default=datetime.utcnow)

    tracks = relationship("PersonTrack", back_populates="video", cascade="all, delete-orphan")
    points = relationship("TrackingPoint", back_populates="video", cascade="all, delete-orphan")


class PersonTrack(Base):
    __tablename__ = "person_tracks"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True)
    track_id = Column(Integer, nullable=False, index=True)
    first_seen_frame = Column(Integer, default=0)
    last_seen_frame = Column(Integer, default=0)
    first_seen_time = Column(Float, default=0.0)
    last_seen_time = Column(Float, default=0.0)
    total_frames = Column(Integer, default=0)
    dwell_seconds = Column(Float, default=0.0)

    video = relationship("VideoRecord", back_populates="tracks")


class TrackingPoint(Base):
    __tablename__ = "tracking_points"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True)
    track_id = Column(Integer, nullable=False, index=True)
    frame_number = Column(Integer, nullable=False, index=True)
    timestamp_sec = Column(Float, default=0.0)
    x = Column(Float, nullable=False)  # center x
    y = Column(Float, nullable=False)  # center y
    box_x1 = Column(Integer, nullable=False)
    box_y1 = Column(Integer, nullable=False)
    box_x2 = Column(Integer, nullable=False)
    box_y2 = Column(Integer, nullable=False)
    confidence = Column(Float, default=0.0)

    video = relationship("VideoRecord", back_populates="points")
