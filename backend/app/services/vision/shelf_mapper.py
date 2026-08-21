# Canonical zone values. These exact strings are written to analytics.region
# and analytics.focus, and get_summary() filters on them, so they must not
# change — existing rows would stop being counted. Renaming happens in
# ZONE_LABELS below, which is presentation only.
LEFT_ZONE = "Left Display"
RIGHT_ZONE = "Right Display"

# The band between the two shelf zones is intentionally left unmapped: it is
# walking space, not a shelf. get_shelf() returns None there. The region
# calculation is unchanged — the centre band only gets a name at the point it
# is shown to a user.
AISLE_LABEL = "Walking Aisle"

ZONE_LABELS = {
    LEFT_ZONE: "Shelf A",
    RIGHT_ZONE: "Shelf B",
}


def zone_label(zone):
    """
    User-facing label for a stored zone value.

    None means the shopper was in the centre band, i.e. the walking aisle.
    Unrecognised values are passed through unchanged.
    """

    if zone is None:
        return AISLE_LABEL

    return ZONE_LABELS.get(zone, zone)


class ShelfMapper:
    """
    Defines shelf regions (Regions of Interest - ROI)
    inside the camera frame.
    """

    def __init__(self, frame_width, frame_height):

        self.frame_width = frame_width
        self.frame_height = frame_height

        self.shelves = {
            LEFT_ZONE: (
                0,
                0,
                frame_width // 3,
                frame_height
            ),

            RIGHT_ZONE: (
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
