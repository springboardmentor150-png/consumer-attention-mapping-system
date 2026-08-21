from datetime import datetime

import cv2
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.repositories.heatmap_repository import HeatmapRepository
from app.services.history_heatmap import HistoricalHeatmap

router = APIRouter(tags=["Heatmap"])


@router.get("/latest")
def latest():
    return FileResponse("app/static/heatmaps/latest.png")


@router.get("/statistics")
def statistics():
    return {
        "hot_zone": "Shelf 2",
        "cold_zone": "Shelf 5",
        "visits": 421,
        "average_attention": 83.4,
    }


@router.get("/range")
def heatmap_range(
    start: str = Query(..., description="Start time in ISO format, e.g. 2024-01-01T00:00:00"),
    end: str = Query(..., description="End time in ISO format, e.g. 2024-01-01T23:59:59"),
    shelf_id: int | None = Query(None, description="Optional shelf id to filter by shelf"),
    db: Session = Depends(get_db),
):
    try:
        start_dt = datetime.fromisoformat(start)
        end_dt = datetime.fromisoformat(end)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ISO datetime format for start/end")

    repository = HeatmapRepository(db)
    points = repository.get_range(start_dt, end_dt)

    if shelf_id is not None:
        points = [p for p in points if p.shelf_id == shelf_id]

    if not points:
        raise HTTPException(status_code=404, detail="No heatmap points found for the requested range")

    heatmap = HistoricalHeatmap().create(points, width=1280, height=720)
    success, encoded_image = cv2.imencode(".png", heatmap)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode heatmap image")

    return Response(content=encoded_image.tobytes(), media_type="image/png")
