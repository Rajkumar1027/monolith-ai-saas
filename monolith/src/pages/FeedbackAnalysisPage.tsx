import React, { useState, useEffect } from 'react';
import { Upload, Database, TrendingUp, MessageSquare, ShieldAlert, Zap, Target, BarChart3, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart as RePie, Pie, Cell } from 'recharts';

export const FeedbackAnalysisPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('BAR');

  // THE "NEURAL" HANDSHAKE: Clear old sessions
  useEffect(() => {
    if (window.location.search.includes('error=401')) {
      localStorage.clear();
      window.location.href = '/'; 
    }
  }, []);

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('https://monolith-ai-saas.onrender.com/api/feedback/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Neural Processing Failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-black min-h-screen text-white font-sans selection:bg-indigo-500/30">
      
      {/* SECTION 1: HEADER & DROPZONE (MATCHES SCREENSHOT 203632) */}
      <div className="grid grid-cols-12 gap-10 mb-12 items-center">
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <p className="text-indigo-500 font-bold tracking-[0.4em] text-[10px] uppercase">Intelligence Engine</p>
          <h1 className="text-7xl font-bold tracking-tighter leading-none">Feedback <br/><span className="text-gray-500/50">Analysis</span></h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
            Upload raw customer sentiment data to generate architectural insights and trend vectors.
          </p>

          {/* NEURAL EXECUTIVE BRIEFING (GEMINI) */}
          {data?.executive_summary && (
            <div className="bg-indigo-500/5 border-l-2 border-indigo-500 p-6 rounded-r-2xl animate-in fade-in slide-in-from-left-4 duration-1000">
              <h4 className="text-[10px] font-bold tracking-widest text-indigo-400 mb-2 uppercase">Neural Briefing</h4>
              <p className="text-sm text-indigo-100/80 leading-relaxed italic">"{data.executive_summary}"</p>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-7 bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center group hover:border-indigo-500/20 transition-all shadow-2xl">
          <label className="cursor-pointer">
            <div className="bg-white/5 p-6 rounded-3xl mb-6 group-hover:scale-110 transition-transform">
              <Upload className="text-gray-500 group-hover:text-white" size={32} />
            </div>
            <h3 className="text-sm font-bold tracking-[0.2em] mb-2 uppercase">Drop Feedback File</h3>
            <p className="text-[10px] text-gray-700 mb-8 font-mono uppercase tracking-widest">CSV, TXT • MAX 50MB</p>
            <div className="bg-white text-black px-12 py-4 rounded-2xl font-bold text-xs hover:bg-indigo-500 hover:text-white transition-all active:scale-95 shadow-xl">
              {loading ? 'PROCESSING VECTORS...' : 'OPEN TERMINAL'}
            </div>
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv" />
          </label>
        </div>
      </div>

      {/* SECTION 2: STATS CARDS & KEYWORDS */}
      <div className="grid grid-cols-12 gap-6 mb-12">
        <div className="col-span-12 lg:col-span-3 bg-[#0d0d0d] border border-white/5 p-8 rounded-3xl">
          <p className="text-gray-600 text-[10px] uppercase tracking-widest mb-2 font-bold">Net Sentiment</p>
          <div className="flex items-end gap-2">
            <h2 className={`text-5xl font-mono font-bold ${data?.average_sentiment >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data?.average_sentiment ? `${data.average_sentiment.toFixed(1)}%` : '0.0%'}
            </h2>
            <Target size={18} className="text-gray-800 mb-2" />
          </div>
        </div>
        
        <div className="col-span-12 lg:col-span-9 bg-[#0d0d0d] border border-white/5 p-8 rounded-3xl flex items-center justify-between">
           <div className="space-y-1">
             <p className="text-gray-600 text-[10px] uppercase tracking-widest font-bold">Keyword Pulse</p>
             <div className="flex gap-2">
                {data?.top_keywords?.map((k: string) => (
                  <span key={k} className="bg-white/5 border border-white/5 px-3 py-1 rounded-full text-[10px] font-mono text-indigo-400">#{k.toUpperCase()}</span>
                )) || <span className="text-gray-800 font-mono text-xs">AWAITING INGESTION...</span>}
             </div>
           </div>
           <div className="text-right">
             <p className="text-gray-600 text-[10px] uppercase tracking-widest font-bold">Total Volume</p>
             <h2 className="text-3xl font-mono font-bold">{data?.total_rows || '0000'}</h2>
           </div>
        </div>
      </div>

      {/* SECTION 3: MOMENTUM & DISTRIBUTION (MATCHES SCREENSHOT) */}
      <div className="grid grid-cols-12 gap-6 mb-12">
        <div className="col-span-12 lg:col-span-4 bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-8">
          <h3 className="text-xs font-bold tracking-widest uppercase mb-10 flex items-center gap-2">
            Sentiment Distribution <PieChart size={14} className="text-indigo-500" />
          </h3>
          <div className="h-48 flex items-center justify-center">
             <Database className="text-white/5" size={80} />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-bold tracking-widest uppercase">Sentiment Momentum</h3>
            <div className="flex bg-black p-1 rounded-xl border border-white/10">
                 {['BAR', 'LINE'].map(t => (
                   <button key={t} onClick={() => setView(t)} className={`px-4 py-1.5 rounded-lg text-[9px] font-bold ${view === t ? 'bg-white text-black' : 'text-gray-500'}`}>{t}</button>
                 ))}
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
               {view === 'BAR' ? (
                 <BarChart data={data?.velocity_data || []}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                   <XAxis dataKey="date" hide />
                   <Bar dataKey="sentiment" fill="#6366f1" radius={[4, 4, 0, 0]} />
                 </BarChart>
               ) : (
                 <AreaChart data={data?.velocity_data || []}>
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
          <div className="space-y-4 max-h-60 overflow-y-auto">
            {data?.processed_data?.filter((x:any) => x.sentiment === 'Negative').slice(0,5).map((item:any, i:number) => (
              <p key={i} className="text-xs text-gray-400 leading-relaxed border-b border-white/5 pb-3">"{item.text}"</p>
            ))}
          </div>
        </div>

        <div className="bg-green-500/5 border border-green-500/10 rounded-[2.5rem] p-8">
          <h3 className="text-green-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
            <Zap size={14} /> Notable Praise
          </h3>
          <div className="space-y-4 max-h-60 overflow-y-auto">
             {data?.processed_data?.filter((x:any) => x.sentiment === 'Positive').slice(0,5).map((item:any, i:number) => (
              <p key={i} className="text-xs text-gray-400 leading-relaxed border-b border-white/5 pb-3">"{item.text}"</p>
            ))}
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
