# 🚀 Quick Setup Guide

**Get started in 3 simple steps!**

---

## Prerequisites

Make sure you have these installed:
- **Node.js** v20+ → [Download](https://nodejs.org/)
- **PostgreSQL** v14+ → [Download](https://www.postgresql.org/download/)
- **Git** → [Download](https://git-scm.com/downloads)

Check versions:
```bash
node --version
psql --version
git --version
```

---

## Step 1: Clone & Install Dependencies

```bash
# Clone the project
git clone https://github.com/amradel111/Personal-Finance-AI-Manager.git
cd Personal-Finance-AI-Manager

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 📦 What Gets Installed

**Backend Dependencies:**
- `express` v4.18.2 - Web server framework
- `@prisma/client` v5.7.0 - Database ORM
- `bcryptjs` v2.4.3 - Password hashing
- `jsonwebtoken` v9.0.2 - JWT authentication
- `cors` v2.8.5 - Cross-origin requests
- `dotenv` v16.3.1 - Environment variables
- `axios` v1.13.2 - HTTP client
- `prisma` v5.7.0 (dev) - Database toolkit
- `nodemon` v3.0.2 (dev) - Auto-restart server

**Frontend Dependencies:**
- `react` v18.2.0 - UI library
- `react-dom` v18.2.0 - React renderer
- `react-router-dom` v6.8.0 - Routing
- `axios` v1.6.0 - API requests
- `recharts` v2.8.0 - Charts & graphs
- `vite` v4.4.5 - Build tool
- `typescript` v5.0.2 - Type safety
- `tailwindcss` v3.3.2 - CSS framework
- `@vitejs/plugin-react` v4.0.3 - React support

---

## Step 2: Setup Database & Environment

### Create Database & Set Password

**Set your PostgreSQL password to `postgres123`** (or update `backend/.env` if you prefer a different password):

```bash
psql -U postgres
```

In PostgreSQL terminal:
```sql
-- Set password (if needed)
ALTER USER postgres WITH PASSWORD 'postgres123';

-- Create database
CREATE DATABASE finance_manager;

-- Exit
\q
```

### Environment Variables

**Both `.env` files are already configured!** ✅
- `backend/.env` - Uses password `postgres123`
- `frontend/.env` - Already set to connect to backend

No changes needed unless you want a different PostgreSQL password.

### Run Database Migrations
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

---

## Step 3: Start the Application

**Windows - Use the startup script:**
```bash
start-dev.bat
```

**Or start manually:**

Terminal 1 - Backend:
```bash
cd backend
npm start
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

---

## ✅ Verify It's Working

Open your browser and visit:
- **Frontend App:** http://localhost:5173
- **Backend API:** http://localhost:5000

You should see the React app running! 🎉

---

## 🐛 Troubleshooting

**"Port 5000 already in use"**
```bash
taskkill /F /IM node.exe
```

**"Database connection failed"**
- Make sure PostgreSQL is running
- Check password in `backend/.env`
- Verify database `finance_manager` exists

**"Module not found"**
```bash
# Reinstall dependencies
cd backend
rmdir /s /q node_modules
npm install

cd ..\frontend
rmdir /s /q node_modules
npm install
```

---

## � Project Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend API | 5000 | http://localhost:5000 |
| PostgreSQL | 5432 | localhost:5432 |

---

**That's it! You're all set up and ready to code! 🚀**
