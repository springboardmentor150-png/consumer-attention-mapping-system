from typing import Optional
from sqlmodel import SQLModel, Field


class Shelf(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    store_id: int = Field(foreign_key="store.id")
    shelf_name: str
    zone_coordinates: str