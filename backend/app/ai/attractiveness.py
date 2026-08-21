def calculate_attractiveness_score(
    attention_duration: float,
    interaction_frequency: float,
    pickup_rate: float,
    conversion_rate: float,
    repeat_engagement: float,
):
    score = (
        (attention_duration * 0.35)
        + (interaction_frequency * 0.25)
        + (pickup_rate * 0.20)
        + (conversion_rate * 0.15)
        + (repeat_engagement * 0.05)
    )

    score = max(0, min(score, 100))
    return round(score, 2)
