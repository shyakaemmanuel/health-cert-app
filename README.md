# HealthCert — Health Certificate Verification

Full-stack health certification verification app with QR code scanning.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Vite
- **Backend**: Node.js, Express, PostgreSQL
- **Security**: JWT auth, bcrypt, helmet, rate limiting, input validation
- **Deployment**: Render (with Infrastructure as Code)

## Quick Start

### Backend
```bash
cd backend
npm install
cp ../.env.example .env  # Edit with your settings
npm start                # Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev              # Runs on http://localhost:5173 (proxies API to :5000)
```

## Features
- User registration & login (JWT)
- Create health certificates with QR codes
- Scan/verify certificates via QR code or manual entry
- Subscription plans (Free/Basic/Premium) with certificate limits
- Rate limiting, input validation, security headers

## Deployment

### Deploy to Render (Recommended)

This project is configured for one-click deployment to Render using Infrastructure as Code.

**Quick Deploy:**
1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create a new Blueprint
4. Connect your GitHub repository
5. Render automatically deploys all services (backend, frontend, database)

**For detailed instructions, see:**
- [`RENDER_DEPLOYMENT.md`](RENDER_DEPLOYMENT.md) — Complete deployment guide
- [`PRE_DEPLOYMENT_CHECKLIST.md`](PRE_DEPLOYMENT_CHECKLIST.md) — Pre-deployment verification

**Configuration:**
- `render.yaml` defines infrastructure (backend, frontend, PostgreSQL database)
- `.env.example` documents all required environment variables
- Backend uses PostgreSQL instead of SQLite for production

### Environment Variables

**Local Development** (in `backend/.env`):
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-here
DATABASE_URL=postgres://user:password@localhost:5432/health_cert_app
FRONTEND_URL=http://localhost:5173
FRONTEND_URL_DEV=http://localhost:5173
```

**Production** (set in Render dashboard):
```
NODE_ENV=production
JWT_SECRET=<secure-random-string>
FRONTEND_URL=https://health-cert-frontend.onrender.com
DATABASE_URL=<auto-populated-by-Render>
VITE_API_URL=https://health-cert-backend.onrender.com
```

## Project Structure

```
health-cert-app/
├── backend/                      # Node.js/Express API
│   ├── routes/                   # API endpoints
│   ├── middleware/               # Auth, validation
│   ├── database.js               # PostgreSQL connection & schema
│   ├── server.js                 # Express app
│   └── package.json
├── frontend/                     # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/              # AuthContext
│   │   ├── api.js                # Axios client
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
├── render.yaml                   # Infrastructure as Code for Render
├── .env.example                  # Environment variable template
├── RENDER_DEPLOYMENT.md          # Deployment guide
└── README.md
```

## API Endpoints

- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login (returns JWT)
- `GET /api/certificates` — List user's certificates
- `POST /api/certificates` — Create certificate with QR code
- `GET /api/certificates/:id` — Get certificate details
- `POST /api/certificates/:id/verify` — Verify certificate
- `GET /api/subscriptions` — Get subscription info
- `GET /api/health` — Health check

## Development

See the individual README files:
- [`backend/README.md`](backend/README.md) (if available)
- [`frontend/README.md`](frontend/README.md) (if available)
