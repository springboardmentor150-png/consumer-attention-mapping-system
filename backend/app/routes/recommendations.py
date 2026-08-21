from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.product_score import ProductScore
from app.models.recommendation import Recommendation
from app.schemas.recommendation import RecommendationResponse
from app.ai.recommendation import generate_recommendation

router = APIRouter(
    prefix="/api/recommendations",
    tags=["Recommendations"]
)


@router.post("/generate")
def generate_recommendations(
    db: Session = Depends(get_db)
):
    products = db.query(ProductScore).all()
    recommendations = []

    for product in products:
        recommendation_type, message = generate_recommendation(
            attention_duration=product.attention_duration,
            interaction_frequency=product.interaction_frequency,
            pickup_rate=product.pickup_rate,
            conversion_rate=product.conversion_rate,
            attractiveness_score=product.attractiveness_score,
        )

        recommendation_record = Recommendation(
            product_name=product.product_name,
            shelf_name=product.shelf_name,
            attractiveness_score=product.attractiveness_score,
            recommendation_type=recommendation_type,
            message=message,
        )

        db.add(recommendation_record)
        recommendations.append({
            "product_name": product.product_name,
            "shelf_name": product.shelf_name,
            "attractiveness_score": product.attractiveness_score,
            "recommendation_type": recommendation_type,
            "message": message,
        })

    db.commit()
    return recommendations


@router.get("/", response_model=list[RecommendationResponse])
def get_recommendations(
    db: Session = Depends(get_db)
):
    return db.query(Recommendation).order_by(Recommendation.attractiveness_score.asc()).all()
