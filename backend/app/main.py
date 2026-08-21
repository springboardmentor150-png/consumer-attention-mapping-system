from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import Base, SessionLocal, engine
from app.database.seed import seed_database
from app.models import (
    attention, attention_event, camera, customer_path, dwell, heatmap_point,
    product_score, recommendation, role, shelf, shelf_zone, shopper_session, store, tracking_session, user
)
from app.routes import users, stores, shelves, cameras as cameras_route
from app.routes import dashboard
from app.routes.analytics import router as analytics_route_router
from app.routes.analytics_segmentation import router as analytics_segmentation_router
from app.routes.heatmaps import router as heatmaps_router
from app.routes.attractiveness import router as attractiveness_router
from app.routes.recommendations import router as recommendations_router
from app.routers import auth as auth_router
from app.routers import cameras as cameras_router
from app.routers import tracking
from app.routers import attention as attention_router
from app.api.analytics import router as analytics_router
from app.api.attention import router as attention_api_router
from app.api.heatmap import router as heatmap_router
from app.routes.heatmap import router as heatmap_route_router
from app.routes.websocket import router as websocket_router
from app.routes.reports import router as reports_router
from app.api.path import router as path_router
from app.api.path_statistics import router as path_statistics_router
from app.api.video import router as video_router

app = FastAPI(title="Consumer Attention Mapping System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.database.seed import seed_database, check_and_migrate_schema

# Ensure schema compatibility for PostgreSQL and SQLite
check_and_migrate_schema(engine)
Base.metadata.create_all(bind=engine)

# Seed database on startup if tables are empty
db_session = SessionLocal()
try:
    seed_database(db_session)
finally:
    db_session.close()

app.include_router(auth_router.router)
app.include_router(users.router)
app.include_router(stores.router)
app.include_router(shelves.router)
app.include_router(cameras_route.router)
app.include_router(cameras_router.router)
app.include_router(tracking.router)
app.include_router(attention_router.router)
app.include_router(analytics_route_router)
app.include_router(analytics_segmentation_router)
app.include_router(heatmaps_router)
app.include_router(attractiveness_router)
app.include_router(recommendations_router)
app.include_router(analytics_router)
app.include_router(attention_api_router)
app.include_router(heatmap_router, prefix="/api/heatmap", tags=["Heatmap"])
app.include_router(heatmap_route_router)
app.include_router(websocket_router)
app.include_router(reports_router)
app.include_router(path_router, prefix="/api/path", tags=["Customer Path"])
app.include_router(path_statistics_router, prefix="/api/path-statistics", tags=["Path Statistics"])
app.include_router(video_router)
app.include_router(dashboard.router)

@app.get('/')
def root():
    return {'message': 'API is running'}
