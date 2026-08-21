"""Recommendations Router — Data-driven retail optimization suggestions."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Recommendation, Store, User
from ..schemas import RecommendationResponse
from ..auth import get_current_user, RoleChecker
from ..services.recommendation_engine import get_recommendation_engine

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])
any_role = RoleChecker(["Admin", "Store Manager", "Retail Analyst", "Marketing Manager"])
manager_or_admin = RoleChecker(["Admin", "Store Manager"])


@router.get("", response_model=list[RecommendationResponse])
def list_recommendations(
    store_id: Optional[str] = None,
    recommendation_type: Optional[str] = None,
    include_dismissed: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    """List all recommendations, optionally filtered by store and type."""
    query = db.query(Recommendation)
    if store_id:
        query = query.filter(Recommendation.store_id == store_id)
    if recommendation_type:
        query = query.filter(Recommendation.recommendation_type == recommendation_type)
    if not include_dismissed:
        query = query.filter(Recommendation.is_dismissed == False)
    return query.order_by(Recommendation.created_at.desc()).all()


@router.post("/generate")
def generate_recommendations(
    store_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    """Generate fresh recommendations for a store based on analytics."""
    store = db.query(Store).filter(Store.store_id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    engine = get_recommendation_engine()
    recs = engine.generate_for_store(db, store_id)

    return {
        "generated": len(recs),
        "store_id": store_id,
        "message": f"Generated {len(recs)} recommendations based on analytics data"
    }


@router.put("/{rec_id}/dismiss", status_code=status.HTTP_200_OK)
def dismiss_recommendation(
    rec_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    rec = db.query(Recommendation).filter(Recommendation.recommendation_id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec.is_dismissed = True
    db.commit()
    return {"status": "dismissed"}
