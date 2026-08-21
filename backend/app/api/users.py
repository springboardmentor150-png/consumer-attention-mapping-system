from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import ADMIN_ONLY, require_roles
from app.models.role import Role
from app.models.user import User


router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
    # User administration is the most privileged surface there is, so it sits
    # in the same tier as store records: SuperAdmin only.
    dependencies=[Depends(require_roles(*ADMIN_ONLY))],
)


class RoleChange(BaseModel):
    # Role name as stored in the roles table, e.g. "StoreManager". Names are
    # used rather than ids so a caller cannot promote someone by guessing a
    # number, and so the request reads the same as the seeded data.
    role: str


def serialise(user: User, role_name: str | None):
    return {
        "id": user.id,
        "email": user.email,
        "is_active": user.is_active,
        "role_id": user.role_id,
        "role": role_name,
    }


@router.get("/")
def list_users(db: Session = Depends(get_db)):
    """Every user with their current role, so an admin can pick one."""

    rows = (
        db.query(User, Role)
        .outerjoin(Role, Role.id == User.role_id)
        .order_by(User.id)
        .all()
    )

    return [serialise(user, role.name if role else None) for user, role in rows]


@router.patch("/{user_id}/role")
def change_user_role(
    user_id: int,
    data: RoleChange,
    db: Session = Depends(get_db),
):
    """
    Assign a different role to a user.

    Registration deliberately issues the lowest-privilege role, so this is the
    only supported way to promote someone — previously it needed a manual
    UPDATE against the database.
    """

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail=f"User not found: {user_id}",
        )

    role = db.query(Role).filter(Role.name == data.role).first()

    if role is None:
        known = [name for (name,) in db.query(Role.name).order_by(Role.id).all()]

        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown role: {data.role}. Available: " + ", ".join(known)
            ),
        )

    user.role_id = role.id

    db.commit()
    db.refresh(user)

    return serialise(user, role.name)
