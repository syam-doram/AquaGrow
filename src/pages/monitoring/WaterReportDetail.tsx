import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ChevronLeft, FlaskConical, Wind, Waves, Zap, Activity,
  Droplets, Thermometer, AlertTriangle, CheckCircle2, XCircle,
  MinusCircle, TrendingUp, TrendingDown, Minus, FileText,
  Lightbulb, HeartPulse, ShieldCheck, BarChart3,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { format, parseISO, subDays, isSameDay } from 'date-fns';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';
import { cn } from '../../utils/cn';

// ─── PARAMETER DEFINITIONS ──────────────────────────────────────────────────
// Each param: safe range, critical range, weight in health score (total = 100)
const PARAMS = [
  {
    key: 'ph',         label: 'pH Level',        unit: '',       weight: 20,
    icon: FlaskConical, color: '#3B82F6',
    safe: [7.5, 8.5],  warn: [7.0, 9.0],
    desc: 'Controls enzyme activity & shrimp metabolism.',
    actionOk:   'pH is optimal. Maintain current water exchange routine.',
    actionWarn: 'Adjust with lime (low pH) or CO₂ injection (high pH).',
    actionCrit: 'CRITICAL: Immediate 20% water exchange + emergency lime.',
  },
  {
    key: 'do',         label: 'Dissolved O₂',    unit: 'mg/L',   weight: 30,
    icon: Wind, color: '#10B981',
    safe: [5.0, 12],   warn: [4.0, 12],
    desc: 'Oxygen supply for shrimp respiration & beneficial bacteria.',
    actionOk:   'DO is excellent. All aerators performing well.',
    actionWarn: 'Increase aeration. Check aerator positions & HP ratings.',
    actionCrit: 'CRITICAL: Run 100% aerators. Reduce feed immediately. Monitor hourly.',
  },
  {
    key: 'salinity',   label: 'Salinity',         unit: 'ppt',   weight: 15,
    icon: Waves, color: '#8B5CF6',
    safe: [10, 20],    warn: [5, 30],
    desc: 'Osmotic balance critical for moulting & growth.',
    actionOk:   'Salinity in optimal range for Vannamei production.',
    actionWarn: 'Adjust via freshwater dilution or marine salt addition.',
    actionCrit: 'CRITICAL: Rapid salinity shift causes mass mortality. Act immediately.',
  },
  {
    key: 'ammonia',    label: 'Ammonia (NH₃)',    unit: 'ppm',   weight: 25,
    icon: Zap, color: '#EF4444',
    safe: [0, 0.05],   warn: [0, 0.1],
    desc: 'Toxic byproduct of feed decomposition & shrimp excretion.',
    actionOk:   'Ammonia level is safe. Good feeding management.',
    actionWarn: 'Reduce feed by 20%. Apply probiotics. Increase water exchange.',
    actionCrit: 'CRITICAL: Stop feeding. Emergency 30% water change. Apply zeolite.',
  },
  {
    key: 'alkalinity', label: 'Alkalinity',       unit: 'mg/L',  weight: 5,
    icon: Activity, color: '#F59E0B',
    safe: [100, 150],  warn: [80, 180],
    desc: 'Buffers pH swings & supports moulting cycle.',
    actionOk:   'Alkalinity stable. Continue regular lime applications.',
    actionWarn: 'Apply agricultural lime (CaCO₃) at 5–10 kg/acre.',
    actionCrit: 'Low alkalinity causes dangerous pH crashes at dawn.',
  },
  {
    key: 'turbidity',  label: 'Turbidity',        unit: 'NTU',   weight: 3,
    icon: Droplets, color: '#6366F1',
    safe: [20, 40],    warn: [10, 60],
    desc: 'Water clarity indicator of plankton bloom health.',
    actionOk:   'Ideal plankton density. Good visibility balance.',
    actionWarn: 'Check plankton bloom — too clear or too dense.',
    actionCrit: 'Dense bloom depletes DO at night. Partial water exchange.',
  },
  {
    key: 'temperature',label: 'Temperature',      unit: '°C',    weight: 0,
    icon: Thermometer, color: '#EC4899',
    safe: [26, 30],    warn: [24, 32],
    desc: 'Drives metabolism, feed conversion & growth rate.',
    actionOk:   'Temperature ideal for Vannamei growth & FCR.',
    actionWarn: 'Adjust shading (high) or reduce water exchange (low).',
    actionCrit: 'Extreme temperature stresses immune system & growth.',
  },
  {
    key: 'mortality',  label: 'Daily Mortality',  unit: '/day',  weight: 2,
    icon: AlertTriangle, color: '#DC2626',
    safe: [0, 10],     warn: [0, 30],
    desc: 'Daily mortality count is a key health indicator.',
    actionOk:   'Mortality within acceptable range. Continue monitoring.',
    actionWarn: 'Elevated mortality. Check for disease symptoms & DO levels.',
    actionCrit: 'CRITICAL: High mortality indicates disease or toxic condition.',
  },
];

// ─── STATUS EVALUATOR ───────────────────────────────────────────────────────
const evalParam = (key: string, val: number | undefined) => {
  if (val === undefined || val === null) return { status: 'none', pts: 0, pct: 0 };
  const p = PARAMS.find(x => x.key === key)!;

  const isHigherBetter = key === 'do'; // Higher DO is better
  const isLowerBetter  = key === 'ammonia' || key === 'mortality';

  let status = 'ok';
  if (key === 'ph') {
    if (val < p.warn[0] || val > p.warn[1]) status = 'critical';
    else if (val < p.safe[0] || val > p.safe[1]) status = 'warn';
  } else if (isLowerBetter) {
    if (val > p.warn[1]) status = 'critical';
    else if (val > p.safe[1]) status = 'warn';
  } else if (isHigherBetter) {
    if (val < p.warn[0]) status = 'critical';
    else if (val < p.safe[0]) status = 'warn';
  } else {
    if (val < p.warn[0] || val > p.warn[1]) status = 'critical';
    else if (val < p.safe[0] || val > p.safe[1]) status = 'warn';
  }

  // Health contribution this param gives (out of its weight)
  const pts = status === 'ok' ? p.weight : status === 'warn' ? Math.round(p.weight * 0.5) : 0;
  // % of safe range filled (for bar width)
  let pct = 100;
  if (status === 'warn') pct = 50;
  if (status === 'critical') pct = 10;

  return { status, pts, pct };
};

// ─── OVERALL HEALTH SCORE ───────────────────────────────────────────────────
const calcScore = (record: any) => {
  if (!record) return { score: 0, label: 'NO DATA', ring: '#94a3b8', gradient: ['#94a3b8','#cbd5e1'] };
  let total = 0;
  PARAMS.forEach(p => {
    const { pts } = evalParam(p.key, record[p.key]);
    total += pts;
  });
  const score = Math.min(100, total);
  if (score >= 90) return { score, label: 'EXCELLENT', ring: '#10b981', gradient: ['#10b981','#34d399'] };
  if (score >= 70) return { score, label: 'STABLE',    ring: '#3b82f6', gradient: ['#3b82f6','#60a5fa'] };
  if (score >= 50) return { score, label: 'WARNING',   ring: '#f59e0b', gradient: ['#f59e0b','#fcd34d'] };
  return              { score, label: 'CRITICAL',  ring: '#ef4444', gradient: ['#ef4444','#f87171'] };
};

// ─── STATUS UI HELPERS ──────────────────────────────────────────────────────
const STATUS_UI = {
  ok:       { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, iconCls: 'text-emerald-500',  barCls: 'bg-emerald-500', label: 'OPTIMAL'  },
  warn:     { badge: 'bg-amber-50   text-amber-700   border-amber-200',   icon: MinusCircle,  iconCls: 'text-amber-500',    barCls: 'bg-amber-500',   label: 'WARNING'  },
  critical: { badge: 'bg-red-50     text-red-700     border-red-200',     icon: XCircle,      iconCls: 'text-red-500',      barCls: 'bg-red-500',     label: 'CRITICAL' },
  none:     { badge: 'bg-slate-100  text-slate-400   border-slate-200',   icon: Minus,        iconCls: 'text-slate-300',    barCls: 'bg-slate-200',   label: 'NO DATA'  },
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export const WaterReportDetail = () => {
  const { pondId, date } = useParams<{ pondId: string; date: string }>();
  const navigate = useNavigate();
  const { ponds, waterRecords, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const pond = ponds.find(p => p.id === pondId);
  const parsedDate = date ? parseISO(date) : new Date();

  // Target record for this date
  const record = waterRecords
    .filter(r => r.pondId === pondId && (r.date === date || isSameDay(new Date(r.date), parsedDate)))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  // 7-day chart data
  const chartData = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
    const d   = subDays(parsedDate, 6 - i);
    const dStr = format(d, 'yyyy-MM-dd');
    const rec  = waterRecords.find(r => r.pondId === pondId && (r.date === dStr || isSameDay(new Date(r.date), d)));
    return { name: format(d, 'EEE'), do: rec?.do ?? null, ph: rec?.ph ?? null, ammonia: rec?.ammonia ?? null };
  }), [waterRecords, pondId, date]);

  const health = calcScore(record);
  const circumference = 2 * Math.PI * 48;
  const dashOffset    = circumference * (1 - health.score / 100);

  // Summary counts
  const evaluated = PARAMS.map(p => ({ ...p, ...evalParam(p.key, record?.[p.key as keyof typeof record] as number) }));
  const okCount   = evaluated.filter(p => p.status === 'ok').length;
  const warnCount = evaluated.filter(p => p.status === 'warn').length;
  const critCount = evaluated.filter(p => p.status === 'critical').length;

  // AI Recommendations
  const recs = evaluated
    .filter(p => p.status !== 'none')
    .sort((a, b) => (b.status === 'critical' ? 1 : b.status === 'warn' ? 0.5 : 0) - (a.status === 'critical' ? 1 : a.status === 'warn' ? 0.5 : 0))
    .slice(0, 3);

  return (
    <div className={cn('min-h-screen pb-28 font-sans overflow-x-hidden', isDark ? 'bg-[#05110d]' : 'bg-[#F4F8F6]')}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className={cn(
        'sticky top-0 z-50 px-4 py-3 flex items-center gap-3 border-b backdrop-blur-xl',
        isDark ? 'bg-[#05110d]/90 border-white/10' : 'bg-white/90 border-slate-100'
      )}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isDark ? 'bg-white/8 text-white' : 'bg-slate-100 text-slate-700')}
        >
          <ChevronLeft size={18} />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 className={cn('text-[13px] font-black tracking-tight truncate', isDark ? 'text-white' : 'text-slate-900')}>
            Water Quality Report
          </h1>
          <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/40' : 'text-slate-400')}>
            {pond?.name} · {format(parsedDate, 'MMM d, yyyy')}
          </p>
        </div>
        <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest',
          health.label === 'EXCELLENT' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
          health.label === 'STABLE'    ? 'bg-blue-50   border-blue-200   text-blue-700'    :
          health.label === 'WARNING'   ? 'bg-amber-50  border-amber-200  text-amber-700'   :
          health.label === 'CRITICAL'  ? 'bg-red-50    border-red-200    text-red-700'     :
          isDark ? 'bg-white/8 border-white/10 text-white/50' : 'bg-slate-100 border-slate-200 text-slate-400'
        )}>
          <HeartPulse size={10} />
          {health.label}
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">

        {/* ── 1. HEALTH SCORE HERO ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-[2rem] p-5 border overflow-hidden relative',
            isDark ? 'bg-[#0a1f16] border-white/8' : 'bg-white border-slate-100 shadow-sm'
          )}
        >
          {/* Glow blob */}
          <div className="absolute right-0 top-0 w-40 h-40 rounded-full blur-[80px] opacity-20 pointer-events-none"
            style={{ background: health.ring }} />

          <div className="relative z-10 flex items-center gap-5">
            {/* Ring */}
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 112 112">
                <circle cx="56" cy="56" r="48" strokeWidth="8" stroke="currentColor" fill="none"
                  className={isDark ? 'text-white/8' : 'text-slate-100'} />
                <circle cx="56" cy="56" r="48" strokeWidth="8" fill="none"
                  stroke={health.ring} strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <span className={cn('text-2xl font-black tracking-tight leading-none', isDark ? 'text-white' : 'text-slate-900')}>
                  {health.score}
                </span>
                <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/40' : 'text-slate-400')}>
                  / 100
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={cn('text-[8px] font-black uppercase tracking-widest mb-1.5', isDark ? 'text-white/30' : 'text-slate-400')}>
                Overall Pond Health
              </p>
              <h2 className={cn('text-xl font-black tracking-tight leading-none mb-3', isDark ? 'text-white' : 'text-slate-900')}>
                {record ? health.label : 'No Data'}
              </h2>

              {/* Summary pill row */}
              <div className="flex gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1">
                  <CheckCircle2 size={9} className="text-emerald-500" />
                  <span className="text-[8px] font-black text-emerald-700">{okCount} OK</span>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                  <MinusCircle size={9} className="text-amber-500" />
                  <span className="text-[8px] font-black text-amber-700">{warnCount} Warn</span>
                </div>
                <div className="flex items-center gap-1 bg-red-50 border border-red-100 rounded-lg px-2 py-1">
                  <XCircle size={9} className="text-red-500" />
                  <span className="text-[8px] font-black text-red-700">{critCount} Critical</span>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width score bar */}
          <div className={cn('mt-5 rounded-full h-2 overflow-hidden', isDark ? 'bg-white/8' : 'bg-slate-100')}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${health.score}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${health.gradient[0]}, ${health.gradient[1]})` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-300')}>0</span>
            <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-300')}>100 Perfect</span>
          </div>
        </motion.div>

        {/* ── 2. PARAMETER HEALTH CONTRIBUTION GRID ─────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <BarChart3 size={13} className="text-emerald-500" />
            <h2 className={cn('text-[13px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              Health Contribution by Parameter
            </h2>
          </div>

          <div className="space-y-2.5">
            {PARAMS.map((param, i) => {
              const rawVal  = record?.[param.key as keyof typeof record] as number | undefined;
              const { status, pts, pct } = evalParam(param.key, rawVal);
              const ui      = STATUS_UI[status as keyof typeof STATUS_UI];
              const Icon    = param.icon;
              const StatusIcon = ui.icon;
              const action  = status === 'ok' ? param.actionOk : status === 'warn' ? param.actionWarn : param.actionCrit;

              return (
                <motion.div
                  key={param.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 + i * 0.04 }}
                  className={cn(
                    'rounded-2xl border p-4 overflow-hidden',
                    status === 'critical' ? (isDark ? 'bg-red-950/30 border-red-500/20' : 'bg-red-50/80 border-red-100')  :
                    status === 'warn'     ? (isDark ? 'bg-amber-950/20 border-amber-500/20' : 'bg-amber-50/80 border-amber-100') :
                    status === 'ok'       ? (isDark ? 'bg-emerald-950/20 border-emerald-500/10' : 'bg-white border-slate-100 shadow-sm') :
                    (isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-100')
                  )}
                >
                  {/* Row 1: Icon + Label + Value + Status */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${param.color}18`, border: `1px solid ${param.color}30` }}>
                      <Icon size={15} style={{ color: param.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/40' : 'text-slate-400')}>
                        {param.label}
                      </p>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className={cn('text-[18px] font-black tracking-tight leading-none',
                          status === 'critical' ? 'text-red-600' :
                          status === 'warn'     ? 'text-amber-600' :
                          status === 'ok'       ? (isDark ? 'text-white' : 'text-slate-900') :
                          isDark ? 'text-white/25' : 'text-slate-300'
                        )}>
                          {rawVal !== undefined && rawVal !== null ? rawVal.toFixed(2).replace(/\.?0+$/, '') : '—'}
                        </span>
                        {param.unit && (
                          <span className={cn('text-[8px] font-black uppercase', isDark ? 'text-white/25' : 'text-slate-400')}>
                            {param.unit}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={cn('flex items-center gap-1 px-2 py-1 rounded-lg border text-[7px] font-black uppercase tracking-widest flex-shrink-0', ui.badge)}>
                      <StatusIcon size={8} />
                      {ui.label}
                    </div>
                  </div>

                  {/* Row 2: Health contribution bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>
                        Health Contribution
                      </span>
                      <span className={cn('text-[9px] font-black', isDark ? 'text-white/60' : 'text-slate-600')}>
                        {pts}/{param.weight} pts
                      </span>
                    </div>
                    <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-white/8' : 'bg-slate-100')}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(pts / param.weight) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 + i * 0.04 }}
                        className={cn('h-full rounded-full', ui.barCls)}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-300')}>
                        Safe: {Array.isArray(param.safe) ? `${param.safe[0]}–${param.safe[1]}${param.unit}` : ''}
                      </span>
                      <span className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-300')}>
                        Weight: {param.weight}%
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Description + Action */}
                  <div className={cn('rounded-xl p-2.5 border',
                    status === 'critical' ? 'bg-red-100/50 border-red-200' :
                    status === 'warn'     ? 'bg-amber-100/50 border-amber-200' :
                    status === 'ok'       ? 'bg-emerald-50/50 border-emerald-100' :
                    isDark ? 'bg-white/4 border-white/8' : 'bg-slate-50 border-slate-100'
                  )}>
                    <p className={cn('text-[8px] font-medium leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
                      {param.desc}
                    </p>
                    {status !== 'none' && (
                      <p className={cn('text-[8px] font-black leading-relaxed mt-1.5',
                        status === 'critical' ? 'text-red-600' :
                        status === 'warn'     ? 'text-amber-700' :
                        'text-emerald-700'
                      )}>
                        💡 {action}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── 3. AI PRIORITY RECOMMENDATIONS ───────────────────────── */}
        {recs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Lightbulb size={13} className="text-amber-500" />
              <h2 className={cn('text-[13px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                Priority Actions
              </h2>
            </div>

            <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-[#0a1f16] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
              {recs.map((r, i) => {
                const ui = STATUS_UI[r.status as keyof typeof STATUS_UI];
                const action = r.status === 'ok' ? r.actionOk : r.status === 'warn' ? r.actionWarn : r.actionCrit;
                return (
                  <div key={r.key} className={cn('px-4 py-3.5 flex items-start gap-3', i < recs.length - 1 && (isDark ? 'border-b border-white/8' : 'border-b border-slate-50'))}>
                    <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', ui.badge, 'border')}>
                      <span className="text-[9px] font-black">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-[10px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                        {r.label}
                        <span className={cn('ml-1.5 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border', ui.badge)}>
                          {ui.label}
                        </span>
                      </p>
                      <p className={cn('text-[9px] leading-relaxed mt-1', isDark ? 'text-white/50' : 'text-slate-500')}>
                        {action}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── 4. 7-DAY TREND CHART ──────────────────────────────────── */}
        {chartData.some(d => d.do !== null) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <TrendingUp size={13} className="text-emerald-500" />
              <h2 className={cn('text-[13px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                7-Day Trend
              </h2>
            </div>

            <div className={cn('rounded-2xl border p-4', isDark ? 'bg-[#0a1f16] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
              {/* DO Trend */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/40' : 'text-slate-400')}>Dissolved O₂ (mg/L)</p>
                  <Wind size={11} className="text-emerald-500" />
                </div>
                <ResponsiveContainer width="100%" height={70}>
                  <AreaChart data={chartData} margin={{ top: 2, right: 2, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="doGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 6, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 9 }} />
                    <Area type="monotone" dataKey="do" stroke="#10b981" strokeWidth={2} fill="url(#doGrad)" dot={false} name="DO mg/L" connectNulls={false} />
                  </AreaChart>
                </ResponsiveContainer>
                {/* Safe zone annotation */}
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-3 h-0.5 bg-emerald-500 rounded" />
                  <span className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>DO — Safe: &gt;5.0 mg/L</span>
                </div>
              </div>

              {/* pH Trend */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/40' : 'text-slate-400')}>pH Level</p>
                  <FlaskConical size={11} className="text-blue-500" />
                </div>
                <ResponsiveContainer width="100%" height={70}>
                  <AreaChart data={chartData} margin={{ top: 2, right: 2, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 6, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 9 }} />
                    <Area type="monotone" dataKey="ph" stroke="#3b82f6" strokeWidth={2} fill="url(#phGrad)" dot={false} name="pH" connectNulls={false} />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-3 h-0.5 bg-blue-500 rounded" />
                  <span className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>pH — Safe: 7.5–8.5</span>
                </div>
              </div>

              {/* Ammonia Trend */}
              {chartData.some(d => d.ammonia !== null) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/40' : 'text-slate-400')}>Ammonia (ppm)</p>
                    <Zap size={11} className="text-red-500" />
                  </div>
                  <ResponsiveContainer width="100%" height={70}>
                    <AreaChart data={chartData} margin={{ top: 2, right: 2, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="amGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                      <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 6, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 9 }} />
                      <Area type="monotone" dataKey="ammonia" stroke="#ef4444" strokeWidth={2} fill="url(#amGrad)" dot={false} name="Ammonia ppm" connectNulls={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-3 h-0.5 bg-red-500 rounded" />
                    <span className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>Ammonia — Safe: &lt;0.05 ppm</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── 5. REPORT FOOTER ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={cn('rounded-2xl border p-4 flex items-center gap-3', isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-100')}
        >
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', isDark ? 'bg-white/8' : 'bg-slate-100')}>
            <ShieldCheck size={16} className="text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/40' : 'text-slate-400')}>
              AquaGrow Health Engine™
            </p>
            <p className={cn('text-[8px] leading-relaxed mt-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>
              Report generated from {evaluated.filter(p => p.status !== 'none').length} logged parameters · {format(parsedDate, 'MMM d, yyyy')} · {pond?.name}
            </p>
          </div>
          <FileText size={13} className={isDark ? 'text-white/20' : 'text-slate-300'} />
        </motion.div>

      </div>
    </div>
  );
};
