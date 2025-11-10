-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "household_size" INTEGER NOT NULL,
    "num_adults" INTEGER NOT NULL,
    "num_children" INTEGER NOT NULL,
    "location_type" TEXT NOT NULL,
    "life_stage" TEXT NOT NULL,
    "employment_status" TEXT NOT NULL,
    "monthly_household_income" DOUBLE PRECISION NOT NULL,
    "income_stability" TEXT NOT NULL,
    "credit_score" INTEGER NOT NULL,
    "total_debt" DOUBLE PRECISION NOT NULL,
    "monthly_debt_payments" DOUBLE PRECISION NOT NULL,
    "rent_or_mortgage" DOUBLE PRECISION NOT NULL,
    "savings_goal_monthly" DOUBLE PRECISION NOT NULL,
    "has_health_insurance" BOOLEAN NOT NULL,
    "financial_goal_type" TEXT NOT NULL,
    "emergency_fund_months" DOUBLE PRECISION NOT NULL,
    "savings_rate_percentage" DOUBLE PRECISION NOT NULL,
    "debt_to_income_ratio" DOUBLE PRECISION NOT NULL,
    "housing_cost_ratio" DOUBLE PRECISION NOT NULL,
    "monthly_savings_actual" DOUBLE PRECISION NOT NULL,
    "financial_health_score" INTEGER NOT NULL,
    "optimization_priority" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_expenses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "month_year" TIMESTAMP(3) NOT NULL,
    "housing_utilities" DOUBLE PRECISION NOT NULL,
    "groceries" DOUBLE PRECISION NOT NULL,
    "restaurants_cafes" DOUBLE PRECISION NOT NULL,
    "transportation_fuel" DOUBLE PRECISION NOT NULL,
    "public_transport" DOUBLE PRECISION NOT NULL,
    "healthcare_pharmacy" DOUBLE PRECISION NOT NULL,
    "education_tuition" DOUBLE PRECISION NOT NULL,
    "childcare" DOUBLE PRECISION NOT NULL,
    "clothing_personal_care" DOUBLE PRECISION NOT NULL,
    "entertainment_hobbies" DOUBLE PRECISION NOT NULL,
    "subscriptions" DOUBLE PRECISION NOT NULL,
    "other_shopping" DOUBLE PRECISION NOT NULL,
    "gifts_charity" DOUBLE PRECISION NOT NULL,
    "miscellaneous" DOUBLE PRECISION NOT NULL,
    "total_expenses" DOUBLE PRECISION NOT NULL,
    "total_essential_spending" DOUBLE PRECISION NOT NULL,
    "total_discretionary_spending" DOUBLE PRECISION NOT NULL,
    "essential_spending_ratio" DOUBLE PRECISION NOT NULL,
    "discretionary_spending_ratio" DOUBLE PRECISION NOT NULL,
    "savings_this_month" DOUBLE PRECISION NOT NULL,
    "spending_vs_last_month_percentage" DOUBLE PRECISION,
    "highest_spending_category" TEXT NOT NULL,
    "meets_50_30_20_rule" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_health" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "month_year" TIMESTAMP(3) NOT NULL,
    "financial_stress_level" INTEGER NOT NULL,
    "financial_health_score" INTEGER NOT NULL,
    "optimization_priority" TEXT NOT NULL,
    "needs_emergency_fund" BOOLEAN NOT NULL,
    "overspending_restaurants" BOOLEAN NOT NULL,
    "overspending_entertainment" BOOLEAN NOT NULL,
    "overspending_subscriptions" BOOLEAN NOT NULL,
    "high_debt_burden" BOOLEAN NOT NULL,
    "insufficient_savings" BOOLEAN NOT NULL,
    "housing_cost_too_high" BOOLEAN NOT NULL,
    "lifestyle_inflation_detected" BOOLEAN NOT NULL,
    "irregular_savings_pattern" BOOLEAN NOT NULL,
    "has_adequate_emergency_fund" BOOLEAN NOT NULL,
    "healthy_savings_rate" BOOLEAN NOT NULL,
    "controlled_discretionary_spending" BOOLEAN NOT NULL,
    "low_debt_burden" BOOLEAN NOT NULL,
    "overall_financial_health" TEXT NOT NULL,
    "needs_optimization" BOOLEAN NOT NULL,
    "optimization_urgency" INTEGER NOT NULL,
    "top_3_problem_areas" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_health_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_expenses_user_id_month_year_key" ON "monthly_expenses"("user_id", "month_year");

-- CreateIndex
CREATE UNIQUE INDEX "financial_health_user_id_month_year_key" ON "financial_health"("user_id", "month_year");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_expenses" ADD CONSTRAINT "monthly_expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_health" ADD CONSTRAINT "financial_health_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
