"""
Product Attractiveness Scorer

Implements the exact weighted formula specified:
  Score = 0.35 * attention_duration
        + 0.25 * interaction_frequency
        + 0.20 * pickup_rate
        + 0.15 * purchase_conversion_rate  (DISABLED if no POS data)
        + 0.05 * repeat_engagement_rate

All metrics are normalized to [0, 1] before applying weights.
If purchase data is unavailable, component is excluded and score is labeled
as PARTIAL SCORE — Purchase Data Unavailable.
"""

import logging
import numpy as np
from typing import List, Optional, Dict, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)


# Exact weights per specification
WEIGHT_ATTENTION = 0.35
WEIGHT_INTERACTION = 0.25
WEIGHT_PICKUP = 0.20
WEIGHT_CONVERSION = 0.15
WEIGHT_REPEAT = 0.05


@dataclass
class ProductMetrics:
    """Raw (un-normalized) metrics for a product."""
    product_id: str
    product_name: str
    total_views: int = 0
    total_attention_duration: float = 0.0    # seconds
    interaction_count: int = 0
    pickup_count: int = 0
    purchase_count: int = 0                  # Only if POS data available
    repeat_view_count: int = 0
    total_shoppers: int = 1                  # denominator for rates
    has_purchase_data: bool = False


@dataclass
class ProductAttractivenessScore:
    """Final attractiveness score with component breakdown."""
    product_id: str
    product_name: str

    # Normalized component scores (0-1)
    attention_score: float
    interaction_score: float
    pickup_score: float
    conversion_score: Optional[float]        # None if no POS data
    repeat_engagement_score: float

    # Final weighted score
    attractiveness_score: float
    is_partial: bool                         # True if purchase data missing
    calculation_notes: str

    # Raw values for transparency
    raw_attention_duration: float
    raw_interaction_rate: float
    raw_pickup_rate: float
    raw_conversion_rate: Optional[float]
    raw_repeat_rate: float


class ProductScorer:
    """
    Computes Product Attractiveness Score using the exact weighted formula.
    Handles missing purchase data gracefully by showing partial scores.
    All metrics normalized before weighting for fair comparison.
    """

    def score_product(
        self,
        metrics: ProductMetrics,
        benchmark: Optional["ProductMetricsBenchmark"] = None
    ) -> ProductAttractivenessScore:
        """
        Score a single product.
        
        Args:
            metrics: Raw product metrics
            benchmark: Population-level stats for normalization
            
        Returns:
            ProductAttractivenessScore with full breakdown
        """
        # --- Raw rates ---
        n = max(metrics.total_shoppers, 1)

        raw_attention = metrics.total_attention_duration / n       # avg attention sec per shopper
        raw_interaction = metrics.interaction_count / n            # interactions per shopper
        raw_pickup = metrics.pickup_count / n                      # pickups per shopper
        raw_conversion = (metrics.purchase_count / n
                         if metrics.has_purchase_data else None)
        raw_repeat = metrics.repeat_view_count / n

        # --- Normalize 0-1 ---
        if benchmark:
            att_score = self._normalize(raw_attention, 0, benchmark.max_attention)
            int_score = self._normalize(raw_interaction, 0, benchmark.max_interaction)
            pu_score = self._normalize(raw_pickup, 0, benchmark.max_pickup)
            conv_score = (self._normalize(raw_conversion, 0, benchmark.max_conversion)
                         if raw_conversion is not None else None)
            rep_score = self._normalize(raw_repeat, 0, benchmark.max_repeat)
        else:
            # Without benchmark, use sigmoid normalization
            att_score = self._sigmoid(raw_attention / 30.0)        # 30s reference
            int_score = self._sigmoid(raw_interaction)
            pu_score = self._sigmoid(raw_pickup * 2)
            conv_score = (self._sigmoid(raw_conversion * 5)
                         if raw_conversion is not None else None)
            rep_score = self._sigmoid(raw_repeat)

        # --- Weighted score ---
        if conv_score is not None:
            # Full formula
            score = (
                WEIGHT_ATTENTION * att_score +
                WEIGHT_INTERACTION * int_score +
                WEIGHT_PICKUP * pu_score +
                WEIGHT_CONVERSION * conv_score +
                WEIGHT_REPEAT * rep_score
            )
            is_partial = False
            notes = (
                f"Full score computed. Weights: attention={WEIGHT_ATTENTION}, "
                f"interaction={WEIGHT_INTERACTION}, pickup={WEIGHT_PICKUP}, "
                f"conversion={WEIGHT_CONVERSION}, repeat={WEIGHT_REPEAT}"
            )
        else:
            # Partial formula — redistribute conversion weight proportionally
            total_weight = WEIGHT_ATTENTION + WEIGHT_INTERACTION + WEIGHT_PICKUP + WEIGHT_REPEAT
            w_att = WEIGHT_ATTENTION / total_weight
            w_int = WEIGHT_INTERACTION / total_weight
            w_pu = WEIGHT_PICKUP / total_weight
            w_rep = WEIGHT_REPEAT / total_weight

            score = (
                w_att * att_score +
                w_int * int_score +
                w_pu * pu_score +
                w_rep * rep_score
            )
            is_partial = True
            notes = (
                "PARTIAL SCORE — Purchase Data Unavailable. "
                "The purchase conversion component (15% weight) has been excluded. "
                "Remaining weights have been redistributed proportionally. "
                "To get a full score, integrate POS/transaction data."
            )

        score = round(float(np.clip(score, 0.0, 1.0)), 4)

        return ProductAttractivenessScore(
            product_id=metrics.product_id,
            product_name=metrics.product_name,
            attention_score=round(att_score, 4),
            interaction_score=round(int_score, 4),
            pickup_score=round(pu_score, 4),
            conversion_score=round(conv_score, 4) if conv_score is not None else None,
            repeat_engagement_score=round(rep_score, 4),
            attractiveness_score=score,
            is_partial=is_partial,
            calculation_notes=notes,
            raw_attention_duration=raw_attention,
            raw_interaction_rate=raw_interaction,
            raw_pickup_rate=raw_pickup,
            raw_conversion_rate=raw_conversion,
            raw_repeat_rate=raw_repeat
        )

    def score_products(
        self, products_metrics: List[ProductMetrics]
    ) -> List[ProductAttractivenessScore]:
        """Score multiple products with cross-product normalization."""
        if not products_metrics:
            return []

        # Compute benchmark (max values across all products)
        benchmark = ProductMetricsBenchmark(
            max_attention=max((m.total_attention_duration / max(m.total_shoppers, 1)
                              for m in products_metrics), default=1.0),
            max_interaction=max((m.interaction_count / max(m.total_shoppers, 1)
                                 for m in products_metrics), default=1.0),
            max_pickup=max((m.pickup_count / max(m.total_shoppers, 1)
                            for m in products_metrics), default=1.0),
            max_conversion=max((m.purchase_count / max(m.total_shoppers, 1)
                                for m in products_metrics if m.has_purchase_data), default=1.0),
            max_repeat=max((m.repeat_view_count / max(m.total_shoppers, 1)
                            for m in products_metrics), default=1.0)
        )

        # Ensure no division by zero
        benchmark.max_attention = max(benchmark.max_attention, 0.001)
        benchmark.max_interaction = max(benchmark.max_interaction, 0.001)
        benchmark.max_pickup = max(benchmark.max_pickup, 0.001)
        benchmark.max_conversion = max(benchmark.max_conversion, 0.001)
        benchmark.max_repeat = max(benchmark.max_repeat, 0.001)

        return [self.score_product(m, benchmark) for m in products_metrics]

    @staticmethod
    def _normalize(value: float, min_val: float, max_val: float) -> float:
        """Min-max normalization."""
        if max_val <= min_val:
            return 0.0
        return float(np.clip((value - min_val) / (max_val - min_val), 0.0, 1.0))

    @staticmethod
    def _sigmoid(x: float) -> float:
        """Sigmoid normalization for when no benchmark available."""
        return float(1.0 / (1.0 + np.exp(-x)))


@dataclass
class ProductMetricsBenchmark:
    """Population-level maximums for normalization."""
    max_attention: float = 1.0
    max_interaction: float = 1.0
    max_pickup: float = 1.0
    max_conversion: float = 1.0
    max_repeat: float = 1.0


# Singleton
_scorer: Optional[ProductScorer] = None


def get_scorer() -> ProductScorer:
    global _scorer
    if _scorer is None:
        _scorer = ProductScorer()
    return _scorer
