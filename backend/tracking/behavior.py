def classify_shopper(path_length, dwell_time, attention_time):
    """
    Classify shopper based on simple rule-based logic.
    """

    # Explorer
    if path_length > 300 and dwell_time > 30:
        return "Explorer"

    # Comparison Shopper
    elif dwell_time > 20 and attention_time > 15:
        return "Comparison Shopper"

    # Quick Buyer
    elif path_length < 150 and dwell_time < 20:
        return "Quick Buyer"

    return "Regular Shopper"