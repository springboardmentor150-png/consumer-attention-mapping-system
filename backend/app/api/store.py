from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.database import engine
from app.core.security import get_current_user
from app.models.store import Store

router = APIRouter(
    prefix="/api/stores",
    tags=["Stores"]
)


@router.get("/")
def get_stores(
    current_user: str = Depends(get_current_user)
):
    with Session(engine) as session:
        stores = session.exec(
            select(Store)
        ).all()

        return stores


@router.post("/")
def create_store(
    name: str,
    location: str,
    current_user: str = Depends(get_current_user)
):
    with Session(engine) as session:

        store = Store(
            name=name,
            location=location
        )

        session.add(store)
        session.commit()
        session.refresh(store)

        return store