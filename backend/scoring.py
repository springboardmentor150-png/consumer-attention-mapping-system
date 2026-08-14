def normalize(value, average):

    if average <= 0:
        return 0

    score = (value / average) * 100

    return min(score, 100)


def calculate_attractiveness_score(
    attention_duration,
    interaction_frequency,
    pickup_rate,
    conversion_rate,
    repeat_engagement,
    store_average_attention,
    store_average_interaction,
    store_average_pickup,
    store_average_conversion,
    store_average_repeat,
):

    attention = normalize(
        attention_duration,
        store_average_attention
    )

    interaction = normalize(
        interaction_frequency,
        store_average_interaction
    )

    pickup = normalize(
        pickup_rate,
        store_average_pickup
    )

    conversion = normalize(
        conversion_rate,
        store_average_conversion
    )

    repeat = normalize(
        repeat_engagement,
        store_average_repeat
    )

    score = (
        attention * 0.35 +
        interaction * 0.25 +
        pickup * 0.20 +
        conversion * 0.15 +
        repeat * 0.05
    )

    return round(score, 2)