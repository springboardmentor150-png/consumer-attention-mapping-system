def generate_recommendation(
    attention_duration: float,
    interaction_frequency: float,
    pickup_rate: float,
    conversion_rate: float,
    attractiveness_score: float,
):
    if attention_duration >= 80 and conversion_rate < 20:
        return (
            "High Attention - Low Conversion",
            "High eye attention but low sales. Suggest reviewing pricing or promotional offer."
        )

    if attention_duration >= 80 and pickup_rate < 25:
        return (
            "High Attention - Low Pickup",
            "Customers notice the product but rarely interact with it. Consider improving product presentation."
        )

    if attention_duration < 30:
        return (
            "Low Attention",
            "Low shopper attention detected. Consider improving shelf visibility or product placement."
        )

    if interaction_frequency < 30:
        return (
            "Low Interaction",
            "Product receives limited interaction. Consider promotional displays or repositioning."
        )

    if attractiveness_score >= 80:
        return (
            "High Performer",
            "Strong product performance. Consider maintaining the current placement."
        )

    return (
        "Monitor",
        "Product performance is moderate. Continue monitoring shopper behavior."
    )
