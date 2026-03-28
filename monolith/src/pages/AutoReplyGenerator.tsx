import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  ChevronLeft, 
  Send, 
  Copy, 
  RefreshCw, 
  Check, 
  Sparkles,
  Zap,
  ShieldCheck,
  Globe,
  Smile,
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface AutoReplyGeneratorProps {
  onBack: () => void;
}

const tones = [
  { id: 'professional', label: 'Professional', icon: Briefcase, color: 'text-neon-cyan' },
  { id: 'friendly', label: 'Friendly', icon: Smile, color: 'text-neon-purple' },
  { id: 'urgent', label: 'Urgent', icon: AlertCircle, color: 'text-red-400' },
];

export const AutoReplyGenerator: React.FC<AutoReplyGeneratorProps> = ({ onBack }) => {
  const [selectedTone, setSelectedTone] = useState('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReply, setGeneratedReply] = useState('');
  const [copied, setCopied] = useState(false);

  const inputEmail = `Hi team, we are facing repeated delays in billing and the system is very slow. This is impacting our operations.`;

  const replies: Record<string, string> = {
    professional: `Dear Customer,

Thank you for reaching out. We sincerely apologize for the delays in billing and the system performance issues you've encountered. 

Our technical team is currently investigating the root cause of the latency, and our billing department is working to resolve the backlog. We understand the impact on your operations and are prioritizing your case.

We will provide a detailed update within the next 2 hours.

Best regards,
MONOLITH Intelligence Engine Support`,
    friendly: `Hi there!

Thanks for letting us know about the billing delays and the slow system. We're really sorry for the trouble this is causing your team!

We've got our best engineers on it right now, and we're also sorting out the billing side of things. We'll get everything back up to speed as quickly as possible.

Thanks for your patience while we fix this!

Talk soon,
The MONOLITH Team`,
    urgent: `URGENT: System Performance & Billing Update

We have received your report regarding system latency and billing delays. 

This issue has been escalated to our Tier 3 Engineering team for immediate resolution. We are treating this as a high-priority incident affecting your operations.

Expected Resolution Time: < 60 minutes.
A dedicated support lead will contact you shortly with further details.

MONOLITH Incident Response Team`
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setGeneratedReply('');
    setTimeout(() => {
      setGeneratedReply(replies[selectedTone]);
      setIsGenerating(false);
    }, 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

      <div className="flex items-center gap-4 mb-12">
        <div className="p-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20">
          <MessageSquare className="w-8 h-8 text-neon-cyan" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-glow">Auto Reply Generator</h1>
          <p className="text-white/40 font-mono text-sm">Context-aware neural response drafting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="glass rounded-3xl p-8 border-white/10">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-white/40" />
              Incoming Communication
            </h3>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 font-mono text-sm text-white/60 leading-relaxed">
              {inputEmail}
            </div>
          </div>

          <div className="glass rounded-3xl p-8 border-white/10">
            <h3 className="text-xl font-bold mb-6">Response Parameters</h3>
            <div className="grid grid-cols-3 gap-4">
              {tones.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => setSelectedTone(tone.id)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                    selectedTone === tone.id 
                      ? 'bg-white/10 border-neon-cyan text-white' 
                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  <tone.icon className={`w-6 h-6 ${selectedTone === tone.id ? tone.color : ''}`} />
                  <span className="text-xs font-bold uppercase tracking-wider">{tone.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full mt-8 py-4 rounded-2xl bg-neon-cyan text-black font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  CALCULATING RESPONSE...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 group-hover:scale-125 transition-transform" />
                  GENERATE NEURAL REPLY
                </>
              )}
            </button>
          </div>
        </div>

        <div className="glass rounded-3xl p-8 border-white/10 relative min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">Generated Output</h3>
            {generatedReply && (
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 text-xs font-mono text-white/40 hover:text-neon-cyan transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'COPIED' : 'COPY TO CLIPBOARD'}
              </button>
            )}
          </div>

          <div className="flex-grow relative">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-6"
                >
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-neon-cyan animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-neon-cyan font-mono text-sm animate-pulse">ANALYZING CONTEXT</p>
                    <p className="text-white/20 text-xs mt-1">Synthesizing optimal response...</p>
                  </div>
                </motion.div>
              ) : generatedReply ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 rounded-2xl bg-white/5 border border-white/5 font-mono text-sm text-white/80 leading-relaxed whitespace-pre-wrap h-full"
                >
                  {generatedReply}
                </motion.div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-20">
                  <MessageSquare className="w-16 h-16 mb-4" />
                  <p className="text-sm">Select a tone and click generate to begin</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {generatedReply && (
            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border border-cyber-black bg-white/10 flex items-center justify-center text-[10px] font-bold">
                      AI
                    </div>
                  ))}
                </div>
                <span className="text-xs text-white/40 font-mono">Verified by Monolith-v4</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-400 font-mono">
                <ShieldCheck className="w-4 h-4" />
                SECURE DRAFT
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
