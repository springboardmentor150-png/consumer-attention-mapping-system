from datetime import datetime
from pydantic import BaseModel


class AnalyticsResponse(BaseModel):

    id: int

    shopper_id: int

    region: str

    focus: str

    dwell_time: float

    path_length: float

    shelf_visits: int

    gaze_shifts: int

    segment: str | None = None

    entry_time: datetime

    exit_time: datetime

    timestamp: datetime

    class Config:
        from_attributes = True