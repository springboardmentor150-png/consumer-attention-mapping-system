from datetime import datetime
from pydantic import BaseModel


class AnalyticsResponse(BaseModel):
    id: int
    shopper_id: int
    region: str
    focus: str
    dwell_time: float
    entry_time: datetime
    exit_time: datetime
    timestamp: datetime

    class Config:
        from_attributes = True