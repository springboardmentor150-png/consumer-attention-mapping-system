"""Products Router — Full CRUD for retail products."""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Product, Shelf, Store, User
from ..schemas import ProductCreate, ProductUpdate, ProductResponse
from ..auth import get_current_user, RoleChecker

router = APIRouter(prefix="/api/products", tags=["Products"])
any_role = RoleChecker(["Admin", "Store Manager", "Retail Analyst", "Marketing Manager"])
manager_or_admin = RoleChecker(["Admin", "Store Manager"])


@router.get("", response_model=List[ProductResponse])
def list_products(
    shelf_id: Optional[str] = None,
    store_id: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    query = db.query(Product)
    if shelf_id:
        query = query.filter(Product.shelf_id == shelf_id)
    if store_id:
        query = query.join(Shelf, Product.shelf_id == Shelf.shelf_id).filter(
            Shelf.store_id == store_id
        )
    if category:
        query = query.filter(Product.category.ilike(f"%{category}%"))
    return query.order_by(Product.created_at.desc()).all()


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    shelf = None
    try:
        shelf = db.query(Shelf).filter(Shelf.shelf_id == product_in.shelf_id).first()
    except Exception:
        pass
    if not shelf:
        try:
            shelf = db.query(Shelf).filter(Shelf.shelf_id == str(product_in.shelf_id)).first()
        except Exception:
            pass
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")

    import uuid as _uuid
    product = Product(
        product_id=_uuid.uuid4(),
        shelf_id=str(product_in.shelf_id),
        product_name=product_in.product_name,
        category=product_in.category,
        brand=product_in.brand,
        sku=product_in.sku,
        price=product_in.price,
        image_path=product_in.image_path
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product_in.shelf_id:
        shelf = db.query(Shelf).filter(Shelf.shelf_id == str(product_in.shelf_id)).first()
        if not shelf:
            raise HTTPException(status_code=404, detail="Shelf not found")
        product.shelf_id = str(product_in.shelf_id)

    for field in ["product_name", "category", "brand", "sku", "price", "image_path"]:
        val = getattr(product_in, field, None)
        if val is not None:
            setattr(product, field, val)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return None
