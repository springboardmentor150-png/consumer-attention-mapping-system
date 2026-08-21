from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.notification import Notification


def scoped(query, store_id: int | None = None, unread_only: bool = False):
    """
    Restrict a notification query to one store, and optionally to unread.

    Mirrors the scoping helper in crud/analytics.py so notifications filter the
    same way every other per-store read does.
    """

    if store_id is not None:
        query = query.filter(Notification.store_id == store_id)

    if unread_only:
        query = query.filter(Notification.read_at.is_(None))

    return query


def list_notifications(
    db: Session,
    store_id: int | None = None,
    unread_only: bool = False,
    limit: int = 50,
):
    """Most recent first, newest at the top of the history panel."""

    return (
        scoped(db.query(Notification), store_id, unread_only)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(limit)
        .all()
    )


def count_unread(db: Session, store_id: int | None = None):
    return scoped(
        db.query(func.count(Notification.id)), store_id, unread_only=True
    ).scalar() or 0


def mark_read(db: Session, notification_id: int):
    """Acknowledge one notification. Returns None if it does not exist."""

    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id)
        .first()
    )

    if notification is None:
        return None

    if notification.read_at is None:
        notification.read_at = datetime.now()
        db.commit()
        db.refresh(notification)

    return notification


def mark_all_read(db: Session, store_id: int | None = None):
    """Acknowledge everything currently unread, optionally for one store."""

    unread = scoped(
        db.query(Notification), store_id, unread_only=True
    ).all()

    now = datetime.now()

    for notification in unread:
        notification.read_at = now

    db.commit()

    return len(unread)


def open_notifications(db: Session, store_id: int, category: str):
    """
    Every unread notification of one category for a store.

    Used by the sync pass to see what it already has standing, so a finding
    that is still true is left alone, one that changed is superseded, and one
    that is no longer true is closed instead of being left to mislead.
    """

    return (
        db.query(Notification)
        .filter(Notification.store_id == store_id)
        .filter(Notification.category == category)
        .filter(Notification.read_at.is_(None))
        .all()
    )


def supersede(db: Session, notifications, commit: bool = True):
    """
    Close notifications whose finding no longer holds.

    Marks them read, which is what the panel already treats as "history":
    they drop out of the unread badge but stay visible as a record of what
    was true at the time. Returns how many were closed.
    """

    now = datetime.now()

    closed = 0

    for notification in notifications:
        if notification.read_at is None:
            notification.read_at = now
            closed += 1

    if closed and commit:
        db.commit()

    return closed


def create_notification(
    db: Session,
    store_id: int,
    category: str,
    severity: str,
    message: str,
    shelf_id: int | None = None,
    commit: bool = True,
):
    """
    Record one finding.

    store_id is required and never defaulted: an unattributed notification
    would be invisible to every per-store view, the same failure mode the
    analytics pipeline already had.
    """

    if store_id is None:
        raise ValueError(
            "store_id is required: refusing to create a notification that no "
            "store could be attributed to."
        )

    notification = Notification(
        store_id=store_id,
        shelf_id=shelf_id,
        category=category,
        severity=severity,
        message=message,
        created_at=datetime.now(),
        read_at=None,
    )

    db.add(notification)

    if commit:
        db.commit()
        db.refresh(notification)

    return notification
