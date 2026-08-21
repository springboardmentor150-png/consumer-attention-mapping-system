from datetime import datetime


class AttentionTimer:

    def __init__(self):
        self.active = {}

    def update(self, person, shelf):
        key = (person, shelf)
        if key not in self.active:
            self.active[key] = datetime.now()

    def finish(self, person, shelf):
        key = (person, shelf)
        if key not in self.active:
            return 0

        duration = (datetime.now() - self.active[key]).total_seconds()
        del self.active[key]
        return duration
