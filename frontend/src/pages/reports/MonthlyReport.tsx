import { useEffect, useMemo, useState, useCallback } from 'react';
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
const LABEL_MIN_PERCENT = 0.035;

const ScoreBadge = ({ score }: { score: number | undefined }) => {
  if (score === undefined || score === null) return null;
  const tone = score >= 80 ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' : score >= 65 ? 'bg-amber-500/20 text-amber-200 border-amber-400/30' : 'bg-rose-500/20 text-rose-200 border-rose-400/30';
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${tone}`}>Score {score}/100</span>;
};

const SectionCard = ({ children, title, right }: { children: React.ReactNode; title: string; right?: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 py-5 sm:px-6 sm:py-6 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.9)]">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {right}
    </div>
    {children}
  </div>
);

const MonthlyReport = () => {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [report, setReport] = useState<MonthlyReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const healthDistributionEntries = useMemo(() => Object.entries(trendStats?.overallHealthDistribution ?? {}), [trendStats]);
  const flagCounts = trendStats?.flagCounts ?? ({} as Record<string, number>);
  const sortedFlagCounts = useMemo(() => Object.entries(flagCounts).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)), [flagCounts]);

  const monthOverMonth = report?.report?.monthOverMonth;
  const profileSummary = report?.report?.profileSummary;
  const categoryInsights = report?.report?.categoryInsights;
  const datasetHealthRecord = report?.report?.datasetHealthRecord ?? null;
  const assessmentSource = report?.report?.assessmentSource ?? 'computed';

  const renderCategoryLabel = useCallback((props: any) => {
    if (!props) return null;
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index } = props;
    if (!categoryData[index]) return null;
    const RADIAN = Math.PI / 180;
    if (!percent || percent < LABEL_MIN_PERCENT) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const pctValue = percent * 100;
    const pct = pctValue >= 10 ? pctValue.toFixed(0) : pctValue.toFixed(1);
    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-sm font-bold"
        style={{ 
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5)',
          pointerEvents: 'none'
        }}
      >
        {`${pct}%`}
      </text>
    );
  }, [categoryData]);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
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
              <h1 className="text-3xl font-bold text-white">Monthly Report</h1>
              <p className="mt-1 text-sm text-slate-400">Detailed breakdown for your selected month</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onPrev} disabled={!canPrev} className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white text-xs font-semibold disabled:opacity-50">Prev</button>
              <select
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white text-sm"
                value={selectedMonth ?? ''}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">{opt.label}</option>
                ))}
              </select>
              <button type="button" onClick={onNext} disabled={!canNext} className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white text-xs font-semibold disabled:opacity-50">Next</button>
            </div>
          </div>

          {error && <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>}

          {!history?.months?.length && (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-12 text-center">
              <h3 className="text-2xl font-semibold text-white">No report data available</h3>
              <p className="mt-3 text-sm text-slate-300">Add your first monthly expenses to generate a report.</p>
              <div className="mt-6 flex justify-center">
                <button type="button" onClick={() => navigate('/add-expenses')} className="inline-flex items-center rounded-full bg-white text-slate-900 px-6 py-3 text-sm font-semibold transition hover:bg-slate-100">Add Expenses</button>
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
                  <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                    <p className="text-xs text-slate-400">Month</p>
                    <p className="mt-2 text-xl font-semibold text-white">{formatMonth(report.report.monthYear)}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                    <p className="text-xs text-slate-400">Income</p>
                    <p className="mt-2 text-xl font-semibold text-white">{formatCurrency(report.report.income)}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                    <p className="text-xs text-slate-400">Expenses</p>
                    <p className="mt-2 text-xl font-semibold text-white">{formatCurrency(report.report.totalExpenses)}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                    <p className="text-xs text-slate-400">Savings</p>
                    <p className="mt-2 text-xl font-semibold text-white">{formatCurrency(report.report.savingsAmount)} <span className="text-slate-400 text-sm font-normal">({formatPercent(report.report.savingsRate)})</span></p>
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
                <SectionCard title="Income vs Expenses">
                  <div className="h-72 py-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={compareData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                        <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <Tooltip formatter={(value: any) => formatCurrency(value as number)} cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                        <Bar dataKey="value" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>
                <SectionCard title="Essential vs Discretionary" right={<span className="text-xs text-slate-400">50/30/20: {report.report.meets_50_30_20_rule ? 'On track' : 'Adjust mix'}</span>}>
                  <div className="h-72 py-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={esVsDsData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                        <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <Tooltip formatter={(value: any) => formatCurrency(value as number)} cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                        <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 items-stretch">
                <SectionCard title="Spending by Category">
                  <div className="flex items-center justify-center h-[350px] py-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="amount"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={75}
                          outerRadius={130}
                          paddingAngle={3}
                          labelLine={false}
                          label={renderCategoryLabel}
                        >
                          {categoryData.map((_, i) => (
                            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} stroke="rgba(15, 23, 42, 0.8)" strokeWidth={2} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar">
                    {categoryData.map((c, idx) => (
                      <div key={c.key} className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 hover:bg-white/10 transition-colors">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-sm text-slate-200 flex-1">{c.label}</span>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-white">
                            {formatCurrency(c.amount)}
                          </div>
                          <div className="text-xs text-slate-400">
                            {percentFormatter.format(c.percent)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Financial Health & Risks" right={<ScoreBadge score={report.assessment?.financialHealthScore} />}>
                  <div className="grid gap-3 grid-cols-2">
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                      <p className="text-xs text-slate-400">Debt-to-Income</p>
                      <p className="mt-2 text-xl font-semibold text-white">{formatPercent(report.report.debt.debtToIncomeRatio)}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                      <p className="text-xs text-slate-400">Housing Cost Ratio</p>
                      <p className="mt-2 text-xl font-semibold text-white">{formatPercent(report.report.housingCostRatio)}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                      <p className="text-xs text-slate-400">Total Debt</p>
                      <p className="mt-2 text-xl font-semibold text-white">{formatCurrency(report.report.debt.totalDebt)}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                      <p className="text-xs text-slate-400">Monthly Debt Payments</p>
                      <p className="mt-2 text-xl font-semibold text-white">{formatCurrency(report.report.debt.monthlyDebtPayments)}</p>
                    </div>
                  </div>
                  {/* Emergency Fund Indicator */}
                  <div className="mt-4 grid gap-3 grid-cols-2">
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                      <p className="text-xs text-slate-400">Emergency Fund</p>
                      <p className="mt-2 text-xl font-semibold text-white">{(report.report as any).emergencyFundMonths ?? 0} months</p>
                      <p className="text-xs mt-1 text-slate-400">{((report.report as any).emergencyFundMonths ?? 0) >= 3 ? 'Adequate (3-6 months)' : 'Needs attention (target 3+ months)'}</p>
                    </div>
                    {report.assessment && (
                      <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                        <p className="text-xs text-slate-400">Optimization Priority</p>
                        <p className="mt-2 text-xl font-semibold text-white capitalize">{report.assessment.optimizationPriority}</p>
                        <p className="text-xs mt-1 text-slate-400">Urgency: {report.assessment.optimizationUrgency ?? 'N/A'}/10</p>
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

              {report.assessment && (
                <SectionCard title="Current Month Health Indicators" right={
                  report.assessment.overallFinancialHealth ? (
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      report.assessment.overallFinancialHealth === 'excellent' ? 'bg-emerald-500/20 text-emerald-400' :
                      report.assessment.overallFinancialHealth === 'good' ? 'bg-green-500/20 text-green-400' :
                      report.assessment.overallFinancialHealth === 'fair' ? 'bg-yellow-500/20 text-yellow-400' :
                      report.assessment.overallFinancialHealth === 'poor' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-rose-500/20 text-rose-400'
                    }`}>
                      Overall: {report.assessment.overallFinancialHealth}
                    </span>
                  ) : null
                }>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Risk Flags */}
                    <div>
                      <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
                        Risk Flags
                      </p>
                      <div className="space-y-2">
                        {report.assessment.needsEmergencyFund && (
                          <div className="flex items-center justify-between rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2">
                            <span className="text-sm text-slate-200">⚠️ Needs Emergency Fund</span>
                            <span className="text-xs text-rose-400">Active</span>
                          </div>
                        )}
                        {report.assessment.insufficientSavings && (
                          <div className="flex items-center justify-between rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2">
                            <span className="text-sm text-slate-200">⚠️ Insufficient Savings</span>
                            <span className="text-xs text-rose-400">Active</span>
                          </div>
                        )}
                        {report.assessment.highDebtBurden && (
                          <div className="flex items-center justify-between rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2">
                            <span className="text-sm text-slate-200">⚠️ High Debt Burden</span>
                            <span className="text-xs text-rose-400">Active</span>
                          </div>
                        )}
                        {report.assessment.housingCostTooHigh && (
                          <div className="flex items-center justify-between rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2">
                            <span className="text-sm text-slate-200">⚠️ Housing Cost Too High</span>
                            <span className="text-xs text-rose-400">Active</span>
                          </div>
                        )}
                        {report.assessment.overspendingRestaurants && (
                          <div className="flex items-center justify-between rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-2">
                            <span className="text-sm text-slate-200">⚠️ Overspending: Restaurants</span>
                            <span className="text-xs text-orange-400">Active</span>
                          </div>
                        )}
                        {report.assessment.overspendingEntertainment && (
                          <div className="flex items-center justify-between rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-2">
                            <span className="text-sm text-slate-200">⚠️ Overspending: Entertainment</span>
                            <span className="text-xs text-orange-400">Active</span>
                          </div>
                        )}
                        {report.assessment.overspendingSubscriptions && (
                          <div className="flex items-center justify-between rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-2">
                            <span className="text-sm text-slate-200">⚠️ Overspending: Subscriptions</span>
                            <span className="text-xs text-orange-400">Active</span>
                          </div>
                        )}
                        {report.assessment.lifestyleInflationDetected && (
                          <div className="flex items-center justify-between rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2">
                            <span className="text-sm text-slate-200">⚠️ Lifestyle Inflation Detected</span>
                            <span className="text-xs text-yellow-400">Active</span>
                          </div>
                        )}
                        {report.assessment.irregularSavingsPattern && (
                          <div className="flex items-center justify-between rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2">
                            <span className="text-sm text-slate-200">⚠️ Irregular Savings Pattern</span>
                            <span className="text-xs text-yellow-400">Active</span>
                          </div>
                        )}
                        {!report.assessment.needsEmergencyFund && 
                         !report.assessment.insufficientSavings && 
                         !report.assessment.highDebtBurden && 
                         !report.assessment.housingCostTooHigh &&
                         !report.assessment.overspendingRestaurants &&
                         !report.assessment.overspendingEntertainment &&
                         !report.assessment.overspendingSubscriptions &&
                         !report.assessment.lifestyleInflationDetected &&
                         !report.assessment.irregularSavingsPattern && (
                          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-4 text-center">
                            <span className="text-sm text-emerald-400">✓ No active risk flags detected</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Positive Indicators */}
                    <div>
                      <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                        Positive Indicators
                      </p>
                      <div className="space-y-2">
                        {report.assessment.hasAdequateEmergencyFund && (
                          <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                            <span className="text-sm text-slate-200">✓ Adequate Emergency Fund</span>
                            <span className="text-xs text-emerald-400">Achieved</span>
                          </div>
                        )}
                        {report.assessment.healthySavingsRate && (
                          <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                            <span className="text-sm text-slate-200">✓ Healthy Savings Rate</span>
                            <span className="text-xs text-emerald-400">Achieved</span>
                          </div>
                        )}
                        {report.assessment.controlledDiscretionarySpending && (
                          <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                            <span className="text-sm text-slate-200">✓ Controlled Discretionary Spending</span>
                            <span className="text-xs text-emerald-400">Achieved</span>
                          </div>
                        )}
                        {report.assessment.lowDebtBurden && (
                          <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                            <span className="text-sm text-slate-200">✓ Low Debt Burden</span>
                            <span className="text-xs text-emerald-400">Achieved</span>
                          </div>
                        )}
                        {!report.assessment.hasAdequateEmergencyFund && 
                         !report.assessment.healthySavingsRate && 
                         !report.assessment.controlledDiscretionarySpending && 
                         !report.assessment.lowDebtBurden && (
                          <div className="rounded-lg bg-slate-500/10 border border-slate-500/20 px-3 py-4 text-center">
                            <span className="text-sm text-slate-400">No positive indicators yet — keep working towards your goals!</span>
                          </div>
                        )}
                      </div>
                      {report.assessment.needsOptimization !== null && (
                        <div className={`mt-4 rounded-xl border px-4 py-4 ${
                          report.assessment.needsOptimization 
                            ? 'bg-amber-500/10 border-amber-500/20' 
                            : 'bg-emerald-500/10 border-emerald-500/20'
                        }`}>
                          <p className="text-xs text-slate-400">Optimization Status</p>
                          <p className={`mt-2 text-lg font-semibold ${
                            report.assessment.needsOptimization ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {report.assessment.needsOptimization ? '⚡ Optimization Recommended' : '✓ On Track'}
                          </p>
                          {report.assessment.optimizationUrgency !== null && report.assessment.needsOptimization && (
                            <p className="text-xs mt-1 text-slate-400">Priority Level: {report.assessment.optimizationUrgency}/10</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </SectionCard>
              )}

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

              {(sortedFlagCounts.length > 0 || healthDistributionEntries.length > 0 || datasetHealthRecord) && (
                <SectionCard title="Risk Flags & Health Distribution">
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                      <p className="text-sm font-semibold text-white mb-3">Frequent Flags</p>
                      <ul className="space-y-2">
                        {sortedFlagCounts.slice(0, 6).map(([flag, count]) => (
                          <li key={flag} className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-200">
                            <span className="capitalize">{flag.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-slate-400">{count}</span>
                          </li>
                        ))}
                        {sortedFlagCounts.length === 0 && <li className="text-xs text-slate-400">No recurring risk flags detected in the trend window.</li>}
                      </ul>
                    </div>
                    <div className="lg:col-span-1">
                      <p className="text-sm font-semibold text-white mb-3">Health Distribution</p>
                      <ul className="space-y-2">
                        {healthDistributionEntries.map(([label, count]) => (
                          <li key={label} className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-200">
                            <span className="capitalize">{label}</span>
                            <span className="text-slate-400">{count}</span>
                          </li>
                        ))}
                        {healthDistributionEntries.length === 0 && <li className="text-xs text-slate-400">No historical health records found.</li>}
                      </ul>
                    </div>
                    <div className="lg:col-span-1">
                      <p className="text-sm font-semibold text-white mb-3">Assessment Source</p>
                      <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4 text-sm text-slate-200">
                        <p><span className="text-slate-400">Latest Assessment:</span> {assessmentSource === 'dataset' ? 'Dataset Record' : 'Computed from current data'}</p>
                        {datasetHealthRecord && (
                          <p className="mt-2 text-xs text-slate-400">Dataset provided financial health insight for this month, overriding computed values.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </SectionCard>
              )}

              {profileSummary && (
                <SectionCard title="Profile Snapshot">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                      <p className="text-xs text-slate-400">Household</p>
                      <p className="mt-2 text-xl font-semibold text-white">{profileSummary.householdSize} members</p>
                      <p className="text-xs text-slate-400">{profileSummary.numAdults} adults • {profileSummary.numChildren} children</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                      <p className="text-xs text-slate-400">Location & Stage</p>
                      <p className="mt-2 text-xl font-semibold text-white capitalize">{profileSummary.locationType.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-400 capitalize">{profileSummary.lifeStage.replace('_', ' ')}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                      <p className="text-xs text-slate-400">Employment</p>
                      <p className="mt-2 text-xl font-semibold text-white capitalize">{profileSummary.employmentStatus.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-400">Income stability: {profileSummary.incomeStability}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                      <p className="text-xs text-slate-400">Financial Goal</p>
                      <p className="mt-2 text-xl font-semibold text-white capitalize">{profileSummary.financialGoalType.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-400">Target savings: {formatCurrency(profileSummary.savingsGoalMonthly)}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                      <p className="text-xs text-slate-400">Actual Monthly Savings</p>
                      <p className="mt-2 text-xl font-semibold text-white">{formatCurrency(profileSummary.monthlySavingsActual)}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                      <p className="text-xs text-slate-400">Credit Score</p>
                      <p className="mt-2 text-xl font-semibold text-white">{profileSummary.creditScore ?? '—'}</p>
                      <p className="text-xs text-slate-400">Health insurance: {profileSummary.hasHealthInsurance ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                      <p className="text-xs text-slate-400">Baseline Health</p>
                      <p className="mt-2 text-xl font-semibold text-white">Score {profileSummary.baselineFinancialHealthScore ?? '—'}</p>
                      <p className="text-xs text-slate-400 capitalize">Priority: {profileSummary.baselineOptimizationPriority ?? '—'}</p>
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
