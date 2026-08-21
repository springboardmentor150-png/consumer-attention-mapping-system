class AttentionAnalyzer:
    """
    Determines whether a shopper is looking at
    the shelf they are standing near.
    """

    def __init__(self):
        pass

    def detect_attention(
        self,
        yaw,
        pitch,
        shelf_name
    ):
        """
        Determine attention based on head pose.

        Returns:
            Looking At Shelf
            Looking Away
            Unknown
        """

        if shelf_name == "Unknown":
            return "Unknown"

        # Looking too far up/down
        if abs(pitch) > 30:
            return "Looking Away"

        # Looking too far left/right
        if abs(yaw) > 35:
            return "Looking Away"

        return f"Looking At {shelf_name}"