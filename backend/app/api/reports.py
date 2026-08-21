from fastapi import APIRouter, Depends
from sqlalchemy import func

import csv
import io

from fastapi.responses import StreamingResponse

from app.core.database import SessionLocal
from app.core.dependencies import get_current_user

from app.models.attention_session import AttentionSession
from app.models.product_score import ProductScore

router = APIRouter(prefix="/reports", tags=["Reports"])


# --------------------------------------------------
# Consumer Attention Report
# --------------------------------------------------


@router.get("/attention")
def attention_report(current_user=Depends(get_current_user)):

    db = SessionLocal()

    try:

        sessions = db.query(AttentionSession).order_by(AttentionSession.id.desc()).all()

        total_shoppers = len(sessions)

        average_dwell = db.query(func.avg(AttentionSession.dwell_time)).scalar()

        zone_a = sum(session.zone_a_time or 0 for session in sessions)

        zone_b = sum(session.zone_b_time or 0 for session in sessions)

        zone_c = sum(session.zone_c_time or 0 for session in sessions)

        return {
            "report": "Consumer Attention Report",
            "total_shoppers": total_shoppers,
            "average_dwell": round(average_dwell or 0, 2),
            "attention_by_zone": {
                "Zone A": round(zone_a, 2),
                "Zone B": round(zone_b, 2),
                "Zone C": round(zone_c, 2),
            },
        }

    finally:
        db.close()


# --------------------------------------------------
# Product Engagement Report
# --------------------------------------------------


@router.get("/products")
def product_report(current_user=Depends(get_current_user)):

    db = SessionLocal()

    try:

        products = (
            db.query(ProductScore)
            .order_by(ProductScore.attractiveness_score.desc())
            .all()
        )

        return {
            "report": "Product Engagement Report",
            "products": [
                {
                    "product": product.product_name,
                    "attractiveness_score": product.attractiveness_score,
                    "attention_duration": product.attention_duration,
                    "interaction_frequency": product.interaction_frequency,
                    "pickup_rate": product.pickup_rate,
                    "conversion_rate": product.conversion_rate,
                    "repeat_engagement": product.repeat_engagement,
                }
                for product in products
            ],
        }

    finally:
        db.close()


# --------------------------------------------------
# Shelf Performance Report
# --------------------------------------------------


@router.get("/shelves")
def shelf_report(current_user=Depends(get_current_user)):

    db = SessionLocal()

    try:

        sessions = db.query(AttentionSession).all()

        zone_data = {
            "Zone A": 0,
            "Zone B": 0,
            "Zone C": 0,
        }

        for session in sessions:

            zone_data["Zone A"] += session.zone_a_time or 0

            zone_data["Zone B"] += session.zone_b_time or 0

            zone_data["Zone C"] += session.zone_c_time or 0

        return {
            "report": "Shelf Performance Report",
            "zones": {zone: round(time, 2) for zone, time in zone_data.items()},
        }

    finally:
        db.close()


# --------------------------------------------------
# Conversion Report
# --------------------------------------------------


@router.get("/conversion")
def conversion_report(current_user=Depends(get_current_user)):

    db = SessionLocal()

    try:

        products = db.query(ProductScore).all()

        if not products:
            return {
                "report": "Conversion Report",
                "average_conversion_rate": 0,
                "products": [],
            }

        average_conversion = sum(
            product.conversion_rate or 0 for product in products
        ) / len(products)

        return {
            "report": "Conversion Report",
            "average_conversion_rate": round(average_conversion, 2),
            "products": [
                {
                    "product": product.product_name,
                    "conversion_rate": product.conversion_rate,
                }
                for product in products
            ],
        }

    finally:
        db.close()


# --------------------------------------------------
# Marketing Effectiveness Report
# --------------------------------------------------


@router.get("/marketing")
def marketing_report(current_user=Depends(get_current_user)):

    db = SessionLocal()

    try:

        products = (
            db.query(ProductScore)
            .order_by(ProductScore.attractiveness_score.desc())
            .all()
        )

        return {
            "report": "Marketing Effectiveness Report",
            "products": [
                {
                    "product": product.product_name,
                    "attractiveness_score": product.attractiveness_score,
                    "attention_duration": product.attention_duration,
                    "conversion_rate": product.conversion_rate,
                    "pickup_rate": product.pickup_rate,
                }
                for product in products
            ],
        }

    finally:
        db.close()


# ==================================================
# CSV EXPORT
# ==================================================


@router.get("/export/products")
def export_product_report(current_user=Depends(get_current_user)):

    db = SessionLocal()

    try:

        products = (
            db.query(ProductScore)
            .order_by(ProductScore.attractiveness_score.desc())
            .all()
        )

        # Create CSV in memory
        output = io.StringIO()

        writer = csv.writer(output)

        # CSV header
        writer.writerow(
            [
                "Product",
                "Attractiveness Score",
                "Attention Duration",
                "Interaction Frequency",
                "Pickup Rate",
                "Conversion Rate",
                "Repeat Engagement",
            ]
        )

        # CSV data
        for product in products:

            writer.writerow(
                [
                    product.product_name,
                    product.attractiveness_score,
                    product.attention_duration,
                    product.interaction_frequency,
                    product.pickup_rate,
                    product.conversion_rate,
                    product.repeat_engagement,
                ]
            )

        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": (
                    "attachment; " "filename=product_engagement_report.csv"
                )
            },
        )

    finally:
        db.close()


# --------------------------------------------------
# Export Product Engagement Report
# --------------------------------------------------


@router.get("/export/products")
def export_product_report(current_user=Depends(get_current_user)):

    db = SessionLocal()

    try:

        products = (
            db.query(ProductScore)
            .order_by(ProductScore.attractiveness_score.desc())
            .all()
        )

        output = io.StringIO()

        writer = csv.writer(output)

        # CSV Header
        writer.writerow(
            [
                "Product",
                "Attractiveness Score",
                "Attention Duration",
                "Interaction Frequency",
                "Pickup Rate",
                "Conversion Rate",
                "Repeat Engagement",
            ]
        )

        # CSV Data
        for product in products:

            writer.writerow(
                [
                    product.product_name,
                    product.attractiveness_score,
                    product.attention_duration,
                    product.interaction_frequency,
                    product.pickup_rate,
                    product.conversion_rate,
                    product.repeat_engagement,
                ]
            )

        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=product_engagement_report.csv"
            },
        )

    finally:
        db.close()
