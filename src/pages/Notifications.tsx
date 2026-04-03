import React, { useState } from 'react';
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
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Translations } from '../translations';
import { cn } from '../utils/cn';
import { Reminder } from '../types/reminder';

import { useFirebaseAlerts } from '../hooks/useFirebaseAlerts';

export const Notifications = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const { user } = useData();
  const { alertHistory, clearHistory } = useFirebaseAlerts(user?.language || 'English');
  const navigate = useNavigate();
  const { reminders, toggleReminder } = useData();
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'missed' | 'history'>('today');

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const isMissed = (r: Reminder) => {
    if (r.status === 'completed') return false;
    if (r.time === 'Now') return false;
    const [h, m] = r.time.split(':').map(Number);
    return currentHour > h || (currentHour === h && currentMinute > m + 30); // 30 min grace
  };

  const todayReminders = reminders.filter(r => !isMissed(r));
  const missedReminders = reminders.filter(r => isMissed(r));
  // In a real app, "upcoming" would be for tomorrow+, but here we just show future ones for today
  const upcomingReminders = todayReminders.filter(r => {
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
    <div className="pb-40 bg-[#F8F9FE] min-h-screen text-left">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-white/95 backdrop-blur-md px-4 py-8 flex items-center justify-between border-b border-black/5">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="p-3 text-[#4A2C2A] hover:bg-black/5 rounded-2xl transition-all">
              <ChevronLeft size={24} />
           </button>
           <h1 className="text-xl font-black text-[#4A2C2A] tracking-tighter">{t.notifications}</h1>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={clearHistory} className="p-3 bg-[#F8F9FE] rounded-2xl text-[#4A2C2A]/20 hover:text-red-500 transition-colors">
              <Trash2 size={20} />
           </button>
           <div className="w-10 h-10 bg-[#C78200] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-900/10">
              <Bell size={20} />
           </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="pt-32 px-6 flex gap-2">
         {[
           { id: 'today', label: t.today, count: todayReminders.length },
           { id: 'missed', label: t.missedActivities || 'Missed', count: missedReminders.length },
           { id: 'history', label: t.alertHistory || 'Cloud Alerts', count: alertHistory.length }
         ].map((tab: any) => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={cn(
               "flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all border relative overflow-hidden",
               activeTab === tab.id 
                 ? "bg-[#0D523C] text-white border-[#0D523C] shadow-lg" 
                 : "bg-white text-[#4A2C2A]/40 border-black/5"
             )}
           >
             {tab.label}
             {tab.count > 0 && (
               <span className={cn(
                 "ml-2 px-2 py-0.5 rounded-full text-[8px]",
                 activeTab === tab.id ? "bg-white/20" : "bg-black/5 text-[#4A2C2A]/40"
               )}>
                 {tab.count}
               </span>
             )}
           </button>
         ))}
      </div>

      <div className="px-6 py-8 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {(activeTab === 'today' ? todayReminders : activeTab === 'upcoming' ? upcomingReminders : missedReminders).length === 0 ? (
              <div className="py-20 text-center space-y-4 opacity-30">
                 <Navigation size={48} className="mx-auto" />
                 <p className="text-[#4A2C2A] text-xs font-black uppercase tracking-widest">No activities found</p>
              </div>
            ) : activeTab === 'history' ? (
              alertHistory.map((h, i) => (
                <div key={`h-${i}`} className="bg-white p-6 rounded-[2.2rem] shadow-sm border border-black/5 flex items-start gap-5">
                   <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <Bell size={24} />
                   </div>
                   <div className="flex-1">
                      <h3 className="text-[#4A2C2A] font-black text-base tracking-tight leading-tight">{h.title}</h3>
                      <p className="text-[10px] text-[#4A2C2A]/60 mt-1 leading-tight">{h.body}</p>
                      <p className="text-[8px] font-black text-[#C78200] uppercase tracking-widest mt-2">
                        {new Date(h.timestamp).toLocaleString()}
                      </p>
                   </div>
                </div>
              ))
            ) : (activeTab === 'today' ? todayReminders : activeTab === 'upcoming' ? upcomingReminders : missedReminders).map((r: Reminder) => (
              <div 
                key={r.id} 
                onClick={() => toggleReminder(r.id)}
                className={cn(
                  "bg-white p-6 rounded-[2.2rem] shadow-sm border border-black/5 flex items-center justify-between group transition-all active:scale-[0.98]",
                  r.status === 'completed' && "opacity-40 grayscale"
                )}
              >
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                    r.status === 'completed' ? "bg-emerald-500/10 text-emerald-600" : `bg-${getColor(r.type, r.status)}-500/10 text-${getColor(r.type, r.status)}-600`
                  )}>
                    {r.status === 'completed' ? <CheckCircle2 size={24} /> : React.createElement(getIcon(r.type), { size: 24 })}
                  </div>
                  <div>
                    <h3 className="text-[#4A2C2A] font-black text-base tracking-tight leading-tight">{r.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5 focus:outline-none">
                       <span className="text-[#4A2C2A]/40 text-[9px] font-black uppercase tracking-widest">{r.pondName} • {r.time}</span>
                       <div className="w-1 h-1 bg-black/10 rounded-full" />
                       <span className="text-[9px] font-black text-[#C78200] uppercase tracking-widest">{r.description}</span>
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-[#F8F9FE] rounded-lg">
                   <ChevronRight size={16} className="text-[#4A2C2A]/20" />
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Quick Access SOP Section */}
      {activeTab === 'today' && (
        <section className="px-6 mt-6">
           <div className="bg-[#0D523C] p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                 <h2 className="text-xl font-black tracking-tighter mb-2">Smart SOP Engine</h2>
                 <p className="text-white/40 text-xs font-medium leading-relaxed mb-8 pr-10">
                   Your activities are automatically adjusted based on Amavasya, weather alerts, and individual pond DOC.
                 </p>
                 <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                       {[1,2,3].map(i => (
                         <div key={i} className="w-10 h-10 bg-white/10 rounded-full border-2 border-[#0D523C] flex items-center justify-center backdrop-blur-md">
                            <span className="text-[10px] font-black">★</span>
                         </div>
                       ))}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#C78200]">All Systems Optimal</span>
                 </div>
              </div>
              <Activity size={180} strokeWidth={0.5} className="absolute -right-10 -bottom-10 text-white/5" />
           </div>
        </section>
      )}
    </div>
  );
};
