from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import ADMIN_ONLY, ALL_ROLES, require_roles

from app.core.database import get_db
from app.crud.store import (
    create_store,
    get_stores,
    update_store,
    delete_store,
)
from app.schemas.store import StoreCreate

router = APIRouter(
    prefix="/api/stores",
    tags=["Stores"]
)

@router.post(
    "/",
    dependencies=[
        Depends(require_roles(*ADMIN_ONLY))
    ],
)
def add_store(store: StoreCreate, db: Session = Depends(get_db)):
    return create_store(
        db,
        store.name,
        store.location,
    )


@router.get(
    "/",
    dependencies=[
        Depends(require_roles(*ALL_ROLES))
    ],
)
def read_stores(db: Session = Depends(get_db)):
    return get_stores(db)


@router.put(
    "/{store_id}",
    dependencies=[
        Depends(require_roles(*ADMIN_ONLY))
    ],
)
def edit_store(
    store_id: int,
    store: StoreCreate,
    db: Session = Depends(get_db),
):
    updated_store = update_store(
        db,
        store_id,
        store.name,
        store.location,
    )

    if not updated_store:
        raise HTTPException(
            status_code=404,
            detail="Store not found",
        )

    return updated_store


@router.delete(
    "/{store_id}",
    dependencies=[
        Depends(require_roles(*ADMIN_ONLY))
    ],
)
def remove_store(
    store_id: int,
    db: Session = Depends(get_db),
):
    deleted = delete_store(db, store_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Store not found",
        )

    if deleted.get("blocked"):
        counts = deleted["dependents"]

        detail = ", ".join(
            f"{count} {name}"
            for name, count in counts.items()
            if count
        )

        raise HTTPException(
            status_code=409,
            detail=(
                f"Cannot delete this store while it still has {detail}. "
                "Remove or reassign them first."
            ),
        )

    return deleted