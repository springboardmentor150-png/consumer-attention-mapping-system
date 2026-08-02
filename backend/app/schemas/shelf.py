from pydantic import BaseModel

class ShelfBase(BaseModel):
    name: str
    store_id: int

class ShelfCreate(ShelfBase):
    pass
