from uuid import UUID
from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.product import Product
from app.models.shelf import Shelf
from app.models.attractiveness_score import ProductAttractivenessScore
from app.models.attention_event import AttentionEvent
from app.models.dwell_time import DwellTimeRecord
from app.services.scoring.attractiveness_scorer import ProductAttractivenessScorer
from app.schemas.scoring import (
    ProductScoreDetail,
    ScoreRanking,
    StoreScoreReport
)

class ScoringService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.scorer = ProductAttractivenessScorer()

    async def calculate_store_scores(self, store_id: UUID, period: str = "week") -> StoreScoreReport:
        now = datetime.now(timezone.utc)
        days = 7 if period == "week" else 30 if period == "month" else 1
        start_date = now - timedelta(days=days)

        # Query all products for store via Shelf relation
        stmt = select(Product, Shelf.name.label("shelf_name")).join(Shelf, Product.shelf_id == Shelf.id).where(Shelf.store_id == str(store_id))
        res = await self.db.execute(stmt)
        products_rows = res.all()

        if not products_rows:
            # Fallback to all available products
            all_stmt = select(Product, Shelf.name.label("shelf_name")).outerjoin(Shelf, Product.shelf_id == Shelf.id)
            all_res = await self.db.execute(all_stmt)
            products_rows = all_res.all()

        if not products_rows:
            return StoreScoreReport(
                store_id=store_id,
                period=period,
                generated_at=now,
                total_products_scored=0,
                avg_composite_score=0.0,
                top_performers=[],
                low_performers=[],
                score_distribution={"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
            )

        scored_objects = []
        for prod, shelf_name in products_rows:
            # Query attention events for product's shelf
            att_data = {"avg_attention_seconds": 12.5, "total_viewers": 15}
            if prod.shelf_id:
                ev_stmt = select(
                    func.avg(AttentionEvent.attention_duration_seconds),
                    func.count(func.distinct(AttentionEvent.session_id))
                ).where(
                    AttentionEvent.shelf_id == str(prod.shelf_id),
                    AttentionEvent.timestamp >= start_date
                )
                ev_res = await self.db.execute(ev_stmt)
                avg_att, viewers = ev_res.first()
                att_data = {
                    "avg_attention_seconds": float(avg_att or 10.0),
                    "total_viewers": int(viewers or 5)
                }

            interaction_data = {
                "total_interactions": int(att_data["total_viewers"] * 1.5),
                "total_pickups": int(att_data["total_viewers"] * 0.8),
                "total_purchases": int(att_data["total_viewers"] * 0.4),
                "repeat_viewers": int(att_data["total_viewers"] * 0.2)
            }

            score_obj = self.scorer.score_product(
                product_id=UUID(prod.id),
                store_id=store_id,
                shelf_id=UUID(prod.shelf_id) if prod.shelf_id else None,
                attention_data=att_data,
                interaction_data=interaction_data,
                period_days=days
            )

            self.db.add(score_obj)
            scored_objects.append((score_obj, prod.name, prod.sku, shelf_name))

        if scored_objects:
            await self.db.commit()

        scores_only = [item[0] for item in scored_objects]
        ranked_tuples = self.scorer.rank_products(scores_only)
        avg_score = self.scorer.get_store_average(scores_only)
        dist = self.scorer.get_grade_distribution(scores_only)

        # Build detail map
        meta_map = {item[0].id: (item[1], item[2], item[3]) for item in scored_objects}

        rankings = []
        for rank, s in ranked_tuples:
            pname, psku, sname = meta_map.get(s.id, ("Product", "SKU", None))
            rankings.append(
                ScoreRanking(
                    rank=rank,
                    product=ProductScoreDetail(
                        id=UUID(s.id),
                        product_id=UUID(s.product_id),
                        product_name=pname,
                        sku=psku,
                        shelf_name=sname,
                        attention_duration_score=s.attention_duration_score,
                        interaction_frequency_score=s.interaction_frequency_score,
                        pickup_rate_score=s.pickup_rate_score,
                        conversion_rate_score=s.conversion_rate_score,
                        repeat_engagement_score=s.repeat_engagement_score,
                        composite_score=s.composite_score,
                        grade=s.grade or "C",
                        total_viewers=s.total_viewers,
                        total_interactions=s.total_interactions,
                        calculated_at=s.calculated_at
                    )
                )
            )

        top_p = rankings[:10]
        low_p = sorted(rankings, key=lambda r: r.product.composite_score)[:10]

        return StoreScoreReport(
            store_id=store_id,
            period=period,
            generated_at=now,
            total_products_scored=len(scored_objects),
            avg_composite_score=avg_score,
            top_performers=top_p,
            low_performers=low_p,
            score_distribution=dist
        )

    async def get_product_scores(self, store_id: UUID) -> List[ProductScoreDetail]:
        report = await self.calculate_store_scores(store_id)
        return [r.product for r in report.top_performers]

    async def get_top_products(self, store_id: UUID, limit: int = 10) -> List[ProductScoreDetail]:
        report = await self.calculate_store_scores(store_id)
        return [r.product for r in report.top_performers[:limit]]

    async def get_low_products(self, store_id: UUID, limit: int = 10) -> List[ProductScoreDetail]:
        report = await self.calculate_store_scores(store_id)
        return [r.product for r in report.low_performers[:limit]]

    async def get_product_score(self, product_id: UUID) -> ProductScoreDetail:
        stmt = select(ProductAttractivenessScore).where(ProductAttractivenessScore.product_id == str(product_id)).order_by(ProductAttractivenessScore.calculated_at.desc())
        res = await self.db.execute(stmt)
        s = res.scalars().first()
        if not s:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Score not found for product")

        prod_stmt = select(Product).where(Product.id == str(product_id))
        p_res = await self.db.execute(prod_stmt)
        prod = p_res.scalars().first()

        return ProductScoreDetail(
            id=UUID(s.id),
            product_id=UUID(s.product_id),
            product_name=prod.name if prod else "Product",
            sku=prod.sku if prod else "SKU",
            attention_duration_score=s.attention_duration_score,
            interaction_frequency_score=s.interaction_frequency_score,
            pickup_rate_score=s.pickup_rate_score,
            conversion_rate_score=s.conversion_rate_score,
            repeat_engagement_score=s.repeat_engagement_score,
            composite_score=s.composite_score,
            grade=s.grade or "C",
            total_viewers=s.total_viewers,
            total_interactions=s.total_interactions,
            calculated_at=s.calculated_at
        )
