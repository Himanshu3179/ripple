import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

interface ProtectedRouteProps {
  adminOnly?: boolean;
}

const ProtectedRoute = ({ adminOnly = false }: ProtectedRouteProps) => {
  const { isAuthenticated, initialized, isAdmin } = useAuthContext();
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading user...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;