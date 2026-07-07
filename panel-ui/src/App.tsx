import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './i18n/ThemeContext';
import { SpinnerIcon } from './components/Icons';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import PolicyPage from './pages/PolicyPage';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Wallet from './pages/Wallet';
import Shop from './pages/Shop';
import Tickets from './pages/Tickets';
import Clans from './pages/Clans';
import Leaderboard from './pages/Leaderboard';
import Seasons from './pages/Seasons';
import GameStats from './pages/GameStats';
import Profile from './pages/Profile';
import GameLoginRedirect from './pages/GameLoginRedirect';

function App() {
  const { isAuthenticated, loading } = useAuth();
  const { isDark } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <SpinnerIcon size={32} className="text-[#3b82f6]" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
      <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/" />} />
      <Route path="/reset-password" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/" />} />
      <Route path="/policy" element={<PolicyPage />} />
      <Route path="/" element={isAuthenticated ? <DashboardLayout><Dashboard /></DashboardLayout> : <Navigate to="/login" />} />
      <Route path="/wallet" element={isAuthenticated ? <DashboardLayout><Wallet /></DashboardLayout> : <Navigate to="/login" />} />
      <Route path="/shop" element={isAuthenticated ? <DashboardLayout><Shop /></DashboardLayout> : <Navigate to="/login" />} />
      <Route path="/tickets" element={isAuthenticated ? <DashboardLayout><Tickets /></DashboardLayout> : <Navigate to="/login" />} />
      <Route path="/clans" element={isAuthenticated ? <DashboardLayout><Clans /></DashboardLayout> : <Navigate to="/login" />} />
      <Route path="/leaderboard" element={isAuthenticated ? <DashboardLayout><Leaderboard /></DashboardLayout> : <Navigate to="/login" />} />
      <Route path="/seasons" element={isAuthenticated ? <DashboardLayout><Seasons /></DashboardLayout> : <Navigate to="/login" />} />
      <Route path="/game-stats" element={isAuthenticated ? <DashboardLayout><GameStats /></DashboardLayout> : <Navigate to="/login" />} />
      <Route path="/profile" element={isAuthenticated ? <DashboardLayout><Profile /></DashboardLayout> : <Navigate to="/login" />} />
      <Route path="/game-login-redirect" element={<GameLoginRedirect />} />
    </Routes>
  );
}

export default App;
