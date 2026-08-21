import cv2


class PathTracker:

    def __init__(self):
        self.paths = {}

    def update(self, person_id, point):
        if person_id not in self.paths:
            self.paths[person_id] = []
        self.paths[person_id].append(point)

    def draw(self, frame):
        for person_id, pts in self.paths.items():
            for i in range(1, len(pts)):
                cv2.line(
                    frame,
                    pts[i - 1],
                    pts[i],
                    (0, 255, 255),
                    2,
                )
        return frame
