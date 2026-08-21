class ZoneTransition:

    def __init__(self):
        self.previous = {}

    def update(self, person, shelf):
        if person not in self.previous:
            self.previous[person] = shelf
            return None

        if self.previous[person] != shelf:
            old = self.previous[person]
            self.previous[person] = shelf
            return old, shelf

        return None
