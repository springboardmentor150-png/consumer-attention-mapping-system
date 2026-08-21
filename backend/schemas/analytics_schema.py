from pydantic import BaseModel

class ShelfAnalytics(BaseModel):
    shelf_id: int
    total_visitors: int
    average_dwell_time: float