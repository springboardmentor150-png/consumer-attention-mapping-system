from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import ALL_ROLES, MANAGEMENT_ROLES, require_roles

from app.core.database import get_db
from app.crud.shelf import (
    create_shelf,
    get_shelves_by_store,
    update_shelf,
    delete_shelf,
)
from app.schemas.shelf import ShelfCreate

router = APIRouter(
    prefix="/api/stores",
    tags=["Shelves"]
)

@router.post(
    "/{store_id}/shelves",
    dependencies=[
        Depends(require_roles(*MANAGEMENT_ROLES))
    ],
)
def add_shelf(
    store_id: int,
    shelf: ShelfCreate,
    db: Session = Depends(get_db),
):
    return create_shelf(
        db,
        store_id,
        shelf.shelf_name,
        shelf.zone_coordinates,
    )


@router.get(
    "/{store_id}/shelves",
    dependencies=[
        Depends(require_roles(*ALL_ROLES))
    ],
)
def read_shelves(
    store_id: int,
    db: Session = Depends(get_db),
):
    return get_shelves_by_store(db, store_id)


@router.put(
    "/shelves/{shelf_id}",
    dependencies=[
        Depends(require_roles(*MANAGEMENT_ROLES))
    ],
)
def edit_shelf(
    shelf_id: int,
    shelf: ShelfCreate,
    db: Session = Depends(get_db),
):
    updated = update_shelf(
        db,
        shelf_id,
        shelf.shelf_name,
        shelf.zone_coordinates,
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Shelf not found",
        )

    return updated


@router.delete(
    "/shelves/{shelf_id}",
    dependencies=[
        Depends(require_roles(*MANAGEMENT_ROLES))
    ],
)
def remove_shelf(
    shelf_id: int,
    db: Session = Depends(get_db),
):
    deleted = delete_shelf(db, shelf_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Shelf not found",
        )

    return deleted