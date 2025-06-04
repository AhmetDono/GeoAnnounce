import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Component for routes that require authentication
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Yükleniyor...</div>;
  }
  
  if (!isAuthenticated) {
    // Just redirect without affecting the current auth state
    return <Navigate to="/login" replace />;
  }
  
  return children ? children : <Outlet />;
};

// Component for routes that require specific role
export const RoleBasedRoute = ({ requiredRole, children }) => {
  const { isAuthenticated, hasRole, loading } = useAuth();
  
  if (loading) {
    return <div>Yükleniyor...</div>;
  }
  
  if (!isAuthenticated) {
    // Just redirect without affecting the current auth state
    return <Navigate to="/login" replace />;
  }
  
  if (!hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children ? children : <Outlet />;
};

// Component for routes that should NOT be accessible when authenticated
export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Yükleniyor...</div>;
  }
  
  if (isAuthenticated) {
    // If user is already logged in, redirect to home page
    return <Navigate to="/" replace />;
  }
  
  return children ? children : <Outlet />;
};

export default { ProtectedRoute, RoleBasedRoute, PublicOnlyRoute };