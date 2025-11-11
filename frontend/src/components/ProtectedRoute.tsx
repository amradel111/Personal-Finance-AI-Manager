import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const FullScreenLoader = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="mx-auto h-12 w-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      <p className="text-white text-sm tracking-wide uppercase">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const handleLogout = () => {
    logout();
    navigate('/auth', { replace: true });
  };

  return (
    <Outlet />
  );
};

export default ProtectedRoute;
