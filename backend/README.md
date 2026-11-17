# Backend disabled

Do not deploy this starter. The former /token returned the Azure subscription key; unauthenticated WebSocket rooms allowed arbitrary peers to join and relay messages.

The repaired module returns HTTP 410 at /token, rejects WebSockets before accepting, and has no wildcard CORS or credential reads. It cannot provide production translation credentials or rooms.

The frontend-only demo connects directly to Azure using a user-entered, memory-only demo key. Production needs authenticated short-lived Azure token issuance, rate limits, exact origin restrictions, room authorization, and a reviewed privacy/retention policy. Do not restore the old key proxy.

If the old backend was public with a real key configured, rotate that key in Azure. Repository changes do not revoke credentials already exposed.
