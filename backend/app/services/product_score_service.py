from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.product_score import ProductScore
from app.models.interaction import CustomerInteraction
from app.models.shopper_attention import ShopperAttention


class ProductScoreService:

    WEIGHTS = {
        "attention": 0.35,
        "interaction": 0.25,
        "pickup": 0.20,
        "conversion": 0.15,
        "repeat": 0.05,
    }

    @staticmethod
    def get_shelf_metrics(db: Session, shelf_name: str):

        interaction_result = (
            db.query(
                func.sum(CustomerInteraction.dwell_time),
                func.count(CustomerInteraction.id)
            )
            .filter(
                CustomerInteraction.shelf_name == shelf_name
            )
            .first()
        )

        total_dwell = float(
            interaction_result[0] or 0
        )

        interaction_frequency = int(
            interaction_result[1] or 0
        )

        attention_result = (
            db.query(
                func.count(ShopperAttention.id)
            )
            .filter(
                ShopperAttention.shelf_name == shelf_name
            )
            .filter(
                ShopperAttention.attention.ilike("%Looking At%")
            )
            .scalar()
        )

        attention_count = int(
            attention_result or 0
        )

        return {
            "attention_duration": total_dwell,
            "interaction_frequency": interaction_frequency,
            "pickup_rate": 0.0,
            "conversion_rate": 0.0,
            "repeat_engagement": 0.0,
            "attention_count": attention_count
        }

    @staticmethod
    def get_store_averages(db: Session):

        products = (
            db.query(ProductScore)
            .all()
        )

        if not products:
            return {
                "attention": 0,
                "interaction": 0,
                "pickup": 0,
                "conversion": 0,
                "repeat": 0
            }

        attention_values = [
            float(p.attention_duration or 0)
            for p in products
            if float(p.attention_duration or 0) > 0
        ]

        interaction_values = [
            float(p.interaction_frequency or 0)
            for p in products
            if float(p.interaction_frequency or 0) > 0
        ]

        pickup_values = [
            float(p.pickup_rate or 0)
            for p in products
            if float(p.pickup_rate or 0) > 0
        ]

        conversion_values = [
            float(p.conversion_rate or 0)
            for p in products
            if float(p.conversion_rate or 0) > 0
        ]

        repeat_values = [
            float(p.repeat_engagement or 0)
            for p in products
            if float(p.repeat_engagement or 0) > 0
        ]

        return {
            "attention": (
                sum(attention_values) / len(attention_values)
                if attention_values else 0
            ),
            "interaction": (
                sum(interaction_values) / len(interaction_values)
                if interaction_values else 0
            ),
            "pickup": (
                sum(pickup_values) / len(pickup_values)
                if pickup_values else 0
            ),
            "conversion": (
                sum(conversion_values) / len(conversion_values)
                if conversion_values else 0
            ),
            "repeat": (
                sum(repeat_values) / len(repeat_values)
                if repeat_values else 0
            )
        }

    @staticmethod
    def calculate_product_score(
        db: Session,
        product: ProductScore
    ):

        products = (
            db.query(ProductScore)
            .all()
        )

        max_attention = max(
            [
                float(p.attention_duration or 0)
                for p in products
            ] + [0.0]
        )

        max_interaction = max(
            [
                float(p.interaction_frequency or 0)
                for p in products
            ] + [0.0]
        )

        attention_duration = float(
            product.attention_duration or 0
        )

        interaction_frequency = float(
            product.interaction_frequency or 0
        )

        pickup_rate = min(
            max(float(product.pickup_rate or 0), 0.0),
            1.0
        )

        conversion_rate = min(
            max(float(product.conversion_rate or 0), 0.0),
            1.0
        )

        repeat_engagement = min(
            max(float(product.repeat_engagement or 0), 0.0),
            1.0
        )

        if max_attention > 0:
            norm_attention = (
                attention_duration / max_attention
            )
        else:
            norm_attention = 0.0

        if max_interaction > 0:
            norm_interaction = (
                interaction_frequency / max_interaction
            )
        else:
            norm_interaction = 0.0

        score = (
            ProductScoreService.WEIGHTS["attention"]
            * norm_attention
            + ProductScoreService.WEIGHTS["interaction"]
            * norm_interaction
            + ProductScoreService.WEIGHTS["pickup"]
            * pickup_rate
            + ProductScoreService.WEIGHTS["conversion"]
            * conversion_rate
            + ProductScoreService.WEIGHTS["repeat"]
            * repeat_engagement
        )

        product.attractiveness_score = round(
            score * 100,
            2
        )

        return product

    @staticmethod
    def recalculate_all_scores(db: Session):

        products = (
            db.query(ProductScore)
            .all()
        )

        if not products:
            return []

        max_attention = max(
            [
                float(p.attention_duration or 0)
                for p in products
            ] + [0.0]
        )

        max_interaction = max(
            [
                float(p.interaction_frequency or 0)
                for p in products
            ] + [0.0]
        )

        for product in products:

            attention_duration = float(
                product.attention_duration or 0
            )

            interaction_frequency = float(
                product.interaction_frequency or 0
            )

            if max_attention > 0:
                norm_attention = (
                    attention_duration / max_attention
                )
            else:
                norm_attention = 0.0

            if max_interaction > 0:
                norm_interaction = (
                    interaction_frequency / max_interaction
                )
            else:
                norm_interaction = 0.0

            pickup_rate = min(
                max(float(product.pickup_rate or 0), 0.0),
                1.0
            )

            conversion_rate = min(
                max(float(product.conversion_rate or 0), 0.0),
                1.0
            )

            repeat_engagement = min(
                max(float(product.repeat_engagement or 0), 0.0),
                1.0
            )

            score = (
                ProductScoreService.WEIGHTS["attention"]
                * norm_attention
                + ProductScoreService.WEIGHTS["interaction"]
                * norm_interaction
                + ProductScoreService.WEIGHTS["pickup"]
                * pickup_rate
                + ProductScoreService.WEIGHTS["conversion"]
                * conversion_rate
                + ProductScoreService.WEIGHTS["repeat"]
                * repeat_engagement
            )

            product.attractiveness_score = round(
                score * 100,
                2
            )

        db.commit()

        for product in products:
            db.refresh(product)

        return products

    @staticmethod
    def create_product_score(
        db: Session,
        data
    ):

        product = (
            db.query(ProductScore)
            .filter(
                ProductScore.shelf_name == data.shelf_name
            )
            .first()
        )

        if product is None:

            product = ProductScore(
                shelf_name=data.shelf_name
            )

            db.add(product)

        product.attention_duration = data.attention_duration
        product.interaction_frequency = data.interaction_frequency

        product.total_views = data.total_views
        product.total_pickups = data.total_pickups
        product.total_purchases = data.total_purchases

        # Calculate rates from raw metrics
        if data.total_views > 0:

            product.pickup_rate = (
                data.total_pickups / data.total_views
            )

            product.conversion_rate = (
                data.total_purchases / data.total_views
            )

        else:

            product.pickup_rate = 0.0
            product.conversion_rate = 0.0

        product.repeat_engagement = data.repeat_engagement

        db.commit()
        db.refresh(product)

        ProductScoreService.recalculate_all_scores(db)

        db.refresh(product)

        return product

    @staticmethod
    def get_all_scores(db: Session):

        return (
            db.query(ProductScore)
            .all()
        )


product_score_service = ProductScoreService()