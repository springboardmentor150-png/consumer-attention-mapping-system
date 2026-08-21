from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from ..database import get_db
from ..models import Store, StoreZone, User
from ..schemas import StoreCreate, StoreResponse, StoreZoneCreate, StoreZoneResponse
from ..auth import get_current_user, RoleChecker

router = APIRouter(prefix="/api/stores", tags=["Stores"])

# Role checkers
admin_only = RoleChecker(["Admin"])
manager_or_admin = RoleChecker(["Admin", "Store Manager"])
any_role = RoleChecker(["Admin", "Store Manager", "Retail Analyst", "Marketing Manager"])

# --- STORE ENDPOINTS ---

@router.get("", response_model=List[StoreResponse])
def get_stores(db: Session = Depends(get_db), current_user: User = Depends(any_role)):
    return db.query(Store).all()

@router.post("", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
def create_store(store_in: StoreCreate, db: Session = Depends(get_db), current_user: User = Depends(admin_only)):
    import uuid as _uuid
    new_store = Store(
        store_id=_uuid.uuid4(),
        store_name=store_in.store_name,
        location=store_in.location
    )
    db.add(new_store)
    db.commit()
    db.refresh(new_store)
    return new_store

@router.get("/{store_id}", response_model=StoreResponse)
def get_store(store_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(any_role)):
    store = None
    try:
        store = db.query(Store).filter(Store.store_id == store_id).first()
    except Exception:
        pass
    if not store:
        try:
            store = db.query(Store).filter(Store.store_id == str(store_id)).first()
        except Exception:
            pass
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store

@router.put("/{store_id}", response_model=StoreResponse)
def update_store(store_id: UUID, store_in: StoreCreate, db: Session = Depends(get_db), current_user: User = Depends(admin_only)):
    store = None
    try:
        store = db.query(Store).filter(Store.store_id == store_id).first()
    except Exception:
        pass
    if not store:
        try:
            store = db.query(Store).filter(Store.store_id == str(store_id)).first()
        except Exception:
            pass
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    store.store_name = store_in.store_name
    store.location = store_in.location
    db.commit()
    db.refresh(store)
    return store

@router.delete("/{store_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_store(store_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(admin_only)):
    store = None
    try:
        store = db.query(Store).filter(Store.store_id == store_id).first()
    except Exception:
        pass
    if not store:
        try:
            store = db.query(Store).filter(Store.store_id == str(store_id)).first()
        except Exception:
            pass
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    db.delete(store)
    db.commit()
    return None


# --- STORE ZONE ENDPOINTS ---

@router.get("/{store_id}/zones", response_model=List[StoreZoneResponse])
def get_store_zones(store_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(any_role)):
    store = None
    try:
        store = db.query(Store).filter(Store.store_id == store_id).first()
    except Exception:
        pass
    if not store:
        try:
            store = db.query(Store).filter(Store.store_id == str(store_id)).first()
        except Exception:
            pass
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    try:
        return db.query(StoreZone).filter(StoreZone.store_id == store_id).all()
    except Exception:
        return db.query(StoreZone).filter(StoreZone.store_id == str(store_id)).all()

@router.post("/{store_id}/zones", response_model=StoreZoneResponse, status_code=status.HTTP_201_CREATED)
def create_store_zone(
    store_id: UUID, 
    zone_in: StoreZoneCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(manager_or_admin)
):
    store = None
    try:
        store = db.query(Store).filter(Store.store_id == store_id).first()
    except Exception:
        pass
    if not store:
        try:
            store = db.query(Store).filter(Store.store_id == str(store_id)).first()
        except Exception:
            pass
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    import uuid as _uuid
    new_zone = StoreZone(
        zone_id=_uuid.uuid4(),
        store_id=store.store_id,
        zone_name=zone_in.zone_name,
        coordinates=zone_in.coordinates if hasattr(zone_in, 'coordinates') else None
    )
    db.add(new_zone)
    db.commit()
    db.refresh(new_zone)
    return new_zone

@router.delete("/zones/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_store_zone(zone_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(manager_or_admin)):
    zone = db.query(StoreZone).filter(StoreZone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    db.delete(zone)
    db.commit()
    return None
