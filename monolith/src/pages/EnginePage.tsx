import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Zap, AlertTriangle, CheckCircle2, Clock, Search } from 'lucide-react';

export const EnginePage: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleAnalyze = () => {
    if (!fileName) return;
    setIsAnalyzing(true);
    setShowResult(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResult(true);
    }, 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12 pb-24"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-glow mb-2">ENGINE DASHBOARD</h1>
          <p className="text-white/40 font-mono text-sm uppercase tracking-widest">Neural Processing Unit</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 glass rounded-lg border-neon-cyan/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
            <span className="text-xs font-mono text-neon-cyan">SYSTEM READY</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Control Panel */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass rounded-3xl p-8 border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50" />
            
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
                <Upload className="w-5 h-5 text-neon-cyan" />
              </div>
              <h2 className="text-xl font-bold">Data Ingestion</h2>
            </div>

            <div className="relative group/upload">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all ${fileName ? 'border-neon-cyan/50 bg-neon-cyan/5' : 'border-white/10 hover:border-white/20 bg-black/20'}`}>
                <div className={`p-4 rounded-full mb-4 transition-all ${fileName ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-white/5 text-white/20'}`}>
                  <FileText className="w-8 h-8" />
                </div>
                {fileName ? (
                  <div className="text-center">
                    <p className="text-white font-bold mb-1">{fileName}</p>
                    <p className="text-white/40 text-sm">File ready for neural mapping</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-white font-bold mb-1">Drop CSV file here</p>
                    <p className="text-white/40 text-sm">or click to browse local storage</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!fileName || isAnalyzing}
              className="w-full mt-8 py-4 bg-neon-cyan text-black font-bold rounded-xl neon-glow-cyan hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:hover:scale-100"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  PROCESSING NEURAL DATA...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  START ANALYSIS
                </>
              )}
            </button>
          </div>

          {/* Analysis Results */}
          <AnimatePresence mode="wait">
            {showResult ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-3xl p-8 border-neon-cyan/30 neon-glow-cyan"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-glow">Neural Output</h2>
                  <div className="px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-xs font-mono text-neon-cyan">
                    CONFIDENCE: 99.2%
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="text-xs font-mono text-white/40 uppercase tracking-widest block mb-2">Summary</label>
                        <p className="text-lg text-white/80 leading-relaxed">
                          Batch processing identified critical bottlenecks in the billing pipeline affecting 14% of enterprise nodes.
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1">Urgency Level</label>
                        <div className="flex items-center gap-2 text-neon-purple font-bold">
                          <AlertTriangle className="w-4 h-4" />
                          CRITICAL (92/100)
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-white/40 uppercase tracking-widest block mb-4">Key Issues Detected</label>
                      <div className="space-y-3">
                        {[
                          "Latency spikes in API Gateway",
                          "Database deadlock on write operations",
                          "Memory leak in session manager"
                        ].map((issue, i) => (
                          <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-black/40 border border-white/5">
                            <CheckCircle2 className="w-4 h-4 text-neon-cyan" />
                            <span className="text-sm text-white/70">{issue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-64 flex flex-col items-center justify-center text-center p-12 glass rounded-3xl border-dashed border-white/10"
              >
                <Search className="w-12 h-12 text-white/10 mb-4" />
                <h3 className="text-lg font-bold text-white/20">Awaiting Neural Data</h3>
                <p className="text-white/10 text-sm mt-1">Upload a CSV to begin intelligence extraction</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Panel */}
        <div className="space-y-8">
          <div className="glass rounded-3xl p-8 border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-5 h-5 text-neon-purple" />
              <h2 className="text-xl font-bold">Recent Activity</h2>
            </div>
            <div className="space-y-6">
              {[
                { time: '2m ago', action: 'Sentiment Scan', status: 'Completed', color: 'text-neon-cyan' },
                { time: '15m ago', action: 'Network Sync', status: 'Online', color: 'text-green-400' },
                { time: '1h ago', action: 'Data Backup', status: 'Verified', color: 'text-white/40' },
                { time: '3h ago', action: 'Neural Training', status: 'Success', color: 'text-neon-purple' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between group cursor-default">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{item.action}</span>
                    <span className="text-[10px] font-mono text-white/30">{item.time}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold uppercase ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 rounded-xl border border-white/10 text-xs font-mono text-white/40 hover:bg-white/5 transition-all">
              VIEW FULL LOGS
            </button>
          </div>

          <div className="glass rounded-3xl p-8 border-white/10 bg-gradient-to-br from-neon-purple/5 to-transparent">
            <h3 className="text-sm font-mono text-neon-purple uppercase tracking-widest mb-4">Engine Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-mono mb-1">
                  <span className="text-white/40">CPU LOAD</span>
                  <span className="text-neon-cyan">42%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '42%' }}
                    className="h-full bg-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.5)]"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-mono mb-1">
                  <span className="text-white/40">NEURAL ACCURACY</span>
                  <span className="text-neon-purple">99.8%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '99.8%' }}
                    className="h-full bg-neon-purple shadow-[0_0_10px_rgba(188,19,254,0.5)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
