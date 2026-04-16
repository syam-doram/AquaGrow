import React, { useState, useRef, useEffect, useMemo } from 'react';
import { NoPondState } from '../../components/NoPondState';
import { ServerErrorState } from '../../components/ServerErrorState';
import {
  History, AlertTriangle, TrendingUp, Calendar,
  Bluetooth, Wifi, RefreshCcw, X, ShieldCheck,
  Activity, FlaskConical, Waves, Zap, Wind,
  Thermometer, Droplets, Plus, ChevronLeft,
  ChevronRight, CheckCircle2, Circle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, ComposedChart, ReferenceLine,
} from 'recharts';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { format, subDays, isSameDay, addDays, startOfToday, startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { iotService, SensorData } from '../../services/iotService';
import { motion, AnimatePresence } from 'motion/react';
import { calculateDOC } from '../../utils/pondUtils';

// ─── HEALTH SCORING ───────────────────────────────────────────────────────────
const calcHealth = (record: any) => {
  if (!record) return { score: 0, label: 'No Data', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' };
  let pts = 100;
  if (record.ph < 7.0 || record.ph > 9.0) pts -= 25; else if (record.ph < 7.5 || record.ph > 8.5) pts -= 10;
  if (record.do < 4.0) pts -= 35; else if (record.do < 5.0) pts -= 15;
  if (record.salinity < 5 || record.salinity > 30) pts -= 15; else if (record.salinity < 10 || record.salinity > 20) pts -= 5;
  if (record.ammonia && record.ammonia > 0.1) pts -= 30; else if (record.ammonia && record.ammonia > 0.05) pts -= 15;
  const score = Math.max(0, pts);
  if (score >= 90) return { score, label: 'Excellent', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' };
  if (score >= 70) return { score, label: 'Stable',    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)'  };
  if (score >= 50) return { score, label: 'Warning',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  };
  return              { score, label: 'Critical',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'   };
};

// ─── PARAMETER CONFIG ─────────────────────────────────────────────────────────
const getMetrics = (record: any, liveData: any, isLive: boolean) => {
  const r = isLive && liveData ? liveData : record;
  return [
    {
      key: 'ph', label: 'pH Level', icon: FlaskConical,
      val: r?.ph, unit: '', target: '7.5 – 8.5',
      min: 7.5, max: 8.5, absMin: 6.5, absMax: 9.5,
      color: '#3b82f6',
      tip: 'Ideal shrimp pH is 7.8–8.2. Below 7.5 causes stress; above 8.8 causes ammonia toxicity.',
      warn: (v: number) => v < 7.5 || v > 8.5,
    },
    {
      key: 'do', label: 'Dissolved O₂', icon: Wind,
      val: r?.do, unit: 'mg/L', target: '> 5.0',
      min: 5.0, max: 9.0, absMin: 3.0, absMax: 12,
      color: '#10b981',
      tip: 'DO below 4 mg/L is a pond emergency. Run aerators immediately.',
      warn: (v: number) => v < 5.0,
    },
    {
      key: 'temperature', label: 'Temperature', icon: Thermometer,
      val: r?.temp ?? r?.temperature, unit: '°C', target: '26 – 30',
      min: 26, max: 30, absMin: 20, absMax: 36,
      color: '#f97316',
      tip: 'Above 32°C sharply reduces DO. Reduce feed and run aerators.',
      warn: (v: number) => v < 26 || v > 30,
    },
    {
      key: 'salinity', label: 'Salinity', icon: Waves,
      val: r?.salinity, unit: 'ppt', target: '10 – 20',
      min: 10, max: 20, absMin: 3, absMax: 35,
      color: '#06b6d4',
      tip: 'Heavy rain can crash salinity. Add mineral mix if below 8 ppt.',
      warn: (v: number) => v < 10 || v > 20,
    },
    {
      key: 'ammonia', label: 'Ammonia', icon: Zap,
      val: r?.ammonia, unit: 'ppm', target: '< 0.05',
      min: 0, max: 0.05, absMin: 0, absMax: 0.5,
      color: '#ef4444',
      tip: 'Ammonia > 0.1 ppm is toxic. Apply zeolite (50 kg/acre) → water change.',
      warn: (v: number) => v > 0.05,
    },
    {
      key: 'alkalinity', label: 'Alkalinity', icon: Activity,
      val: r?.alkalinity, unit: 'mg/L', target: '100 – 150',
      min: 100, max: 150, absMin: 50, absMax: 250,
      color: '#8b5cf6',
      tip: 'Low alkalinity causes pH crashes. Add lime (dolomite) to stabilize.',
      warn: (v: number) => v < 80 || v > 200,
    },
    {
      key: 'turbidity', label: 'Turbidity', icon: Droplets,
      val: r?.turbidity, unit: 'NTU', target: '20 – 40',
      min: 20, max: 40, absMin: 0, absMax: 100,
      color: '#c78200',
      tip: 'Secchi depth < 25 cm = bloom crash risk. Add probiotic immediately.',
      warn: (v: number) => v > 60 || v < 10,
    },
    {
      key: 'mortality', label: 'Mortality', icon: AlertTriangle,
      val: r?.mortality, unit: '/day', target: '< 10',
      min: 0, max: 10, absMin: 0, absMax: 100,
      color: '#ef4444',
      tip: 'Sudden mortality spike > 30/day requires immediate water change and netting.',
      warn: (v: number) => v > 10,
    },
  ];
};

// ─── GAUGE BAR ────────────────────────────────────────────────────────────────
const GaugeBar = ({ val, min, max, color, warn }: { val: number; min: number; max: number; color: string; warn: boolean }) => {
  const pct = Math.min(100, Math.max(0, ((val - min * 0.5) / (max * 1.5 - min * 0.5)) * 100));
  return (
    <div className="h-1 bg-black/10 rounded-full overflow-hidden mt-2">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ background: warn ? '#ef4444' : color }}
      />
    </div>
  );
};

export const WaterMonitoring = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, waterRecords, isPro, addWaterRecord, serverError, theme } = useData();
  const isDark = (theme as string) === 'dark' || (theme as string) === 'midnight';
  const activePonds = ponds.filter(p => p.status !== 'harvested');
  const [selectedPondId, setSelectedPondId] = useState<string>(activePonds[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connType, setConnType] = useState<'BLE' | 'WiFi' | null>(null);
  const [liveData, setLiveData] = useState<SensorData | null>(null);
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  const selectedPond = ponds.find(p => p.id === selectedPondId);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dateRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (activePonds.length > 0 && !selectedPondId) setSelectedPondId(activePonds[0].id); }, [ponds]);
  useEffect(() => { setSelectedDate(startOfToday()); }, [selectedPondId]);
  useEffect(() => {
    const timer = setTimeout(() => { if (dateRailRef.current) dateRailRef.current.scrollLeft = dateRailRef.current.scrollWidth; }, 150);
    return () => clearTimeout(timer);
  }, [selectedPondId, selectedDate]);

  const latestRecord = waterRecords
    .filter(r => r.pondId === selectedPondId && (r.date === dateStr || isSameDay(new Date(r.date), selectedDate)))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const health = calcHealth(isLiveMode ? liveData : latestRecord);
  const doc = selectedPond ? calculateDOC(selectedPond.stockingDate) : 0;

  const METRICS = useMemo(
    () => getMetrics(latestRecord, liveData, isLiveMode),
    [latestRecord, liveData, isLiveMode]
  );
  const loggedCount = METRICS.filter(m => m.val !== undefined && m.val !== null).length;
  const warnCount   = METRICS.filter(m => m.val !== undefined && m.val !== null && m.warn(m.val as number)).length;

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(selectedDate, 6 - i);
    const rec = waterRecords.find(r => r.pondId === selectedPondId && (r.date === format(d, 'yyyy-MM-dd') || isSameDay(new Date(r.date), d)));
    return { name: format(d, 'EEE'), do: rec?.do ?? null, ph: rec?.ph ?? null, temp: rec?.temperature ?? null };
  });

  const handleSyncIoT = async (type: 'BLE' | 'WiFi') => {
    if (!isPro) { navigate('/subscription'); return; }
    setIsConnecting(true); setConnType(type);
    try {
      const data = type === 'BLE' ? await iotService.connectViaBluetooth() : await iotService.syncViaFirebase(selectedPondId);
      if (data && selectedPondId) {
        setLiveData(data); setIsLiveMode(true);
        await addWaterRecord({ pondId: selectedPondId, date: format(new Date(), 'yyyy-MM-dd'), ph: data.ph, do: data.do, ammonia: 0.02, salinity: data.salinity, temperature: data.temp, isSynced: true });
      } else throw new Error('No data');
    } catch { alert(t.couldNotConnectSensor(type)); }
    finally { setIsConnecting(false); setConnType(null); }
  };

  // ── EMPTY STATE ─────────────────────────────────────────────────────────────
  if (activePonds.length === 0) return (
    <div className={cn('min-h-screen flex flex-col', isDark ? 'bg-[#060A10]' : 'bg-[#EEF5F1]')}>
      <header className={cn('fixed top-0 left-0 right-0 max-w-[420px] mx-auto z-50 px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 flex items-center justify-between border-b backdrop-blur-xl', isDark ? 'bg-[#060A10]/90 border-white/5' : 'bg-white/95 border-slate-100 shadow-sm')}>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/dashboard')} className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-slate-200 text-slate-500')}>
          <ChevronLeft size={16} />
        </motion.button>
        <h1 className={cn('text-[11px] font-black tracking-widest uppercase', isDark ? 'text-white' : 'text-slate-900')}>Water Monitor</h1>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', isDark ? 'bg-teal-500/10 border-teal-500/20' : 'bg-teal-50 border-teal-200')}>
          <Droplets size={14} className={isDark ? 'text-teal-400' : 'text-teal-600'} />
        </div>
      </header>
      <div className="pt-28 flex-1 flex items-center justify-center px-4">
        {serverError ? <ServerErrorState isDark={isDark} /> : <NoPondState isDark={isDark} subtitle="Add a pond to start monitoring water quality." />}
      </div>
    </div>
  );

  return (
    <div className={cn('pb-32 min-h-[100dvh] font-sans relative overflow-hidden transition-colors duration-500', isDark ? 'bg-[#060A10]' : 'bg-[#EEF5F1]')}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={cn('absolute -top-20 -right-20 w-96 h-96 rounded-full blur-[160px]', isDark ? 'bg-teal-600/15' : 'bg-teal-400/12')} />
        <div className={cn('absolute bottom-20 -left-20 w-80 h-80 rounded-full blur-[140px]', isDark ? 'bg-blue-500/10' : 'bg-blue-400/8')} />
      </div>

      {/* ─── FIXED HEADER ─── */}
      <header className={cn(
        'fixed top-0 left-0 right-0 max-w-[420px] mx-auto z-50 px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3',
        'flex items-center justify-between border-b backdrop-blur-xl',
        isDark ? 'bg-[#060A10]/90 border-white/5' : 'bg-white/95 border-slate-100 shadow-sm'
      )}>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/dashboard')}
          className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-slate-200 text-slate-500 shadow-sm')}>
          <ChevronLeft size={16} />
        </motion.button>
        <div className="text-center">
          <h1 className={cn('text-[11px] font-black tracking-widest uppercase', isDark ? 'text-white' : 'text-slate-900')}>Water Intelligence</h1>
          <p className={cn('text-[7.5px] font-black uppercase tracking-[0.2em] mt-0.5', isDark ? 'text-teal-400/70' : 'text-teal-600')}>DOC Auto-Tracked • SOP Benchmarked</p>
        </div>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', isDark ? 'bg-teal-500/10 border-teal-500/20' : 'bg-teal-50 border-teal-200')}>
          <Droplets size={14} className={isDark ? 'text-teal-400' : 'text-teal-600'} />
        </div>
      </header>

      <div className="pt-[calc(env(safe-area-inset-top)+4.5rem)] px-4 max-w-[420px] mx-auto relative z-10 space-y-4">

        {/* ─── POND TABS ─── */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {activePonds.map(p => {
            const pr = waterRecords.filter(r => r.pondId === p.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            const ph = calcHealth(pr);
            const isActive = selectedPondId === p.id;
            return (
              <button key={p.id} onClick={() => setSelectedPondId(p.id)}
                className={cn('px-3.5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex-shrink-0',
                  isActive
                    ? 'text-white shadow-lg'
                    : isDark ? 'bg-white/5 text-white/40 border-white/8' : 'bg-white text-slate-500 border-slate-100 shadow-sm')}
                style={isActive ? { background: ph.color, borderColor: ph.color, boxShadow: `0 4px 16px ${ph.color}30` } : {}}>
                💧 {p.name} <span className="opacity-60 ml-1">D{calculateDOC(p.stockingDate)}</span>
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════
            HERO COMMAND CARD
        ═══════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          <motion.div key={selectedPondId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

            <div className="rounded-[2rem] overflow-hidden shadow-2xl relative"
              style={{
                background: health.score >= 90
                  ? 'linear-gradient(150deg,#011c15,#023d2b,#047857,#059669,#10b981)'
                  : health.score >= 70
                  ? 'linear-gradient(150deg,#011528,#022850,#1d4ed8,#2563eb,#3b82f6)'
                  : health.score >= 50
                  ? 'linear-gradient(150deg,#1c1200,#3b2600,#b45309,#d97706,#f59e0b)'
                  : health.score > 0
                  ? 'linear-gradient(150deg,#1c0000,#4b0000,#b91c1c,#dc2626,#ef4444)'
                  : 'linear-gradient(150deg,#0a0a0f,#111827,#1f2937,#374151,#4b5563)'
              }}>
              {/* Mesh pattern */}
              <div className="absolute inset-0 opacity-[0.05]"
                style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
              {/* Glow */}
              <div className="absolute -bottom-16 -right-16 w-64 h-64 blur-[80px] rounded-full" style={{ background: `${health.color}25` }} />

              <div className="relative z-10 p-5">
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white/30 text-[7px] font-black uppercase tracking-[0.35em] mb-1">Water Command Center</p>
                    <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-2">{selectedPond?.name ?? '—'}</h2>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-white tracking-tighter leading-none" style={{ textShadow: `0 2px 20px ${health.color}50` }}>
                        {health.score}
                      </span>
                      <span className="text-base font-black" style={{ color: `${health.color}cc` }}>%</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[8px] font-black text-white/80 uppercase tracking-widest">
                        {health.label}
                      </span>
                      {isLiveMode && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-[8px] font-black text-emerald-100 uppercase tracking-widest">
                          ● LIVE
                        </span>
                      )}
                      {warnCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-400/20 border border-red-300/30 text-[8px] font-black text-red-100 uppercase tracking-widest">
                          ⚠ {warnCount} alert{warnCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Health Ring */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="relative w-20 h-20">
                      <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                        <motion.circle cx="18" cy="18" r="15.9" fill="none"
                          stroke={health.color} strokeWidth="2.5" strokeLinecap="round"
                          initial={{ strokeDasharray: '0 100' }}
                          animate={{ strokeDasharray: `${health.score} 100` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-white leading-none">{loggedCount}</span>
                        <span className="text-[6px] font-black text-white/40 uppercase tracking-widest">logged</span>
                      </div>
                    </div>
                    <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: health.color }}>
                      {loggedCount}/8 params
                    </span>
                  </div>
                </div>

                {/* IoT row */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                  <p className="text-[7px] font-black text-white/30 uppercase tracking-widest flex-1">IoT Sync</p>
                  {isLiveMode ? (
                    <button onClick={() => setIsLiveMode(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-400/30 text-[8px] font-black text-red-200 uppercase tracking-widest">
                      <X size={10} /> Disconnect
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleSyncIoT('BLE')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-[8px] font-black text-white/70 uppercase tracking-widest">
                        {isConnecting && connType === 'BLE' ? <RefreshCcw size={10} className="animate-spin" /> : <Bluetooth size={10} />} BLE
                      </button>
                      <button onClick={() => handleSyncIoT('WiFi')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-[8px] font-black text-white/70 uppercase tracking-widest">
                        {isConnecting && connType === 'WiFi' ? <RefreshCcw size={10} className="animate-spin" /> : <Wifi size={10} />} WiFi
                      </button>
                    </div>
                  )}
                </div>

                {/* Connecting progress */}
                {isConnecting && (
                  <div className="mt-2 h-0.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div animate={{ x: ['-100%', '400%'] }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                      className="h-full w-1/3 bg-white/60 rounded-full" />
                  </div>
                )}
              </div>
            </div>

            {/* ─── DATE RAIL ─── */}
            <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-white/[0.04] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <div className="flex items-center gap-1.5">
                  <Calendar size={11} className={isDark ? 'text-teal-400' : 'text-teal-600'} />
                  <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>Culture Timeline</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-teal-400/70' : 'text-teal-600')}>
                    {isSameDay(selectedDate, startOfToday()) ? '✓ Today' : format(selectedDate, 'MMM d')}
                  </span>
                  {!isSameDay(selectedDate, startOfToday()) && (
                    <button onClick={() => setSelectedDate(startOfToday())}
                      className="bg-teal-600 text-white text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                      Today
                    </button>
                  )}
                </div>
              </div>
              <div ref={dateRailRef} className="flex gap-1.5 overflow-x-auto pb-3 px-4 no-scrollbar">
                {(() => {
                  if (!selectedPond) return null;
                  const start = startOfDay(new Date(selectedPond.stockingDate));
                  const today = startOfToday();
                  const totalDays = Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86400000) + 1);
                  return Array.from({ length: totalDays }).map((_, i) => {
                    const d = addDays(start, i);
                    const isActive = isSameDay(d, selectedDate);
                    const hasRecord = waterRecords.some(r => r.pondId === selectedPondId && isSameDay(new Date(r.date), d));
                    return (
                      <button key={i} onClick={() => setSelectedDate(d)}
                        className={cn('flex-shrink-0 w-10 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all border',
                          isActive
                            ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                            : isDark ? 'bg-white/5 border-white/8 text-white/40' : 'bg-slate-50 border-slate-100 text-slate-500')}>
                        <span className={cn('text-[5px] font-black uppercase', isActive ? 'text-white/60' : isDark ? 'text-white/20' : 'text-slate-400')}>{format(d, 'EEE')}</span>
                        <span className="text-[10px] font-black leading-none">{format(d, 'd')}</span>
                        <div className={cn('w-1 h-1 rounded-full mt-0.5', hasRecord ? 'bg-emerald-400' : 'opacity-0')} />
                      </button>
                    );
                  });
                })()}
              </div>
            </div>



            {/* ═══════════════════════════════════════════════════
                PARAMETER GRID
            ═══════════════════════════════════════════════════ */}
            <div>
              <div className="flex items-center justify-between px-1 mb-2">
                <div>
                  <p className={cn('text-sm font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                    {isLiveMode ? '● Live Readings' : 'Water Parameters'}
                  </p>
                  <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>
                    {format(selectedDate, 'MMM d, yyyy')} · {loggedCount}/8 logged
                  </p>
                </div>
                {warnCount > 0 && (
                  <span className="text-[7px] font-black px-2 py-1 rounded-xl bg-red-500/15 text-red-500 border border-red-500/25">
                    ⚠ {warnCount} out of range
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {METRICS.map((m, i) => {
                  const hasVal = m.val !== undefined && m.val !== null;
                  const isWarn = hasVal && m.warn(m.val as number);
                  const isTipOpen = expandedTip === m.key;

                  return (
                    <motion.div key={m.key}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setExpandedTip(isTipOpen ? null : m.key)}
                      className={cn('rounded-2xl border overflow-hidden cursor-pointer transition-all',
                        isWarn
                          ? isDark ? 'bg-red-500/8 border-red-500/30' : 'bg-red-50 border-red-200'
                          : hasVal
                          ? isDark ? 'bg-white/[0.04] border-white/8' : 'bg-white border-slate-100 shadow-sm'
                          : isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'
                      )}>
                      <div className="px-3 pt-3 pb-2.5">
                        {/* Icon + status */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: hasVal ? `${m.color}18` : 'rgba(100,116,139,0.08)',
                            }}>
                            <m.icon size={14} style={{ color: hasVal ? m.color : '#64748b' }} />
                          </div>
                          <span className="text-[5.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                            style={{
                              background: isWarn ? 'rgba(239,68,68,0.12)' : hasVal ? `${m.color}15` : 'rgba(148,163,184,0.1)',
                              color: isWarn ? '#ef4444' : hasVal ? m.color : '#94a3b8',
                            }}>
                            {isLiveMode ? 'LIVE' : isWarn ? 'WARN' : hasVal ? 'OK' : 'N/A'}
                          </span>
                        </div>

                        {/* Label */}
                        <p className={cn('text-[6.5px] font-black uppercase tracking-widest leading-none mb-1.5', isDark ? 'text-white/30' : 'text-slate-400')}>{m.label}</p>

                        {/* Value */}
                        <div className="flex items-baseline gap-0.5">
                          <span className={cn('text-xl font-black tracking-tight leading-none',
                            isWarn ? 'text-red-500' : hasVal ? isDark ? 'text-white' : 'text-slate-900' : isDark ? 'text-white/15' : 'text-slate-200')}>
                            {hasVal ? (typeof m.val === 'number' ? m.val.toFixed(1) : m.val) : '—'}
                          </span>
                          {m.unit && <span className={cn('text-[7px] font-black uppercase ml-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>{m.unit}</span>}
                        </div>

                        {/* Target */}
                        <p className={cn('text-[5.5px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/15' : 'text-slate-300')}>{m.target}</p>

                        {/* Gauge bar */}
                        {hasVal && <GaugeBar val={m.val as number} min={m.min} max={m.max} color={m.color} warn={isWarn} />}
                      </div>

                      {/* Expanded tip */}
                      <AnimatePresence>
                        {isTipOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t"
                            style={{ borderColor: isWarn ? 'rgba(239,68,68,0.15)' : `${m.color}18` }}>
                            <div className="px-3 py-2.5">
                              <p className="text-[7.5px] font-medium leading-snug"
                                style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#475569' }}>
                                💡 {m.tip}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                7-DAY TREND CHART
            ═══════════════════════════════════════════════════ */}
            {chartData.some(d => d.do !== null || d.ph !== null) && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className={cn('rounded-2xl border', isDark ? 'bg-white/[0.04] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                <div className="px-4 pt-3.5 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className={cn('text-[7px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>7-Day Trend</p>
                      <h3 className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>DO & pH History</h3>
                    </div>
                    <TrendingUp size={15} className="text-teal-500" />
                  </div>
                  <ResponsiveContainer width="100%" height={100}>
                    <ComposedChart data={chartData} margin={{ top: 2, right: 2, left: -28, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} />
                      <XAxis dataKey="name" tick={{ fontSize: 7, fill: isDark ? '#4b5563' : '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 6, fill: isDark ? '#4b5563' : '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e2e8f0'}`, borderRadius: 10, fontSize: 9, color: isDark ? '#f9fafb' : '#0f172a' }} />
                      <ReferenceLine y={5.0} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'DO min', fontSize: 6, fill: '#10b981' }} />
                      <ReferenceLine y={7.5} stroke="#3b82f6" strokeDasharray="3 3" strokeWidth={1} />
                      <Line type="monotone" dataKey="do" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} name="DO (mg/L)" connectNulls={false} />
                      <Line type="monotone" dataKey="ph" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2.5, fill: '#3b82f6' }} name="pH" strokeDasharray="4 2" connectNulls={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-2 px-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 bg-emerald-500 rounded" />
                      <span className={cn('text-[6.5px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>DO mg/L</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 bg-blue-500 rounded" />
                      <span className={cn('text-[6.5px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>pH</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── VIEW FULL REPORT ─── */}
            {latestRecord && (
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/monitor/report/${selectedPond?.id}/${dateStr}`)}
                className="w-full rounded-2xl overflow-hidden border text-left relative"
                style={{ background: 'linear-gradient(135deg,#0f1e3a,#0b1226)', borderColor: 'rgba(59,130,246,0.3)' }}>
                <div className="px-4 py-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={17} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-blue-400 text-[5px] font-black uppercase tracking-[0.3em]">📊 Health Analysis</p>
                    <p className="text-white font-black text-[11px] tracking-tight">{t.viewFullReport}</p>
                    <p className="text-white/35 text-[7px] font-medium">Breakdown · Contribution scores · AI actions</p>
                  </div>
                  <span className="text-blue-400 text-sm font-black flex-shrink-0">→</span>
                </div>
              </motion.button>
            )}

            {/* ─── LOG BUTTON ─── */}
            {selectedPond?.status === 'harvested' ? (
              <div className={cn('w-full rounded-2xl py-3.5 font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 border', isDark ? 'bg-white/5 border-white/10 text-white/25' : 'bg-slate-100 border-slate-200 text-slate-400')}>
                🏁 Pond Harvested — No Logging Required
              </div>
            ) : (
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => selectedPond && navigate(`/ponds/${selectedPond.id}/water-log/${dateStr}`)}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl py-4 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30">
                <Plus size={15} /> Log Water Parameters
              </motion.button>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
