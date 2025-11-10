import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isValidEmail } from '../../utils/validation';
import { useAuth } from '../../context/AuthContext';

interface FormErrors {
  email?: string;
  password?: string;
}

const getInputClassName = (hasError: boolean) =>
  `mt-1 block w-full rounded-lg border px-4 py-2.5 text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-0 ${
    hasError
      ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500'
      : 'border-slate-300 focus:ring-slate-500 focus:border-slate-500'
  }`;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location.state]);

  const validate = (): FormErrors => {
    const validationErrors: FormErrors = {};

    if (!email.trim()) {
      validationErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      validationErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      validationErrors.password = 'Password is required';
    }

    return validationErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const focusId = validationErrors.email ? 'email' : validationErrors.password ? 'password' : null;
      if (focusId) {
        document.getElementById(focusId)?.focus();
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = await login(
        {
          email: email.trim().toLowerCase(),
          password,
        },
        rememberMe
      );

      navigate(result.hasProfile ? '/dashboard' : '/profile-setup', { replace: true });
    } catch (error) {
      const message =
        typeof error === 'string'
          ? error
          : error instanceof Error
          ? error.message
          : 'Unable to log in. Please check your credentials and try again.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (formError) {
      document.getElementById('login-form-error')?.focus();
    }
  }, [formError]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-slate-300">Log in to access your personalized financial hub.</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="space-y-6">
            {formError && (
              <div
                className="rounded-md bg-rose-100 border border-rose-200 px-4 py-3 text-sm text-rose-600"
                role="alert"
                aria-live="assertive"
                id="login-form-error"
                tabIndex={-1}
              >
                {formError}
              </div>
            )}

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
                autoCapitalize="off"
                spellCheck={false}
                autoFocus
                required
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
              />
              {errors.email && (
                <p id="login-email-error" className="mt-2 text-sm text-rose-600">• {errors.email}</p>
              )}
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
                placeholder="Enter your password"
                className={getInputClassName(Boolean(errors.password))}
                name="current-password"
                autoComplete="current-password"
                autoCapitalize="off"
                spellCheck={false}
                required
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
              />
              {errors.password && (
                <p id="login-password-error" className="mt-2 text-sm text-rose-600">• {errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                <span className="ml-2">Remember me</span>
              </label>

              <button
                type="button"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
                onClick={() => navigate('/forgot-password')}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 py-2.5 text-white font-semibold shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-300">
          Don’t have an account?{' '}
          <Link to="/signup" className="font-semibold text-white underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
