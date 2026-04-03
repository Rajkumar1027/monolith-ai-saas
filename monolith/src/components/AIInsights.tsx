import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MotionIcon } from './MotionIcon';
import { Sparkles, Loader2, Send } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { askQuestion, BackendOfflineError } from '@/src/lib/api';
import { toast } from 'sonner';

interface AIInsightsProps {
  startDate: string;
  endDate: string;
  isUploaded: boolean;
  insights: {
    urgency_score?: number;
    topic?: string;
    summary?: string;
    issues?: string[];
    auto_reply?: string;
  } | null;
  onDateChange: (start: string, end: string) => void;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ startDate, endDate, isUploaded, insights, onDateChange }) => {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !isUploaded || isProcessing) return;

    setIsProcessing(true);
    setAiResponse(null);

    try {
      const result = await askQuestion(query.trim());
      setIsProcessing(false);
      setAiResponse(result.answer);
      setQuery('');
    } catch (err: any) {
      setIsProcessing(false);
      if (err instanceof BackendOfflineError) {
        toast.error("Backend Not Running", {
          description: "Start with: uvicorn project.main:app --reload",
          duration: 8000,
          className: "bg-red-500/10 border-red-500/50 text-red-500 font-bold uppercase tracking-widest text-[0.65rem]"
        });
      } else {
        toast.error("AI Query Failed", {
          description: err.message || 'An unexpected error occurred.',
          className: "bg-red-500/10 border-red-500/50 text-red-500 font-bold uppercase tracking-widest text-[0.65rem]"
        });
      }
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
      className={cn(
        "glass-panel p-10 h-[560px] flex flex-col relative overflow-hidden group/ai",
        isUploaded ? "shadow-[0_0_50px_rgba(255,255,255,0.05)]" : ""
      )}
    >
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover/ai:opacity-[0.05] transition-opacity duration-1000">
        <MotionIcon scale={1.2}><Sparkles size={240} className="text-white" /></MotionIcon>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-700 border border-white/10",
            isUploaded ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" : "bg-white/5 text-white/20"
          )}>
            <MotionIcon><Sparkles size={24} fill={isUploaded ? "currentColor" : "none"} className={isUploaded ? "animate-pulse" : ""} /></MotionIcon>
          </div>
          <div className="space-y-1">
            <h3 className={cn(
              "uppercase tracking-[0.3em] text-[0.75rem] font-black transition-all duration-700",
              isUploaded ? "text-white" : "text-white/70"
            )}>AI Synthetic Insights</h3>
            <div className={cn("h-0.5 bg-white/20 transition-all duration-500", isUploaded ? "w-24" : "w-8")}></div>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 border border-white/20 rounded-xl transition-all hover:bg-white/15 hover:border-white/30",
          !isUploaded && "opacity-30 pointer-events-none"
        )}>
          <div className="flex flex-col">
            <span className="text-[0.5rem] uppercase text-white/50 font-bold tracking-tighter">From</span>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => onDateChange(e.target.value, endDate)}
              className="bg-transparent text-[0.65rem] text-white font-bold outline-none border-none p-0 w-24 cursor-pointer hover:text-white/80 transition-colors [color-scheme:dark]"
            />
          </div>
          <div className="w-px h-6 bg-white/20"></div>
          <div className="flex flex-col">
            <span className="text-[0.5rem] uppercase text-white/50 font-bold tracking-tighter">To</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => onDateChange(startDate, e.target.value)}
              className="bg-transparent text-[0.65rem] text-white font-bold outline-none border-none p-0 w-24 cursor-pointer hover:text-white/80 transition-colors [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center relative z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          {aiResponse ? (
            <motion.div 
              key="response"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <MotionIcon><Sparkles size={14} className="text-white" /></MotionIcon>
                <span className="text-[0.6rem] text-white uppercase font-bold tracking-widest">AI Response</span>
              </div>
              <div className="bg-white/5 p-8 border border-white/10 rounded-2xl shadow-inner relative group/response overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-white/20 rounded-full"></div>
                <p className="text-[0.9rem] text-white/90 leading-relaxed font-light italic">
                  "{aiResponse}"
                </p>
              </div>
              <motion.button 
                whileHover={{ x: -4 }}
                onClick={() => setAiResponse(null)}
                className="mt-6 text-[0.65rem] text-white/40 hover:text-white uppercase tracking-widest font-black transition-all flex items-center gap-2"
              >
                <span className="text-lg">←</span> Back to Dashboard
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              key="insights"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl space-y-6"
            >
              {/* Urgency and Topic Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/[0.05] p-6 border border-white/10 rounded-2xl shadow-inner group/insight">
                   <div className="flex justify-between items-center mb-4">
                     <p className="text-[0.65rem] text-white/50 uppercase font-bold tracking-widest">Urgency Score</p>
                     <span className={cn("text-xs font-black text-high-contrast", insights?.urgency_score && insights.urgency_score > 7 ? 'text-red-400' : 'text-green-400')}>{insights?.urgency_score}/10</span>
                   </div>
                   <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                     <motion.div initial={{ width: 0 }} animate={{ width: `${(insights?.urgency_score || 0) * 10}%` }} className={cn("h-full", insights?.urgency_score && insights.urgency_score > 7 ? 'bg-red-400' : 'bg-green-400')} />
                   </div>
                </div>

                <div className="bg-white/5 p-6 border border-white/10 rounded-2xl shadow-inner group/insight flex flex-col justify-center">
                   <p className="text-[0.65rem] text-white/50 uppercase font-bold tracking-widest mb-2">Topic Classification</p>
                   <div>
                     <span className="inline-block px-3 py-1 bg-primary/20 text-primary border border-primary/40 rounded-full text-[0.65rem] font-bold uppercase tracking-widest">
                       {insights?.topic || 'Unclassified'}
                     </span>
                   </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white/[0.05] p-6 border border-white/10 rounded-2xl shadow-inner text-high-contrast">
                <p className="text-[0.65rem] text-white/50 uppercase font-bold tracking-widest mb-3">Executive Summary</p>
                <p className="text-[0.9rem] text-white/90 leading-relaxed font-light">{insights?.summary || 'Upload data to generate insights.'}</p>
              </div>

              {/* Issues and Auto Reply Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 p-6 border border-white/10 rounded-2xl shadow-inner overflow-y-auto max-h-48">
                  <p className="text-[0.65rem] text-white/50 uppercase font-bold tracking-widest mb-3">Extracted Issues</p>
                  <ul className="list-disc pl-4 space-y-2">
                    {insights?.issues?.map((issue: string, i: number) => (
                      <li key={i} className="text-[0.75rem] text-red-300/80 leading-snug">{issue}</li>
                    )) || <li className="text-[0.75rem] text-white/40">No issues found.</li>}
                  </ul>
                </div>
                <div className="bg-white/5 p-6 border border-white/10 rounded-2xl shadow-inner relative overflow-y-auto max-h-48 group/reply">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                  <p className="text-[0.65rem] text-white/50 uppercase font-bold tracking-widest mb-3 relative z-10">Auto-Reply Draft</p>
                  <p className="text-[0.75rem] text-white/90 italic relative z-10">"{insights?.auto_reply || 'Awaiting input.'}"</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-12 space-y-6 relative z-10">
        <form onSubmit={handleQuerySubmit} className={cn("relative group transition-all", !isUploaded ? "opacity-50" : "opacity-100")}>
          <div className={cn(
            "absolute -inset-1 bg-gradient-to-r from-white/20 via-white/5 to-transparent rounded-2xl blur transition-all duration-500",
            isFocused ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}></div>
          <div className="relative">
            <input 
              className={cn(
                "w-full glass-input py-4 px-6 pr-14 bg-white/10 border-white/20",
                isFocused ? "bg-white/15 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.05)]" : ""
              )} 
              placeholder="Ask AI about feedback trends..." 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={!isUploaded || isProcessing}
            />
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="submit"
              disabled={!isUploaded || isProcessing || !query.trim()}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300",
                query.trim() && !isProcessing ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "text-white/20 bg-white/5"
              )}
            >
              {isProcessing ? (
                <MotionIcon><Loader2 size={18} className="animate-spin" /></MotionIcon>
              ) : (
                <MotionIcon><Send size={18} /></MotionIcon>
              )}
            </motion.button>
          </div>
        </form>
        <div className={cn("flex flex-wrap gap-3 transition-all", !isUploaded ? "opacity-50" : "opacity-100")}>
          <span className="text-[0.6rem] text-white/60 uppercase font-black tracking-[0.2em] self-center mr-2">Suggestions:</span>
          {[
            'Predict future trends', 
            'Summarize key issues',
            'Draft a global response'
          ].map(suggestion => (
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.4)" }}
              whileTap={{ scale: 0.95 }}
              key={suggestion}
              onClick={() => setQuery(suggestion)}
              disabled={!isUploaded || isProcessing}
              className="glass-pill px-4 py-2 text-[0.65rem] text-white/90 hover:text-white uppercase font-black tracking-widest disabled:cursor-not-allowed"
            >
              "{suggestion}"
            </motion.button>
          ))}
        </div>
        <p className="text-[0.55rem] text-white/30 uppercase tracking-[0.5em] text-center font-black pt-4">[ AI Model: Monolith-v1.5-Flash (Neural RAG) ]</p>
      </div>
    </motion.div>
  );
};
