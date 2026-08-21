from pydantic import BaseModel
from typing import Optional

class ShelfCreate(BaseModel):
    zone_name: str
    store_id: int
    zone_coordinates: Optional[str] = None