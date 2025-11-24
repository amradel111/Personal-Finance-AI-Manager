import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../../services/authService';
import { isValidEmail } from '../../utils/validation';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [formError, setFormError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setStatusMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setFieldError('Email is required');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setFieldError('Please enter a valid email address');
      return;
    }

    setFieldError('');
    setIsSubmitting(true);

    try {
      const { message } = await requestPasswordReset(trimmedEmail);
      setStatusMessage(message || 'If your email is registered, you will receive password reset instructions shortly.');
    } catch (error) {
      const fallback = 'Unable to process your request at this time. Please try again later.';
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

          <h1 className="text-2xl font-bold mb-2">Reset your password</h1>
          <p className="text-sm text-slate-500 mb-6">
            Enter your email address and we'll send you instructions to reset your password.
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
            <label htmlFor="email" className="block text-xs uppercase tracking-wide text-slate-500 mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              className={`w-full bg-slate-100 border border-slate-200 rounded-md px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                fieldError ? 'ring-2 ring-rose-500' : ''
              }`}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
            {fieldError && <p className="text-xs text-rose-600 mt-1">• {fieldError}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-slate-900 text-white text-sm font-semibold py-3 tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
