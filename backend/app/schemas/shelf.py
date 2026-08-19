from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any

class ShelfBase(BaseModel):
    shelf_name: str
    category: str
    store_id: int
    zone_coordinates: Optional[Dict[str, Any]] = None

class ShelfCreate(ShelfBase):
    pass

class ShelfResponse(ShelfBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
