from pydantic import BaseModel


class ShelfCreate(BaseModel):
    shelf_name: str
    zone_coordinates: str


class ShelfResponse(ShelfCreate):
    id: int
    store_id: int

    class Config:
        from_attributes = True