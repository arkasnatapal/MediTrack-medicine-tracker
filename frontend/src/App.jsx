import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import GoogleAuthSuccess from './pages/GoogleAuthSuccess'
import VerifyEmail from './pages/VerifyEmail'
import VerifyLogin from './pages/VerifyLogin'
import ForgotPassword from './pages/ForgotPassword'
import VerifyResetOtp from './pages/VerifyResetOtp'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import AddMedicine from './pages/AddMedicine'
import ViewMedicines from './pages/ViewMedicines'
import MedicineDetails from './pages/MedicineDetails'
import MedicineFolders from './pages/MedicineFolders'
import AdminDashboard from './pages/AdminDashboard'
import ContactUs from './pages/ContactUs'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsAndConditions from './pages/TermsAndConditions'
import Settings from './pages/Settings'
import Family from './pages/Family'
import FamilyChat from './pages/FamilyChat'
import FamilyMemberProfile from './pages/FamilyMemberProfile'
import ExpiringMedicines from './pages/ExpiringMedicines'
import AIHealthChat from './pages/AIHealthChat'
import Reminders from './pages/Reminders'
import Features from './pages/Features'
import Pricing from './pages/Pricing'
import About from './pages/About'
import FAQ from './pages/FAQ'
import Careers from './pages/Careers'
import Cookies from './pages/Cookies'
import FoodRoutine from './pages/FoodRoutine'
import FoodDetail from './pages/FoodDetail'
import HealthReview from './pages/HealthReview'
import MedicalReports from './pages/MedicalReports'
import GlobalAnalysis from './pages/GlobalAnalysis'
import MedicationStatus from './pages/MedicationStatus'
import NotFound from './pages/NotFound'
import WomenHealth from './pages/WomenHealth'
import WomenHealthHistoryDetail from './pages/WomenHealthHistoryDetail'
import WomenHealthHistoryList from './pages/WomenHealthHistoryList'
import EmergencyPage from './emergency/EmergencyPage'
import HospitalDetailsPage from './emergency/HospitalDetailsPage'
import EmergencyHistoryPage from './emergency/EmergencyHistoryPage'
import { useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { AppModeProvider, useAppMode } from './context/AppModeContext'
import PublicProfile from './pages/PublicProfile'
import AyurvedicCentre from './components/AyurvedicCentre'

import CareNetworkDashboard from './pages/care-network/CareNetworkDashboard'
import EmergencyPageCare from './pages/care-network/EmergencyPage'
import FindCarePage from './pages/care-network/FindCarePage'
import FacilityDetailPage from './pages/care-network/FacilityDetailPage'
import DigitalTriagePage from './pages/care-network/DigitalTriagePage'
import AppointmentsPage from './pages/care-network/AppointmentsPage'
import AbdmHubPage from './pages/AbdmHubPage'
import ReferralTrackerPage from './pages/care-network/ReferralTrackerPage'
import DiagnosticsSearchPage from './pages/care-network/DiagnosticsSearchPage'
import MedicineAvailabilityPage from './pages/care-network/MedicineAvailabilityPage'
import TeleconsultationPage from './pages/care-network/TeleconsultationPage'
import PrescriptionsPage from './pages/care-network/PrescriptionsPage'

import Loader from './components/Loader'
import Onboarding from './components/Onboarding'
import Sidebar from './components/Sidebar'
import OfflinePage from './pages/OfflinePage'
import { SidebarProvider } from './context/SidebarContext'
import SEO from './components/SEO'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <Loader fullScreen />
  return user ? children : <Navigate to="/login" />
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <Loader fullScreen />
  return user ? <Navigate to="/dashboard" /> : children
}

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <Loader fullScreen />
  return user && user.isAdmin ? children : <Navigate to="/dashboard" />
}

function AppContent() {
  const location = useLocation();
  const { user } = useAuth();
  const { setActiveMode } = useAppMode();
  const isLandingPage = location.pathname === '/';
  const showSidebar = user && !isLandingPage;
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isChecking, setIsChecking] = useState(false);

  // Ensure 'MY HEALTH' mode is enabled by default when user logs in / starts session
  useEffect(() => {
    if (user) {
      const modeKey = `meditrack_session_mode_${user._id || user.id || 'user'}`;
      if (!sessionStorage.getItem(modeKey)) {
        setActiveMode('MY_HEALTH');
        sessionStorage.setItem(modeKey, 'MY_HEALTH');
      }
    }
  }, [user]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      // Try to fetch the current page (HEAD request) to check connectivity
      const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
      if (res.ok || res.status === 404) { // 404 is still a response from server
        setIsOnline(true);
      }
    } catch (error) {
      // Still offline
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };



  if (!isOnline) {
    return <OfflinePage onRetry={checkConnection} isChecking={isChecking} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <SEO />
      <Onboarding />
      {user && !isLandingPage && <Navbar />}
      <div className="flex flex-1 relative">
        {showSidebar && <Sidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              } />
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/signup" element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              } />
              <Route path="/identify/:memberId" element={<PublicProfile />} />
              <Route path="/auth/google-success" element={<GoogleAuthSuccess />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/verify-login" element={<VerifyLogin />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/health-review" element={<HealthReview />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/cookies" element={<Cookies />} />
              
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/add-medicine" element={
                <PrivateRoute>
                  <AddMedicine />
                </PrivateRoute>
              } />
              <Route path="/medicines" element={
                <PrivateRoute>
                  <ViewMedicines />
                </PrivateRoute>
              } />
              <Route path="/medicine-folders" element={
                <PrivateRoute>
                  <MedicineFolders />
                </PrivateRoute>
              } />
              <Route path="/medicines/:id" element={
                <PrivateRoute>
                  <MedicineDetails />
                </PrivateRoute>
              } />
              
              <Route path="/expiring-medicines" element={
                <PrivateRoute>
                  <ExpiringMedicines />
                </PrivateRoute>
              } />

              <Route path="/food" element={
                <PrivateRoute>
                  <FoodRoutine />
                </PrivateRoute>
              } />
              
              <Route path="/food/:name" element={
                <PrivateRoute>
                  <FoodDetail />
                </PrivateRoute>
              } />
              
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              
              <Route path="/settings" element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              } />
              
              <Route path="/family" element={
                <PrivateRoute>
                  <Family />
                </PrivateRoute>
              } />
              
              <Route path="/family/chat/:otherUserId" element={
                <PrivateRoute>
                  <FamilyChat />
                </PrivateRoute>
              } />
              
              <Route path="/family/member/:userId" element={
                <PrivateRoute>
                  <FamilyMemberProfile />
                </PrivateRoute>
              } />
              
              <Route path="/ai-assistant" element={
                <PrivateRoute>
                  <AIHealthChat />
                </PrivateRoute>
              } />
              
              <Route path="/reminders" element={
                <PrivateRoute>
                  <Reminders />
                </PrivateRoute>
              } />

              <Route path="/women-health/:id" element={
                <PrivateRoute>
                  <WomenHealth />
                </PrivateRoute>
              } />

              <Route path="/women-health/history" element={
                <PrivateRoute>
                  <WomenHealthHistoryList />
                </PrivateRoute>
              } />

              <Route path="/women-health/previous/:index" element={
                <PrivateRoute>
                  <WomenHealthHistoryDetail />
                </PrivateRoute>
              } />

              <Route path="/emergency" element={
                <PrivateRoute>
                  <EmergencyPage />
                </PrivateRoute>
              } />

              <Route path="/hospital-details/:id" element={
                <PrivateRoute>
                  <HospitalDetailsPage />
                </PrivateRoute>
              } />

              <Route path="/emergency/history" element={
                <PrivateRoute>
                  <EmergencyHistoryPage />
                </PrivateRoute>
              } />

              <Route path="/reports" element={
                <PrivateRoute>
                  <MedicalReports />
                </PrivateRoute>
              } />

              <Route path="/global-analysis" element={
                <PrivateRoute>
                  <GlobalAnalysis />
                </PrivateRoute>
              } />

              <Route path="/medication-status" element={
                <PrivateRoute>
                  <MedicationStatus />
                </PrivateRoute>
              } />

              <Route path="/natural-healing" element={
                <PrivateRoute>
                  <AyurvedicCentre />
                </PrivateRoute>
              } />

              <Route path="/abdm" element={
                <PrivateRoute>
                  <AbdmHubPage />
                </PrivateRoute>
              } />

              {/* CARE NETWORK ROUTES */}
              <Route path="/care-network" element={
                <PrivateRoute>
                  <CareNetworkDashboard />
                </PrivateRoute>
              } />
              <Route path="/care-network/emergency" element={
                <PrivateRoute>
                  <EmergencyPageCare />
                </PrivateRoute>
              } />
              <Route path="/care-network/find-care" element={
                <PrivateRoute>
                  <FindCarePage />
                </PrivateRoute>
              } />
              <Route path="/care-network/facility/:id" element={
                <PrivateRoute>
                  <FacilityDetailPage />
                </PrivateRoute>
              } />
              <Route path="/care-network/triage" element={
                <PrivateRoute>
                  <DigitalTriagePage />
                </PrivateRoute>
              } />
              <Route path="/care-network/appointments" element={
                <PrivateRoute>
                  <AppointmentsPage />
                </PrivateRoute>
              } />
              <Route path="/care-network/referrals" element={
                <PrivateRoute>
                  <ReferralTrackerPage />
                </PrivateRoute>
              } />
              <Route path="/care-network/diagnostics" element={
                <PrivateRoute>
                  <DiagnosticsSearchPage />
                </PrivateRoute>
              } />
              <Route path="/care-network/medicines" element={
                <PrivateRoute>
                  <MedicineAvailabilityPage />
                </PrivateRoute>
              } />
              <Route path="/care-network/teleconsultation" element={
                <PrivateRoute>
                  <TeleconsultationPage />
                </PrivateRoute>
              } />
              <Route path="/care-network/prescriptions" element={
                <PrivateRoute>
                  <Navigate to="/reports?tab=prescriptions" replace />
                </PrivateRoute>
              } />


              {/* 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}

function App() {
  const { user } = useAuth();
  
  return (
    <ThemeProvider isAuthenticated={!!user}>
      <AppModeProvider>
        <SidebarProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppContent />
          </Router>
        </SidebarProvider>
      </AppModeProvider>
    </ThemeProvider>
  )
}

export default App
