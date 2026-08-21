"""Initial schema — all 14+ tables for Consumer Attention Mapping System

Revision ID: 001_initial_schema
Revises: None
Create Date: 2026-08-16
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Users ──
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("is_active", sa.Boolean, default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── Stores ──
    op.create_table(
        "stores",
        sa.Column("store_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("store_name", sa.String(255), nullable=False),
        sa.Column("location", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── Store Zones ──
    op.create_table(
        "store_zones",
        sa.Column("zone_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("store_id", UUID(as_uuid=True), sa.ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False),
        sa.Column("zone_name", sa.String(255), nullable=False),
        sa.Column("coordinates", sa.JSON, nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── Shelves ──
    op.create_table(
        "shelves",
        sa.Column("shelf_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("store_id", UUID(as_uuid=True), sa.ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False),
        sa.Column("zone_id", UUID(as_uuid=True), sa.ForeignKey("store_zones.zone_id", ondelete="SET NULL"), nullable=True),
        sa.Column("shelf_name", sa.String(255), nullable=False),
        sa.Column("category", sa.String(255), nullable=False),
        sa.Column("coordinates", sa.JSON, nullable=True),
        sa.Column("layout", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── Products ──
    op.create_table(
        "products",
        sa.Column("product_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("shelf_id", UUID(as_uuid=True), sa.ForeignKey("shelves.shelf_id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_name", sa.String(255), nullable=False),
        sa.Column("category", sa.String(255), nullable=True),
        sa.Column("brand", sa.String(255), nullable=True),
        sa.Column("sku", sa.String(100), nullable=True, index=True),
        sa.Column("price", sa.Numeric(10, 2), nullable=True),
        sa.Column("image_path", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── Cameras ──
    op.create_table(
        "cameras",
        sa.Column("camera_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("store_id", UUID(as_uuid=True), sa.ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False),
        sa.Column("zone_id", UUID(as_uuid=True), sa.ForeignKey("store_zones.zone_id", ondelete="SET NULL"), nullable=True),
        sa.Column("shelf_id", UUID(as_uuid=True), sa.ForeignKey("shelves.shelf_id", ondelete="SET NULL"), nullable=True),
        sa.Column("camera_name", sa.String(255), nullable=False),
        sa.Column("stream_url", sa.String(1000), nullable=True),
        sa.Column("ip_address", sa.String(500), nullable=True),
        sa.Column("location", sa.String(500), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="Active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── Videos ──
    op.create_table(
        "videos",
        sa.Column("video_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("store_id", UUID(as_uuid=True), sa.ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False),
        sa.Column("camera_id", UUID(as_uuid=True), sa.ForeignKey("cameras.camera_id", ondelete="SET NULL"), nullable=True),
        sa.Column("filename", sa.String(500), nullable=False),
        sa.Column("file_path", sa.String(1000), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="uploaded"),
        sa.Column("duration", sa.Float, nullable=True),
        sa.Column("fps", sa.Float, nullable=True),
        sa.Column("frame_count", sa.Integer, nullable=True),
        sa.Column("width", sa.Integer, nullable=True),
        sa.Column("height", sa.Integer, nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── Processing Jobs ──
    op.create_table(
        "processing_jobs",
        sa.Column("job_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("video_id", UUID(as_uuid=True), sa.ForeignKey("videos.video_id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_type", sa.String(100), nullable=False, server_default="full_analysis"),
        sa.Column("status", sa.String(50), nullable=False, server_default="queued"),
        sa.Column("progress", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("frames_processed", sa.Integer, nullable=True),
        sa.Column("total_frames", sa.Integer, nullable=True),
        sa.Column("shoppers_detected", sa.Integer, nullable=True),
        sa.Column("products_detected", sa.Integer, nullable=True),
        sa.Column("config", sa.JSON, nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── Shopper Sessions ──
    op.create_table(
        "shopper_sessions",
        sa.Column("session_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("video_id", UUID(as_uuid=True), sa.ForeignKey("videos.video_id", ondelete="CASCADE"), nullable=False),
        sa.Column("tracker_id", sa.Integer, nullable=False),
        sa.Column("entry_time", sa.Float, nullable=True),
        sa.Column("exit_time", sa.Float, nullable=True),
        sa.Column("total_dwell_time", sa.Float, nullable=True),
        sa.Column("zones_visited", sa.JSON, nullable=True),
        sa.Column("movement_speed", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── Tracking Points ──
    op.create_table(
        "tracking_points",
        sa.Column("point_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", UUID(as_uuid=True), sa.ForeignKey("shopper_sessions.session_id", ondelete="CASCADE"), nullable=False),
        sa.Column("frame_number", sa.Integer, nullable=False),
        sa.Column("timestamp", sa.Float, nullable=False),
        sa.Column("x", sa.Float, nullable=False),
        sa.Column("y", sa.Float, nullable=False),
        sa.Column("width", sa.Float, nullable=False),
        sa.Column("height", sa.Float, nullable=False),
        sa.Column("zone_id", UUID(as_uuid=True), sa.ForeignKey("store_zones.zone_id", ondelete="SET NULL"), nullable=True),
        sa.Column("confidence", sa.Float, nullable=True),
    )

    # ── Attention Events ──
    op.create_table(
        "attention_events",
        sa.Column("event_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", UUID(as_uuid=True), sa.ForeignKey("shopper_sessions.session_id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", UUID(as_uuid=True), sa.ForeignKey("products.product_id", ondelete="SET NULL"), nullable=True),
        sa.Column("shelf_id", UUID(as_uuid=True), sa.ForeignKey("shelves.shelf_id", ondelete="SET NULL"), nullable=True),
        sa.Column("zone_id", UUID(as_uuid=True), sa.ForeignKey("store_zones.zone_id", ondelete="SET NULL"), nullable=True),
        sa.Column("start_time", sa.Float, nullable=False),
        sa.Column("end_time", sa.Float, nullable=True),
        sa.Column("duration", sa.Float, nullable=True),
        sa.Column("attention_type", sa.String(50), nullable=False, server_default="shelf_view"),
        sa.Column("confidence", sa.Float, nullable=True),
        sa.Column("is_estimated", sa.Boolean, default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── Product Interactions ──
    op.create_table(
        "product_interactions",
        sa.Column("interaction_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", UUID(as_uuid=True), sa.ForeignKey("shopper_sessions.session_id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", UUID(as_uuid=True), sa.ForeignKey("products.product_id", ondelete="SET NULL"), nullable=True),
        sa.Column("interaction_type", sa.String(50), nullable=False),
        sa.Column("timestamp", sa.Float, nullable=False),
        sa.Column("confidence", sa.Float, nullable=True),
        sa.Column("is_experimental", sa.Boolean, default=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── Consumer Behavior ──
    op.create_table(
        "consumer_behavior",
        sa.Column("behavior_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", UUID(as_uuid=True), sa.ForeignKey("shopper_sessions.session_id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("segment", sa.String(100), nullable=True),
        sa.Column("segment_reason", sa.Text, nullable=True),
        sa.Column("zones_visited_count", sa.Integer, nullable=True),
        sa.Column("products_viewed_count", sa.Integer, nullable=True),
        sa.Column("interactions_count", sa.Integer, nullable=True),
        sa.Column("total_dwell_time", sa.Float, nullable=True),
        sa.Column("movement_speed", sa.Float, nullable=True),
        sa.Column("repeat_visits", sa.Integer, nullable=True),
        sa.Column("comparison_behavior", sa.Boolean, default=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── Product Scores ──
    op.create_table(
        "product_scores",
        sa.Column("score_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("product_id", UUID(as_uuid=True), sa.ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False),
        sa.Column("attention_score", sa.Float, nullable=True),
        sa.Column("interaction_score", sa.Float, nullable=True),
        sa.Column("pickup_score", sa.Float, nullable=True),
        sa.Column("conversion_score", sa.Float, nullable=True),
        sa.Column("repeat_engagement_score", sa.Float, nullable=True),
        sa.Column("attractiveness_score", sa.Float, nullable=True),
        sa.Column("is_partial", sa.Boolean, default=False),
        sa.Column("calculation_notes", sa.Text, nullable=True),
        sa.Column("calculated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── Recommendations ──
    op.create_table(
        "recommendations",
        sa.Column("recommendation_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("store_id", UUID(as_uuid=True), sa.ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", UUID(as_uuid=True), sa.ForeignKey("products.product_id", ondelete="SET NULL"), nullable=True),
        sa.Column("shelf_id", UUID(as_uuid=True), sa.ForeignKey("shelves.shelf_id", ondelete="SET NULL"), nullable=True),
        sa.Column("recommendation_type", sa.String(100), nullable=False),
        sa.Column("recommendation_text", sa.Text, nullable=False),
        sa.Column("reason", sa.Text, nullable=True),
        sa.Column("supporting_metric", sa.String(500), nullable=True),
        sa.Column("confidence", sa.Float, nullable=True),
        sa.Column("expected_impact", sa.String(500), nullable=True),
        sa.Column("is_dismissed", sa.Boolean, default=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ── Alerts ──
    op.create_table(
        "alerts",
        sa.Column("alert_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("store_id", UUID(as_uuid=True), sa.ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False),
        sa.Column("camera_id", UUID(as_uuid=True), sa.ForeignKey("cameras.camera_id", ondelete="SET NULL"), nullable=True),
        sa.Column("alert_type", sa.String(100), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("severity", sa.String(20), nullable=False, server_default="info"),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── Reports ──
    op.create_table(
        "reports",
        sa.Column("report_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("store_id", UUID(as_uuid=True), sa.ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=True),
        sa.Column("generated_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("report_type", sa.String(100), nullable=False),
        sa.Column("report_format", sa.String(20), nullable=False),
        sa.Column("file_path", sa.String(1000), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="generating"),
        sa.Column("parameters", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("reports")
    op.drop_table("alerts")
    op.drop_table("recommendations")
    op.drop_table("product_scores")
    op.drop_table("consumer_behavior")
    op.drop_table("product_interactions")
    op.drop_table("attention_events")
    op.drop_table("tracking_points")
    op.drop_table("shopper_sessions")
    op.drop_table("processing_jobs")
    op.drop_table("videos")
    op.drop_table("cameras")
    op.drop_table("products")
    op.drop_table("shelves")
    op.drop_table("store_zones")
    op.drop_table("stores")
    op.drop_table("users")
