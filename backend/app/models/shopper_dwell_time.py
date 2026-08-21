from sqlalchemy import Column, Integer, Float, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class ShopperDwellTime(Base):

    __tablename__ = "shopper_dwell_time"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    track_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    entry_time = Column(
        DateTime,
        nullable=False
    )

    exit_time = Column(
        DateTime,
        nullable=False
    )

    dwell_time_seconds = Column(
        Float,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )