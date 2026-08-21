from fastapi import APIRouter
from app.api.v1.auth.router import router as auth_router
from app.api.v1.stores.router import router as stores_router
from app.api.v1.cameras.router import router as cameras_router
from app.api.v1.tracking.router import router as tracking_router
from app.api.v1.analytics.router import router as analytics_router

from app.api.v1.behavior.router import router as behavior_router
from app.api.v1.heatmaps.router import router as heatmaps_router
from app.api.v1.scoring.router import router as scoring_router
from app.api.v1.recommendations.router import router as recommendations_router

api_router = APIRouter()

# Register sub-routers
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(stores_router, prefix="/stores", tags=["Stores"])
api_router.include_router(cameras_router, prefix="/cameras", tags=["Cameras"])
api_router.include_router(tracking_router, prefix="/tracking", tags=["Consumer Tracking"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Attention Analytics"])

# Milestone 3 sub-routers
api_router.include_router(behavior_router, prefix="/behavior", tags=["Behavioral Intelligence"])
api_router.include_router(heatmaps_router, prefix="/heatmaps", tags=["Heatmap Generation"])
api_router.include_router(scoring_router, prefix="/scoring", tags=["Product Scoring"])
api_router.include_router(recommendations_router, prefix="/recommendations", tags=["Recommendations"])
