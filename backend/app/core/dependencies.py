from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError

from app.core.config import SECRET_KEY, ALGORITHM

security = HTTPBearer() 


def require_roles(*allowed_roles):
    def role_checker(
        credentials: HTTPAuthorizationCredentials = Depends(security),
    ):
        token = credentials.credentials

        try:
            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM],
            )

            role = payload.get("role")

            if role not in allowed_roles:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied",
                )

            return payload

        except JWTError:
            raise HTTPException(
                status_code=401,
                detail="Invalid token",
            )

    return role_checker