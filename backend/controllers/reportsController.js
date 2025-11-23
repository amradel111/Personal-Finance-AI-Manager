const prisma = require('../config/database');
const { parseMonthYear, CATEGORY_FIELDS } = require('../utils/expenses');
const { computeFinancialHealth } = require('../utils/health');

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

const buildCategoryBreakdown = (expense) => {
  if (!expense) return [];
  const total = expense.totalExpenses || 0;
  return CATEGORY_DEFINITIONS.map(({ key, field, label }) => {
    const amount = expense[field] || 0;
    const percent = total > 0 ? amount / total : 0;
    return { key, label, amount, percent };
  }).filter((c) => c.amount > 0);
};

const monthKey = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
};

const parseTop3ProblemAreas = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    // Handle both JSON strings and Python-style single-quoted lists
    const raw = value.trim();
    const tryParse = (s) => {
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        return null;
      }
    };

    // First, try as-is
    const direct = tryParse(raw);
    if (direct) return direct;

    // Fallback: replace single quotes with double quotes for simple list formats
    const normalized = raw
      .replace(/'/g, '"');
    const fallback = tryParse(normalized);
    if (fallback) return fallback;

    return [];
  }
  return [];
};

const normalizeHealthRecord = (record) => {
  if (!record) return null;
  return {
    source: 'dataset',
    financialStressLevel: record.financialStressLevel ?? null,
    financialHealthScore: record.financialHealthScore ?? null,
    optimizationPriority: record.optimizationPriority ?? null,
    needsEmergencyFund: record.needsEmergencyFund ?? null,
    overspendingRestaurants: record.overspendingRestaurants ?? null,
    overspendingEntertainment: record.overspendingEntertainment ?? null,
    overspendingSubscriptions: record.overspendingSubscriptions ?? null,
    highDebtBurden: record.highDebtBurden ?? null,
    insufficientSavings: record.insufficientSavings ?? null,
    housingCostTooHigh: record.housingCostTooHigh ?? null,
    lifestyleInflationDetected: record.lifestyleInflationDetected ?? null,
    irregularSavingsPattern: record.irregularSavingsPattern ?? null,
    hasAdequateEmergencyFund: record.hasAdequateEmergencyFund ?? null,
    healthySavingsRate: record.healthySavingsRate ?? null,
    controlledDiscretionarySpending: record.controlledDiscretionarySpending ?? null,
    lowDebtBurden: record.lowDebtBurden ?? null,
    overallFinancialHealth: record.overallFinancialHealth ?? null,
    needsOptimization: record.needsOptimization ?? null,
    optimizationUrgency: record.optimizationUrgency ?? null,
    top3ProblemAreas: parseTop3ProblemAreas(record.top3ProblemAreas),
  };
};

const mergeAssessment = (fallback, healthRecord) => {
  // If there is no dataset record, use the computed assessment directly
  if (!healthRecord) {
    return {
      ...fallback,
      source: 'computed',
    };
  }

  // Prefer computed values for live assessments, using the dataset record only to
  // fill in any gaps. Source is marked as computed for user-facing purposes.
  return {
    ...healthRecord,
    ...fallback,
    source: 'computed',
  };
};

const getMonthlyReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const monthStr = req.params.month_year;
    const monthYear = parseMonthYear(monthStr);
    if (!monthYear) return res.status(400).json({ error: 'Invalid month_year. Expected YYYY-MM.' });

    const [profile, expense, allExpensesDesc, healthRecordsDesc] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.monthlyExpense.findFirst({ where: { userId, monthYear } }),
      prisma.monthlyExpense.findMany({ where: { userId }, orderBy: { monthYear: 'desc' } }),
      prisma.financialHealth.findMany({ where: { userId }, orderBy: { monthYear: 'desc' } }),
    ]);

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found. Complete profile setup first.' });
    }

    if (!expense) {
      return res.status(200).json({
        hasData: false,
        report: {
          monthYear,
          message: 'No expense data for this month. Add expenses to generate a report.',
          income: profile.monthlyHouseholdIncome ?? 0,
        },
      });
    }

    const income = profile.monthlyHouseholdIncome ?? 0;
    const totalExpenses = expense.totalExpenses ?? 0;
    // savingsThisMonth is already true net savings from the expenses controller
    const rawSavings = Number.isFinite(expense.savingsThisMonth)
      ? expense.savingsThisMonth
      : (income > 0 ? income - totalExpenses : 0);
    const savingsAmount = rawSavings;
    const savingsRate = income > 0 ? (savingsAmount / income) : 0;

    const categoryBreakdown = buildCategoryBreakdown(expense)
      .sort((a, b) => b.amount - a.amount);

    const essentialVsDiscretionary = {
      essential: expense.totalEssentialSpending ?? 0,
      discretionary: expense.totalDiscretionarySpending ?? 0,
      essentialRatio: expense.essentialSpendingRatio ?? 0,
      discretionaryRatio: expense.discretionarySpendingRatio ?? 0,
    };

    const debt = {
      totalDebt: profile.totalDebt ?? 0,
      monthlyDebtPayments: profile.monthlyDebtPayments ?? 0,
      debtToIncomeRatio: profile.debtToIncomeRatio ?? 0,
    };

    // For zero or missing income, treat 50/30/20 as not applicable in the report
    const meets_50_30_20_rule = income > 0 ? (expense.meets50_30_20Rule ?? null) : null;
    const housingCostRatio = profile.housingCostRatio ?? 0;

    const healthRecordMap = new Map(healthRecordsDesc.map((record) => [monthKey(record.monthYear), record]));
    const datasetHealthRecord = normalizeHealthRecord(healthRecordMap.get(monthKey(expense.monthYear)));
    const assessment = mergeAssessment(computeFinancialHealth(profile, expense), datasetHealthRecord);

    const allExpensesAsc = [...allExpensesDesc].sort((a, b) => a.monthYear - b.monthYear);
    const selectedIndex = allExpensesAsc.findIndex((entry) => entry.id === expense.id);
    const previousExpense = selectedIndex > 0 ? allExpensesAsc[selectedIndex - 1] : null;

    const computeSavingsForExpense = (exp) => {
      if (!exp) return 0;
      if (Number.isFinite(exp.savingsThisMonth)) return exp.savingsThisMonth;
      const total = exp.totalExpenses ?? 0;
      if (income > 0) return income - total;
      return 0;
    };

    const trendWindow = allExpensesAsc.slice(-6);
    const trendMonths = trendWindow.map((exp) => {
      const expSavings = computeSavingsForExpense(exp);
      const expSavingsRate = income > 0
        ? (expSavings / income)
        : (expSavings / ((exp?.totalExpenses ?? 0) || 1));
      const normalizedHealthRecord = normalizeHealthRecord(healthRecordMap.get(monthKey(exp.monthYear)));
      const expAssessment = mergeAssessment(computeFinancialHealth(profile, exp), normalizedHealthRecord);

      // Per-category amounts for category timeline charts
      const categoryAmounts = CATEGORY_DEFINITIONS.reduce((acc, { key, field }) => {
        acc[key] = exp[field] ?? 0;
        return acc;
      }, {});

      return {
        monthYear: exp.monthYear,
        totalExpenses: exp.totalExpenses ?? 0,
        savingsAmount: expSavings,
        savingsRate: Number.isFinite(expSavingsRate) ? expSavingsRate : 0,
        essentialRatio: exp.essentialSpendingRatio ?? 0,
        discretionaryRatio: exp.discretionarySpendingRatio ?? 0,
        meets_50_30_20_rule: exp.meets50_30_20Rule ?? null,
        highestSpendingCategory: exp.highestSpendingCategory || null,
        spendingVsLastMonthPercentage: exp.spendingVsLastMonthPercentage ?? null,
        assessment: expAssessment,
        categories: categoryAmounts,
      };
    });

    const avg = (arr) => (arr.length ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0);
    const pickExtreme = (arr, comparator) => arr.reduce((acc, item) => {
      if (!item) return acc;
      if (!acc) return item;
      return comparator(item, acc) ? item : acc;
    }, null);

    const scoreValues = trendMonths.map((m) => m.assessment?.financialHealthScore ?? null).filter((v) => Number.isFinite(v));
    const stressValues = trendMonths.map((m) => m.assessment?.financialStressLevel ?? null).filter((v) => Number.isFinite(v));

    const flagFields = [
      'needsEmergencyFund',
      'insufficientSavings',
      'highDebtBurden',
      'housingCostTooHigh',
      'overspendingRestaurants',
      'overspendingEntertainment',
      'overspendingSubscriptions',
      'lifestyleInflationDetected',
    ];

    const flagCounts = flagFields.reduce((acc, field) => {
      acc[field] = trendMonths.filter((m) => m.assessment && m.assessment[field]).length;
      return acc;
    }, {});

    const healthDistribution = trendMonths.reduce((acc, m) => {
      const label = m.assessment?.overallFinancialHealth ?? 'unknown';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const trendStats = {
      avgMonthlyExpenses: avg(trendMonths.map((m) => m.totalExpenses)),
      avgSavingsRate: avg(trendMonths.map((m) => m.savingsRate)),
      totalSavings: trendMonths.reduce((sum, m) => sum + m.savingsAmount, 0),
      expenseTrend: trendMonths.length > 1 ? trendMonths[trendMonths.length - 1].totalExpenses - trendMonths[0].totalExpenses : 0,
      bestMonthBySavings: pickExtreme(trendMonths, (a, b) => a.savingsAmount > b.savingsAmount),
      highestFinancialHealthScore: scoreValues.length ? Math.max(...scoreValues) : null,
      lowestFinancialHealthScore: scoreValues.length ? Math.min(...scoreValues) : null,
      avgFinancialHealthScore: scoreValues.length ? avg(scoreValues) : null,
      avgFinancialStressLevel: stressValues.length ? avg(stressValues) : null,
      flagCounts,
      overallHealthDistribution: healthDistribution,
      mostChallengingMonth: pickExtreme(trendMonths, (a, b) => (a.assessment?.financialHealthScore ?? 100) < (b.assessment?.financialHealthScore ?? 100)),
    };

    const previousSavings = computeSavingsForExpense(previousExpense);
    const categoryChanges = CATEGORY_DEFINITIONS.map(({ key, field, label }) => {
      const current = expense[field] ?? 0;
      const prior = previousExpense ? (previousExpense[field] ?? 0) : 0;
      const change = current - prior;
      const percentChange = prior !== 0 ? change / prior : null;
      return { key, label, current, prior, change, percentChange };
    });

    const topIncreases = categoryChanges
      .filter((c) => c.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 3);

    const topDecreases = categoryChanges
      .filter((c) => c.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 3);

    const report = {
      monthYear: expense.monthYear,
      income,
      totalExpenses,
      savingsAmount,
      savingsRate,
      categoryBreakdown,
      essentialVsDiscretionary,
      debt,
      housingCostRatio,
      emergencyFundMonths: profile.emergencyFundMonths ?? 0,
      meets_50_30_20_rule,
      highestSpendingCategory: expense.highestSpendingCategory || null,
      financialHealthScore: assessment.financialHealthScore,
      optimizationPriority: assessment.optimizationPriority,
      profileSummary: {
        householdSize: profile.householdSize,
        numAdults: profile.numAdults,
        numChildren: profile.numChildren,
        locationType: profile.locationType,
        lifeStage: profile.lifeStage,
        employmentStatus: profile.employmentStatus,
        incomeStability: profile.incomeStability,
        financialGoalType: profile.financialGoalType,
        savingsGoalMonthly: profile.savingsGoalMonthly ?? 0,
        monthlySavingsActual: profile.monthlySavingsActual ?? 0,
        creditScore: profile.creditScore ?? null,
        hasHealthInsurance: profile.hasHealthInsurance ?? null,
        baselineFinancialHealthScore: profile.financialHealthScore ?? null,
        baselineOptimizationPriority: profile.optimizationPriority ?? null,
      },
      monthOverMonth: {
        expenseDelta: previousExpense ? totalExpenses - (previousExpense.totalExpenses ?? 0) : null,
        spendingVsLastMonthPercentage: expense.spendingVsLastMonthPercentage ?? null,
        savingsDelta: previousExpense ? savingsAmount - previousSavings : null,
        previousMonth: previousExpense ? previousExpense.monthYear : null,
      },
      trendAnalysis: {
        months: trendMonths,
        stats: trendStats,
      },
      categoryInsights: {
        topIncreases,
        topDecreases,
      },
      assessmentSource: assessment.source,
      datasetHealthRecord: datasetHealthRecord,
    };

    return res.json({ hasData: true, report, assessment });
  } catch (error) {
    console.error('Monthly report error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getReportHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenses = await prisma.monthlyExpense.findMany({
      where: { userId },
      orderBy: { monthYear: 'desc' },
    });

    const items = expenses.map((e) => ({
      id: e.id,
      monthYear: e.monthYear,
      totalExpenses: e.totalExpenses,
      savingsThisMonth: e.savingsThisMonth,
      meets_50_30_20_rule: e.meets50_30_20Rule,
      highestSpendingCategory: e.highestSpendingCategory,
    }));

    return res.json({ months: items });
  } catch (error) {
    console.error('Report history error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getMonthlyReport,
  getReportHistory,
};
