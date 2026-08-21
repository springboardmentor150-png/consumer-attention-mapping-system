from fastapi import APIRouter
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import SessionLocal
from app.models.interaction import CustomerInteraction
from app.services.analytics_service import get_attention_report

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def get_all_interactions():

    db: Session = SessionLocal()

    interactions = db.query(CustomerInteraction).all()

    db.close()

    return interactions


@router.get("/customer/{customer_id}")
def get_customer(customer_id: int):

    db = SessionLocal()

    data = db.query(
        CustomerInteraction
    ).filter(
        CustomerInteraction.customer_id == customer_id
    ).all()

    db.close()

    return data


@router.get("/shelf/{shelf_name}")
def get_shelf(shelf_name: str):

    db = SessionLocal()

    data = db.query(
        CustomerInteraction
    ).filter(
        CustomerInteraction.shelf_name == shelf_name
    ).all()

    db.close()

    return data


@router.get("/summary")
def summary():

    db = SessionLocal()

    total_interactions = db.query(
        CustomerInteraction
    ).count()

    total_customers = db.query(
        func.count(
            func.distinct(CustomerInteraction.customer_id)
        )
    ).scalar()

    average_dwell_time = db.query(
        func.avg(CustomerInteraction.dwell_time)
    ).scalar()

    if average_dwell_time is None:
        average_dwell_time = 0

    db.close()

    return {
        "total_customers": total_customers,
        "total_interactions": total_interactions,
        "average_dwell_time": round(float(average_dwell_time), 2)
    }


@router.get("/attention")
def attention():

    """
    Returns today's shelf attention analytics.
    """

    return get_attention_report()