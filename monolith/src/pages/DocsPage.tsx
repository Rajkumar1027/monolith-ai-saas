import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  HelpCircle, 
  Upload, 
  BrainCircuit, 
  ChevronRight, 
  FileText, 
  Search,
  Zap,
  ShieldCheck,
  Globe
} from 'lucide-react';

const DocCard = ({ icon: Icon, title, description, color }: { icon: any, title: string, description: string, color: string }) => (
  <div className="glass rounded-3xl p-8 border-white/10 hover:border-white/20 transition-all group cursor-pointer relative overflow-hidden">
    <div className={`absolute top-0 left-0 w-1 h-full ${color} opacity-0 group-hover:opacity-100 transition-opacity`} />
    <div className={`p-3 rounded-xl bg-white/5 w-fit mb-6 ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-bold mb-3 group-hover:text-white transition-colors">{title}</h3>
    <p className="text-sm text-white/40 leading-relaxed mb-6">{description}</p>
    <div className="flex items-center gap-2 text-xs font-mono text-white/20 group-hover:text-white/60 transition-colors">
      READ DOCUMENTATION <ChevronRight className="w-3 h-3" />
    </div>
  </div>
);

export const DocsPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12 pb-24"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-glow mb-2 uppercase">Documentation</h1>
          <p className="text-white/40 font-mono text-sm uppercase tracking-widest">Master the Monolith Intelligence Engine</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input 
            type="text" 
            placeholder="Search documentation..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white/80 focus:outline-none focus:border-neon-cyan/50 transition-all"
          />
        </div>
      </header>

      {/* Quick Start Guides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <DocCard 
          icon={Upload} 
          title="Data Ingestion" 
          description="Learn how to format and upload your CSV data for optimal neural processing and mapping."
          color="text-neon-cyan"
        />
        <DocCard 
          icon={BrainCircuit} 
          title="Neural Mapping" 
          description="Understand the underlying AI architecture and how it identifies intent and sentiment."
          color="text-neon-purple"
        />
        <DocCard 
          icon={ShieldCheck} 
          title="Security & Compliance" 
          description="Deep dive into our enterprise-grade security protocols and data encryption standards."
          color="text-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-12">
          <section className="glass rounded-3xl p-10 border-white/10">
            <div className="flex items-center gap-3 mb-8">
              <Zap className="w-6 h-6 text-neon-cyan" />
              <h2 className="text-2xl font-bold">Getting Started</h2>
            </div>
            <div className="space-y-8 prose prose-invert max-w-none">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white/80">1. Prepare Your Data</h3>
                <p className="text-white/40 leading-relaxed">
                  The Monolith Engine accepts standard CSV files. Ensure your data includes a 'content' column for text analysis. 
                  Optional columns like 'timestamp' and 'userId' can enhance the intelligence output.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white/80">2. Upload to Engine</h3>
                <p className="text-white/40 leading-relaxed">
                  Navigate to the <span className="text-neon-cyan">Engine</span> tab and drag your file into the ingestion zone. 
                  Our system will automatically validate the schema before processing.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white/80">3. Review Insights</h3>
                <p className="text-white/40 leading-relaxed">
                  Once processing is complete, visit the <span className="text-neon-purple">Intelligence</span> dashboard to view 
                  real-time sentiment trends and topic distributions.
                </p>
              </div>
            </div>
          </section>

          <section className="glass rounded-3xl p-10 border-white/10">
            <div className="flex items-center gap-3 mb-8">
              <HelpCircle className="w-6 h-6 text-neon-purple" />
              <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-6">
              {[
                { q: "How accurate is the sentiment detection?", a: "Our neural engine is trained on 14B+ enterprise communication parameters, achieving a verified 99.9% accuracy rate across 42 languages." },
                { q: "What file formats are supported?", a: "Currently, we support .CSV and .JSON formats. Support for .XLSX and direct API streaming is coming in v2.6." },
                { q: "Is my data encrypted?", a: "Yes, all data is encrypted at rest using AES-256 and in transit using TLS 1.3. We never use your data for training public models." },
              ].map((faq, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-default group">
                  <h4 className="text-sm font-bold text-white/80 mb-2 group-hover:text-neon-cyan transition-colors">{faq.q}</h4>
                  <p className="text-xs text-white/40 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="glass rounded-3xl p-8 border-white/10">
            <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest mb-6">Resources</h3>
            <div className="space-y-4">
              {[
                { label: 'API Reference', icon: FileText },
                { label: 'SDK Downloads', icon: Globe },
                { label: 'System Status', icon: Zap },
                { label: 'Community Forum', icon: BookOpen },
              ].map((res, i) => (
                <button key={i} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-3">
                    <res.icon className="w-4 h-4 text-white/40 group-hover:text-neon-cyan transition-colors" />
                    <span className="text-sm text-white/60 group-hover:text-white transition-colors">{res.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-neon-cyan transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-8 border-neon-cyan/20 bg-neon-cyan/5">
            <h3 className="text-sm font-mono text-neon-cyan uppercase tracking-widest mb-4">Need Support?</h3>
            <p className="text-xs text-white/40 leading-relaxed mb-6">
              Our enterprise support team is available 24/7 for neural mapping assistance and infrastructure optimization.
            </p>
            <button className="w-full py-3 bg-neon-cyan text-black font-bold rounded-xl text-xs neon-glow-cyan hover:scale-[1.02] transition-all">
              CONTACT SUPPORT
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
