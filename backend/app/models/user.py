from typing import Optional
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str
    password_hash: str
    role_id: int = Field(foreign_key="role.id")
    is_active: bool = True