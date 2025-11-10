import api from './api';

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
  };
  token: string;
}

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  userProfile?: any;
}

/**
 * Sign up a new user
 */
export const signup = async (data: SignupData): Promise<AuthResponse> => {
  const response = await api.post('/auth/signup', data);
  return response.data;
};

/**
 * Log in an existing user
 */
export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

/**
 * Get current user profile
 */
export const getProfile = async (): Promise<{ user: UserProfile }> => {
  const response = await api.get('/auth/profile');
  return response.data;
};

/**
 * Log out the current user (client-side)
 */
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
