from fastapi import APIRouter

# This creates a new group of routes for store layouts
router = APIRouter()

@router.get("/stores")
def get_all_stores():
    return {"message": "This will return a list of all stores"}

@router.post("/stores")
def create_new_store(store_data: dict):
    # In the future, this will save to PostgreSQL
    return {"message": "Store created successfully!", "data": store_data}

@router.get("/stores/{store_id}/shelves")
def get_store_shelves(store_id: str):
    return {"message": f"This will return all shelves for store ID: {store_id}"}

@router.post("/stores/{store_id}/shelves")
def create_store_shelf(store_id: str, shelf_data: dict):
    return {"message": f"Shelf added to store ID: {store_id}", "data": shelf_data}