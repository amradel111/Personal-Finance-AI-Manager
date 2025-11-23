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
    <header className="fixed top-0 inset-x-0 z-50 bg-peach-50/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-coral-200 dark:border-white/5 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={() => handleNavigate('/dashboard')}
              className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-white dark:to-white dark:text-white tracking-tight whitespace-nowrap"
            >
              SaveMate
            </button>
            <button
              type="button"
              className="lg:hidden inline-flex items-center rounded-lg border border-coral-200 bg-white px-3 py-1.5 text-xs font-semibold text-coral-800 hover:bg-peach-50 dark:border-white/10 dark:bg-peach-50/5 dark:text-white dark:hover:bg-peach-50/10"
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
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25 dark:bg-peach-50 dark:text-slate-900'
                      : 'text-coral-800 hover:bg-peach-200 hover:text-coral-900 dark:text-white dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {displayName && (
              <span className="hidden md:inline-flex items-center text-xs sm:text-sm text-coral-800 bg-white px-3 py-1.5 rounded-lg border border-coral-200 whitespace-nowrap dark:text-white dark:bg-slate-800/60 dark:border-slate-700/70">
                {displayName}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/auth');
              }}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-gradient-to-r from-rose-500 to-red-500 text-white hover:from-rose-600 hover:to-red-600 shadow-md shadow-rose-500/20 transition whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-coral-200 dark:border-white/5 py-2 bg-peach-50 dark:bg-slate-950/95" id="mobile-nav">
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
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md dark:bg-peach-50 dark:text-slate-900'
                        : 'text-coral-800 hover:bg-peach-200 hover:text-earth-900 dark:text-white dark:hover:bg-slate-800'
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


