class RecommendationEngine:

    def generate_recommendation(self, product):

        score = product["attractiveness_score"]

        attention = product["attention_score"]
        interaction = product["interaction_score"]
        pickup = product["pickup_score"]
        conversion = product["conversion_score"]

        if attention >= 80 and pickup < 20:
            return "High attention but low pickup. Review pricing or promotional offer."

        elif score >= 90:
            return "Top performing product. Maintain current placement."

        elif score >= 70:
            return "Good performance. Consider increasing visibility."

        elif score >= 50:
            return "Average performance. Improve shelf placement."

        else:
            return "Low performance. Consider relocating product or changing strategy."