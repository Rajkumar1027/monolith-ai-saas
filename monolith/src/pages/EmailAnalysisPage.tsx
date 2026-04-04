import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Sparkles,
  Mail,
  ChevronDown,
  ChevronUp,
  Zap,
  Reply,
  Trash2,
  Archive,
  Activity,
  MessageSquare,
  Calendar,
  UserCheck,
  ZapOff,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  Send,
  MoreVertical,
  Clock,
  Lock,
  Link,
} from 'lucide-react';
import { cn } from '../utils/cn';
import ReactMarkdown from 'react-markdown';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ─── Design System ────────────────────────────────────────────────────────────
const GLASS_CARD = 'backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-2xl p-6';
const GLASS_PILL = 'backdrop-blur-md bg-white/10 border border-white/10 rounded-full px-4 py-1.5 transition-all hover:bg-white/20 cursor-pointer';

const SENTIMENT = {
  Positive: { color: '#30D158', bg: 'rgba(48, 209, 88, 0.12)', border: 'rgba(48, 209, 88, 0.25)', Icon: TrendingUp },
  Negative: { color: '#FF453A', bg: 'rgba(255, 69, 58, 0.12)', border: 'rgba(255, 69, 58, 0.25)', Icon: TrendingDown },
  Neutral:  { color: '#F5A623', bg: 'rgba(245, 166, 35, 0.10)', border: 'rgba(245, 166, 35, 0.25)', Icon: Minus },
};


// ─── Live Email Type ────────────────────────────────────────────────────────────
interface LiveEmail {
  id: string;
  sender: string;
  subject: string;
  full_text: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
}

const TREND_DATA = [
  { name: 'Positive', current: 72.4, previous: 65.2 },
  { name: 'Neutral',  current: 18.1, previous: 22.8 },
  { name: 'Negative', current:  9.5, previous: 12.0 },
];

const SMART_LABELS = ['Urgent', 'Billing', 'Support', 'Legal', 'Feature Request', 'Compliance', 'Reporting'];

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, monthA, monthB }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#0a0a0a] border border-white/10 px-5 py-4 rounded-xl shadow-2xl backdrop-blur-xl min-w-[180px]">
      <p className="text-[9px] uppercase font-black tracking-widest text-white/40 mb-3">{d.name}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-10">
          <span className="text-white/40 text-[10px] uppercase tracking-wide">{monthB}</span>
          <span className="font-bold text-[#3B82F6] text-sm">{d.current}%</span>
        </div>
        <div className="flex justify-between gap-10">
          <span className="text-white/30 text-[10px] uppercase tracking-wide">{monthA}</span>
          <span className="font-bold text-white/30 text-sm">{d.previous}%</span>
        </div>
        <div className="pt-2 mt-1 border-t border-white/5 flex justify-between text-[9px] font-black uppercase">
          <span className="text-white/20">Δ YoY</span>
          <span className={d.current >= d.previous ? 'text-emerald-400' : 'text-red-400'}>
            {d.current >= d.previous ? '▲' : '▼'} {Math.abs(d.current - d.previous).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Component ─────────────────────────────────────────────────────────────────
export const EmailAnalysisPage = () => {
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [activeTab, setActiveTab]         = useState('All');
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [activeLabels, setActiveLabels]   = useState<string[]>(['Urgent']);
  const [composerTone, setComposerTone]   = useState('Formal');
  const [composerLength, setComposerLength] = useState('Med');
  const [draftText, setDraftText]         = useState('');
  const [monthA, setMonthA]               = useState('January');
  const [monthB, setMonthB]               = useState('February');
  const [summaryQuery, setSummaryQuery]   = useState('');
  const [showToast, setShowToast]         = useState(false);
  const [isConnecting, setIsConnecting]   = useState(false);
  const [emails, setEmails]               = useState<LiveEmail[]>([]);
  const [isSyncing, setIsSyncing]         = useState(false);
  const [syncError, setSyncError]         = useState<string | null>(null);

  // ─── Live email fetch ──────────────────────────────────────────────────────────
  const userEmail = localStorage.getItem('monolith_user_email') || '';
  const API_URL   = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchEmails = useCallback(async () => {
    if (!userEmail) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(`${API_URL}/api/emails/sync?user_email=${encodeURIComponent(userEmail)}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setEmails(data.emails || []);
    } catch (err: any) {
      setSyncError(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [userEmail, API_URL]);

  useEffect(() => {
    if (isGmailConnected) fetchEmails();
  }, [isGmailConnected, fetchEmails]);

  const handleConnectGmail = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = 'https://monolith-ai-saas.onrender.com/auth/google/callback';
    const scope = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

    if (!clientId) {
      alert('Missing VITE_GOOGLE_CLIENT_ID in .env file');
      return;
    }
    window.location.href = authUrl;
  };

  const toggleLabel = (label: string) =>
    setActiveLabels(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);

  const handleAutoAll = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // ─── Normalise live API fields to UI-friendly shape ─────────────────────────
  const normalisedEmails = useMemo(() => emails.map(e => ({
    ...e,
    // Map UPPERCASE API sentiment to Title-case used by SENTIMENT colour map
    sentimentKey: (e.sentiment.charAt(0) + e.sentiment.slice(1).toLowerCase()) as 'Positive' | 'Negative' | 'Neutral',
    avatar:  (e.sender.split(/[\s<@]/)[0]?.[0] ?? '?').toUpperCase() +
             (e.sender.split(/[\s<@]/)[1]?.[0] ?? '').toUpperCase(),
    preview: e.full_text?.slice(0, 120) ?? '',
  })), [emails]);

  const filteredEmails = useMemo(() => {
    return normalisedEmails.filter(e => {
      const matchesSearch = e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            e.sender.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeTab === 'All')      return matchesSearch;
      if (activeTab === 'Positive') return matchesSearch && e.sentimentKey === 'Positive';
      if (activeTab === 'Negative') return matchesSearch && e.sentimentKey === 'Negative';
      if (activeTab === 'Neutral')  return matchesSearch && e.sentimentKey === 'Neutral';
      return matchesSearch;
    });
  }, [normalisedEmails, searchQuery, activeTab]);

  const targetEmail = filteredEmails.find(e => e.id === selectedEmail);

  // ─── Gmail OAuth empty state ──────────────────────────────────────────────────
  if (!isGmailConnected) {
    return (
      <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center px-4">
        {/* Ambient orb glow behind card */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 w-full max-w-[500px] bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-10 flex flex-col items-center text-center shadow-[0_0_80px_rgba(0,0,0,0.6)]"
        >
          {/* Icon */}
          <motion.div
            animate={{ boxShadow: ['0 0 24px rgba(99,102,241,0.25)', '0 0 48px rgba(99,102,241,0.45)', '0 0 24px rgba(99,102,241,0.25)'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/10 border border-indigo-500/20 flex items-center justify-center mb-8"
          >
            <Mail size={36} className="text-indigo-400" />
          </motion.div>

          {/* Headline */}
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-3">
            Initialize Neural Inbox
          </h1>

          {/* Subheadline */}
          <p className="text-sm text-gray-400 leading-relaxed max-w-sm mb-10">
            Connect your Google Workspace to stream live support emails into the Monolith AI ingestion engine.
          </p>

          {/* Primary CTA */}
          <motion.button
            id="connect-gmail-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleConnectGmail}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-black rounded-xl py-4 text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.12)] hover:shadow-[0_0_50px_rgba(255,255,255,0.22)] transition-shadow"
          >
            <Lock size={15} strokeWidth={2.5} />
            Connect Google Workspace
          </motion.button>

          {/* Dev bypass — remove in production */}
          <button
            onClick={() => setIsGmailConnected(true)}
            className="mt-5 text-[10px] uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors font-bold"
          >
            Preview dashboard (dev only)
          </button>

          {/* Footer hint */}
          <p className="mt-8 text-[10px] text-white/20 uppercase tracking-widest">
            OAuth 2.0 · Read-Only Scope · End-to-End Encrypted
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans leading-relaxed relative">
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

      {/* ── 1. HEADER ─────────────────────────────────────────── */}
      <header>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          {/* Left — Title Block */}
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase mb-4">Intelligence Engine</p>
            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter mb-4">
              <span className="text-white">Email</span>{' '}
              <span className="text-gray-500">Analysis</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl">
              Monitor neural sentiment streams, intercept communications, and deploy AI-assisted responses.
            </p>
          </div>

          {/* Right — Control Bar */}
          <div className="flex items-center gap-3 flex-shrink-0 pb-1">
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-white/20 font-black mr-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#30D158] animate-pulse" />
              Neural Sync Active
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={async () => {
                setShowToast(true);
                await fetchEmails();
                setTimeout(() => setShowToast(false), 2500);
              }}
              disabled={isSyncing}
              className="px-5 py-2.5 bg-white/5 text-white/50 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <Zap size={11} /> {isSyncing ? 'Syncing...' : 'Sync'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsGmailConnected(false)}
              className="px-6 py-2.5 bg-white text-black font-black rounded-full text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all flex items-center gap-2"
            >
              <Lock size={10} />
              Disconnect Gmail
            </motion.button>
          </div>
        </div>
      </header>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white text-black text-[10px] font-black uppercase px-6 py-3 rounded-full shadow-2xl tracking-widest"
          >
            ✦ Syncing Neural Responses...
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. METRIC TILES ───────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-4">
        {[
          { label: 'Positive', val: '72.4', icon: TrendingUp,   color: '#30D158', delta: '+7.2%' },
          { label: 'Neutral',  val: '18.1', icon: Minus,        color: '#F5A623', delta: '-4.7%' },
          { label: 'Negative', val: '09.5', icon: TrendingDown, color: '#FF453A', delta: '-2.5%' },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className={GLASS_CARD + ' group hover:bg-white/[0.07] transition-all'}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] uppercase tracking-[0.2em] font-black text-white/25">{m.label} Sentiment</span>
                <Icon size={13} style={{ color: m.color }} />
              </div>
              <div className="text-4xl font-black tracking-tighter" style={{ color: m.color }}>
                {m.val}<span className="text-base font-light text-white/20">%</span>
              </div>
              <div className="mt-2 text-[9px] font-black uppercase tracking-widest" style={{ color: m.color, opacity: 0.6 }}>
                {m.delta} MoM
              </div>
            </div>
          );
        })}
      </section>

      {/* ── 3. SEARCH ─────────────────────────────────────────── */}
      <section>
        <div className={cn(GLASS_CARD, 'flex items-center gap-3 py-3.5 group focus-within:border-white/20 transition-all')}>
          <Search size={16} className="text-white/20 group-focus-within:text-white/40 transition-colors" />
          <input
            type="text"
            placeholder="Search intelligence streams, senders, or intercept IDs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm placeholder:text-white/15 text-white/80"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-white/20 hover:text-white transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      </section>

      {/* ── 4. STATUS FILTERS ─────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-white/[0.04] rounded-2xl border border-white/10">
          {['All', 'Positive', 'Negative', 'Neutral', 'Unread', 'Read'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                'px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all',
                activeTab === t ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white'
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="text-[9px] uppercase tracking-widest text-white/20 font-black">
          {filteredEmails.length} / {emails.length} intercepts
        </div>
      </section>

      {/* ── 5. NEURAL LABELS ──────────────────────────────────── */}
      <section className={cn(GLASS_CARD, 'py-3 px-5 flex items-center gap-4 overflow-x-auto hide-scrollbar bg-white/[0.06] border-white/[0.15] shadow-[0_0_20px_rgba(255,255,255,0.03)]')}>
        <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-[0.2em] text-white/30 whitespace-nowrap border-r border-white/10 pr-4">
          <Sparkles size={11} className="text-blue-400" />
          Neural Labels
        </div>
        <div className="flex gap-2 flex-nowrap">
          {SMART_LABELS.map(label => {
            const isActive = activeLabels.includes(label);
            return (
              <button
                key={label}
                onClick={() => toggleLabel(label)}
                className={cn(
                  'px-3 py-1 text-[9px] rounded-full transition-all cursor-pointer whitespace-nowrap border uppercase tracking-wider font-black',
                  isActive
                    ? 'bg-white text-black border-white shadow-[0_0_18px_rgba(255,255,255,0.25)]'
                    : 'bg-white/[0.04] border-white/[0.12] text-white/40 hover:bg-white/10 hover:text-white hover:border-white/20'
                )}
              >
                <span className={isActive ? 'text-black/30' : 'text-white/20'}># </span>
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 6. UNIFIED INBOX ──────────────────────────────────── */}
      <section
        className="relative bg-[rgba(255,255,255,0.015)] backdrop-blur-sm border-2 border-[rgba(255,255,255,0.12)] rounded-[20px] overflow-hidden"
        style={{ paddingBottom: selectedEmail ? '200px' : '8px' }}
      >
        {/* Inbox Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <Mail size={14} className="text-white/30" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Inbox</span>
            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              {emails.length} Live
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-white/20 font-black uppercase tracking-widest">
            <Clock size={10} />
            <span>{isSyncing ? 'Syncing...' : syncError ? `Error: ${syncError}` : `${emails.length} emails loaded`}</span>
          </div>
        </div>

        {/* Email Rows */}
        {isSyncing && emails.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-white/30">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <Activity size={22} className="text-indigo-400" />
            </motion.div>
            <p className="text-[11px] uppercase tracking-widest font-black">Scanning for Intelligence...</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="py-16 text-center text-white/20 text-sm font-light">
            {emails.length === 0 ? 'Click Sync to load live emails from your inbox.' : 'No emails match current filters.'}
          </div>
        ) : (
          filteredEmails.map((email, index) => {
            const isExpanded = expandedId === email.id;
            const isSelected = selectedEmail === email.id;
            const isLast     = index === filteredEmails.length - 1;
            const s = SENTIMENT[email.sentimentKey];
            const SIcon = s.Icon;

            return (
              <div
                key={email.id}
                className={cn(
                  'cursor-pointer transition-all duration-200 group overflow-hidden',
                  !isLast && 'border-b border-white/[0.06]',
                  isSelected && 'bg-blue-500/[0.06] border-l-2 border-l-blue-500/40'
                )}
              >
                {/* Summary Row */}
                <div
                  onClick={() => {
                    setExpandedId(isExpanded ? null : email.id);
                    setSelectedEmail(email.id);
                  }}
                  className="p-5 flex items-start md:items-center gap-4 hover:bg-white/[0.025] transition-colors"
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border"
                    style={{ background: s.bg, borderColor: s.border, color: s.color }}
                  >
                    {email.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-bold text-white/90 truncate">
                        {email.sender}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/70 font-medium leading-tight truncate pr-4">{email.subject}</p>
                    {!isExpanded && (
                      <p className="text-[10px] text-white/25 mt-0.5 truncate">{email.preview}</p>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Sentiment Badge */}
                    <div
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border"
                      style={{ background: s.bg, borderColor: s.border, color: s.color }}
                    >
                      <SIcon size={9} />
                      {email.sentimentKey}
                    </div>
                    <span className="text-[9px] text-white/20 font-bold whitespace-nowrap">{Math.round(email.confidence * 100)}% conf</span>
                    {isExpanded ? <ChevronUp size={14} className="text-white/20" /> : <ChevronDown size={14} className="text-white/20" />}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                      className="px-5 pb-5 border-t border-white/[0.05] bg-white/[0.015]"
                    >
                      <div className="flex gap-4 pt-5">
                        {/* Thread */}
                        <div className="flex-1 prose prose-invert prose-base max-w-none leading-[1.75] [&>p]:text-[15px] [&>p]:text-gray-300 [&>p]:mb-4 [&>ul]:text-[15px] [&>ul]:text-gray-300 [&>ul]:space-y-2 [&>h2]:text-white [&>h2]:font-bold [&>h2]:mb-3 [&>strong]:text-white [&>p>strong]:text-white [&>p>a]:text-blue-400">
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">{email.full_text}</p>
                        </div>
                        {/* Thread Meta */}
                        <div className="w-40 flex-shrink-0 space-y-2 pt-1">
                          <div className="text-[8px] uppercase font-black tracking-widest text-white/20 mb-2">Sentiment</div>
                          <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: SENTIMENT[email.sentimentKey].color }}>
                            {email.sentimentKey}
                          </div>
                          <div className="text-[9px] text-white/30">{Math.round(email.confidence * 100)}% confidence</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-5 flex justify-between items-center">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedEmail(email.id)}
                            className={GLASS_PILL + ' text-[9px] uppercase font-black tracking-widest flex items-center gap-1.5'}
                          >
                            <Reply size={11} /> Reply
                          </button>
                          <button className={GLASS_PILL + ' text-[9px] uppercase font-black tracking-widest flex items-center gap-1.5'}>
                            <Archive size={11} /> Archive
                          </button>
                          <button className={GLASS_PILL + ' text-[9px] uppercase font-black tracking-widest flex items-center gap-1.5 text-red-400/60'}>
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-blue-400/60">
                          <Zap size={11} /> Auto-Reply Active
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}

        {/* ── NEURAL COMPOSER FLOATING DOCK ── */}
        <AnimatePresence>
          {selectedEmail && (
            <motion.div
              key="composer"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0,  opacity: 1 }}
              exit={{ y: 80,    opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="absolute bottom-0 left-0 right-0 z-20 p-3"
            >
              <div className="bg-[#080808]/95 backdrop-blur-3xl border border-white/[0.18] shadow-[0_-24px_64px_rgba(0,0,0,0.7)] rounded-2xl overflow-hidden">
                {/* Composer Header */}
                <div className="flex justify-between items-center px-5 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
                      <MessageSquare size={12} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Neural Composer</p>
                      <p className="text-[9px] text-white/25 font-medium">
                        ↳ {targetEmail?.sender}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Tone Selector */}
                    <div className="flex bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.08]">
                      {['Empathetic', 'Formal', 'Direct'].map(tone => (
                        <button
                          key={tone}
                          onClick={() => setComposerTone(tone)}
                          className={cn(
                            'px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all',
                            composerTone === tone ? 'bg-white/10 text-white' : 'text-white/25 hover:text-white/50'
                          )}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                    {/* Length Selector */}
                    <div className="flex bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.08]">
                      {['Short', 'Med', 'Long'].map(len => (
                        <button
                          key={len}
                          onClick={() => setComposerLength(len)}
                          className={cn(
                            'px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all',
                            composerLength === len ? 'bg-white/10 text-white' : 'text-white/25 hover:text-white/50'
                          )}
                        >
                          {len}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="text-white/20 hover:text-white/60 transition-colors p-1"
                    >
                      <ZapOff size={14} />
                    </button>
                  </div>
                </div>

                {/* Textarea */}
                <div className="relative px-5 py-4">
                  <textarea
                    value={draftText}
                    onChange={e => setDraftText(e.target.value)}
                    placeholder={`Draft a ${composerTone.toLowerCase()}, ${composerLength.toLowerCase()} response to ${targetEmail?.sender}...`}
                    className="w-full bg-transparent border-none outline-none text-sm text-gray-100 placeholder:text-white/40 resize-none h-16 leading-relaxed"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      {draftText.length > 0 ? `${draftText.length} chars` : 'AI Assist Ready'}
                    </span>
                    <div className="flex gap-2">
                      <button className="text-[8px] font-black uppercase tracking-widest text-gray-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] border border-gray-600 hover:border-gray-400">
                        Generate AI Draft
                      </button>
                      <button className="text-[8px] font-black uppercase tracking-widest bg-white text-black px-5 py-1.5 rounded-lg hover:bg-blue-400 hover:text-white transition-all shadow-lg flex items-center gap-1.5 active:scale-95">
                        <Send size={10} /> Send Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── 7. INTELLIGENCE VELOCITY CHART ────────────────────── */}
      <section className={GLASS_CARD}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h3 className="text-base font-black tracking-tight text-white">Intelligence Velocity</h3>
            <p className="text-[9px] uppercase tracking-[0.18em] text-white/20 font-bold mt-0.5">Comparative Temporal Sentiment Analysis</p>
          </div>

          {/* Month Picker */}
          <div className="flex items-center gap-2 bg-white/[0.04] px-1 py-1 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] rounded-xl border border-white/[0.06]">
              <Calendar size={11} className="text-white/20" />
              <select
                value={monthA}
                onChange={e => setMonthA(e.target.value)}
                className="bg-transparent border-none text-[9px] font-black uppercase outline-none text-white/60 cursor-pointer"
              >
                {['January','February','March','April','May','June'].map(m => (
                  <option key={m} value={m} className="bg-black text-white">{m}</option>
                ))}
              </select>
            </div>
            <span className="text-[9px] font-black uppercase text-white/20 px-1">vs</span>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] rounded-xl border border-white/[0.06]">
              <Calendar size={11} className="text-white/20" />
              <select
                value={monthB}
                onChange={e => setMonthB(e.target.value)}
                className="bg-transparent border-none text-[9px] font-black uppercase outline-none text-white/60 cursor-pointer"
              >
                {['January','February','March','April','May','June'].map(m => (
                  <option key={m} value={m} className="bg-black text-white">{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="h-[280px]" style={{ minHeight: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={TREND_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 5 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }}
                tickFormatter={v => `${v}%`}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                content={<CustomBarTooltip monthA={monthA} monthB={monthB} />}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: '24px', fontSize: '9px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '1px' }}
                formatter={value => (
                  <span style={{ color: 'rgba(255,255,255,0.35)', marginRight: '16px' }}>
                    {value === 'previous' ? `▪ ${monthA}` : `▪ ${monthB}`}
                  </span>
                )}
              />
              <Bar dataKey="previous" name="previous" fill="rgba(255,255,255,0.12)" radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="current"  name="current"  fill="#3B82F6"               radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── 8. INTELLIGENCE FEEDBACK ──────────────────────────── */}
      <section className={cn(GLASS_CARD, 'bg-gradient-to-br from-blue-500/[0.04] via-transparent to-transparent space-y-6')}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          {/* Title Block */}
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center border border-blue-500/20 flex-shrink-0">
              <Sparkles size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white leading-tight">Intelligence Feedback</h3>
              <p className="text-xs uppercase tracking-widest text-white/30 font-bold mt-0.5">Monolith AI Synthesis</p>
            </div>
          </div>

          {/* AI Query Input */}
          <div className="flex-1 max-w-lg flex items-center gap-3 bg-white/[0.04] px-5 py-3 rounded-2xl border border-white/10 group focus-within:border-blue-500/40 transition-all">
            <MessageSquare size={16} className="text-white/20 group-focus-within:text-blue-400 transition-colors flex-shrink-0" />
            <input
              type="text"
              placeholder="Ask Monolith AI about this intelligence period..."
              value={summaryQuery}
              onChange={e => setSummaryQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm placeholder:text-white/20 text-white/80 py-0"
            />
            <button className="bg-white text-black text-sm font-bold uppercase px-6 py-2 rounded-xl hover:scale-105 transition-transform active:scale-95 shadow-lg whitespace-nowrap flex-shrink-0">
              Generate
            </button>
          </div>
        </div>

        {/* AI Body Text */}
        <div className="space-y-4 text-base font-light leading-loose text-white/55 italic border-l-2 border-white/[0.08] pl-6">
          <p>
            The <strong className="text-white/80 not-italic font-bold">April Intelligence Report</strong> reveals a{' '}
            <span className="text-emerald-400 not-italic font-bold">+7.2% Positive sentiment drift</span> versus the March baseline. The
            primary accelerant is the <em>Project Stellar</em> thread cluster (Sara Chen, Priya Nair), which is generating high-value,
            high-frequency positive signal across all monitored channels.
          </p>
          <p>
            <span className="text-red-400 not-italic font-bold">Negative escalation risk</span> is concentrated in the{' '}
            <em>NovaCraft billing stack failure</em> (Ticket #NC-8821). Triage priority: critical. Predictive weighting suggests{' '}
            <span className="text-amber-400 not-italic font-bold">Neutral stabilization</span> over the next 48-hour window, assuming the
            API incident is resolved within the 2-hour SLA window.
          </p>
        </div>
      </section>

    </div>
    </div>
  );
};
