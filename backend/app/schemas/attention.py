from pydantic import BaseModel


class AttentionCreate(BaseModel):
    shopper_id: int
    shelf: str
    confidence: float


class AttentionResponse(AttentionCreate):
    id: int

    class Config:
        from_attributes = True
