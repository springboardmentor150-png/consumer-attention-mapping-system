from fastapi import FastAPI
from app.routes import auth, users, stores, shelves, cameras

app = FastAPI(title="Consumer Attention Mapping System")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(stores.router)
app.include_router(shelves.router)
app.include_router(cameras.router)

@app.get('/')
def root():
    return {'message': 'API is running'}
