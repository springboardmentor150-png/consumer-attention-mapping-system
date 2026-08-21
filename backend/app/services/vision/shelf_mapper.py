class ShelfMapper:
    """
    Defines shelf regions (Regions of Interest - ROI)
    inside the camera frame.
    """

    def __init__(self, frame_width, frame_height):

        self.frame_width = frame_width
        self.frame_height = frame_height

        self.shelves = {
            "Left Display": (
                0,
                0,
                frame_width // 3,
                frame_height
            ),

            "Right Display": (
                (frame_width * 2) // 3,
                0,
                frame_width,
                frame_height
            )
        }

    def get_shelf(self, x, y):
        """
        Returns the shelf containing a given point.
        """

        for shelf_name, (x1, y1, x2, y2) in self.shelves.items():

            if x1 <= x <= x2 and y1 <= y <= y2:
                return shelf_name

        return None

    def get_regions(self):
        return self.shelves