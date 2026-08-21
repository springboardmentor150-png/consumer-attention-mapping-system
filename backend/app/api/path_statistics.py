from fastapi import APIRouter

router = APIRouter()


@router.get("/summary")
def summary():
    return {
        "average_path_length": 24.6,
        "average_speed": 1.8,
        "most_common_route": [
            "Entrance",
            "Shelf 2",
            "Shelf 5",
            "Billing",
        ],
        "total_customers": 83,
    }
