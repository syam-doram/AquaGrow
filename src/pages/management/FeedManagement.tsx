import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { NoPondState } from '../../components/NoPondState';
import {
  Clock,
  Waves,
  CheckCircle2,
  Thermometer,
  Droplets,
  Zap,
  Scale,
  ChevronLeft,
  Activity,
  Package,
  Eye,
  Info,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Fish,
  Moon,
  ChevronRight,
  Leaf,
  MessageSquare,
  BarChart2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, ReferenceLine,
  Area, AreaChart,
} from 'recharts';
import { useData } from '../../context/DataContext';
import type { Translations } from '../../translations';
import { calculateDOC } from '../../utils/pondUtils';
import { getLunarStatus, MoonPhase } from '../../utils/lunarUtils';
import { cn } from '../../utils/cn';
import { TrayFeedGuide } from './TrayFeedGuide';


// ”€”€”€ WEATHER SIMULATION ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
const getSimulatedWeather = () => {
  const hour = new Date().getHours();
  const month = new Date().getMonth() + 1;
  const baseTemp = month >= 3 && month <= 5 ? 34 : month >= 6 && month <= 9 ? 30 : 27;
  const temp = baseTemp - (hour < 6 || hour > 18 ? 5 : 0);
  const humidity = month >= 6 && month <= 9 ? 88 : 70;
  const isRaining = month >= 6 && month <= 9 && Math.random() > 0.7;
  const windSpeed = isRaining ? 22 : 12;
  const doLevel = temp > 32 ? 'LOW' : isRaining ? 'MEDIUM' : 'HIGH';
  return { temp, humidity, windSpeed, isRaining, doLevel };
};

// ”€”€”€ EXACT FARMER SOP LOGIC ”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€”€
const getSopData = (doc: number) => {
  const survivalPct = Math.max(0.80, 1 - (doc * 0.002));
  let avgWeightG = 0;
  let feedRatePct = 0;
  let staticKg = 0;
  let slotCount = 4;
  
  if (doc <= 3) { avgWeightG = 0.005; feedRatePct = 0; staticKg = 1.5; slotCount = 4; }
  else if (doc <= 7) { avgWeightG = 0.01; feedRatePct = 100; slotCount = 4; }
  else if (doc <= 10) { avgWeightG = 0.02; feedRatePct = 80; slotCount = 4; }
  else if (doc <= 15) { avgWeightG = 0.05; feedRatePct = 50; slotCount = 4; }
  else if (doc <= 20) { avgWeightG = 0.1; feedRatePct = 30; slotCount = 4; }
  else if (doc <= 25) { avgWeightG = 0.3; feedRatePct = 15; slotCount = 4; }
  else if (doc <= 30) { avgWeightG = 0.8; feedRatePct = 10; slotCount = 4; }
  else if (doc <= 35) { avgWeightG = 2.0; feedRatePct = 5.0; slotCount = 4; }
  else if (doc <= 40) { avgWeightG = 4.0; feedRatePct = 4.0; slotCount = 4; }
  else if (doc <= 45) { avgWeightG = 6.0; feedRatePct = 3.0; slotCount = 4; }
  else if (doc <= 50) { avgWeightG = 8.0; feedRatePct = 2.5; slotCount = 4; }
  else if (doc <= 55) { avgWeightG = 10.0; feedRatePct = 2.0; slotCount = 4; }
  else if (doc <= 60) { avgWeightG = 12.0; feedRatePct = 1.8; slotCount = 4; }
  else if (doc <= 70) { avgWeightG = 15.0; feedRatePct = 1.5; slotCount = 4; }
  else if (doc <= 80) { avgWeightG = 18.0; feedRatePct = 1.3; slotCount = 4; }
  else if (doc <= 90) { avgWeightG = 22.0; feedRatePct = 1.2; slotCount = 3; }
  else { avgWeightG = 28.0; feedRatePct = 1.0; slotCount = 3; }

  return { survivalPct, avgWeightG, feedRatePct, staticKg, slotCount };
};

const getFeedType = (doc: number): { type: string, no: string, size: string, protein: string } => {
  if (doc <= 15) return { type: 'Starter (Blind Feed)', no: 'Crumble No. 1', size: '0.4 - 0.8 mm', protein: '40%' };
  if (doc <= 30) return { type: 'Starter 2', no: 'Pellet No. 2', size: '1.0 - 1.2 mm', protein: '38%' };
  if (doc <= 60) return { type: 'Grower', no: 'Pellet No. 3', size: '1.5 - 1.8 mm', protein: '36%' };
  return { type: 'Finisher', no: 'Pellet No. 4', size: '2.0 - 2.5 mm', protein: '35%' };
}

const getTrayCheckTime = (doc: number) => {
  if (doc > 60) return '+1 Hr';
  if (doc >= 30) return '+1:30 Hrs';
  return '+2 Hrs';
};

// ─── TRAY FEED ENGINE ──────────────────────────────────────────────────────────
// Tray holds ~2–3% of total daily feed per slot (industry SOP).
// Formula: trayKg = (biomassKg * trayBiomassRatio) capped to slot qty
const getTrayGuide = (doc: number, pondSizeAcre: number, abwGrams: number) => {
  // Tray check only starts from DOC 20
  if (doc < 20) return null;

  // Tray feed ratio drops as shrimp grow bigger
  let trayRatioPct = 3.0; // % of total daily feed per slot in tray
  if (abwGrams >= 15) trayRatioPct = 2.0;
  if (abwGrams >= 20) trayRatioPct = 1.5;
  if (abwGrams >= 25) trayRatioPct = 1.0;

  // Standard: 1 tray per acre, sometimes 2 beyond DOC 60
  const trayCount = pondSizeAcre <= 1 ? 1 : Math.min(Math.floor(pondSizeAcre), 4);
  const checkTime = getTrayCheckTime(doc);

  // Decision table based on what farmer finds in tray
  const decisions: { find: string; action: string; icon: string; color: string }[] = [
    { find: 'Tray EMPTY before check time', action: 'Increase next slot by 10–15%. Shrimp appetite is HIGH.', icon: '🔺', color: 'text-emerald-500' },
    { find: 'Tray EMPTY exactly at check time', action: 'Feed quantity is PERFECT. No change needed.', icon: '✅', color: 'text-emerald-400' },
    { find: 'Tray has leftover ≤ 20%', action: 'Reduce next slot by 10%. Slight overfeeding.', icon: '⚠️', color: 'text-amber-500' },
    { find: 'Tray has leftover > 20%', action: 'Reduce next slot by 15–20%. Check DO and shrimp health.', icon: '🔻', color: 'text-red-500' },
    { find: 'Tray has RED/DARK pellets', action: 'STOP feeding. Check for disease or DO crash immediately.', icon: '🚨', color: 'text-red-600' },
  ];

  return { trayRatioPct, trayCount, checkTime, decisions };
};


const buildFeedSlots = (count: number, t: Translations) => {
  if (count === 5) return [
    { time: '06:00 AM', hour: 6, label: t.morning1 },
    { time: '10:00 AM', hour: 10, label: t.morning2 },
    { time: '02:00 PM', hour: 14, label: t.afternoon },
    { time: '05:00 PM', hour: 17, label: t.evening1 },
    { time: '08:30 PM', hour: 20, label: t.evening2 }
  ];
  if (count === 4) return [
    { time: '06:00 AM', hour: 6, label: t.morning1 },
    { time: '10:00 AM', hour: 10, label: t.morning2 },
    { time: '02:00 PM', hour: 14, label: t.afternoon },
    { time: '05:00 PM', hour: 17, label: t.evening1 }
  ];
  return [
    { time: '07:00 AM', hour: 7, label: t.morning1 },
    { time: '01:00 PM', hour: 13, label: t.afternoon },
    { time: '05:00 PM', hour: 17, label: t.evening1 }
  ];
};

interface Adjustment { factor: number; label: string; reason: string; color: string; bg: string; icon: React.ElementType; }
const getAdjustments = (weather: ReturnType<typeof getSimulatedWeather>, lunarPhase: MoonPhase, t: Translations): Adjustment[] => {
  const adj: Adjustment[] = [];
  if (weather.temp >= 34) adj.push({ factor: 0.80, label: `${t.heatStress} -20%`, reason: `Temp ${weather.temp}°C limits digestion`, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: Thermometer });
  if (weather.isRaining) adj.push({ factor: 0.85, label: `${t.rainEvent} -15%`, reason: 'Rain lowers dissolved oxygen', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: Droplets });
  
  if (lunarPhase === 'AMAVASYA') adj.push({ factor: 0.75, label: `🌑 Amavasya -25%`, reason: 'High mass molting energy demand', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', icon: Zap });
  else if (lunarPhase === 'POURNAMI') adj.push({ factor: 1.0, label: `🌕 Pournami +0%`, reason: 'High biological activity', color: 'text-indigo-300', bg: 'bg-indigo-400/10 border-indigo-400/20', icon: Zap });
  else if (lunarPhase === 'ASHTAMI') adj.push({ factor: 0.90, label: `🌓 Ashtami -10%`, reason: 'Molting initiation risk', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', icon: Zap });
  else if (lunarPhase === 'NAVAMI') adj.push({ factor: 0.85, label: `🌙 Navami -15%`, reason: 'Molting peak risk', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', icon: Zap });

  if (weather.doLevel === 'LOW') adj.push({ factor: 0.70, label: `${t.lowDOAdjustment} -30%`, reason: 'Extremely poor oxygen levels', color: 'text-red-500', bg: 'bg-red-600/10 border-red-600/20', icon: Waves });
  return adj;
};

export const FeedManagement = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, feedLogs, addFeedLog, theme, serverError, isOffline } = useData();

  // Only show active / planned ponds — never harvested ones in Feed
  const activePonds = ponds.filter(p => p.status === 'active' || p.status === 'planned');
  const [selectedPondId, setSelectedPondId] = useState(activePonds[0]?.id || '');

  // ── Persist completed slots per pond per day ──
  const todayKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const getSlotsKey = (pondId: string) => `aqua_feed_slots_${pondId}_${todayKey}`;

  const [syncedSlots, setSyncedSlots] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(getSlotsKey(activePonds[0]?.id || ''));
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // ── Re-load slots & tray ABW when pond changes ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem(getSlotsKey(selectedPondId));
      setSyncedSlots(saved ? JSON.parse(saved) : []);
    } catch { setSyncedSlots([]); }
    try {
      const savedAbw = localStorage.getItem(`aqua_tray_abw_${selectedPondId}`);
      setConfirmedTrayAbw(savedAbw ? parseFloat(savedAbw) : null);
    } catch { setConfirmedTrayAbw(null); }
    // Reload tray-enabled flag for new pond selection
    try {
      setTrayEnabled(localStorage.getItem(`aqua_tray_enabled_${selectedPondId}`) === '1');
    } catch { setTrayEnabled(false); }
  }, [selectedPondId]);

  const [activeTab, setActiveTab] = useState<'schedule' | 'fcr' | 'sow' | 'tray' | 'chat'>('schedule');
  const [expandedDetails, setExpandedDetails] = useState(false);

  // ── Tray confirmation state ──
  const getTrayKey = (pondId: string) => `aqua_tray_abw_${pondId}`;
  const [trayAbwInput, setTrayAbwInput] = useState('');
  const [confirmedTrayAbw, setConfirmedTrayAbw] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(`aqua_tray_abw_${activePonds[0]?.id || ''}`);
      return saved ? parseFloat(saved) : null;
    } catch { return null; }
  });
  // ── Tray-enabled flag (separate from ABW; farmer must confirm before trays start) ──
  const [trayEnabled, setTrayEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem(`aqua_tray_enabled_${activePonds[0]?.id || ''}`) === '1'; }
    catch { return false; }
  });
  // 0 = closed, 1 = step-1 (enable confirmation), 2 = step-2 (ABW entry)
  const [traySetupStep, setTraySetupStep] = useState<0|1|2>(0);
  // Alias for backwards-compat with any remaining showTraySetup references
  const showTraySetup = traySetupStep === 2;
  const [now, setNow] = useState(new Date());
  const [weather] = useState(getSimulatedWeather());

  const isDark = theme === 'dark' || theme === 'midnight';

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedPond = activePonds.find(p => p.id === selectedPondId);
  const currentDoc = selectedPond ? calculateDOC(selectedPond.stockingDate) : 0;
  

  // ”€”€ toggleSlot is defined further below after computed values ”€”€
  // (biomassKg, totalFeedConsumed, combinedFactor need to be in scope)

  const sop = useMemo(() => getSopData(currentDoc), [currentDoc]);
  const feedProfile = useMemo(() => getFeedType(currentDoc), [currentDoc]);
  const feedSlots = useMemo(() => buildFeedSlots(sop.slotCount, t), [sop.slotCount, t]);
  const lunar = useMemo(() => getLunarStatus(new Date()), []);
  const adjustments = useMemo(() => getAdjustments(weather, lunar.phase, t), [weather, lunar.phase, t]);
  const combinedFactor = useMemo(() => Math.max(0.5, adjustments.reduce((acc, a) => acc * a.factor, 1.0)), [adjustments]);

  const seedCount = selectedPond?.seedCount || 100000;
  const survivalRate = sop.survivalPct * 100;
  const currentPopulation = Math.round(seedCount * sop.survivalPct);
  const biomassKg = Math.round((currentPopulation * sop.avgWeightG) / 1000);
  
  const rawDailyKg = sop.feedRatePct === 0 ? sop.staticKg : Math.round((biomassKg * sop.feedRatePct) / 100);
  const adjustedDailyKg = Math.round(rawDailyKg * combinedFactor);
  const kgPerSlot = (adjustedDailyKg / (sop.slotCount || 1)).toFixed(1);

  // Next feed timer logic
  const nextFeedSlot = feedSlots.find(s => s.hour > now.getHours()) || feedSlots[0];
  const targetTime = new Date();
  targetTime.setHours(nextFeedSlot.hour, nextFeedSlot.hour === 6 ? 0 : 30, 0);
  if (nextFeedSlot.hour <= now.getHours()) targetTime.setDate(targetTime.getDate() + 1);
  const diffMs = targetTime.getTime() - now.getTime();
  const countdownH = Math.floor(diffMs / (1000 * 60 * 60));
  const countdownM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  // ”€”€ FCR gauge & compliance for current pond
  const pondFeedLogs = feedLogs.filter(l => l.pondId === selectedPondId);
  const totalFeedConsumed = pondFeedLogs.reduce((a, l) => a + l.quantity, 0);
  const fcrValue = biomassKg > 0 ? totalFeedConsumed / biomassKg : 0;
  const fcrHealthy = fcrValue < 1.4;
  const fcrWarning = fcrValue >= 1.4 && fcrValue < 1.7;
  const fcrCritical = fcrValue >= 1.7;
  const todayFedKg = pondFeedLogs
    .filter(l => new Date(l.date).toDateString() === now.toDateString())
    .reduce((a, l) => a + l.quantity, 0);
  const todayCompliance = adjustedDailyKg > 0 ? Math.min(100, Math.round((todayFedKg / adjustedDailyKg) * 100)) : 0;
  const slotsCompleted = syncedSlots.length;
  const isCriticalStage = currentDoc >= 31 && currentDoc <= 45;

  // ── Tray feed computed values ──
  const pondSizeAcre = parseFloat(String(selectedPond?.size || 1)) || 1;
  // Use farmer-confirmed ABW; if not set, fall back to SOP estimate
  const effectiveAbw = confirmedTrayAbw !== null ? confirmedTrayAbw : sop.avgWeightG;
  const trayGuide = useMemo(
    () => getTrayGuide(currentDoc, pondSizeAcre, effectiveAbw),
    [currentDoc, pondSizeAcre, effectiveAbw]
  );
  const trayKgPerSlot = trayGuide
    ? parseFloat(((adjustedDailyKg * trayGuide.trayRatioPct) / 100 / (sop.slotCount || 1)).toFixed(2))
    : 0;
  // Show setup prompt exactly once when DOC crosses 20 and farmer hasn't enabled trays yet
  const needsTraySetup = currentDoc >= 20 && !trayEnabled;
  // Intercept tray tab: if DOC>=20 and not enabled, open confirmation instead
  const handleTrayTabClick = () => {
    if (currentDoc >= 20 && !trayEnabled) {
      setTrayAbwInput(sop.avgWeightG.toFixed(2));
      setTraySetupStep(1); // start at step 1 — Enable confirmation
    } else {
      setActiveTab('tray');
    }
  };

  // ”€”€ Daily Sequence slot log handler (needs biomassKg, totalFeedConsumed, combinedFactor) ”€”€”€”€”€
  const toggleSlot = async (slotTime: string, kg: string, slotLabel: string) => {
    if (syncedSlots.includes(slotTime) || !selectedPond) return;
    // Guard: can't log when offline — API call will fail silently
    if (isOffline) {
      alert(t.offlineFeedLog);
      return;
    }
    const feedKg = Number(kg);
    const feedPricePerKg = currentDoc <= 15 ? 90 : currentDoc <= 30 ? 75 : currentDoc <= 60 ? 68 : 62;
    const slotCost = Math.round(feedKg * feedPricePerKg);
    const profile = getFeedType(currentDoc);
    const runningFCR = biomassKg > 0 ? (totalFeedConsumed + feedKg) / biomassKg : 0;

    if (addFeedLog) {
      await addFeedLog({
        pondId:           selectedPond.id,
        date:             new Date().toISOString(),
        time:             slotTime,
        slotLabel:        slotLabel,
        brand:            profile.type,
        feedType:         profile.type,
        feedNo:           profile.no,
        quantity:         feedKg,
        cost:             slotCost,
        doc:              currentDoc,
        fcr:              parseFloat(runningFCR.toFixed(3)),
        adjustmentFactor: parseFloat(combinedFactor.toFixed(3)),
        notes:            `Daily Sequence: ${slotLabel} (${slotTime}) -” ${feedKg}kg ${profile.no} @ ‚¹${feedPricePerKg}/kg = ‚¹${slotCost}. DOC ${currentDoc}. Adj: ${combinedFactor.toFixed(2)}.`,
      } as any);
    }
    setSyncedSlots(prev => {
      const next = [...prev, slotTime];
      try { localStorage.setItem(getSlotsKey(selectedPond.id), JSON.stringify(next)); } catch {}
      return next;
    });
  };



  return (
    <div className="pb-32 min-h-[100dvh] font-sans relative overflow-hidden transition-colors duration-500"
      style={{ background: isDark ? '#010C14' : '#EEF4F0' }}>

      {/* Ambient Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={cn("absolute -top-20 -right-20 w-96 h-96 rounded-full blur-[160px]", isDark ? "bg-emerald-600/15" : "bg-emerald-400/12")} />
        <div className={cn("absolute bottom-20 -left-20 w-80 h-80 rounded-full blur-[140px]", isDark ? "bg-teal-500/10" : "bg-blue-400/8")} />
        <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[120px]", isDark ? "bg-emerald-900/20" : "bg-emerald-100/60")} />
      </div>

      {/* ”€”€ Header ”€”€ */}
      <header className={cn(
        "fixed top-0 left-0 right-0 max-w-[420px] mx-auto z-50 px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3",
        "flex items-center justify-between border-b backdrop-blur-xl transition-all",
        isDark ? "bg-[#030E1B]/90 border-white/5" : "bg-white/95 border-slate-100 shadow-sm"
      )}>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/dashboard')}
          className={cn("w-9 h-9 rounded-xl flex items-center justify-center border",
            isDark ? "bg-white/5 border-white/10 text-white/60" : "bg-white border-slate-200 text-slate-500 shadow-sm")}>
          <ChevronLeft size={16} />
        </motion.button>
        <div className="text-center">
          <h1 className={cn("text-[11px] font-black tracking-widest uppercase", isDark ? "text-white" : "text-slate-900")}>Feed Intelligence</h1>
          <p className={cn("text-[7.5px] font-black uppercase tracking-[0.2em] mt-0.5", isDark ? "text-emerald-400/70" : "text-emerald-600")}>SOP-Driven &bull; DOC Auto-Calculated</p>
        </div>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border",
          isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200")}>
          <Fish size={14} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
        </div>
      </header>

      {/* ── Offline Banner ── */}
      {isOffline && (
        <div className={cn(
          'fixed top-[calc(env(safe-area-inset-top)+3.8rem)] left-0 right-0 max-w-[420px] mx-auto z-40 px-4'
        )}>
          <div className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-[8px] font-black uppercase tracking-widest',
            isDark
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
              : 'bg-amber-50 border-amber-300 text-amber-700'
          )}>
            <WifiOff size={11} className="flex-shrink-0" />
            <span>Offline — Showing cached data. Feed logging disabled until connected.</span>
          </div>
        </div>
      )}

      <div className="pt-[calc(env(safe-area-inset-top)+4.5rem)] px-4 max-w-[420px] mx-auto relative z-10 space-y-4">

        {/* ”€”€ Pond Tabs ”€”€ */}
        {activePonds.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none no-scrollbar">
            {activePonds.map(p => (
              <button key={p.id}
                onClick={() => { setSelectedPondId(p.id); }}
                className={cn(
                  'px-3.5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex-shrink-0',
                  selectedPondId === p.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20'
                    : isDark ? 'bg-white/5 text-white/40 border-white/8 hover:bg-white/10' : 'bg-white text-slate-500 border-slate-100 shadow-sm'
                )}>
                🐟 {p.name} <span className="opacity-60 ml-1">D{calculateDOC(p.stockingDate)}</span>
              </button>
            ))}
          </div>
        ) : serverError ? (
          // ── Server unreachable — show offline state instead of NoPondState ──
          <div className="mt-8">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="flex flex-col items-center text-center px-5 py-8"
            >
              {/* Icon */}
              <div className="relative mb-4">
                <div className={cn(
                  'absolute inset-0 rounded-[1.5rem] blur-[20px] opacity-25',
                  isDark ? 'bg-red-500' : 'bg-red-400'
                )} />
                <div className={cn(
                  'relative w-16 h-16 rounded-[1.5rem] flex items-center justify-center border',
                  isDark ? 'bg-[#1A0A10] border-red-500/25' : 'bg-red-50 border-red-200'
                )}>
                  <motion.div
                    animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                    className={cn('absolute w-full h-full rounded-[1.5rem]', isDark ? 'bg-red-500/15' : 'bg-red-200/50')}
                  />
                  <WifiOff size={28} className={isDark ? 'text-red-400' : 'text-red-500'} />
                </div>
              </div>

              <h2 className={cn('text-base font-black tracking-tight mb-1', isDark ? 'text-white' : 'text-slate-900')}>
                Server Unreachable
              </h2>
              <p className={cn('text-[10px] font-medium leading-relaxed mb-5 max-w-[220px]', isDark ? 'text-white/40' : 'text-slate-500')}>
                Could not connect to AquaGrow servers. Check your internet connection and try again.
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => window.location.reload()}
                className={cn(
                  'px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-[0.18em] flex items-center gap-2',
                  isDark
                    ? 'bg-white/8 border border-white/10 text-white/70'
                    : 'bg-slate-100 border border-slate-200 text-slate-600'
                )}
              >
                <RefreshCw size={12} strokeWidth={3} />
                Retry Connection
              </motion.button>
            </motion.div>
          </div>
        ) : (
          <div className="mt-8">
            <NoPondState isDark={isDark} subtitle="Add a pond to start tracking daily feed schedules and FCR analytics." />
          </div>
        )}

        {!selectedPond ? null : selectedPond.status === 'planned' ? (
          /* ”€”€ Pre-Stocking ”€”€ */
          <div className={cn("rounded-[2rem] p-5 border space-y-4 relative overflow-hidden",
            isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
            <div className="absolute -top-8 -right-8 opacity-[0.04]"><Leaf size={160} /></div>

            <div className={cn("flex items-center gap-3 p-4 rounded-2xl border",
              isDark ? "bg-indigo-500/8 border-indigo-500/15" : "bg-indigo-50 border-indigo-100")}>
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0",
                isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100 text-indigo-600")}>
                <Info size={18} />
              </div>
              <div>
                <p className={cn("text-[9px] font-black uppercase tracking-widest", isDark ? "text-indigo-400" : "text-indigo-700")}>Pre-Stocking Phase</p>
                <h2 className={cn("text-sm font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                  {selectedPond.species || 'Vannamei'} Feed Prep Protocol
                </h2>
              </div>
            </div>

            {/* Starter Feed Specs */}
            <div className={cn("p-4 rounded-2xl border space-y-2", isDark ? "bg-blue-500/5 border-blue-500/15" : "bg-blue-50 border-blue-100")}>
              <p className={cn("text-[8px] font-black uppercase tracking-widest mb-2", isDark ? "text-blue-400" : "text-blue-700")}> Required Starter Feed</p>
              {(selectedPond.species === 'Tiger' ? [
                { label: 'Feed Type', value: 'Crumble No.1 (Tiger)' },
                { label: 'Protein', value: '42% minimum' },
                { label: 'Pellet Size', value: '0.4 -“ 0.6 mm' },
                { label: 'Daily Rate', value: '1.2-“1.5 kg/acre/day' },
                { label: 'Frequency', value: '4x daily (blind feed)' },
              ] : [
                { label: 'Feed Type', value: 'Crumble No.1 (Vannamei)' },
                { label: 'Protein', value: '40% minimum' },
                { label: 'Pellet Size', value: '0.4 -“ 0.8 mm' },
                { label: 'Daily Rate', value: '1.0-“1.5 kg/acre/day' },
                { label: 'Frequency', value: '4x daily (blind feed)' },
              ]).map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-blue-200/20 last:border-0">
                  <span className={cn("text-[9px] font-bold", isDark ? "text-white/40" : "text-slate-500")}>{item.label}</span>
                  <span className={cn("text-[9px] font-black", isDark ? "text-white" : "text-slate-800")}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* 30-Day Transition Plan */}
            <div className={cn("p-4 rounded-2xl border", isDark ? "bg-emerald-500/5 border-emerald-500/15" : "bg-emerald-50 border-emerald-100")}>
              <p className={cn("text-[8px] font-black uppercase tracking-widest mb-2", isDark ? "text-emerald-400" : "text-emerald-700")}>📅 First 30 Days Transition</p>
              <div className="space-y-2">
                {[
                  { phase: 'DOC 1-“3', feed: 'Blind Feed · Scatter evenly', type: 'Crumble No.1' },
                  { phase: 'DOC 4-“15', feed: 'Crumble + Start tray checks', type: '40%+ protein' },
                  { phase: 'DOC 16-“30', feed: 'Pellet No.2 · 3-day transition', type: '38% protein' },
                ].map((row, i) => (
                  <div key={i} className={cn("flex items-center justify-between p-2.5 rounded-xl",
                    isDark ? "bg-black/20" : "bg-white/70")}>
                    <div>
                      <p className={cn("text-[9px] font-black", isDark ? "text-emerald-400" : "text-emerald-700")}>{row.phase}</p>
                      <p className={cn("text-[8px] font-medium", isDark ? "text-white/30" : "text-slate-400")}>{row.feed}</p>
                    </div>
                    <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-lg",
                      isDark ? "bg-white/5 text-white/60" : "bg-slate-100 text-slate-600")}>{row.type}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => navigate('/medicine')}
                className={cn("flex-1 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all",
                  isDark ? "bg-white/5 border border-white/10 text-white/60" : "bg-slate-100 text-slate-600")}>
                Medicine SOP
              </button>
              <button onClick={() => navigate('/ponds')}
                className="flex-1 py-3 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                Set Stocking Date †’
              </button>
            </div>
          </div>

        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={selectedPond.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

              {/* • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • 
                  HERO COMMAND CARD
              • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •  */}
              <div className="rounded-[2rem] overflow-hidden shadow-2xl relative"
                style={{ background: 'linear-gradient(150deg, #011c15 0%, #023d2b 25%, #047857 55%, #059669 78%, #10b981 100%)' }}>
                {/* Mesh pattern */}
                <div className="absolute inset-0 opacity-[0.05]"
                  style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                {/* Glow orbs */}
                <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-emerald-400/10 blur-[80px] rounded-full" />
                <div className="absolute top-4 left-8 w-32 h-32 bg-teal-300/5 blur-[60px] rounded-full" />

                <div className="relative z-10 p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-emerald-200/40 text-[7px] font-black uppercase tracking-[0.35em] mb-1">
                        {t.feedCommandCenter}
                      </p>
                      <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-2">
                        {selectedPond.name}
                      </h2>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-white tracking-tighter leading-none" style={{textShadow:'0 2px 20px rgba(52,211,153,0.3)'}}>{adjustedDailyKg}</span>
                        <span className="text-base text-emerald-300 font-black">kg/day</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {/* Feed type pill */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[8px] font-black text-emerald-100 uppercase tracking-widest">
                          <Package size={9} /> {feedProfile.no}
                        </span>
                        {/* Adjustment pill */}
                        {combinedFactor !== 1.0 && (
                          <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest",
                            combinedFactor < 1 ? "bg-red-500/20 border-red-400/30 text-red-200" : "bg-emerald-400/20 border-emerald-300/30 text-emerald-100")}>
                            {combinedFactor < 1.0 ? <TrendingDown size={9} /> : <TrendingUp size={9} />}
                            {combinedFactor < 1.0 ? '-' : '+'}{Math.abs((1 - combinedFactor) * 100).toFixed(0)}% adj
                          </span>
                        )}
                      </div>
                    </div>

                    {/* FCR Ring */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="relative w-20 h-20">
                        <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                          <circle cx="18" cy="18" r="15.9" fill="none"
                            stroke={fcrCritical ? '#f87171' : fcrWarning ? '#fbbf24' : '#34d399'}
                            strokeWidth="2.5" strokeLinecap="round"
                            strokeDasharray={`${Math.min(100, (fcrValue / 2.0) * 100)} 100`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-black text-white leading-none">{fcrValue > 0 ? fcrValue.toFixed(1) : '-”'}</span>
                          <span className="text-[6px] font-black text-emerald-300/60 uppercase tracking-widest">FCR</span>
                        </div>
                      </div>
                      <span className={cn("text-[7px] font-black uppercase tracking-widest",
                        fcrCritical ? 'text-red-300' : fcrWarning ? 'text-amber-300' : 'text-emerald-300')}>
                        {fcrCritical ? 'š  High' : fcrWarning ? '● Watch' : 'œ“ Good'}
                      </span>
                    </div>
                  </div>

                  {/* Adjustments row */}
                  {adjustments.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {adjustments.map((a, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/25 border border-white/10 text-[7.5px] font-black text-white/70">
                          <a.icon size={8} className={a.color} /> {a.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
                    {[
                      { label: 'Biomass', value: `${biomassKg}kg`, icon: Scale },
                      { label: 'Per Slot', value: `${kgPerSlot}kg`, icon: Activity },
                      { label: 'Protein', value: feedProfile.protein, icon: Leaf },
                    ].map((m, i) => (
                      <div key={i} className="text-center">
                        <m.icon size={11} className="text-emerald-300/50 mx-auto mb-0.5" />
                        <p className="text-sm font-black text-white leading-none">{m.value}</p>
                        <p className="text-[6.5px] font-black text-emerald-200/40 uppercase tracking-widest mt-0.5">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Compliance bar */}
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[7.5px] font-black text-emerald-200/50 uppercase tracking-widest">Today's Compliance</p>
                      <p className="text-[8.5px] font-black text-white/80">{slotsCompleted}/{feedSlots.length} slots &bull; {todayCompliance}%</p>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${todayCompliance}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={cn('h-full rounded-full', todayCompliance >= 80 ? 'bg-emerald-400' : todayCompliance >= 50 ? 'bg-amber-400' : 'bg-red-400')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* WSSV Critical Alert */}
              {isCriticalStage && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className={cn('rounded-2xl p-3.5 border flex items-start gap-3',
                    isDark ? 'bg-red-500/8 border-red-500/25' : 'bg-red-50 border-red-200')}>
                  <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-red-400' : 'text-red-700')}>
                      WSSV Risk · DOC {currentDoc} -” Critical Window
                    </p>
                    <p className={cn('text-[8px] font-medium mt-0.5 leading-snug', isDark ? 'text-red-300/60' : 'text-red-600/70')}>
                      Reduce feed 10% if tail redness observed. Monitor tray residue closely after each slot.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* •• TRAY SETUP PROMPT (first time DOC ≥ 20) •• */}
              {needsTraySetup && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className={cn('rounded-2xl p-4 border flex items-start gap-3',
                    isDark ? 'bg-amber-500/10 border-amber-500/25' : 'bg-amber-50 border-amber-300')}
                >
                  <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Eye size={18} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-amber-400' : 'text-amber-700')}>
                      🔬 Tray Feed Starts Now — DOC {currentDoc}
                    </p>
                    <p className={cn('text-[8px] font-medium mt-0.5 leading-snug', isDark ? 'text-amber-300/70' : 'text-amber-800/80')}>
                      Your shrimp have crossed DOC 20. Feed trays must now be used to monitor appetite. Tap below to confirm and set up tray monitoring.
                    </p>
                    <button
                      onClick={() => { setTrayAbwInput(sop.avgWeightG.toFixed(2)); setTraySetupStep(1); }}
                      className="mt-2.5 px-4 py-1.5 bg-amber-500 text-white rounded-xl text-[8px] font-black uppercase tracking-widest"
                    >
                      Enable Tray Monitoring →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* •• TABS •• */}
              <div className={cn("flex rounded-[1.6rem] border gap-1 p-1.5",
                isDark ? "bg-black/30 border-white/8" : "bg-slate-100 border-slate-200 shadow-inner")}>
                {([
                  { id: 'schedule', icon: Clock,         label: 'Plan'  },
                  { id: 'tray',     icon: Eye,           label: 'Tray'  },
                  { id: 'sow',      icon: Scale,         label: 'SOP'   },
                  { id: 'fcr',      icon: Activity,      label: 'FCR'   },
                  { id: 'chat',     icon: MessageSquare, label: 'Chat'  },
                ] as const).map(tab => {
                  const isActive = activeTab === tab.id;
                  const hasDot   = tab.id === 'tray' && currentDoc >= 20 && !trayEnabled;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => tab.id === 'tray' ? handleTrayTabClick() : setActiveTab(tab.id)}
                      className={cn(
                        "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 rounded-[1.2rem] transition-all duration-200 relative",
                        isActive
                          ? isDark
                            ? "bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-900/40"
                            : "bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-300/40"
                          : isDark
                            ? "text-white/35 hover:text-white/65 hover:bg-white/8"
                            : "text-slate-400 hover:text-slate-700 hover:bg-white/60"
                      )}
                    >
                      <tab.icon size={11} strokeWidth={isActive ? 3 : 2} />
                      <span className="text-[6.5px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
                      {hasDot && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full border border-black/20 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ••••••••••••••••••••••••••••••••••
                  TAB: DAILY PLAN (SCHEDULE)
              •••••••••••••••••••••••••••••••••• */}
              {activeTab === 'schedule' && (
                <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">

                  {/* Next slot countdown */}
                  <div className={cn("rounded-2xl border flex items-center justify-between px-4 py-3",
                    isDark ? "bg-white/[0.04] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
                    <div>
                      <p className={cn("text-[7.5px] font-black uppercase tracking-widest mb-0.5",
                        isDark ? "text-emerald-400/70" : "text-emerald-600")}>Next Feed Slot</p>
                      <p className={cn("text-sm font-black", isDark ? "text-white" : "text-slate-800")}>
                        {nextFeedSlot.label} <span className={cn("text-[9px] font-bold ml-1", isDark ? "text-white/40" : "text-slate-400")}>{nextFeedSlot.time}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[
                        { val: countdownH.toString().padStart(2,'0'), unit:'HRS' },
                        { val: countdownM.toString().padStart(2,'0'), unit:'MIN' },
                      ].map((t, i) => (
                        <div key={i} className={cn("w-12 h-11 rounded-xl flex flex-col items-center justify-center border",
                          isDark ? "bg-black/30 border-emerald-500/20" : "bg-emerald-50 border-emerald-100")}>
                          <span className={cn("text-base font-black leading-none", isDark ? "text-emerald-400" : "text-emerald-700")}>{t.val}</span>
                          <span className="text-[6px] font-black uppercase tracking-widest opacity-50 mt-0.5">{t.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feed profile card */}
                  <div className={cn("flex items-center justify-between px-4 py-3 rounded-2xl border",
                    isDark ? "bg-blue-500/5 border-blue-500/15" : "bg-blue-50 border-blue-100")}>
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center",
                        isDark ? "bg-blue-500/15" : "bg-blue-100")}>
                        <Package size={14} className={isDark ? "text-blue-400" : "text-blue-600"} />
                      </div>
                      <div>
                        <p className={cn("text-[7px] font-black uppercase tracking-widest", isDark ? "text-blue-400/70" : "text-blue-500")}>Active Feed</p>
                        <p className={cn("text-sm font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>{feedProfile.no}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn("block text-[8px] font-black px-2.5 py-1 rounded-xl",
                        isDark ? "bg-blue-500/15 text-blue-300" : "bg-blue-100 text-blue-700")}>{feedProfile.protein}</span>
                      <p className={cn("text-[7px] font-bold mt-1", isDark ? "text-white/25" : "text-slate-400")}>{feedProfile.size}</p>
                    </div>
                  </div>

                  {/* ”€”€ Daily Sequence Slots ”€”€ */}
                  <div>
                    <p className={cn("text-[8px] font-black uppercase tracking-widest px-1 mb-2",
                      isDark ? "text-white/30" : "text-slate-400")}>Daily Sequence &bull; {feedSlots.length} slots</p>
                    <div className="space-y-2">
                      {feedSlots.map((slot, i) => {
                        const isNow = now.getHours() === slot.hour;
                        const isSynced = syncedSlots.includes(slot.time);
                        const isPast = now.getHours() > slot.hour && !isSynced;

                        return (
                          <motion.div key={i}
                            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className={cn("rounded-[1.6rem] border overflow-hidden transition-all duration-200",
                              isSynced
                                ? isDark
                                  ? "bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 border-emerald-500/30 shadow-md shadow-emerald-900/20"
                                  : "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 shadow-sm"
                                : isNow
                                ? isDark
                                  ? "bg-[#0A1E14] border-emerald-600/50 shadow-lg shadow-emerald-900/20"
                                  : "bg-white border-emerald-400 shadow-md shadow-emerald-100"
                                : isPast
                                ? isDark ? "bg-red-950/20 border-red-800/20" : "bg-red-50/50 border-red-200/60"
                                : isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm"
                            )}>
                            {/* Main row */}
                            <div className="flex items-center gap-3 px-4 py-3">
                              {/* Tap button */}
                              <motion.button whileTap={{ scale: 0.82 }}
                                onClick={() => toggleSlot(slot.time, kgPerSlot, slot.label)}
                                className={cn("w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all shadow-sm",
                                  isSynced
                                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/40"
                                    : isNow
                                    ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-700/40"
                                    : isPast
                                    ? "bg-gradient-to-br from-red-400 to-rose-500 text-white shadow-sm"
                                    : isDark
                                    ? "bg-white/8 border border-white/10 text-white/40 hover:bg-emerald-900/30 hover:border-emerald-600/30 hover:text-emerald-400"
                                    : "bg-slate-100 border border-slate-200 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600"
                                )}>
                                {isSynced ? <CheckCircle2 size={17} /> : <Clock size={16} />}
                              </motion.button>

                              {/* Slot info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className={cn("font-black text-[13px] tracking-tight",
                                    isSynced ? isDark ? "text-emerald-400" : "text-emerald-700"
                                    : isDark ? "text-white/90" : "text-slate-800")}>
                                    {slot.label}
                                  </p>
                                  {isNow && !isSynced && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[6.5px] font-black uppercase tracking-widest">
                                      <span className="w-1 h-1 bg-white rounded-full animate-pulse inline-block" />NOW
                                    </span>
                                  )}
                                  {isPast && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-500 border border-red-500/20 text-[6.5px] font-black uppercase tracking-widest">Missed</span>
                                  )}
                                  {isSynced && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[6.5px] font-black uppercase tracking-widest">Logged œ“</span>
                                  )}
                                </div>
                                <p className={cn("text-[8px] font-bold", isDark ? "text-white/30" : "text-slate-400")}>{slot.time}</p>
                              </div>

                              {/* Qty */}
                              <div className={cn("text-right px-3 py-2 rounded-xl border flex-shrink-0",
                                isSynced
                                  ? isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
                                  : isDark ? "bg-white/5 border-white/8" : "bg-slate-50 border-slate-200")}>
                                <p className={cn("text-lg font-black tracking-tighter leading-none",
                                  isSynced ? "text-emerald-500" : isDark ? "text-white" : "text-slate-900")}>{kgPerSlot}</p>
                                <p className={cn("text-[6.5px] font-black uppercase tracking-widest",
                                  isDark ? "text-white/25" : "text-slate-400")}>kg</p>
                              </div>
                            </div>
                            {/* Tray check footer */}
                            <div className={cn("px-4 py-2 border-t flex items-center justify-between",
                              isDark ? "bg-black/20 border-white/5" : "bg-slate-50/80 border-slate-100")}>
                              <div className="flex items-center gap-1.5">
                                <Eye size={9} className={isDark ? "text-white/25" : "text-slate-300"} />
                                <span className={cn("text-[7.5px] font-black uppercase tracking-widest",
                                  isDark ? "text-white/35" : "text-slate-400")}>Tray Check in {getTrayCheckTime(currentDoc)}</span>
                              </div>
                              <span className={cn("text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg",
                                isSynced
                                  ? isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                                  : isDark ? "bg-white/5 text-white/25" : "bg-white text-slate-400 border border-slate-100")}>
                                {isSynced ? 'Check Pending' : 'Awaiting Feed'}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ••••••••••••••••••••••••••••••••••
                  TAB: SOP DATA
              •••••••••••••••••••••••••••••••••• */}
              {/* TRAY INTELLIGENCE TAB */}
              {activeTab === 'tray' && (
                <TrayFeedGuide
                  doc={currentDoc}
                  pondSizeAcre={pondSizeAcre}
                  effectiveAbw={effectiveAbw}
                  confirmedTrayAbw={confirmedTrayAbw}
                  trayEnabled={trayEnabled}
                  trayKgPerSlot={trayKgPerSlot}
                  kgPerSlot={kgPerSlot}
                  feedSlots={feedSlots}
                  feedType={feedProfile.type}
                  isDark={isDark}
                  onRecalibrate={() => { setTrayAbwInput(effectiveAbw.toFixed(2)); setTraySetupStep(2); }}
                  onEnableTray={() => { setTrayAbwInput(sop.avgWeightG.toFixed(2)); setTraySetupStep(1); }}
                />
              )}

              {activeTab === 'sow' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className={cn("rounded-[2rem] border p-5 space-y-0",
                    isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
                    <p className={cn("text-[8px] font-black uppercase tracking-widest mb-4",
                      isDark ? "text-white/30" : "text-slate-400")}>Biomass Calculation</p>
                    {[
                      { label: 'Initial Stock', value: `${seedCount.toLocaleString()} PL`, color: 'text-blue-500' },
                      { label: 'Expected Survival Rate', value: `${survivalRate.toFixed(1)}%`, color: 'text-emerald-500' },
                      { label: 'Avg Body Weight (ABW)', value: `${sop.avgWeightG} g`, color: 'text-amber-500' },
                      { label: 'Current Population', value: `${currentPopulation.toLocaleString()} shrimp`, color: isDark ? 'text-white' : 'text-slate-800' },
                    ].map((row, i) => (
                      <div key={i} className={cn("flex justify-between items-center py-3 border-b last:border-0",
                        isDark ? "border-white/5" : "border-slate-100")}>
                        <span className={cn("text-[9px] font-bold", isDark ? "text-white/50" : "text-slate-500")}>{row.label}</span>
                        <span className={cn("text-[10px] font-black", row.color)}>{row.value}</span>
                      </div>
                    ))}
                    <div className={cn("mt-3 p-4 rounded-2xl border",
                      isDark ? "bg-emerald-500/5 border-emerald-500/15" : "bg-emerald-50 border-emerald-100")}>
                      <div className="flex justify-between items-center">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest",
                          isDark ? "text-emerald-400/70" : "text-emerald-700")}>Est. Total Biomass</span>
                        <span className={cn("text-xl font-black", isDark ? "text-emerald-400" : "text-emerald-700")}>
                          {biomassKg.toLocaleString()} <span className="text-xs opacity-60">kg</span>
                        </span>
                      </div>
                      <p className={cn("text-[7px] font-bold mt-1.5",
                        isDark ? "text-white/25" : "text-slate-400")}>
                        Formula: (Stock x SR%) x ABW / 1000
                      </p>
                    </div>
                  </div>

                  <div className={cn("rounded-[2rem] border p-5",
                    isDark ? "bg-blue-500/5 border-blue-500/15" : "bg-blue-50 border-blue-100")}>
                    <p className={cn("text-[8px] font-black uppercase tracking-widest mb-2",
                      isDark ? "text-blue-400" : "text-blue-700")}>Feed Rate Formula &bull; DOC {currentDoc}</p>
                    <p className={cn("text-[11px] font-black leading-snug",
                      isDark ? "text-white/70" : "text-slate-700")}>
                      {sop.feedRatePct > 0
                        ? `${biomassKg}kg biomass x ${sop.feedRatePct}% feed rate = ${rawDailyKg}kg raw`
                        : `Blind feed phase: flat ${sop.staticKg}kg/day`}
                    </p>
                    {combinedFactor !== 1.0 && (
                      <p className={cn("text-[9px] font-black mt-2",
                        isDark ? "text-amber-400" : "text-amber-700")}>
                        After adjustments: {rawDailyKg}kg x {combinedFactor.toFixed(2)} = <strong>{adjustedDailyKg}kg</strong>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ••••••••••••••••••••••••••••••••••
                  TAB: FCR TRACK
              •••••••••••••••••••••••••••••••••• */}
              {activeTab === 'fcr' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">

                  {/* Big FCR Display */}
                  <div className={cn("rounded-[2rem] border p-6 text-center relative overflow-hidden",
                    isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[60%] blur-[60px] rounded-full"
                      style={{ background: fcrCritical ? 'rgba(239,68,68,0.08)' : fcrWarning ? 'rgba(251,191,36,0.08)' : 'rgba(52,211,153,0.08)' }} />
                    <div className="relative z-10">
                      <p className={cn("text-[8px] font-black uppercase tracking-[0.3em] mb-2",
                        isDark ? "text-white/30" : "text-slate-400")}>Live Feed Conversion Ratio</p>
                      <div className={cn("text-7xl font-black tracking-tighter mb-2",
                        fcrCritical ? 'text-red-500' : fcrWarning ? 'text-amber-500' : isDark ? 'text-emerald-400' : 'text-emerald-600')}>
                        {fcrValue > 0 ? fcrValue.toFixed(2) : '-”'}
                      </div>
                      <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[8.5px] font-black",
                        fcrCritical
                          ? isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
                          : fcrWarning
                          ? isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
                          : isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700')}>
                        {fcrCritical ? 'š  High FCR -” Check overfeeding' : fcrWarning ? '● Monitor closely' : 'œ“ Excellent efficiency'}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Total Feed Logged', value: `${totalFeedConsumed} kg`, icon: Package, color: isDark ? 'text-white' : 'text-slate-800' },
                      { label: 'Est. Biomass', value: `${biomassKg} kg`, icon: Scale, color: 'text-emerald-500' },
                    ].map((s, i) => (
                      <div key={i} className={cn("rounded-[1.5rem] border p-4 text-center",
                        isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
                        <s.icon size={14} className={cn("mx-auto mb-2", s.color)} />
                        <p className={cn("text-lg font-black", s.color)}>{s.value}</p>
                        <p className={cn("text-[7px] font-black uppercase tracking-widest mt-0.5",
                          isDark ? "text-white/20" : "text-slate-400")}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* FCR Scale reference */}
                  <div className={cn("rounded-[1.5rem] border p-4",
                    isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
                    <p className={cn("text-[8px] font-black uppercase tracking-widest mb-3",
                      isDark ? "text-white/30" : "text-slate-400")}>FCR Reference Scale</p>
                    <div className="space-y-2">
                      {[
                        { range: '< 1.3', label: 'Excellent', color: 'bg-emerald-500', active: fcrValue < 1.3 && fcrValue > 0 },
                        { range: '1.3 -“ 1.6', label: 'Normal', color: 'bg-amber-400', active: fcrValue >= 1.3 && fcrValue < 1.7 },
                        { range: '> 1.7', label: 'High -” Review feed', color: 'bg-red-500', active: fcrValue >= 1.7 },
                      ].map((r, i) => (
                        <div key={i} className={cn("flex items-center gap-3 p-2.5 rounded-xl border transition-all",
                          r.active
                            ? isDark ? 'bg-white/5 border-white/15' : 'bg-slate-50 border-slate-200'
                            : isDark ? 'border-white/5' : 'border-transparent')}>
                          <div className={cn("w-2 h-6 rounded-full flex-shrink-0", r.color, !r.active && 'opacity-30')} />
                          <div className="flex-1">
                            <p className={cn("text-[9px] font-black", r.active ? isDark ? "text-white" : "text-slate-800" : isDark ? "text-white/30" : "text-slate-400")}>{r.range}</p>
                            <p className={cn("text-[7px] font-bold", isDark ? "text-white/20" : "text-slate-400")}>{r.label}</p>
                          </div>
                          {r.active && <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-white/10 text-white uppercase tracking-widest">Current</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent logs */}
                  {pondFeedLogs.length > 0 && (
                    <div className={cn("rounded-[1.5rem] border p-4",
                      isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
                      <p className={cn("text-[8px] font-black uppercase tracking-widest mb-3",
                        isDark ? "text-white/30" : "text-slate-400")}>Recent Feed Logs</p>
                      <div className="space-y-0">
                        {pondFeedLogs.slice(-5).reverse().map((log, i) => (
                          <div key={i} className={cn("flex items-center justify-between py-2.5 border-b last:border-0",
                            isDark ? "border-white/5" : "border-slate-100")}>
                            <div>
                              <p className={cn("text-[9px] font-black", isDark ? "text-white/70" : "text-slate-700")}>
                                {(log as any).slotLabel || new Date(log.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                              </p>
                              <p className={cn("text-[7px] font-bold", isDark ? "text-white/25" : "text-slate-400")}>
                                {(log as any).feedNo || 'Feed'} &bull; {new Date(log.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                              </p>
                            </div>
                            <span className={cn("text-[11px] font-black", isDark ? "text-emerald-400" : "text-emerald-600")}>+{log.quantity}kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ══════════════════════════════════════
                  TAB: FEED CHAT
              ══════════════════════════════════════ */}
              {activeTab === 'chat' && (() => {
                // ── Build 14-day chart data: actual fed vs SOP recommended ──
                const today = new Date();
                const last14: { day: string; actual: number; sop: number; doc: number; gap: number }[] = [];
                for (let i = 13; i >= 0; i--) {
                  const d = new Date(today);
                  d.setDate(today.getDate() - i);
                  const dStr = d.toDateString();
                  const docForDay = currentDoc - i;
                  if (docForDay < 1) continue;
                  const sopForDay = getSopData(docForDay);
                  const seedCnt = selectedPond?.seedCount || 100000;
                  const pop = Math.round(seedCnt * sopForDay.survivalPct);
                  const bm = Math.round((pop * sopForDay.avgWeightG) / 1000);
                  const sopKg = sopForDay.feedRatePct === 0 ? sopForDay.staticKg : Math.round((bm * sopForDay.feedRatePct) / 100);
                  const actual = pondFeedLogs
                    .filter(l => new Date(l.date).toDateString() === dStr)
                    .reduce((a, l) => a + l.quantity, 0);
                  last14.push({
                    day: `D${docForDay}`,
                    actual: parseFloat(actual.toFixed(1)),
                    sop: sopKg,
                    doc: docForDay,
                    gap: parseFloat((actual - sopKg).toFixed(1)),
                  });
                }

                const overDays  = last14.filter(d => d.gap > 1).length;
                const underDays = last14.filter(d => d.actual > 0 && d.gap < -1).length;
                const onTrack   = last14.filter(d => d.actual > 0 && Math.abs(d.gap) <= 1).length;
                const totalActual = last14.reduce((a, d) => a + d.actual, 0);
                const totalSop    = last14.reduce((a, d) => a + d.sop, 0);
                const efficiency  = totalSop > 0 ? Math.round((totalActual / totalSop) * 100) : 0;

                // ── SOP Intelligence cards ──
                const cards = [
                  {
                    id: 'today',
                    color: '#10b981',
                    icon: Target,
                    title: "Today's Target",
                    lines: [
                      `SOP Recommended: ${rawDailyKg} kg/day`,
                      `After ${adjustments.length > 0 ? adjustments.map(a => a.label).join(', ') : 'no adjustments'}: ${adjustedDailyKg} kg/day`,
                      `Per slot (${sop.slotCount}x): ${kgPerSlot} kg each`,
                      `Today fed so far: ${todayFedKg.toFixed(1)} kg (${todayCompliance}%)`,
                    ],
                  },
                  {
                    id: 'feedtype',
                    color: '#f59e0b',
                    icon: Package,
                    title: 'Feed Type (DOC ' + currentDoc + ')',
                    lines: [
                      `Type: ${feedProfile.type}`,
                      `Product: ${feedProfile.no}`,
                      `Pellet Size: ${feedProfile.size}`,
                      `Protein: ${feedProfile.protein}`,
                    ],
                  },
                  {
                    id: 'tray',
                    color: '#3b82f6',
                    icon: Eye,
                    title: 'Tray Check Timing',
                    lines: [
                      `Check your feed tray ${getTrayCheckTime(currentDoc)} after feeding`,
                      currentDoc > 60
                        ? 'Tray empty in 1hr = increase by 5-10%'
                        : currentDoc >= 30
                        ? 'Tray empty in 90min = increase by 5%'
                        : 'Blind phase — trays not needed',
                      'If tray has leftover, reduce next slot by 10%',
                    ],
                  },
                  {
                    id: 'fcr_chat',
                    color: fcrCritical ? '#ef4444' : fcrWarning ? '#f59e0b' : '#10b981',
                    icon: Activity,
                    title: 'FCR Intelligence',
                    lines: [
                      `Current FCR: ${fcrValue > 0 ? fcrValue.toFixed(2) : '--'} (Target: <1.4)`,
                      `Total feed consumed: ${totalFeedConsumed.toFixed(1)} kg`,
                      `Estimated biomass: ${biomassKg} kg`,
                      fcrCritical
                        ? 'HIGH FCR — Check overfeeding or poor tray clearing. Reduce next meal by 15%.'
                        : fcrWarning
                        ? 'FCR rising — Review tray checks and reduce feed 10%'
                        : 'FCR is healthy — keep current feeding rate',
                    ],
                  },
                  {
                    id: 'adjustments',
                    color: '#a855f7',
                    icon: Zap,
                    title: 'Active Adjustments',
                    lines: adjustments.length > 0
                      ? adjustments.map(a => `${a.label}: ${a.reason}`)
                      : ['No adjustments today — optimal conditions', 'Feed at full SOP rate', `Combined factor: 1.00x`],
                  },
                  {
                    id: 'wssv',
                    color: isCriticalStage ? '#ef4444' : '#64748b',
                    icon: AlertTriangle,
                    title: isCriticalStage ? 'WSSV Alert — Critical Stage' : 'Disease Risk This Stage',
                    lines: isCriticalStage
                      ? [
                          `DOC ${currentDoc} is inside WSSV critical window (DOC 31-45)`,
                          'Reduce feed by 20% as molting stress indicator',
                          'Run aerators 24/7. Test DO every 6 hrs.',
                          'Treat probiotics in feed: 10g/kg feed',
                        ]
                      : [
                          `DOC ${currentDoc} — Not in critical window`,
                          'Continue standard SOP feeding schedule',
                          'Monitor tray check times daily',
                        ],
                  },
                ];

                return (
                  <motion.div initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">

                    {/* Actual vs SOP chart */}
                    <div className={cn("rounded-[1.8rem] border p-4", isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/30" : "text-slate-400")}>Actual vs SOP Feed</p>
                          <p className={cn("text-[11px] font-black", isDark ? "text-white" : "text-slate-900")}>Last {last14.length} days <span className="font-normal text-[9px]" style={{ color: '#94a3b8' }}>DOC {currentDoc - last14.length + 1}–{currentDoc}</span></p>
                        </div>
                        <div className={cn("px-2.5 py-1 rounded-xl text-[7px] font-black uppercase tracking-widest border",
                          efficiency >= 90 ? isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700')}>
                          {efficiency}% on-track
                        </div>
                      </div>

                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={last14} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={2}>
                            <CartesianGrid vertical={false} stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'} />
                            <XAxis dataKey="day" tick={{ fontSize: 7, fontWeight: 900, fill: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)' }}
                              axisLine={false} tickLine={false} interval={1} />
                            <YAxis hide />
                            <Tooltip
                              cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
                              content={({ active, payload, label }: any) => {
                                if (!active || !payload?.length) return null;
                                const act = payload.find((p: any) => p.dataKey === 'actual')?.value || 0;
                                const sop = payload.find((p: any) => p.dataKey === 'sop')?.value || 0;
                                const gap = (act - sop).toFixed(1);
                                return (
                                  <div className="rounded-2xl border px-3 py-2 shadow-xl text-[9px] font-black"
                                    style={{ background: isDark ? '#051F19' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}>
                                    <p className="text-white/50 uppercase tracking-widest text-[7px] mb-1">{label}</p>
                                    <p style={{ color: '#10b981' }}>Actual: {act}kg</p>
                                    <p style={{ color: '#f59e0b' }}>SOP: {sop}kg</p>
                                    <p style={{ color: parseFloat(gap) >= 0 ? '#10b981' : '#ef4444' }}>Gap: {gap}kg</p>
                                  </div>
                                );
                              }}
                            />
                            <Bar dataKey="sop" name="SOP" fill={isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.3)'}
                              radius={[4, 4, 2, 2]} maxBarSize={14} />
                            <Bar dataKey="actual" name="Actual" radius={[4, 4, 2, 2]} maxBarSize={14}>
                              {last14.map((d, i) => (
                                <Cell key={i}
                                  fill={d.actual === 0 ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')
                                    : d.gap > 1 ? '#f59e0b'
                                    : d.gap < -1 ? '#ef4444'
                                    : '#10b981'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-3 mt-1">
                        {[
                          { color: '#f59e0b', label: 'SOP Target', dashed: true },
                          { color: '#10b981', label: 'On Track' },
                          { color: '#f59e0b', label: 'Over-fed' },
                          { color: '#ef4444', label: 'Under-fed' },
                        ].map((l, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-sm" style={{ background: l.color, opacity: l.dashed ? 0.4 : 1 }} />
                            <span className={cn("text-[6.5px] font-black uppercase tracking-widest", isDark ? "text-white/30" : "text-slate-400")}>{l.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Gap Analysis strip */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'On Track', value: onTrack, icon: Minus, color: '#10b981', bg: isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200' },
                        { label: 'Over-fed', value: overDays, icon: ArrowUp, color: '#f59e0b', bg: isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200' },
                        { label: 'Under-fed', value: underDays, icon: ArrowDown, color: '#ef4444', bg: isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200' },
                      ].map((m, i) => (
                        <div key={i} className={cn('rounded-[1.4rem] border p-3 text-center', m.bg)}>
                          <m.icon size={14} className="mx-auto mb-1" style={{ color: m.color }} />
                          <p className="text-base font-black" style={{ color: m.color }}>{m.value}</p>
                          <p className={cn('text-[6.5px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>{m.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* SOP Intelligence Chat Cards */}
                    <p className={cn("text-[8px] font-black uppercase tracking-widest px-1", isDark ? "text-white/25" : "text-slate-400")}>
                      Feed Intelligence &bull; DOC {currentDoc}
                    </p>

                    <div className="space-y-2.5">
                      {cards.map((card, ci) => (
                        <motion.div key={card.id}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: ci * 0.06 }}
                          className={cn("rounded-[1.6rem] border p-4", isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
                          {/* card header */}
                          <div className="flex items-center gap-2.5 mb-2.5">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: card.color + '18', boxShadow: `0 0 0 1px ${card.color}30` }}>
                              <card.icon size={13} style={{ color: card.color }} />
                            </div>
                            <p className={cn("text-[9.5px] font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>{card.title}</p>
                            <div className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: card.color }} />
                          </div>
                          {/* chat bubble lines */}
                          <div className="space-y-1.5">
                            {card.lines.map((line, li) => (
                              <div key={li} className="flex items-start gap-2">
                                <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: card.color + '80' }} />
                                <p className={cn("text-[8.5px] font-semibold leading-snug", isDark ? "text-white/60" : "text-slate-600")}>{line}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Cumulative efficiency meter */}
                    <div className={cn("rounded-[1.8rem] border p-4", isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/30" : "text-slate-400")}>Feed Efficiency</p>
                          <p className={cn("text-[11px] font-black", isDark ? "text-white" : "text-slate-900")}>Cumulative vs SOP</p>
                        </div>
                        <span className="text-xl font-black" style={{ color: efficiency >= 90 ? '#10b981' : efficiency >= 70 ? '#f59e0b' : '#ef4444' }}>
                          {efficiency}%
                        </span>
                      </div>
                      <div className={cn("h-2.5 rounded-full overflow-hidden", isDark ? "bg-white/8" : "bg-slate-100")}>
                        <motion.div initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, efficiency)}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: efficiency >= 90 ? 'linear-gradient(90deg,#059669,#34d399)' : efficiency >= 70 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#f87171)' }} />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className={cn("text-[7px] font-black uppercase tracking-widest", isDark ? "text-white/20" : "text-slate-400")}>Actual: {totalActual.toFixed(0)}kg</span>
                        <span className={cn("text-[7px] font-black uppercase tracking-widest", isDark ? "text-white/20" : "text-slate-400")}>SOP: {totalSop.toFixed(0)}kg</span>
                      </div>
                    </div>

                  </motion.div>
                );
              })()}

            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ━━ TRAY SETUP MODAL (Step 1: Enable Confirmation + Step 2: ABW Entry) ━━ */}
      <AnimatePresence>
        {traySetupStep > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end"
            onClick={() => setTraySetupStep(0)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className={cn('w-full max-w-md mx-auto rounded-t-[2.5rem] p-6 pb-12 border-t border-x', isDark ? 'bg-[#0A1810] border-amber-500/20' : 'bg-white border-amber-200')}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-ink/10 mx-auto mb-5" />

              {/* ── STEP 1: Enable Confirmation ── */}
              {traySetupStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Eye size={22} className="text-white" />
                    </div>
                    <div>
                      <h2 className={cn('font-black text-lg tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Enable Feed Tray?</h2>
                      <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-amber-400/70' : 'text-amber-600')}>
                        DOC {currentDoc} — Tray monitoring recommended
                      </p>
                    </div>
                  </div>

                  {/* Why tray info */}
                  <div className={cn('rounded-2xl p-4 border mb-4', isDark ? 'bg-amber-500/8 border-amber-500/15' : 'bg-amber-50 border-amber-100')}>
                    <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-amber-400' : 'text-amber-700')}>Why Feed Trays?</p>
                    {[
                      '🎯 Trays let you see exactly how much your shrimp are eating',
                      '📉 Prevents overfeeding → saves ₹200–₹500/day in feed waste',
                      '🦠 Leftover feed = DO crash = disease — trays catch this early',
                      '📊 Required for accurate FCR tracking from DOC 20 onwards',
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5">
                        <p className={cn('text-[9px] font-medium leading-snug', isDark ? 'text-amber-200/70' : 'text-amber-900/80')}>{tip}</p>
                      </div>
                    ))}
                  </div>

                  {/* Tray readiness checklist */}
                  <div className={cn('rounded-2xl p-3.5 border mb-5', isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-100')}>
                    <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/25' : 'text-slate-400')}>Before starting — do you have?</p>
                    {[
                      { item: `Feed tray(s) — 1 per ${pondSizeAcre <= 1 ? 'pond' : 'acre'}`, emoji: '🔵' },
                      { item: 'A way to measure shrimp weight (cast net + scale)', emoji: '⚖️' },
                      { item: 'Readiness to check tray 1–2 hrs after each feed slot', emoji: '⏰' },
                    ].map((c, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1">
                        <span className="text-sm flex-shrink-0">{c.emoji}</span>
                        <p className={cn('text-[9px] font-medium', isDark ? 'text-white/50' : 'text-slate-600')}>{c.item}</p>
                      </div>
                    ))}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTraySetupStep(0)}
                      className={cn('flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border',
                        isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-slate-100 border-slate-200 text-slate-500')}
                    >
                      Not Yet
                    </button>
                    <button
                      onClick={() => setTraySetupStep(2)}
                      className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-[0.98]"
                    >
                      Yes, Enable →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: ABW Entry ── */}
              {traySetupStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Eye size={22} className="text-white" />
                    </div>
                    <div>
                      <h2 className={cn('font-black text-lg tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Set Tray ABW</h2>
                      <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-amber-400/70' : 'text-amber-600')}>
                        Average Body Weight from cast net sample
                      </p>
                    </div>
                  </div>

                  {/* Info block */}
                  <div className={cn('rounded-2xl p-3.5 border mb-4', isDark ? 'bg-amber-500/5 border-amber-500/15' : 'bg-amber-50 border-amber-100')}>
                    <p className={cn('text-[9px] font-medium leading-relaxed', isDark ? 'text-amber-300/70' : 'text-amber-800')}>
                      🔬 Use your cast net or sample tray to measure 10–20 shrimp. Weigh them together and divide by count to get average grams per shrimp. This calibrates your tray feed quantity precisely.
                    </p>
                  </div>

                  {/* Weight input */}
                  <div className="mb-4">
                    <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/40' : 'text-slate-500')}>
                      Measured ABW (grams per shrimp)
                    </p>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={trayAbwInput}
                        onChange={e => setTrayAbwInput(e.target.value)}
                        placeholder="e.g. 0.35"
                        className={cn(
                          'w-full px-5 py-4 rounded-2xl border outline-none text-2xl font-black tracking-tight transition-all pr-16',
                          isDark
                            ? 'bg-white/5 border-amber-500/20 text-white placeholder:text-white/15 focus:border-amber-500/50'
                            : 'bg-amber-50 border-amber-200 text-slate-900 placeholder:text-slate-300 focus:border-amber-400 shadow-inner'
                        )}
                      />
                      <span className={cn('absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
                        g/shrimp
                      </span>
                    </div>
                    {trayAbwInput && parseFloat(trayAbwInput) > 0 && (
                      <p className={cn('text-[8px] font-bold mt-2 text-center', isDark ? 'text-amber-300/70' : 'text-amber-700')}>
                        SOP estimate for DOC {currentDoc} is {sop.avgWeightG.toFixed(2)}g — you entered <span className="font-black">{parseFloat(trayAbwInput).toFixed(2)}g</span>
                      </p>
                    )}
                  </div>

                  {/* SOP Guide */}
                  <div className={cn('rounded-2xl p-3 border mb-5', isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-100')}>
                    <p className={cn('text-[7px] font-black uppercase tracking-widest mb-1.5', isDark ? 'text-white/25' : 'text-slate-400')}>
                      How to measure ABW
                    </p>
                    {['Cast net or bucket sample 20–30 shrimp', 'Weigh all shrimp together on kitchen scale', 'Divide total weight (grams) by shrimp count', 'Enter that number above — done!'].map((s, i) => (
                      <div key={i} className="flex items-start gap-1.5 mb-1">
                        <span className="text-amber-500 font-black text-[8px] flex-shrink-0">{i + 1}.</span>
                        <p className={cn('text-[8px] font-medium', isDark ? 'text-white/40' : 'text-slate-500')}>{s}</p>
                      </div>
                    ))}
                  </div>

                  {/* Step buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTraySetupStep(1)}
                      className={cn('w-10 py-3.5 rounded-2xl font-black text-[10px] border flex items-center justify-center',
                        isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-slate-100 border-slate-200 text-slate-500')}
                    >
                      ←
                    </button>
                    <button
                      onClick={() => {
                        const val = parseFloat(trayAbwInput);
                        if (!val || val <= 0 || !selectedPond) return;
                        try {
                          localStorage.setItem(getTrayKey(selectedPond.id), String(val));
                          localStorage.setItem(`aqua_tray_enabled_${selectedPond.id}`, '1');
                        } catch {}
                        setConfirmedTrayAbw(val);
                        setTrayEnabled(true);
                        setTraySetupStep(0);
                        setActiveTab('tray');
                      }}
                      disabled={!trayAbwInput || parseFloat(trayAbwInput) <= 0}
                      className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/20 disabled:opacity-40 transition-all active:scale-[0.98]"
                    >
                      ✓ Confirm &amp; Start Tray Guide
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
// Fallback user icon component inline
const Users_FallbackIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

