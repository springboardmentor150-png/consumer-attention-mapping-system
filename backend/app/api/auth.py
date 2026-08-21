from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.hashing import hash_password, verify_password
from app.core.jwt_handler import create_access_token
from app.core.database import get_db

from app.models.user import User
from app.schemas.user import UserRegister, UserLogin

router = APIRouter()


@router.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered."
        )

    hashed_password = hash_password(user.password)

    new_user = User(
        email=user.email,
        password_hash=hashed_password,
        role_id=user.role_id
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully!",
        "user_id": new_user.id,
        "email": new_user.email
    }


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user.password,
        existing_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(
        data={
            "sub": str(existing_user.id),
            "email": existing_user.email,
            "role": existing_user.role.role_name
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": existing_user.id,
            "email": existing_user.email,
            "role": existing_user.role.role_name,
            "is_active": existing_user.is_active
        }
    }