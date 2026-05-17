# HealthCert — Health Certificate Verification

Full-stack health certification verification app with QR code scanning.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Vite
- **Backend**: Node.js, Express, PostgreSQL
- **Security**: JWT auth, bcrypt, helmet, rate limiting, input validation
- **Deployment**: Vercel (frontend) + Railway (backend + PostgreSQL)

## Quick Start

### Backend
```bash
cd backend
npm install
cp ../.env.example .env  # Edit with your local settings
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

## API Documentation

### Health Check
```
GET /api/health
Response: { "status": "ok", "timestamp": "...", "environment": "production", "uptime": 123.45 }
```

### Authentication
```
POST /api/auth/login
Body: { "email": "user@example.com", "password": "password" }
Response: { "token": "jwt...", "user": { "id": "...", "email": "...", "full_name": "...", "role": "user" } }

POST /api/auth/register
Body: { "email": "user@example.com", "password": "password", "full_name": "John Doe" }
Response: { "token": "jwt...", "user": { ... } }

GET /api/auth/verify
Headers: { "Authorization": "Bearer jwt..." }
Response: { "valid": true, "user": { "id": "...", "email": "...", "role": "user" } }
```

## Production Debugging

### Frontend Console Debugging

Open browser console and run:
```javascript
await apiDebug.checkBackend()
await apiDebug.verifyToken()
apiDebug.showConfig()
apiDebug.getStoredUser()
apiDebug.getStoredToken()
```

### Common Issues & Solutions

#### Login Fails - CORS Error
- Verify `FRONTEND_URL` is set in Railway and matches the exact Vercel origin.
- Confirm the origin includes `https://`.
- Restart the backend deployment after updating the env var.

#### Login Fails - "Cannot reach backend"
- Run `apiDebug.checkBackend()` in the browser console.
- Verify `VITE_API_URL` is set correctly in Vercel.
- Confirm the backend URL is `https://<railway-backend-url>` (no `/api` suffix).

#### Login Fails - Invalid Token
- Confirm `JWT_SECRET` is set in Railway.
- Ensure only one backend service is using that secret.
- Run `apiDebug.verifyToken()` to validate the token.

#### Database Connection Failed
- Check `DATABASE_URL` in Railway.
- Confirm PostgreSQL plugin is healthy.
- Review backend logs in Railway.

#### Database Tables Not Created
- Tables are created automatically on first backend startup.
- Wait a few minutes for initialization.
- Review backend logs for table creation messages.

## Deployment

### Backend — Railway
1. Push code to GitHub.
2. Create a Railway project and connect this repository.
3. Set the service root to `backend` if Railway does not detect it automatically.
4. Add Railway PostgreSQL.
5. Set backend env vars:
   - `NODE_ENV=production`
   - `JWT_SECRET=<secure-random-string>`
   - `FRONTEND_URL=https://<your-vercel-frontend-url>`
   - `LOG_LEVEL=info`
6. Deploy the backend.

Railway provides `DATABASE_URL` automatically.

### Frontend — Vercel
1. Create a Vercel project and import this repository.
2. Set the root directory to `frontend`.
3. Confirm the build command is `npm run build` and output directory is `dist`.
4. Set frontend env var:
   - `VITE_API_URL=https://<your-railway-backend-url>`
5. Deploy the frontend.

### Verify Deployments
- Backend health: `curl https://<your-railway-backend-url>/api/health`
- Frontend: open your Vercel URL.
- Use the browser console debug helpers.

## Production Environment Variables

### Backend (Railway)
- `NODE_ENV=production`
- `JWT_SECRET` = strong secret
- `FRONTEND_URL` = your Vercel frontend origin
- `DATABASE_URL` = provided by Railway
- `LOG_LEVEL=info`

### Frontend (Vercel)
- `VITE_API_URL` = Railway backend origin

## Development

### Environment Variables
Copy and edit `.env.example`:
```bash
cp .env.example backend/.env
```

### Run locally
```bash
cd backend && npm install
cd frontend && npm install
```

### Test locally
```bash
curl http://localhost:5000/api/health
```

## Smoke Test
Run the root smoke test script:
```bash
npm install
npm run smoke-test -- http://localhost:5000
```

If you set `SMOKE_TEST_EMAIL` and `SMOKE_TEST_PASSWORD`, the script also attempts a login.

## Notes
- The frontend build uses `VITE_API_URL` at build time.
- The backend uses `FRONTEND_URL` for production CORS.
- Do not commit `.env` or secrets to source control.
```

## Security

- Passwords are hashed with bcryptjs (rounds: 12)
- JWT tokens expire in 24 hours
- CORS restricts API access to frontend origin only
- Rate limiting: 100 req/15min general, 20 req/15min auth
- Input validation with express-validator
- Helmet.js provides security headers
- SQL injection prevention with parameterized queries
- XSS protection via React and Helmet

## Support

For issues:
1. Check browser console (F12) for frontend errors
2. Check Railway logs for backend errors
3. Run debug commands: `apiDebug.checkBackend()`, etc.
4. Review error messages in backend logs

## Environment Variables

### Local Development
Copy `.env.example` to `backend/.env` and update the values.

Example:
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-here
DATABASE_URL=postgres://user:password@localhost:5432/health_cert_app
FRONTEND_URL=http://localhost:5173
FRONTEND_URL_DEV=http://localhost:5173
```

### Production
Set these values in Railway / Vercel:

Backend (Railway):
```
NODE_ENV=production
JWT_SECRET=<secure-random-string>
FRONTEND_URL=https://<your-vercel-frontend-url>
LOG_LEVEL=info
```

Frontend (Vercel):
```
VITE_API_URL=https://<your-railway-backend-url>
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
├── .env.example                  # Environment variable template
├── package.json                  # root scripts / smoke test
├── DEPLOY.md                    # Deployment guide
└── README.md
```

## API Endpoints

- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login (returns JWT)
- `GET /api/auth/verify` — Verify token and session
- `GET /api/certificates` — List user's certificates
- `POST /api/certificates` — Create certificate with QR code
- `GET /api/certificates/:id` — Get certificate details
- `POST /api/certificates/:id/verify` — Verify certificate
- `GET /api/subscriptions` — Get subscription info
- `GET /api/health` — Health check

## Development

See the individual folders for local development:
- `backend/` for API server and database setup
- `frontend/` for React app and Vite build
