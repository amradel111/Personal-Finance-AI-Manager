# Phase 8 Frontend Testing Log

_Last updated: November 24, 2025_

## Automated Coverage

Command: `npm run test`

| Area | File(s) | What is validated |
| --- | --- | --- |
| Auth flow & validation | `src/pages/auth/__tests__/LoginPage.test.tsx` | Required field errors, email format enforcement, login payload normalisation, success redirects (`/dashboard` vs `/profile-setup`), server error messaging, and auto-redirect when already authenticated |
| Route protection | `src/components/__tests__/ProtectedRoute.test.tsx` | Loader rendering, redirect to `/login` when unauthenticated, and outlet rendering when authenticated |
| Navigation UX | `src/components/__tests__/Header.test.tsx` | Desktop nav highlighting, navigation between pages, mobile menu toggle rendering, dropdown logout behaviour, and redirect to `/auth` after logout |

All suites currently pass (13 tests). React Router v7 future warnings appear during tests; no failures, but keep them in mind when upgrading to Router v7.

## Manual / Visual Checks (Completed – November 24, 2025)

Environment: backend running locally via `npm run dev` (port 5000) with a clean PostgreSQL database; frontend served by Vite dev server at port 5173.

1. **End-to-end user journey** – ✅ PASS
   - New user signup ➜ login ➜ forced profile setup overlay ➜ dashboard unlocked with widgets populated.
   - Added two months of expenses; dashboard KPIs refreshed immediately; Monthly Report selector listed new periods and rendered summaries/charts without errors.
   - Edited profile and account email/password successfully, then logged out and back in using the updated credentials.

2. **Form validation smoke tests** – ✅ PASS
   - Profile Setup blocked submission on empty required groups, enforced numeric bounds (e.g., credit score 850 max) and select inputs.
   - Add Expenses rejected negative numbers, reloaded existing month data, and toggled between POST/PUT seamlessly.
   - Edit Account email update enforced format/uniqueness; password change surfaced mismatched confirmation errors and succeeded with valid data.

3. **Navigation and routing** – ✅ PASS
   - Desktop header links and breadcrumbs navigated without page reloads; active state matched current route.
   - Mobile hamburger expanded/collapsed reliably on iPhone 12 simulator; protected routes redirected to `/auth` when token cleared.

4. **Responsive design** – ✅ PASS
   - Verified layouts at 375px, 768px, and 1440px widths. Cards stacked appropriately, charts remained legible, and no horizontal scrolling introduced.
   - Modal overlays (profile prompt, account actions) kept focus trapped and remained usable on small screens.
