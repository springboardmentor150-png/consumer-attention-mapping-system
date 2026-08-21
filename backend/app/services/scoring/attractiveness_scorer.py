from uuid import UUID
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from app.models.attractiveness_score import ProductAttractivenessScore

class ProductAttractivenessScorer:
    WEIGHTS = {
        "attention_duration": 0.35,
        "interaction_frequency": 0.25,
        "pickup_rate": 0.20,
        "conversion_rate": 0.15,
        "repeat_engagement": 0.05
    }
    MAX_ATTENTION_SECONDS = 30.0
    MAX_INTERACTIONS_PER_DAY = 50
    MAX_REPEAT_RATE = 1.0

    def score_product(
        self,
        product_id: UUID,
        store_id: UUID,
        shelf_id: UUID = None,
        attention_data: Dict[str, Any] = None,
        interaction_data: Dict[str, Any] = None,
        period_days: int = 7
    ) -> ProductAttractivenessScore:
        attention_data = attention_data or {}
        interaction_data = interaction_data or {}

        avg_attention = float(attention_data.get("avg_attention_seconds", 0.0))
        total_viewers = int(attention_data.get("total_viewers", 0))

        total_interactions = int(interaction_data.get("total_interactions", 0))
        total_pickups = int(interaction_data.get("total_pickups", 0))
        total_purchases = int(interaction_data.get("total_purchases", 0))
        repeat_viewers = int(interaction_data.get("repeat_viewers", 0))

        # Calculate component scores normalized 0-100
        attention_score = min(100.0, (avg_attention / self.MAX_ATTENTION_SECONDS) * 100.0)

        daily_interactions = total_interactions / max(period_days, 1)
        interaction_score = min(100.0, (daily_interactions / self.MAX_INTERACTIONS_PER_DAY) * 100.0)

        pickup_rate = total_pickups / max(total_viewers, 1)
        pickup_score = min(100.0, pickup_rate * 100.0)

        conversion_rate = total_purchases / max(total_pickups, 1)
        conversion_score = min(100.0, conversion_rate * 100.0)

        repeat_rate = repeat_viewers / max(total_viewers, 1)
        repeat_score = min(100.0, repeat_rate * 100.0)

        composite = (
            attention_score * self.WEIGHTS["attention_duration"] +
            interaction_score * self.WEIGHTS["interaction_frequency"] +
            pickup_score * self.WEIGHTS["pickup_rate"] +
            conversion_score * self.WEIGHTS["conversion_rate"] +
            repeat_score * self.WEIGHTS["repeat_engagement"]
        )
        composite = round(composite, 2)

        if composite >= 80.0:
            grade = "A"
        elif composite >= 65.0:
            grade = "B"
        elif composite >= 50.0:
            grade = "C"
        elif composite >= 35.0:
            grade = "D"
        else:
            grade = "F"

        now = datetime.now(timezone.utc)
        return ProductAttractivenessScore(
            product_id=str(product_id),
            store_id=str(store_id),
            shelf_id=str(shelf_id) if shelf_id else None,
            attention_duration_score=round(attention_score, 2),
            interaction_frequency_score=round(interaction_score, 2),
            pickup_rate_score=round(pickup_score, 2),
            conversion_rate_score=round(conversion_score, 2),
            repeat_engagement_score=round(repeat_score, 2),
            composite_score=composite,
            grade=grade,
            total_viewers=total_viewers,
            total_interactions=total_interactions,
            total_pickups=total_pickups,
            total_purchases=total_purchases,
            period_start=now,
            period_end=now,
            calculated_at=now
        )

    def score_all_products(self, store_id: UUID, products_data: List[Dict[str, Any]]) -> List[ProductAttractivenessScore]:
        scores = []
        for pdata in products_data:
            s = self.score_product(
                product_id=pdata["product_id"],
                store_id=store_id,
                shelf_id=pdata.get("shelf_id"),
                attention_data=pdata.get("attention_data"),
                interaction_data=pdata.get("interaction_data"),
                period_days=pdata.get("period_days", 7)
            )
            scores.append(s)
        return scores

    def get_store_average(self, scores: List[ProductAttractivenessScore]) -> float:
        if not scores:
            return 0.0
        tot = sum(s.composite_score for s in scores)
        return round(tot / len(scores), 2)

    def rank_products(self, scores: List[ProductAttractivenessScore]) -> List[Tuple[int, ProductAttractivenessScore]]:
        sorted_scores = sorted(scores, key=lambda x: x.composite_score, reverse=True)
        return [(i + 1, score) for i, score in enumerate(sorted_scores)]

    def get_grade_distribution(self, scores: List[ProductAttractivenessScore]) -> Dict[str, int]:
        dist = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
        for s in scores:
            g = s.grade or "F"
            dist[g] = dist.get(g, 0) + 1
        return dist
