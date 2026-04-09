import React, { useState, useEffect, useMemo } from 'react';
import { Upload, Database, TrendingUp, MessageSquare, ShieldAlert, Zap, Target, PieChart as PieChartIcon, Sparkles, CheckCircle2, ArrowRight, XCircle, Info, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { uploadFeedbackFile, askQuestion } from '../lib/api';

interface AIReport {
  summary: string;
  positive_insights: string[];
  critical_issues: string[];
  neutral_observations: string[];
  actionable_suggestions: string[];
}

interface FeedbackData {
  total_rows?: number;
  average_sentiment?: number;
  top_keywords?: string[];
  ai_report?: AIReport;
  processed_data?: { text: string; sentiment: string; confidence: number; polarity: number }[];
  velocity_data?: { date: string; sentiment: number }[];
}

const FeedbackAnalysisPage = () => {
  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [view, setView] = useState('BAR');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [qaHistory, setQaHistory] = useState<{ question: string; answer: string }[]>([]);

  // THE "NEURAL" HANDSHAKE: Clear old sessions
  useEffect(() => {
    if (window.location.search.includes('error=401')) {
      localStorage.clear();
      window.location.href = '/'; 
    }
  }, []);

  const processFile = async (file: File) => {
    setLoading(true);
    try {
      // Using centralized API client for automatic auth injection and error handling
      const result = await uploadFeedbackFile(file);
      setData(result);
    } catch (err: any) {
      console.error("Neural Processing Failed", err);
      if (err.message === 'Session expired') {
        localStorage.clear();
        window.location.href = '/login?error=401';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      processFile(file);
    }
  };

  const handleGenerateCustomSynthesis = async () => {
    if (!aiPrompt.trim()) return;
    const question = aiPrompt.trim();
    setIsGenerating(true);
    try {
      // Using centralized API client for RAG-enhanced intelligence query
      const result = await askQuestion(
        question, 
        data?.ai_report?.summary || "General feedback data."
      );

      if (result.answer) {
        // Update the main report
        setData((prev) => ({ ...prev, ai_report: result.answer }));
        
        // Build a readable answer string from the structured response
        const ans = result.answer;
        const readable = [
          ans.summary || '',
          ...(ans.positive_insights ?? []).map((s: string) => `✦ ${s}`),
          ...(ans.critical_issues ?? []).map((c: string) => `⚠ ${c}`),
          ...(ans.neutral_observations ?? []).map((n: string) => `◈ ${n}`),
          ...(ans.actionable_suggestions ?? []).map((a: string) => `→ ${a}`),
        ].filter(Boolean).join('\n');

        setQaHistory(prev => [{ question, answer: readable }, ...prev]);
      }
    } catch (err: any) {
      console.error("Synthesis Engine Error", err);
      if (err.message === 'Session expired') {
        localStorage.clear();
        window.location.href = '/login?error=401';
      } else {
        setQaHistory(prev => [{ question, answer: 'Neural connection lost. Please try again.' }, ...prev]);
      }
    } finally {
      setAiPrompt('');
      setIsGenerating(false);
    }
  };

  const filteredVelocity = useMemo(() => {
    if(!data?.velocity_data) return [];
    return data.velocity_data.filter(d => {
        if (fromDate && new Date(d.date) < new Date(fromDate)) return false;
        if (toDate && new Date(d.date) > new Date(toDate)) return false;
        return true;
    });
  }, [data?.velocity_data, fromDate, toDate]);

  const sentimentDistribution = useMemo(() => {
    if (!data?.processed_data) return [];
    const pos = data.processed_data.filter(x => x.sentiment === 'Positive').length;
    const neg = data.processed_data.filter(x => x.sentiment === 'Negative').length;
    const neu = data.processed_data.filter(x => x.sentiment === 'Neutral').length;
    return [
      { name: 'Positive', value: pos, color: '#4ade80' },
      { name: 'Negative', value: neg, color: '#f87171' },
      { name: 'Neutral', value: neu, color: '#6366f1' },
    ].filter(x => x.value > 0);
  }, [data?.processed_data]);

  const report = data?.ai_report;

  return (
    <div className="p-8 bg-black min-h-screen text-white font-sans selection:bg-indigo-500/30">
      
      {/* SECTION 1: HEADER & DROPZONE */}
      <div className="grid grid-cols-12 gap-10 mb-12 items-center">
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <p className="text-indigo-500 font-bold tracking-[0.4em] text-[10px] uppercase">Intelligence Engine</p>
          <h1 className="text-7xl font-bold tracking-tighter leading-none">Feedback <br/><span className="text-gray-500/50">Analysis</span></h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
            Upload raw customer sentiment data to generate architectural insights and trend vectors.
          </p>
        </div>

        <div className="col-span-12 lg:col-span-7 bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center shadow-2xl">
          <label 
            className={`cursor-pointer w-full flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed p-12 transition-all ${isDragging ? 'border-indigo-500 bg-indigo-500/5 scale-105' : 'border-white/10 hover:border-indigo-500/30'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="bg-white/5 p-6 rounded-3xl mb-6 transition-transform">
              {loading ? (
                 <div className="w-8 h-8 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              ) : (
                 <Upload className="text-gray-500" size={32} />
              )}
            </div>
            <h3 className="text-sm font-bold tracking-[0.2em] mb-2 uppercase">Drop Feedback File</h3>
            <p className="text-[10px] text-gray-700 mb-8 font-mono uppercase tracking-widest">CSV, TXT • MAX 50MB</p>
            <div className={`bg-white text-black px-12 py-4 rounded-2xl font-bold text-xs hover:bg-indigo-500 hover:text-white transition-all active:scale-95 shadow-xl ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
              Upload File
            </div>
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv" />
          </label>
        </div>
      </div>


      {/* SECTION 2: INTELLIGENCE CONSOLE (AI REPORT + Q&A) */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* TOP: REPORT OR PLACEHOLDER */}
        <div className="p-8">
          {report ? (
            <div className="relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* HEADER */}
              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                  <Sparkles className="text-indigo-400" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Intelligence Feedback</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Monolith AI Synthesis</p>
                </div>
              </div>

              {/* REPORT BODY */}
              <div className="relative z-10 rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-8 space-y-5">
                  {report.summary && (
                    <p className="text-sm leading-[1.9] text-gray-300 italic">{report.summary}</p>
                  )}
                  {(report.positive_insights ?? []).length > 0 && (
                    <div>
                      {(report.positive_insights ?? []).map((s, i) => (
                        <p key={i} className="text-sm leading-[1.9] text-gray-400">
                          <span className="text-green-400 font-semibold">{i === 0 ? '✦ ' : '  '}</span>
                          {s}
                        </p>
                      ))}
                    </div>
                  )}
                  {(report.critical_issues ?? []).length > 0 && (
                    <div>
                      {(report.critical_issues ?? []).map((c, i) => (
                        <p key={i} className="text-sm leading-[1.9] text-gray-400">
                          <span className="text-red-400 font-semibold">{i === 0 ? 'Negative escalation risk' : '⚠ '}</span>
                          {i === 0 ? ' — ' : ' '}{c}
                        </p>
                      ))}
                    </div>
                  )}
                  {(report.neutral_observations ?? []).length > 0 && (
                    <div>
                      {(report.neutral_observations ?? []).map((n, i) => (
                        <p key={i} className="text-sm leading-[1.9] text-gray-400">
                          <span className="text-yellow-400 font-semibold">{i === 0 ? 'Neutral stabilization' : '◈ '}</span>
                          {i === 0 ? ' — ' : ' '}{n}
                        </p>
                      ))}
                    </div>
                  )}
                  {(report.actionable_suggestions ?? []).length > 0 && (
                    <div className="pt-4 border-t border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-3">Recommended Actions</p>
                      {(report.actionable_suggestions ?? []).map((a, i) => (
                        <p key={i} className="text-sm leading-[1.9] text-gray-400">
                          <span className="text-indigo-400 font-semibold">→ </span>{a}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* PLACEHOLDER */
            <div className="p-16 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="bg-indigo-500/10 p-5 rounded-2xl border border-indigo-500/20 mb-6">
                <Sparkles className="text-indigo-400" size={32} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-3">Intelligence Engine Ready</h2>
              <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
                Upload a dataset to generate a deep-dive intelligence report and start interactive synthesis.
              </p>
            </div>
          )}
        </div>

        {/* BOTTOM: ASK QUESTIONS (DIVIDER ADDED) */}
        <div className="border-t border-white/5">
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 shrink-0">
                  <MessageSquare className="text-indigo-400" size={18} />
                </div>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateCustomSynthesis()}
                    placeholder="Ask Monolith AI anything about your feedback data..."
                    className="w-full bg-[#111] border border-white/10 rounded-xl py-3 px-4 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50 transition-colors placeholder:text-gray-600"
                  />
                </div>
              </div>
              <button
                onClick={handleGenerateCustomSynthesis}
                disabled={isGenerating || !aiPrompt.trim()}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-indigo-500 transition-all active:scale-95 shadow-xl whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> SYNTHESIZING...</>
                ) : (
                  <><Sparkles size={13} /> ASK MONOLITH</>
                )}
              </button>
            </div>

            {/* Q&A HISTORY */}
            {qaHistory.length > 0 ? (
              <div className="divide-y divide-white/5 max-h-[28rem] overflow-y-auto">
                {qaHistory.map((qa, i) => (
                  <div key={i} className="p-6 space-y-4">
                    {/* Question bubble */}
                    <div className="flex items-start gap-3 justify-end">
                      <div className="bg-indigo-600/20 border border-indigo-500/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-xl">
                        <p className="text-sm text-indigo-200 leading-relaxed">{qa.question}</p>
                      </div>
                      <div className="bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-xl shrink-0">
                        <MessageSquare className="text-indigo-400" size={14} />
                      </div>
                    </div>
                    {/* Answer bubble */}
                    <div className="flex items-start gap-3">
                      <div className="bg-[#111] border border-white/5 p-2 rounded-xl shrink-0">
                        <Sparkles className="text-indigo-400" size={14} />
                      </div>
                      <div className="bg-[#111] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xl">
                        {qa.answer.split('\n').map((line, j) => {
                          const isGreen = line.startsWith('✦');
                          const isRed = line.startsWith('⚠');
                          const isYellow = line.startsWith('◈');
                          const isIndigo = line.startsWith('→');
                          return (
                            <p key={j} className={`text-sm leading-relaxed ${
                              isGreen ? 'text-green-400' :
                              isRed ? 'text-red-400' :
                              isYellow ? 'text-yellow-400' :
                              isIndigo ? 'text-indigo-400' :
                              'text-gray-300'
                            } ${j > 0 ? 'mt-1.5' : ''}`}>{line}</p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 flex flex-col items-center text-center">
                <div className="bg-white/3 border border-white/5 p-4 rounded-2xl mb-4">
                  <MessageSquare className="text-gray-700" size={24} />
                </div>
                <p className="text-gray-600 text-xs font-mono tracking-widest uppercase">No questions yet</p>
                <p className="text-gray-700 text-xs mt-1">Ask Monolith AI anything about your dataset above</p>
              </div>
            )}
        </div>
      </div>

      {/* SECTION 3: DATA ANALYSIS (STATISTICS & TRENDS) */}
      <div className="mt-12 space-y-12 pb-12">

      {/* SECTION 2: STATS CARDS & KEYWORDS */}
      <div className="grid grid-cols-12 gap-6 mb-12">
        <div className="col-span-12 bg-[#0d0d0d] border border-white/5 p-8 rounded-3xl flex items-center justify-between shadow-xl">
           <div className="space-y-1">
             <p className="text-gray-600 text-[10px] uppercase tracking-widest font-bold mb-4">Keyword Pulse</p>
             <div className="flex flex-wrap gap-2">
                {data?.top_keywords?.map((k: string) => (
                  <span key={k} className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full text-xs font-mono text-indigo-400">#{k.toUpperCase()}</span>
                )) || <span className="text-gray-800 font-mono text-xs">AWAITING INGESTION...</span>}
             </div>
           </div>
           <div className="text-right pl-8 border-l border-white/5">
             <p className="text-gray-600 text-[10px] uppercase tracking-widest font-bold">Total Volume</p>
             <h2 className="text-4xl font-mono font-bold">{data?.total_rows || '0000'}</h2>
           </div>
        </div>
      </div>

      {/* SECTION 3: MOMENTUM & DISTRIBUTION */}
      <div className="grid grid-cols-12 gap-6 mb-12">
        <div className="col-span-12 lg:col-span-4 bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-8">
          <h3 className="text-xs font-bold tracking-widest uppercase mb-10 flex items-center gap-2">
            Sentiment Distribution <PieChartIcon size={14} className="text-indigo-500" />
          </h3>
          <div className="h-48 flex items-center justify-center relative">
             {sentimentDistribution.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={sentimentDistribution}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {sentimentDistribution.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px'}} itemStyle={{color: '#fff'}} />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
                <Database className="text-white/5 absolute" size={80} />
             )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-8 flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h3 className="text-xs font-bold tracking-widest uppercase">Sentiment Momentum</h3>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-6">
                 {/* From Selector */}
                 <div className="flex flex-col gap-1.5">
                   <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest pl-1">From</span>
                   <div className="flex items-center gap-3 bg-white/3 border border-white/10 px-4 py-2 rounded-xl hover:border-indigo-500/50 transition-all group">
                     <Calendar size={12} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />
                     <input 
                       type="date" 
                       value={fromDate} 
                       onChange={(e) => setFromDate(e.target.value)} 
                       className="bg-transparent text-[11px] text-gray-300 font-mono focus:outline-none appearance-none calendar-inv"
                     />
                   </div>
                 </div>

                 <div className="h-8 w-px bg-white/5 mt-5 hidden md:block" />

                 {/* To Selector */}
                 <div className="flex flex-col gap-1.5">
                   <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest pl-1">To</span>
                   <div className="flex items-center gap-3 bg-white/3 border border-white/10 px-4 py-2 rounded-xl hover:border-indigo-500/50 transition-all group">
                     <Calendar size={12} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />
                     <input 
                       type="date" 
                       value={toDate} 
                       onChange={(e) => setToDate(e.target.value)} 
                       className="bg-transparent text-[11px] text-gray-300 font-mono focus:outline-none appearance-none calendar-inv"
                     />
                   </div>
                 </div>
               </div>
               <div className="flex bg-black p-1 rounded-xl border border-white/10">
                    {['BAR', 'LINE'].map(t => (
                      <button key={t} onClick={() => setView(t)} className={`px-4 py-1.5 rounded-lg text-[9px] font-bold ${view === t ? 'bg-white text-black' : 'text-gray-500'}`}>{t}</button>
                    ))}
               </div>
            </div>
          </div>
          <div className="flex-1 min-h-[12rem]">
            <ResponsiveContainer width="100%" height="100%">
               {view === 'BAR' ? (
                 <BarChart data={filteredVelocity}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                   <XAxis dataKey="date" hide />
                   <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #222'}} />
                   <Bar dataKey="sentiment" fill="#6366f1" radius={[4, 4, 0, 0]} />
                 </BarChart>
               ) : (
                 <AreaChart data={filteredVelocity}>
                   <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #222'}} />
                   <Area type="monotone" dataKey="sentiment" stroke="#6366f1" fill="#6366f133" />
                 </AreaChart>
               )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 4: THE EXTREMES (CRITICAL VS PRAISE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-red-500/5 border border-red-500/10 rounded-[2.5rem] p-8">
          <h3 className="text-red-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
            <ShieldAlert size={14} /> Critical Issues
          </h3>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
            {data?.processed_data?.filter(x => x.sentiment === 'Negative').length ? (
              data.processed_data.filter(x => x.sentiment === 'Negative').map((item, i) => (
                <div key={i} className="border-b border-white/5 pb-3">
                   <p className="text-xs text-gray-400 leading-relaxed break-words">"{item.text}"</p>
                   <span className="text-[9px] text-red-500/50 mt-2 block font-mono">CONFIDENCE: {item.confidence}</span>
                </div>
              ))
            ) : (
              <div className="py-20 flex flex-col items-center opacity-20">
                <ShieldAlert size={32} className="mb-2" />
                <p className="text-[10px] uppercase tracking-widest font-mono">Awaiting Critical Data</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-green-500/5 border border-green-500/10 rounded-[2.5rem] p-8">
          <h3 className="text-green-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
            <Zap size={14} /> Notable Praise
          </h3>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
             {data?.processed_data?.filter(x => x.sentiment === 'Positive').length ? (
               data.processed_data.filter(x => x.sentiment === 'Positive').map((item, i) => (
                <div key={i} className="border-b border-white/5 pb-3">
                   <p className="text-xs text-gray-400 leading-relaxed break-words">"{item.text}"</p>
                   <span className="text-[9px] text-green-500/50 mt-2 block font-mono">CONFIDENCE: {item.confidence}</span>
                </div>
              ))
            ) : (
              <div className="py-20 flex flex-col items-center opacity-20">
                <Zap size={32} className="mb-2" />
                <p className="text-[10px] uppercase tracking-widest font-mono">Awaiting Praise Data</p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="pt-20 pb-10 border-t border-white/5 text-center">
         <p className="text-[10px] font-mono text-gray-800 tracking-[0.5em] uppercase">Monolith Architecture © 2026</p>
       </div>
    </div>
  );
};

export default FeedbackAnalysisPage;
