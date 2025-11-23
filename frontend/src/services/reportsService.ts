import api from './api';

export interface CategoryItem {
  key: string;
  label: string;
  amount: number;
  percent: number;
}

export interface EssentialVsDiscretionary {
  essential: number;
  discretionary: number;
  essentialRatio: number;
  discretionaryRatio: number;
}

export interface DebtMetrics {
  totalDebt: number;
  monthlyDebtPayments: number;
  debtToIncomeRatio: number;
}

export interface ProfileSummary {
  householdSize: number;
  numAdults: number;
  numChildren: number;
  locationType: string;
  lifeStage: string;
  employmentStatus: string;
  incomeStability: string;
  financialGoalType: string;
  savingsGoalMonthly: number;
  monthlySavingsActual: number;
  creditScore: number | null;
  hasHealthInsurance: boolean | null;
  baselineFinancialHealthScore: number | null;
  baselineOptimizationPriority: string | null;
}

export interface MonthOverMonth {
  expenseDelta: number | null;
  spendingVsLastMonthPercentage: number | null;
  savingsDelta: number | null;
  previousMonth: string | null;
}

export interface FlagCounts {
  needsEmergencyFund: number;
  insufficientSavings: number;
  highDebtBurden: number;
  housingCostTooHigh: number;
  overspendingRestaurants: number;
  overspendingEntertainment: number;
  overspendingSubscriptions: number;
  lifestyleInflationDetected: number;
  irregularSavingsPattern: number;
  [key: string]: number;
}

export interface ReportPayload {
  monthYear: string;
  income: number;
  totalExpenses: number;
  savingsAmount: number;
  savingsRate: number;
  categoryBreakdown: CategoryItem[];
  essentialVsDiscretionary: EssentialVsDiscretionary;
  debt: DebtMetrics;
  housingCostRatio: number;
  meets_50_30_20_rule: boolean | null;
  highestSpendingCategory: string | null;
  financialHealthScore: number;
  optimizationPriority: string;
  profileSummary: ProfileSummary;
  monthOverMonth: MonthOverMonth;
  trendAnalysis: TrendAnalysis;
  categoryInsights: CategoryInsights;
  assessmentSource?: string;
  datasetHealthRecord?: AssessmentPayload | null;
}

export interface CategoryChange {
  key: string;
  label: string;
  current: number;
  prior: number;
  change: number;
  percentChange: number | null;
}

export interface CategoryInsights {
  topIncreases: CategoryChange[];
  topDecreases: CategoryChange[];
}

export interface AssessmentPayload {
  financialStressLevel: number;
  financialHealthScore: number;
  optimizationPriority: string;
  // Negative flags
  needsEmergencyFund: boolean | null;
  insufficientSavings: boolean | null;
  highDebtBurden: boolean | null;
  housingCostTooHigh: boolean | null;
  overspendingRestaurants: boolean | null;
  overspendingEntertainment: boolean | null;
  overspendingSubscriptions: boolean | null;
  lifestyleInflationDetected: boolean | null;
  irregularSavingsPattern: boolean | null;
  poorCreditScore?: boolean | null;
  excellentCreditScore?: boolean | null;
  noHealthInsuranceRisk?: boolean | null;
  meetingSavingsGoal?: boolean | null;
  notMeetingSavingsGoal?: boolean | null;
  // Positive indicators
  hasAdequateEmergencyFund: boolean | null;
  healthySavingsRate: boolean | null;
  controlledDiscretionarySpending: boolean | null;
  lowDebtBurden: boolean | null;
  // Summary
  overallFinancialHealth: string | null;
  needsOptimization: boolean | null;
  optimizationUrgency: number | null;
  top3ProblemAreas: string[];
  source?: string;
}

export interface TrendMonth {
  monthYear: string;
  totalExpenses: number;
  savingsAmount: number;
  savingsRate: number;
  essentialRatio: number;
  discretionaryRatio: number;
  meets_50_30_20_rule: boolean | null;
  highestSpendingCategory: string | null;
  spendingVsLastMonthPercentage: number | null;
  assessment: AssessmentPayload;
  categories: Record<string, number>;
}

export interface TrendStats {
  avgMonthlyExpenses: number;
  avgSavingsRate: number;
  totalSavings: number;
  expenseTrend: number;
  bestMonthBySavings: TrendMonth | null;
  highestFinancialHealthScore: number | null;
  lowestFinancialHealthScore: number | null;
  avgFinancialHealthScore: number | null;
  avgFinancialStressLevel: number | null;
  flagCounts: FlagCounts;
  overallHealthDistribution: Record<string, number>;
  mostChallengingMonth: TrendMonth | null;
}

export interface TrendAnalysis {
  months: TrendMonth[];
  stats: TrendStats;
}

export interface MonthlyReportResponse {
  hasData: boolean;
  report?: ReportPayload;
  assessment?: AssessmentPayload;
}

export interface HistoryItem {
  id: string;
  monthYear: string;
  totalExpenses: number;
  savingsThisMonth: number;
  meets_50_30_20_rule: boolean | null;
  highestSpendingCategory: string;
}

export interface HistoryResponse {
  months: HistoryItem[];
}

export const getReportHistory = async (): Promise<HistoryResponse> => {
  const { data } = await api.get('/reports/history');
  return data;
};

export const getMonthlyReport = async (monthYear: string): Promise<MonthlyReportResponse> => {
  const { data } = await api.get(`/reports/monthly/${monthYear}`);
  return data;
};
