from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import ALL_ROLES, require_roles

from app.crud.analytics import get_engagement_metrics

from app.schemas.attractiveness import (
    AttractivenessRequest,
    AttractivenessResponse,
)

from app.services.scoring.attractiveness import (
    calculate_attractiveness_score,
    resolve_scoring_inputs,
)


router = APIRouter(
    prefix="/attractiveness",
    tags=["Product Attractiveness"],
    # Scoring reads analytics and returns a figure; it persists nothing, so it
    # stays available to every signed-in role including read-only Analysts.
    dependencies=[Depends(require_roles(*ALL_ROLES))],
)


@router.post(
    "/score",
    response_model=AttractivenessResponse,
)
def calculate_product_score(
    data: AttractivenessRequest,
    db: Session = Depends(get_db),
):
    """
    Score a product for a shelf zone.

    Attention duration comes from the analytics pipeline; the remaining
    formula inputs are generated from it by the scoring service. Metric values
    sent in the request are still accepted for backward compatibility but no
    longer influence the score.
    """

    engagement = get_engagement_metrics(
        db,
        zone=data.zone,
        store_id=data.store_id,
        shelf_id=data.shelf_id,
    )

    metrics, sources = resolve_scoring_inputs(
        engagement=engagement,
        identifier=data.zone,
    )

    score = calculate_attractiveness_score(**metrics)

    return {
        "product_name": data.product_name,
        "attractiveness_score": score,
        "metrics_used": metrics,
        "metric_sources": sources,
        "zone": data.zone,
        "store_id": data.store_id,
        "analytics_sessions": (
            engagement["session_count"] if engagement else 0
        ),
        "analytics_updated_at": (
            engagement["last_updated"] if engagement else None
        ),
    }
