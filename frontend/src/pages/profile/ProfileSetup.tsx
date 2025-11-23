import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import {
  createProfile,
  updateProfile,
  getProfile as getStoredProfile,
  type EmploymentStatus,
  type FinancialGoalType,
  type IncomeStability,
  type LocationType,
  type LifeStage,
  type UserProfileRecord,
} from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';
import Select from '../../components/Select';

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

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

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

  const populateFromProfile = (profile: UserProfileRecord) => {
    setHouseholdSize(profile.householdSize);
    setNumAdults(profile.numAdults);
    setNumChildren(profile.numChildren);
    setLocationType(profile.locationType);
    setLifeStage(profile.lifeStage);
    setEmploymentStatus(profile.employmentStatus);
    setMonthlyIncome(profile.monthlyHouseholdIncome);
    setIncomeStability(profile.incomeStability);
    setCreditScore(profile.creditScore);
    setTotalDebt(profile.totalDebt);
    setMonthlyDebtPayments(profile.monthlyDebtPayments);
    setRentOrMortgage(profile.rentOrMortgage);
    setSavingsGoalMonthly(profile.savingsGoalMonthly);
    setHasHealthInsurance(Boolean(profile.hasHealthInsurance));
    setFinancialGoalType(profile.financialGoalType);
    setEmergencyFundMonths(profile.emergencyFundMonths);
  };

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const existing = await getStoredProfile();
        if (existing?.profile && isMounted) {
          setIsEditing(true);
          populateFromProfile(existing.profile);
        }
      } catch (error) {
        console.warn('Failed to preload profile setup form:', error);
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    };
    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

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
    setSuccessMessage('');
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }
    setErrors({});

    setIsSubmitting(true);
    try {
      const payload = {
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
      };

      const response = isEditing
        ? await updateProfile(payload)
        : await createProfile(payload);

      const savedProfile = response.profile;
      populateFromProfile(savedProfile);
      setIsEditing(true);

      await refreshProfile();

      setSuccessMessage('Your profile details have been saved.');
    } catch (err) {
      const message = typeof err === 'string' ? err : err instanceof Error ? err.message : 'Failed to save profile';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-cream-200 text-warmgray-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Gradient background consistent with Auth page */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-cream-200 via-cream-100 to-warmgray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),\n                           linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)` ,
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
                <h1 className="text-2xl md:text-3xl font-bold text-warmgray-900 dark:text-white">Profile Setup</h1>
                <p className="text-warmgray-600 dark:text-slate-300 text-sm mt-1">Tell us about your household and finances to personalize insights.</p>

                {isLoadingProfile && (
                  <div className="mt-4 rounded-md bg-warmgray-100 dark:bg-slate-800 border border-warmgray-200 dark:border-slate-700 px-4 py-3 text-sm text-warmgray-600 dark:text-slate-200" role="status">
                    Loading your profile information...
                  </div>
                )}
                {formError && (
                  <div className="mt-4 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/60 px-4 py-2 text-sm text-rose-600 dark:text-rose-300" role="alert">
                    {formError}
                  </div>
                )}
                {successMessage && !formError && (
                  <div className="mt-4 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/60 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300" role="status">
                    {successMessage}
                  </div>
                )}

                <form className="mt-8 space-y-10" onSubmit={onSubmit} noValidate>
              {/* Household Section */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-warmgray-900 dark:text-white mb-4">Household</h2>
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
                <h2 className="text-xl md:text-2xl font-bold text-warmgray-900 dark:text-white mb-4">Employment & Income</h2>
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
                <h2 className="text-xl md:text-2xl font-bold text-warmgray-900 dark:text-white mb-4">Financial Obligations</h2>
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
                <h2 className="text-xl md:text-2xl font-bold text-warmgray-900 dark:text-white mb-4">Savings & Goals</h2>
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
                            ? 'bg-white text-slate-900 border-white shadow-sm dark:bg-white dark:text-slate-900 dark:border-white'
                            : 'bg-transparent text-slate-500 border-slate-400 hover:bg-slate-100 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-800'
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
                            ? 'bg-white text-slate-900 border-white shadow-sm dark:bg-white dark:text-slate-900 dark:border-white'
                            : 'bg-transparent text-slate-500 border-slate-400 hover:bg-slate-100 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-800'
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
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4">Preview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={previewCardClass}>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Debt-to-Income</div>
                    <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{(derived.dti * 100).toFixed(1)}%</div>
                  </div>
                  <div className={previewCardClass}>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Housing Cost Ratio</div>
                    <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{(derived.hcr * 100).toFixed(1)}%</div>
                  </div>
                  <div className={previewCardClass}>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Savings Rate (Goal)</div>
                    <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{(derived.srate * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="rounded-full border border-warmgray-300 bg-white text-warmgray-700 text-xs font-bold px-8 py-3 uppercase tracking-wider transition-all duration-200 hover:opacity-80 hover:border-warmgray-400 active:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500"
                >
                  {isEditing ? 'Back to Dashboard' : 'Skip for now'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingProfile}
                  className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-11 py-3 uppercase tracking-wider transition-all duration-200 hover:opacity-90 hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-slate-50 dark:text-slate-900"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Profile' : 'Save Profile'}
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

export default ProfileSetup;
