import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Activity, Droplets, Thermometer, Waves,
  AlertTriangle, CheckCircle2, Plus, Clock, TrendingUp,
  TrendingDown, Minus, Calendar, ArrowRight, ShieldCheck,
  Zap, FlaskConical, PackageCheck, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { calculateDOC } from '../../utils/pondUtils';
import { cn } from '../../utils/cn';
import { Header } from '../../components/Header';
import type { Translations } from '../../translations';

// ─── PARAMETER RANGES ────────────────────────────────────────────────────────
interface ParamConfig {
  key: string; label: string; unit: string; icon: React.ElementType;
  min: number; max: number; dangerLow?: number; dangerHigh?: number;
  format?: (v: number) => string;
}

const PARAM_CONFIG: ParamConfig[] = [
  { key: 'ph',          label: 'pH',        unit: '',     icon: FlaskConical, min: 7.5, max: 8.5, dangerLow: 7.0, dangerHigh: 9.0 },
  { key: 'do',          label: 'DO',        unit: 'mg/L', icon: Waves,        min: 5.0, max: 10.0, dangerLow: 3.0 },
  { key: 'temperature', label: 'Temp',      unit: '°C',   icon: Thermometer,  min: 26,  max: 30, dangerLow: 22, dangerHigh: 34 },
  { key: 'salinity',    label: 'Salinity',  unit: 'ppt',  icon: Droplets,     min: 10,  max: 20, dangerLow: 5, dangerHigh: 30 },
  { key: 'ammonia',     label: 'Ammonia',   unit: 'mg/L', icon: Zap,          min: 0,   max: 0.05, dangerHigh: 0.1 },
  { key: 'alkalinity',  label: 'Alkalinity',unit: 'mg/L', icon: Activity,     min: 100, max: 150, dangerLow: 80 },
];

const getStatus = (cfg: ParamConfig, val: number): 'optimal' | 'warning' | 'danger' => {
  if (cfg.dangerLow !== undefined && val < cfg.dangerLow) return 'danger';
  if (cfg.dangerHigh !== undefined && val > cfg.dangerHigh) return 'danger';
  if (val < cfg.min || val > cfg.max) return 'warning';
  return 'optimal';
};

const statusColor = {
  optimal: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', icon: 'bg-emerald-500 text-white', badge: 'bg-emerald-100 text-emerald-600' },
  warning: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-600',   icon: 'bg-amber-500 text-white',   badge: 'bg-amber-100 text-amber-600' },
  danger:  { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-600',     icon: 'bg-red-500 text-white',     badge: 'bg-red-100 text-red-600' },
};

// ─── HARVEST EXTENSION SOP ───────────────────────────────────────────────────
interface ExtensionPeriod {
  weeks: number;
  label: string;
  maxDoc: number;
  sopSteps: string[];
  risks: string[];
  medicines: { name: string; schedule: string; brand: string }[];
  feedAdj: string;
}

const EXTENSION_PLANS: ExtensionPeriod[] = [
  {
    weeks: 1,
    label: '1-Week Extension',
    maxDoc: 107,
    sopSteps: [
      'Maintain daily water parameter logging',
      'Continue gut + water probiotic on Monday/Tuesday schedule',
      'Run all aerators 24/7 for this week',
      'Reduce feed by 10% (shrimp near harvest weight, gut activity slows)',
      'Check tray consumption twice daily',
    ],
    risks: ['Slight FCR increase', 'Minor DO stress possible above DOC 100'],
    medicines: [
      { name: 'Vitamin C + Immunity Booster', schedule: 'Every 2 days, with feed', brand: 'CP Vita-C Pro' },
      { name: 'Gut Probiotic', schedule: 'Daily with morning feed', brand: 'Avanti Gut Health' },
    ],
    feedAdj: '-10% from standard rate. Increase water exchange to 10%/day.',
  },
  {
    weeks: 2,
    label: '2-Week Extension',
    maxDoc: 114,
    sopSteps: [
      'Increase water exchange to 15–20% daily',
      'Run intensive probiotic treatment every 3 days',
      'Monitor for disease signs twice daily',
      'Reduce stocking density if possible (partition pond)',
      'Apply mineral booster once per week',
    ],
    risks: ['High FCR deterioration', 'Increased Vibriosis risk', 'DO crash risk at high biomass'],
    medicines: [
      { name: 'Mineral Mix (High Dose)', schedule: 'Every Monday & Friday', brand: 'Sanolife PRO-W' },
      { name: 'Immunity Booster + Liver Tonic', schedule: 'Every 3 days in feed', brand: 'CP Hepato-Pro' },
      { name: 'Water Probiotic', schedule: 'Every 2 days in water', brand: 'Bioclean Aqua Plus' },
    ],
    feedAdj: '-15% from standard rate. Add zeolite 5 kg/acre twice weekly.',
  },
  {
    weeks: 3,
    label: '3-Week Extension',
    maxDoc: 121,
    sopSteps: [
      '⚠️ HIGH RISK EXTENSION — not recommended unless market price is very high',
      'Daily water exchange 20–25%',
      'Full emergency SOP: DO monitoring every 4 hours',
      'Emergency aeration standby equipment ready',
      'Pre-harvest sample and market coordination should be active',
    ],
    risks: [
      'Very high mortality risk above DOC 110',
      'Mass disease outbreak probability increases significantly',
      'DO crashes likely during rainy nights',
    ],
    medicines: [
      { name: 'Emergency Immunity Protocol', schedule: 'Daily', brand: 'CP Immuno-Shield' },
      { name: 'Anti-Vibrio Probiotic', schedule: 'Every 2 days', brand: 'Bioclean Pro-V' },
    ],
    feedAdj: '-25% from standard rate. Emergency harvest capability must be kept ready.',
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export const PondMonitor = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { ponds, waterRecords } = useData();
  const pond = ponds.find(p => p.id === id) || ponds[0];

  const [activeTab, setActiveTab] = useState<'health' | 'history' | 'harvest'>('health');
  const [showExtension, setShowExtension] = useState<ExtensionPeriod | null>(null);

  if (!pond) {
    return (
      <div className="p-10 text-center text-[#4A2C2A] font-black uppercase tracking-widest bg-white min-h-screen flex items-center justify-center">
        Pond not found
      </div>
    );
  }

  const doc = calculateDOC(pond.stockingDate);

  // Sort all records for this pond, newest first
  const pondRecords = useMemo(() =>
    waterRecords
      .filter(r => r.pondId === pond.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [waterRecords, pond.id]
  );

  const latestRecord = pondRecords[0];
  const prevRecord = pondRecords[1];

  // Health score from latest record
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

  // Trend arrow: compare today vs yesterday
  const getTrend = (key: string): 'up' | 'down' | 'same' | null => {
    if (!latestRecord || !prevRecord) return null;
    const curr = (latestRecord as any)[key];
    const prev = (prevRecord as any)[key];
    if (curr === undefined || prev === undefined) return null;
    const diff = curr - prev;
    if (Math.abs(diff) < 0.01) return 'same';
    return diff > 0 ? 'up' : 'down';
  };

  // Corrective actions
  const todayActions = latestRecord ? (() => {
    const actions: { text: string; severity: 'high' | 'medium' | 'ok' }[] = [];
    const r = latestRecord;
    if (r.ph < 7.5) actions.push({ text: 'pH low: Apply agricultural lime 5–10 kg/acre', severity: 'high' });
    if (r.ph > 8.5) actions.push({ text: 'pH high: Water exchange 10–15%', severity: 'high' });
    if (r.do < 5.0) actions.push({ text: 'DO critical: Run ALL aerators immediately. Stop feeding.', severity: 'high' });
    if (r.temperature > 32) actions.push({ text: 'High temp: Increase aeration, reduce noon feed 20%', severity: 'medium' });
    if (r.ammonia > 0.05) actions.push({ text: 'Ammonia high: Apply Bioclean Aqua 250g/acre + zeolite', severity: 'high' });
    if (r.alkalinity < 100) actions.push({ text: 'Low alkalinity: Apply 5–8kg/acre agricultural lime', severity: 'medium' });
    if (actions.length === 0) actions.push({ text: 'All parameters optimal — continue standard SOP', severity: 'ok' });
    return actions;
  })() : [];

  // Harvest readiness
  const targetDoc = 90; // standard harvest DOC
  const harvestReady = doc >= targetDoc;
  const daysToHarvest = Math.max(0, targetDoc - doc);
  const currentWeightG = Math.min(35, doc * 0.38);

  // Count per kg calculation (1000g ÷ avg shrimp weight)
  const estimatedCountPerKg = currentWeightG > 0 ? Math.round(1000 / currentWeightG) : 999;

  // Market rate data for ticker
  const marketRates = [
    { count: 20, price: 620, demand: 'ULTRA HIGH', trend: 'up' },
    { count: 30, price: 540, demand: 'HIGH', trend: 'up' },
    { count: 40, price: 490, demand: 'HIGH', trend: 'up' },
    { count: 50, price: 450, demand: 'STABLE', trend: 'stable' },
    { count: 60, price: 410, demand: 'STABLE', trend: 'stable' },
    { count: 70, price: 385, demand: 'MEDIUM', trend: 'down' },
    { count: 80, price: 365, demand: 'MEDIUM', trend: 'down' },
    { count: 100, price: 310, demand: 'LOW', trend: 'down' },
    { count: 120, price: 280, demand: 'LOW', trend: 'down' },
  ];

  // Find the best matching market bracket for current count
  const premiumCountBrackets = [20, 30, 40, 50];
  const matchedBracket = premiumCountBrackets.find(c => estimatedCountPerKg <= c + 5 && estimatedCountPerKg >= c - 5);
  const currentMarketRate = marketRates.find(r => r.count === (matchedBracket ?? 50));
  const isAtPremiumCount = !!matchedBracket && matchedBracket <= 50;
  const nearestPremiumBracket = premiumCountBrackets.reduce((p, c) => Math.abs(c - estimatedCountPerKg) < Math.abs(p - estimatedCountPerKg) ? c : p);
  const bestSellCountLabel = matchedBracket ? `${matchedBracket}/Kg` : `~${nearestPremiumBracket}/Kg`;

  return (
    <div className="pb-40 bg-[#F8F9FE] min-h-screen text-left">
      {/* Extension SOP Modal */}
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
              className="w-full max-w-md mx-auto bg-white rounded-t-[3rem] p-6 pb-12 max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-[#4A2C2A] font-black text-xl tracking-tight">{showExtension.label}</h2>
                  <p className="text-[9px] text-[#C78200] font-black uppercase tracking-widest mt-0.5">
                    Culture continues to DOC {showExtension.maxDoc}
                  </p>
                </div>
                <button onClick={() => setShowExtension(null)} className="w-10 h-10 bg-[#F8F9FE] rounded-2xl flex items-center justify-center">
                  <X size={18} className="text-[#4A2C2A]/40" />
                </button>
              </div>

              {/* SOP Steps */}
              <div className="space-y-4">
                <p className="text-[9px] font-black text-[#0D523C] uppercase tracking-widest">SOP Steps</p>
                {showExtension.sopSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 bg-emerald-50 rounded-2xl px-4 py-3 border border-emerald-100">
                    <span className="text-emerald-500 font-black text-xs flex-shrink-0 mt-0.5">{i + 1}.</span>
                    <p className="text-[#4A2C2A] text-[11px] font-bold leading-snug">{step}</p>
                  </div>
                ))}

                {/* Medicines */}
                <p className="text-[9px] font-black text-[#C78200] uppercase tracking-widest mt-4">Extension Medicines</p>
                {showExtension.medicines.map((med, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
                    <p className="text-[#4A2C2A] font-black text-xs tracking-tight">{med.name}</p>
                    <p className="text-[9px] text-[#C78200] font-black mt-0.5">{med.brand}</p>
                    <p className="text-[9px] text-[#4A2C2A]/40 font-medium mt-1">{med.schedule}</p>
                  </div>
                ))}

                {/* Feed Adjustment */}
                <div className="bg-amber-50 rounded-2xl px-4 py-3 border border-amber-100">
                  <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Feed Adjustment</p>
                  <p className="text-[11px] text-amber-800 font-bold">{showExtension.feedAdj}</p>
                </div>

                {/* Risks */}
                <div className="bg-red-50 rounded-2xl px-4 py-3 border border-red-100">
                  <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-2">Extension Risks</p>
                  {showExtension.risks.map((risk, i) => (
                    <p key={i} className="text-[10px] text-red-700 font-bold leading-snug mb-1">⚠️ {risk}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <Header
        title={t.pondMonitor}
        showBack
        onBack={() => navigate(-1)}
        rightElement={
          <button
            onClick={() => navigate(`/ponds/${pond.id}/water-log`)}
            className="w-11 h-11 bg-[#0D523C] rounded-2xl flex items-center justify-center text-white shadow-lg"
          >
            <Plus size={20} />
          </button>
        }
      />

      <div className="pt-28 px-5 space-y-5">

        {/* ── HEALTH SCORE HERO ── */}
        <div className={cn(
          'rounded-[2.2rem] p-5 relative overflow-hidden',
          !latestRecord ? 'bg-[#0D523C]' :
          healthScore! >= 80 ? 'bg-[#0D523C]' :
          healthScore! >= 60 ? 'bg-amber-700' : 'bg-red-700'
        )}>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white/40 text-[8px] font-black uppercase tracking-widest leading-none">Overall Health</p>
                {latestRecord ? (
                  <>
                    <p className="text-white font-black text-4xl tracking-tighter leading-none mt-2">
                      {healthScore}<span className="text-xl opacity-50">/100</span>
                    </p>
                    <p className="text-white/60 text-[8px] font-black uppercase tracking-widest mt-1.5">
                      {latestRecord.date === new Date().toISOString().split('T')[0] ? 'Today' : `Last: ${latestRecord.date}`}
                    </p>
                  </>
                ) : (
                  <p className="text-white font-black text-xl tracking-tight mt-2">No data yet</p>
                )}
              </div>
              <div className="text-right">
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center mb-1.5 ml-auto">
                  <Activity size={24} className="text-white" />
                </div>
                <p className="text-white/40 text-[7px] font-black uppercase tracking-widest">
                  {latestRecord ? (healthScore! >= 80 ? '✅ Healthy' : healthScore! >= 60 ? '⚠️ Monitor' : '🔴 Act Now') : 'Log Conditions'}
                </p>
              </div>
            </div>

            {/* Score bar */}
            {latestRecord && (
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-1">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${healthScore}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={cn('h-full rounded-full', healthScore! >= 80 ? 'bg-emerald-400' : healthScore! >= 60 ? 'bg-amber-400' : 'bg-red-400')}
                />
              </div>
            )}
          </div>
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-black/10 rounded-full" />
        </div>

        {/* ── LOG DAILY CONDITIONS CTA (if no recent log) ── */}
        {(!latestRecord || latestRecord.date !== new Date().toISOString().split('T')[0]) && (
          <motion.button
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(`/ponds/${pond.id}/water-log`)}
            className="w-full bg-amber-50 border border-amber-200 rounded-[2rem] px-5 py-4 flex items-center justify-between group hover:border-amber-400 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white">
                <Clock size={20} />
              </div>
              <div className="text-left">
                <p className="font-black text-sm text-[#4A2C2A] tracking-tight">Log Today's Conditions</p>
                <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest">Not logged yet today</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-amber-500 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        )}

        {/* ── TAB SWITCH ── */}
        <div className="grid grid-cols-3 gap-2">
          {(['health', 'history', 'harvest'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border',
                activeTab === tab
                  ? 'bg-[#0D523C] text-white border-[#0D523C] shadow-lg'
                  : 'bg-white text-[#4A2C2A]/40 border-black/5'
              )}
            >
              {tab === 'health' ? '📊 Health' : tab === 'history' ? '📅 History' : '🌾 Harvest'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── HEALTH TAB ── */}
          {activeTab === 'health' && (
            <motion.div key="health" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {!latestRecord ? (
                <div className="bg-white rounded-[2rem] p-10 border border-dashed border-[#4A2C2A]/10 text-center">
                  <Droplets size={36} className="text-[#4A2C2A]/20 mx-auto mb-3" />
                  <p className="font-black text-sm text-[#4A2C2A]/40 tracking-tight">No condition data yet</p>
                  <p className="text-[9px] text-[#4A2C2A]/25 font-medium mt-1">Tap the + button to log today's water parameters</p>
                  <button
                    onClick={() => navigate(`/ponds/${pond.id}/water-log`)}
                    className="mt-5 bg-[#0D523C] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                  >Log Conditions</button>
                </div>
              ) : (
                <>
                  {/* Parameter Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-[#4A2C2A] font-black text-sm tracking-tight uppercase opacity-60">Live Metrics</h2>
                      <span className="text-[7px] font-black text-[#4A2C2A]/30 bg-white px-2.5 py-1 rounded-lg border border-black/5 uppercase tracking-widest">
                        {latestRecord.date}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {PARAM_CONFIG.map(cfg => {
                         const val = (latestRecord as any)[cfg.key];
                         if (val === undefined) return null;
                         const st = getStatus(cfg, val);
                         const sc = statusColor[st];
                         const trend = getTrend(cfg.key);
                         return (
                           <motion.div
                             key={cfg.key}
                             initial={{ opacity: 0, scale: 0.95 }}
                             animate={{ opacity: 1, scale: 1 }}
                             className={cn('rounded-2xl p-3 border', sc.bg, sc.border)}
                           >
                             <div className="flex items-center gap-2 mb-1.5">
                               <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', sc.icon)}>
                                 <cfg.icon size={12} />
                               </div>
                               <p className="text-[7px] font-black text-[#4A2C2A]/40 uppercase tracking-widest leading-none">{cfg.label}</p>
                             </div>
                             <div className="flex items-baseline gap-1">
                               <p className={cn('font-black text-xl tracking-tighter', sc.text)}>{val}</p>
                               <p className="text-[7px] font-black text-[#4A2C2A]/30">{cfg.unit}</p>
                               {trend && (
                                 <span className="ml-auto">
                                   {trend === 'up' ? <TrendingUp size={10} className="text-blue-400" /> :
                                    trend === 'down' ? <TrendingDown size={10} className="text-red-400" /> :
                                    <Minus size={10} className="text-[#4A2C2A]/20" />}
                                 </span>
                               )}
                             </div>
                             <div className="mt-1 flex items-center gap-1">
                               <span className={cn('text-[6px] font-black uppercase tracking-widest px-1 py-0.5 rounded-full', sc.badge)}>
                                 {st}
                               </span>
                               <span className="text-[6px] text-[#4A2C2A]/20 font-black">{cfg.min}–{cfg.max}{cfg.unit}</span>
                             </div>
                           </motion.div>
                         );
                      })}
                    </div>
                  </div>

                  {/* Action Plan */}
                  <div className="bg-[#0D523C] rounded-[1.8rem] p-4 space-y-2 shadow-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck size={14} className="text-emerald-300" />
                      <p className="text-emerald-300/80 text-[8px] font-black uppercase tracking-widest">SOP Corrective Protocol</p>
                    </div>
                    {todayActions.map((action, i) => (
                      <div key={i} className={cn(
                        'rounded-xl px-3.5 py-2.5 border',
                        action.severity === 'high' ? 'bg-red-900/40 border-red-500/10' :
                        action.severity === 'medium' ? 'bg-amber-900/30 border-amber-500/10' :
                        'bg-white/5 border-white/5'
                      )}>
                        <p className="text-white font-bold text-[9px] leading-relaxed">{action.text}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[#4A2C2A] font-black text-base tracking-tight">Condition History</h2>
                <button
                  onClick={() => navigate(`/ponds/${pond.id}/water-log`)}
                  className="bg-[#0D523C] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1"
                >
                  <Plus size={12} /> Log Today
                </button>
              </div>

              {pondRecords.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-10 border border-dashed border-[#4A2C2A]/10 text-center">
                  <Calendar size={36} className="text-[#4A2C2A]/20 mx-auto mb-3" />
                  <p className="text-[#4A2C2A]/40 font-black text-sm tracking-tight">No history yet</p>
                </div>
              ) : pondRecords.slice(0, 10).map((rec, i) => {
                let score = 0, count = 0;
                for (const cfg of PARAM_CONFIG) {
                  const v = (rec as any)[cfg.key];
                  if (v === undefined) continue;
                  const st = getStatus(cfg, v);
                  score += st === 'optimal' ? 100 : st === 'warning' ? 60 : 20;
                  count++;
                }
                const dayScore = count > 0 ? Math.round(score / count) : 75;
                const isToday = rec.date === new Date().toISOString().split('T')[0];

                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-[2rem] p-5 border border-black/5 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-black text-sm text-[#4A2C2A] tracking-tight">
                          {isToday ? 'Today' : new Date(rec.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-[8px] text-[#4A2C2A]/30 font-black uppercase tracking-widest">DOC {calculateDOC(pond.stockingDate)}</p>
                      </div>
                      <div className={cn(
                        'px-3 py-1.5 rounded-xl text-[9px] font-black',
                        dayScore >= 80 ? 'bg-emerald-100 text-emerald-600' :
                        dayScore >= 60 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                      )}>
                        Score: {dayScore}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {PARAM_CONFIG.slice(0, 6).map(cfg => {
                        const v = (rec as any)[cfg.key];
                        if (v === undefined) return null;
                        const st = getStatus(cfg, v);
                        return (
                          <div key={cfg.key} className={cn(
                            'rounded-xl px-2 py-1.5 text-center',
                            st === 'optimal' ? 'bg-emerald-50' : st === 'warning' ? 'bg-amber-50' : 'bg-red-50'
                          )}>
                            <p className="text-[7px] font-black text-[#4A2C2A]/30 uppercase tracking-widest">{cfg.label}</p>
                            <p className={cn('font-black text-xs', statusColor[st].text)}>{v}</p>
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

              {/* ── COUNT-BASED HARVEST ALERT ── */}
              <CountHarvestAlert
                estimatedCountPerKg={estimatedCountPerKg}
                currentWeightG={currentWeightG}
                isAtPremiumCount={isAtPremiumCount}
                matchedBracket={matchedBracket}
                currentMarketRate={currentMarketRate}
                doc={doc}
                pond={pond}
              />

              {/* ── LIVE MARKET RATE TICKER ── */}
              <LiveMarketTicker marketRates={marketRates} estimatedCountPerKg={estimatedCountPerKg} />

              {/* Harvest Status Card */}
              <div className={cn(
                'rounded-[2rem] p-5 relative overflow-hidden text-white',
                harvestReady ? 'bg-[#0D523C]' : 'bg-indigo-900 shadow-lg'
              )}>
                <div className="relative z-10">
                  <p className="text-white/40 text-[8px] font-black uppercase tracking-widest leading-none">
                    {harvestReady ? 'Harvest Ready' : 'Harvest Forecast'}
                  </p>
                  {harvestReady ? (
                    <>
                      <p className="text-white font-black text-3xl tracking-tighter mt-1.5 mb-1.5">Ready Now!</p>
                      <p className="text-emerald-300 text-[9px] font-black uppercase tracking-widest">DOC {doc} • ~{estimatedCountPerKg}/kg</p>
                    </>
                  ) : (
                    <>
                      <p className="text-white font-black text-3xl tracking-tighter mt-1.5 mb-1.5">{daysToHarvest} days left</p>
                      <p className="text-indigo-300 text-[9px] font-black uppercase tracking-widest">Target: DOC 90 • {currentWeightG.toFixed(1)}g avg</p>
                    </>
                  )}

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/10 mt-3 overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(100, (doc / 90) * 100)}%` }} />
                  </div>
                  <div className="flex justify-between mt-1 opacity-20">
                    <span className="text-[6px] font-black uppercase tracking-widest text-white">Stock</span>
                    <span className="text-[6px] font-black uppercase tracking-widest text-white">Target</span>
                  </div>
                </div>
              </div>

              {/* If harvest is due / overdue — show extension plans */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <PackageCheck size={18} className="text-[#C78200]" />
                  <div>
                    <h2 className="text-[#4A2C2A] font-black text-base tracking-tight">
                      {harvestReady ? 'Can\'t Harvest Yet? Extension Plans' : 'Pre-Harvest Extension Options'}
                    </h2>
                    <p className="text-[9px] text-[#4A2C2A]/40 font-black uppercase tracking-widest">
                      If you need to delay harvest — tap to view full SOP
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
                    className={cn(
                      'w-full bg-white rounded-[2rem] p-5 border shadow-sm text-left transition-all active:scale-[0.98]',
                      i === 2 ? 'border-red-100 hover:border-red-200' :
                      i === 1 ? 'border-amber-100 hover:border-amber-200' : 'border-emerald-100 hover:border-emerald-200'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0',
                          i === 2 ? 'bg-red-100 text-red-500' :
                          i === 1 ? 'bg-amber-100 text-amber-500' : 'bg-emerald-100 text-emerald-600'
                        )}>
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="font-black text-sm text-[#4A2C2A] tracking-tight">{plan.label}</p>
                          <p className="text-[9px] text-[#4A2C2A]/40 font-black uppercase tracking-widest">
                            Up to DOC {plan.maxDoc} • {plan.sopSteps.length} SOP steps
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full border',
                          i === 2 ? 'bg-red-50 text-red-500 border-red-100' :
                          i === 1 ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'
                        )}>
                          {i === 2 ? 'HIGH RISK' : i === 1 ? 'MEDIUM' : 'SAFE'}
                        </span>
                        <ArrowRight size={16} className="text-[#4A2C2A]/20" />
                      </div>
                    </div>

                    {/* Risk preview */}
                    <div className="mt-3 text-[9px] text-[#4A2C2A]/40 font-medium">
                      {plan.risks[0]}
                    </div>
                  </motion.button>
                ))}

                {/* Emergency Harvest Option */}
                <div className="bg-red-50 rounded-[2rem] p-5 border border-red-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center text-white">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <p className="font-black text-sm text-[#4A2C2A] tracking-tight">Emergency Harvest Protocol</p>
                      <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">Immediate action</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#4A2C2A]/60 font-medium leading-relaxed">
                    If disease, DO crash, or mass mortality begins: harvest immediately even if weight target not met. Partial harvest retains remaining shrimp. Contact your nearest buyer — emergency pricing is recoverable.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {['Contact Buyer Now', 'Report Disease'].map((label, i) => (
                      <button key={i} className={cn(
                        'py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest',
                        i === 0 ? 'bg-[#0D523C] text-white' : 'bg-red-500 text-white'
                      )}>
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

// ─── COUNT-BASED HARVEST ALERT ───────────────────────────────────────────────
const CountHarvestAlert = ({
  estimatedCountPerKg,
  currentWeightG,
  isAtPremiumCount,
  matchedBracket,
  currentMarketRate,
  doc,
  pond,
}: {
  estimatedCountPerKg: number;
  currentWeightG: number;
  isAtPremiumCount: boolean;
  matchedBracket?: number;
  currentMarketRate?: { count: number; price: number; demand: string; trend: string };
  doc: number;
  pond: any;
}) => {
  // Survival rate estimate from pond data (default 80%)
  const survivalRate = pond.survivalRate ?? 0.80;
  const stockingCount = pond.seedCount ?? 100000;
  const estimatedLiveCount = Math.round(stockingCount * survivalRate);
  const estWeightKg = (estimatedLiveCount * currentWeightG) / 1000;

  // DOC-based harvest track stages
  const countStages = [
    { doc: 50, count: 100, label: 'Fry Stage', color: 'text-indigo-500' },
    { doc: 65, count: 70,  label: 'Growing',   color: 'text-blue-500' },
    { doc: 75, count: 55,  label: 'Mid-Grow',  color: 'text-amber-500' },
    { doc: 85, count: 45,  label: 'Near Ready', color: 'text-orange-500' },
    { doc: 90, count: 40,  label: '🟡 Premium Window', color: 'text-[#C78200]' },
    { doc: 100, count: 32, label: '🟢 Optimal Harvest', color: 'text-emerald-500' },
    { doc: 110, count: 28, label: '🟢 Max Yield',       color: 'text-emerald-600' },
  ];

  const currentStage = countStages.reduce((prev, curr) =>
    Math.abs(curr.doc - doc) < Math.abs(prev.doc - doc) ? curr : prev
  );

  const alertLevel = isAtPremiumCount
    ? matchedBracket && matchedBracket <= 30 ? 'premium'
    : matchedBracket && matchedBracket <= 50 ? 'ready'
    : 'watch'
    : 'watch';

  const alertStyles = {
    premium: 'bg-gradient-to-br from-[#0D523C] to-[#1a7a5a] border-emerald-500/30',
    ready:   'bg-gradient-to-br from-[#1a3a0d] to-[#2d5218] border-emerald-400/20',
    watch:   'bg-gradient-to-br from-[#2a1d0d] to-[#3d2b12] border-[#C78200]/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[2rem] p-5 border text-white relative overflow-hidden ${alertStyles[alertLevel]}`}
    >
      {/* Glow orb */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-[50px] opacity-25"
        style={{ background: alertLevel === 'premium' ? '#10b981' : alertLevel === 'ready' ? '#22c55e' : '#C78200' }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">Farmer Count Tracker</p>
            <h3 className="text-xl font-black tracking-tighter mt-1">
              {estimatedCountPerKg > 200 ? '???/kg' : `~${estimatedCountPerKg}/kg`}
            </h3>
          </div>
          <div className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border ${
            alertLevel === 'premium' ? 'bg-emerald-400/20 border-emerald-400/30 text-emerald-300' :
            alertLevel === 'ready'   ? 'bg-green-400/20 border-green-400/30 text-green-300' :
                                       'bg-[#C78200]/20 border-[#C78200]/30 text-[#C78200]'
          }`}>
            {alertLevel === 'premium' ? '🎯 Harvest Now' : alertLevel === 'ready' ? '✅ Ready' : '👁 Monitoring'}
          </div>
        </div>

        {/* Alert message */}
        {isAtPremiumCount && currentMarketRate ? (
          <div className={`rounded-xl px-3 py-2.5 mb-3.5 ${
            alertLevel === 'premium' ? 'bg-emerald-400/15 border border-emerald-400/20' :
            'bg-green-400/10 border border-green-400/15'
          }`}>
            <p className="text-[10px] font-black text-white leading-snug">
              🔔 Shrimp at <span className="text-emerald-300 font-black">{matchedBracket}/kg count</span> —{' '}
              <span className="text-emerald-300 uppercase">{currentMarketRate.demand} demand</span>.
              Market rate: <span className="text-emerald-300">₹{currentMarketRate.price}/kg</span>.
              <span className="opacity-60 block mt-1">This is your optimal harvest window.</span>
            </p>
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl px-3 py-2.5 mb-3.5 border border-white/10">
            <p className="text-[9px] font-bold text-white/50 leading-snug">
              Currently at <span className="text-white font-black">{currentStage.label}</span>. 
              Premium window approaches at DOC 90+.
            </p>
          </div>
        )}

        {/* DOC Count Track */}
        <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-2.5">Count Track — DOC Progress</p>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {countStages.map((stage, i) => {
            const isPast = doc >= stage.doc;
            const isCurrent = Math.abs(stage.doc - doc) < 8;
            return (
              <div key={i} className={`flex flex-col items-center gap-1 flex-shrink-0 ${
                isCurrent ? 'opacity-100' : isPast ? 'opacity-60' : 'opacity-25'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCurrent
                    ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                    : isPast
                    ? 'bg-white/20 border-white/30'
                    : 'bg-white/5 border-white/10'
                }`}>
                  {isPast && !isCurrent && <CheckCircle2 size={10} className="text-white" />}
                  {isCurrent && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                </div>
                <p className="text-[6px] font-black text-white/40 uppercase whitespace-nowrap leading-none mt-1">D{stage.doc}</p>
                <p className={`text-[7px] font-black whitespace-nowrap mt-0.5 ${
                  isCurrent ? 'text-emerald-300' : 'text-white/30'
                }`}>{stage.count}/k</p>
              </div>
            );
          })}
        </div>

        {/* Estimated Biomass */}
        <div className="mt-3.5 pt-3.5 border-t border-white/10 grid grid-cols-3 gap-2">
          <div>
            <p className="text-[7px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Biomass</p>
            <p className="font-black text-sm tracking-tighter">{(estWeightKg / 1000).toFixed(1)}T</p>
          </div>
          <div>
            <p className="text-[7px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Live Count</p>
            <p className="font-black text-sm tracking-tighter">{(estimatedLiveCount / 1000).toFixed(0)}K</p>
          </div>
          <div>
            <p className="text-[7px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Survival</p>
            <p className="font-black text-sm tracking-tighter">{(survivalRate * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── LIVE MARKET RATE TICKER ─────────────────────────────────────────────────
const LiveMarketTicker = ({
  marketRates,
  estimatedCountPerKg,
}: {
  marketRates: { count: number; price: number; demand: string; trend: string }[];
  estimatedCountPerKg: number;
}) => {
  const tickerRef = useRef<HTMLDivElement>(null);
  const [tickerOffset, setTickerOffset] = useState(0);
  const animFrameRef = useRef<number>(0);
  const speedRef = useRef(0.6);

  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;
    let pos = 0;
    const scrollWidth = ticker.scrollWidth / 2;

    const animate = () => {
      pos += speedRef.current;
      if (pos >= scrollWidth) pos = 0;
      setTickerOffset(pos);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const items = [...marketRates, ...marketRates];

  return (
    <div className="bg-[#02130F] rounded-[1.8rem] overflow-hidden border border-white/5 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none">Live Market Rates</p>
        </div>
        <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">₹/Kg · Local</p>
      </div>

      <div className="overflow-hidden py-3">
        <div
          ref={tickerRef}
          className="flex gap-2.5 px-4"
          style={{ transform: `translateX(-${tickerOffset}px)`, willChange: 'transform' }}
        >
          {items.map((rate, i) => {
            const isCurrentCount = estimatedCountPerKg <= rate.count + 5 && estimatedCountPerKg >= rate.count - 5;
            return (
              <div
                key={i}
                className={`flex-shrink-0 rounded-xl px-3 py-2 border transition-all ${
                  isCurrentCount
                    ? 'bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.15)]'
                    : rate.trend === 'up'
                    ? 'bg-white/5 border-white/10'
                    : rate.trend === 'down'
                    ? 'bg-red-900/10 border-red-500/10'
                    : 'bg-white/10 border-white/5'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <p className={`text-[7px] font-black uppercase tracking-widest ${isCurrentCount ? 'text-emerald-300' : 'text-white/30'}`}>{rate.count}/kg</p>
                  {isCurrentCount && (
                    <span className="text-[5px] bg-emerald-400/20 text-emerald-300 px-1 py-0.5 rounded-full font-black uppercase tracking-widest border border-emerald-400/20">You</span>
                  )}
                </div>
                <p className={`font-black text-base tracking-tighter leading-none ${isCurrentCount ? 'text-emerald-300' : rate.trend === 'up' ? 'text-white' : rate.trend === 'down' ? 'text-red-400' : 'text-white/70'}`}>
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

      <div className="grid grid-cols-3 gap-0 border-t border-white/5">
        {marketRates.slice(0, 6).map((rate, i) => {
          const isCurrent = estimatedCountPerKg <= rate.count + 5 && estimatedCountPerKg >= rate.count - 5;
          return (
            <div key={i} className={`px-2 py-2.5 text-center border-r border-b border-white/5 last:border-r-0 ${isCurrent ? 'bg-emerald-500/10' : ''}`}>
              <p className={`text-[7px] font-black uppercase tracking-widest ${isCurrent ? 'text-emerald-400' : 'text-white/20'}`}>{rate.count}/kg</p>
              <p className={`font-black text-xs tracking-tighter mt-0.5 ${isCurrent ? 'text-emerald-300' : 'text-white/60'}`}>₹{rate.price}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
