from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from ..database import get_db
from ..models import Store, Shelf, Product, StoreZone, User
from ..schemas import ShelfCreate, ShelfResponse, ShelfUpdate, ProductCreate, ProductResponse
from ..auth import get_current_user, RoleChecker

router = APIRouter(prefix="/api/shelves", tags=["Shelves"])

# Role checkers
manager_or_admin = RoleChecker(["Admin", "Store Manager"])
any_role = RoleChecker(["Admin", "Store Manager", "Retail Analyst", "Marketing Manager"])

# --- SHELF ENDPOINTS ---

@router.get("", response_model=List[ShelfResponse])
def get_shelves(store_id: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(any_role)):
    query = db.query(Shelf)
    if store_id and store_id != "undefined" and store_id != "null":
        try:
            s_uid = UUID(store_id)
            query = query.filter(Shelf.store_id == s_uid)
        except Exception:
            query = query.filter(Shelf.store_id == store_id)
    return query.all()

@router.post("", response_model=ShelfResponse, status_code=status.HTTP_201_CREATED)
def create_shelf(shelf_in: ShelfCreate, db: Session = Depends(get_db), current_user: User = Depends(manager_or_admin)):
    import uuid as _uuid
    # Verify store exists
    store = None
    try:
        store = db.query(Store).filter(Store.store_id == shelf_in.store_id).first()
    except Exception:
        pass
    if not store:
        try:
            store = db.query(Store).filter(Store.store_id == str(shelf_in.store_id)).first()
        except Exception:
            pass
    if not store:
        raise HTTPException(status_code=400, detail="Store not found")
        
    # Verify zone exists if provided
    matched_zone_id = None
    if shelf_in.zone_id:
        zone = None
        try:
            zone = db.query(StoreZone).filter(StoreZone.zone_id == shelf_in.zone_id).first()
        except Exception:
            pass
        if not zone:
            try:
                zone = db.query(StoreZone).filter(StoreZone.zone_id == str(shelf_in.zone_id)).first()
            except Exception:
                pass
        if not zone or str(zone.store_id) != str(store.store_id):
            raise HTTPException(status_code=400, detail="Zone not found or does not belong to the store")
        matched_zone_id = zone.zone_id

    new_shelf = Shelf(
        shelf_id=_uuid.uuid4(),
        store_id=store.store_id,
        zone_id=matched_zone_id,
        shelf_name=shelf_in.shelf_name if hasattr(shelf_in, 'shelf_name') and shelf_in.shelf_name else shelf_in.category,
        category=shelf_in.category,
        coordinates=shelf_in.coordinates if hasattr(shelf_in, 'coordinates') else None,
        layout=shelf_in.layout if hasattr(shelf_in, 'layout') else None
    )
    db.add(new_shelf)
    db.commit()
    db.refresh(new_shelf)
    return new_shelf

@router.get("/{shelf_id}", response_model=ShelfResponse)
def get_shelf(shelf_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(any_role)):
    shelf = db.query(Shelf).filter(Shelf.shelf_id == shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
    return shelf

@router.put("/{shelf_id}", response_model=ShelfResponse)
def update_shelf(shelf_id: UUID, shelf_in: ShelfUpdate, db: Session = Depends(get_db), current_user: User = Depends(manager_or_admin)):
    shelf = db.query(Shelf).filter(Shelf.shelf_id == shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
        
    # Verify zone exists if provided
    if shelf_in.zone_id:
        zone = db.query(StoreZone).filter(StoreZone.zone_id == shelf_in.zone_id).first()
        if not zone or zone.store_id != shelf.store_id:
            raise HTTPException(status_code=400, detail="Zone not found or does not belong to the shelf's store")
        shelf.zone_id = shelf_in.zone_id
    elif shelf_in.zone_id is None:
        # If explicitly set to None, we can clear it or leave as is. Pydantic Optional[UUID] defaults to None.
        # To avoid resetting zone on partial update, check if zone_id was explicitly passed.
        # But for simpler CRUD, we can overwrite.
        shelf.zone_id = shelf_in.zone_id
        
    if shelf_in.category is not None:
        shelf.category = shelf_in.category
        
    db.commit()
    db.refresh(shelf)
    return shelf

@router.delete("/{shelf_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shelf(shelf_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(manager_or_admin)):
    shelf = db.query(Shelf).filter(Shelf.shelf_id == shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
        
    db.delete(shelf)
    db.commit()
    return None


# --- PRODUCT ENDPOINTS ---

@router.get("/{shelf_id}/products", response_model=List[ProductResponse])
def get_shelf_products(shelf_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(any_role)):
    shelf = db.query(Shelf).filter(Shelf.shelf_id == shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
    return db.query(Product).filter(Product.shelf_id == shelf_id).all()

@router.post("/{shelf_id}/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def add_product_to_shelf(
    shelf_id: UUID, 
    product_in: ProductCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(manager_or_admin)
):
    shelf = db.query(Shelf).filter(Shelf.shelf_id == shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
        
    new_product = Product(
        shelf_id=shelf_id,
        product_name=product_in.product_name,
        category=product_in.category if hasattr(product_in, 'category') else None,
        brand=product_in.brand if hasattr(product_in, 'brand') else None,
        price=product_in.price,
        sku=product_in.sku
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(manager_or_admin)):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    db.delete(product)
    db.commit()
    return None
