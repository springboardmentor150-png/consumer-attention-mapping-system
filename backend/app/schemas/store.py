from pydantic import BaseModel


class StoreBase(BaseModel):
    name: str
    location: str


class StoreCreate(StoreBase):
    pass
