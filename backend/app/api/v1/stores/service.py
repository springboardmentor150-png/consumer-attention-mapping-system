import uuid as _uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.store import Store
from app.models.shelf import Shelf
from app.models.zone import StoreZone
from app.schemas.store import StoreCreate, StoreUpdate
from app.schemas.shelf import ShelfCreate
from app.schemas.zone import ZoneCreate


class StoreService:
    @staticmethod
    async def create_store(db: AsyncSession, store_in: StoreCreate) -> Store:
        db_store = Store(
            name=store_in.name, location=store_in.location,
            address=store_in.address, city=store_in.city,
            country=store_in.country, store_type=store_in.store_type,
            floor_plan_url=store_in.floor_plan_url,
            total_area_sqft=store_in.total_area_sqft,
            is_active=store_in.is_active,
            store_metadata=store_in.metadata
        )
        db.add(db_store)
        await db.commit()
        await db.refresh(db_store)
        result = await db.execute(
            select(Store).where(Store.id == db_store.id).options(selectinload(Store.zones))
        )
        return result.scalars().first()

    @staticmethod
    async def get_store_by_id(db: AsyncSession, store_id: str) -> Optional[Store]:
        result = await db.execute(
            select(Store).where(Store.id == store_id).options(selectinload(Store.zones))
        )
        return result.scalars().first()

    @staticmethod
    async def get_all_stores(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Store]:
        result = await db.execute(
            select(Store).options(selectinload(Store.zones)).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def update_store(db: AsyncSession, store_id: str, store_in: StoreUpdate) -> Optional[Store]:
        db_store = await StoreService.get_store_by_id(db, store_id)
        if not db_store:
            return None
        for key, value in store_in.model_dump(exclude_unset=True).items():
            if key == "metadata":
                db_store.store_metadata = value
            else:
                setattr(db_store, key, value)
        await db.commit()
        await db.refresh(db_store)
        result = await db.execute(
            select(Store).where(Store.id == db_store.id).options(selectinload(Store.zones))
        )
        return result.scalars().first()

    @staticmethod
    async def delete_store(db: AsyncSession, store_id: str) -> bool:
        db_store = await StoreService.get_store_by_id(db, store_id)
        if not db_store:
            return False
        await db.delete(db_store)
        await db.commit()
        return True

    @staticmethod
    async def create_shelf(db: AsyncSession, shelf_in: ShelfCreate) -> Shelf:
        db_shelf = Shelf(
            store_id=shelf_in.store_id, zone_id=shelf_in.zone_id,
            name=shelf_in.name, aisle_number=shelf_in.aisle_number,
            shelf_level=shelf_in.shelf_level, coordinates=shelf_in.coordinates,
            width_cm=shelf_in.width_cm, height_cm=shelf_in.height_cm,
            product_categories=shelf_in.product_categories,
            planogram_url=shelf_in.planogram_url
        )
        db.add(db_shelf)
        await db.commit()
        await db.refresh(db_shelf)
        return db_shelf

    @staticmethod
    async def get_shelves_by_store(db: AsyncSession, store_id: str) -> List[Shelf]:
        result = await db.execute(select(Shelf).where(Shelf.store_id == store_id))
        return list(result.scalars().all())

    @staticmethod
    async def create_zone(db: AsyncSession, zone_in: ZoneCreate) -> StoreZone:
        db_zone = StoreZone(
            store_id=zone_in.store_id, name=zone_in.name,
            zone_type=zone_in.zone_type, coordinates=zone_in.coordinates,
            area_sqft=zone_in.area_sqft
        )
        db.add(db_zone)
        await db.commit()
        await db.refresh(db_zone)
        return db_zone

    @staticmethod
    async def get_zones_by_store(db: AsyncSession, store_id: str) -> List[StoreZone]:
        result = await db.execute(select(StoreZone).where(StoreZone.store_id == store_id))
        return list(result.scalars().all())
