import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import AuthPage from './pages/auth/Auth';
import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileSetup from './pages/profile/ProfileSetup';
import Dashboard from './pages/dashboard/Dashboard';
import MonthlyReport from './pages/reports/MonthlyReport';
import AddExpenses from './pages/expenses/AddExpenses';
import EditAccount from './pages/auth/EditAccount';

const Placeholder = ({ title, message }: { title: string; message: string }) => (
  <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex items-center justify-center px-4">
    <div className="max-w-md w-full bg-white border border-slate-200 text-slate-900 dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-50 backdrop-blur rounded-2xl p-10 text-center space-y-4">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/signup" element={<Navigate to="/auth" replace />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/add-expenses" element={<AddExpenses />} />
            <Route path="/monthly-report" element={<MonthlyReport />} />
            <Route path="/edit-account" element={<EditAccount />} />
          </Route>

          <Route
            path="/forgot-password"
            element={<Placeholder title="Reset Password" message="Password reset flow coming soon." />}
          />

          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
