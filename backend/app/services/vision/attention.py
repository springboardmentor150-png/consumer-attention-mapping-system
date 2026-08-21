from app.services.vision.shelf_mapper import LEFT_ZONE, RIGHT_ZONE


class AttentionEngine:
    """
    Determines which shelf is receiving the shopper's attention
    based on head direction.
    """

    def get_attention(self, direction):
        """
        Parameters
        ----------
        direction : str
            LEFT, CENTER or RIGHT

        Returns
        -------
        str
            Canonical zone value for the shelf receiving attention, or
            "No attention" when the shopper faces CENTER — they are looking
            down the walking aisle rather than at either shelf.

            The return value is persisted to analytics.focus, so it stays the
            stored token; the UI applies the display label.
        """

        if direction == "LEFT":
            return LEFT_ZONE

        if direction == "RIGHT":
            return RIGHT_ZONE

        return "No attention"
