from ai.zones import SHELF_ZONES


def get_shelf_zone(center_x, center_y):
    """
    Returns the shelf_id if the point lies inside a shelf zone.
    """

    for shelf_id, (x1, y1, x2, y2) in SHELF_ZONES.items():

        if x1 <= center_x <= x2 and y1 <= center_y <= y2:
            return shelf_id

    return None