def generate_recommendation(
    views,
    pickups,
    purchases,
    attention_duration,
    attractiveness_score,
):
    """
    Generate actionable product optimization recommendations.
    Returns a list of recommendations based on product performance.
    """

    recommendations = []

    # Rule 1: High views but low pickups
    if views >= 80 and pickups <= 10:
        recommendations.append(
            "High views but low pickups — consider repositioning the product."
        )

    # Rule 2: High pickups but low purchases
    if pickups >= 20 and purchases <= 5:
        recommendations.append(
            "Customers pick up the product but rarely purchase it — review pricing or product appeal."
        )

    # Rule 3: High attention but no purchases
    if attention_duration >= 80 and purchases == 0:
        recommendations.append(
            "High customer attention but no purchases — consider promotional offers."
        )

    # Rule 4: Low attractiveness score
    if attractiveness_score < 40:
        recommendations.append(
            "Low product attractiveness — improve shelf placement and product visibility."
        )

    # Rule 5: Good performance
    if not recommendations and attractiveness_score >= 70:
        recommendations.append(
            "Product performance is strong — current placement appears effective."
        )

    # Default recommendation
    if not recommendations:
        recommendations.append(
            "Product performance is satisfactory."
        )

    return recommendations