const { ESSENTIAL_FIELDS } = require('./expenses');

/**
 * Compute a financial health assessment for a given month
 * @param {object|null} profile Prisma UserProfile or null
 * @param {object|null} expense Prisma MonthlyExpense or null
 * @returns {object} assessment fields matching FinancialHealth model
 */
function computeFinancialHealth(profile, expense) {
  const income = profile?.monthlyHouseholdIncome ?? 0;
  const totalExpenses = expense?.totalExpenses ?? 0;
  const savingsAmount = Number.isFinite(expense?.savingsThisMonth)
    ? expense.savingsThisMonth
    : Math.max(0, income - totalExpenses);
  const savingsRate = income > 0 ? savingsAmount / income : 0;

  const dti = profile?.debtToIncomeRatio ?? 0;
  const housingRatio = profile?.housingCostRatio ?? 0;
  const emergencyFundMonths = profile?.emergencyFundMonths ?? 0;

  const discretionaryRatio = expense?.discretionarySpendingRatio ?? (income > 0 && totalExpenses > 0
    ? (totalExpenses - (expense?.totalEssentialSpending ?? 0)) / totalExpenses
    : 0);

  // Overspending flags based on share of total expenses
  const restaurants = expense?.restaurantsCafes ?? 0;
  const entertainment = expense?.entertainmentHobbies ?? 0;
  const subscriptions = expense?.subscriptions ?? 0;
  const share = (v) => (totalExpenses > 0 ? v / totalExpenses : 0);

  const overspendingRestaurants = share(restaurants) > 0.1; // >10%
  const overspendingEntertainment = share(entertainment) > 0.1; // >10%
  const overspendingSubscriptions = share(subscriptions) > 0.06; // >6%

  // Other core flags
  const highDebtBurden = dti > 0.36 || ((profile?.monthlyDebtPayments ?? 0) / (income || 1)) > 0.2;
  const insufficientSavings = savingsRate < 0.1;
  const housingCostTooHigh = housingRatio > 0.3;
  const needsEmergencyFund = emergencyFundMonths < 3;

  // Optional/derived flags
  const hasAdequateEmergencyFund = emergencyFundMonths >= 3;
  const healthySavingsRate = savingsRate >= 0.2;
  const controlledDiscretionarySpending = discretionaryRatio <= 0.3;
  const lowDebtBurden = dti < 0.2;

  // Lifestyle inflation detection using month-over-month change if available
  const spendingVsLast = expense?.spendingVsLastMonthPercentage;
  const lifestyleInflationDetected = typeof spendingVsLast === 'number' && spendingVsLast > 10; // >10% MoM
  const irregularSavingsPattern = false; // requires historical data; keep false for now

  // Score computation
  let score = 100;
  // Savings rate
  if (savingsRate < 0.05) score -= 30;
  else if (savingsRate < 0.1) score -= 20;
  else if (savingsRate < 0.2) score -= 10; else score += 5;
  // Debt burden (DTI)
  if (dti > 0.5) score -= 25;
  else if (dti > 0.36) score -= 15;
  else if (dti < 0.2) score += 5;
  // Housing
  if (housingRatio > 0.4) score -= 20;
  else if (housingRatio > 0.3) score -= 10;
  else if (housingRatio < 0.2) score += 5;
  // Emergency fund
  if (emergencyFundMonths < 1) score -= 20;
  else if (emergencyFundMonths < 3) score -= 10;
  else if (emergencyFundMonths >= 6) score += 5;
  // Overspending categories
  if (overspendingRestaurants) score -= 5;
  if (overspendingEntertainment) score -= 5;
  if (overspendingSubscriptions) score -= 5;

  // Clamp 0..100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Stress level (1 best .. 5 worst)
  let financialStressLevel = 3;
  if (score >= 80) financialStressLevel = 1;
  else if (score >= 65) financialStressLevel = 2;
  else if (score >= 50) financialStressLevel = 3;
  else if (score >= 35) financialStressLevel = 4;
  else financialStressLevel = 5;

  const priorityMap = { 1: 'none', 2: 'low', 3: 'medium', 4: 'high', 5: 'critical' };
  const optimizationPriority = priorityMap[financialStressLevel];
  const needsOptimization = financialStressLevel >= 3;
  const optimizationUrgency = financialStressLevel;

  const problemAreas = [];
  if (insufficientSavings) problemAreas.push('Insufficient savings rate');
  if (highDebtBurden) problemAreas.push('High debt burden');
  if (housingCostTooHigh) problemAreas.push('Housing cost too high');
  if (overspendingRestaurants) problemAreas.push('Overspending: Restaurants');
  if (overspendingEntertainment) problemAreas.push('Overspending: Entertainment');
  if (overspendingSubscriptions) problemAreas.push('Overspending: Subscriptions');
  if (needsEmergencyFund) problemAreas.push('Needs emergency fund');
  if (lifestyleInflationDetected) problemAreas.push('Lifestyle inflation detected');

  const overallFinancialHealth = score >= 80
    ? 'excellent'
    : score >= 65
    ? 'good'
    : score >= 50
    ? 'fair'
    : score >= 35
    ? 'poor'
    : 'critical';

  return {
    financialStressLevel,
    financialHealthScore: score,
    optimizationPriority,

    needsEmergencyFund,
    overspendingRestaurants,
    overspendingEntertainment,
    overspendingSubscriptions,
    highDebtBurden,
    insufficientSavings,
    housingCostTooHigh,
    lifestyleInflationDetected,
    irregularSavingsPattern,

    hasAdequateEmergencyFund,
    healthySavingsRate,
    controlledDiscretionarySpending,
    lowDebtBurden,

    overallFinancialHealth,
    needsOptimization,
    optimizationUrgency,
    top3ProblemAreas: problemAreas.slice(0, 3),
  };
}

module.exports = { computeFinancialHealth };
