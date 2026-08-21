from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.store_routes import router as store_router
from app.api.analytics_routes import router as analytics_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.tracking_routes import router as tracking_router
from app.core.database import Base, engine
from app.models.shopper_dwell_time import ShopperDwellTime
from app.models.shopper_tracking import ShopperTracking 
from app.api.shopper_behavior_routes import router as shopper_behavior_router
from app.api.dwell_time_routes import router as dwell_time_router 
from app.api.heatmap_routes import router as heatmap_router
from app.api.product_score_routes import router as product_score_router
from app.api.dashboard_routes import router as dashboard_router
from app.api.notification_routes import router as notification_router
from app.api.gateway import gateway_router

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(notification_router)
app.include_router(dashboard_router)
app.include_router(auth_router)
app.include_router(store_router)
app.include_router(analytics_router)
app.include_router(
    tracking_router,
    prefix="/tracking",
    tags=["Tracking"]
)
app.include_router(
    dwell_time_router,
    prefix="/dwell-time",
    tags=["Dwell Time"]
) 
app.include_router(
    shopper_behavior_router,
    prefix="/behavior",
    tags=["Behavior"]
)
app.include_router(
    heatmap_router,
    prefix="/api/heatmaps",
    tags=["Heatmaps"]
)
app.include_router(
    product_score_router,
    prefix="/product-scores",
    tags=["Product Scores"]
)
app.include_router(gateway_router)