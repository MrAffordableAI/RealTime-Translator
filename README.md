# FluentTalk — Real-Time Conversation Interpreter

A polished, sellable real-time speech-to-speech interpreter focused on fluid Spanish ↔ English conversations for apartment leasing and business use.

**Live demo (enable GitHub Pages):** https://mraffordableai.github.io/RealTime-Translator/

## What You Can Sell

- Specialized real-time interpreter for property management / leasing teams
- White-label version for other property companies
- Per-seat or usage-based SaaS
- Conversation logging + export for prospect notes / CRM
- Works on computer or phone browser — no install required

### Suggested Pricing
- **Starter** $29/mo — 1 user, ~10 hours
- **Team** $99/mo — 5 users, shared history
- **Enterprise** custom — white-label, CRM/Yardi hooks, unlimited

Azure Speech costs are low at volume; strong margins possible when positioned as a vertical tool rather than a generic translator.

## How to Run / Demo

1. Create free Azure account → create Speech resource (F0 free tier is enough for demos).
2. Copy Speech Key + Region.
3. Open `index.html` (or the GitHub Pages URL after enabling Pages).
4. Paste key, choose languages, click **Start Interpreter**.
5. Speak. Translation appears and is spoken back in natural neural voice.

**Free tier notes:** ~5 hours of speech translation per month. Perfect for sales demos and early customers.

## Features in This Version
- Continuous real-time listening + translation + TTS
- Clean dual transcript (original + translation)
- Export conversation to text file
- Multiple languages (easy to extend)
- Mobile-friendly
- Professional UI ready for customer demos

## Production / Monetization Roadmap
1. Backend proxy so API keys are never in the browser (required for real customers).
2. User accounts + Stripe billing + usage metering.
3. Multi-user conversation rooms (two devices, one conversation).
4. Conversation history stored per customer / property.
5. Optional integration with Teams or your existing Affordable AI File Reviewer.
6. White-label branding settings.

## Enable GitHub Pages (for live demo link)
1. Go to the repo → Settings → Pages.
2. Source: Deploy from a branch → `main` / `(root)`.
3. Save. Site will be live at the URL above in ~1 minute.

## Tech
- Static HTML + Tailwind CDN + Microsoft Cognitive Services Speech SDK
- Azure Speech Translation (real-time speech-to-speech)

This is a complete, working foundation you can productize and sell. The core interpreter works today with a free Azure key.

Built for MrAffordableAI projects.
