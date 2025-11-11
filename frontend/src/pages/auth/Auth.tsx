import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  // UI state
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  // Signup form state
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupErrors, setSignupErrors] = useState<FormErrors>({});
  const [signupFormError, setSignupFormError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');
  const [isSignupSubmitting, setIsSignupSubmitting] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  const [loginFormError, setLoginFormError] = useState('');
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(signupPassword), [signupPassword]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const getInputClassName = (hasError: boolean) =>
    `w-full bg-slate-100 border-none rounded-md px-4 py-3 text-slate-900 text-sm transition focus:outline-none focus:ring-2 ${
      hasError ? 'ring-2 ring-rose-500' : 'focus:ring-slate-400'
    }`;

  // Signup validation
  const validateSignup = (): FormErrors => {
    const validationErrors: FormErrors = {};

    const trimmedName = signupFullName.trim();
    if (!trimmedName) {
      validationErrors.fullName = 'Full name is required';
    } else {
      const nameParts = trimmedName.split(/\s+/);
      if (nameParts.length < 2) {
        validationErrors.fullName = 'Please provide both first and last name';
      }
    }

    if (!signupEmail.trim()) {
      validationErrors.email = 'Email is required';
    } else if (!isValidEmail(signupEmail)) {
      validationErrors.email = 'Please enter a valid email address';
    }

    if (!signupPhone.trim()) {
      validationErrors.phone = 'Phone number is required';
    } else if (!isValidPhone(signupPhone)) {
      validationErrors.phone = 'Enter a valid phone number with country code (e.g. +12025551234)';
    }

    if (!signupPassword) {
      validationErrors.password = 'Password is required';
    } else if (!meetsPasswordRequirements(signupPassword)) {
      validationErrors.password = 'Password does not meet the requirements';
    }

    if (!signupConfirmPassword) {
      validationErrors.confirmPassword = 'Please confirm your password';
    } else if (signupPassword !== signupConfirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match';
    }

    return validationErrors;
  };

  // Login validation
  const validateLogin = (): { email?: string; password?: string } => {
    const validationErrors: { email?: string; password?: string } = {};

    if (!loginEmail.trim()) {
      validationErrors.email = 'Email is required';
    } else if (!isValidEmail(loginEmail)) {
      validationErrors.email = 'Please enter a valid email address';
    }

    if (!loginPassword) {
      validationErrors.password = 'Password is required';
    }

    return validationErrors;
  };

  const handleSignupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignupFormError('');
    setSignupSuccess('');

    const validationErrors = validateSignup();
    if (Object.keys(validationErrors).length > 0) {
      setSignupErrors(validationErrors);
      return;
    }

    setSignupErrors({});
    setIsSignupSubmitting(true);

    const nameParts = signupFullName.trim().split(/\s+/);
    const firstName = nameParts.shift() ?? '';
    const lastName = nameParts.join(' ') || firstName;

    try {
      await signup({
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        firstName,
        lastName,
        phone: signupPhone.trim(),
      });

      setSignupSuccess('Account created successfully!');
      // Clear form
      setSignupFullName('');
      setSignupEmail('');
      setSignupPhone('');
      setSignupPassword('');
      setSignupConfirmPassword('');
      // Switch to login after 1.5 seconds
      setTimeout(() => {
        setIsSignUpMode(false);
        setSignupSuccess('');
      }, 1500);
    } catch (error) {
      const message =
        typeof error === 'string'
          ? error
          : error instanceof Error
          ? error.message
          : 'Unable to sign up. Please try again.';
      const lower = String(message).toLowerCase();
      if (lower.includes('email')) {
        setSignupErrors((prev) => ({ ...prev, email: message }));
      } else if (lower.includes('phone')) {
        setSignupErrors((prev) => ({ ...prev, phone: message }));
      } else {
        setSignupFormError(message);
      }
    } finally {
      setIsSignupSubmitting(false);
    }
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginFormError('');

    const validationErrors = validateLogin();
    if (Object.keys(validationErrors).length > 0) {
      setLoginErrors(validationErrors);
      return;
    }

    setLoginErrors({});
    setIsLoginSubmitting(true);

    try {
      const result = await login(
        {
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword,
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
      setLoginFormError(message);
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const strengthPercent = (passwordStrength.score / PASSWORD_REQUIREMENTS.length) * 100;
  const strengthColor =
    passwordStrength.level === 'strong'
      ? 'bg-emerald-500'
      : passwordStrength.level === 'medium'
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-auto">
      {/* Sophisticated background with subtle gradient mesh */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
        
        {/* Elegant radial gradients for depth */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full filter blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/8 rounded-full filter blur-3xl"></div>
        </div>
      </div>

      {/* Brand header removed to avoid overlap at common laptop zoom levels */}

      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-wide">SaveMate</h1>
        </div>
        <div
          className={`relative bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden w-full max-w-4xl min-h-[560px] transition-all duration-700 backdrop-blur-sm ${
            isSignUpMode ? 'right-panel-active' : ''
          }`}
        >
        {/* Sign Up Form Container */}
        <div
          className={`absolute top-0 left-0 w-1/2 h-full transform-gpu transition-transform duration-700 ease-in-out ${
            isSignUpMode ? 'translate-x-full z-[5] pointer-events-auto visible' : 'translate-x-0 z-[1] pointer-events-none invisible'
          }`}
          style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
        >
          <form
            onSubmit={handleSignupSubmit}
            noValidate
            aria-busy={isSignupSubmitting}
            className="bg-white flex flex-col items-center justify-center h-full px-8 text-center"
          >
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Create Account</h1>

            {signupFormError && (
              <div
                className="w-full mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-600"
                role="alert"
                aria-live="assertive"
              >
                {signupFormError}
              </div>
            )}

            {signupSuccess && (
              <div
                className="w-full mb-4 rounded-md bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-600"
                role="status"
                aria-live="polite"
              >
                {signupSuccess}
              </div>
            )}

            <span className="text-xs text-slate-500 mb-4">Use your email for registration</span>

            <input
              type="text"
              placeholder="Full Name"
              value={signupFullName}
              onChange={(e) => setSignupFullName(e.target.value)}
              className={getInputClassName(Boolean(signupErrors.fullName))}
              name="name"
              autoComplete="name"
              required
              aria-invalid={Boolean(signupErrors.fullName)}
            />
            {signupErrors.fullName && (
              <p className="w-full text-left text-xs text-rose-600 mt-1">• {signupErrors.fullName}</p>
            )}

            <input
              type="email"
              placeholder="Email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              className={`${getInputClassName(Boolean(signupErrors.email))} mt-3`}
              name="email"
              autoComplete="email"
              inputMode="email"
              required
              aria-invalid={Boolean(signupErrors.email)}
            />
            {signupErrors.email && (
              <p className="w-full text-left text-xs text-rose-600 mt-1">• {signupErrors.email}</p>
            )}

            <input
              type="tel"
              placeholder="Phone (e.g. +12025551234)"
              value={signupPhone}
              onChange={(e) => setSignupPhone(e.target.value)}
              className={`${getInputClassName(Boolean(signupErrors.phone))} mt-3`}
              name="tel"
              autoComplete="tel"
              inputMode="tel"
              required
              aria-invalid={Boolean(signupErrors.phone)}
            />
            {signupErrors.phone && (
              <p className="w-full text-left text-xs text-rose-600 mt-1">• {signupErrors.phone}</p>
            )}

            <input
              type="password"
              placeholder="Password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              className={`${getInputClassName(Boolean(signupErrors.password))} mt-3`}
              name="new-password"
              autoComplete="new-password"
              minLength={8}
              required
              aria-invalid={Boolean(signupErrors.password)}
            />
            {signupPassword && (
              <div className="w-full mt-2">
                <div className="h-1 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-1 ${strengthColor} transition-all duration-300`}
                    style={{ width: `${Math.max(strengthPercent, 20)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{passwordStrength.label}</p>
              </div>
            )}

            <input
              type="password"
              placeholder="Confirm Password"
              value={signupConfirmPassword}
              onChange={(e) => setSignupConfirmPassword(e.target.value)}
              className={`${getInputClassName(Boolean(signupErrors.confirmPassword))} mt-3`}
              name="confirm-password"
              autoComplete="new-password"
              minLength={8}
              required
              aria-invalid={Boolean(signupErrors.confirmPassword)}
            />
            {signupErrors.confirmPassword && (
              <p className="w-full text-left text-xs text-rose-600 mt-1">• {signupErrors.confirmPassword}</p>
            )}

            <button
              type="submit"
              disabled={isSignupSubmitting}
              className="mt-6 rounded-full border border-slate-900 bg-slate-900 text-white text-xs font-bold px-11 py-3 uppercase tracking-wider transition-transform hover:scale-95 active:scale-90 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              {isSignupSubmitting ? 'Creating...' : 'Sign Up'}
            </button>
          </form>
        </div>

        {/* Sign In Form Container */}
        <div
          className={`absolute top-0 left-0 w-1/2 h-full transform-gpu transition-transform duration-700 ease-in-out z-[2] ${
            isSignUpMode ? 'translate-x-full pointer-events-none' : 'translate-x-0 pointer-events-auto'
          }`}
          style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
        >
          <form
            onSubmit={handleLoginSubmit}
            noValidate
            aria-busy={isLoginSubmitting}
            className="bg-white flex flex-col items-center justify-center h-full px-8 text-center"
          >
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Sign In</h1>

            {loginFormError && (
              <div
                className="w-full mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-600"
                role="alert"
                aria-live="assertive"
              >
                {loginFormError}
              </div>
            )}

            <span className="text-xs text-slate-500 mb-4">Use your account credentials</span>

            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className={getInputClassName(Boolean(loginErrors.email))}
              name="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="off"
              spellCheck={false}
              required
              aria-invalid={Boolean(loginErrors.email)}
            />
            {loginErrors.email && (
              <p className="w-full text-left text-xs text-rose-600 mt-1">• {loginErrors.email}</p>
            )}

            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className={`${getInputClassName(Boolean(loginErrors.password))} mt-3`}
              name="current-password"
              autoComplete="current-password"
              autoCapitalize="off"
              spellCheck={false}
              required
              aria-invalid={Boolean(loginErrors.password)}
            />
            {loginErrors.password && (
              <p className="w-full text-left text-xs text-rose-600 mt-1">• {loginErrors.password}</p>
            )}

            <label className="flex items-center text-xs text-slate-600 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
              />
              Remember me
            </label>

            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-xs text-slate-600 hover:text-slate-900 mt-3"
            >
              Forgot your password?
            </button>

            <button
              type="submit"
              disabled={isLoginSubmitting}
              className="mt-6 rounded-full border border-slate-900 bg-slate-900 text-white text-xs font-bold px-11 py-3 uppercase tracking-wider transition-transform hover:scale-95 active:scale-90 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              {isLoginSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Overlay Container */}
        <div
          className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transform-gpu transition-transform duration-700 ease-in-out z-[100] ${
            isSignUpMode ? '-translate-x-full' : ''
          }`}
          style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
        >
          <div
            className={`relative -left-full h-full w-[200%] bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 text-white transform-gpu transition-transform duration-700 ease-in-out ${
              isSignUpMode ? 'translate-x-1/2' : 'translate-x-0'
            }`}
            style={{ willChange: 'transform', backfaceVisibility: 'hidden', contain: 'layout paint' }}
          >
            {/* Overlay Left Panel */}
            <div
              className={`absolute top-0 flex items-center justify-center flex-col px-10 text-center h-full w-1/2 transform-gpu transition-transform duration-700 ease-in-out ${
                isSignUpMode ? 'translate-x-0' : '-translate-x-[20%]'
              }`}
              style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
            >
              <h1 className="text-3xl font-bold mb-4">Welcome Back!</h1>
              <p className="text-sm leading-5 tracking-wide mb-6">
                To keep connected with us please login with your personal info
              </p>
              <button
                type="button"
                onClick={() => setIsSignUpMode(false)}
                className="rounded-full border-2 border-white bg-transparent text-white text-xs font-bold px-11 py-3 uppercase tracking-wider transition-transform hover:scale-95 active:scale-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-700"
              >
                Sign In
              </button>
            </div>

            {/* Overlay Right Panel */}
            <div
              className={`absolute top-0 right-0 flex items-center justify-center flex-col px-10 text-center h-full w-1/2 transform-gpu transition-transform duration-700 ease-in-out ${
                isSignUpMode ? 'translate-x-[20%]' : 'translate-x-0'
              }`}
              style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
            >
              <h1 className="text-3xl font-bold mb-4">New Here?</h1>
              <p className="text-sm leading-5 tracking-wide mb-6">
                Create an account to unlock powerful financial insights and take control of your money
              </p>
              <button
                type="button"
                onClick={() => setIsSignUpMode(true)}
                className="rounded-full border-2 border-white bg-transparent text-white text-xs font-bold px-11 py-3 uppercase tracking-wider transition-transform hover:scale-95 active:scale-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-violet-700"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
