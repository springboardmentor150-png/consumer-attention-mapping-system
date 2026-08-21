def classify_shopper(
    path_length: float,
    total_dwell_time: float,
    shelf_dwell_time: float,
    gaze_shifts: int,
):

    # Explorer:
    # High movement + high overall dwell time
    if path_length >= 150 and total_dwell_time >= 100:
        return "Explorer"

    # Comparison Shopper:
    # Long shelf dwell + many gaze shifts
    if shelf_dwell_time >= 30 and gaze_shifts >= 5:
        return "Comparison Shopper"

    # Quick Buyer:
    # Short movement + short overall dwell
    if path_length < 80 and total_dwell_time < 60:
        return "Quick Buyer"

    # Default classification
    if total_dwell_time >= 100:
        return "Explorer"

    if shelf_dwell_time >= 30:
        return "Comparison Shopper"

    return "Quick Buyer"
