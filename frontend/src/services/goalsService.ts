import api from './api';

export interface GoalProgressDetails {
  totalContribution: number;
  lastContribution?: number;
  progressPercent: number | null;
  onTrack: boolean | null;
  paceStatus: string;
  estimatedCompletionMonth: string | null;
}

export interface Goal {
  id: number;
  userId: number;
  type: 'total' | 'monthly';
  name: string;
  targetAmount?: number;
  monthlyTargetAmount?: number;
  startMonthYear?: string;
  targetMonthYear?: string;
  status: 'active' | 'completed' | 'archived';
  progress?: GoalProgressDetails; // Computed by backend
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalPayload {
  type: 'total' | 'monthly';
  name: string;
  targetAmount?: number;
  monthlyTargetAmount?: number;
  startMonthYear?: string;
  targetMonthYear?: string;
  status?: 'active' | 'completed' | 'archived';
}

export interface UpdateGoalPayload {
  type?: 'total' | 'monthly';
  name?: string;
  targetAmount?: number;
  monthlyTargetAmount?: number;
  startMonthYear?: string;
  targetMonthYear?: string;
  status?: 'active' | 'completed' | 'archived';
}

export const fetchGoals = async (): Promise<Goal[]> => {
  const response = await api.get('/goals');
  return response.data.goals;
};

export const createGoal = async (payload: CreateGoalPayload): Promise<Goal> => {
  const response = await api.post('/goals', payload);
  return response.data.goal;
};

export const updateGoal = async (id: number, payload: UpdateGoalPayload): Promise<Goal> => {
  const response = await api.put(`/goals/${id}`, payload);
  return response.data.goal;
};

export const deleteGoal = async (id: number): Promise<void> => {
  await api.delete(`/goals/${id}`);
};
