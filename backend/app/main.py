from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import engine
from app.models import camera, role, shelf, store, user
from app.routes import auth, users, stores, shelves, cameras

app = FastAPI(title="Consumer Attention Mapping System")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?",
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

@app.get('/')
def root():
    return {'message': 'API is running'}
