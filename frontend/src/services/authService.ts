import api from './api';
import type { UserProfileRecord } from './profileService';

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

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: string;
  lastLogin?: string | null;
  profile?: UserProfileRecord | null;
}

export interface AuthResponse {
  message: string;
  user: UserProfile;
  token: string;
}

export interface CheckProfileStatusResponse {
  hasProfile: boolean;
}

export interface PasswordResetResponse {
  message: string;
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

/**
 * Update user account (email, firstName, lastName, phone)
 */
export const updateAccount = async (data: { email?: string; firstName?: string; lastName?: string; phone?: string }): Promise<{ message: string; user: UserProfile }> => {
  const response = await api.put('/auth/update-account', data);
  return response.data;
};

/**
 * Change user password
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
  const response = await api.put('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};

export const requestPasswordReset = async (email: string): Promise<PasswordResetResponse> => {
  const response = await api.post('/auth/request-password-reset', { email });
  return response.data;
};

export const resetPassword = async (token: string, newPassword: string): Promise<PasswordResetResponse> => {
  const response = await api.post('/auth/reset-password', { token, newPassword });
  return response.data;
};
