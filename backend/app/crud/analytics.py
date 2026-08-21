from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.analytics import Analytics
from app.models.video_track import PersonTrack, VideoRecord, TrackingPoint


def create_session(db: Session, session_data: dict):
    analytics = Analytics(**session_data)
    db.add(analytics)
    db.commit()
    db.refresh(analytics)
    return analytics


def get_all_sessions(db: Session):
    return db.query(Analytics).order_by(Analytics.id.desc()).all()


def get_summary(db: Session):
    analytics_total = db.query(Analytics).count()
    tracks_total = db.query(PersonTrack).count()
    total = analytics_total + tracks_total

    analytics_avg = db.query(func.avg(Analytics.dwell_time)).scalar() or 0
    tracks_avg = db.query(func.avg(PersonTrack.dwell_seconds)).scalar() or 0
    avg = (analytics_avg + tracks_avg) / 2 if (analytics_total > 0 and tracks_total > 0) else (analytics_avg or tracks_avg or 0)

    left = db.query(Analytics).filter(Analytics.region == "left").count()
    right = db.query(Analytics).filter(Analytics.region == "right").count()

    # If left/right display counts are zero in analytics table, query real tracking points ROIs (Left <= 426, Right >= 853)
    if left == 0 and right == 0:
        left = db.query(func.count(func.distinct(TrackingPoint.track_id))).filter(TrackingPoint.x <= 426).scalar() or 0
        right = db.query(func.count(func.distinct(TrackingPoint.track_id))).filter(TrackingPoint.x >= 853).scalar() or 0

    return {
        "total_shoppers": total,
        "average_dwell_time": round(float(avg), 2),
        "left_display_views": left,
        "right_display_views": right,
    }