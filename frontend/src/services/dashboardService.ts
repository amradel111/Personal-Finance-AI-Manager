import api from './api';

export interface DashboardTopCategory {
  key: string;
  label: string;
  amount: number;
}

export interface DashboardSummary {
  hasExpensesData: boolean;
  monthYear: string | null;
  totalIncome: number | null;
  totalExpenses: number | null;
  totalSavings: number | null;
  savingsRate: number | null;
  financialHealthScore: number | null;
  topSpendingCategories: DashboardTopCategory[];
  meets_50_30_20_rule: boolean | null;
  message?: string;
}

export interface RecentExpense {
  id: string;
  monthYear: string;
  totalExpenses: number;
  savingsThisMonth: number;
  meets_50_30_20_rule: boolean | null;
  topCategories: DashboardTopCategory[];
}

export interface RecentExpensesResponse {
  hasExpensesData: boolean;
  expenses: RecentExpense[];
  message?: string;
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const { data } = await api.get('/dashboard/summary');
  return data.summary;
};

export const getRecentExpenses = async (): Promise<RecentExpensesResponse> => {
  const { data } = await api.get('/dashboard/recent');
  return data;
};
