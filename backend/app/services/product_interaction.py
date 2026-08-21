from app.core.database import SessionLocal
from app.models.product_interaction import ProductInteraction


class ProductInteractionService:

    def record_event(
        self,
        shopper_id,
        product_name,
        event_type,
        duration=0,
    ):

        db = SessionLocal()

        try:

            event = ProductInteraction(
                shopper_id=shopper_id,
                product_name=product_name,
                event_type=event_type,
                duration=duration,
            )

            db.add(event)
            db.commit()
            db.refresh(event)

            return event

        finally:
            db.close()
