class ShelfMapper:

    def __init__(self, frame_width=900):

        self.frame_width = frame_width

        self.zones = [("Zone A", 0, 300), ("Zone B", 300, 600), ("Zone C", 600, 900)]

    def get_current_zone(self, person_x):

        for zone, start, end in self.zones:
            if start <= person_x < end:
                return zone

        return "Unknown"

    def get_attention_zone(self, current_zone, direction):

        # Looking down -> not viewing any shelf
        if direction == "DOWN":
            return "None"

        # Looking upward (optional)
        if direction == "UP":
            return "None"

        if current_zone == "Zone A":

            if direction == "RIGHT":
                return "Zone B"

            return "Zone A"

        elif current_zone == "Zone B":

            if direction == "LEFT":
                return "Zone A"

            elif direction == "RIGHT":
                return "Zone C"

            return "Zone B"

        elif current_zone == "Zone C":

            if direction == "LEFT":
                return "Zone B"

            return "Zone C"

        return "Unknown"
