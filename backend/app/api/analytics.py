from fastapi import APIRouter, Depends
from sqlalchemy import func
import subprocess
import sys
import os

from app.core.database import SessionLocal
from app.models.attention_session import AttentionSession
from app.models.product_score import ProductScore
from app.services.recommendation_service import RecommendationService
from app.core.dependencies import get_current_user, require_role
from fastapi.responses import FileResponse
from pathlib import Path

router = APIRouter(prefix="/analytics", tags=["Analytics"])

recommendation_service = RecommendationService()


@router.get("/summary")
def get_summary(current_user=Depends(get_current_user)):
    db = SessionLocal()

    try:

        total_shoppers = db.query(AttentionSession).count()

        average_dwell = db.query(func.avg(AttentionSession.dwell_time)).scalar()

        most_viewed = (
            db.query(
                AttentionSession.most_viewed_zone,
                func.count(AttentionSession.id),
            )
            .group_by(AttentionSession.most_viewed_zone)
            .order_by(func.count(AttentionSession.id).desc())
            .first()
        )

        return {
            "total_shoppers": total_shoppers,
            "average_dwell": round(average_dwell or 0, 2),
            "most_viewed_zone": most_viewed[0] if most_viewed else "None",
        }

    finally:
        db.close()


@router.get("/sessions")
def get_sessions(current_user=Depends(get_current_user)):
    db = SessionLocal()

    try:

        sessions = db.query(AttentionSession).order_by(AttentionSession.id.desc()).all()

        return sessions

    finally:
        db.close()


@router.get("/attention")
def get_attention(current_user=Depends(get_current_user)):
    db = SessionLocal()

    try:

        sessions = db.query(AttentionSession).all()

        zone_a = sum(session.zone_a_time for session in sessions)
        zone_b = sum(session.zone_b_time for session in sessions)
        zone_c = sum(session.zone_c_time for session in sessions)

        return {
            "Zone A": round(zone_a, 2),
            "Zone B": round(zone_b, 2),
            "Zone C": round(zone_c, 2),
        }

    finally:
        db.close()


@router.post("/run")
def run_analysis(current_user=Depends(require_role(["Admin", "Store Manager"]))):
    subprocess.Popen(
        [sys.executable, "-m", "app.services.tracker"],
        cwd=os.getcwd(),
    )

    return {
        "status": "success",
        "message": "AI analysis started successfully.",
    }


@router.get("/product-scores")
def get_product_scores(
    current_user=Depends(require_role(["Admin", "Retail Analyst", "Marketing Manager"]))
):

    from app.services.product_scoring import ProductScoringService

    ProductScoringService().generate_scores()

    db = SessionLocal()

    try:

        return db.query(ProductScore).order_by(ProductScore.id.desc()).all()

    finally:
        db.close()


@router.get("/recommendations")
def get_recommendations(
    current_user=Depends(require_role(["Admin", "Retail Analyst", "Marketing Manager"]))
):
    return recommendation_service.generate_recommendations()


@router.get("/heatmap")
def get_heatmap(current_user=Depends(get_current_user)):
    heatmap_path = Path("heatmaps/store_heatmap.png")

    if heatmap_path.exists():
        return FileResponse(heatmap_path)

    return {"message": "Heatmap not generated yet."}
