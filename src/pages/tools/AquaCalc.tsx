import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  Calculator,
  Fish,
  Droplets,
  TrendingUp,
  Scale,
  FlaskConical,
  Zap,
  DollarSign,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  BarChart2,
  Target,
  Utensils,
  Beaker,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';

// ─── Types ───────────────────────────────────────────────────────────────────
type CalcId =
  | 'fcr'
  | 'feed'
  | 'biomass'
  | 'survival'
  | 'stocking'
  | 'abw'
  | 'harvest'
  | 'lime'
  | 'do'
  | 'profit';

interface CalcMeta {
  id: CalcId;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const CALCS: CalcMeta[] = [
  { id: 'fcr',      label: 'FCR',            desc: 'Feed Conversion Ratio',      icon: BarChart2,    color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { id: 'feed',     label: 'Daily Feed',     desc: 'Feed quantity per DOC',       icon: Utensils,     color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  { id: 'biomass',  label: 'Biomass',        desc: 'Estimated total biomass',     icon: Scale,        color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { id: 'survival', label: 'Survival Rate',  desc: 'Estimated survival %',        icon: Fish,         color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { id: 'stocking', label: 'Stocking Density', desc: 'Seeds per sq. meter',      icon: Target,       color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { id: 'abw',      label: 'ABW / Count',    desc: 'Avg Body Weight or PL count', icon: FlaskConical, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  { id: 'harvest',  label: 'Harvest Yield',  desc: 'Expected harvest weight',     icon: TrendingUp,   color: '#84cc16', bg: 'rgba(132,204,22,0.1)' },
  { id: 'lime',     label: 'Lime Dose',      desc: 'Lime required for pond',      icon: Beaker,       color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  { id: 'do',       label: 'DO Requirement', desc: 'Dissolved oxygen needed',     icon: Droplets,     color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
  { id: 'profit',   label: 'Profit Est.',    desc: 'Net profit estimation',       icon: DollarSign,   color: '#a3e635', bg: 'rgba(163,230,53,0.1)' },
];

// ─── Per-calc Forms & Results ─────────────────────────────────────────────────
const safeN = (v: string, fallback = 0) => { const n = parseFloat(v); return isNaN(n) ? fallback : n; };

// FCR
const FCRCalc = ({ isDark }: { isDark: boolean }) => {
  const [feed, setFeed] = useState('');
  const [biomassGain, setBiomassGain] = useState('');
  const fcr = safeN(feed) > 0 && safeN(biomassGain) > 0
    ? (safeN(feed) / safeN(biomassGain)).toFixed(2)
    : null;
  const status = fcr ? (parseFloat(fcr) <= 1.4 ? 'Excellent' : parseFloat(fcr) <= 1.8 ? 'Good' : 'Poor') : null;
  const statusColor = status === 'Excellent' ? '#10b981' : status === 'Good' ? '#f59e0b' : '#ef4444';

  return (
    <FormWrapper title="FCR Calculator" subtitle="Feed Conversion Ratio" isDark={isDark}>
      <InputRow label="Total Feed Used (kg)" value={feed} onChange={setFeed} placeholder="e.g. 2500" isDark={isDark} />
      <InputRow label="Biomass Gained (kg)" value={biomassGain} onChange={setBiomassGain} placeholder="e.g. 1800" isDark={isDark} />
      {fcr && (
        <ResultCard isDark={isDark}>
          <ResultValue label="FCR" value={fcr} color={statusColor} />
          <ResultNote note={`Performance: ${status} · Target ≤ 1.4`} color={statusColor} isDark={isDark} />
        </ResultCard>
      )}
    </FormWrapper>
  );
};

// Daily Feed
const FeedCalc = ({ isDark }: { isDark: boolean }) => {
  const [biomass, setBiomass] = useState('');
  const [feedRate, setFeedRate] = useState('3');
  const daily = safeN(biomass) > 0
    ? ((safeN(biomass) * safeN(feedRate, 3)) / 100).toFixed(1)
    : null;

  return (
    <FormWrapper title="Daily Feed Calculator" subtitle="Feed quantity based on biomass" isDark={isDark}>
      <InputRow label="Current Biomass (kg)" value={biomass} onChange={setBiomass} placeholder="e.g. 5000" isDark={isDark} />
      <InputRow label="Feed Rate (%)" value={feedRate} onChange={setFeedRate} placeholder="e.g. 3" isDark={isDark} />
      {daily && (
        <ResultCard isDark={isDark}>
          <ResultValue label="Daily Feed" value={`${daily} kg`} color="#0ea5e9" />
          <ResultNote note={`Per feeding slot: ${(parseFloat(daily) / 4).toFixed(1)} kg × 4 times`} color="#0ea5e9" isDark={isDark} />
        </ResultCard>
      )}
    </FormWrapper>
  );
};

// Biomass
const BiomassCalc = ({ isDark }: { isDark: boolean }) => {
  const [count, setCount] = useState('');
  const [abw, setAbw] = useState('');
  const [survival, setSurvival] = useState('80');
  const biomass = safeN(count) > 0 && safeN(abw) > 0
    ? ((safeN(count) * (safeN(survival) / 100) * safeN(abw)) / 1000).toFixed(0)
    : null;

  return (
    <FormWrapper title="Biomass Estimator" subtitle="Total expected biomass" isDark={isDark}>
      <InputRow label="Stocked Count (PLs)" value={count} onChange={setCount} placeholder="e.g. 200000" isDark={isDark} />
      <InputRow label="Avg Body Weight (g)" value={abw} onChange={setAbw} placeholder="e.g. 15" isDark={isDark} />
      <InputRow label="Survival Rate (%)" value={survival} onChange={setSurvival} placeholder="e.g. 80" isDark={isDark} />
      {biomass && (
        <ResultCard isDark={isDark}>
          <ResultValue label="Total Biomass" value={`${biomass} kg`} color="#8b5cf6" />
          <ResultNote note={`≈ ${(parseFloat(biomass) / 1000).toFixed(2)} tonnes`} color="#8b5cf6" isDark={isDark} />
        </ResultCard>
      )}
    </FormWrapper>
  );
};

// Survival Rate
const SurvivalCalc = ({ isDark }: { isDark: boolean }) => {
  const [stocked, setStocked] = useState('');
  const [alive, setAlive] = useState('');
  const survival = safeN(stocked) > 0 && safeN(alive) > 0
    ? ((safeN(alive) / safeN(stocked)) * 100).toFixed(1)
    : null;
  const status = survival ? (parseFloat(survival) >= 80 ? 'Excellent' : parseFloat(survival) >= 65 ? 'Acceptable' : 'Poor') : null;
  const statusColor = status === 'Excellent' ? '#10b981' : status === 'Acceptable' ? '#f59e0b' : '#ef4444';

  return (
    <FormWrapper title="Survival Rate" subtitle="Estimate current survival %" isDark={isDark}>
      <InputRow label="Stocked Count (PLs)" value={stocked} onChange={setStocked} placeholder="e.g. 200000" isDark={isDark} />
      <InputRow label="Estimated Alive Count" value={alive} onChange={setAlive} placeholder="e.g. 165000" isDark={isDark} />
      {survival && (
        <ResultCard isDark={isDark}>
          <ResultValue label="Survival Rate" value={`${survival}%`} color={statusColor} />
          <ResultNote note={`Status: ${status} · Target ≥ 80%`} color={statusColor} isDark={isDark} />
        </ResultCard>
      )}
    </FormWrapper>
  );
};

// Stocking Density
const StockingCalc = ({ isDark }: { isDark: boolean }) => {
  const [area, setArea] = useState('');
  const [count, setCount] = useState('');
  const density = safeN(area) > 0 && safeN(count) > 0
    ? (safeN(count) / safeN(area)).toFixed(0)
    : null;
  const status = density ? (parseInt(density) <= 40 ? 'Low' : parseInt(density) <= 80 ? 'Medium' : 'High Density') : null;
  const statusColor = status === 'Low' ? '#10b981' : status === 'Medium' ? '#f59e0b' : '#ef4444';

  return (
    <FormWrapper title="Stocking Density" subtitle="Seeds per square meter" isDark={isDark}>
      <InputRow label="Pond Area (sq. meters)" value={area} onChange={setArea} placeholder="e.g. 10000" isDark={isDark} />
      <InputRow label="Total Seeds Stocked" value={count} onChange={setCount} placeholder="e.g. 500000" isDark={isDark} />
      {density && (
        <ResultCard isDark={isDark}>
          <ResultValue label="Density" value={`${density} PL/m²`} color={statusColor} />
          <ResultNote note={`Risk Level: ${status}`} color={statusColor} isDark={isDark} />
        </ResultCard>
      )}
    </FormWrapper>
  );
};

// ABW / Count
const ABWCalc = ({ isDark }: { isDark: boolean }) => {
  const [sampleWeight, setSampleWeight] = useState('');
  const [sampleCount, setSampleCount] = useState('10');
  const abw = safeN(sampleWeight) > 0 && safeN(sampleCount) > 0
    ? (safeN(sampleWeight) / safeN(sampleCount)).toFixed(2)
    : null;
  const count = abw ? Math.round(1000 / parseFloat(abw)) : null;

  return (
    <FormWrapper title="ABW Calculator" subtitle="Average Body Weight from sample" isDark={isDark}>
      <InputRow label="Sample Weight (g)" value={sampleWeight} onChange={setSampleWeight} placeholder="e.g. 150" isDark={isDark} />
      <InputRow label="Sample Count (PLs)" value={sampleCount} onChange={setSampleCount} placeholder="e.g. 10" isDark={isDark} />
      {abw && (
        <ResultCard isDark={isDark}>
          <ResultValue label="Avg Body Weight" value={`${abw} g`} color="#06b6d4" />
          <ResultNote note={`Count/kg: ${count} pieces`} color="#06b6d4" isDark={isDark} />
        </ResultCard>
      )}
    </FormWrapper>
  );
};

// Harvest Yield
const HarvestCalc = ({ isDark }: { isDark: boolean }) => {
  const [count, setCount] = useState('');
  const [abw, setAbw] = useState('');
  const [survival, setSurvival] = useState('80');
  const yield_ = safeN(count) > 0 && safeN(abw) > 0
    ? ((safeN(count) * (safeN(survival) / 100) * safeN(abw)) / 1000).toFixed(0)
    : null;

  return (
    <FormWrapper title="Harvest Yield" subtitle="Expected harvest weight" isDark={isDark}>
      <InputRow label="Stocked Count" value={count} onChange={setCount} placeholder="e.g. 300000" isDark={isDark} />
      <InputRow label="Target ABW (g)" value={abw} onChange={setAbw} placeholder="e.g. 20" isDark={isDark} />
      <InputRow label="Survival Rate (%)" value={survival} onChange={setSurvival} placeholder="e.g. 80" isDark={isDark} />
      {yield_ && (
        <ResultCard isDark={isDark}>
          <ResultValue label="Harvest Yield" value={`${yield_} kg`} color="#84cc16" />
          <ResultNote note={`≈ ${(parseFloat(yield_) / 1000).toFixed(2)} MT  ·  ${Math.round(parseFloat(yield_) / 40)} bags (40kg)`} color="#84cc16" isDark={isDark} />
        </ResultCard>
      )}
    </FormWrapper>
  );
};

// Lime Dose
const LimeCalc = ({ isDark }: { isDark: boolean }) => {
  const [area, setArea] = useState('');
  const [ph, setPh] = useState('');
  const [targetPh, setTargetPh] = useState('8.0');
  const phDiff = safeN(targetPh) - safeN(ph);
  const lime = safeN(area) > 0 && safeN(ph) > 0 && phDiff > 0
    ? (safeN(area) * phDiff * 2.5).toFixed(0) // rough estimate: 2.5 kg/hectare per 0.1 pH
    : null;

  return (
    <FormWrapper title="Lime Dose Calculator" subtitle="Lime required to raise pH" isDark={isDark}>
      <InputRow label="Pond Area (acres)" value={area} onChange={setArea} placeholder="e.g. 2.5" isDark={isDark} />
      <InputRow label="Current pH" value={ph} onChange={setPh} placeholder="e.g. 7.2" isDark={isDark} />
      <InputRow label="Target pH" value={targetPh} onChange={setTargetPh} placeholder="e.g. 8.0" isDark={isDark} />
      {lime && (
        <ResultCard isDark={isDark}>
          <ResultValue label="Lime Required" value={`${lime} kg`} color="#f97316" />
          <ResultNote note={`pH difference: ${phDiff.toFixed(1)} · Apply in evenings`} color="#f97316" isDark={isDark} />
        </ResultCard>
      )}
      {safeN(ph) > 0 && safeN(targetPh) > 0 && phDiff <= 0 && (
        <div className={cn('p-3 rounded-xl text-center text-[10px] font-black', isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')}>
          ✓ pH is already at or above target — no lime needed
        </div>
      )}
    </FormWrapper>
  );
};

// DO Requirement
const DOCalc = ({ isDark }: { isDark: boolean }) => {
  const [biomass, setBiomass] = useState('');
  const [temp, setTemp] = useState('28');
  // Rough formula: DO consumption ≈ 0.25 kg O2 per kg feed, dependent on temp
  const tempFactor = 1 + (safeN(temp) - 28) * 0.05;
  const doNeeded = safeN(biomass) > 0
    ? (safeN(biomass) * 0.001 * tempFactor).toFixed(2)
    : null; // very rough mg/L equivalent

  return (
    <FormWrapper title="DO Requirement" subtitle="Dissolved Oxygen needs" isDark={isDark}>
      <InputRow label="Total Biomass (kg)" value={biomass} onChange={setBiomass} placeholder="e.g. 3000" isDark={isDark} />
      <InputRow label="Water Temp (°C)" value={temp} onChange={setTemp} placeholder="e.g. 28" isDark={isDark} />
      {doNeeded && (
        <ResultCard isDark={isDark}>
          <ResultValue label="DO Consumption" value={`${doNeeded} kg O₂/hr`} color="#38bdf8" />
          <ResultNote note={`Maintain pond DO ≥ 5 mg/L. Run aerators if DO drops below threshold.`} color="#38bdf8" isDark={isDark} />
        </ResultCard>
      )}
    </FormWrapper>
  );
};

// Profit
const ProfitCalc = ({ isDark }: { isDark: boolean }) => {
  const [yield_, setYield] = useState('');
  const [rate, setRate] = useState('');
  const [cost, setCost] = useState('');
  const revenue = safeN(yield_) * safeN(rate);
  const profit = revenue - safeN(cost);
  const canShow = safeN(yield_) > 0 && safeN(rate) > 0;

  const formatINR = (v: number) => {
    if (Math.abs(v) >= 1_00_000) return `₹${(v / 1_00_000).toFixed(2)}L`;
    if (Math.abs(v) >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
    return `₹${v.toFixed(0)}`;
  };

  return (
    <FormWrapper title="Profit Estimator" subtitle="Net profit from harvest" isDark={isDark}>
      <InputRow label="Harvest Yield (kg)" value={yield_} onChange={setYield} placeholder="e.g. 5000" isDark={isDark} />
      <InputRow label="Market Rate (₹/kg)" value={rate} onChange={setRate} placeholder="e.g. 350" isDark={isDark} />
      <InputRow label="Total Expenses (₹)" value={cost} onChange={setCost} placeholder="e.g. 800000" isDark={isDark} />
      {canShow && (
        <ResultCard isDark={isDark}>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className={cn('text-[8px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/40' : 'text-slate-400')}>Revenue</p>
              <p className="text-lg font-black text-emerald-500">{formatINR(revenue)}</p>
            </div>
            <div className="text-center">
              <p className={cn('text-[8px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/40' : 'text-slate-400')}>Net Profit</p>
              <p className={cn('text-lg font-black', profit >= 0 ? 'text-emerald-500' : 'text-red-500')}>{formatINR(profit)}</p>
            </div>
          </div>
          {safeN(cost) > 0 && (
            <ResultNote
              note={`Margin: ${((profit / revenue) * 100).toFixed(1)}%  ·  ROI: ${((profit / safeN(cost)) * 100).toFixed(1)}%`}
              color={profit >= 0 ? '#a3e635' : '#ef4444'}
              isDark={isDark}
            />
          )}
        </ResultCard>
      )}
    </FormWrapper>
  );
};

// ─── Shared UI Sub-components ─────────────────────────────────────────────────
const FormWrapper = ({ title, subtitle, children, isDark }: { title: string; subtitle: string; children: React.ReactNode; isDark: boolean }) => (
  <div className="space-y-4">
    <div className="mb-2">
      <h3 className={cn('text-lg font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{title}</h3>
      <p className={cn('text-[9px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>{subtitle}</p>
    </div>
    {children}
  </div>
);

const InputRow = ({ label, value, onChange, placeholder, isDark }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; isDark: boolean }) => (
  <div>
    <label className={cn('block text-[9px] font-black uppercase tracking-widest mb-1.5', isDark ? 'text-white/40' : 'text-slate-400')}>{label}</label>
    <input
      type="number"
      inputMode="decimal"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none transition-all',
        isDark
          ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:bg-white/8'
          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-emerald-400 focus:bg-white'
      )}
    />
  </div>
);

const ResultCard = ({ children, isDark }: { children: React.ReactNode; isDark: boolean }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97, y: 8 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    className={cn('p-4 rounded-2xl border space-y-2', isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')}
  >
    {children}
  </motion.div>
);

const ResultValue = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="text-center">
    <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1" style={{ color: `${color}99` }}>{label}</p>
    <p className="text-3xl font-black tracking-tighter" style={{ color }}>{value}</p>
  </div>
);

const ResultNote = ({ note, color, isDark }: { note: string; color: string; isDark: boolean }) => (
  <p className={cn('text-[9px] font-medium text-center mt-1', isDark ? 'text-white/50' : 'text-slate-500')} style={{ color: `${color}bb` }}>{note}</p>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export const AquaCalc = () => {
  const navigate = useNavigate();
  const { theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';
  const [activeCalc, setActiveCalc] = useState<CalcId | null>(null);

  const ActiveCalcMeta = CALCS.find(c => c.id === activeCalc);

  const renderCalc = useCallback(() => {
    switch (activeCalc) {
      case 'fcr':      return <FCRCalc isDark={isDark} />;
      case 'feed':     return <FeedCalc isDark={isDark} />;
      case 'biomass':  return <BiomassCalc isDark={isDark} />;
      case 'survival': return <SurvivalCalc isDark={isDark} />;
      case 'stocking': return <StockingCalc isDark={isDark} />;
      case 'abw':      return <ABWCalc isDark={isDark} />;
      case 'harvest':  return <HarvestCalc isDark={isDark} />;
      case 'lime':     return <LimeCalc isDark={isDark} />;
      case 'do':       return <DOCalc isDark={isDark} />;
      case 'profit':   return <ProfitCalc isDark={isDark} />;
      default:         return null;
    }
  }, [activeCalc, isDark]);

  return (
    <div className={cn('pb-32 min-h-[100dvh] relative overflow-hidden transition-colors duration-700', isDark ? 'bg-[#030E1B]' : 'bg-[#F8FAFC]')}>
      {/* Ambient BG */}
      <div className="absolute inset-0 pointer-events-none fixed">
        <div className={cn('absolute top-[-10%] right-[-5%] w-[80%] h-[50%] blur-[140px] rounded-full', isDark ? 'bg-emerald-600/10' : 'bg-emerald-500/5')} />
        <div className={cn('absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] blur-[120px] rounded-full', isDark ? 'bg-indigo-600/10' : 'bg-indigo-500/5')} />
      </div>

      {/* ── Header ── */}
      <header className={cn(
        'fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 px-5 pt-[calc(env(safe-area-inset-top)+0.8rem)] pb-[0.8rem]',
        'flex items-center justify-between border-b premium-glass border-card-border rounded-b-[2rem]'
      )}>
        <button
          onClick={() => activeCalc ? setActiveCalc(null) : navigate(-1)}
          className="w-10 h-10 -ml-1 flex items-center justify-center rounded-xl text-ink hover:bg-ink/5 transition-all"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-2">
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'bg-emerald-500/20' : 'bg-emerald-100')}>
            <Calculator size={18} className="text-emerald-500" />
          </div>
          <div>
            <h1 className={cn('font-black text-base tracking-tight leading-none', isDark ? 'text-white' : 'text-slate-900')}>
              {activeCalc ? ActiveCalcMeta?.label : 'AquaCalc'}
            </h1>
            {!activeCalc && (
              <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>All Calculations</p>
            )}
          </div>
        </div>

        <div className="w-10" /> {/* spacer */}
      </header>

      <div className="px-5 pt-[calc(env(safe-area-inset-top)+4.5rem)] relative z-10">
        <AnimatePresence mode="wait">
          {!activeCalc ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Banner */}
              <div className={cn(
                'p-5 rounded-2xl border relative overflow-hidden',
                isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
              )}>
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Calculator size={80} className="text-emerald-500" />
                </div>
                <p className="text-emerald-500 font-black text-[9px] uppercase tracking-widest mb-1">Smart Calculators</p>
                <h2 className={cn('text-xl font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                  Aquaculture Tools
                </h2>
                <p className={cn('text-[10px] font-medium mt-1', isDark ? 'text-white/50' : 'text-slate-500')}>
                  {CALCS.length} precision calculators for shrimp farming
                </p>
              </div>

              {/* Calculator Grid */}
              <div className="grid grid-cols-2 gap-3">
                {CALCS.map((calc, i) => (
                  <motion.button
                    key={calc.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setActiveCalc(calc.id)}
                    className={cn(
                      'flex flex-col items-start gap-2.5 p-4 rounded-2xl border text-left transition-all relative overflow-hidden group',
                      isDark ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
                    )}
                  >
                    <div className="absolute -right-3 -bottom-3 opacity-5 group-hover:opacity-10 transition-opacity">
                      <calc.icon size={50} style={{ color: calc.color }} />
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: calc.bg }}>
                      <calc.icon size={20} style={{ color: calc.color }} />
                    </div>
                    <div>
                      <p className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{calc.label}</p>
                      <p className={cn('text-[8px] font-medium mt-0.5', isDark ? 'text-white/40' : 'text-slate-400')}>{calc.desc}</p>
                    </div>
                    <ChevronRight size={14} style={{ color: calc.color }} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 group-hover:opacity-80 transition-opacity" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeCalc}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Active calc card */}
              <div className={cn(
                'p-5 rounded-2xl border mb-5 flex items-center gap-4',
                isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'
              )}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: ActiveCalcMeta?.bg }}>
                  {ActiveCalcMeta && <ActiveCalcMeta.icon size={24} style={{ color: ActiveCalcMeta.color }} />}
                </div>
                <div>
                  <p className={cn('font-black text-base', isDark ? 'text-white' : 'text-slate-900')}>{ActiveCalcMeta?.label}</p>
                  <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>{ActiveCalcMeta?.desc}</p>
                </div>
              </div>

              <div className={cn(
                'p-5 rounded-2xl border',
                isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'
              )}>
                {renderCalc()}
              </div>

              {/* All calcs quick switcher */}
              <div className="mt-5">
                <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3 px-1', isDark ? 'text-white/30' : 'text-slate-400')}>
                  Other Calculators
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {CALCS.filter(c => c.id !== activeCalc).map(calc => (
                    <button
                      key={calc.id}
                      onClick={() => setActiveCalc(calc.id)}
                      className={cn(
                        'flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all',
                        isDark ? 'bg-white/5 border-white/10 text-white/60 hover:border-white/20' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      )}
                    >
                      <calc.icon size={12} style={{ color: calc.color }} />
                      {calc.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
