# RealTime Translator

A smooth, real-time speech-to-speech translation web app for fluid multilingual conversations. Optimized for Spanish ↔ English, ideal for apartment leasing teams communicating with prospects.

Works on computer or phone browsers. Designed for business use and easy monetization as a SaaS tool.

## Features
- Real-time speech recognition + translation + text-to-speech
- Continuous listening for natural conversations
- Dual language support (easily extendable)
- Clean, professional UI
- Conversation transcript history
- Works on desktop and mobile

## Quick Start (Azure Speech Services)
1. Create a free Azure account and Speech resource: https://portal.azure.com
2. Get your Speech Key and Region from the resource keys.
3. Open `index.html` in a browser (or host on GitHub Pages).
4. Enter your Azure Speech Key and Region in the settings panel.
5. Select source/target languages (default: English → Spanish).
6. Click Start and speak. Translation plays aloud and shows in transcript.

**For production/monetization:**
- Add user accounts, usage tracking, billing (Stripe).
- Multi-user rooms for two-way conversations.
- Integration with Teams via bots or embedding.
- Conversation logging for CRM (Yardi/PMS bolt-on).
- White-label for property management companies.

## Microsoft Teams Alternative (Immediate Use)
If you already use Teams with Copilot licenses, enable the built-in **Interpreter agent**:
- In a meeting/call: More → Language and speech → Interpreter → Turn on.
- Use **Consecutive interpretation** mode for natural two-way Spanish-English conversations.
- Supports voice cloning-like natural speech.

This custom app gives you full control, branding, and offline-capable paths for monetization beyond Teams.

## Live Demo
https://mraffordableai.github.io/RealTime-Translator/

(Requires your own Azure key for full translation; demo shows UI.)

## Tech Stack
- Vanilla HTML/CSS/JS
- Microsoft Cognitive Services Speech SDK (CDN)
- Azure Speech Translation (real-time)

## Next Steps for Production
- Backend proxy for API keys (never expose in frontend).
- User authentication & subscriptions.
- Multi-party conversation rooms.
- Offline mode with Web Speech API fallback.
- Analytics for prospect conversations.

Built for fluid conversations in property management and beyond.
