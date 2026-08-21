from pydantic import BaseModel
from datetime import datetime


class DwellCreate(BaseModel):
    shopper_id: int
    shelf_id: int
    store_id: int
    entry_time: datetime
    exit_time: datetime
    duration: float


class DwellResponse(BaseModel):
    shopper_id: int
    shelf_id: int
    store_id: int
    duration: float

    class Config:
        from_attributes = True
