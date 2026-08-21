def classify_behavior(
    dwell_time: float,
    shelves_visited: int
):
    """
    Classify shopper behavior.
    """

    # Quick Buyer
    if dwell_time < 10:
        return "Quick Buyer"

    # Explorer
    elif dwell_time >= 25 and shelves_visited >= 2:
        return "Explorer"

    # Comparison Shopper
    else:
        return "Comparison Shopper"