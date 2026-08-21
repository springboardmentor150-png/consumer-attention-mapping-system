from fastapi import FastAPI
from routes.analytics_routes import router as analytics_router
from fastapi.middleware.cors import CORSMiddleware  
from routes.auth_routes import router
from routes.store_routes import router as store_router

app = FastAPI(title="Consumer Attention Mapping System")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(store_router)
app.include_router(analytics_router)

@app.get("/")
def home():
    return {"status": "running"}