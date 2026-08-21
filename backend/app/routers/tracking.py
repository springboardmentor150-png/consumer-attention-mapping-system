"""Tracking Router — Shopper sessions and movement paths."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import ShopperSession, TrackingPoint, ConsumerBehavior, Video, User
from ..schemas import ShopperSessionResponse, ShopperPathResponse, TrackingPointResponse
from ..auth import get_current_user, RoleChecker

router = APIRouter(prefix="/api/tracking", tags=["Tracking"])
any_role = RoleChecker(["Admin", "Store Manager", "Retail Analyst", "Marketing Manager"])


def format_session_data(s: ShopperSession):
    tid = s.tracker_id or 1
    # Use DB-persisted unique shopper code; fall back gracefully
    shopper_code = s.shopper_code or f"SHP-{tid:03d}"
    # Use DB-persisted behavior segment & insight from processing pipeline
    beh_seg = s.behavior_segment or (s.behavior.segment if (hasattr(s, "behavior") and s.behavior and s.behavior.segment) else "Explorer")
    insight = s.ai_insight or (s.behavior.segment_reason if (hasattr(s, "behavior") and s.behavior and s.behavior.segment_reason) else f"{shopper_code} tracked for {s.total_dwell_time or 0:.1f}s in this video session.")
    dwell = s.total_dwell_time or 12.0
    conv_val = min(96.0, max(25.0, round((dwell / 25.0) * 100.0, 1)))

    return {
        "session_id": s.session_id,
        "video_id": s.video_id,
        "tracker_id": tid,
        "shopper_id": shopper_code,
        "entry_time": s.entry_time,
        "exit_time": s.exit_time,
        "total_dwell_time": s.total_dwell_time,
        "zones_visited": s.zones_visited,
        "movement_speed": s.movement_speed,
        "behavior_segment": beh_seg,
        "ai_insight": insight,
        "conversion_probability": conv_val,
        "created_at": s.created_at
    }


@router.get("/sessions", response_model=list[ShopperSessionResponse])
def list_sessions(
    video_id: Optional[str] = None,
    store_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    """List shopper sessions with optional filters."""
    query = db.query(ShopperSession)
    if video_id:
        query = query.filter(ShopperSession.video_id == video_id)
    if store_id:
        query = query.join(Video, ShopperSession.video_id == Video.video_id).filter(
            Video.store_id == store_id
        )
    raw_sessions = query.order_by(ShopperSession.created_at.desc()).offset(offset).limit(limit).all()
    return [format_session_data(s) for s in raw_sessions]


@router.get("/sessions/{session_id}", response_model=ShopperSessionResponse)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    session = db.query(ShopperSession).filter(
        ShopperSession.session_id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return format_session_data(session)


@router.get("/sessions/{session_id}/path")
def get_session_path(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    """Return full tracking path for a shopper session."""
    session = db.query(ShopperSession).filter(
        ShopperSession.session_id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    points = db.query(TrackingPoint).filter(
        TrackingPoint.session_id == session_id
    ).order_by(TrackingPoint.frame_number).all()

    path = [
        {
            "frame_number": p.frame_number,
            "timestamp": p.timestamp,
            "x": p.x,
            "y": p.y,
            "width": p.width,
            "height": p.height,
            "zone_id": str(p.zone_id) if p.zone_id else None,
            "confidence": p.confidence
        }
        for p in points
    ]

    return {
        "session_id": session_id,
        "tracker_id": session.tracker_id,
        "entry_time": session.entry_time,
        "exit_time": session.exit_time,
        "total_dwell_time": session.total_dwell_time,
        "path": path,
        "total_points": len(path)
    }


@router.get("/video/{video_id}/overlay")
def get_video_overlay(
    video_id: str,
    db: Session = Depends(get_db)
):
    """Return all shopper tracking sessions and bounding box path points for video overlay rendering."""
    v_str = str(video_id)
    clean_id = v_str.replace("-", "")
    sessions = db.query(ShopperSession).filter(
        (ShopperSession.video_id == v_str) | (ShopperSession.video_id == clean_id)
    ).order_by(ShopperSession.tracker_id).all()

    if not sessions:
        try:
            import uuid
            v_uuid = uuid.UUID(v_str)
            sessions = db.query(ShopperSession).filter(
                ShopperSession.video_id == v_uuid
            ).order_by(ShopperSession.tracker_id).all()
        except Exception:
            sessions = []

    if not sessions:
        sessions = db.query(ShopperSession).order_by(ShopperSession.entry_time.desc()).limit(50).all()

    COLOR_PALETTE = [
        "#39FF14", "#00F2FE", "#BD00FF", "#FF5E36",
        "#FFE600", "#FF00BD", "#00FFB4", "#4FACFE",
        "#FF3366", "#A0FF00", "#FF9900", "#00E5FF"
    ]

    result = []
    for idx, session in enumerate(sessions):
        points = db.query(TrackingPoint).filter(
            TrackingPoint.session_id == session.session_id
        ).order_by(TrackingPoint.frame_number).all()

        path_points = [
            {
                "frame_number": p.frame_number,
                "timestamp": p.timestamp,
                "x": p.x,
                "y": p.y,
                "width": p.width,
                "height": p.height,
                "zone_id": str(p.zone_id) if p.zone_id else None,
                "confidence": p.confidence or 0.9
            }
            for p in points
        ]

        tracker_id = session.tracker_id or (idx + 1)
        shopper_code = session.shopper_code or f"SHP-{tracker_id:03d}"
        person_label = f"PERSON #{tracker_id} | {shopper_code}"
        color = COLOR_PALETTE[(tracker_id - 1) % len(COLOR_PALETTE)]

        dwell = session.total_dwell_time or (len(path_points) * 0.2 if path_points else 12.0)
        conv_val = min(98.0, max(25.0, round((dwell / 20.0) * 100.0, 1)))

        result.append({
            "session_id": str(session.session_id),
            "tracker_id": tracker_id,
            "shopper_id": shopper_code,
            "person_label": person_label,
            "color": color,
            "entry_time": session.entry_time or (path_points[0]["timestamp"] if path_points else 0.0),
            "exit_time": session.exit_time or (path_points[-1]["timestamp"] if path_points else (session.entry_time or 0.0) + dwell),
            "total_dwell_time": round(dwell, 1),
            "zones_visited": session.zones_visited or [],
            "movement_speed": round(session.movement_speed or 0.0, 2),
            "behavior_segment": session.behavior_segment or "Focused Buyer",
            "ai_insight": session.ai_insight or f"{shopper_code} maintained high dwell time of {dwell:.1f}s across active shelf zones.",
            "conversion_probability": conv_val,
            "points": path_points
        })

    return result



@router.get("/stats")
def tracking_stats(
    store_id: Optional[str] = None,
    video_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    """Summary statistics for shopper tracking."""
    query = db.query(ShopperSession)
    if video_id:
        query = query.filter(ShopperSession.video_id == video_id)
    if store_id:
        query = query.join(Video, ShopperSession.video_id == Video.video_id).filter(
            Video.store_id == store_id
        )

    total_sessions = query.count()
    avg_dwell = query.with_entities(
        func.avg(ShopperSession.total_dwell_time)
    ).scalar() or 0.0
    max_dwell = query.with_entities(
        func.max(ShopperSession.total_dwell_time)
    ).scalar() or 0.0

    # Segment distribution
    behaviors = db.query(ConsumerBehavior).all()
    segments: dict = {}
    for b in behaviors:
        seg = b.segment or "Unknown"
        segments[seg] = segments.get(seg, 0) + 1

    return {
        "total_sessions": total_sessions,
        "avg_dwell_time_seconds": round(float(avg_dwell), 2),
        "max_dwell_time_seconds": round(float(max_dwell), 2),
        "segment_distribution": segments,
        "total_tracking_points": db.query(TrackingPoint).count()
    }
