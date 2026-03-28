import React from 'react';
import { motion } from 'motion/react';
import { MotionIcon } from './MotionIcon';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface TopicMapProps {
  isUploaded: boolean;
  isLoading: boolean;
}

const topics = [
  { name: 'Latency', weight: 85, sentiment: 'Negative' },
  { name: 'UI Clarity', weight: 72, sentiment: 'Positive' },
  { name: 'Billing', weight: 45, sentiment: 'Neutral' },
  { name: 'Mobile App', weight: 68, sentiment: 'Negative' },
  { name: 'API Docs', weight: 55, sentiment: 'Positive' },
  { name: 'Support', weight: 90, sentiment: 'Positive' },
  { name: 'Auth Flow', weight: 30, sentiment: 'Negative' },
  { name: 'Export', weight: 40, sentiment: 'Neutral' },
];

export const TopicMap: React.FC<TopicMapProps> = ({ isUploaded, isLoading }) => {
  return (
    <motion.div 
      whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
      className="glass-card p-8 h-[480px] flex flex-col relative overflow-hidden group/card shadow-lg"
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"></div>
      
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <div className="space-y-1">
            <h3 className="uppercase tracking-widest text-white/90 text-[0.75rem] font-black group-hover/card:text-primary transition-colors">Topic Distribution</h3>
            <div className={cn("h-0.5 bg-white/20 transition-all duration-500", isUploaded ? "w-16" : "w-8")}></div>
          </div>
          <p className="text-white/40 text-[0.6rem] mt-2 uppercase tracking-[0.2em] font-medium">Semantic Cluster Analysis</p>
        </div>
        <div className="text-[0.6rem] text-white/40 font-mono bg-white/5 px-2 py-1 rounded-full border border-white/10">v4.2_TOPIC_MAP</div>
      </div>

      <div className={cn(
        "flex-1 flex flex-wrap content-center justify-center gap-4 relative z-10 transition-all duration-700",
        !isUploaded && "opacity-20 blur-sm grayscale",
        isLoading && "opacity-50"
      )}>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4 w-full h-full p-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-12 bg-white/5 border border-white/5 rounded-xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }}></div>
            ))}
          </div>
        ) : (
          topics.map((topic, i) => (
            <motion.div 
              key={topic.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: isUploaded ? 1 : 0.5, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
              className={cn(
                "px-4 py-2 border transition-all duration-300 cursor-default group relative rounded-xl backdrop-blur-sm",
                topic.sentiment === 'Positive' ? 'border-white/20 text-white' :
                topic.sentiment === 'Negative' ? 'border-red-500/20 text-red-400' :
                'border-white/10 text-white/60'
              )}
              style={{ 
                fontSize: `${Math.max(0.6, (topic.weight / 100) * 1.5)}rem`,
              }}
            >
              <div className="absolute -top-1 -left-1 w-1 h-1 bg-current opacity-40 rounded-full"></div>
              <span className="uppercase tracking-widest font-black">{topic.name}</span>
              <div className="absolute bottom-0 right-0 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity p-1 font-mono">
                {topic.weight}%
              </div>
            </motion.div>
          ))
        )}
      </div>

      {!isUploaded && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 space-y-6 group/empty">
          <div className="w-24 h-24 rounded-full border border-dashed border-white/10 flex items-center justify-center relative transition-all duration-500 group-hover/empty:border-white/30 group-hover/empty:scale-110">
            <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl opacity-0 group-hover/empty:opacity-100 transition-opacity"></div>
            <MotionIcon scale={1.2}><BarChart3 size={32} className="text-white/20 group-hover/empty:text-white/60 transition-colors" /></MotionIcon>
          </div>
          <p className="text-[0.7rem] uppercase tracking-[0.4em] text-white/40 italic group-hover/empty:text-white/60 transition-colors font-black">Waiting for data stream...</p>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div>
            <span className="text-[0.6rem] uppercase tracking-widest text-white/60 font-bold">Positive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
            <span className="text-[0.6rem] uppercase tracking-widest text-white/60 font-bold">Negative</span>
          </div>
        </div>
        <span className="text-[0.6rem] text-white/30 uppercase tracking-[0.2em] font-black">Total Clusters: 08</span>
      </div>
    </motion.div>
  );
};
