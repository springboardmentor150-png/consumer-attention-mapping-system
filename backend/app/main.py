from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from loguru import logger
from app.api.v1.router import api_router
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.db.redis_client import redis_client
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.auth_middleware import AuthMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for database, MongoDB, and Redis client sessions."""
    logger.info("Starting up CAMS backend infrastructure services...")

    # Establish MongoDB connection
    try:
        connect_to_mongo()
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB during startup: {str(e)}")

    # Establish Redis connection
    try:
        await redis_client.connect()
    except Exception as e:
        logger.error(f"Failed to connect to Redis during startup: {str(e)}")

    logger.info("CAMS backend application initialized successfully.")
    yield

    # Clean up connections on shutdown
    logger.info("Shutting down CAMS backend services...")
    try:
        close_mongo_connection()
    except Exception as e:
        logger.error(f"Error closing MongoDB connection: {str(e)}")

    try:
        await redis_client.disconnect()
    except Exception as e:
        logger.error(f"Error disconnecting from Redis: {str(e)}")

    logger.info("CAMS backend shutdown complete.")

app = FastAPI(
    title=settings.APP_NAME,
    description="Consumer Attention Mapping System (CAMS) REST API Service",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS configuration
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom middlewares (Auth verification and log metrics)
app.add_middleware(AuthMiddleware)
app.add_middleware(LoggingMiddleware)

import os
from fastapi.staticfiles import StaticFiles

# Ensure static directories exist
os.makedirs("static/heatmaps", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Register routers
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix="/api/v1")  # Alias for fallback compatibility

@app.get("/health", tags=["System Health"])
async def health_check() -> dict:
    """System status check endpoint."""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV
    }

@app.get("/", tags=["System Root"])
async def root() -> dict:
    """Welcome root message containing API documentation redirect links."""
    return {
        "message": f"Welcome to the {settings.APP_NAME} service. Access documentation at /api/docs"
    }
