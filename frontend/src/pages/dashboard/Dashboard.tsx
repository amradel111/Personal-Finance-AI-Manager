import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
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

// Central place to define the target savings rate (e.g. 0.2 == 20%).
// Used across dashboard widgets so the UI stays consistent if the goal changes.
const SAVINGS_GOAL_RATE = 0.2;

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
  <div className="rounded-2xl border border-coral-200 bg-white px-4 py-5 sm:px-6 sm:py-6 shadow-lg shadow-coral-900/10 dark:border-white/10 dark:bg-peach-50/5 dark:backdrop-blur dark:shadow-[0_20px_45px_-25px_rgba(15,23,42,0.9)]">
    <p className="text-sm font-medium text-coral-700 dark:text-slate-300">{title}</p>
    <p className="mt-3 text-2xl sm:text-3xl font-semibold text-coral-900 dark:text-white">{value}</p>
    {subtext && <p className="mt-1 text-xs text-coral-600 dark:text-slate-400">{subtext}</p>}
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
      value={summary.financialHealthScore === null || summary.financialHealthScore === undefined ? 'N/A' : `${summary.financialHealthScore}/100`}
      subtext={summary.financialHealthScore === null || summary.financialHealthScore === undefined ? 'Add expenses to calculate' : summary.meets_50_30_20_rule === null ? undefined : summary.meets_50_30_20_rule ? 'Aligned with 50/30/20 guideline' : 'Review spending mix'}
    />
  </div>
);

const TopCategoriesList = ({ categories, totalExpenses }: { categories: DashboardTopCategory[]; totalExpenses: number | null }) => {
  if (!categories.length) return null;

  const safeTotal = totalExpenses && totalExpenses > 0 ? totalExpenses : null;
  const withShare = categories.map((c) => ({
    ...c,
    share: safeTotal ? c.amount / safeTotal : null,
  }));

  const topTotal = withShare.reduce((sum, c) => sum + c.amount, 0);
  const topShare = safeTotal ? topTotal / safeTotal : null;

  return (
    <div className="rounded-2xl border border-coral-200 bg-white px-4 py-5 sm:px-6 sm:py-6 shadow-lg shadow-coral-900/10 h-full flex flex-col dark:border-white/10 dark:bg-peach-50/5 dark:backdrop-blur dark:shadow-[0_20px_45px_-25px_rgba(15,23,42,0.9)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-coral-900 dark:text-white">Top Spending Categories</h3>
        <span className="text-xs font-semibold uppercase tracking-wide text-coral-600 dark:text-slate-400">LATEST MONTH</span>
      </div>
      <ul className="space-y-3 flex-1">
        {withShare.map((item) => (
          <li
            key={item.key}
            className="rounded-xl border border-coral-200 bg-peach-50 px-4 py-2.5 hover:bg-peach-100 transition-colors dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-coral-900 truncate mr-3 dark:text-slate-100">{item.label}</span>
              <span className="text-sm font-semibold text-coral-900 whitespace-nowrap dark:text-white">{formatCurrency(item.amount)}</span>
            </div>
            {item.share !== null && (
              <div className="mt-1 flex items-center justify-between text-[11px] text-coral-600 dark:text-slate-400">
                <span>{formatPercent(item.share)} of monthly spending</span>
                <div className="flex-1 ml-3 h-1.5 rounded-full bg-coral-200 overflow-hidden dark:bg-peach-50/5">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                    style={{ width: `${Math.max(4, Math.min(100, Math.round(item.share * 100)))}%` }}
                  />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {topShare !== null && (
        <div className="pt-3 mt-1 border-t border-coral-200 text-[11px] text-coral-600 flex items-center justify-between dark:border-white/5 dark:text-slate-400">
          <span>
            Top {categories.length} categories account for{' '}
            <span className="font-semibold text-coral-900 dark:text-slate-200">{formatPercent(topShare)}</span> of your spending.
          </span>
        </div>
      )}
    </div>
  );
};

const QuickStatsSection = ({ stats }: { stats: QuickStat[] }) => {
  if (!stats.length) return null;
  return (
    <div className="rounded-2xl border border-coral-200 bg-white px-4 py-5 sm:px-6 sm:py-6 shadow-lg shadow-coral-900/10 dark:border-white/10 dark:bg-peach-50/5 dark:backdrop-blur dark:shadow-[0_20px_45px_-25px_rgba(15,23,42,0.9)]">
      <h3 className="text-lg font-semibold text-coral-900 mb-4 dark:text-white">Quick Insights</h3>
      <div className="grid gap-3 grid-cols-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-peach-50 border border-coral-200 px-4 py-4 dark:bg-peach-50/5 dark:border-white/5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-coral-700 dark:text-slate-400">{stat.label}</p>
            <p className={`mt-2 text-xl font-semibold ${stat.tone ? toneClassMap[stat.tone] : 'text-coral-900 dark:text-white'}`}>{stat.value}</p>
            {stat.detail && <p className="mt-1 text-xs text-coral-700 dark:text-slate-300">{stat.detail}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

const SavingsProgressCard = ({ rate }: { rate: number | null }) => {
  if (rate === null || Number.isNaN(rate)) return null;

  // Actual savings rate as a percentage (e.g. 0.26 -> 26)
  const savedPct = Math.max(0, Math.round(rate * 100));

  // Progress toward the configured goal. 100% on this bar means "goal reached".
  // Anything above the goal keeps the bar visually full, but the label still
  // shows how far above the target you are.
  const goalProgressPct = Math.max(0, Math.min(100, Math.round((rate / SAVINGS_GOAL_RATE) * 100)));

  const goalPct = Math.round(SAVINGS_GOAL_RATE * 100);
  const overUnder = savedPct - goalPct;
  const overUnderLabel = overUnder > 0 ? ` (+${overUnder}% above goal)` : overUnder < 0 ? ` (${Math.abs(overUnder)}% below goal)` : '';

  return (
    <div className="rounded-2xl border border-coral-200 bg-white px-4 py-5 sm:px-6 sm:py-6 shadow-lg shadow-coral-900/10 flex flex-col dark:border-white/10 dark:bg-peach-50/5 dark:backdrop-blur dark:shadow-[0_20px_45px_-25px_rgba(15,23,42,0.9)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-coral-900 dark:text-white">Savings Progress</h3>
        <span className="text-xs font-semibold uppercase tracking-wide text-coral-700 dark:text-slate-400">{savedPct}% SAVED</span>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="h-3 w-full rounded-full bg-coral-200 overflow-hidden dark:bg-peach-50/10">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${rate >= SAVINGS_GOAL_RATE ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : rate >= SAVINGS_GOAL_RATE * 0.5 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-rose-500 to-red-500'}`}
            style={{ width: `${goalProgressPct}%` }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-coral-600 dark:text-slate-400">Goal: {goalPct}%+ monthly savings</p>
          <p className={`text-xs font-semibold ${rate >= SAVINGS_GOAL_RATE ? 'text-emerald-600' : rate >= SAVINGS_GOAL_RATE * 0.5 ? 'text-amber-600' : 'text-rose-600'}`}>
            {rate >= SAVINGS_GOAL_RATE ? 'Excellent!' : rate >= SAVINGS_GOAL_RATE * 0.5 ? 'Good Progress' : 'Keep Going'}
            {overUnderLabel}
          </p>
        </div>
      </div>
    </div>
  );
};

const SpendingTrendMiniChart = ({ recent }: { recent: RecentExpensesResponse | null }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!recent || !recent.hasExpensesData || !recent.expenses.length) {
    return null;
  }
  
  const last = recent.expenses.slice(0, 6).reverse();
  
  // Show message if insufficient data for meaningful trend
  if (last.length < 3) {
    return (
      <div className="rounded-2xl border border-coral-200 bg-white px-4 py-5 sm:px-6 sm:py-6 shadow-lg shadow-coral-900/10 flex flex-col dark:border-white/10 dark:bg-peach-50/5 dark:backdrop-blur dark:shadow-[0_20px_45px_-25px_rgba(15,23,42,0.9)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-coral-900 dark:text-white">Spending Trend</h3>
          <span className="text-xs font-semibold uppercase tracking-wide text-coral-700 dark:text-slate-400">INSUFFICIENT DATA</span>
        </div>
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-500/10 border-2 border-teal-500/30 mb-4">
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-coral-900 mb-1 dark:text-white">Add More Months</p>
            <p className="text-xs text-coral-700 max-w-xs dark:text-slate-400">
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
  const avgSpending = values.reduce((sum, v) => sum + v, 0) / values.length;
  
  const chartData = last.map(e => ({
    name: new Date(e.monthYear).toLocaleDateString('en-US', { month: 'short' }),
    value: e.totalExpenses,
    fullDate: new Date(e.monthYear).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    isHighest: e.totalExpenses === max,
    isLowest: e.totalExpenses === min,
    isAboveAvg: e.totalExpenses > avgSpending
  }));

  return (
    <div className="rounded-2xl border border-coral-200 bg-white px-4 py-5 sm:px-6 sm:py-6 shadow-lg shadow-coral-900/10 dark:border-white/10 dark:bg-peach-50/5 dark:backdrop-blur dark:shadow-[0_20px_45px_-25px_rgba(15,23,42,0.9)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-coral-900 dark:text-white">Spending Trend</h3>
        <span className="text-xs font-semibold uppercase tracking-wide text-coral-700 dark:text-slate-400">LAST {last.length} MONTHS</span>
      </div>
      <div className="space-y-4">
        <div className="h-48 w-full -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
              onMouseMove={(state: any) => {
                if (state.isTooltipActive) {
                  setActiveIndex(state.activeTooltipIndex);
                } else {
                  setActiveIndex(null);
                }
              }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontSize: 10 }}
              />
              <YAxis
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
                width={64}
                tick={{ fontSize: 10 }}
                tickFormatter={(value: number) => currencyFormatter.format(value).replace('$', '$')}
              />
              <Tooltip 
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-white/10 bg-slate-900/95 p-2 shadow-xl backdrop-blur-md">
                        <p className="text-xs font-medium text-slate-400 mb-1">{data.fullDate}</p>
                        <p className="text-sm font-bold text-white">{formatCurrency(data.value)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={avgSpending} stroke="#fbbf24" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={1000}>
                {chartData.map((entry, index) => {
                  let color = '#818cf8'; // indigo-400 default
                  if (entry.isHighest) color = '#fb7185'; // rose-400
                  else if (entry.isLowest) color = '#34d399'; // emerald-400
                  else if (entry.isAboveAvg) color = '#fbbf24'; // amber-400

                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={color}
                      style={{
                        filter: activeIndex === index 
                          ? `brightness(1.2) drop-shadow(0 0 8px ${color}80)` 
                          : activeIndex !== null 
                          ? 'opacity(0.5)' 
                          : 'none',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Stats below chart */}
        <div className="pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-xs">
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

const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-32 rounded-2xl bg-peach-50/10" />
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="h-56 rounded-2xl bg-peach-50/10" />
      <div className="h-56 rounded-2xl bg-peach-50/10" />
    </div>
    <div className="h-64 rounded-2xl bg-peach-50/10" />
  </div>
);

const EmptyState = ({ onAddExpense, message }: { onAddExpense: () => void; message?: string }) => (
  <div className="rounded-2xl border border-dashed border-coral-300 bg-peach-50/50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/60">
    <h3 className="text-2xl font-semibold text-coral-900 dark:text-white">Add your first expenses</h3>
    <p className="mt-3 text-sm text-warm-700 dark:text-slate-300">
      {message || 'We will populate your dashboard once you record your first month of spending.'}
    </p>
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={onAddExpense}
        className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-emerald-500/25 transition hover:from-emerald-600 hover:to-teal-600 dark:bg-peach-50 dark:text-slate-900 dark:hover:bg-slate-100"
      >
        Add Expenses
      </button>
    </div>
  </div>
);

const ProfileOverlay = ({ onSetup }: { onSetup: () => void }) => (
  <div className="absolute inset-0 z-20 backdrop-blur-sm bg-black/60 flex items-center justify-center px-4">
    <div className="bg-peach-50 rounded-2xl shadow-2xl border border-coral-200 w-full max-w-xl p-8 text-center">
      <h2 className="text-2xl font-semibold text-coral-900">Set up your profile for a tailored experience</h2>
      <p className="text-warm-700 mt-2 text-sm">
        We use your household and income details to personalize insights and recommendations.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onSetup}
          className="rounded-full border-2 border-emerald-500 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-8 py-3 uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-transform hover:scale-95 active:scale-90"
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
    <div className="relative min-h-screen bg-peach-100 text-coral-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-peach-200 via-peach-100 to-peach-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
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
              className="inline-flex items-center rounded-lg border border-coral-200 bg-white px-3 py-1.5 text-xs font-semibold text-coral-800 hover:bg-peach-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/10 dark:bg-peach-50/5 dark:text-white dark:hover:bg-peach-50/10"
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
                    <TopCategoriesList categories={summary.topSpendingCategories} totalExpenses={summary.totalExpenses} />
                    <QuickStatsSection stats={quickStats} />
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2 items-stretch">
                    <SavingsProgressCard rate={summary.savingsRate} />
                    <SpendingTrendMiniChart recent={recent} />
                  </div>
                  {/* Recent months view removed */}
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


