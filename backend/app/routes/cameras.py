from fastapi import APIRouter

router = APIRouter()

@router.get('/cameras')
def get_cameras():
    return []
