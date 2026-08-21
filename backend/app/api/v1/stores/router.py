from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.postgres import get_db
from app.schemas.store import StoreCreate, StoreUpdate, StoreResponse
from app.schemas.shelf import ShelfCreate, ShelfResponse
from app.schemas.zone import ZoneCreate, ZoneResponse
from app.api.dependencies.auth import get_current_active_user
from app.api.dependencies.permissions import require_store_manager, require_super_admin
from app.api.v1.stores.service import StoreService

router = APIRouter(tags=["Stores"])


@router.get("", response_model=List[StoreResponse])
async def get_stores(
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    return await StoreService.get_all_stores(db, skip=skip, limit=limit)


@router.post("", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
async def create_store(
    store_in: StoreCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_store_manager)
):
    return await StoreService.create_store(db, store_in)


@router.get("/{store_id}", response_model=StoreResponse)
async def get_store(
    store_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    store = await StoreService.get_store_by_id(db, store_id)
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found.")
    return store


@router.put("/{store_id}", response_model=StoreResponse)
async def update_store(
    store_id: str, store_in: StoreUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_store_manager)
):
    store = await StoreService.update_store(db, store_id, store_in)
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found.")
    return store


@router.delete("/{store_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_store(
    store_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_super_admin)
):
    if not await StoreService.delete_store(db, store_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found.")


@router.post("/{store_id}/shelves", response_model=ShelfResponse, status_code=status.HTTP_201_CREATED)
async def create_store_shelf(
    store_id: str, shelf_in: ShelfCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_store_manager)
):
    if shelf_in.store_id != store_id:
        raise HTTPException(status_code=400, detail="store_id in body must match path.")
    if not await StoreService.get_store_by_id(db, store_id):
        raise HTTPException(status_code=404, detail="Store not found.")
    return await StoreService.create_shelf(db, shelf_in)


@router.get("/{store_id}/shelves", response_model=List[ShelfResponse])
async def get_store_shelves(
    store_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    if not await StoreService.get_store_by_id(db, store_id):
        raise HTTPException(status_code=404, detail="Store not found.")
    return await StoreService.get_shelves_by_store(db, store_id)


@router.post("/{store_id}/zones", response_model=ZoneResponse, status_code=status.HTTP_201_CREATED)
async def create_store_zone(
    store_id: str, zone_in: ZoneCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_store_manager)
):
    if zone_in.store_id != store_id:
        raise HTTPException(status_code=400, detail="store_id in body must match path.")
    if not await StoreService.get_store_by_id(db, store_id):
        raise HTTPException(status_code=404, detail="Store not found.")
    return await StoreService.create_zone(db, zone_in)


@router.get("/{store_id}/zones", response_model=List[ZoneResponse])
async def get_store_zones(
    store_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    if not await StoreService.get_store_by_id(db, store_id):
        raise HTTPException(status_code=404, detail="Store not found.")
    return await StoreService.get_zones_by_store(db, store_id)
