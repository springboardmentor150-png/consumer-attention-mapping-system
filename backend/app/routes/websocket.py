from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import random

router = APIRouter()

clients = []

@router.websocket("/ws/dashboard")
async def dashboard_socket(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)

    try:
        while True:
            data = {
                "customers": random.randint(20, 80),
                "dwell": round(random.uniform(5, 30), 2),
                "attention": random.randint(60, 100),
                "shelf": "Shelf A",
            }
            await websocket.send_json(data)
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        clients.remove(websocket)
