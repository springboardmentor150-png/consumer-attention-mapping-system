from fastapi import APIRouter
from pydantic import BaseModel

from app.services.product_interaction import ProductInteractionService

router = APIRouter(
    prefix="/analytics",
    tags=["Product Interactions"],
)


class ProductInteractionRequest(BaseModel):

    shopper_id: int
    product_name: str
    event_type: str
    duration: float = 0


@router.post("/interactions")
def record_interaction(data: ProductInteractionRequest):

    allowed_events = {
        "view",
        "pickup",
        "purchase",
    }

    if data.event_type not in allowed_events:
        return {
            "success": False,
            "message": "Invalid event type",
            "allowed_events": list(allowed_events),
        }

    event = ProductInteractionService().record_event(
        shopper_id=data.shopper_id,
        product_name=data.product_name,
        event_type=data.event_type,
        duration=data.duration,
    )

    return {
        "success": True,
        "message": "Interaction recorded",
        "event_id": event.id,
    }
