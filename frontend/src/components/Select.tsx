import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
}

interface SelectProps<T extends string = string> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
}

/**
 * A lightweight, accessible custom Select built with Tailwind.
 * - Keyboard support: Enter/Space to open, ArrowUp/ArrowDown to navigate, Enter to select, Esc to close.
 * - Click outside to close.
 */
export default function Select<T extends string = string>({ options, value, onChange, placeholder = 'Select...', className = '' }: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => options.find(o => o.value === value), [options, value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function toggle() {
    setOpen(prev => !prev);
    if (!open) {
      const idx = Math.max(0, options.findIndex(o => o.value === value));
      setActiveIndex(idx);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setOpen(true);
      setActiveIndex(Math.max(0, options.findIndex(o => o.value === value)));
      return;
    }
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(options.length - 1, (i < 0 ? 0 : i + 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(0, (i < 0 ? 0 : i - 1)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt) {
        onChange(opt.value);
        setOpen(false);
      }
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className={`w-full bg-slate-100 rounded-md px-4 py-3 text-left text-slate-900 text-sm border-0 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 transition`}
      >
        <span className="block truncate">{selected ? selected.label : <span className="text-slate-500">{placeholder}</span>}</span>
        <span className={`absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>

      {open && (
        <div role="listbox" className="absolute z-50 mt-2 w-full overflow-auto max-h-56 rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {options.map((opt, idx) => (
            <Fragment key={opt.value}>
              <button
                type="button"
                role="option"
                aria-selected={value === opt.value}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`relative w-full text-left px-4 py-2.5 text-sm first:rounded-t-2xl last:rounded-b-2xl ${
                  idx === activeIndex ? 'bg-indigo-50' : 'bg-white'
                } ${value === opt.value ? 'font-semibold text-indigo-700' : 'text-slate-700'} hover:bg-indigo-50`}
              >
                {opt.label}
                {value === opt.value && (
                  <span className="absolute inset-y-0 right-3 flex items-center text-indigo-600">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </button>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
