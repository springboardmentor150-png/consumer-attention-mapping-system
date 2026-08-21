from sqlalchemy.orm import Session
from sqlalchemy import func

from models import Product, ProductInteraction, ConsumerTracking


def calculate_product_scores(db: Session):

    products = db.query(Product).all()

    results = []

    for product in products:

        # ---------------------------------
        # 1. Views / Attention
        # ---------------------------------

        view_count = (
            db.query(ProductInteraction)
            .filter(
                ProductInteraction.product_id == product.id,
                ProductInteraction.interaction_type == "view"
            )
            .count()
        )

        # ---------------------------------
        # 2. Pickup count
        # ---------------------------------

        pickup_count = (
            db.query(ProductInteraction)
            .filter(
                ProductInteraction.product_id == product.id,
                ProductInteraction.interaction_type == "pickup"
            )
            .count()
        )

        # ---------------------------------
        # 3. Purchase count
        # ---------------------------------

        purchase_count = (
            db.query(ProductInteraction)
            .filter(
                ProductInteraction.product_id == product.id,
                ProductInteraction.interaction_type == "purchase"
            )
            .count()
        )

        # ---------------------------------
        # 4. Interaction frequency
        # ---------------------------------

        total_interactions = (
            db.query(ProductInteraction)
            .filter(
                ProductInteraction.product_id == product.id
            )
            .count()
        )

        # ---------------------------------
        # 5. Pickup rate
        # ---------------------------------

        pickup_rate = (
            (pickup_count / view_count) * 100
            if view_count > 0
            else 0
        )

        # ---------------------------------
        # 6. Conversion rate
        # ---------------------------------

        conversion_rate = (
            (purchase_count / pickup_count) * 100
            if pickup_count > 0
            else 0
        )

        # ---------------------------------
        # 7. Attention Duration
        # ---------------------------------

        tracking_data = (
            db.query(
                func.avg(ConsumerTracking.dwell_time)
            )
            .filter(
                ConsumerTracking.shelf_id == product.shelf_id
            )
            .scalar()
        )

        attention_duration = (
            tracking_data or 0
        )

        # ---------------------------------
        # 8. Repeat Engagement
        # ---------------------------------

        unique_viewers = (
            db.query(
                func.count(
                    func.distinct(
                        ProductInteraction.tracker_id
                    )
                )
            )
            .filter(
                ProductInteraction.product_id == product.id,
                ProductInteraction.interaction_type == "view"
            )
            .scalar()
        ) or 0

        repeat_viewers = (
            db.query(
                func.count(
                    func.distinct(
                        ProductInteraction.tracker_id
                    )
                )
            )
            .filter(
                ProductInteraction.product_id == product.id
            )
            .group_by(
                ProductInteraction.tracker_id
            )
            .having(
                func.count(ProductInteraction.id) > 1
            )
            .count()
        )

        repeat_engagement = (
            (repeat_viewers / unique_viewers) * 100
            if unique_viewers > 0
            else 0
        )

        # ---------------------------------
        # Normalize attention
        # ---------------------------------

        attention_score = min(
            attention_duration * 2,
            100
        )

        # ---------------------------------
        # Normalize interaction frequency
        # ---------------------------------

        interaction_score = min(
            total_interactions * 10,
            100
        )

        # ---------------------------------
        # Final weighted score
        # ---------------------------------

        attractiveness_score = (

            attention_score * 0.35

            + interaction_score * 0.25

            + pickup_rate * 0.20

            + conversion_rate * 0.15

            + repeat_engagement * 0.05
        )

        results.append({

            "product_id": product.id,

            "product_name": product.product_name,

            "attention_duration": round(
                attention_duration,
                2
            ),

            "interaction_frequency": total_interactions,

            "pickup_rate": round(
                pickup_rate,
                2
            ),

            "conversion_rate": round(
                conversion_rate,
                2
            ),

            "repeat_engagement": round(
                repeat_engagement,
                2
            ),

            "attractiveness_score": round(
                min(attractiveness_score, 100),
                2
            )
        })

    return results