import React, { useState } from 'react';
import { 
  Settings, Bell, Shield, Key, Globe, Eye, 
  Moon, Sun, Zap, Database, Smartphone, 
  Mail, MessageSquare, AlertTriangle, Trash2
} from 'lucide-react';

import { toast } from 'sonner';
import { MotionIcon } from '../components/MotionIcon';

export const SettingsPage: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    marketing: false,
  });

  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [language, setLanguage] = useState('English (US)');

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Settings Updated", {
        description: "Your notification preferences and account settings have been synchronized.",
        className: "bg-surface-container-highest border-white/10 text-white font-bold uppercase tracking-widest text-[0.65rem]"
      });
    }, 1500);
  };

  const handleReset = () => {
    setNotifications({
      email: true,
      push: false,
      sms: true,
      marketing: false,
    });
    setTheme('dark');
    setLanguage('English (US)');
    toast.info("Defaults Restored", {
      description: "All settings have been reset to system defaults.",
      className: "bg-surface-container-highest border-white/10 text-white/60 font-bold uppercase tracking-widest text-[0.65rem]"
    });
  };

  const sidebarItems = [
    { label: 'General', icon: <MotionIcon><Globe size={14} /></MotionIcon>, active: true },
    { label: 'Notifications', icon: <MotionIcon><Bell size={14} /></MotionIcon> },
    { label: 'Security', icon: <MotionIcon><Shield size={14} /></MotionIcon> },
    { label: 'API Keys', icon: <MotionIcon><Key size={14} /></MotionIcon> },
    { label: 'Appearance', icon: <MotionIcon><Eye size={14} /></MotionIcon> },
    { label: 'Billing', icon: <MotionIcon><Database size={14} /></MotionIcon> },
  ];

  return (
    <div className="max-w-5xl mx-auto px-8 space-y-12 pb-24 animate-in fade-in duration-700">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between border-b border-white/10 pb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <MotionIcon><Settings size={24} className="text-primary" /></MotionIcon>
            <h1 className="text-3xl font-headline font-black tracking-tighter text-white uppercase">Account Settings</h1>
          </div>
          <p className="text-on-surface-variant/90 font-medium">Manage your account preferences, security, and system configuration.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleReset}
            className="px-6 py-3 border border-white/10 hover:border-primary/40 hover:bg-primary/5 text-[10px] uppercase tracking-[0.3em] font-black transition-all"
          >
            Reset Defaults
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-primary text-on-primary text-[10px] uppercase tracking-[0.3em] font-black transition-all hover:bg-neutral-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
          >
            {isSaving ? (
              <>
                <MotionIcon><Zap size={12} className="animate-pulse" /></MotionIcon>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-1 space-y-2">
          {sidebarItems.map((item, i) => (
            <button 
              key={i}
              className={`w-full px-4 py-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-black transition-all rounded-sm border ${
                item.active 
                  ? 'bg-primary/10 border-primary/40 text-primary' 
                  : 'border-transparent text-on-surface-variant/70 hover:bg-white/5 hover:text-on-surface-variant/90'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </aside>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-12">
          {/* General Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-4 bg-primary"></div>
              <h2 className="text-xs uppercase tracking-[0.3em] text-on-surface-variant/90 font-black">General Preferences</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 group hover:border-primary/20 transition-colors">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-on-surface uppercase tracking-widest">Language</p>
                  <p className="text-[10px] text-on-surface-variant/70">Select your preferred interface language.</p>
                </div>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-black border border-white/10 text-xs px-4 py-2 outline-none focus:border-primary/40 transition-all uppercase tracking-widest font-bold"
                >
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Hindi</option>
                  <option>Japanese</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 group hover:border-primary/20 transition-colors">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-on-surface uppercase tracking-widest">Interface Theme</p>
                  <p className="text-[10px] text-on-surface-variant/70">Customize the visual experience.</p>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'dark', icon: <MotionIcon><Moon size={14} /></MotionIcon> },
                    { id: 'light', icon: <MotionIcon><Sun size={14} /></MotionIcon> },
                    { id: 'system', icon: <MotionIcon><Zap size={14} /></MotionIcon> },
                  ].map((t) => (
                    <button 
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={`p-3 border transition-all ${
                        theme === t.id 
                          ? 'bg-primary border-primary text-on-primary' 
                          : 'bg-white/5 border-white/10 text-on-surface-variant/70 hover:border-white/20'
                      }`}
                    >
                      {t.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* API Key Management */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-4 bg-primary"></div>
              <h2 className="text-xs uppercase tracking-[0.3em] text-on-surface-variant/90 font-black">API Key Management</h2>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-on-surface uppercase tracking-widest">Production API Key</p>
                  <p className="text-[10px] text-on-surface-variant/70 font-mono">sk_live_••••••••••••••••••••••••42A1</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-[9px] uppercase tracking-widest text-primary font-bold hover:underline">Reveal</button>
                  <button className="text-[9px] uppercase tracking-widest text-on-surface-variant/70 font-bold hover:text-white transition-colors">Regenerate</button>
                </div>
              </div>
              <div className="h-px bg-white/10"></div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-widest">Development Key</p>
                  <p className="text-[10px] text-on-surface-variant/40 font-mono">sk_test_••••••••••••••••••••••••92B3</p>
                </div>
                <button className="text-[9px] uppercase tracking-widest text-on-surface-variant/70 font-bold hover:text-white transition-colors">Regenerate</button>
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-4 bg-primary"></div>
              <h2 className="text-xs uppercase tracking-[0.3em] text-on-surface-variant/90 font-black">Notification Channels</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'email', label: 'Email Notifications', icon: <MotionIcon><Mail size={16} /></MotionIcon>, desc: 'Weekly reports and critical alerts.' },
                { key: 'push', label: 'Push Notifications', icon: <MotionIcon><Smartphone size={16} /></MotionIcon>, desc: 'Real-time updates in browser.' },
                { key: 'sms', label: 'SMS Alerts', icon: <MotionIcon><MessageSquare size={16} /></MotionIcon>, desc: 'Emergency system status only.' },
                { key: 'marketing', label: 'Marketing Info', icon: <MotionIcon><Zap size={16} /></MotionIcon>, desc: 'New feature announcements.' },
              ].map((item) => (
                <div 
                  key={item.key}
                  onClick={() => toggleNotification(item.key as keyof typeof notifications)}
                  className={`p-6 border transition-all cursor-pointer group flex items-start gap-4 ${
                    notifications[item.key as keyof typeof notifications]
                      ? 'bg-primary/5 border-primary/40'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`p-2 rounded-sm ${
                    notifications[item.key as keyof typeof notifications] ? 'bg-primary text-on-primary' : 'bg-white/5 text-on-surface-variant/70'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="space-y-1">
                    <p className={`text-xs font-bold uppercase tracking-widest ${
                      notifications[item.key as keyof typeof notifications] ? 'text-primary' : 'text-on-surface'
                    }`}>{item.label}</p>
                    <p className="text-[10px] text-on-surface-variant/70 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Security Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-4 bg-primary"></div>
              <h2 className="text-xs uppercase tracking-[0.3em] text-on-surface-variant/90 font-black">Security & Privacy</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <MotionIcon><Database size={18} /></MotionIcon>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-on-surface uppercase tracking-widest">Data Portability</p>
                    <p className="text-[10px] text-on-surface-variant/70">Download a copy of all your analysis data.</p>
                  </div>
                </div>
                <button className="px-4 py-2 border border-primary/20 text-primary text-[9px] uppercase tracking-widest font-black hover:bg-primary hover:text-on-primary transition-all">
                  Export JSON
                </button>
              </div>

              <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <MotionIcon><Trash2 size={18} /></MotionIcon>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Delete Account</p>
                    <p className="text-[10px] text-on-surface-variant/70">Permanently remove all data and access.</p>
                  </div>
                </div>
                <button className="px-4 py-2 border border-red-500/20 text-red-500 text-[9px] uppercase tracking-widest font-black hover:bg-red-500 hover:text-white transition-all">
                  Terminate
                </button>
              </div>

              <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                    <MotionIcon><AlertTriangle size={18} /></MotionIcon>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Session Management</p>
                    <p className="text-[10px] text-on-surface-variant/70">Log out from all other devices.</p>
                  </div>
                </div>
                <button className="px-4 py-2 border border-yellow-500/20 text-yellow-500 text-[9px] uppercase tracking-widest font-black hover:bg-yellow-500 hover:text-black transition-all">
                  Purge Sessions
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
