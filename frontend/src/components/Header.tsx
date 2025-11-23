import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

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
              className="hidden md:inline-flex lg:hidden items-center rounded-lg border border-coral-200 bg-white px-3 py-1.5 text-xs font-semibold text-coral-800 hover:bg-peach-50 dark:border-white/10 dark:bg-peach-50/5 dark:text-white dark:hover:bg-peach-50/10"
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
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${isActive
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

            {/* User Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 border-2 border-amber-300/50 dark:border-amber-700/50 hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="Open user menu"
              >
                <svg className="w-6 h-6 text-amber-700 dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 origin-top-right rounded-2xl border border-warmgray-200/80 bg-white dark:border-slate-700/50 dark:bg-slate-900 shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {/* User Info Section */}
                  <div className="px-5 py-4">
                    <div className="flex items-start gap-3.5">
                      <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 border-2 border-amber-300/50 dark:border-amber-700/50 flex items-center justify-center">
                        <svg className="w-6 h-6 text-amber-700 dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-warmgray-900 dark:text-white truncate">{displayName}</p>
                        <p className="text-xs text-warmgray-500 dark:text-slate-400 mt-0.5">Personal</p>
                        <p className="text-xs text-warmgray-600 dark:text-slate-400 mt-1 truncate">{user?.email}</p>
                      </div>
                      <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>

                  <div className="h-px bg-warmgray-200 dark:bg-slate-700/70" />

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/edit-account');
                      }}
                      className="w-full text-left px-5 py-3 text-sm font-medium text-warmgray-700 hover:bg-warmgray-50 dark:text-slate-200 dark:hover:bg-slate-800/70 transition-colors flex items-center gap-3.5 group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-warmgray-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-warmgray-200 dark:group-hover:bg-slate-700 transition-colors">
                        <svg className="w-5 h-5 text-warmgray-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span>Account settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                        navigate('/auth');
                      }}
                      className="w-full text-left px-5 py-3 text-sm font-medium text-warmgray-700 hover:bg-warmgray-50 dark:text-slate-200 dark:hover:bg-slate-800/70 transition-colors flex items-center gap-3.5 group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-warmgray-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-rose-50 dark:group-hover:bg-rose-950/30 transition-colors">
                        <svg className="w-5 h-5 text-warmgray-600 dark:text-slate-300 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                    className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition ${isActive
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


