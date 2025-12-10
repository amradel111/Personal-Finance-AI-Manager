const prisma = require('../config/database');
const { computeGoalProgressForUser, getPrimaryGoal } = require('../utils/goals');
const mlService = require('../utils/mlService');

const SAVINGS_BENCHMARK_RATE = 0.2; // 20% savings benchmark

const CATEGORY_DEFINITIONS = [
  { key: 'housing_utilities', field: 'housingUtilities', label: 'Housing & Utilities' },
  { key: 'groceries', field: 'groceries', label: 'Groceries' },
  { key: 'restaurants_cafes', field: 'restaurantsCafes', label: 'Restaurants & Cafés' },
  { key: 'transportation_fuel', field: 'transportationFuel', label: 'Transportation & Fuel' },
  { key: 'public_transport', field: 'publicTransport', label: 'Public Transport' },
  { key: 'healthcare_pharmacy', field: 'healthcarePharmacy', label: 'Healthcare & Pharmacy' },
  { key: 'education_tuition', field: 'educationTuition', label: 'Education & Tuition' },
  { key: 'childcare', field: 'childcare', label: 'Childcare' },
  { key: 'clothing_personal_care', field: 'clothingPersonalCare', label: 'Clothing & Personal Care' },
  { key: 'entertainment_hobbies', field: 'entertainmentHobbies', label: 'Entertainment & Hobbies' },
  { key: 'subscriptions', field: 'subscriptions', label: 'Subscriptions' },
  { key: 'other_shopping', field: 'otherShopping', label: 'Other Shopping' },
  { key: 'gifts_charity', field: 'giftsCharity', label: 'Gifts & Charity' },
  { key: 'miscellaneous', field: 'miscellaneous', label: 'Miscellaneous' },
];

const buildCategorySummaries = (expense) => CATEGORY_DEFINITIONS.map(({ key, field, label }) => ({
  key,
  label,
  amount: expense?.[field] ?? 0,
}));

const sortTopCategories = (expense) => buildCategorySummaries(expense)
  .sort((a, b) => b.amount - a.amount)
  .filter((item) => item.amount > 0)
  .slice(0, 3);

/**
 * GET /api/dashboard/summary
 * Returns aggregated dashboard metrics for the authenticated user
 */
const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch profile (income, health score, savings rate) and goals
    const [profile, expensesDesc, userGoals] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { userId },
        select: {
          monthlyHouseholdIncome: true,
          financialHealthScore: true,
          savingsRatePercentage: true,
          savingsGoalMonthly: true,
        },
      }),
      prisma.monthlyExpense.findMany({
        where: { userId },
        orderBy: { monthYear: 'desc' },
      }),
      prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    ]);

    const income = profile?.monthlyHouseholdIncome ?? 0;
    const latestExpense = expensesDesc[0] ?? null;
    const expensesAsc = [...expensesDesc].reverse();

    const goalsWithProgress = computeGoalProgressForUser(userGoals, expensesAsc);
    const primaryGoal = getPrimaryGoal(goalsWithProgress);
    const activeGoals = goalsWithProgress.filter((goal) => goal.status === 'active');

    const goalInsights = {
      hasGoals: goalsWithProgress.length > 0,
      totalGoals: goalsWithProgress.length,
      activeGoals: activeGoals.length,
      primaryGoal: primaryGoal
        ? {
          id: primaryGoal.id,
          name: primaryGoal.name,
          type: primaryGoal.type,
          status: primaryGoal.status,
          targetAmount: primaryGoal.targetAmount,
          monthlyTargetAmount: primaryGoal.monthlyTargetAmount,
          startMonthYear: primaryGoal.startMonthYear,
          targetMonthYear: primaryGoal.targetMonthYear,
          progress: primaryGoal.progress,
        }
        : null,
      goals: activeGoals.map(g => ({
        id: g.id,
        name: g.name,
        type: g.type,
        status: g.status,
        targetAmount: g.targetAmount,
        monthlyTargetAmount: g.monthlyTargetAmount,
        startMonthYear: g.startMonthYear,
        targetMonthYear: g.targetMonthYear,
        progress: g.progress,
      })),
    };

    // If no expenses yet, return placeholders with whatever we can from profile
    if (!latestExpense) {
      return res.json({
        summary: {
          hasExpensesData: false,
          monthYear: null,
          totalIncome: income,
          totalExpenses: null,
          totalSavings: null,
          savingsRate: profile?.savingsRatePercentage ?? null,
          financialHealthScore: profile?.financialHealthScore ?? null,
          topSpendingCategories: [],
          meets_50_30_20_rule: null,
          benchmarkSavingsRateGoal: SAVINGS_BENCHMARK_RATE,
          userSavingsGoalMonthly: profile?.savingsGoalMonthly ?? null,
          benchmarkMet: profile?.savingsRatePercentage != null
            ? profile.savingsRatePercentage >= SAVINGS_BENCHMARK_RATE
            : null,
          goalInsights,
          message: 'No expense data found. Add expenses to unlock insights.'
        }
      });
    }

    // Compute savings and savings rate based on latest month
    const totalExpenses = latestExpense.totalExpenses ?? 0;
    const computedSavings = income > 0 ? (income - totalExpenses) : 0;
    const savingsThisMonth = latestExpense.savingsThisMonth ?? computedSavings;
    const savingsRate = income > 0 ? (savingsThisMonth / income) : 0;

    const topSpendingCategories = sortTopCategories(latestExpense);

    // Fetch AI insights (non-blocking)
    let aiInsights = null;
    try {
      const historicalExpenses = expensesAsc.map(e => e.totalExpenses).filter(e => e != null);
      aiInsights = await mlService.getInsights({
        income,
        expenses: totalExpenses,
        savings: savingsThisMonth,
        total_debt: profile?.totalDebt ?? 0,
        historical_expenses: historicalExpenses,
      });
    } catch (aiError) {
      console.warn('AI insights unavailable:', aiError.message);
    }

    return res.json({
      summary: {
        hasExpensesData: true,
        monthYear: latestExpense.monthYear,
        totalIncome: income,
        totalExpenses,
        totalSavings: savingsThisMonth,
        savingsRate,
        financialHealthScore: profile?.financialHealthScore ?? null,
        topSpendingCategories,
        meets_50_30_20_rule: latestExpense.meets50_30_20Rule ?? null,
        benchmarkSavingsRateGoal: SAVINGS_BENCHMARK_RATE,
        userSavingsGoalMonthly: profile?.savingsGoalMonthly ?? null,
        benchmarkMet: Number.isFinite(savingsRate)
          ? savingsRate >= SAVINGS_BENCHMARK_RATE
          : null,
        goalInsights,
        aiInsights,
      }
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/dashboard/recent
 * Returns last 5-10 expense entries sorted by latest first
 */
const getRecentExpenses = async (req, res) => {
  try {
    const userId = req.user.id;

    const expenses = await prisma.monthlyExpense.findMany({
      where: { userId },
      orderBy: { monthYear: 'desc' },
      take: 10,
    });

    if (!expenses.length) {
      return res.json({
        hasExpensesData: false,
        expenses: [],
        message: 'No expense history found. Add your first expense entry to get started.',
      });
    }

    const payload = expenses.map((expense) => ({
      id: expense.id,
      monthYear: expense.monthYear,
      totalExpenses: expense.totalExpenses,
      savingsThisMonth: expense.savingsThisMonth,
      meets_50_30_20_rule: expense.meets50_30_20Rule,
      topCategories: sortTopCategories(expense),
    }));

    return res.json({
      hasExpensesData: true,
      expenses: payload,
    });
  } catch (error) {
    console.error('Dashboard recent expenses error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getDashboardSummary,
  getRecentExpenses,
};
