import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, CheckCircle2, Clock, Zap, Droplets, AlertTriangle,
  ArrowRight, ClipboardCheck, Activity, Fish, Scale, Beaker,
  Shield, Info, Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { NoPondState } from '../../components/NoPondState';
import type { Translations } from '../../translations';
import { calculateDOC } from '../../utils/pondUtils';
import { cn } from '../../utils/cn';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface SOPQuestion {
  key: string;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  critical?: boolean;
}

// ─── SOP QUESTIONS BY STAGE ──────────────────────────────────────────────────
const getStageConfig = (doc: number, t: Translations): {
  stageLabel: string;
  stageColor: string;
  stageBg: string;
  tip: string;
  questions: SOPQuestion[];
} => {
  if (doc === 0) return {
    stageLabel: 'Stocking Day',
    stageColor: 'text-blue-400',
    stageBg: 'from-blue-900 to-indigo-950',
    tip: 'First 24 hours are critical. No feeding. Monitor survival & aeration constantly.',
    questions: [
      { key: 'acclimatizationDone', label: t.acclimatizationDone, sublabel: 'Float bags 20–30 min before release', icon: Droplets, critical: true },
      { key: 'probioticApplied',    label: t.probioticApplied,    sublabel: 'Apply water probiotic at release', icon: Beaker },
      { key: 'aerationReady',       label: 'Aeration Ready?',     sublabel: 'All aerators ON full capacity',    icon: Zap, critical: true },
      { key: 'noFeedFirst',         label: 'No Feeding (First 4h)?', sublabel: 'Let shrimp settle before feeding', icon: Fish },
    ],
  };
  if (doc <= 10) return {
    stageLabel: t.earlyStage,
    stageColor: 'text-indigo-400',
    stageBg: 'from-indigo-900 to-slate-950',
    tip: 'Early stage is about probiotic establishment. Starter feed 4–5× per day.',
    questions: [
      { key: 'starterFeed',     label: 'Starter Feed (4–5× Today)?',  sublabel: 'Micro-particle Starter S1/S2',  icon: Fish, critical: true },
      { key: 'probioticApplied',label: 'Water Probiotic Done?',       sublabel: 'Apply to pond water each morning', icon: Beaker },
      { key: 'mineralsApplied', label: t.mineralsApplied,             sublabel: 'Ca, Mg, K balance for shell', icon: Zap },
      { key: 'phStable',        label: 'pH Stable (7.5–8.5)?',       sublabel: 'Check morning & evening',      icon: Activity, critical: true },
    ],
  };
  if (doc <= 20) return {
    stageLabel: 'High Growth Stage',
    stageColor: 'text-cyan-400',
    stageBg: 'from-cyan-900 to-slate-950',
    tip: 'Growth acceleration phase. Gut health critical. Zeolite helps remove ammonia buildup.',
    questions: [
      { key: 'gutProbiotic',  label: t.gutProbioticMixed,  sublabel: 'Mix in feed daily for gut health', icon: Fish, critical: true },
      { key: 'zeoliteApplied',label: t.zeoliteApplied,     sublabel: '10 kg/acre, twice a week',         icon: Beaker },
      { key: 'aerationNight', label: 'Night Aeration Scheduled?', sublabel: 'Must run all aerators 8 PM–6 AM', icon: Zap, critical: true },
      { key: 'phStable',      label: 'pH Stable (7.5–8.5)?', sublabel: 'Check morning & evening',       icon: Activity },
    ],
  };
  if (doc <= 30) return {
    stageLabel: 'Mid Culture Stage',
    stageColor: 'text-amber-400',
    stageBg: 'from-amber-900 to-slate-950',
    tip: 'Vibriosis risk rises from DOC 25–40. Keep water quality pristine. Monitor sludge.',
    questions: [
      { key: 'mineralsApplied',label: 'Mineral Mix (2×/week)?', sublabel: 'Monday & Thursday schedule',       icon: Beaker },
      { key: 'sludgeChecked',  label: t.sludgeChecked,         sublabel: 'Visible sludge = early danger sign', icon: AlertTriangle, critical: true },
      { key: 'vibriosisCheck', label: t.vibriosisSigns,        sublabel: 'Red streaks, empty gut, lethargy',  icon: Shield, critical: true },
      { key: 'aerationNight',  label: 'Full Night Aeration?',  sublabel: 'No gaps — high bio-load risk',      icon: Zap },
    ],
  };
  if (doc <= 45) return {
    stageLabel: t.highRiskPeriod,
    stageColor: 'text-orange-400',
    stageBg: 'from-orange-900 to-red-950',
    tip: '⚠️ WSSV & EMS peak danger zone. Daily tray checks mandatory. Any mass mortality = alert immediately.',
    questions: [
      { key: 'feedTrayCheck',  label: t.feedTrayCheck,            sublabel: 'Check 1.5–2h after feeding',       icon: Fish, critical: true },
      { key: 'immunityBoost',  label: t.immunityBoostersAdded,    sublabel: 'Vitamin C + liver tonic in feed',  icon: Beaker, critical: true },
      { key: 'aerator24h',     label: t.aerator24h,               sublabel: 'Zero downtime — critical phase',   icon: Zap, critical: true },
      { key: 'wssvCheck',      label: 'WSSV Symptom Check?',      sublabel: 'White spots on shell = emergency', icon: AlertTriangle, critical: true },
    ],
  };
  if (doc <= 70) return {
    stageLabel: 'Maturation Phase',
    stageColor: 'text-emerald-400',
    stageBg: 'from-emerald-900 to-slate-950',
    tip: 'High biomass = high O₂ demand. Extra aerators essential. Begin biofloc management.',
    questions: [
      { key: 'extraAerators',      label: 'Extra Aerators Active?',      sublabel: 'Add paddle-wheel at centre',      icon: Zap, critical: true },
      { key: 'pondClean',          label: t.pondBottomCleaned,           sublabel: 'Check sludge accumulation',       icon: AlertTriangle },
      { key: 'alternateProbiotics',label: 'Alternate Day Probiotics?',   sublabel: 'Gut + water probiotic schedule',  icon: Beaker },
      { key: 'feedTrayCheck',      label: 'Feed Tray Check (2×/day)?',   sublabel: 'Adjust feed every 2 hours',       icon: Fish },
    ],
  };
  return {
    stageLabel: t.finalStage,
    stageColor: 'text-emerald-400',
    stageBg: 'from-[#0D523C] to-[#052e21]',
    tip: '🎯 Approaching harvest. Maximize weight gain. Observe count/kg carefully. Prepare market contacts.',
    questions: [
      { key: 'feedControl',   label: 'Feed Quantity Controlled?', sublabel: 'Reduce 10–15% near harvest',        icon: Fish },
      { key: 'waterExchange', label: t.waterExchangeDone,         sublabel: '10–15% daily near target weight',   icon: Droplets, critical: true },
      { key: 'targetSize',    label: t.targetSizeAchieved,        sublabel: 'Verify with cast net sample',        icon: Scale },
      { key: 'marketReady',   label: 'Buyer Contacted?',          sublabel: 'Coordinate 2–3 days before harvest', icon: Star },
    ],
  };
};

// ─── STAGE BANNER ─────────────────────────────────────────────────────────────
const StageBanner = ({ doc, stageLabel, stageColor, stageBg, tip, isDark }: {
  doc: number; stageLabel: string; stageColor: string; stageBg: string; tip: string; isDark: boolean;
}) => {
  const phases = [
    { label: 'Stock',   range: [0, 0] },
    { label: 'Early',   range: [1, 10] },
    { label: 'Growth',  range: [11, 30] },
    { label: 'Risk',    range: [31, 45] },
    { label: 'Mature',  range: [46, 70] },
    { label: 'Harvest', range: [71, 110] },
  ];
  const currentPhase = phases.findIndex(p => doc >= p.range[0] && doc <= p.range[1]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-[2.5rem] overflow-hidden shadow-2xl bg-gradient-to-br", stageBg)}
    >
      {/* Top info */}
      <div className="relative z-10 p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className={cn("text-[8px] font-black uppercase tracking-[0.25em] mb-1", stageColor)}>Stage-Based SOP · DOC {doc}</p>
            <h2 className="text-2xl font-black tracking-tighter text-white uppercase">{stageLabel}</h2>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
            <Activity size={22} className="text-white" />
          </div>
        </div>

        {/* Tip strip */}
        <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10 flex items-start gap-2.5">
          <Info size={13} className="text-white/50 flex-shrink-0 mt-0.5" />
          <p className="text-[9px] font-bold text-white/60 leading-relaxed">{tip}</p>
        </div>
      </div>

      {/* Phase progress dots */}
      <div className="px-6 pb-5">
        <div className="flex items-center gap-0">
          {phases.map((phase, i) => {
            const isDone    = i < currentPhase;
            const isCurrent = i === currentPhase;
            return (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center">
                  <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    isCurrent ? "bg-white border-white shadow-[0_0_10px_rgba(255,255,255,0.4)]" :
                    isDone    ? "bg-white/30 border-white/30" : "bg-white/5 border-white/10"
                  )}>
                    {isDone && <CheckCircle2 size={10} className="text-white" />}
                    {isCurrent && <div className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />}
                  </div>
                  <p className={cn("text-[5px] font-black uppercase tracking-widest mt-1 whitespace-nowrap",
                    isCurrent ? "text-white" : isDone ? "text-white/40" : "text-white/15"
                  )}>{phase.label}</p>
                </div>
                {i < phases.length - 1 && (
                  <div className={cn("flex-1 h-0.5 mb-3.5", isDone ? "bg-white/30" : "bg-white/10")} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// ─── METRIC INPUT ─────────────────────────────────────────────────────────────
const MetricInput = ({
  label, sublabel, icon: Icon, value, onChange, suffix, placeholder, type = 'number', isDark,
}: {
  label: string; sublabel?: string; icon: React.ElementType; value: string;
  onChange: (v: string) => void; suffix?: string; placeholder?: string; type?: string; isDark: boolean;
}) => (
  <div className={cn("rounded-[1.8rem] border p-4 space-y-3 transition-all", isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
    <div className="flex items-center gap-2">
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", isDark ? "bg-white/5" : "bg-slate-100")}>
        <Icon size={15} className={isDark ? "text-white/40" : "text-slate-500"} />
      </div>
      <div>
        <p className={cn("text-[9px] font-black uppercase tracking-widest leading-none", isDark ? "text-white/50" : "text-slate-500")}>{label}</p>
        {sublabel && <p className={cn("text-[7px] font-bold mt-0.5", isDark ? "text-white/20" : "text-slate-400")}>{sublabel}</p>}
      </div>
    </div>
    <div className="relative">
      <input
        type={type}
        inputMode="decimal"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? '0'}
        className={cn(
          "w-full pl-4 py-3 rounded-2xl border outline-none transition-all text-xl font-black tracking-tight",
          suffix ? "pr-16" : "pr-4",
          isDark
            ? "bg-white/5 border-white/10 text-white placeholder:text-white/15 focus:border-[#C78200]/50"
            : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-[#C78200] shadow-inner"
        )}
      />
      {suffix && (
        <span className={cn("absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/20" : "text-slate-400")}>{suffix}</span>
      )}
    </div>
  </div>
);

// ─── SOP CHECK ITEM ───────────────────────────────────────────────────────────
const SOPCheckItem = ({
  question, value, onToggle, index, isDark,
}: {
  question: SOPQuestion; value: boolean; onToggle: () => void; index: number; isDark: boolean; key?: React.Key;
}) => {
  const IconComp = question.icon;
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      className={cn(
        "w-full rounded-[1.8rem] border p-4 flex items-center gap-4 text-left transition-all",
        value
          ? isDark
            ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
            : "bg-emerald-50 border-emerald-300 shadow-sm"
          : isDark
            ? "bg-white/[0.03] border-white/8 hover:border-white/15"
            : "bg-white border-slate-100 shadow-sm hover:border-slate-200"
      )}
    >
      {/* Icon circle */}
      <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all",
        value
          ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
          : isDark ? "bg-white/5" : "bg-slate-100"
      )}>
        <IconComp size={18} className={value ? "text-white" : isDark ? "text-white/30" : "text-slate-400"} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn("text-sm font-black tracking-tight leading-tight", value ? isDark ? "text-emerald-300" : "text-emerald-800" : isDark ? "text-white/70" : "text-slate-800")}>
            {question.label}
          </p>
          {question.critical && (
            <span className={cn("text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border flex-shrink-0",
              value
                ? "bg-emerald-400/20 border-emerald-400/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            )}>CRITICAL</span>
          )}
        </div>
        {question.sublabel && (
          <p className={cn("text-[8px] font-bold mt-0.5 leading-snug", value ? isDark ? "text-emerald-400/60" : "text-emerald-600/70" : isDark ? "text-white/25" : "text-slate-400")}>
            {question.sublabel}
          </p>
        )}
      </div>

      {/* Checkbox */}
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all",
        value
          ? "bg-emerald-500 border-emerald-500"
          : isDark ? "bg-white/5 border-white/15" : "bg-slate-100 border-slate-200"
      )}>
        <CheckCircle2 size={17} className={value ? "text-white" : "text-transparent"} />
      </div>
    </motion.button>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export const DailySOPLog = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { ponds, addSOPLog, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const pond = ponds.find(p => p.id === id);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const dateStr    = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const targetDate = new Date(dateStr + 'T00:00:00');

  const [form, setForm] = useState({
    avgWeight: '',
    feedQty:   '',
    mortality: '0',
    notes:     '',
    checks:    {} as Record<string, boolean>,
  });

  if (!pond) return (
    <NoPondState
      isDark={isDark}
      fullScreen
      subtitle="The pond you're looking for could not be found. Please create a pond first."
    />
  );

  // Block logging for harvested ponds
  if (pond.status === 'harvested') return (
    <div className={cn("min-h-screen flex flex-col", isDark ? "bg-[#070D12]" : "bg-[#F0F4F8]")}>
      <header className={cn("flex items-center px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 border-b", isDark ? "bg-[#070D12] border-white/5" : "bg-white/90 border-slate-100 shadow-sm")}>
        <button onClick={() => navigate(-1)} className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border", isDark ? "bg-white/5 border-white/10 text-white/70" : "bg-white border-slate-200 text-slate-600 shadow-sm")}>
          <ChevronLeft size={18} />
        </button>
      </header>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <div className={cn("w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center", isDark ? "bg-emerald-500/10" : "bg-emerald-50")}>
            <span className="text-4xl">🏁</span>
          </div>
          <h2 className={cn("font-black text-xl tracking-tight mb-2", isDark ? "text-white" : "text-slate-900")}>Harvest Complete</h2>
          <p className={cn("text-[9px] font-black uppercase tracking-widest mb-4", isDark ? "text-white/30" : "text-slate-400")}>
            {pond.name} — Cycle Archived
          </p>
          <p className={cn("text-[11px] font-medium leading-relaxed", isDark ? "text-white/40" : "text-slate-500")}>
            Daily SOP logs are only required for active ponds. This pond has been harvested and archived.
          </p>
          <button onClick={() => navigate(-1)} className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest">
            Go Back
          </button>
        </div>
      </div>
    </div>
  );

  const docOnDate   = calculateDOC(pond.stockingDate);
  const stageConfig = getStageConfig(docOnDate, t);

  // SOP completion score
  const completedCount = stageConfig.questions.filter(q => form.checks[q.key]).length;
  const totalCount     = stageConfig.questions.length;
  const criticalCount  = stageConfig.questions.filter(q => q.critical).length;
  const criticalDone   = stageConfig.questions.filter(q => q.critical && form.checks[q.key]).length;
  const sopPct         = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Live FCR estimate
  const fcrEst = useMemo(() => {
    const feed   = parseFloat(form.feedQty) || 0;
    const weight = parseFloat(form.avgWeight) || 0;
    if (feed === 0 || weight === 0 || !pond.seedCount) return null;
    const survivalRate = (pond as any).survivalRate ?? 0.80;
    const biomassKg = (pond.seedCount * survivalRate * weight) / 1000;
    const prevBiomass = biomassKg * 0.97; // approx yesterday's biomass
    const gain = biomassKg - prevBiomass;
    if (gain <= 0) return null;
    return (feed / gain).toFixed(1);
  }, [form.feedQty, form.avgWeight, pond]);

  const handleToggle = (key: string) => {
    setForm(prev => ({ ...prev, checks: { ...prev.checks, [key]: !prev.checks[key] } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addSOPLog({
        pondId:    id,
        date:      dateStr,
        doc:       docOnDate,
        avgWeight: parseFloat(form.avgWeight) || 0,
        feedQty:   parseFloat(form.feedQty)   || 0,
        mortality: parseInt(form.mortality)    || 0,
        checks:    form.checks,
        notes:     form.notes.trim(),
        sopScore:  sopPct,
        criticalCount,
        criticalDone,
      });
      setSubmitted(true);
      setTimeout(() => navigate(`/ponds/${id}`), 1300);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen pb-40", isDark ? "bg-[#070D12]" : "bg-[#F0F4F8]")}>

      {/* ── SUCCESS OVERLAY ── */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 18, stiffness: 200 }}
              className={cn("rounded-[2.5rem] p-8 text-center border shadow-2xl w-72", isDark ? "bg-[#0D1A13] border-emerald-500/20" : "bg-white border-emerald-200")}
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30"
              >
                <CheckCircle2 size={32} className="text-white" />
              </motion.div>
              <p className={cn("font-black text-xl tracking-tight mb-1", isDark ? "text-white" : "text-slate-900")}>SOP Log Saved!</p>
              <p className={cn("text-[9px] font-black uppercase tracking-widest", "text-emerald-500")}>
                DOC {docOnDate} · Score {sopPct}%
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <header className={cn(
        "fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 backdrop-blur-xl px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center justify-between border-b",
        isDark ? "bg-[#070D12]/90 border-white/5" : "bg-white/90 border-slate-100 shadow-sm"
      )}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
          className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border", isDark ? "bg-white/5 border-white/10 text-white/70" : "bg-white border-slate-200 text-slate-600 shadow-sm")}
        >
          <ChevronLeft size={18} />
        </motion.button>

        <div className="text-center">
          <h1 className={cn("text-xs font-black tracking-tight uppercase", isDark ? "text-white" : "text-slate-900")}>{t.dailyLogTitle}</h1>
          <p className="text-[8px] font-black text-[#C78200] uppercase tracking-widest mt-0.5">
            {targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · DOC {docOnDate}
          </p>
        </div>

        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border", isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200")}>
          <ClipboardCheck size={18} className="text-emerald-500" />
        </div>
      </header>

      <form onSubmit={handleSubmit} className="pt-24 px-4 space-y-5">

        {/* ── STAGE BANNER ── */}
        <StageBanner
          doc={docOnDate}
          stageLabel={stageConfig.stageLabel}
          stageColor={stageConfig.stageColor}
          stageBg={stageConfig.stageBg}
          tip={stageConfig.tip}
          isDark={isDark}
        />

        {/* ── DAILY STATS ── */}
        <div className={cn("rounded-[2rem] overflow-hidden border", isDark ? "bg-[#0D1520] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
          {/* Header */}
          <div className={cn("px-5 pt-4 pb-3 border-b flex items-center gap-3", isDark ? "border-white/5" : "border-slate-100")}>
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isDark ? "bg-[#C78200]/10" : "bg-amber-100")}>
              <Zap size={16} className="text-[#C78200]" />
            </div>
            <div>
              <h2 className={cn("font-black text-sm tracking-tight", isDark ? "text-white" : "text-slate-900")}>{t.dailyStats}</h2>
              <p className={cn("text-[7px] font-black uppercase tracking-widest", isDark ? "text-white/25" : "text-slate-400")}>Today's measurements</p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Avg Weight + Feed row */}
            <div className="grid grid-cols-2 gap-3">
              <MetricInput
                label={t.weightLabel}
                sublabel="Cast net sample avg"
                icon={Scale}
                value={form.avgWeight}
                onChange={v => setForm(p => ({ ...p, avgWeight: v }))}
                suffix="g"
                placeholder="0.0"
                isDark={isDark}
              />
              <MetricInput
                label="Daily Feed"
                sublabel="Total fed today"
                icon={Fish}
                value={form.feedQty}
                onChange={v => setForm(p => ({ ...p, feedQty: v }))}
                suffix="kg"
                placeholder="0.0"
                isDark={isDark}
              />
            </div>

            {/* Mortality */}
            <MetricInput
              label="Mortality (Est.)"
              sublabel="Count from pond perimeter"
              icon={AlertTriangle}
              value={form.mortality}
              onChange={v => setForm(p => ({ ...p, mortality: v }))}
              suffix="pcs"
              placeholder="0"
              isDark={isDark}
            />

            {/* Live FCR hint */}
            <AnimatePresence>
              {fcrEst && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className={cn("rounded-2xl px-4 py-3 border flex items-center justify-between",
                    isDark ? "bg-[#C78200]/5 border-[#C78200]/20" : "bg-amber-50 border-amber-200"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Beaker size={14} className="text-[#C78200]" />
                    <p className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-[#C78200]/70" : "text-amber-600")}>Est. Today's FCR</p>
                  </div>
                  <p className={cn("font-black text-lg tracking-tighter", isDark ? "text-[#C78200]" : "text-amber-700")}>
                    {fcrEst}
                    <span className={cn("text-[9px] ml-1 font-bold", isDark ? "text-[#C78200]/40" : "text-amber-500/60")}>
                      {parseFloat(fcrEst) <= 1.3 ? '✅ Excellent' : parseFloat(fcrEst) <= 1.7 ? '⚠️ Normal' : '🔴 High'}
                    </span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── SOP COMPLIANCE ── */}
        <div className={cn("rounded-[2rem] overflow-hidden border", isDark ? "bg-[#0D1520] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
          {/* Header + score */}
          <div className={cn("px-5 pt-4 pb-3 border-b", isDark ? "border-white/5" : "border-slate-100")}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isDark ? "bg-emerald-500/10" : "bg-emerald-100")}>
                  <Shield size={16} className="text-emerald-500" />
                </div>
                <div>
                  <h2 className={cn("font-black text-sm tracking-tight", isDark ? "text-white" : "text-slate-900")}>SOP Compliance</h2>
                  <p className={cn("text-[7px] font-black uppercase tracking-widest", isDark ? "text-white/25" : "text-slate-400")}>
                    {stageConfig.stageLabel} · {completedCount}/{totalCount} completed
                  </p>
                </div>
              </div>
              <div className={cn("px-3 py-1.5 rounded-xl border text-center min-w-[50px]",
                sopPct === 100 ? isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
                : criticalDone < criticalCount ? isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"
                : isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"
              )}>
                <p className={cn("font-black text-lg tracking-tighter leading-none",
                  sopPct === 100 ? "text-emerald-500"
                  : criticalDone < criticalCount ? "text-red-500"
                  : "text-amber-500"
                )}>{sopPct}%</p>
                <p className={cn("text-[6px] font-black uppercase tracking-widest",
                  sopPct === 100 ? "text-emerald-500/60"
                  : criticalDone < criticalCount ? "text-red-500/60"
                  : "text-amber-500/60"
                )}>score</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className={cn("w-full h-2 rounded-full overflow-hidden", isDark ? "bg-white/5" : "bg-slate-100")}>
              <motion.div
                animate={{ width: `${sopPct}%` }}
                transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                className={cn("h-full rounded-full transition-colors",
                  sopPct === 100 ? "bg-emerald-500" : criticalDone < criticalCount ? "bg-red-500" : "bg-amber-400"
                )}
              />
            </div>

            {/* Critical warning */}
            {criticalDone < criticalCount && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={cn("mt-3 rounded-xl px-3 py-2 flex items-center gap-2 border", isDark ? "bg-red-500/8 border-red-500/15" : "bg-red-50 border-red-200")}
              >
                <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />
                <p className={cn("text-[8px] font-bold", isDark ? "text-red-400/70" : "text-red-700")}>
                  {criticalCount - criticalDone} critical step{criticalCount - criticalDone > 1 ? 's' : ''} incomplete — mark before saving
                </p>
              </motion.div>
            )}
          </div>

          {/* SOP Questions */}
          <div className="p-4 space-y-3">
            {stageConfig.questions.map((q, i) => (
              <SOPCheckItem
                key={q.key}
                question={q}
                value={form.checks[q.key] || false}
                onToggle={() => handleToggle(q.key)}
                index={i}
                isDark={isDark}
              />
            ))}
          </div>
        </div>

        {/* ── NOTES ── */}
        <div className={cn("rounded-[2rem] overflow-hidden border", isDark ? "bg-[#0D1520] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
          <div className={cn("px-5 pt-4 pb-3 border-b flex items-center gap-3", isDark ? "border-white/5" : "border-slate-100")}>
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isDark ? "bg-white/5" : "bg-slate-100")}>
              <ClipboardCheck size={16} className={isDark ? "text-white/40" : "text-slate-500"} />
            </div>
            <div>
              <h2 className={cn("font-black text-sm tracking-tight", isDark ? "text-white" : "text-slate-900")}>Field Notes</h2>
              <p className={cn("text-[7px] font-black uppercase tracking-widest", isDark ? "text-white/25" : "text-slate-400")}>Optional observations</p>
            </div>
          </div>
          <div className="p-4">
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              placeholder="Any unusual behaviour, colour changes, pond observations…"
              className={cn(
                "w-full px-4 py-3 rounded-2xl border outline-none resize-none text-[11px] font-bold transition-all",
                isDark
                  ? "bg-white/5 border-white/10 text-white placeholder:text-white/15 focus:border-[#C78200]/40"
                  : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-[#C78200] shadow-inner"
              )}
            />
          </div>
        </div>

        {/* ── SUBMIT ── */}
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="group relative w-full py-5 bg-gradient-to-br from-[#C78200] to-[#A66C00] text-white rounded-[1.5rem] font-black text-[9px] uppercase tracking-[0.2em] shadow-xl shadow-[#C78200]/25 active:scale-95 transition-all overflow-hidden disabled:opacity-50 flex items-center justify-center gap-3"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t.processingEntry}
            </>
          ) : (
            <>
              {t.saveEntry}
              <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
            </>
          )}
        </motion.button>

        {/* Audit footer */}
        <div className={cn("p-5 text-center rounded-[2rem] border border-dashed", isDark ? "bg-white/[0.015] border-white/8" : "bg-slate-50/80 border-slate-200")}>
          <p className={cn("text-[8px] font-black uppercase tracking-widest leading-loose", isDark ? "text-white/15" : "text-slate-400")}>
            Verified stage logs stored in Secure Journal<br />Required for Gold Standard SOP Certification
          </p>
        </div>
      </form>
    </div>
  );
};
