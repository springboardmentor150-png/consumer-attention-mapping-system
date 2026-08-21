from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)


def register_user(db: Session, user: RegisterRequest):

    # Check if email already exists
    existing_email = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if mobile number already exists
    existing_mobile = db.query(User).filter(
        User.mobile_number == user.mobile_number
    ).first()

    if existing_mobile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile Number already registered"
        )

    # Hash Password
    hashed_password = hash_password(user.password)

    # Create New User
    new_user = User(
        username=user.username,
        email=user.email,
        mobile_number=user.mobile_number,
        password=hashed_password,
        role_id=user.role_id
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User Registered Successfully"
    }


def login_user(db: Session, login_data: LoginRequest):

    # Find user by email
    user = db.query(User).filter(
        User.email == login_data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Email or Password"
        )

    # Verify password
    if not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Email or Password"
        )

    # Generate JWT Token
    access_token = create_access_token(
        data={
            "sub": user.email,
            "role_id": user.role_id
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role_id": user.role_id,
        "username": user.username,
        "email": user.email,
        "mobile_number": user.mobile_number
    }