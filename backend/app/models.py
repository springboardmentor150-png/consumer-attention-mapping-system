import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, DateTime, ForeignKey, Numeric, Integer,
    Float, Boolean, Text, JSON, text
)
from sqlalchemy.types import TypeDecorator, CHAR

class UUID(TypeDecorator):
    """Platform-independent GUID/UUID type.
    Uses PostgreSQL's UUID type when available, otherwise CHAR(36).
    Transparently converts between Python uuid.UUID and database strings.
    """
    impl = CHAR
    cache_ok = True

    def __init__(self, as_uuid=True, *args, **kwargs):
        self.as_uuid = as_uuid
        super().__init__(36, *args, **kwargs)

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import UUID as pg_UUID
            return dialect.type_descriptor(pg_UUID(as_uuid=self.as_uuid))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return str(value)
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        try:
            return uuid.UUID(str(value))
        except Exception:
            return value

from sqlalchemy.orm import relationship
from .database import Base


# ──────────────────────────────────────────
# USERS & AUTH
# ──────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # Admin, Store Manager, Retail Analyst, Marketing Manager
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.now)

    reports = relationship("Report", back_populates="generated_by_user")


# ──────────────────────────────────────────
# STORES, ZONES, SHELVES
# ──────────────────────────────────────────

class Store(Base):
    __tablename__ = "stores"

    store_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_name = Column(String(255), nullable=False)
    location = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    zones = relationship("StoreZone", back_populates="store", cascade="all, delete-orphan")
    shelves = relationship("Shelf", back_populates="store", cascade="all, delete-orphan")
    cameras = relationship("Camera", back_populates="store", cascade="all, delete-orphan")
    videos = relationship("Video", back_populates="store", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="store")
    alerts = relationship("Alert", back_populates="store")
    reports = relationship("Report", back_populates="store")


class StoreZone(Base):
    __tablename__ = "store_zones"

    zone_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    zone_name = Column(String(255), nullable=False)
    coordinates = Column(JSON, nullable=True)   # {"x1": 0, "y1": 0, "x2": 100, "y2": 100}
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    store = relationship("Store", back_populates="zones")
    shelves = relationship("Shelf", back_populates="zone")
    cameras = relationship("Camera", back_populates="zone")


class Shelf(Base):
    __tablename__ = "shelves"

    shelf_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("store_zones.zone_id", ondelete="SET NULL"), nullable=True)
    shelf_name = Column(String(255), nullable=False)
    category = Column(String(255), nullable=False)
    coordinates = Column(JSON, nullable=True)   # {"x1": 0, "y1": 0, "x2": 100, "y2": 100}
    layout = Column(JSON, nullable=True)        # shelf layout metadata
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    store = relationship("Store", back_populates="shelves")
    zone = relationship("StoreZone", back_populates="shelves")
    products = relationship("Product", back_populates="shelf", cascade="all, delete-orphan")
    cameras = relationship("Camera", back_populates="shelf")
    attention_events = relationship("AttentionEvent", back_populates="shelf")
    recommendations = relationship("Recommendation", back_populates="shelf")


# ──────────────────────────────────────────
# PRODUCTS
# ──────────────────────────────────────────

class Product(Base):
    __tablename__ = "products"

    product_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shelf_id = Column(UUID(as_uuid=True), ForeignKey("shelves.shelf_id", ondelete="CASCADE"), nullable=False)
    product_name = Column(String(255), nullable=False)
    category = Column(String(255), nullable=True)
    brand = Column(String(255), nullable=True)
    sku = Column(String(100), nullable=True, index=True)
    price = Column(Numeric(10, 2), nullable=True, default=0.0)
    image_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    shelf = relationship("Shelf", back_populates="products")
    attention_events = relationship("AttentionEvent", back_populates="product")
    interactions = relationship("ProductInteraction", back_populates="product")
    scores = relationship("ProductScore", back_populates="product")
    recommendations = relationship("Recommendation", back_populates="product")


# ──────────────────────────────────────────
# CAMERAS
# ──────────────────────────────────────────

class Camera(Base):
    __tablename__ = "cameras"

    camera_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("store_zones.zone_id", ondelete="SET NULL"), nullable=True)
    shelf_id = Column(UUID(as_uuid=True), ForeignKey("shelves.shelf_id", ondelete="SET NULL"), nullable=True)
    camera_name = Column(String(255), nullable=False)
    # SECURITY: stream_url stored in DB but NEVER exposed directly to frontend
    stream_url = Column(String(1000), nullable=True)
    ip_address = Column(String(500), nullable=True)   # kept for backward compat
    location = Column(String(500), nullable=True)
    status = Column(String(50), nullable=False, default="Active")  # Active, Inactive, Maintenance
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    store = relationship("Store", back_populates="cameras")
    zone = relationship("StoreZone", back_populates="cameras")
    shelf = relationship("Shelf", back_populates="cameras")
    videos = relationship("Video", back_populates="camera")
    alerts = relationship("Alert", back_populates="camera")


# ──────────────────────────────────────────
# VIDEOS & PROCESSING
# ──────────────────────────────────────────

class Video(Base):
    __tablename__ = "videos"

    video_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    camera_id = Column(UUID(as_uuid=True), ForeignKey("cameras.camera_id", ondelete="SET NULL"), nullable=True)
    filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    status = Column(String(50), nullable=False, default="uploaded")  # uploaded, queued, processing, completed, failed
    duration = Column(Float, nullable=True)    # seconds
    fps = Column(Float, nullable=True)
    frame_count = Column(Integer, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    store = relationship("Store", back_populates="videos")
    camera = relationship("Camera", back_populates="videos")
    processing_jobs = relationship("ProcessingJob", back_populates="video", cascade="all, delete-orphan")
    shopper_sessions = relationship("ShopperSession", back_populates="video", cascade="all, delete-orphan")


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    job_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.video_id", ondelete="CASCADE"), nullable=False)
    job_type = Column(String(100), nullable=False, default="full_analysis")
    status = Column(String(50), nullable=False, default="queued")  # queued, running, completed, failed
    progress = Column(Float, nullable=False, default=0.0)  # 0.0 - 100.0
    frames_processed = Column(Integer, nullable=True, default=0)
    total_frames = Column(Integer, nullable=True)
    shoppers_detected = Column(Integer, nullable=True, default=0)
    products_detected = Column(Integer, nullable=True, default=0)
    config = Column(JSON, nullable=True)       # job config (thresholds, etc.)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    video = relationship("Video", back_populates="processing_jobs")


# ──────────────────────────────────────────
# SHOPPER TRACKING
# ──────────────────────────────────────────

class ShopperSession(Base):
    """One session = one unique tracked person in one video."""
    __tablename__ = "shopper_sessions"

    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.video_id", ondelete="CASCADE"), nullable=False)
    tracker_id = Column(Integer, nullable=False)   # ByteTrack assigned ID (anonymous)
    shopper_code = Column(String(20), nullable=True)  # Unique person ID: SHP-001, SHP-002, ...
    entry_time = Column(Float, nullable=True)       # seconds from video start
    exit_time = Column(Float, nullable=True)
    total_dwell_time = Column(Float, nullable=True) # seconds
    zones_visited = Column(JSON, nullable=True)     # [{"zone_id": "...", "dwell": 12.5}, ...]
    movement_speed = Column(Float, nullable=True)   # pixels/second average
    behavior_segment = Column(String(100), nullable=True)   # AI segment label
    ai_insight = Column(String(500), nullable=True)         # Explainable AI narrative
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    video = relationship("Video", back_populates="shopper_sessions")
    tracking_points = relationship("TrackingPoint", back_populates="session", cascade="all, delete-orphan")
    attention_events = relationship("AttentionEvent", back_populates="session", cascade="all, delete-orphan")
    interactions = relationship("ProductInteraction", back_populates="session", cascade="all, delete-orphan")
    behavior = relationship("ConsumerBehavior", back_populates="session", uselist=False, cascade="all, delete-orphan")


class TrackingPoint(Base):
    """Bounding box position for a tracked shopper at a specific frame."""
    __tablename__ = "tracking_points"

    point_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("shopper_sessions.session_id", ondelete="CASCADE"), nullable=False)
    frame_number = Column(Integer, nullable=False)
    timestamp = Column(Float, nullable=False)       # seconds from video start
    x = Column(Float, nullable=False)               # center x (normalized 0-1)
    y = Column(Float, nullable=False)               # center y (normalized 0-1)
    width = Column(Float, nullable=False)           # bbox width (normalized)
    height = Column(Float, nullable=False)          # bbox height (normalized)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("store_zones.zone_id", ondelete="SET NULL"), nullable=True)
    confidence = Column(Float, nullable=True)

    session = relationship("ShopperSession", back_populates="tracking_points")


# ──────────────────────────────────────────
# ATTENTION & INTERACTIONS
# ──────────────────────────────────────────

class AttentionEvent(Base):
    """An estimated attention event: a shopper looking at a shelf/product."""
    __tablename__ = "attention_events"

    event_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("shopper_sessions.session_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.product_id", ondelete="SET NULL"), nullable=True)
    shelf_id = Column(UUID(as_uuid=True), ForeignKey("shelves.shelf_id", ondelete="SET NULL"), nullable=True)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("store_zones.zone_id", ondelete="SET NULL"), nullable=True)
    start_time = Column(Float, nullable=False)      # seconds from video start
    end_time = Column(Float, nullable=True)
    duration = Column(Float, nullable=True)         # seconds
    # attention_type: "shelf_view", "product_view", "product_focus"
    attention_type = Column(String(50), nullable=False, default="shelf_view")
    confidence = Column(Float, nullable=True)
    # Note: This is ESTIMATED attention via head-pose, NOT true eye-tracking
    is_estimated = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    session = relationship("ShopperSession", back_populates="attention_events")
    product = relationship("Product", back_populates="attention_events")
    shelf = relationship("Shelf", back_populates="attention_events")


class ProductInteraction(Base):
    """Estimated product interaction events."""
    __tablename__ = "product_interactions"

    interaction_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("shopper_sessions.session_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.product_id", ondelete="SET NULL"), nullable=True)
    # interaction_type: viewed, approached, picked_up, returned, compared
    # NOTE: "purchased" only set when actual POS data is provided
    interaction_type = Column(String(50), nullable=False)
    timestamp = Column(Float, nullable=False)       # seconds from video start
    confidence = Column(Float, nullable=True)
    is_experimental = Column(Boolean, default=False)  # True for pickup/return (lower confidence)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    session = relationship("ShopperSession", back_populates="interactions")
    product = relationship("Product", back_populates="interactions")


# ──────────────────────────────────────────
# BEHAVIOR ANALYTICS
# ──────────────────────────────────────────

class ConsumerBehavior(Base):
    """Aggregated behavior analysis for a shopper session."""
    __tablename__ = "consumer_behavior"

    behavior_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("shopper_sessions.session_id", ondelete="CASCADE"), nullable=False, unique=True)
    # Segment: Explorer, Quick Buyer, Comparison Shopper, Impulse Buyer, Brand Loyal Customer
    segment = Column(String(100), nullable=True)
    segment_reason = Column(Text, nullable=True)        # Explainability
    zones_visited_count = Column(Integer, nullable=True, default=0)
    products_viewed_count = Column(Integer, nullable=True, default=0)
    interactions_count = Column(Integer, nullable=True, default=0)
    total_dwell_time = Column(Float, nullable=True)
    movement_speed = Column(Float, nullable=True)
    repeat_visits = Column(Integer, nullable=True, default=0)
    comparison_behavior = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    session = relationship("ShopperSession", back_populates="behavior")


# ──────────────────────────────────────────
# PRODUCT SCORES
# ──────────────────────────────────────────

class ProductScore(Base):
    """
    Product Attractiveness Score using weighted formula:
    Score = 0.35*attention + 0.25*interaction + 0.20*pickup + 0.15*conversion + 0.05*repeat
    If purchase data unavailable, conversion component is excluded (partial score).
    """
    __tablename__ = "product_scores"

    score_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False)
    attention_score = Column(Float, nullable=True)       # 0-1 normalized
    interaction_score = Column(Float, nullable=True)
    pickup_score = Column(Float, nullable=True)
    conversion_score = Column(Float, nullable=True)      # None if no POS data
    repeat_engagement_score = Column(Float, nullable=True)
    attractiveness_score = Column(Float, nullable=True)  # final weighted score
    is_partial = Column(Boolean, default=False)          # True if no purchase data
    calculation_notes = Column(Text, nullable=True)
    calculated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    product = relationship("Product", back_populates="scores")


# ──────────────────────────────────────────
# RECOMMENDATIONS
# ──────────────────────────────────────────

class Recommendation(Base):
    __tablename__ = "recommendations"

    recommendation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.product_id", ondelete="SET NULL"), nullable=True)
    shelf_id = Column(UUID(as_uuid=True), ForeignKey("shelves.shelf_id", ondelete="SET NULL"), nullable=True)
    recommendation_type = Column(String(100), nullable=False)  # relocate_product, improve_visibility, etc.
    recommendation_text = Column(Text, nullable=False)
    reason = Column(Text, nullable=True)
    supporting_metric = Column(String(500), nullable=True)
    confidence = Column(Float, nullable=True)             # 0-1
    expected_impact = Column(String(500), nullable=True)
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    store = relationship("Store", back_populates="recommendations")
    product = relationship("Product", back_populates="recommendations")
    shelf = relationship("Shelf", back_populates="recommendations")


# ──────────────────────────────────────────
# ALERTS
# ──────────────────────────────────────────

class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    camera_id = Column(UUID(as_uuid=True), ForeignKey("cameras.camera_id", ondelete="SET NULL"), nullable=True)
    alert_type = Column(String(100), nullable=False)    # traffic_anomaly, low_attention, camera_failure, etc.
    message = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False, default="info")  # info, warning, critical
    status = Column(String(20), nullable=False, default="active")  # active, acknowledged, resolved
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)

    store = relationship("Store", back_populates="alerts")
    camera = relationship("Camera", back_populates="alerts")


# ──────────────────────────────────────────
# REPORTS
# ──────────────────────────────────────────

class Report(Base):
    __tablename__ = "reports"

    report_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=True)
    generated_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    report_type = Column(String(100), nullable=False)    # consumer_attention, product_engagement, etc.
    report_format = Column(String(20), nullable=False)   # pdf, excel, csv
    file_path = Column(String(1000), nullable=True)
    status = Column(String(50), nullable=False, default="generating")
    parameters = Column(JSON, nullable=True)             # date range, filters, etc.
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    store = relationship("Store", back_populates="reports")
    generated_by_user = relationship("User", back_populates="reports")
