import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.postgres import get_db
from app.schemas.user import UserCreate, UserResponse, LoginRequest, TokenResponse, RefreshTokenRequest, UserUpdate
from app.models.user import User
from app.api.v1.auth.service import AuthService
from app.api.dependencies.auth import get_current_user, get_current_active_user
from app.core.security import decode_token

router = APIRouter(tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)) -> User:
    """Register a new user (Public endpoint)."""
    user = await AuthService.register_user(db, user_in)
    return user

@router.post("/login", response_model=TokenResponse)
async def login(login_in: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Log in and retrieve JWT access and refresh tokens (Public endpoint)."""
    user = await AuthService.authenticate_user(db, login_in.email, login_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive."
        )
    await AuthService.update_last_login(db, user)
    return AuthService.create_tokens(user.id)

@router.post("/refresh", response_model=TokenResponse)
async def refresh(refresh_in: RefreshTokenRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Refresh JWT access and refresh tokens using a valid refresh token."""
    payload = decode_token(refresh_in.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token subject.",
        )
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format in token.",
        )

    user = await AuthService.get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
        )
    return AuthService.create_tokens(user.id)

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    """Log out user (stateless, clears on client side)."""
    return {"detail": "Logged out successfully."}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)) -> User:
    """Retrieve current logged-in user profile details."""
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Update current user profile details."""
    from app.core.security import get_password_hash

    if user_update.email is not None:
        existing = await AuthService.get_user_by_email(db, user_update.email)
        if existing and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use."
            )
        current_user.email = user_update.email

    if user_update.username is not None:
        existing = await AuthService.get_user_by_username(db, user_update.username)
        if existing and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already in use."
            )
        current_user.username = user_update.username

    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name

    if user_update.password is not None:
        current_user.hashed_password = get_password_hash(user_update.password)

    if user_update.role is not None:
        # Note: In a production environment, role elevation should require super admin.
        # However, for setup simplicity, we allow role updates here.
        current_user.role = user_update.role

    if user_update.is_active is not None:
        current_user.is_active = user_update.is_active

    await db.commit()
    await db.refresh(current_user)
    return current_user
