import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import AuthPage from './pages/auth/Auth';
import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileSetup from './pages/profile/ProfileSetup';
import Dashboard from './pages/dashboard/Dashboard';

const Placeholder = ({ title, message }: { title: string; message: string }) => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
    <div className="max-w-md w-full bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-10 text-center space-y-4">
      <h1 className="text-3xl font-semibold text-white">{title}</h1>
      <p className="text-slate-200">{message}</p>
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
