# Project Structure

> This document is a **map for humans and AI agents** to quickly understand where things live and how the system fits together.
> **Last Updated:** 2025-12-06

---

## 0. Orientation for AI Agents

- **Read first:**
  - `what_is_this_project.md` – high-level concept and long-term vision.
  - `short_term_goal.md` – current scope and focus.
  - `tasks.md` – phased roadmap and completion status.
- **Then:**
  - Backend implementation → `backend/`
  - Frontend implementation → `frontend/`
  - Data model & schema → `backend/prisma/` and `datasets/`
  - Setup guides → `docs/setup-guide.md` and `backend/README.md`

Use this file to **locate the right file quickly**, then jump into the implementation.

---

## 1. Root Directory

- **`backend/`**
  - Node.js/Express API, Prisma ORM, controllers, routes, middleware, and backend tests.
- **`frontend/`**
  - React + Vite + Tailwind SPA, pages, components, context, and API service layer.
- **`datasets/`**
  - Raw CSV datasets used to design the schema and financial logic:
    - `user_profile.csv` (Dataset 1)
    - `monthly_spending.csv` (Dataset 2)
    - `financial_health_assessment.csv` (Dataset 3)
- **`ML model/`**
  - Placeholder for future ML models and related assets.
- **`agents.md`**
  - Instructions and expectations for AI agents working on this repo.
- **`docs/`**
  - Reference docs: API, database schema, deployment, setup, and user guide.
- **`what_is_this_project.md`**
  - Plain-language overview of the Personal Finance AI Manager.
- **`short_term_goal.md`**
  - Initial features and database setup priorities.
- **`tasks.md`**
  - Phased, detailed task list (Phase 1–10) with checkboxes.
- **`PHASE*_VERIFICATION_COMPLETE.md`**
  - Phase-level verification reports for Phases 1–3.
- **`start-dev.bat`**
  - Windows helper script to start backend and frontend together.
- **`temp_monthly.tsx`**
  - Scratchpad/temporary frontend work file.

---

## 2. Backend (Node + Express + Prisma)

**Folder:** `backend/`

### 2.1 Key Folders

- **`backend/config/`**
  - `database.js` – Prisma Client instance, DB connection logging.
- **`backend/controllers/`**
  - `authController.js` – signup/login, validation, JWT issuance, lastLogin handling, profile check.
  - `profileController.js` – create/get/update user profile (Dataset 1) with validation and derived metrics.
  - `expensesController.js` – CRUD for monthly expenses (Dataset 2), totals/ratios/50-30-20, triggers health updates.
  - `dashboardController.js` – aggregates latest income/expenses/savings/top categories for dashboard.
  - `reportsController.js` – monthly report + history, trend analysis, integrates financial health.
  - `budgetsController.js` – CRUD for budgets, category allocations, and progress snapshots.
  - `goalsController.js` – CRUD for financial goals and progress tracking.
- **`backend/middleware/`**
  - `authenticate.js` – JWT verification, loads user into `req.user`.
- **`backend/routes/`**
  - `auth.js` – `/api/auth` (signup, login, profile, check-profile).
  - `profile.js` – `/api/profile` (create/get/update).
  - `expenses.js` – `/api/expenses` (create/list/by-month/update/delete).
  - `dashboard.js` – `/api/dashboard/summary`, `/api/dashboard/recent`.
  - `reports.js` – `/api/reports/monthly/:month_year`, `/api/reports/history`.
  - `budgets.js` – `/api/budgets` CRUD + budget status endpoints.
  - `goals.js` – `/api/goals` CRUD + progress endpoints.
  - `notifications.js` – notification/email triggers (used by CI/email tests).
- **`backend/utils/`**
  - `jwt.js` – token generation/verification.
  - `passwordUtils.js` – bcrypt hash/compare.
  - `validation.js` – email, password, name, phone validators.
  - `expenses.js` – category constants, month parsing, totals, 50/30/20 evaluation.
  - `health.js` – financial health scoring and flags based on profile + expenses.
  - `goals.js` – goal calculations/progress helpers.
  - `emailService.js` – mail transport + templating helpers.
- **`backend/prisma/`**
  - `schema.prisma` – full Prisma schema (users, user_profiles, monthly_expenses, financial_health, goals, budgets, password_reset_tokens).
  - `migrations/` – database migrations.
  - `DATABASE_SCHEMA.md` – human-readable DB documentation and ER diagram.

### 2.2 Core Backend Files

- **`backend/server.js`**
  - Express app bootstrap.
  - CORS config using `CLIENT_URL`.
  - Health check at `/`.
  - Mounts all `/api/*` routes.
- **`backend/.env` / `.env.example`**
  - DB connection (`DATABASE_URL`), JWT secrets, client URL, etc.
- **`backend/README.md`**
  - Setup instructions and API overview.
 - **`EMAIL_NOTIFICATIONS.md`**
   - Email/notification behaviors and testing notes.
 - **`ci-phase6.js`**, **`fix-health-scores.js`**
   - CI runner and one-off health score repair script.

### 2.3 Backend Test & Utility Scripts

_All located under `backend/`._

- **API & feature tests**
  - `phase8-api.test.js` – broader API regression suite.
  - `test-api.js` – API coverage across auth/profile/expenses.
  - `test-budgets.js` – budgets endpoints.
  - `test-goals-api.js` – goals endpoints.
  - `test-email-notifications.js` – notification/email flows.
- **Test orchestration**
  - `run-tests.js` – runner that wires env + suites.
  - `ci-phase6.js` – CI helper used in workflows.

**Note:** All API test suites expect:
- PostgreSQL migrated and reachable.
- Backend server running on `http://localhost:5000`.

---

## 3. Frontend (React + Vite + Tailwind)

**Folder:** `frontend/`

### 3.1 Key Folders

- **`frontend/src/pages/`**
  - `ComingSoon.tsx` – generic placeholder page for future features.
- **`frontend/src/pages/auth/`**
  - `Auth.tsx` – unified login/signup page; `/login` and `/signup` redirect here.
  - `Login.tsx`, `Signup.tsx` – underlying form components.
  - `ForgotPassword.tsx`, `ResetPassword.tsx` – password recovery flow screens.
  - `EditAccount.tsx` – account settings page for email updates and password changes (Phase 7).
- **`frontend/src/pages/profile/`**
  - `ProfileSetup.tsx` – multi-section profile form with blurred dashboard overlay flow.
- **`frontend/src/pages/dashboard/`**
  - `Dashboard.tsx` – main home/dashboard, widgets, quick insights, spending trend, recent months, overlay if no profile.
- **`frontend/src/pages/expenses/`**
  - `AddExpenses.tsx` – add/update monthly expenses by category with live totals and essential vs discretionary split.
- **`frontend/src/pages/reports/`**
  - `MonthlyReport.tsx` – monthly report UI with charts, health metrics, trends, insights.
- **`frontend/src/components/`**
  - `Header.tsx` – shared top navigation with user dropdown menu (Account settings, Logout) and responsive mobile menu.
  - `MobileNav.tsx` – mobile navigation sheet used by `Header`.
  - `MonthPicker.tsx` – month selector control for expenses/reports.
  - `ProtectedRoute.tsx` – guards authenticated routes; uses `AuthContext`.
  - `Select.tsx` – enhanced dropdown used in Profile Setup.
- **`frontend/src/context/`**
  - `AuthContext.tsx` – global auth state, token persistence, login/logout, profile refresh.
  - `ThemeContext.tsx` – global light/dark theme state; wraps the app in `main.tsx` and controls Tailwind `dark` mode and the theme toggle in `Header.tsx`.
- **`frontend/src/services/`**
  - `api.ts` – Axios instance with base URL & interceptors.
  - `authService.ts` – auth + profile check calls.
  - `profileService.ts` – `/api/profile` wrapper.
  - `dashboardService.ts` – `/api/dashboard/summary`, `/api/dashboard/recent`.
  - `expensesService.ts` – `/api/expenses` CRUD helpers.
  - `budgetsService.ts` – `/api/budgets` helpers.
  - `goalsService.ts` – `/api/goals` helpers.
  - `reportsService.ts` – `/api/reports/history` & `/api/reports/monthly/:month_year` helpers.
- **`frontend/src/utils/`**
  - `validation.ts` – client-side validation helpers.
  - `authStorage.ts` – localStorage/sessionStorage handling for remember-me.

### 3.2 Core Frontend Files

- **`frontend/src/App.tsx`**
  - Top-level routing:
    - `/auth` (login/signup), redirects from `/login` and `/signup`.
    - Protected: `/dashboard`, `/profile-setup`, `/add-expenses`, `/monthly-report`, `/edit-account`.
    - `/forgot-password` placeholder.
- **`frontend/src/main.tsx`**
  - React/Vite entrypoint.
- **`tailwind.config.js`, `postcss.config.js`, `index.css`, `App.css`**
  - Styling pipeline and base styles.
 - **Tests**
   - `frontend/src/components/__tests__/` – component tests for Header, MobileNav, ProtectedRoute.
   - `frontend/src/pages/auth/__tests__/` – auth page tests.
   - `frontend/tests/phase8-frontend-tests.md` – frontend test checklist.

---

## 4. Data & ML Assets

- **`datasets/`** (root)
  - Ground truth CSVs used to design schema and business logic.
- **`backend/prisma/schema.prisma`** and **`backend/prisma/DATABASE_SCHEMA.md`**
  - Canonical mapping from datasets → relational tables.
- **`ML model/`**
  - Reserved for future trained models, notebooks, or serving code (currently empty aside from `.gitkeep`).

---

## 5. Existing Documentation & Verification

- **`tasks.md`** – master task list with phases (1–10) and checklists.
- **`agents.md`** – behavior contract for AI agents working on this repo.

---

## 6. Process Flow (End-to-End)

This section explains **how data and requests move through the system**.

### 6.1 Authentication & Session

1. User lands on `/auth` (see `frontend/src/pages/auth/Auth.tsx`).
2. On signup:
   - Frontend calls `authService.signup()` → `POST /api/auth/signup`.
   - `authController.signup` validates email/password/phone, hashes password, creates `User`, returns JWT + basic user.
3. On login:
   - Frontend calls `authService.login()` → `POST /api/auth/login`.
   - `authController.login` verifies credentials, updates `lastLogin`, returns JWT + user.
4. JWT is stored by `AuthContext` using `authStorage` (localStorage/sessionStorage based on remember-me).
5. All protected frontend routes are wrapped in `ProtectedRoute`, which attaches the token via `api.ts` interceptors.
6. Forgotten password flow:
  - `ForgotPassword.tsx` calls `authService.requestPasswordReset()` → `POST /api/auth/request-password-reset`.
  - Backend generates a token (stored in `password_reset_tokens`) and emails the user a secure link.
  - `ResetPassword.tsx` submits the new password via `authService.resetPassword()` → `POST /api/auth/reset-password` with the token + credentials.
7. Account security updates:
  - `EditAccount.tsx` calls `PUT /api/auth/update-account` for email/name changes and `PUT /api/auth/change-password` for password updates.
  - Both routes require authentication and reuse the validations in `authController`.

### 6.2 Profile Setup (Dataset 1)

1. After login, frontend calls `authService.checkProfileComplete()` → `GET /api/auth/check-profile`.
2. If no profile, user is sent to `/profile-setup` (`ProfileSetup.tsx`) or sees a dashboard overlay prompting setup.
3. Submitting the profile form:
   - Frontend calls `profileService.createProfile()` → `POST /api/profile`.
   - `profileController.createProfile` validates fields, computes derived metrics (DTI, housing ratio, savings rate), and writes to `user_profiles`.
4. On later edits, frontend will call `PUT /api/profile` via `profileService.updateProfile()` (Phase 7 will build full Edit Profile UI).

### 6.3 Dashboard Flow (Aggregated View)

1. Authenticated user goes to `/dashboard` (`Dashboard.tsx`).
2. Dashboard checks profile again via `checkProfileStatus`; if missing, overlay blocks the content and routes to `/profile-setup`.
3. When profile exists:
   - Frontend calls `dashboardService.getDashboardSummary()` → `GET /api/dashboard/summary`.
   - Backend `dashboardController.getDashboardSummary`:
     - Reads income and health score from `user_profiles`.
     - Reads latest row from `monthly_expenses`.
     - Computes savings, savings rate, top categories, and 50/30/20 compliance.
   - Frontend renders summary cards, quick insights, savings progress, and mini spending trend.
4. Dashboard also calls `dashboardService.getRecentExpenses()` → `GET /api/dashboard/recent` to populate the “Recent Months” list.

### 6.4 Add Expenses (Dataset 2) & Health Updates

1. User navigates to `/add-expenses` (`AddExpenses.tsx`) from the header or CTA.
2. On page load for a given month:
   - Frontend calls `expensesService.getExpenseByMonth()` → `GET /api/expenses/:month_year`.
   - If a record exists, the form is pre-filled and subsequent saves use `PUT /api/expenses/:id`.
   - If not, a new record will be created with `POST /api/expenses`.
3. Backend `expensesController` uses `utils/expenses.js` to:
   - Normalize/validate amounts.
   - Compute totals, essential vs discretionary spending, ratios, highest category, 50/30/20 compliance, month-over-month change.
4. After saving expenses, `expensesController` calls `utils/health.computeFinancialHealth` and updates profile health fields so the dashboard and reports show up-to-date scores and flags.

### 6.5 Budgets & Category Allocations

1. (Planned UI) User selects a month/year and category budget via `budgetsService` helpers.
2. `budgetsService.getBudgets(monthYear)` → `GET /api/budgets?monthYear=YYYY-MM`.
   - `budgetsController.getBudgets` normalizes the month to the first day, filters by `userId`, and returns all category rows for that period.
3. Creating/updating a budget row:
   - `budgetsService.upsertBudget()` → `POST /api/budgets` with `{ category, amount, monthYear }`.
   - Controller upserts a record keyed by `(userId, monthYear, category)`, auto-populating `actualSpending` by looking up the matching field inside `monthly_expenses`.
4. The response includes `budgetedAmount` vs `actualSpending`, enabling the UI (and notifications) to visualize utilization and alert thresholds.

### 6.6 Goals & Progress Tracking

1. User opens the future goals view; `goalsService.getGoals()` → `GET /api/goals`.
   - `goalsController.getAllGoals` fetches all goals plus the user’s entire `monthly_expenses` history and pipes both through `utils/goals.computeGoalProgressForUser` to derive completion percentages, projected finish month, and status flags.
2. Creating a goal:
   - `goalsService.createGoal()` → `POST /api/goals` with name, `type`, target amounts, and optional start/target months.
   - Controller validates allowed types/statuses, persists the row, recomputes progress, and returns the enriched goal object.
3. Updating or pausing a goal uses `PUT /api/goals/:id`; deleting uses `DELETE /api/goals/:id`. Authorization is enforced per-goal via `userId` checks before mutating anything.
4. Because progress is derived from savings deltas in `monthly_expenses`, any new expense entry will be reflected the next time goals are fetched.

### 6.7 Monthly Report & Trends (Dataset 1 + 2 + 3)

1. User visits `/monthly-report` (`MonthlyReport.tsx`).
2. Frontend loads history:
   - `reportsService.getReportHistory()` → `GET /api/reports/history`.
   - Populates month selector with all months that have expense data.
3. When a month is selected:
   - `reportsService.getMonthlyReport(month)` → `GET /api/reports/monthly/:month_year`.
   - `reportsController.getMonthlyReport`:
     - Loads profile, expenses for that month, all expenses (for trends), and any `financial_health` records.
     - Builds a **report object** (income vs expenses vs savings, category breakdown, essential vs discretionary, debt metrics, housing ratio, emergency fund, flags, etc.).
     - Computes a financial health **assessment** using `utils/health.js`, optionally merged with stored `financial_health` rows.
     - Builds a **trend window** of up to 6 months, including savings, ratios, and health scores to show charts.
4. Frontend renders:
   - Summary cards for month/income/expenses/savings.
   - Bar charts for income vs expenses and essential vs discretionary.
   - Pie chart + list for category breakdown.
   - Health metrics, flags, and positive indicators.
   - Month-over-month deltas and multi-month trends (expenses vs savings vs health scores).

### 6.8 Notifications & Email Alerts

1. Authenticated clients (or automated jobs/tests) can call `/api/notifications/*` endpoints defined in `backend/routes/notifications.js`.
2. Monthly reminder:
  - `POST /api/notifications/monthly-reminder` with `{ lastReportMonth }` optional payload.
  - Uses `emailService.sendMonthlyReportReminder` to nudge the user to file the latest report.
3. Budget alert:
  - `POST /api/notifications/budget-alert` with `{ category, spent, budget, percentageUsed }`.
  - Fires `sendBudgetAlert`, ideal after comparing `actualSpending` vs `budgetedAmount`.
4. Health alert:
  - `POST /api/notifications/health-alert` with `{ alertType, details }`, where `alertType ∈ { low-health-score, no-emergency-fund, high-debt, overspending, low-savings-rate }`.
  - Calls `sendFinancialHealthAlert` to provide tailored advice.
5. All routes rely on `authenticate` middleware so `req.user` provides `email`/`firstName`; transport + templating live in `backend/utils/emailService.js`.

### 6.9 Testing & Verification Flow

1. Ensure DB is migrated (`npx prisma migrate deploy`) and backend server is running on port 5000.
2. Run targeted suites from `backend/tests/` depending on the feature you’re touching:
  - `node phase8-api.test.js` – main regression suite for auth, profile, dashboard, expenses, reports.
  - `node test-budgets.js` – verifies `/api/budgets` normalization and upsert logic.
  - `node test-goals-api.js` – covers goals CRUD and progress calculations.
  - `node test-email-notifications.js` – ensures notification endpoints call the correct email templates.
  - `node test-api.js` – legacy wide API coverage (auth/profile/expenses) still useful for smoke tests.
  - `node run-tests.js` – orchestrator that wires env vars and executes grouped suites (used in CI and local smoke passes).
3. Fix any failing tests by tracing from the test script → service layer → controller → Prisma calls, ensuring fixtures (seed users) match expectations.

---

## 7. Maintaining This File

- Whenever you **add a major feature**, **new page**, **new API**, or **new dataset/model**:
  - Update the relevant section above (Backend, Frontend, Data, or Process Flow).
  - If a new end-to-end flow is introduced, add a short subsection under **Process Flow**.
- Keep `tasks.md` and this file consistent so that both humans and AI agents have a reliable mental model of the project.
