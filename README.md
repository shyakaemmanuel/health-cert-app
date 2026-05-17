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
// Check backend health
await apiDebug.checkBackend()

// Verify your token
await apiDebug.verifyToken()

// Show API configuration
apiDebug.showConfig()

// Get stored user
apiDebug.getStoredUser()

// Get stored token
apiDebug.getStoredToken()
```

### Common Issues & Solutions

#### Login Fails - CORS Error
**Problem**: Browser shows CORS error when logging in
**Solution**: 
1. Check backend CORS configuration in server.js
2. Verify `FRONTEND_URL` environment variable is set in Render
3. URL must include full domain: `https://your-frontend.onrender.com`
4. Restart backend service

#### Login Fails - "Cannot reach backend"
**Problem**: Frontend cannot connect to backend API
**Solution**:
1. Run `apiDebug.checkBackend()` in browser console
2. Check `VITE_API_URL` is set correctly in Render frontend environment
3. Verify backend URL format: `https://your-backend.onrender.com` (no `/api` suffix)
4. Check backend service status in Render dashboard

#### Login Fails - Invalid Token
**Problem**: Token is generated but marked as invalid
**Solution**:
1. Verify `JWT_SECRET` is set in both backend environments
2. Both services must have identical `JWT_SECRET`
3. Check token hasn't expired (24 hour expiration)
4. Run `apiDebug.verifyToken()` to debug

#### Database Connection Failed
**Problem**: Backend cannot connect to PostgreSQL
**Solution**:
1. Check `DATABASE_URL` is set in Render backend environment
2. Verify PostgreSQL service is running (green status)
3. Check database connection string format is correct
4. Review backend logs for specific error

#### Database Tables Not Created
**Problem**: "relation 'users' does not exist" error
**Solution**:
1. Tables are created automatically on first backend startup
2. Wait 2-3 minutes for backend to start and initialize
3. Check backend logs for initialization messages
4. Manual: SSH into Render and check table creation

## Deployment

### Deploy to Render

1. Push code to GitHub:
```bash
git add .
git commit -m "Production ready"
git push origin main
```

2. Go to [render.com](https://render.com)

3. Create Blueprint:
   - Click "New +" → "Blueprint"
   - Select your repository
   - Render reads `render.yaml` automatically

4. Set Environment Variables (Backend Service):
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = Generate with: `openssl rand -hex 32`
   - `FRONTEND_URL` = Your frontend URL (set after frontend deploys)
   - `LOG_LEVEL` = `debug` (for troubleshooting) or `info` (production)

5. Set Environment Variables (Frontend Service):
   - `VITE_API_URL` = Your backend URL (set after backend deploys)

6. Wait for deployment (5-10 minutes)

7. Verify:
   - Backend health: `https://your-backend.onrender.com/api/health`
   - Frontend: `https://your-frontend.onrender.com`
   - Test login functionality

### Production Checklist

- [ ] Git repository pushed to GitHub
- [ ] render.yaml is in repository root
- [ ] All environment variables set in Render dashboard
- [ ] Backend health check returns 200 OK
- [ ] Frontend loads without errors
- [ ] Can register new account
- [ ] Can log in successfully
- [ ] API calls work from frontend
- [ ] JWT tokens are valid
- [ ] Database persists data
- [ ] CORS allows frontend origin

## Performance & Monitoring

### Logs
View logs in Render Dashboard:
1. Click service name
2. Go to "Logs" tab
3. Search for `[ERROR]`, `[WARN]` to find issues

### Health Check
Regular health checks confirm backend is running:
```bash
curl https://your-backend.onrender.com/api/health
```

### Response Times
- Backend startup: 30-60 seconds (cold start on free tier)
- API response: <100ms typical
- Database query: <50ms typical

## Development

### Environment Variables
Copy and edit `.env.example`:
```bash
cp .env.example backend/.env
```

### Database Initialization
Tables are auto-created on backend startup. To reset:
```bash
# In PostgreSQL shell
DROP TABLE IF EXISTS verification_logs CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

# Restart backend to recreate tables
```

### Testing
```bash
# Test backend health
curl http://localhost:5000/api/health

# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","full_name":"Test User"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
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
2. Check Render logs for backend errors
3. Run debug commands: `apiDebug.checkBackend()`, etc.
4. Review error messages - they're detailed in production
5. Check [render.com status page](https://status.render.com)

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
