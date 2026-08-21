from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.services.dashboard_service import dashboard_service


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.get("/")
def get_dashboard(
    db: Session = Depends(get_db)
):

    return dashboard_service.get_dashboard_data(
        db
    )


@router.get("/role/{role}")
def get_role_dashboard(
    role: str,
    db: Session = Depends(get_db)
):

    role = role.lower().strip()

    dashboard = (
        dashboard_service
        .get_dashboard_data(db)
    )

    # -------------------------------------------------
    # STORE MANAGER
    # -------------------------------------------------

    if role == "store_manager":

        return {
            "role": "store_manager",

            "summary": dashboard[
                "summary"
            ],

            "priority_alerts": [
                alert
                for alert in dashboard["alerts"]
                if alert["alert_level"]
                in ["urgent", "warning"]
            ],

            "products": [
                {
                    "shelf_name": product[
                        "shelf_name"
                    ],

                    "attractiveness_score": product[
                        "attractiveness_score"
                    ],

                    "total_views": product[
                        "total_views"
                    ],

                    "total_pickups": product[
                        "total_pickups"
                    ],

                    "total_purchases": product[
                        "total_purchases"
                    ],

                    "recommendations": product[
                        "recommendations"
                    ]
                }
                for product in dashboard["products"]
            ]
        }

    # -------------------------------------------------
    # RETAIL ANALYST
    # -------------------------------------------------

    if role == "retail_analyst":

        return {
            "role": "retail_analyst",

            "summary": dashboard[
                "summary"
            ],

            "products": [
                {
                    "shelf_name": product[
                        "shelf_name"
                    ],

                    "attractiveness_score": product[
                        "attractiveness_score"
                    ],

                    "total_views": product[
                        "total_views"
                    ],

                    "total_pickups": product[
                        "total_pickups"
                    ],

                    "total_purchases": product[
                        "total_purchases"
                    ],

                    "pickup_rate": product[
                        "pickup_rate"
                    ],

                    "pickup_rate_percentage": product[
                        "pickup_rate_percentage"
                    ],

                    "conversion_rate": product[
                        "conversion_rate"
                    ],

                    "conversion_rate_percentage": product[
                        "conversion_rate_percentage"
                    ],

                    "recommendations": product[
                        "recommendations"
                    ]
                }
                for product in dashboard["products"]
            ],

            "alerts": dashboard[
                "alerts"
            ]
        }

    # -------------------------------------------------
    # MARKETING MANAGER
    # -------------------------------------------------

    if role == "marketing_manager":

        return {
            "role": "marketing_manager",

            "summary": dashboard[
                "summary"
            ],

            "products": [
                {
                    "shelf_name": product[
                        "shelf_name"
                    ],

                    "attractiveness_score": product[
                        "attractiveness_score"
                    ],

                    "total_views": product[
                        "total_views"
                    ],

                    "total_pickups": product[
                        "total_pickups"
                    ],

                    "total_purchases": product[
                        "total_purchases"
                    ],

                    "pickup_rate_percentage": product[
                        "pickup_rate_percentage"
                    ],

                    "conversion_rate_percentage": product[
                        "conversion_rate_percentage"
                    ],

                    "recommendations": product[
                        "recommendations"
                    ]
                }
                for product in dashboard["products"]
            ]
        }

    # -------------------------------------------------
    # INVALID ROLE
    # -------------------------------------------------

    raise HTTPException(
        status_code=400,
        detail=(
            "Invalid role. Supported roles: "
            "store_manager, retail_analyst, "
            "marketing_manager"
        )
    )