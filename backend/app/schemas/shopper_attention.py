from pydantic import BaseModel


class ShopperAttentionCreate(BaseModel):

    track_id: int

    shelf_name: str

    attention: str

    yaw: float

    pitch: float

    roll: float

    frame_number: int