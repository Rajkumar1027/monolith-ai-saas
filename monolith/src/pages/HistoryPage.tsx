import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid,
} from 'recharts';

// ─── Illustrative Data ────────────────────────────────────────────────────────

const URGENCY_TREND = [
  { day: 'Mar 1',  critical: 3,  standard: 18 },
  { day: 'Mar 3',  critical: 5,  standard: 22 },
  { day: 'Mar 5',  critical: 2,  standard: 15 },
  { day: 'Mar 7',  critical: 8,  standard: 30 },
  { day: 'Mar 9',  critical: 6,  standard: 27 },
  { day: 'Mar 11', critical: 4,  standard: 20 },
  { day: 'Mar 13', critical: 9,  standard: 35 },
  { day: 'Mar 15', critical: 11, standard: 38 },
  { day: 'Mar 17', critical: 7,  standard: 29 },
  { day: 'Mar 19', critical: 14, standard: 42 },
  { day: 'Mar 21', critical: 10, standard: 36 },
  { day: 'Mar 23', critical: 6,  standard: 25 },
  { day: 'Mar 25', critical: 13, standard: 40 },
  { day: 'Mar 27', critical: 8,  standard: 33 },
  { day: 'Mar 29', critical: 5,  standard: 24 },
  { day: 'Mar 31', critical: 12, standard: 44 },
];

const TOPIC_DATA = [
  { name: 'API Issues',       value: 34, color: '#3B82F6' },
  { name: 'Integration',      value: 26, color: '#6366F1' },
  { name: 'Security',         value: 19, color: '#8B5CF6' },
  { name: 'General Support',  value: 21, color: '#374151' },
];

const LEDGER_DATA = [
  { ts: '2026-03-31  08:12',  source: 'NovaCraft Solutions',    topic: 'API Rate Limit Exceeded',         confidence: 98, status: 'Auto-Resolved' },
  { ts: '2026-03-31  09:44',  source: 'Astra Ventures',         topic: 'OAuth 2.0 Scope Mismatch',        confidence: 91, status: 'Human Required' },
  { ts: '2026-03-31  11:03',  source: 'Zenith Tech Legal',      topic: 'GDPR Compliance Audit Request',   confidence: 87, status: 'Escalated' },
  { ts: '2026-03-30  14:27',  source: 'ClearPath Analytics',    topic: 'Webhook Delivery Failure',        confidence: 95, status: 'Auto-Resolved' },
  { ts: '2026-03-30  16:55',  source: 'Helios Infrastructure',  topic: 'TLS Certificate Expiry Alert',    confidence: 99, status: 'Auto-Resolved' },
  { ts: '2026-03-30  18:11',  source: 'Meridian Capital',       topic: 'SDK Integration Broken',          confidence: 78, status: 'Human Required' },
  { ts: '2026-03-29  09:30',  source: 'Orion Payments',         topic: 'PCI-DSS Tokenization Query',      confidence: 83, status: 'Escalated' },
  { ts: '2026-03-29  12:47',  source: 'Capsule Data Labs',      topic: 'Feature Request: SAML SSO',       confidence: 72, status: 'Queued' },
  { ts: '2026-03-29  15:20',  source: 'NovaCraft Solutions',    topic: 'Bulk Export Timeout (>500k rows)',confidence: 96, status: 'Auto-Resolved' },
  { ts: '2026-03-28  10:05',  source: 'Vertex Systems',         topic: 'IP Whitelist Misconfiguration',   confidence: 89, status: 'Auto-Resolved' },
  { ts: '2026-03-28  13:38',  source: 'Astra Ventures',         topic: 'MFA Enrollment Failure',          confidence: 94, status: 'Auto-Resolved' },
  { ts: '2026-03-27  17:02',  source: 'Zenith Tech Legal',      topic: 'SOC 2 Report Request',            confidence: 88, status: 'Human Required' },
];

// ─── Tooltip Components ───────────────────────────────────────────────────────

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

// ─── KPI Meter ────────────────────────────────────────────────────────────────

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

// ─── Status Pill ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  'Auto-Resolved':  'bg-green-500/10  text-green-400  border-green-500/20',
  'Human Required': 'bg-amber-500/10  text-amber-400  border-amber-500/20',
  'Escalated':      'bg-red-500/10    text-red-400    border-red-500/20',
  'Queued':         'bg-blue-500/10   text-blue-400   border-blue-500/20',
};

const StatusPill = ({ status }: { status: string }) => (
  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${STATUS_STYLES[status] ?? 'bg-white/5 text-white/40 border-white/10'}`}>
    {status}
  </span>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const HistoryPage: React.FC = () => {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="px-8 max-w-7xl mx-auto space-y-8 pb-32"
    >
      {/* ── Header ── */}
      <header className="mb-4 pt-12">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase mb-2">Intelligence Archive</p>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none">
            <span className="text-white">History</span>{' '}
            <span className="text-white/20">&amp; Analytics</span>
          </h1>
          <p className="text-xs text-white/20 font-bold uppercase tracking-widest mt-3">
            30-Day System Intelligence Report · April 2026
          </p>
        </div>
      </header>

      {/* ── Three Charts Row ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 1. URGENCY TREND — AreaChart */}
        <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-black">Urgency Trend</p>
            <p className="text-white font-black text-sm mt-0.5">30-Day Volume</p>
          </div>
          <div style={{ minHeight: 180 }} className="flex-1">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={URGENCY_TREND} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
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
                  interval={3}
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
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Standard</span>
            </div>
          </div>
        </div>

        {/* 2. TOPIC DISTRIBUTION — Doughnut PieChart */}
        <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-black">Topic Distribution</p>
            <p className="text-white font-black text-sm mt-0.5">Intercept Breakdown</p>
          </div>
          <div style={{ minHeight: 160 }} className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={TOPIC_DATA}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={72}
                  dataKey="value"
                  stroke="none"
                  paddingAngle={3}
                >
                  {TOPIC_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1 border-t border-white/5">
            {TOPIC_DATA.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                <span className="text-[8px] font-black uppercase tracking-widest text-white/30 truncate">{d.name}</span>
                <span className="text-[8px] font-black text-white/50 ml-auto">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. URGENCY RATIO — KPI Panel */}
        <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-black">Urgency Ratio</p>
            <p className="text-white font-black text-sm mt-0.5">Resolution Intelligence</p>
          </div>

          {/* Big KPI numbers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex flex-col gap-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-red-500/50">Critical</span>
              <span className="text-3xl font-black text-red-400 leading-none">12<span className="text-lg">%</span></span>
              <span className="text-[8px] text-red-400/40 font-bold">Escalated cases</span>
            </div>
            <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-4 flex flex-col gap-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-green-500/50">Automated</span>
              <span className="text-3xl font-black text-green-400 leading-none">84<span className="text-lg">%</span></span>
              <span className="text-[8px] text-green-400/40 font-bold">Auto-resolved</span>
            </div>
          </div>

          {/* Progress meters */}
          <div className="space-y-4 mt-auto">
            <KpiBar label="Automated Resolutions" value={84} color="#34D399" />
            <KpiBar label="Critical Escalations" value={12} color="#F87171" />
            <KpiBar label="Queued / Pending" value={4} color="#60A5FA" />
          </div>
        </div>
      </section>

      {/* ── Master Ledger ── */}
      <section className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        {/* Ledger Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/20">System Ledger</p>
            <h2 className="text-white font-black text-base tracking-tight mt-0.5">
              Recent Intercepts <span className="text-white/20">// 12 entries</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Live Sync</span>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
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
              {LEDGER_DATA.map((row, i) => (
                <tr
                  key={i}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`border-b border-white/[0.04] transition-colors duration-150 ${hoveredRow === i ? 'bg-white/[0.03]' : ''}`}
                >
                  {/* Timestamp */}
                  <td className="py-3.5 pr-6">
                    <span className="text-[9px] font-mono text-white/30 whitespace-nowrap">{row.ts}</span>
                  </td>
                  {/* Source */}
                  <td className="py-3.5 pr-6">
                    <span className="text-xs font-bold text-white/70 whitespace-nowrap">{row.source}</span>
                  </td>
                  {/* Topic */}
                  <td className="py-3.5 pr-6">
                    <span className="text-[10px] text-white/50">{row.topic}</span>
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

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/15">
            Showing 12 of 247 intercepts · Last 30 days
          </span>
          <button className="text-[9px] font-black uppercase tracking-widest text-blue-400/60 hover:text-blue-400 transition-colors">
            Export CSV →
          </button>
        </div>
      </section>
    </motion.div>
  );
};
