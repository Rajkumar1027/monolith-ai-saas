import React, { useState, useEffect } from 'react';
import '../landing.css';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Mail, Lock, User, Eye, EyeOff, Chrome, Github, Facebook, Send, ChevronRight, AlertCircle } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../lib/api';

const TerminalFeed = () => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const messages = [
      'INITIALIZING_NEURAL_LINK...',
      'ENCRYPTED_TUNNEL_ESTABLISHED',
      'NODE_ID: VDC9G_ACTIVE',
      'SCANNING_BIOMETRIC_SIGNATURE...',
      'ACCESS_REQUEST_RECEIVED',
      'BYPASSING_FIREWALL_LAYER_4',
      'PROTOCOL_OMEGA_ENGAGED',
      'DATA_STREAM_SYNCED',
    ];

    const interval = setInterval(() => {
      setLogs(prev => {
        const next = [...prev, messages[Math.floor(Math.random() * messages.length)]];
        return next.slice(-8);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-6 left-6 font-mono text-[10px] text-neon-cyan/20 pointer-events-none z-0">
      {logs.map((log, i) => (
        <div key={i} className="flex gap-2">
          <span>[{new Date().toLocaleTimeString()}]</span>
          <span>{log}</span>
        </div>
      ))}
    </div>
  );
};

const PasswordStrength = ({ password }: { password: string }) => {
  const strength = Math.min(password.length * 10, 100);
  const color = strength > 80 ? 'bg-neon-cyan' : strength > 40 ? 'bg-yellow-500' : 'bg-neon-purple';
  
  return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between text-[8px] font-mono text-white/20 uppercase tracking-widest">
        <span>Strength</span>
        <span>{strength}%</span>
      </div>
      <div className="h-[1px] bg-white/5 w-full">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${strength}%` }}
          className={`h-full ${color} shadow-[0_0_8px_currentColor]`}
        />
      </div>
    </div>
  );
};

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginUser({ email: formData.email, password: formData.password });
        if (res.access_token) {
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('monolith_user', JSON.stringify(res.user));
          localStorage.setItem('monolith_auth', 'true');
          navigate('/dashboard');
        } else {
          setError(res.detail || 'Invalid credentials');
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }
        const res = await registerUser({ username: formData.username, email: formData.email, password: formData.password });
        if (res.access_token) {
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('monolith_user', JSON.stringify(res.user));
          localStorage.setItem('monolith_auth', 'true');
          navigate('/dashboard');
        } else if (res.message) {
          setMode('login');
          setError('Registration successful! Please login.');
        } else {
          setError(res.detail || 'Registration failed');
        }
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('invalid credentials') || msg.toLowerCase().includes('incorrect')) {
        setError('Invalid email or password. Please try again.');
      } else if (msg.toLowerCase().includes('session expired')) {
        setError('Your session has expired. Please log in again.');
      } else if (msg.toLowerCase().includes('database') || msg.toLowerCase().includes('service')) {
        setError('Service temporarily unavailable. Please try again shortly.');
      } else {
        setError(msg || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-black">
      <div className="fixed inset-0 grid-bg opacity-10 pointer-events-none" />
      <TerminalFeed />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Double Border Effect */}
        <div className="absolute -inset-1 border border-neon-cyan/30 blur-sm pointer-events-none" />
        <div className="absolute -inset-[2px] border border-neon-cyan pointer-events-none" />
        
        <div className="bg-black p-8 relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center border border-neon-cyan/30 bg-neon-cyan/5">
                <Zap className="w-6 h-6 text-neon-cyan" />
              </div>
              <div className="flex flex-col">
                <motion.h1 
                  animate={{ 
                    opacity: [0.8, 1, 0.8],
                    textShadow: [
                      "0 0 0px rgba(255,255,255,0)",
                      "0 0 10px rgba(255,255,255,0.2)",
                      "0 0 0px rgba(255,255,255,0)"
                    ]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="text-2xl font-black tracking-tight text-white leading-none"
                >
                  MONOLITH
                </motion.h1>
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mt-1">
                  INTELLIGENCE ENGINE
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 font-mono text-[10px] tracking-widest">
              <button 
                onClick={() => setMode('login')}
                className={`transition-all duration-300 flex items-center gap-1 ${mode === 'login' ? 'text-neon-cyan' : 'text-white/20 hover:text-white/40'}`}
              >
                <span>[</span>
                <span className="uppercase">LOGIN</span>
                <span>]</span>
              </button>
              <button 
                onClick={() => setMode('register')}
                className={`transition-all duration-300 flex items-center gap-1 ${mode === 'register' ? 'text-neon-cyan' : 'text-white/20 hover:text-white/40'}`}
              >
                <span>[</span>
                <span className="uppercase">REGISTER</span>
                <span>]</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {mode === 'register' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                      <User className="w-3 h-3" />
                      <span>User Name</span>
                      <span className="text-neon-purple ml-auto">•</span>
                    </div>
                    <input
                      type="text"
                      name="username"
                      placeholder="USER NAME"
                      required
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border-b border-white/10 py-2 font-mono text-sm text-neon-cyan placeholder:text-white/10 focus:outline-none focus:border-neon-cyan transition-all uppercase tracking-widest"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    <Mail className="w-3 h-3" />
                    <span>Email ID</span>
                    <span className="text-neon-purple ml-auto">•</span>
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="EMAIL ID"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-b border-white/10 py-2 font-mono text-sm text-neon-cyan placeholder:text-white/10 focus:outline-none focus:border-neon-cyan transition-all uppercase tracking-widest"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    <Lock className="w-3 h-3" />
                    <span>Password</span>
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="ml-auto hover:text-neon-cyan transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <span className="text-neon-purple ml-1">•</span>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="PASSWORD"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-b border-white/10 py-2 font-mono text-sm text-neon-cyan placeholder:text-white/10 focus:outline-none focus:border-neon-cyan transition-all uppercase tracking-widest"
                  />
                  {mode === 'register' && <PasswordStrength password={formData.password} />}
                </div>

                {mode === 'register' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                      <Lock className="w-3 h-3" />
                      <span>Confirm Password</span>
                      <span className="text-neon-purple ml-auto">•</span>
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="CONFIRM PASSWORD"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border-b border-white/10 py-2 font-mono text-sm text-neon-cyan placeholder:text-white/10 focus:outline-none focus:border-neon-cyan transition-all uppercase tracking-widest"
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between text-[10px] font-mono tracking-widest">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="hidden" />
                <div className="w-3 h-3 border border-white/20 group-hover:border-neon-cyan transition-all flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-neon-cyan opacity-0 group-hover:opacity-20" />
                </div>
                <span className="text-white/20 group-hover:text-white/40 transition-colors">REMEMBER_ME</span>
              </label>
              <button type="button" className="text-neon-purple hover:text-neon-cyan transition-colors">
                FORGOT_PASSWORD?
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono uppercase tracking-widest mt-4"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.05 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className={`w-full py-5 rounded-full liquid-glass transition-all duration-300 group relative ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2 text-white font-black font-mono tracking-[0.2em] text-glow">
                {loading ? 'PROCESSING...' : (mode === 'login' ? 'ACCESS_SYSTEM' : 'CREATE_IDENTITY')}
                {!loading && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </span>
              <div className="liquid-glass-streak" />
            </motion.button>

            {/* Dev Mode Bypass */}
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('monolith_auth', 'true');
                localStorage.setItem('access_token', 'dev-token-99');
                localStorage.setItem('monolith_user', JSON.stringify({ email: 'dev@monolith.ai', username: 'DEV_USER' }));
                window.location.href = '/dashboard';
              }}
              className="w-full mt-4 py-3 border border-white/5 text-[9px] text-white/20 hover:text-neon-cyan hover:border-neon-cyan/20 transition-all font-mono uppercase tracking-[0.3em] rounded-xl hover:bg-white/[0.02]"
            >
              [ BYPASS_AUTH_GATE_DEV_ONLY ]
            </button>
          </form>

          <div className="mt-12 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-black px-4 text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">
                  External_Nodes
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {[Chrome, Github, Facebook, Mail].map((Icon, i) => (
                <button 
                  key={i}
                  className="flex items-center justify-center p-3 border border-white/5 hover:border-neon-cyan hover:bg-neon-cyan/5 transition-all group"
                >
                  <Icon className="w-4 h-4 text-white/20 group-hover:text-neon-cyan transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between font-mono text-[8px] text-white/10 tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
              ENCRYPTED_TUNNEL_ACTIVE
            </div>
            <div>NODE_ID: VDC9G</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
