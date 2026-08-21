from app.core.database import SessionLocal
from app.models.product_score import ProductScore
from app.models.attention_session import AttentionSession


class ProductScoringService:

    def calculate_score(
        self,
        attention_duration,
        interaction_frequency,
        pickup_rate,
        conversion_rate,
        repeat_engagement,
    ):

        score = (
            attention_duration * 0.35
            + interaction_frequency * 0.25
            + pickup_rate * 0.20
            + conversion_rate * 0.15
            + repeat_engagement * 0.05
        )

        return round(min(score, 100), 2)

    def generate_scores(self):

        db = SessionLocal()

        try:

            sessions = db.query(AttentionSession).all()

            zone_data = {
                "Zone A": {"attention": 0, "interaction": 0},
                "Zone B": {"attention": 0, "interaction": 0},
                "Zone C": {"attention": 0, "interaction": 0},
            }

            for session in sessions:

                if session.zone_a_time > 0:
                    zone_data["Zone A"]["attention"] += session.zone_a_time
                    zone_data["Zone A"]["interaction"] += 1

                if session.zone_b_time > 0:
                    zone_data["Zone B"]["attention"] += session.zone_b_time
                    zone_data["Zone B"]["interaction"] += 1

                if session.zone_c_time > 0:
                    zone_data["Zone C"]["attention"] += session.zone_c_time
                    zone_data["Zone C"]["interaction"] += 1

            max_attention = max(
                (z["attention"] for z in zone_data.values()),
                default=1,
            )

            max_interaction = max(
                (z["interaction"] for z in zone_data.values()),
                default=1,
            )

            db.query(ProductScore).delete()

            for zone, values in zone_data.items():

                attention = (
                    values["attention"] / max_attention * 100
                    if max_attention > 0
                    else 0
                )

                interaction = (
                    values["interaction"] / max_interaction * 100
                    if max_interaction > 0
                    else 0
                )

                # Normalized metrics (0-100)

                pickup = min(attention * 0.75, 100)

                conversion = min(interaction * 0.65, 100)

                repeat = min((attention + interaction) / 2 * 0.30, 100)

                score = self.calculate_score(
                    attention,
                    interaction,
                    pickup,
                    conversion,
                    repeat,
                )

                product = ProductScore(
                    product_name=zone,
                    attention_duration=round(attention, 2),
                    interaction_frequency=round(interaction, 2),
                    pickup_rate=round(pickup, 2),
                    conversion_rate=round(conversion, 2),
                    repeat_engagement=round(repeat, 2),
                    attractiveness_score=score,
                )

                db.add(product)

            db.commit()

        finally:
            db.close()
