from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from fastapi.security import OAuth2PasswordRequestForm

from app.core.database import engine
from app.models.user import User
from app.api.auth.security import (
    hash_password,
    verify_password,
    create_access_token
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


@router.post("/register")
def register(email: str, password: str):
    try:
        with Session(engine) as session:

            existing_user = session.exec(
                select(User).where(User.email == email)
            ).first()

            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail="User already exists"
                )

            user = User(
                email=email,
                password_hash=hash_password(password),
                role_id=1
            )

            session.add(user)
            session.commit()
            session.refresh(user)

            return {
                "message": "User registered successfully",
                "user_id": user.id
            }

    except Exception as e:
        return {
            "error": str(e)
        }


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        with Session(engine) as session:

            user = session.exec(
                select(User).where(User.email == form_data.username)
            ).first()

            if not user:
                raise HTTPException(
                    status_code=404,
                    detail="User not found"
                )

            if not verify_password(
                form_data.password,
                user.password_hash
            ):
                raise HTTPException(
                    status_code=401,
                    detail="Invalid password"
                )

            token = create_access_token(
                {"sub": user.email}
            )

            return {
                "access_token": token,
                "token_type": "Bearer"
            }

    except Exception as e:
        return {
            "error": str(e)
        }