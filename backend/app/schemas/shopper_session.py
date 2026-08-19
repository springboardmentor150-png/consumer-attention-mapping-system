from pydantic import BaseModel


class ShopperSessionCreate(BaseModel):
    shopper_id: int
    path_length: float
    total_dwell_time: float
    shelf_dwell_time: float
    gaze_shifts: int


class ShopperSessionResponse(BaseModel):
    id: int
    shopper_id: int
    path_length: float
    total_dwell_time: float
    shelf_dwell_time: float
    gaze_shifts: int
    segment: str

    class Config:
        from_attributes = True
