from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import ALL_ROLES, MANAGEMENT_ROLES, require_roles
from app.crud.notification import (
    count_unread,
    list_notifications,
    mark_all_read,
    mark_read,
)
from app.models.store import Store


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
    # A notification only restates a finding these roles can already read from
    # /reports and /recommendations, so it sits in the same read-only tier.
    # Marking one read acknowledges a message; it changes no analytics, which
    # is why it does not need the management tier.
    dependencies=[Depends(require_roles(*ALL_ROLES))],
)


StoreFilter = Query(
    default=None,
    description="Restrict to one store. Omit for every store.",
)


def ensure_store(db: Session, store_id: int | None):
    """Reject a filter that names a store which does not exist."""

    if store_id is None:
        return

    if db.query(Store).filter(Store.id == store_id).first() is None:
        raise HTTPException(
            status_code=404,
            detail=f"Store not found: {store_id}",
        )


def serialise(notification):
    return {
        "id": notification.id,
        "store_id": notification.store_id,
        "shelf_id": notification.shelf_id,
        "category": notification.category,
        "severity": notification.severity,
        "message": notification.message,
        "created_at": notification.created_at,
        "read_at": notification.read_at,
    }


@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    store_id: int | None = StoreFilter,
    unread_only: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=200),
):
    """Recent notifications, newest first."""

    ensure_store(db, store_id)

    rows = list_notifications(
        db,
        store_id=store_id,
        unread_only=unread_only,
        limit=limit,
    )

    return {
        "store_id": store_id,
        "unread_count": count_unread(db, store_id=store_id),
        "notifications": [serialise(row) for row in rows],
    }


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    store_id: int | None = StoreFilter,
):
    """Just the badge number, so the header can poll cheaply."""

    ensure_store(db, store_id)

    return {
        "store_id": store_id,
        "unread_count": count_unread(db, store_id=store_id),
    }


@router.post("/{notification_id}/read")
def read_notification(
    notification_id: int,
    db: Session = Depends(get_db),
):
    """Acknowledge one notification."""

    notification = mark_read(db, notification_id)

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail=f"Notification not found: {notification_id}",
        )

    return serialise(notification)


@router.post(
    "/read-all",
    # Read state is shared rather than per-user, so clearing everything at
    # once changes what every other user sees. That is a write, and the
    # read-only roles are not meant to have one anywhere — so this single
    # route is raised to the management tier. Acknowledging one notification
    # stays open to all roles.
    dependencies=[Depends(require_roles(*MANAGEMENT_ROLES))],
)
def read_all_notifications(
    db: Session = Depends(get_db),
    store_id: int | None = StoreFilter,
):
    """Acknowledge everything currently unread, optionally for one store."""

    ensure_store(db, store_id)

    return {
        "store_id": store_id,
        "marked_read": mark_all_read(db, store_id=store_id),
        "unread_count": count_unread(db, store_id=store_id),
    }
