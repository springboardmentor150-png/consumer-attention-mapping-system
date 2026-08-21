from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import ALL_ROLES, require_roles
from app.crud.analytics import (
    get_all_sessions,
    get_summary,
)
from app.schemas.analytics import AnalyticsResponse

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
    # Read-only analytics: every signed-in role may read, nobody writes here.
    dependencies=[Depends(require_roles(*ALL_ROLES))],
)


# store_id and shelf_id are optional so existing callers keep working. Omitting
# them returns every session, which is also what keeps rows recorded before
# analytics carried a store visible. Supplying a store_id scopes the figures to
# that store instead of averaging across all of them.
StoreFilter = Query(
    default=None,
    description="Restrict results to one store.",
)

ShelfFilter = Query(
    default=None,
    description="Restrict results to one shelf.",
)


@router.get(
    "/",
    response_model=list[AnalyticsResponse]
)
def analytics(
    db: Session = Depends(get_db),
    store_id: int | None = StoreFilter,
    shelf_id: int | None = ShelfFilter,
):

    return get_all_sessions(db, store_id=store_id, shelf_id=shelf_id)


@router.get("/summary")
def analytics_summary(
    db: Session = Depends(get_db),
    store_id: int | None = StoreFilter,
    shelf_id: int | None = ShelfFilter,
):

    return get_summary(db, store_id=store_id, shelf_id=shelf_id)
