from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role_id: int

class UserLogin(BaseModel):
    email: EmailStr
    password: str