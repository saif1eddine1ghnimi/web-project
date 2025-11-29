import React from 'react';
import { Container } from 'react-bootstrap';
import Header from '../components/common/Header';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import EmployeeDashboard from '../components/dashboard/EmployeeDashboard';
import ClientDashboard from '../components/dashboard/ClientDashboard';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/common/ProtectedRoute';

const Dashboard = () => {
  const { user, isAdmin, isEmployee, isClient } = useAuth();

  const renderDashboard = () => {
    if (isAdmin()) return <AdminDashboard />;
    if (isEmployee()) return <EmployeeDashboard />;
    if (isClient()) return <ClientDashboard />;
    return <ClientDashboard />; // Default for clients
  };

  return (
    <ProtectedRoute>
      <div className="dashboard-page">
        <Header />
        <Container fluid className="dashboard-container">
          {renderDashboard()}
        </Container>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;