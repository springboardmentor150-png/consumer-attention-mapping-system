from sqlalchemy.orm import Session

from app.models.role import Role


def seed_roles(db: Session):
    print("Checking roles...")

    if db.query(Role).count() == 0:
        roles = [
            Role(id=1, name="SuperAdmin"),
            Role(id=2, name="StoreManager"),
            Role(id=3, name="Analyst"),
        ]

        db.add_all(roles)
        db.commit()

        print("Default roles seeded.")
    else:
        print("Roles already exist.")