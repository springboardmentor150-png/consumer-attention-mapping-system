from sqlalchemy.orm import Session

from app.models.product_score import ProductScore
from app.services.recommendation_service import recommendation_service
from app.services.notification_service import notification_service


class DashboardService:

    @staticmethod
    def get_dashboard_data(db: Session):

        products = (
            db.query(ProductScore)
            .order_by(ProductScore.shelf_name)
            .all()
        )

        product_data = []

        total_products = len(products)

        total_views = 0
        total_pickups = 0
        total_purchases = 0

        high_priority_count = 0
        medium_priority_count = 0
        low_priority_count = 0

        # -------------------------------------------------
        # PRODUCT PERFORMANCE
        # -------------------------------------------------

        for product in products:

            views = product.total_views or 0
            pickups = product.total_pickups or 0
            purchases = product.total_purchases or 0

            total_views += views
            total_pickups += pickups
            total_purchases += purchases

            recommendation = (
                recommendation_service
                .generate_recommendation(
                    shelf_name=product.shelf_name,

                    attractiveness_score=(
                        product.attractiveness_score or 0
                    ),

                    total_views=views,

                    total_pickups=pickups,

                    total_purchases=purchases,

                    pickup_rate=(
                        product.pickup_rate or 0
                    ),

                    conversion_rate=(
                        product.conversion_rate or 0
                    )
                )
            )

            recommendations = recommendation[
                "recommendations"
            ]

            for item in recommendations:

                priority = item.get(
                    "priority",
                    "low"
                )

                if priority == "high":
                    high_priority_count += 1

                elif priority == "medium":
                    medium_priority_count += 1

                else:
                    low_priority_count += 1

            product_data.append({

                "shelf_name": product.shelf_name,

                "attractiveness_score": (
                    product.attractiveness_score or 0
                ),

                "total_views": views,

                "total_pickups": pickups,

                "total_purchases": purchases,

                "pickup_rate": (
                    product.pickup_rate or 0
                ),

                "conversion_rate": (
                    product.conversion_rate or 0
                ),

                "pickup_rate_percentage": round(
                    (product.pickup_rate or 0) * 100,
                    2
                ),

                "conversion_rate_percentage": round(
                    (product.conversion_rate or 0) * 100,
                    2
                ),

                "recommendations": recommendations
            })

        # -------------------------------------------------
        # OVERALL RATES
        # -------------------------------------------------

        if total_views > 0:

            overall_pickup_rate = (
                total_pickups / total_views
            )

            overall_conversion_rate = (
                total_purchases / total_views
            )

        else:

            overall_pickup_rate = 0

            overall_conversion_rate = 0

        # -------------------------------------------------
        # NOTIFICATIONS
        # -------------------------------------------------

        notifications = (
            notification_service
            .get_alerts(db)
        )

        # -------------------------------------------------
        # FINAL DASHBOARD RESPONSE
        # -------------------------------------------------

        return {

            "summary": {

                "total_products": (
                    total_products
                ),

                "total_views": (
                    total_views
                ),

                "total_pickups": (
                    total_pickups
                ),

                "total_purchases": (
                    total_purchases
                ),

                "overall_pickup_rate": round(
                    overall_pickup_rate,
                    4
                ),

                "overall_pickup_rate_percentage": round(
                    overall_pickup_rate * 100,
                    2
                ),

                "overall_conversion_rate": round(
                    overall_conversion_rate,
                    4
                ),

                "overall_conversion_rate_percentage": round(
                    overall_conversion_rate * 100,
                    2
                ),

                "high_priority_issues": (
                    high_priority_count
                ),

                "medium_priority_issues": (
                    medium_priority_count
                ),

                "low_priority_issues": (
                    low_priority_count
                ),

                "urgent_alerts": (
                    notifications[
                        "urgent_alerts"
                    ]
                ),

                "warning_alerts": (
                    notifications[
                        "warning_alerts"
                    ]
                )
            },

            "products": product_data,

            "alerts": notifications[
                "alerts"
            ]
        }


dashboard_service = DashboardService()