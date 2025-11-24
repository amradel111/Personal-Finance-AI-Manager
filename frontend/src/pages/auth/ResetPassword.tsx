import { FormEvent, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../services/authService';
import { PASSWORD_REQUIREMENTS, getPasswordStrength, meetsPasswordRequirements } from '../../utils/validation';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const missingToken = !token;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setStatusMessage('');

    if (missingToken) {
      setFormError('This password reset link is invalid or has expired. Please request a new one.');
      return;
    }

    const errors: { password?: string; confirm?: string } = {};

    if (!newPassword) {
      errors.password = 'New password is required';
    } else if (!meetsPasswordRequirements(newPassword)) {
      errors.password = 'Password does not meet the requirements';
    }

    if (!confirmPassword) {
      errors.confirm = 'Please confirm your new password';
    } else if (confirmPassword !== newPassword) {
      errors.confirm = 'Passwords do not match';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { message } = await resetPassword(token, newPassword);
      setStatusMessage(message || 'Your password has been successfully updated. You can now sign in with your new password.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const fallback = 'Unable to reset your password at this time. Please request a new reset link.';
      const message =
        typeof error === 'string'
          ? error
          : error instanceof Error
          ? error.message
          : fallback;
      setFormError(message || fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-auto">
      {/* Background gradient matching Auth page */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full filter blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/8 rounded-full filter blur-3xl"></div>
        </div>
      </div>

      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-wide">SaveMate</h1>
        </div>
        <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] p-8">
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="text-xs text-slate-500 hover:text-slate-900 mb-6 transition-colors"
          >
            ← Back to sign in
          </button>

          <h1 className="text-2xl font-bold mb-2">Create new password</h1>
          <p className="text-sm text-slate-500 mb-6">
            Please choose a strong password that meets all the requirements below.
          </p>

        {formError && (
          <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-600" role="alert">
            {formError}
          </div>
        )}

        {statusMessage && (
          <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-600" role="status">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="password" className="block text-xs uppercase tracking-wide text-slate-500 mb-2">
              New password
            </label>
            <input
              id="password"
              type="password"
              className={`w-full bg-slate-100 border border-slate-200 rounded-md px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                fieldErrors.password ? 'ring-2 ring-rose-500' : ''
              }`}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
            {fieldErrors.password && <p className="text-xs text-rose-600 mt-1">• {fieldErrors.password}</p>}

            {newPassword && (
              <div className="mt-3">
                <div className="h-1 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-1 transition-all duration-300 ${
                      passwordStrength.level === 'strong'
                        ? 'bg-emerald-500'
                        : passwordStrength.level === 'medium'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max((passwordStrength.score / PASSWORD_REQUIREMENTS.length) * 100, 20)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{passwordStrength.label}</p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirm" className="block text-xs uppercase tracking-wide text-slate-500 mb-2">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              className={`w-full bg-slate-100 border border-slate-200 rounded-md px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                fieldErrors.confirm ? 'ring-2 ring-rose-500' : ''
              }`}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
            {fieldErrors.confirm && <p className="text-xs text-rose-600 mt-1">• {fieldErrors.confirm}</p>}
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700">Password requirements</p>
            <ul className="list-disc list-inside space-y-1">
              {PASSWORD_REQUIREMENTS.map((requirement) => (
                <li key={requirement.label}>{requirement.label}</li>
              ))}
            </ul>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-slate-900 text-white text-sm font-semibold py-3 tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating...' : 'Update password'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
