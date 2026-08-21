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
            Shelf receiving attention.
        """

        if direction == "LEFT":
            return "Left Display"

        if direction == "RIGHT":
            return "Right Display"

        return "No attention"