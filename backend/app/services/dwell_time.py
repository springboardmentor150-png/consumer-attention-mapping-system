import time


class DwellTimeTracker:

    def __init__(self):

        self.entry_times = {}
        self.last_seen = {}
        self.dwell_times = {}

        self.minimum_dwell_time = 0.0

        # Increase slightly because your video is crowded
        self.disappear_timeout = 2.0

    def update(self, track_ids, current_time=None):

        if current_time is None:
            current_time = time.time()

        # -------------------------
        # Update active shoppers
        # -------------------------
        for track_id in track_ids:

            if track_id not in self.entry_times:
                self.entry_times[track_id] = current_time

            self.last_seen[track_id] = current_time

            self.dwell_times[track_id] = (
                current_time -
                self.entry_times[track_id]
            )

        finished_sessions = []

        # -------------------------
        # Find exited shoppers
        # -------------------------
        for track_id in list(self.entry_times.keys()):

            if track_id in track_ids:
                continue

            missing_time = (
                current_time -
                self.last_seen[track_id]
            )

            if missing_time < self.disappear_timeout:
                continue

            exit_time = self.last_seen[track_id]

            dwell_time = round(
                exit_time -
                self.entry_times[track_id],
                2
            )

            if dwell_time >= self.minimum_dwell_time:

                finished_sessions.append({

                    "track_id": track_id,

                    "entry_time": self.entry_times[track_id],

                    "exit_time": exit_time,

                    "dwell_time": dwell_time

                })

            self.entry_times.pop(track_id, None)
            self.last_seen.pop(track_id, None)
            self.dwell_times.pop(track_id, None)

        return finished_sessions