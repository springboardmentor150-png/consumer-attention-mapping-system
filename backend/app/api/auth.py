from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session
from passlib.context import CryptContext
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter()
SECRET_KEY = os.getenv("JWT_SECRET", "supersecretkey123")

class UserRegister(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/register")
def register_user(user_data: UserRegister):
    hashed_pw = pwd_context.hash(user_data.password)
    return {
        "message": "User registered successfully!", 
        "email": user_data.email,
        "hashed_password_preview": hashed_pw 
    }

@router.post("/login")
def login_user(user_data: UserLogin):
    # In the future, we will verify the password against the database here!
    
    # 1. Create JWT Expiration Time (1 hour from now)
    expire = datetime.utcnow() + timedelta(hours=1)
    
    # 2. Create the secure payload
    to_encode = {"sub": user_data.email, "exp": expire}
    
    # 3. Generate the actual token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    
    return {"access_token": encoded_jwt, "token_type": "bearer"}