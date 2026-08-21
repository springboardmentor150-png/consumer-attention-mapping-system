from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    mobile_number: str
    password: str
    role_id: int


class LoginRequest(BaseModel):
    email: EmailStr
    password: str