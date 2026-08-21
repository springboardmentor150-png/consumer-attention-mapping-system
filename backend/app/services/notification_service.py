from sqlalchemy.orm import Session

from app.models.product_score import ProductScore
from app.services.recommendation_service import recommendation_service


class NotificationService:

    @staticmethod
    def get_alerts(db: Session):

        products = (
            db.query(ProductScore)
            .order_by(ProductScore.shelf_name)
            .all()
        )

        alerts = []

        for product in products:

            result = (
                recommendation_service.generate_recommendation(
                    shelf_name=product.shelf_name,
                    attractiveness_score=(
                        product.attractiveness_score or 0
                    ),
                    total_views=(
                        product.total_views or 0
                    ),
                    total_pickups=(
                        product.total_pickups or 0
                    ),
                    total_purchases=(
                        product.total_purchases or 0
                    ),
                    pickup_rate=(
                        product.pickup_rate or 0
                    ),
                    conversion_rate=(
                        product.conversion_rate or 0
                    )
                )
            )

            for recommendation in result["recommendations"]:

                priority = recommendation.get(
                    "priority",
                    "low"
                )

                # No notification for healthy products
                if recommendation["type"] == "no_action":
                    continue

                if priority == "high":
                    alert_level = "urgent"

                elif priority == "medium":
                    alert_level = "warning"

                else:
                    alert_level = "info"

                alerts.append({
                    "shelf_name": product.shelf_name,

                    "alert_level": alert_level,

                    "priority": priority,

                    "type": recommendation.get(
                        "type"
                    ),

                    "message": recommendation.get(
                        "message"
                    ),

                    "attractiveness_score": (
                        product.attractiveness_score or 0
                    ),

                    "total_views": (
                        product.total_views or 0
                    ),

                    "total_pickups": (
                        product.total_pickups or 0
                    ),

                    "total_purchases": (
                        product.total_purchases or 0
                    ),

                    "pickup_rate_percentage": round(
                        (product.pickup_rate or 0) * 100,
                        2
                    ),

                    "conversion_rate_percentage": round(
                        (product.conversion_rate or 0) * 100,
                        2
                    )
                })

        # Urgent alerts first
        alerts.sort(
            key=lambda item: {
                "urgent": 0,
                "warning": 1,
                "info": 2
            }.get(
                item["alert_level"],
                3
            )
        )

        return {
            "total_alerts": len(alerts),

            "urgent_alerts": sum(
                1
                for alert in alerts
                if alert["alert_level"] == "urgent"
            ),

            "warning_alerts": sum(
                1
                for alert in alerts
                if alert["alert_level"] == "warning"
            ),

            "alerts": alerts
        }


notification_service = NotificationService()