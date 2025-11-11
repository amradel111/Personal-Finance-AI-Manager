import api from './api';

export type LocationType = 'urban' | 'suburban' | 'rural';
export type LifeStage = 'young_professional' | 'young_family' | 'established_family' | 'empty_nesters' | 'retiree';
export type EmploymentStatus = 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student';
export type IncomeStability = 'stable' | 'variable' | 'seasonal';
export type FinancialGoalType = 'emergency_fund' | 'home' | 'retirement' | 'education' | 'other';

export interface ProfileCreatePayload {
  household_size: number;
  num_adults: number;
  num_children: number;
  location_type: LocationType;
  life_stage: LifeStage;
  employment_status: EmploymentStatus;
  monthly_household_income: number;
  income_stability: IncomeStability;
  credit_score: number;
  total_debt: number;
  monthly_debt_payments: number;
  rent_or_mortgage: number;
  savings_goal_monthly: number;
  has_health_insurance: boolean;
  financial_goal_type: FinancialGoalType;
  emergency_fund_months: number;
}

export interface UserProfileRecord {
  id: string;
  userId: string;
  householdSize: number;
  numAdults: number;
  numChildren: number;
  locationType: LocationType;
  lifeStage: LifeStage;
  employmentStatus: EmploymentStatus;
  monthlyHouseholdIncome: number;
  incomeStability: IncomeStability;
  creditScore: number;
  totalDebt: number;
  monthlyDebtPayments: number;
  rentOrMortgage: number;
  savingsGoalMonthly: number;
  hasHealthInsurance: boolean;
  financialGoalType: FinancialGoalType;
  emergencyFundMonths: number;
  savingsRatePercentage: number;
  debtToIncomeRatio: number;
  housingCostRatio: number;
  monthlySavingsActual: number;
  financialHealthScore: number;
  optimizationPriority: 'critical' | 'high' | 'medium' | 'low' | 'none';
  createdAt: string;
  updatedAt: string;
}

export const getProfile = async (): Promise<{ profile: UserProfileRecord } | null> => {
  try {
    const res = await api.get('/profile');
    return res.data;
  } catch (e) {
    return null;
  }
};

export const createProfile = async (payload: ProfileCreatePayload): Promise<{ profile: UserProfileRecord }> => {
  const res = await api.post('/profile', payload);
  return res.data;
};

export const updateProfile = async (payload: ProfileCreatePayload): Promise<{ profile: UserProfileRecord }> => {
  const res = await api.put('/profile', payload);
  return res.data;
};
