import React from 'react';
import { motion } from 'motion/react';
import { 
  Database, 
  Cpu, 
  Globe, 
  Server, 
  ArrowRight, 
  Wifi, 
  Activity, 
  ShieldCheck, 
  Zap,
  Layers
} from 'lucide-react';

const FlowNode = ({ icon: Icon, label, status, color }: { icon: any, label: string, status: string, color: string }) => (
  <div className="flex flex-col items-center gap-4 relative z-10">
    <motion.div 
      whileHover={{ scale: 1.1 }}
      className={`p-6 rounded-3xl glass border-white/10 ${color} relative group cursor-default`}
    >
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
      <Icon className="w-10 h-10" />
      <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-black border border-white/10 text-[8px] font-mono text-white/40 uppercase tracking-widest">
        {status}
      </div>
    </motion.div>
    <div className="text-center">
      <div className="text-sm font-bold text-white/80">{label}</div>
      <div className={`text-[10px] font-mono font-bold uppercase ${status === 'Online' ? 'text-green-400' : 'text-neon-cyan'}`}>
        {status}
      </div>
    </div>
  </div>
);

const FlowLine = ({ delay = 0 }: { delay?: number }) => (
  <div className="hidden lg:flex items-center justify-center flex-1 relative h-1">
    <div className="w-full h-[1px] bg-white/5" />
    <motion.div 
      initial={{ left: '-10%' }}
      animate={{ left: '110%' }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay }}
      className="absolute w-8 h-[2px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent shadow-[0_0_10px_rgba(0,243,255,0.5)]"
    />
  </div>
);

export const NetworkPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12 pb-24"
    >
      <header>
        <h1 className="text-4xl font-black tracking-tighter text-glow mb-2 uppercase">System Network</h1>
        <p className="text-white/40 font-mono text-sm uppercase tracking-widest">Neural data flow & infrastructure status</p>
      </header>

      {/* Live Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'API Gateway', status: 'Online', latency: '12ms', icon: Globe, color: 'text-neon-cyan' },
          { label: 'Neural Engine', status: 'Processing', latency: '45ms', icon: Cpu, color: 'text-neon-purple' },
          { label: 'Database Cluster', status: 'Online', latency: '8ms', icon: Database, color: 'text-white' },
        ].map((node, i) => (
          <div key={i} className="glass rounded-3xl p-8 border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-50 transition-opacity" />
            <div className="flex items-center justify-between mb-8">
              <div className={`p-3 rounded-xl bg-white/5 ${node.color}`}>
                <node.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${node.status === 'Online' ? 'bg-green-400' : 'bg-neon-cyan'}`} />
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{node.status}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="text-xl font-bold">{node.label}</div>
                <div className="text-xs font-mono text-white/40">{node.latency}</div>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: node.status === 'Online' ? '100%' : '65%' }}
                  className={`h-full ${node.color === 'text-neon-cyan' ? 'bg-neon-cyan' : node.color === 'text-neon-purple' ? 'bg-neon-purple' : 'bg-white'}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Flow Diagram */}
      <div className="glass rounded-3xl p-12 border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          <FlowNode icon={Globe} label="Frontend" status="Online" color="text-white" />
          <FlowLine delay={0} />
          <FlowNode icon={Server} label="Backend" status="Online" color="text-neon-cyan" />
          <FlowLine delay={0.5} />
          <FlowNode icon={Cpu} label="Neural AI" status="Processing" color="text-neon-purple" />
          <FlowLine delay={1} />
          <FlowNode icon={Database} label="Database" status="Online" color="text-white" />
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'Security', value: 'Active', icon: ShieldCheck, color: 'text-green-400' },
            { label: 'Bandwidth', value: '1.2 GB/s', icon: Wifi, color: 'text-neon-cyan' },
            { label: 'Load Balance', value: 'Optimized', icon: Layers, color: 'text-neon-purple' },
            { label: 'Throughput', value: '98.4%', icon: Activity, color: 'text-white' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{stat.label}</div>
                <div className="text-sm font-bold">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Health Summary */}
      <div className="glass rounded-3xl p-8 border-white/10 bg-gradient-to-br from-neon-cyan/5 to-transparent">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-5 h-5 text-neon-cyan" />
          <h2 className="text-xl font-bold">Infrastructure Health</h2>
        </div>
        <p className="text-sm text-white/60 leading-relaxed max-w-3xl">
          The Monolith Intelligence Engine is currently operating at peak efficiency across all global nodes. 
          Neural data flow is optimized with a 99.99% uptime recorded over the last 30 days. 
          No critical bottlenecks detected in the current processing pipeline.
        </p>
      </div>
    </motion.div>
  );
};
