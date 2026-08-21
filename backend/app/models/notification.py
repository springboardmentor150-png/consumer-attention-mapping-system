from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base

# Imported so both are registered on the mapper whenever Notification is —
# same reason as in models/analytics.py. Neither imports Notification, so
# there is no cycle.
from app.models.shelf import Shelf  # noqa: F401
from app.models.store import Store  # noqa: F401


class Notification(Base):
    """
    An alert-worthy finding, persisted so it has history.

    These are not computed here. They are the High-priority band the existing
    recommendation engine already produces, captured at the moment analytics
    change so the dashboard can show what happened and when, rather than only
    what is true right now.
    """

    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    # Required, unlike analytics.store_id. Notifications are created only by
    # code paths that already know the store, so there is no legacy of
    # unattributed rows to accommodate and no reason to allow one.
    store_id = Column(
        Integer,
        ForeignKey("stores.id"),
        nullable=False,
        index=True,
    )

    # Optional: an alert about a frame region only names a shelf record when
    # the caller mapped that region to one.
    shelf_id = Column(
        Integer,
        ForeignKey("shelves.id"),
        nullable=True,
        index=True,
    )

    store = relationship("Store")

    shelf = relationship("Shelf")

    # What kind of finding this is, e.g. "shelf_performance".
    category = Column(String, nullable=False)

    # Mirrors the recommendation engine's priority band ("High" / "Medium").
    severity = Column(String, nullable=False, index=True)

    message = Column(String, nullable=False)

    created_at = Column(DateTime, nullable=False, index=True)

    # Null until someone acknowledges it; that is what "unread" means.
    read_at = Column(DateTime, nullable=True)
