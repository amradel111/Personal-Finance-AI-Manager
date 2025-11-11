const prisma = require('../config/database');
const {
  CATEGORY_FIELDS,
  parseMonthYear,
  normalizeCategoryAmounts,
  computeTotals,
  evaluateRule503020,
} = require('../utils/expenses');

const SNAKE_TO_CAMEL = {
  housing_utilities: 'housingUtilities',
  groceries: 'groceries',
  restaurants_cafes: 'restaurantsCafes',
  transportation_fuel: 'transportationFuel',
  public_transport: 'publicTransport',
  healthcare_pharmacy: 'healthcarePharmacy',
  education_tuition: 'educationTuition',
  childcare: 'childcare',
  clothing_personal_care: 'clothingPersonalCare',
  entertainment_hobbies: 'entertainmentHobbies',
  subscriptions: 'subscriptions',
  other_shopping: 'otherShopping',
  gifts_charity: 'giftsCharity',
  miscellaneous: 'miscellaneous',
};

const buildAmountsFromBody = (body, fallback = {}) => {
  const amounts = {};
  for (const camel of CATEGORY_FIELDS) {
    const snake = Object.keys(SNAKE_TO_CAMEL).find((k) => SNAKE_TO_CAMEL[k] === camel);
    const v = body[camel] ?? body[snake] ?? fallback[camel] ?? 0;
    amounts[camel] = v;
  }
  return amounts;
};

const getIncome = async (userId) => {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { monthlyHouseholdIncome: true },
  });
  return profile?.monthlyHouseholdIncome ?? 0;
};

const prevMonth = (date) => {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = new Date(Date.UTC(y, m, 1));
  d.setUTCMonth(m - 1);
  return d;
};

const createExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const monthStr = req.body.monthYear || req.body.month_year;
    const monthYear = parseMonthYear(monthStr);
    if (!monthYear) return res.status(400).json({ error: 'Invalid monthYear. Use YYYY-MM.' });

    const existing = await prisma.monthlyExpense.findFirst({ where: { userId, monthYear } });
    if (existing) return res.status(409).json({ error: 'Expenses for this month already exist' });

    const amountsInput = buildAmountsFromBody(req.body || {});
    const norm = normalizeCategoryAmounts(amountsInput);
    if (norm.error) return res.status(400).json({ error: `Invalid amount for ${norm.error}` });

    const totals = computeTotals(norm.amounts);
    const income = await getIncome(userId);
    const savingsThisMonth = income > 0 ? income - totals.totalExpenses : 0;
    const meets50_30_20 = evaluateRule503020(income, totals.totalEssentialSpending, totals.totalDiscretionarySpending, savingsThisMonth);

    const lastMonth = prevMonth(monthYear);
    const prev = await prisma.monthlyExpense.findFirst({ where: { userId, monthYear: lastMonth } });
    const spendingVsLastMonthPercentage = prev && prev.totalExpenses > 0
      ? ((totals.totalExpenses - prev.totalExpenses) / prev.totalExpenses) * 100
      : null;

    const created = await prisma.monthlyExpense.create({
      data: {
        userId,
        monthYear,
        housingUtilities: norm.amounts.housingUtilities,
        groceries: norm.amounts.groceries,
        restaurantsCafes: norm.amounts.restaurantsCafes,
        transportationFuel: norm.amounts.transportationFuel,
        publicTransport: norm.amounts.publicTransport,
        healthcarePharmacy: norm.amounts.healthcarePharmacy,
        educationTuition: norm.amounts.educationTuition,
        childcare: norm.amounts.childcare,
        clothingPersonalCare: norm.amounts.clothingPersonalCare,
        entertainmentHobbies: norm.amounts.entertainmentHobbies,
        subscriptions: norm.amounts.subscriptions,
        otherShopping: norm.amounts.otherShopping,
        giftsCharity: norm.amounts.giftsCharity,
        miscellaneous: norm.amounts.miscellaneous,
        totalExpenses: totals.totalExpenses,
        totalEssentialSpending: totals.totalEssentialSpending,
        totalDiscretionarySpending: totals.totalDiscretionarySpending,
        essentialSpendingRatio: totals.essentialSpendingRatio,
        discretionarySpendingRatio: totals.discretionarySpendingRatio,
        savingsThisMonth,
        spendingVsLastMonthPercentage,
        highestSpendingCategory: totals.highestSpendingCategory,
        meets50_30_20Rule: meets50_30_20,
      },
    });

    return res.status(201).json({ expense: created });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenses = await prisma.monthlyExpense.findMany({
      where: { userId },
      orderBy: { monthYear: 'desc' },
    });
    return res.json({ expenses });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getExpensesByMonth = async (req, res) => {
  try {
    const userId = req.user.id;
    const monthStr = req.params.month_year;
    const monthYear = parseMonthYear(monthStr);
    if (!monthYear) return res.status(400).json({ error: 'Invalid monthYear. Use YYYY-MM.' });

    const expense = await prisma.monthlyExpense.findFirst({ where: { userId, monthYear } });
    if (!expense) return res.status(404).json({ error: 'Not found' });
    return res.json({ expense });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const updateExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const existing = await prisma.monthlyExpense.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) return res.status(404).json({ error: 'Not found' });

    const amountsInput = buildAmountsFromBody(req.body || {}, existing);
    const norm = normalizeCategoryAmounts(amountsInput);
    if (norm.error) return res.status(400).json({ error: `Invalid amount for ${norm.error}` });

    const totals = computeTotals(norm.amounts);
    const income = await getIncome(userId);
    const savingsThisMonth = income > 0 ? income - totals.totalExpenses : 0;
    const meets50_30_20 = evaluateRule503020(income, totals.totalEssentialSpending, totals.totalDiscretionarySpending, savingsThisMonth);

    const lastMonth = prevMonth(existing.monthYear);
    const prev = await prisma.monthlyExpense.findFirst({ where: { userId, monthYear: lastMonth } });
    const spendingVsLastMonthPercentage = prev && prev.totalExpenses > 0
      ? ((totals.totalExpenses - prev.totalExpenses) / prev.totalExpenses) * 100
      : null;

    const updated = await prisma.monthlyExpense.update({
      where: { id },
      data: {
        housingUtilities: norm.amounts.housingUtilities,
        groceries: norm.amounts.groceries,
        restaurantsCafes: norm.amounts.restaurantsCafes,
        transportationFuel: norm.amounts.transportationFuel,
        publicTransport: norm.amounts.publicTransport,
        healthcarePharmacy: norm.amounts.healthcarePharmacy,
        educationTuition: norm.amounts.educationTuition,
        childcare: norm.amounts.childcare,
        clothingPersonalCare: norm.amounts.clothingPersonalCare,
        entertainmentHobbies: norm.amounts.entertainmentHobbies,
        subscriptions: norm.amounts.subscriptions,
        otherShopping: norm.amounts.otherShopping,
        giftsCharity: norm.amounts.giftsCharity,
        miscellaneous: norm.amounts.miscellaneous,
        totalExpenses: totals.totalExpenses,
        totalEssentialSpending: totals.totalEssentialSpending,
        totalDiscretionarySpending: totals.totalDiscretionarySpending,
        essentialSpendingRatio: totals.essentialSpendingRatio,
        discretionarySpendingRatio: totals.discretionarySpendingRatio,
        savingsThisMonth,
        spendingVsLastMonthPercentage,
        highestSpendingCategory: totals.highestSpendingCategory,
        meets50_30_20Rule: meets50_30_20,
      },
    });

    return res.json({ expense: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const existing = await prisma.monthlyExpense.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) return res.status(404).json({ error: 'Not found' });
    await prisma.monthlyExpense.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createExpenses,
  getAllExpenses,
  getExpensesByMonth,
  updateExpenses,
  deleteExpenses,
};
