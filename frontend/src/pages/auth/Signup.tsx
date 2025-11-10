import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../../services/authService';
import {
  PASSWORD_REQUIREMENTS,
  getPasswordStrength,
  isValidEmail,
  isValidPhone,
  meetsPasswordRequirements,
} from '../../utils/validation';
import { useAuth } from '../../context/AuthContext';

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

const SignupPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const getInputClassName = (hasError: boolean) =>
    `mt-1 block w-full rounded-lg border px-4 py-2.5 text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-0 ${
      hasError
        ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500'
        : 'border-slate-300 focus:ring-slate-500 focus:border-slate-500'
    }`;

  const validate = (): FormErrors => {
    const validationErrors: FormErrors = {};

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      validationErrors.fullName = 'Full name is required';
    } else {
      const nameParts = trimmedName.split(/\s+/);
      if (nameParts.length < 2) {
        validationErrors.fullName = 'Please provide both first and last name';
      }
    }

    if (!email.trim()) {
      validationErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      validationErrors.email = 'Please enter a valid email address';
    }

    if (!phone.trim()) {
      validationErrors.phone = 'Phone number is required';
    } else if (!isValidPhone(phone)) {
      validationErrors.phone = 'Enter a valid phone number with country code (e.g. +12025551234)';
    }

    if (!password) {
      validationErrors.password = 'Password is required';
    } else if (!meetsPasswordRequirements(password)) {
      validationErrors.password = 'Password does not meet the requirements';
    }

    if (!confirmPassword) {
      validationErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match';
    }

    return validationErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const focusId = validationErrors.fullName
        ? 'fullName'
        : validationErrors.email
        ? 'email'
        : validationErrors.phone
        ? 'phone'
        : validationErrors.password
        ? 'password'
        : validationErrors.confirmPassword
        ? 'confirmPassword'
        : null;
      if (focusId) {
        document.getElementById(focusId)?.focus();
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts.shift() ?? '';
    const lastName = nameParts.join(' ') || firstName;

    try {
      await signup({
        email: email.trim().toLowerCase(),
        password,
        firstName,
        lastName,
        phone: phone.trim(),
      });

      setFormSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      const message =
        typeof error === 'string'
          ? error
          : error instanceof Error
          ? error.message
          : 'Unable to sign up. Please try again.';
      const lower = String(message).toLowerCase();
      if (lower.includes('email')) {
        setErrors((prev) => ({ ...prev, email: message }));
        document.getElementById('email')?.focus();
      } else if (lower.includes('phone')) {
        setErrors((prev) => ({ ...prev, phone: message }));
        document.getElementById('phone')?.focus();
      } else {
        setFormError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (formError) {
      document.getElementById('signup-form-error')?.focus();
    }
  }, [formError]);

  const strengthPercent = (passwordStrength.score / PASSWORD_REQUIREMENTS.length) * 100;
  const strengthColor =
    passwordStrength.level === 'strong'
      ? 'bg-emerald-500'
      : passwordStrength.level === 'medium'
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Create your account</h1>
          <p className="mt-2 text-slate-300">
            Manage your finances with personalized insights and reports.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="space-y-6">
            {formError && (
              <div
                className="rounded-md bg-rose-100 border border-rose-200 px-4 py-3 text-sm text-rose-600"
                role="alert"
                aria-live="assertive"
                id="signup-form-error"
                tabIndex={-1}
              >
                {formError}
              </div>
            )}

            {formSuccess && (
              <div
                className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-600"
                role="status"
                aria-live="polite"
              >
                {formSuccess}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="e.g. Jane Doe"
                className={getInputClassName(Boolean(errors.fullName))}
                name="name"
                autoComplete="name"
                required
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={getInputClassName(Boolean(errors.email))}
                name="email"
                autoComplete="email"
                inputMode="email"
                required
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="e.g. +12025550123"
                className={getInputClassName(Boolean(errors.phone))}
                name="tel"
                autoComplete="tel"
                inputMode="tel"
                required
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a strong password"
                className={getInputClassName(Boolean(errors.password))}
                name="new-password"
                autoComplete="new-password"
                minLength={8}
                required
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Password strength</span>
                  <span
                    className={
                      passwordStrength.level === 'strong'
                        ? 'text-emerald-600'
                        : passwordStrength.level === 'medium'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-2 ${strengthColor} transition-all duration-300`}
                    style={{ width: `${Math.max(strengthPercent, password ? 20 : 0)}%` }}
                  />
                </div>
                <ul className="mt-3 space-y-1">
                  {PASSWORD_REQUIREMENTS.map((requirement) => {
                    const satisfied = requirement.test(password);
                    return (
                      <li
                        key={requirement.label}
                        className={`flex items-center text-sm ${satisfied ? 'text-emerald-600' : 'text-slate-500'}`}
                      >
                        <span className="mr-2">
                          {satisfied ? (
                            <span aria-hidden="true">✓</span>
                          ) : (
                            <span aria-hidden="true">•</span>
                          )}
                        </span>
                        {requirement.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                className={getInputClassName(Boolean(errors.confirmPassword))}
                name="confirm-password"
                autoComplete="new-password"
                minLength={8}
                required
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
              />
            </div>

            {Object.values(errors).some(Boolean) && (
              <div className="space-y-2 text-sm">
                {errors.fullName && (
                  <p id="fullName-error" className="text-rose-600">
                    • {errors.fullName}
                  </p>
                )}
                {errors.email && (
                  <p id="email-error" className="text-rose-600">
                    • {errors.email}
                  </p>
                )}
                {errors.phone && (
                  <p id="phone-error" className="text-rose-600">
                    • {errors.phone}
                  </p>
                )}
                {errors.password && (
                  <p id="password-error" className="text-rose-600">
                    • {errors.password}
                  </p>
                )}
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="text-rose-600">
                    • {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 py-2.5 text-white font-semibold shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Sign up'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-300">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-white underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
