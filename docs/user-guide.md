# Personal Finance AI Manager – User Guide

This guide walks through the current end-to-end experience for end users.

## 1. Account Access
1. Visit the deployed or local frontend (`http://localhost:5173`).
2. From the Auth page, choose **Sign up** to create an account (first name, last name, email, phone, strong password).
3. After confirming, log in via the same unified Auth page. The system stores your JWT token in storage so sessions persist between reloads.
4. Forgot your password? Click **“Forgot your password?”** under the login form, enter your email, then follow the link we email you to set a new password.

## 2. Profile Setup
- On first login you are redirected to the **Profile Setup** overlay.
- Complete the form using Dataset 1 style inputs: household size, location type, employment status, monthly income, recurring debts, mortgage/rent, savings goals, insurance, and emergency fund coverage.
- The dashboard stays blurred until the profile is saved, ensuring every downstream calculation has the necessary context.

## 3. Dashboard
- Once the profile exists, the **Dashboard** route (`/dashboard`) shows:
  - Navigation header + mobile nav
  - Income, expense, savings, and financial health widgets
  - Top spending categories
  - Quick statistics and trends
  - Recent expenses list (empty state encourages data entry)
- Use the navigation items (Dashboard, Add Expenses, Monthly Report, Edit Profile, Logout) to move through the app.

## 4. Add Expenses
- Visit **Add Expenses** (`/add-expenses`) to capture Dataset 2 values for a specific month.
- Choose the month using the selector (defaults to current month).
- Fill in each category (housing, groceries, transportation, lifestyle, etc.). The page continuously recalculates totals, essential vs discretionary split, and savings previews.
- Submit to create or update the monthly record. Existing months load automatically when selected.

## 5. Monthly Report
- Navigate to **Monthly Report** (`/monthly-report`).
- Pick a month using the dropdown or Prev/Next buttons.
- Key sections include:
  - Report overview with health score badge
  - Spending-by-category pie chart + detail list
  - Income vs expenses comparison
  - Essential vs discretionary bar, savings progress, debt metrics, housing ratio, emergency fund indicator
  - Insights: optimization priority, flags, recommendations
  - Trend analysis (last six months), category change callouts, and category timelines
- If no expenses exist yet, the page prompts you to add them instead of showing empty widgets.

## 6. Edit Account & Profile
- The avatar button in the header opens a dropdown where you can:
  - Open **Account settings** (`/edit-account`) to change email or password.
  - Log out (clears stored credentials).
- `Edit Profile` in the nav revisits the dataset-1 form for updates.

## 7. Security & Session Tips
- Logging out removes stored tokens immediately.
- Password changes invalidate the old password; log back in with the new one.
- Tokens are stored based on the “Remember me” toggle (localStorage vs sessionStorage).

## 8. Recommended Workflow
1. Sign up and log in.
2. Complete profile setup.
3. Add the latest month’s expenses.
4. Review the dashboard quick stats.
5. Dive into the monthly report for deeper insight.
6. Repeat monthly, updating the profile whenever income, goals, or debts change.

That sequence ensures all analytics (ratios, flags, charts, and recommendations) stay accurate for every user.
