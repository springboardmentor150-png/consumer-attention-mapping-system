class ScoringEngine:

    WEIGHTS = {
        "attention": 0.35,
        "interaction": 0.25,
        "pickup": 0.20,
        "conversion": 0.15,
        "repeat": 0.05
    }

    @staticmethod
    def normalize(value, average):

        if average is None or average <= 0:
            return None

        normalized = (value / average) * 100

        return min(max(normalized, 0), 100)

    @staticmethod
    def calculate_score(
        attention_duration,
        interaction_frequency,
        pickup_rate,
        conversion_rate,
        repeat_engagement,
        averages
    ):

        values = {
            "attention": ScoringEngine.normalize(
                attention_duration,
                averages.get("attention", 0)
            ),

            "interaction": ScoringEngine.normalize(
                interaction_frequency,
                averages.get("interaction", 0)
            ),

            "pickup": ScoringEngine.normalize(
                pickup_rate,
                averages.get("pickup", 0)
            ),

            "conversion": ScoringEngine.normalize(
                conversion_rate,
                averages.get("conversion", 0)
            ),

            "repeat": ScoringEngine.normalize(
                repeat_engagement,
                averages.get("repeat", 0)
            )
        }

        weighted_total = 0
        available_weight = 0

        for metric, normalized_value in values.items():

            if normalized_value is not None:

                weight = ScoringEngine.WEIGHTS[metric]

                weighted_total += (
                    normalized_value * weight
                )

                available_weight += weight

        if available_weight == 0:
            return 0

        score = weighted_total / available_weight

        return round(
            min(max(score, 0), 100),
            2
        )