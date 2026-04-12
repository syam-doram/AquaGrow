import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, ChevronLeft, Trash2, CheckCircle2, AlertTriangle, X,
  RefreshCw, Settings, Filter, ArrowRight, Zap, CloudRain,
  Fish, Bug, TrendingUp, Droplets, Clock, ShieldAlert,
  Lightbulb, Cpu, ChevronRight, Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useSmartAlerts } from '../../hooks/useSmartAlerts';
import { cn } from '../../utils/cn';
import { NoPondState } from '../../components/NoPondState';
import type { Translations } from '../../translations';
import {
  AlertCategory, PRIORITY_CONFIG, CATEGORY_CONFIG,
  NotificationPrefs,
} from '../../services/notificationEngine';

// ─── CATEGORY FILTER TABS ─────────────────────────────────────────────────────
const ALL_CATEGORIES: { id: AlertCategory | 'all'; label: string; icon: any }[] = [
  { id: 'all',         label: 'All',      icon: Bell },
  { id: 'pond_danger', label: 'Pond',     icon: ShieldAlert },
  { id: 'feed',        label: 'Feed',     icon: Fish },
  { id: 'weather',     label: 'Weather',  icon: CloudRain },
  { id: 'harvest',     label: 'Harvest',  icon: Zap },
  { id: 'disease',     label: 'Disease',  icon: Bug },
  { id: 'lunar',       label: 'Lunar',    icon: Moon },
  { id: 'market',      label: 'Market',   icon: TrendingUp },
  { id: 'tip',         label: 'Tips',     icon: Lightbulb },
];

// ─── PREF TOGGLES ─────────────────────────────────────────────────────────────
const PREF_ITEMS: { key: keyof NotificationPrefs; label: string; sub: string; icon: any }[] = [
  { key: 'pond_danger', label: 'Pond Danger Alerts',   sub: 'DO, pH, ammonia, mortality spikes',    icon: ShieldAlert },
  { key: 'feed',        label: 'Feed Reminders',       sub: 'FCR warnings, meal slots, over-limit',  icon: Fish },
  { key: 'weather',     label: 'Weather Alerts',       sub: 'Rain, heat, cold-snap, pre-dawn DO',   icon: CloudRain },
  { key: 'harvest',     label: 'Harvest Cautions',     sub: 'DOC windows, over-age, market timing', icon: Zap },
  { key: 'disease',     label: 'Disease Warnings',     sub: 'WSSV/EMS/Vibrio risk windows',         icon: Bug },
  { key: 'lunar',       label: 'Lunar Phase Cautions', sub: 'Molt, feed, harvest timing by moon',   icon: Moon },
  { key: 'market',      label: 'Market Insights',      sub: 'Price spikes and demand signals',      icon: TrendingUp },
  { key: 'tips',        label: 'Daily SOP Tips',       sub: 'Operational guidance throughout day',  icon: Lightbulb },
];

// ─── SINGLE ALERT CARD ────────────────────────────────────────────────────────
const AlertCard = ({
  alert, isDark, onRead, onDismiss, navigate,
}: {
  alert: any; isDark: boolean; key?: React.Key;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
  navigate: (r: string) => void;
}) => {
  const pri = PRIORITY_CONFIG[alert.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.info;
  const cat = CATEGORY_CONFIG[alert.category as AlertCategory] ?? CATEGORY_CONFIG.system;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      onClick={() => { onRead(alert.id); if (alert.actionRoute) navigate(alert.actionRoute); }}
      className={cn(
        'rounded-[2rem] border p-4 cursor-pointer transition-all relative overflow-hidden',
        alert.isRead
          ? isDark ? 'bg-white/2 border-white/5 opacity-60' : 'bg-white/60 border-slate-100 opacity-70'
          : isDark ? `bg-[#0D1520] border-white/8 hover:border-white/15 ${alert.priority === 'critical' ? 'border-red-500/25' : ''}` : 'bg-white border-slate-100 shadow-sm hover:shadow-md',
      )}
    >
      {/* Priority left bar */}
      {!alert.isRead && (
        <div className={cn('absolute left-0 top-4 bottom-4 w-1 rounded-r-full', pri.color)} />
      )}

      <div className="flex items-start gap-3 pl-2">
        {/* Icon */}
        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border text-lg',
          isDark ? `${pri.dark} border-white/5` : `${pri.light}`
        )}>
          {alert.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className={cn('text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded',
                  isDark ? `${pri.dark} border border-white/10` : pri.light.replace('border-', 'border ').split(' ').slice(0,2).join(' '),
                  pri.text
                )}>{pri.label}</span>
                <span className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>{cat.label}</span>
                {alert.pondName && (
                  <span className={cn('text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border',
                    isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  )}>{alert.pondName}</span>
                )}
              </div>
              <h3 className={cn('text-[11px] font-black tracking-tight leading-snug',
                isDark ? 'text-white' : 'text-slate-900',
                alert.isRead && 'opacity-60'
              )}>{alert.title}</h3>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onDismiss(alert.id); }}
              className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                isDark ? 'text-white/15 hover:text-white/40 hover:bg-white/5' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
              )}>
              <X size={12} />
            </button>
          </div>

          <p className={cn('text-[9px] font-medium leading-relaxed mb-2',
            isDark ? 'text-white/40' : 'text-slate-500',
            alert.isRead && 'opacity-60'
          )}>{alert.body}</p>

          <div className="flex items-center justify-between">
            <p className={cn('text-[7px] font-black uppercase tracking-widest',
              isDark ? 'text-white/15' : 'text-slate-400'
            )}>
              {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            {alert.action && (
              <div className={cn('flex items-center gap-1 text-[7px] font-black uppercase tracking-widest',
                isDark ? 'text-[#C78200]/70' : 'text-emerald-700'
              )}>
                {alert.action} <ChevronRight size={10} />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export const Notifications = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const { user, theme, ponds, waterRecords, feedLogs, marketPrices } = useData();
  const navigate = useNavigate();
  const isDark = theme === 'dark' || theme === 'midnight';

  const {
    alerts, prefs, updatePrefs,
    unreadCount, criticalCount,
    markRead, markAllRead, dismissAlert, clearAll, forceRun,
  } = useSmartAlerts({
    ponds: ponds ?? [],
    waterRecords: waterRecords ?? [],
    feedRecords: feedLogs ?? [],
    marketPrices: marketPrices ?? [],
    enabled: true,
  });

  const [activeCategory, setActiveCategory] = useState<AlertCategory | 'all'>('all');
  const [showSettings, setShowSettings]     = useState(false);
  const [isRunning, setIsRunning]           = useState(false);

  const handleRefresh = async () => {
    setIsRunning(true);
    forceRun();
    setTimeout(() => setIsRunning(false), 1500);
  };

  const filtered = activeCategory === 'all'
    ? alerts
    : alerts.filter(a => a.category === activeCategory);

  return (
    <div className={cn('min-h-screen pb-32', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>

      {/* ── HEADER ── */}
      <header className={cn(
        'fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 backdrop-blur-xl px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 border-b',
        isDark ? 'bg-[#070D12]/90 border-white/5' : 'bg-white/90 border-slate-100 shadow-sm'
      )}>
        <div className="flex items-center justify-between">
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/dashboard')}
            className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border',
              isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-white border-slate-200 text-slate-600 shadow-sm'
            )}>
            <ChevronLeft size={18} />
          </motion.button>

          <div className="text-center">
            <h1 className={cn('text-xs font-black uppercase tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              Alerts & Actions
            </h1>
            <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
              Smart Farm Intelligence
            </p>
          </div>

          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleRefresh}
              className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border',
                isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
              )}>
              <RefreshCw size={15} className={cn(isRunning && 'animate-spin')} />
            </motion.button>

            {/* Bell with badge */}
            <div className="relative">
              <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border',
                criticalCount > 0
                  ? 'bg-red-500 border-red-600 text-white'
                  : isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
              )}>
                <Bell size={15} />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="pt-24 px-4 space-y-4">

        {ponds.length === 0 ? (
          /* ── NO POND STATE ── */
          <div className="flex items-center justify-center py-10">
            <NoPondState
              isDark={isDark}
              subtitle="Add a pond to start receiving smart alerts on water quality, feed, disease risks, and harvest timing."
            />
          </div>
        ) : (
          <>
            {/* ── HERO STATS ── */}
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className={cn('rounded-[2.5rem] p-5 relative overflow-hidden',
                criticalCount > 0
                  ? 'bg-gradient-to-br from-red-700 to-red-900 text-white'
                  : 'bg-gradient-to-br from-[#0D523C] to-[#02130F] text-white'
              )}
            >
              <div className="absolute -right-8 -bottom-8 opacity-5">
                <Bell size={120} strokeWidth={0.5} />
              </div>
              <div className="relative z-10">
                {criticalCount > 0 ? (
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20">
                      <AlertTriangle size={22} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white/60 text-[7px] font-black uppercase tracking-widest mb-0.5">Immediate Action Required</p>
                      <h2 className="text-xl font-black tracking-tight">{criticalCount} Critical Alert{criticalCount > 1 ? 's' : ''}</h2>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/15">
                      <Cpu size={22} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white/40 text-[7px] font-black uppercase tracking-widest mb-0.5">Smart Monitoring Active</p>
                      <h2 className="text-lg font-black tracking-tight">
                        {unreadCount > 0 ? `${unreadCount} New Alert${unreadCount > 1 ? 's' : ''}` : 'All Clear'}
                      </h2>
                    </div>
                  </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Critical', value: alerts.filter(a => a.priority === 'critical').length, color: 'text-red-300' },
                    { label: 'High',     value: alerts.filter(a => a.priority === 'high').length,     color: 'text-orange-300' },
                    { label: 'Unread',   value: unreadCount,                                          color: 'text-amber-300' },
                    { label: 'Total',    value: alerts.length,                                        color: 'text-white/60' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/10 rounded-xl p-2 text-center border border-white/10">
                      <p className={cn('text-sm font-black', s.color)}>{s.value}</p>
                      <p className="text-white/40 text-[6px] font-black uppercase tracking-widest">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>


            {/* ── ACTION ROW ── */}
            <div className="flex items-center gap-2">
          <button onClick={markAllRead}
            className={cn('flex-1 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
              isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white/60' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
            )}>
            <CheckCircle2 size={12} /> Mark All Read
          </button>
          <button onClick={() => setShowSettings(s => !s)}
            className={cn('flex-1 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
              showSettings
                ? isDark ? 'bg-[#C78200]/20 border-[#C78200]/30 text-[#C78200]' : 'bg-amber-100 border-amber-300 text-amber-700'
                : isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white/60' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
            )}>
            <Settings size={12} /> Alert Settings
          </button>
          {alerts.length > 0 && (
            <button onClick={clearAll}
              className={cn('w-11 h-11 rounded-2xl border flex items-center justify-center transition-all',
                isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-500 shadow-sm'
              )}>
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* ── SETTINGS PANEL ── */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={cn('rounded-[2rem] border p-4 space-y-1',
                isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm'
              )}>
                <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3',
                  isDark ? 'text-white/25' : 'text-slate-400'
                )}>Choose which alerts you receive</p>

                {PREF_ITEMS.map((item) => (
                  <div key={item.key} className={cn('flex items-center justify-between py-3 border-b last:border-0',
                    isDark ? 'border-white/5' : 'border-slate-100'
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center',
                        isDark ? 'bg-white/5' : 'bg-slate-100'
                      )}>
                        <item.icon size={14} className={isDark ? 'text-white/40' : 'text-slate-500'} />
                      </div>
                      <div>
                        <p className={cn('text-[10px] font-black tracking-tight', isDark ? 'text-white/80' : 'text-slate-800')}>{item.label}</p>
                        <p className={cn('text-[7px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>{item.sub}</p>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => updatePrefs({ [item.key]: !prefs[item.key] })}
                      className={cn('w-11 h-6 rounded-full relative transition-all duration-300',
                        prefs[item.key] ? 'bg-[#C78200]' : isDark ? 'bg-white/10' : 'bg-slate-200'
                      )}>
                      <motion.div animate={{ x: prefs[item.key] ? 20 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </motion.button>
                  </div>
                ))}

                {/* Request browser permission */}
                <button
                  onClick={async () => {
                    if ('Notification' in window) {
                      const perm = await Notification.requestPermission();
                      if (perm === 'granted') forceRun();
                    }
                  }}
                  className={cn('w-full mt-3 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2',
                    isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  )}>
                  <Bell size={12} /> Enable Browser Push Notifications
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CATEGORY TABS ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {ALL_CATEGORIES.map(cat => {
            const catAlerts = cat.id === 'all' ? alerts : alerts.filter(a => a.category === cat.id);
            const unread = catAlerts.filter(a => !a.isRead).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-[8px] font-black uppercase tracking-widest transition-all',
                  activeCategory === cat.id
                    ? isDark ? 'bg-white text-[#0D1520] border-white' : 'bg-slate-900 text-white border-slate-900'
                    : isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
                )}>
                <cat.icon size={11} />
                {cat.label}
                {unread > 0 && (
                  <span className={cn('w-4 h-4 rounded-full text-[7px] flex items-center justify-center font-black border',
                    activeCategory === cat.id
                      ? isDark ? 'bg-red-500 text-white border-red-600' : 'bg-red-500 text-white border-red-600'
                      : isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-100 text-red-600 border-red-200'
                  )}>{unread}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── ALERT LIST ── */}
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={cn('py-20 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center text-center',
                isDark ? 'bg-white/2 border-white/5' : 'bg-white border-slate-200'
              )}
            >
              <CheckCircle2 size={40} className="text-emerald-400 mb-4" />
              <h3 className={cn('font-black text-base tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                {activeCategory === 'all' ? 'All Clear!' : `No ${ALL_CATEGORIES.find(c => c.id === activeCategory)?.label} Alerts`}
              </h3>
              <p className={cn('text-[9px] font-black uppercase tracking-widest mt-2', isDark ? 'text-white/20' : 'text-slate-400')}>
                AI engine monitoring your farm every 15 min
              </p>
              <button onClick={handleRefresh}
                className={cn('mt-6 flex items-center gap-2 px-5 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest',
                  isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-slate-100 border-slate-200 text-slate-500'
                )}>
                <RefreshCw size={12} className={cn(isRunning && 'animate-spin')} /> Check Now
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {filtered.map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    isDark={isDark}
                    onRead={markRead}
                    onDismiss={dismissAlert}
                    navigate={navigate}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </AnimatePresence>

        {/* ── FOOTER NOTE ── */}
        {alerts.length > 0 && (
          <p className={cn('text-center text-[7px] font-bold pb-8', isDark ? 'text-white/10' : 'text-slate-400')}>
            ★ Smart alerts run every 15 min based on your pond data, water quality, DOC, weather, and market data.
          </p>
        )}
          </>
        )}
      </div>
    </div>
  );
};
