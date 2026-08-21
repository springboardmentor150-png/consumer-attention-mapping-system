from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role_id: int


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class StoreCreate(BaseModel):
    store_name: str
    location: str


class ShelfCreate(BaseModel):
    store_id: int
    zone_name: str