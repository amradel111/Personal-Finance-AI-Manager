import api from './api';

export interface Budget {
  id: string;
  userId: string;
  monthYear: string;
  budgetedAmount: number;
  actualSpending: number;
  category: string;
  notes?: string;
}

export const getBudgets = async (monthYear: string) => {
  // Ensure format is YYYY-MM-01 for backend
  const formattedMonth = monthYear.includes('-01') ? monthYear : `${monthYear}-01`;
  const response = await api.get<Budget[]>(`/budgets?monthYear=${formattedMonth}`);
  return response.data;
};

export const upsertBudget = async (data: { category: string; amount: number; monthYear: string }) => {
  // Ensure format is YYYY-MM-01 for backend
  const formattedMonth = data.monthYear.includes('-01') ? data.monthYear : `${data.monthYear}-01`;
  const response = await api.post<Budget>('/budgets', { ...data, monthYear: formattedMonth });
  return response.data;
};
