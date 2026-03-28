import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, ChevronLeft, Zap, AlertTriangle, CheckCircle2, Search } from 'lucide-react';

interface EmailAnalysisProps {
  onBack: () => void;
}

export const EmailAnalysis: React.FC<EmailAnalysisProps> = ({ onBack }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [emailText, setEmailText] = useState(
    "Hi team, we are facing repeated delays in billing and the system is very slow. This is impacting our operations."
  );

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setShowResult(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResult(true);
    }, 2000);
  };

  const highlightText = (text: string) => {
    const keywords = ["delays", "billing", "slow", "impacting", "operations"];
    let highlighted = text;
    keywords.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlighted = highlighted.replace(regex, '<span class="text-neon-cyan font-bold underline decoration-neon-cyan/30">$1</span>');
    });
    return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Input Panel */}
        <div className="space-y-8">
          <div className="glass rounded-3xl p-8 border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
                <Mail className="w-5 h-5 text-neon-cyan" />
              </div>
              <h2 className="text-xl font-bold">Email Input</h2>
            </div>
            
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              className="w-full h-64 bg-black/40 border border-white/10 rounded-2xl p-6 text-white/80 focus:border-neon-cyan/50 focus:outline-none transition-all resize-none font-mono text-sm leading-relaxed"
              placeholder="Paste email content here..."
            />

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full mt-6 py-4 bg-neon-cyan text-black font-bold rounded-xl neon-glow-cyan hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  NEURAL PROCESSING...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  ANALYZE INTENT
                </>
              )}
            </button>
          </div>

          <div className="glass rounded-3xl p-8 border-white/10">
            <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest mb-4">Keyword Highlighting</h3>
            <div className="p-6 bg-black/40 rounded-2xl border border-white/5 text-white/60 leading-relaxed italic">
              {highlightText(emailText)}
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {!showResult && !isAnalyzing ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 glass rounded-3xl border-dashed border-white/10"
              >
                <div className="p-4 rounded-full bg-white/5 mb-6">
                  <Search className="w-12 h-12 text-white/20" />
                </div>
                <h3 className="text-xl font-bold text-white/40">Ready for Analysis</h3>
                <p className="text-white/20 max-w-xs mt-2">Input an email and click analyze to start neural processing.</p>
              </motion.div>
            ) : isAnalyzing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center p-12 glass rounded-3xl border-white/10"
              >
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 border-4 border-neon-cyan/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-4 border-4 border-neon-purple/20 rounded-full" />
                  <div className="absolute inset-4 border-4 border-neon-purple border-b-transparent rounded-full animate-spin-reverse" />
                </div>
                <span className="text-neon-cyan font-mono animate-pulse">SCANNING NEURAL PATHWAYS...</span>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="glass rounded-3xl p-8 border-neon-cyan/30 neon-glow-cyan">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-glow">Analysis Result</h2>
                    <div className="px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-xs font-mono text-neon-cyan">
                      CONFIDENCE: 98.4%
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="text-xs font-mono text-white/40 uppercase tracking-widest block mb-2">Summary</label>
                      <p className="text-lg text-white/80">Customer reporting system delay and billing issues</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1">Detected Intent</label>
                        <div className="flex items-center gap-2 text-neon-purple font-bold">
                          <AlertTriangle className="w-4 h-4" />
                          COMPLAINT
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1">Urgency Score</label>
                        <div className="flex items-center gap-2 text-neon-cyan font-bold">
                          <Zap className="w-4 h-4" />
                          85 / 100
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-white/40 uppercase tracking-widest block mb-4">Key Issues Identified</label>
                      <div className="space-y-3">
                        {["Billing delay", "System performance", "Operational impact"].map((issue, i) => (
                          <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                            <CheckCircle2 className="w-4 h-4 text-neon-cyan" />
                            <span className="text-sm text-white/70">{issue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-3xl p-6 border-white/10 text-center">
                  <p className="text-xs text-white/30 font-mono italic">
                    Analysis generated by Monolith Engine. Neural weights optimized for enterprise support.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
