"""
Turn alert-worthy findings into persisted notifications.

There is no detection logic here. The findings come from
services/reports.py::build_store_report, which already derives an `alerts`
list from the High-priority band the recommendation engine assigns. This
module only decides when to write those findings down and how to avoid
recording the same standing problem twice.
"""

from app.crud.notification import (
    create_notification,
    open_notifications,
    supersede,
)
from app.models.shelf import Shelf
from app.services.reports import build_store_report


# Every notification this module writes describes shelf performance. A wider
# taxonomy (traffic anomalies, camera health) needs detection that does not
# exist yet — see the gap noted in the task report.
SHELF_PERFORMANCE = "shelf_performance"


def resolve_shelf_id(db, store_id: int, shelf_label: str):
    """
    Best-effort link from an alert's shelf label to a Shelf record.

    The alert names a display label ("Shelf A"), which is frame geometry, not
    a shelf record. Only rows the pipeline already attributed to a shelf can
    resolve, so this returns None rather than guessing when nothing matches.
    """

    shelf = (
        db.query(Shelf)
        .filter(Shelf.store_id == store_id)
        .filter(Shelf.shelf_name == shelf_label)
        .first()
    )

    return shelf.id if shelf else None


def shelf_of(message: str) -> str:
    """
    The shelf a stored notification is about.

    Notifications are written as "<shelf>: <finding>", and shelf_id cannot be
    used as the key: it is only set when the alert's display label ("Shelf A")
    happens to match a Shelf record's name, which it usually does not, so
    every row for a store would otherwise share the same null key.
    """

    return message.split(":", 1)[0].strip()


def sync_store_notifications(db, store_id: int):
    """
    Bring this store's notifications in line with what is currently alerting.

    Called after analytics change, which is the only moment the alert state
    can change. A run leaves exactly one open notification per alerting shelf:

      * a shelf still alerting with the same finding keeps its notification,
        so the badge does not climb by one on every run;
      * a shelf whose finding has changed has the old one closed and the new
        one recorded, so the panel never shows advice from an earlier run
        beside advice from this one;
      * a shelf that has stopped alerting has its notification closed, rather
        than left standing for a problem that no longer exists.

    Closed notifications stay in the list as history — see crud.supersede.

    Returns the notifications created.
    """

    if store_id is None:
        raise ValueError(
            "store_id is required: notifications must be store-scoped."
        )

    report = build_store_report(db, store_id=store_id)

    if report is None:
        # Unknown store. The caller validated it, so this only happens if the
        # store disappeared mid-run; nothing to record either way.
        return []

    # What should be standing after this run, keyed by shelf.
    # The severity is stored alongside and rendered as a badge, so the text
    # carries the finding rather than repeating the band name.
    current = {
        alert["shelf"]: f"{alert['shelf']}: {alert['finding']}"
        for alert in report["alerts"]
    }

    standing = open_notifications(db, store_id, SHELF_PERFORMANCE)

    # Anything open whose shelf is no longer alerting, or whose finding has
    # been reworded by the latest analytics, is no longer current.
    stale = [
        notification
        for notification in standing
        if current.get(shelf_of(notification.message)) != notification.message
    ]

    supersede(db, stale, commit=False)

    # Whatever survived is still true and still open, so re-recording it would
    # only duplicate it.
    unchanged = {
        notification.message
        for notification in standing
        if notification not in stale
    }

    created = []

    for alert in report["alerts"]:
        message = current[alert["shelf"]]

        if message in unchanged:
            continue

        created.append(
            create_notification(
                db,
                store_id=store_id,
                shelf_id=resolve_shelf_id(db, store_id, alert["shelf"]),
                category=SHELF_PERFORMANCE,
                severity=alert["severity"],
                message=message,
                commit=False,
            )
        )

    # One commit for the whole reconciliation: closing the stale rows and
    # opening the new ones are the same change to the same picture.
    if created or stale:
        db.commit()

        for notification in created:
            db.refresh(notification)

    return created
