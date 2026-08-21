from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class ProductScore(Base):

    __tablename__ = "product_scores"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    shelf_name = Column(
        String,
        nullable=False,
        unique=True
    )

    attention_duration = Column(
        Float,
        default=0
    )

    interaction_frequency = Column(
        Float,
        default=0
    )

    # ---------------------------------------------
    # Part 1 raw product metrics
    # ---------------------------------------------

    total_views = Column(
        Integer,
        default=0,
        nullable=False
    )

    total_pickups = Column(
        Integer,
        default=0,
        nullable=False
    )

    total_purchases = Column(
        Integer,
        default=0,
        nullable=False
    )

    # ---------------------------------------------
    # Existing calculated rates
    # ---------------------------------------------

    pickup_rate = Column(
        Float,
        default=0
    )

    conversion_rate = Column(
        Float,
        default=0
    )

    repeat_engagement = Column(
        Float,
        default=0
    )

    attractiveness_score = Column(
        Float,
        default=0
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )