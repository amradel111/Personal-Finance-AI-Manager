import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkProfileStatus } from '../../services/authService';

const Card = ({ title, message }: { title: string; message: string }) => (
  <div className="max-w-md w-full bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-10 text-center space-y-4">
    <h1 className="text-3xl font-semibold text-white">{title}</h1>
    <p className="text-slate-200">{message}</p>
  </div>
);

const Dashboard = () => {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await checkProfileStatus();
        if (isMounted) setHasProfile(Boolean(res?.hasProfile));
      } catch {
        if (isMounted) setHasProfile(false);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen relative bg-slate-900">
      {/* Background consistent with Auth/ProfileSetup */}
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

      {/* Main content placeholder */}
      <div className="relative z-0 flex items-center justify-center min-h-screen px-4">
        <Card title="Dashboard" message="Dashboard experience coming soon." />
      </div>

      {/* Overlay when no profile */}
      {hasProfile === false && (
        <div className="absolute inset-0 z-10 backdrop-blur-sm bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl p-8 text-center">
            <h2 className="text-2xl font-semibold text-slate-900">Set up your profile for a tailored experience</h2>
            <p className="text-slate-600 mt-2 text-sm">We use your household and income details to personalize insights and recommendations.</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/profile-setup')}
                className="rounded-full border border-slate-900 bg-slate-900 text-white text-xs font-bold px-8 py-3 uppercase tracking-wider transition-transform hover:scale-95 active:scale-90"
              >
                Set up profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
