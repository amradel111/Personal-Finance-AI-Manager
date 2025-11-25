# Railway Backend Deployment Guide

This guide walks you through deploying the SaveMate backend to Railway (free tier).

## Prerequisites

- ✅ Neon PostgreSQL database already set up
- ✅ GitHub account with your code pushed
- Railway account (no credit card needed for trial)

## Your Neon Database Connection

```
DATABASE_URL=postgresql://neondb_owner:npg_iyx7o2JrDzLB@ep-calm-frog-ahhhx11i-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## Step 1: Push Your Code to GitHub

Before deploying, make sure all your latest changes are pushed:

```bash
cd "d:\projects\Personal Finance AI Manager"
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

---

## Step 2: Create Railway Account

1. Go to [railway.app](https://railway.app/)
2. Click **"Start a New Project"** or **"Login"**
3. Sign up using your **GitHub account** (recommended for easy deployment)
4. Railway offers $5 free trial credit (no credit card required)

---

## Step 3: Create New Project in Railway

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. If prompted, authorize Railway to access your GitHub repositories
4. Search for and select your repository: `Personal-Finance-AI-Manager`
5. **IMPORTANT**: When asked, set the **Root Directory** to `backend` (since your backend is in a subfolder)

---

## Step 4: Configure Environment Variables

Before the first deployment completes, go to your project's **Variables** tab and add these:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_iyx7o2JrDzLB@ep-calm-frog-ahhhx11i-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Generate a strong secret (see below) |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `http://localhost:5173` (update later with frontend URL) |

### Generate JWT Secret

Run this command in your terminal to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET`.

---

## Step 5: Generate a Domain

1. In your Railway project, go to **Settings**
2. Under **Networking** > **Public Networking**, click **"Generate Domain"**
3. Railway will give you a URL like: `your-app-name.up.railway.app`
4. This is your backend API URL!

---

## Step 6: Verify Deployment

Once deployed, test your API:

1. Visit `https://your-app-name.up.railway.app/` in your browser
2. You should see:
   ```json
   {
     "message": "Personal Finance AI Manager API",
     "status": "Server is running",
     "timestamp": "2024-..."
   }
   ```

---

## Step 7: Run Database Migrations (Automatic)

The deployment is configured to automatically run `prisma migrate deploy` on startup, which will apply your database migrations to the Neon database.

Check the Railway deployment logs to verify migrations ran successfully.

---

## Troubleshooting

### Build Fails
- Check that `backend/` is set as the root directory
- Verify all environment variables are set
- Check the build logs for specific errors

### Database Connection Fails
- Verify `DATABASE_URL` is correct
- Make sure Neon database is active (not suspended)
- Check that sslmode=require is in the connection string

### CORS Errors
- Update `CLIENT_URL` to match your frontend URL exactly
- Remember to include the protocol (https://)

---

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret key for JWT tokens |
| `JWT_EXPIRES_IN` | ✅ | Token expiration (e.g., "7d") |
| `NODE_ENV` | ✅ | Set to "production" |
| `CLIENT_URL` | ✅ | Frontend URL for CORS |
| `SMTP_HOST` | ❌ | Email server (optional) |
| `SMTP_PORT` | ❌ | Email port (optional) |
| `SMTP_USER` | ❌ | Email username (optional) |
| `SMTP_PASS` | ❌ | Email password (optional) |

---

## Next Steps

After backend deployment:
1. Note your Railway backend URL
2. Deploy frontend to Vercel (free)
3. Update `CLIENT_URL` in Railway with your Vercel frontend URL
4. Update frontend's API base URL to point to Railway backend

---

## Free Tier Limits

Railway's free trial gives you:
- $5 of usage credit
- ~500 hours of execution time per month
- Automatic sleep after inactivity (wakes on request)

This should be sufficient for development and small-scale usage.
