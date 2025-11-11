import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Add Expenses', path: '/add-expenses' },
    { label: 'Monthly Report', path: '/monthly-report' },
    { label: 'Edit Profile', path: '/profile-setup' },
  ];

  const handleNavigate = (path: string) => {
    if (location.pathname !== path) navigate(path);
  };

  const displayName = user ? `${user.firstName} ${user.lastName}` : '';

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={() => handleNavigate('/dashboard')}
              className="text-2xl md:text-3xl font-extrabold text-white tracking-tight whitespace-nowrap"
            >
              SaveMate
            </button>
            <button
              type="button"
              className="lg:hidden inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
              aria-controls="mobile-nav"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? 'Close' : 'Menu'}
            </button>
          </div>

          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-white hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {displayName && (
              <span className="hidden md:inline-flex items-center text-xs sm:text-sm text-white bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/70 whitespace-nowrap">
                {displayName}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/auth');
              }}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-white/5 py-2" id="mobile-nav">
            <nav className="flex flex-col items-stretch gap-2 p-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      handleNavigate(item.path);
                      setMobileOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition ${
                      isActive
                        ? 'bg-white text-slate-900'
                        : 'text-white hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
