import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, LineChart, Line, AreaChart, Area, Sector } from 'recharts';
import { Database, BarChart3, TrendingUp, Search } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { MotionIcon } from './MotionIcon';

// Types
export interface SentimentDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface MomentumDataPoint {
  name: string;
  value: number;
  isPeak?: boolean;
}

interface SentimentDonutProps {
  data?: SentimentDataPoint[];
  isLoading?: boolean;
  isUploaded?: boolean;
}

export const SentimentDonut: React.FC<SentimentDonutProps> = ({ 
  data,
  isLoading = false,
  isUploaded = false
}) => {
  if (isLoading) {
    return (
      <div className="h-48 flex flex-col items-center justify-center space-y-4">
        <div className="w-32 h-32 rounded-full border-4 border-white/5 border-t-primary animate-spin relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-white/5 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-2 text-center">
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-primary animate-pulse font-black">Analyzing Vectors...</p>
          <div className="h-1 w-24 bg-white/5 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-primary animate-[shimmer_2s_infinite] w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isUploaded || !data || data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-center space-y-4 group/empty">
        <div className="w-24 h-24 rounded-full border border-dashed border-white/10 flex items-center justify-center relative transition-all duration-500 group-hover/empty:border-primary/30 group-hover/empty:scale-110">
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl opacity-0 group-hover/empty:opacity-100 transition-opacity"></div>
          <MotionIcon scale={1.2}><Database size={32} className="text-on-surface-variant/10 group-hover/empty:text-primary/40 transition-colors" /></MotionIcon>
        </div>
        <div className="space-y-1">
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-on-surface-variant/70 group-hover/empty:text-on-surface-variant/90 transition-colors">Upload a dataset to generate insights</p>
          <p className="text-[0.5rem] uppercase tracking-widest text-on-surface-variant/40">Awaiting CSV ingestion</p>
        </div>
      </div>
    );
  }

  const chartData = data;
  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);
  const positivePercentage = Math.round((chartData.find(d => d.name === 'Positive')?.value || 0) / (total || 1) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isLoading ? 0.2 : 1, scale: isLoading ? 0.95 : 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "relative w-full aspect-square flex items-center justify-center max-w-[180px] mx-auto group transition-all duration-1000",
        isLoading ? "grayscale" : ""
      )}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
            animationBegin={0}
            animationDuration={1500}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-headline text-3xl font-bold text-primary">
          {isLoading || !data ? '--' : `${positivePercentage}%`}
        </span>
        <span className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant/90">Positive</span>
      </div>
    </motion.div>
  );
};

interface MomentumChartProps {
  data?: MomentumDataPoint[];
  type?: 'Bar' | 'Line' | 'Pie';
  timeframe?: 'D' | 'W' | 'M';
  isLoading?: boolean;
  isUploaded?: boolean;
}

export const MomentumBarChart: React.FC<MomentumChartProps> = ({ 
  data = [],
  type = 'Bar',
  timeframe = 'D',
  isLoading = false,
  isUploaded = false
}) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-6">
        <div className="w-full h-40 flex items-end gap-2 px-4">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="flex-1 bg-white/5 rounded-t-sm animate-pulse" 
              style={{ 
                height: `${Math.floor(Math.random() * 60) + 20}%`,
                animationDelay: `${i * 100}ms`
              }}
            ></div>
          ))}
        </div>
        <div className="space-y-2 text-center">
          <p className="text-[0.7rem] uppercase tracking-[0.3em] text-primary animate-pulse font-black">Synthesizing Trends...</p>
          <div className="h-1 w-48 bg-white/5 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-primary animate-[shimmer_2s_infinite] w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isUploaded || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center space-y-6 group/empty">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full opacity-0 group-hover/empty:opacity-100 transition-opacity"></div>
          <div className="w-48 h-32 border border-dashed border-white/5 rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover/empty:border-primary/20">
            <div className="flex gap-1 items-end h-12">
              {[30, 50, 40, 70, 45].map((h, i) => (
                <div key={i} className="w-2 bg-white/5 rounded-t-sm" style={{ height: `${h}%` }}></div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest/40 backdrop-blur-[2px]">
              <MotionIcon scale={1.2}><BarChart3 size={32} className="text-on-surface-variant/10 group-hover/empty:text-primary/30 transition-all duration-500 group-hover/empty:scale-110" /></MotionIcon>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[0.7rem] uppercase tracking-[0.3em] text-on-surface-variant/70 group-hover/empty:text-on-surface-variant/90 transition-colors">Upload a dataset to generate insights</p>
          <div className="flex justify-center gap-4">
            <div className="h-px w-4 bg-white/5 self-center"></div>
            <p className="text-[0.55rem] uppercase tracking-widest text-on-surface-variant/40">Quantitative Stream Offline</p>
            <div className="h-px w-4 bg-white/5 self-center"></div>
          </div>
        </div>
      </div>
    );
  }

  const chartData = data;

  const renderChart = () => {
    if (type === 'Line') {
      return (
        <LineChart data={chartData} margin={{ top: 40, right: 20, left: 20, bottom: 0 }}>
          <XAxis dataKey="name" hide />
          <Tooltip 
            cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 2 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as MomentumDataPoint;
                return (
                  <div className="bg-surface-container-highest/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-2xl min-w-[120px] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[0.5rem] uppercase tracking-widest text-white/40 font-bold">Vector</span>
                      <span className="text-[0.5rem] font-mono text-white/20">{item.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-xl font-headline font-black text-white">{item.value}%</span>
                      {item.isPeak && (
                        <span className="text-[0.5rem] bg-white text-black px-1.5 py-0.5 rounded-sm font-black mb-1 animate-pulse">PEAK</span>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#ffffff" 
            strokeWidth={3} 
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.isPeak) {
                return (
                  <g key={`dot-${payload.name}`}>
                    <circle cx={cx} cy={cy} r={8} fill="rgba(255,255,255,0.2)" className="animate-ping" />
                    <circle cx={cx} cy={cy} r={5} fill="#ffffff" stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                  </g>
                );
              }
              return <circle key={`dot-${payload.name}`} cx={cx} cy={cy} r={4} fill="#ffffff33" stroke="#ffffff" strokeWidth={1} />;
            }}
            activeDot={{ r: 8, fill: '#ffffff', stroke: 'rgba(255,255,255,0.3)', strokeWidth: 6 }}
            animationDuration={1500}
          />
        </LineChart>
      );
    }

    if (type === 'Pie') {
      return (
        <PieChart>
          <Pie
            {...({
              activeIndex,
              activeShape: (props: any) => {
                const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                return (
                  <g>
                    <Sector
                      cx={cx}
                      cy={cy}
                      innerRadius={innerRadius}
                      outerRadius={outerRadius + 6}
                      startAngle={startAngle}
                      endAngle={endAngle}
                      fill={fill}
                    />
                    <Sector
                      cx={cx}
                      cy={cy}
                      startAngle={startAngle}
                      endAngle={endAngle}
                      innerRadius={outerRadius + 8}
                      outerRadius={outerRadius + 10}
                      fill={fill}
                      opacity={0.3}
                    />
                  </g>
                );
              },
              onMouseEnter: (_: any, index: number) => setActiveIndex(index),
              onMouseLeave: () => setActiveIndex(-1)
            } as any)}
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
            animationDuration={1500}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isPeak ? '#ffffff' : (index % 2 === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)')} 
                className="transition-all duration-300 cursor-pointer"
              />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as MomentumDataPoint;
                return (
                  <div className="bg-surface-container-highest/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-2xl min-w-[120px] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[0.5rem] uppercase tracking-widest text-white/40 font-bold">Vector</span>
                      <span className="text-[0.5rem] font-mono text-white/20">{item.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-xl font-headline font-black text-white">{item.value}%</span>
                      {item.isPeak && (
                        <span className="text-[0.5rem] bg-white text-black px-1.5 py-0.5 rounded-sm font-black mb-1 animate-pulse">PEAK</span>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      );
    }

    // Default Bar Chart
    return (
      <div className="relative w-full h-full">
        {chartData.length === 1 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-on-surface-variant/40 bg-surface-container-low/80 px-4 py-2 border border-white/5 rounded-sm">
              Insufficient data for trend analysis
            </p>
          </div>
        )}
        <BarChart data={chartData} margin={{ top: 40, right: 0, left: 0, bottom: 0 }}>
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#ffffff33', fontSize: 10 }}
            interval={0}
            hide={data.length === 0}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as MomentumDataPoint;
                return (
                  <div className="bg-surface-container-highest/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-2xl min-w-[120px] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[0.5rem] uppercase tracking-widest text-white/40 font-bold">Vector</span>
                      <span className="text-[0.5rem] font-mono text-white/20">{item.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-xl font-headline font-black text-white">{item.value}%</span>
                      {item.isPeak && (
                        <span className="text-[0.5rem] bg-white text-black px-1.5 py-0.5 rounded-sm font-black mb-1 animate-pulse">PEAK</span>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" animationDuration={1500}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isPeak ? '#ffffff' : 'rgba(255,255,255,0.1)'} 
                className={cn(
                  "transition-all duration-500 cursor-pointer outline-none",
                  entry.isPeak 
                    ? "hover:fill-white hover:filter hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" 
                    : "hover:fill-white/40"
                )}
              />
            ))}
          </Bar>
        </BarChart>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isLoading ? 0.2 : (data.length === 0 && !isLoading ? 0.4 : 1), 
        y: 0,
        scale: isLoading ? 0.95 : 1
      }}
      transition={{ duration: 0.5 }}
      className={cn(
        "h-64 w-full transition-all duration-1000",
        isLoading ? "grayscale" : ""
      )}
    >
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </motion.div>
  );
};
