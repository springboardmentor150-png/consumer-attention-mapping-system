from pydantic import BaseModel, ConfigDict

class StoreBase(BaseModel):
    store_name: str
    location: str

class StoreCreate(StoreBase):
    pass


class StoreResponse(StoreBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
