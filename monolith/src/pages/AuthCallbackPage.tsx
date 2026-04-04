import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
type Status = 'processing' | 'success' | 'error';

// ─── Live token exchange ────────────────────────────────────────────────────────
const BACKEND_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

interface TokenResponse {
  access_token: string;
  token_type?: string;
  user?: {
    email: string;
    username: string;
  };
}

async function exchangeToken(code: string): Promise<TokenResponse> {
  const res = await fetch(`${BACKEND_URL}/auth/google/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(detail);
  }

  return res.json() as Promise<TokenResponse>;
}

// ─── Animated progress bar ─────────────────────────────────────────────────────
const ProgressBar = () => (
  <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden mt-8">
    <motion.div
      className="h-full bg-gradient-to-r from-indigo-500 via-blue-400 to-indigo-500 rounded-full"
      initial={{ x: '-100%' }}
      animate={{ x: '100%' }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);

// ─── Orbiting rings decoration ─────────────────────────────────────────────────
const OrbitRings = () => (
  <div className="relative w-24 h-24 flex items-center justify-center">
    {/* Outer ring */}
    <motion.div
      className="absolute inset-0 rounded-full border border-indigo-500/20"
      animate={{ rotate: 360 }}
      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
    >
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
    </motion.div>
    {/* Middle ring */}
    <motion.div
      className="absolute inset-2 rounded-full border border-blue-500/15"
      animate={{ rotate: -360 }}
      transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
    >
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-400/60" />
    </motion.div>
    {/* Icon core */}
    <motion.div
      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/25 to-blue-600/10 border border-indigo-400/25 flex items-center justify-center"
      animate={{
        boxShadow: [
          '0 0 20px rgba(99,102,241,0.2)',
          '0 0 40px rgba(99,102,241,0.4)',
          '0 0 20px rgba(99,102,241,0.2)',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Cpu size={26} className="text-indigo-400" />
    </motion.div>
  </div>
);

// ─── Processing State ──────────────────────────────────────────────────────────
const ProcessingView = () => (
  <motion.div
    key="processing"
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.97 }}
    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    className="flex flex-col items-center"
  >
    <OrbitRings />

    <h1 className="text-white text-xl font-bold mt-6 tracking-tight">
      Securing Neural Link...
    </h1>
    <p className="text-gray-400 text-sm mt-2 max-w-xs leading-relaxed">
      Exchanging cryptographic tokens with Google Workspace.
    </p>

    <ProgressBar />

    {/* Step indicators */}
    <div className="mt-6 space-y-2 w-full text-left">
      {[
        { label: 'Authorization code received', done: true },
        { label: 'Verifying OAuth 2.0 handshake', done: true },
        { label: 'Provisioning access tokens', done: false },
      ].map((step, i) => (
        <motion.div
          key={step.label}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15, duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <div
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              step.done
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]'
                : 'bg-indigo-400 animate-pulse shadow-[0_0_6px_rgba(99,102,241,0.7)]'
            }`}
          />
          <span
            className={`text-[11px] font-medium uppercase tracking-widest ${
              step.done ? 'text-white/40' : 'text-white/70'
            }`}
          >
            {step.label}
          </span>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

// ─── Success Flash (brief) ─────────────────────────────────────────────────────
const SuccessView = () => (
  <motion.div
    key="success"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    className="flex flex-col items-center"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
      className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center"
      style={{ boxShadow: '0 0 40px rgba(52,211,153,0.2)' }}
    >
      <ShieldCheck size={36} className="text-emerald-400" />
    </motion.div>
    <h1 className="text-white text-xl font-bold mt-6 tracking-tight">
      Connection Established
    </h1>
    <p className="text-gray-400 text-sm mt-2">Redirecting to Intelligence Engine...</p>
  </motion.div>
);

// ─── Error State ───────────────────────────────────────────────────────────────
const ErrorView = ({ onRetry }: { onRetry: () => void }) => (
  <motion.div
    key="error"
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.4 }}
    className="flex flex-col items-center"
  >
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center"
      style={{ boxShadow: '0 0 40px rgba(239,68,68,0.15)' }}
    >
      <AlertTriangle size={36} className="text-red-400" />
    </motion.div>

    <h1 className="text-white text-xl font-bold mt-6 tracking-tight">
      Authorization Failed
    </h1>
    <p className="text-gray-400 text-sm mt-2 max-w-xs leading-relaxed">
      The OAuth handshake was rejected or the authorization code is missing. Please try again.
    </p>

    <div className="flex flex-col gap-3 mt-8 w-full">
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onRetry}
        className="w-full py-3.5 rounded-xl border border-white/20 text-white text-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center justify-center gap-2">
          <ArrowLeft size={15} />
          Return to Dashboard
        </span>
      </motion.button>
    </div>

    <p className="mt-6 text-[10px] text-white/20 uppercase tracking-widest">
      Error Code: OAUTH_EXCHANGE_FAILED
    </p>
  </motion.div>
);

// ─── Page ──────────────────────────────────────────────────────────────────────
export const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('processing');

  useEffect(() => {
    const token = searchParams.get('token'); // Fast path: backend already exchanged code (GET flow)
    const code  = searchParams.get('code');  // Slow path: frontend received code directly (POST flow)
    const error = searchParams.get('error'); // Google sends ?error=access_denied on rejection

    if (error) {
      setStatus('error');
      return;
    }

    // ── Fast path: backend redirected here with the JWT already minted ──────────
    if (token) {
      const email = searchParams.get('email') || '';
      localStorage.setItem('monolith_token', token);
      localStorage.setItem('monolith_auth', 'true');
      localStorage.setItem('monolith_user_email', email);
      setStatus('success');
      setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
      return;
    }

    // ── Slow path: frontend got the code directly from Google (local dev) ───────
    if (!code) {
      setStatus('error');
      return;
    }

    exchangeToken(code)
      .then((data) => {
        localStorage.setItem('monolith_token', data.access_token);
        localStorage.setItem('monolith_auth', 'true');
        localStorage.setItem('monolith_user_email', data.user?.email ?? '');
        setStatus('success');
        setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
      })
      .catch((err: unknown) => {
        console.error('OAuth Exchange Failed:', err);
        setStatus('error');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => navigate('/', { replace: true });

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-indigo-600/8 blur-[140px]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-blue-500/8 blur-[80px]" />
      </div>

      {/* Liquid Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 w-full max-w-[420px] bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
      >
        {/* MONOLITH wordmark */}
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-8">
          MONOLITH · Intelligence Engine
        </p>

        <AnimatePresence mode="wait">
          {status === 'processing' && <ProcessingView key="processing" />}
          {status === 'success'    && <SuccessView    key="success" />}
          {status === 'error'      && <ErrorView      key="error" onRetry={handleRetry} />}
        </AnimatePresence>

        {/* Footer */}
        {status === 'processing' && (
          <p className="mt-8 text-[9px] text-white/15 uppercase tracking-widest">
            OAuth 2.0 · TLS 1.3 · End-to-End Encrypted
          </p>
        )}
      </motion.div>
    </div>
  );
};
