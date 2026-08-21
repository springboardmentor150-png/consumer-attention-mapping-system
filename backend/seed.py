from sqlalchemy.orm import Session

from app.models.role import Role


def seed_roles(db: Session):

    roles = [
        "Admin",
        "Store Manager",
        "Retail Analyst",
        "Marketing Manager"
    ]

    for role_name in roles:

        existing_role = db.query(Role).filter(
            Role.role_name == role_name
        ).first()

        if not existing_role:
            db.add(Role(role_name=role_name))

    db.commit()