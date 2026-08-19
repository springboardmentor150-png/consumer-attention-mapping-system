from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.product_score import ProductScore
from app.schemas.product_score import ProductScoreCreate, ProductScoreResponse
from app.ai.attractiveness import calculate_attractiveness_score

router = APIRouter(
    prefix="/api/analytics",
    tags=["Product Analytics"]
)


@router.post(
    "/attractiveness",
    response_model=ProductScoreResponse
)
def create_product_score(
    product: ProductScoreCreate,
    db: Session = Depends(get_db)
):
    score = calculate_attractiveness_score(
        attention_duration=product.attention_duration,
        interaction_frequency=product.interaction_frequency,
        pickup_rate=product.pickup_rate,
        conversion_rate=product.conversion_rate,
        repeat_engagement=product.repeat_engagement,
    )

    db_product = ProductScore(
        product_name=product.product_name,
        shelf_name=product.shelf_name,
        attention_duration=product.attention_duration,
        interaction_frequency=product.interaction_frequency,
        pickup_rate=product.pickup_rate,
        conversion_rate=product.conversion_rate,
        repeat_engagement=product.repeat_engagement,
        attractiveness_score=score,
    )

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return db_product


@router.get(
    "/attractiveness",
    response_model=list[ProductScoreResponse]
)
def get_product_scores(
    db: Session = Depends(get_db)
):
    return db.query(ProductScore).all()
