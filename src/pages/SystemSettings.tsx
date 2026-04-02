import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Globe, Layout, Ruler, ChevronRight, Settings, Sparkles, XCircle } from 'lucide-react';
import { Header } from '../components/Header';
import { Translations } from '../translations';
import { cn } from '../utils/cn';
import { useData } from '../context/DataContext';
import { API_BASE_URL } from '../config';
import { useFirebaseAlerts } from '../hooks/useFirebaseAlerts';

export const SystemSettings = ({ t }: { t: Translations }) => {
  const { user, setUser } = useData();
  const [notifications, setNotifications] = useState({
    water: user?.notifications?.water ?? true,
    feed: user?.notifications?.feed ?? true,
    market: user?.notifications?.market ?? false,
  });

  const [units, setUnits] = useState<'Acres' | 'Hectares'>('Acres');
  const [isSyncing, setIsSyncing] = useState(false);
  const { requestNotificationPermission, fcmToken } = useFirebaseAlerts(user?.language || 'English');
  const [isSyncingPush, setIsSyncingPush] = useState(false);

  const handleSyncPush = async () => {
     setIsSyncingPush(true);
     const token = await requestNotificationPermission();
     if (token && (user?.id || (user as any)?._id)) {
        try {
          await fetch(`${API_BASE_URL}/user/${user.id || (user as any)._id}/notifications`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ 
                fcmToken: token,
                notifications: user.notifications || { water: true, feed: true, market: false }
             })
          });
          const uInfo = { ...user, fcmToken: token };
          localStorage.setItem('aqua_user', JSON.stringify(uInfo));
        } catch (err) {
          console.error('Push Engine Sync failed:', err);
        }
     }
     setIsSyncingPush(false);
  };

  const handleToggle = async (key: keyof typeof notifications) => {
    const newVal = !notifications[key];
    const newPrefs = { ...notifications, [key]: newVal };
    setNotifications(newPrefs);
    
    if (user?.id || (user as any)?._id) {
       const uInfo = { ...user, notifications: newPrefs };
       localStorage.setItem('aqua_user', JSON.stringify(uInfo));
       
       setIsSyncing(true);
       try {
         await fetch(`${API_BASE_URL}/user/${user.id || (user as any)._id}/notifications`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notifications: newPrefs, fcmToken: user.fcmToken })
         });
       } catch (err) {
         console.error('Failed to sync notification preferences:', err);
       } finally {
         setTimeout(() => setIsSyncing(false), 600);
       }
    }
  };

  const settingSections = [
    { 
      id: 'notifications', 
      icon: Bell, 
      label: t.notifications, 
      desc: t.smartFarmAlerts, 
      color: 'text-[#C78200]',
      items: [
        { label: t.waterQualityAlerts, value: notifications.water, onToggle: () => handleToggle('water') },
        { label: t.feedingReminders, value: notifications.feed, onToggle: () => handleToggle('feed') },
        { 
          label: 'Mobile Push Engine', 
          isButton: true, 
          btnLabel: fcmToken ? 'Active & Linked' : (isSyncingPush ? 'Pairing...' : 'Sync Device'),
          btnColor: fcmToken ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-emerald-500 text-white',
          disabled: !!fcmToken || isSyncingPush,
          onClick: handleSyncPush 
        },
        { label: 'Test System Alert', isButton: true, btnLabel: 'Send Test', onClick: () => {
          if (typeof window !== 'undefined' && 'Notification' in window) {
            new Notification("AquaGrow System Test", {
              body: "This is a local verification alert. Your browser is ready to receive Farm Updates!",
              icon: "/logo192.png"
            });
          }
        }},
      ]
    },
    {
      id: 'preferences',
      icon: Ruler,
      label: t.units,
      desc: t.measurementUnit,
      color: 'text-amber-500',
      items: [
        { label: t.measurementUnit, value: units, isSelect: true, options: [t.acres, t.hectares], onSelect: (v: any) => setUnits(v) }
      ]
    },
    {
      id: 'ai_config',
      icon: Sparkles,
      label: t.aiDiagnostics,
      desc: 'Gemini AI Configuration',
      color: 'text-emerald-500',
      items: [
        { 
          label: t.aiServiceStatus, 
          isButton: true,
          btnLabel: t.secureCloudManaged,
          btnColor: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
          disabled: true,
          onClick: () => {}
        }
      ]
    },
    {
      id: 'appearance',
      icon: Layout,
      label: t.appTheme,
      desc: 'Sunrise (Dynamic)',
      color: 'text-purple-500',
      locked: true
    }
  ];

  return (
    <div className="pb-32 bg-[#F8F9FE] min-h-screen">
      <Header title={t.systemSettings} showBack />
      
      <AnimatePresence>
        {isSyncing && (
           <motion.div 
             initial={{ scaleX: 0, opacity: 0 }}
             animate={{ scaleX: 1, opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.5, ease: 'easeOut' }}
             className="fixed top-[72px] left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-[#C78200] to-emerald-500 z-50 origin-left"
             style={{ backgroundSize: '200% 100%', animation: 'shimmer 1s infinite linear' }}
           />
        )}
      </AnimatePresence>
      
      <div className="pt-24 px-5 py-6 space-y-10">
        <div className="bg-[#4A2C2A] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-3xl font-black tracking-tighter mb-3">{t.settings}</h2>
            <p className="text-white/40 text-xs font-semibold leading-relaxed max-w-[180px]">Customize your AquaGrow experience to match your farm operations.</p>
          </div>
          <Settings size={120} strokeWidth={0.5} className="absolute -right-8 -bottom-8 text-[#C78200]/10 rotate-12" />
        </div>

        {settingSections.map((section, idx) => (
          <section key={idx} className="space-y-6">
            <div className="flex items-center gap-4 ml-2">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-paper shadow-sm", section.color)}>
                <section.icon size={20} strokeWidth={1.5} />
              </div>
              <h3 className="text-[#4A2C2A] text-lg font-black tracking-tighter">{section.label}</h3>
            </div>
            
            <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-black/5 divide-y divide-[#4A2C2A]/5 overflow-hidden">
              {section.items ? (
                <div className="divide-y divide-[#4A2C2A]/5">
                  {section.items.map((item, i) => (
                    <div key={i} className="p-6 flex items-center justify-between group transition-all">
                      <span className="font-black text-sm tracking-tight text-[#4A2C2A]">{item.label}</span>
                      {item.isSelect ? (
                        <div className="flex bg-[#4A2C2A]/5 p-1 rounded-xl gap-2 h-10 items-center overflow-x-auto max-w-[200px] scrollbar-hide">
                          {item.options?.map((opt) => (
                            <button 
                              key={opt}
                              onClick={() => item.onSelect(opt)}
                              className={cn(
                                "px-4 h-full rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                (item.value === opt || (item.value === 'English' && opt === t.english) || (item.value === 'Telugu' && opt === t.telugu) || (item.value === 'Bengali' && opt === t.bengali) || (item.value === 'Odia' && opt === t.odia) || (item.value === 'Gujarati' && opt === t.gujarati) || (item.value === 'Tamil' && opt === t.tamil) || (item.value === 'Malayalam' && opt === t.malayalam) || (item.value === 'Acres' && opt === t.acres) || (item.value === 'Hectares' && opt === t.hectares)) ? "bg-white text-[#C78200] shadow-sm" : "text-[#4A2C2A]/40"
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : item.isInput ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            defaultValue={item.value}
                            placeholder="sk-..."
                            className="bg-[#4A2C2A]/5 border border-black/5 rounded-xl px-4 py-2 text-[10px] font-black text-[#4A2C2A] w-32 outline-none focus:border-[#C78200]"
                            onBlur={(e) => item.onSave(e.target.value)}
                          />
                          <button 
                            onClick={() => { localStorage.removeItem('aqua_gemini_key'); window.location.reload(); }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      ) : item.isButton ? (
                        <motion.button 
                          whileTap={!item.disabled ? { scale: 0.95 } : {}}
                          whileHover={!item.disabled ? { scale: 1.02 } : {}}
                          onClick={item.onClick}
                          disabled={item.disabled}
                          className={cn(
                             "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                             item.btnColor || "bg-emerald-500 text-white hover:bg-emerald-600",
                             item.disabled && "opacity-50 grayscale cursor-not-allowed"
                          )}
                        >
                          {item.btnLabel}
                        </motion.button>
                      ) : (
                        <motion.button 
                          whileTap={{ scale: 0.9 }}
                          onClick={item.onToggle}
                          className={cn(
                            "w-12 h-6 rounded-full relative transition-all duration-500",
                            item.value ? "bg-[#C78200]" : "bg-[#4A2C2A]/10"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500",
                            item.value ? "right-1" : "left-1"
                          )} />
                        </motion.button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 flex items-center justify-between group opacity-50 grayscale">
                  <span className="font-black text-sm tracking-tight text-[#4A2C2A]">{section.desc}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#4A2C2A]/40">Locked</span>
                    <ChevronRight size={14} className="text-[#4A2C2A]/20" />
                   </div>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
