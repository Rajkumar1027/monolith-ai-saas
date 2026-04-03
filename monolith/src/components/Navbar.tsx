import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

// Nav items map to real dashboard sub-routes (all require auth via ProtectedRoute)
const navItems = [
  { name: 'Engine',       path: '/dashboard' },
  { name: 'Intelligence', path: '/dashboard/email' },
  { name: 'Network',      path: '/dashboard/sentiment' },
  { name: 'Docs',         path: '/dashboard/auto-reply' },
];

export const Navbar: React.FC = () => {
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('monolith_auth') === 'true';

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md border-b border-white/10 bg-black/40 sticky top-0"
    >
      <NavLink to="/" className="flex items-center gap-4 group cursor-pointer">
        <div className="w-12 h-12 flex items-center justify-center border border-neon-cyan/30 bg-neon-cyan/5 group-hover:neon-glow-cyan transition-all">
          <Zap className="w-6 h-6 text-neon-cyan" />
        </div>
        <div className="flex flex-col">
          <motion.span 
            animate={{ 
              opacity: [0.8, 1, 0.8],
              textShadow: [
                "0 0 0px rgba(255,255,255,0)",
                "0 0 10px rgba(255,255,255,0.2)",
                "0 0 0px rgba(255,255,255,0)"
              ]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="text-2xl font-black tracking-tight text-white leading-none"
          >
            MONOLITH
          </motion.span>
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mt-1">
            INTELLIGENCE ENGINE
          </span>
        </div>
      </NavLink>

      <div className="hidden md:flex items-center gap-3 text-[10px] font-mono tracking-widest relative">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onMouseEnter={() => setHoveredPath(item.path)}
              onMouseLeave={() => setHoveredPath(null)}
              className={({ isActive }) => `
                relative px-5 py-2.5 rounded-full nav-liquid-glass transition-all duration-300 flex items-center gap-1 group
                ${isActive ? 'active text-cyan-400' : 'text-white/40 hover:text-white hover:scale-[1.05]'}
              `}
            >
              <span className="relative z-10 uppercase font-bold tracking-[0.1em]">{item.name}</span>
              
              {/* Active Glow Effect */}
              {isActive && (
                <motion.div
                  layoutId="activeGlow"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-cyan-400 blur-[2px]"
                  initial={false}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        {/* Show LOGIN button if not authenticated, or a dashboard shortcut if auth'd */}
        {isAuthenticated ? (
          <button
            onClick={() => navigate('/dashboard')}
            className="hidden lg:block px-4 py-2 rounded-lg border border-neon-cyan/30 text-xs font-mono text-neon-cyan hover:bg-neon-cyan/10 transition-all"
          >
            DASHBOARD
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="hidden lg:block px-4 py-2 rounded-lg border border-white/10 text-xs font-mono text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            LOGIN
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple p-[1px]">
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-bold">
            JD
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
