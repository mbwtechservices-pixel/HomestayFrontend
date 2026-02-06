import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Homes from './pages/Homes';
import InvoiceGenerator from './pages/InvoiceGenerator';
import InvoiceHistory from './pages/InvoiceHistory';
import Reports from './pages/Reports';
import InvoiceSettings from './pages/InvoiceSettings';
import AdminSettings from './pages/AdminSettings';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Layout toggleTheme={toggleTheme} theme={theme}>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Layout toggleTheme={toggleTheme} theme={theme}>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/homes"
          element={
            isAuthenticated ? (
              <Layout toggleTheme={toggleTheme} theme={theme}>
                <Homes />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/invoice-generator"
          element={
            isAuthenticated ? (
              <Layout toggleTheme={toggleTheme} theme={theme}>
                <InvoiceGenerator />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/invoice-history"
          element={
            isAuthenticated ? (
              <Layout toggleTheme={toggleTheme} theme={theme}>
                <InvoiceHistory />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/reports"
          element={
            isAuthenticated ? (
              <Layout toggleTheme={toggleTheme} theme={theme}>
                <Reports />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/invoice-settings"
          element={
            isAuthenticated ? (
              <Layout toggleTheme={toggleTheme} theme={theme}>
                <InvoiceSettings />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin-settings"
          element={
            isAuthenticated ? (
              <Layout toggleTheme={toggleTheme} theme={theme}>
                <AdminSettings />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;

