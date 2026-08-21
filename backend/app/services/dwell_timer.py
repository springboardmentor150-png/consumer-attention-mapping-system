from datetime import datetime


class DwellTimer:

    def __init__(self):
        self.active = {}

    def person_enter(self, person_id: int, shelf_id: int):
        if person_id not in self.active:
            self.active[person_id] = {
                "entry_time": datetime.now(),
                "shelf_id": shelf_id,
            }

    def person_exit(self, person_id: int):
        if person_id not in self.active:
            return None

        session = self.active.pop(person_id)
        start = session["entry_time"]
        shelf_id = session["shelf_id"]
        end = datetime.now()
        duration = (end - start).total_seconds()
        return start, end, duration, shelf_id
