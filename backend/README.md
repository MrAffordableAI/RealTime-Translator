# FluentTalk Backend

Starter for production features:
- API key proxy (`/token`)
- WebSocket rooms (`/ws/{room_id}`) for multi-device conversations

## Run
```bash
pip install -r requirements.txt
export AZURE_SPEECH_KEY=yourkey
export AZURE_SPEECH_REGION=eastus
uvicorn main:app --reload --port 8000
```

## Deploy
- Railway / Render / Fly.io: connect this folder, set env vars.
- Then update frontend to fetch key from your backend URL instead of local input.

This is the foundation for accounts, billing, and true multi-user rooms.
