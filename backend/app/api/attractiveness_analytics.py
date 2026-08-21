import os
import pandas as pd
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.attractiveness_engine import AttractivenessScoringEngine

router = APIRouter(prefix="/api/analytics", tags=["Shelf Attractiveness & Grid Heatmaps"])

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "processed")
os.makedirs(REPORTS_DIR, exist_ok=True)


@router.get("/grid-heatmap")
def get_grid_heatmap(
    video_id: Optional[int] = Query(None, description="Optional specific video ID"),
    store_id: Optional[int] = Query(None, description="Optional store ID filter"),
    rows: int = Query(5, ge=1, le=20, description="Grid row count (default 5)"),
    cols: int = Query(8, ge=1, le=30, description="Grid column count (default 8)"),
    db: Session = Depends(get_db),
):
    """
    Returns the 5x8 shelf attention grid heatmap computed strictly from PostgreSQL
    tracking points with YlOrRd color gradients and cell dwell metrics.
    """
    try:
        data = AttractivenessScoringEngine.generate_shelf_grid_heatmap(
            db=db,
            video_id=video_id,
            store_id=store_id,
            rows=rows,
            cols=cols,
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate grid heatmap: {str(e)}")


@router.get("/attractiveness-scores")
def get_attractiveness_scores(
    store_id: Optional[int] = Query(None, description="Optional store ID filter"),
    db: Session = Depends(get_db),
):
    """
    Calculates the exact weighted Attractiveness Scores across all shelves in PostgreSQL.
    Ranks them from Highest Score to Lowest Score with a full 5-metric breakdown:
    - Attention Duration (35%)
    - Product Interaction Frequency (25%)
    - Product Pickup Rate (20%)
    - Purchase Conversion Rate (15%)
    - Repeat Engagement Rate (5%)
    """
    try:
        data = AttractivenessScoringEngine.calculate_shelf_attractiveness_scores(
            db=db,
            store_id=store_id,
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate attractiveness scores: {str(e)}")


@router.get("/recommendations")
def get_shelf_recommendations(
    store_id: Optional[int] = Query(None, description="Optional store ID filter"),
    db: Session = Depends(get_db),
):
    """
    Returns explainable, rule-based recommendations for store shelves generated from
    real PostgreSQL scoring metrics.
    """
    try:
        all_data = AttractivenessScoringEngine.calculate_shelf_attractiveness_scores(
            db=db,
            store_id=store_id,
        )
        rankings = all_data.get("rankings", [])
        recommendations_list = []
        for shelf in rankings:
            recommendations_list.append({
                "shelf_id": shelf["shelf_id"],
                "shelf_name": shelf["shelf_name"],
                "rank": shelf.get("rank"),
                "attractiveness_score": shelf["attractiveness_score"],
                "recommendations": shelf.get("recommendations", []),
            })
        return {
            "total_shelves": len(recommendations_list),
            "recommendations": recommendations_list,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")


@router.get("/reports/export-excel")
def export_shelf_engagement_excel_report(
    store_id: Optional[int] = Query(None, description="Optional store ID filter"),
    db: Session = Depends(get_db),
):
    """
    Gathers real shelf engagement and attractiveness data from PostgreSQL, organizes it into
    a clean pandas DataFrame with calculated metrics, and exports a downloadable Excel file (.xlsx).
    """
    try:
        data = AttractivenessScoringEngine.calculate_shelf_attractiveness_scores(
            db=db,
            store_id=store_id,
        )
        rankings = data.get("rankings", [])

        rows = []
        for item in rankings:
            recs_str = " | ".join(item.get("recommendations", []))
            rows.append({
                "Rank": item.get("rank", 1),
                "Shelf ID": item.get("shelf_id"),
                "Shelf Zone Name": item.get("shelf_name"),
                "Store ID": item.get("store_id"),
                "Attractiveness Score (0-100)": item.get("attractiveness_score", 0.0),
                "Attention Dwell (seconds)": item.get("attention_duration_seconds", 0.0),
                "Interaction Count": item.get("interaction_count", 0),
                "Unique Visitors": item.get("unique_visitors", 0),
                "Pickup Rate (%)": round(item.get("pickup_rate", 0.0) * 100.0, 1),
                "Conversion Rate (%)": round(item.get("purchase_conversion_rate", 0.0) * 100.0, 1),
                "Repeat Rate (%)": round(item.get("repeat_engagement_rate", 0.0) * 100.0, 1),
                "Key Recommendations": recs_str,
            })

        df = pd.DataFrame(rows)
        file_path = os.path.join(REPORTS_DIR, "shelf_engagement_report.xlsx")
        df.to_excel(file_path, index=False, engine="openpyxl")

        return FileResponse(
            file_path,
            filename="shelf_engagement_report.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate Excel report: {str(e)}")


@router.get("/reports/export-csv")
def export_shelf_engagement_csv_report(
    store_id: Optional[int] = Query(None, description="Optional store ID filter"),
    db: Session = Depends(get_db),
):
    """
    Gathers real shelf engagement and attractiveness data from PostgreSQL, organizes it into
    a clean pandas DataFrame with calculated metrics, and exports a downloadable CSV file (.csv).
    """
    try:
        data = AttractivenessScoringEngine.calculate_shelf_attractiveness_scores(
            db=db,
            store_id=store_id,
        )
        rankings = data.get("rankings", [])

        rows = []
        for item in rankings:
            recs_str = " | ".join(item.get("recommendations", []))
            rows.append({
                "Rank": item.get("rank", 1),
                "Shelf ID": item.get("shelf_id"),
                "Shelf Zone Name": item.get("shelf_name"),
                "Store ID": item.get("store_id"),
                "Attractiveness Score (0-100)": item.get("attractiveness_score", 0.0),
                "Attention Dwell (seconds)": item.get("attention_duration_seconds", 0.0),
                "Interaction Count": item.get("interaction_count", 0),
                "Unique Visitors": item.get("unique_visitors", 0),
                "Pickup Rate (%)": round(item.get("pickup_rate", 0.0) * 100.0, 1),
                "Conversion Rate (%)": round(item.get("purchase_conversion_rate", 0.0) * 100.0, 1),
                "Repeat Rate (%)": round(item.get("repeat_engagement_rate", 0.0) * 100.0, 1),
                "Key Recommendations": recs_str,
            })

        df = pd.DataFrame(rows)
        file_path = os.path.join(REPORTS_DIR, "shelf_engagement_report.csv")
        df.to_csv(file_path, index=False)

        return FileResponse(
            file_path,
            filename="shelf_engagement_report.csv",
            media_type="text/csv",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate CSV report: {str(e)}")


@router.get("/shelves/{shelf_id}/attractiveness")
def get_single_shelf_attractiveness(
    shelf_id: int,
    db: Session = Depends(get_db),
):
    """
    Returns the weighted Attractiveness Score and 5-metric breakdown for a specific shelf.
    """
    try:
        all_data = AttractivenessScoringEngine.calculate_shelf_attractiveness_scores(db=db)
        shelf_rankings = all_data.get("rankings", [])
        for item in shelf_rankings:
            if item.get("shelf_id") == shelf_id:
                return {
                    "formula": all_data.get("formula"),
                    "shelf": item,
                }
        raise HTTPException(status_code=404, detail="Shelf not found in attractiveness analysis")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving shelf attractiveness: {str(e)}")
