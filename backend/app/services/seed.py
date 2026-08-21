from sqlalchemy.orm import Session

from app.core.dependencies import (
    ANALYST,
    MARKETING_MANAGER,
    STORE_MANAGER,
    SUPER_ADMIN,
)
from app.models.role import Role


# Role rows the application expects to exist, keyed by their stable id.
DEFAULT_ROLES = (
    (1, SUPER_ADMIN),
    (2, STORE_MANAGER),
    (3, ANALYST),
    (4, MARKETING_MANAGER),
)


def seed_roles(db: Session):
    print("Checking roles...")

    # Seeded one row at a time rather than only when the table is empty: a
    # database created before a role was added would otherwise never receive
    # it, leaving that role impossible to assign.
    existing = {
        name for (name,) in db.query(Role.name).all()
    }

    added = [
        Role(id=role_id, name=name)
        for role_id, name in DEFAULT_ROLES
        if name not in existing
    ]

    if not added:
        print("Roles already exist.")
        return

    db.add_all(added)
    db.commit()

    print(
        "Seeded roles: "
        + ", ".join(role.name for role in added)
    )
