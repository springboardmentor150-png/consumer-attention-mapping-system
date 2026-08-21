from pydantic import BaseModel


class StoreCreate(BaseModel):
    name: str
    location: str


class StoreResponse(StoreCreate):
    id: int

    class Config:
        from_attributes = True