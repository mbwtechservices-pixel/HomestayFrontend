import axios from 'axios';

// Use an environment-based API URL so production can talk directly to the backend
// In Vercel, set VITE_API_URL=https://homestaybackend.onrender.com/api
const apiBaseURL = 'https://homestaybackend.onrender.com/api';

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if:
      // 1. It's an auth check endpoint
      // 2. We're already on login page
      // 3. It's a login request
      const isAuthCheck = error.config?.url?.includes('/auth/me');
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isLoginPage = window.location.pathname === '/login';
      
      if (!isAuthCheck && !isLoginRequest && !isLoginPage) {
        const token = localStorage.getItem('token');
        if (token) {
          // Only clear token and redirect if we have a token (means it's invalid)
          localStorage.removeItem('token');
          // Use a small delay to avoid race conditions
          setTimeout(() => {
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }, 100);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

