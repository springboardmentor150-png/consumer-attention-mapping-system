from sqlalchemy.orm import Session

from services.product_scoring_service import calculate_product_scores


def generate_recommendations(db: Session):

    products = calculate_product_scores(db)

    recommendations = []

    for product in products:

        score = product["attractiveness_score"]
        attention = product["attention_duration"]
        pickup_rate = product["pickup_rate"]
        conversion_rate = product["conversion_rate"]

        recommendation = None
        priority = "Low"

        # --------------------------------
        # Rule 1:
        # High attention + zero conversion
        # --------------------------------

        if attention >= 8 and conversion_rate == 0:

            recommendation = (
                "High customer attention but zero conversion. "
                "Consider reviewing product pricing, promotions, "
                "or product presentation."
            )

            priority = "High"

        # --------------------------------
        # Rule 2:
        # High attention + low pickup
        # --------------------------------

        elif attention >= 8 and pickup_rate < 20:

            recommendation = (
                "Customers are spending time near this product "
                "but pickup activity is low. Consider improving "
                "product visibility or shelf presentation."
            )

            priority = "Medium"

        # --------------------------------
        # Rule 3:
        # Very low attractiveness
        # --------------------------------

        elif score < 15:

            recommendation = (
                "Low product attractiveness detected. "
                "Consider improving product placement, visibility, "
                "or promotional activity."
            )

            priority = "Medium"

        # --------------------------------
        # Rule 4:
        # High-performing product
        # --------------------------------

        elif score >= 40:

            recommendation = (
                "Product is performing well. "
                "Consider maintaining its current placement "
                "and promotional strategy."
            )

            priority = "Low"

        # --------------------------------
        # Default
        # --------------------------------

        else:

            recommendation = (
                "Product performance is moderate. "
                "Continue monitoring customer interactions."
            )

            priority = "Low"

        recommendations.append({

            "product_id": product["product_id"],

            "product_name": product["product_name"],

            "attractiveness_score": score,

            "attention_duration": attention,

            "pickup_rate": pickup_rate,

            "conversion_rate": conversion_rate,

            "priority": priority,

            "recommendation": recommendation

        })

    return recommendations