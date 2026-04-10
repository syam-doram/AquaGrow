import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Activity, Droplets, Thermometer, Waves,
  AlertTriangle, CheckCircle2, Plus, Clock, TrendingUp,
  TrendingDown, Minus, Calendar, ArrowRight, ShieldCheck,
  Zap, FlaskConical, PackageCheck, X, Fish, BarChart2, Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { calculateDOC } from '../../utils/pondUtils';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

// ─── PARAMETER RANGES ────────────────────────────────────────────────────────
interface ParamConfig {
  key: string; label: string; unit: string; icon: React.ElementType;
  min: number; max: number; dangerLow?: number; dangerHigh?: number;
  emoji: string; description: string;
}

const PARAM_CONFIG: ParamConfig[] = [
  { key: 'ph',          label: 'pH',        unit: '',     icon: FlaskConical, min: 7.5, max: 8.5, dangerLow: 7.0, dangerHigh: 9.0,  emoji: '🧪', description: 'Optimal: 7.5–8.5' },
  { key: 'do',          label: 'DO',        unit: 'mg/L', icon: Waves,        min: 5.0, max: 10.0, dangerLow: 3.0,                    emoji: '💧', description: 'Min safe: 5.0 mg/L' },
  { key: 'temperature', label: 'Temp',      unit: '°C',   icon: Thermometer,  min: 26,  max: 30,   dangerLow: 22, dangerHigh: 34,    emoji: '🌡️', description: 'Optimal: 26–30°C' },
  { key: 'salinity',    label: 'Salinity',  unit: 'ppt',  icon: Droplets,     min: 10,  max: 20,   dangerLow: 5,  dangerHigh: 30,    emoji: '🌊', description: 'Optimal: 10–20 ppt' },
  { key: 'ammonia',     label: 'Ammonia',   unit: 'mg/L', icon: Zap,          min: 0,   max: 0.05, dangerHigh: 0.1,                   emoji: '⚗️', description: 'Keep below 0.05' },
  { key: 'alkalinity',  label: 'Alkalinity',unit: 'mg/L', icon: Activity,     min: 100, max: 150,  dangerLow: 80,                     emoji: '🔬', description: 'Optimal: 100–150' },
];

const getStatus = (cfg: ParamConfig, val: number): 'optimal' | 'warning' | 'danger' => {
  if (cfg.dangerLow !== undefined && val < cfg.dangerLow) return 'danger';
  if (cfg.dangerHigh !== undefined && val > cfg.dangerHigh) return 'danger';
  if (val < cfg.min || val > cfg.max) return 'warning';
  return 'optimal';
};

const getParamLabel = (key: string, t: any): string => {
  const map: Record<string, string> = {
    ph: t.paramPh, do: t.paramDo, temperature: t.paramTemp,
    salinity: t.paramSalinity, ammonia: t.paramAmmonia, alkalinity: t.paramAlkalinity,
  };
  return map[key] ?? key;
};

// ─── EXTENSION PLANS ─────────────────────────────────────────────────────────
interface ExtensionPeriod {
  weeks: number; label: string; maxDoc: number;
  sopSteps: string[]; risks: string[];
  medicines: { name: string; schedule: string; brand: string }[];
  feedAdj: string;
}

const EXTENSION_PLANS: ExtensionPeriod[] = [
  { weeks: 1, label: '1-Week Extension', maxDoc: 107,
    sopSteps: ['Maintain daily water parameter logging','Continue gut + water probiotic on Monday/Tuesday schedule','Run all aerators 24/7','Reduce feed by 10%','Check tray consumption twice daily'],
    risks: ['Slight FCR increase','Minor DO stress possible above DOC 100'],
    medicines: [{ name: 'Vitamin C + Immunity Booster', schedule: 'Every 2 days, with feed', brand: 'CP Vita-C Pro' },{ name: 'Gut Probiotic', schedule: 'Daily with morning feed', brand: 'Avanti Gut Health' }],
    feedAdj: '-10% from standard rate. Increase water exchange to 10%/day.' },
  { weeks: 2, label: '2-Week Extension', maxDoc: 114,
    sopSteps: ['Increase water exchange to 15–20% daily','Run intensive probiotic treatment every 3 days','Monitor for disease signs twice daily','Reduce stocking density if possible','Apply mineral booster once per week'],
    risks: ['High FCR deterioration','Increased Vibriosis risk','DO crash risk at high biomass'],
    medicines: [{ name: 'Mineral Mix (High Dose)', schedule: 'Every Monday & Friday', brand: 'Sanolife PRO-W' },{ name: 'Immunity Booster + Liver Tonic', schedule: 'Every 3 days in feed', brand: 'CP Hepato-Pro' },{ name: 'Water Probiotic', schedule: 'Every 2 days in water', brand: 'Bioclean Aqua Plus' }],
    feedAdj: '-15% from standard rate. Add zeolite 5 kg/acre twice weekly.' },
  { weeks: 3, label: '3-Week Extension', maxDoc: 121,
    sopSteps: ['⚠️ HIGH RISK — only if market price is very high','Daily water exchange 20–25%','Full emergency SOP: DO monitoring every 4 hours','Emergency aeration standby equipment ready','Pre-harvest sample and market coordination should be active'],
    risks: ['Very high mortality risk above DOC 110','Mass disease outbreak probability increases significantly','DO crashes likely during rainy nights'],
    medicines: [{ name: 'Emergency Immunity Protocol', schedule: 'Daily', brand: 'CP Immuno-Shield' },{ name: 'Anti-Vibrio Probiotic', schedule: 'Every 2 days', brand: 'Bioclean Pro-V' }],
    feedAdj: '-25% from standard rate. Emergency harvest capability must be kept ready.' },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export const PondMonitor = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { ponds, waterRecords, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';
  const pond = ponds.find(p => p.id === id) || ponds[0];

  const [activeTab, setActiveTab] = useState<'health' | 'history' | 'harvest'>('health');
  const [showExtension, setShowExtension] = useState<ExtensionPeriod | null>(null);

  if (!pond) {
    return (
      <div className={cn("p-10 text-center font-black uppercase tracking-widest min-h-screen flex items-center justify-center", isDark ? "bg-[#070D12] text-white/30" : "bg-[#F8F9FE] text-ink/30")}>
        {t.pondNotFound}
      </div>
    );
  }

  const doc = calculateDOC(pond.stockingDate);

  const pondRecords = useMemo(() =>
    waterRecords.filter(r => r.pondId === pond.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [waterRecords, pond.id]
  );

  const latestRecord = pondRecords[0];
  const prevRecord   = pondRecords[1];

  const healthScore = latestRecord ? (() => {
    let total = 0, count = 0;
    for (const cfg of PARAM_CONFIG) {
      const val = (latestRecord as any)[cfg.key];
      if (val === undefined || val === null) continue;
      const st = getStatus(cfg, val);
      total += st === 'optimal' ? 100 : st === 'warning' ? 60 : 20;
      count++;
    }
    return count > 0 ? Math.round(total / count) : 75;
  })() : null;

  const getTrend = (key: string): 'up' | 'down' | 'same' | null => {
    if (!latestRecord || !prevRecord) return null;
    const curr = (latestRecord as any)[key];
    const prev = (prevRecord as any)[key];
    if (curr === undefined || prev === undefined) return null;
    const diff = curr - prev;
    if (Math.abs(diff) < 0.01) return 'same';
    return diff > 0 ? 'up' : 'down';
  };

  const getTrendDelta = (key: string): string | null => {
    if (!latestRecord || !prevRecord) return null;
    const curr = (latestRecord as any)[key];
    const prev = (prevRecord as any)[key];
    if (curr === undefined || prev === undefined) return null;
    const diff = parseFloat((curr - prev).toFixed(2));
    return diff >= 0 ? `+${diff}` : `${diff}`;
  };

  const todayActions = latestRecord ? (() => {
    const actions: { text: string; severity: 'high' | 'medium' | 'ok'; remedy: string }[] = [];
    const r = latestRecord;
    if (r.ph < 7.5) actions.push({ text: 'pH Low', severity: 'high', remedy: 'Apply agricultural lime 5–10 kg/acre immediately' });
    if (r.ph > 8.5) actions.push({ text: 'pH High', severity: 'high', remedy: 'Do water exchange 10–15%. Check CO₂ buildup.' });
    if (r.do < 5.0) actions.push({ text: 'DO Critical', severity: 'high', remedy: 'Run ALL aerators. Stop feeding immediately.' });
    if (r.temperature > 32) actions.push({ text: 'Temp High', severity: 'medium', remedy: 'Increase aeration, reduce noon feed by 20%.' });
    if (r.ammonia > 0.05) actions.push({ text: 'Ammonia High', severity: 'high', remedy: 'Apply Bioclean Aqua 250g/acre + zeolite 10kg/acre.' });
    if (r.alkalinity < 100) actions.push({ text: 'Alkalinity Low', severity: 'medium', remedy: 'Apply 5–8 kg/acre agricultural lime.' });
    if (actions.length === 0) actions.push({ text: 'All Parameters Optimal', severity: 'ok', remedy: 'Continue standard SOP. Great job!' });
    return actions;
  })() : [];

  const harvestReady   = doc >= 90;
  const daysToHarvest  = Math.max(0, 90 - doc);
  const currentWeightG = Math.min(35, doc * 0.38);
  const estimatedCountPerKg = currentWeightG > 0 ? Math.round(1000 / currentWeightG) : 999;
  const survivalRate   = (pond as any).survivalRate ?? 0.80;
  const stockingCount  = pond.seedCount ?? 100000;
  const estimatedLiveCount = Math.round(stockingCount * survivalRate);
  const estWeightKg    = (estimatedLiveCount * currentWeightG) / 1000;

  const marketRates = [
    { count: 20, price: 620, demand: 'ULTRA HIGH', trend: 'up' },
    { count: 30, price: 540, demand: 'HIGH', trend: 'up' },
    { count: 40, price: 490, demand: 'HIGH', trend: 'up' },
    { count: 50, price: 450, demand: 'STABLE', trend: 'stable' },
    { count: 60, price: 410, demand: 'STABLE', trend: 'stable' },
    { count: 70, price: 385, demand: 'MEDIUM', trend: 'down' },
    { count: 80, price: 365, demand: 'MEDIUM', trend: 'down' },
    { count: 100, price: 310, demand: 'LOW', trend: 'down' },
  ];
  const matchedRate = marketRates.find(r => estimatedCountPerKg <= r.count + 5 && estimatedCountPerKg >= r.count - 5);
  const isAtPremiumCount = !!(matchedRate && matchedRate.count <= 50);

  const heroGradient = !latestRecord ? 'from-[#0D523C] to-[#065F46]' :
    healthScore! >= 80 ? 'from-[#0D523C] to-[#065F46]' :
    healthScore! >= 60 ? 'from-amber-700 to-amber-900' : 'from-red-700 to-red-900';

  return (
    <div className={cn("min-h-screen pb-40", isDark ? "bg-[#070D12]" : "bg-[#F0F4F8]")}>

      {/* Extension SOP Bottom Sheet */}
      <AnimatePresence>
        {showExtension && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end"
            onClick={() => setShowExtension(null)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn("w-full max-w-md mx-auto rounded-t-[2.5rem] p-6 pb-12 max-h-[85vh] overflow-y-auto border-t border-x", isDark ? "bg-[#111827] border-white/10" : "bg-white border-slate-200")}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-ink/10 mx-auto mb-5" />
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className={cn("font-black text-xl tracking-tight", isDark ? "text-white" : "text-slate-900")}>{showExtension.label}</h2>
                  <p className="text-[9px] text-[#C78200] font-black uppercase tracking-widest mt-0.5">Culture to DOC {showExtension.maxDoc}</p>
                </div>
                <button onClick={() => setShowExtension(null)} className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", isDark ? "bg-white/5" : "bg-slate-100")}>
                  <X size={18} className={isDark ? "text-white/40" : "text-slate-500"} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">SOP Steps</p>
                {showExtension.sopSteps.map((step, i) => (
                  <div key={i} className={cn("flex items-start gap-3 rounded-2xl px-4 py-3 border", isDark ? "bg-emerald-500/5 border-emerald-500/15" : "bg-emerald-50 border-emerald-100")}>
                    <span className="text-emerald-500 font-black text-xs flex-shrink-0 mt-0.5">{i + 1}.</span>
                    <p className={cn("text-[11px] font-bold leading-snug", isDark ? "text-white/70" : "text-ink")}>{step}</p>
                  </div>
                ))}

                <p className="text-[9px] font-black text-[#C78200] uppercase tracking-widest mt-4">Extension Medicines</p>
                {showExtension.medicines.map((med, i) => (
                  <div key={i} className={cn("rounded-2xl p-4 border", isDark ? "bg-white/3 border-white/5" : "bg-card border-card-border shadow-sm")}>
                    <p className={cn("font-black text-xs tracking-tight", isDark ? "text-white" : "text-ink")}>{med.name}</p>
                    <p className="text-[9px] text-[#C78200] font-black mt-0.5">{med.brand}</p>
                    <p className={cn("text-[9px] font-medium mt-1", isDark ? "text-white/30" : "text-ink/40")}>{med.schedule}</p>
                  </div>
                ))}

                <div className={cn("rounded-2xl px-4 py-3 border", isDark ? "bg-amber-500/5 border-amber-500/15" : "bg-amber-50 border-amber-100")}>
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Feed Adjustment</p>
                  <p className={cn("text-[11px] font-bold", isDark ? "text-amber-300/70" : "text-amber-800")}>{showExtension.feedAdj}</p>
                </div>

                <div className={cn("rounded-2xl px-4 py-3 border", isDark ? "bg-red-500/5 border-red-500/15" : "bg-red-50 border-red-100")}>
                  <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-2">Extension Risks</p>
                  {showExtension.risks.map((risk, i) => (
                    <p key={i} className={cn("text-[10px] font-bold leading-snug mb-1", isDark ? "text-red-400/70" : "text-red-700")}>⚠️ {risk}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STICKY HEADER ── */}
      <header className={cn(
        "fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 backdrop-blur-xl px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center justify-between border-b transition-all",
        isDark ? "bg-[#070D12]/90 border-white/5" : "bg-white/90 border-slate-100 shadow-sm"
      )}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
          className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border", isDark ? "bg-white/5 border-white/10 text-white/70" : "bg-white border-slate-200 text-slate-600 shadow-sm")}
        >
          <ChevronLeft size={18} />
        </motion.button>
        <div className="text-center">
          <h1 className={cn("text-xs font-black tracking-tight uppercase", isDark ? "text-white" : "text-slate-900")}>{t.pondMonitor}</h1>
          <p className={cn("text-[8px] font-black uppercase tracking-widest mt-0.5", isDark ? "text-white/30" : "text-slate-400")}>{pond.name}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => pond.status !== 'harvested' && navigate(`/ponds/${pond.id}/water-log`)}
          className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg",
            pond.status === 'harvested' ? "bg-slate-400 cursor-not-allowed opacity-50" : "bg-[#0D523C]"
          )}
        >
          <Plus size={18} />
        </motion.button>
      </header>

      <div className="pt-24 px-4 space-y-4">

        {/* ── HEALTH SCORE HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("bg-gradient-to-br rounded-[2.5rem] p-6 relative overflow-hidden shadow-2xl", heroGradient)}
        >
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-[60px]" />
          <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-black/10 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/40 text-[8px] font-black uppercase tracking-[0.25em]">Overall Health Score</p>
                {latestRecord ? (
                  <>
                    <p className="text-white font-black text-5xl tracking-tighter leading-none mt-2">
                      {healthScore}<span className="text-2xl opacity-40">/100</span>
                    </p>
                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mt-2">
                      {latestRecord.date === new Date().toISOString().split('T')[0] ? '✅ Logged today' : `Last: ${latestRecord.date}`}
                    </p>
                  </>
                ) : (
                  <p className="text-white font-black text-2xl tracking-tight mt-3">No data yet</p>
                )}
              </div>
              <div className="text-right">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-2 border border-white/10">
                  <Activity size={26} className="text-white" />
                </div>
                <p className="text-white/40 text-[7px] font-black uppercase tracking-widest">
                  {latestRecord
                    ? healthScore! >= 80 ? '✅ Healthy' : healthScore! >= 60 ? '⚠️ Monitor' : '🔴 Act Now'
                    : 'Log Now'}
                </p>
              </div>
            </div>

            {/* DOC + weight strip */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'DOC', value: `${Math.max(0, doc)}d` },
                { label: 'Avg Weight', value: `~${currentWeightG.toFixed(1)}g` },
                { label: 'Count/kg', value: estimatedCountPerKg > 200 ? '—' : `~${estimatedCountPerKg}` },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 rounded-2xl py-2.5 text-center border border-white/10">
                  <p className="text-white font-black text-sm tracking-tighter">{s.value}</p>
                  <p className="text-white/30 text-[6px] font-black uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Score bar */}
            {latestRecord && (
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${healthScore}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className={cn('h-full rounded-full', healthScore! >= 80 ? 'bg-emerald-400' : healthScore! >= 60 ? 'bg-amber-400' : 'bg-red-400')}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* ── LOG TODAY CTA ── */}
        {pond.status === 'harvested' ? (
          <div className={cn('w-full rounded-[2rem] px-5 py-4 flex items-center gap-3 border', isDark ? 'bg-emerald-900/10 border-emerald-900/20' : 'bg-emerald-50 border-emerald-200')}>
            <span className="text-2xl">🏁</span>
            <div>
              <p className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Harvest Complete</p>
              <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">This pond is archived — no further logging required</p>
            </div>
          </div>
        ) : (!latestRecord || latestRecord.date !== new Date().toISOString().split('T')[0]) && (
          <motion.button
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(`/ponds/${pond.id}/water-log`)}
            className={cn("w-full rounded-[2rem] px-5 py-4 flex items-center justify-between group transition-all border active:scale-[0.98]",
              isDark ? "bg-amber-500/10 border-amber-500/25 hover:border-amber-400/50" : "bg-amber-50 border-amber-200 hover:border-amber-400"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                <Clock size={20} />
              </div>
              <div className="text-left">
                <p className={cn("font-black text-sm tracking-tight", isDark ? "text-white" : "text-slate-900")}>Log Today's Conditions</p>
                <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Not logged yet · Tap here</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-amber-500 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        )}

        {/* ── TAB SWITCH ── */}
        <div className={cn("flex gap-1.5 p-1.5 rounded-[1.6rem] border", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-100 shadow-sm")}>
          {(['health', 'history', 'harvest'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2.5 rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest transition-all',
                activeTab === tab
                  ? 'bg-[#0D523C] text-white shadow-lg shadow-emerald-900/30'
                  : isDark ? 'text-white/30 hover:text-white/50' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              {tab === 'health' ? `📊 ${t.waterHealth}` : tab === 'history' ? `📅 ${t.waterHistory}` : `🌾 ${t.harvestAnalysis}`}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── HEALTH TAB ── */}
          {activeTab === 'health' && (
            <motion.div key="health" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {!latestRecord ? (
                <div className={cn("rounded-[2rem] p-10 border border-dashed text-center", isDark ? "bg-white/3 border-white/10" : "bg-white border-slate-200")}>
                  <Droplets size={36} className={cn("mx-auto mb-3", isDark ? "text-white/20" : "text-ink/20")} />
                  <p className={cn("font-black text-sm tracking-tight", isDark ? "text-white/40" : "text-ink/40")}>No condition data yet</p>
                  <p className={cn("text-[9px] font-medium mt-1", isDark ? "text-white/20" : "text-ink/25")}>Tap the + button to log today's water parameters</p>
                  <button
                    onClick={() => navigate(`/ponds/${pond.id}/water-log`)}
                    className="mt-5 bg-[#0D523C] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                  >{t.logConditionsBtn}</button>
                </div>
              ) : (
                <>
                  {/* Header row */}
                  <div className="flex items-center justify-between px-1">
                    <h2 className={cn("font-black text-sm tracking-tight", isDark ? "text-white" : "text-slate-900")}>Live Parameters</h2>
                    <span className={cn("text-[7px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest", isDark ? "bg-white/5 border-white/10 text-white/30" : "bg-white border-slate-200 text-slate-400 shadow-sm")}>
                      {latestRecord.date}
                    </span>
                  </div>

                  {/* Parameter cards — large 2-col grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {PARAM_CONFIG.map(cfg => {
                      const val = (latestRecord as any)[cfg.key];
                      if (val === undefined) return null;
                      const st   = getStatus(cfg, val);
                      const trend = getTrend(cfg.key);
                      const delta = getTrendDelta(cfg.key);
                      // SOP range bar fill %
                      const rangeSpan = (cfg.dangerHigh ?? cfg.max * 1.5) - (cfg.dangerLow ?? 0);
                      const fillPct = Math.min(100, Math.max(0, ((val - (cfg.dangerLow ?? 0)) / rangeSpan) * 100));
                      const barColor = st === 'optimal' ? 'bg-emerald-400' : st === 'warning' ? 'bg-amber-400' : 'bg-red-500';
                      const cardBg   = st === 'optimal'
                        ? isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                        : st === 'warning'
                        ? isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'
                        : isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200';
                      const valColor = st === 'optimal'
                        ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                        : st === 'warning'
                        ? isDark ? 'text-amber-400' : 'text-amber-700'
                        : isDark ? 'text-red-400' : 'text-red-600';
                      return (
                        <motion.div
                          key={cfg.key}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={cn('rounded-[1.8rem] p-4 border', cardBg)}
                        >
                          {/* Top row */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{cfg.emoji}</span>
                              <p className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/40" : "text-slate-500")}>{getParamLabel(cfg.key, t)}</p>
                            </div>
                            <span className={cn("text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full",
                              st === 'optimal' ? isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                              : st === 'warning' ? isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-600'
                              : isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-100 text-red-600'
                            )}>{st === 'optimal' ? t.optimal : st === 'warning' ? t.medium : t.urgent}</span>
                          </div>

                          {/* Value */}
                          <div className="flex items-baseline gap-1.5 mb-3">
                            <p className={cn('font-black text-3xl tracking-tighter', valColor)}>{val}</p>
                            <p className={cn("text-[8px] font-black", isDark ? "text-white/20" : "text-slate-400")}>{cfg.unit}</p>
                            {trend && delta && (
                              <span className="ml-auto flex items-center gap-0.5">
                                {trend === 'up' ? <TrendingUp size={10} className="text-blue-400" /> :
                                 trend === 'down' ? <TrendingDown size={10} className="text-red-400" /> :
                                 <Minus size={10} className={isDark ? "text-white/20" : "text-slate-300"} />}
                                <span className="text-[7px] font-black text-blue-400">{delta}</span>
                              </span>
                            )}
                          </div>

                          {/* SOP range bar */}
                          <div className={cn("h-1.5 rounded-full overflow-hidden mb-1", isDark ? "bg-white/10" : "bg-black/10")}>
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${fillPct}%` }}
                              transition={{ duration: 0.7, ease: 'easeOut' }}
                              className={cn("h-full rounded-full", barColor)}
                            />
                          </div>
                          <p className={cn("text-[6px] font-black uppercase tracking-widest", isDark ? "text-white/20" : "text-slate-400")}>
                            {t.optimalRange}: {cfg.min}–{cfg.max}{cfg.unit}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* SOP Corrective Protocol */}
                  <div className={cn("rounded-[2rem] overflow-hidden border shadow-sm", isDark ? "bg-[#0D1A13] border-white/5" : "bg-white border-slate-100")}>
                    <div className="bg-gradient-to-r from-[#0D523C] to-[#065F46] px-5 py-4 flex items-center gap-3">
                      <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                        <ShieldCheck size={18} className="text-emerald-300" />
                      </div>
                      <div>
                        <h3 className="text-white font-black text-sm tracking-tight">SOP Corrective Protocol</h3>
                        <p className="text-emerald-200/50 text-[7px] font-black uppercase tracking-widest">Based on today's readings</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-2.5">
                      {todayActions.map((action, i) => (
                        <div key={i} className={cn(
                          'rounded-2xl px-4 py-3 border flex items-start gap-3',
                          action.severity === 'high'   ? isDark ? 'bg-red-500/10 border-red-500/20'   : 'bg-red-50 border-red-200' :
                          action.severity === 'medium' ? isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200' :
                          isDark ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100'
                        )}>
                          <span className="text-base flex-shrink-0 mt-0.5">
                            {action.severity === 'high' ? '🔴' : action.severity === 'medium' ? '🟡' : '✅'}
                          </span>
                          <div>
                            <p className={cn("text-[10px] font-black", isDark ? "text-white" : "text-slate-900")}>{action.text}</p>
                            <p className={cn("text-[9px] font-bold mt-0.5 leading-relaxed", isDark ? "text-white/40" : "text-slate-500")}>{action.remedy}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className={cn("font-black text-sm tracking-tight", isDark ? "text-white" : "text-slate-900")}>{t.waterHistory}</h2>
                {pond.status !== 'harvested' && (
                  <button
                    onClick={() => navigate(`/ponds/${pond.id}/water-log`)}
                    className="bg-[#0D523C] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1"
                  >
                    <Plus size={12} /> {t.logConditions}
                  </button>
                )}
              </div>

              {pondRecords.length === 0 ? (
                <div className={cn("rounded-[2rem] p-10 border border-dashed text-center", isDark ? "bg-white/3 border-white/10" : "bg-white border-slate-200")}>
                  <Calendar size={36} className={cn("mx-auto mb-3", isDark ? "text-white/20" : "text-ink/20")} />
                  <p className={cn("font-black text-sm tracking-tight", isDark ? "text-white/40" : "text-ink/40")}>No history yet</p>
                </div>
              ) : pondRecords.slice(0, 14).map((rec, i) => {
                let score = 0, count = 0;
                for (const cfg of PARAM_CONFIG) {
                  const v = (rec as any)[cfg.key];
                  if (v === undefined) continue;
                  const st = getStatus(cfg, v);
                  score += st === 'optimal' ? 100 : st === 'warning' ? 60 : 20;
                  count++;
                }
                const dayScore = count > 0 ? Math.round(score / count) : 75;
                const isToday  = rec.date === new Date().toISOString().split('T')[0];
                const recDoc   = Math.floor((new Date(rec.date).getTime() - new Date(pond.stockingDate).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={cn("rounded-[2rem] overflow-hidden border", isDark ? "bg-[#0D1520] border-white/5" : "bg-white border-slate-100 shadow-sm")}
                  >
                    {/* Date row */}
                    <div className={cn("px-5 py-3 flex items-center justify-between border-b", isDark ? "border-white/5" : "border-slate-100")}>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-[1.2rem] flex flex-col items-center justify-center border",
                          isToday ? "bg-emerald-500 border-emerald-500 text-white" : isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
                        )}>
                          <p className={cn("text-[6px] font-black uppercase leading-none", isToday ? "text-white/70" : isDark ? "text-white/30" : "text-slate-400")}>
                            {new Date(rec.date).toLocaleString('default', { month: 'short' })}
                          </p>
                          <p className={cn("text-sm font-black leading-none", isToday ? "text-white" : isDark ? "text-white" : "text-slate-800")}>
                            {new Date(rec.date).getDate()}
                          </p>
                        </div>
                        <div>
                          <p className={cn("font-black text-sm tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                            {isToday ? 'Today' : new Date(rec.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                          <p className={cn("text-[7px] font-black uppercase tracking-widest", isDark ? "text-white/30" : "text-slate-400")}>
                            DOC {Math.max(0, recDoc)}
                          </p>
                        </div>
                      </div>
                      <div className={cn("px-3 py-1.5 rounded-xl text-[9px] font-black border",
                        dayScore >= 80 ? isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-100 border-emerald-200 text-emerald-600' :
                        dayScore >= 60 ? isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-100 border-amber-200 text-amber-600' :
                        isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-100 border-red-200 text-red-600'
                      )}>
                        {dayScore >= 80 ? '✅' : dayScore >= 60 ? '⚠️' : '🔴'} {dayScore}
                      </div>
                    </div>

                    {/* Parameter chips */}
                    <div className="px-5 py-3 grid grid-cols-3 gap-2">
                      {PARAM_CONFIG.map(cfg => {
                        const v = (rec as any)[cfg.key];
                        if (v === undefined) return null;
                        const st = getStatus(cfg, v);
                        return (
                          <div key={cfg.key} className={cn(
                            'rounded-xl px-2 py-2 text-center',
                            st === 'optimal' ? isDark ? 'bg-emerald-500/5' : 'bg-emerald-50' :
                            st === 'warning'  ? isDark ? 'bg-amber-500/5'  : 'bg-amber-50' :
                            isDark ? 'bg-red-500/5' : 'bg-red-50'
                          )}>
                            <p className={cn("text-[6px] font-black uppercase tracking-widest", isDark ? "text-white/25" : "text-slate-400")}>{getParamLabel(cfg.key, t)}</p>
                            <p className={cn('font-black text-sm leading-tight',
                              st === 'optimal' ? isDark ? 'text-emerald-400' : 'text-emerald-600' :
                              st === 'warning'  ? isDark ? 'text-amber-400' : 'text-amber-600' :
                              isDark ? 'text-red-400' : 'text-red-600'
                            )}>{v}</p>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ── HARVEST TAB ── */}
          {activeTab === 'harvest' && (
            <motion.div key="harvest" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Count tracker card */}
              <div className={cn("rounded-[2rem] overflow-hidden border shadow-sm", isDark ? "bg-[#0D1520] border-white/5" : "bg-white border-slate-100")}>
                {/* Header */}
                <div className={cn("px-5 pt-4 pb-3 border-b", isDark ? "border-white/5 bg-[#02130F]" : "border-slate-100 bg-emerald-700")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                        <Fish size={17} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-black text-sm tracking-tight">Harvest Intelligence</h3>
                        <p className="text-white/50 text-[7px] font-black uppercase tracking-widest">DOC {doc} · Count tracker</p>
                      </div>
                    </div>
                    <div className={cn("px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border",
                      isAtPremiumCount ? "bg-emerald-400/20 border-emerald-400/30 text-emerald-300" : "bg-[#C78200]/20 border-[#C78200]/30 text-amber-300"
                    )}>
                      {isAtPremiumCount ? '🎯 Harvest Now' : '👁 Monitoring'}
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {/* Big count number */}
                  <div className="flex items-end gap-4 mb-5 pb-5 border-b border-card-border">
                    <div>
                      <p className={cn("text-[7px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/30" : "text-slate-400")}>Est. Count/kg</p>
                      <p className={cn("text-5xl font-black tracking-tighter leading-none", isDark ? "text-white" : "text-slate-800")}>
                        {estimatedCountPerKg > 200 ? '???'  : `~${estimatedCountPerKg}`}
                        <span className={cn("text-lg ml-1", isDark ? "text-white/20" : "text-slate-300")}>/kg</span>
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className={cn("text-[7px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/30" : "text-slate-400")}>Est. Biomass</p>
                      <p className={cn("text-2xl font-black tracking-tighter", isDark ? "text-white" : "text-slate-800")}>
                        {(estWeightKg / 1000).toFixed(1)}T
                      </p>
                    </div>
                  </div>

                  {/* Market rate match */}
                  {matchedRate && (
                    <div className={cn("rounded-2xl p-4 border mb-4 flex items-center justify-between",
                      isAtPremiumCount ? isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                      : isDark ? 'bg-amber-500/5 border-amber-500/15' : 'bg-amber-50 border-amber-100'
                    )}>
                      <div>
                        <p className={cn("text-[8px] font-black uppercase tracking-widest mb-0.5", isDark ? "text-white/30" : "text-slate-400")}>
                          Current Market Rate
                        </p>
                        <p className={cn("text-2xl font-black tracking-tighter", isAtPremiumCount ? isDark ? "text-emerald-400" : "text-emerald-700" : isDark ? "text-amber-400" : "text-amber-700")}>
                          ₹{matchedRate.price}<span className="text-sm font-bold">/kg</span>
                        </p>
                        <p className={cn("text-[8px] font-bold mt-0.5", isDark ? "text-white/25" : "text-slate-400")}>{matchedRate.demand} demand</p>
                      </div>
                      <div className={cn("text-right")}>
                        <p className={cn("text-[7px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/30" : "text-slate-400")}>Est. Revenue</p>
                        <p className={cn("text-xl font-black tracking-tighter", isDark ? "text-white" : "text-slate-800")}>
                          ₹{((estWeightKg / 1000) * matchedRate.price * 1000).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </p>
                        <p className={cn("text-[7px] font-bold", isDark ? "text-white/20" : "text-slate-400")}>total estimate</p>
                      </div>
                    </div>
                  )}

                  {/* Progress bar to harvest */}
                  <p className={cn("text-[7px] font-black uppercase tracking-widest mb-2", isDark ? "text-white/30" : "text-slate-400")}>
                    {harvestReady ? 'Harvest Window Open' : `${daysToHarvest} days to standard harvest`}
                  </p>
                  <div className={cn("w-full h-2 rounded-full overflow-hidden mb-1", isDark ? "bg-white/10" : "bg-slate-200")}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${Math.min(100, (doc / 90) * 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={harvestReady ? 'h-full bg-emerald-500 rounded-full' : 'h-full bg-[#C78200] rounded-full'}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className={cn("text-[6px] font-black uppercase tracking-widest", isDark ? "text-white/20" : "text-slate-400")}>Stocked</span>
                    <span className={cn("text-[6px] font-black uppercase tracking-widest", isDark ? "text-white/20" : "text-slate-400")}>DOC 90</span>
                  </div>

                  {/* Stocking stats */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-card-border">
                    {[
                      { label: t.estSurvivingCount,  value: `${(estimatedLiveCount / 1000).toFixed(0)}K` },
                      { label: t.survivalRate_short,   value: `${(survivalRate * 100).toFixed(0)}%` },
                      { label: t.biomassEst,           value: `${currentWeightG.toFixed(1)}g` },
                    ].map((s, i) => (
                      <div key={i} className="text-center">
                        <p className={cn("font-black text-sm tracking-tighter", isDark ? "text-white" : "text-slate-800")}>{s.value}</p>
                        <p className={cn("text-[6px] font-black uppercase tracking-widest mt-0.5", isDark ? "text-white/20" : "text-slate-400")}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Market rate ticker */}
              <LiveMarketTicker marketRates={marketRates} estimatedCountPerKg={estimatedCountPerKg} isDark={isDark} />

              {/* Harvest status */}
              <div className={cn('rounded-[2rem] p-5 relative overflow-hidden text-white shadow-xl', harvestReady ? 'bg-gradient-to-br from-[#0D523C] to-[#065F46]' : 'bg-gradient-to-br from-indigo-900 to-indigo-950')}>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />
                <div className="relative z-10">
                  <p className="text-white/40 text-[8px] font-black uppercase tracking-widest">{harvestReady ? 'Harvest Ready' : 'Harvest Forecast'}</p>
                  {harvestReady ? (
                    <>
                      <p className="text-white font-black text-4xl tracking-tighter mt-2 mb-2">Ready Now!</p>
                      <p className="text-emerald-300 text-[9px] font-black uppercase tracking-widest">DOC {doc} · ~{estimatedCountPerKg}/kg</p>
                    </>
                  ) : (
                    <>
                      <p className="text-white font-black text-4xl tracking-tighter mt-2 mb-2">{daysToHarvest} days left</p>
                      <p className="text-indigo-300 text-[9px] font-black uppercase tracking-widest">Target: DOC 90 · {currentWeightG.toFixed(1)}g avg</p>
                    </>
                  )}
                </div>
              </div>

              {/* Extension plans */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <PackageCheck size={18} className="text-[#C78200]" />
                  <div>
                    <h2 className={cn("font-black text-sm tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                      {harvestReady ? "Can't Harvest Yet? Extension Plans" : "Pre-Harvest Extension Options"}
                    </h2>
                    <p className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/30" : "text-slate-400")}>
                      Tap to view full SOP
                    </p>
                  </div>
                </div>

                {EXTENSION_PLANS.map((plan, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => setShowExtension(plan)}
                    className={cn('w-full rounded-[2rem] p-5 border shadow-sm text-left transition-all active:scale-[0.98]',
                      isDark ? i === 2 ? 'bg-red-500/5 border-red-500/15' : i === 1 ? 'bg-amber-500/5 border-amber-500/15' : 'bg-emerald-500/5 border-emerald-500/15'
                      : i === 2 ? 'bg-white border-red-100 hover:border-red-200' : i === 1 ? 'bg-white border-amber-100 hover:border-amber-200' : 'bg-white border-emerald-100 hover:border-emerald-200'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0',
                          i === 2 ? isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-500' :
                          i === 1 ? isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-500' :
                          isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                        )}>
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className={cn("font-black text-sm tracking-tight", isDark ? "text-white" : "text-slate-900")}>{plan.label}</p>
                          <p className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/30" : "text-slate-400")}>
                            Up to DOC {plan.maxDoc} · {plan.sopSteps.length} SOP steps
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full border',
                          i === 2 ? isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 text-red-500 border-red-100' :
                          i === 1 ? isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-500 border-amber-100' :
                          isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-500 border-emerald-100'
                        )}>
                          {i === 2 ? 'HIGH RISK' : i === 1 ? 'MEDIUM' : 'SAFE'}
                        </span>
                        <ArrowRight size={14} className={isDark ? "text-white/20" : "text-slate-300"} />
                      </div>
                    </div>
                    <p className={cn("mt-3 text-[9px] font-medium", isDark ? "text-white/25" : "text-slate-400")}>{plan.risks[0]}</p>
                  </motion.button>
                ))}

                {/* Emergency */}
                <div className={cn("rounded-[2rem] p-5 border", isDark ? "bg-red-500/5 border-red-500/20" : "bg-red-50 border-red-200")}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center text-white">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <p className={cn("font-black text-sm tracking-tight", isDark ? "text-red-300" : "text-slate-900")}>Emergency Harvest Protocol</p>
                      <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">Immediate action</p>
                    </div>
                  </div>
                  <p className={cn("text-[10px] font-medium leading-relaxed mb-3", isDark ? "text-white/50" : "text-ink/60")}>
                    If disease, DO crash, or mass mortality begins: harvest immediately. Partial harvest retains remaining shrimp. Contact your nearest buyer — emergency pricing is recoverable.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Contact Buyer Now', 'Report Disease'].map((label, i) => (
                      <button key={i} className={cn('py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest', i === 0 ? 'bg-[#0D523C] text-white' : 'bg-red-500 text-white')}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── LIVE MARKET RATE TICKER ─────────────────────────────────────────────────
const LiveMarketTicker = ({
  marketRates, estimatedCountPerKg, isDark,
}: {
  marketRates: { count: number; price: number; demand: string; trend: string }[];
  estimatedCountPerKg: number;
  isDark: boolean;
}) => {
  const tickerRef     = useRef<HTMLDivElement>(null);
  const animFrameRef  = useRef<number>(0);
  const speedRef      = useRef(0.6);

  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;
    let pos = 0;
    const scrollWidth = ticker.scrollWidth / 2;
    const animate = () => {
      pos += speedRef.current;
      if (pos >= scrollWidth) pos = 0;
      ticker.style.transform = `translateX(-${pos}px)`;
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const items = [...marketRates, ...marketRates];

  return (
    <div className={cn("rounded-[1.8rem] overflow-hidden border shadow-xl", isDark ? "bg-[#02130F] border-white/5" : "bg-slate-900 border-white/5")}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Live Market Rates</p>
        </div>
        <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">₹/Kg · Local</p>
      </div>
      <div className="overflow-hidden py-3">
        <div ref={tickerRef} className="flex gap-2.5 px-4" style={{ willChange: 'transform' }}>
          {items.map((rate, i) => {
            const isCurrent = estimatedCountPerKg <= rate.count + 5 && estimatedCountPerKg >= rate.count - 5;
            return (
              <div key={i} className={cn(`flex-shrink-0 rounded-xl px-3 py-2 border transition-all`,
                isCurrent ? 'bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.15)]' :
                rate.trend === 'up' ? 'bg-white/5 border-white/10' :
                rate.trend === 'down' ? 'bg-red-900/10 border-red-500/10' : 'bg-white/10 border-white/5'
              )}>
                <div className="flex items-center gap-1.5 mb-1">
                  <p className={`text-[7px] font-black uppercase tracking-widest ${isCurrent ? 'text-emerald-300' : 'text-white/30'}`}>{rate.count}/kg</p>
                  {isCurrent && <span className="text-[5px] bg-emerald-400/20 text-emerald-300 px-1 py-0.5 rounded-full font-black border border-emerald-400/20">You</span>}
                </div>
                <p className={`font-black text-base tracking-tighter leading-none ${isCurrent ? 'text-emerald-300' : rate.trend === 'up' ? 'text-white' : rate.trend === 'down' ? 'text-red-400' : 'text-white/70'}`}>
                  ₹{rate.price}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {rate.trend === 'up' ? <TrendingUp size={8} className="text-emerald-400" /> : rate.trend === 'down' ? <TrendingDown size={8} className="text-red-400" /> : <Minus size={8} className="text-white/20" />}
                  <p className={`text-[6px] font-black uppercase tracking-widest ${rate.demand === 'HIGH' || rate.demand === 'ULTRA HIGH' ? 'text-emerald-400' : rate.demand === 'STABLE' ? 'text-blue-400' : rate.demand === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'}`}>{rate.demand}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer grid */}
      <div className="grid grid-cols-4 gap-0 border-t border-white/5">
        {marketRates.slice(0, 4).map((rate, i) => {
          const isCur = estimatedCountPerKg <= rate.count + 5 && estimatedCountPerKg >= rate.count - 5;
          return (
            <div key={i} className={`px-2 py-2.5 text-center border-r last:border-r-0 border-white/5 ${isCur ? 'bg-emerald-500/10' : ''}`}>
              <p className={`text-[7px] font-black uppercase tracking-widest ${isCur ? 'text-emerald-400' : 'text-white/20'}`}>{rate.count}/kg</p>
              <p className={`font-black text-xs tracking-tighter mt-0.5 ${isCur ? 'text-emerald-300' : 'text-white/60'}`}>₹{rate.price}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
