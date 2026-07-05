from fastapi import APIRouter

router = APIRouter()

@router.get('/shelves')
def get_shelves():
    return []
