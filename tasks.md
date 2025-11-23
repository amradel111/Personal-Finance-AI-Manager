# Personal Finance AI Manager - Development Tasks

> **Last Updated:** November 24, 2025  
> **Status Legend:** ❌ Not Started | 🔄 In Progress | ✅ Completed

---

## 📋 PHASE 1: PROJECT SETUP & INITIALIZATION ✅ **COMPLETE**

### 1.1 Database Setup ✅
- ✅ **1.1.1** Install PostgreSQL locally
  - ✅ Download and install PostgreSQL
  - ✅ Create database user with appropriate permissions
  - ✅ Document connection credentials in `.env.example`
  
- ✅ **1.1.2** Choose and configure ORM (Prisma or Sequelize)
  - ✅ Install ORM package (Prisma)
  - ✅ Initialize ORM configuration
  - ✅ Set up connection to PostgreSQL
  
- ✅ **1.1.3** Design database schema based on datasets
  - ✅ Create `users` table (authentication data)
    - Fields: id, email, password, firstName, lastName, created_at, updated_at, last_login
  - ✅ Create `user_profiles` table (Dataset 1)
    - Fields: All 22 fields from user_profile.csv
    - Relationships: Foreign key to users table
  - ✅ Create `monthly_expenses` table (Dataset 2)
    - Fields: All 24 fields from monthly_spending.csv
    - Relationships: Foreign key to users table
  - ✅ Create `financial_health` table (Dataset 3)
    - Fields: All 21 fields from financial_health_assessment.csv
    - Relationships: Foreign key to users table
  
- ✅ **1.1.4** Create database migrations
  - ✅ Generate migration for users table
  - ✅ Generate migration for user_profiles table
  - ✅ Generate migration for monthly_expenses table
  - ✅ Generate migration for financial_health table
  - ✅ Test migrations on local database
  
- ❌ **1.1.5** Create database seed data (optional for testing)
  - ❌ Create test user accounts
  - ❌ Populate sample profile data
  - ❌ Populate sample expense data

### 1.2 Backend Setup ✅
- ✅ **1.2.1** Initialize Node.js backend project
  - ✅ Create `backend` folder structure
  - ✅ Run `npm init` and configure package.json
  - ✅ Install core dependencies:
    - express, dotenv, cors, bcryptjs, jsonwebtoken, @prisma/client, axios
  - ✅ Install dev dependencies:
    - prisma
  
- ✅ **1.2.2** Set up Express server
  - ✅ Create `server.js` entry point
  - ✅ Configure Express middleware (JSON parser, CORS)
  - ✅ Set up environment variables with dotenv
  - ✅ Create basic server listening on port 5000
  - ✅ Test server startup
  
- ✅ **1.2.3** Create backend folder structure
  - ✅ `/config` - database and configuration files
  - ✅ `/prisma` - Prisma schema and migrations
  - ✅ `/controllers` - business logic handlers (authController.js)
  - ✅ `/routes` - API route definitions (auth.js)
  - ✅ `/middleware` - authentication & validation middleware (authenticate.js)
  - ✅ `/utils` - helper functions (jwt.js, passwordUtils.js)
  
- ✅ **1.2.4** Set up authentication utilities
  - ✅ Create JWT token generation function
  - ✅ Create JWT token verification middleware
  - ✅ Create password hashing utilities
  - ✅ Create authentication middleware for protected routes

- ✅ **1.2.5** Build authentication API endpoints
  - ✅ POST /api/auth/signup - User registration
  - ✅ POST /api/auth/login - User login
  - ✅ GET /api/auth/profile - Get user profile (protected)

### 1.3 Frontend Setup ✅
- ✅ **1.3.1** Initialize React frontend project
  - ✅ Run `npm create vite@latest frontend` with React + TypeScript
  - ✅ Navigate to frontend folder
  - ✅ Install dependencies:
    - react-router-dom, axios, tailwindcss, postcss, autoprefixer
  
- ✅ **1.3.2** Configure Tailwind CSS
  - ✅ Run `npx tailwindcss init`
  - ✅ Configure `tailwind.config.js`
  - ✅ Add Tailwind directives to CSS
  - ✅ Test with basic styled component
  
- ✅ **1.3.3** Create frontend folder structure
  - ✅ `/src/components` - reusable UI components
  - ✅ `/src/pages` - page-level components
  - ✅ `/src/services` - API service functions (api.ts, authService.ts)
  - ✅ `/src/context` - React Context for state management
  - ✅ `/src/utils` - helper functions
  - ✅ `/src/assets` - images, icons
  
- ✅ **1.3.4** Set up React Router
  - ✅ Install react-router-dom
  - ✅ Create basic route structure in App.tsx
  - ✅ Set up protected route component placeholder
  
- ✅ **1.3.5** Set up Axios configuration
  - ✅ Create axios instance with base URL (services/api.ts)
  - ✅ Configure request interceptors (add JWT token automatically)
  - ✅ Configure response interceptors (handle 401 errors)
  - ✅ Create API service wrapper functions (authService.ts)

---

## 📋 PHASE 2: AUTHENTICATION SYSTEM

> Note: Login and Signup are implemented via a unified `Auth` page at `/auth`. Routes `/login` and `/signup` redirect to `/auth`.

### 2.1 Backend - User Authentication ✅
- ✅ **2.1.1** Create User model
  - ✅ Define User schema/model with ORM
  - ✅ Add validation rules
  - ✅ Test model creation
  
- ✅ **2.1.2** Build Signup API endpoint
  - ✅ Create POST `/api/auth/signup` route
  - ✅ Implement signup controller:
    - ✅ Validate input (email format, password strength)
    - ✅ Check if user already exists
    - ✅ Hash password with bcrypt
    - ✅ Create user record in database
    - ✅ Return success message
  - ✅ Test with Postman/Thunder Client
  
- ✅ **2.1.3** Build Login API endpoint
  - ✅ Create POST `/api/auth/login` route
  - ✅ Implement login controller:
    - ✅ Find user by email
    - ✅ Compare password with bcrypt
    - ✅ Generate JWT token
    - ✅ Return token and user data
  - ✅ Test with Postman/Thunder Client
  
- ✅ **2.1.4** Build authentication middleware
  - ✅ Create middleware to verify JWT token
  - ✅ Extract user ID from token
  - ✅ Attach user data to request object
  - ✅ Handle token expiration/invalid tokens
  
- ✅ **2.1.5** Create user profile check endpoint
  - ✅ Create GET `/api/auth/check-profile` route (protected)
  - ✅ Check if user has completed profile setup
  - ✅ Return profile completion status

### 2.2 Frontend - Signup Page ✅
- ✅ **2.2.1** Design Signup page UI
  - ✅ Create signup form with fields:
    - ✅ Full Name
    - ✅ Email
    - ✅ Password
    - ✅ Confirm Password
  - ✅ Add password strength indicator
  - ✅ Style with Tailwind CSS
  - ✅ Add validation messages
  
- ✅ **2.2.2** Implement Signup functionality
  - ✅ Create form state management
  - ✅ Add client-side validation
  - ✅ Connect to signup API
  - ✅ Handle success (redirect to login)
  - ✅ Handle errors (display messages)
  - ✅ Add loading states
  
- ✅ **2.2.3** Add "Already have account? Login" link
  - ✅ Link to login page
  - ✅ Style appropriately

### 2.3 Frontend - Login Page ✅
- ✅ **2.3.1** Design Login page UI
  - ✅ Create login form with fields:
    - ✅ Email
    - ✅ Password
    - ✅ "Remember me" checkbox
  - ✅ Add "Login" and "Signup" buttons
  - ✅ Style with Tailwind CSS
  - ✅ Add validation messages
  
- ✅ **2.3.2** Implement Login functionality
  - ✅ Create form state management
  - ✅ Add client-side validation
  - ✅ Connect to login API
  - ✅ Store JWT token in localStorage/sessionStorage
  - ✅ Handle "Remember me" functionality
  - ✅ Handle success (check profile completion)
  - ✅ Redirect based on profile status:
    - ✅ No profile → Profile Setup Page
    - ✅ Has profile → Dashboard
  - ✅ Handle errors (display messages)
  - ✅ Add loading states

### 2.4 Frontend - Auth Context ✅
- ✅ **2.4.1** Create Authentication Context
  - ✅ Set up React Context for auth state
  - ✅ Store user data and token
  - ✅ Create login/logout/signup functions
  - ✅ Persist auth state across page reloads
  
- ✅ **2.4.2** Create ProtectedRoute component
  - ✅ Check if user is authenticated
  - ✅ Redirect to login if not authenticated
  - ✅ Allow access if authenticated

---

## 📋 PHASE 3: USER PROFILE SETUP ✅ **COMPLETE**

### 3.1 Backend - Profile Management
- ✅ **3.1.1** Create UserProfile model
  - ✅ Define schema with all 22 fields from Dataset 1:
    - household_size, num_adults, num_children
    - location_type, life_stage, employment_status
    - monthly_household_income, income_stability
    - credit_score, total_debt, monthly_debt_payments
    - rent_or_mortgage, savings_goal_monthly
    - has_health_insurance, financial_goal_type
    - emergency_fund_months, savings_rate_percentage
    - debt_to_income_ratio, housing_cost_ratio
    - monthly_savings_actual, financial_health_score
    - optimization_priority
  - ✅ Set up relationships (foreign key to User)
  - ✅ Add validation rules
  
- ✅ **3.1.2** Build Create Profile API endpoint
  - ✅ Create POST `/api/profile` route (protected)
  - ✅ Implement controller:
    - ✅ Validate all input fields
    - ✅ Calculate derived fields (ratios, percentages)
    - ✅ Create profile record linked to user
    - ✅ Return success and profile data
  - ✅ Tested via automated suite
  
- ✅ **3.1.3** Build Get Profile API endpoint
  - ✅ Create GET `/api/profile` route (protected)
  - ✅ Return current user's profile
  - ✅ Handle case when profile doesn't exist
  
- ✅ **3.1.4** Build Update Profile API endpoint
  - ✅ Create PUT `/api/profile` route (protected)
  - ✅ Update existing profile
  - ✅ Recalculate derived fields
  - ✅ Return updated profile

### 3.2 Frontend - Profile Setup Page
- ✅ **3.2.1** Design Profile Setup UI structure
  - ✅ Create blurred dashboard overlay when no profile exists (Dashboard overlay)
  - ✅ Add "Set up your profile for a tailored experience" message
  - ✅ Single scrollable form with clear sections
  - ✅ Kept single-page flow for speed
  
- ✅ **3.2.2** Build Profile Form - Household Information Section
  - ✅ Household size (number input)
  - ✅ Number of adults (number input)
  - ✅ Number of children (number input)
  - ✅ Location type (custom select)
  - ✅ Life stage (custom select)
  - ✅ Validation
  
- ✅ **3.2.3** Build Profile Form - Employment & Income Section
  - ✅ Employment status (custom select)
  - ✅ Monthly household income (number input)
  - ✅ Income stability (custom select)
  - ✅ Validation
  
- ✅ **3.2.4** Build Profile Form - Financial Obligations Section
  - ✅ Credit score (number input, 300-850)
  - ✅ Total debt (number input)
  - ✅ Monthly debt payments (number input)
  - ✅ Rent or mortgage (number input)
  - ✅ Validation
  
- ✅ **3.2.5** Build Profile Form - Savings & Goals Section
  - ✅ Monthly savings goal (number input)
  - ✅ Has health insurance (Yes/No segmented control)
  - ✅ Financial goal type (custom select)
  - ✅ Validation
  
- ✅ **3.2.6** Implement form submission
  - ✅ Collect all form data
  - ✅ Client-side validation
  - ✅ Send data to backend API
  - ✅ Handle success (redirect to dashboard)
  - ✅ Handle errors (display messages)
  - ✅ Loading states
  
- ✅ **3.2.7** Style and polish Profile Setup page
  - ✅ Consistent Tailwind styling
  - ✅ Responsive layout
  - ✅ Smooth transitions and elevated selects
  - ✅ Header bar with brand and Logout

---

## 📋 PHASE 4: DASHBOARD (HOME PAGE) ✅ **COMPLETE**

### 4.1 Backend - Dashboard Data
- ✅ **4.1.1** Build Dashboard Summary API endpoint
  - ✅ Create GET `/api/dashboard/summary` route (protected)
  - ✅ Aggregate and return:
    - Total income
    - Total expenses (latest month)
    - Total savings
    - Financial health score
    - Savings rate
    - Top spending categories
  - ✅ Handle cases with no expense data
  - ✅ Test endpoint
  
- ✅ **4.1.2** Build Recent Transactions endpoint (optional)
  - ✅ Create GET `/api/dashboard/recent` route
  - ✅ Return last 5-10 expense entries

### 4.2 Frontend - Dashboard Layout
- ✅ **4.2.1** Create Dashboard page component
  - ✅ Set up page structure
  - ✅ Add loading states
  - ✅ Handle empty data states
  
- ✅ **4.2.2** Build Navigation Bar component
  - ✅ Create responsive navbar
  - ✅ Add navigation links:
    - Dashboard (Home) - highlighted when active
    - Add Expenses
    - Monthly Report
    - Edit Profile
    - Logout
  - ✅ Add user profile icon/name
  - ✅ Style with Tailwind
  - ✅ Implement logout functionality
  - ✅ Make mobile-responsive (hamburger menu)
  
- ✅ **4.2.3** Create Dashboard Widget components
  - ✅ Income Overview Card
    - Display monthly income
    - Add icon and styling
  - ✅ Expenses Overview Card
    - Display total monthly expenses
    - Show comparison to income
  - ✅ Savings Overview Card
    - Display current savings
    - Show savings rate percentage
  - ✅ Financial Health Score Card
    - Display score with visual indicator
    - Color-code by health level
  
- ✅ **4.2.4** Create placeholder/empty states
  - ✅ "Add expenses to unlock insights" message
  - ✅ Blurred or skeleton components when no data
  - ✅ Call-to-action button to Add Expenses
  
- ✅ **4.2.5** Fetch and display dashboard data
  - ✅ Call dashboard summary API
  - ✅ Populate all widgets with real data
  - ✅ Handle loading and error states
  - ✅ Add refresh functionality
  
- ✅ **4.2.6** Add quick statistics section
  - ✅ This month vs last month comparison
  - ✅ Budget progress indicators
  - ✅ Spending trends mini-chart

### 4.3 Frontend - UI Polish & UX Fixes
- ✅ Align Quick Insights grid for symmetry in 2-column layouts
- ✅ Equalize card heights across paired sections (savings/trend)
- ✅ Improve Spending Trend mini-chart visualization and empty state for < 3 months
- ✅ Normalize bar heights with min/avg/high indicators and color-coding
- ✅ Redesign Recent Months list for consistent spacing and centered layout
- ✅ Clarify Financial Health Score display when unavailable (show N/A with guidance)

---

## 📋 PHASE 5: ADD EXPENSES PAGE ✅ **COMPLETE**

### 5.1 Backend - Expense Management
- ✅ **5.1.1** Create MonthlyExpenses model
  - ✅ Define schema with all 24 fields from Dataset 2:
    - month_year (date)
    - housing_utilities, groceries, restaurants_cafes
    - transportation_fuel, public_transport
    - healthcare_pharmacy, education_tuition, childcare
    - clothing_personal_care, entertainment_hobbies
    - subscriptions, other_shopping
    - gifts_charity, miscellaneous
    - (Calculated fields):
    - total_expenses, total_essential_spending
    - total_discretionary_spending
    - essential_spending_ratio, discretionary_spending_ratio
    - savings_this_month, spending_vs_last_month_percentage
    - highest_spending_category, meets_50_30_20_rule
  - ✅ Set up relationships (foreign key to User)
  
- ✅ **5.1.2** Build Create Expenses API endpoint
  - ✅ Create POST `/api/expenses` route (protected)
  - ✅ Implement controller:
    - Validate all expense inputs
    - Calculate total_expenses
    - Calculate essential vs discretionary totals
    - Calculate ratios and percentages
    - Determine highest spending category
    - Check 50/30/20 rule compliance
    - Calculate savings (income - expenses)
    - Create expense record
    - Return success and calculated data
  - ✅ Test with Postman
  
- ✅ **5.1.3** Build Get All Expenses API endpoint
  - ✅ Create GET `/api/expenses` route (protected)
  - ✅ Return all expense records for user
  - ✅ Order by month_year descending
  
- ✅ **5.1.4** Build Get Single Month Expenses endpoint
  - ✅ Create GET `/api/expenses/:month_year` route
  - ✅ Return expenses for specific month
  
- ✅ **5.1.5** Build Update Expenses API endpoint
  - ✅ Create PUT `/api/expenses/:id` route (protected)
  - ✅ Update existing expense record
  - ✅ Recalculate all derived fields
  
- ✅ **5.1.6** Build Delete Expenses endpoint
  - ✅ Create DELETE `/api/expenses/:id` route (protected)
  - ✅ Delete expense record

### 5.2 Frontend - Add Expenses Page
**📝 Note**: UI redesigned to match Profile Setup page style. See `PHASE_4_5_TEST_PLAN.md` and `QUICK_TEST_GUIDE.md` for testing.

- ✅ **5.2.1** Design Add Expenses page layout
  - ✅ Create page header with month/year selector
  - ✅ Organize form into logical sections
  - ✅ Add clear visual grouping
  
- ✅ **5.2.2** Build Expense Form - Housing & Utilities Section
  - ✅ Housing/Utilities (rent + utilities combined) - currency input
  - ✅ Clear label and validation
  
- ✅ **5.2.3** Build Expense Form - Food Section
  - ✅ Groceries - currency input
  - ✅ Restaurants & Cafes - currency input
  - ✅ Group visually
  
- ✅ **5.2.4** Build Expense Form - Transportation Section
  - ✅ Transportation/Fuel - currency input
  - ✅ Public Transport - currency input
  - ✅ Group visually
  
- ✅ **5.2.5** Build Expense Form - Healthcare Section
  - ✅ Healthcare/Pharmacy - currency input
  
- ✅ **5.2.6** Build Expense Form - Family & Education Section
  - ✅ Education/Tuition - currency input
  - ✅ Childcare - currency input
  - ✅ Group visually
  
- ✅ **5.2.7** Build Expense Form - Lifestyle Section
  - ✅ Clothing & Personal Care - currency input
  - ✅ Entertainment & Hobbies - currency input
  - ✅ Subscriptions - currency input
  - ✅ Group visually
  
- ✅ **5.2.8** Build Expense Form - Other Section
  - ✅ Other Shopping - currency input
  - ✅ Gifts & Charity - currency input
  - ✅ Miscellaneous - currency input
  - ✅ Group visually
  
- ✅ **5.2.9** Add month/year selector
  - ✅ Date picker or month selector
  - ✅ Default to current month
  - ✅ If month already has data, load existing values and allow updating
  
- ✅ **5.2.10** Implement form submission
  - ✅ Collect all expense data
  - ✅ Validate inputs (no negatives, reasonable values)
  - ✅ Send to backend API
  - ✅ Display calculated totals before submission (optional)
  - ✅ Handle success (show success message, redirect or reset)
  - ✅ Handle errors
  - ✅ Add loading states
  
- ✅ **5.2.11** Add real-time total calculation
  - ✅ Calculate total as user types
  - ✅ Display running total at bottom
  - ✅ Show essential vs discretionary split
  
- ✅ **5.2.12** Style and polish Add Expenses page
  - ✅ Consistent Tailwind styling
  - ✅ Mobile-responsive design
  - ✅ Add helpful tooltips/hints
  - ✅ Add "Save" and "Cancel" buttons

- ✅ **5.2.13** Load existing month values on month change
  - ✅ Populate all fields from existing record when present
  - ✅ Show status that existing month is loaded

- ✅ **5.2.14** Support updating existing expense record
  - ✅ Switch to PUT when record exists instead of blocking create
  - ✅ Maintain success and error messaging

---

## 📋 PHASE 6: MONTHLY REPORT PAGE

### 6.1 Backend - Report Generation
- ✅ **6.1.1** Build Monthly Report API endpoint
  - ✅ Create GET `/api/reports/monthly/:month_year` route (protected)
  - ✅ Aggregate data from all three datasets:
    - ✅ User profile data
    - ✅ Expense data for specified month
    - ✅ Financial health assessment (if available)
  - ✅ Calculate all key metrics:
    - ✅ Income vs Expenses comparison
    - ✅ Savings amount and rate
    - ✅ Spending by category (percentages)
    - ✅ Essential vs Discretionary ratio
    - ✅ Debt ratios
    - ✅ Housing cost ratio
    - ✅ 50/30/20 rule compliance
  - ✅ Return comprehensive report object
  - ✅ Test endpoint
  
- ✅ **6.1.2** Build Financial Health Assessment calculator
  - ✅ Create utility function to calculate financial health score
  - ✅ Implement logic for all Dataset 3 metrics:
    - ✅ financial_stress_level
    - ✅ financial_health_score
    - ✅ optimization_priority
    - ✅ Various flags (needs_emergency_fund, overspending_*, etc.)
    - ✅ overall_financial_health
    - ✅ top_3_problem_areas
  - ✅ Store or return calculated assessment
  
- ✅ **6.1.3** Build Report History endpoint
  - ✅ Create GET `/api/reports/history` route
  - ✅ Return list of all available months
  - ✅ Include summary stats for each month

### 6.2 Frontend - Monthly Report Page Structure
 - ✅ **6.2.1** Create Monthly Report page component
  - ✅ Set up page layout
  - ✅ Add month selector/navigation
  - ✅ Add loading states
  - ✅ Handle no-data scenarios
  
 - ✅ **6.2.2** Build Report Header section
  - ✅ Display selected month/year
  - ✅ Add navigation to previous/next month
  - ✅ Show overall financial health score prominently
  - ✅ Add color-coded health indicator

### 6.3 Frontend - Income vs Expenses Section
 - ✅ **6.3.1** Create Income Overview component
  - ✅ Display total monthly income
  - [ ] Show income sources if available
  
 - ✅ **6.3.2** Create Expenses Overview component
  - ✅ Display total monthly expenses
  - ✅ Show essential vs discretionary breakdown
  
 - ✅ **6.3.3** Create Income vs Expenses comparison chart
  - ✅ Use bar chart or comparison visualization
  - ✅ Highlight surplus or deficit
  - ✅ Show percentage comparison

### 6.4 Frontend - Spending Breakdown Section
 - ✅ **6.4.1** Create Category Spending component
  - ✅ List all expense categories with amounts
  - ✅ Show percentages of total
  - ✅ Highlight highest spending category
  
 - ✅ **6.4.2** Create Spending Pie Chart
  - ✅ Use Recharts or Chart.js
  - ✅ Show all categories visually
  - ✅ Make interactive (hover for details)
  - ✅ Use distinct colors for each category
  
 - ✅ **6.4.3** Create Essential vs Discretionary chart
  - ✅ Show ratio visually
  - ✅ Compare to 50/30/20 rule
  - ✅ Indicate if user meets guidelines

### 6.5 Frontend - Financial Health Metrics Section
 - ✅ **6.5.1** Create Savings Rate component
  - ✅ Display savings percentage
  - ✅ Show actual savings amount
  - ✅ Add visual progress indicator
  
 - ✅ **6.5.2** Create Debt Metrics component
  - ✅ Show debt-to-income ratio
  - ✅ Display total debt
  - ✅ Show monthly debt payments
  - ✅ Indicate if debt burden is high
  
 - ✅ **6.5.3** Create Housing Cost component
  - ✅ Show housing cost ratio
  - ✅ Compare to recommended 30% threshold
  - ✅ Visual indicator
  
 - ✅ **6.5.4** Create Emergency Fund indicator
  - ✅ Show months of expenses covered
  - ✅ Indicate if adequate (3-6 months)

### 6.6 Frontend - Insights & Recommendations Section
- ✅ **6.6.1** Create Optimization Priority component
  - ✅ Display priority level (critical/high/medium/low/none)
  - ✅ Color-coded urgency indicator
  
- ✅ **6.6.2** Create Problem Areas component
  - ✅ List top 3 problem areas
  - ✅ Show actionable flags:
    - ✅ Needs emergency fund
    - ✅ Overspending in categories
    - ✅ High debt burden
    - ✅ Insufficient savings
    - ✅ Housing cost too high
  
- ✅ **6.6.3** Create Recommendations list
  - ✅ Generate or display recommendations based on health assessment
  - ✅ Prioritize by urgency
  - ✅ Make actionable and specific

### 6.7 Frontend - Historical Trends Section 
- ✅ **6.7.1** Create Spending Trend chart
  - ✅ Line chart showing expenses over time
  - ✅ Compare to income trend

- ✅ **6.7.2** Create Savings Trend chart
  - ✅ Show savings over multiple months
  - ✅ Track progress toward goals

### 6.8 Frontend - Report Actions
 - ✅ **6.8.1** Add month selector
  - ✅ Dropdown or date picker
  - ✅ Previous/Next month buttons
  - ✅ Fetch new data on selection
  
 - [ ] **6.8.2** Add Export functionality (optional)
  - [ ] Export report as PDF
  - [ ] Export data as CSV
  
 - ✅ **6.8.3** Style and polish Monthly Report page
  - ✅ Consistent design with dashboard
  - ✅ Mobile-responsive layout
  - ✅ Smooth transitions between months
  - [ ] Print-friendly styling (optional)

---

## 📋 PHASE 7: EDIT PROFILE / ACCOUNT MANAGEMENT ✅ **COMPLETE**

### 7.1 Backend - Update Profile & Account
- ✅ **7.1.1** Build Update Account Info endpoint
  - ✅ Create PUT `/api/auth/update-account` route (protected)
  - ✅ Allow updating email
  - ✅ Handle email uniqueness validation
  - ✅ Return updated user data
  
- ✅ **7.1.2** Build Change Password endpoint
  - ✅ Create PUT `/api/auth/change-password` route (protected)
  - ✅ Verify current password
  - ✅ Validate new password strength
  - ✅ Hash and update password
  - ✅ Return success message
  
- ✅ **7.1.3** Ensure Update Profile endpoint exists
  - ✅ Reuse or verify PUT `/api/profile` route from Phase 3
  - ✅ Allow updating any profile field

### 7.2 Frontend - Edit Account & Navigation ✅
- ✅ **7.2.1** Create user dropdown menu in navigation bar
  - ✅ Add avatar button with user initials/icon
  - ✅ Create dropdown with user info display
  - ✅ Add "Account settings" menu item
  - ✅ Add "Log out" menu item
  - ✅ Implement click-outside detection
  - ✅ Add smooth animations
  
- ✅ **7.2.2** Create Edit Account page component (`/edit-account`)
  - ✅ Set up page layout with gradient background
  - ✅ Add navigation back to dashboard
  - ✅ Add loading and error states
  - ✅ Professional card-based design
  
- ✅ **7.2.3** Build Personal Information section
  - ✅ Display full name (read-only with info tooltip)
  - ✅ Email update form with validation
  - ✅ Update button with professional animations
  - ✅ Show account creation date
  
- ✅ **7.2.4** Build Password & Security section
  - ✅ "Change Password" button (collapsible)
  - ✅ Current password field
  - ✅ New password field with validation (min 8 chars)
  - ✅ Confirm new password field
  - ✅ Submit button with loading state
  - ✅ Cancel button
  - ✅ Client-side validation
  
- ✅ **7.2.5** Implement UI interactions
  - ✅ Success/error message display with icons
  - ✅ Form submission with loading states
  - ✅ Validation feedback
  - ✅ Smooth form expansion/collapse
  
- ✅ **7.2.6** Style and polish Edit Account page
  - ✅ Modern card-based layout
  - ✅ Icon-based section headers
  - ✅ Professional button animations (pill-shaped, uppercase)
  - ✅ Consistent with Edit Profile styling
  - ✅ Mobile-responsive design
  - ✅ Dark mode support
  - ✅ Professional hover states and transitions

**Note:** Frontend UI is complete. Backend API endpoints (7.1.1, 7.1.2) need implementation to enable actual email updates and password changes.

---

## 📋 PHASE 8: TESTING & BUG FIXES

### 8.1 Backend Testing
> ✅ Covered via `npm run test:phase8` (backend/tests/phase8-api.test.js) on November 24, 2025 — automated suite exercises auth, profile, expenses, dashboard, reports, and auth middleware flows end-to-end.

- ✅ **8.1.1** Test all API endpoints (automated suite in place of Postman)
  - ✅ Auth endpoints (signup, login)
  - ✅ Profile endpoints (create, get, update)
  - ✅ Expense endpoints (create, get, update, delete)
  - ✅ Dashboard endpoint
  - ✅ Report endpoints
  
- ✅ **8.1.2** Test authentication middleware
  - ✅ Valid token access
  - ✅ Invalid/expired token rejection
  - ✅ Missing token handling
  
- ✅ **8.1.3** Test data validation
  - ✅ Invalid inputs are rejected
  - ✅ Required fields are enforced
  - ✅ Data types are validated
  
- ✅ **8.1.4** Test error handling
  - ✅ All errors return appropriate status codes
  - ✅ Error messages are clear and helpful
  - ✅ No sensitive data in error responses

### 8.2 Frontend Testing ✅
> Automated + manual coverage logged in `frontend/tests/phase8-frontend-tests.md` (updated Nov 24, 2025).

- ✅ **8.2.1** Test user flows
  - ✅ Complete signup → login → profile setup → dashboard flow (manual E2E run)
  - ✅ Add expenses → view report flow (manual verification with multiple months)
  - ✅ Edit profile + edit account flows exercised, including logout/login with new credentials

- ✅ **8.2.2** Test form validations
  - ✅ Login validations (Vitest)
  - ✅ Profile + expenses + account forms verified manually; negative/invalid inputs blocked with clear errors

- ✅ **8.2.3** Test navigation
  - ✅ Header desktop/mobile nav & dropdown (Vitest + manual back/forward confirmation)
  - ✅ Protected routes redirect unauthenticated users (manual + unit coverage)

- ✅ **8.2.4** Test responsive design
  - ✅ Visual QA at 375px, 768px, 1440px using dev tools; navigation usable at all breakpoints and charts remain legible

### 8.3 Integration Testing
- ✅ **8.3.1** Test frontend-backend communication
  - ✅ 2025-11-24: `npm run test:phase8` (backend/tests/phase8-api.test.js) exercises signup/login → profile → expenses → dashboard → reports → account flows end-to-end; all 34 checks passed after clearing an orphan Node server on port 5000.
  - ✅ Loading states display properly (manual verification while running monthly report + dashboard flows during bug fix).
  - ✅ Error handling works (automated suite asserts 4xx paths for invalid inputs/token failures).
  - ✅ Data updates reflect immediately (tests confirmed profile + expenses + account mutations available to subsequent calls).
  
- ✅ **8.3.2** Test database operations
  - ✅ Data persists correctly (Prisma-backed tests create/update/delete expenses and profile records with assertions).
  - ✅ Updates don't corrupt data (expense recalculation + account change password/email scenarios verified in suite).
  - ✅ Relationships work correctly (report and dashboard endpoints aggregate across user/profile/expenses).
  - ✅ Queries return expected results (history/monthly report assertions cover trend stats + 50/30/20 flags).

### 8.4 Bug Fixes & Polish
- ✅ **8.4.1** Fix any discovered bugs
  - ✅ Document bugs found
  - ✅ Prioritize by severity
  - ✅ Fix critical bugs first
  - ✅ 2025-11-24: Prevented Monthly Report from flashing the Add Expenses empty state while history data is still loading (tracked dedicated loader state and gated CTA)
  - ✅ 2025-11-24: Cleared orphan Node server on port 5000 so automated suites can boot their own instance without EADDRINUSE collisions.
  
- ✅ **8.4.2** Code cleanup
  - ✅ Audited frontend/backend for stray `console.log` calls (none remaining outside intentional CLI/test helpers); warnings/errors retained for observability.
  - ✅ Searched reports/auth components for unused imports or commented-out blocks (none detected after VS Code diagnostics pass).
  - ✅ Ensured shared files follow Prettier/Tailwind conventions (format-on-save pass produced no diffs).
  
- ✅ **8.4.3** Performance optimization
  - ✅ Monthly Report now minimizes redundant API calls by memoizing history selection and reusing fetched data.
  - ✅ Added/extended loading skeleton coverage for history + report payloads to avoid layout thrash.
  - ✅ Charts and assets already lazy-loaded through Vite; no further image optimizations required for this phase.
  - ✅ Database aggregation verified via Phase 8 suite; no regressions detected, so current Prisma queries deemed sufficient for launch scope.

---

## 📋 PHASE 9: DOCUMENTATION & DEPLOYMENT PREP

### 9.1 Documentation
- ✅ **9.1.1** Document backend API
  - ✅ `docs/backend-api.md` captures every `/api` endpoint (auth, profile, expenses, dashboard, reports) with methods, bodies, and response highlights plus a sample payload.
  - ✅ Includes validation/error behaviors so QA and integrators can reason about status codes.
  
- ✅ **9.1.2** Document database schema
  - ✅ `docs/database-schema.md` summarizes the Prisma schema, relationships, and key fields for `users`, `user_profiles`, `monthly_expenses`, and `financial_health`.
  - ✅ Added ASCII ER diagram + migration notes for future schema work.
  
- ✅ **9.1.3** Create setup instructions
  - ✅ `docs/setup-guide.md` outlines prerequisites, install steps, environment variables, database migrations, run commands, test steps, and troubleshooting tips.
  - ✅ Environment variable guide links both backend and frontend templates.
  
- ✅ **9.1.4** Create user guide (optional)
  - ✅ `docs/user-guide.md` explains the full user journey (auth, profile setup, dashboard, add expenses, monthly report, account settings, tips).
  - ✅ Provides a recommended monthly workflow instead of a formal FAQ.

- ✅ **9.1.5** Create `project structure.md` (project map & process flow doc)
  - ✅ Document key folders/files for backend, frontend, datasets
  - ✅ Describe high-level user and data flow
  - ✅ Keep this file updated when major features are added or changed

### 9.2 Environment Configuration
- ✅ **9.2.1** Create `.env.example` files
  - ✅ Backend template already existed; verified fields and referenced it in the setup guide.
  - ✅ Confirmed frontend `.env.example` with `VITE_API_URL` and instructions.
  - ✅ Setup guide now points to both templates so new devs know what to copy.
  
- ✅ **9.2.2** Update `.gitignore`
  - ✅ Added root patterns for `.env`, `.env.*`, and recursive matches while keeping `.env.example` tracked.
  - ✅ Existing ignores for `node_modules`, build artifacts, and db files remain intact.

### 9.3 Deployment Preparation (for future)
- ✅ **9.3.1** Prepare backend for deployment
  - ✅ `docs/deployment-prep.md` spells out environment secrets, Prisma migrate deploy flow, cors configuration, logging, and health checks.
  - ✅ Checklist covers DB provisioning and post-deploy smoke tests.
  
- ✅ **9.3.2** Prepare frontend for deployment
  - ✅ Same doc captures Vite build command, env injection, rewrite requirements, and HTTPS considerations.
  - ✅ Dist build already optimized via Vite; guidance documents how to publish to Netlify/Vercel and keep API URLs in sync.
  
- ✅ **9.3.3** Choose deployment platforms
  - ✅ Document lists recommended hosts (Render/Heroku, Supabase/Neon, Vercel/Netlify) so the team has vetted options ready.
  - ✅ Includes monitoring suggestions for uptime and log alerts.

---

## 📋 PHASE 10: ENHANCEMENTS & FUTURE FEATURES (Optional)

### 10.1 Additional Features
- [ ] **10.1.1** Add password reset functionality
  - [ ] Forgot password flow
  - [ ] Email verification
  - [ ] Reset token generation
  
- [ ] **10.1.2** Add email notifications
  - [ ] Monthly report reminders
  - [ ] Goal achievement notifications
  - [ ] Financial health alerts
  
- [ ] **10.1.3** Add goal tracking
  - [ ] Set specific financial goals
  - [ ] Track progress
  - [ ] Celebrate milestones
  
- [ ] **10.1.4** Add budget planning
  - [ ] Set budgets per category
  - [ ] Track against budgets
  - [ ] Alert when over budget
  
- [ ] **10.1.5** Add data export
  - [ ] Export all data as CSV
  - [ ] Export reports as PDF
  - [ ] Data backup functionality

### 10.2 ML Model Integration (for ML team)
- [ ] **10.2.1** Create ML model endpoints
  - [ ] Expense prediction endpoint
  - [ ] Savings forecast endpoint
  - [ ] Recommendation generation endpoint
  
- [ ] **10.2.2** Integrate predictions in frontend
  - [ ] Show next month predictions on dashboard
  - [ ] Display confidence intervals
  - [ ] Explain predictions
  
- [ ] **10.2.3** Add explainable AI features
  - [ ] Show which factors influence predictions
  - [ ] Provide actionable insights
  - [ ] Visualize model outputs

---

## 📝 Notes & Guidelines

### Development Best Practices
- Always test features in isolation before integrating
- Commit code regularly with clear, descriptive messages
- Keep frontend and backend in sync during development
- Document any deviations from the plan
- Ask for clarification when requirements are unclear

### Priority Guidelines
- Complete tasks in order within each phase
- Don't skip database setup - it's foundational
- Authentication must be solid before building other features
- Test thoroughly before moving to the next phase
- Mobile responsiveness should be considered from the start

### Team Coordination
- Update this file as tasks are completed
- Add notes about any issues or blockers
- Document any new tasks that emerge
- Share progress regularly
- Backend and ML teams should coordinate on data formats

---

**Last Updated:** November 24, 2025  
**Next Review:** After Phase 8 completion
