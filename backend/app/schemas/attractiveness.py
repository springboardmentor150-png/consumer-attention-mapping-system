from pydantic import BaseModel, Field


from datetime import datetime


class AttractivenessRequest(BaseModel):

    product_name: str

    # Scoring is fully automatic: attention duration comes from analytics and
    # the rest are generated from it. These fields are still accepted so
    # existing clients keep validating, but their values are ignored.
    attention_duration: float | None = Field(
        default=None,
        ge=0,
        le=100
    )

    interaction_frequency: float | None = Field(
        default=None,
        ge=0,
        le=100
    )

    pickup_rate: float | None = Field(
        default=None,
        ge=0,
        le=100
    )

    conversion_rate: float | None = Field(
        default=None,
        ge=0,
        le=100
    )

    repeat_engagement: float | None = Field(
        default=None,
        ge=0,
        le=100
    )

    # Which store's analytics to score against. Optional so existing clients
    # keep working; without it the score is computed from every store's
    # sessions pooled together, which is rarely what you want.
    store_id: int | None = None

    # Narrow further to one shelf record when the caller knows it.
    shelf_id: int | None = None

    # Shelf zone the product sits in, using the values the vision pipeline
    # stores ("Left Display" / "Right Display"). None scores the product
    # against every recorded session in the store.
    zone: str | None = None


class AttractivenessResponse(BaseModel):

    product_name: str

    attractiveness_score: float

    # Added by the analytics refactor. All optional, so any consumer reading
    # only the two fields above is unaffected.
    metrics_used: dict[str, float] | None = None

    metric_sources: dict[str, str] | None = None

    zone: str | None = None

    store_id: int | None = None

    analytics_sessions: int | None = None

    # When the pipeline last recorded a session for this zone.
    analytics_updated_at: datetime | None = None
