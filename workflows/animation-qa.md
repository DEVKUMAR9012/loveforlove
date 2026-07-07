# Animation QA Checklist

This file lists manual QA steps to validate the new animations and AI endpoints added.

## Invite Page
- [ ] Type exactly 8 characters into the invite input; ensure preview auto-triggers after ~300ms.
- [ ] Generated invite card and preview card should fade/slide in smoothly and layout should shift without jumps.
- [ ] Clicking "Check Code" still works and shows errors if invalid.

## AI Endpoints
- [ ] GET `/api/ai/generate-prompt` returns a JSON `{ prompt: "..." }` (uses OpenAI if `OPENAI_API_KEY` set).
- [ ] POST `/api/ai/smart-reply` with `messages` array returns a `suggestions` string.

## How to run quick checks
- Start backend: `cd backend && node server.js`
- Start frontend: `cd frontend && npm run dev` (or your standard dev command)

## Notes
- The AI endpoints will return fallback text when `OPENAI_API_KEY` is not configured.
- For production, set `OPENAI_API_KEY` in environment and ensure outbound requests are allowed.
