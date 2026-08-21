from app.core.database import SessionLocal
from app.models.product_score import ProductScore


class RecommendationService:

    def generate_recommendations(self):

        db = SessionLocal()

        try:

            products = db.query(ProductScore).all()

            recommendations = []

            for product in products:

                messages = []

                # ---------------------------------------
                # Overall attractiveness
                # ---------------------------------------

                if product.attractiveness_score >= 80:

                    messages.append(
                        "Excellent product performance. "
                        "Maintain current placement and stock levels."
                    )

                elif product.attractiveness_score < 30:

                    messages.append(
                        "Low attractiveness score. "
                        "Review product placement and visibility."
                    )

                # ---------------------------------------
                # High attention but low conversion
                # ---------------------------------------

                if product.attention_duration >= 80 and product.conversion_rate < 20:

                    messages.append(
                        "High customer attention but low conversion. "
                        "Review pricing or promotional offers."
                    )

                # ---------------------------------------
                # Low customer attention
                # ---------------------------------------

                if product.attention_duration < 30:

                    messages.append(
                        "Low customer attention. "
                        "Move the product to a more visible shelf."
                    )

                # ---------------------------------------
                # Low interaction
                # ---------------------------------------

                if product.interaction_frequency < 30:

                    messages.append(
                        "Customers rarely interact with this product. "
                        "Improve product placement or visibility."
                    )

                # ---------------------------------------
                # Low pickup rate
                # ---------------------------------------

                if product.pickup_rate < 30:

                    messages.append(
                        "Low pickup activity. "
                        "Consider improving product presentation or promotion."
                    )

                # ---------------------------------------
                # Low repeat engagement
                # ---------------------------------------

                if product.repeat_engagement < 30:

                    messages.append(
                        "Low repeat engagement. "
                        "Consider improving product placement or promotional appeal."
                    )

                # ---------------------------------------
                # Default
                # ---------------------------------------

                if not messages:

                    messages.append(
                        "Product performance is average. "
                        "Continue monitoring customer behavior."
                    )

                # Priority level
                if product.attractiveness_score < 30:
                    priority = "High"
                elif product.attractiveness_score < 60:
                    priority = "Medium"
                else:
                    priority = "Low"

                # Category
                if product.conversion_rate < 20:
                    category = "Pricing"
                elif product.attention_duration < 30:
                    category = "Placement"
                else:
                    category = "General"

                recommendations.append(
                    {
                        "product": product.product_name,
                        "score": product.attractiveness_score,
                        "priority": priority,
                        "category": category,
                        "recommendation": messages,
                    }
                )

            return recommendations

        finally:
            db.close()
