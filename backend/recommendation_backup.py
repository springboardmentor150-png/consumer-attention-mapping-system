def generate_recommendation(
    attention_duration,
    pickup_rate,
    conversion_rate,
    attractiveness_score,
):
    """
    Generate recommendations based on product performance.
    Returns a list of optimization suggestions.
    """

    if attention_duration > 80 and pickup_rate == 0:
        return [
            "High Eye Attention but Low Sales.",
            "Review product pricing.",
            "Consider running promotional offers."
        ]

    elif attractiveness_score < 40:
        return [
            "Low Product Attractiveness.",
            "Improve shelf placement.",
            "Increase product visibility."
        ]

    elif conversion_rate < 20:
        return [
            "Low Conversion Rate.",
            "Review product pricing.",
            "Improve marketing strategy."
        ]

    else:
        return [
            "Product performance is satisfactory."
        ]