# Deployment Guide — Vercel + Railway

This guide walks through deploying the `health-cert-app` frontend to Vercel and the backend + database to Railway.

## 1) Push your code
- Commit and push your latest changes:

```bash
git add .
git commit -m "Prepare production deployment with Vercel and Railway"
git push origin main
```

## 2) Deploy the backend on Railway
1. Create a new Railway project.
2. Connect the GitHub repository and choose the `backend` folder as the service root.
3. Add the PostgreSQL plugin to the project.
4. Set these environment variables for the backend service:
   - `NODE_ENV=production`
   - `JWT_SECRET=<secure-random-string>`
   - `FRONTEND_URL=https://<your-vercel-frontend-url>`
   - `LOG_LEVEL=info`

Railway will provide `DATABASE_URL` automatically.

### Railway notes
- Railway deploys the backend using `backend/package.json` and the `npm start` command.
- The backend requires `FRONTEND_URL` in production for CORS.
- If Railway cannot find the correct root, set the service root explicitly to `backend`.

## 3) Deploy the frontend on Vercel
1. Create a new Vercel project.
2. Import the repository and set the root directory to `frontend`.
3. Configure build settings (Vercel usually detects these automatically):
   - Build command: `npm run build`
   - Output directory: `dist`
   - The `frontend/vercel.json` file is included to support a SPA route rewrite to `index.html`.

4. Set this environment variable in Vercel:
   - `VITE_API_URL=https://<your-railway-backend-url>`

### Vercel notes
- `VITE_API_URL` is injected at build time, so it must be set before deploying.
- The frontend is a static site built from `frontend/dist`.

## 4) Verify the deployment
- Backend health check:

```bash
curl https://<your-railway-backend-url>/api/health
```

- Frontend: Open the Vercel URL in your browser.

- In the browser console, you can use the built-in debug helpers:

```js
await apiDebug.showConfig();
await apiDebug.checkBackend();
await apiDebug.getStoredToken();
await apiDebug.verifyToken();
```

## 5) Common production environment variables
### Backend (Railway)
- `NODE_ENV=production`
- `JWT_SECRET` = strong secret
- `FRONTEND_URL` = your Vercel frontend origin, e.g. `https://my-health-cert.vercel.app`
- `DATABASE_URL` = provided by Railway
- `LOG_LEVEL=info`

### Frontend (Vercel)
- `VITE_API_URL` = Railway backend origin, e.g. `https://my-health-backend.up.railway.app`

## 6) Local development
Run backend locally:

```bash
cd backend
npm install
npm run dev
```

Run frontend locally:

```bash
cd frontend
npm install
npm run dev
```

Use the local health check:

```bash
curl http://localhost:5000/api/health
```

## 7) Smoke test
There is a root-level smoke test available in `scripts/smoke-test.js`.

```bash
npm install
npm run smoke-test -- http://localhost:5000
```

If you set `SMOKE_TEST_EMAIL` and `SMOKE_TEST_PASSWORD`, the script will also attempt a login.

## 8) Troubleshooting
- `401 Unauthorized`: verify `JWT_SECRET` is set in Railway and `FRONTEND_URL` matches Vercel exactly.
- CORS errors: confirm `FRONTEND_URL` is the exact origin of your Vercel site, including `https://`.
- Frontend pointing to `/api`: confirm `VITE_API_URL` is set in Vercel and redeploy.
- Database connection issues: check Railway PostgreSQL status and `DATABASE_URL`.

## 9) Security reminders
- Do not commit `.env` or secrets.
- Use a strong `JWT_SECRET`.
- Keep production log level to `info` or `warn`.
