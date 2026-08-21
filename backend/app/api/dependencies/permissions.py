from fastapi import Depends, HTTPException, status
from app.models.user import User, UserRole
from app.api.dependencies.auth import get_current_active_user

async def require_super_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Require user to be a super admin."""
    if current_user.role != UserRole.super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Requires Super Admin privileges."
        )
    return current_user

async def require_store_manager(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Require user to be at least a store manager or super admin."""
    if current_user.role not in (UserRole.super_admin, UserRole.store_manager):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Requires Store Manager privileges."
        )
    return current_user

async def require_analyst(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Require user to be at least a retail analyst, store manager, or super admin."""
    allowed_roles = (UserRole.super_admin, UserRole.store_manager, UserRole.retail_analyst)
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Requires Retail Analyst privileges."
        )
    return current_user

async def require_marketing_manager(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Require user to be a marketing manager or super admin."""
    if current_user.role not in (UserRole.super_admin, UserRole.marketing_manager):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Requires Marketing Manager privileges."
        )
    return current_user

def require_role(allowed_roles: list):
    """Dependency factory requiring user to have one of the specified roles."""
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_role_val = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        if user_role_val not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Access requires one of roles {allowed_roles}."
            )
        return current_user
    return role_checker

