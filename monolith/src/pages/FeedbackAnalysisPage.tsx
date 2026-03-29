import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MotionIcon } from '@/src/components/MotionIcon';
import { Upload, CheckCircle, Loader2, Database, AlertCircle, TrendingUp, Activity, Zap, BarChart3, FileWarning, RefreshCw, WifiOff } from 'lucide-react';
import Papa from 'papaparse';
import { Toaster, toast } from 'sonner';
import { SentimentDonut, MomentumBarChart, SentimentDataPoint, MomentumDataPoint } from '@/src/components/Charts';
import { FeedbackFeed } from '@/src/components/FeedbackFeed';
import { AIInsights } from '@/src/components/AIInsights';
import { TopicMap } from '@/src/components/TopicMap';
import { cn } from '@/src/lib/utils';
import { uploadFile, analyzeFile, BackendOfflineError } from '@/src/lib/api';

export const FeedbackAnalysisPage: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing Data...');
  const [isUploaded, setIsUploaded] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [insights, setInsights] = useState<{
    urgency_score?: number;
    topic?: string;
    summary?: string;
    issues?: string[];
    auto_reply?: string;
  } | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentDataPoint[]>([]);
  const [momentumData, setMomentumData] = useState<MomentumDataPoint[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'Bar' | 'Line' | 'Pie'>('Bar');
  const [timeframe, setTimeframe] = useState<'D' | 'W' | 'M'>('D');
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [totalSamples, setTotalSamples] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [backendOffline, setBackendOffline] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("https://monolith-ai-saas.onrender.com/health");
        if (res.ok) {
          setBackendOffline(false);
        }
      } catch (error) {
        setBackendOffline(true);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  const resetSimulation = () => {
    setIsUploaded(false);
    setIsUploading(false);
    setSentimentData([]);
    setMomentumData([]);
    setFeedbackItems([]);
    setInsights(null);
    setTotalSamples(0);
    setStartDate('');
    setEndDate('');
    setUploadError(null);
    toast.info("Simulation Reset", {
      description: "Dashboard returned to initial state.",
      className: "bg-surface-container-highest border-white/10 text-white/60 font-bold uppercase tracking-widest text-[0.65rem]"
    });
  };

  const generateRandomData = (tf: 'D' | 'W' | 'M' = timeframe, start?: string, end?: string) => {
    // Generate random sentiment distribution based on user request
    // Positive: 60–70%, Neutral: 20–30%, Negative: 5–15%
    const pos = Math.floor(Math.random() * 11) + 60; // 60-70%
    const neu = Math.floor(Math.random() * 11) + 20; // 20-30%
    const neg = 100 - pos - neu;

    setSentimentData([
      { name: 'Positive', value: pos, color: '#ffffff' },
      { name: 'Neutral', value: neu, color: '#ffffff66' },
      { name: 'Negative', value: neg, color: '#ffffff1a' },
    ]);

    // Generate random momentum data
    const points = tf === 'D' ? 12 : tf === 'W' ? 7 : 30;
    const newData = Array.from({ length: points }, (_, i) => ({
      name: points === 12 ? (i % 4 === 0 ? `${i + 1} NOV` : '') : `${i + 1}`,
      value: Math.floor(Math.random() * 40) + 30,
      isPeak: Math.random() > 0.8
    }));
    setMomentumData(newData);

    // Mock feedback items
    const mockFeed = [
      { sentiment: 'Positive' as const, time: '2m ago', content: '"The new monolith interface is incredibly fast. The minimalist design helps me focus on data without distraction."' },
      { sentiment: 'Negative' as const, time: '14m ago', content: '"Found the CSV upload a bit restrictive with the 50MB limit. Need support for larger datasets for enterprise analysis."', hasAction: true },
      { sentiment: 'Neutral' as const, time: '1h ago', content: '"Analysis results are consistent with our internal tracking. No major surprises in this week\'s data."' },
      { sentiment: 'Positive' as const, time: '3h ago', content: '"The AI insights are surprisingly accurate. It identified a trend we had missed in our manual reviews."' },
      { sentiment: 'Negative' as const, time: '5h ago', content: '"System latency spikes during peak hours are becoming a concern for our real-time monitoring team."', hasAction: true },
      { sentiment: 'Positive' as const, time: '8h ago', content: '"Excellent customer support. The team was very responsive to our technical queries regarding the API integration."' },
    ];
    setFeedbackItems(mockFeed);

    // AI Insights Simulation
    const dynamicInsights = [
      {
        urgency_score: 8,
        topic: "Performance & Latency",
        summary: `Sentiment improved by +${Math.floor(Math.random() * 10) + 5}% compared to previous period. User engagement is high, but negative feedback spike detected in mid-range data relating to latency.`,
        issues: ["Upload limits restricting enterprise datasets", "Geographic hotspots experiencing latency"],
        auto_reply: "We are actively deploying infrastructure optimizations to address latency in your region."
      },
      {
        urgency_score: 4,
        topic: "Mobile App Stability",
        summary: "Overall stability in sentiment vectors. Core features are performing within expected satisfaction parameters.",
        issues: ["Recurring performance issues in the mobile app module", "Sentiment drift in billing section"],
        auto_reply: "A mobile patch is rolling out this week to address the stability issues."
      }
    ];
    setInsights(dynamicInsights[Math.floor(Math.random() * dynamicInsights.length)]);
    setTotalSamples(Math.floor(Math.random() * 5000) + 1000);
  };

  const processFile = async (file: File) => {
    // Validate file type
    const isCSV = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
    
    if (!isCSV) {
      setUploadError("Invalid file type. Please upload a CSV.");
      toast.error("Invalid File Type", {
        description: "Only CSV files are supported for monolithic analysis.",
        className: "bg-red-500/10 border-red-500/50 text-red-500 font-bold uppercase tracking-widest text-[0.65rem]"
      });
      return;
    }

    setIsUploaded(false);
    setUploadError(null);
    setBackendOffline(false);
    setIsUploading(true);
    setUploadedFile(file);

    try {
      // Step 1: Upload to Pinecone
      setLoadingMessage('Uploading to database...');
      const uploadResult = await uploadFile(file);
      toast.info("Upload Complete", {
        description: uploadResult.message,
        className: "bg-primary/10 border-primary/50 text-primary font-bold uppercase tracking-widest text-[0.65rem]"
      });

      // Step 2: Analyze with Gemini AI
      setLoadingMessage('Analyzing with Gemini AI...');
      const analysisResult = await analyzeFile(file);

      // Extract AI payload
      const structuredData = analysisResult.analysis || analysisResult;

      setInsights({
        urgency_score: structuredData?.urgency_score || 5,
        topic: structuredData?.topic || "General",
        summary: structuredData?.summary || "Analysis complete.",
        issues: structuredData?.issues || [],
        auto_reply: structuredData?.auto_reply || "Thank you for your feedback."
      });

      // Generate chart data (backend doesn't return structured chart data)
      generateRandomData();
      setTotalSamples(analysisResult.rows || 0);

      setIsUploading(false);
      setIsUploaded(true);
      setStartDate('2026-03-01');
      setEndDate('2026-03-24');
      toast.success("Analysis Complete", {
        description: `Analyzed ${analysisResult.rows} rows with Gemini AI.`,
        className: "bg-primary/10 border-primary/50 text-primary font-bold uppercase tracking-widest text-[0.65rem]"
      });
    } catch (err: any) {
      setIsUploading(false);
      if (err instanceof BackendOfflineError) {
        setBackendOffline(true);
        setUploadError('Backend offline');
        toast.error("Backend Not Running", {
          description: "Start with: uvicorn project.main:app --reload",
          duration: 8000,
          className: "bg-red-500/10 border-red-500/50 text-red-500 font-bold uppercase tracking-widest text-[0.65rem]"
        });
      } else {
        setUploadError(err.message || 'Upload failed');
        toast.error("Error", {
          description: err.message || 'An unexpected error occurred.',
          className: "bg-red-500/10 border-red-500/50 text-red-500 font-bold uppercase tracking-widest text-[0.65rem]"
        });
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
      // Reset input value to allow re-selection of the same file if needed
      event.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    if (isUploaded) {
      setIsUploading(true);
      // Simulate re-analysis on date change
      setTimeout(() => {
        generateRandomData(timeframe, start, end);
        setInsights(prev => ({
          ...prev,
          summary: `Analysis for ${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}: Sentiment remains stable with a slight upward trend.`
        }));
        setIsUploading(false);
      }, 800);
    }
  };

  // Stats derived from data or defaults
  const stats = useMemo(() => {
    if (sentimentData.length === 0) return { samples: '0', net: '0', latency: '0ms', anomalies: '0' };
    const pos = sentimentData.find(d => d.name === 'Positive')?.value || 0;
    const neg = sentimentData.find(d => d.name === 'Negative')?.value || 0;
    return {
      samples: totalSamples.toLocaleString(),
      net: `+${(pos - neg).toFixed(1)}`,
      latency: '140ms',
      anomalies: '02'
    };
  }, [sentimentData, totalSamples]);

  return (
    <div className="min-h-screen p-6 space-y-6">
      <Toaster position="bottom-right" theme="dark" />

      {/* Backend Offline Banner */}
      <AnimatePresence>
        {backendOffline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-4"
          >
            <MotionIcon><WifiOff size={20} className="text-red-400" /></MotionIcon>
            <div className="flex-1">
              <p className="text-[0.75rem] uppercase tracking-widest text-red-400 font-black break-words whitespace-normal">Backend Not Running</p>
              <p className="text-[0.65rem] text-red-400/70 mt-1 font-mono break-words whitespace-normal">Start with: uvicorn project.main:app --reload</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBackendOffline(false)}
              className="text-red-400/50 hover:text-red-400 transition-colors"
            >
              <MotionIcon><AlertCircle size={16} /></MotionIcon>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row 1 - Hero + Upload Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-8 space-y-8 flex flex-col justify-center min-h-[300px] w-full overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[0.65rem] uppercase font-bold tracking-[0.2em] text-on-surface-variant/90 break-words whitespace-normal">Intelligence Engine</p>
            {isUploaded && (
              <motion.button 
                whileHover={{ scale: 1.05, color: "#ffffff" }}
                whileTap={{ scale: 0.95 }}
                onClick={resetSimulation}
                className="flex items-center gap-2 text-[0.55rem] uppercase tracking-widest text-primary/60 font-black transition-all"
              >
                <MotionIcon><RefreshCw size={10} /></MotionIcon> Reset Simulation
              </motion.button>
            )}
          </div>
          <div className="space-y-4">
            <h1 className="font-headline text-5xl font-extrabold tracking-tight text-white leading-tight break-words whitespace-normal">Feedback <span className="text-white/40">Analysis</span></h1>
            <p className="text-on-surface-variant/90 text-lg max-w-sm leading-relaxed font-light break-words whitespace-normal">
              Upload raw customer sentiment data to generate architectural insights and trend vectors.
            </p>
          </div>
        </div>

        <div className="glass-panel p-8 min-h-[300px] w-full overflow-hidden">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            className="hidden" 
          />
          <motion.div 
            whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.03)" }}
            whileTap={{ scale: 0.99 }}
            onClick={handleOpenFile}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "group relative h-full flex flex-col items-center justify-center space-y-6 cursor-pointer transition-all duration-500 rounded-2xl border border-white/10",
              uploadError ? "border-red-500/30 hover:border-red-500/50" : ""
            )}
          >
            <div className="flex flex-col items-center pointer-events-none text-center relative z-10 p-6">
              <div className="flex items-center gap-2 mb-4">
                {isUploading ? (
                  <MotionIcon><Loader2 className="text-primary animate-spin" size={40} /></MotionIcon>
                ) : (
                  <motion.div 
                    initial={false}
                    animate={{ scale: isUploading ? 0.8 : 1 }}
                    className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500"
                  >
                    <MotionIcon><Upload className={cn("transition-colors", uploadError ? "text-red-500/50" : "text-white/30 group-hover:text-white")} size={28} /></MotionIcon>
                  </motion.div>
                )}
              </div>
              <p className={cn("uppercase tracking-[0.25em] text-[0.75rem] font-bold break-words whitespace-normal", uploadError ? "text-red-400" : "text-white")}>
                {isUploading ? loadingMessage : uploadError ? uploadError : 'Drop Feedback File'}
              </p>
              <p className="text-[0.6rem] text-white/60 mt-2 uppercase tracking-widest font-medium break-words whitespace-normal">CSV, TXT • MAX 50MB</p>
            </div>
            <div className="flex items-center gap-4 relative z-10 px-6 pb-6">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isUploading}
                className={cn(
                  "px-6 py-2 bg-white/10 border border-white/20 rounded-full text-[0.7rem] uppercase tracking-widest font-bold transition-all duration-300",
                  uploadError ? "bg-red-500 text-white hover:bg-red-600" : "text-white hover:bg-white/20"
                )}
              >
                {isUploading ? 'Processing...' : uploadError ? 'Try Again' : 'Open File'}
              </motion.button>
              <AnimatePresence>
                {isUploaded && !uploadError && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full"
                  >
                    <MotionIcon><CheckCircle size={14} className="text-white" /></MotionIcon>
                    <span className="text-[0.65rem] uppercase tracking-widest text-white/70 font-bold">Upload Complete</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Row 2 - Three columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sentiment Distribution */}
        <div className="glass-panel p-8 flex flex-col justify-between group/card min-h-[400px] w-full overflow-hidden">
          <div>
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-1">
                <h3 className="uppercase tracking-widest text-white text-[0.75rem] font-black group-hover/card:text-primary transition-colors break-words whitespace-normal">Sentiment Distribution</h3>
                <div className="h-0.5 w-6 bg-white/40 group-hover/card:w-12 transition-all duration-500"></div>
              </div>
              <MotionIcon><CheckCircle size={16} className={cn("transition-colors", isUploaded ? "text-white" : "text-white/20")} /></MotionIcon>
            </div>
            {sentimentData && sentimentData.length > 0 ? (
              <SentimentDonut data={sentimentData} isLoading={isUploading} isUploaded={isUploaded} />
            ) : (
              <SentimentDonut isLoading={isUploading} isUploaded={isUploaded} />
            )}
          </div>
          <div className="mt-10 space-y-3">
            {['Positive', 'Neutral', 'Negative'].map((type, idx) => {
              const val = sentimentData.find(d => d.name === type)?.value || 0;
              const dotColor = idx === 0 ? "bg-white" : idx === 1 ? "bg-white/40" : "bg-white/10 border border-white/20";
              return (
                <div 
                  key={type} 
                  className={cn(
                    "w-full flex justify-between items-center text-[0.7rem] uppercase tracking-widest py-1.5 px-3 rounded-full transition-all border border-white/5",
                    idx === 0 ? "bg-green-500/10 text-green-400" : 
                    idx === 1 ? "bg-white/10 text-white/60" : "bg-red-500/10 text-red-400"
                  )}
                >
                  <span className="flex items-center gap-3 break-words whitespace-normal"><span className={cn("w-2 h-2 rounded-full", dotColor)}></span> {type}</span>
                  <span className="font-black">{isUploaded ? `${val}%` : '--'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Feed */}
        <div className="glass-panel p-6 min-h-[400px] w-full overflow-hidden">
          <h3 className="uppercase tracking-widest text-white text-[0.75rem] font-black mb-6 break-words whitespace-normal">Recent Feed</h3>
          <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <FeedbackFeed data={feedbackItems.length > 0 ? feedbackItems : undefined} />
          </div>
        </div>

        {/* Topic Distribution */}
        <div className="glass-panel p-6 min-h-[400px] w-full overflow-hidden">
          <h3 className="uppercase tracking-widest text-white text-[0.75rem] font-black mb-6 break-words whitespace-normal">Topic Distribution</h3>
          <TopicMap isUploaded={isUploaded} isLoading={isUploading} />
        </div>
      </div>

      {/* Row 3 - Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sentiment Momentum */}
        <div className="glass-panel p-8 min-h-[450px] w-full overflow-hidden flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
              <div className="space-y-1">
                <h3 className="uppercase tracking-widest text-white text-[0.75rem] font-black break-words whitespace-normal">Sentiment Momentum</h3>
                <div className="h-0.5 w-6 bg-white/40 transition-all duration-500"></div>
              </div>
              <p className="text-white/60 text-[0.6rem] mt-2 uppercase tracking-[0.2em] font-medium break-words whitespace-normal">30-Day Quantitative Drift</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-white/10 p-1 rounded-xl border border-white/20">
                {(['Bar', 'Line', 'Pie'] as const).map(t => (
                  <button 
                    key={t}
                    onClick={() => setChartType(t)}
                    className={cn(
                      "px-3 py-1 text-[0.6rem] font-black uppercase tracking-widest rounded-lg transition-all",
                      chartType === t ? "bg-white text-black" : "text-white/60 hover:text-white"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {momentumData ? (
              <MomentumBarChart 
                data={momentumData} 
                type={chartType} 
                timeframe={timeframe} 
                isLoading={isUploading} 
                isUploaded={isUploaded}
              />
            ) : null}
          </div>
        </div>

        {/* Trend Vector Analysis */}
        <div className="glass-panel p-8 min-h-[450px] w-full overflow-hidden flex flex-col">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="uppercase tracking-widest text-white text-[0.75rem] font-black break-words whitespace-normal">Trend Vector Analysis</h3>
              <p className="text-white/60 text-[0.6rem] mt-2 uppercase tracking-[0.2em] font-medium break-words whitespace-normal">Predictive Sentiment Projection</p>
            </div>
            <div className="text-[0.6rem] text-white/60 font-mono bg-white/5 px-3 py-1 rounded-full border border-white/20 break-words whitespace-normal">v4.2_PROJECTION</div>
          </div>
          <div className="flex-1 min-h-[250px] flex items-center justify-center border border-white/5 bg-black/40 rounded-xl relative overflow-hidden group/viz">
            <div className="relative z-10 text-center space-y-6 w-full px-6">
              <div className="flex justify-center gap-2 items-end h-32">
                {[40, 45, 42, 50, 55, 60, 58, 65, 70, 75].map((h, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ duration: 1, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                    className="w-full max-w-[12px] bg-white/10 border-t border-white/20 rounded-t-sm"
                  ></motion.div>
                ))}
                <motion.div 
                  initial={{ height: 0 }}
                  whileInView={{ height: "80%" }}
                  transition={{ duration: 1, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  className="w-full max-w-[12px] bg-white animate-pulse"
                ></motion.div>
              </div>
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/60 font-black break-words whitespace-normal">Projected Growth: <span className="text-white">+12.4%</span></p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: 'Confidence', value: '88.2%' },
              { label: 'Volatility', value: 'LOW' },
              { label: 'Anomaly Risk', value: '0.04%', red: true }
            ].map((stat, i) => (
              <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-[0.5rem] uppercase tracking-widest text-white/50 block mb-1 font-bold break-words whitespace-normal">{stat.label}</span>
                <span className={cn("text-xl font-headline font-black break-words whitespace-normal", stat.red ? "text-red-400" : "text-white")}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4 - AI Insights full width */}
      <div className="glass-panel p-8 w-full overflow-hidden min-h-[300px]">
        <h3 className="uppercase tracking-widest text-white text-[0.75rem] font-black mb-8 break-words whitespace-normal">AI Synthetic Insights</h3>
        <AIInsights 
          startDate={startDate} 
          endDate={endDate} 
          isUploaded={isUploaded}
          insights={insights}
          onDateChange={handleDateChange}
        />
      </div>

      {/* Footer Stats Row */}
      <footer className="pt-12 pb-24 grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Samples', value: stats.samples, icon: Database },
          { label: 'Net Sentiment', value: stats.net, icon: TrendingUp, colorClass: parseFloat(stats.net) > 0 ? "text-green-400" : "text-red-400" },
          { label: 'Latency', value: stats.latency, icon: Activity, colorClass: "text-yellow-400" },
          { label: 'Anomalies', value: stats.anomalies, icon: AlertCircle, colorClass: parseInt(stats.anomalies) > 0 ? "text-red-400" : "text-green-400" }
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-6 space-y-4">
            <div className="flex items-center gap-3">
              <stat.icon size={16} className="text-white/40" />
              <span className="text-[0.6rem] text-white/40 uppercase font-black tracking-widest break-words whitespace-normal">{stat.label}</span>
            </div>
            <p className={cn("font-headline text-4xl font-black tracking-tighter break-words whitespace-normal", isUploaded ? (stat.colorClass || "text-white") : "text-white/20")}>
              {isUploaded ? stat.value : '--'}
            </p>
          </div>
        ))}
      </footer>
    </div>
  );
};
