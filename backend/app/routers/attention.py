"""Attention Analytics Router — Attention events, heatmaps, summaries."""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import AttentionEvent, ShopperSession, Video, Shelf, Product, User
from ..schemas import AttentionSummary, HeatmapData
from ..auth import get_current_user, RoleChecker
from ..services.heatmap_generator import get_heatmap_generator

router = APIRouter(prefix="/api/attention", tags=["Attention"])
any_role = RoleChecker(["Admin", "Store Manager", "Retail Analyst", "Marketing Manager"])

DISCLAIMER = (
    "⚠ Attention metrics are ESTIMATED based on head-pose analysis "
    "(MediaPipe FaceMesh). This is NOT true eye-tracking. "
    "Results should be interpreted as approximate gaze directions."
)


@router.get("/summary")
def attention_summary(
    store_id: Optional[str] = None,
    video_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    """Attention analytics summary for a store/video."""
    query = db.query(AttentionEvent)
    session_query = db.query(ShopperSession)

    if video_id:
        query = query.join(
            ShopperSession, AttentionEvent.session_id == ShopperSession.session_id
        ).filter(ShopperSession.video_id == video_id)
        session_query = session_query.filter(ShopperSession.video_id == video_id)
    elif store_id:
        query = query.join(
            ShopperSession, AttentionEvent.session_id == ShopperSession.session_id
        ).join(
            Video, ShopperSession.video_id == Video.video_id
        ).filter(Video.store_id == store_id)
        session_query = session_query.join(
            Video, ShopperSession.video_id == Video.video_id
        ).filter(Video.store_id == store_id)

    total_events = query.count()
    avg_duration = query.with_entities(
        func.avg(AttentionEvent.duration)
    ).scalar() or 0.0

    total_shoppers = session_query.count()

    # Top shelf by attention
    top_shelf = query.with_entities(
        AttentionEvent.shelf_id,
        func.count(AttentionEvent.event_id).label("cnt")
    ).group_by(AttentionEvent.shelf_id).order_by(func.count(AttentionEvent.event_id).desc()).first()

    # Top product by attention
    top_product = query.with_entities(
        AttentionEvent.product_id,
        func.sum(AttentionEvent.duration).label("total_dur")
    ).filter(AttentionEvent.product_id.isnot(None)).group_by(
        AttentionEvent.product_id
    ).order_by(func.sum(AttentionEvent.duration).desc()).first()

    # Zone-level attention
    zone_attention = query.with_entities(
        AttentionEvent.zone_id,
        func.count(AttentionEvent.event_id).label("events"),
        func.avg(AttentionEvent.duration).label("avg_dur")
    ).group_by(AttentionEvent.zone_id).all()

    zone_data = [
        {
            "zone_id": str(z.zone_id) if z.zone_id else "unknown",
            "events": z.events,
            "avg_duration_seconds": round(float(z.avg_dur or 0), 2)
        }
        for z in zone_attention
    ]

    return {
        "total_attention_events": total_events,
        "avg_attention_duration_seconds": round(float(avg_duration), 2),
        "total_unique_shoppers": total_shoppers,
        "top_shelf_id": str(top_shelf.shelf_id) if top_shelf and top_shelf.shelf_id else None,
        "top_product_id": str(top_product.product_id) if top_product and top_product.product_id else None,
        "zone_attention": zone_data,
        "disclaimer": DISCLAIMER
    }


@router.get("/heatmap")
def get_heatmap(
    store_id: str,
    heatmap_type: str = "traffic",
    video_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    """
    Generate and return heatmap data as a grid of intensity values.
    Types: traffic | attention | product | zone
    """
    generator = get_heatmap_generator()
    video_ids = [video_id] if video_id else None

    if heatmap_type == "traffic":
        data = generator.generate_traffic_heatmap(db, store_id, video_ids)
    elif heatmap_type == "attention":
        data = generator.generate_attention_heatmap(db, store_id, video_ids)
    elif heatmap_type == "zone":
        data = generator.generate_zone_heatmap(db, store_id, video_ids)
    elif heatmap_type == "product":
        data = generator.generate_product_heatmap(db, store_id, video_ids)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown heatmap type: {heatmap_type}")

    data["disclaimer"] = DISCLAIMER
    return data


@router.get("/heatmap/image")
def get_heatmap_image(
    store_id: str,
    heatmap_type: str = "traffic",
    video_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    """Return heatmap as a PNG image (colored with JET colormap)."""
    generator = get_heatmap_generator()
    video_ids = [video_id] if video_id else None

    if heatmap_type == "traffic":
        data = generator.generate_traffic_heatmap(db, store_id, video_ids)
    elif heatmap_type == "attention":
        data = generator.generate_attention_heatmap(db, store_id, video_ids)
    elif heatmap_type == "zone":
        data = generator.generate_zone_heatmap(db, store_id, video_ids)
    else:
        data = generator.generate_product_heatmap(db, store_id, video_ids)

    png_bytes = generator.generate_heatmap_image(data["grid"])
    return Response(content=png_bytes, media_type="image/png")


@router.get("/products")
def product_attention(
    store_id: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    """Per-product attention statistics."""
    query = db.query(
        AttentionEvent.product_id,
        func.count(AttentionEvent.event_id).label("views"),
        func.avg(AttentionEvent.duration).label("avg_dur"),
        func.sum(AttentionEvent.duration).label("total_dur")
    ).filter(AttentionEvent.product_id.isnot(None)).group_by(AttentionEvent.product_id)

    results = query.order_by(func.sum(AttentionEvent.duration).desc()).limit(limit).all()

    output = []
    for row in results:
        product = db.query(Product).filter(Product.product_id == row.product_id).first()
        output.append({
            "product_id": str(row.product_id),
            "product_name": product.product_name if product else "Unknown",
            "category": product.category if product else None,
            "total_views": row.views,
            "avg_attention_duration_seconds": round(float(row.avg_dur or 0), 2),
            "total_attention_duration_seconds": round(float(row.total_dur or 0), 2),
            "disclaimer": "Attention estimated via head-pose"
        })
    return output


@router.get("/shelves")
def shelf_attention(
    store_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    """Per-shelf attention statistics."""
    query = db.query(
        AttentionEvent.shelf_id,
        func.count(AttentionEvent.event_id).label("events"),
        func.avg(AttentionEvent.duration).label("avg_dur"),
        func.sum(AttentionEvent.duration).label("total_dur"),
        func.max(AttentionEvent.duration).label("max_dur")
    ).filter(AttentionEvent.shelf_id.isnot(None)).group_by(AttentionEvent.shelf_id)

    results = query.order_by(func.sum(AttentionEvent.duration).desc()).all()

    output = []
    for row in results:
        shelf = db.query(Shelf).filter(Shelf.shelf_id == row.shelf_id).first()
        if store_id and shelf and str(shelf.store_id) != store_id:
            continue
        output.append({
            "shelf_id": str(row.shelf_id),
            "shelf_name": shelf.shelf_name if shelf else "Unknown",
            "category": shelf.category if shelf else None,
            "total_attention_events": row.events,
            "avg_attention_duration_seconds": round(float(row.avg_dur or 0), 2),
            "total_attention_duration_seconds": round(float(row.total_dur or 0), 2),
            "max_attention_duration_seconds": round(float(row.max_dur or 0), 2)
        })
    return output
