"""
Rule-based advice for a scored shelf.

The rules themselves live in services/scoring/health.py, alongside the band
table, so this module, the report zones, the exported PDF/CSV, the stored
notifications and the dashboard all read one playbook. It used to hold its
own four-branch table keyed on the score alone, which meant the advice could
not respond to *why* a shelf was scoring badly — every low-scoring shelf was
told to move to eye level, whether its problem was visibility or price.
"""

from typing import Dict, List, Optional

from app.services.scoring.health import advice_for, health_band


def generate_product_recommendation(
    product_name: str,
    shelf_zone: str,
    attractiveness_score: float,
    metrics: Optional[Dict[str, float]] = None,
) -> Dict:
    """
    Generate recommendations from the Product Attractiveness Score and the
    five inputs that produced it.

    Parameters
    ----------
    product_name : str
        Name of the product.
    shelf_zone : str
        Shelf where the product is placed (e.g., Shelf A, Shelf B).
    attractiveness_score : float
        Final attractiveness score (0-100).
    metrics : dict, optional
        The five formula inputs. Advice is ranked by which of them is costing
        the shelf the most score, so a shelf losing points on price is told
        about price. Omitted only by callers that have a score and nothing
        else, which fall back to advice for the band alone.

    Returns
    -------
    dict
        Recommendation details including priority and suggestions.
    """

    _, priority, _ = health_band(attractiveness_score)

    recommendations: List[str] = advice_for(
        shelf_zone,
        metrics or {},
        attractiveness_score,
    )

    return {
        "product": product_name,
        "shelf": shelf_zone,
        "score": round(attractiveness_score, 2),
        "priority": priority,
        "recommendations": recommendations,
    }
