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
    <div className="min-h-screen relative">
      <header className="fixed top-0 inset-x-0 z-50 bg-slate-900/90 border-b border-white/10">
        <div className="flex items-center justify-between px-6 md:px-10 py-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-white text-4xl font-extrabold tracking-wide hover:opacity-90"
          >
            SaveMate
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-white/20 bg-white/10 text-white text-xs font-bold px-5 py-2 uppercase tracking-wider hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            Logout
          </button>
        </div>
      </header>
      <div className="pt-24">
        <Outlet />
      </div>
    </div>
  );
};

export default ProtectedRoute;
