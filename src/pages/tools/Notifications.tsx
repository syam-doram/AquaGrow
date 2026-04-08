import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Droplets, 
  Stethoscope, 
  ChevronRight, 
  AlertCircle, 
  Moon, 
  CloudRain,
  CheckCircle2,
  Trash2,
  Bell,
  Navigation,
  Activity,
  ChevronLeft,
  TrendingUp,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import type { Translations } from '../../translations';
import { cn } from '../../utils/cn';
import { Reminder } from '../../types/reminder';

import { useFirebaseAlerts } from '../../hooks/useFirebaseAlerts';

export const Notifications = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const { user, notifications, markNotificationsRead } = useData();
  const navigate = useNavigate();
  const { reminders, toggleReminder } = useData();
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'missed' | 'history'>('today');

  // Mark all as read when history is visited
  useEffect(() => {
     if (activeTab === 'history') {
        markNotificationsRead();
     }
  }, [activeTab]);

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const todayStr = now.toISOString().split('T')[0];
  
  const isMissed = (r: Reminder) => {
    if (r.status === 'completed') return false;
    if (r.date && r.date !== todayStr) return false; // Tomorrow cannot be missed yet
    if (r.time === 'Now') return false;
    const [h, m] = r.time.split(':').map(Number);
    return currentHour > h || (currentHour === h && currentMinute > m + 30);
  };

  const todayReminders = reminders.filter(r => r.date === todayStr && !isMissed(r));
  const missedReminders = reminders.filter(isMissed);
  
  const upcomingReminders = reminders.filter(r => {
    if (r.status === 'completed') return false;
    if (r.date && r.date !== todayStr) return true; // Tomorrow is upcoming
    if (r.time === 'Now') return false;
    const [h, m] = r.time.split(':').map(Number);
    return h > currentHour || (h === currentHour && m > currentMinute);
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'feed': return Clock;
      case 'medicine': return Stethoscope;
      case 'water': return Droplets;
      case 'moon': return Moon;
      case 'weather': return CloudRain;
      default: return AlertCircle;
    }
  };

  const getColor = (type: string, status: string) => {
    if (status === 'completed') return 'emerald';
    switch (type) {
      case 'feed': return 'amber';
      case 'medicine': return 'rose';
      case 'moon': return 'indigo';
      case 'weather': return 'sky';
      default: return 'rose';
    }
  };

  return (
    <div className="pb-40 bg-[#F0F2F5] min-h-screen text-left px-0 font-sans selection:bg-emerald-100 relative overflow-hidden">
      {/* ── Background Accents ── */}
      <div className="fixed top-0 right-0 w-[80%] h-1/2 bg-emerald-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[60%] h-1/2 bg-amber-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* ── Elite Header ── */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-card/80 backdrop-blur-xl px-6 pt-[calc(env(safe-area-inset-top)+0.8rem)] pb-[0.8rem] flex items-center grid grid-cols-3 border-b border-black/[0.03]">
        <div className="flex items-center justify-start">
           <motion.button 
             whileTap={{ scale: 0.9 }}
             onClick={() => navigate(-1)} 
             className="w-10 h-10 -ml-2 flex items-center justify-center text-ink bg-black/[0.03] hover:bg-black/[0.06] rounded-xl transition-all"
           >
              <ChevronLeft size={22} />
           </motion.button>
        </div>
        <div className="flex items-center justify-center">
           <h1 className="text-lg font-black text-ink tracking-tight leading-tight whitespace-nowrap">{t.notifications}</h1>
        </div>
        <div className="flex items-center justify-end gap-2">
           {activeTab === 'history' && notifications.length > 0 && (
             <motion.button 
               whileTap={{ scale: 0.9 }}
               onClick={() => { if(window.confirm('Clear all notification history?')) { localStorage.removeItem('aqua_notifications_v2'); window.location.reload(); } }}
               className="w-9 h-9 flex items-center justify-center text-rose-500 bg-rose-50 rounded-xl transition-all border border-rose-100"
             >
                <Trash2 size={16} />
             </motion.button>
           )}
           <div className="w-10 h-10 -mr-2 bg-gradient-to-br from-[#0D523C] to-[#012B1D] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/10">
              <Bell size={18} />
           </div>
        </div>
      </header>

      {/* ── Precision Tabs ── */}
      <div className="pt-32 px-6">
         <div className="p-1.5 bg-black/[0.03] rounded-[2rem] flex gap-1 border border-card-border">
            {[
              { id: 'today', label: t.today, count: todayReminders.length },
              { id: 'missed', label: t.missedActivities || 'Missed', count: missedReminders.length },
              { id: 'history', label: t.alertHistory || 'Cloud', count: notifications.length }
            ].map((tab: any) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-3.5 rounded-[1.6rem] text-[9.5px] font-black uppercase tracking-widest transition-all relative flex items-center justify-center gap-2",
                  activeTab === tab.id 
                    ? "bg-card text-[#0D523C] shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-card-border" 
                    : "text-ink/40 hover:text-ink/60"
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] font-bold",
                    activeTab === tab.id ? "bg-[#0D523C] text-white" : "bg-black/[0.06] text-ink/40"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
         </div>
      </div>

      {/* ── Content Feed ── */}
      <div className="px-6 py-6 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-4"
          >
            {(activeTab === 'history' ? notifications : (activeTab === 'today' ? todayReminders : activeTab === 'upcoming' ? upcomingReminders : missedReminders)).length === 0 ? (
              <div className="py-24 text-center space-y-5">
                 <div className="w-20 h-20 bg-black/[0.02] rounded-[2.5rem] flex items-center justify-center mx-auto border border-card-border">
                    <Navigation size={32} className="text-ink/10" />
                 </div>
                 <p className="text-ink/30 text-[10px] font-black uppercase tracking-[0.2em]">Zero pending items</p>
              </div>
            ) : activeTab === 'history' ? (
              notifications.map((h, i) => {
                const colors = {
                   'feed': { bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock, border: 'border-amber-100/50' },
                   'water': { bg: 'bg-sky-50', text: 'text-sky-600', icon: Droplets, border: 'border-sky-100/50' },
                   'medicine': { bg: 'bg-rose-50', text: 'text-rose-600', icon: Stethoscope, border: 'border-rose-100/50' },
                   'market': { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: TrendingUp, border: 'border-emerald-100/50' },
                   'expert': { bg: 'bg-purple-50', text: 'text-purple-600', icon: Target, border: 'border-purple-100/50' },
                   'default': { bg: 'bg-gray-50', text: 'text-gray-600', icon: Bell, border: 'border-gray-100/50' }
                };
                const cfg = colors[h.type as keyof typeof colors] || colors.default;
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={`h-${h.id}`} 
                    className="bg-card p-5 rounded-[2.2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-black/[0.03] flex items-start gap-4 relative overflow-hidden group active:scale-[0.98] transition-all"
                  >
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105 border", cfg.bg, cfg.text, cfg.border)}>
                       <cfg.icon size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-1 gap-2">
                          <h3 className="text-ink font-bold text-[15px] tracking-tight leading-tight flex-1 truncate">{h.title}</h3>
                          {!h.isRead && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-lg shrink-0 mt-1" />}
                       </div>
                       <p className="text-[11px] text-ink/50 leading-snug line-clamp-2">{h.body}</p>
                       <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-black/[0.02]">
                          <span className="text-[8.5px] font-bold text-[#C78200] uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-lg whitespace-nowrap">
                            {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={cn("text-[8.5px] font-black uppercase tracking-widest bg-black/[0.02] px-2 py-0.5 rounded-lg text-ink/30")}>
                            {h.type || 'Alert'}
                          </span>
                       </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (activeTab === 'today' ? todayReminders : activeTab === 'upcoming' ? upcomingReminders : missedReminders).map((r: Reminder, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={r.id} 
                onClick={() => toggleReminder(r.id)}
                className={cn(
                  "bg-card p-5 rounded-[2.2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-black/[0.03] flex items-center justify-between group transition-all active:scale-[0.98] relative overflow-hidden",
                  r.status === 'completed' && "opacity-60 grayscale-[0.5]"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all border",
                    r.status === 'completed' 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                      : `bg-${getColor(r.type, r.status)}-50 text-${getColor(r.type, r.status)}-600 border-${getColor(r.type, r.status)}-100`
                  )}>
                    {r.status === 'completed' ? <CheckCircle2 size={24} strokeWidth={2.5} /> : React.createElement(getIcon(r.type), { size: 24, strokeWidth: 2.5 })}
                  </div>
                  <div>
                    <h3 className="text-ink font-bold text-[15px] tracking-tight leading-tight">{r.title}</h3>
                    <div className="flex items-center gap-2.5 mt-1.5 min-w-0">
                       <span className="text-ink/40 text-[9px] font-black uppercase tracking-widest">{r.pondName}</span>
                       <div className="w-1 h-1 bg-black/[0.08] rounded-full" />
                       <span className="text-[9px] font-bold text-[#C78200] uppercase tracking-wider">{r.time}</span>
                    </div>
                  </div>
                </div>
                <div className="w-9 h-9 bg-black/[0.03] rounded-xl flex items-center justify-center group-hover:bg-[#0D523C] group-hover:text-white transition-colors">
                   <ChevronRight size={16} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Elite SOP Engine Card ── */}
      {activeTab === 'today' && (
        <section className="px-6 mt-4">
           <div className="bg-gradient-to-br from-[#0D523C] to-[#012B1D] p-8 rounded-[2.8rem] text-white relative overflow-hidden shadow-2xl shadow-emerald-950/20 group">
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-card/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                       <Activity size={20} className="text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-black tracking-tighter">Smart SOP Engine</h2>
                 </div>
                 <p className="text-white/50 text-[11px] font-medium leading-relaxed mb-8 pr-12">
                   Operations dynamically synchronized with Lunar cycles, DOC progression, and real-time environmental sensors.
                 </p>
                 <div className="flex items-center gap-5">
                    <div className="flex -space-x-3.5">
                       {[1,2,3].map(i => (
                         <div key={i} className="w-11 h-11 bg-card/5 rounded-full border-2 border-[#0D523C] flex items-center justify-center backdrop-blur-md shadow-lg overflow-hidden group-hover:scale-110 transition-transform">
                            <span className="text-[10px] filter drop-shadow-md">💎</span>
                         </div>
                       ))}
                    </div>
                    <div>
                       <span className="block text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400/80">Biological Status</span>
                       <span className="text-[11px] font-bold text-white/80">OPTIMAL PERFORMANCE</span>
                    </div>
                 </div>
              </div>
              <Activity size={240} strokeWidth={0.3} className="absolute -right-16 -bottom-16 text-white/[0.03] group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 blur-[60px] rounded-full" />
           </div>
        </section>
      )}
    </div>
  );
};
