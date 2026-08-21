from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict, model_validator
from app.models.zone import ZoneType


class ZoneCreate(BaseModel):
    store_id: str
    name: str
    zone_type: ZoneType = ZoneType.aisle
    coordinates: List[List[float]]
    area_sqft: float


class ZoneUpdate(BaseModel):
    store_id: Optional[str] = None
    name: Optional[str] = None
    zone_type: Optional[ZoneType] = None
    coordinates: Optional[List[List[float]]] = None
    area_sqft: Optional[float] = None


class ZoneResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    zone_id: str
    name: str
    coordinates: List[List[float]]

    @model_validator(mode="before")
    @classmethod
    def map_fields(cls, v: Any) -> Any:
        if hasattr(v, "id"):
            return {
                "zone_id": v.id,
                "name": v.name,
                "coordinates": v.coordinates
            }
        if isinstance(v, dict) and "id" in v and "zone_id" not in v:
            v["zone_id"] = v.pop("id")
        return v
