from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.store import router as store_router
from app.api.shelf import router as shelf_router
from app.api.analytics import router as analytics_router
from app.api.recommendations import router as recommendation_router
from app.api import heatmap

from app.core.database import SessionLocal, engine

from seed import seed_roles

from app.models.base import Base
from app.models.role import Role
from app.models.user import User
from app.models.store import Store
from app.models.shelf import Shelf
from app.models.product_interaction import ProductInteraction
from app.api.product_interactions import router as product_interaction_router
from app.api.reports import router as reports_router

app = FastAPI(
    title="Consumer Attention Mapping System",
    version="1.0.0",
)


# ---------------------------------------
# CORS
# ---------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------
# Create database tables
# ---------------------------------------

Base.metadata.create_all(bind=engine)


# ---------------------------------------
# Seed roles
# ---------------------------------------

db = SessionLocal()

try:
    seed_roles(db)
finally:
    db.close()


# ---------------------------------------
# Register API routes
# ---------------------------------------

app.include_router(auth_router)
app.include_router(store_router)
app.include_router(shelf_router)
app.include_router(analytics_router)
app.include_router(heatmap.router)
app.include_router(recommendation_router)
app.include_router(product_interaction_router)
app.include_router(reports_router)

# ---------------------------------------
# Root endpoint
# ---------------------------------------


@app.get("/")
def root():
    return {
        "message": "Consumer Attention Mapping System API",
        "status": "running",
    }
