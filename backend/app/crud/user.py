from sqlalchemy.orm import Session

from app.core.dependencies import ANALYST
from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User


# Self-registration must never hand out an elevated role. Analyst is the
# lowest-privilege role in the system: it appears only in ALL_ROLES and in
# neither MANAGEMENT_ROLES nor ADMIN_ONLY, so it carries no create, edit or
# delete capability on any route. Previously this defaulted to role_id 2
# (StoreManager), which let anyone who could reach the public /register
# endpoint self-issue shelf-management rights.
DEFAULT_REGISTRATION_ROLE = ANALYST

# Matches the id Analyst is seeded with in app/services/seed.py. Only used if
# the roles table has not been seeded, so registration degrades to the safe
# role rather than failing or falling back to a privileged one.
DEFAULT_REGISTRATION_ROLE_ID = 3


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_role_by_name(db: Session, name: str):
    return db.query(Role).filter(Role.name == name).first()


def create_user(
    db: Session,
    email: str,
    password: str,
    role_id: int | None = None,
):
    """
    Create a user.

    role_id is resolved to the lowest-privilege role when not supplied. An
    explicit role_id is still accepted so a future authenticated admin action
    can assign one — no public endpoint passes it, and the registration route
    never forwards a caller-supplied value.
    """

    if role_id is None:
        default_role = get_role_by_name(db, DEFAULT_REGISTRATION_ROLE)

        role_id = (
            default_role.id
            if default_role is not None
            else DEFAULT_REGISTRATION_ROLE_ID
        )

    hashed_pw = hash_password(password)

    user = User(
        email=email,
        hashed_password=hashed_pw,
        role_id=role_id,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user
