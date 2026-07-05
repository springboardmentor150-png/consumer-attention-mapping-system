from pydantic import BaseModel

class CameraBase(BaseModel):
    name: str
    shelf_id: int
    status: str = "active"

class CameraCreate(CameraBase):
    pass
