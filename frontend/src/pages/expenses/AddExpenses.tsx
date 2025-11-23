import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header';
import { createExpense, getExpenseByMonth, updateExpense, type ExpensePayload, type ExpenseRecord } from '../../services/expensesService';
import { useNavigate } from 'react-router-dom';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

type AmountKey = Exclude<keyof ExpensePayload, 'monthYear'>;

// Styling constants matching ProfileSetup
const numberInputClass = (hasError: boolean) =>
  `w-full bg-white border border-warmgray-300 rounded-md px-4 py-3 text-warmgray-900 text-sm transition focus:outline-none focus:ring-2 ${
    hasError ? 'ring-2 ring-rose-500' : 'focus:ring-emerald-500 dark:focus:ring-slate-500'
  } dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100`;

const sectionsClass = 'grid grid-cols-1 md:grid-cols-2 gap-6 items-start';
const labelClass = 'text-sm md:text-base font-semibold text-warmgray-900 dark:text-slate-100';
const fieldWrapperClass = 'space-y-2';
const previewCardClass =
  'rounded-xl bg-slate-800/40 backdrop-blur-sm px-5 py-4 '
  + 'dark:bg-slate-800/40 dark:backdrop-blur-sm';

const categoryGroups: { title: string; items: { key: AmountKey; label: string }[] }[] = [
  {
    title: 'Housing & Utilities',
    items: [
      { key: 'housingUtilities', label: 'Housing / Utilities' },
    ],
  },
  {
    title: 'Food',
    items: [
      { key: 'groceries', label: 'Groceries' },
      { key: 'restaurantsCafes', label: 'Restaurants & Cafés' },
    ],
  },
  {
    title: 'Transportation',
    items: [
      { key: 'transportationFuel', label: 'Transportation / Fuel' },
      { key: 'publicTransport', label: 'Public Transport' },
    ],
  },
  {
    title: 'Healthcare',
    items: [
      { key: 'healthcarePharmacy', label: 'Healthcare / Pharmacy' },
    ],
  },
  {
    title: 'Family & Education',
    items: [
      { key: 'educationTuition', label: 'Education / Tuition' },
      { key: 'childcare', label: 'Childcare' },
    ],
  },
  {
    title: 'Lifestyle',
    items: [
      { key: 'clothingPersonalCare', label: 'Clothing & Personal Care' },
      { key: 'entertainmentHobbies', label: 'Entertainment & Hobbies' },
      { key: 'subscriptions', label: 'Subscriptions' },
    ],
  },
  {
    title: 'Other',
    items: [
      { key: 'otherShopping', label: 'Other Shopping' },
      { key: 'giftsCharity', label: 'Gifts & Charity' },
      { key: 'miscellaneous', label: 'Miscellaneous' },
    ],
  },
];

type Amounts = Record<AmountKey, number>;

const defaultAmounts: Amounts = {
  housingUtilities: 0,
  groceries: 0,
  restaurantsCafes: 0,
  transportationFuel: 0,
  publicTransport: 0,
  healthcarePharmacy: 0,
  educationTuition: 0,
  childcare: 0,
  clothingPersonalCare: 0,
  entertainmentHobbies: 0,
  subscriptions: 0,
  otherShopping: 0,
  giftsCharity: 0,
  miscellaneous: 0,
};

const essentialKeys: AmountKey[] = [
  'housingUtilities',
  'groceries',
  'transportationFuel',
  'publicTransport',
  'healthcarePharmacy',
  'educationTuition',
  'childcare',
];

function getCurrentMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default function AddExpenses() {
  const navigate = useNavigate();
  const [month, setMonth] = useState<string>(getCurrentMonth());
  const [amounts, setAmounts] = useState<Amounts>({ ...defaultAmounts });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingExpense, setExistingExpense] = useState<ExpenseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    const loadExpenses = async () => {
      setIsLoading(true);
      setExistingExpense(null);
      try {
        const res = await getExpenseByMonth(month as any);
        if (!alive) return;
        if (res?.expense) {
          setExistingExpense(res.expense);
          // Populate form with existing values
          setAmounts({
            housingUtilities: res.expense.housingUtilities,
            groceries: res.expense.groceries,
            restaurantsCafes: res.expense.restaurantsCafes,
            transportationFuel: res.expense.transportationFuel,
            publicTransport: res.expense.publicTransport,
            healthcarePharmacy: res.expense.healthcarePharmacy,
            educationTuition: res.expense.educationTuition,
            childcare: res.expense.childcare,
            clothingPersonalCare: res.expense.clothingPersonalCare,
            entertainmentHobbies: res.expense.entertainmentHobbies,
            subscriptions: res.expense.subscriptions,
            otherShopping: res.expense.otherShopping,
            giftsCharity: res.expense.giftsCharity,
            miscellaneous: res.expense.miscellaneous,
          });
        } else {
          // Reset to default amounts if no existing expense
          setAmounts({ ...defaultAmounts });
        }
      } catch (e) {
        if (!alive) return;
        setExistingExpense(null);
        setAmounts({ ...defaultAmounts });
      } finally {
        if (alive) setIsLoading(false);
      }
    };
    void loadExpenses();
    return () => {
      alive = false;
    };
  }, [month]);

  const totals = useMemo(() => {
    const all = Object.values(amounts).reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);
    const essential = essentialKeys.reduce((sum, k) => sum + (amounts[k] || 0), 0);
    const discretionary = all - essential;
    return {
      all,
      essential,
      discretionary,
      essentialRatio: all > 0 ? essential / all : 0,
      discretionaryRatio: all > 0 ? discretionary / all : 0,
    };
  }, [amounts]);

  function onChangeAmount(key: AmountKey, value: string) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      setAmounts((prev) => ({ ...prev, [key]: 0 }));
      return;
    }
    setAmounts((prev) => ({ ...prev, [key]: n }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      setError('Please select a valid month (YYYY-MM).');
      return;
    }

    const payload: ExpensePayload = {
      monthYear: month as any,
      ...amounts,
    };

    setIsSubmitting(true);
    try {
      if (existingExpense) {
        // Update existing expense
        await updateExpense(existingExpense.id, payload);
        setSuccess('Expenses updated successfully.');
      } else {
        // Create new expense
        await createExpense(payload);
        setSuccess('Expenses saved successfully.');
      }
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      const msg = typeof err === 'string' ? err : err instanceof Error ? err.message : 'Failed to save expenses';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-cream-200 text-warmgray-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Gradient background matching ProfileSetup */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-cream-200 via-cream-100 to-warmgray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),\n                           linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
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

        <main className="px-4 sm:px-6 lg:px-8 pt-28 pb-16">
          <div className="flex items-start md:items-center justify-center">
            <div className="relative bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl transition-all duration-700 backdrop-blur-sm border border-warmgray-200/60 dark:border-slate-800/80">
              <div className="px-6 md:px-10 py-8 md:py-10">
                <h1 className="text-2xl md:text-3xl font-bold text-warmgray-900 dark:text-white">
                  {existingExpense ? 'Update Monthly Expenses' : 'Add Monthly Expenses'}
                </h1>
                <p className="text-warmgray-600 dark:text-slate-300 text-sm mt-1">
                  {existingExpense 
                    ? 'Update your spending by category. Values are loaded from your existing entry.' 
                    : 'Record your spending by category to track your financial health.'}
                </p>

                {error && (
                  <div className="mt-4 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/60 px-4 py-2 text-sm text-rose-600 dark:text-rose-300" role="alert">
                    {error}
                  </div>
                )}
                {success && !error && (
                  <div className="mt-4 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/60 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300" role="status">
                    {success}
                  </div>
                )}

                <form className="mt-8 space-y-10" onSubmit={onSubmit} noValidate>
                  {/* Month Selection */}
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-warmgray-900 dark:text-white mb-4">Select Month</h2>
                    <div className={fieldWrapperClass}>
                      <label className={labelClass}>Month &amp; Year</label>
                      <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className={`${numberInputClass(false)} appearance-none [color-scheme:dark]`}
                        disabled={isLoading}
                      />
                      {isLoading && (
                        <p className="text-xs text-blue-600 dark:text-blue-300">Loading existing expenses...</p>
                      )}
                      {existingExpense && !isLoading && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-300">✓ Loaded existing expenses for this month. You can update the values below.</p>
                      )}
                    </div>
                  </div>

                  {/* Category Groups */}
                  {categoryGroups.map((group) => (
                    <div key={group.title}>
                      <h2 className="text-xl md:text-2xl font-bold text-warmgray-900 dark:text-white mb-4">{group.title}</h2>
                      <div className={sectionsClass}>
                        {group.items.map((item) => (
                          <div key={String(item.key)} className={fieldWrapperClass}>
                            <label className={labelClass}>{item.label}</label>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              inputMode="decimal"
                              value={amounts[item.key]}
                              onChange={(e) => onChangeAmount(item.key, e.target.value)}
                              className={numberInputClass(false)}
                              placeholder="0.00"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Live Preview */}
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-warmgray-900 dark:text-white mb-4">Preview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={previewCardClass}>
                        <div className="text-xs text-warmgray-700 dark:text-slate-400">Total Expenses</div>
                        <div className="mt-1 text-xl font-semibold text-warmgray-900 dark:text-white">{currency.format(totals.all)}</div>
                      </div>
                      <div className={previewCardClass}>
                        <div className="text-xs text-warmgray-700 dark:text-slate-400">Essential Spending</div>
                        <div className="mt-1 text-xl font-semibold text-warmgray-900 dark:text-white">{currency.format(totals.essential)}</div>
                      </div>
                      <div className={previewCardClass}>
                        <div className="text-xs text-warmgray-700 dark:text-slate-400">Discretionary Spending</div>
                        <div className="mt-1 text-xl font-semibold text-warmgray-900 dark:text-white">{currency.format(totals.discretionary)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="rounded-full border border-warmgray-300 bg-white text-warmgray-700 text-xs font-bold px-8 py-3 uppercase tracking-wider transition-all duration-200 hover:opacity-80 hover:border-warmgray-400 active:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isLoading}
                      className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-11 py-3 uppercase tracking-wider transition-all duration-200 hover:opacity-90 hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-slate-50 dark:text-slate-900"
                    >
                      {isSubmitting ? 'Saving...' : existingExpense ? 'Update Expenses' : 'Save Expenses'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
