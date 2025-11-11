import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProfile, type EmploymentStatus, type FinancialGoalType, type IncomeStability, type LocationType, type LifeStage } from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';
import Select from '../../components/Select';

const numberInputClass = (hasError: boolean) =>
  `w-full bg-slate-100 border-none rounded-md px-4 py-3 text-slate-900 text-sm transition focus:outline-none focus:ring-2 ${
    hasError ? 'ring-2 ring-rose-500' : 'focus:ring-slate-400'
  }`;

const sectionsClass = 'grid grid-cols-1 md:grid-cols-2 gap-6 items-start';
const labelClass = 'text-sm md:text-base font-semibold text-slate-800';
const fieldWrapperClass = 'space-y-2';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [household_size, setHouseholdSize] = useState<number>(1);
  const [num_adults, setNumAdults] = useState<number>(1);
  const [num_children, setNumChildren] = useState<number>(0);
  const [location_type, setLocationType] = useState<LocationType>('urban');
  const [life_stage, setLifeStage] = useState<LifeStage>('young_professional');
  const [employment_status, setEmploymentStatus] = useState<EmploymentStatus>('employed');
  const [monthly_household_income, setMonthlyIncome] = useState<number>(0);
  const [income_stability, setIncomeStability] = useState<IncomeStability>('stable');
  const [credit_score, setCreditScore] = useState<number>(650);
  const [total_debt, setTotalDebt] = useState<number>(0);
  const [monthly_debt_payments, setMonthlyDebtPayments] = useState<number>(0);
  const [rent_or_mortgage, setRentOrMortgage] = useState<number>(0);
  const [savings_goal_monthly, setSavingsGoalMonthly] = useState<number>(0);
  const [has_health_insurance, setHasHealthInsurance] = useState<boolean>(true);
  const [financial_goal_type, setFinancialGoalType] = useState<FinancialGoalType>('emergency_fund');
  const [emergency_fund_months, setEmergencyFundMonths] = useState<number>(0);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const derived = useMemo(() => {
    const income = Math.max(0, Number(monthly_household_income) || 0);
    const dti = income > 0 ? (Number(monthly_debt_payments) || 0) / income : 0;
    const hcr = income > 0 ? (Number(rent_or_mortgage) || 0) / income : 0;
    const srate = income > 0 ? (Number(savings_goal_monthly) || 0) / income : 0;
    return { dti, hcr, srate };
  }, [monthly_household_income, monthly_debt_payments, rent_or_mortgage, savings_goal_monthly]);

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!Number.isFinite(household_size) || household_size < 1) e.household_size = 'Must be at least 1';
    if (!Number.isFinite(num_adults) || num_adults < 0) e.num_adults = 'Cannot be negative';
    if (!Number.isFinite(num_children) || num_children < 0) e.num_children = 'Cannot be negative';
    if (!Number.isFinite(monthly_household_income) || monthly_household_income <= 0) e.monthly_household_income = 'Enter income > 0';
    if (!Number.isFinite(credit_score) || credit_score < 300 || credit_score > 850) e.credit_score = '300 - 850';
    if (!Number.isFinite(total_debt) || total_debt < 0) e.total_debt = 'Cannot be negative';
    if (!Number.isFinite(monthly_debt_payments) || monthly_debt_payments < 0) e.monthly_debt_payments = 'Cannot be negative';
    if (!Number.isFinite(rent_or_mortgage) || rent_or_mortgage < 0) e.rent_or_mortgage = 'Cannot be negative';
    if (!Number.isFinite(savings_goal_monthly) || savings_goal_monthly < 0) e.savings_goal_monthly = 'Cannot be negative';
    if (!Number.isFinite(emergency_fund_months) || emergency_fund_months < 0) e.emergency_fund_months = 'Cannot be negative';
    return e;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }
    setErrors({});

    setIsSubmitting(true);
    try {
      await createProfile({
        household_size,
        num_adults,
        num_children,
        location_type,
        life_stage,
        employment_status,
        monthly_household_income,
        income_stability,
        credit_score,
        total_debt,
        monthly_debt_payments,
        rent_or_mortgage,
        savings_goal_monthly,
        has_health_insurance,
        financial_goal_type,
        emergency_fund_months,
      });
      await refreshProfile();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = typeof err === 'string' ? err : err instanceof Error ? err.message : 'Failed to save profile';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 overflow-auto">
      {/* Gradient background consistent with Auth page */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),\n                           linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full filter blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/8 rounded-full filter blur-3xl" />
        </div>
      </div>

      <div className="relative min-h-screen flex items-start md:items-center justify-center px-4 py-10 md:py-16">
        <div className="relative bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden w-full max-w-5xl transition-all duration-700 backdrop-blur-sm mt-10 md:mt-16">
          <div className="px-6 md:px-10 py-8 md:py-10">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Profile Setup</h1>
            <p className="text-slate-600 text-sm mt-1">Tell us about your household and finances to personalize insights.</p>

            {formError && (
              <div className="mt-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-600" role="alert">{formError}</div>
            )}

            <form className="mt-8 space-y-10" onSubmit={onSubmit} noValidate>
              {/* Household Section */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Household</h2>
                <div className={sectionsClass}>
                  <div className={fieldWrapperClass}>
                    <label className={labelClass}>Household Size</label>
                    <input type="number" min={1} value={household_size} onChange={(e)=>setHouseholdSize(Number(e.target.value))} className={numberInputClass(Boolean(errors.household_size))} />
                    {errors.household_size && <p className="text-xs text-rose-600">• {errors.household_size}</p>}
                  </div>
                  <div className={fieldWrapperClass}>
                    <label className={labelClass}>Adults</label>
                    <input type="number" min={0} value={num_adults} onChange={(e)=>setNumAdults(Number(e.target.value))} className={numberInputClass(Boolean(errors.num_adults))} />
                    {errors.num_adults && <p className="text-xs text-rose-600">• {errors.num_adults}</p>}
                  </div>
                  <div className={fieldWrapperClass}>
                    <label className={labelClass}>Children</label>
                    <input type="number" min={0} value={num_children} onChange={(e)=>setNumChildren(Number(e.target.value))} className={numberInputClass(Boolean(errors.num_children))} />
                    {errors.num_children && <p className="text-xs text-rose-600">• {errors.num_children}</p>}
                  </div>
                  <div className={fieldWrapperClass}>
                    <label className={labelClass}>Location Type</label>
                    <Select
                      value={location_type}
                      onChange={(v)=>setLocationType(v as LocationType)}
                      options={[
                        { label: 'Urban', value: 'urban' },
                        { label: 'Suburban', value: 'suburban' },
                        { label: 'Rural', value: 'rural' },
                      ]}
                    />
                  </div>
                  <div className={fieldWrapperClass}>
                    <label className={labelClass}>Life Stage</label>
                    <Select
                      value={life_stage}
                      onChange={(v)=>setLifeStage(v as LifeStage)}
                      options={[
                        { label: 'Young Professional', value: 'young_professional' },
                        { label: 'Young Family', value: 'young_family' },
                        { label: 'Established Family', value: 'established_family' },
                        { label: 'Empty Nesters', value: 'empty_nesters' },
                        { label: 'Retiree', value: 'retiree' },
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Employment & Income */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Employment & Income</h2>
                <div className={sectionsClass}>
                  <div className={fieldWrapperClass}>
                    <label className={labelClass}>Employment Status</label>
                    <Select
                      value={employment_status}
                      onChange={(v)=>setEmploymentStatus(v as EmploymentStatus)}
                      options={[
                        { label: 'Employed', value: 'employed' },
                        { label: 'Self Employed', value: 'self_employed' },
                        { label: 'Unemployed', value: 'unemployed' },
                        { label: 'Retired', value: 'retired' },
                        { label: 'Student', value: 'student' },
                      ]}
                    />
                  </div>
                  <div className={fieldWrapperClass}>
                    <label className={labelClass}>Monthly Household Income</label>
                    <input type="number" min={0} value={monthly_household_income} onChange={(e)=>setMonthlyIncome(Number(e.target.value))} className={numberInputClass(Boolean(errors.monthly_household_income))} />
                    {errors.monthly_household_income && <p className="text-xs text-rose-600">• {errors.monthly_household_income}</p>}
                  </div>
                  <div className={fieldWrapperClass}>
                    <label className={labelClass}>Income Stability</label>
                    <Select
                      value={income_stability}
                      onChange={(v)=>setIncomeStability(v as IncomeStability)}
                      options={[
                        { label: 'Stable', value: 'stable' },
                        { label: 'Variable', value: 'variable' },
                        { label: 'Seasonal', value: 'seasonal' },
                      ]}
                    />
                  </div>
                  <div className={fieldWrapperClass}>
                    <label className={labelClass}>Credit Score</label>
                    <input type="number" min={300} max={850} value={credit_score} onChange={(e)=>setCreditScore(Number(e.target.value))} className={numberInputClass(Boolean(errors.credit_score))} />
                    {errors.credit_score && <p className="text-xs text-rose-600">• {errors.credit_score}</p>}
                  </div>
                </div>
              </div>

              {/* Obligations */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Financial Obligations</h2>
                <div className={sectionsClass}>
                  <div className={fieldWrapperClass}>
                    <label className={labelClass}>Total Debt</label>
                    <input type="number" min={0} value={total_debt} onChange={(e)=>setTotalDebt(Number(e.target.value))} className={numberInputClass(Boolean(errors.total_debt))} />
                    {errors.total_debt && <p className="text-xs text-rose-600">• {errors.total_debt}</p>}
                  </div>
                  <div className={fieldWrapperClass}>
                    <label className={labelClass}>Monthly Debt Payments</label>
                    <input type="number" min={0} value={monthly_debt_payments} onChange={(e)=>setMonthlyDebtPayments(Number(e.target.value))} className={numberInputClass(Boolean(errors.monthly_debt_payments))} />
                    {errors.monthly_debt_payments && <p className="text-xs text-rose-600">• {errors.monthly_debt_payments}</p>}
                  </div>
                  <div className={fieldWrapperClass}>
                    <label className={labelClass}>Rent or Mortgage</label>
                    <input type="number" min={0} value={rent_or_mortgage} onChange={(e)=>setRentOrMortgage(Number(e.target.value))} className={numberInputClass(Boolean(errors.rent_or_mortgage))} />
                    {errors.rent_or_mortgage && <p className="text-xs text-rose-600">• {errors.rent_or_mortgage}</p>}
                  </div>
                </div>
              </div>

              {/* Savings & Goals */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Savings & Goals</h2>
                <div className={sectionsClass}>
                  <div className={fieldWrapperClass}>
                    <label className={labelClass}>Monthly Savings Goal</label>
                    <input type="number" min={0} value={savings_goal_monthly} onChange={(e)=>setSavingsGoalMonthly(Number(e.target.value))} className={numberInputClass(Boolean(errors.savings_goal_monthly))} />
                    {errors.savings_goal_monthly && <p className="text-xs text-rose-600">• {errors.savings_goal_monthly}</p>}
                  </div>
                  <div className={fieldWrapperClass + ' flex flex-col items-center'}>
                    <label className={labelClass + ' block mb-2 text-center'}>Has Health Insurance</label>
                    <div className="flex items-center justify-center gap-3 mt-1">
                      <button
                        type="button"
                        onClick={() => setHasHealthInsurance(true)}
                        aria-pressed={has_health_insurance}
                        className={`rounded-full px-4 py-2 text-xs font-semibold border transition ${
                          has_health_insurance
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasHealthInsurance(false)}
                        aria-pressed={!has_health_insurance}
                        className={`rounded-full px-4 py-2 text-xs font-semibold border transition ${
                          !has_health_insurance
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                  <div className={fieldWrapperClass}>
                    <label className={labelClass}>Primary Financial Goal</label>
                    <Select
                      value={financial_goal_type}
                      onChange={(v)=>setFinancialGoalType(v as FinancialGoalType)}
                      options={[
                        { label: 'Emergency Fund', value: 'emergency_fund' },
                        { label: 'Home', value: 'home' },
                        { label: 'Retirement', value: 'retirement' },
                        { label: 'Education', value: 'education' },
                        { label: 'Other', value: 'other' },
                      ]}
                    />
                  </div>
                  <div className={fieldWrapperClass}>
                    <label className={labelClass}>Emergency Fund (Months)</label>
                    <input type="number" min={0} step={0.5} value={emergency_fund_months} onChange={(e)=>setEmergencyFundMonths(Number(e.target.value))} className={numberInputClass(Boolean(errors.emergency_fund_months))} />
                    {errors.emergency_fund_months && <p className="text-xs text-rose-600">• {errors.emergency_fund_months}</p>}
                  </div>
                </div>
              </div>

              {/* Live Derived Preview */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Preview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <div className="text-xs text-slate-500">Debt-to-Income</div>
                    <div className="text-lg font-semibold text-slate-900">{(derived.dti * 100).toFixed(1)}%</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <div className="text-xs text-slate-500">Housing Cost Ratio</div>
                    <div className="text-lg font-semibold text-slate-900">{(derived.hcr * 100).toFixed(1)}%</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <div className="text-xs text-slate-500">Savings Rate (Goal)</div>
                    <div className="text-lg font-semibold text-slate-900">{(derived.srate * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button type="button" onClick={() => navigate('/dashboard')} className="rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-bold px-8 py-3 uppercase tracking-wider transition-transform hover:scale-95 active:scale-90">
                  Skip for now
                </button>
                <button type="submit" disabled={isSubmitting} className="rounded-full border border-slate-900 bg-slate-900 text-white text-xs font-bold px-11 py-3 uppercase tracking-wider transition-transform hover:scale-95 active:scale-90 disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
