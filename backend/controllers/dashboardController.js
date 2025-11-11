const prisma = require('../config/database');

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

    // Fetch profile (income, health score, savings rate)
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        monthlyHouseholdIncome: true,
        financialHealthScore: true,
        savingsRatePercentage: true,
      },
    });

    const income = profile?.monthlyHouseholdIncome ?? 0;

    // Fetch latest monthly expense record
    const latestExpense = await prisma.monthlyExpense.findFirst({
      where: { userId },
      orderBy: { monthYear: 'desc' },
    });

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
