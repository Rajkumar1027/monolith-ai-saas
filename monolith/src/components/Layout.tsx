import React, { useState, useRef, useEffect } from 'react';
import { safeFetch } from '../lib/api';
import { 
  User, Menu, Bell, Info, CheckCircle, AlertCircle, X, Settings, LogOut, 
  ChevronRight, CreditCard, Activity, Shield, ExternalLink, Clock, UserCircle 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { MotionIcon } from './MotionIcon';

interface Notification {
  id: string;
  title: string;
  type: 'success' | 'error' | 'info';
  timestamp: string;
  read: boolean;
  targetTab: string;
}

const initialNotifications: Notification[] = [
  { id: '1', title: 'New feedback received', type: 'success', timestamp: '2 min ago', read: false, targetTab: 'Feedback Analysis' },
  { id: '2', title: 'Analysis completed', type: 'info', timestamp: '15 min ago', read: false, targetTab: 'Feedback Analysis' },
  { id: '3', title: 'System alert: Latency detected', type: 'error', timestamp: '1 hour ago', read: true, targetTab: 'History' },
];

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutConfirming, setIsLogoutConfirming] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [badgeCount, setBadgeCount] = useState(initialNotifications.filter(n => !n.read).length);
  const [status, setStatus] = useState<'online' | 'away' | 'offline'>('online');
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
        setIsLogoutConfirming(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
        setIsLogoutConfirming(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const toggleNotifications = () => {
    if (!isNotificationsOpen) {
      setIsProfileOpen(false);
    }
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const toggleProfile = () => {
    if (!isProfileOpen) {
      setIsNotificationsOpen(false);
      setIsLogoutConfirming(false);
    }
    setIsProfileOpen(!isProfileOpen);
  };

  // Simulate a new notification arriving
  useEffect(() => {
    const timer = setTimeout(() => {
      const newNotif: Notification = {
        id: Date.now().toString(),
        title: 'Security scan completed',
        type: 'success',
        timestamp: 'Just now',
        read: false,
        targetTab: 'History'
      };
      setNotifications(prev => [newNotif, ...prev]);
      setBadgeCount(prev => prev + 1);
      console.log('🔔 [UI Simulation] Notification sound played');
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
      setBadgeCount(prev => Math.max(0, prev - 1));
    }
    setActiveTab(notification.targetTab);
    setIsNotificationsOpen(false);
    
    // Simulate scroll to content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <MotionIcon><CheckCircle size={14} className="text-green-500" /></MotionIcon>;
      case 'error': return <MotionIcon><AlertCircle size={14} className="text-red-500" /></MotionIcon>;
      case 'info': return <MotionIcon><Info size={14} className="text-blue-500" /></MotionIcon>;
      default: return <MotionIcon><Info size={14} className="text-blue-500" /></MotionIcon>;
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col relative"
      style={{ background: '#000000', minHeight: '100vh', width: '100vw' }}
    >
      {/* iOS 26 Liquid Glass Background Layer */}
      <div className="liquid-glass-background">
        <div className="liquid-glass-pulse liquid-glass-pulse-blue" />
        <div className="liquid-glass-pulse liquid-glass-pulse-purple" />
      </div>

      <nav className="glass-nav fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10 sticky">
        <div className="flex justify-between items-center w-full px-8 h-18 max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="text-xl font-bold tracking-tighter text-primary font-headline cursor-pointer" onClick={() => setActiveTab('Feedback Analysis')}>MONOLITH</div>
            {['Profile', 'Settings'].includes(activeTab) && (
              <div className="flex items-center gap-2">
                <MotionIcon><ChevronRight size={14} className="text-on-surface-variant/20" /></MotionIcon>
                <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">{activeTab}</span>
              </div>
            )}
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[
              { name: 'Feedback Analysis', id: 'Feedback Analysis' },
              { name: 'Email Analysis', id: 'Email Analysis' },
              { name: 'History', id: 'History' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative font-headline uppercase tracking-[0.1em] text-[0.6875rem] transition-colors duration-200 py-2 group",
                  activeTab === tab.id ? "text-primary" : "text-on-surface-variant hover:text-primary"
                )}
              >
                {tab.name}
                {activeTab === tab.id ? (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                ) : (
                  <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-primary/40 transition-all duration-300 group-hover:w-full group-hover:left-0" />
                )}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-sm group focus-within:border-primary/40 transition-all">
            <MotionIcon><Activity size={12} className="text-on-surface-variant/20 group-focus-within:text-primary transition-colors" /></MotionIcon>
            <input 
              type="text" 
              placeholder="GLOBAL SEARCH..." 
              className="bg-transparent border-none outline-none text-[9px] uppercase tracking-widest font-bold placeholder:text-on-surface-variant/20 w-32 focus:w-48 transition-all"
            />
          </div>

          <div className="flex items-center gap-4">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="hidden xl:flex items-center gap-2 px-3 py-1 bg-green-500/5 border border-green-500/10 rounded-full"
            >
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[8px] uppercase tracking-widest text-green-500 font-black">System Nominal</span>
            </motion.div>
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleNotifications}
                className="p-2 hover:bg-surface-container-highest/60 rounded transition-all duration-150 text-primary relative group backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 duration-200"
              >
                <motion.div
                  animate={badgeCount > 0 ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                >
                  <MotionIcon><Bell size={20} /></MotionIcon>
                </motion.div>
                {badgeCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-surface-container-lowest"
                  >
                    {badgeCount}
                  </motion.span>
                )}
              </motion.button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-surface-container-low border border-outline-variant/20 shadow-[0_10px_40px_rgba(0,0,0,0.4)] rounded-lg overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
                      <h3 className="text-xs font-headline uppercase tracking-widest text-on-surface-variant font-bold">Notifications</h3>
                      <button 
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                          setBadgeCount(0);
                        }}
                        className="text-[10px] uppercase tracking-widest text-primary hover:underline"
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={cn(
                              "w-full p-4 flex gap-3 text-left hover:bg-surface-container-highest/40 transition-colors border-b border-outline-variant/5 last:border-0 relative",
                              !notification.read && "bg-primary/5"
                            )}
                          >
                            <div className={cn(
                              "absolute left-0 top-0 bottom-0 w-1",
                              notification.type === 'success' ? "bg-green-500" : 
                              notification.type === 'error' ? "bg-red-500" : "bg-blue-500"
                            )} />
                            <div className="mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <p className={cn(
                                "text-xs font-medium mb-1",
                                notification.read ? "text-on-surface-variant" : "text-on-surface"
                              )}>
                                {notification.title}
                              </p>
                              <p className="text-[10px] text-on-surface-variant/70 uppercase tracking-wider">
                                {notification.timestamp}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full self-center" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-xs text-on-surface-variant/40 italic">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={toggleProfile}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-headline font-bold text-sm hover:scale-105 hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] transition-all duration-300 relative group backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 duration-200"
              >
                <span className="group-hover:text-white transition-colors">RJ</span>
                <span className={cn(
                  "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-container-lowest transition-transform group-hover:scale-110",
                  getStatusColor()
                )} />
              </button>
              
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-72 bg-surface-container-low border border-outline-variant/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden z-50"
                  >
                    {/* Header Section */}
                    <div className="p-5 border-b border-outline-variant/10 bg-surface-container-lowest relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-5">
                        <MotionIcon scale={1.2}><Shield size={48} /></MotionIcon>
                      </div>
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center text-primary font-headline font-black text-xl shadow-inner">
                          RJ
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-on-surface">Raj Kumar</p>
                            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[8px] uppercase tracking-widest text-primary font-black">Admin</span>
                          </div>
                          <p className="text-[10px] text-on-surface-variant/90 font-medium">grajkumar2021@gmail.com</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Info Panel */}
                    <div className="px-5 py-2 bg-primary/5 flex items-center justify-between border-b border-outline-variant/5">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full", getStatusColor())} />
                        <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/90 font-bold">Online</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MotionIcon><Clock size={10} className="text-on-surface-variant/70" /></MotionIcon>
                        <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/70">Last login: 2h ago</span>
                      </div>
                    </div>

                    <div className="p-2 space-y-1">
                      {/* Account Section */}
                      <div className="px-3 py-1.5">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant/70 font-black">Account</span>
                      </div>
                      <button 
                        onClick={() => {
                          setActiveTab('Profile'); // Simulated tab
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-3 py-2.5 flex items-center justify-between text-xs text-on-surface-variant hover:bg-surface-container-highest/60 hover:text-primary rounded-lg transition-all duration-200 group/item border border-transparent hover:border-primary/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                            <MotionIcon><UserCircle size={16} className="group-hover/item:text-primary transition-colors" /></MotionIcon>
                          </div>
                          <span className="font-medium">Profile Details</span>
                        </div>
                        <MotionIcon><ChevronRight size={14} className="opacity-20 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" /></MotionIcon>
                      </button>
                      <button 
                        onClick={() => {
                          setActiveTab('Settings'); // Simulated tab
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-3 py-2.5 flex items-center justify-between text-xs text-on-surface-variant hover:bg-surface-container-highest/60 hover:text-primary rounded-lg transition-all duration-200 group/item border border-transparent hover:border-primary/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                            <MotionIcon><Settings size={16} className="group-hover/item:text-primary transition-colors" /></MotionIcon>
                          </div>
                          <span className="font-medium">Account Settings</span>
                        </div>
                        <MotionIcon><ChevronRight size={14} className="opacity-20 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" /></MotionIcon>
                      </button>

                      <div className="h-px bg-outline-variant/10 mx-3 my-2" />

                      {/* Workspace Section */}
                      <div className="px-3 py-1.5">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant/70 font-black">Workspace</span>
                      </div>
                      <button className="w-full px-3 py-2.5 flex items-center justify-between text-xs text-on-surface-variant hover:bg-surface-container-highest/60 hover:text-primary rounded-lg transition-all duration-200 group/item border border-transparent hover:border-primary/10 backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                            <MotionIcon><CreditCard size={16} className="group-hover/item:text-primary transition-colors" /></MotionIcon>
                          </div>
                          <span className="font-medium">Billing & Subscription</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-[8px] text-green-500 font-bold">PRO</span>
                          <MotionIcon><ChevronRight size={14} className="opacity-20 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" /></MotionIcon>
                        </div>
                      </button>
                      <button className="w-full px-3 py-2.5 flex items-center justify-between text-xs text-on-surface-variant hover:bg-surface-container-highest/60 hover:text-primary rounded-lg transition-all duration-200 group/item border border-transparent hover:border-primary/10 backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                            <MotionIcon><Activity size={16} className="group-hover/item:text-primary transition-colors" /></MotionIcon>
                          </div>
                          <span className="font-medium">Activity Logs</span>
                        </div>
                        <MotionIcon><ChevronRight size={14} className="opacity-20 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" /></MotionIcon>
                      </button>

                      <div className="h-px bg-outline-variant/10 mx-3 my-2" />

                      {/* Danger Zone */}
                      <div className="px-3 py-1.5">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-red-500/30 font-black">Danger Zone</span>
                      </div>
                      
                      {!isLogoutConfirming ? (
                        <button 
                          onClick={() => setIsLogoutConfirming(true)}
                          className="w-full px-3 py-2.5 flex items-center gap-3 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200 group/logout border border-transparent hover:border-red-500/20"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-500/5 flex items-center justify-center group-hover/logout:bg-red-500/10 transition-colors">
                            <MotionIcon><LogOut size={16} className="group-hover/logout:animate-pulse" /></MotionIcon>
                          </div>
                          <span className="font-bold">Sign Out</span>
                        </button>
                      ) : (
                        <div className="px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider text-center">Are you sure?</p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setIsLogoutConfirming(false)}
                              className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest rounded transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => {
                                localStorage.removeItem('access_token');
                                try {
                                  safeFetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/logout`, { method: 'POST' });
                                } catch (e) {
                                  console.error('Logout failed', e);
                                }
                                window.location.href = '/login';
                              }}
                              className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded transition-all active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                            >
                              Logout
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/10 flex items-center justify-center gap-2">
                      <MotionIcon><ExternalLink size={10} className="text-on-surface-variant/40" /></MotionIcon>
                      <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 font-medium hover:text-primary cursor-pointer transition-colors">Documentation & Support</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="md:hidden relative" ref={mobileMenuRef}>
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-primary hover:bg-surface-container-highest/60 rounded transition-all"
              >
                {isMobileMenuOpen ? <MotionIcon><X size={20} /></MotionIcon> : <MotionIcon><Menu size={20} /></MotionIcon>}
              </button>

              <AnimatePresence>
                {isMobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-surface-container-low border border-outline-variant/20 shadow-2xl rounded-lg overflow-hidden z-50 p-2 space-y-1"
                  >
                    {[
                      { name: 'Feedback Analysis', id: 'Feedback Analysis' },
                      { name: 'Email Analysis', id: 'Email Analysis' },
                      { name: 'History', id: 'History' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-3 text-left text-[0.65rem] uppercase tracking-widest font-bold rounded-md transition-all",
                          activeTab === item.id ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-highest/60 hover:text-primary"
                        )}
                      >
                        {item.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-24">
        {children}
      </main>

      <footer className="mt-24 py-12 border-t border-outline-variant/10 text-center">
        <p className="font-headline text-[0.625rem] uppercase tracking-[0.2em] text-on-surface-variant/70">
          Monolith Architecture © 2024
        </p>
      </footer>
    </div>
  );
};
