import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Droplets, Thermometer, Waves, AlertTriangle,
  CheckCircle2, ArrowRight, Zap, Wind, FlaskConical, ShieldCheck,
  Activity, Info, TrendingUp, TrendingDown, Minus, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { NoPondState } from '../../components/NoPondState';
import { calculateDOC } from '../../utils/pondUtils';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { CriticalWaterAlert, CriticalWaterBanner, buildCriticals } from '../../components/CriticalWaterAlert';

// ─── PARAMETER DEFINITIONS ────────────────────────────────────────────────────
interface FormData {
  ph: string; do: string; temperature: string;
  salinity: string; ammonia: string; alkalinity: string;
  turbidity: string; mortality: string;
}

interface Param {
  key: keyof FormData;
  label: string; unit: string; emoji: string;
  icon: React.ElementType;
  min: number; max: number; dangerLow?: number; dangerHigh?: number;
  placeholder: string; tip: string; step?: string;
}

const PARAMS: Param[] = [
  {
    key: 'ph', label: 'pH Level', unit: '', emoji: '🧪', icon: FlaskConical,
    min: 7.5, max: 8.5, dangerLow: 7.0, dangerHigh: 9.0,
    placeholder: '7.8', step: '0.01',
    tip: 'Optimal: 7.5–8.5. Below 7.0 = apply dolomite lime. Above 9.0 = water exchange needed.',
  },
  {
    key: 'do', label: 'Dissolved O₂', unit: 'mg/L', emoji: '💧', icon: Waves,
    min: 5.0, max: 10.0, dangerLow: 3.0,
    placeholder: '5.5', step: '0.1',
    tip: 'Keep above 5 mg/L at all times. Below 3 = EMERGENCY aeration. Log twice daily.',
  },
  {
    key: 'temperature', label: 'Water Temp', unit: '°C', emoji: '🌡️', icon: Thermometer,
    min: 26, max: 30, dangerLow: 22, dangerHigh: 34,
    placeholder: '28', step: '0.1',
    tip: 'Optimal 26–30°C. Below 22 or above 34°C = shrimp stop feeding, mortality risk rises.',
  },
  {
    key: 'salinity', label: 'Salinity', unit: 'ppt', emoji: '🌊', icon: Droplets,
    min: 10, max: 20, dangerLow: 5, dangerHigh: 30,
    placeholder: '15', step: '0.5',
    tip: 'Optimal 10–20 ppt for Vannamei. Sudden drops from rain cause osmotic stress.',
  },
  {
    key: 'ammonia', label: 'Ammonia (NH₃)', unit: 'mg/L', emoji: '⚗️', icon: Zap,
    min: 0, max: 0.05, dangerHigh: 0.1,
    placeholder: '0.02', step: '0.01',
    tip: 'Keep below 0.05. Above 0.1 = toxic, causes gill damage. Apply zeolite 10 kg/acre.',
  },
  {
    key: 'alkalinity', label: 'Alkalinity', unit: 'mg/L', emoji: '🔬', icon: Wind,
    min: 100, max: 150, dangerLow: 80,
    placeholder: '120', step: '1',
    tip: 'Target 100–150 mg/L. Below 80 = apply agricultural lime 5–8 kg/acre.',
  },
  {
    key: 'turbidity', label: 'Turbidity', unit: 'NTU', emoji: '🌫️', icon: Activity,
    min: 20, max: 40, dangerHigh: 60,
    placeholder: '30', step: '1',
    tip: 'Target 20–40 NTU (Secchi 25–40 cm). Too clear = algae crash. Too murky = poor DO.',
  },
  {
    key: 'mortality', label: 'Mortality', unit: 'shrimp', emoji: '⚠️', icon: AlertTriangle,
    min: 0, max: 10, dangerHigh: 50,
    placeholder: '0', step: '1',
    tip: 'Daily count from perimeter. >10/day = investigate. >50/day = emergency response.',
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const getStatus = (p: Param, val: number): 'optimal' | 'warning' | 'danger' => {
  if (p.dangerLow  !== undefined && val < p.dangerLow)  return 'danger';
  if (p.dangerHigh !== undefined && val > p.dangerHigh) return 'danger';
  if (val < p.min || val > p.max) return 'warning';
  return 'optimal';
};

const calcScore = (form: FormData): number => {
  let total = 0, n = 0;
  for (const p of PARAMS) {
    const v = parseFloat(form[p.key] as string);
    if (isNaN(v)) continue;
    const st = getStatus(p, v);
    total += st === 'optimal' ? 100 : st === 'warning' ? 60 : 20;
    n++;
  }
  return n === 0 ? 0 : Math.round(total / n);
};

interface CorrectiveAction { severity: 'danger' | 'warning' | 'ok'; text: string; remedy: string; }

const buildActions = (form: FormData): CorrectiveAction[] => {
  const actions: CorrectiveAction[] = [];
  const v = (k: keyof FormData) => parseFloat(form[k] as string);
  const ph = v('ph'), doVal = v('do'), temp = v('temperature');
  const sal = v('salinity'), amm = v('ammonia'), alk = v('alkalinity'), mort = v('mortality');

  if (!isNaN(doVal) && doVal < 3.0) actions.push({ severity: 'danger', text: 'DO Critical', remedy: 'Run ALL aerators immediately. Stop feeding. Add emergency oxygen granules.' });
  else if (!isNaN(doVal) && doVal < 5.0) actions.push({ severity: 'warning', text: 'DO Low', remedy: 'Increase aeration, reduce next feed by 30%. Monitor every 2 hours.' });
  if (!isNaN(ph) && ph < 7.0) actions.push({ severity: 'danger', text: 'pH Critical Low', remedy: 'Apply agricultural lime (dolomite) 10 kg/acre. Recheck in 2 hours.' });
  else if (!isNaN(ph) && ph > 9.0) actions.push({ severity: 'danger', text: 'pH Critical High', remedy: 'Do water exchange 15–20%. Stop heavy probiotics until stable.' });
  else if (!isNaN(ph) && ph < 7.5) actions.push({ severity: 'warning', text: 'pH Low', remedy: 'Apply dolomite 5 kg/acre. Monitor morning vs evening shift.' });
  else if (!isNaN(ph) && ph > 8.5) actions.push({ severity: 'warning', text: 'pH High', remedy: 'Partial water exchange 10%. Reduce afternoon feed.' });
  if (!isNaN(amm) && amm > 0.1) actions.push({ severity: 'danger', text: 'Ammonia Toxic', remedy: 'STOP feeding. Apply Zeolite 40 kg/acre + Bioclean Aqua Plus. Do not apply probiotics for 24 hrs.' });
  else if (!isNaN(amm) && amm > 0.05) actions.push({ severity: 'warning', text: 'Ammonia High', remedy: 'Apply Zeolite 10 kg/acre + water probiotic 250g/acre.' });
  if (!isNaN(temp) && temp > 32) actions.push({ severity: 'warning', text: 'Temp High', remedy: 'Skip noon feed slot. Add extra aeration. Apply Vitamin C anti-stress.' });
  if (!isNaN(alk) && alk < 80) actions.push({ severity: 'warning', text: 'Alkalinity Low', remedy: 'Apply agricultural lime 5–8 kg/acre. Recheck next day.' });
  if (!isNaN(sal) && (sal < 5 || sal > 30)) actions.push({ severity: 'danger', text: 'Salinity Extreme', remedy: 'Controlled water exchange with pre-adjusted salinity water.' });
  else if (!isNaN(sal) && (sal < 10 || sal > 20)) actions.push({ severity: 'warning', text: 'Salinity Off-Range', remedy: 'Monitor for osmotic stress. Gradual correction via water exchange.' });
  if (!isNaN(mort) && mort > 50) actions.push({ severity: 'danger', text: 'Mass Mortality', remedy: 'Check DO, pH, disease signs immediately. Contact technical consultant.' });
  else if (!isNaN(mort) && mort > 10) actions.push({ severity: 'warning', text: 'Elevated Mortality', remedy: 'Investigate DO, disease symptoms. Check for white spots or gill discoloration.' });

  if (actions.length === 0) actions.push({ severity: 'ok', text: 'All Parameters Optimal', remedy: 'Continue standard SOP. Great pond health record!' });
  return actions;
};

// ─── PARAMETER CARD ───────────────────────────────────────────────────────────
const ParamCard = ({
  param, value, onChange, prevValue, tipOpen, onTipToggle, isDark,
}: {
  param: Param; value: string; onChange: (v: string) => void;
  prevValue?: number; tipOpen: boolean; onTipToggle: () => void; isDark: boolean;
  key?: React.Key;
}) => {
  const rawVal = parseFloat(value);
  const hasVal = value !== '' && !isNaN(rawVal);
  const status = hasVal ? getStatus(param, rawVal) : null;

  // Range bar fill
  const rangeLow  = param.dangerLow  ?? param.min;
  const rangeHigh = param.dangerHigh ?? param.max * 1.5;
  const fillPct   = hasVal ? Math.min(100, Math.max(0, ((rawVal - rangeLow) / (rangeHigh - rangeLow)) * 100)) : 0;

  // Trend vs previous reading
  const trend = (prevValue !== undefined && !isNaN(prevValue) && hasVal)
    ? rawVal > prevValue ? 'up' : rawVal < prevValue ? 'down' : 'same'
    : null;

  const cardBorder = status === 'danger' ? 'border-red-400/40' : status === 'warning' ? 'border-amber-400/40' : status === 'optimal' ? 'border-emerald-400/30' : isDark ? 'border-white/8' : 'border-slate-200';
  const iconBg     = status === 'danger' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-500' : status === 'optimal' ? 'bg-emerald-500' : isDark ? 'bg-white/8' : 'bg-slate-100';
  const iconColor  = status ? 'text-white' : isDark ? 'text-white/30' : 'text-slate-400';
  const barColor   = status === 'danger' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400';
  const labelColor = isDark ? 'text-white/50' : 'text-slate-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-[2rem] border overflow-hidden transition-all', isDark ? 'bg-[#0D1520]' : 'bg-white shadow-sm', cardBorder)}
    >
      <div className="px-5 py-4 flex items-center gap-4">
        {/* Icon */}
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all', iconBg)}>
          <param.icon size={20} className={iconColor} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">{param.emoji}</span>
            <p className={cn('text-xs font-black tracking-tight', isDark ? 'text-white' : 'text-slate-800')}>{param.label}</p>
            {param.unit && <span className={cn('text-[8px] font-black uppercase tracking-widest', labelColor)}>{param.unit}</span>}

            {/* Status badge */}
            {status && (
              <span className={cn('ml-auto text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border',
                status === 'danger'  ? isDark ? 'bg-red-500/10 border-red-500/30 text-red-400'      : 'bg-red-100 border-red-200 text-red-600' :
                status === 'warning' ? isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-100 border-amber-200 text-amber-600' :
                isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-100 border-emerald-200 text-emerald-600'
              )}>
                {status === 'danger' ? 'DANGER' : status === 'warning' ? 'CHECK' : '✓ OK'}
              </span>
            )}
          </div>

          {/* Input row */}
          <div className="flex items-baseline gap-3">
            <input
              type="number"
              step={param.step ?? 'any'}
              inputMode="decimal"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={param.placeholder}
              className={cn(
                'flex-1 font-black text-2xl tracking-tighter outline-none bg-transparent transition-colors',
                status === 'danger'  ? 'text-red-500' :
                status === 'warning' ? isDark ? 'text-amber-400' : 'text-amber-600' :
                status === 'optimal' ? isDark ? 'text-emerald-400' : 'text-emerald-600' :
                isDark ? 'text-white' : 'text-slate-800',
                'placeholder:text-slate-300'
              )}
            />
            {/* Trend badge */}
            {trend && (
              <div className={cn('flex items-center gap-1 mb-1', isDark ? 'text-white/30' : 'text-slate-400')}>
                {trend === 'up'   && <TrendingUp  size={13} className="text-blue-400" />}
                {trend === 'down' && <TrendingDown size={13} className="text-rose-400" />}
                {trend === 'same' && <Minus        size={13} />}
              </div>
            )}
          </div>

          {/* SOP range bar */}
          {hasVal && (
            <div className="mt-2">
              <div className={cn('w-full h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/8' : 'bg-slate-100')}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${fillPct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={cn('h-full rounded-full', barColor)}
                />
              </div>
              <p className={cn('text-[6px] font-black uppercase tracking-widest mt-1', isDark ? 'text-white/20' : 'text-slate-400')}>
                Target: {param.min}–{param.max}{param.unit}
              </p>
            </div>
          )}
        </div>

        {/* Tip toggle */}
        <button
          type="button"
          onClick={onTipToggle}
          className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
            tipOpen ? isDark ? 'bg-[#C78200]/20 text-[#C78200]' : 'bg-amber-100 text-amber-600' :
            isDark ? 'bg-white/5 text-white/20 hover:text-white/50' : 'bg-slate-100 text-slate-400 hover:text-slate-600'
          )}
        >
          <Info size={13} />
        </button>
      </div>

      {/* Tip panel */}
      <AnimatePresence>
        {tipOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={cn('px-5 pb-4 pt-2 border-t', isDark ? 'bg-[#C78200]/5 border-[#C78200]/10' : 'bg-amber-50 border-amber-100')}>
              <p className={cn('text-[9px] font-bold leading-relaxed', isDark ? 'text-[#C78200]/70' : 'text-amber-800')}>{param.tip}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export const DailyConditionsLog = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { id, date: urlDate } = useParams<{ id: string; date?: string }>();
  const { ponds, addWaterRecord, waterRecords, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const pond      = ponds.find(p => p.id === id) || ponds[0];
  const today     = new Date().toISOString().split('T')[0];
  const activeDate = urlDate || today;
  const isHistorical = activeDate !== today;

  // Early bail-out when no ponds exist
  if (ponds.length === 0) return (
    <NoPondState isDark={isDark} fullScreen subtitle="Add a pond to start logging daily water conditions." />
  );

  const [form, setForm] = useState<FormData>({
    ph: '', do: '', temperature: '', salinity: '',
    ammonia: '', alkalinity: '', turbidity: '', mortality: '',
  });
  const [isExisting, setIsExisting]       = useState(false);
  const [isModified, setIsModified]       = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [expandedTip, setExpandedTip]     = useState<string | null>(null);
  const [loading, setLoading]             = useState(false);
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [criticalAcked, setCriticalAcked]         = useState(false);

  // Pre-fill if edit mode
  useEffect(() => {
    const rec = waterRecords.find(r => r.pondId === pond?.id && r.date === activeDate);
    if (rec) {
      setIsExisting(true);
      setForm({
        ph:          rec.ph?.toString()          || '',
        do:          rec.do?.toString()          || '',
        temperature: rec.temperature?.toString() || '',
        salinity:    rec.salinity?.toString()    || '',
        ammonia:     rec.ammonia?.toString()     || '',
        alkalinity:  rec.alkalinity?.toString()  || '',
        turbidity:   rec.turbidity?.toString()   || '',
        mortality:   rec.mortality?.toString()   || '',
      });
    } else {
      setIsExisting(false);
    }
  }, [pond?.id, activeDate, waterRecords]);

  // Previous record for trend arrows
  const sortedRecords = [...waterRecords.filter(r => r.pondId === pond?.id)]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const prevRecord = sortedRecords.find(r => r.date < activeDate);

  const doc         = pond ? calculateDOC(pond.stockingDate) : 0;
  const adjustedDoc = isHistorical ? calculateDOC(pond?.stockingDate ?? '', activeDate) : doc;
  const healthScore = useMemo(() => calcScore(form), [form]);
  const actions     = useMemo(() => buildActions(form), [form]);
  const hasAnyValue = Object.values(form).some(v => v !== '');
  const hasDanger   = actions.some(a => a.severity === 'danger');
  const canSave     = hasAnyValue && !!pond && !(isExisting && !isModified);

  // ── Critical water analysis from current form input ──
  const waterCriticals = useMemo(() => {
    if (!hasAnyValue) return [];
    return buildCriticals({
      ph:          parseFloat(form.ph),
      do:          parseFloat(form.do),
      temperature: parseFloat(form.temperature),
      salinity:    parseFloat(form.salinity),
      ammonia:     parseFloat(form.ammonia),
      mortality:   parseFloat(form.mortality),
    });
  }, [form, hasAnyValue]);

  // ── Auto-show critical modal when dangerous readings are entered ──
  // Re-arms on each save (farmer logs new entry, might need fresh guidance)
  useEffect(() => {
    if (waterCriticals.some(c => c.status === 'critical') && !criticalAcked) {
      setShowCriticalModal(true);
    }
  }, [waterCriticals, criticalAcked]);

  // Score visuals
  const scoreGrade = healthScore >= 80 ? 'Healthy' : healthScore >= 60 ? 'Monitor' : 'Act Now';
  const scoreColor = healthScore >= 80 ? isDark ? 'text-emerald-400' : 'text-emerald-600' :
                     healthScore >= 60 ? isDark ? 'text-amber-400'   : 'text-amber-600' :
                                         isDark ? 'text-red-400'     : 'text-red-600';
  const scoreBarColor = healthScore >= 80 ? 'bg-emerald-500' : healthScore >= 60 ? 'bg-amber-400' : 'bg-red-500';
  const currentHour = new Date().getHours();
  const timeOfDayLabel = currentHour < 6 ? 'Pre-Dawn Log' : currentHour < 12 ? 'Morning Log' : currentHour < 17 ? 'Afternoon Log' : 'Evening Log';

  const handleChange = (key: keyof FormData, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setIsModified(true);
  };

  const handleSave = async () => {
    if (!pond || !canSave) return;
    setLoading(true);
    try {
      await addWaterRecord({
        pondId:      pond.id,
        date:        activeDate,
        ph:          parseFloat(form.ph)          || 7.8,
        do:          parseFloat(form.do)          || 5.0,
        temperature: parseFloat(form.temperature) || 28,
        salinity:    parseFloat(form.salinity)    || 15,
        ammonia:     parseFloat(form.ammonia)     || 0.03,
        alkalinity:  parseFloat(form.alkalinity)  || 120,
        turbidity:   parseFloat(form.turbidity)   || 30,
        mortality:   parseFloat(form.mortality)   || 0,
      });
      setSaved(true);
      setTimeout(() => navigate(`/ponds/${pond.id}/monitor`), 1600);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('min-h-screen pb-40', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>

      {/* ── CRITICAL WATER ALERT MODAL ── */}
      <AnimatePresence>
        {showCriticalModal && waterCriticals.length > 0 && (
          <CriticalWaterAlert
            criticals={waterCriticals}
            pondName={pond?.name ?? 'Pond'}
            isDark={isDark}
            onAcknowledge={(resp) => {
              setShowCriticalModal(false);
              setCriticalAcked(true);
              // Re-arm if farmer logs again (new session)
            }}
          />
        )}
      </AnimatePresence>

      {/* ── SUCCESS OVERLAY ── */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-[#0D523C]/97 backdrop-blur-xl flex flex-col items-center justify-center text-white"
          >
            <motion.div
              initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 150 }}
              className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-[#0D523C] shadow-2xl mb-6"
            >
              <CheckCircle2 size={48} />
            </motion.div>
            <h3 className="text-3xl font-black tracking-tighter mb-2">Conditions Saved!</h3>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
              Score {healthScore}/100 · Opening Pond Monitor…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <header className={cn(
        'fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-[60] backdrop-blur-xl px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center justify-between border-b',
        isDark ? 'bg-[#070D12]/90 border-white/5' : 'bg-white/90 border-slate-100 shadow-sm'
      )}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
          className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border',
            isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-white border-slate-200 text-slate-600 shadow-sm'
          )}>
          <ChevronLeft size={18} />
        </motion.button>

        <div className="text-center">
          <h1 className={cn('text-xs font-black tracking-tight uppercase', isDark ? 'text-white' : 'text-slate-900')}>{t.waterLog}</h1>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>{pond?.name}</p>
            <div className={cn('w-0.5 h-0.5 rounded-full', isDark ? 'bg-white/20' : 'bg-slate-300')} />
            <p className="text-[7px] font-black text-[#C78200] uppercase tracking-widest">DOC {adjustedDoc}</p>
          </div>
        </div>

        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border',
          isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-500'
        )}>
          <Droplets size={18} />
        </div>
      </header>

      <div className="pt-24 px-4 space-y-4">

        {/* ── TIME OF DAY BANNER ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className={cn('rounded-[2rem] px-5 py-4 flex items-center gap-4 border', isDark ? 'bg-[#02130F] border-white/5' : 'bg-[#0D523C] border-[#0D523C]')}
        >
          <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 flex-shrink-0">
            <Clock size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-black text-sm tracking-tight">{timeOfDayLabel}</p>
            <p className="text-white/40 text-[7px] font-black uppercase tracking-widest mt-0.5">
              {isHistorical ? `Historical Entry: ${activeDate}` : `${activeDate} · ${isExisting ? 'Updating existing log' : 'New entry'}`}
            </p>
          </div>
          {isExisting && !isModified && (
            <span className={cn('ml-auto text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl border',
              isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-600'
            )}>Already Logged</span>
          )}
        </motion.div>

        {/* ── CRITICAL WATER BANNER (inline, non-modal) ── */}
        <AnimatePresence>
          {waterCriticals.length > 0 && !showCriticalModal && criticalAcked && (
            <CriticalWaterBanner
              criticals={waterCriticals}
              pondName={pond?.name ?? 'Pond'}
              isDark={isDark}
              onExpand={() => { setShowCriticalModal(true); setCriticalAcked(false); }}
              onAcknowledge={() => setCriticalAcked(true)}
            />
          )}
        </AnimatePresence>

        {/* ── LIVE HEALTH SCORE ── */}
        <AnimatePresence>
          {hasAnyValue && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className={cn('rounded-[2rem] p-5 border', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={cn('text-[7px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/30' : 'text-slate-400')}>Live Health Score</p>
                  <p className={cn('font-black text-4xl tracking-tighter', scoreColor)}>
                    {healthScore}<span className={cn('text-xl', isDark ? 'text-white/20' : 'text-slate-300')}>/100</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn('font-black text-sm', scoreColor)}>{scoreGrade}</p>
                  <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>Live preview</p>
                </div>
              </div>
              <div className={cn('w-full h-2 rounded-full overflow-hidden', isDark ? 'bg-white/8' : 'bg-slate-100')}>
                <motion.div
                  animate={{ width: `${healthScore}%` }}
                  transition={{ type: 'spring', damping: 15 }}
                  className={cn('h-full rounded-full', scoreBarColor)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PARAMETER CARDS ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Water Parameters</h2>
            <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
              {Object.values(form).filter(v => v !== '').length}/{PARAMS.length} filled
            </span>
          </div>

          {PARAMS.map((param, i) => (
            <ParamCard
              key={param.key}
              param={param}
              value={form[param.key] as string}
              onChange={val => handleChange(param.key, val)}
              prevValue={(prevRecord as any)?.[param.key]}
              tipOpen={expandedTip === param.key}
              onTipToggle={() => setExpandedTip(expandedTip === param.key ? null : param.key)}
              isDark={isDark}
            />
          ))}
        </div>

        {/* ── CORRECTIVE ACTIONS PANEL ── */}
        <AnimatePresence>
          {hasAnyValue && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={cn('rounded-[2rem] overflow-hidden border', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
            >
              {/* Header */}
              <div className={cn('px-5 pt-4 pb-3 border-b flex items-center gap-3', isDark ? 'border-white/5 bg-[#02130F]' : 'border-slate-100 bg-[#0D523C]')}>
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                  <ShieldCheck size={17} className="text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-white font-black text-sm tracking-tight">Today's Action Plan</h3>
                  <p className="text-white/40 text-[7px] font-black uppercase tracking-widest">
                    {hasDanger ? '🔴 Critical actions required' : 'Based on current readings'}
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-2.5">
                {actions.map((a, i) => (
                  <div key={i} className={cn('rounded-2xl px-4 py-3 border flex items-start gap-3',
                    a.severity === 'danger'  ? isDark ? 'bg-red-500/8 border-red-500/20'     : 'bg-red-50 border-red-200' :
                    a.severity === 'warning' ? isDark ? 'bg-amber-500/8 border-amber-500/20' : 'bg-amber-50 border-amber-200' :
                    isDark ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-emerald-50 border-emerald-100'
                  )}>
                    <span className="text-base flex-shrink-0 mt-0.5">
                      {a.severity === 'danger' ? '🔴' : a.severity === 'warning' ? '🟡' : '✅'}
                    </span>
                    <div>
                      <p className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-900')}>{a.text}</p>
                      <p className={cn('text-[9px] font-bold mt-0.5 leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>{a.remedy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SAVE BUTTON ── */}
        <motion.button
          onClick={handleSave}
          disabled={!canSave || loading}
          whileTap={{ scale: canSave ? 0.97 : 1 }}
          className={cn(
            'group relative w-full py-5 rounded-[1.5rem] font-black text-[9px] uppercase tracking-[0.2em] transition-all overflow-hidden flex items-center justify-center gap-3',
            canSave
              ? 'bg-gradient-to-br from-[#0D523C] to-[#065F46] text-white shadow-2xl shadow-emerald-900/30 active:scale-95'
              : isDark ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          )}
        >
          {canSave && <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />}
          <div className="relative flex items-center gap-3">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : isExisting && !isModified ? (
              <><ShieldCheck size={18} /> Already Logged for Today</>
            ) : isExisting ? (
              <><CheckCircle2 size={18} /> Update Existing Log <ArrowRight size={18} /></>
            ) : (
              <><CheckCircle2 size={18} /> Save Daily Water Log <ArrowRight size={18} /></>
            )}
          </div>
        </motion.button>

        {/* Footer */}
        <div className={cn('p-5 text-center rounded-[2rem] border border-dashed', isDark ? 'bg-white/[0.015] border-white/8' : 'bg-slate-50 border-slate-200')}>
          <p className={cn('text-[8px] font-black uppercase tracking-widest leading-loose', isDark ? 'text-white/15' : 'text-slate-400')}>
            Daily water logs build your SOP audit trail<br />Required for disease detection & harvest certification
          </p>
        </div>
      </div>
    </div>
  );
};
