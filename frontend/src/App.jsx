import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { startAutoLabel } from './utils/autoLabel';
import { motion } from 'framer-motion';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import ReminderChecker from './components/ReminderChecker';
import AnimatedBackground from './components/AnimatedBackground';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotificationBell from './components/NotificationBell';
import A11yEnhancer from './components/A11yEnhancer';

// Login ke baad wale bade pages tab hi download hote hain jab user wahan jaye (app jaldi khulti hai)
const WorkoutsPage = lazy(() => import('./pages/WorkoutsPage'));
const WeightPage = lazy(() => import('./pages/WeightPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NutritionPage = lazy(() => import('./pages/NutritionPage'));
const MeasurementsPage = lazy(() => import('./pages/MeasurementsPage'));
const PerformancePage = lazy(() => import('./pages/PerformancePage'));
const WorkoutAnalyticsPage = lazy(() => import('./pages/WorkoutAnalyticsPage'));
const NutritionAnalyticsPage = lazy(() => import('./pages/NutritionAnalyticsPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const ForumPage = lazy(() => import('./pages/ForumPage'));
const ForumPostPage = lazy(() => import('./pages/ForumPostPage'));
const AdminSupportPage = lazy(() => import('./pages/AdminSupportPage'));

function App() {
  const { user, loading } = useAuth();
  useEffect(() => startAutoLabel(), []);
  const location = useLocation();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
      </div>
    );
  }

  const routes = (
    <Suspense
      fallback={
        <div className="app-loading">
          <div className="app-loading-spinner" />
        </div>
      }
    >
      <Routes location={location} key={user ? location.pathname : 'public'}>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
        <Route path="/workouts" element={user ? <WorkoutsPage /> : <Navigate to="/login" />} />
        <Route path="/weight" element={user ? <WeightPage /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/nutrition" element={user ? <NutritionPage /> : <Navigate to="/login" />} />
        <Route path="/measurements" element={user ? <MeasurementsPage /> : <Navigate to="/login" />} />
        <Route path="/performance" element={user ? <PerformancePage /> : <Navigate to="/login" />} />
        <Route path="/workout-analytics" element={user ? <WorkoutAnalyticsPage /> : <Navigate to="/login" />} />
        <Route path="/nutrition-analytics" element={user ? <NutritionAnalyticsPage /> : <Navigate to="/login" />} />
        <Route path="/support" element={user ? <SupportPage /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" />} />
        <Route path="/goals" element={user ? <GoalsPage /> : <Navigate to="/login" />} />
        <Route path="/reports" element={user ? <ReportsPage /> : <Navigate to="/login" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/community" element={user ? <CommunityPage /> : <Navigate to="/login" />} />
        <Route path="/forum" element={user ? <ForumPage /> : <Navigate to="/login" />} />
        <Route path="/forum/:id" element={user ? <ForumPostPage /> : <Navigate to="/login" />} />
        {/* Sirf admin. Asli check backend karta hai (adminOnly), ye sirf page chhupata hai */}
        <Route
          path="/admin/support"
          element={user?.role === 'admin' ? <AdminSupportPage /> : <Navigate to={user ? '/dashboard' : '/login'} />}
        />
      </Routes>
    </Suspense>
  );

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <A11yEnhancer />
      {user && <AnimatedBackground />}
      <Navbar />

      {user && <NotificationBell />}
      {user && <ReminderChecker />}
      {user ? (
        <main id="main-content" tabIndex={-1} className="app-content">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {routes}
          </motion.div>
        </main>
      ) : (
        <main id="main-content" tabIndex={-1}>
          {routes}
        </main>
      )}
    </>
  );
}

export default App;