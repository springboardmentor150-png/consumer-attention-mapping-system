"""
Consumer Behavior Segmenter
Classifies shopper sessions into behavior segments based on analytics features.
Uses rule-based logic + scikit-learn KMeans for explainable segmentation.

Segments:
- Explorer: visits many zones, high dwell time, many products viewed
- Quick Buyer: low dwell time, few zones, targeted movement
- Comparison Shopper: high interaction count, spends time comparing products
- Impulse Buyer: short dwell, high interaction, concentrated zone visits
- Brand Loyal Customer: revisits same zones/products, consistent patterns
"""

import os
import logging
import pickle
import numpy as np
from typing import Optional, Tuple, Dict, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)

BEHAVIOR_MODEL_PATH = os.getenv("BEHAVIOR_MODEL_PATH", "models/behavior_classifier.pkl")


@dataclass
class BehaviorFeatures:
    """Feature vector for behavior classification."""
    total_dwell_time: float       # seconds
    zones_visited_count: int
    products_viewed_count: int
    interactions_count: int
    movement_speed: float         # avg pixels/sec (normalized 0-1)
    repeat_visits: int
    comparison_behavior: bool     # viewed 2+ products in same category
    shelf_visits: int


@dataclass
class BehaviorSegment:
    """Result of behavior classification."""
    segment: str
    reason: str
    confidence: float
    features: Dict[str, Any]


class BehaviorSegmenter:
    """
    Rule-based + ML behavior segmenter.
    Provides explainable segment assignment with reason string.
    """

    SEGMENTS = [
        "Explorer",
        "Quick Buyer",
        "Comparison Shopper",
        "Impulse Buyer",
        "Brand Loyal Customer"
    ]

    def __init__(self):
        self._ml_model = None
        self._load_model()

    def _load_model(self):
        """Try loading pre-trained behavior classifier from disk."""
        if os.path.exists(BEHAVIOR_MODEL_PATH):
            try:
                with open(BEHAVIOR_MODEL_PATH, "rb") as f:
                    self._ml_model = pickle.load(f)
                logger.info(f"Loaded behavior classifier from {BEHAVIOR_MODEL_PATH}")
            except Exception as e:
                logger.warning(f"Could not load behavior model: {e}. Using rule-based fallback.")

    def classify(self, features: BehaviorFeatures) -> BehaviorSegment:
        """
        Classify shopper behavior using rule-based logic.
        Falls back to ML model if available.
        """
        if self._ml_model is not None:
            try:
                return self._ml_classify(features)
            except Exception as e:
                logger.debug(f"ML classify failed, using rules: {e}")

        return self._rule_classify(features)

    def _rule_classify(self, f: BehaviorFeatures) -> BehaviorSegment:
        """
        Rule-based classification with explicit reason strings.
        Rules are designed to be transparent and explainable.
        """
        scores = {seg: 0.0 for seg in self.SEGMENTS}

        # --- Explorer ---
        if f.zones_visited_count >= 4:
            scores["Explorer"] += 2.0
        if f.total_dwell_time > 300:  # 5+ minutes
            scores["Explorer"] += 1.5
        if f.products_viewed_count >= 10:
            scores["Explorer"] += 1.5

        # --- Quick Buyer ---
        if f.total_dwell_time < 120:  # under 2 minutes
            scores["Quick Buyer"] += 2.0
        if f.zones_visited_count <= 2:
            scores["Quick Buyer"] += 1.5
        if f.movement_speed > 0.7:    # fast movement
            scores["Quick Buyer"] += 1.0

        # --- Comparison Shopper ---
        if f.comparison_behavior:
            scores["Comparison Shopper"] += 2.5
        if f.interactions_count >= 5:
            scores["Comparison Shopper"] += 1.5
        if f.products_viewed_count >= 5:
            scores["Comparison Shopper"] += 1.0

        # --- Impulse Buyer ---
        if f.total_dwell_time < 180 and f.interactions_count >= 3:
            scores["Impulse Buyer"] += 2.0
        if f.zones_visited_count <= 3 and f.products_viewed_count >= 3:
            scores["Impulse Buyer"] += 1.5

        # --- Brand Loyal ---
        if f.repeat_visits >= 2:
            scores["Brand Loyal Customer"] += 2.5
        if f.zones_visited_count <= 2 and f.products_viewed_count >= 3:
            scores["Brand Loyal Customer"] += 1.0

        best_segment = max(scores, key=scores.get)
        best_score = scores[best_segment]

        # Normalize confidence (0-1)
        total = sum(scores.values())
        confidence = best_score / total if total > 0 else 0.5

        reason = self._generate_reason(best_segment, f)

        return BehaviorSegment(
            segment=best_segment,
            reason=reason,
            confidence=min(confidence, 0.95),
            features={
                "total_dwell_time": f.total_dwell_time,
                "zones_visited": f.zones_visited_count,
                "products_viewed": f.products_viewed_count,
                "interactions": f.interactions_count,
                "movement_speed": f.movement_speed,
                "repeat_visits": f.repeat_visits,
                "comparison_behavior": f.comparison_behavior
            }
        )

    def _generate_reason(self, segment: str, f: BehaviorFeatures) -> str:
        """Generate human-readable explanation for segment assignment."""
        reasons = {
            "Explorer": (
                f"Shopper visited {f.zones_visited_count} zones with "
                f"{f.total_dwell_time:.0f}s total dwell time and viewed "
                f"{f.products_viewed_count} products — characteristic of broad exploration behavior."
            ),
            "Quick Buyer": (
                f"Shopper completed shopping in {f.total_dwell_time:.0f}s, "
                f"visiting only {f.zones_visited_count} zones — "
                f"indicates targeted, purposeful shopping."
            ),
            "Comparison Shopper": (
                f"Shopper had {f.interactions_count} product interactions and "
                f"{'compared multiple products in the same category' if f.comparison_behavior else 'showed high engagement'} — "
                f"consistent with careful comparison behavior."
            ),
            "Impulse Buyer": (
                f"Shopper made {f.interactions_count} interactions in "
                f"{f.total_dwell_time:.0f}s with limited zone coverage — "
                f"indicates unplanned, impulse-driven purchases."
            ),
            "Brand Loyal Customer": (
                f"Shopper revisited {f.repeat_visits} familiar zones/products "
                f"with consistent, focused movement — "
                f"characteristic of brand-loyal shopping patterns."
            )
        }
        return reasons.get(segment, f"Classified as {segment} based on behavioral metrics.")

    def _ml_classify(self, f: BehaviorFeatures) -> BehaviorSegment:
        """Use loaded ML model for classification."""
        feature_vector = np.array([[
            f.total_dwell_time,
            f.zones_visited_count,
            f.products_viewed_count,
            f.interactions_count,
            f.movement_speed,
            f.repeat_visits,
            int(f.comparison_behavior),
            f.shelf_visits
        ]])
        prediction = self._ml_model.predict(feature_vector)[0]
        proba = self._ml_model.predict_proba(feature_vector)[0]
        confidence = float(np.max(proba))
        segment = self.SEGMENTS[int(prediction)] if isinstance(prediction, (int, np.integer)) else str(prediction)
        reason = self._generate_reason(segment, f)
        return BehaviorSegment(segment=segment, reason=reason, confidence=confidence, features={})


# Singleton
_segmenter: Optional[BehaviorSegmenter] = None


def get_segmenter() -> BehaviorSegmenter:
    global _segmenter
    if _segmenter is None:
        _segmenter = BehaviorSegmenter()
    return _segmenter
