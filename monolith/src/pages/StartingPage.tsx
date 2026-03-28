import React, { useState, useEffect } from 'react';
import '../landing.css';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { 
  Mail, 
  BrainCircuit, 
  MessageSquareCode, 
  ChevronRight, 
  Zap, 
  ShieldCheck, 
  Globe,
  ArrowRight,
  Cpu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PhysicsBackground } from '../components/PhysicsBackground';
import { InteractiveCard } from '../components/InteractiveCard';
import { Navbar } from '../components/Navbar';

const MagneticButton = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;
    
    x.set(distanceX * 0.35);
    y.set(distanceY * 0.35);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.button>
  );
};

export const StartingPage = () => {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    const handleClick = (e: MouseEvent) => {
      setRipples(prev => [...prev, { x: e.clientX, y: e.clientY, id: Date.now() }]);
      setTimeout(() => {
        setRipples(prev => prev.slice(1));
      }, 1000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-cyber-black text-white">
      {/* Background Elements */}
      <div className="fixed inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="fixed inset-0 noise-overlay pointer-events-none z-50" />
      <PhysicsBackground />
      <div className="scanline" />
      
      {/* Ambient Glows */}
      <div 
        className="fixed pointer-events-none w-[600px] h-[600px] rounded-full bg-neon-cyan/5 blur-[120px] transition-all duration-1000 ease-out"
        style={{ left: mousePos.x - 300, top: mousePos.y - 300 }}
      />

      {/* Click Ripples */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            className="fixed pointer-events-none w-20 h-20 border border-neon-cyan/30 rounded-full z-40"
            style={{ left: ripple.x - 40, top: ripple.y - 40 }}
          />
        ))}
      </AnimatePresence>

      <Navbar />

      <main className="relative z-10 pt-32 px-6 max-w-7xl mx-auto">
        <motion.div
          key="home"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Hero Section */}
          <section className="flex flex-col items-center text-center mb-32">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-neon-cyan/20 text-xs font-mono text-neon-cyan"
            >
              <Zap className="w-3 h-3" />
              <span>ENGINE ONLINE</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center mb-12"
            >
              <div className="w-20 h-20 flex items-center justify-center border-2 border-neon-cyan/30 bg-neon-cyan/5 mb-8 neon-glow-cyan">
                <Zap className="w-10 h-10 text-neon-cyan" />
              </div>
              <motion.h1 
                animate={{ 
                  opacity: [0.9, 1, 0.9],
                  textShadow: [
                    "0 0 0px rgba(255,255,255,0)",
                    "0 0 20px rgba(255,255,255,0.1)",
                    "0 0 0px rgba(255,255,255,0)"
                  ]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="text-7xl md:text-9xl font-black tracking-tight mb-4 text-white"
              >
                MONOLITH
              </motion.h1>
              <p className="text-xs md:text-sm font-mono text-white/40 uppercase tracking-[0.4em]">
                INTELLIGENCE ENGINE
              </p>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="max-w-2xl text-white/50 text-lg mb-12"
            >
              Transform raw feedback into intelligent decisions. The next generation of neural processing for enterprise communication.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex flex-col sm:flex-row gap-6"
            >
              <MagneticButton 
                onClick={() => navigate('/login')}
                className="group relative px-10 py-5 rounded-full liquid-glass transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2 text-white font-bold tracking-[0.15em] text-glow">
                  GET STARTED <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="liquid-glass-streak" />
              </MagneticButton>
            </motion.div>
          </section>

          {/* Features Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
            <InteractiveCard>
              <div className="p-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 w-fit mb-6">
                <Mail className="w-8 h-8 text-neon-cyan" />
              </div>
              <h3 className="text-2xl font-bold mb-3">AI Email Analysis</h3>
              <p className="text-white/40 leading-relaxed">
                Deconstruct complex communication threads with neural intent detection and priority mapping.
              </p>
              <div 
                onClick={() => navigate('/dashboard')}
                className="mt-8 flex items-center gap-2 text-neon-cyan text-sm font-bold cursor-pointer group"
              >
                EXPLORE <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </InteractiveCard>

            <InteractiveCard>
              <div className="p-3 rounded-xl bg-neon-purple/10 border border-neon-purple/20 w-fit mb-6">
                <BrainCircuit className="w-8 h-8 text-neon-purple" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Sentiment Intelligence</h3>
              <p className="text-white/40 leading-relaxed">
                Real-time emotional resonance tracking across all customer touchpoints with 99.9% accuracy.
              </p>
              <div 
                onClick={() => navigate('/dashboard')}
                className="mt-8 flex items-center gap-2 text-neon-purple text-sm font-bold cursor-pointer group"
              >
                EXPLORE <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </InteractiveCard>

            <InteractiveCard>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 w-fit mb-6">
                <MessageSquareCode className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Auto Reply Generator</h3>
              <p className="text-white/40 leading-relaxed">
                Context-aware response synthesis that maintains your brand voice while automating routine tasks.
              </p>
              <div 
                onClick={() => navigate('/dashboard')}
                className="mt-8 flex items-center gap-2 text-white text-sm font-bold cursor-pointer group"
              >
                EXPLORE <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </InteractiveCard>
          </section>

          {/* Stats Section */}
          <section className="glass rounded-3xl p-12 mb-32 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-transparent via-neon-cyan to-transparent" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 relative z-10">
              {[
                { label: 'Neural Nodes', value: '4.2k', icon: Cpu },
                { label: 'Uptime', value: '99.99%', icon: ShieldCheck },
                { label: 'Global Reach', value: '142', icon: Globe },
                { label: 'Latency', value: '<12ms', icon: Zap },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <stat.icon className="w-6 h-6 text-white/20 mb-4" />
                  <span className="text-4xl font-black mb-1 text-glow">{stat.value}</span>
                  <span className="text-xs font-mono text-white/40 uppercase tracking-widest">{stat.label}</span>
                </div>
              ))}
            </div>
          </section>
        </motion.div>

        {/* Footer */}
        <footer className="py-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 text-white/30 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
            <span>ALL SYSTEMS OPERATIONAL</span>
          </div>
          
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">PRIVACY</a>
            <a href="#" className="hover:text-white transition-colors">TERMS</a>
            <a href="#" className="hover:text-white transition-colors">SECURITY</a>
          </div>

          <div className="font-mono">
            © 2026 MONOLITH_INTEL_CORP
          </div>
        </footer>
      </main>
    </div>
  );
};
