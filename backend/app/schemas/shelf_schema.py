from pydantic import BaseModel


class ShelfCreate(BaseModel):

    name: str
    category: str

    x1: int
    y1: int
    x2: int
    y2: int


class ShelfResponse(ShelfCreate):

    id: int
    store_id: int

    class Config:
        from_attributes = True