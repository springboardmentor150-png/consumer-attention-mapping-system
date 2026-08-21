"""
shelf_regions.py

Stores all shelf regions in image coordinates.

Supports:
1. Default shelf regions
2. Loading shelf regions from database
"""

from typing import Dict, Tuple


class ShelfRegions:

    def __init__(self):

        # -------------------------------------------------
        # Default Shelf Regions
        # (Used if database has no shelf coordinates)
        # -------------------------------------------------

        self.shelves = {

            "Shelf A": (40, 120, 300, 420),

            "Shelf B": (340, 120, 620, 420),

            "Shelf C": (650, 120, 900, 420),

            "Shelf D": (930, 120, 1180, 420)

        }

    # -------------------------------------------------
    # Load Shelf Regions From Database
    # -------------------------------------------------

    def load_from_database(self, shelves):
        """
        Replace current shelf regions
        using values stored in database.
        """

        if not shelves:
            return

        self.shelves.clear()

        for shelf in shelves:

            self.shelves[shelf.name] = (

                shelf.x1,

                shelf.y1,

                shelf.x2,

                shelf.y2

            )

    # -------------------------------------------------
    # Update Shelf Dictionary
    # -------------------------------------------------

    def update_shelves(self, shelves):

        self.shelves = shelves

    # -------------------------------------------------
    # Return All Shelves
    # -------------------------------------------------

    def get_all_shelves(self):

        return self.shelves

    # -------------------------------------------------
    # Return One Shelf
    # -------------------------------------------------

    def get_shelf(self, shelf_name):

        return self.shelves.get(
            shelf_name,
            None
        )

    # -------------------------------------------------
    # Add Shelf
    # -------------------------------------------------

    def add_shelf(
        self,
        shelf_name,
        bbox
    ):

        self.shelves[shelf_name] = bbox

    # -------------------------------------------------
    # Remove Shelf
    # -------------------------------------------------

    def remove_shelf(
        self,
        shelf_name
    ):

        if shelf_name in self.shelves:

            del self.shelves[shelf_name]

    # -------------------------------------------------
    # Point Inside Shelf
    # -------------------------------------------------

    def point_inside_shelf(
        self,
        point,
        shelf_name
    ):

        shelf = self.get_shelf(
            shelf_name
        )

        if shelf is None:

            return False

        px, py = point

        x1, y1, x2, y2 = shelf

        return (

            x1 <= px <= x2

            and

            y1 <= py <= y2

        )

    # -------------------------------------------------
    # Find Shelf Containing Point
    # -------------------------------------------------

    def find_shelf(
        self,
        point
    ):

        px, py = point

        for shelf_name, bbox in self.shelves.items():

            x1, y1, x2, y2 = bbox

            if (

                x1 <= px <= x2

                and

                y1 <= py <= y2

            ):

                return shelf_name

        return None


# -------------------------------------------------
# Test
# -------------------------------------------------

if __name__ == "__main__":

    shelves = ShelfRegions()

    print("\nDefault Shelves\n")

    print(shelves.get_all_shelves())

    print()

    point = (180, 220)

    print("Point :", point)

    print("Shelf :", shelves.find_shelf(point))

    print()

    point = (500, 250)

    print("Point :", point)

    print("Shelf :", shelves.find_shelf(point))