from fastapi import APIRouter

router = APIRouter(prefix="/heatmap", tags=["Heatmap"])

@router.get("/")
def get_heatmap():
    return {
        "layout_width": 1000,
        "layout_height": 600,
        "shelves": [
            {
                "id": 1,
                "name": "Shelf A",
                "x": 80,
                "y": 100,
                "width": 120,
                "height": 70,
                "attention": 90,
            },
            {
                "id": 2,
                "name": "Shelf B",
                "x": 300,
                "y": 100,
                "width": 120,
                "height": 70,
                "attention": 65,
            },
            {
                "id": 3,
                "name": "Shelf C",
                "x": 520,
                "y": 100,
                "width": 120,
                "height": 70,
                "attention": 40,
            },
            {
                "id": 4,
                "name": "Shelf D",
                "x": 750,
                "y": 100,
                "width": 120,
                "height": 70,
                "attention": 15,
            },
        ],
    }
