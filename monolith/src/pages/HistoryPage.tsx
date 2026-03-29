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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="px-8 max-w-7xl mx-auto py-12 space-y-12 pb-32 relative overflow-hidden"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-[24px]">
      <header className="mb-12 pt-12">
        <div className="flex flex-col gap-2">
          <span className="text-[0.6875rem] uppercase tracking-[0.15em] text-on-surface-variant/90 font-medium">Archive</span>
          <h1 className="font-headline text-5xl font-extrabold tracking-tight text-primary">History & Analytics</h1>
        </div>
      </header>

      {/* DASHBOARD CHARTS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* LINE CHART */}
        <div className="glass-panel p-6 h-72 flex flex-col group md:col-span-4">
          <p className="text-[0.65rem] uppercase text-white/60 font-black tracking-widest mb-4">Urgency Trend</p>
          <div className="flex-1 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }} />
                <Line type="monotone" dataKey="urgency" stroke="#ffffff" strokeWidth={3} dot={{ r: 4, fill: '#ffffff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BAR CHART */}
        <div className="glass-panel p-6 h-72 flex flex-col group md:col-span-4">
          <p className="text-[0.65rem] uppercase text-white/60 font-black tracking-widest mb-4">Topic Distribution</p>
          <div className="flex-1 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} hide />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }} />
                <Bar dataKey="count" fill="#ffffff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART */}
        <div className="glass-panel p-6 h-72 flex flex-col group md:col-span-4">
          <p className="text-[0.65rem] uppercase text-white/60 font-black tracking-widest mb-4">Urgency Ratio</p>
          <div className="flex-1 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">
                  {pieData.map((e, index) => <Cell key={`cell-${index}`} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="text-center text-white/50 text-[0.7rem] uppercase py-12">Loading History...</div>
      ) : (
        <HistoryTable data={history} />
      )}
      </div>
    </motion.div>
  );
};
