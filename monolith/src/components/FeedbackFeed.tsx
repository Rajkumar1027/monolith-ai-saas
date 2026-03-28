import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MotionIcon } from './MotionIcon';
import { ArrowRight, Loader2, RefreshCw, Edit3, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface FeedItem {
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  time: string;
  content: string;
  hasAction?: boolean;
}

const feedData: FeedItem[] = [
  {
    sentiment: 'Positive',
    time: '2m ago',
    content: '"The new monolith interface is incredibly fast. The minimalist design helps me focus on data without distraction."'
  },
  {
    sentiment: 'Negative',
    time: '14m ago',
    content: '"Found the CSV upload a bit restrictive with the 50MB limit. Need support for larger datasets for enterprise analysis."',
    hasAction: true
  },
  {
    sentiment: 'Neutral',
    time: '1h ago',
    content: '"Analysis results are consistent with our internal tracking. No major surprises in this week\'s data."'
  }
];

interface FeedbackFeedProps {
  data?: FeedItem[];
}

export const FeedbackFeed: React.FC<FeedbackFeedProps> = ({ data }) => {
  const displayData = data || feedData;
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [replies, setReplies] = useState<{ [key: number]: string }>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleGenerateReply = (id: number) => {
    setGeneratingId(id);
    // Simulate AI generation
    setTimeout(() => {
      const mockReplies = [
        "Thank you for your feedback. We are currently investigating the latency issues and plan to deploy a fix in the next sprint. We appreciate your patience.",
        "We appreciate your positive feedback! Our team is dedicated to providing the best user experience, and we're glad you're enjoying the new interface.",
        "Thank you for bringing the upload limit to our attention. We are evaluating our infrastructure to support larger datasets in the near future.",
        "We're sorry to hear about the performance spikes. Our engineering team is monitoring the system closely to ensure stability during peak hours."
      ];
      setReplies(prev => ({ ...prev, [id]: mockReplies[Math.floor(Math.random() * mockReplies.length)] }));
      setGeneratingId(null);
    }, 1500);
  };

  return (
    <motion.div 
      whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
      className="glass-card p-8 h-[480px] flex flex-col group/card relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
      
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div className="space-y-1">
          <h3 className="uppercase tracking-widest text-white/90 text-[0.75rem] font-black group-hover/card:text-primary transition-colors">Recent Feed</h3>
          <div className="h-0.5 w-6 bg-white/20 group-hover/card:w-12 transition-all duration-500"></div>
        </div>
        <span className="text-[0.6rem] text-white/40 uppercase tracking-widest font-black">Real-Time Stream</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 hide-scrollbar relative z-10">
        <AnimatePresence initial={false}>
          {displayData.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/[0.06] hover:border-white/20 transition-all group/item"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={cn(
                  "text-[0.65rem] font-black uppercase tracking-[0.2em]",
                  item.sentiment === 'Positive' ? "text-white" : 
                  item.sentiment === 'Neutral' ? "text-white/60" : "text-white/40"
                )}>
                  {item.sentiment}
                </span>
                <span className="text-[0.6rem] text-white/30 tracking-widest font-bold">{item.time}</span>
              </div>
              <p className="text-[0.85rem] text-white/80 leading-relaxed font-light">{item.content}</p>
              
              <AnimatePresence>
                {replies[index] && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="p-5 bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      <span className="text-[0.6rem] text-white uppercase font-black tracking-widest">AI Generated Response</span>
                    </div>
                    {editingId === index ? (
                      <textarea 
                        autoFocus
                        className="w-full glass-input h-24 resize-none text-[0.8rem]"
                        value={replies[index]}
                        onChange={(e) => setReplies(prev => ({ ...prev, [index]: e.target.value }))}
                      />
                    ) : (
                      <p className="text-[0.8rem] text-white/70 leading-relaxed italic">"{replies[index]}"</p>
                    )}
                    <div className="mt-4 flex justify-end gap-4">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleGenerateReply(index)}
                        className="text-[0.6rem] uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-1.5 font-bold"
                      >
                        <MotionIcon><RefreshCw size={12} /></MotionIcon> Regenerate
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setEditingId(editingId === index ? null : index)}
                        className="text-[0.6rem] uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-1.5 font-bold"
                      >
                        {editingId === index ? <><MotionIcon><Check size={12} /></MotionIcon> Save</> : <><MotionIcon><Edit3 size={12} /></MotionIcon> Edit</>}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {item.hasAction && !replies[index] && (
                <div className="mt-6 flex justify-end">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleGenerateReply(index)}
                    disabled={generatingId === index}
                    className="glass-button-primary !px-4 !py-2 !text-[0.6rem] !rounded-lg"
                  >
                    {generatingId === index ? (
                      <><MotionIcon><Loader2 size={12} className="animate-spin" /></MotionIcon> Generating...</>
                    ) : (
                      <><span>👉 Generate AI Reply</span></>
                    )}
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
