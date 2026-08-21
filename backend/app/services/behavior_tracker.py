from collections import defaultdict
from datetime import datetime
import math


class BehaviorTracker:

    def __init__(self):

        self.sessions = {}

    def update(self, track_id, center, shelf_name):

        if track_id not in self.sessions:

            self.sessions[track_id] = {

                "entry_time": datetime.now(),

                "points": [],

                "shelves": set(),

            }

        session = self.sessions[track_id]

        session["points"].append(center)

        if shelf_name:

            session["shelves"].add(shelf_name)

    def finish(self, track_id):

        if track_id not in self.sessions:
            return None

        session = self.sessions.pop(track_id)

        exit_time = datetime.now()

        dwell_time = (
            exit_time - session["entry_time"]
        ).total_seconds()

        path_length = self.calculate_path(session["points"])

        shelves = len(session["shelves"])

        segment = self.classify(
            dwell_time,
            path_length,
            shelves
        )

        return {

            "track_id": track_id,

            "entry_time": session["entry_time"],

            "exit_time": exit_time,

            "dwell_time": dwell_time,

            "path_length": path_length,

            "shelves_visited": shelves,

            "behavior_segment": segment

        }

    def calculate_path(self, points):

        total = 0

        for i in range(1, len(points)):

            x1, y1 = points[i-1]

            x2, y2 = points[i]

            total += math.sqrt(
                (x2-x1)**2 +
                (y2-y1)**2
            )

        return total

    def classify(
    self,
    dwell_time,
    path_length,
    shelves
):

        if path_length > 500 and dwell_time > 40:

            return "Explorer"

        elif path_length < 150 and dwell_time < 20:

            return "Quick Buyer"

        else:

            return "Comparison Shopper"