class AttentionScore:

    def calculate(self, dwell_time, gaze_confidence, face_visible, viewing_angle):
        score = (
            dwell_time * 2
            + gaze_confidence * 35
            + face_visible * 20
            + (100 - abs(viewing_angle))
        ) / 4
        return round(max(0, min(score, 100)), 2)
