from sqlalchemy.orm import Session
from sqlalchemy import func

from models import ConsumerTracking




def get_shelf_analytics(db: Session):

    results = (
        db.query(
            ConsumerTracking.shelf_id,
            func.count(ConsumerTracking.id).label("visitors"),
            func.avg(ConsumerTracking.dwell_time).label("avg_dwell")
        )
        .group_by(ConsumerTracking.shelf_id)
        .all()
    )

    analytics = []

    for row in results:

        analytics.append({
            "shelf_id": row.shelf_id,
            "total_visitors": row.visitors,
            "average_dwell_time": round(row.avg_dwell or 0, 2)
        })

    return analytics

def get_dashboard_summary(db):

    total_visitors = db.query(ConsumerTracking).count()

    avg_dwell = (
        db.query(func.avg(ConsumerTracking.dwell_time))
        .scalar()
    ) or 0

    top_shelf = (
        db.query(
            ConsumerTracking.shelf_id,
            func.count(ConsumerTracking.id)
        )
        .group_by(ConsumerTracking.shelf_id)
        .order_by(func.count(ConsumerTracking.id).desc())
        .first()
    )

    return {
        "total_visitors": total_visitors,
        "average_dwell_time": round(avg_dwell, 2),
        "top_shelf": top_shelf[0] if top_shelf else None,
        "current_people": 0
    }


def get_dwell_analytics(db: Session):

    results = (
        db.query(
            ConsumerTracking.shelf_id,
            func.avg(
                ConsumerTracking.dwell_time
            ).label("avg_dwell")
        )
        .group_by(
            ConsumerTracking.shelf_id
        )
        .all()
    )

    dwell_data = []

    for row in results:

        dwell_data.append({

            "shelf_id": row.shelf_id,

            "average_dwell_time": round(
                row.avg_dwell or 0,
                2
            )

        })

    return dwell_data

def get_live_occupancy():

    return {
        "current_people": 0
    }


def get_shelf_performance(db):

    results = (
        db.query(
            ConsumerTracking.shelf_id,
            func.count(ConsumerTracking.id).label("visitors"),
            func.avg(ConsumerTracking.dwell_time).label("avg_dwell")
        )
        .group_by(
            ConsumerTracking.shelf_id
        )
        .all()
    )

    total_visitors = sum(row.visitors for row in results)

    performance = []

    for row in results:

        percentage = (
            (row.visitors / total_visitors) * 100
            if total_visitors > 0 else 0
        )

        performance.append({

            "shelf_id": row.shelf_id,

            "visitors": row.visitors,

            "average_dwell_time": round(
                row.avg_dwell or 0,
                2
            ),

            "percentage": round(
                percentage,
                1
            )

        })

    return performance