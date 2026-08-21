from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError

from app.core.config import SECRET_KEY, ALGORITHM

security = HTTPBearer()


# Role names exactly as they are seeded into the roles table and written into
# the JWT by /api/auth/login. Referencing these instead of bare strings keeps
# every route gated against the same spelling.
SUPER_ADMIN = "SuperAdmin"
STORE_MANAGER = "StoreManager"
ANALYST = "Analyst"
MARKETING_MANAGER = "MarketingManager"

# Access tiers used across the API. They exist so a route declares the tier it
# belongs to rather than repeating role literals — the check itself is still
# require_roles below, there is no second authorization path.
#
#   ALL_ROLES        read-only analytical surfaces every signed-in role may see
#   MANAGEMENT_ROLES day-to-day operational configuration (shelves, cameras)
#   ADMIN_ONLY       store records and user administration
#
# MarketingManager is a read-only analytics consumer, so it joins ALL_ROLES
# alongside Analyst and appears in neither of the two management tiers.
ALL_ROLES = (SUPER_ADMIN, STORE_MANAGER, ANALYST, MARKETING_MANAGER)
MANAGEMENT_ROLES = (SUPER_ADMIN, STORE_MANAGER)
ADMIN_ONLY = (SUPER_ADMIN,)


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