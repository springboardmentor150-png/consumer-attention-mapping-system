"""
shelf_zone.py

Shelf Zone Detection Service

Determines which shelf a shopper is standing in.
Supports both:
1. Default shelf coordinates
2. Loading shelf coordinates from database
"""


class ShelfZone:

    def __init__(self):

        # ---------------------------------
        # Default Shelf Coordinates
        # Used if database is empty
        # ---------------------------------

        self.shelves = {

            "Shelf A": (
                40,
                80,
                260,
                430
            ),

            "Shelf B": (
                300,
                80,
                520,
                430
            ),

            "Shelf C": (
                560,
                80,
                780,
                430
            )

        }

    # -----------------------------------------
    # Load Shelf Coordinates From Database
    # -----------------------------------------

    def load_from_database(self, shelves):

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

    # -----------------------------------------
    # Update Shelf Dictionary
    # -----------------------------------------

    def update_shelves(self, shelves):
        if shelves:

            self.shelves = shelves

    # -----------------------------------------
    # Get Center of Bounding Box
    # -----------------------------------------

    def get_center(
        self,
        x1,
        y1,
        x2,
        y2
    ):

        center_x = int((x1 + x2) / 2)

        center_y = int((y1 + y2) / 2)

        return (
            center_x,
            center_y
        )

    # -----------------------------------------
    # Detect Shelf
    # -----------------------------------------

    def detect_shelf(
        self,
        x1,
        y1,
        x2,
        y2
    ):

        center_x, center_y = self.get_center(
            x1,
            y1,
            x2,
            y2
        )

        for shelf_name, coordinates in self.shelves.items():

            left, top, right, bottom = coordinates

            if (

                left <= center_x <= right

                and

                top <= center_y <= bottom

            ):

                return shelf_name

        return "Unknown"

    # -----------------------------------------
    # Return All Shelves
    # -----------------------------------------

    def get_all_shelves(self):

        return self.shelves

    # -----------------------------------------
    # Add Shelf
    # -----------------------------------------

    def add_shelf(
        self,
        shelf_name,
        coordinates
    ):

        self.shelves[shelf_name] = coordinates

    # -----------------------------------------
    # Remove Shelf
    # -----------------------------------------

    def remove_shelf(
        self,
        shelf_name
    ):

        if shelf_name in self.shelves:

            del self.shelves[shelf_name]


# -----------------------------------------
# Singleton
# -----------------------------------------

shelf_zone = ShelfZone()


# -----------------------------------------
# Test
# -----------------------------------------

if __name__ == "__main__":

    print("\nCurrent Shelf Regions:\n")

    print(shelf_zone.get_all_shelves())

    print()

    shelf = shelf_zone.detect_shelf(

        100,
        100,
        200,
        300

    )

    print("Detected Shelf :", shelf)