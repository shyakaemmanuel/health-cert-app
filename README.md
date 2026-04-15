# HealthCert — Health Certificate Verification

Full-stack health certification verification app with QR code scanning.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Vite
- **Backend**: Node.js, Express, SQLite (better-sqlite3)
- **Security**: JWT auth, bcrypt, helmet, rate limiting, input validation

## Setup

### Backend
```bash
cd backend
npm install
cp .env .env.local  # Edit JWT_SECRET for production
npm start           # Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev         # Runs on http://localhost:5173 (proxies API to :5000)
```

## Features
- User registration & login (JWT)
- Create health certificates with QR codes
- Scan/verify certificates via QR code or manual entry
- Subscription plans (Free/Basic/Premium) with certificate limits
- Rate limiting, input validation, security headers
