# Database Documentation

## Overview
This project uses **PostgreSQL** as the main database, managed through **Prisma ORM**.

## Database Location
- **Database Name:** `finance_manager`
- **Host:** localhost
- **Port:** 5432
- **Schema Location:** `backend/prisma/schema.prisma`
- **Migrations:** `backend/prisma/migrations/`

## Database Schema

### Tables

#### 1. `users` - User Authentication
Stores user account information and credentials.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | String | Unique email address |
| password | String | Hashed password (bcrypt) |
| first_name | String | User's first name |
| last_name | String | User's last name |
| created_at | DateTime | Account creation timestamp |
| updated_at | DateTime | Last update timestamp |
| last_login | DateTime? | Last login timestamp (optional) |

**Relationships:**
- One-to-One with `user_profiles`
- One-to-Many with `monthly_expenses`
- One-to-Many with `financial_health`

---

#### 2. `user_profiles` - User Profile Data (Dataset 1)
Stores detailed user profile information for personalization.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users (unique) |
| household_size | Int | Number of people in household |
| num_adults | Int | Number of adults |
| num_children | Int | Number of children |
| location_type | String | urban/suburban/rural |
| life_stage | String | young_professional/young_family/etc. |
| employment_status | String | employed/self_employed/unemployed/retired/student |
| monthly_household_income | Float | Total monthly income |
| income_stability | String | stable/variable/seasonal |
| credit_score | Int | Credit score (300-850) |
| total_debt | Float | Total debt amount |
| monthly_debt_payments | Float | Monthly debt payment amount |
| rent_or_mortgage | Float | Monthly housing cost |
| savings_goal_monthly | Float | Monthly savings target |
| has_health_insurance | Boolean | Health insurance status |
| financial_goal_type | String | emergency_fund/home/retirement/education/other |
| emergency_fund_months | Float | Months of expenses saved |
| savings_rate_percentage | Float | Percentage of income saved |
| debt_to_income_ratio | Float | Debt to income ratio |
| housing_cost_ratio | Float | Housing cost to income ratio |
| monthly_savings_actual | Float | Actual monthly savings |
| financial_health_score | Float | Overall financial health score |
| optimization_priority | String | critical/high/medium/low/none |
| created_at | DateTime | Profile creation timestamp |
| updated_at | DateTime | Last update timestamp |

**Relationships:**
- Belongs to `users` (via user_id)

---

#### 3. `monthly_expenses` - Monthly Spending Data (Dataset 2)
Stores monthly expense breakdowns by category.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| month_year | DateTime | Month and year of expenses |
| housing_utilities | Float | Rent + utilities |
| groceries | Float | Grocery spending |
| restaurants_cafes | Float | Dining out |
| transportation_fuel | Float | Transportation and fuel |
| public_transport | Float | Public transit costs |
| healthcare_pharmacy | Float | Healthcare expenses |
| education_tuition | Float | Education costs |
| childcare | Float | Childcare expenses |
| clothing_personal_care | Float | Clothing and personal care |
| entertainment_hobbies | Float | Entertainment and hobbies |
| subscriptions | Float | Subscription services |
| other_shopping | Float | Other shopping |
| gifts_charity | Float | Gifts and charitable donations |
| miscellaneous | Float | Miscellaneous expenses |
| total_expenses | Float | Total of all expenses |
| total_essential_spending | Float | Sum of essential expenses |
| total_discretionary_spending | Float | Sum of discretionary expenses |
| essential_spending_ratio | Float | Essential / Total |
| discretionary_spending_ratio | Float | Discretionary / Total |
| savings_this_month | Float | Amount saved this month |
| spending_vs_last_month_percentage | Float | % change from last month |
| highest_spending_category | String | Category with highest spending |
| meets_50_30_20_rule | Boolean | Follows 50/30/20 budgeting rule |
| created_at | DateTime | Record creation timestamp |
| updated_at | DateTime | Last update timestamp |

**Relationships:**
- Belongs to `users` (via user_id)

---

#### 4. `financial_health` - Financial Health Assessment (Dataset 3)
Stores financial health assessment results.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| assessment_date | DateTime | Date of assessment |
| financial_stress_level | String | low/medium/high/critical |
| needs_emergency_fund | Boolean | Requires emergency fund |
| overspending_entertainment | Boolean | Overspending flag |
| overspending_food | Boolean | Overspending flag |
| overspending_shopping | Boolean | Overspending flag |
| high_debt_burden | Boolean | High debt flag |
| insufficient_savings | Boolean | Low savings flag |
| housing_cost_too_high | Boolean | Housing cost flag |
| debt_to_income_healthy | Boolean | Healthy debt ratio |
| savings_rate_adequate | Boolean | Adequate savings rate |
| emergency_fund_adequate | Boolean | Sufficient emergency fund |
| overall_financial_health | String | excellent/good/fair/poor/critical |
| top_3_problem_areas | String | Comma-separated problem areas |
| recommended_actions | String | JSON array of recommendations |
| financial_health_score | Float | Overall score (0-100) |
| optimization_priority | String | critical/high/medium/low/none |
| last_calculated | DateTime | Last calculation timestamp |
| created_at | DateTime | Record creation timestamp |
| updated_at | DateTime | Last update timestamp |

**Relationships:**
- Belongs to `users` (via user_id)

---

## Database Commands

### Setup & Migrations
```bash
# Generate Prisma Client
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### Development Tools
```bash
# Open Prisma Studio (GUI)
npx prisma studio

# Check database sync status
npx prisma db push

# Pull schema from existing database
npx prisma db pull
```

### Maintenance
```bash
# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

---

## Connection String
The database connection is configured via environment variable:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/finance_manager"
```

---

## ER Diagram

```
┌─────────────┐
│    users    │
│             │
│  id (PK)    │───┐
│  email      │   │
│  password   │   │
│  first_name │   │
│  last_name  │   │
└─────────────┘   │
                  │
      ┌───────────┼───────────┬───────────┐
      │           │           │           │
      ▼           ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  user_   │ │ monthly_ │ │ monthly_ │ │financial_│
│ profiles │ │ expenses │ │ expenses │ │  health  │
│          │ │          │ │          │ │          │
│user_id(FK)│user_id(FK)│user_id(FK)│user_id(FK)│
└──────────┘ └──────────┘ └──────────┘ └──────────┘
   1:1           1:N           1:N          1:N
```

---

## Data Mapping to Datasets

- **Dataset 1 (user_profile.csv)** → `user_profiles` table
- **Dataset 2 (monthly_spending.csv)** → `monthly_expenses` table  
- **Dataset 3 (financial_health_assessment.csv)** → `financial_health` table

All datasets are available in the `/datasets` folder at the project root.

---

**Last Updated:** November 9, 2025
