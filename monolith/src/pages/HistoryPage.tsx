import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { HistoryTable } from '@/src/components/HistoryTable';
import { getHistory } from '@/src/lib/api';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, LineChart, Line, YAxis } from 'recharts';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory().then(data => {
      setHistory(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  // Compute charts data
  const { pieData, barData, lineData } = useMemo(() => {
    if (!history.length) return { pieData: [], barData: [], lineData: [] };
    
    // Urgency Pie
    let low = 0, med = 0, high = 0;
    const topics: Record<string, number> = {};
    const trends: any[] = [];

    history.forEach((h, i) => {
      const u = h.analysis?.urgency_score || 0;
      if (u >= 8) high++;
      else if (u >= 5) med++;
      else low++;

      const t = h.analysis?.topic || 'General';
      topics[t] = (topics[t] || 0) + 1;

      // Mock date progression based on array index since no timestamps saved yet
      trends.push({ name: `Run ${i+1}`, urgency: u });
    });

    const pData = [
      { name: 'Critical (>8)', value: high, color: '#ef4444' },
      { name: 'Moderate (5-7)', value: med, color: '#eab308' },
      { name: 'Low (<5)', value: low, color: '#22c55e' }
    ];

    const bData = Object.keys(topics).map(k => ({ name: k, count: topics[k] }));

    return { pieData: pData, barData: bData, lineData: trends };
  }, [history]);

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Row 1 - Header */}
      <div className="glass-panel p-8 rounded-2xl border border-white/10 bg-white/5">
        <span className="text-[0.6rem] uppercase tracking-[0.2em] text-white/40 font-black mb-2 block">ARCHIVE</span>
        <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-white">History & Analytics</h1>
        <p className="text-on-surface-variant max-w-md mt-4 text-sm font-light leading-relaxed">Comprehensive audit trail and trend analysis for monolithic sentiment operations.</p>
      </div>

      {/* Row 2 - Charts Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LINE CHART */}
        <div className="glass-panel p-6 h-80 flex flex-col rounded-2xl border border-white/10 bg-white/5">
          <p className="text-[0.65rem] uppercase text-white/40 font-black tracking-widest mb-6">URGENCY TREND</p>
          <div className="flex-1 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="urgency" stroke="#ffffff" strokeWidth={3} dot={{ r: 4, fill: '#ffffff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BAR CHART */}
        <div className="glass-panel p-6 h-80 flex flex-col rounded-2xl border border-white/10 bg-white/5">
          <p className="text-[0.65rem] uppercase text-white/40 font-black tracking-widest mb-6">TOPIC DISTRIBUTION</p>
          <div className="flex-1 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} hide />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#ffffff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART */}
        <div className="glass-panel p-6 h-80 flex flex-col rounded-2xl border border-white/10 bg-white/5">
          <p className="text-[0.65rem] uppercase text-white/40 font-black tracking-widest mb-6">URGENCY RATIO</p>
          <div className="flex-1 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" stroke="none">
                  {pieData.map((e, index) => <Cell key={`cell-${index}`} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3 - History Table */}
      <div className="w-full">
        {loading ? (
          <div className="text-center text-white/20 text-[0.7rem] uppercase tracking-widest py-24 glass-panel border border-white/10 rounded-2xl bg-white/5 italic">
            Retrieving Historical Data...
          </div>
        ) : (
          <HistoryTable data={history} />
        )}
      </div>
    </div>
  );
};
