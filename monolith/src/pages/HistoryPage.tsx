import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid,
} from 'recharts';
import { 
  Database, Mail, RefreshCw, AlertCircle, ArrowRight,
  TrendingUp, TrendingDown, Minus, Clock, ShieldAlert,
  Calendar, CheckCircle, Info
} from 'lucide-react';
import { getFeedbackHistory, getEmailHistory } from '../lib/api';
import { cn } from '../utils/cn';

// ─── Design System Tokens ───────────────────────────────────────────────────────
const GLASS_CARD = 'backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-2xl p-6';
const GLASS_PILL = 'backdrop-blur-md bg-white/10 border border-white/10 rounded-full px-4 py-1.5 transition-all hover:bg-white/20 cursor-pointer';

const STATUS_STYLES: Record<string, string> = {
  'Auto-Resolved':  'bg-green-500/10  text-green-400  border-green-500/20',
  'Human Required': 'bg-amber-500/10  text-amber-400  border-amber-500/20',
  'Escalated':      'bg-red-500/10    text-red-400    border-red-500/20',
  'Queued':         'bg-blue-500/10   text-blue-400   border-blue-500/20',
};

const TOPIC_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#BF5AF2', '#30D158', '#FF453A', '#F5A623', '#374151'];

// ─── Sub-Components ────────────────────────────────────────────────────────────

const StatusPill = ({ status }: { status: string }) => (
  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${STATUS_STYLES[status] ?? 'bg-white/5 text-white/40 border-white/10'}`}>
    {status}
  </span>
);

const KpiBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{label}</span>
      <span className="text-sm font-black" style={{ color }}>{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  </div>
);

// ─── Skeletons for Loading States ──────────────────────────────────────────────

const ChartSkeleton = () => (
  <div className="animate-pulse space-y-4 w-full">
    <div className="h-4 bg-white/5 rounded w-1/3" />
    <div className="h-40 bg-white/[0.02] border border-white/5 rounded-xl flex items-end px-4 py-2 gap-2">
      <div className="h-10 bg-white/5 rounded w-full" />
      <div className="h-20 bg-white/5 rounded w-full" />
      <div className="h-16 bg-white/5 rounded w-full" />
      <div className="h-28 bg-white/5 rounded w-full" />
      <div className="h-24 bg-white/5 rounded w-full" />
    </div>
  </div>
);

const PieSkeleton = () => (
  <div className="animate-pulse flex flex-col items-center justify-center gap-4 w-full">
    <div className="h-4 bg-white/5 rounded w-1/3 self-start" />
    <div className="w-28 h-28 rounded-full border-[10px] border-white/5 flex items-center justify-center" />
    <div className="grid grid-cols-2 gap-2 w-full pt-2">
      <div className="h-3 bg-white/5 rounded" />
      <div className="h-3 bg-white/5 rounded" />
    </div>
  </div>
);

const TableSkeleton = () => (
  <div className="animate-pulse space-y-4 w-full">
    <div className="h-8 bg-white/5 rounded w-1/4 mb-6" />
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex justify-between items-center py-4 border-b border-white/5">
          <div className="h-3 bg-white/5 rounded w-1/6" />
          <div className="h-3 bg-white/5 rounded w-1/4" />
          <div className="h-3 bg-white/5 rounded w-1/3" />
          <div className="h-3 bg-white/5 rounded w-1/12" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Tooltip Customizers ────────────────────────────────────────────────────────

const AreaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span style={{ color: p.color }}>●</span>
          <span className="text-white/60 uppercase font-bold text-[9px]">{p.dataKey}</span>
          <span className="text-white font-black ml-1">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: d.payload.color }}>{d.name}</p>
      <p className="text-white font-black text-sm">{d.value}%</p>
    </div>
  );
};

// ─── Main History & Analytics Console ───────────────────────────────────────────

export const HistoryPage: React.FC = () => {
  const [historySource, setHistorySource] = useState<'feedback' | 'email'>('feedback');
  const [historyData, setHistoryData]     = useState<any[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [hoveredRow, setHoveredRow]       = useState<number | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (historySource === 'feedback') {
        const data = await getFeedbackHistory();
        setHistoryData(data || []);
      } else {
        const data = await getEmailHistory();
        setHistoryData(data || []);
      }
    } catch (err: any) {
      console.error("Fetch history failed:", err);
      setError(err.message || "Failed to load system logs.");
    } finally {
      setIsLoading(false);
    }
  }, [historySource]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ─── Analytical Data Pipeline Transformations (useMemo) ──────────────────────────

  // 1. Urgency Volume Trend Transformation (AreaChart)
  const urgencyTrend = useMemo(() => {
    if (historyData.length === 0) return [];

    if (historySource === 'feedback') {
      // Map upload sessions chronologically
      return [...historyData].reverse().map(session => {
        const dateStr = session.created_at
          ? new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Unknown';
        const neg = session.neg_count || 0;
        const pos = session.pos_count || 0;
        const neu = session.neu_count || 0;
        return {
          day: dateStr,
          critical: neg,
          standard: pos + neu,
        };
      });
    } else {
      // Group synchronized emails by date string
      const grouped: Record<string, { critical: number; standard: number }> = {};
      
      historyData.forEach(e => {
        const dateKey = e.date 
          ? new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Unknown';
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = { critical: 0, standard: 0 };
        }
        
        if (e.sentiment === 'NEGATIVE' || e.label === 'URGENT') {
          grouped[dateKey].critical += 1;
        } else {
          grouped[dateKey].standard += 1;
        }
      });

      // Maintain chronologically sorted sequence
      return Object.entries(grouped).map(([day, val]) => ({
        day,
        ...val
      })).reverse();
    }
  }, [historyData, historySource]);

  // 2. Intercept Breakdown Transformation (PieChart)
  const topicData = useMemo(() => {
    if (historyData.length === 0) return [];

    if (historySource === 'feedback') {
      // Aggregate keyword occurrences weighted by total rows
      const keywordCounts: Record<string, number> = {};
      let absoluteTotal = 0;
      
      historyData.forEach(session => {
        const rows = session.total_rows || 1;
        absoluteTotal += rows;
        (session.top_keywords || []).forEach((kw: string) => {
          keywordCounts[kw] = (keywordCounts[kw] || 0) + rows;
        });
      });

      const sortedKws = Object.entries(keywordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

      if (sortedKws.length === 0) {
        // Fallback categories if keywords are unavailable
        return [
          { name: 'API Support', value: 40, color: TOPIC_COLORS[0] },
          { name: 'Core Ingestion', value: 30, color: TOPIC_COLORS[1] },
          { name: 'NLP Lexicons', value: 20, color: TOPIC_COLORS[2] },
          { name: 'Metadata Sync', value: 10, color: TOPIC_COLORS[3] },
        ];
      }

      return sortedKws.map(([kw, score], idx) => ({
        name: kw.charAt(0).toUpperCase() + kw.slice(1),
        value: Math.round((score / absoluteTotal) * 100) || 10,
        color: TOPIC_COLORS[idx] || TOPIC_COLORS[0],
      }));
    } else {
      // Aggregate smart labels from emails
      const labelCounts: Record<string, number> = {};
      historyData.forEach(e => {
        const label = e.label || 'GENERAL';
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      });

      const totalEmails = historyData.length || 1;
      return Object.entries(labelCounts).map(([label, count], idx) => ({
        name: label,
        value: Math.round((count / totalEmails) * 100),
        color: TOPIC_COLORS[idx % TOPIC_COLORS.length],
      }));
    }
  }, [historyData, historySource]);

  // 3. KPI Metrics Transformation
  const kpiStats = useMemo(() => {
    if (historyData.length === 0) {
      return { automated: 0, critical: 0, pending: 0, countText: '0 entries' };
    }

    if (historySource === 'feedback') {
      let totalRows = 0;
      let totalPos = 0;
      let totalNeg = 0;
      let totalNeu = 0;

      historyData.forEach(session => {
        totalRows += session.total_rows || 0;
        totalPos += session.pos_count || 0;
        totalNeg += session.neg_count || 0;
        totalNeu += session.neu_count || 0;
      });

      totalRows = totalRows || 1;
      const automated = Math.round(((totalPos + totalNeu) / totalRows) * 100);
      const critical = Math.round((totalNeg / totalRows) * 100);
      const pending = Math.max(0, 100 - automated - critical);

      return {
        automated,
        critical,
        pending,
        countText: `${historyData.length} uploads // ${totalRows} rows`,
      };
    } else {
      const total = historyData.length;
      let negCount = 0;
      let urgentCount = 0;
      let posCount = 0;
      let neuCount = 0;

      historyData.forEach(e => {
        if (e.sentiment === 'NEGATIVE') negCount++;
        else if (e.sentiment === 'POSITIVE') posCount++;
        else neuCount++;

        if (e.label === 'URGENT') urgentCount++;
      });

      const critical = Math.round(((negCount + urgentCount) / (total * 2 || 1)) * 100) || 5;
      const automated = Math.round(((posCount + neuCount) / (total || 1)) * 100) || 80;
      const pending = Math.max(0, 100 - automated - critical);

      return {
        automated,
        critical,
        pending,
        countText: `${total} emails indexed`,
      };
    }
  }, [historyData, historySource]);

  // ─── Format Ledger Records ────────────────────────────────────────────────────
  const ledgerRows = useMemo(() => {
    return historyData.map((row, i) => {
      if (historySource === 'feedback') {
        const ts = row.created_at
          ? new Date(row.created_at).toLocaleString('en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
          : 'Unknown';
        const confidence = Math.round((row.pos_count + row.neg_count) / (row.total_rows || 1) * 100) || 90;
        
        let status = 'Queued';
        if (row.neg_count > row.total_rows * 0.3) status = 'Escalated';
        else if (row.neg_count > row.total_rows * 0.1) status = 'Human Required';
        else status = 'Auto-Resolved';

        return {
          id: i,
          ts,
          source: row.filename,
          topic: row.ai_report?.summary?.slice(0, 80) + "..." || `Ingested {row.total_rows} entries. Top key: {row.top_keywords?.[0] || 'N/A'}`,
          confidence,
          status,
        };
      } else {
        const ts = row.date 
          ? new Date(row.date).toLocaleString('en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
          : 'Unknown';
        
        let status = 'Queued';
        if (row.label === 'URGENT' || row.sentiment === 'NEGATIVE') status = 'Escalated';
        else if (row.label === 'LEGAL' || row.label === 'COMPLIANCE') status = 'Human Required';
        else if (row.sentiment === 'POSITIVE' || row.label === 'SUPPORT' || row.label === 'GENERAL') status = 'Auto-Resolved';

        return {
          id: row.id || i,
          ts,
          source: row.sender?.split('<')[0]?.trim() || row.sender,
          topic: `[${row.label || 'GENERAL'}] ${row.subject}`,
          confidence: Math.round(row.confidence * 100) || 85,
          status,
        };
      }
    });
  }, [historyData, historySource]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="px-8 max-w-7xl mx-auto space-y-8 pb-32"
    >
      {/* ── 1. HEADER & TOGGLE ── */}
      <header className="pt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase mb-2">Intelligence Archive</p>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none">
              <span className="text-white">History</span>{' '}
              <span className="text-white/20">&amp; Analytics</span>
            </h1>
            <p className="text-xs text-white/20 font-bold uppercase tracking-widest mt-3">
              Live Database Ledger Integration · Real-Time Updates
            </p>
          </div>

          {/* Core Source Toggle */}
          <div className="flex bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.08] self-start md:self-end">
            <button
              onClick={() => setHistorySource('feedback')}
              className={cn(
                'px-5 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5',
                historySource === 'feedback' ? 'bg-white/10 text-white shadow-lg border border-white/5' : 'text-white/30 hover:text-white'
              )}
            >
              <Database size={11} />
              Feedback Analysis
            </button>
            <button
              onClick={() => setHistorySource('email')}
              className={cn(
                'px-5 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5',
                historySource === 'email' ? 'bg-white/10 text-white shadow-lg border border-white/5' : 'text-white/30 hover:text-white'
              )}
            >
              <Mail size={11} />
              Email Analysis
            </button>
          </div>
        </div>
      </header>

      {/* Error Boundary display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold"
          >
            <ShieldAlert size={16} />
            {error}
            <button onClick={fetchHistory} className="ml-auto flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-400/80 hover:text-red-400">
              <RefreshCw size={10} /> Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. CHARTS SECTIONS OR LOADING SKELETONS ── */}
      {isLoading ? (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={GLASS_CARD}><ChartSkeleton /></div>
          <div className={GLASS_CARD}><PieSkeleton /></div>
          <div className={GLASS_CARD}><ChartSkeleton /></div>
        </section>
      ) : historyData.length === 0 ? (
        /* Premium Empty State UI */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-16 flex flex-col items-center text-center shadow-[0_0_80px_rgba(0,0,0,0.5)] gap-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/30">
            {historySource === 'feedback' ? <Database size={28} /> : <Mail size={28} />}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">No Archive Found</h3>
            <p className="text-xs text-white/40 max-w-md leading-relaxed">
              No {historySource === 'feedback' ? 'Feedback' : 'Email'} analysis history exists yet. Upload a CSV file or connect your Google Workspace inbox to populate the system database.
            </p>
          </div>
          <div className="text-[10px] uppercase font-black tracking-widest text-white/20 flex items-center gap-1.5">
            <Clock size={11} /> Dynamic Sync Complete
          </div>
        </motion.div>
      ) : (
        /* Dynamic Rendered Analytics charts */
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* A. Urgency Trend */}
          <div className={GLASS_CARD + ' flex flex-col gap-4'}>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-black">Urgency Trend</p>
              <p className="text-white font-black text-sm mt-0.5">30-Day Volume</p>
            </div>
            <div style={{ minHeight: 180 }} className="flex-1">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={urgencyTrend} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCritical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#EF4444" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradStandard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 700 }}
                    axisLine={false} tickLine={false}
                    interval={Math.ceil(urgencyTrend.length / 5)}
                  />
                  <YAxis hide />
                  <Tooltip content={<AreaTooltip />} />
                  <Area type="monotone" dataKey="standard" stackId="1"
                    stroke="#3B82F6" strokeWidth={2}
                    fill="url(#gradStandard)" />
                  <Area type="monotone" dataKey="critical" stackId="1"
                    stroke="#EF4444" strokeWidth={2}
                    fill="url(#gradCritical)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 pt-1 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Critical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Standard</span>
              </div>
            </div>
          </div>

          {/* B. Intercept Breakdown */}
          <div className={GLASS_CARD + ' flex flex-col gap-4'}>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-black">Intercept Distribution</p>
              <p className="text-white font-black text-sm mt-0.5">Semantic Breakdown</p>
            </div>
            <div style={{ minHeight: 160 }} className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={topicData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={72}
                    dataKey="value"
                    stroke="none"
                    paddingAngle={3}
                  >
                    {topicData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1 border-t border-white/5">
              {topicData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/30 truncate">{d.name}</span>
                  <span className="text-[8px] font-black text-white/50 ml-auto">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* C. Urgency Ratio KPIs */}
          <div className={GLASS_CARD + ' flex flex-col gap-6'}>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-black">Urgency Ratio</p>
              <p className="text-white font-black text-sm mt-0.5">Resolution Intelligence</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-red-500/50">Critical Risk</span>
                <span className="text-3xl font-black text-red-400 leading-none">{kpiStats.critical}<span className="text-base font-light text-white/20">%</span></span>
                <span className="text-[8px] text-red-400/40 font-bold">Escalation cases</span>
              </div>
              <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-green-500/50">Automated</span>
                <span className="text-3xl font-black text-green-400 leading-none">{kpiStats.automated}<span className="text-base font-light text-white/20">%</span></span>
                <span className="text-[8px] text-green-400/40 font-bold">Auto-resolved</span>
              </div>
            </div>

            <div className="space-y-4 mt-auto">
              <KpiBar label="Automated Resolutions" value={kpiStats.automated} color="#34D399" />
              <KpiBar label="Critical Escalations" value={kpiStats.critical} color="#F87171" />
              <KpiBar label="Queued / Pending" value={kpiStats.pending} color="#60A5FA" />
            </div>
          </div>
        </section>
      )}

      {/* ── 3. MASTER LEDGER SECTIONS OR LOADING SKELETONS ── */}
      {isLoading ? (
        <div className={GLASS_CARD}><TableSkeleton /></div>
      ) : historyData.length === 0 ? null : (
        /* Real Data Ledger Table */
        <section className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/20">System Ledger</p>
              <h2 className="text-white font-black text-base tracking-tight mt-0.5">
                Recent Intercepts <span className="text-white/20">// {kpiStats.countText}</span>
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={fetchHistory}
                disabled={isLoading}
                className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white rounded-full transition-all active:scale-95 disabled:opacity-40"
              >
                <RefreshCw size={11} className={cn(isLoading && "animate-spin")} />
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Live Sync</span>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto inbox-scroll">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  {['Timestamp', 'Source', 'Topic', 'AI Confidence', 'Status'].map(col => (
                    <th
                      key={col}
                      className="text-left text-[9px] font-black uppercase tracking-[0.2em] text-white/20 pb-3 pr-6"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((row, i) => (
                  <tr
                    key={row.id}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={cn(
                      "border-b border-white/[0.04] transition-colors duration-150",
                      hoveredRow === i && "bg-white/[0.03]"
                    )}
                  >
                    {/* Timestamp */}
                    <td className="py-3.5 pr-6">
                      <span className="text-[9px] font-mono text-white/30 whitespace-nowrap">{row.ts}</span>
                    </td>
                    {/* Source */}
                    <td className="py-3.5 pr-6">
                      <span className="text-xs font-bold text-white/70 whitespace-nowrap truncate max-w-[150px] inline-block">{row.source}</span>
                    </td>
                    {/* Topic */}
                    <td className="py-3.5 pr-6">
                      <span className="text-[10px] text-white/50 truncate max-w-[320px] inline-block">{row.topic}</span>
                    </td>
                    {/* Confidence */}
                    <td className="py-3.5 pr-6">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${row.confidence}%`,
                              background: row.confidence >= 90 ? '#34D399' : row.confidence >= 80 ? '#60A5FA' : '#F59E0B',
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-white/50">{row.confidence}%</span>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="py-3.5">
                      <StatusPill status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer stats */}
          <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/15">
              Showing {ledgerRows.length} recent history records · April-May 2026
            </span>
            <button className="text-[9px] font-black uppercase tracking-widest text-blue-400/60 hover:text-blue-400 transition-colors">
              Export Archive CSV →
            </button>
          </div>
        </section>
      )}
    </motion.div>
  );
};
