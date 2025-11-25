import React, { useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header';
import { type MonthString } from '../../components/MonthPicker';
import {
  createExpense,
  getExpenseByMonth,
  updateExpense,
  type ExpensePayload,
  type ExpenseRecord,
} from '../../services/expensesService';
import { getBudgets, upsertBudget } from '../../services/budgetsService';
import { useNavigate } from 'react-router-dom';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

type AmountKey = Exclude<keyof ExpensePayload, 'monthYear'>;

// Styling constants matching ProfileSetup
const numberInputClass = (hasError: boolean) =>
  `w-full bg-white border border-warmgray-300 rounded-lg px-4 py-3.5 md:py-3 text-warmgray-900 text-base md:text-sm transition focus:outline-none focus:ring-2 ${hasError ? 'ring-2 ring-rose-500' : 'focus:ring-emerald-500 dark:focus:ring-slate-500'
  } dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100`;

const sectionsClass = 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start';
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

function getCurrentMonth(): MonthString {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}` as MonthString;
}

// --- MonthPicker Component ---

interface MonthPickerProps {
  value: MonthString;
  onChange: (value: MonthString) => void;
  className?: string;
  disabled?: boolean;
}

function MonthPicker({ value, onChange, className, disabled }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => parseInt(value.split('-')[0], 10));
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync viewYear when value changes externally
  useEffect(() => {
    setViewYear(parseInt(value.split('-')[0], 10));
  }, [value]);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const handleYearChange = (increment: number) => {
    setViewYear(prev => prev + increment);
  };

  const handleMonthSelect = (monthIndex: number) => {
    const m = String(monthIndex + 1).padStart(2, '0');
    onChange(`${viewYear}-${m}` as MonthString);
    setIsOpen(false);
  };

  const handleThisMonth = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    onChange(`${y}-${m}` as MonthString);
    setViewYear(y);
    setIsOpen(false);
  };

  const displayValue = useMemo(() => {
    if (!value) return 'Select Month';
    const [y, m] = value.split('-');
    const date = new Date(Number.parseInt(y, 10), Number.parseInt(m, 10) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [value]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={className}
        disabled={disabled}
      >
        <span className={!value ? 'text-gray-400' : ''}>{displayValue}</span>
        <svg className="w-4 h-4 ml-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-warmgray-200 dark:border-slate-700 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Year Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-warmgray-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleYearChange(-1)}
              className="p-1 hover:bg-warmgray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-warmgray-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-bold text-warmgray-900 dark:text-white">{viewYear}</span>
            <button
              type="button"
              onClick={() => handleYearChange(1)}
              className="p-1 hover:bg-warmgray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-warmgray-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {months.map((m, idx) => {
              const isSelected = value === `${viewYear}-${String(idx + 1).padStart(2, '0')}`;
              const isCurrentMonth = new Date().getFullYear() === viewYear && new Date().getMonth() === idx;

              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMonthSelect(idx)}
                  className={`
                    py-2 text-sm font-medium rounded-lg transition-all duration-150
                    ${isSelected
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'text-warmgray-700 dark:text-slate-300 hover:bg-warmgray-100 dark:hover:bg-slate-700'
                    }
                    ${isCurrentMonth && !isSelected ? 'border border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : ''}
                  `}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end pt-2 border-t border-warmgray-100 dark:border-slate-700">
            <button
              type="button"
              onClick={handleThisMonth}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              This Month
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function evaluateMath(input: string): number | null {
  try {
    // Allow numbers, operators (+, -, *, /), parens, dots, and spaces
    const sanitized = input.replace(/[^0-9+\-*/().\s]/g, '');
    if (!sanitized.trim()) return null;
    const result = new Function('return ' + sanitized)();
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

interface SmartNumberInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
}

function SmartNumberInput({ value, onChange, className, placeholder }: SmartNumberInputProps) {
  const [localValue, setLocalValue] = useState(value === 0 ? '' : value.toString());
  const [isEditing, setIsEditing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value === 0 ? '' : value.toString());
    }
  }, [value, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const result = evaluateMath(localValue);
    if (result !== null && result >= 0) {
      onChange(result);
      setLocalValue(result === 0 ? '' : result.toString());
    } else {
      // Invalid or negative, revert to original value
      setLocalValue(value === 0 ? '' : value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAddDialog(true);
    setAddAmount('');
    // Prevent body scroll when dialog opens
    document.body.style.overflow = 'hidden';
  };

  const handleAddConfirm = () => {
    const amountToAdd = Number(addAmount);
    if (Number.isFinite(amountToAdd) && amountToAdd >= 0) {
      const newValue = value + amountToAdd;
      onChange(newValue);
    }
    setShowAddDialog(false);
    setAddAmount('');
    // Restore body scroll
    document.body.style.overflow = '';
  };

  const handleAddCancel = () => {
    setShowAddDialog(false);
    setAddAmount('');
    // Restore body scroll
    document.body.style.overflow = '';
  };

  const handleAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddConfirm();
    } else if (e.key === 'Escape') {
      handleAddCancel();
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={localValue}
          onChange={(e) => {
            setIsEditing(true);
            setLocalValue(e.target.value);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={className}
          placeholder={placeholder}
        />
        <button
          ref={buttonRef}
          type="button"
          onClick={handleAddClick}
          className="flex-shrink-0 px-4 py-2.5 md:px-3 md:py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm md:text-xs font-semibold rounded-lg md:rounded-md transition-colors duration-150 dark:bg-emerald-600 dark:hover:bg-emerald-700 min-w-[70px] active:scale-95"
          title="Add to current value"
        >
          + Add
        </button>
      </div>

      {showAddDialog && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleAddCancel} />
          <div
            ref={popoverRef}
            className="absolute z-50 mt-2 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-warmgray-200 dark:border-slate-700 p-5 animate-in fade-in zoom-in-95 duration-150"
            style={{
              top: buttonRef.current ? buttonRef.current.offsetHeight + 4 : 0,
              right: 0,
            }}
          >
            <h3 className="text-base font-bold text-warmgray-900 dark:text-white mb-3">
              Add Amount
            </h3>
            <p className="text-xs text-warmgray-600 dark:text-slate-300 mb-3">
              Current: <span className="font-semibold">{currency.format(value)}</span>
            </p>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              onKeyDown={handleAddKeyDown}
              className="w-full bg-white border border-warmgray-300 rounded-md px-3 py-2 text-warmgray-900 text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-emerald-600"
              placeholder="Enter amount to add"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleAddCancel}
                className="flex-1 px-3 py-2 bg-warmgray-200 hover:bg-warmgray-300 text-warmgray-700 text-xs font-semibold rounded-md transition-colors duration-150 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddConfirm}
                className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-md transition-colors duration-150 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                Add
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const BudgetControl = ({
  category,
  month,
  currentBudget,
  spent,
  onUpdate
}: {
  category: string;
  month: string;
  currentBudget: number | undefined;
  spent: number;
  onUpdate: (val: number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(currentBudget?.toString() || '');

  useEffect(() => {
    setVal(currentBudget?.toString() || '');
  }, [currentBudget]);

  const handleSave = async () => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      try {
        await upsertBudget({ category, amount: num, monthYear: month });
        onUpdate(num);
        setIsEditing(false);
      } catch (e) {
        console.error(e);
      }
    } else {
      setIsEditing(false);
      setVal(currentBudget?.toString() || '');
      setIsEditing(false);
    }
  };

  const percentage = currentBudget && currentBudget > 0 ? (spent / currentBudget) * 100 : 0;
  const isOverBudget = percentage > 100;
  const isNearBudget = percentage > 85;
  
  const progressColor = isOverBudget 
    ? 'bg-rose-500' 
    : isNearBudget 
      ? 'bg-amber-500' 
      : 'bg-emerald-500';

  if (isEditing) {
    return (
      <div className="mt-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
        <span className="text-xs font-medium text-warmgray-700 dark:text-slate-300">Budget:</span>
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-warmgray-500">$</span>
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="w-24 pl-5 pr-2 py-1 text-xs border rounded-md border-warmgray-300 dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-3">
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className={`
          group flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border
          ${currentBudget !== undefined
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/30'
            : 'bg-warmgray-50 text-warmgray-500 border-warmgray-200 hover:bg-warmgray-100 hover:text-warmgray-700 hover:border-warmgray-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300'
          }
        `}
      >
        {currentBudget !== undefined ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
            </svg>
            <span>Budget: {currency.format(currentBudget)}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 transition-opacity">
              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
            </svg>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            <span>Set Budget</span>
          </>
        )}
      </button>

      {currentBudget !== undefined && (
        <div className="flex-1 flex flex-col gap-1 min-w-[120px] max-w-xs animate-in fade-in duration-300">
          <div className="flex justify-between text-[10px] font-medium text-warmgray-500 dark:text-slate-400 px-0.5">
            <span>{Math.round(percentage)}%</span>
            <span>{currency.format(Math.max(0, currentBudget - spent))} left</span>
          </div>
          <div className="h-1.5 w-full bg-warmgray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default function AddExpenses() {
  const navigate = useNavigate();
  const [month, setMonth] = useState<MonthString>(getCurrentMonth());
  const [amounts, setAmounts] = useState<Amounts>({ ...defaultAmounts });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingExpense, setExistingExpense] = useState<ExpenseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [budgets, setBudgets] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    let loadingTimeoutId: ReturnType<typeof setTimeout>;

    const loadExpenses = async () => {
      // Small delay to debounce rapid month changes
      timeoutId = setTimeout(async () => {
        setIsLoading(true);
        setExistingExpense(null);

        // Only show loading text if it takes longer than 300ms
        loadingTimeoutId = setTimeout(() => {
          if (alive) setShowLoading(true);
        }, 300);

        try {
          const res = await getExpenseByMonth(month);
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
          if (alive) {
            clearTimeout(loadingTimeoutId);
            setIsLoading(false);
            setShowLoading(false);
          }
        }
      }, 150); // 150ms debounce
    };

    void loadExpenses();

    return () => {
      alive = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
    };
  }, [month]);

  useEffect(() => {
    let alive = true;
    const loadBudgets = async () => {
      try {
        const budgetList = await getBudgets(month);
        if (alive) {
          const budgetMap: Record<string, number> = {};
          budgetList.forEach((b) => {
            budgetMap[b.category] = b.budgetedAmount;
          });
          setBudgets(budgetMap);
        }
      } catch (err) {
        console.error('Failed to load budgets', err);
      }
    };
    loadBudgets();
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

  function onChangeAmount(key: AmountKey, value: number) {
    if (!Number.isFinite(value) || value < 0) {
      setAmounts((prev) => ({ ...prev, [key]: 0 }));
      return;
    }
    setAmounts((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload: ExpensePayload = {
      monthYear: month,
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

        <main className="w-full sm:mx-auto sm:max-w-7xl px-0 sm:px-6 lg:px-8 pt-20 pb-28 md:pb-16">
          <div className="flex items-start md:items-center justify-center">
            <div className="relative bg-white dark:bg-slate-900/90 rounded-lg sm:rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl transition-all duration-700 backdrop-blur-sm border border-warmgray-200/60 dark:border-slate-800/80">
              <div className="px-3 py-5 sm:px-6 md:px-10 sm:py-8 md:py-10">
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
                      <MonthPicker
                        value={month}
                        onChange={setMonth}
                        className={`${numberInputClass(false)} cursor-pointer flex items-center justify-between`}
                        disabled={isLoading}
                      />
                      {showLoading && (
                        <p className="text-xs text-blue-600 dark:text-blue-300">Loading existing expenses...</p>
                      )}
                      {existingExpense && !showLoading && (
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
                            <SmartNumberInput
                              value={amounts[item.key]}
                              onChange={(val) => onChangeAmount(item.key, val)}
                              className={numberInputClass(false)}
                              placeholder="0.00"
                            />
                            <BudgetControl
                              category={item.key}
                              month={month}
                              currentBudget={budgets[item.key]}
                              spent={amounts[item.key] || 0}
                              onUpdate={(newVal) => setBudgets((prev) => ({ ...prev, [item.key]: newVal }))}
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
