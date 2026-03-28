import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  ChevronLeft, 
  TrendingDown, 
  TrendingUp, 
  Smile, 
  Frown, 
  Meh, 
  Activity,
  Zap,
  ShieldCheck,
  Globe
} from 'lucide-react';
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

interface SentimentIntelligenceProps {
  onBack: () => void;
}

const data = [
  { name: 'Mon', sentiment: 65 },
  { name: 'Tue', sentiment: 72 },
  { name: 'Wed', sentiment: 68 },
  { name: 'Thu', sentiment: 45 },
  { name: 'Fri', sentiment: 55 },
  { name: 'Sat', sentiment: 62 },
  { name: 'Sun', sentiment: 58 },
];

export const SentimentIntelligence: React.FC<SentimentIntelligenceProps> = ({ onBack }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-6xl mx-auto pt-12 pb-32"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-white/50 hover:text-neon-cyan transition-colors mb-12 group"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        BACK TO ENGINE
      </button>

      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-neon-purple/10 border border-neon-purple/20">
            <BarChart3 className="w-8 h-8 text-neon-purple" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-glow">Sentiment Intelligence</h1>
            <p className="text-white/40 font-mono text-sm">Real-time emotional resonance tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border-neon-purple/20 text-neon-purple text-sm font-bold">
          <TrendingDown className="w-4 h-4" />
          SLIGHTLY NEGATIVE TREND
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="glass rounded-3xl p-8 border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Smile className="w-16 h-16 text-neon-cyan" />
          </div>
          <label className="text-xs font-mono text-white/40 uppercase tracking-widest block mb-1">Positive</label>
          <div className="text-5xl font-black text-neon-cyan mb-2">120</div>
          <div className="text-xs text-neon-cyan/60 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +12% from last week
          </div>
        </div>

        <div className="glass rounded-3xl p-8 border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Frown className="w-16 h-16 text-neon-purple" />
          </div>
          <label className="text-xs font-mono text-white/40 uppercase tracking-widest block mb-1">Negative</label>
          <div className="text-5xl font-black text-neon-purple mb-2">45</div>
          <div className="text-xs text-neon-purple/60 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +5% from last week
          </div>
        </div>

        <div className="glass rounded-3xl p-8 border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Meh className="w-16 h-16 text-white" />
          </div>
          <label className="text-xs font-mono text-white/40 uppercase tracking-widest block mb-1">Neutral</label>
          <div className="text-5xl font-black text-white mb-2">30</div>
          <div className="text-xs text-white/40 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            -2% from last week
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass rounded-3xl p-8 border-white/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">Sentiment Trend</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <div className="w-2 h-2 rounded-full bg-neon-cyan" />
                Positive
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <div className="w-2 h-2 rounded-full bg-neon-purple" />
                Negative
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(5,5,5,0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#00f3ff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sentiment" 
                  stroke="#00f3ff" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSentiment)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass rounded-3xl p-8 border-white/10">
            <h3 className="text-xl font-bold mb-6">Topic Distribution</h3>
            <div className="space-y-6">
              {[
                { label: 'Performance', value: 85, color: 'bg-neon-purple' },
                { label: 'Billing', value: 62, color: 'bg-neon-cyan' },
                { label: 'Support', value: 45, color: 'bg-white' },
                { label: 'Features', value: 28, color: 'bg-white/20' },
              ].map((topic, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-white/60 uppercase tracking-widest">{topic.label}</span>
                    <span className="text-white/80">{topic.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.value}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={`h-full ${topic.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-8 border-neon-purple/30 bg-neon-purple/5">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-neon-purple" />
              <h3 className="text-lg font-bold">Neural Insight</h3>
            </div>
            <p className="text-sm text-white/60 leading-relaxed italic">
              "System performance is currently the primary driver of negative sentiment. Recommend immediate investigation into Node-04 latency spikes."
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
