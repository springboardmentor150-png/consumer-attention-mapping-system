from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.schemas.auth import RegisterRequest, LoginRequest
from app.services.auth_service import register_user, login_user

from app.middleware.auth_middleware import (
    get_current_user,
    require_store_manager
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register")
def register(
    user: RegisterRequest,
    db: Session = Depends(get_db)
):
    return register_user(db, user)


@router.post("/login")
def login(
    user: LoginRequest,
    db: Session = Depends(get_db)
):
    return login_user(db, user)


@router.get("/profile")
def profile(
    current_user=Depends(get_current_user)
):
    return {
        "message": "Welcome",
        "user": current_user
    }


@router.get("/manager")
def manager_dashboard(
    current_user=Depends(get_current_user)
):
    require_store_manager(current_user)

    return {
        "message": "Welcome Store Manager"
    }