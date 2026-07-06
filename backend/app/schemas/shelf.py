from pydantic import BaseModel, ConfigDict

class ShelfBase(BaseModel):
    shelf_name: str
    category: str
    store_id: int

class ShelfCreate(ShelfBase):
    pass


class ShelfResponse(ShelfBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
