import React, { useEffect, useMemo, useState } from 'react';

export type MonthString = `${number}-${number}`; // Format: "YYYY-MM"

interface MonthPickerProps {
  value: MonthString | '';
  onChange: (value: MonthString) => void;
  className?: string;
  disabled?: boolean;
}

export default function MonthPicker({ value, onChange, className, disabled }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    if (value) return parseInt(value.split('-')[0], 10);
    return new Date().getFullYear();
  });
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
    if (value) {
      setViewYear(parseInt(value.split('-')[0], 10));
    }
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

  const handleClear = () => {
    onChange('' as MonthString);
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
                      ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md transform scale-105'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }
                    ${isCurrentMonth && !isSelected ? 'border border-slate-300 dark:border-slate-600' : ''}
                  `}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between pt-2 border-t border-warmgray-100 dark:border-slate-700">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleThisMonth}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              This month
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
