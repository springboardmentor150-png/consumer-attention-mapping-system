from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import ALL_ROLES, require_roles

from app.crud.analytics import get_engagement_metrics

from app.services.scoring.attractiveness import (
    calculate_attractiveness_score,
    resolve_scoring_inputs,
)
from app.services.recommendations import generate_product_recommendation
from app.services.vision.shelf_mapper import zone_label

router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"],
    # Read-only advice derived from the score; persists nothing.
    dependencies=[Depends(require_roles(*ALL_ROLES))],
)


@router.post("/")
def get_recommendation(data: dict, db: Session = Depends(get_db)):
    """
    Generate recommendations for a product on a shelf.

    Keys off shelf, product and attractiveness score only. Any metric values
    in the request body are ignored — they are internal to the scoring engine
    now — so older clients that still send them keep working.
    """

    product_name = data.get("product_name") or ""

    # "shelf_zone" is the current field; "zone" is what earlier clients sent.
    shelf_zone = data.get("shelf_zone") or data.get("zone")

    # Resolved the same way /attractiveness/score resolves them, rather than
    # duplicating the calculation here. The inputs are needed even when the
    # caller supplies a score, because the advice is ranked by which of them
    # is costing this shelf the most.
    engagement = get_engagement_metrics(
        db,
        zone=shelf_zone,
        store_id=data.get("store_id"),
        shelf_id=data.get("shelf_id"),
    )

    metrics, _ = resolve_scoring_inputs(
        engagement=engagement,
        identifier=shelf_zone,
    )

    score = data.get("attractiveness_score")

    if score is None:
        score = calculate_attractiveness_score(**metrics)

    return generate_product_recommendation(
        product_name=product_name,
        shelf_zone=zone_label(shelf_zone) if shelf_zone else "All zones",
        attractiveness_score=float(score),
        metrics=metrics,
    )
