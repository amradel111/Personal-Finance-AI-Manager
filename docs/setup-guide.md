# Project Setup Guide

This project is split into two workspaces: `backend/` (Express + Prisma) and `frontend/` (Vite + React). Follow the steps below to get a clean development environment running.

## 1. Prerequisites
- Node.js 18+ (backend tests currently run on Node 20/22 without issues)
- npm 9+
- PostgreSQL 14+ running locally or remotely
- Git

## 2. Clone & Install
```bash
# Clone the repo
git clone <repo-url>
cd Personal-Finance-AI-Manager

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## 3. Environment Variables
### Backend (`backend/.env`)
Use `.env.example` as a template:
```
DATABASE_URL=postgres://<user>:<password>@localhost:5432/pfam
JWT_SECRET=replace-me
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
Copy from `.env.example`:
```
VITE_API_URL=http://localhost:5000/api
```
`VITE_API_URL` must point to the backend base URL.

## 4. Database Setup
1. Create the target database (`CREATE DATABASE pfam;`).
2. From `backend/`, run migrations and generate the Prisma client:
   ```bash
   npm run prisma:migrate   # or: npx prisma migrate dev
   npm run prisma:generate
   ```
3. (Optional) Open Prisma Studio for quick data inspection:
   ```bash
   npm run prisma:studio
   ```

## 5. Running the App Locally
Open two terminals from the repo root:

**Backend**
```bash
cd backend
npm run dev  # starts nodemon on http://localhost:5000
```

**Frontend**
```bash
cd frontend
npm run dev  # Vite dev server at http://localhost:5173
```

The default CORS origin (`CLIENT_URL`) already points to the Vite server, so cross origin requests work out of the box.

## 6. Automated Tests
- Backend Phase 8 suite: `cd backend && npm run test:phase8`
- Frontend Vitest suite: `cd frontend && npm run test`

The backend test runner boots its own app instance; make sure no other process is listening on port 5000 before starting.

## 7. Troubleshooting
- **Database connection errors**: confirm `DATABASE_URL`, ensure Postgres is running, and verify SSL requirements if using hosted DBs.
- **Port conflicts**: stop any stray Node/Vite processes bound to 5000 or 5173.
- **JWT errors**: delete stale tokens from `localStorage`/`sessionStorage` after changing `JWT_SECRET`.
- **CORS issues**: set `CLIENT_URL` to the exact frontend origin (including protocol and port).

With those steps the app should start cleanly, allowing you to sign up, complete the profile, add expenses, and view the dashboard plus monthly report.
