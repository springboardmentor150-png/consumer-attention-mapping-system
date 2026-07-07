from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.camera import Camera
from app.schemas.camera import CameraCreate, CameraResponse

router = APIRouter(prefix="/cameras", tags=["Cameras"])


@router.post("/", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
def create_camera(camera: CameraCreate, db: Session = Depends(get_db)):
    db_camera = Camera(
        camera_name=camera.camera_name,
        ip_address=camera.ip_address,
        location=camera.location,
        store_id=camera.store_id,
    )
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    return db_camera


@router.get("/", response_model=list[CameraResponse])
def get_cameras(db: Session = Depends(get_db)):
    return db.query(Camera).all()


@router.put("/{camera_id}", response_model=CameraResponse)
def update_camera(camera_id: int, updated: CameraCreate, db: Session = Depends(get_db)):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Camera Not Found")

    camera.camera_name = updated.camera_name
    camera.ip_address = updated.ip_address
    camera.location = updated.location
    camera.store_id = updated.store_id

    db.commit()
    db.refresh(camera)
    return camera


@router.delete("/{camera_id}")
def delete_camera(camera_id: int, db: Session = Depends(get_db)):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Camera Not Found")

    db.delete(camera)
    db.commit()
    return {"message": "Camera Deleted Successfully"}
