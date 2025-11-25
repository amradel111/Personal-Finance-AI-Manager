import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MobileNav from './MobileNav';

export const FullScreenLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-900 z-50">
    <div className="flex flex-col items-center justify-center space-y-8">
      {/* SaveMate text logo */}
      <h1 className="text-3xl font-bold text-white tracking-tight">
        SaveMate
      </h1>

      {/* Loading spinner */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-8 h-8 border-3 border-slate-700 rounded-full" />
          <div className="absolute inset-0 w-8 h-8 border-3 border-transparent border-t-emerald-500 rounded-full animate-spin" />
        </div>
        <p className="text-sm text-slate-400">
          Loading...
        </p>
      </div>
    </div>
  </div>
);

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <>
      <div className="pb-24 md:pb-0">
        <Outlet />
      </div>
      <MobileNav />
    </>
  );
};

export default ProtectedRoute;
