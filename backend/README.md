# Dacexy Backend

## Run locally
pip install -r requirements.txt --break-system-packages
cp .env.example .env   # fill in Razorpay keys
uvicorn app.main:app --reload --port 8000

## What it does
- Auth: /api/auth/signup, /api/auth/login, /api/auth/me (JWT)
- Billing: /api/billing/create-order (Razorpay Order API),
  /api/billing/verify-payment (signature verification),
  /api/billing/webhook (payment event handling)
- License: /api/license/mine (show key on dashboard), /api/license/verify
  (called by the DESKTOP APP, not the browser)

## Important: how the agent connects
OpenClaw's Gateway binds to loopback (127.0.0.1:18789) on the user's own PC by
design/security default. This cloud backend can NOT reach it remotely.
So: desktop app validates the license key against /api/license/verify, then
talks to its own local Gateway directly. The website only handles accounts +
billing + showing the license key — it is not in the chat path.
