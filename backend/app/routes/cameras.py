from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.camera import Camera
from app.schemas.camera import CameraCreate

router = APIRouter()

@router.get('/cameras')
def get_cameras(db: Session = Depends(get_db)):
    return db.query(Camera).all()

@router.post('/cameras', status_code=status.HTTP_201_CREATED)
def create_camera(camera: CameraCreate, db: Session = Depends(get_db)):
    db_camera = Camera(
        camera_name=camera.camera_name,
        ip_address=camera.ip_address,
        location=camera.location,
        store_id=camera.store_id
    )
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    return db_camera

@router.delete('/cameras/{camera_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_camera(camera_id: int, db: Session = Depends(get_db)):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Camera not found")
    db.delete(camera)
    db.commit()
