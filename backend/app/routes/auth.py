from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.utils.auth import create_access_token

router = APIRouter(prefix='/auth', tags=['auth'])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post('/login')
def login_user(credentials: LoginRequest):
    if credentials.email and credentials.password:
        access_token = create_access_token(
            {'sub': credentials.email, 'role': 'admin', 'name': credentials.email.split('@')[0]}
        )
        return {'access_token': access_token, 'token_type': 'bearer'}

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Invalid email or password',
    )
