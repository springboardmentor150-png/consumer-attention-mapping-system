import uuid as uuid_lib
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.core.config import settings
from app.core.security import decode_token
from app.db.postgres import get_db

# OAuth2 token extraction scheme
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login"
)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Extract Bearer JWT, validate it, and return the matching User row."""
    from app.models.user import User

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(token)
    if not payload:
        raise credentials_exception
    if payload.get("type") != "access":
        raise credentials_exception

    user_id_str: str = payload.get("sub")
    if not user_id_str:
        raise credentials_exception

    # Validate the UUID string format
    try:
        uuid_lib.UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    # Use a raw string comparison that is compatible with both
    # PostgreSQL (UUID column) and SQLite (TEXT column used in tests)
    result = await db.execute(
        select(User).where(User.id == user_id_str)
    )
    user = result.scalars().first()

    # SQLite fallback: if not found, try comparing via text cast
    if user is None:
        result2 = await db.execute(
            text("SELECT * FROM users WHERE CAST(id AS TEXT) = :uid"),
            {"uid": user_id_str}
        )
        row = result2.mappings().first()
        if row:
            result3 = await db.execute(select(User).where(User.email == row["email"]))
            user = result3.scalars().first()

    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user=Depends(get_current_user)):
    """Guard: raise 400 if the user's account is deactivated."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user
