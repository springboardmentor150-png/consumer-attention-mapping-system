"""
attention_confidence.py

Calculates confidence that the shopper is
actually looking at the detected shelf.

Author:
Consumer Attention System
"""

import math


class AttentionConfidence:

    def __init__(self):

        self.MAX_YAW = 45

        self.MAX_PITCH = 30

    # -------------------------------------------------
    # Normalize Value
    # -------------------------------------------------

    def normalize(
        self,
        value,
        maximum
    ):

        score = 1.0 - (abs(value) / maximum)

        return max(0.0, min(score, 1.0))

    # -------------------------------------------------
    # Calculate Confidence
    # -------------------------------------------------

    def calculate(

        self,

        face_score,

        yaw,

        pitch,

        attention

    ):

        # ------------------------------
        # If not looking
        # ------------------------------

        if not attention:

            return 0.0

        # ------------------------------
        # Face Detection Confidence
        # ------------------------------

        face_conf = min(face_score, 1.0)

        # ------------------------------
        # Head Pose Confidence
        # ------------------------------

        yaw_conf = self.normalize(

            yaw,

            self.MAX_YAW

        )

        pitch_conf = self.normalize(

            pitch,

            self.MAX_PITCH

        )

        # ------------------------------
        # Final Weighted Score
        # ------------------------------

        confidence = (

            face_conf * 0.40 +

            yaw_conf * 0.35 +

            pitch_conf * 0.25

        )

        confidence *= 100

        confidence = round(

            confidence,

            2

        )

        return confidence


# -------------------------------------------------
# Test
# -------------------------------------------------

if __name__ == "__main__":

    model = AttentionConfidence()

    confidence = model.calculate(

        face_score=0.93,

        yaw=12,

        pitch=-4,

        attention=True

    )

    print()

    print("Confidence :", confidence)

    print()