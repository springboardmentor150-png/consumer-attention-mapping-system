from fastapi import APIRouter
from app.services.product_scoring import ProductScoringService
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/product-scores")
def product_scores():

    ProductScoringService().generate_scores()

    from app.core.database import SessionLocal
    from app.models.product_score import ProductScore

    db = SessionLocal()

    try:
        return db.query(ProductScore).all()
    finally:
        db.close()


@router.get("/recommendations")
def recommendations():

    return RecommendationService().generate_recommendations()
