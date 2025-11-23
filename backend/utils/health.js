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
    : (income > 0 ? income - totalExpenses : 0);
  const savingsRate = income > 0 ? savingsAmount / income : 0;

  const dti = profile?.debtToIncomeRatio ?? 0;
  const housingRatio = profile?.housingCostRatio ?? 0;
  const emergencyFundMonths = profile?.emergencyFundMonths ?? 0;
  const incomeStability = profile?.incomeStability ?? 'stable';
  const employmentStatus = profile?.employmentStatus ?? null;
  const lifeStage = profile?.lifeStage ?? null;
  const creditScore = Number.isFinite(profile?.creditScore) ? profile.creditScore : null;
  const hasHealthInsurance = profile?.hasHealthInsurance ?? null;
  const householdSize = profile?.householdSize ?? 1;
  const locationType = profile?.locationType ?? null;

  const discretionaryRatio = expense?.discretionarySpendingRatio ?? (income > 0 && totalExpenses > 0
    ? (totalExpenses - (expense?.totalEssentialSpending ?? 0)) / totalExpenses
    : 0);

  // Overspending flags based on share of total expenses, contextualized by household size
  const restaurants = expense?.restaurantsCafes ?? 0;
  const entertainment = expense?.entertainmentHobbies ?? 0;
  const subscriptions = expense?.subscriptions ?? 0;
  const share = (v) => (totalExpenses > 0 ? v / totalExpenses : 0);

  let restaurantsThreshold = 0.10; // 10%
  let entertainmentThreshold = 0.10; // 10%
  let subscriptionsThreshold = 0.06; // 6%

  if (householdSize <= 1) {
    // Single-person households: lower tolerance for high shares
    restaurantsThreshold = 0.08;
    entertainmentThreshold = 0.08;
  } else if (householdSize >= 4) {
    // Larger households: slightly higher tolerance
    restaurantsThreshold = 0.12;
    entertainmentThreshold = 0.12;
  }

  const overspendingRestaurants = share(restaurants) > restaurantsThreshold;
  const overspendingEntertainment = share(entertainment) > entertainmentThreshold;
  const overspendingSubscriptions = share(subscriptions) > subscriptionsThreshold;

  // Other core flags
  // Life-stage-aware debt thresholds
  let highDebtThreshold = 0.36;
  let veryHighDebtThreshold = 0.5;
  if (lifeStage === 'young_professional') {
    highDebtThreshold = 0.4;
    veryHighDebtThreshold = 0.55;
  } else if (lifeStage === 'retiree' || lifeStage === 'empty_nesters') {
    highDebtThreshold = 0.3;
    veryHighDebtThreshold = 0.4;
  }

  const highDebtBurden = dti > highDebtThreshold
    || ((profile?.monthlyDebtPayments ?? 0) / (income || 1)) > 0.2;

  const insufficientSavings = savingsRate < 0.1;
  // Location-aware housing cost threshold
  let housingModerateThreshold = 0.3;
  let housingHighThreshold = 0.4;
  if (locationType === 'urban') {
    housingModerateThreshold = 0.35;
    housingHighThreshold = 0.45;
  } else if (locationType === 'rural') {
    housingModerateThreshold = 0.25;
    housingHighThreshold = 0.35;
  }

  const housingCostTooHigh = housingRatio > housingModerateThreshold;

  // Dynamic emergency fund threshold based on income stability and life stage
  let targetEmergencyFundMonths = 3;
  if (incomeStability === 'variable' || incomeStability === 'seasonal' || employmentStatus === 'self_employed') {
    targetEmergencyFundMonths = 6;
  }
  if (lifeStage === 'retiree') {
    targetEmergencyFundMonths = Math.max(targetEmergencyFundMonths, 6);
  }

  const needsEmergencyFund = emergencyFundMonths < targetEmergencyFundMonths;

  // Optional/derived flags
  const hasAdequateEmergencyFund = emergencyFundMonths >= targetEmergencyFundMonths;
  const healthySavingsRate = savingsRate >= 0.2;
  const controlledDiscretionarySpending = discretionaryRatio <= 0.3;
  const lowDebtBurden = dti < 0.2;

  // Lifestyle inflation detection using month-over-month change if available
  const spendingVsLast = expense?.spendingVsLastMonthPercentage;
  const lifestyleInflationDetected = typeof spendingVsLast === 'number' && spendingVsLast > 10; // >10% MoM
  const irregularSavingsPattern = false; // requires historical data; keep false for now

  // Credit score related flags
  const poorCreditScore = creditScore !== null && creditScore < 670;
  const excellentCreditScore = creditScore !== null && creditScore >= 740;

  // Health insurance risk flag
  const noHealthInsuranceRisk = hasHealthInsurance === false;

  // Score computation
  let score = 100;
  // Savings rate
  if (savingsRate < 0.05) score -= 30;
  else if (savingsRate < 0.1) score -= 20;
  else if (savingsRate < 0.2) score -= 10; else score += 5;
  // Debt burden (DTI)
  if (dti > veryHighDebtThreshold) score -= 25;
  else if (dti > highDebtThreshold) score -= 15;
  else if (dti < 0.2) score += 5;
  // Housing
  if (housingRatio > 0.4) score -= 20;
  else if (housingRatio > 0.3) score -= 10;
  else if (housingRatio < 0.2) score += 5;
  // Emergency fund
  if (emergencyFundMonths < 1) score -= 20;
  else if (emergencyFundMonths < targetEmergencyFundMonths) score -= 10;
  else if (emergencyFundMonths >= targetEmergencyFundMonths + 3) score += 5;
  // Overspending categories
  if (overspendingRestaurants) score -= 5;
  if (overspendingEntertainment) score -= 5;
  if (overspendingSubscriptions) score -= 5;

  // Credit score impact
  if (creditScore !== null) {
    if (creditScore < 580) score -= 15;
    else if (creditScore < 670) score -= 5;
    else if (creditScore >= 800) score += 10;
    else if (creditScore >= 740) score += 5;
  }

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

  const targetMonthlySavings = profile?.savingsGoalMonthly ?? 0;
  const meetingSavingsGoal = targetMonthlySavings > 0 && savingsAmount >= targetMonthlySavings * 0.9;
  const notMeetingSavingsGoal = targetMonthlySavings > 0 && savingsAmount < targetMonthlySavings * 0.9;

  const problemAreas = [];
  if (insufficientSavings) problemAreas.push('Insufficient savings rate');
  if (highDebtBurden) problemAreas.push('High debt burden');
  if (housingCostTooHigh) problemAreas.push('Housing cost too high');
  if (overspendingRestaurants) problemAreas.push('Overspending: Restaurants');
  if (overspendingEntertainment) problemAreas.push('Overspending: Entertainment');
  if (overspendingSubscriptions) problemAreas.push('Overspending: Subscriptions');
  if (needsEmergencyFund) problemAreas.push('Needs emergency fund');
  if (lifestyleInflationDetected) problemAreas.push('Spending spike vs last month');
  if (poorCreditScore) problemAreas.push('Low credit score');
  if (noHealthInsuranceRisk) problemAreas.push('No health insurance coverage');
  if (notMeetingSavingsGoal) problemAreas.push('Not meeting savings goal');

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
    poorCreditScore,
    excellentCreditScore,
    noHealthInsuranceRisk,
    meetingSavingsGoal,
    notMeetingSavingsGoal,

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
