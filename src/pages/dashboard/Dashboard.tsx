import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers as LayersIcon,
  Calculator,
  Zap,
  Utensils,
  AlertTriangle,
  Box,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  Activity,
  X,
  Plus,
  Moon,
  BarChart2,
  ArrowRight,
  ArrowUpRight,
  Fish,
  Thermometer,
  Wind,
  RefreshCw,
  CheckCircle2,
  Clock,
  ChevronRight,
  Waves,
  FlaskConical,
  HeartPulse,
  Target,
  DollarSign,
  Pill,
  Eye,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { calculateDOC, getGrowthPercentage } from '../../utils/pondUtils';
import { runScheduleEngine } from '../../utils/scheduleEngine';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import { getLunarStatus } from '../../utils/lunarUtils';
import { useFirebaseAlerts } from '../../hooks/useFirebaseAlerts';
import { API_BASE_URL } from '../../config';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import type { Translations } from '../../translations';
import { User, WaterQualityRecord } from '../../types';
// import { useFirebaseAlerts } from '../../hooks/useFirebaseAlerts';


// ─── HELPERS ─────────────────────────────────────────────────────────────────
const safeNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};

/** Return color based on pH value */
const phColor = (ph: number) => {
  if (ph < 7.0 || ph > 8.5) return '#ef4444';
  if (ph < 7.5 || ph > 8.2) return '#f59e0b';
  return '#34d399';
};
/** Return color based on DO (mg/L) */
const doColor = (doVal: number) => {
  if (doVal < 4.0) return '#ef4444';
  if (doVal < 5.0) return '#f59e0b';
  return '#34d399';
};
/** Return color based on ammonia */
const ammoniaColor = (v: number) => {
  if (v > 0.5) return '#ef4444';
  if (v > 0.25) return '#f59e0b';
  return '#34d399';
};

const formatLakh = (v: number) => {
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(1)}Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${v}`;
};

// ─── SPARKLINE ───────────────────────────────────────────────────────────────
const SparkLine = ({ data, color = '#34d399', filled = false }: { data: number[]; color?: string; filled?: boolean }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 100; const H = 36;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const yValue = (v - min) / range;
    const y = H - (isNaN(yValue) ? 0 : yValue) * H * 0.85 - 2;
    return `${x},${y}`;
  });
  if (pts.some(p => p.includes('NaN') || p.includes('undefined'))) return null;
  const ptsStr = pts.join(' ');
  const fillPath = `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(' ')} L${W},${H} L0,${H} Z`;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {filled && fillPath && !fillPath.includes('undefined') && <path d={fillPath} fill={`${color}22`} />}
      <polyline points={ptsStr} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="3" fill={color} />
    </svg>
  );
};

// ─── MINI BAR CHART ───────────────────────────────────────────────────────────
const MiniBar = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data) || 1;
  return (
    <div className="flex items-end gap-0.5 h-10">
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all duration-700"
          style={{ height: `${(v / max) * 100}%`, background: i === data.length - 1 ? color : `${color}55` }} />
      ))}
    </div>
  );
};


// ─── WATER QUALITY GAUGE CARD ─────────────────────────────────────────────────
const WaterGauge = ({ label, value, unit, color, min, max, icon: Icon }:
  { label: string; value: number | null; unit: string; color: string; min: number; max: number; icon: React.ElementType }) => {
  const pct = value != null ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative" style={{ background: `${color}15` }}>
        <Icon size={20} style={{ color }} />
        {value == null && <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center">
          <p className="text-[7px] text-white/30 font-black">N/A</p>
        </div>}
      </div>
      <div className="w-full bg-white/5 rounded-full overflow-hidden" style={{ height: 3 }}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="font-black text-sm tracking-tighter" style={{ color: value != null ? color : '#ffffff33' }}>
        {value != null ? `${value}` : '--'}
        <span className="text-[8px] text-white/30 ml-0.5">{unit}</span>
      </p>
      <p className="text-[7px] font-black text-white/25 uppercase tracking-widest text-center leading-tight">{label}</p>
    </div>
  );
};

// ─── POND HEALTH SCORE ────────────────────────────────────────────────────────
function calcPondHealthScore(water: WaterQualityRecord | undefined): number {
  if (!water) return 0;
  let score = 100;
  const ph = safeNum(water.ph, 7.8);
  const doVal = safeNum(water.do, 5.5);
  const ammonia = safeNum(water.ammonia, 0.1);
  const temp = safeNum(water.temperature, 28);
  if (ph < 7.0 || ph > 8.8) score -= 30; else if (ph < 7.5 || ph > 8.3) score -= 15;
  if (doVal < 4.0) score -= 40; else if (doVal < 5.0) score -= 20;
  if (ammonia > 0.5) score -= 25; else if (ammonia > 0.25) score -= 10;
  if (temp < 26 || temp > 32) score -= 10;
  return Math.max(0, score);
}

// ─── DOC RADIAL RING ─────────────────────────────────────────────────────────
const DocRing = ({ doc, label }: { doc: number; label: string; key?: string }) => {
  const pct = Math.min(100, (doc / 90) * 100);
  const r = 24; const circ = 2 * Math.PI * r;
  const color = pct >= 85 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#60a5fa';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
          <circle cx="28" cy="28" r={r} strokeWidth="4" stroke="rgba(255,255,255,0.06)" fill="none" />
          <circle cx="28" cy="28" r={r} strokeWidth="4" fill="none"
            stroke={color} strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * circ} ${circ}`}
            style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-black text-white">{doc}</span>
        </div>
      </div>
      <p className="text-[7px] font-black text-white/30 uppercase tracking-wider text-center max-w-[52px] leading-tight">{label}</p>
    </div>
  );
};

const QuickNav = ({ t, navigate }: { t: Translations; navigate: any }) => {
  const links = [
    { label: t.monitor, icon: Droplets, path: '/monitor', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    { label: t.feed, icon: Utensils, path: '/feed', color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.1)' },
    { label: t.medicine, icon: Box, path: '/medicine', color: '#C78200', bg: 'rgba(199, 130, 0, 0.1)' },
    { label: t.addPond, icon: Plus, path: '/ponds/new', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x no-scrollbar">
      {links.map((link, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 + 0.1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate(link.path)}
          className="flex-shrink-0 snap-start flex flex-col items-center gap-2 p-3 bg-card backdrop-blur-md rounded-[2.2rem] border border-card-border shadow-[0_8px_20px_rgba(0,0,0,0.03)] min-w-[85px] group"
        >
          <div
            className="w-12 h-12 rounded-[1.2rem] flex items-center justify-center transition-all group-hover:scale-110 shadow-lg"
            style={{ backgroundColor: link.bg }}
          >
            <link.icon size={22} style={{ color: link.color }} />
          </div>
          <p className="text-[10px] font-black text-ink/60 uppercase tracking-widest text-center leading-tight">
            {link.label.split(' ')[0]}
          </p>
        </motion.button>
      ))}
    </div>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export const Dashboard = ({ user, t, onMenuClick }: { user: User; t: Translations; onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const {
    ponds,
    loading,
    waterRecords,
    isSyncing,
    refreshData,
    apiFetch,
    addNotification,
    unreadCount,
    reminders,
    feedLogs,
    medicineLogs,
    updatePond
  } = useData();
  const [showWeatherAlert, setShowWeatherAlert] = useState(true);
  const [showLunarAlert, setShowLunarAlert] = useState(true);
  const [refreshTs, setRefreshTs] = useState(Date.now());
  const [selectedPondId, setSelectedPondId] = useState<string>('');
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, { count: number, lastDismissed: number }>>(() => {
    const saved = localStorage.getItem('aqua_dismissed_engine_alerts');
    return saved ? JSON.parse(saved) : {};
  });
  const [isSyncingPush, setIsSyncingPush] = useState(false);
  const { requestNotificationPermission, fcmToken } = useFirebaseAlerts(user.language);

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
            notifications: user.notifications || { water: true, feed: true, market: false, expert: true, security: true }
          })
        });
        // Update local storage to reflect status
        localStorage.setItem('aqua_user', JSON.stringify({ ...user, fcmToken: token }));
      } catch (err) {
        console.error('Push Engine Sync failed:', err);
      }
    }
    setIsSyncingPush(false);
  };

  const shouldShowAlert = (key: string) => {
    const record = dismissedAlerts[key];
    if (!record) return true;

    const now = Date.now();
    const isSameDay = new Date(record.lastDismissed).toDateString() === new Date(now).toDateString();

    if (!isSameDay) return true; // Reset daily
    if (record.count >= 2) return false; // Max 2 times per day

    // If dismissed once, hide for 8 hours (half-day requirement)
    if (record.count === 1 && (now - record.lastDismissed) < 8 * 60 * 60 * 1000) return false;

    return true;
  };

  const handleDismiss = (key: string) => {
    const now = Date.now();
    setDismissedAlerts(prev => {
      const current = prev[key] || { count: 0, lastDismissed: 0 };
      const isSameDay = new Date(current.lastDismissed).toDateString() === new Date(now).toDateString();
      const updated = {
        ...prev,
        [key]: {
          count: isSameDay ? current.count + 1 : 1,
          lastDismissed: now
        }
      };
      localStorage.setItem('aqua_dismissed_engine_alerts', JSON.stringify(updated));
      return updated;
    });
  };

  const activePonds = useMemo(() => ponds.filter(p => p.status === 'active' || p.status === 'planned'), [ponds]);
  
  const pondsReadyToStock = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return ponds.filter(p => {
      if (p.status !== 'planned' || !p.stockingDate) return false;
      const sDate = new Date(p.stockingDate);
      sDate.setHours(0,0,0,0);
      return sDate <= today;
    });
  }, [ponds]);
  // const { incomingAlert, clearAlert } = useFirebaseAlerts(user.language);
  const lunar = getLunarStatus(new Date());

  // Auto-select first active pond
  useEffect(() => {
    if (!selectedPondId && activePonds.length > 0) setSelectedPondId(activePonds[0].id);
  }, [activePonds, selectedPondId]);

  const selectedPond = useMemo(() =>
    ponds.find(p => p.id === selectedPondId) || activePonds[0],
    [selectedPondId, ponds, activePonds]);

  // ── Real-time water quality for selected pond ──
  const latestWater = useMemo<WaterQualityRecord | undefined>(() => {
    if (!selectedPond) return undefined;
    const records = waterRecords
      .filter(w => w.pondId === selectedPond.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return records[0];
  }, [waterRecords, selectedPond, refreshTs]);

  // ── Water trend (last 7 records) ──
  const waterTrend = useMemo(() => {
    if (!selectedPond) return { ph: [], doVals: [], temp: [] };
    const recs = waterRecords
      .filter(w => w.pondId === selectedPond.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);
    return {
      ph: recs.map(r => safeNum(r.ph, 7.8)),
      doVals: recs.map(r => safeNum(r.do, 5.5)),
      temp: recs.map(r => safeNum(r.temperature, 28)),
    };
  }, [waterRecords, selectedPond, refreshTs]);

  // ── Feed logs last 7 days ──
  const feedThisWeek = useMemo(() => {
    if (!selectedPond) return [];
    const week = feedLogs
      .filter(f => f.pondId === selectedPond.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);
    return week.map(f => safeNum(f.quantity, 0));
  }, [feedLogs, selectedPond, refreshTs]);

  // ── SOP Engine ──
  const engineAlerts = useMemo(() =>
    activePonds.flatMap(p => {
      const doc = calculateDOC(p.stockingDate);
      const lastW = waterRecords
        .filter(w => w.pondId === p.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      const result = runScheduleEngine(
        doc,
        Number(p.seedCount) || 200000,
        p.status === 'harvested',
        lastW ? { do: lastW.do, ph: lastW.ph, temp: lastW.temperature, ammonia: lastW.ammonia } : undefined
      );
      const rawAlerts = result?.activeAlerts || [];

      // ── Filter alerts based on user preferences ──
      const userPrefs = user?.notifications || { water: true, feed: true, market: false, expert: true, security: true };

      return rawAlerts
        .map(a => ({ ...a, pondName: p.name, pondId: p.id, alertKey: `${p.id}-${a.title}` }))
        .filter(a => {
          // 1. Keyword Categorization
          const title = a.title.toLowerCase();
          const isWater = title.includes('do') || title.includes('ph') || title.includes('temp') || title.includes('ammonia') || title.includes('rain');
          const isFeed = title.includes('feed') || title.includes('tray') || title.includes('ration');
          const isExpert = title.includes('risk') || title.includes('white spot') || title.includes('disease');

          // 2. Preference Check
          if (isWater && !userPrefs.water) return false;
          if (isFeed && !userPrefs.feed) return false;
          if (isExpert && !userPrefs.expert) return false;

          // 3. Dismissal Check
          return shouldShowAlert(a.alertKey);
        });
    }), [activePonds, waterRecords, dismissedAlerts, user.notifications]);

  // ── PUSH TO LOCAL NOTIFICATIONS & HISTORY EFFECT ──
  useEffect(() => {
    // 1. Log Engine Alerts
    if (engineAlerts.length > 0) {
      engineAlerts.forEach(async (alert) => {
        const alreadyInHistory = sessionStorage.getItem(`added_to_history_${alert.alertKey}`);
        if (!alreadyInHistory) {
          addNotification(`${t.sopEngineAlert} · ${alert.pondName}`, alert.title, alert.type);
          sessionStorage.setItem(`added_to_history_${alert.alertKey}`, 'true');
        }

        if (Capacitor.isNativePlatform()) {
          const notifiedInSession = sessionStorage.getItem(`notified_eng_${alert.alertKey}`);
          if (!notifiedInSession) {
            try {
              await LocalNotifications.schedule({
                notifications: [
                  {
                    id: Math.floor(Math.random() * 100000),
                    title: `${t.sopEngineAlert} · ${alert.pondName}`,
                    body: alert.title,
                    smallIcon: 'ic_stat_name',
                    largeIcon: 'res://icon',
                    sound: 'default'
                  }
                ]
              });
              sessionStorage.setItem(`notified_eng_${alert.alertKey}`, 'true');
            } catch (err) {
              console.error('Failed to trigger local notification:', err);
            }
          }
        }
      });

      // Auto-dismiss engine alerts after 10 seconds locally (internal logic remains if needed for other components)
      const timer = setTimeout(() => {
        engineAlerts.forEach(alert => handleDismiss(alert.alertKey));
      }, 10000);
      return () => clearTimeout(timer);
    }

    // 2. Log Lunar Alerts
    const lunarPhases = ['AMAVASYA', 'POURNAMI', 'ASHTAMI', 'NAVAMI'];
    if (lunarPhases.includes(lunar.phase)) {
      const today = new Date().toISOString().split('T')[0];
      const lunarKey = `lunar_${lunar.phase}_${today}`;
      if (!sessionStorage.getItem(`added_to_history_${lunarKey}`)) {
        addNotification(t.moonPhaseTitle || 'Lunar Cycle Alert', `${lunar.phase} Phase Detected - Check SOP`, 'warning');
        sessionStorage.setItem(`added_to_history_${lunarKey}`, 'true');
      }
    }
  }, [engineAlerts, lunar, t, addNotification]);

  const pondTasks = useMemo(() => {
    if (!selectedPond) return [];
    const doc = calculateDOC(selectedPond.stockingDate);
    const lastW = waterRecords
      .filter(w => w.pondId === selectedPond.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const result = runScheduleEngine(
      doc,
      Number(selectedPond.seedCount) || 200000,
      selectedPond.status === 'harvested',
      lastW ? { do: lastW.do, ph: lastW.ph, temp: lastW.temperature, ammonia: lastW.ammonia } : undefined
    );
    return result?.dailySchedule.map(s => ({
      title: s.task,
      time: s.time,
      tag: s.type.toUpperCase(),
      icon: s.type === 'feed' ? Utensils : s.type === 'check' ? Activity : s.type === 'med' ? Box : Zap,
      color: s.type === 'feed' ? '#34d399' : s.type === 'check' ? '#60a5fa' : s.type === 'med' ? '#C78200' : '#fbbf24',
    })) || [];
  }, [selectedPond, waterRecords]);


  // ── FCR Calculation (Feed Conversion Ratio) ──
  const fcrData = useMemo(() => {
    if (!selectedPond || feedThisWeek.length === 0) return null;
    const doc = calculateDOC(selectedPond.stockingDate);
    const wG = Math.min(35, doc * 0.38);
    const liveCount = safeNum(selectedPond.seedCount, 100000) * 0.80;
    const biomassGained = (liveCount * wG) / 1000; // kg
    const totalFeedUsed = feedThisWeek.reduce((a, b) => a + b, 0);
    const fcr = totalFeedUsed > 0 && biomassGained > 0
      ? (totalFeedUsed / biomassGained).toFixed(2)
      : null;
    return { fcr, totalFeedUsed, biomassGained: biomassGained.toFixed(1) };
  }, [selectedPond, feedThisWeek]);

  // ── Survival Rate estimate ──
  const survivalRate = selectedPond
    ? Math.max(60, 100 - (calculateDOC(selectedPond.stockingDate) * 0.22)).toFixed(1)
    : '80.0';

  // ── Health score ──
  const healthScore = calcPondHealthScore(latestWater);
  const healthColor = healthScore >= 80 ? '#34d399' : healthScore >= 60 ? '#f59e0b' : '#ef4444';
  const healthLabel = healthScore >= 80 ? t.excellent : healthScore >= 60 ? t.fair : t.poor;

  // ── Medicine compliance ──
  const medThisWeek = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return medicineLogs.filter(m =>
      m.pondId === selectedPond?.id && new Date(m.date) >= weekAgo).length;
  }, [medicineLogs, selectedPond]);

  // ── Water quality status bar gauge ──
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="pb-32 bg-transparent min-h-screen relative overflow-hidden">
      {/* ── Local Page Accents (Layered with Global) ── */}
      <div className="absolute top-0 right-0 w-[80%] h-[30%] bg-primary/15 rounded-full blur-[100px] -z-10 transition-colors duration-700" />
      <div className="absolute bottom-[20%] left-0 w-[60%] h-[40%] bg-primary/10 rounded-full blur-[120px] -z-10 transition-colors duration-700" />

      <Header title={t.dashboard} showBack={false} onMenuClick={onMenuClick} />

      <div className="px-6 pt-[calc(env(safe-area-inset-top)+6.5rem)] space-y-6">
        {/* ── STOCKING CONFIRMATION ALERTS ── */}
        <AnimatePresence>
          {pondsReadyToStock.map(p => (
            <motion.div
              key={`confirm-${p.id}`}
              initial={{ height: 0, opacity: 0, scale: 0.95 }}
              animate={{ height: 'auto', opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.95 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-gradient-to-br from-[#0D523C] to-[#063b2c] p-6 rounded-[2.5rem] border border-emerald-500/30 shadow-2xl relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full -ml-10 -mb-10 blur-3xl" />
                
                <div className="flex items-start gap-4 relactive z-10">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                    <Zap className="text-emerald-400" size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-1">Stocking Day Alert</p>
                    <h3 className="text-white text-lg font-black tracking-tight leading-tight mb-2">
                       {t.confirmStockingTitle || 'Time to Stock'} {p.name}?
                    </h3>
                    <p className="text-white/60 text-[11px] leading-relaxed mb-6 italic">
                       Scheduled date reached ({new Date(p.stockingDate).toLocaleDateString()}). Confirm below to start DOC count and SOP engine.
                    </p>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => updatePond(p.id, { status: 'active' })}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all"
                      >
                        <Fish size={14} />
                        {t.confirmStockingAction || 'YES, CONFIRM STOCKING'}
                      </button>
                      <button
                        onClick={() => navigate(`/ponds/entry?id=${p.id}`)}
                        className="w-full bg-white/5 hover:bg-white/10 text-white/40 font-black py-3 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-widest text-[8px] transition-all"
                      >
                        {t.editDate || 'Reschedule Stocking'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── MANUALLY "RAISED" ENGINE ALERTS ── */}
        {/* ── Personal Greeting ── */}
        <div className="flex items-center justify-between py-1 pt-2">
          <div>
            <h2 className="text-ink/30 text-[8px] font-black uppercase tracking-[0.3em]">
              {(() => {
                const hour = new Date().getHours();
                if (hour < 12) return t.goodMorning || 'Good Morning';
                if (hour < 17) return t.goodAfternoon || 'Good Afternoon';
                return t.goodEvening || 'Good Evening';
              })()}
            </h2>
            <p className="text-ink text-xl font-serif italic tracking-tight leading-none mt-1">
              {user.name.split(' ')[0]}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[7px] font-black uppercase tracking-widest text-emerald-600/60">{t.systemLive || 'Live'}</p>
            </div>
            <p className="text-[7px] font-bold text-ink/20 mt-1 uppercase tracking-tighter">
              {new Date().toLocaleDateString(user.language === 'English' ? 'en-US' : 'te-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>

        {/* ── NEW ELITE TOP NAV ── */}
        {ponds.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-8 py-6 border-t border-b border-card-border/60">
            {[
              { label: t.monitor, icon: Activity, path: '/monitor', color: '#0369A1', bg: 'bg-blue-500/10' },
              { label: t.liveMonitor, icon: Eye, path: '/live-monitor', color: '#0891b2', bg: 'bg-cyan-500/10' },
              { label: t.disease, icon: HeartPulse, path: '/disease-detection', color: '#dc2626', bg: 'bg-red-500/10' },
              { label: t.market, icon: TrendingUp, path: '/market', color: '#059669', bg: 'bg-emerald-500/10' },
              { label: t.weather, icon: Wind, path: '/weather', color: '#6366f1', bg: 'bg-indigo-500/10' },
              { label: t.learn, icon: Box, path: '/learn', color: '#8B5CF6', bg: 'bg-violet-500/10' },
              { label: 'SOP Hub', icon: FileText, path: '/sop-library', color: '#a855f7', bg: 'bg-purple-500/10' },
              { label: t.expert, icon: Target, path: '/expert-consultations', color: '#D97706', bg: 'bg-amber-500/10' },
            ].map(n => (
              <motion.button
                key={n.path}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(n.path)}
                className="bg-card rounded-2xl p-2.5 border border-card-border shadow-sm flex flex-col items-center gap-1.5 hover:shadow-lg transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-x-0 bottom-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: n.color }} />
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-105 shadow-inner", n.bg)}>
                  <n.icon size={16} style={{ color: n.color }} />
                </div>
                <span className="text-[7px] font-bold text-ink/40 uppercase tracking-widest text-center leading-tight">{n.label}</span>
              </motion.button>
            ))}
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        {loading ? (
          <div className="mt-6 bg-card backdrop-blur-3xl p-12 rounded-[2.5rem] text-center shadow-2xl border border-card-border flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/10">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="h-full bg-primary shadow-[0_0_15px_var(--glow-primary)]"
              />
            </div>

            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 relative border border-primary/20">
              <div className="absolute inset-0 bg-primary/20 rounded-3xl animate-ping" />
              <RefreshCw size={36} className="text-primary animate-spin" strokeWidth={2.5} />
            </div>

            <h3 className="text-ink font-black text-lg tracking-tight mb-2 uppercase">{t.syncingData || 'Syncing Farm Data'}</h3>
            <p className="text-[9px] text-muted-ink font-black uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">
              Establishing secure connection...
            </p>

            <div className="mt-8 flex gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
              ))}
            </div>
          </div>
        ) : activePonds.length === 0 ? (
          <div className="mt-4 bg-card backdrop-blur-3xl p-6 rounded-[2rem] text-center border border-card-border/50 shadow-xl max-w-sm mx-auto">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-primary border border-primary/10 shadow-inner">
              <Plus size={24} strokeWidth={3} />
            </div>
            <h3 className="text-ink font-black text-xs tracking-tight mb-1">{t.startYourFirstPond}</h3>
            <p className="text-[8px] text-muted-ink font-bold uppercase tracking-widest mb-4 px-4 leading-relaxed">{t.addFirstPondDesc}</p>
            <button onClick={() => navigate('/ponds/new')}
              className="w-full py-3.5 bg-gradient-to-br from-primary to-accent text-white font-black rounded-xl text-[8px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 active:scale-95 transition-all">
              {t.addPond}
            </button>
          </div>
        ) : (
          <div className="space-y-6">

            {/* ══ SECTION 7: TODAY'S TASKS ══ */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <h2 className="text-ink text-sm font-black tracking-tight flex items-center gap-1.5">
                  <Clock size={14} className="text-[#C78200]" />{t.todaysTasks}
                </h2>
                <button onClick={() => navigate('/medicine')}
                  className="text-[#C78200] text-[8px] font-black uppercase tracking-widest flex items-center gap-0.5">
                  {t.viewSchedule} <ChevronRight size={10} />
                </button>
              </div>
              <div className="space-y-2">
                {pondTasks.length > 0 ? pondTasks.map((task, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.04 }}
                    className="bg-card rounded-2xl p-3 border border-card-border shadow-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${task.color}15` }}>
                      <task.icon size={16} style={{ color: task.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between leading-none">
                        <h3 className="text-ink font-bold text-[11px] tracking-tight truncate">{task.title}</h3>
                        <span className="text-[6.5px] font-black px-1.5 py-0.5 rounded flex items-center"
                          style={{ background: `${task.color}10`, color: task.color, border: `1px solid ${task.color}20` }}>
                          {task.tag}
                        </span>
                      </div>
                      <p className="text-ink/30 text-[8px] font-black uppercase tracking-tighter mt-0.5">{task.time}</p>
                    </div>
                  </motion.div>
                )) : (
                  <div className="bg-white/5 p-6 rounded-3xl text-center border border-black/5">
                    <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2 opacity-50" />
                    <p className="text-ink/30 text-[10px] font-black uppercase tracking-widest">{t.allTasksDone}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ══ SECTION 8: ACTIVE PONDS LIST ══ */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h2 className="text-ink text-base font-black tracking-tight mb-3 px-1 flex items-center gap-2">
                <Waves size={16} className="text-[#C78200]" />{t.activePonds}
              </h2>
              <div className="space-y-3">
                {activePonds.slice(0, 4).map((p, i) => {
                  const doc = calculateDOC(p.stockingDate);
                  const growth = getGrowthPercentage(doc);
                  const lastWater = waterRecords
                    .filter(w => w.pondId === p.id)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                  const hs = calcPondHealthScore(lastWater);
                  const hsColor = hs >= 80 ? '#34d399' : hs >= 60 ? '#f59e0b' : '#ef4444';

                  return (
                    <motion.div key={p.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.06 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/ponds/${p.id}`)}
                      className="bg-card rounded-[2rem] p-5 border border-card-border shadow-sm cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-ink font-black text-sm tracking-tight">{p.name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[7px] font-black text-[#C78200] uppercase tracking-widest">{p.species}</span>
                            <div className="w-0.5 h-0.5 bg-black/10 rounded-full" />
                            <span className={cn(
                              "text-[7px] font-black uppercase tracking-widest",
                              p.status === 'planned' ? "text-blue-500" : "text-ink/30"
                            )}>
                              {p.status === 'planned' ? (t.planned || 'Planned') : `${t.doc || 'DOC'}: ${doc} ${t.days || 'days'}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg"
                            style={{ background: `${hsColor}10`, border: `1px solid ${hsColor}20` }}>
                            <HeartPulse size={8} style={{ color: hsColor }} />
                            <span className="text-[8px] font-black" style={{ color: hsColor }}>{hs}%</span>
                          </div>
                          <ChevronRight size={12} className="text-[#C78200]/40" />
                        </div>
                      </div>

                      {/* Growth bar */}
                      <div className="mb-2.5">
                        <div className="flex justify-between text-[7px] font-bold text-ink/25 uppercase tracking-widest mb-1.5">
                          <span>{t.growthStage || 'Growth Stage'}</span>
                          <span className="text-emerald-500 font-black">{growth}%</span>
                        </div>
                        <div className="h-1 bg-ink/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                            style={{ width: `${growth}%` }} />
                        </div>
                      </div>

                      {/* Water quality chips */}
                      <div className="flex gap-1.5 flex-wrap">
                        {lastWater ? (
                          <>
                            <div className="flex items-center gap-1 bg-ink/5 px-2 py-1 rounded-lg border border-card-border/40">
                              <FlaskConical size={9} style={{ color: phColor(safeNum(lastWater.ph, 7.8)) }} />
                              <span className="text-[9px] font-bold text-ink italic">pH {safeNum(lastWater.ph, 7.8)}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-ink/5 px-2 py-1 rounded-lg border border-card-border/40">
                              <Droplets size={9} style={{ color: doColor(safeNum(lastWater.do, 5.5)) }} />
                              <span className="text-[9px] font-bold text-ink italic">DO {safeNum(lastWater.do, 5.5)}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-ink/5 px-2 py-1 rounded-lg border border-card-border/40">
                              <Thermometer size={9} className="text-blue-400" />
                              <span className="text-[9px] font-bold text-ink italic">{safeNum(lastWater.temperature, 28)}°C</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/5 border border-amber-500/10">
                            <AlertTriangle size={8} className="text-amber-500" />
                            <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">{t.noWaterData || 'No Data'}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {activePonds.length > 4 && (
                  <button onClick={() => navigate('/ponds')}
                    className="w-full py-4 bg-card rounded-[1.5rem] border border-card-border text-[#C78200] text-[10px] font-black uppercase tracking-widest shadow-sm">
                    {t.viewAllPonds} ({activePonds.length}) →
                  </button>
                )}
              </div>
            </motion.div>


          </div>
        )}
      </div>
    </div>
  );
};
