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
  CloudRain,
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
  ShoppingBag,
  ShoppingCart,
  Tag,
  BookOpen,
  GraduationCap,
  Package,
  CircuitBoard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { calculateDOC, getGrowthPercentage } from '../../utils/pondUtils';
import { runScheduleEngine } from '../../utils/scheduleEngine';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import { getLunarStatus } from '../../utils/lunarUtils';
import { useFirebaseAlerts } from '../../hooks/useFirebaseAlerts';
import { NoPondState } from '../../components/NoPondState';
import { ServerErrorState } from '../../components/ServerErrorState';
import { API_BASE_URL } from '../../config';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import type { Translations } from '../../translations';
import { User, WaterQualityRecord } from '../../types';
import { analyzePondSituation, buildSituationInputs, type SituationAlert } from '../../utils/situationEngine';
import { AeratorPopup, getAeratorStageLabel } from '../../components/AeratorPopup';
import { triggerAeratorCheckPush, snoozeAeratorCheck, parseAeratorNotification } from '../../services/aeratorPushService';
import { sendHarvestStagePush, HARVEST_STAGE_META, parseHarvestNotification } from '../../services/harvestPushService';
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
      <div className="relative w-10 h-10">
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
    { label: t.monitor, icon: Droplets, path: '/monitor', color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.1)' },
    { label: t.feed, icon: Utensils, path: '/feed', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    { label: t.medicine, icon: Pill, path: '/medicine', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
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
    updatePond,
    theme,
    serverError
  } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';
  const [showWeatherAlert, setShowWeatherAlert] = useState(true);
  const [showLunarAlert, setShowLunarAlert] = useState(true);
  const [refreshTs, setRefreshTs] = useState(Date.now());
  const [selectedPondId, setSelectedPondId] = useState<string>('');
  const [isSyncingPush, setIsSyncingPush] = useState(false);
  const [dismissedSituations, setDismissedSituations] = useState<Record<string, number>>(() => {
    const s = localStorage.getItem('dismissed_situation_state');
    return s ? JSON.parse(s) : {};
  });
  const { requestNotificationPermission, fcmToken, deepLinkUrl, clearDeepLink, incomingAlert, clearAlert } = useFirebaseAlerts(user.language);

  // ── On-enter: notification permission banner + sync progress ──────────────────
  const [showPermBanner, setShowPermBanner] = useState(false);
  const [showSyncBanner, setShowSyncBanner] = useState(true);
  const [syncStep, setSyncStep] = useState(0);  // 0-100%
  const [serverPingMs, setServerPingMs] = useState<number | null>(null);

  useEffect(() => {
    // ── 1. Sync progress (show every time dashboard mounts) ─────────────────────
    let frame: ReturnType<typeof setTimeout>;
    const pingStart = Date.now();
    // Kick a lightweight health ping to measure server latency
    fetch(`${API_BASE_URL}/health`)
      .then(() => setServerPingMs(Date.now() - pingStart))
      .catch(() => setServerPingMs(null));

    // Animate progress 0 → 100 over ~2s
    let pct = 0;
    const tick = () => {
      pct = Math.min(100, pct + (pct < 60 ? 4 : pct < 90 ? 2 : 1));
      setSyncStep(pct);
      if (pct < 100) frame = setTimeout(tick, 40);
      else setTimeout(() => setShowSyncBanner(false), 600);
    };
    frame = setTimeout(tick, 80);

    // ── 2. Permission check (once per session) ───────────────────────────────────
    const permKey = 'aqua_notif_perm_asked';
    if (!sessionStorage.getItem(permKey) && Capacitor.isNativePlatform()) {
      // Check if already granted — show banner only if not
      import('@capacitor/push-notifications').then(({ PushNotifications }) => {
        PushNotifications.checkPermissions().then(s => {
          if (s.receive !== 'granted') setShowPermBanner(true);
          sessionStorage.setItem(permKey, '1');
        }).catch(() => setShowPermBanner(true));
      });
    }

    return () => clearTimeout(frame);
  }, []); // run once on mount

  // ── Foreground harvest notification toast (when app is open) ──
  const [harvestToast, setHarvestToast] = useState<{
    pondId: string; requestId: string; pondName: string; status: string;
  } | null>(null);

  useEffect(() => {
    if (!incomingAlert || (incomingAlert as any).type !== 'harvest') return;
    const d = incomingAlert as any;
    if (d.pondId) {
      setHarvestToast({ pondId: d.pondId, requestId: d.requestId || '', pondName: d.pondName || 'Pond', status: d.status || '' });
      const t = setTimeout(() => { setHarvestToast(null); clearAlert(); }, 8000);
      return () => clearTimeout(t);
    }
  }, [incomingAlert]);

  // ── Aerator Popup State ──
  const [aeratorPopupPond, setAeratorPopupPond] = useState<string | null>(null);
  const aeratorTargetPond = aeratorPopupPond ? ponds.find(p => p.id === aeratorPopupPond) : null;

  // Detect 20-DOC milestone ponds that haven't had aerator update this stage
  const aeratorDuePonds = useMemo(() => {
    return ponds.filter(p => {
      if (p.status !== 'active') return false;
      const doc = calculateDOC(p.stockingDate);
      if (doc < 1) return false;
      const stage = Math.ceil(doc / 20);
      const stageStartDoc = (stage - 1) * 20 + 1;
      if (doc < stageStartDoc || doc > stageStartDoc + 2) return false;
      const lastDoc = p.aerators?.lastDoc ?? 0;
      const lastStage = Math.ceil(lastDoc / 20);
      return lastStage < stage;
    });
  }, [ponds]);

  // Fire FCM push once per session for each due pond
  useEffect(() => {
    aeratorDuePonds.forEach(pond => {
      const doc = calculateDOC(pond.stockingDate);
      triggerAeratorCheckPush(pond.id, pond.name, doc);
    });
  }, [aeratorDuePonds.length]); // eslint-disable-line

  // ── Daily Streak Logic ──
  const streak = useMemo(() => {
    const key = 'aqua_daily_streak';
    const today = new Date().toDateString();
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      const lastDay = saved.lastDay || '';
      const count = saved.count || 0;
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      if (lastDay === today) return count;
      if (lastDay === yesterday.toDateString()) {
        const next = { count: count + 1, lastDay: today };
        localStorage.setItem(key, JSON.stringify(next));
        return next.count;
      }
      localStorage.setItem(key, JSON.stringify({ count: 1, lastDay: today }));
      return 1;
    } catch { return 1; }
  }, []);

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

  const activePonds = useMemo(() => ponds.filter(p => p.status === 'active' || p.status === 'planned'), [ponds]);

  const pondsReadyToStock = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return ponds.filter(p => {
      if (p.status !== 'planned' || !p.stockingDate) return false;
      const sDate = new Date(p.stockingDate);
      sDate.setHours(0, 0, 0, 0);
      return sDate <= today;
    });
  }, [ponds]);
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

  // ── Situation Analysis (all active ponds) ──
  const situationAlerts = useMemo<SituationAlert[]>(() => {
    const inputs = buildSituationInputs(activePonds, waterRecords, feedLogs, medicineLogs, calculateDOC);
    const all = inputs.flatMap(inp => analyzePondSituation(inp));
    const now = Date.now();
    return all
      .filter(a => {
        const dismissedAt = dismissedSituations[a.id];
        if (!dismissedAt) return true;
        // Expire dismissal after 8 hours (half-day check)
        return (now - dismissedAt) > 8 * 60 * 60 * 1000;
      })
      .slice(0, 8);
  }, [activePonds, waterRecords, feedLogs, medicineLogs, dismissedSituations]);

  const dismissSituation = (id: string) => {
    setDismissedSituations(prev => {
      const next = { ...prev, [id]: Date.now() };
      localStorage.setItem('dismissed_situation_state', JSON.stringify(next));
      return next;
    });
  };

  // ── PUSH TO LOCAL NOTIFICATIONS & HISTORY EFFECT ──
  useEffect(() => {
    const todayKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. Process Situation Intelligence Alerts (unified for cards & notifications)
    if (situationAlerts.length > 0) {
      situationAlerts.forEach(async (alert) => {
        const alertId = alert.id;
        const dailyHistoryKey = `history_notif_${alertId}_${todayKey}`;
        const dailyPushKey = `push_notif_${alertId}_${todayKey}`;

        // Add to persistent notification history list once per day
        if (!localStorage.getItem(dailyHistoryKey)) {
          addNotification(alert.title, alert.body, alert.type);
          localStorage.setItem(dailyHistoryKey, 'true');
        }

        // Trigger OS Push Notification for critical/warning alerts once per day
        if (Capacitor.isNativePlatform() && (alert.type === 'critical' || alert.type === 'warning')) {
          if (!localStorage.getItem(dailyPushKey)) {
            try {
              await LocalNotifications.schedule({
                notifications: [{
                  id: Math.floor(Math.random() * 1000000),
                  title: alert.title,
                  body: alert.body,
                  smallIcon: 'ic_stat_name',
                  largeIcon: 'res://icon',
                  sound: 'default'
                }]
              });
              localStorage.setItem(dailyPushKey, 'true');
            } catch (err) {
              console.error('Failed to trigger OS notification:', err);
            }
          }
        }
      });
    }

    // 2. Log Lunar Alerts — once per phase per day
    const lunarPhases = ['AMAVASYA', 'POURNAMI', 'ASHTAMI', 'NAVAMI'];
    if (lunarPhases.includes(lunar.phase)) {
      const lunarKey = `lunar_${lunar.phase}_${todayKey}`;
      if (!localStorage.getItem(`history_notif_${lunarKey}`)) {
        addNotification(t.moonPhaseTitle || 'Lunar Cycle Alert', `${lunar.phase} Phase Detected - Check SOP`, 'warning');
        localStorage.setItem(`history_notif_${lunarKey}`, 'true');
      }
    }
  }, [situationAlerts, lunar, t, addNotification]);

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
      lastW ? { do: lastW.do, ph: lastW.ph, temp: lastW.temperature, ammonia: lastW.ammonia } : undefined,
      selectedPond.customData?.medicineStatus
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

  // Water quality status bar gauge 
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <>
      <div className={cn("pb-32 min-h-[100dvh] relative overflow-hidden transition-colors duration-700", isDark ? "bg-[#030E1B]" : "bg-[#F8FAFC]")}>
        {/* ── Breathtaking Ambient Background Details ── */}
        <div className="absolute inset-0 pointer-events-none fixed">
          <div className={cn("absolute top-[-10%] right-[-5%] w-[80%] h-[50%] blur-[140px] rounded-full animate-pulse-slow", isDark ? "bg-indigo-600/10" : "bg-indigo-500/5")} />
          <div className={cn("absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] blur-[120px] rounded-full", isDark ? "bg-emerald-600/10" : "bg-emerald-500/5")} />
        </div>

        <Header title={t.dashboard} showBack={false} onMenuClick={onMenuClick} showLogo
          rightElement={
            <div className="flex items-center gap-1.5">
              {/* Orders icon */}
              <button
                onClick={() => navigate('/orders')}
                className="relative w-9 h-9 rounded-2xl flex items-center justify-center"
                style={{ background: isDark ? 'rgba(199,130,0,0.12)' : 'rgba(199,130,0,0.10)' }}
              >
                <Package size={16} style={{ color: '#C78200' }} />
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 text-white text-[5px] font-black rounded-full flex items-center justify-center">!</span>
              </button>
              {/* Bell / Notifications icon */}
              <button
                onClick={() => navigate('/notifications')}
                className="relative w-9 h-9 rounded-2xl flex items-center justify-center"
                style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
              >
                <Bell size={16} className={isDark ? 'text-white/60' : 'text-slate-500'} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border border-white" />
                )}
              </button>
            </div>
          }
        />

        {/* ── SYNC PROGRESS BAR (shows on every dashboard entry ~2s) ── */}
        <AnimatePresence>
          {showSyncBanner && (
            <motion.div
              key="sync-bar"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed top-[calc(env(safe-area-inset-top)+3.5rem)] left-0 right-0 z-[190] px-4"
            >
              <div className={cn(
                "rounded-2xl overflow-hidden border shadow-lg backdrop-blur-md",
                isDark ? "bg-slate-900/90 border-white/8" : "bg-white/95 border-slate-100"
              )}>
                {/* Progress track */}
                <div className="h-[2px] w-full bg-slate-200/20">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ width: `${syncStep}%`, background: 'linear-gradient(90deg, #10B981, #3B82F6)' }}
                    transition={{ ease: 'linear' }}
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", syncStep < 100 ? "bg-emerald-500 animate-pulse" : "bg-emerald-500")} />
                    <p className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/40" : "text-slate-500")}>
                      {syncStep < 100 ? `Syncing data… ${syncStep}%` : '✓ Sync complete'}
                    </p>
                  </div>
                  {serverPingMs !== null && (
                    <p className={cn("text-[7px] font-black uppercase tracking-widest", isDark ? "text-white/20" : "text-slate-400")}>
                      Server {serverPingMs}ms
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── NOTIFICATION PERMISSION BANNER (Android only, once per session) ── */}
        <AnimatePresence>
          {showPermBanner && (
            <motion.div
              key="perm-banner"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] left-4 right-4 z-[190]"
            >
              <div className={cn(
                "rounded-3xl p-4 border shadow-2xl backdrop-blur-xl overflow-hidden",
                isDark ? "bg-slate-900/95 border-white/10" : "bg-white/95 border-slate-100"
              )}>
                <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500" />
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Bell size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={cn("text-[10px] font-black uppercase tracking-widest mb-0.5", isDark ? "text-white" : "text-slate-900")}>
                      {t.enablePushAlerts}
                    </p>
                    <p className={cn("text-[8px] font-medium leading-snug", isDark ? "text-white/40" : "text-slate-500")}>
                      {t.pushAlertsDesc}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={async () => {
                          setShowPermBanner(false);
                          await requestNotificationPermission();
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-[8px] font-black uppercase tracking-widest shadow-lg"
                      >
                        🔔 {t.allowAlerts}
                      </button>
                      <button
                        onClick={() => setShowPermBanner(false)}
                        className={cn("px-4 py-2.5 rounded-xl border text-[8px] font-black uppercase tracking-widest", isDark ? "border-white/10 text-white/30" : "border-slate-200 text-slate-400")}
                      >
                        {t.later}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HARVEST STAGE TOAST (foreground in-app alert) ── */}
        <AnimatePresence>
          {harvestToast && (() => {
            const meta = HARVEST_STAGE_META[harvestToast.status];
            if (!meta) return null;
            return (
              <motion.div
                key="harvest-toast"
                initial={{ opacity: 0, y: -60, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -40, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="fixed top-[calc(env(safe-area-inset-top)+4rem)] left-4 right-4 z-[200]"
              >
                <div
                  className="rounded-2xl overflow-hidden shadow-2xl border"
                  style={{ borderColor: meta.color + '40', backgroundColor: meta.color + '18' }}
                >
                  <div
                    className="h-[3px] w-full"
                    style={{ background: meta.color }}
                  />
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ backgroundColor: meta.color + '25', border: `1px solid ${meta.color}40` }}
                    >
                      {meta.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: meta.color }}>
                        {meta.title}
                      </p>
                      <p className={cn('text-[9px] font-medium truncate mt-0.5', isDark ? 'text-white/60' : 'text-slate-600')}>
                        {harvestToast.pondName} · {t.harvestUpdate}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setHarvestToast(null); clearAlert(); }}
                        className={cn('px-2 py-1.5 rounded-xl text-[7px] font-black uppercase tracking-widest border',
                          isDark ? 'border-white/10 text-white/30' : 'border-slate-200 text-slate-400'
                        )}
                      >
                        ✕
                      </button>
                      <button
                        onClick={() => {
                          setHarvestToast(null);
                          clearAlert();
                          navigate(`/ponds/${harvestToast.pondId}/tracking`);
                        }}
                        className="px-3 py-1.5 rounded-xl text-[7px] font-black uppercase tracking-widest text-white shadow-lg"
                        style={{ backgroundColor: meta.color }}
                      >
                        View →
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        <div className="px-5 pt-[calc(env(safe-area-inset-top)+4.5rem)] space-y-5 relative z-10">

          {/* ── PERSONALIZED GREETING HQ + STREAK ── */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-[1fr_auto] items-end justify-between py-1">
            <div>
              <h2 className={cn("text-[8px] font-black uppercase tracking-[0.4em] mb-1", isDark ? "text-indigo-400" : "text-indigo-600")}>
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return t.goodMorning;
                  if (hour < 17) return t.goodAfternoon;
                  return t.goodEvening;
                })()}
              </h2>
              <p className={cn("text-3xl font-black tracking-tighter leading-none", isDark ? "text-white" : "text-slate-900")}>
                {user.name.split(' ')[0]}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-xl border shadow-sm", isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200")}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className={cn("text-[7.5px] font-black uppercase tracking-[0.2em]", isDark ? "text-emerald-400" : "text-emerald-600")}>{t.systemLive}</p>
                </div>
                <p className={cn("text-[8px] font-bold uppercase tracking-widest", isDark ? "text-white/30" : "text-slate-400")}>
                  {new Date().toLocaleDateString(user.language === 'English' ? 'en-US' : 'te-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
            {/* ACTIVE PONDS BADGE — compact */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}
              className={cn("flex flex-col items-center px-3 py-2 rounded-xl border shadow-sm", isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200")}
            >
               <span className="text-base leading-none">🦐</span>
               <span className={cn("text-lg font-black tracking-tighter leading-none mt-0.5", isDark ? "text-emerald-400" : "text-emerald-600")}>{activePonds.length}</span>
               <span className={cn("text-[6px] font-black uppercase tracking-widest", isDark ? "text-emerald-400/60" : "text-emerald-600/60")}>{t.activePondsLabel}</span>
            </motion.div>
          </motion.div>

          {/* ── STOCKING CONFIRMATION ACCELERATOR ALERTS ── */}
          <AnimatePresence>
            {pondsReadyToStock.map(p => (
              <motion.div key={`confirm-${p.id}`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="bg-gradient-to-br from-[#0D523C] to-[#04281e] p-5 rounded-2xl border border-emerald-500/40 shadow-2xl relative overflow-hidden mb-2 shadow-emerald-900/20">
                  <div className="absolute top-[-50%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <Zap className="text-emerald-400 drop-shadow-md" size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-1">{t.stockDayAlert}</p>
                      <h3 className="text-white text-xl font-black tracking-tight leading-none mb-1.5">
                        {p.name}
                      </h3>
                      <p className="text-emerald-100/60 text-[10px] uppercase font-bold tracking-widest leading-relaxed mb-4">
                        {t.stockDayDesc}
                      </p>
                      <div className="flex gap-2">
                         <button onClick={() => updatePond(p.id, { status: 'active' })} className="flex-1 bg-emerald-500 text-white font-black py-3 rounded-xl shadow-lg border border-emerald-400 flex items-center justify-center gap-2 uppercase tracking-[0.1em] text-[10px] active:scale-95 transition-all outline-none">
                           <Fish size={14} /> {t.confirmStock}
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* ── PREMIUM DEALS STRIP ── */}
          <div
            className="relative -mx-5 overflow-hidden cursor-pointer mb-2 mt-[-10px] sm:mt-0"
            style={{ height: 52 }}
            onClick={() => navigate('/shop')}
          >
            <div className={cn('absolute inset-0', isDark ? 'bg-gradient-to-r from-[#080D18] via-[#0C1422] to-[#080D18]' : 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800')} />
            <div className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none" style={{ background: isDark ? 'linear-gradient(90deg,#080D18,transparent)' : 'linear-gradient(90deg,#1e293b,transparent)' }} />
            <div className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none" style={{ background: isDark ? 'linear-gradient(270deg,#080D18,transparent)' : 'linear-gradient(270deg,#1e293b,transparent)' }} />
            <motion.div
              animate={{ x: ['0%', '-50%'] }}
              transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}
              className="flex items-center gap-3 h-full px-6 whitespace-nowrap w-max"
            >
              {[
                { emoji: '💊', title: t.medicineSale,  sub: t.medicineSaleDesc,       color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
                { emoji: '🌾', title: t.bulkFeedDeal,  sub: t.bulkFeedDealDesc,       color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
                { emoji: '🚚', title: t.freeDelivery,  sub: t.freeDeliveryDesc,       color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
                { emoji: '🔬', title: t.wssvKit,       sub: t.doc45Special,           color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
                { emoji: '⚡', title: 'Smart Farm',    sub: 'IoT · Aerators · Bills', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'  },
                { emoji: '💊', title: t.medicineSale,  sub: t.medicineSaleDesc,       color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
                { emoji: '🌾', title: t.bulkFeedDeal,  sub: t.bulkFeedDealDesc,       color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
                { emoji: '🚚', title: t.freeDelivery,  sub: t.freeDeliveryDesc,       color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
                { emoji: '🔬', title: t.wssvKit,       sub: t.doc45Special,           color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
                { emoji: '⚡', title: 'Smart Farm',    sub: 'IoT · Aerators · Bills', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'  },
              ].map((ad, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl flex-shrink-0"
                  style={{ background: ad.bg, border: `1px solid ${ad.color}35` }}
                >
                  <span className="text-sm leading-none">{ad.emoji}</span>
                  <span className="text-[10px] font-black text-white/90 tracking-wide">{ad.title}</span>
                  <span className="text-white/20 text-[8px]">·</span>
                  <span className="text-[8px] font-bold tracking-widest" style={{ color: ad.color }}>{ad.sub}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── DAZZLING DYNAMIC COMMAND GRID ── */}

          {ponds.length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: t.monitor,     icon: Activity,       path: '/monitor',               from: '#38bdf8', to: '#0284c7' },
                { label: t.liveMonitor, icon: Eye,            path: '/live-monitor',          from: '#22d3ee', to: '#0891b2' },
                { label: t.disease,     icon: HeartPulse,     path: '/disease-detection',     from: '#f87171', to: '#dc2626' },
                { label: t.market,      icon: TrendingUp,     path: '/market',                from: '#34d399', to: '#059669' },
                { label: t.weather,     icon: Wind,           path: '/weather',               from: '#818cf8', to: '#4f46e5' },
                { label: t.aquaCalc,    icon: Calculator,     path: '/aqua-calc',             from: '#10b981', to: '#059669' },
                { label: t.sopHub,      icon: FileText,       path: '/sop-library',           from: '#e879f9', to: '#c026d3' },
                { label: t.learn,       icon: GraduationCap,  path: '/learn',                 from: '#f59e0b', to: '#d97706' },
                { label: t.expert,      icon: BookOpen,       path: '/expert-consultations',  from: '#ec4899', to: '#db2777' },
                { label: `🛒 ${t.market.split(' ')[0]}`, icon: ShoppingBag,    path: '/shop',                  from: '#C78200', to: '#92400E' },
                { label: 'Smart Farm',  icon: CircuitBoard,   path: '/smart-farm',            from: '#06b6d4', to: '#0284c7' },
              ].map((n, i) => (
                <motion.button key={n.path} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileTap={{ scale: 0.9 }} onClick={() => navigate(n.path)} className="flex flex-col items-center gap-1.5 group outline-none">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm transition-all group-hover:scale-110", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-xl")} style={{ boxShadow: isDark ? `0 0 12px ${n.from}15` : `0 8px 20px ${n.from}20` }}>
                    <n.icon size={18} className="drop-shadow-sm" style={{ color: n.from }} />
                  </div>
                  <span className={cn("text-[7px] font-black uppercase tracking-widest text-center leading-tight transition-colors", isDark ? "text-white/40 group-hover:text-white" : "text-slate-500 group-hover:text-slate-900")}>{n.label}</span>
                </motion.button>
              ))}
            </div>
          )}

          {/* ── SITUATION INTELLIGENCE ALERTS ── */}
          <AnimatePresence>
            {situationAlerts.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between px-1">
                  <h2 className={cn("text-xs font-black tracking-tighter flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                    <Bell size={13} className="text-red-500 animate-bounce" />
                     {t.smartAlerts}
                     <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-red-500 text-white">{situationAlerts.length}</span>
                  </h2>
                  <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/notifications')} className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/30" : "text-slate-400")}>
                      See All →
                    </button>
                    <button onClick={() => setDismissedSituations(prev => { 
                      const next = { ...prev };
                      situationAlerts.forEach(a => next[a.id] = Date.now());
                      localStorage.setItem('dismissed_situation_state', JSON.stringify(next));
                      return next;
                    })} className="text-[8px] font-black uppercase tracking-widest text-red-400">
                      Clear
                    </button>
                  </div>
                </div>

                {/* Show first 3 alerts — full detail */}
                {situationAlerts.slice(0, 3).map((alert, i) => {
                  const alertColors = {
                    critical: { bg: isDark ? 'bg-red-500/12 border-red-500/40' : 'bg-red-50 border-red-300', text: 'text-red-500', badge: 'bg-red-500', label: t.critical },
                    warning:  { bg: isDark ? 'bg-amber-500/12 border-amber-500/40' : 'bg-amber-50 border-amber-300', text: 'text-amber-500', badge: 'bg-amber-500', label: t.warning },
                    info:     { bg: isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200', text: 'text-blue-500', badge: 'bg-blue-500', label: t.info },
                    success:  { bg: isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200', text: 'text-emerald-500', badge: 'bg-emerald-500', label: t.good },
                    lunar:    { bg: isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200', text: 'text-indigo-500', badge: 'bg-indigo-500', label: t.lunar },
                  };
                  const c = alertColors[alert.type as keyof typeof alertColors] || alertColors.info;
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15, height: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => alert.actionPath && navigate(alert.actionPath)}
                      className={cn('rounded-2xl px-3 py-3 border relative overflow-hidden cursor-pointer active:scale-[0.99] transition-transform', c.bg)}
                    >
                      {alert.type === 'critical' && (
                        <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
                      )}

                      {/* Top row: emoji + title + priority badge + dismiss */}
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg leading-none flex-shrink-0 mt-0.5">{alert.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className={cn('text-[11px] font-black tracking-tight leading-snug', c.text)}>{alert.title}</p>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className={cn('text-[6px] font-black px-1.5 py-0.5 rounded-full text-white uppercase tracking-widest', c.badge)}>{c.label}</span>
                              <button
                                onClick={e => { e.stopPropagation(); dismissSituation(alert.id); }}
                                className={cn('w-5 h-5 rounded-full flex items-center justify-center', isDark ? 'bg-white/10 text-white/40' : 'bg-black/5 text-slate-400')}
                              >
                                <X size={9} />
                              </button>
                            </div>
                          </div>

                          {/* Pond name badge */}
                          {alert.pondName && (
                            <span className={cn('inline-flex items-center gap-1 text-[7px] font-black px-2 py-0.5 rounded-full mb-1.5',
                              isDark ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-600'
                            )}>
                              📍 {alert.pondName}
                            </span>
                          )}

                          {/* Full description — not truncated */}
                          <p className={cn('text-[9px] font-medium leading-snug', isDark ? 'text-white/55' : 'text-slate-600')}>{alert.body}</p>

                          {/* Action button */}
                          {alert.action && alert.actionPath && (
                            <button
                              onClick={e => { e.stopPropagation(); navigate(alert.actionPath!); }}
                              className={cn('text-[7px] font-black uppercase tracking-widest flex items-center gap-0.5 mt-2 px-2.5 py-1 rounded-lg border', c.text,
                                isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-current/20'
                              )}
                            >
                              {alert.action} <ChevronRight size={8} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* More alerts hint */}
                {situationAlerts.length > 3 && (
                  <button onClick={() => navigate('/notifications')} className={cn("w-full py-2 rounded-xl border text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5",
                    isDark ? "bg-white/3 border-white/8 text-white/30" : "bg-white border-slate-200 text-slate-400"
                  )}>
                    +{situationAlerts.length - 3} {t.moreAlertsHint}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── AERATOR STAGE CHECK BANNERS ── */}
          <AnimatePresence>
            {aeratorDuePonds.map(pond => {
              const doc = calculateDOC(pond.stockingDate);
              return (
                <motion.div
                  key={`aer-${pond.id}`}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={cn('rounded-2xl px-4 py-3 border flex items-center gap-3',
                    isDark ? 'bg-blue-500/8 border-blue-500/20' : 'bg-blue-50 border-blue-200'
                  )}
                >
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                    isDark ? 'bg-blue-500/15 border border-blue-500/25' : 'bg-blue-100 border border-blue-300'
                  )}>
                    <Wind size={16} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-blue-400' : 'text-blue-700')}>
                      {t.aeratorCheckDue} · {t.doc} {doc}
                    </p>
                    <p className={cn('text-[8px] font-medium truncate', isDark ? 'text-white/40' : 'text-slate-600')}>
                      {pond.name} · {getAeratorStageLabel(doc)}
                    </p>
                  </div>
                  <button
                    onClick={() => setAeratorPopupPond(pond.id)}
                    className={cn('px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex-shrink-0',
                      isDark ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400' : 'bg-blue-600 text-white shadow-sm'
                    )}
                  >
                    {t.viewMore} →
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* ── CORE OPERATIONS ── */}
          {loading ? (
            <div className={cn("p-10 rounded-[2rem] text-center border overflow-hidden relative", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-xl")}>
              <div className="absolute top-0 left-0 w-full h-[5px] bg-slate-100 dark:bg-white/5">
                <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              </div>
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border relative", isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200")}>
                <RefreshCw size={28} className={isDark ? "text-indigo-400 animate-spin" : "text-indigo-600 animate-spin"} />
              </div>
              <h3 className={cn("font-black text-sm uppercase tracking-widest mb-1", isDark ? "text-white" : "text-slate-900")}>{t.syncingData || 'Syncing Cloud'}</h3>
              <p className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-4", isDark ? "text-white/30" : "text-slate-400")}>{t.downloadingTelemetry}</p>
            </div>
          ) : activePonds.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-6">
              {serverError ? (
                <ServerErrorState isDark={isDark} />
              ) : (
                <NoPondState
                  isDark={isDark}
                  subtitle={t.noPondsPrompt}
                />
              )}
            </motion.div>
          ) : (
            <div className="space-y-6">

              {/* ══ DYNAMIC TASK QUEUE ══ */}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className={cn("text-lg font-black tracking-tighter flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                    <Clock size={18} className="text-amber-500" />{t.todaysTasks}
                  </h2>
                  <button onClick={() => navigate('/medicine')} className={cn("text-[9px] font-black uppercase tracking-widest flex items-center gap-0.5", isDark ? "text-amber-400" : "text-amber-600")}>
                    {t.viewSchedule} <ChevronRight size={12} />
                  </button>
                </div>
                <div className="space-y-2">
                  {pondTasks.length > 0 ? pondTasks.map((task, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className={cn("rounded-xl p-3 border shadow-sm flex items-center justify-between", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200")}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shadow-inner relative overflow-hidden" style={{ background: `${task.color}20` }}>
                          <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at top right, ${task.color}, transparent)` }} />
                          <task.icon size={18} style={{ color: task.color }} className="relative z-10" />
                        </div>
                        <div>
                          <h3 className={cn("font-black text-xs tracking-tight", isDark ? "text-white" : "text-slate-800")}>{task.title}</h3>
                          <p className={cn("font-black text-[9px] uppercase tracking-widest mt-0.5", isDark ? "text-white/40" : "text-slate-400")}>{task.time}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-black px-2 py-1 rounded-[6px] border shadow-sm backdrop-blur-md" style={{ background: `${task.color}15`, color: task.color, borderColor: `${task.color}30` }}>
                        {task.tag}
                      </span>
                    </motion.div>
                  )) : (
                    <div className={cn("p-6 rounded-2xl border text-center relative overflow-hidden", isDark ? "bg-emerald-500/5 border-emerald-500/10" : "bg-emerald-50 border-emerald-100")}>
                      <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2 drop-shadow-lg" />
                      <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-emerald-400/80" : "text-emerald-600")}>{t.allTasksDone}</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* ══ ELEGANT FLEET PREVIEWS ══ */}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className={cn("text-lg font-black tracking-tighter flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                    <Waves size={18} className="text-blue-500" />{t.activePonds}
                  </h2>
                </div>
                <div className="space-y-3">
                  {activePonds.slice(0, 4).map((p, i) => {
                    const doc = calculateDOC(p.stockingDate);
                    const growth = getGrowthPercentage(doc);
                    const lastWater = waterRecords.filter(w => w.pondId === p.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                    const hs = calcPondHealthScore(lastWater);
                    const hsColor = hs >= 80 ? '#10b981' : hs >= 60 ? '#f59e0b' : '#ef4444';

                    return (
                      <motion.div key={p.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }} whileTap={{ scale: 0.98 }} onClick={() => navigate(`/ponds/${p.id}`)} className={cn("rounded-[1.5rem] p-5 border shadow-md relative overflow-hidden", isDark ? "bg-black/20 border-white/10 backdrop-blur-2xl" : "bg-white border-slate-200")}>
                        {/* Subdued background blob inside card */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] opacity-10 pointer-events-none" style={{ background: hsColor }} />

                        <div className="flex items-start justify-between mb-4 relative z-10">
                          <div>
                            <h3 className={cn("font-black text-lg tracking-tight leading-none mb-1.5", isDark ? "text-white" : "text-slate-800")}>{p.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border", isDark ? "bg-white/5 border-white/20 text-white/70" : "bg-slate-100 border-slate-200 text-slate-600")}>{p.species}</span>
                              <span className={cn("text-[9px] font-black uppercase tracking-widest", p.status === 'planned' ? "text-blue-500" : isDark ? "text-emerald-400" : "text-emerald-600")}>
                                {p.status === 'planned' ? t.planned : `${t.doc} ${doc}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border shadow-inner backdrop-blur-md" style={{ background: `${hsColor}15`, borderColor: `${hsColor}30` }}>
                              <HeartPulse size={10} style={{ color: hsColor }} />
                              <span className="text-[10px] font-black" style={{ color: hsColor }}>{hs}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Premium Growth Bar Component */}
                        <div className="mb-4 relative z-10">
                          <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] mb-1.5">
                            <span className={cn(isDark ? "text-white/40" : "text-slate-400")}>{t.growthStage || t.biomassCap}</span>
                            <span className={isDark ? "text-blue-400" : "text-blue-600"}>{growth}%</span>
                          </div>
                          <div className={cn("h-1.5 rounded-full overflow-hidden shadow-inner", isDark ? "bg-white/5" : "bg-slate-100")}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${growth}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)', boxShadow: '0 0 10px rgba(56,189,248,0.5)' }} />
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap relative z-10">
                          {lastWater ? (
                            <>
                              <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md border", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
                                <FlaskConical size={10} style={{ color: phColor(safeNum(lastWater.ph, 7.8)) }} />
                                <span className={cn("text-[10px] font-bold", isDark ? "text-white" : "text-slate-800")}>pH {safeNum(lastWater.ph, 7.8)}</span>
                              </div>
                              <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md border", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
                                <Droplets size={10} style={{ color: doColor(safeNum(lastWater.do, 5.5)) }} />
                                <span className={cn("text-[10px] font-bold", isDark ? "text-white" : "text-slate-800")}>DO {safeNum(lastWater.do, 5.5)}</span>
                              </div>
                              <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md border", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}>
                                <Thermometer size={10} className="text-amber-500" />
                                <span className={cn("text-[10px] font-bold", isDark ? "text-white" : "text-slate-800")}>{safeNum(lastWater.temperature, 28)}°</span>
                              </div>
                            </>
                          ) : (
                            <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md border", isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200")}>
                              <AlertTriangle size={10} className="text-amber-500" />
                              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">{t.noWaterData || t.awaitingMetrics}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  {activePonds.length > 4 && (
                    <button onClick={() => navigate('/ponds')} className={cn("w-full py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest shadow-sm transition-all outline-none", isDark ? "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100")}>
                      {t.viewAllPonds} ({activePonds.length}) →
                    </button>
                  )}
                </div>
              </motion.div>

            </div>
          )}
        </div>
      </div>

      {/* ── AERATOR POPUP OVERLAY ── */}
      <AnimatePresence>
        {aeratorTargetPond && (
          <AeratorPopup
            pond={aeratorTargetPond}
            doc={calculateDOC(aeratorTargetPond.stockingDate)}
            isDark={isDark}
            onClose={() => setAeratorPopupPond(null)}
            onSaved={() => setAeratorPopupPond(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
