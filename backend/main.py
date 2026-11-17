"""Disabled starter backend. No credential or unauthenticated room access."""
from fastapi import FastAPI, HTTPException, WebSocket

app = FastAPI(title="FluentTalk Backend (disabled)")

@app.get("/")
def root():
    return {"status": "disabled", "production_ready": False}

@app.get("/token")
def get_token():
    raise HTTPException(status_code=410, detail="Token service is disabled")

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await websocket.close(code=1008)
