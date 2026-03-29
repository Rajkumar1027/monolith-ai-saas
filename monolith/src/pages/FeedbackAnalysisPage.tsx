import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MotionIcon } from '@/src/components/MotionIcon';
import { Upload, CheckCircle, Loader2, Database, AlertCircle, TrendingUp, Activity, Zap, BarChart3, FileWarning, RefreshCw, WifiOff } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="px-8 max-w-7xl mx-auto py-12 space-y-12 relative overflow-hidden"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-[24px]">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

      {/* Backend Offline Banner */}
      <AnimatePresence>
        {backendOffline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-4"
          >
            <MotionIcon><WifiOff size={20} className="text-red-400" /></MotionIcon>
            <div className="flex-1">
              <p className="text-[0.75rem] uppercase tracking-widest text-red-400 font-black">Backend Not Running</p>
              <p className="text-[0.65rem] text-red-400/70 mt-1 font-mono">Start with: uvicorn project.main:app --reload</p>
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
      
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pt-12"
      >
        <div className="lg:col-span-4 space-y-8">
          <div className="flex items-center justify-between">
            <p className="text-[0.65rem] uppercase font-bold tracking-[0.2em] text-on-surface-variant/90">Intelligence Engine</p>
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
            <h1 className="font-headline text-6xl font-extrabold tracking-tight text-white leading-tight">Feedback <span className="text-white/40">Analysis</span></h1>
            <p className="text-on-surface-variant/90 text-lg max-w-sm leading-relaxed font-light">
              Upload raw customer sentiment data to generate architectural insights and trend vectors.
            </p>
          </div>
        </div>
        <div className="lg:col-span-8">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            className="hidden" 
          />
          <motion.div 
            whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.03)", y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleOpenFile}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "group relative glass-panel h-56 flex flex-col items-center justify-center space-y-6 cursor-pointer overflow-hidden transition-all duration-500",
              uploadError ? "border-red-500/30 hover:border-red-500/50" : ""
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
            <div className="flex flex-col items-center pointer-events-none text-center relative z-10">
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
              <p className={cn("uppercase tracking-[0.25em] text-[0.75rem] font-bold", uploadError ? "text-red-400" : "text-white")}>
                {isUploading ? loadingMessage : uploadError ? uploadError : 'Drop Feedback File'}
              </p>
              <p className="text-[0.6rem] text-white/60 mt-2 uppercase tracking-widest font-medium">CSV, TXT • MAX 50MB</p>
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.95 }}
                disabled={isUploading}
                className={cn(
                  "glass-button-primary min-w-[140px] transition-all duration-300",
                  uploadError ? "bg-red-500 text-white hover:bg-red-600" : ""
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
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8"
      >
        <motion.div 
          whileHover={{ y: -8, scale: 1.01, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="glass-panel p-8 flex flex-col justify-between group/card lg:col-span-4"
        >
          <div>
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-1">
                <h3 className="uppercase tracking-widest text-white text-[0.75rem] font-black group-hover/card:text-primary transition-colors">Sentiment Distribution</h3>
                <div className="h-0.5 w-6 bg-white/40 group-hover/card:w-12 transition-all duration-500"></div>
              </div>
              <MotionIcon><CheckCircle size={16} className={cn("transition-colors", isUploaded ? "text-white" : "text-white/20")} /></MotionIcon>
            </div>
            <SentimentDonut data={sentimentData.length > 0 ? sentimentData : undefined} isLoading={isUploading} isUploaded={isUploaded} />
          </div>
          <div className="mt-10 space-y-3">
            {['Positive', 'Neutral', 'Negative'].map((type, idx) => {
              const val = sentimentData.find(d => d.name === type)?.value || 0;
              const dotColor = idx === 0 ? "bg-white" : idx === 1 ? "bg-white/40" : "bg-white/10 border border-white/20";
              return (
                <motion.div 
                  key={type} 
                  whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.05)" }}
                  className={cn(
                    "w-full flex justify-between items-center text-[0.7rem] uppercase tracking-widest py-1.5 px-3 rounded-full transition-all group/item cursor-default border border-white/5",
                    idx === 0 ? "bg-green-500/10 text-green-400" : 
                    idx === 1 ? "bg-white/10 text-white/60" : "bg-red-500/10 text-red-400"
                  )}
                >
                  <span className="flex items-center gap-3"><span className={cn("w-2 h-2 rounded-full", dotColor)}></span> {type}</span>
                  <span className="font-black group-hover/item:scale-110 transition-transform">{isUploaded ? `${val}%` : '--'}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -8, scale: 1.005, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="md:col-span-12 lg:col-span-8 glass-panel p-8 relative overflow-hidden group/card"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
              <div className="space-y-1">
                <h3 className="uppercase tracking-widest text-white text-[0.75rem] font-black group-hover/card:text-primary transition-colors">Sentiment Momentum</h3>
                <div className="h-0.5 w-6 bg-white/40 group-hover/card:w-12 transition-all duration-500"></div>
              </div>
              <p className="text-white/60 text-[0.6rem] mt-2 uppercase tracking-[0.2em] font-medium">30-Day Quantitative Drift</p>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <span className="text-[0.65rem] uppercase tracking-widest text-white/80 font-bold">Comparison</span>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsComparisonMode(!isComparisonMode)}
                  className={cn(
                    "w-10 h-5 rounded-full border border-white/20 relative transition-all duration-500",
                    isComparisonMode ? "bg-white" : "bg-white/10"
                  )}
                >
                  <motion.div 
                    animate={{ right: isComparisonMode ? 4 : "auto", left: isComparisonMode ? "auto" : 4 }}
                    className={cn(
                      "absolute top-1 w-3 h-3 rounded-full transition-all duration-300",
                      isComparisonMode ? "bg-black" : "bg-white/60"
                    )}
                  ></motion.div>
                </motion.button>
              </div>
              <div className="flex bg-white/10 p-1 rounded-xl border border-white/20 backdrop-blur-md">
                {(['Bar', 'Line', 'Pie'] as const).map(t => (
                  <motion.button 
                    key={t}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setChartType(t)}
                    className={cn(
                      "px-4 py-1.5 text-[0.6rem] font-black uppercase tracking-widest rounded-lg transition-all",
                      chartType === t ? "bg-white text-black shadow-lg" : "text-white/60 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {t}
                  </motion.button>
                ))}
              </div>
              <div className="flex gap-1">
                {(['D', 'W', 'M'] as const).map(tf => (
                  <motion.button 
                    key={tf}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setTimeframe(tf);
                      if (isUploaded) generateRandomData(tf);
                    }}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center uppercase tracking-widest text-[0.65rem] rounded-lg transition-all",
                      timeframe === tf ? "bg-white/20 text-white font-black border border-white/30" : "text-white/50 hover:text-white/80 hover:bg-white/10"
                    )}
                  >
                    {tf}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
          <MomentumBarChart 
            data={momentumData} 
            type={chartType} 
            timeframe={timeframe} 
            isLoading={isUploading} 
            isUploaded={isUploaded}
          />
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10 text-[0.6rem] text-white/50 uppercase tracking-[0.3em] font-bold">
            <span>START</span>
            <span>MID-POINT</span>
            <span>END-CYCLE</span>
          </div>
        </motion.div>
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
      >
        <FeedbackFeed data={feedbackItems.length > 0 ? feedbackItems : undefined} />
        <AIInsights 
          startDate={startDate} 
          endDate={endDate} 
          isUploaded={isUploaded}
          insights={insights}
          onDateChange={handleDateChange}
        />
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        <div className="lg:col-span-1">
          <TopicMap isUploaded={isUploaded} isLoading={isUploading} />
        </div>
        <motion.div 
          whileHover={{ y: -8, scale: 1.005, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="lg:col-span-12 glass-panel p-8 relative overflow-hidden group/card"
        >
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="uppercase tracking-widest text-white text-[0.75rem] font-black group-hover/card:text-primary transition-colors">Trend Vector Analysis</h3>
              <p className="text-white/60 text-[0.6rem] mt-2 uppercase tracking-[0.2em] font-medium">Predictive Sentiment Projection</p>
            </div>
            <div className="text-[0.6rem] text-white/60 font-mono bg-white/5 px-3 py-1 rounded-full border border-white/20">v4.2_PROJECTION</div>
          </div>
          <div className="h-[300px] flex items-center justify-center border border-white/5 bg-black/40 rounded-xl relative overflow-hidden group/viz">
            <div className="absolute inset-0 opacity-5 bg-[linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:20px_20px]"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover/viz:opacity-100 transition-opacity duration-700"></div>
            <div className="relative z-10 text-center space-y-6">
              <div className="flex justify-center gap-2 items-end h-32">
                {[40, 45, 42, 50, 55, 60, 58, 65, 70, 75].map((h, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ duration: 1, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                    className="w-5 bg-white/5 border-t border-white/20 rounded-t-sm transition-all duration-500 group-hover/viz:bg-white/10"
                  ></motion.div>
                ))}
                <motion.div 
                  initial={{ height: 0 }}
                  whileInView={{ height: "80%" }}
                  transition={{ duration: 1, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  className="w-5 bg-white border-t border-white animate-pulse shadow-[0_0_20px_rgba(255,255,255,0.3)] rounded-t-sm"
                ></motion.div>
                <motion.div 
                  initial={{ height: 0 }}
                  whileInView={{ height: "85%" }}
                  transition={{ duration: 1, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className="w-5 bg-white/20 border-t border-white/20 border-dashed rounded-t-sm"
                ></motion.div>
              </div>
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/60 font-black">Projected Growth: <span className="text-white">+12.4%</span></p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-6">
            <motion.div 
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }}
              className="p-5 bg-white/5 border border-white/20 rounded-xl transition-all group/stat-box cursor-default"
            >
              <span className="text-[0.55rem] uppercase tracking-widest text-white/60 block mb-2 font-bold">Confidence</span>
              <span className="text-2xl font-headline font-black text-white group-hover/stat-box:scale-110 transition-transform block">88.2%</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }}
              className="p-5 bg-white/5 border border-white/20 rounded-xl transition-all group/stat-box cursor-default"
            >
              <span className="text-[0.55rem] uppercase tracking-widest text-white/60 block mb-2 font-bold">Volatility</span>
              <span className="text-2xl font-headline font-black text-white group-hover/stat-box:scale-110 transition-transform block">LOW</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }}
              className="p-5 bg-white/5 border border-white/20 rounded-xl transition-all group/stat-box cursor-default"
            >
              <span className="text-[0.55rem] uppercase tracking-widest text-white/60 block mb-2 font-bold">Anomaly Risk</span>
              <span className="text-2xl font-headline font-black text-red-400 group-hover/stat-box:scale-110 transition-transform block">0.04%</span>
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.5 }}
        className="border-t border-white/5 pt-16 pb-32 grid grid-cols-2 md:grid-cols-4 gap-12"
      >
        <motion.div 
          whileHover={{ x: 4 }}
          className="space-y-4 group/stat"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover/stat:bg-white/10 transition-colors">
              <MotionIcon><Database size={16} className="text-white/60 group-hover/stat:text-white transition-colors" /></MotionIcon>
            </div>
            <span className="text-[0.65rem] text-white/60 uppercase font-black tracking-widest">Total Samples</span>
          </div>
          <p className="font-headline text-5xl font-black text-white tracking-tighter transition-all group-hover/stat:translate-x-2">{isUploaded ? stats.samples : '--'}</p>
        </motion.div>
        <motion.div 
          whileHover={{ x: 4 }}
          className="space-y-4 group/stat"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover/stat:bg-white/10 transition-colors">
              <MotionIcon><TrendingUp size={16} className={cn("transition-colors", isUploaded ? (parseFloat(stats.net) > 0 ? "text-green-400" : "text-red-400") : "text-white/60")} /></MotionIcon>
            </div>
            <span className="text-[0.65rem] text-white/60 uppercase font-black tracking-widest">Net Sentiment</span>
          </div>
          <p className={cn(
            "font-headline text-5xl font-black tracking-tighter transition-all group-hover/stat:translate-x-2",
            isUploaded ? (parseFloat(stats.net) > 0 ? "text-green-400" : "text-red-400") : "text-white"
          )}>{isUploaded ? stats.net : '--'}</p>
        </motion.div>
        <motion.div 
          whileHover={{ x: 4 }}
          className="space-y-4 group/stat"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover/stat:bg-white/10 transition-colors">
              <MotionIcon><Activity size={16} className="text-white/60 group-hover/stat:text-yellow-400 transition-colors" /></MotionIcon>
            </div>
            <span className="text-[0.65rem] text-white/60 uppercase font-black tracking-widest">Latency</span>
          </div>
          <p className={cn(
            "font-headline text-5xl font-black tracking-tighter transition-all group-hover/stat:translate-x-2",
            isUploaded ? "text-yellow-400" : "text-white"
          )}>{isUploaded ? stats.latency : '--'}</p>
        </motion.div>
        <motion.div 
          whileHover={{ x: 4 }}
          className="space-y-4 group/stat"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover/stat:bg-white/10 transition-colors">
              <MotionIcon><AlertCircle size={16} className={cn("transition-colors", isUploaded ? (parseInt(stats.anomalies) > 0 ? "text-red-400" : "text-green-400") : "text-white/60")} /></MotionIcon>
            </div>
            <span className="text-[0.65rem] text-white/60 uppercase font-black tracking-widest">Anomalies</span>
          </div>
          <p className={cn(
            "font-headline text-5xl font-black tracking-tighter transition-all group-hover/stat:translate-x-2",
            isUploaded ? (parseInt(stats.anomalies) > 0 ? "text-red-400" : "text-green-400") : "text-white"
          )}>{isUploaded ? stats.anomalies : '--'}</p>
        </motion.div>
      </motion.footer>
      </div>
    </motion.div>
  );
};
