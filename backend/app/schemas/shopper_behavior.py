from datetime import datetime
from pydantic import BaseModel


class ShopperBehaviorCreate(BaseModel):
    track_id: int
    entry_time: datetime
    exit_time: datetime
    dwell_time: float
    path_length: float
    shelves_visited: int
    behavior_segment: str


class ShopperBehaviorResponse(ShopperBehaviorCreate):
    id: int

    class Config:
        from_attributes = True