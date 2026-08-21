from datetime import datetime

from pydantic import BaseModel


class ShopperDwellTimeCreate(BaseModel):

    track_id: int

    entry_time: datetime

    exit_time: datetime

    dwell_time_seconds: float


class ShopperDwellTimeResponse(ShopperDwellTimeCreate):

    id: int

    created_at: datetime

    class Config:
        from_attributes = True