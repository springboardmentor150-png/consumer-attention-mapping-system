from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.api.dependencies.permissions import require_role
from app.api.v1.recommendations.service import RecommendationService
from app.schemas.recommendation import (
    RecommendationItem,
    StoreRecommendationSummary
)

router = APIRouter()

@router.post("/generate/{store_id}", response_model=StoreRecommendationSummary)
async def generate_recommendations(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(require_role(["super_admin", "store_manager"]))
):
    service = RecommendationService(db)
    return await service.generate_recommendations(store_id)

@router.get("/store/{store_id}", response_model=List[RecommendationItem])
async def get_store_recommendations(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    service = RecommendationService(db)
    return await service.get_store_recommendations(store_id)

@router.get("/store/{store_id}/high-priority", response_model=List[RecommendationItem])
async def get_high_priority_recommendations(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    service = RecommendationService(db)
    all_recs = await service.get_store_recommendations(store_id)
    return [r for r in all_recs if r.priority == "high" or (hasattr(r.priority, "value") and r.priority.value == "high")]

@router.get("/product/{product_id}", response_model=List[RecommendationItem])
async def get_product_recommendations(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    service = RecommendationService(db)
    return await service.get_product_recommendations(product_id)

@router.patch("/{recommendation_id}/dismiss", status_code=status.HTTP_204_NO_CONTENT)
async def dismiss_recommendation(
    recommendation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(require_role(["super_admin", "store_manager"]))
):
    service = RecommendationService(db)
    await service.dismiss_recommendation(recommendation_id)

@router.get("/store/{store_id}/summary", response_model=StoreRecommendationSummary)
async def get_recommendation_summary(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    service = RecommendationService(db)
    return await service.generate_recommendations(store_id)
