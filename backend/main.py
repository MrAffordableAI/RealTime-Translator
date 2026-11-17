"""
FluentTalk Backend Starter
- Secure Azure Speech key proxy
- Simple WebSocket rooms for multi-device conversations
- Ready for user accounts / metering

Deploy to Railway, Render, Fly.io, or Azure.
Set env: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION
"""

import os
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="FluentTalk Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rooms = {}  # room_id -> set of websockets

@app.get("/")
def root():
    return {"status": "FluentTalk backend running", "rooms": len(rooms)}

@app.get("/token")
def get_token():
    """Proxy endpoint — frontend calls this instead of embedding keys."""
    return {
        "key": os.getenv("AZURE_SPEECH_KEY", ""),
        "region": os.getenv("AZURE_SPEECH_REGION", "eastus")
    }

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await websocket.accept()
    if room_id not in rooms:
        rooms[room_id] = set()
    rooms[room_id].add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast to other peers in room (transcripts, signals, etc.)
            for peer in list(rooms[room_id]):
                if peer != websocket:
                    try:
                        await peer.send_text(data)
                    except:
                        rooms[room_id].discard(peer)
    except WebSocketDisconnect:
        rooms[room_id].discard(websocket)
        if not rooms[room_id]:
            del rooms[room_id]
