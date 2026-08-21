from pydantic import BaseModel
from typing import Optional


class StoreCreate(BaseModel):
    store_name: str
    location: str
    store_metadata: Optional[str] = None