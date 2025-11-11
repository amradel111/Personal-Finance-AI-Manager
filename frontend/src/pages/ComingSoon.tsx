import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

interface ComingSoonProps {
  title: string;
  message?: string;
}

const ComingSoon = ({ title, message }: ComingSoonProps) => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),\n                         linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
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
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-12 text-center">
              <h1 className="text-3xl font-semibold text-white">{title}</h1>
              <p className="mt-3 text-sm text-slate-300">
                {message || 'This page is coming soon. Check back shortly!'}
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center rounded-full bg-white text-slate-900 px-6 py-3 text-sm font-semibold transition hover:bg-slate-100"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ComingSoon;
