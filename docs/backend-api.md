# Backend API Reference

_All endpoints live under the base URL `http://localhost:5000/api` in development. Every route except `POST /auth/signup` and `POST /auth/login` requires a valid `Authorization: Bearer <JWT>` header._

## Authentication (`/auth`)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/signup` | Create a new user. Body fields: `email`, `password`, `firstName`, `lastName`, `phone`. Returns `user` summary + `token`. |
| POST | `/auth/login` | Authenticate existing user. Body fields: `email`, `password`. Returns `user` summary + `token`. |
| GET | `/auth/profile` | Fetch authenticated user record plus embedded profile (if it exists). |
| GET | `/auth/check-profile` | Returns `{ hasProfile: boolean, profileComplete: boolean }`. Useful for first-login routing. |
| PUT | `/auth/update-account` | Update the user email. Body: `{ email }`. |
| PUT | `/auth/change-password` | Change password. Body: `{ currentPassword, newPassword }`. |

### Sample login response

```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "demo@example.com",
    "firstName": "Demo",
    "lastName": "User",
    "phone": "+1234567890",
    "createdAt": "2025-11-01T12:00:00.000Z",
    "lastLogin": "2025-11-24T01:10:00.000Z"
  },
  "token": "<JWT>"
}
```

## Profile (`/profile`)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/profile` | Create the dataset-1 profile snapshot. Accepts all household, income, debt, insurance, and goal fields documented in `profileController`. Validates enums and numeric ranges. |
| GET | `/profile` | Return the authenticated user profile (404 if missing). |
| PUT | `/profile` | Update profile with same payload as create; recomputes derived ratios and optimization metadata. |

Key body fields include `household_size`, `num_adults`, `location_type`, `employment_status`, `monthly_household_income`, `total_debt`, `monthly_debt_payments`, `savings_goal_monthly`, `has_health_insurance`, `financial_goal_type`, and `emergency_fund_months`.

## Expenses (`/expenses`)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/expenses` | Create a monthly expense record for the selected `monthYear` (`YYYY-MM`). Body accepts 13+ category amounts (camelCase or snake_case). Calculates totals, essential vs discretionary split, savings, 50/30/20 status, and MoM deltas. Rejects duplicate months. |
| GET | `/expenses` | List all monthly expense records for the user (latest first). |
| GET | `/expenses/:month_year` | Fetch the record for a given month (format `YYYY-MM`). Returns 404 if not found. |
| PUT | `/expenses/:id` | Update an existing record by id with the same category payload. Recomputes totals and flags. |
| DELETE | `/expenses/:id` | Delete the specified expense record and refresh the profile health score. |

Important calculated fields in responses:
- `totalExpenses`, `totalEssentialSpending`, `totalDiscretionarySpending`
- `essentialSpendingRatio`, `discretionarySpendingRatio`
- `savingsThisMonth` (income minus expenses minus debt payments)
- `spendingVsLastMonthPercentage`
- `highestSpendingCategory`
- `meets_50_30_20_rule`

## Dashboard (`/dashboard`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/dashboard/summary` | Aggregated snapshot combining profile income + latest expenses. Returns income, expenses, computed savings, savings rate, financial health score, top 3 categories, 50/30/20 compliance, and helper flags. |
| GET | `/dashboard/recent` | Last 10 expense entries with totals, savings, rule compliance, and category highlights. Includes `hasExpensesData` helper and descriptive empty state message. |

## Reports (`/reports`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/reports/history` | Returns every month that has expense data plus summary stats (expenses, savings, highest category, rule flag). Used for dropdowns/timelines. |
| GET | `/reports/monthly/:month_year` | Fully aggregated report for the selected month. Combines profile, monthly expenses, historical trend window, and any stored financial health records.
Returns `hasData`, `report`, and `assessment` objects. |

### Monthly report payload highlights
- `report.monthYear`, `income`, `totalExpenses`, `savingsAmount`, `savingsRate`
- `categoryBreakdown` (label, amount, percent)
- `essentialVsDiscretionary` (absolute + ratio)
- `debt` metrics, `housingCostRatio`, `emergencyFundMonths`
- `monthOverMonth` deltas and `trendAnalysis` (last six months of expenses/savings, stats, flag counts)
- `categoryInsights.topIncreases` / `.topDecreases`
- `assessment` merges live calculation with stored dataset record and includes financial stress level, optimization priority, and problem flags.

## Error Handling
- Validation issues return `400` with `error` or `errors` arrays describing the offending fields.
- Authentication failures return `401` (`Invalid email or password`, `Missing/invalid token`).
- Duplicate records respond with `409`.
- Missing resources return `404`.
- Uncaught issues return `500` with a generic `Internal server error` body.

## Pagination & Limits
Current endpoints return full datasets because user counts are small per profile. If future datasets grow, add query parameters for pagination (e.g., `/expenses?limit=12&cursor=...`).
