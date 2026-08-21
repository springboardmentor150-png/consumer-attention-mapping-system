from sqlalchemy.orm import Session

from app.models.shopper_behavior import ShopperBehavior
from app.schemas.shopper_behavior import ShopperBehaviorCreate


class ShopperBehaviorService:

    def save_behavior(self, db: Session, behavior: ShopperBehaviorCreate):

        data = ShopperBehavior(**behavior.model_dump())

        db.add(data)

        db.commit()

        db.refresh(data)

        return data

    def get_all_behavior(self, db: Session):

        return db.query(ShopperBehavior).all()


shopper_behavior_service = ShopperBehaviorService()