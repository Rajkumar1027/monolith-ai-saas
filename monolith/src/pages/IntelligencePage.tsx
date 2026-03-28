import React from 'react';
import { motion } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, TrendingDown, BrainCircuit, Zap, MessageSquare, BarChart3 } from 'lucide-react';

const sentimentData = [
  { time: '00:00', sentiment: 65, volume: 120 },
  { time: '04:00', sentiment: 45, volume: 80 },
  { time: '08:00', sentiment: 85, volume: 250 },
  { time: '12:00', sentiment: 75, volume: 400 },
  { time: '16:00', sentiment: 92, volume: 320 },
  { time: '20:00', sentiment: 88, volume: 180 },
  { time: '23:59', sentiment: 95, volume: 150 },
];

const topicData = [
  { name: 'Billing', value: 85, color: 'bg-neon-cyan' },
  { name: 'Support', value: 62, color: 'bg-neon-purple' },
  { name: 'Performance', value: 45, color: 'bg-white' },
  { name: 'Security', value: 30, color: 'bg-white/40' },
];

export const IntelligencePage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12 pb-24"
    >
      <header>
        <h1 className="text-4xl font-black tracking-tighter text-glow mb-2 uppercase">Intelligence Insights</h1>
        <p className="text-white/40 font-mono text-sm uppercase tracking-widest">Real-time emotional resonance mapping</p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Positive Resonance', value: '84.2%', trend: '+5.4%', icon: TrendingUp, color: 'text-neon-cyan' },
          { label: 'Negative Friction', value: '12.8%', trend: '-2.1%', icon: TrendingDown, color: 'text-neon-purple' },
          { label: 'Neural Confidence', value: '99.9%', trend: 'Stable', icon: Zap, color: 'text-white' },
          { label: 'Total Interactions', value: '1.2M', trend: '+12k', icon: MessageSquare, color: 'text-white/60' },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-6 border-white/10 hover:border-white/20 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-mono font-bold ${stat.trend.startsWith('+') ? 'text-green-400' : 'text-neon-purple'}`}>
                {stat.trend}
              </span>
            </div>
            <div className="text-2xl font-black mb-1 text-glow">{stat.value}</div>
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sentiment Chart */}
        <div className="lg:col-span-2 glass rounded-3xl p-8 border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
                <BarChart3 className="w-5 h-5 text-neon-cyan" />
              </div>
              <h2 className="text-xl font-bold">Sentiment Trend</h2>
            </div>
            <div className="flex gap-2">
              {['24H', '7D', '30D'].map(t => (
                <button key={t} className={`px-3 py-1 rounded-md text-[10px] font-mono transition-all ${t === '24H' ? 'bg-neon-cyan text-black font-bold' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sentimentData}>
                <defs>
                  <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(5, 5, 5, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#00f3ff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sentiment" 
                  stroke="#00f3ff" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#sentimentGradient)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Distribution */}
        <div className="space-y-8">
          <div className="glass rounded-3xl p-8 border-white/10">
            <h2 className="text-xl font-bold mb-8">Topic Distribution</h2>
            <div className="space-y-8">
              {topicData.map((topic, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white/60">{topic.name}</span>
                    <span className="text-white font-bold">{topic.value}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.value}%` }}
                      transition={{ duration: 1.5, delay: i * 0.1 }}
                      className={`h-full ${topic.color} shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-8 border-neon-purple/20 bg-neon-purple/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <BrainCircuit className="w-12 h-12 text-neon-purple/20" />
            </div>
            <h3 className="text-sm font-mono text-neon-purple uppercase tracking-widest mb-4">AI Insight Summary</h3>
            <p className="text-sm text-white/70 leading-relaxed italic">
              "Neural patterns indicate a high correlation between system latency and billing inquiries. Optimizing the API gateway could reduce negative friction by 18%."
            </p>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-mono text-neon-purple">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-purple animate-pulse" />
              VERIFIED BY MONOLITH-V4
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
