from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.models.analytics import Analytics
from app.services.vision.shelf_mapper import LEFT_ZONE, RIGHT_ZONE


def create_session(db: Session, session_data: dict, commit: bool = True):
    """
    Persist one shopper session.

    commit defaults to True so existing callers are unaffected. The pipeline
    passes commit=False for each row of a batch and commits once at the end,
    which makes the batch atomic — without that, a failure partway through a
    batch would leave the rows before it already committed.
    """

    analytics = Analytics(**session_data)

    db.add(analytics)

    if commit:
        db.commit()
        db.refresh(analytics)

    return analytics


def scoped(query, store_id: int | None = None, shelf_id: int | None = None):
    """
    Restrict a query to one store, and optionally one shelf.

    Passing None leaves the query unscoped, which keeps every existing caller
    behaving exactly as before and keeps rows recorded before these columns
    existed visible. Passing a store_id excludes those unattributed rows,
    because their store genuinely is not known.
    """

    if store_id is not None:
        query = query.filter(Analytics.store_id == store_id)

    if shelf_id is not None:
        query = query.filter(Analytics.shelf_id == shelf_id)

    return query


def get_all_sessions(
    db: Session,
    store_id: int | None = None,
    shelf_id: int | None = None,
):

    return scoped(db.query(Analytics), store_id, shelf_id).all()


def get_summary(
    db: Session,
    store_id: int | None = None,
    shelf_id: int | None = None,
):

    total = scoped(db.query(Analytics), store_id, shelf_id).count()

    avg = scoped(
        db.query(func.avg(Analytics.dwell_time)), store_id, shelf_id
    ).scalar() or 0

    left = scoped(
        db.query(Analytics).filter(Analytics.focus == LEFT_ZONE),
        store_id,
        shelf_id,
    ).count()

    right = scoped(
        db.query(Analytics).filter(Analytics.focus == RIGHT_ZONE),
        store_id,
        shelf_id,
    ).count()

    # Response keys stay as-is: the frontend reads them by name, and renaming
    # them would break it. The UI presents these counts as Shelf A / Shelf B.
    # last_processed is additive: it is when the pipeline last wrote analytics,
    # which is what the dashboard shows instead of claiming to be live.
    return {
        "total_shoppers": total,
        "average_dwell_time": round(avg, 2),
        "left_display_views": left,
        "right_display_views": right,
        "last_processed": get_last_processed(db, store_id, shelf_id),
    }


def get_last_processed(
    db: Session,
    store_id: int | None = None,
    shelf_id: int | None = None,
):
    """
    When the pipeline last wrote an analytics row, or None if it never has.

    Analytics only change when a video is processed, so this is the honest
    "as of" time for every figure on the dashboard.
    """

    return scoped(
        db.query(func.max(Analytics.timestamp)), store_id, shelf_id
    ).scalar()


def get_engagement_metrics(
    db: Session,
    zone: str | None = None,
    store_id: int | None = None,
    shelf_id: int | None = None,
):
    """
    Average per-session engagement recorded by the vision pipeline.

    zone filters to a single shelf zone using the values the pipeline already
    stores (see LEFT_ZONE / RIGHT_ZONE in shelf_mapper). A session counts for
    a zone if the shopper either stood in it (region) or looked at it (focus).

    store_id scopes the figures to one store; without it every store's
    sessions are averaged together. shelf_id narrows further to one shelf
    record where the caller knows which one applies.

    Returns None when there are no sessions to draw on, which is how callers
    tell "no analytics yet" apart from "analytics say zero".
    """

    query = db.query(
        func.avg(Analytics.dwell_time),
        func.avg(Analytics.shelf_visits),
        func.avg(Analytics.gaze_shifts),
        func.count(Analytics.id),
        func.max(Analytics.timestamp),
    )

    if zone is not None:
        query = query.filter(
            or_(
                Analytics.region == zone,
                Analytics.focus == zone,
            )
        )

    query = scoped(query, store_id, shelf_id)

    avg_dwell, avg_visits, avg_gaze, session_count, last_updated = query.one()

    if not session_count:
        return None

    return {
        "avg_dwell_time": float(avg_dwell or 0),
        "avg_shelf_visits": float(avg_visits or 0),
        "avg_gaze_shifts": float(avg_gaze or 0),
        "session_count": int(session_count),
        # When the pipeline last wrote a session for this zone — the "last
        # updated" the scoring page shows.
        "last_updated": last_updated,
    }


def get_segment_distribution(
    db: Session,
    store_id: int | None = None,
    shelf_id: int | None = None,
):
    """
    Count sessions per behavioural segment.

    A plain read of the labels K-Means already wrote to Analytics.segment —
    this never re-runs clustering, so calling it cannot change any stored
    segment. Sessions not yet segmented are reported under "Unsegmented".
    """

    rows = scoped(
        db.query(Analytics.segment, func.count(Analytics.id)),
        store_id,
        shelf_id,
    ).group_by(Analytics.segment).all()

    return {
        (segment or "Unsegmented"): int(count)
        for segment, count in rows
    }
