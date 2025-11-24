import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { updateAccount, changePassword } from '../../services/authService';

const EditAccount = () => {
    const navigate = useNavigate();
    const { user, refreshProfile } = useAuth();
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPasswordSection, setShowPasswordSection] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
        setSuccess(null);
    };

    const handleUpdateInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const updates: { email?: string; firstName?: string; lastName?: string; phone?: string } = {};
            
            if (formData.email !== user?.email) {
                updates.email = formData.email;
            }
            if (formData.firstName !== user?.firstName) {
                updates.firstName = formData.firstName;
            }
            if (formData.lastName !== user?.lastName) {
                updates.lastName = formData.lastName;
            }
            if (formData.phone !== user?.phone) {
                updates.phone = formData.phone;
            }

            if (Object.keys(updates).length === 0) {
                setError('No changes to save');
                setLoading(false);
                return;
            }

            await updateAccount(updates);
            await refreshProfile();
            setSuccess('Account information updated successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update account');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (formData.newPassword.length < 8) {
            setError('New password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            setLoading(false);
            return;
        }

        try {
            await changePassword(formData.currentPassword, formData.newPassword);
            setSuccess('Password changed successfully!');
            setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswordSection(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-warmgray-50 dark:bg-slate-950">
            {/* Background decorative elements */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-warmgray-50 via-peach-50/30 to-warmgray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full filter blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/5 dark:bg-teal-500/10 rounded-full filter blur-3xl" />
            </div>

            <div className="relative z-10">
                <Header />

                <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-24 lg:pt-28 pb-20">
                    {/* Header Section */}
                    <div className="mb-8">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="inline-flex items-center gap-2 text-sm font-medium text-warmgray-600 hover:text-warmgray-900 dark:text-slate-400 dark:hover:text-white transition-colors group mb-6"
                        >
                            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Dashboard
                        </button>

                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/30">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-warmgray-900 dark:text-white">Account Settings</h1>
                                <p className="text-sm text-warmgray-600 dark:text-slate-400 mt-1">Manage your personal information and security</p>
                            </div>
                        </div>
                    </div>

                    {/* Success/Error Messages */}
                    {success && (
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10 px-4 py-3.5 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{success}</p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10 px-4 py-3.5 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                            <svg className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium text-rose-800 dark:text-rose-200">{error}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Personal Information Card */}
                        <div className="rounded-2xl border border-warmgray-200/80 bg-white dark:border-slate-700/50 dark:bg-slate-900/50 shadow-sm dark:shadow-black/20 overflow-hidden">
                            <div className="px-6 py-5 border-b border-warmgray-200/80 dark:border-slate-700/50 bg-warmgray-50/50 dark:bg-slate-800/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-warmgray-900 dark:text-white">Personal Information</h2>
                                        <p className="text-xs text-warmgray-600 dark:text-slate-400 mt-0.5">Update your account details</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateInfo} className="p-6 space-y-5">
                                {/* First Name */}
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 dark:text-slate-300 mb-2">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-warmgray-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-400/10 outline-none transition-all font-medium"
                                        required
                                    />
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 dark:text-slate-300 mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-warmgray-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-400/10 outline-none transition-all font-medium"
                                        required
                                    />
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 dark:text-slate-300 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1234567890"
                                        className="w-full px-4 py-3 rounded-xl border border-warmgray-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-400/10 outline-none transition-all font-medium placeholder:text-warmgray-400 dark:placeholder:text-slate-500"
                                        required
                                    />
                                    <p className="mt-2 text-xs text-warmgray-500 dark:text-slate-500 flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Include country code (e.g., +1 for US)
                                    </p>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-warmgray-700 dark:text-slate-300 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-warmgray-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-400/10 outline-none transition-all font-medium"
                                        required
                                    />
                                </div>

                                {/* Save Button */}
                                <div className="pt-3">
                                    <button
                                        type="submit"
                                        disabled={loading || (formData.email === user?.email && formData.firstName === user?.firstName && formData.lastName === user?.lastName && formData.phone === user?.phone)}
                                        className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-8 py-3 uppercase tracking-wider transition-all duration-200 hover:opacity-90 hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Updating...
                                            </span>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                </div>
                            </form>

                            {/* Account Info */}
                            <div className="px-6 pb-6">
                                <div className="pt-4 border-t border-warmgray-200 dark:border-slate-700/50">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-warmgray-500 dark:text-slate-500">Account created</span>
                                        <span className="font-medium text-warmgray-700 dark:text-slate-300">
                                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security Card */}
                        <div className="rounded-2xl border border-warmgray-200/80 bg-white dark:border-slate-700/50 dark:bg-slate-900/50 shadow-sm dark:shadow-black/20 overflow-hidden">
                            <div className="px-6 py-5 border-b border-warmgray-200/80 dark:border-slate-700/50 bg-warmgray-50/50 dark:bg-slate-800/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/30 dark:to-rose-800/30 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-warmgray-900 dark:text-white">Password & Security</h2>
                                        <p className="text-xs text-warmgray-600 dark:text-slate-400 mt-0.5">Manage your password and account security</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                {!showPasswordSection ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordSection(true)}
                                        className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 border-warmgray-200 bg-white text-warmgray-700 font-semibold hover:bg-warmgray-50 hover:border-warmgray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:hover:border-slate-600 transition-all duration-200 shadow-sm hover:shadow group"
                                    >
                                        <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                        Change Password
                                    </button>
                                ) : (
                                    <form onSubmit={handleChangePassword} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-warmgray-700 dark:text-slate-300 mb-2">
                                                Current Password
                                            </label>
                                            <input
                                                type="password"
                                                name="currentPassword"
                                                value={formData.currentPassword}
                                                onChange={handleChange}
                                                placeholder="Enter your current password"
                                                className="w-full px-4 py-3 rounded-xl border border-warmgray-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-400/10 outline-none transition-all font-medium placeholder:text-warmgray-400 dark:placeholder:text-slate-500"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-warmgray-700 dark:text-slate-300 mb-2">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={formData.newPassword}
                                                onChange={handleChange}
                                                placeholder="Enter a new password"
                                                className="w-full px-4 py-3 rounded-xl border border-warmgray-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-400/10 outline-none transition-all font-medium placeholder:text-warmgray-400 dark:placeholder:text-slate-500"
                                                required
                                                minLength={8}
                                            />
                                            <p className="mt-2 text-xs text-warmgray-600 dark:text-slate-400 flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Must be at least 8 characters long
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-warmgray-700 dark:text-slate-300 mb-2">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="Re-enter your new password"
                                                className="w-full px-4 py-3 rounded-xl border border-warmgray-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-400/10 outline-none transition-all font-medium placeholder:text-warmgray-400 dark:placeholder:text-slate-500"
                                                required
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-3">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-11 py-3 uppercase tracking-wider transition-all duration-200 hover:opacity-90 hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                {loading ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Changing...
                                                    </span>
                                                ) : (
                                                    'Change Password'
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowPasswordSection(false);
                                                    setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
                                                    setError(null);
                                                }}
                                                className="rounded-full border border-warmgray-300 bg-white text-warmgray-700 text-xs font-bold px-8 py-3 uppercase tracking-wider transition-all duration-200 hover:opacity-80 hover:border-warmgray-400 active:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EditAccount;
