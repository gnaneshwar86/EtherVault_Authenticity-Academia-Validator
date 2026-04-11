import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { NotificationProvider } from './context/NotificationContext';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import InstitutionDashboard from './pages/InstitutionDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, loading, role: userRole } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
        <p className="text-text-muted font-black text-xs uppercase tracking-widest">Authenticating...</p>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  // If authenticated but role hasn't propagated yet, show loader to prevent race-condition redirect
  if (role && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <Loader2 className="w-8 h-8 text-slate-200 animate-spin" />
      </div>
    );
  }

  const normalizedUserRole = userRole?.replace('ROLE_', '');
  const targetRole = role?.replace('ROLE_', '');

  if (targetRole && normalizedUserRole !== targetRole) return <Navigate to="/" />;

  return children;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<VerifierDashboard />} />

              <Route
                path="/institution"
                element={
                  <ProtectedRoute role="INSTITUTION">
                    <InstitutionDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute role="ADMIN">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
