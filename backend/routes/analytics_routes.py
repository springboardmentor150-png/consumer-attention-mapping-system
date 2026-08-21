from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from analytics.shelf_heatmap import generate_shelf_heatmap
from database import get_db
from services.product_scoring_service import calculate_product_scores
from services.recommendation_service import generate_recommendations

from services.analytics_service import (
    get_shelf_analytics,
    get_dashboard_summary,
    get_dwell_analytics,
    get_live_occupancy,
    get_shelf_performance
)
router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get("/shelves")
def shelf_analytics(db: Session = Depends(get_db)):
    return get_shelf_analytics(db)


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    return get_dashboard_summary(db)


@router.get("/dwell")
def dwell_analytics(db: Session = Depends(get_db)):
    return get_dwell_analytics(db)


@router.get("/live")
def live_occupancy():
    return get_live_occupancy()

@router.get("/performance")
def shelf_performance(db: Session = Depends(get_db)):
    return get_shelf_performance(db)

@router.get("/heatmap")
def shelf_heatmap():

    output_path = generate_shelf_heatmap(
        "images/store_view.jpg"
    )

    return FileResponse(
        output_path,
        media_type="image/jpeg"
    )

@router.get("/products")
def product_scores(db: Session = Depends(get_db)):
    return calculate_product_scores(db)

@router.get("/recommendations")
def product_recommendations(
    db: Session = Depends(get_db)
):
    return generate_recommendations(db)