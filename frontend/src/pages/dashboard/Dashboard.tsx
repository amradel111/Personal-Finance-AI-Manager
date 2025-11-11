import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { checkProfileStatus } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

import {
  getDashboardSummary,
  getRecentExpenses,
  type DashboardSummary,
  type RecentExpensesResponse,
  type DashboardTopCategory,
} from '../../services/dashboardService';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return currencyFormatter.format(value);
};

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return percentFormatter.format(value);
};

const formatMonth = (isoDate: string | null | undefined) => {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return monthFormatter.format(date);
};

type QuickStat = {
  label: string;
  value: string;
  detail?: string;
  tone?: 'positive' | 'negative' | 'neutral';
};

const toneClassMap: Record<NonNullable<QuickStat['tone']>, string> = {
  positive: 'text-emerald-300',
  negative: 'text-rose-300',
  neutral: 'text-slate-300',
};

// Header is now shared via ../../components/Header

const StatCard = ({ title, value, subtext }: { title: string; value: string; subtext?: string }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 py-5 sm:px-6 sm:py-6 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.9)]">
    <p className="text-sm font-medium text-slate-300">{title}</p>
    <p className="mt-3 text-2xl sm:text-3xl font-semibold text-white">{value}</p>
    {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
  </div>
);

const SummaryGrid = ({ summary }: { summary: DashboardSummary }) => (
  <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
    <StatCard title="Monthly Income" value={formatCurrency(summary.totalIncome)} />
    <StatCard title="Monthly Expenses" value={formatCurrency(summary.totalExpenses)} />
    <StatCard
      title="Savings This Month"
      value={summary.totalSavings === null ? '—' : formatCurrency(summary.totalSavings)}
      subtext={summary.savingsRate === null ? undefined : `Savings Rate: ${formatPercent(summary.savingsRate)}`}
    />
    <StatCard
      title="Financial Health Score"
      value={summary.financialHealthScore === null || summary.financialHealthScore === 0 ? 'N/A' : `${summary.financialHealthScore}/100`}
      subtext={summary.financialHealthScore === null || summary.financialHealthScore === 0 ? 'Add expenses to calculate' : summary.meets_50_30_20_rule === null ? undefined : summary.meets_50_30_20_rule ? 'Aligned with 50/30/20 guideline' : 'Review spending mix'}
    />
  </div>
);

const TopCategoriesList = ({ categories }: { categories: DashboardTopCategory[] }) => {
  if (!categories.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 py-5 sm:px-6 sm:py-6 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.9)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Top Spending Categories</h3>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">LATEST MONTH</span>
      </div>
      <ul className="mt-4 space-y-3">
        {categories.map((item) => (
          <li key={item.key} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3">
            <span className="text-sm font-medium text-slate-100">{item.label}</span>
            <span className="text-sm font-semibold text-white">{formatCurrency(item.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const QuickStatsSection = ({ stats }: { stats: QuickStat[] }) => {
  if (!stats.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 py-5 sm:px-6 sm:py-6 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.9)]">
      <h3 className="text-lg font-semibold text-white mb-4">Quick Insights</h3>
      <div className="grid gap-3 grid-cols-2">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white/5 border border-white/5 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{stat.label}</p>
            <p className={`mt-2 text-xl font-semibold ${stat.tone ? toneClassMap[stat.tone] : 'text-white'}`}>{stat.value}</p>
            {stat.detail && <p className="mt-1 text-xs text-slate-300">{stat.detail}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

const SavingsProgressCard = ({ rate }: { rate: number | null }) => {
  if (rate === null || Number.isNaN(rate)) return null;
  const pct = Math.max(0, Math.min(100, Math.round(rate * 100)));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 py-5 sm:px-6 sm:py-6 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.9)] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Savings Progress</h3>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{pct}% SAVED</span>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${pct >= 20 ? 'bg-emerald-500' : pct >= 10 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">Goal: 20%+ monthly savings</p>
          <p className={`text-xs font-semibold ${pct >= 20 ? 'text-emerald-400' : pct >= 10 ? 'text-amber-400' : 'text-rose-400'}`}>
            {pct >= 20 ? 'Excellent!' : pct >= 10 ? 'Good Progress' : 'Keep Going'}
          </p>
        </div>
      </div>
    </div>
  );
};

const SpendingTrendMiniChart = ({ recent }: { recent: RecentExpensesResponse | null }) => {
  if (!recent || !recent.hasExpensesData || !recent.expenses.length) return null;
  const last = recent.expenses.slice(0, 6).reverse();
  
  // Show message if insufficient data for meaningful trend
  if (last.length < 3) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 py-5 sm:px-6 sm:py-6 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.9)] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Spending Trend</h3>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">INSUFFICIENT DATA</span>
        </div>
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 border-2 border-indigo-500/30 mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-white mb-1">Add More Months</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Track at least 3 months of expenses to see your spending trends and patterns
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const values = last.map((e) => e.totalExpenses);
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min;
  const avgSpending = values.reduce((sum, v) => sum + v, 0) / values.length;
  
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 py-5 sm:px-6 sm:py-6 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.9)] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Spending Trend</h3>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">LAST {last.length} MONTHS</span>
      </div>
      <div className="flex-1 flex flex-col justify-end">
        <div className="flex items-end justify-between gap-2 h-32 relative">
          {/* Average line */}
          {range > 0 && (
            <div 
              className="absolute left-0 right-0 border-t border-dashed border-amber-400/40"
              style={{ bottom: `${((avgSpending - min) / range) * 100}%` }}
            >
              <span className="absolute -top-2 -right-1 text-[9px] font-semibold text-amber-400 bg-slate-900/80 px-1.5 py-0.5 rounded">
                AVG
              </span>
            </div>
          )}
          
          {last.map((e) => {
            // Better height calculation with minimum height for visibility
            const normalizedHeight = range > 0 ? ((e.totalExpenses - min) / range) : 0.5;
            const h = Math.max(20, Math.round(normalizedHeight * 85 + 15));
            const isHighest = e.totalExpenses === max;
            const isLowest = e.totalExpenses === min;
            const isAboveAvg = e.totalExpenses > avgSpending;
            
            return (
              <div key={e.id} className="flex-1 flex flex-col items-center gap-2 group relative">
                <div 
                  className={`w-full rounded-t-lg transition-all duration-300 border-t-2 ${
                    isHighest ? 'bg-rose-400/80 border-rose-300' : 
                    isLowest ? 'bg-emerald-400/80 border-emerald-300' :
                    isAboveAvg ? 'bg-amber-400/70 border-amber-300' :
                    'bg-indigo-400/70 border-indigo-300'
                  } hover:brightness-110 cursor-pointer`}
                  style={{ height: `${h}%` }}
                  title={formatCurrency(e.totalExpenses)}
                />
                <span className="text-[10px] text-slate-400 font-medium text-center leading-tight">
                  {new Date(e.monthYear).toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-xs">
          <div className="text-left">
            <span className="text-slate-500">Low</span>
            <p className="font-semibold text-emerald-400">{formatCurrency(min)}</p>
          </div>
          <div className="text-center">
            <span className="text-slate-500">Avg</span>
            <p className="font-semibold text-amber-400">{formatCurrency(avgSpending)}</p>
          </div>
          <div className="text-right">
            <span className="text-slate-500">High</span>
            <p className="font-semibold text-rose-400">{formatCurrency(max)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecentExpensesList = ({ recent }: { recent: RecentExpensesResponse }) => {
  if (!recent.hasExpensesData || !recent.expenses.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 py-5 sm:px-6 sm:py-6 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.9)]">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-white">Recent Months</h3>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">LAST {recent.expenses.length} ENTRIES</span>
      </div>
      <div className="space-y-3">
        {recent.expenses.map((expense) => (
          <div key={expense.id} className="rounded-xl border border-white/10 bg-slate-900/50 px-5 py-4 hover:bg-slate-900/60 transition-colors">
            {/* Header - Centered Month and Total */}
            <div className="text-center mb-4">
              <h4 className="text-lg font-bold text-white mb-1.5">{formatMonth(expense.monthYear)}</h4>
              <p className="text-sm text-slate-400">
                Total Expenses: <span className="font-semibold text-white">{formatCurrency(expense.totalExpenses)}</span>
              </p>
            </div>
            
            {/* Badges - Centered */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="rounded-full bg-indigo-500/20 border border-indigo-400/30 px-4 py-1.5 text-xs font-bold text-indigo-200">
                Savings: {formatCurrency(expense.savingsThisMonth)}
              </span>
              <span
                className={`rounded-full px-4 py-1.5 text-xs font-bold border ${
                  expense.meets_50_30_20_rule 
                    ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200' 
                    : 'bg-amber-500/20 border-amber-400/30 text-amber-200'
                }`}
              >
                {expense.meets_50_30_20_rule ? 'Balanced' : 'Adjust Mix'}
              </span>
            </div>
            
            {/* Category Pills - Centered */}
            {expense.topCategories.length > 0 && (
              <div className="pt-3 border-t border-white/5">
                <div className="flex flex-wrap justify-center gap-2">
                  {expense.topCategories.map((cat) => (
                    <span 
                      key={`${expense.id}-${cat.key}`} 
                      className="inline-flex items-center rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300"
                    >
                      <span className="text-slate-400">{cat.label}:</span>
                      <span className="ml-1.5 font-semibold text-white">{formatCurrency(cat.amount)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-32 rounded-2xl bg-white/10" />
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="h-56 rounded-2xl bg-white/10" />
      <div className="h-56 rounded-2xl bg-white/10" />
    </div>
    <div className="h-64 rounded-2xl bg-white/10" />
  </div>
);

const EmptyState = ({ onAddExpense, message }: { onAddExpense: () => void; message?: string }) => (
  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-12 text-center">
    <h3 className="text-2xl font-semibold text-white">Add your first expenses</h3>
    <p className="mt-3 text-sm text-slate-300">
      {message || 'We will populate your dashboard once you record your first month of spending.'}
    </p>
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={onAddExpense}
        className="inline-flex items-center rounded-full bg-white text-slate-900 px-6 py-3 text-sm font-semibold transition hover:bg-slate-100"
      >
        Add Expenses
      </button>
    </div>
  </div>
);

const ProfileOverlay = ({ onSetup }: { onSetup: () => void }) => (
  <div className="absolute inset-0 z-20 backdrop-blur-sm bg-black/60 flex items-center justify-center px-4">
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl p-8 text-center">
      <h2 className="text-2xl font-semibold text-slate-900">Set up your profile for a tailored experience</h2>
      <p className="text-slate-600 mt-2 text-sm">
        We use your household and income details to personalize insights and recommendations.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onSetup}
          className="rounded-full border border-slate-900 bg-slate-900 text-white text-xs font-bold px-8 py-3 uppercase tracking-wider transition-transform hover:scale-95 active:scale-90"
        >
          Set up profile
        </button>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recent, setRecent] = useState<RecentExpensesResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await checkProfileStatus();
        if (isMounted) setHasProfile(Boolean(res?.hasProfile));
      } catch (err) {
        console.error('Profile status check failed:', err);
        if (isMounted) {
          // Fallback: infer from cached user profile if available; otherwise keep loading state
          const inferred = Boolean(user && (user as any).userProfile);
          setHasProfile(inferred ? true : null);
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const loadDashboardData = useCallback(async () => {
    if (hasProfile !== true) {
      setSummary(null);
      setRecent(null);
      return;
    }

    setIsLoadingData(true);
    setError(null);
    try {
      const [summaryResponse, recentResponse] = await Promise.all([
        getDashboardSummary(),
        getRecentExpenses(),
      ]);
      setSummary(summaryResponse);
      setRecent(recentResponse);
    } catch (err) {
      const message =
        typeof err === 'string'
          ? err
          : err instanceof Error
          ? err.message
          : 'Failed to load dashboard data';
      setError(message);
    } finally {
      setIsLoadingData(false);
    }
  }, [hasProfile]);

  useEffect(() => {
    if (hasProfile === true) {
      void loadDashboardData();
    }
  }, [hasProfile, loadDashboardData]);

  const quickStats = useMemo<QuickStat[]>(() => {
    if (!summary || summary.hasExpensesData === false) return [];
    if (!recent || !recent.hasExpensesData || !recent.expenses.length) return [];

    const [latest, previous] = recent.expenses;
    const stats: QuickStat[] = [];

    if (previous) {
      const expenseDiff = latest.totalExpenses - previous.totalExpenses;
      stats.push({
        label: 'Spending Change',
        value: formatCurrency(latest.totalExpenses),
        detail: `${expenseDiff >= 0 ? '+' : '-'}${currencyFormatter.format(Math.abs(expenseDiff))} vs ${formatMonth(previous.monthYear)}`,
        tone: expenseDiff < 0 ? 'positive' : expenseDiff > 0 ? 'negative' : 'neutral',
      });

      const savingsDiff = latest.savingsThisMonth - previous.savingsThisMonth;
      stats.push({
        label: 'Savings Momentum',
        value: formatCurrency(latest.savingsThisMonth),
        detail: `${savingsDiff >= 0 ? '+' : '-'}${currencyFormatter.format(Math.abs(savingsDiff))} savings change`,
        tone: savingsDiff > 0 ? 'positive' : savingsDiff < 0 ? 'negative' : 'neutral',
      });
    }

    if (summary.meets_50_30_20_rule !== null) {
      stats.push({
        label: '50/30/20 Rule',
        value: summary.meets_50_30_20_rule ? 'On track' : 'Needs attention',
        detail: summary.meets_50_30_20_rule ? 'Spending mix looks healthy' : 'Adjust essentials vs discretionary',
        tone: summary.meets_50_30_20_rule ? 'positive' : 'negative',
      });
    }

    if (summary.savingsRate !== null) {
      stats.push({
        label: 'Savings Rate',
        value: formatPercent(summary.savingsRate),
        detail: 'Goal: 20%+ monthly savings',
        tone: summary.savingsRate >= 0.2 ? 'positive' : summary.savingsRate >= 0.1 ? 'neutral' : 'negative',
      });
    }

    if (summary.financialHealthScore !== null) {
      stats.push({
        label: 'Financial Health Score',
        value: `${summary.financialHealthScore}/100`,
        detail: 'Higher score indicates stronger overall health',
        tone: summary.financialHealthScore >= 70 ? 'positive' : summary.financialHealthScore >= 50 ? 'neutral' : 'negative',
      });
    }

    return stats;
  }, [summary, recent]);

  const handleNavigate = useCallback(
    (path: string) => {
      if (location.pathname !== path) navigate(path);
    },
    [location.pathname, navigate]
  );

  const showEmptyState = summary && summary.hasExpensesData === false;

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),\n                         linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full filter blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/8 rounded-full filter blur-3xl" />
        </div>
      </div>

      <div className="relative z-10 min-h-screen">
        <Header />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 lg:pt-20 pb-16 space-y-6">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                if (hasProfile === true) void loadDashboardData();
              }}
              disabled={isLoadingData || hasProfile !== true}
              className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingData ? 'Refreshing…' : 'Refresh Data'}
            </button>
          </div>
          {error && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          {hasProfile === null && <LoadingSkeleton />}

          {hasProfile === true && (
            <>
              {isLoadingData && !summary && <LoadingSkeleton />}

              {!isLoadingData && summary && summary.hasExpensesData && (
                <div className="space-y-6">
                  <SummaryGrid summary={summary} />
                  <div className="grid gap-6 lg:grid-cols-2 items-stretch">
                    <TopCategoriesList categories={summary.topSpendingCategories} />
                    <QuickStatsSection stats={quickStats} />
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2 items-stretch">
                    <SavingsProgressCard rate={summary.savingsRate} />
                    <SpendingTrendMiniChart recent={recent} />
                  </div>
                  {recent && <RecentExpensesList recent={recent} />}
                </div>
              )}

              {!isLoadingData && showEmptyState && (
                <EmptyState
                  onAddExpense={() => handleNavigate('/add-expenses')}
                  message={summary?.message}
                />
              )}
            </>
          )}
        </main>

        {hasProfile === false && <ProfileOverlay onSetup={() => navigate('/profile-setup')} />}
      </div>
    </div>
  );
};

export default Dashboard;
