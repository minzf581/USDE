import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingSpinner } from './components/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Payments from './pages/Payments';
import Stakes from './pages/Stakes';
import Deposits from './pages/Deposits';
import Withdrawals from './pages/Withdrawals';
import KYCPage from './pages/KYC';
import Admin from './pages/Admin';
import EnterpriseUsers from './pages/EnterpriseUsers';
import Settings from './pages/Settings';
import TestMenu from './pages/TestMenu';

// Layout
import Layout from './components/Layout';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthProvider>
      <div className="App min-h-screen bg-secondary-light">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="payments" element={<Payments />} />
            <Route path="stakes" element={<Stakes />} />
            <Route path="deposits" element={<Deposits />} />
            <Route path="withdrawals" element={<Withdrawals />} />
            <Route path="kyc" element={<KYCPage />} />
            <Route path="admin" element={<Admin />} />
            <Route path="enterprise/users" element={<EnterpriseUsers />} />
            <Route path="settings" element={<Settings />} />
            <Route path="test-menu" element={<TestMenu />} />
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App; 