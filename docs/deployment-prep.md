# Deployment Preparation Checklist

This document covers what needs to happen before pushing the backend and frontend to production hosting.

## 1. Backend (Express + Prisma)

### Environment
- Set all variables in the hosting provider:
  - `DATABASE_URL` → managed PostgreSQL connection string
  - `JWT_SECRET` → long random string
  - `JWT_EXPIRES_IN` → recommended `7d`
  - `PORT` → match platform (Render/Heroku uses their own)
  - `CLIENT_URL` → final frontend origin (https://app.example.com)
- Never commit `.env` files; use provider secrets UI instead.

### Build & Run
1. Install dependencies: `npm install --production`
2. Generate Prisma client: `npx prisma generate`
3. Apply migrations: `npx prisma migrate deploy`
4. Start the server with `node server.js` (or `npm start`).

### Operational Concerns
- **CORS**: ensure `CLIENT_URL` matches live frontend, otherwise update `cors()` config to accept multiple origins.
- **HTTPS**: terminate TLS at the load balancer or hosting platform.
- **Logging**: default `console.log` output can be captured by platform logs; adjust log level via `NODE_ENV` if necessary.
- **Health checks**: expose `/` (already returns JSON) for uptime monitoring.
- **Scaling**: app is stateless, so horizontal scaling simply requires pointing all instances at the same PostgreSQL database.

## 2. Frontend (Vite + React)

### Environment
- Set `VITE_API_URL` to the public backend URL before building.
- For CI/CD pipelines, inject the env var as part of the build command.

### Build
```
cd frontend
npm install
npm run build   # outputs to dist/
```

Deploy the `dist/` folder to Netlify, Vercel, Azure Static Web Apps, or any static hosting provider. Configure rewrites so that React Router routes fall back to `index.html` (e.g., `/* -> /index.html`).

### Runtime
- Ensure HTTPS frontends call HTTPS backends to avoid mixed-content blocks.
- Update `CLIENT_URL` on the backend whenever the frontend domain changes.

## 3. Database
- Provision a managed PostgreSQL instance (Supabase, Neon, Railway, RDS, etc.).
- Create a separate database/user for production, apply migrations, and back up regularly.
- Enable SSL if the provider requires it (append `?sslmode=require`).

## 4. Monitoring & Alerts (Recommended)
- Attach uptime monitoring to the backend health endpoint.
- Capture and alert on 5xx responses via hosting logs or APM tools.
- Track frontend build failures via Netlify/Vercel notifications.

## 5. Post-Deployment Smoke Test
1. Run backend `phase8` tests against the deployed API (set `API_URL` and `HEALTH_URL` env vars before executing the suite).
2. Run frontend Vitest suite locally before pushing.
3. Manually verify the happy path: signup → profile → add expenses → dashboard → monthly report.
4. Confirm password change/logout flows succeed.

Following this checklist satisfies Phase 9.3 (“Deployment Preparation”) and keeps the app ready for the next release step.
