from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.core.database import get_db
from app.core.jwt_handler import SECRET_KEY, ALGORITHM

from app.models.user import User

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = int(payload["sub"])

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid Token"
        )

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:

        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


def require_role(allowed_roles: list):

    def role_checker(
        current_user: User = Depends(get_current_user)
    ):

        if current_user.role.role_name not in allowed_roles:

            raise HTTPException(
                status_code=403,
                detail="You are not authorized to perform this action."
            )

        return current_user

    return role_checker