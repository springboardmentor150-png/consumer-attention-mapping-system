from fastapi import FastAPI
from app.database.database import Base, engine
from app.models import camera, shelf, store, user
from app.routers import auth
from app.routes import users, stores, shelves, cameras

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Consumer Attention Mapping System")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(stores.router)
app.include_router(shelves.router)
app.include_router(cameras.router)

@app.get("/")
def home():
    return {"message": "API Running Successfully"}
