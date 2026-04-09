import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, Layout, Ruler, Settings, Sparkles, ShieldCheck,
  CheckCircle2, ShieldAlert, Fish, CloudRain, Zap, Bug,
  TrendingUp, Lightbulb, Moon, Smartphone, Cpu, Send,
  RefreshCw, ChevronDown, Sun, Layers, XCircle,
} from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Header } from '../../components/Header';
import type { Translations } from '../../translations';
import { cn } from '../../utils/cn';
import { useData } from '../../context/DataContext';
import { API_BASE_URL } from '../../config';
import { useFirebaseAlerts } from '../../hooks/useFirebaseAlerts';
import { NotificationPrefs, DEFAULT_PREFS } from '../../services/notificationEngine';

// ─── TOGGLE ────────────────────────────────────────────────────────────────────
const Toggle = ({ value, onToggle, isDark }: { value: boolean; onToggle: () => void; isDark: boolean }) => (
  <motion.button
    whileTap={{ scale: 0.88 }}
    onClick={e => { e.stopPropagation(); onToggle(); }}
    className={cn(
      'w-11 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0',
      value ? 'bg-[#C78200]' : isDark ? 'bg-white/10' : 'bg-slate-200',
    )}>
    <motion.div
      animate={{ x: value ? 19 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
    />
  </motion.button>
);

// ─── COLLAPSIBLE SECTION ───────────────────────────────────────────────────────
const Section = ({
  icon: Icon, label, desc, headerGradient, headerText, defaultOpen = false, isDark, children,
}: {
  icon: any; label: string; desc: string;
  headerGradient: string; headerText: string;
  defaultOpen?: boolean; isDark: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn('rounded-[1.8rem] overflow-hidden border',
      isDark ? 'border-white/5' : 'border-slate-100 shadow-sm')}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn('w-full flex items-center justify-between px-4 py-3.5', headerGradient)}>
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center bg-white/15 flex-shrink-0')}>
            <Icon size={15} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-white font-black text-[11px] tracking-tight">{label}</p>
            <p className="text-white/50 text-[7px] font-bold">{desc}</p>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={16} className="text-white/60" />
        </motion.div>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden">
            <div className={cn(isDark ? 'bg-[#0D1520]' : 'bg-white')}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── ROW ───────────────────────────────────────────────────────────────────────
const Row = ({
  icon: Icon, iconBg, label, sub, isDark, last = false, children,
}: {
  icon?: any; iconBg?: string; label: string; sub?: string;
  isDark: boolean; last?: boolean; children?: React.ReactNode; key?: React.Key;
}) => (
  <div className={cn(
    'flex items-center justify-between px-4 py-3',
    !last && (isDark ? 'border-b border-white/5' : 'border-b border-slate-50'),
  )}>
    <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
      {Icon && (
        <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 border', iconBg)}>
          <Icon size={13} />
        </div>
      )}
      <div className="min-w-0">
        <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white/80' : 'text-slate-800')}>{label}</p>
        {sub && <p className={cn('text-[7px] font-bold mt-0.5 truncate', isDark ? 'text-white/20' : 'text-slate-400')}>{sub}</p>}
      </div>
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────────
export const SystemSettings = ({ t }: { t: Translations }) => {
  const { user, setUser, addNotification, theme, setAppTheme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  // Smart alert prefs
  const PREFS_KEY = 'aquagrow_alert_prefs_v1';
  const [smartPrefs, setSmartPrefs] = useState<NotificationPrefs>(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
    } catch { return DEFAULT_PREFS; }
  });
  const updateSmartPref = (key: keyof NotificationPrefs, val: boolean) => {
    const updated = { ...smartPrefs, [key]: val };
    setSmartPrefs(updated);
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(updated)); } catch {}
  };

  const [units, setUnits]           = useState<'Acres' | 'Hectares'>('Acres');
  const [isSyncingPush, setIsSyncingPush] = useState(false);
  const [testSuccess, setTestSuccess]     = useState(false);
  const [isSyncing, setIsSyncing]         = useState(false);

  const { requestNotificationPermission, fcmToken, triggerLocalAlert } = useFirebaseAlerts(user?.language || 'English');

  const handleSyncPush = async () => {
    setIsSyncingPush(true);
    const token = await requestNotificationPermission();
    if (token && (user?.id || (user as any)?._id)) {
      try {
        await fetch(`${API_BASE_URL}/user/${user.id || (user as any)._id}/notifications`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fcmToken: token, notifications: user.notifications || {} }),
        });
        const uInfo = { ...user, fcmToken: token };
        localStorage.setItem('aqua_user', JSON.stringify(uInfo));
      } catch {}
    }
    setIsSyncingPush(false);
  };

  const handleTestAlert = async () => {
    triggerLocalAlert('🌿 AquaGrow System Test', 'Push engine active — your pond alerts will arrive here.');
    addNotification('System Test', 'Push engine active.', 'info');
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.requestPermissions();
        await LocalNotifications.schedule({
          notifications: [{
            title: '🌿 AquaGrow System Test',
            body: 'Push engine verified on your device.',
            id: Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 500) },
            sound: 'default',
          }],
        });
      } catch {}
    } else if ('Notification' in window) {
      new Notification('🌿 AquaGrow System Test', { body: 'Push engine verification successful.', icon: '/logo192.png' });
    }
    setTestSuccess(true);
    setTimeout(() => setTestSuccess(false), 2500);
  };

  const alertCategories: { key: keyof NotificationPrefs; label: string; sub: string; icon: any; color: string }[] = [
    { key: 'pond_danger', label: 'Pond Danger',  sub: 'DO, pH, ammonia, mortality',    icon: ShieldAlert, color: isDark ? 'bg-red-500/10 text-red-400 border-red-500/20'     : 'bg-red-50 text-red-500 border-red-100' },
    { key: 'feed',        label: 'Feed Alerts',   sub: 'FCR warnings, meal slots',      icon: Fish,        color: isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20': 'bg-amber-50 text-amber-500 border-amber-100' },
    { key: 'weather',     label: 'Weather',       sub: 'Rain, heat, pre-dawn DO',       icon: CloudRain,   color: isDark ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'     : 'bg-sky-50 text-sky-500 border-sky-100' },
    { key: 'harvest',     label: 'Harvest',       sub: 'DOC windows, over-age',         icon: Zap,         color: isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': 'bg-emerald-50 text-emerald-500 border-emerald-100' },
    { key: 'disease',     label: 'Disease Risk',  sub: 'WSSV / EMS / Vibrio',          icon: Bug,         color: isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20': 'bg-purple-50 text-purple-500 border-purple-100' },
    { key: 'lunar',       label: 'Lunar Cycles',  sub: 'Molt, feed & harvest timing',  icon: Moon,        color: isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20': 'bg-indigo-50 text-indigo-500 border-indigo-100' },
    { key: 'market',      label: 'Market Prices', sub: 'Price spikes, demand signals', icon: TrendingUp,  color: isDark ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'   : 'bg-teal-50 text-teal-500 border-teal-100' },
    { key: 'tips',        label: 'Daily SOP Tips',sub: 'Operational guidance',         icon: Lightbulb,   color: isDark ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20': 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  ];

  const aboutRows = [
    { label: 'App Version',       value: 'v2.0.0' },
    { label: 'Farm ID',           value: `AQG-${(user as any)?._id?.slice(-6)?.toUpperCase() ?? 'XXXXXX'}` },
    { label: 'Disease Database',  value: '10 Diseases' },
    { label: 'Alert Categories',  value: '8 Types' },
  ];

  return (
    <div className={cn('min-h-screen pb-32', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title={t.systemSettings} showBack />

      {/* Syncing bar */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ opacity: 0 }}
            className="fixed top-[72px] left-0 right-0 h-0.5 bg-gradient-to-r from-[#C78200] to-amber-400 z-50 origin-left" />
        )}
      </AnimatePresence>

      {/* Test toast */}
      <AnimatePresence>
        {testSuccess && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 text-white text-[11px] font-black shadow-xl whitespace-nowrap">
            <CheckCircle2 size={14} /> Test alert sent!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-20 px-4 py-4 space-y-3">

        {/* ── Hero ── */}
        <div className="bg-gradient-to-br from-[#0D1520] to-[#051015] rounded-[2rem] px-5 py-4 border border-white/5 shadow-lg relative overflow-hidden">
          <div className="absolute -right-5 -bottom-5 opacity-5 pointer-events-none">
            <Settings size={100} strokeWidth={0.5} />
          </div>
          <p className="text-white/30 text-[7px] font-black uppercase tracking-widest mb-0.5">AquaGrow Intelligence</p>
          <h2 className="text-white text-lg font-black tracking-tight">System Settings</h2>
          <p className="text-white/25 text-[8px] font-medium mt-0.5">Configure alerts, theme, units & push notifications</p>
          <div className="flex items-center gap-1.5 mt-3">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <p className="text-emerald-400/60 text-[7px] font-black uppercase tracking-widest">Engine Active</p>
          </div>
        </div>

        {/* ── 1. SMART ALERTS — Amber ── */}
        <Section
          icon={Bell}
          label="Smart Push Alerts"
          desc="Tap to configure alert categories"
          headerGradient="bg-gradient-to-r from-[#B87200] to-[#D4A017]"
          headerText="text-white"
          isDark={isDark}
          defaultOpen={false}>
          {alertCategories.map((cat, i) => (
            <Row key={cat.key} icon={cat.icon} iconBg={cat.color}
              label={cat.label} sub={cat.sub} isDark={isDark}
              last={i === alertCategories.length - 1}>
              <Toggle value={smartPrefs[cat.key]} onToggle={() => updateSmartPref(cat.key, !smartPrefs[cat.key])} isDark={isDark} />
            </Row>
          ))}
        </Section>

        {/* ── 2. PUSH ENGINE — Blue ── */}
        <Section
          icon={Smartphone}
          label="Push Notification Engine"
          desc="Device pairing & test alerts"
          headerGradient="bg-gradient-to-r from-[#1A56A0] to-[#2D7DD2]"
          headerText="text-white"
          isDark={isDark}
          defaultOpen={false}>
          <Row icon={Smartphone}
            iconBg={fcmToken ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100') : (isDark ? 'bg-white/5 text-white/30 border-white/10' : 'bg-slate-50 text-slate-400 border-slate-200')}
            label="Mobile Push Engine"
            sub={fcmToken ? 'Device linked — alerts are active' : 'Not linked · Tap to pair'}
            isDark={isDark}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleSyncPush}
              disabled={!!fcmToken || isSyncingPush}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border',
                fcmToken
                  ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-[#2D7DD2] text-white border-transparent shadow-md',
                (!!fcmToken || isSyncingPush) && 'opacity-50 cursor-not-allowed',
              )}>
              {isSyncingPush ? <RefreshCw size={11} className="animate-spin" /> : fcmToken ? '✓ Linked' : 'Pair'}
            </motion.button>
          </Row>
          <Row icon={Send}
            iconBg={isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-500 border-blue-100'}
            label="Test Alert" sub="Send a test push notification" isDark={isDark} last>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleTestAlert}
              className={cn('px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border',
                isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200')}>
              Send Test
            </motion.button>
          </Row>
        </Section>

        {/* ── 3. APPEARANCE — Purple ── */}
        <Section
          icon={Layout}
          label="Appearance"
          desc="Theme & measurement units"
          headerGradient="bg-gradient-to-r from-[#6B21A8] to-[#9333EA]"
          headerText="text-white"
          isDark={isDark}
          defaultOpen={true}>
          {/* Theme */}
          <Row icon={isDark ? Moon : Sun}
            iconBg={isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-amber-50 text-amber-500 border-amber-100'}
            label="App Theme"
            sub={isDark ? 'Currently: Midnight mode' : 'Currently: Daylight mode'}
            isDark={isDark}>
            <div className={cn('flex gap-1 p-1 rounded-xl border',
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200')}>
              {[{ id: 'light', label: '☀️ Day' }, { id: 'dark', label: '🌙 Night' }].map(th => (
                <button key={th.id} onClick={() => setAppTheme(th.id as any)}
                  className={cn('px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest transition-all',
                    (th.id === 'light' && !isDark) || (th.id === 'dark' && isDark)
                      ? isDark ? 'bg-white/10 text-white' : 'bg-white text-slate-800 shadow-sm'
                      : isDark ? 'text-white/25' : 'text-slate-400')}>
                  {th.label}
                </button>
              ))}
            </div>
          </Row>
          {/* Units */}
          <Row icon={Ruler}
            iconBg={isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-100'}
            label="Farm Unit" sub="Area measurement unit" isDark={isDark} last>
            <div className={cn('flex gap-1 p-1 rounded-xl border',
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200')}>
              {['Acres', 'Ha'].map(u => (
                <button key={u} onClick={() => setUnits((u === 'Ha' ? 'Hectares' : 'Acres') as any)}
                  className={cn('px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest transition-all',
                    ((u === 'Acres' && units === 'Acres') || (u === 'Ha' && units === 'Hectares'))
                      ? isDark ? 'bg-[#C78200] text-white' : 'bg-white text-[#C78200] shadow-sm'
                      : isDark ? 'text-white/25' : 'text-slate-400')}>
                  {u}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        {/* ── 4. AI ENGINE — Emerald ── */}
        <Section
          icon={Sparkles}
          label="AI Diagnostics"
          desc="Gemini-powered farm intelligence"
          headerGradient="bg-gradient-to-r from-[#065F46] to-[#059669]"
          headerText="text-white"
          isDark={isDark}
          defaultOpen={false}>
          <Row icon={Cpu}
            iconBg={isDark ? 'bg-[#C78200]/10 text-[#C78200] border-[#C78200]/20' : 'bg-amber-50 text-[#C78200] border-amber-100'}
            label="Gemini AI Engine" sub="Disease detection & diagnostic SOPs" isDark={isDark} last>
            <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border',
              isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200')}>
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest">Active</span>
            </div>
          </Row>
        </Section>

        {/* ── 5. ABOUT — Slate ── */}
        <Section
          icon={Layers}
          label="About AquaGrow"
          desc="App version & farm ID"
          headerGradient={isDark ? 'bg-gradient-to-r from-slate-700 to-slate-600' : 'bg-gradient-to-r from-slate-600 to-slate-500'}
          headerText="text-white"
          isDark={isDark}
          defaultOpen={false}>
          {aboutRows.map((row, i) => (
            <Row key={row.label} label={row.label} isDark={isDark} last={i === aboutRows.length - 1}>
              <span className={cn('text-[10px] font-black', isDark ? 'text-white/25' : 'text-slate-400')}>{row.value}</span>
            </Row>
          ))}
        </Section>

      </div>
    </div>
  );
};
