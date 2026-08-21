from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any


# ──────────────────────────────────────────
# USER SCHEMAS
# ──────────────────────────────────────────

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = Field(..., description="Admin | Store Manager | Retail Analyst | Marketing Manager")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


# ──────────────────────────────────────────
# STORE SCHEMAS
# ──────────────────────────────────────────

class StoreBase(BaseModel):
    store_name: str
    location: str
    description: Optional[str] = None

class StoreCreate(StoreBase):
    pass

class StoreUpdate(BaseModel):
    store_name: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None

class StoreZoneBase(BaseModel):
    zone_name: str
    coordinates: Optional[Dict[str, float]] = None
    description: Optional[str] = None

class StoreZoneCreate(StoreZoneBase):
    pass

class StoreZoneUpdate(BaseModel):
    zone_name: Optional[str] = None
    coordinates: Optional[Dict[str, float]] = None
    description: Optional[str] = None

class StoreZoneResponse(StoreZoneBase):
    zone_id: UUID
    store_id: UUID
    created_at: datetime
    class Config:
        from_attributes = True

class StoreResponse(StoreBase):
    store_id: UUID
    created_at: datetime
    zones: List[StoreZoneResponse] = []
    class Config:
        from_attributes = True


# ──────────────────────────────────────────
# SHELF SCHEMAS
# ──────────────────────────────────────────

class ProductBase(BaseModel):
    product_name: str
    category: Optional[str] = None
    brand: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[float] = Field(default=0.0, ge=0.0)
    image_path: Optional[str] = None

class ProductCreate(ProductBase):
    shelf_id: UUID

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[float] = None
    image_path: Optional[str] = None
    shelf_id: Optional[UUID] = None

class ProductResponse(ProductBase):
    product_id: UUID
    shelf_id: UUID
    created_at: datetime
    class Config:
        from_attributes = True

class ShelfBase(BaseModel):
    shelf_name: str
    category: str
    zone_id: Optional[UUID] = None
    coordinates: Optional[Dict[str, float]] = None
    layout: Optional[Dict[str, Any]] = None

class ShelfCreate(ShelfBase):
    store_id: UUID

class ShelfUpdate(BaseModel):
    shelf_name: Optional[str] = None
    category: Optional[str] = None
    zone_id: Optional[UUID] = None
    coordinates: Optional[Dict[str, float]] = None
    layout: Optional[Dict[str, Any]] = None

class ShelfResponse(ShelfBase):
    shelf_id: UUID
    store_id: UUID
    created_at: datetime
    products: List[ProductResponse] = []
    class Config:
        from_attributes = True


# ──────────────────────────────────────────
# CAMERA SCHEMAS
# ──────────────────────────────────────────

class CameraBase(BaseModel):
    camera_name: str
    location: Optional[str] = None
    status: str = "Active"

class CameraCreate(CameraBase):
    store_id: UUID
    zone_id: Optional[UUID] = None
    shelf_id: Optional[UUID] = None
    stream_url: Optional[str] = None
    ip_address: Optional[str] = None

class CameraUpdate(BaseModel):
    camera_name: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    zone_id: Optional[UUID] = None
    shelf_id: Optional[UUID] = None
    stream_url: Optional[str] = None
    ip_address: Optional[str] = None

class CameraResponse(CameraBase):
    camera_id: UUID
    store_id: UUID
    zone_id: Optional[UUID] = None
    shelf_id: Optional[UUID] = None
    # NOTE: stream_url is intentionally excluded from response for security
    created_at: datetime
    class Config:
        from_attributes = True


# ──────────────────────────────────────────
# VIDEO SCHEMAS
# ──────────────────────────────────────────

class VideoResponse(BaseModel):
    video_id: UUID
    store_id: UUID
    camera_id: Optional[UUID] = None
    filename: str
    status: str
    duration: Optional[float] = None
    fps: Optional[float] = None
    frame_count: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    uploaded_at: datetime
    class Config:
        from_attributes = True

class ProcessingJobCreate(BaseModel):
    video_id: UUID
    job_type: str = "full_analysis"
    config: Optional[Dict[str, Any]] = None

class ProcessingJobResponse(BaseModel):
    job_id: UUID
    video_id: UUID
    job_type: str
    status: str
    progress: float
    frames_processed: Optional[int] = None
    total_frames: Optional[int] = None
    shoppers_detected: Optional[int] = None
    products_detected: Optional[int] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True


# ──────────────────────────────────────────
# TRACKING SCHEMAS
# ──────────────────────────────────────────

class TrackingPointResponse(BaseModel):
    point_id: UUID
    session_id: UUID
    frame_number: int
    timestamp: float
    x: float
    y: float
    width: float
    height: float
    zone_id: Optional[UUID] = None
    confidence: Optional[float] = None
    class Config:
        from_attributes = True

class ShopperSessionResponse(BaseModel):
    session_id: UUID
    video_id: UUID
    tracker_id: int
    shopper_id: Optional[str] = None
    entry_time: Optional[float] = None
    exit_time: Optional[float] = None
    total_dwell_time: Optional[float] = None
    zones_visited: Optional[List[Dict[str, Any]]] = None
    movement_speed: Optional[float] = None
    behavior_segment: Optional[str] = None
    ai_insight: Optional[str] = None
    conversion_probability: Optional[float] = None
    created_at: datetime
    class Config:
        from_attributes = True

class ShopperPathResponse(BaseModel):
    session_id: UUID
    tracker_id: int
    path: List[TrackingPointResponse]


# ──────────────────────────────────────────
# ATTENTION SCHEMAS
# ──────────────────────────────────────────

class AttentionEventResponse(BaseModel):
    event_id: UUID
    session_id: UUID
    product_id: Optional[UUID] = None
    shelf_id: Optional[UUID] = None
    zone_id: Optional[UUID] = None
    start_time: float
    end_time: Optional[float] = None
    duration: Optional[float] = None
    attention_type: str
    confidence: Optional[float] = None
    is_estimated: bool
    class Config:
        from_attributes = True

class AttentionSummary(BaseModel):
    total_attention_events: int
    avg_attention_duration: float
    top_shelf_id: Optional[str] = None
    top_product_id: Optional[str] = None
    total_unique_shoppers: int
    disclaimer: str = "Attention estimates are based on head-pose estimation, not true eye-tracking"

class HeatmapData(BaseModel):
    store_id: str
    heatmap_type: str        # traffic | attention | product | zone
    grid: List[List[float]]  # 2D grid of intensity values (0-1)
    width: int
    height: int
    max_value: float
    generated_at: str


# ──────────────────────────────────────────
# ANALYTICS SCHEMAS
# ──────────────────────────────────────────

class ZoneTrafficStat(BaseModel):
    zone_id: str
    zone_name: str
    visitor_count: int
    avg_dwell_time: float
    peak_hour: Optional[int] = None

class TrafficSummary(BaseModel):
    store_id: str
    total_visitors: int
    avg_dwell_time: float
    zone_traffic: List[ZoneTrafficStat]
    period: str

class ProductEngagement(BaseModel):
    product_id: str
    product_name: str
    views: int
    interactions: int
    avg_attention_duration: float
    attention_score: Optional[float] = None

class BehaviorSummary(BaseModel):
    segment_distribution: Dict[str, int]
    total_sessions: int
    avg_dwell_time: float
    top_segment: Optional[str] = None


# ──────────────────────────────────────────
# PRODUCT SCORE SCHEMAS
# ──────────────────────────────────────────

class ProductScoreResponse(BaseModel):
    score_id: UUID
    product_id: UUID
    attention_score: Optional[float] = None
    interaction_score: Optional[float] = None
    pickup_score: Optional[float] = None
    conversion_score: Optional[float] = None
    repeat_engagement_score: Optional[float] = None
    attractiveness_score: Optional[float] = None
    is_partial: bool
    calculation_notes: Optional[str] = None
    calculated_at: datetime
    class Config:
        from_attributes = True


# ──────────────────────────────────────────
# RECOMMENDATION SCHEMAS
# ──────────────────────────────────────────

class RecommendationResponse(BaseModel):
    recommendation_id: UUID
    store_id: UUID
    product_id: Optional[UUID] = None
    shelf_id: Optional[UUID] = None
    recommendation_type: str
    recommendation_text: str
    reason: Optional[str] = None
    supporting_metric: Optional[str] = None
    confidence: Optional[float] = None
    expected_impact: Optional[str] = None
    is_dismissed: bool
    created_at: datetime
    class Config:
        from_attributes = True


# ──────────────────────────────────────────
# ALERT SCHEMAS
# ──────────────────────────────────────────

class AlertCreate(BaseModel):
    store_id: UUID
    camera_id: Optional[UUID] = None
    alert_type: str
    message: str
    severity: str = "info"

class AlertResponse(BaseModel):
    alert_id: UUID
    store_id: UUID
    camera_id: Optional[UUID] = None
    alert_type: str
    message: str
    severity: str
    status: str
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    class Config:
        from_attributes = True


# ──────────────────────────────────────────
# REPORT SCHEMAS
# ──────────────────────────────────────────

class ReportGenerateRequest(BaseModel):
    store_id: Optional[UUID] = None
    report_type: str  # consumer_attention, product_engagement, shelf_performance, behavior, conversion, marketing
    report_format: str = "pdf"  # pdf, excel, csv
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class ReportResponse(BaseModel):
    report_id: UUID
    store_id: Optional[UUID] = None
    report_type: str
    report_format: str
    status: str
    file_path: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True


# ──────────────────────────────────────────
# CONSUMER BEHAVIOR SCHEMAS
# ──────────────────────────────────────────

class ConsumerBehaviorResponse(BaseModel):
    behavior_id: UUID
    session_id: UUID
    segment: Optional[str] = None
    segment_reason: Optional[str] = None
    zones_visited_count: Optional[int] = None
    products_viewed_count: Optional[int] = None
    interactions_count: Optional[int] = None
    total_dwell_time: Optional[float] = None
    movement_speed: Optional[float] = None
    repeat_visits: Optional[int] = None
    comparison_behavior: Optional[bool] = None
    created_at: datetime
    class Config:
        from_attributes = True


# ──────────────────────────────────────────
# PRODUCT INTERACTION SCHEMAS
# ──────────────────────────────────────────

class ProductInteractionResponse(BaseModel):
    interaction_id: UUID
    session_id: UUID
    product_id: Optional[UUID] = None
    interaction_type: str
    timestamp: float
    confidence: Optional[float] = None
    is_experimental: bool
    notes: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True


# ──────────────────────────────────────────
# SYSTEM HEALTH SCHEMA
# ──────────────────────────────────────────

class SystemHealth(BaseModel):
    status: str
    database: str
    ml_models_loaded: bool
    active_jobs: int
    total_videos: int
    total_sessions: int
    cpu_percent: Optional[float] = None
    memory_percent: Optional[float] = None
    disk_percent: Optional[float] = None
