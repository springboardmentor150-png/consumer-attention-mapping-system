from app.api.auth.auth import router as auth_router
from app.api.store import router as store_router
from app.api.shelf import router as shelf_router
from fastapi import FastAPI
from sqlmodel import SQLModel

from app.core.database import engine

from app.models.role import Role
from app.models.user import User
from app.models.store import Store
from app.models.shelf import Shelf

from app.api.analytics import analytics_router

from fastapi.openapi.utils import get_openapi

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Consumer Attention Mapping System"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(store_router)
app.include_router(shelf_router)
app.include_router(analytics_router)


@app.on_event("startup")
def create_tables():
    SQLModel.metadata.create_all(engine)

    from sqlmodel import Session

    from app.models.role import Role

    with Session(engine) as session:
        existing_role = session.get(Role, 1)

        if not existing_role:
            role = Role(
                id=1,
                name="Admin"
            )
            session.add(role)
            session.commit()


@app.get("/")
def home():
    return {"message": "Consumer Attention Mapping System API is running"}