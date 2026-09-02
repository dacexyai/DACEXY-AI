# DACEXY Production Deployment

## Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Razorpay account (test/live keys)

## Backend Setup (Linux/Mac)
```bash
cd backend
cp .env.example .env
# Edit .env: add Razorpay keys, database URL, JWT secret
chmod +x run.sh
./run.sh prod
```

## Backend Setup (Windows)
```powershell
cd backend
Copy-Item .env.example .env
# Edit .env with your config
.\run.ps1 -Mode prod
```

## Frontend Setup
```bash
cd dacexy
npm install
VITE_API_URL=https://your-api.com npm run build
# Deploy dist/ to your CDN/static host
```

## Desktop App Setup
```bash
cd dacexy/desktop
npm install
npm run build
# Creates electron executable + installer
```

## Docker (recommended for prod)
```bash
cd backend
docker-compose -f docker-compose.yml up -d
```

## Environment Variables
```
DATABASE_URL=postgresql://user:pass@localhost:5432/dacexy
JWT_SECRET=your-random-64-char-secret-here
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
FRONTEND_URL=https://your-domain.com
```

## Testing
1. Sign up at https://your-domain.com/signup
2. Get license key from /download page
3. Run desktop app, paste license key
4. Agent should connect to local OpenClaw Gateway

## Monitoring
- Backend health: GET /api/health
- Gateway health: GET /api/v1/gateway/gateway/health (requires authentication)
- Agent status: CLI `openclaw agents list`
