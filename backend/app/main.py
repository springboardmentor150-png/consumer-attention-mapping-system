from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import engine
from app.models import attention, camera, role, shelf, store, user, dwell
from app.routes import auth, users, stores, shelves, cameras
from app.routers import tracking
from app.routers import attention as attention_router
from app.routers.analytics import router as analytics_router

app = FastAPI(title="Consumer Attention Mapping System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base = user.Base
Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(stores.router)
app.include_router(shelves.router)
app.include_router(cameras.router)
app.include_router(tracking.router)
app.include_router(attention_router.router)
app.include_router(analytics_router)

@app.get('/')
def root():
    return {'message': 'API is running'}
