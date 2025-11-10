import api from './api';

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    createdAt: string;
  };
  token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: string;
  userProfile?: any;
}

export interface CheckProfileStatusResponse {
  hasProfile: boolean;
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
 * Check if authenticated user has completed profile setup
 */
export const checkProfileStatus = async (): Promise<CheckProfileStatusResponse> => {
  const response = await api.get('/auth/check-profile');
  return response.data;
};

/**
 * Log out the current user (client-side)
 */
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
};
