from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base

# Imported so both classes are registered on the mapper whenever Analytics is.
# Without this, importing Analytics on its own — as the segmentation service
# does when run directly — fails to resolve the relationships below. Neither
# module imports Analytics, so there is no cycle.
from app.models.shelf import Shelf  # noqa: F401
from app.models.store import Store  # noqa: F401


class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)

    shopper_id = Column(Integer, nullable=False)

    # Which store and shelf this session belongs to.
    #
    # Both are nullable because rows recorded before these columns existed
    # have no recoverable provenance — the pipeline never captured which store
    # a video came from — and the database holds several stores, so assigning
    # those rows to any one of them would invent data. Queries that pass a
    # store_id simply exclude them; queries that don't keep their old
    # behaviour.
    #
    # shelf_id stays nullable going forward too: the vision pipeline maps a
    # shopper to a frame region ("Left Display" / "Right Display"), which is
    # geometry, not a Shelf record. It is only set when the caller explicitly
    # says which Shelf a region corresponds to.
    store_id = Column(
        Integer,
        ForeignKey("stores.id"),
        nullable=True,
        index=True,
    )

    shelf_id = Column(
        Integer,
        ForeignKey("shelves.id"),
        nullable=True,
        index=True,
    )

    store = relationship("Store")

    shelf = relationship("Shelf")

    region = Column(String, nullable=False)

    focus = Column(String, nullable=False)

    dwell_time = Column(Float, nullable=False)

    path_length = Column(Float, nullable=False)

    shelf_visits = Column(Integer, nullable=False)

    gaze_shifts = Column(Integer, nullable=False)

    segment = Column(String, nullable=True)

    entry_time = Column(DateTime, nullable=False)

    exit_time = Column(DateTime, nullable=False)

    timestamp = Column(DateTime, nullable=False)
