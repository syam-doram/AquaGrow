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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { calculateDOC, getGrowthPercentage } from '../utils/pondUtils';
import { runScheduleEngine } from '../utils/scheduleEngine';
import { Header } from '../components/Header';
import { cn } from '../utils/cn';
import { getLunarStatus } from '../utils/lunarUtils';
import { Translations } from '../translations';
import { User, WaterQualityRecord } from '../types';
import { useFirebaseAlerts } from '../hooks/useFirebaseAlerts';

// ─── MARKET RATE DATA ────────────────────────────────────────────────────────
const MARKET_RATES = [
  { count: 20,  price: 620, demand: 'ULTRA HIGH', trend: 'up' },
  { count: 30,  price: 540, demand: 'HIGH',       trend: 'up' },
  { count: 40,  price: 490, demand: 'HIGH',       trend: 'up' },
  { count: 50,  price: 450, demand: 'STABLE',     trend: 'stable' },
  { count: 60,  price: 410, demand: 'STABLE',     trend: 'stable' },
  { count: 70,  price: 385, demand: 'MEDIUM',     trend: 'down' },
  { count: 80,  price: 365, demand: 'MEDIUM',     trend: 'down' },
  { count: 100, price: 310, demand: 'LOW',        trend: 'down' },
  { count: 120, price: 280, demand: 'LOW',        trend: 'down' },
];
const AREAS = ['Bhimavaram', 'Nellore', 'Kakinada', 'Balasore', 'Surat', 'Pattukkottai'];
const AREA_MULT = [1.0, 1.12, 0.92, 0.88, 1.25, 1.05];

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
  if (v >= 1_00_000)    return `₹${(v / 1_00_000).toFixed(1)}L`;
  if (v >= 1_000)       return `₹${(v / 1_000).toFixed(1)}K`;
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
      <circle cx={pts[pts.length-1].split(',')[0]} cy={pts[pts.length-1].split(',')[1]} r="3" fill={color} />
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
          style={{ height: `${(v / max) * 100}%`, background: i === data.length-1 ? color : `${color}55` }} />
      ))}
    </div>
  );
};

// ─── LIVE MARKET TICKER ───────────────────────────────────────────────────────
const LiveMarketTicker = ({ t }: { t: Translations }) => {
  const tickerRef = useRef<HTMLDivElement>(null);
  const rafRef    = useRef<number>(0);
  const [areaIdx, setAreaIdx] = useState(0);
  const items = useMemo(() => {
    const mult = AREA_MULT[areaIdx] ?? 1;
    return [...MARKET_RATES, ...MARKET_RATES].map(r => ({ ...r, price: Math.round(r.price * mult) }));
  }, [areaIdx]);

  useEffect(() => {
    const el = tickerRef.current;
    if (!el) return;
    let pos = 0;
    const tick = () => {
      pos += 0.55;
      if (pos >= el.scrollWidth / 2) { pos = 0; setAreaIdx(p => (p + 1) % AREAS.length); }
      el.style.transform = `translateX(-${pos}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [items]);

  return (
    <div className="bg-[#02130F] rounded-[2rem] overflow-hidden border border-white/5 shadow-xl">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{t.liveMarketRates}</p>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            <motion.p key={AREAS[areaIdx]} initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-5 }}
              className="text-[8px] font-black text-white/40 uppercase tracking-widest">
              ₹/{t.count} · <span className="text-white">{AREAS[areaIdx]}</span>
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
      <div className="overflow-hidden py-3">
        <div ref={tickerRef} className="flex gap-3 px-4" style={{ willChange: 'transform' }}>
          {items.map((r, i) => (
            <div key={`${areaIdx}-${i}`}
              className={cn('flex-shrink-0 rounded-2xl px-4 py-2.5 border',
                r.demand === 'ULTRA HIGH' || r.demand === 'HIGH' ? 'bg-emerald-500/10 border-emerald-500/20' :
                r.trend === 'down' ? 'bg-red-900/10 border-red-500/10' : 'bg-white/5 border-white/5')}>
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">{r.count}/{t.count}</p>
              <p className={cn('font-black text-lg tracking-tighter',
                r.demand === 'ULTRA HIGH' ? 'text-emerald-300' : r.demand === 'HIGH' ? 'text-white' :
                r.trend === 'down' ? 'text-red-400' : 'text-white/70')}>₹{r.price}</p>
              <div className="flex items-center gap-1 mt-1">
                {r.trend === 'up' ? <TrendingUp size={9} className="text-emerald-400" />
                  : r.trend === 'down' ? <TrendingDown size={9} className="text-red-400" />
                  : <Minus size={9} className="text-white/20" />}
                <p className={cn('text-[7px] font-black uppercase tracking-widest',
                  r.demand === 'HIGH' || r.demand === 'ULTRA HIGH' ? 'text-emerald-400' :
                  r.demand === 'STABLE' ? 'text-blue-400' : r.demand === 'MEDIUM' ? 'text-amber-400' : 'text-red-400')}>
                  {r.demand === 'ULTRA HIGH' ? t.ultraHigh : r.demand === 'HIGH' ? t.high : r.demand === 'MEDIUM' ? t.medium : r.demand === 'LOW' ? t.low : t.stable}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
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
            strokeDasharray={`${(pct/100)*circ} ${circ}`}
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

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export const Dashboard = ({ user, t, onMenuClick }: { user: User; t: Translations; onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, reminders, waterRecords, feedLogs, medicineLogs } = useData();
  const [showWeatherAlert, setShowWeatherAlert] = useState(true);
  const [showLunarAlert, setShowLunarAlert]     = useState(true);
  const [refreshTs, setRefreshTs] = useState(Date.now());
  const [selectedPondId, setSelectedPondId]     = useState<string>('');

  const activePonds = useMemo(() => ponds.filter(p => p.status === 'active'), [ponds]);
  const { incomingAlert, clearAlert } = useFirebaseAlerts(user.language);
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
      ph:     recs.map(r => safeNum(r.ph, 7.8)),
      doVals: recs.map(r => safeNum(r.do, 5.5)),
      temp:   recs.map(r => safeNum(r.temperature, 28)),
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
      return result?.activeAlerts.map(a => ({ ...a, pondName: p.name, pondId: p.id })) || [];
    }), [activePonds, waterRecords]);

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

  // ── Farm-wide aggregates ──
  const totalArea  = activePonds.reduce((a, p) => a + safeNum(p.size), 0);
  const totalSeeds = activePonds.reduce((a, p) => a + safeNum(p.seedCount), 0);

  const totalBiomassKg = activePonds.reduce((acc, p) => {
    const doc = calculateDOC(p.stockingDate);
    const wG  = Math.min(35, doc * 0.38);
    const live = safeNum(p.seedCount, 100000) * 0.80;
    return acc + (live * wG) / 1000;
  }, 0);

  const estRevenueAtHarvest = totalBiomassKg * 450; // ₹450/kg avg at 50 count
  const pendingAlerts = reminders.filter((r: any) => r.status === 'pending').length;

  // ── Health score ──
  const healthScore = calcPondHealthScore(latestWater);
  const healthColor = healthScore >= 80 ? '#34d399' : healthScore >= 60 ? '#f59e0b' : '#ef4444';
  const healthLabel = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Fair' : 'Poor';

  // ── Medicine compliance ──
  const medThisWeek = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return medicineLogs.filter(m =>
      m.pondId === selectedPond?.id && new Date(m.date) >= weekAgo).length;
  }, [medicineLogs, selectedPond]);

  // ── Water quality status bar gauge ──
  const weekDays = ['M','T','W','T','F','S','S'];

  return (
    <div className="pb-32 bg-[#F8F9FE] min-h-screen">
      <Header title="AquaGrow" onMenuClick={onMenuClick} />

      <div className="px-4 pt-24 space-y-4">

        {/* ── SOP Engine Alerts ── */}
        <AnimatePresence>
          {engineAlerts.map((alert, i) => (
            <motion.div key={`eng-${i}`}
              initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className={cn('p-4 rounded-[1.8rem] border flex items-start gap-3 shadow-md',
                alert.type === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200')}>
              <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
                alert.type === 'critical' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white')}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className={cn('text-[8px] font-black uppercase tracking-widest mb-0.5',
                  alert.type === 'critical' ? 'text-red-500' : 'text-amber-600')}>
                  {t.sopEngineAlert} · {alert.pondName}
                </p>
                <h3 className="font-black text-sm tracking-tight text-[#4A2C2A]">{alert.title}</h3>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── Firebase Alert ── */}
        <AnimatePresence>
          {incomingAlert && (
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
              className="bg-[#0D523C] text-white p-5 rounded-[2rem] shadow-2xl border border-emerald-500/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
                    <Bell size={20} className="text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">{t.autoEngineAlert}</p>
                    <h3 className="font-black text-base tracking-tight">{incomingAlert.title}</h3>
                    <p className="text-xs text-white/60 mt-0.5">{incomingAlert.body}</p>
                  </div>
                </div>
                <button onClick={clearAlert} className="text-white/30 p-1.5 rounded-xl bg-white/5"><X size={14} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Lunar Alert ── */}
        {showLunarAlert && lunar.phase === 'AMAVASYA' && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
            className="bg-[#1A1C2E] border border-white/5 rounded-[2rem] p-5 text-white relative overflow-hidden">
            <button onClick={() => setShowLunarAlert(false)} className="absolute top-4 right-4 text-white/20 hover:text-white p-1">
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                <Moon size={18} className="text-white fill-white" />
              </div>
              <div>
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{t.moonPhaseTitle}</p>
                <h3 className="font-black text-sm">{t.amavasyaWarning}</h3>
              </div>
            </div>
            <p className="text-white/50 text-[10px] leading-relaxed">{t.massMoltingRisk} {t.actionRequired}</p>
          </motion.div>
        )}

        {activePonds.length === 0 ? (
          /* ── Empty State ── */
          <div className="mt-10 bg-white p-10 rounded-[3rem] text-center shadow-xl border border-black/5">
            <div className="w-20 h-20 bg-[#F8F9FE] rounded-full flex items-center justify-center mx-auto mb-6 text-[#C78200]">
              <Plus size={40} />
            </div>
            <h3 className="text-[#4A2C2A] font-black text-xl tracking-tighter mb-3">{t.startYourFirstPond}</h3>
            <p className="text-[#4A2C2A]/40 text-xs leading-relaxed mb-8">{t.addFirstPondDesc}</p>
            <button onClick={() => navigate('/ponds/new')}
              className="w-full py-5 bg-[#C78200] text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[#C78200]/20 active:scale-95 transition-all">
              {t.addPond}
            </button>
          </div>
        ) : (
          <>
            {/* ══ SECTION 1: LIVE MARKET ══ */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.05 }}>
              <LiveMarketTicker t={t} />
            </motion.div>

            {/* ══ SECTION 2: FARM KPI CARDS ══ */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: t.totalPonds, value: `${activePonds.length}`,
                    sub: `${ponds.length} ${t.totalPonds}`, icon: LayersIcon, color: '#C78200', bg: '#FFF8E7',
                  },
                  {
                    label: t.totalArea, value: `${totalArea.toFixed(1)}`,
                    sub: t.acres, icon: Calculator, color: '#0369A1', bg: '#EFF6FF',
                  },
                  {
                    label: 'Est. Biomass', value: `${(totalBiomassKg/1000).toFixed(1)}T`,
                    sub: `${totalBiomassKg.toFixed(0)} kg`, icon: Fish, color: '#059669', bg: '#ECFDF5',
                  },
                  {
                    label: 'Pending Alerts', value: String(pendingAlerts).padStart(2,'0'),
                    sub: 'action required', icon: Bell, color: pendingAlerts > 0 ? '#ef4444' : '#6b7280', bg: pendingAlerts > 0 ? '#FEF2F2' : '#F8F9FE',
                    path: '/notifications',
                  },
                ].map((stat, i) => (
                  <motion.div key={i}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => stat.path && navigate(stat.path)}
                    className="bg-white rounded-[1.8rem] p-4 border border-black/5 shadow-sm cursor-pointer">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ background: stat.bg }}>
                      <stat.icon size={18} style={{ color: stat.color }} />
                    </div>
                    <p className="text-[8px] font-black text-[#4A2C2A]/30 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-[#4A2C2A] text-2xl font-black tracking-tighter mt-0.5">{stat.value}</p>
                    <p className="text-[8px] text-[#4A2C2A]/40 font-bold mt-0.5">{stat.sub}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ══ SECTION 3: POND SELECTOR + DOC RINGS ══ */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.15 }}
              className="bg-[#02130F] rounded-[2rem] p-5 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{t.pondDocProgress || 'Pond DOC Progress'}</p>
                  <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-0.5">Days of Culture / Target 90</p>
                </div>
                <button onClick={() => setRefreshTs(Date.now())} className="p-2 rounded-xl bg-white/5 text-white/30 hover:text-white transition-colors">
                  <RefreshCw size={13} />
                </button>
              </div>

              {/* Horizontal scrollable pond selector */}
              <div className="flex gap-2 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth:'none' }}>
                {activePonds.map(p => (
                  <button key={p.id} onClick={() => setSelectedPondId(p.id)}
                    className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all',
                      selectedPondId === p.id ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/40 hover:text-white/70')}>
                    {p.name}
                  </button>
                ))}
              </div>

              <div className="flex justify-around">
                {activePonds.slice(0,4).map(p => (
                  <DocRing key={p.id} doc={calculateDOC(p.stockingDate)} label={p.name.split(' ').pop() ?? p.name} />
                ))}
              </div>
            </motion.div>

            {/* ══ SECTION 4: LIVE WATER QUALITY (REAL DATA) ══ */}
            {selectedPond && (
              <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.2 }}
                className="bg-[#02130F] rounded-[2rem] p-5 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Live Water Quality</p>
                    <p className="text-[7px] font-black text-white/20 mt-0.5">
                      {selectedPond.name} ·{' '}
                      {latestWater ? `Updated ${new Date(latestWater.date).toLocaleDateString()}` : 'No readings yet'}
                    </p>
                  </div>
                  {/* Health Score Badge */}
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border" style={{ borderColor: `${healthColor}40`, background: `${healthColor}15` }}>
                      <HeartPulse size={10} style={{ color: healthColor }} />
                      <span className="text-[9px] font-black" style={{ color: healthColor }}>{healthScore}% {healthLabel}</span>
                    </div>
                    <p className="text-[7px] text-white/20 font-black mt-0.5">Pond Health Score</p>
                  </div>
                </div>

                {latestWater ? (
                  <>
                    <div className="grid grid-cols-4 gap-3">
                      <WaterGauge label="pH" value={safeNum(latestWater.ph)} unit="" color={phColor(safeNum(latestWater.ph))} min={6.5} max={9} icon={FlaskConical} />
                      <WaterGauge label="DO" value={safeNum(latestWater.do)} unit="mg/L" color={doColor(safeNum(latestWater.do))} min={0} max={10} icon={Droplets} />
                      <WaterGauge label="Temp" value={safeNum(latestWater.temperature)} unit="°C" color="#60a5fa" min={20} max={38} icon={Thermometer} />
                      <WaterGauge label="NH₃" value={safeNum(latestWater.ammonia)} unit="ppm" color={ammoniaColor(safeNum(latestWater.ammonia))} min={0} max={1} icon={FlaskConical} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="bg-white/5 rounded-xl p-2.5 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center"><Droplets size={12} className="text-cyan-400" /></div>
                        <div>
                          <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">Salinity</p>
                          <p className="text-white font-black text-xs">{safeNum(latestWater.salinity)} ppt</p>
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2.5 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center"><Activity size={12} className="text-purple-400" /></div>
                        <div>
                          <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">Alkalinity</p>
                          <p className="text-white font-black text-xs">{safeNum(latestWater.alkalinity)} ppm</p>
                        </div>
                      </div>
                    </div>

                    {/* 7-day trend sparklines */}
                    {waterTrend.ph.length > 1 && (
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
                        {[
                          { label: 'pH Trend', data: waterTrend.ph, color: '#60a5fa' },
                          { label: 'DO Trend', data: waterTrend.doVals, color: '#34d399' },
                          { label: 'Temp °C', data: waterTrend.temp, color: '#fbbf24' },
                        ].map(s => (
                          <div key={s.label}>
                            <p className="text-[7px] font-black text-white/25 uppercase tracking-widest mb-1">{s.label}</p>
                            <SparkLine data={s.data} color={s.color} filled />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Droplets size={32} className="text-white/10 mx-auto mb-3" />
                    <p className="text-white/30 text-xs font-black">No water records yet</p>
                    <button onClick={() => navigate('/monitor')}
                      className="mt-3 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                      Add Water Reading
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ══ SECTION 5: FEED + MEDICINE ACTIVITY ══ */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.25 }}
              className="grid grid-cols-2 gap-3">

              {/* Feed Activity */}
              <div className="bg-[#02130F] rounded-[2rem] p-4 border border-white/5">
                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-3">Feed / Week</p>
                {feedThisWeek.length > 0 ? (
                  <>
                    <MiniBar data={feedThisWeek} color="#34d399" />
                    <div className="flex justify-between mt-1">
                      {weekDays.slice(0, feedThisWeek.length).map((d, i) => (
                        <p key={i} className="flex-1 text-center text-[6px] font-black text-white/20">{d}</p>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/5">
                      <p className="text-emerald-300 font-black text-lg tracking-tighter">
                        {feedThisWeek[feedThisWeek.length-1]}
                        <span className="text-[8px] text-white/25 ml-1">kg Today</span>
                      </p>
                      <p className="text-[7px] text-white/20 font-black">
                        Total: {feedThisWeek.reduce((a,b)=>a+b,0).toFixed(1)} kg
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-4">
                    <Utensils size={22} className="text-white/10 mb-2" />
                    <p className="text-white/20 text-[9px] font-black text-center">No feed logs</p>
                  </div>
                )}
              </div>

              {/* Medicine Compliance */}
              <div className="bg-[#02130F] rounded-[2rem] p-4 border border-white/5">
                <p className="text-[8px] font-black text-[#C78200] uppercase tracking-widest mb-3">Medicine Log</p>
                <div className="flex items-center justify-center my-3">
                  <div className="relative w-16 h-16">
                    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
                      <circle cx="32" cy="32" r="26" strokeWidth="5" stroke="rgba(255,255,255,0.06)" fill="none" />
                      <circle cx="32" cy="32" r="26" strokeWidth="5" fill="none"
                        stroke="#C78200" strokeLinecap="round"
                        strokeDasharray={`${Math.min(100,(medThisWeek/7)*100) * 1.634} 163.4`}
                        style={{ transition: 'stroke-dasharray 1s ease' }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-black text-sm">{medThisWeek}</span>
                    </div>
                  </div>
                </div>
                <p className="text-center text-[7px] font-black text-white/25 uppercase tracking-widest">Doses this week</p>
                <button onClick={() => navigate('/medicine')}
                  className="w-full mt-3 py-1.5 bg-[#C78200]/15 rounded-xl text-[#C78200] text-[8px] font-black uppercase tracking-widest border border-[#C78200]/20">
                  View Schedule →
                </button>
              </div>
            </motion.div>

            {/* ══ SECTION 6: REVENUE ESTIMATE ══ */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.3 }}
              className="bg-gradient-to-br from-[#0D523C] to-[#051F19] rounded-[2rem] p-5 border border-emerald-500/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Revenue Forecast</p>
                  <p className="text-[7px] text-white/20 font-black mt-0.5">Based on current biomass × avg market rate</p>
                </div>
                <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <DollarSign size={18} className="text-emerald-300" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Est. Biomass', value: `${(totalBiomassKg/1000).toFixed(2)}T`, color: 'text-emerald-300' },
                  { label: 'Avg Rate/kg', value: '₹450', color: 'text-[#C78200]' },
                  { label: 'Est. Revenue', value: formatLakh(estRevenueAtHarvest), color: 'text-white' },
                ].map((m,i) => (
                  <div key={i} className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
                    <p className={cn('font-black text-base tracking-tighter', m.color)}>{m.value}</p>
                    <p className="text-[7px] font-black text-white/25 uppercase tracking-widest mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width:0 }}
                  animate={{ width: `${Math.min(100, (totalBiomassKg/1000/5)*100)}%` }}
                  transition={{ duration:1.2, ease:'easeOut' }}
                  className="h-full bg-emerald-400 rounded-full" />
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-[7px] text-white/20 font-black">0T</p>
                <p className="text-[7px] text-white/20 font-black">Target 5T</p>
              </div>
            </motion.div>

            {/* ══ SECTION 7: TODAY'S TASKS ══ */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.35 }}>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-[#4A2C2A] text-base font-black tracking-tight flex items-center gap-2">
                  <Clock size={16} className="text-[#C78200]" />{t.todaysTasks}
                </h2>
                <button onClick={() => navigate('/medicine')}
                  className="text-[#C78200] text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                  {t.viewSchedule} <ChevronRight size={12} />
                </button>
              </div>
              <div className="space-y-2.5">
                {pondTasks.length > 0 ? pondTasks.map((task, i) => (
                  <motion.div key={i}
                    initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: 0.35 + i*0.04 }}
                    className="bg-white rounded-[1.5rem] p-4 border border-black/5 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: `${task.color}15` }}>
                      <task.icon size={18} style={{ color: task.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[#4A2C2A] font-black text-sm tracking-tight truncate">{task.title}</h3>
                        <span className="text-[7px] font-black px-2 py-0.5 rounded-full ml-2 shrink-0"
                          style={{ background: `${task.color}15`, color: task.color, border: `1px solid ${task.color}30` }}>
                          {task.tag}
                        </span>
                      </div>
                      <p className="text-[#4A2C2A]/40 text-[9px] mt-0.5">{task.time}</p>
                    </div>
                  </motion.div>
                )) : (
                  <div className="bg-white p-8 rounded-[2rem] text-center border border-black/5">
                    <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2" />
                    <p className="text-[#4A2C2A]/40 text-xs font-black">All tasks done for today</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ══ SECTION 8: ACTIVE PONDS LIST ══ */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.4 }}>
              <h2 className="text-[#4A2C2A] text-base font-black tracking-tight mb-3 px-1 flex items-center gap-2">
                <Waves size={16} className="text-[#C78200]" />{t.activePonds}
              </h2>
              <div className="space-y-3">
                {activePonds.slice(0,4).map((p, i) => {
                  const doc = calculateDOC(p.stockingDate);
                  const growth = getGrowthPercentage(doc);
                  const lastWater = waterRecords
                    .filter(w => w.pondId === p.id)
                    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                  const hs = calcPondHealthScore(lastWater);
                  const hsColor = hs >= 80 ? '#34d399' : hs >= 60 ? '#f59e0b' : '#ef4444';

                  return (
                    <motion.div key={p.id}
                      initial={{ opacity:0, y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay: 0.4 + i*0.06 }}
                      whileTap={{ scale:0.98 }}
                      onClick={() => navigate(`/ponds/${p.id}`)}
                      className="bg-white rounded-[2rem] p-5 border border-black/5 shadow-sm cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-[#4A2C2A] font-black text-base tracking-tight">{p.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[8px] font-black text-[#C78200] uppercase tracking-widest">{p.species}</span>
                            <div className="w-1 h-1 bg-black/10 rounded-full" />
                            <span className="text-[8px] font-black text-[#4A2C2A]/30 uppercase tracking-widest">
                              {t.doc || 'DOC'}: {doc} {t.days || 'days'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full"
                            style={{ background: `${hsColor}15`, border: `1px solid ${hsColor}30` }}>
                            <HeartPulse size={9} style={{ color: hsColor }} />
                            <span className="text-[8px] font-black" style={{ color: hsColor }}>{hs}%</span>
                          </div>
                          <ArrowRight size={14} className="text-[#C78200]" />
                        </div>
                      </div>

                      {/* Growth bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-[7px] font-black text-[#4A2C2A]/30 uppercase tracking-widest mb-1">
                          <span>{t.growthStage || 'Growth Stage'}</span>
                          <span className="text-emerald-500">{growth}%</span>
                        </div>
                        <div className="h-1.5 bg-[#F8F9FE] rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                            style={{ width: `${growth}%` }} />
                        </div>
                      </div>

                      {/* Water quality chips */}
                      <div className="flex gap-2 flex-wrap">
                        {lastWater ? (
                          <>
                            <div className="flex items-center gap-1.5 bg-[#F8F9FE] px-2.5 py-1.5 rounded-xl border border-black/5">
                              <FlaskConical size={10} style={{ color: phColor(safeNum(lastWater.ph, 7.8)) }} />
                              <span className="text-[10px] font-black text-[#4A2C2A]">pH {safeNum(lastWater.ph, 7.8)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-[#F8F9FE] px-2.5 py-1.5 rounded-xl border border-black/5">
                              <Droplets size={10} style={{ color: doColor(safeNum(lastWater.do, 5.5)) }} />
                              <span className="text-[10px] font-black text-[#4A2C2A]">DO {safeNum(lastWater.do, 5.5)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-[#F8F9FE] px-2.5 py-1.5 rounded-xl border border-black/5">
                              <Thermometer size={10} className="text-blue-400" />
                              <span className="text-[10px] font-black text-[#4A2C2A]">{safeNum(lastWater.temperature, 28)}°C</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-100">
                            <AlertTriangle size={10} className="text-amber-500" />
                            <span className="text-[9px] font-black text-amber-600">No water data</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {activePonds.length > 4 && (
                  <button onClick={() => navigate('/ponds')}
                    className="w-full py-4 bg-white rounded-[1.5rem] border border-black/5 text-[#C78200] text-[10px] font-black uppercase tracking-widest shadow-sm">
                    View All {activePonds.length} Ponds →
                  </button>
                )}
              </div>
            </motion.div>

            {/* ── Quick Nav shortcuts ── */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.45 }}
              className="grid grid-cols-4 gap-2 mt-2">
              {[
                { label:'Monitor', icon:Activity, path:'/monitor', color:'#0369A1', bg:'#EFF6FF' },
                { label:'Disease', icon:HeartPulse, path:'/disease-detection', color:'#dc2626', bg:'#FEF2F2' },
                { label:'Market',  icon:TrendingUp, path:'/market', color:'#059669', bg:'#ECFDF5' },
                { label:'Feed',    icon:Utensils,  path:'/feed', color:'#C78200', bg:'#FFF8E7' },
              ].map(n => (
                <button key={n.path} onClick={() => navigate(n.path)}
                  className="bg-white rounded-[1.5rem] p-3 border border-black/5 shadow-sm flex flex-col items-center gap-1.5 active:scale-95 transition-all">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: n.bg }}>
                    <n.icon size={18} style={{ color: n.color }} />
                  </div>
                  <span className="text-[8px] font-black text-[#4A2C2A]/50 uppercase tracking-widest">{n.label}</span>
                </button>
              ))}
            </motion.div>

          </>
        )}
      </div>
    </div>
  );
};
