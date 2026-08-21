from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.store_routes import router as store_router
from app.api.analytics_routes import router as analytics_router
from app.api.tracking_routes import router as tracking_router
from app.api.shopper_behavior_routes import router as shopper_behavior_router
from app.api.dwell_time_routes import router as dwell_time_router
from app.api.heatmap_routes import router as heatmap_router
from app.api.product_score_routes import router as product_score_router
from app.api.dashboard_routes import router as dashboard_router
from app.api.notification_routes import router as notification_router


# =========================================================
# API GATEWAY
# =========================================================

gateway_router = APIRouter(
    prefix="/api",
)


# =========================================================
# AUTH
# =========================================================

gateway_router.include_router(
    auth_router,
)


# =========================================================
# STORES
# =========================================================

gateway_router.include_router(
    store_router,
)


# =========================================================
# ANALYTICS
# =========================================================

gateway_router.include_router(
    analytics_router,
)


# =========================================================
# TRACKING
# =========================================================

gateway_router.include_router(
    tracking_router,
    prefix="/tracking",
    tags=["Tracking"],
)


# =========================================================
# DWELL TIME
# =========================================================

gateway_router.include_router(
    dwell_time_router,
    prefix="/dwell-time",
    tags=["Dwell Time"],
)


# =========================================================
# SHOPPER BEHAVIOR
# =========================================================

gateway_router.include_router(
    shopper_behavior_router,
    prefix="/behavior",
    tags=["Behavior"],
)


# =========================================================
# HEATMAP
# =========================================================

gateway_router.include_router(
    heatmap_router,
    prefix="/heatmaps",
    tags=["Heatmaps"],
)


# =========================================================
# PRODUCT SCORES
# =========================================================

gateway_router.include_router(
    product_score_router,
    prefix="/product-scores",
    tags=["Product Scores"],
)


# =========================================================
# DASHBOARD
# =========================================================

gateway_router.include_router(
    dashboard_router,
)


# =========================================================
# NOTIFICATIONS
# =========================================================

gateway_router.include_router(
    notification_router,
)