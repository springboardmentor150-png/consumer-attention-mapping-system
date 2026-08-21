from pydantic import BaseModel


class ShopperTrackingCreate(BaseModel):

    track_id: int

    x1: int
    y1: int

    x2: int
    y2: int

    confidence: float

    frame_number: int

    # NEW FIELD
    shelf_name: str