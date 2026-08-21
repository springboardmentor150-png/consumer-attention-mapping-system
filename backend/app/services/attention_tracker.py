class AttentionTracker:

    def __init__(self):

        self.sessions = {}

    def update(self, track_id, zone, current_time):

        if track_id not in self.sessions:

            self.sessions[track_id] = {
                "last_time": current_time,
                "current_zone": zone,
                "zone_times": {}
            }

        shopper = self.sessions[track_id]

        elapsed = current_time - shopper["last_time"]

        previous_zone = shopper["current_zone"]

        shopper["zone_times"][previous_zone] = (
            shopper["zone_times"].get(previous_zone, 0)
            + elapsed
        )

        shopper["current_zone"] = zone
        shopper["last_time"] = current_time

    def finish_session(self, track_id):

        if track_id not in self.sessions:
            return None

        session = self.sessions.pop(track_id)

        return {
            zone: round(seconds, 2)
            for zone, seconds in session["zone_times"].items()
        }