import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import FacilityAuthPage from './pages/auth/FacilityAuthPage';
import DoctorAuthPage from './pages/auth/DoctorAuthPage';
import AdminAuthPage from './pages/auth/AdminAuthPage';
import FacilityDashboard from './pages/facility/FacilityDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import PatientCareIntegrationSimulator from './pages/patient/PatientCareIntegrationSimulator';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-slate-400">Loading MediTrack Care Portal...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/facility/auth" element={<FacilityAuthPage />} />
          <Route path="/doctor/auth" element={<DoctorAuthPage />} />
          <Route path="/admin/login" element={<AdminAuthPage />} />
          <Route path="/patient-simulator" element={<PatientCareIntegrationSimulator />} />

          <Route
            path="/facility/dashboard"
            element={
              <ProtectedRoute allowedRoles={['FACILITY_ADMIN', 'FACILITY_STAFF', 'SYSTEM_ADMIN']}>
                <FacilityDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['DOCTOR', 'SYSTEM_ADMIN']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>

  );
}
