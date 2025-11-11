import api from './api';

export type MonthString = `${number}-${number}`;

export interface ExpensePayload {
  monthYear: MonthString;
  housingUtilities: number;
  groceries: number;
  restaurantsCafes: number;
  transportationFuel: number;
  publicTransport: number;
  healthcarePharmacy: number;
  educationTuition: number;
  childcare: number;
  clothingPersonalCare: number;
  entertainmentHobbies: number;
  subscriptions: number;
  otherShopping: number;
  giftsCharity: number;
  miscellaneous: number;
}

export interface ExpenseRecord extends ExpensePayload {
  id: string;
  totalExpenses: number;
  totalEssentialSpending: number;
  totalDiscretionarySpending: number;
  essentialSpendingRatio: number;
  discretionarySpendingRatio: number;
  savingsThisMonth: number;
  spendingVsLastMonthPercentage: number | null;
  highestSpendingCategory: string;
  meets50_30_20Rule: boolean;
  createdAt: string;
  updatedAt: string;
}

export const createExpense = async (payload: ExpensePayload): Promise<{ expense: ExpenseRecord }> => {
  const { data } = await api.post('/expenses', payload);
  return data;
};

export const getAllExpenses = async (): Promise<{ expenses: ExpenseRecord[] }> => {
  const { data } = await api.get('/expenses');
  return data;
};

export const getExpenseByMonth = async (month: MonthString): Promise<{ expense: ExpenseRecord } | null> => {
  try {
    const { data } = await api.get(`/expenses/${month}`);
    return data;
  } catch (e) {
    return null;
  }
};

export const updateExpense = async (id: string, payload: Partial<ExpensePayload>): Promise<{ expense: ExpenseRecord }> => {
  const { data } = await api.put(`/expenses/${id}`, payload);
  return data;
};

export const deleteExpense = async (id: string): Promise<{ success: boolean }> => {
  const { data } = await api.delete(`/expenses/${id}`);
  return data;
};
