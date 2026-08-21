from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class ShelfBase(BaseModel):
    store_id: str
    zone_id: Optional[str] = None
    name: str
    aisle_number: str
    shelf_level: int
    coordinates: dict
    width_cm: float
    height_cm: float
    product_categories: List[str]
    planogram_url: Optional[str] = None


class ShelfCreate(ShelfBase):
    pass


class ShelfUpdate(BaseModel):
    store_id: Optional[str] = None
    zone_id: Optional[str] = None
    name: Optional[str] = None
    aisle_number: Optional[str] = None
    shelf_level: Optional[int] = None
    coordinates: Optional[dict] = None
    width_cm: Optional[float] = None
    height_cm: Optional[float] = None
    product_categories: Optional[List[str]] = None
    planogram_url: Optional[str] = None


class ShelfResponse(ShelfBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
