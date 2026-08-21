from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4
from sqlmodel import Field, Relationship, SQLModel


class Role(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str 


class User(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    role_id: UUID = Field(foreign_key="role.id")
    is_active: bool = True


class Store(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    location: str
    metadata_info: Optional[str] = None
    shelves: List["Shelf"] = Relationship(back_populates="store")


class Shelf(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    store_id: UUID = Field(foreign_key="store.id")
    shelf_name: str
    zone_coordinates: str 
    store: Store = Relationship(back_populates="shelves")


class AttentionLog(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}

    id: Optional[int] = Field(default=None, primary_key=True)
    shopper_id: int
    shelf_id: str = Field(default="Shelf A (Snacks)")
    dwell_time_seconds: float
    segment_tag: str = Field(default="Quick Buyer")  # Explorer, Quick Buyer, Comparison Shopper
    timestamp: datetime = Field(default_factory=datetime.utcnow)