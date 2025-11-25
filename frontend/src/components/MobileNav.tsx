import { useLocation, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

interface NavItem {
  key: string;
  label: string;
  path: string;
  matchers?: string[];
  icon: (active: boolean) => JSX.Element;
}

const iconClasses = (active: boolean) =>
  `w-6 h-6 transition ${active ? 'text-emerald-500' : 'text-slate-400'}`;

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = useMemo<NavItem[]>(
    () => [
      {
        key: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: (active) => (
          <svg className={iconClasses(active)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l9-9 9 9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 9v10a2 2 0 002 2h2m6 0h2a2 2 0 002-2V9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
          </svg>
        ),
      },
      {
        key: 'expenses',
        label: 'Expenses',
        path: '/add-expenses',
        icon: (active) => (
          <svg className={iconClasses(active)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m4-4H8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M5 10h14M7 14h10M9 18h6" />
          </svg>
        ),
      },
      {
        key: 'reports',
        label: 'Reports',
        path: '/monthly-report',
        icon: (active) => (
          <svg className={iconClasses(active)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h4v8H3zM10 9h4v12h-4zM17 5h4v16h-4z" />
          </svg>
        ),
      },
      {
        key: 'profile',
        label: 'Profile',
        path: '/profile-setup',
        matchers: ['/profile-setup', '/edit-account'],
        icon: (active) => (
          <svg className={iconClasses(active)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-3 4-5 8-5s8 2 8 5" />
          </svg>
        ),
      },
    ],
    []
  );

  const handleNavigate = (path: string) => {
    if (location.pathname !== path) navigate(path);
  };

  const currentPath = location.pathname;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/70 dark:border-slate-800/70 backdrop-blur-lg shadow-[0_-8px_24px_rgba(15,23,42,0.18)] safe-area-bottom">
      <div className="mx-auto max-w-xl px-4">
        <ul className="flex items-center justify-around py-2 pb-3">
          {navItems.map((item) => {
            const isActive = item.matchers
              ? item.matchers.some((matcher) => currentPath.startsWith(matcher))
              : currentPath.startsWith(item.path);
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 active:scale-95 ${
                    isActive 
                      ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.icon(isActive)}
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default MobileNav;
