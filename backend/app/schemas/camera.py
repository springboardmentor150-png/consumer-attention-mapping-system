from pydantic import BaseModel, ConfigDict


class CameraBase(BaseModel):
    camera_name: str
    ip_address: str
    location: str
    store_id: int


class CameraCreate(CameraBase):
    pass


class CameraResponse(CameraBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
