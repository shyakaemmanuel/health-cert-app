# Deployment Guide — GitHub + Render

This document describes step-by-step how to prepare, push, and deploy the `health-cert-app` (frontend + backend + Postgres) to Render.

1) Prepare repository
- Ensure local changes are committed:

```bash
git add .
git commit -m "Prepare production: env/docs and deploy scripts"
git push origin main
```

2) Render services (render.yaml already included)
- Render will create three services from `render.yaml`: a Postgres `pserv`, a Node `web` (backend) and a `static site` (frontend).
- Go to Render dashboard → New → Import from GitHub and choose this repo. Render will detect `render.yaml` and create services.

3) Required Render environment variables
- Backend (`health-cert-backend`):
  - `NODE_ENV` = `production` (already set in `render.yaml`)
  - `JWT_SECRET` = a long random string (e.g. `openssl rand -hex 32`)
  - `FRONTEND_URL` = https://<your-frontend-service>.onrender.com
  - `LOG_LEVEL` = `info` (optional)

- Frontend (`health-cert-frontend`):
  - `VITE_API_URL` = https://<your-backend-service>.onrender.com

Notes:
- The `DATABASE_URL` is automatically provided to the backend from the `health-cert-db` service defined in `render.yaml`.
- It is critical to set `VITE_API_URL` in the frontend service BEFORE the build runs so the static bundle contains the correct API base URL.

4) Redeploy
- After setting env vars, click redeploy on the frontend and backend services (Render may auto-deploy on env change).

5) Verification steps
- Backend health endpoint:

```bash
curl https://<your-backend-service>.onrender.com/api/health
```

- From the deployed frontend, open the browser console and run these helpers (they are available in the production bundle):

```js
await apiDebug.showConfig();
await apiDebug.checkBackend();
await apiDebug.getStoredToken();
await apiDebug.verifyToken();
```

- Try the user flows: Register → Login → access a protected endpoint in the dashboard.

6) Troubleshooting quick checklist
- 401 on login: confirm `JWT_SECRET` set and identical for signing/verifying.
- CORS errors: confirm `FRONTEND_URL` matches the exact origin (include https://) in the backend env.
- Frontend still pointing to `/api`: confirm `VITE_API_URL` is set in the frontend service and the site rebuilt.

7) Local smoke test (before pushing)
- Start backend locally:

```bash
cd backend
npm install
npm run dev    # or `npm start` if you want production run
```

- Start frontend locally:

```bash
cd frontend
npm install
npm run dev
```

- Use the local health check:

```bash
curl http://localhost:5000/api/health
```

8) Security recommendations
- Use a securely generated `JWT_SECRET` and rotate if compromised.
- Do not commit `.env` files with secrets.
- Set sensible log levels and do not log sensitive data.

If you want, I can add a small `scripts/smoke-test.js` that performs the health check and a login flow against a deployed URL — tell me which domain names you will use and I will add it and run it here.
