import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Droplets, Thermometer, Waves, AlertTriangle,
  CheckCircle2, ArrowRight, Zap, Wind, FlaskConical, ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { calculateDOC } from '../utils/pondUtils';
import { cn } from '../utils/cn';
import { Translations } from '../translations';

// ─── PARAMETER DEFINITIONS ───────────────────────────────────────────────────
interface Param {
  key: keyof FormData;
  label: string;
  unit: string;
  icon: React.ElementType;
  min: number;   // optimal min
  max: number;   // optimal max
  dangerLow?: number;
  dangerHigh?: number;
  placeholder: string;
  tip: string;
}

interface FormData {
  ph: string;
  do: string;
  temperature: string;
  salinity: string;
  ammonia: string;
  alkalinity: string;
  turbidity: string;
  mortality: string;
}

const PARAMS: Param[] = [
  {
    key: 'ph', label: 'pH Level', unit: '', icon: FlaskConical,
    min: 7.5, max: 8.5, dangerLow: 7.0, dangerHigh: 9.0,
    placeholder: '7.8',
    tip: 'Optimal pH: 7.5–8.5. Below 7.0 or above 9.0 = emergency correction needed.',
  },
  {
    key: 'do', label: 'Dissolved Oxygen', unit: 'mg/L', icon: Waves,
    min: 5.0, max: 10.0, dangerLow: 3.0,
    placeholder: '5.5',
    tip: 'Must stay above 5 mg/L at all times. Below 3 mg/L = emergency aeration.',
  },
  {
    key: 'temperature', label: 'Water Temperature', unit: '°C', icon: Thermometer,
    min: 26, max: 30, dangerLow: 22, dangerHigh: 34,
    placeholder: '28',
    tip: 'Optimal 26–30°C. Outside 22–34°C shrimp stop feeding and risk mortality.',
  },
  {
    key: 'salinity', label: 'Salinity', unit: 'ppt', icon: Droplets,
    min: 10, max: 20, dangerLow: 5, dangerHigh: 30,
    placeholder: '15',
    tip: 'Optimal 10–20 ppt for Vannamei. Crashes below 5 causes osmotic stress.',
  },
  {
    key: 'ammonia', label: 'Ammonia (NH₃)', unit: 'mg/L', icon: Zap,
    min: 0, max: 0.05, dangerHigh: 0.1,
    placeholder: '0.03',
    tip: 'Must stay below 0.05. Above 0.1 is toxic. Apply probiotics + zeolite.',
  },
  {
    key: 'alkalinity', label: 'Alkalinity', unit: 'mg/L', icon: Wind,
    min: 100, max: 150, dangerLow: 80,
    placeholder: '120',
    tip: 'Optimal 100–150 mg/L. Below 80 = apply agricultural lime.',
  },
  {
    key: 'turbidity', label: 'Turbidity', unit: 'NTU', icon: Droplets,
    min: 20, max: 40, dangerHigh: 60,
    placeholder: '30',
    tip: 'Optimal 20–40 NTU (Secchi disc 25–40 cm). Too clear or too murky = issue.',
  },
  {
    key: 'mortality', label: 'Mortality Count', unit: 'shrimp', icon: AlertTriangle,
    min: 0, max: 10, dangerHigh: 50,
    placeholder: '0',
    tip: 'Enter shrimp found dead today. >50/day = investigate disease/DO crash.',
  },
];

// Compute per-param status
const getParamStatus = (p: Param, val: number): 'optimal' | 'warning' | 'danger' => {
  if (p.dangerLow !== undefined && val < p.dangerLow) return 'danger';
  if (p.dangerHigh !== undefined && val > p.dangerHigh) return 'danger';
  if (val < p.min || val > p.max) return 'warning';
  return 'optimal';
};

// Overall health score 0–100
const calcHealthScore = (params: Param[], form: FormData): number => {
  let totalScore = 0;
  let count = 0;
  for (const p of params) {
    const raw = parseFloat(form[p.key] as string);
    if (isNaN(raw)) continue;
    const st = getParamStatus(p, raw);
    totalScore += st === 'optimal' ? 100 : st === 'warning' ? 60 : 20;
    count++;
  }
  return count === 0 ? 0 : Math.round(totalScore / count);
};

// Corrective actions
const buildActions = (params: Param[], form: FormData): string[] => {
  const actions: string[] = [];
  const val = (k: keyof FormData) => parseFloat(form[k] as string);

  const ph = val('ph'), doVal = val('do'), temp = val('temperature');
  const sal = val('salinity'), amm = val('ammonia'), alk = val('alkalinity');
  const mort = val('mortality');

  if (!isNaN(ph)) {
    if (ph < 7.5) actions.push('🔴 pH low: Apply agricultural lime (dolomite) 5–10 kg/acre');
    if (ph > 8.5) actions.push('🔴 pH high: Partial water exchange 10–15%');
  }
  if (!isNaN(doVal) && doVal < 5) {
    actions.push('🚨 DO critical: Run all aerators immediately. Stop feeding until DO > 5 mg/L');
  }
  if (!isNaN(temp) && temp > 32) {
    actions.push('🌡️ High temp: Increase aeration, reduce noon feed by 20%');
  }
  if (!isNaN(amm) && amm > 0.05) {
    actions.push('⚠️ Ammonia high: Apply Bioclean Aqua Plus 250g/acre + Zeolite 10kg/acre');
  }
  if (!isNaN(alk) && alk < 100) {
    actions.push('🟡 Low alkalinity: Apply 5–8 kg/acre agricultural lime');
  }
  if (!isNaN(sal) && (sal < 10 || sal > 20)) {
    actions.push('🔵 Salinity out of range: Partial water exchange with adjusted salinity water');
  }
  if (!isNaN(mort) && mort > 10) {
    actions.push('💀 High mortality: Check DO, pH, and disease signs immediately');
  }
  if (actions.length === 0) actions.push('✅ All parameters in range — continue SOP as scheduled');
  return actions;
};

export const DailyConditionsLog = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { id, date: urlDate } = useParams<{ id: string, date?: string }>();
  const { ponds, addWaterRecord, waterRecords } = useData();
  const pond = ponds.find(p => p.id === id) || ponds[0];

  // Logic to determine the active date (Today or from Timeline)
  const today = new Date().toISOString().split('T')[0];
  const activeDate = urlDate || today;

  const [isExistingRecord, setIsExistingRecord] = useState(false);
  const [isModified, setIsModified] = useState(false);

  // Check if a record already exists for this date to pre-fill (Edit mode)
  React.useEffect(() => {
    const existingRec = waterRecords.find(r => r.pondId === pond?.id && r.date === activeDate);
    if (existingRec) {
      setIsExistingRecord(true);
      setForm({
        ph: existingRec.ph?.toString() || '',
        do: existingRec.do?.toString() || '',
        temperature: existingRec.temperature?.toString() || '',
        salinity: existingRec.salinity?.toString() || '',
        ammonia: existingRec.ammonia?.toString() || '',
        alkalinity: existingRec.alkalinity?.toString() || '',
        turbidity: existingRec.turbidity?.toString() || '',
        mortality: existingRec.mortality?.toString() || '',
      });
    } else {
      setIsExistingRecord(false);
    }
  }, [pond?.id, activeDate, waterRecords]);

  const [form, setForm] = useState<FormData>({
    ph: '', do: '', temperature: '', salinity: '',
    ammonia: '', alkalinity: '', turbidity: '', mortality: '',
  });
  const [saved, setSaved] = useState(false);
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  const handleInputChange = (key: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setIsModified(true);
  };

  const doc = pond ? calculateDOC(pond.stockingDate) : 0;
  // Adjust DOC for historical dates
  const adjustedDoc = activeDate === today ? doc : calculateDOC(pond.stockingDate, activeDate);

  const healthScore = useMemo(() => calcHealthScore(PARAMS, form), [form]);
  const actions = useMemo(() => buildActions(PARAMS, form), [form]);

  const scoreColor = healthScore >= 80
    ? 'text-emerald-500' : healthScore >= 60 ? 'text-amber-500' : 'text-red-500';
  const scoreBg = healthScore >= 80
    ? 'bg-emerald-50 border-emerald-200' : healthScore >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  const handleSave = () => {
    if (!pond) return;
    const ph = parseFloat(form.ph) || 7.8;
    const doVal = parseFloat(form.do) || 5.0;
    const temp = parseFloat(form.temperature) || 28;
    const sal = parseFloat(form.salinity) || 15;
    const amm = parseFloat(form.ammonia) || 0.03;
    const alk = parseFloat(form.alkalinity) || 120;
    const turb = parseFloat(form.turbidity) || 30;
    const mort = parseFloat(form.mortality) || 0;

    addWaterRecord({
      pondId: pond.id,
      date: activeDate,
      ph, do: doVal, temperature: temp,
      salinity: sal, ammonia: amm, alkalinity: alk,
      turbidity: turb, mortality: mort
    });
    setSaved(true);
    setTimeout(() => navigate(`/ponds/${pond.id}/monitor`), 1600);
  };

  const hasAnyValue = Object.values(form).some(v => v !== '');

  return (
    <div className="pb-40 bg-[#F8F9FE] min-h-screen text-left">
      {/* Success overlay */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0D523C]/97 backdrop-blur-xl flex flex-col items-center justify-center text-white"
          >
            <motion.div
              initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}
              className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center text-[#0D523C] shadow-2xl mb-6"
            >
              <CheckCircle2 size={56} />
            </motion.div>
            <h3 className="text-3xl font-black tracking-tighter mb-2">Conditions Saved!</h3>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Opening pond monitor…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-white/95 backdrop-blur-md px-4 py-5 flex items-center justify-between border-b border-black/5 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-3 text-[#4A2C2A] hover:bg-black/5 rounded-2xl transition-all">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-black text-[#4A2C2A] tracking-[0.1em] uppercase">Daily Conditions</h1>
          <p className="text-[9px] font-black text-[#C78200] uppercase tracking-widest">
            {pond?.name} • DOC {adjustedDoc} • {new Date(activeDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center">
          <Droplets size={20} className="text-blue-500" />
        </div>
      </header>

      <div className="pt-28 px-5 space-y-5">
        {/* Health score preview */}
        {hasAnyValue && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            className={cn('rounded-[2rem] p-5 border', scoreBg)}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[9px] font-black text-[#4A2C2A]/40 uppercase tracking-widest">Pond Health Score</p>
                <p className={cn('font-black text-4xl tracking-tighter', scoreColor)}>{healthScore}<span className="text-xl">/100</span></p>
              </div>
              <div className="text-right">
                <p className={cn('font-black text-sm', scoreColor)}>
                  {healthScore >= 80 ? '✅ Healthy' : healthScore >= 60 ? '⚠️ Monitor' : '🔴 Action needed'}
                </p>
                <p className="text-[8px] text-[#4A2C2A]/30 font-black uppercase tracking-widest mt-0.5">Live preview</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-[#4A2C2A]/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${healthScore}%` }}
                className={cn('h-full rounded-full', healthScore >= 80 ? 'bg-emerald-500' : healthScore >= 60 ? 'bg-amber-500' : 'bg-red-500')}
              />
            </div>
          </motion.div>
        )}

        {/* Parameter inputs */}
        <div className="space-y-3">
          <h2 className="text-[#4A2C2A] font-black text-base tracking-tight px-1">Water Parameters</h2>
          {PARAMS.map((param, i) => {
            const rawVal = parseFloat(form[param.key] as string);
            const hasVal = !isNaN(rawVal) && form[param.key] !== '';
            const status = hasVal ? getParamStatus(param, rawVal) : null;
            const isTipOpen = expandedTip === param.key;

            return (
              <motion.div
                key={param.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  'bg-white rounded-[2rem] border overflow-hidden shadow-sm transition-all',
                  status === 'danger' ? 'border-red-200' :
                  status === 'warning' ? 'border-amber-200' :
                  status === 'optimal' ? 'border-emerald-200' : 'border-black/5'
                )}
              >
                <div className="px-5 py-4 flex items-center gap-4">
                  {/* Icon */}
                  <div className={cn(
                    'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0',
                    status === 'danger' ? 'bg-red-500 text-white' :
                    status === 'warning' ? 'bg-amber-500 text-white' :
                    status === 'optimal' ? 'bg-emerald-500 text-white' :
                    'bg-[#F8F9FE] text-[#C78200]'
                  )}>
                    <param.icon size={18} />
                  </div>

                  {/* Label + Input */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[#4A2C2A] font-black text-xs tracking-tight">{param.label}</p>
                      {param.unit && <span className="text-[8px] font-black text-[#4A2C2A]/25 uppercase tracking-widest">{param.unit}</span>}
                      {status === 'danger' && <span className="text-[7px] font-black bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full uppercase tracking-widest">DANGER</span>}
                      {status === 'warning' && <span className="text-[7px] font-black bg-amber-100 text-amber-500 px-1.5 py-0.5 rounded-full uppercase tracking-widest">CHECK</span>}
                      {status === 'optimal' && <span className="text-[7px] font-black bg-emerald-100 text-emerald-500 px-1.5 py-0.5 rounded-full uppercase tracking-widest">OK</span>}
                    </div>
                    <input
                      type="number"
                      step="any"
                      value={form[param.key] as string}
                      onChange={e => setForm(prev => ({ ...prev, [param.key]: e.target.value }))}
                      placeholder={param.placeholder}
                      className="w-full text-[#4A2C2A] font-black text-sm bg-transparent outline-none placeholder:text-[#4A2C2A]/20"
                    />
                    <p className="text-[8px] text-[#4A2C2A]/25 font-black mt-0.5 uppercase tracking-widest">
                      Optimal: {param.min}–{param.max} {param.unit}
                    </p>
                  </div>

                  {/* Tip toggle */}
                  <button
                    onClick={() => setExpandedTip(isTipOpen ? null : param.key)}
                    className="w-8 h-8 bg-[#F8F9FE] rounded-xl flex items-center justify-center text-[#4A2C2A]/30 hover:text-[#C78200] transition-colors flex-shrink-0"
                  >
                    <span className="text-xs font-black">?</span>
                  </button>
                </div>

                {/* Tip panel */}
                <AnimatePresence>
                  {isTipOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 pt-1 bg-amber-50 border-t border-amber-100">
                        <p className="text-[10px] text-amber-800 font-medium leading-relaxed">{param.tip}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Corrective Actions preview */}
        {hasAnyValue && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#0D523C] rounded-[2rem] p-5 space-y-3"
          >
            <p className="text-emerald-300/60 text-[9px] font-black uppercase tracking-widest">Today's Action Plan</p>
            {actions.map((action, i) => (
              <p key={i} className="text-white/80 text-[11px] font-bold leading-snug">{action}</p>
            ))}
          </motion.div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={(!hasAnyValue || !pond) || (isExistingRecord && !isModified)}
          className={cn(
            'w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3',
            (hasAnyValue && pond) && !(isExistingRecord && !isModified)
              ? 'bg-[#0D523C] text-white shadow-2xl shadow-emerald-900/20 active:scale-95'
              : 'bg-[#F0F0F0] text-[#4A2C2A]/20 cursor-not-allowed'
          )}
        >
          {isExistingRecord ? (
            isModified ? (
              <><CheckCircle2 size={18} /> Update Existing Log <ArrowRight size={18} /></>
            ) : (
              <><ShieldCheck size={18} /> Already Logged</>
            )
          ) : (
            <><CheckCircle2 size={18} /> Save Daily Log <ArrowRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  );
};
