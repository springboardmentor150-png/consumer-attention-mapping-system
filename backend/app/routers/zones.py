"""Zones Router — CRUD for store zones with coordinate ROI support."""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import StoreZone, Store, User
from ..schemas import StoreZoneCreate, StoreZoneUpdate, StoreZoneResponse
from ..auth import get_current_user, RoleChecker

router = APIRouter(prefix="/api/zones", tags=["Zones"])
any_role = RoleChecker(["Admin", "Store Manager", "Retail Analyst", "Marketing Manager"])
manager_or_admin = RoleChecker(["Admin", "Store Manager"])


@router.get("", response_model=List[StoreZoneResponse])
def list_zones(
    store_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    query = db.query(StoreZone)
    if store_id:
        query = query.filter(StoreZone.store_id == store_id)
    return query.all()


@router.post("", response_model=StoreZoneResponse, status_code=status.HTTP_201_CREATED)
def create_zone(
    store_id: str,
    zone_in: StoreZoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    store = db.query(Store).filter(Store.store_id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    zone = StoreZone(
        store_id=store_id,
        zone_name=zone_in.zone_name,
        coordinates=zone_in.coordinates,
        description=zone_in.description
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.get("/{zone_id}", response_model=StoreZoneResponse)
def get_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    zone = db.query(StoreZone).filter(StoreZone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone


@router.put("/{zone_id}", response_model=StoreZoneResponse)
def update_zone(
    zone_id: str,
    zone_in: StoreZoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    zone = db.query(StoreZone).filter(StoreZone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    if zone_in.zone_name is not None:
        zone.zone_name = zone_in.zone_name
    if zone_in.coordinates is not None:
        zone.coordinates = zone_in.coordinates
    if zone_in.description is not None:
        zone.description = zone_in.description
    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    zone = db.query(StoreZone).filter(StoreZone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    db.delete(zone)
    db.commit()
    return None
