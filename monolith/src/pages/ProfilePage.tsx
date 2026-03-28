import React, { useState } from 'react';
import { 
  User, Mail, Shield, Clock, Activity, Edit3, Camera, 
  CheckCircle, Award, Zap, BarChart3, Globe, Lock
} from 'lucide-react';
import { motion } from 'motion/react';
import { MotionIcon } from '../components/MotionIcon';

export const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Raj Kumar',
    email: 'grajkumar2021@gmail.com',
    role: 'Senior System Administrator',
    location: 'Bangalore, India',
    timezone: 'IST (UTC+5:30)',
    bio: 'Specializing in monolithic architecture and high-scale data analysis. Lead developer at Monolith Systems.',
  });

  const stats = [
    { label: 'Analyses Performed', value: '1,284', icon: <MotionIcon><Activity size={14} /></MotionIcon> },
    { label: 'Emails Processed', value: '45.2k', icon: <MotionIcon><Mail size={14} /></MotionIcon> },
    { label: 'Accuracy Rating', value: '99.4%', icon: <MotionIcon><CheckCircle size={14} /></MotionIcon> },
    { label: 'System Uptime', value: '99.99%', icon: <MotionIcon><Zap size={14} /></MotionIcon> },
  ];

  const recentActivity = [
    { action: 'Batch Tagging', target: '45 Emails', time: '2 hours ago', type: 'success' },
    { action: 'Sentiment Analysis', target: 'Feedback Batch #402', time: '5 hours ago', type: 'info' },
    { action: 'Security Audit', target: 'System Core', time: '1 day ago', type: 'warning' },
    { action: 'Profile Update', target: 'Avatar changed', time: '2 days ago', type: 'info' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-8 space-y-12 pb-24 animate-in fade-in duration-700">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between border-b border-white/10 pb-12">
        <div className="flex items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center text-primary font-headline font-black text-4xl shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)] overflow-hidden">
              RJ
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <MotionIcon><Camera size={24} className="text-white" /></MotionIcon>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-surface-container-lowest rounded-full shadow-lg"></div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-headline font-black tracking-tighter text-white uppercase">{profile.name}</h1>
              <span className="px-2 py-0.5 rounded-sm bg-primary/10 border border-primary/20 text-[10px] uppercase tracking-[0.2em] text-primary font-black">Verified Admin</span>
            </div>
            <p className="text-on-surface-variant/80 font-medium flex items-center gap-2">
              <MotionIcon><Shield size={14} className="text-primary/60" /></MotionIcon>
              {profile.role}
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-on-surface-variant/70">
                <MotionIcon><Globe size={12} /></MotionIcon>
                {profile.location}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-on-surface-variant/70">
                <MotionIcon><Clock size={12} /></MotionIcon>
                {profile.timezone}
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="px-6 py-3 border border-white/10 hover:border-primary/40 hover:bg-primary/5 text-[10px] uppercase tracking-[0.3em] font-black transition-all flex items-center gap-3 group"
        >
          <MotionIcon><Edit3 size={14} className="group-hover:text-primary transition-colors" /></MotionIcon>
          {isEditing ? 'Save Profile' : 'Edit Profile'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Stats & Bio */}
        <div className="lg:col-span-2 space-y-12">
          {/* Stats Grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-6 space-y-2 relative overflow-hidden group hover:border-primary/20 transition-colors">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  {stat.icon}
                </div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/70 font-bold">{stat.label}</p>
                <p className="text-2xl font-headline font-black text-white">{stat.value}</p>
              </div>
            ))}
          </section>

          {/* Bio Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-4 bg-primary"></div>
              <h2 className="text-xs uppercase tracking-[0.3em] text-on-surface-variant/70 font-black">Professional Bio</h2>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 relative">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <MotionIcon scale={1.2}><Award size={64} /></MotionIcon>
              </div>
              {isEditing ? (
                <textarea 
                  className="w-full bg-transparent border-none outline-none text-on-surface/80 leading-relaxed resize-none h-32 focus:ring-0"
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                />
              ) : (
                <p className="text-on-surface/80 leading-relaxed italic">"{profile.bio}"</p>
              )}
            </div>
          </section>

          {/* Detailed Info */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/70 font-bold">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-sm">
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/70">Email</span>
                  <span className="text-xs font-mono text-on-surface">{profile.email}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-sm">
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/70">Phone</span>
                  <span className="text-xs font-mono text-on-surface">+91 •••• •• 2021</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/70 font-bold">System Credentials</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-sm">
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/70">Access Level</span>
                  <span className="text-xs font-mono text-primary font-bold">L4 - SUPERUSER</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-sm">
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/70">ID Hash</span>
                  <span className="text-[10px] font-mono text-on-surface-variant/80">0x8F2...92A1</span>
                </div>
              </div>
            </div>
          </section>

          {/* Skills & Expertise */}
          <section className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/70 font-bold">Expertise & Skills</h3>
            <div className="flex flex-wrap gap-2">
              {['Sentiment Analysis', 'Natural Language Processing', 'Data Visualization', 'Monolithic Systems', 'React', 'TypeScript', 'D3.js', 'System Architecture'].map((skill) => (
                <span key={skill} className="px-3 py-1 bg-white/5 border border-white/20 text-[9px] uppercase tracking-widest text-on-surface-variant/80 hover:border-primary/40 hover:text-primary transition-all cursor-default">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Activity & Security */}
        <div className="space-y-12">
          {/* Recent Activity */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-[0.3em] text-on-surface-variant/70 font-black">Recent Activity</h2>
              <MotionIcon><BarChart3 size={14} className="text-on-surface-variant/40" /></MotionIcon>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'warning' ? 'bg-red-500' : 'bg-primary'
                    }`}></div>
                    {i !== recentActivity.length - 1 && <div className="w-px flex-1 bg-white/10 my-1"></div>}
                  </div>
                  <div className="pb-4">
                    <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">{activity.action}</p>
                    <p className="text-[10px] text-on-surface-variant/80 mt-0.5">{activity.target}</p>
                    <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-1 font-bold">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-3 border border-dashed border-white/20 text-[9px] uppercase tracking-[0.3em] text-on-surface-variant/60 hover:text-primary hover:border-primary/40 transition-all">
              View Full Audit Log
            </button>
          </section>

          {/* Security Status */}
          <section className="bg-primary/5 border border-primary/20 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <MotionIcon><Lock size={16} className="text-primary" /></MotionIcon>
              <h2 className="text-xs uppercase tracking-[0.2em] text-primary font-black">Security Status</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/80">Two-Factor Auth</span>
                <span className="text-[10px] font-bold text-green-500 uppercase">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/80">Last Password Change</span>
                <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase">14 Days Ago</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[85%]"></div>
              </div>
              <p className="text-[9px] text-on-surface-variant/60 leading-relaxed italic">
                Your account security score is 85/100. Update your recovery email to reach 100%.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
