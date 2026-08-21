from uuid import UUID
from typing import List
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status

from app.models.recommendation import Recommendation
from app.models.product import Product
from app.models.attractiveness_score import ProductAttractivenessScore
from app.services.recommendations.engine import RecommendationEngine
from app.schemas.recommendation import (
    RecommendationItem,
    StoreRecommendationSummary,
    RecommendationType,
    PriorityLevel
)

class RecommendationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.engine = RecommendationEngine()

    async def generate_recommendations(self, store_id: UUID) -> StoreRecommendationSummary:
        now = datetime.now(timezone.utc)

        # Query latest product scores for store, compute if none exist yet
        stmt = select(ProductAttractivenessScore).where(ProductAttractivenessScore.store_id == str(store_id))
        res = await self.db.execute(stmt)
        scores = res.scalars().all()

        if not scores:
            from app.api.v1.scoring.service import ScoringService
            await ScoringService(self.db).calculate_store_scores(store_id)
            res = await self.db.execute(stmt)
            scores = res.scalars().all()

        prod_ids = [s.product_id for s in scores]
        prod_map = {}
        if prod_ids:
            p_stmt = select(Product).where(Product.id.in_(prod_ids))
            p_res = await self.db.execute(p_stmt)
            for p in p_res.scalars().all():
                prod_map[p.id] = p.name

        items = self.engine.generate_store_recommendations(scores, prod_map)

        # Save to database
        saved_recs = []
        for item in items:
            rec_model = Recommendation(
                id=str(item.id),
                store_id=str(item.store_id),
                product_id=str(item.product_id) if item.product_id else None,
                shelf_id=str(item.shelf_id) if item.shelf_id else None,
                zone_id=str(item.zone_id) if item.zone_id else None,
                recommendation_type=item.recommendation_type.value if hasattr(item.recommendation_type, "value") else str(item.recommendation_type),
                priority=item.priority.value if hasattr(item.priority, "value") else str(item.priority),
                title=item.title,
                description=item.description,
                trigger_reason=item.trigger_reason,
                suggested_action=item.suggested_action,
                expected_impact=item.expected_impact,
                composite_score_before=item.composite_score_before,
                is_active=True
            )
            self.db.add(rec_model)
            saved_recs.append(item)

        if saved_recs:
            await self.db.commit()

        counts = self.engine.get_priority_counts(items)

        return StoreRecommendationSummary(
            store_id=store_id,
            generated_at=now,
            total_recommendations=len(items),
            high_priority_count=counts.get("high", 0),
            recommendations=items
        )

    async def get_store_recommendations(self, store_id: UUID, active_only: bool = True) -> List[RecommendationItem]:
        stmt = select(Recommendation).where(Recommendation.store_id == str(store_id))
        if active_only:
            stmt = stmt.where(Recommendation.is_active == True)
        stmt = stmt.order_by(Recommendation.created_at.desc())

        res = await self.db.execute(stmt)
        records = res.scalars().all()

        items = []
        for r in records:
            items.append(
                RecommendationItem(
                    id=UUID(r.id),
                    store_id=UUID(r.store_id),
                    product_id=UUID(r.product_id) if r.product_id else None,
                    shelf_id=UUID(r.shelf_id) if r.shelf_id else None,
                    zone_id=UUID(r.zone_id) if r.zone_id else None,
                    recommendation_type=RecommendationType(r.recommendation_type) if r.recommendation_type in [t.value for t in RecommendationType] else RecommendationType.SHELF_OPTIMIZATION,
                    priority=PriorityLevel(r.priority) if r.priority in [p.value for p in PriorityLevel] else PriorityLevel.MEDIUM,
                    title=r.title,
                    description=r.description,
                    trigger_reason=r.trigger_reason,
                    suggested_action=r.suggested_action,
                    expected_impact=r.expected_impact,
                    composite_score_before=r.composite_score_before,
                    is_active=r.is_active,
                    created_at=r.created_at
                )
            )

        return items

    async def dismiss_recommendation(self, recommendation_id: UUID):
        stmt = select(Recommendation).where(Recommendation.id == str(recommendation_id))
        res = await self.db.execute(stmt)
        r = res.scalars().first()
        if not r:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")

        r.is_active = False
        r.dismissed_at = datetime.now(timezone.utc)
        await self.db.commit()

    async def get_product_recommendations(self, product_id: UUID) -> List[RecommendationItem]:
        stmt = select(Recommendation).where(Recommendation.product_id == str(product_id), Recommendation.is_active == True)
        res = await self.db.execute(stmt)
        records = res.scalars().all()

        items = []
        for r in records:
            items.append(
                RecommendationItem(
                    id=UUID(r.id),
                    store_id=UUID(r.store_id),
                    product_id=UUID(r.product_id) if r.product_id else None,
                    shelf_id=UUID(r.shelf_id) if r.shelf_id else None,
                    zone_id=UUID(r.zone_id) if r.zone_id else None,
                    recommendation_type=RecommendationType(r.recommendation_type),
                    priority=PriorityLevel(r.priority),
                    title=r.title,
                    description=r.description,
                    trigger_reason=r.trigger_reason,
                    suggested_action=r.suggested_action,
                    expected_impact=r.expected_impact,
                    composite_score_before=r.composite_score_before,
                    is_active=r.is_active,
                    created_at=r.created_at
                )
            )
        return items
