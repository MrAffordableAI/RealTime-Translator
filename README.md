# FluentTalk personal speech translation demo

This is a single-device browser demo, not a production SaaS or a secure hosted credential service.

## Verified demo configuration

- Existing public URL: https://real-time-translator-six.vercel.app/ — inspected on November 17, 2026; it currently serves the old backend status JSON, not the frontend.
- Local frontend: run `node scripts/build.cjs` then `node scripts/serve.cjs`; open http://127.0.0.1:8085/
- Vercel must use the **repository root**, Framework Preset **Other**, Build Command `node scripts/build.cjs`, Output Directory `dist`. Clear any dashboard override that points to `backend` or starts FastAPI. The checked-in vercel.json builds only index.html and app.js.
- Do not deploy backend/main.py. The old key-returning /token route and unauthenticated WebSocket relay are disabled.

## Azure setup still required

1. Create/use an Azure Speech resource with speech translation and speech synthesis access; obtain its key and matching region in Azure. Do not paste credentials into GitHub, chat, URLs, or deployment files.
2. Open the trusted HTTPS frontend or localhost, enter the key and exact region, and allow microphone access. The key stays in page memory; it is sent only by the Azure SDK to Azure. Clear or reload removes it. Legacy saved keys are purged.
3. Choose different source/target languages. Voice choices follow the target. Auto mode detects English/Spanish at session start; stop and restart to change speaker language. It is not automatic continuous two-way interpretation.
4. Use headphones. Translated speaker audio can otherwise be captured by the microphone.
5. Speech recognition, translation and synthesis must all be available for the resource/region with sufficient quota. No free-tier allowance or production accuracy is promised.

Use a dedicated demo resource and rotate any key that was exposed through an earlier public /token deployment. Removing the endpoint does not revoke previously disclosed keys.

## Preserved functions and limits

Timestamped dual transcripts, local recent history, text export, theme and non-secret settings remain. Clear now deletes saved conversations and clears the key. Transcripts remain on this device until cleared; do not use real tenant data in demos.

Translation uses TranslationRecognizer and callback-based start/stop. Translated text is sent to a separate SpeechSynthesizer with a matching target voice; playback is queued until audio ends. Controls lock during sessions. Stop, failures and stale callbacks clean up their own session.

Public/production use requires an authenticated, rate-limited short-lived token service, exact origin policy, authorization for rooms, usage controls, and a privacy/retention design. None is claimed implemented.

## Focused verification

Run `node --check app.js` and `node --test tests/app.test.cjs`, then the frontend build. Tests mock Azure SDK/DOM behavior: callbacks, races, translation display, playback order, languages, history safety, key removal, errors and backend source security invariants. They do not prove live Azure recognition, audible output, or backend HTTP runtime behavior. A real key/resource and microphone/audio check remain required before declaring the live speech demo verified.

Microsoft SDK reference:
- https://learn.microsoft.com/azure/ai-services/speech-service/how-to-translate-speech
- https://learn.microsoft.com/javascript/api/microsoft-cognitiveservices-speech-sdk/translationrecognizer
