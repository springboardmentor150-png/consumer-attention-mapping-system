from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.product_score import ProductScore
from app.schemas.product_score import ProductScoreCreate
from app.services.product_score_service import product_score_service
from app.services.recommendation_service import recommendation_service


router = APIRouter()


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# CREATE PRODUCT SCORE
# ============================================================

@router.post("/")
def create_product_score(
    data: ProductScoreCreate,
    db: Session = Depends(get_db)
):
    return product_score_service.create_product_score(
        db,
        data
    )


# ============================================================
# GET ALL PRODUCT SCORES
# ============================================================

@router.get("/")
def get_product_scores(
    db: Session = Depends(get_db)
):
    return product_score_service.get_all_scores(db)


# ============================================================
# CALCULATE PRODUCT SCORE FROM SHELF METRICS
# ============================================================

@router.post("/calculate/{shelf_name}")
def calculate_shelf_score(
    shelf_name: str,
    db: Session = Depends(get_db)
):

    metrics = product_score_service.get_shelf_metrics(
        db,
        shelf_name
    )

    data = ProductScoreCreate(
        shelf_name=shelf_name,

        attention_duration=metrics.get(
            "attention_duration",
            0
        ),

        interaction_frequency=metrics.get(
            "interaction_frequency",
            0
        ),

        total_views=metrics.get(
            "total_views",
            0
        ),

        total_pickups=metrics.get(
            "total_pickups",
            0
        ),

        total_purchases=metrics.get(
            "total_purchases",
            0
        ),

        pickup_rate=metrics.get(
            "pickup_rate",
            0
        ),

        conversion_rate=metrics.get(
            "conversion_rate",
            0
        ),

        repeat_engagement=metrics.get(
            "repeat_engagement",
            0
        )
    )

    return product_score_service.create_product_score(
        db,
        data
    )


# ============================================================
# GET SHELF SCORE METRICS
# ============================================================

@router.get("/metrics/{shelf_name}")
def get_shelf_score_metrics(
    shelf_name: str,
    db: Session = Depends(get_db)
):

    metrics = product_score_service.get_shelf_metrics(
        db,
        shelf_name
    )

    product = (
        db.query(ProductScore)
        .filter(
            ProductScore.shelf_name == shelf_name
        )
        .first()
    )

    if product is None:

        return {
            "shelf_name": shelf_name,
            "metrics": metrics,
            "attractiveness_score": 0
        }

    return {
        "shelf_name": shelf_name,
        "metrics": metrics,
        "attractiveness_score": (
            product.attractiveness_score
        )
    }


# ============================================================
# INTERNAL HELPER
# BUILD RECOMMENDATION FOR ONE PRODUCT
# ============================================================

def _build_recommendation(product):

    return recommendation_service.generate_recommendation(

        shelf_name=product.shelf_name,

        attractiveness_score=(
            product.attractiveness_score
        ),

        total_views=(
            product.total_views or 0
        ),

        total_pickups=(
            product.total_pickups or 0
        ),

        total_purchases=(
            product.total_purchases or 0
        ),

        pickup_rate=(
            product.pickup_rate or 0
        ),

        conversion_rate=(
            product.conversion_rate or 0
        )
    )


# ============================================================
# GET RECOMMENDATIONS FOR ALL PRODUCTS
# ============================================================

@router.get("/recommendations")
def get_all_shelf_recommendations(
    db: Session = Depends(get_db)
):

    products = (
        db.query(ProductScore)
        .order_by(
            ProductScore.shelf_name
        )
        .all()
    )

    results = []

    for product in products:

        recommendation = _build_recommendation(
            product
        )

        results.append(
            recommendation
        )

    return {
        "total_shelves": len(results),
        "recommendations": results
    }


# ============================================================
# GET RECOMMENDATIONS FOR ONE PRODUCT
# ============================================================

@router.get("/recommendations/{shelf_name}")
def get_shelf_recommendations(
    shelf_name: str,
    db: Session = Depends(get_db)
):

    product = (
        db.query(ProductScore)
        .filter(
            ProductScore.shelf_name == shelf_name
        )
        .first()
    )

    # --------------------------------------------------------
    # Product not found
    # --------------------------------------------------------

    if product is None:

        return {
            "shelf_name": shelf_name,
            "message": (
                "No product score found "
                "for this shelf."
            ),
            "recommendations": []
        }

    # --------------------------------------------------------
    # Generate recommendation
    # --------------------------------------------------------

    return _build_recommendation(
        product
    )