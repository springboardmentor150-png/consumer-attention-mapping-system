"""
face_analyzer.py

InsightFace Face Analyzer

Responsibilities
----------------
1. Detect face inside YOLO person crop
2. Return exact face crop
3. Return 106 facial landmarks
4. Return 68 3D landmarks
5. Return face confidence

Consumer Attention System
"""

import cv2
import numpy as np
from insightface.app import FaceAnalysis


class FaceAnalyzer:

    def __init__(self):

        print("=" * 60)
        print("Loading InsightFace Buffalo_L Model...")
        print("=" * 60)

        self.app = FaceAnalysis(
            name="buffalo_l",
            providers=["CPUExecutionProvider"]
        )

        self.app.prepare(
            ctx_id=0,
            det_size=(320, 320)
        )

        print("✓ InsightFace Loaded Successfully")

    def analyze(self, frame, person_bbox):
        """
        Analyze the face inside a person's bounding box.

        Parameters
        ----------
        frame : np.ndarray

        person_bbox :
            (x1, y1, x2, y2)

        Returns
        -------
        dict | None
        """

        x1, y1, x2, y2 = person_bbox

        width = x2 - x1
        height = y2 - y1
        if width < 120 or height < 120:
            return None

        # Upper body crop only
        upper_crop = frame[
            y1:y1 + int(height * 0.60),
            x1:x2
        ]

        if upper_crop.size == 0:
            return None

        faces = self.app.get(upper_crop)

        if len(faces) == 0:
            return None

        face = max(
            faces,
            key=lambda f: (
                f.bbox[2] - f.bbox[0]
            ) * (
                f.bbox[3] - f.bbox[1]
            )
        )

        fx1, fy1, fx2, fy2 = map(int, face.bbox)

        face_crop = upper_crop[
            fy1:fy2,
            fx1:fx2
        ]

        if face_crop.size == 0:
            return None

        face_bbox = (
            x1 + fx1,
            y1 + fy1,
            x1 + fx2,
            y1 + fy2
        )

        result = {
    "face_crop": face_crop,
    "face_bbox": face_bbox,
    "score": float(face.det_score),
    "kps": face.kps,
    "landmarks_2d": (
        face.landmark_2d_106
        if hasattr(face, "landmark_2d_106")
        else None
    ),
    "landmarks_3d": (
        face.landmark_3d_68
        if hasattr(face, "landmark_3d_68")
        else None
    ),
    "gender": (
        int(face.gender)
        if hasattr(face, "gender")
        else None
    ),
    "age": (
        int(face.age)
        if hasattr(face, "age")
        else None
    )
}

        return result

    def draw_face(self, frame, analysis):
        """
        Draw face bounding box and landmarks.
        """

        if analysis is None:
            return frame

        x1, y1, x2, y2 = analysis["face_bbox"]

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 255),
            2
        )

        landmarks = analysis["landmarks_2d"]

        if landmarks is not None:

            for point in landmarks:

                cv2.circle(
                    frame,
                    (
                        int(point[0]),
                        int(point[1])
                    ),
                    1,
                    (0, 255, 0),
                    -1
                )

        return frame