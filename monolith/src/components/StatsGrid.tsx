import React from 'react';
import { motion } from 'motion/react';

interface Stat {
  label: string;
  value: string;
}

interface StatsGridProps {
  stats: Stat[];
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-outline-variant/15 mb-16 rounded overflow-hidden">
      {stats.map((stat, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          whileHover={{ 
            scale: 1.02, 
            y: -8, 
            backgroundColor: "rgba(255,255,255,0.08)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            zIndex: 10
          }}
          className="bg-surface-container-lowest p-8 flex flex-col gap-1 transition-all duration-500 ease-[0.23,1,0.32,1] relative"
        >
          <span className="text-[0.625rem] uppercase tracking-widest text-on-surface-variant/90 font-medium">
            {stat.label}
          </span>
          <span className="font-headline text-3xl font-bold text-primary">
            {stat.value}
          </span>
        </motion.div>
      ))}
    </div>
  );
};
