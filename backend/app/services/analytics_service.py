from datetime import date

from sqlalchemy import func

from app.core.database import SessionLocal
from app.models.interaction import CustomerInteraction


def save_interaction(
    customer_id,
    shelf_name,
    entry_time,
    exit_time,
    dwell_time,
):
    """
    Save a customer interaction into the database.
    """

    db = SessionLocal()

    try:

        interaction = CustomerInteraction(
            customer_id=customer_id,
            shelf_name=shelf_name,
            entry_time=entry_time,
            exit_time=exit_time,
            dwell_time=dwell_time,
        )

        db.add(interaction)

        db.commit()

        print("Saved to Database")

    except Exception as e:

        db.rollback()

        print("Database Error:", e)

    finally:

        db.close()


def get_attention_report():
    """
    Generate today's shelf attention analytics.

    Returns:
    {
        "date": "2026-07-26",
        "top_shelf": "Shelf A",
        "total_attention_seconds": 120.5,
        "data": [
            {
                "shelf": "Shelf A",
                "duration": 65.2
            },
            {
                "shelf": "Shelf B",
                "duration": 55.3
            }
        ]
    }
    """

    db = SessionLocal()

    try:

        report = (
            db.query(
                CustomerInteraction.shelf_name,
                func.sum(CustomerInteraction.dwell_time).label("total_duration"),
            )
            .filter(
                func.date(CustomerInteraction.entry_time) == date.today()
            )
            .group_by(CustomerInteraction.shelf_name)
            .order_by(
                func.sum(CustomerInteraction.dwell_time).desc()
            )
            .all()
        )

        data = []

        total_attention = 0

        top_shelf = None

        for row in report:

            duration = float(row.total_duration)

            total_attention += duration

            if top_shelf is None:
                top_shelf = row.shelf_name

            data.append(
                {
                    "shelf": row.shelf_name,
                    "duration": round(duration, 2),
                }
            )

        return {
            "date": str(date.today()),
            "top_shelf": top_shelf,
            "total_attention_seconds": round(total_attention, 2),
            "data": data,
        }

    except Exception as e:

        print("Analytics Error:", e)

        return {
            "date": str(date.today()),
            "top_shelf": None,
            "total_attention_seconds": 0,
            "data": [],
        }

    finally:

        db.close()