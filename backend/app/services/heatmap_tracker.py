class HeatmapTracker:

    def __init__(self):
        self.positions = {}

    def update(self, track_id, x, y):

        if track_id not in self.positions:
            self.positions[track_id] = []

        self.positions[track_id].append((x, y))

    def get_all_points(self):

        points = []

        for shopper_points in self.positions.values():
            points.extend(shopper_points)

        return points
