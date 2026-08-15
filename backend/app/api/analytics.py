from fastapi import APIRouter

from app.services.analytics_store import analytics_store


analytics_router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@analytics_router.get("/")
def analytics_home():

    return {
        "message": "Consumer Attention Mapping Analytics API is running"
    }


@analytics_router.get("/status")
def analytics_status():

    return {
        "detection": "active",
        "attention_tracking": "active",
        "heatmap": "active",
        "product_scoring": "active"
    }


@analytics_router.get("/shoppers")
def get_shoppers():

    return {
        "shoppers": analytics_store.get_shoppers(),
        "heatmap": analytics_store.get_heatmap()
    }


@analytics_router.get("/products")
def get_products():

    return analytics_store.get_products()


@analytics_router.get("/heatmap")
def get_heatmap():

    return analytics_store.get_heatmap()

@analytics_router.get("/recommendations")
def get_recommendations():

    return analytics_store.get_recommendations()