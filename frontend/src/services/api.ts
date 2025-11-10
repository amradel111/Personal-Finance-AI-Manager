import axios from 'axios';
import { clearStoredAuth, getStoredToken } from '../utils/authStorage';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor - Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      const requestUrl = error.config?.url ?? '';
      const isLoginRequest = requestUrl.endsWith('/auth/login');

      if (status === 401 && !isLoginRequest) {
        // Unauthorized - clear token and redirect to auth
        clearStoredAuth();
        window.location.href = '/auth';
      }

      // Return error message from server if available
      return Promise.reject(data.error || data.message || 'An error occurred');
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject('No response from server. Please check your connection.');
    } else {
      // Something else happened
      return Promise.reject(error.message || 'An unexpected error occurred');
    }
  }
);

export default api;
