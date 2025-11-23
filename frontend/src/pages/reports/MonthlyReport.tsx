// Updated: 2025-11-23 20:38 - Fixed pie chart label styling
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Header from '../../components/Header';
import { getMonthlyReport, getReportHistory, type MonthlyReportResponse, type HistoryResponse, type CategoryItem } from '../../services/reportsService';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 1 });
const signedPercentFormatter = new Intl.NumberFormat('en-US', { signDisplay: 'always', style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 1 });
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

const formatCurrency = (v: number | null | undefined) => (v === null || v === undefined || Number.isNaN(v) ? '—' : currencyFormatter.format(v));
const formatPercent = (v: number | null | undefined) => (v === null || v === undefined || Number.isNaN(v) ? '—' : percentFormatter.format(v));
const formatSignedCurrency = (v: number | null | undefined) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  const abs = Math.abs(v);
  const formatted = currencyFormatter.format(abs);
  if (v === 0) return formatted;
  return `${v > 0 ? '+' : '-'}${formatted}`;
};
const formatSignedPercent = (v: number | null | undefined) => (v === null || v === undefined || Number.isNaN(v) ? '—' : signedPercentFormatter.format(v));
const formatMonth = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return monthFormatter.format(d);
};

const COLORS = ['#60a5fa', '#f97316', '#22c55e', '#a78bfa', '#f43f5e', '#06b6d4', '#84cc16', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6', '#eab308', '#d97706'];


const ScoreBadge = ({ score }: { score: number | undefined }) => {
  if (score === undefined || score === null) return null;
  const lightTone = score >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : score >= 65 ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-rose-100 text-rose-700 border-rose-300';
  const darkTone = score >= 80 ? 'dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/30' : score >= 65 ? 'dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/30' : 'dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-400/30';
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${lightTone} ${darkTone}`}>Score {score}/100</span>;
};

const SectionCard = ({ children, title, right }: { children: React.ReactNode; title: string; right?: React.ReactNode }) => (
  <div className="rounded-2xl border border-warmgray-300 bg-warmgray-50 px-4 py-5 sm:px-6 sm:py-6 shadow-lg shadow-black/10 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur dark:shadow-[0_20px_45px_-25px_rgba(15,23,42,0.9)]">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-warmgray-900 dark:text-white">{title}</h3>
      {right}
    </div>
    {children}
  </div>
);

const MonthlyReport = () => {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoverSource, setHoverSource] = useState<'chart' | 'list' | null>(null);
  const [activeIncomeIndex, setActiveIncomeIndex] = useState<number | null>(null);
  const [activeEssentialIndex, setActiveEssentialIndex] = useState<number | null>(null);
  const [report, setReport] = useState<MonthlyReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAnimatedRef = useRef(false);
  const navigate = useNavigate();

  const loadHistory = useCallback(async () => {
    try {
      const h = await getReportHistory();
      setHistory(h);
      if (h.months.length && !selectedMonth) {
        const first = h.months[0];
        const d = new Date(first.monthYear);
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        setSelectedMonth(`${y}-${m}`);
      }
    } catch (e) {
      const msg = typeof e === 'string' ? e : e instanceof Error ? e.message : 'Failed to load report history';
      setError(msg);
    }
  }, [selectedMonth]);

  const loadReport = useCallback(async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const r = await getMonthlyReport(month);
      setReport(r);
    } catch (e) {
      const msg = typeof e === 'string' ? e : e instanceof Error ? e.message : 'Failed to load report';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (selectedMonth) void loadReport(selectedMonth);
  }, [selectedMonth, loadReport]);

  const monthOptions = useMemo(() => {
    if (!history?.months) return [];
    return history.months.map((m) => ({ value: (() => { const d = new Date(m.monthYear); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; })(), label: formatMonth(m.monthYear) }));
  }, [history]);

  const currentIndex = useMemo(() => monthOptions.findIndex((o) => o.value === selectedMonth), [monthOptions, selectedMonth]);
  const canPrev = currentIndex >= 0 && currentIndex < monthOptions.length - 1;
  const canNext = currentIndex > 0;

  const onPrev = () => {
    if (canPrev) setSelectedMonth(monthOptions[currentIndex + 1].value);
  };
  const onNext = () => {
    if (canNext) setSelectedMonth(monthOptions[currentIndex - 1].value);
  };

  const categoryData: CategoryItem[] = useMemo(() => (report?.hasData && report.report ? report.report.categoryBreakdown : []), [report]);


  const compareData = useMemo(() => {
    if (!report?.hasData || !report.report) return [] as { name: string; value: number }[];
    return [
      { name: 'Income', value: report.report.income },
      { name: 'Expenses', value: report.report.totalExpenses },
      { name: 'Savings', value: report.report.savingsAmount },
    ];
  }, [report]);

  const esVsDsData = useMemo(() => {
    if (!report?.hasData || !report.report) return [] as { name: string; value: number }[];
    return [
      { name: 'Essential', value: report.report.essentialVsDiscretionary.essential },
      { name: 'Discretionary', value: report.report.essentialVsDiscretionary.discretionary },
    ];
  }, [report]);

  const trendAnalysis = report?.report?.trendAnalysis;
  const trendMonths = useMemo(() => trendAnalysis?.months ?? [], [trendAnalysis]);
  const trendStats = trendAnalysis?.stats;
  const trendChartData = useMemo(() => trendMonths.map((m) => ({
    month: formatMonth(m.monthYear),
    expenses: m.totalExpenses,
    savings: m.savingsAmount,
  })), [trendMonths]);

  const healthScoreLineData = useMemo(() => trendMonths.map((m) => ({
    month: formatMonth(m.monthYear),
    score: m.assessment?.financialHealthScore ?? null,
    stressLevel: m.assessment?.financialStressLevel ?? null,
  })), [trendMonths]);

  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);

  const categoryTimelineOptions = useMemo(
    () => categoryData.map((c) => ({ key: c.key, label: c.label })),
    [categoryData],
  );

  useEffect(() => {
    if (!selectedCategoryKey && categoryTimelineOptions.length) {
      setSelectedCategoryKey(categoryTimelineOptions[0].key);
    }
  }, [selectedCategoryKey, categoryTimelineOptions]);

  const categoryTimelineData = useMemo(() => {
    if (!trendMonths.length || !selectedCategoryKey) return [] as { month: string; amount: number }[];
    return trendMonths.map((m) => {
      const raw = (m as any).categories?.[selectedCategoryKey];
      const amount = typeof raw === 'number' ? raw : Number(raw ?? 0);
      return {
        month: formatMonth(m.monthYear),
        amount: Number.isFinite(amount) ? amount : 0,
      };
    });
  }, [trendMonths, selectedCategoryKey]);

  const monthOverMonth = report?.report?.monthOverMonth;
  const categoryInsights = report?.report?.categoryInsights;

  const renderCategoryLabel = useCallback((props: any) => {
    if (!props) return null;
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index } = props;
    if (!categoryData[index]) return null;
    const RADIAN = Math.PI / 180;
    // Increased threshold to 8% to avoid cramping
    if (!percent || percent < 0.08) return null;

    // Adjust positioning for better symmetry (0.55 instead of 0.6)
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const pctValue = percent * 100;
    const pct = pctValue >= 10 ? pctValue.toFixed(0) : pctValue.toFixed(1);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '15px',
          fontWeight: '600',
          textShadow: '0 2px 6px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.8)',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: 1,
        }}
      >
        {`${pct}%`}
      </text>
    );
  }, [categoryData]);

  return (
    <div className="relative min-h-screen bg-cream-200 text-warmgray-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-cream-200 via-cream-100 to-warmgray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full filter blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/8 rounded-full filter blur-3xl" />
        </div>
      </div>

      <div className="relative z-10 min-h-screen">
        <Header />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 lg:pt-20 pb-16 space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div>
              <h1 className="text-3xl font-bold text-warmgray-900 dark:text-white">Monthly Report</h1>
              <p className="mt-1 text-sm text-warmgray-600 dark:text-slate-400">Detailed breakdown for your selected month</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onPrev} disabled={!canPrev} className="px-3 py-1.5 rounded-lg border border-warmgray-300 bg-white text-warmgray-700 text-xs font-semibold disabled:opacity-50 hover:bg-warmgray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">Prev</button>
              <select
                className="px-3 py-1.5 rounded-lg border border-warmgray-300 bg-white text-warmgray-900 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                value={selectedMonth ?? ''}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white text-warmgray-900 dark:bg-slate-900 dark:text-white">{opt.label}</option>
                ))}
              </select>
              <button type="button" onClick={onNext} disabled={!canNext} className="px-3 py-1.5 rounded-lg border border-warmgray-300 bg-white text-warmgray-700 text-xs font-semibold disabled:opacity-50 hover:bg-warmgray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">Next</button>
            </div>
          </div>

          {error && <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>}

          {!history?.months?.length && (
            <div className="rounded-2xl border border-dashed border-warmgray-300 bg-warmgray-50/50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/60">
              <h3 className="text-2xl font-semibold text-warmgray-900 dark:text-white">No report data available</h3>
              <p className="mt-3 text-sm text-warmgray-600 dark:text-slate-300">Add your first monthly expenses to generate a report.</p>
              <div className="mt-6 flex justify-center">
                <button type="button" onClick={() => navigate('/add-expenses')} className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-emerald-500/25 transition hover:from-emerald-600 hover:to-teal-600 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">Add Expenses</button>
              </div>
            </div>
          )}

          {loading && (
            <div className="space-y-6 animate-pulse">
              <div className="h-24 rounded-2xl bg-white/10" />
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-72 rounded-2xl bg-white/10" />
                <div className="h-72 rounded-2xl bg-white/10" />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-72 rounded-2xl bg-white/10" />
                <div className="h-72 rounded-2xl bg-white/10" />
              </div>
            </div>
          )}

          {!loading && report?.hasData && report.report && (
            <>
              <SectionCard title="Report Overview" right={<ScoreBadge score={report.assessment?.financialHealthScore} />}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-white border border-warmgray-300 px-4 py-4 dark:bg-white/5 dark:border-white/10">
                    <p className="text-xs text-warmgray-700 dark:text-slate-400">Month</p>
                    <p className="mt-2 text-xl font-semibold text-warmgray-900 dark:text-white">{formatMonth(report.report.monthYear)}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-warmgray-300 px-4 py-4 dark:bg-white/5 dark:border-white/10">
                    <p className="text-xs text-warmgray-700 dark:text-slate-400">Income</p>
                    <p className="mt-2 text-xl font-semibold text-warmgray-900 dark:text-white">{formatCurrency(report.report.income)}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-warmgray-300 px-4 py-4 dark:bg-white/5 dark:border-white/10">
                    <p className="text-xs text-warmgray-700 dark:text-slate-400">Expenses</p>
                    <p className="mt-2 text-xl font-semibold text-warmgray-900 dark:text-white">{formatCurrency(report.report.totalExpenses)}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-warmgray-300 px-4 py-4 dark:bg-white/5 dark:border-white/10">
                    <p className="text-xs text-warmgray-700 dark:text-slate-400">Savings</p>
                    <p className={`mt-2 text-xl font-semibold ${(report.report.savingsAmount ?? 0) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-warmgray-900 dark:text-white'}`}>
                      {formatCurrency(report.report.savingsAmount)} <span className="text-warmgray-700 dark:text-slate-400 text-sm font-normal">({formatPercent(report.report.savingsRate)})</span>
                    </p>
                    {(() => {
                      const pct = Math.max(0, Math.min(100, Math.round((report.report.savingsRate || 0) * 100)));
                      const color = pct >= 20 ? 'bg-emerald-500' : pct >= 10 ? 'bg-amber-500' : 'bg-rose-500';
                      return (
                        <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                          <div className={`h-2 ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </SectionCard>

              <div className="grid gap-6 lg:grid-cols-2 items-stretch">
                <SectionCard title="Spending by Category">
                  <div
                    className="flex items-center justify-center h-[350px] py-6"
                    onMouseLeave={() => {
                      setActiveIndex(null);
                      setHoverSource(null);
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="amount"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={130}
                          paddingAngle={2}
                          labelLine={false}
                          label={renderCategoryLabel}
                          onMouseEnter={(_, index) => {
                            setActiveIndex(index);
                            setHoverSource('chart');
                          }}
                          onMouseLeave={() => {
                            setActiveIndex(null);
                            setHoverSource(null);
                          }}
                          animationBegin={0}
                          animationDuration={800}
                          animationEasing="ease-out"
                          isAnimationActive={!hasAnimatedRef.current}
                          onAnimationEnd={() => { hasAnimatedRef.current = true; }}
                        >
                          {categoryData.map((_, i) => (
                            <Cell
                              key={`cell-${i}`}
                              fill={COLORS[i % COLORS.length]}
                              stroke={activeIndex === i ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.8)'}
                              strokeWidth={activeIndex === i ? 3 : 2}
                              opacity={activeIndex === null ? 1 : activeIndex === i ? 1 : 0.4}
                              style={{
                                filter: activeIndex === i
                                  ? 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.6))'
                                  : 'none',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                              }}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length && activeIndex !== null && hoverSource === 'chart') {
                              const data = payload[0].payload;
                              return (
                                <div className="rounded-lg border border-white/20 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-200">
                                  <p className="text-sm font-semibold text-white">{data.label}</p>
                                  <p className="text-sm text-slate-300 mt-1">
                                    {formatCurrency(data.amount)}
                                    <span className="ml-2 text-xs text-slate-400">({percentFormatter.format(data.percent)})</span>
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-3 max-h-[280px] overflow-y-auto overflow-x-hidden custom-scrollbar p-2">
                    {categoryData.map((c, idx) => (
                      <div
                        key={c.key}
                        className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-lg"
                        onMouseEnter={() => {
                          setActiveIndex(idx);
                          setHoverSource('list');
                        }}
                        onMouseLeave={() => {
                          setActiveIndex(null);
                          setHoverSource(null);
                        }}
                        style={{
                          borderColor: activeIndex === idx ? COLORS[idx % COLORS.length] : 'rgba(255, 255, 255, 0.1)',
                          backgroundColor: activeIndex === idx ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-sm text-warmgray-700 dark:text-slate-200 flex-1">{c.label}</span>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-warmgray-900 dark:text-white">
                            {formatCurrency(c.amount)}
                          </div>
                          <div className="text-xs text-warmgray-500 dark:text-slate-400">
                            {percentFormatter.format(c.percent)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Financial Health & Risks" right={<ScoreBadge score={report.assessment?.financialHealthScore} />}>
                  <div className="grid gap-3 grid-cols-2">
                    <div className="rounded-xl bg-white border border-warmgray-300 px-4 py-4 dark:bg-white/5 dark:border-white/10">
                      <p className="text-xs text-warmgray-700 dark:text-slate-400">Debt-to-Income</p>
                      <p className="mt-2 text-xl font-semibold text-warmgray-900 dark:text-white">{formatPercent(report.report.debt.debtToIncomeRatio)}</p>
                      <p className="text-[11px] mt-1 text-warmgray-700 dark:text-slate-500">Many lenders consider below ~36% a healthy range.</p>
                    </div>
                    <div className="rounded-xl bg-white border border-warmgray-300 px-4 py-4 dark:bg-white/5 dark:border-white/10">
                      <p className="text-xs text-warmgray-700 dark:text-slate-400">Housing Cost Ratio</p>
                      <p className="mt-2 text-xl font-semibold text-warmgray-900 dark:text-white">{formatPercent(report.report.housingCostRatio)}</p>
                      <p className="text-[11px] mt-1 text-warmgray-700 dark:text-slate-500">Typical guideline: ~25–30% (slightly higher is common in urban areas).</p>
                    </div>
                    <div className="rounded-xl bg-white border border-warmgray-300 px-4 py-4 dark:bg-white/5 dark:border-white/10">
                      <p className="text-xs text-warmgray-700 dark:text-slate-400">Total Debt</p>
                      <p className="mt-2 text-xl font-semibold text-warmgray-900 dark:text-white">{formatCurrency(report.report.debt.totalDebt)}</p>
                    </div>
                    <div className="rounded-xl bg-white border border-warmgray-300 px-4 py-4 dark:bg-white/5 dark:border-white/10">
                      <p className="text-xs text-warmgray-700 dark:text-slate-400">Monthly Debt Payments</p>
                      <p className="mt-2 text-xl font-semibold text-warmgray-900 dark:text-white">{formatCurrency(report.report.debt.monthlyDebtPayments)}</p>
                    </div>
                  </div>
                  {/* Emergency Fund Indicator */}
                  <div className="mt-4 grid gap-3 grid-cols-2">
                    <div className="rounded-xl bg-white border border-warmgray-300 px-4 py-4 dark:bg-white/5 dark:border-white/10">
                      <p className="text-xs text-warmgray-700 dark:text-slate-400">Emergency Fund</p>
                      <p className="mt-2 text-xl font-semibold text-warmgray-900 dark:text-white">{(report.report as any).emergencyFundMonths ?? 0} months</p>
                      <p className="text-xs mt-1 text-warmgray-700 dark:text-slate-400">{((report.report as any).emergencyFundMonths ?? 0) >= 3 ? 'Within typical 3–6 months guideline' : 'Below typical 3–6 months guideline'}</p>
                    </div>
                    {report.assessment && (
                      <div className="rounded-xl bg-white border border-warmgray-300 px-4 py-4 dark:bg-white/5 dark:border-white/10">
                        <p className="text-xs text-warmgray-700 dark:text-slate-400">Attention Level</p>
                        <p className="mt-2 text-xl font-semibold text-warmgray-900 dark:text-white capitalize">{report.assessment.optimizationPriority}</p>
                        <p className="text-xs mt-1 text-warmgray-700 dark:text-slate-400">Attention score: {report.assessment.optimizationUrgency ?? 'N/A'}/10</p>
                      </div>
                    )}
                  </div>
                  {report.assessment && report.assessment.top3ProblemAreas.length > 0 && (
                    <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-4">
                      <p className="text-sm font-semibold text-white mb-2">Top Problem Areas</p>
                      <ul className="list-disc list-inside text-sm text-slate-200">
                        {report.assessment.top3ProblemAreas.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </SectionCard>
              </div>

              {categoryTimelineData.length > 0 && (
                <SectionCard
                  title="Spending Trend by Category"
                  right={(
                    <select
                      className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white text-xs"
                      value={selectedCategoryKey ?? ''}
                      onChange={(e) => setSelectedCategoryKey(e.target.value)}
                    >
                      {categoryTimelineOptions.map((opt) => (
                        <option key={opt.key} value={opt.key} className="bg-slate-900 text-white">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                >
                  <div className="h-72 py-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={categoryTimelineData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="4 8" stroke="rgba(148,163,184,0.2)" />
                        <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(value) => currencyFormatter.format(value as number)} width={80} />
                        <Tooltip
                          formatter={(value) => formatCurrency(value as number)}
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <Line type="monotone" dataKey="amount" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>
              )}

              <div className="grid gap-6 lg:grid-cols-2 items-stretch">
                <SectionCard title="Income vs Expenses">
                  <div className="h-72 py-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={compareData}
                        margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                        onMouseMove={(state: any) => {
                          if (state.isTooltipActive) {
                            setActiveIncomeIndex(state.activeTooltipIndex);
                          } else {
                            setActiveIncomeIndex(null);
                          }
                        }}
                        onMouseLeave={() => setActiveIncomeIndex(null)}
                      >
                        <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <Tooltip
                          cursor={false}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const entry = payload[0];
                              const value = entry.value as number;
                              const total = compareData.reduce((sum, d) => sum + (d.value || 0), 0);
                              const pct = total > 0 ? value / total : null;
                              return (
                                <div className="rounded-lg border border-white/10 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md">
                                  <p className="text-xs font-semibold text-slate-300 mb-1">{label}</p>
                                  <p className="text-sm font-bold text-white">{formatCurrency(value)}</p>
                                  {pct !== null && (
                                    <p className="text-xs text-slate-400 mt-0.5">{percentFormatter.format(pct)} of total</p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1000}>
                          {compareData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill="#60a5fa"
                              style={{
                                filter: activeIncomeIndex === index
                                  ? 'brightness(1.2) drop-shadow(0 0 8px rgba(96, 165, 250, 0.5))'
                                  : activeIncomeIndex !== null
                                    ? 'opacity(0.5)'
                                    : 'none',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer'
                              }}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>
                <SectionCard
                  title="Essential vs Discretionary"
                  right={(
                    <span className="text-xs text-slate-400">
                      {(() => {
                        const v = report.report.meets_50_30_20_rule;
                        if (v === null || v === undefined) return '50/30/20: Not applicable (income 0 or missing)';
                        return v ? '50/30/20: On track' : '50/30/20: May need adjustment';
                      })()}
                    </span>
                  )}
                >
                  <div className="h-72 py-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={esVsDsData}
                        margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                        onMouseMove={(state: any) => {
                          if (state.isTooltipActive) {
                            setActiveEssentialIndex(state.activeTooltipIndex);
                          } else {
                            setActiveEssentialIndex(null);
                          }
                        }}
                        onMouseLeave={() => setActiveEssentialIndex(null)}
                      >
                        <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <Tooltip
                          cursor={false}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const entry = payload[0];
                              const value = entry.value as number;
                              const total = esVsDsData.reduce((sum, d) => sum + (d.value || 0), 0);
                              const pct = total > 0 ? value / total : null;
                              return (
                                <div className="rounded-lg border border-white/10 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md">
                                  <p className="text-xs font-semibold text-slate-300 mb-1">{label}</p>
                                  <p className="text-sm font-bold text-white">{formatCurrency(value)}</p>
                                  {pct !== null && (
                                    <p className="text-xs text-slate-400 mt-0.5">{percentFormatter.format(pct)} of total</p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1000}>
                          {esVsDsData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill="#22c55e"
                              style={{
                                filter: activeEssentialIndex === index
                                  ? 'brightness(1.2) drop-shadow(0 0 8px rgba(34, 197, 94, 0.5))'
                                  : activeEssentialIndex !== null
                                    ? 'opacity(0.5)'
                                    : 'none',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer'
                              }}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>
              </div>

              {monthOverMonth && (
                <SectionCard title="Month-over-Month Change" right={monthOverMonth.previousMonth ? <span className="text-xs text-slate-400">vs {formatMonth(monthOverMonth.previousMonth)}</span> : null}>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                      <p className="text-xs text-slate-400">Expense Change</p>
                      <p className="mt-2 text-xl font-semibold text-white">{formatSignedCurrency(monthOverMonth.expenseDelta)}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                      <p className="text-xs text-slate-400">Savings Change</p>
                      <p className="mt-2 text-xl font-semibold text-white">{formatSignedCurrency(monthOverMonth.savingsDelta)}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                      <p className="text-xs text-slate-400">Spending vs Last Month</p>
                      <p className="mt-2 text-xl font-semibold text-white">{formatSignedPercent((monthOverMonth.spendingVsLastMonthPercentage ?? null) !== null ? (monthOverMonth.spendingVsLastMonthPercentage ?? 0) / 100 : null)}</p>
                    </div>
                  </div>
                </SectionCard>
              )}

              {trendChartData.length > 0 && (
                <SectionCard title="Expense & Savings Trend" right={<span className="text-xs text-slate-400">Last {trendChartData.length} months</span>}>
                  <div className="h-80 py-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendChartData} margin={{ top: 15, right: 30, left: 10, bottom: 15 }}>
                        <CartesianGrid strokeDasharray="4 8" stroke="rgba(148,163,184,0.2)" />
                        <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(value) => currencyFormatter.format(value)} width={80} />
                        <Tooltip
                          formatter={(value, name) => [currencyFormatter.format(value as number), name === 'expenses' ? 'Expenses' : 'Savings']}
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <Legend wrapperStyle={{ color: '#cbd5f5', paddingTop: '15px' }} />
                        <Line type="monotone" dataKey="expenses" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="Expenses" />
                        <Line type="monotone" dataKey="savings" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Savings" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {trendStats && (
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                        <p className="text-xs text-slate-400">Avg Monthly Expenses</p>
                        <p className="mt-2 text-xl font-semibold text-white">{formatCurrency(trendStats.avgMonthlyExpenses)}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                        <p className="text-xs text-slate-400">Avg Savings Rate</p>
                        <p className="mt-2 text-xl font-semibold text-white">{formatPercent(trendStats.avgSavingsRate)}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                        <p className="text-xs text-slate-400">Total Savings (period)</p>
                        <p className="mt-2 text-xl font-semibold text-white">{formatCurrency(trendStats.totalSavings)}</p>
                      </div>
                    </div>
                  )}
                </SectionCard>
              )}

              {healthScoreLineData.length > 0 && (
                <SectionCard title="Financial Health Timeline">
                  <div className="h-64 py-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={healthScoreLineData} margin={{ top: 15, right: 40, left: 10, bottom: 15 }}>
                        <CartesianGrid strokeDasharray="4 8" stroke="rgba(148,163,184,0.2)" />
                        <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} domain={[0, 100]} width={60} />
                        <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} domain={[1, 5]} width={40} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                        <Legend wrapperStyle={{ color: '#cbd5f5', paddingTop: '15px' }} />
                        <Line yAxisId="left" type="monotone" dataKey="score" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} name="Health Score" />
                        <Line yAxisId="right" type="monotone" dataKey="stressLevel" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} name="Stress Level" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {trendStats && (
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                        <p className="text-xs text-slate-400">Avg Health Score</p>
                        <p className="mt-2 text-xl font-semibold text-white">{trendStats.avgFinancialHealthScore !== null ? Math.round(trendStats.avgFinancialHealthScore) : '—'}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                        <p className="text-xs text-slate-400">Score Range</p>
                        <p className="mt-2 text-xl font-semibold text-white">{trendStats.highestFinancialHealthScore !== null && trendStats.lowestFinancialHealthScore !== null ? `${trendStats.lowestFinancialHealthScore} – ${trendStats.highestFinancialHealthScore}` : '—'}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                        <p className="text-xs text-slate-400">Most Challenging Month</p>
                        <p className="mt-2 text-xl font-semibold text-white">{trendStats.mostChallengingMonth ? formatMonth(trendStats.mostChallengingMonth.monthYear) : '—'}</p>
                      </div>
                    </div>
                  )}
                </SectionCard>
              )}

              {(categoryInsights?.topIncreases?.length ?? 0) + (categoryInsights?.topDecreases?.length ?? 0) > 0 && (
                <SectionCard title="Category Insights">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-white mb-3">Top Increases</p>
                      <div className="space-y-2">
                        {(categoryInsights?.topIncreases ?? []).map((item) => (
                          <div key={item.key} className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                            <div>
                              <p className="text-sm text-white">{item.label}</p>
                              <p className="text-xs text-slate-400">Prev {formatCurrency(item.prior)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-white">{formatSignedCurrency(item.change)}</p>
                              <p className="text-xs text-emerald-400">{formatSignedPercent(item.percentChange)}</p>
                            </div>
                          </div>
                        ))}
                        {(categoryInsights?.topIncreases ?? []).length === 0 && <p className="text-xs text-slate-400">No increases detected.</p>}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-3">Top Decreases</p>
                      <div className="space-y-2">
                        {(categoryInsights?.topDecreases ?? []).map((item) => (
                          <div key={item.key} className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                            <div>
                              <p className="text-sm text-white">{item.label}</p>
                              <p className="text-xs text-slate-400">Prev {formatCurrency(item.prior)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-white">{formatSignedCurrency(item.change)}</p>
                              <p className="text-xs text-rose-400">{formatSignedPercent(item.percentChange)}</p>
                            </div>
                          </div>
                        ))}
                        {(categoryInsights?.topDecreases ?? []).length === 0 && <p className="text-xs text-slate-400">No decreases detected.</p>}
                      </div>
                    </div>
                  </div>
                </SectionCard>
              )}

            </>
          )}

          {!loading && report && report.hasData === false && (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-12 text-center">
              <h3 className="text-2xl font-semibold text-white">No data for selected month</h3>
              <p className="mt-3 text-sm text-slate-300">Add expenses for this month to generate a report.</p>
              <div className="mt-6 flex justify-center">
                <button type="button" onClick={() => navigate('/add-expenses')} className="inline-flex items-center rounded-full bg-white text-slate-900 px-6 py-3 text-sm font-semibold transition hover:bg-slate-100">Add Expenses</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MonthlyReport;
