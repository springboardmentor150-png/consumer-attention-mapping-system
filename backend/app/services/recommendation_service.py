class RecommendationService:

    @staticmethod
    def generate_recommendation(
        shelf_name,
        attractiveness_score,
        total_views,
        total_pickups,
        total_purchases,
        pickup_rate=None,
        conversion_rate=None
    ):
        recommendations = []

        # -------------------------------------------------
        # Calculate rates from raw metrics
        # -------------------------------------------------

        if total_views > 0:
            calculated_pickup_rate = (
                total_pickups / total_views
            )

            calculated_conversion_rate = (
                total_purchases / total_views
            )
        else:
            calculated_pickup_rate = 0.0
            calculated_conversion_rate = 0.0

        # Always use the raw metrics as the source of truth
        pickup_rate = calculated_pickup_rate
        conversion_rate = calculated_conversion_rate

        # -------------------------------------------------
        # Rule 1: Low overall attractiveness
        # Score < 40
        # -------------------------------------------------

        if attractiveness_score < 40:
            recommendations.append({
                "type": "shelf_optimization",
                "priority": "high",
                "message": (
                    "Low overall attractiveness - "
                    "consider repositioning to a higher-traffic shelf zone."
                )
            })

        # -------------------------------------------------
        # Rule 2: High views but low pickup
        # Views > 50 AND pickup rate < 15%
        # -------------------------------------------------

        if (
            total_views > 50
            and pickup_rate < 0.15
        ):
            recommendations.append({
                "type": "product_attractiveness",
                "priority": "medium",
                "message": (
                    "High views but low pickup - "
                    "review packaging, pricing, or shelf label visibility."
                )
            })

        # -------------------------------------------------
        # Rule 3: High pickup but low conversion
        # Pickup rate > 30% AND conversion rate < 10%
        # -------------------------------------------------

        if (
            pickup_rate > 0.30
            and conversion_rate < 0.10
        ):
            recommendations.append({
                "type": "pricing_or_stock",
                "priority": "high",
                "message": (
                    "Shoppers are interested but not buying - "
                    "investigate price point or check for stock issues."
                )
            })

        # -------------------------------------------------
        # Rule 4: No rule triggered
        # -------------------------------------------------

        if not recommendations:
            recommendations.append({
                "type": "no_action",
                "priority": "low",
                "message": (
                    "Product is performing well - "
                    "no immediate action needed."
                )
            })

        return {
            "shelf_name": shelf_name,
            "attractiveness_score": attractiveness_score,
            "total_views": total_views,
            "total_pickups": total_pickups,
            "total_purchases": total_purchases,
            "pickup_rate": round(pickup_rate, 4),
            "conversion_rate": round(conversion_rate, 4),
            "pickup_rate_percentage": round(
                pickup_rate * 100,
                2
            ),
            "conversion_rate_percentage": round(
                conversion_rate * 100,
                2
            ),
            "recommendations": recommendations
        }


recommendation_service = RecommendationService()