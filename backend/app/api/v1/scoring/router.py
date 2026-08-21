from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.api.dependencies.permissions import require_role
from app.api.v1.scoring.service import ScoringService
from app.schemas.scoring import (
    ProductScoreDetail,
    StoreScoreReport
)

router = APIRouter()

@router.post("/calculate/{store_id}", response_model=StoreScoreReport)
async def calculate_store_scores(
    store_id: UUID,
    period: str = Query("week"),
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(require_role(["super_admin", "store_manager"]))
):
    service = ScoringService(db)
    return await service.calculate_store_scores(store_id, period)

@router.get("/products/{store_id}", response_model=List[ProductScoreDetail])
async def get_product_scores(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    service = ScoringService(db)
    return await service.get_product_scores(store_id)

@router.get("/products/{store_id}/top", response_model=List[ProductScoreDetail])
async def get_top_products(
    store_id: UUID,
    limit: int = Query(10),
    db: AsyncSession = Depends(get_db),
):
    service = ScoringService(db)
    return await service.get_top_products(store_id, limit)

@router.get("/products/{store_id}/low", response_model=List[ProductScoreDetail])
async def get_low_products(
    store_id: UUID,
    limit: int = Query(10),
    db: AsyncSession = Depends(get_db),
):
    service = ScoringService(db)
    return await service.get_low_products(store_id, limit)

@router.get("/product/{product_id}", response_model=ProductScoreDetail)
async def get_product_score(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    service = ScoringService(db)
    return await service.get_product_score(product_id)

@router.get("/report/{store_id}", response_model=StoreScoreReport)
async def get_score_report(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    service = ScoringService(db)
    return await service.calculate_store_scores(store_id)
