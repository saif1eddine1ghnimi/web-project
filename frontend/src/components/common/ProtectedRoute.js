import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  console.log('🛡️ ProtectedRoute Check:', { 
    loading, 
    isAuthenticated, 
    user, 
    requiredRole 
  });

  if (loading) {
    console.log('⏳ ProtectedRoute: جاري التحميل...');
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">جاري التحميل...</span>
        </div>
        <span className="ms-2">جاري التحقق من الصلاحيات...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute: غير مصرح، التوجيه إلى Login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    console.log('🚫 ProtectedRoute: لا تملك الصلاحيات الكافية');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('✅ ProtectedRoute: تم التصريح، عرض المحتوى');
  return children;
};

export default ProtectedRoute;