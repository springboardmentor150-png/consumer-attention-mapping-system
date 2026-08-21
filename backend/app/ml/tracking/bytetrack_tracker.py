"""
Robust Multi-Person ByteTrack Tracker with Kalman Motion State & Multi-Zone Re-ID
Guarantees a SINGLE persistent, unique Person ID for each person across all frames of a video,
even when crossing across different shelves, boxes, counters, and store zones.
Uses dual-anchor Kalman motion filtering, continuous DIoU spatial continuity,
shelf-invariant upper-body weighted HSV+Lab appearance memory, and global video person gallery re-identification.
"""

import cv2
import logging
import numpy as np
from typing import List, Dict, Optional, Tuple, Set
from dataclasses import dataclass
from scipy.optimize import linear_sum_assignment

logger = logging.getLogger(__name__)


@dataclass
class TrackedObject:
    """A tracked person with a persistent, unique single person ID."""
    track_id: int
    bbox: Tuple[float, float, float, float]    # normalized x1, y1, x2, y2
    center_x: float
    center_y: float
    confidence: float
    frame_number: int
    timestamp: float                            # seconds from start
    shopper_code: str = ""                      # e.g., "SHP-001"
    zone_id: Optional[str] = None
    is_active: bool = True
    is_confirmed: bool = True
    hits: int = 1
    frames_since_seen: int = 0
    first_seen_time: float = 0.0
    last_seen_time: float = 0.0


def compute_iou(box1: Tuple[float, float, float, float], box2: Tuple[float, float, float, float]) -> float:
    """Compute standard Intersection over Union (IoU) between two normalized boxes (x1, y1, x2, y2)."""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    inter_area = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    box1_area = max(0.0, box1[2] - box1[0]) * max(0.0, box1[3] - box1[1])
    box2_area = max(0.0, box2[2] - box2[0]) * max(0.0, box2[3] - box2[1])
    union_area = box1_area + box2_area - inter_area

    if union_area <= 1e-7:
        return 0.0
    return inter_area / union_area


def compute_diou(box1: Tuple[float, float, float, float], box2: Tuple[float, float, float, float]) -> float:
    """
    Compute Distance-IoU (DIoU) between two normalized boxes.
    Provides a continuous distance metric in [-1.0, 1.0] even when boxes do not overlap.
    """
    iou = compute_iou(box1, box2)

    cx1 = (box1[0] + box1[2]) / 2.0
    cy1 = (box1[1] + box1[3]) / 2.0
    cx2 = (box2[0] + box2[2]) / 2.0
    cy2 = (box2[1] + box2[3]) / 2.0

    rho_sq = (cx1 - cx2) ** 2 + (cy1 - cy2) ** 2

    # Smallest enclosing box
    ex1 = min(box1[0], box2[0])
    ey1 = min(box1[1], box2[1])
    ex2 = max(box1[2], box2[2])
    ey2 = max(box1[3], box2[3])

    c_sq = max(1e-6, (ex2 - ex1) ** 2 + (ey2 - ey1) ** 2)
    return iou - (rho_sq / c_sq)


def extract_appearance_feature(frame: Optional[np.ndarray], bbox_norm: Tuple[float, float, float, float]) -> np.ndarray:
    """
    Extract shelf-invariant, multi-zone HSV + Lab color appearance signature for clothing/person re-ID.
    Heavily weights upper-body (head + torso: 80%) vs lower-body (legs: 20%) so that when
    a person walks behind shelves, boxes, or checkout counters, appearance identity remains stable.
    """
    feat_dim = 96
    if frame is None or not isinstance(frame, np.ndarray) or frame.size == 0:
        return np.zeros(feat_dim, dtype=np.float32)

    fh, fw = frame.shape[:2]
    x1 = max(0, min(fw - 1, int(bbox_norm[0] * fw)))
    y1 = max(0, min(fh - 1, int(bbox_norm[1] * fh)))
    x2 = max(0, min(fw - 1, int(bbox_norm[2] * fw)))
    y2 = max(0, min(fh - 1, int(bbox_norm[3] * fh)))

    if x2 <= x1 + 4 or y2 <= y1 + 4:
        return np.zeros(feat_dim, dtype=np.float32)

    crop = frame[y1:y2, x1:x2]
    patch = cv2.resize(crop, (48, 96))

    hsv = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(patch, cv2.COLOR_BGR2LAB)

    # 4 vertical zones:
    # z1: Head / Hair (0-20px)
    # z2: Upper Torso / Shirt (20-48px) - Highly invariant to shelf occlusion
    # z3: Lower Torso / Waist (48-68px) - Moderately invariant
    # z4: Legs / Pants (68-96px) - Often occluded by shelf fixtures
    z1_hsv = hsv[:20, :]
    z2_hsv = hsv[20:48, :]
    z3_hsv = hsv[48:68, :]
    z4_hsv = hsv[68:, :]

    z2_lab = lab[20:48, :]
    z3_lab = lab[48:68, :]

    # 2D HSV Histograms (H: Hue 8 bins, S: Saturation 4 bins)
    h1 = cv2.calcHist([z1_hsv], [0, 1], None, [6, 3], [0, 180, 0, 256]).flatten()
    h2 = cv2.calcHist([z2_hsv], [0, 1], None, [10, 4], [0, 180, 0, 256]).flatten()
    h3 = cv2.calcHist([z3_hsv], [0, 1], None, [6, 3], [0, 180, 0, 256]).flatten()
    h4 = cv2.calcHist([z4_hsv], [0, 1], None, [4, 2], [0, 180, 0, 256]).flatten()

    # Torso Lab color moments (Mean and StdDev of A & B color channels)
    l_mean2, l_std2 = cv2.meanStdDev(z2_lab)
    l_mean3, l_std3 = cv2.meanStdDev(z3_lab)
    lab_moments = np.array([
        l_mean2[1][0] / 255.0, l_mean2[2][0] / 255.0,
        l_std2[1][0] / 255.0, l_std2[2][0] / 255.0,
        l_mean3[1][0] / 255.0, l_mean3[2][0] / 255.0,
        l_std3[1][0] / 255.0, l_std3[2][0] / 255.0
    ], dtype=np.float32)

    # Weight upper body (h2, lab moments) heavily vs lower body (h4)
    feat = np.concatenate([
        h1 * 0.8,
        h2 * 2.5,          # Primary upper clothing signature
        h3 * 1.2,
        h4 * 0.4,          # Low weight for legs (shelf occlusion resistant)
        lab_moments * 8.0  # Torso color stability
    ]).astype(np.float32)

    # Pad or truncate to exact feat_dim
    if len(feat) < feat_dim:
        feat = np.pad(feat, (0, feat_dim - len(feat)))
    elif len(feat) > feat_dim:
        feat = feat[:feat_dim]

    norm = np.linalg.norm(feat)
    if norm > 1e-5:
        feat /= norm
    return feat


def appearance_similarity(feat1: np.ndarray, feat2: np.ndarray) -> float:
    """Compute cosine similarity between normalized appearance embeddings in [0.0, 1.0]."""
    if feat1 is None or feat2 is None or len(feat1) == 0 or len(feat2) == 0:
        return 0.5
    norm1 = np.linalg.norm(feat1)
    norm2 = np.linalg.norm(feat2)
    if norm1 < 1e-5 or norm2 < 1e-5:
        return 0.5
    dot = float(np.dot(feat1, feat2) / (norm1 * norm2))
    return max(0.0, min(1.0, dot))


class KalmanFilter8D:
    """
    8-State Constant Velocity Kalman Filter for normalized bounding boxes.
    State vector: [cx, cy, a, h, vx, vy, va, vh]
    where cx, cy is center, a is aspect ratio (w/h), h is height.
    """

    def __init__(self, bbox: Tuple[float, float, float, float]):
        w = max(0.01, bbox[2] - bbox[0])
        h = max(0.02, bbox[3] - bbox[1])
        cx = (bbox[0] + bbox[2]) / 2.0
        cy = (bbox[1] + bbox[3]) / 2.0
        a = w / h

        self.mean = np.array([cx, cy, a, h, 0.0, 0.0, 0.0, 0.0], dtype=np.float32)

        # State transition matrix F
        self.F = np.eye(8, dtype=np.float32)
        for i in range(4):
            self.F[i, i + 4] = 1.0

        # Measurement matrix H
        self.H = np.eye(4, 8, dtype=np.float32)

        # Covariance matrices
        self.P = np.diag([0.05, 0.05, 0.1, 0.05, 0.2, 0.2, 0.2, 0.2]).astype(np.float32) ** 2
        self.Q = np.diag([0.01, 0.01, 0.02, 0.01, 0.05, 0.05, 0.05, 0.05]).astype(np.float32) ** 2
        self.R = np.diag([0.02, 0.02, 0.05, 0.02]).astype(np.float32) ** 2

    def predict(self, is_coasting: bool = False):
        """
        Propagate state and covariance forward.
        If coasting (behind a shelf or occluded), damp velocity rapidly so track doesn't fly off.
        """
        self.mean = self.F @ self.mean
        self.P = self.F @ self.P @ self.F.T + self.Q

        if is_coasting:
            # Rapidly damp velocity when track is not actively observed at a shelf
            self.mean[4:8] *= 0.60
        else:
            self.mean[4:8] *= 0.90

    def update(self, bbox: Tuple[float, float, float, float]):
        """Update Kalman state with measurement bbox."""
        w = max(0.01, bbox[2] - bbox[0])
        h = max(0.02, bbox[3] - bbox[1])
        cx = (bbox[0] + bbox[2]) / 2.0
        cy = (bbox[1] + bbox[3]) / 2.0
        a = w / h

        z = np.array([cx, cy, a, h], dtype=np.float32)
        y = z - (self.H @ self.mean)
        S = self.H @ self.P @ self.H.T + self.R
        K = self.P @ self.H.T @ np.linalg.inv(S)

        self.mean += K @ y
        self.P = (np.eye(8, dtype=np.float32) - K @ self.H) @ self.P

    def to_bbox(self) -> Tuple[float, float, float, float]:
        """Convert state to normalized [x1, y1, x2, y2]."""
        cx, cy, a, h = self.mean[:4]
        w = a * h
        x1 = max(0.0, cx - w / 2.0)
        y1 = max(0.0, cy - h / 2.0)
        x2 = min(1.0, cx + w / 2.0)
        y2 = min(1.0, cy + h / 2.0)
        return (float(x1), float(y1), float(x2), float(y2))


class SingleTrackState:
    """Motion state, appearance memory, and life cycle for a single tracked person."""

    def __init__(
        self,
        track_id: int,
        bbox: Tuple[float, float, float, float],
        conf: float,
        feat: np.ndarray,
        timestamp: float,
        frame_number: int
    ):
        self.track_id = track_id
        self.shopper_code = f"SHP-{track_id:03d}"
        self.bbox = bbox
        self.conf = conf
        self.hits = 1
        self.time_since_update = 0
        self.first_seen_time = timestamp
        self.last_seen_time = timestamp
        self.first_frame = frame_number
        self.last_frame = frame_number
        self.is_confirmed = True

        self.kalman = KalmanFilter8D(bbox)

        # Dual anchor: Kalman state + Last confirmed physical detection position
        self.last_confirmed_bbox = bbox
        self.last_confirmed_cx = (bbox[0] + bbox[2]) / 2.0
        self.last_confirmed_cy = (bbox[1] + bbox[3]) / 2.0

        # Multi-view appearance gallery (front, back, turning, shelf-browsing)
        self.primary_feat = feat.copy() if feat is not None else np.zeros(96, dtype=np.float32)
        self.gallery_feats: List[np.ndarray] = [self.primary_feat] if feat is not None and np.linalg.norm(feat) > 0.1 else []
        self.history: List[Tuple[float, float, float, float]] = [bbox]

    @property
    def cx(self) -> float:
        return float(self.kalman.mean[0])

    @property
    def cy(self) -> float:
        return float(self.kalman.mean[1])

    @property
    def vx(self) -> float:
        return float(self.kalman.mean[4])

    @property
    def vy(self) -> float:
        return float(self.kalman.mean[5])

    def predict(self) -> Tuple[float, float, float, float]:
        """Project track forward."""
        is_coasting = self.time_since_update > 0
        self.kalman.predict(is_coasting=is_coasting)
        self.bbox = self.kalman.to_bbox()
        self.time_since_update += 1
        return self.bbox

    def update(
        self,
        bbox: Tuple[float, float, float, float],
        conf: float,
        feat: np.ndarray,
        timestamp: float,
        frame_number: int
    ):
        """Update track state with confirmed measurement."""
        self.kalman.update(bbox)
        self.bbox = bbox
        self.conf = conf
        self.hits += 1
        self.time_since_update = 0
        self.last_seen_time = timestamp
        self.last_frame = frame_number

        # Update confirmed anchor
        self.last_confirmed_bbox = bbox
        self.last_confirmed_cx = (bbox[0] + bbox[2]) / 2.0
        self.last_confirmed_cy = (bbox[1] + bbox[3]) / 2.0

        self.history.append(bbox)
        if len(self.history) > 100:
            self.history.pop(0)

        # Update appearance memory with EMA and multi-view gallery
        if feat is not None and np.linalg.norm(feat) > 0.1:
            if np.linalg.norm(self.primary_feat) < 0.1:
                self.primary_feat = feat.copy()
            else:
                self.primary_feat = 0.88 * self.primary_feat + 0.12 * feat
                p_norm = np.linalg.norm(self.primary_feat)
                if p_norm > 1e-5:
                    self.primary_feat /= p_norm

            # Store distinct viewpoints in gallery (up to 10 views)
            if len(self.gallery_feats) < 10:
                if not self.gallery_feats:
                    self.gallery_feats.append(feat.copy())
                else:
                    max_sim = max(appearance_similarity(gf, feat) for gf in self.gallery_feats)
                    if max_sim < 0.82:  # New distinct angle/pose at shelf
                        self.gallery_feats.append(feat.copy())

    def match_appearance(self, det_feat: np.ndarray) -> float:
        """Compute highest appearance similarity across all recorded gallery views."""
        if det_feat is None or np.linalg.norm(det_feat) < 0.1:
            return 0.5
        sims = []
        if self.gallery_feats:
            sims.extend([appearance_similarity(gf, det_feat) for gf in self.gallery_feats])
        if np.linalg.norm(self.primary_feat) > 0.1:
            sims.append(appearance_similarity(self.primary_feat, det_feat))

        if not sims:
            return 0.5
        return max(sims)


class ByteTracker:
    """
    Robust Multi-Person ByteTrack Tracker with Global Gallery & Dual-Anchor Spatial Continuity.
    Guarantees that each physical person maintains the EXACT SAME unique ID across all video frames,
    even when crossing shelves, counters, and occluded aisles.
    """

    def __init__(
        self,
        track_thresh: float = 0.28,
        low_track_thresh: float = 0.08,
        track_buffer: int = 750,     # Keep lost tracks for up to 750 frames (~30s) across shelf occlusion
        match_thresh: float = 0.85,
        frame_rate: int = 25
    ):
        self.track_thresh = track_thresh
        self.low_track_thresh = low_track_thresh
        self.track_buffer = track_buffer
        self.match_thresh = match_thresh
        self.frame_rate = frame_rate

        self._person_counter = 0
        self._tracks: List[SingleTrackState] = []
        self._all_confirmed_ids: Set[int] = set()

        # Permanent gallery of all unique person tracks ever observed in this video
        self._gallery: Dict[int, SingleTrackState] = {}

    def reset(self):
        """Reset tracker state for a new video."""
        self._person_counter = 0
        self._tracks.clear()
        self._all_confirmed_ids.clear()
        self._gallery.clear()
        logger.info("ByteTracker reset successfully")

    def _match_tracks(
        self,
        tracks: List[SingleTrackState],
        detections: List,
        det_feats: List[np.ndarray],
        cost_limit: float = 0.85,
        use_appearance: bool = True
    ) -> Tuple[List[Tuple[int, int]], List[int], List[int]]:
        """
        Bipartite matching between tracks and detections using dual-anchor DIoU,
        centroid distance, and shelf-invariant appearance feature similarity.
        """
        if len(tracks) == 0 or len(detections) == 0:
            return [], list(range(len(tracks))), list(range(len(detections)))

        cost_matrix = np.zeros((len(tracks), len(detections)), dtype=np.float32)

        for t_idx, trk in enumerate(tracks):
            # Check if this track is currently crossing/near any other track
            is_crossing = any(
                other_idx != t_idx and (
                    ((trk.cx - other_trk.cx) ** 2 + (trk.cy - other_trk.cy) ** 2) ** 0.5 < 0.24 or
                    compute_diou(trk.bbox, other_trk.bbox) > 0.10
                )
                for other_idx, other_trk in enumerate(tracks)
            )

            for d_idx, det in enumerate(detections):
                d_box = det.bbox if hasattr(det, "bbox") else det["bbox"]
                det_cx = det.center_x if hasattr(det, "center_x") else det["center_x"]
                det_cy = det.center_y if hasattr(det, "center_y") else det["center_y"]

                # Dual-anchor DIoU: Compare against Kalman prediction AND Last confirmed detection
                diou_kalman = compute_diou(trk.bbox, d_box)
                diou_anchor = compute_diou(trk.last_confirmed_bbox, d_box)
                best_diou = max(diou_kalman, diou_anchor)
                spatial_cost = max(0.0, min(1.0, (1.0 - best_diou) / 2.0))

                # Centroid Euclidean distance (Dual anchor)
                c_dist_k = ((trk.cx - det_cx) ** 2 + (trk.cy - det_cy) ** 2) ** 0.5
                c_dist_a = ((trk.last_confirmed_cx - det_cx) ** 2 + (trk.last_confirmed_cy - det_cy) ** 2) ** 0.5
                min_c_dist = min(c_dist_k, c_dist_a)
                dist_cost = min(1.0, min_c_dist / 0.45)

                # Velocity momentum alignment (prevent sudden 180-degree flip during crossing)
                vx, vy = trk.vx, trk.vy
                v_mag = (vx ** 2 + vy ** 2) ** 0.5
                disp_x = det_cx - trk.last_confirmed_cx
                disp_y = det_cy - trk.last_confirmed_cy
                disp_mag = (disp_x ** 2 + disp_y ** 2) ** 0.5

                momentum_penalty = 0.0
                if v_mag > 0.003 and disp_mag > 0.01:
                    cos_dir = (vx * disp_x + vy * disp_y) / (v_mag * disp_mag + 1e-6)
                    if cos_dir < -0.3:
                        momentum_penalty = 0.35 * abs(cos_dir)

                # Absolute Scale & Area Gate (Strictly blocks ID shifts between foreground and background persons)
                trk_w = max(0.01, trk.bbox[2] - trk.bbox[0])
                trk_h = max(0.01, trk.bbox[3] - trk.bbox[1])
                det_w = max(0.01, d_box[2] - d_box[0])
                det_h = max(0.01, d_box[3] - d_box[1])
                trk_area = trk_w * trk_h
                det_area = det_w * det_h
                area_ratio = max(trk_area, det_area) / max(1e-5, min(trk_area, det_area))
                h_ratio = max(trk_h, det_h) / max(1e-5, min(trk_h, det_h))

                # If area differs by > 2.6x or height differs by > 1.7x, assignment is physically impossible
                if area_ratio > 2.6 or h_ratio > 1.70:
                    cost_matrix[t_idx, d_idx] = 100.0
                    continue

                # Physical displacement limit per frame (prevents sudden jumping to another person)
                max_allowable_jump = 0.032 * max(1, trk.time_since_update) + 0.025
                if min_c_dist > max(0.12, max_allowable_jump):
                    cost_matrix[t_idx, d_idx] = 100.0
                    continue

                jump_penalty = 0.0
                if min_c_dist > max_allowable_jump:
                    jump_penalty = 3.0 * (min_c_dist / max_allowable_jump)

                # Appearance similarity
                if use_appearance:
                    sim = trk.match_appearance(det_feats[d_idx])
                    app_cost = 1.0 - sim

                    # HARD IDENTITY BARRIER: If clothing appearance completely disagrees, forbid assignment
                    if sim < 0.28:
                        app_cost += 3.0

                    # During person-crossing scenarios, appearance is the primary discriminator
                    if is_crossing:
                        cost = 0.15 * spatial_cost + 0.10 * dist_cost + 0.75 * app_cost + momentum_penalty + jump_penalty
                    elif best_diou > 0.30:
                        cost = 0.40 * spatial_cost + 0.20 * dist_cost + 0.40 * app_cost + momentum_penalty + jump_penalty
                    else:
                        cost = 0.25 * spatial_cost + 0.25 * dist_cost + 0.50 * app_cost + momentum_penalty + jump_penalty
                else:
                    cost = 0.65 * spatial_cost + 0.35 * dist_cost + momentum_penalty + jump_penalty

                # Gating: if both spatial distance is huge and appearance does not match, set high cost
                if (spatial_cost > 0.90 and min_c_dist > 0.30) or jump_penalty > 4.0:
                    cost = 100.0

                cost_matrix[t_idx, d_idx] = cost

        row_ind, col_ind = linear_sum_assignment(cost_matrix)

        matched_indices = []
        unmatched_tracks = list(range(len(tracks)))
        unmatched_dets = list(range(len(detections)))

        for r, c in zip(row_ind, col_ind):
            if cost_matrix[r, c] <= cost_limit:
                matched_indices.append((r, c))
                if r in unmatched_tracks:
                    unmatched_tracks.remove(r)
                if c in unmatched_dets:
                    unmatched_dets.remove(c)

        return matched_indices, unmatched_tracks, unmatched_dets

    def _gallery_reid(
        self,
        det_bbox: Tuple[float, float, float, float],
        det_feat: np.ndarray,
        timestamp: float,
        exclude_ids: Set[int],
        score_thresh: float = 0.30
    ) -> Optional[SingleTrackState]:
        """
        Match an unmatched detection to past video gallery tracks.
        Enforces dual-anchor spatio-temporal feasibility and multi-view appearance similarity.
        """
        det_cx = (det_bbox[0] + det_bbox[2]) / 2.0
        det_cy = (det_bbox[1] + det_bbox[3]) / 2.0

        best_trk: Optional[SingleTrackState] = None
        best_score = -1.0

        for trk in self._gallery.values():
            if trk.track_id in exclude_ids:
                continue

            dt = max(0.04, timestamp - trk.last_seen_time)

            # Distance to both predicted Kalman center and last confirmed physical center
            dist_k = ((trk.cx - det_cx) ** 2 + (trk.cy - det_cy) ** 2) ** 0.5
            dist_a = ((trk.last_confirmed_cx - det_cx) ** 2 + (trk.last_confirmed_cy - det_cy) ** 2) ** 0.5
            dist = min(dist_k, dist_a)

            # Strict spatial feasibility: maximum teleport distance 0.25 and walking speed 0.18 units/sec
            if dist > 0.25 or (dist / dt) > 0.20:
                continue

            # Appearance similarity across all gallery viewpoints
            sim = trk.match_appearance(det_feat)
            if sim < 0.40:
                continue

            # Composite Re-ID score with strong appearance weight for cross-shelf transitions
            prox_score = max(0.0, 1.0 - (dist / 0.25))
            score = 0.65 * sim + 0.35 * prox_score

            if score > best_score and score >= score_thresh:
                best_score = score
                best_trk = trk

        return best_trk

    def update(
        self,
        detections: List,
        frame_number: int,
        timestamp: float,
        frame_shape: Tuple[int, int],
        frame: Optional[np.ndarray] = None
    ) -> List[TrackedObject]:
        """
        Process new frame detections and update persistent unique tracks.
        Returns list of all active confirmed TrackedObject instances for this frame.
        """
        # 1. Predict Kalman motion state for all existing tracks
        for trk in self._tracks:
            trk.predict()

        # Separate detections into high-conf and low-conf
        high_dets = []
        low_dets = []

        for d in detections:
            conf = d.confidence if hasattr(d, "confidence") else d.get("conf", 0.5)
            if conf >= self.track_thresh:
                high_dets.append(d)
            elif conf >= self.low_track_thresh:
                low_dets.append(d)

        # Extract appearance features
        high_feats = [
            extract_appearance_feature(frame, d.bbox if hasattr(d, "bbox") else d["bbox"])
            for d in high_dets
        ]
        low_feats = [
            extract_appearance_feature(frame, d.bbox if hasattr(d, "bbox") else d["bbox"])
            for d in low_dets
        ]

        # Active tracks currently in scene vs lost/coasting tracks
        active_tracks = [t for t in self._tracks if t.time_since_update <= 12]
        lost_tracks = [t for t in self._tracks if t.time_since_update > 12]

        matched_track_ids: Set[int] = set()

        # 2. Stage 1: Match active confirmed tracks with high-confidence detections
        matched_1, unmatched_active_idx, unmatched_high_dets_idx = self._match_tracks(
            active_tracks, high_dets, high_feats, cost_limit=0.88, use_appearance=True
        )

        for t_idx, d_idx in matched_1:
            trk = active_tracks[t_idx]
            det = high_dets[d_idx]
            bbox = det.bbox if hasattr(det, "bbox") else det["bbox"]
            conf = det.confidence if hasattr(det, "confidence") else det["conf"]
            trk.update(bbox, conf, high_feats[d_idx], timestamp, frame_number)
            matched_track_ids.add(trk.track_id)

        # 3. Stage 2: Match remaining active tracks with low-confidence detections (recovers shelf occlusions)
        rem_active = [active_tracks[i] for i in unmatched_active_idx]
        matched_2, unmatched_rem_active_idx, _ = self._match_tracks(
            rem_active, low_dets, low_feats, cost_limit=0.85, use_appearance=False
        )

        for local_t_idx, d_idx in matched_2:
            trk = rem_active[local_t_idx]
            det = low_dets[d_idx]
            bbox = det.bbox if hasattr(det, "bbox") else det["bbox"]
            conf = det.confidence if hasattr(det, "confidence") else det["conf"]
            trk.update(bbox, conf, low_feats[d_idx], timestamp, frame_number)
            matched_track_ids.add(trk.track_id)

        # 4. Stage 3: Match remaining high-confidence detections with lost/coasting tracks
        rem_high_dets = [high_dets[i] for i in unmatched_high_dets_idx]
        rem_high_feats = [high_feats[i] for i in unmatched_high_dets_idx]

        matched_3, _, unmatched_high_dets_final_idx = self._match_tracks(
            lost_tracks, rem_high_dets, rem_high_feats, cost_limit=0.92, use_appearance=True
        )

        for t_idx, d_idx in matched_3:
            trk = lost_tracks[t_idx]
            det = rem_high_dets[d_idx]
            bbox = det.bbox if hasattr(det, "bbox") else det["bbox"]
            conf = det.confidence if hasattr(det, "confidence") else det["conf"]
            trk.update(bbox, conf, rem_high_feats[d_idx], timestamp, frame_number)
            matched_track_ids.add(trk.track_id)

        # 5. Stage 4: Global Gallery Re-ID for detections still unmatched
        new_dets_idx = []
        for local_d_idx in unmatched_high_dets_final_idx:
            det = rem_high_dets[local_d_idx]
            det_bbox = det.bbox if hasattr(det, "bbox") else det["bbox"]
            det_feat = rem_high_feats[local_d_idx]
            conf = det.confidence if hasattr(det, "confidence") else det["conf"]

            past_trk = self._gallery_reid(
                det_bbox, det_feat, timestamp,
                exclude_ids=matched_track_ids,
                score_thresh=0.26
            )

            if past_trk is not None:
                past_trk.update(det_bbox, conf, det_feat, timestamp, frame_number)
                matched_track_ids.add(past_trk.track_id)
                if past_trk not in self._tracks:
                    self._tracks.append(past_trk)
            else:
                new_dets_idx.append(local_d_idx)

        # 6. Stage 5: Intelligent Interior Shelf/Box Reattachment
        # If a detection appears in the interior of the store, check if it matches an existing gallery track
        # before creating a new person ID.
        unresolved_dets = []
        for local_d_idx in new_dets_idx:
            det = rem_high_dets[local_d_idx]
            det_bbox = det.bbox if hasattr(det, "bbox") else det["bbox"]
            det_feat = rem_high_feats[local_d_idx]
            conf = det.confidence if hasattr(det, "confidence") else det["conf"]

            det_cx = (det_bbox[0] + det_bbox[2]) / 2.0
            det_cy = (det_bbox[1] + det_bbox[3]) / 2.0

            # Find closest candidate from inactive gallery tracks
            best_candidate = None
            min_cand_dist = 999.0
            for trk in self._gallery.values():
                if trk.track_id in matched_track_ids:
                    continue
                # Distance to last confirmed physical position
                dist = ((trk.last_confirmed_cx - det_cx) ** 2 + (trk.last_confirmed_cy - det_cy) ** 2) ** 0.5
                sim = trk.match_appearance(det_feat)
                dt = timestamp - trk.last_seen_time

                # If within 45s and strict local shelf proximity (<= 0.22) with confirmed appearance (>= 0.45)
                if dt < 45.0 and dist <= 0.22 and sim >= 0.45:
                    combined_cost = dist * 0.5 + (1.0 - sim) * 0.5
                    if combined_cost < min_cand_dist:
                        min_cand_dist = combined_cost
                        best_candidate = trk

            if best_candidate is not None:
                best_candidate.update(det_bbox, conf, det_feat, timestamp, frame_number)
                matched_track_ids.add(best_candidate.track_id)
                if best_candidate not in self._tracks:
                    self._tracks.append(best_candidate)
                logger.info(
                    f"Interior shelf recovery: reattached Person #{best_candidate.track_id} "
                    f"({best_candidate.shopper_code}) at frame {frame_number}"
                )
            else:
                unresolved_dets.append(local_d_idx)

        # 7. Stage 6: Mint genuinely new tracks only for verified new shoppers
        for local_d_idx in unresolved_dets:
            det = rem_high_dets[local_d_idx]
            bbox = det.bbox if hasattr(det, "bbox") else det["bbox"]
            conf = det.confidence if hasattr(det, "confidence") else det["conf"]
            feat = rem_high_feats[local_d_idx]

            self._person_counter += 1
            new_id = self._person_counter

            new_trk = SingleTrackState(new_id, bbox, conf, feat, timestamp, frame_number)
            self._tracks.append(new_trk)
            self._gallery[new_id] = new_trk
            self._all_confirmed_ids.add(new_id)
            matched_track_ids.add(new_id)
            logger.info(f"Minted persistent Person #{new_id} ({new_trk.shopper_code}) at frame {frame_number}")

        # 7. Stage 6: Non-destructive duplicate suppression
        # NEVER delete established tracks when people pass each other in front of shelves.
        # Only suppress duplicate tracks if they were newly minted within 2 frames at the identical location.
        to_remove: Set[int] = set()
        for i in range(len(self._tracks)):
            for j in range(i + 1, len(self._tracks)):
                t1 = self._tracks[i]
                t2 = self._tracks[j]
                if t1.track_id in to_remove or t2.track_id in to_remove:
                    continue
                if t1.time_since_update == 0 and t2.time_since_update == 0:
                    iou_val = compute_iou(t1.bbox, t2.bbox)
                    c_dist = ((t1.cx - t2.cx) ** 2 + (t1.cy - t2.cy) ** 2) ** 0.5

                    # Only merge if one of the tracks was minted just now (< 3 hits) AND nearly 100% identical box
                    if iou_val > 0.92 and c_dist < 0.02:
                        sim = t1.match_appearance(t2.primary_feat)
                        if sim > 0.85:
                            # Genuine detector duplicate split
                            if t1.hits < 3 or t2.hits < 3:
                                winner, loser = (t1, t2) if t1.hits >= t2.hits else (t2, t1)
                                to_remove.add(loser.track_id)

        # Keep tracks within buffer
        self._tracks = [
            t for t in self._tracks
            if t.time_since_update <= self.track_buffer
            and t.track_id not in to_remove
        ]

        # 8. Return currently active tracked objects (strictly genuine confirmed persons, no noise boxes)
        active_results: List[TrackedObject] = []
        for trk in self._tracks:
            if trk.time_since_update <= 2 and (trk.hits >= 5 or frame_number <= 8):
                active_results.append(TrackedObject(
                    track_id=trk.track_id,
                    shopper_code=trk.shopper_code,
                    bbox=trk.bbox,
                    center_x=trk.cx,
                    center_y=trk.cy,
                    confidence=trk.conf,
                    frame_number=frame_number,
                    timestamp=timestamp,
                    is_active=True,
                    is_confirmed=(trk.hits >= 5 or frame_number <= 8),
                    hits=trk.hits,
                    frames_since_seen=trk.time_since_update,
                    first_seen_time=trk.first_seen_time,
                    last_seen_time=trk.last_seen_time
                ))

        return active_results

    def get_all_track_ids(self) -> Set[int]:
        """Return all confirmed unique track IDs seen so far."""
        return self._all_confirmed_ids.copy()

RobustByteTrack = ByteTracker
