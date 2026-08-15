class ProductScoringEngine:

    def __init__(self):
        self.product_scores = {}

    def calculate_score(
        self,
        product_id,
        attention_duration,
        interaction_frequency,
        pickup_rate,
        conversion_rate,
        repeat_engagement
    ):

        attention = min(attention_duration,100)
        interaction = min(interaction_frequency,100)
        pickup = min(pickup_rate,100)
        conversion = min(conversion_rate,100)
        repeat = min(repeat_engagement,100)

        score = (
            attention * 0.35 +
            interaction * 0.25 +
            pickup * 0.20 +
            conversion * 0.15 +
            repeat * 0.05
        )

        if score >= 90:
            rating = "Excellent"

        elif score >= 70:
            rating = "Good"

        elif score >= 50:
            rating = "Average"

        else:
            rating = "Poor"

        self.product_scores[product_id] = {

            "attention_score": attention,
            "interaction_score": interaction,
            "pickup_score": pickup,
            "conversion_score": conversion,
            "repeat_score": repeat,

            "attractiveness_score": round(score,2),

            "rating": rating

        }

        return score

    def get_product_score(self, product_id):

        return self.product_scores.get(product_id)