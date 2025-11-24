import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import AuthPage from './pages/auth/Auth';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileSetup from './pages/profile/ProfileSetup';
import Dashboard from './pages/dashboard/Dashboard';
import MonthlyReport from './pages/reports/MonthlyReport';
import AddExpenses from './pages/expenses/AddExpenses';
import EditAccount from './pages/auth/EditAccount';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/signup" element={<Navigate to="/auth" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/add-expenses" element={<AddExpenses />} />
            <Route path="/monthly-report" element={<MonthlyReport />} />
            <Route path="/edit-account" element={<EditAccount />} />
          </Route>

          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
