import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import { Spinner } from '../components';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    // Redirect based on role
    if (profile?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (profile?.role === 'teacher') {
      return <Navigate to="/teacher/dashboard" replace />;
    } else if (profile?.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
