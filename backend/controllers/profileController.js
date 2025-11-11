const prisma = require('../config/database');

const ENUMS = {
  locationType: ['urban', 'suburban', 'rural'],
  lifeStage: ['young_professional', 'young_family', 'established_family', 'empty_nesters', 'retiree'],
  employmentStatus: ['employed', 'self_employed', 'unemployed', 'retired', 'student'],
  incomeStability: ['stable', 'variable', 'seasonal'],
  financialGoalType: ['emergency_fund', 'home', 'retirement', 'education', 'other'],
  optimizationPriority: ['critical', 'high', 'medium', 'low', 'none'],
};

const toInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
};

const toFloat = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

const isInEnum = (v, list) => typeof v === 'string' && list.includes(v);

const validateCreateOrUpdate = (body) => {
  const errors = [];

  const householdSize = toInt(body.household_size);
  const numAdults = toInt(body.num_adults);
  const numChildren = toInt(body.num_children);
  const locationType = body.location_type;
  const lifeStage = body.life_stage;
  const employmentStatus = body.employment_status;
  const monthlyHouseholdIncome = toFloat(body.monthly_household_income);
  const incomeStability = body.income_stability;
  const creditScore = toInt(body.credit_score);
  const totalDebt = toFloat(body.total_debt);
  const monthlyDebtPayments = toFloat(body.monthly_debt_payments);
  const rentOrMortgage = toFloat(body.rent_or_mortgage);
  const savingsGoalMonthly = toFloat(body.savings_goal_monthly);
  const hasHealthInsurance = typeof body.has_health_insurance === 'boolean' ? body.has_health_insurance : (body.has_health_insurance === 'true');
  const financialGoalType = body.financial_goal_type;
  const emergencyFundMonths = toFloat(body.emergency_fund_months);

  if (!Number.isFinite(householdSize) || householdSize < 1) errors.push('household_size must be a positive integer');
  if (!Number.isFinite(numAdults) || numAdults < 0) errors.push('num_adults must be a non-negative integer');
  if (!Number.isFinite(numChildren) || numChildren < 0) errors.push('num_children must be a non-negative integer');
  if (!isInEnum(locationType, ENUMS.locationType)) errors.push('location_type is invalid');
  if (!isInEnum(lifeStage, ENUMS.lifeStage)) errors.push('life_stage is invalid');
  if (!isInEnum(employmentStatus, ENUMS.employmentStatus)) errors.push('employment_status is invalid');
  if (!Number.isFinite(monthlyHouseholdIncome) || monthlyHouseholdIncome <= 0) errors.push('monthly_household_income must be a number > 0');
  if (!isInEnum(incomeStability, ENUMS.incomeStability)) errors.push('income_stability is invalid');
  if (!Number.isFinite(creditScore) || creditScore < 300 || creditScore > 850) errors.push('credit_score must be between 300 and 850');
  if (!Number.isFinite(totalDebt) || totalDebt < 0) errors.push('total_debt must be a non-negative number');
  if (!Number.isFinite(monthlyDebtPayments) || monthlyDebtPayments < 0) errors.push('monthly_debt_payments must be a non-negative number');
  if (!Number.isFinite(rentOrMortgage) || rentOrMortgage < 0) errors.push('rent_or_mortgage must be a non-negative number');
  if (!Number.isFinite(savingsGoalMonthly) || savingsGoalMonthly < 0) errors.push('savings_goal_monthly must be a non-negative number');
  if (typeof hasHealthInsurance !== 'boolean') errors.push('has_health_insurance must be boolean');
  if (!isInEnum(financialGoalType, ENUMS.financialGoalType)) errors.push('financial_goal_type is invalid');
  if (!Number.isFinite(emergencyFundMonths) || emergencyFundMonths < 0) errors.push('emergency_fund_months must be a non-negative number');

  return { errors, parsed: {
    householdSize,
    numAdults,
    numChildren,
    locationType,
    lifeStage,
    employmentStatus,
    monthlyHouseholdIncome,
    incomeStability,
    creditScore,
    totalDebt,
    monthlyDebtPayments,
    rentOrMortgage,
    savingsGoalMonthly,
    hasHealthInsurance,
    financialGoalType,
    emergencyFundMonths,
  }};
};

const computeDerived = (p) => {
  const dti = p.monthlyHouseholdIncome > 0 ? p.monthlyDebtPayments / p.monthlyHouseholdIncome : 0;
  const hcr = p.monthlyHouseholdIncome > 0 ? p.rentOrMortgage / p.monthlyHouseholdIncome : 0;
  const srate = p.monthlyHouseholdIncome > 0 ? p.savingsGoalMonthly / p.monthlyHouseholdIncome : 0;
  const monthlySavingsActual = 0;
  const financialHealthScore = 0;
  const optimizationPriority = 'none';
  return { dti, hcr, srate, monthlySavingsActual, financialHealthScore, optimizationPriority };
};

const createProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { errors, parsed } = validateCreateOrUpdate(req.body || {});
    if (errors.length) return res.status(400).json({ errors });

    const existing = await prisma.userProfile.findUnique({ where: { userId } });
    if (existing) return res.status(409).json({ error: 'Profile already exists' });

    const derived = computeDerived(parsed);

    const profile = await prisma.userProfile.create({
      data: {
        userId,
        householdSize: parsed.householdSize,
        numAdults: parsed.numAdults,
        numChildren: parsed.numChildren,
        locationType: parsed.locationType,
        lifeStage: parsed.lifeStage,
        employmentStatus: parsed.employmentStatus,
        monthlyHouseholdIncome: parsed.monthlyHouseholdIncome,
        incomeStability: parsed.incomeStability,
        creditScore: parsed.creditScore,
        totalDebt: parsed.totalDebt,
        monthlyDebtPayments: parsed.monthlyDebtPayments,
        rentOrMortgage: parsed.rentOrMortgage,
        savingsGoalMonthly: parsed.savingsGoalMonthly,
        hasHealthInsurance: parsed.hasHealthInsurance,
        financialGoalType: parsed.financialGoalType,
        emergencyFundMonths: parsed.emergencyFundMonths,
        savingsRatePercentage: derived.srate,
        debtToIncomeRatio: derived.dti,
        housingCostRatio: derived.hcr,
        monthlySavingsActual: derived.monthlySavingsActual,
        financialHealthScore: derived.financialHealthScore,
        optimizationPriority: derived.optimizationPriority,
      },
    });

    res.status(201).json({ profile });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const existing = await prisma.userProfile.findUnique({ where: { userId } });
    if (!existing) return res.status(404).json({ error: 'Profile not found' });

    const { errors, parsed } = validateCreateOrUpdate(req.body || {});
    if (errors.length) return res.status(400).json({ errors });

    const derived = computeDerived(parsed);

    const profile = await prisma.userProfile.update({
      where: { userId },
      data: {
        householdSize: parsed.householdSize,
        numAdults: parsed.numAdults,
        numChildren: parsed.numChildren,
        locationType: parsed.locationType,
        lifeStage: parsed.lifeStage,
        employmentStatus: parsed.employmentStatus,
        monthlyHouseholdIncome: parsed.monthlyHouseholdIncome,
        incomeStability: parsed.incomeStability,
        creditScore: parsed.creditScore,
        totalDebt: parsed.totalDebt,
        monthlyDebtPayments: parsed.monthlyDebtPayments,
        rentOrMortgage: parsed.rentOrMortgage,
        savingsGoalMonthly: parsed.savingsGoalMonthly,
        hasHealthInsurance: parsed.hasHealthInsurance,
        financialGoalType: parsed.financialGoalType,
        emergencyFundMonths: parsed.emergencyFundMonths,
        savingsRatePercentage: derived.srate,
        debtToIncomeRatio: derived.dti,
        housingCostRatio: derived.hcr,
        monthlySavingsActual: derived.monthlySavingsActual,
        financialHealthScore: derived.financialHealthScore,
        optimizationPriority: derived.optimizationPriority,
      },
    });

    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createProfile, getProfile, updateProfile, ENUMS };
