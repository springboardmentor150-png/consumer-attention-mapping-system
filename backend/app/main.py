from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware       #to overcome the same origin policy an issue i faced with bf hving diff browsers
from sqlalchemy import text                              #to run raw sql commands

from app.core.database import engine, SessionLocal        #to converse with postgresql
from app.api.auth import router as auth_router
from app.api.stores import router as store_router
from app.api.shelves import router as shelf_router
from app.services.seed import seed_roles                  #db seeding like adding default roles
from app.api.analytics import router as analytics_router
from app.api.cctv import router as cctv_router
from app.api.video_analytics import router as video_router
from app.api.attractiveness_analytics import router as attractiveness_router
from app.models.analytics import Analytics
from app.models.video_track import VideoRecord, PersonTrack, TrackingPoint

from app.models.role import Role
from app.models.user import User
from app.models.store import Store
from app.models.shelf import Shelf
from app.core.database import Base

app = FastAPI(title="Consumer Attention Mapping API")      #line for uvicorn server

Base.metadata.create_all(bind=engine)

# -------------------- CORS --------------------
app.add_middleware(                                         #middleware checks request orgin
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://10.57.80.125:3000",
        "http://10.198.88.125:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ----------------------------------------------

app.include_router(auth_router)
app.include_router(store_router)
app.include_router(shelf_router)
app.include_router(analytics_router)
app.include_router(cctv_router)
app.include_router(video_router)
app.include_router(attractiveness_router)

db = SessionLocal()                 #open db session sesh and insert default roles if u want and close db sesh
seed_roles(db)
db.close()


@app.get("/")
def root():
    return {
        "message": "Consumer Attention Mapping System Backend Running"          #when they open the url this is the msg they get
    }


@app.get("/test-db")
def test_database():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"message": "Database Connected Successfully ✅"}
    except Exception as e:
        return {"error": str(e)}