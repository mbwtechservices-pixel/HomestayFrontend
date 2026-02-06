import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setIsAuthenticated(true);
          setAdmin(response.data.admin);
        } else {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setAdmin(null);
        }
      } catch (error) {
        // Only clear token if it's a 401 (unauthorized), not network errors
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setAdmin(null);
        }
      }
    } else {
      setIsAuthenticated(false);
      setAdmin(null);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    setIsLoggingIn(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setIsAuthenticated(true);
        setAdmin(response.data.admin);
        // Set loading to false after successful login
        setLoading(false);
        setIsLoggingIn(false);
        return { success: true };
      } else {
        setIsLoggingIn(false);
        return {
          success: false,
          message: 'Login failed',
        };
      }
    } catch (error) {
      setIsLoggingIn(false);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

