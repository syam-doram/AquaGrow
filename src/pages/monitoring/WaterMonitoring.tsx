import React, { useState, useRef, useEffect } from 'react';
import { NoPondState } from '../../components/NoPondState';
import {
  History, AlertTriangle, TrendingUp, Calendar,
  Bluetooth, Wifi, RefreshCcw, X, ShieldCheck,
  Activity, FlaskConical, Waves, Zap, Wind,
  Thermometer, Droplets, Plus, Camera,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, ComposedChart,
} from 'recharts';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { Header } from '../../components/Header';
import { format, subDays, isSameDay, addDays, startOfToday, startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { iotService, SensorData } from '../../services/iotService';
import { motion } from 'motion/react';
import { calculateDOC } from '../../utils/pondUtils';

// ─── HEALTH SCORING ─────────────────────────────────────────────────────────
const calcHealth = (record: any) => {
  if (!record) return { score: 0, status: 'NO DATA', color: 'text-slate-400', ring: '#94a3b8', badge: 'bg-slate-100 text-slate-500 border-slate-200' };
  let pts = 100;
  if (record.ph < 7.0 || record.ph > 9.0) pts -= 25; else if (record.ph < 7.5 || record.ph > 8.5) pts -= 10;
  if (record.do < 4.0) pts -= 35; else if (record.do < 5.0) pts -= 15;
  if (record.salinity < 5 || record.salinity > 30) pts -= 15; else if (record.salinity < 10 || record.salinity > 20) pts -= 5;
  if (record.ammonia && record.ammonia > 0.1) pts -= 30; else if (record.ammonia && record.ammonia > 0.05) pts -= 15;
  const score = Math.max(0, pts);
  if (score >= 90) return { score, status: 'EXCELLENT', color: 'text-emerald-600', ring: '#10b981', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (score >= 70) return { score, status: 'STABLE',    color: 'text-blue-600',    ring: '#3b82f6', badge: 'bg-blue-50 text-blue-700 border-blue-200'         };
  if (score >= 50) return { score, status: 'WARNING',   color: 'text-amber-600',   ring: '#f59e0b', badge: 'bg-amber-50 text-amber-700 border-amber-200'       };
  return              { score, status: 'CRITICAL',  color: 'text-red-600',     ring: '#ef4444', badge: 'bg-red-50 text-red-700 border-red-200'             };
};

const pondPalette = (score: number) =>
  score >= 90 ? { bar: 'bg-emerald-500', score: 'text-emerald-600', badge: 'bg-emerald-50 border-emerald-100 text-emerald-700', activeBg: '#f0fdf8', activeBorder: '#6ee7b7', glow: 'rgba(16,185,129,0.10)' }
: score >= 70 ? { bar: 'bg-blue-500',    score: 'text-blue-600',    badge: 'bg-blue-50 border-blue-100 text-blue-700',           activeBg: '#eff6ff', activeBorder: '#93c5fd', glow: 'rgba(59,130,246,0.10)'  }
: score >= 50 ? { bar: 'bg-amber-500',   score: 'text-amber-600',   badge: 'bg-amber-50 border-amber-100 text-amber-700',         activeBg: '#fffbeb', activeBorder: '#fcd34d', glow: 'rgba(245,158,11,0.10)' }
: score > 0   ? { bar: 'bg-red-500',     score: 'text-red-600',     badge: 'bg-red-50 border-red-100 text-red-700',               activeBg: '#fef2f2', activeBorder: '#fca5a5', glow: 'rgba(239,68,68,0.10)'  }
:               { bar: 'bg-slate-400',   score: 'text-slate-400',   badge: 'bg-slate-50 border-slate-100 text-slate-500',         activeBg: '#f8fafc', activeBorder: '#e2e8f0', glow: 'rgba(0,0,0,0.04)'      };

export const WaterMonitoring = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, waterRecords, isPro, addWaterRecord } = useData();
  const activePonds = ponds.filter(p => p.status !== 'harvested');
  const [selectedPondId, setSelectedPondId] = useState<string>(activePonds[0]?.id || '');
  const [selectedDate,   setSelectedDate]   = useState<Date>(startOfToday());
  const [isLiveMode,     setIsLiveMode]     = useState(false);
  const [isConnecting,   setIsConnecting]   = useState(false);
  const [connType,       setConnType]       = useState<'BLE' | 'WiFi' | null>(null);
  const [liveData,       setLiveData]       = useState<SensorData | null>(null);

  const selectedPond = ponds.find(p => p.id === selectedPondId);
  const dateStr      = format(selectedDate, 'yyyy-MM-dd');

  const dateRailRef = useRef<HTMLDivElement>(null);
  const pondRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (activePonds.length > 0 && !selectedPondId) setSelectedPondId(activePonds[0].id); }, [ponds]);
  useEffect(() => { setSelectedDate(startOfToday()); }, [selectedPondId]);
  useEffect(() => {
    const t = setTimeout(() => { if (dateRailRef.current) dateRailRef.current.scrollLeft = dateRailRef.current.scrollWidth; }, 150);
    return () => clearTimeout(t);
  }, [selectedPondId, selectedDate]);

  const latestRecord = waterRecords
    .filter(r => r.pondId === selectedPondId && (r.date === dateStr || isSameDay(new Date(r.date), selectedDate)))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const health    = calcHealth(isLiveMode ? liveData : latestRecord);
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d   = subDays(selectedDate, 6 - i);
    const rec = waterRecords.find(r => r.pondId === selectedPondId && (r.date === format(d, 'yyyy-MM-dd') || isSameDay(new Date(r.date), d)));
    return { name: format(d, 'EEE'), do: rec?.do ?? null, ph: rec?.ph ?? null };
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
    } catch { alert(`Could not connect ${type} sensor.`); }
    finally { setIsConnecting(false); setConnType(null); }
  };

  const METRICS = [
    { label: t.phLevel,     val: isLiveMode ? liveData?.ph        : latestRecord?.ph,          unit: '',     target: '7.5–8.5', icon: FlaskConical,  warn: (v: number) => v < 7.5 || v > 8.5 },
    { label: t.dissolvedO2, val: isLiveMode ? liveData?.do        : latestRecord?.do,          unit: 'mg/L', target: '>5.0',    icon: Wind,          warn: (v: number) => v < 5.0            },
    { label: t.salinity,    val: isLiveMode ? liveData?.salinity  : latestRecord?.salinity,    unit: 'ppt',  target: '10–20',   icon: Waves,         warn: (v: number) => v < 10 || v > 20   },
    { label: t.ammonia,     val: isLiveMode ? null                : latestRecord?.ammonia,      unit: 'ppm',  target: '<0.05',   icon: Zap,           warn: (v: number) => v > 0.05           },
    { label: t.alkalinity,  val: latestRecord?.alkalinity,                                      unit: 'mg/L', target: '100–150', icon: Activity,      warn: (v: number) => v < 80             },
    { label: t.turbidity,   val: latestRecord?.turbidity,                                       unit: 'NTU',  target: '20–40',   icon: Droplets,      warn: (v: number) => v > 60             },
    { label: t.temperature, val: isLiveMode ? liveData?.temp      : latestRecord?.temperature, unit: '°C',   target: '26–30',   icon: Thermometer,   warn: (v: number) => v < 26 || v > 30   },
    { label: t.mortality,   val: latestRecord?.mortality,                                       unit: '/day', target: '<10',     icon: AlertTriangle, warn: (v: number) => v > 10             },
  ];
  const auditCount = METRICS.filter(m => m.val !== undefined && m.val !== null).length;

  // ── EMPTY STATE ────────────────────────────────────────────────────────────
  if (activePonds.length === 0) return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Header title={t.monitor} showBack onMenuClick={onMenuClick} />
      <div className="pt-28 flex-1 flex items-center justify-center">
        <NoPondState
          isDark={false}
          subtitle="Add a pond to start monitoring water quality parameters daily."
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper pb-28 font-sans overflow-x-hidden">
      <Header title={t.monitor} showBack onMenuClick={onMenuClick} />

      <div className="pt-[72px] space-y-3 px-4">

        {/* ── 1. POND SELECTOR + DATE FILTER ─────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>

          {/* Active filter pill row */}
          <div className="flex items-center justify-between mb-2.5 px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-ink/40 uppercase tracking-widest">
                {selectedPond?.name || 'Select Pond'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-black text-ink/40 uppercase tracking-widest">
                {isSameDay(selectedDate, startOfToday()) ? 'Today' : format(selectedDate, 'MMM d')}
              </span>
              {!isSameDay(selectedDate, startOfToday()) && (
                <button onClick={() => setSelectedDate(startOfToday())}
                  className="bg-emerald-600 text-white text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                  Today
                </button>
              )}
              {isSameDay(selectedDate, startOfToday()) && (
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                  ✓ Today
                </span>
              )}
            </div>
          </div>

          {/* Pond chips rail */}
          <div ref={pondRailRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            {activePonds.map(p => {
              const pr       = waterRecords.filter(r => r.pondId === p.id && (r.date === dateStr || isSameDay(new Date(r.date), selectedDate))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
              const ph       = calcHealth(pr);
              const pal      = pondPalette(ph.score);
              const isActive = selectedPondId === p.id;
              const doc      = calculateDOC(p.stockingDate, dateStr);
              return (
                <motion.button key={p.id} onClick={() => setSelectedPondId(p.id)} whileTap={{ scale: 0.97 }}
                  data-active={isActive ? 'true' : 'false'}
                  style={isActive ? { background: pal.activeBg, borderColor: pal.activeBorder } : {}}
                  className={cn(
                    'flex-shrink-0 min-w-[110px] pl-3 pr-3 pt-3 pb-2.5 rounded-2xl border-2 text-left relative overflow-hidden transition-all',
                    isActive ? 'shadow-md' : 'bg-card border-card-border'
                  )}>
                  {/* Top colour bar */}
                  <div className={cn('absolute top-0 left-3 right-3 h-[2.5px] rounded-full', pal.bar)} />
                  {isActive && (
                    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at top left, ${pal.glow}, transparent 75%)` }} />
                  )}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <div className={cn('w-1.5 h-1.5 rounded-full', pal.bar, ph.score > 0 ? 'animate-pulse' : '')} />
                      <span className="text-[6px] font-black text-ink/25 uppercase tracking-widest">D{doc}</span>
                    </div>
                    <p className="text-ink font-black text-[10px] tracking-tight truncate mb-1">{p.name}</p>
                    <span className={cn('text-[5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border inline-block', pal.badge)}>
                      {ph.status}
                    </span>
                    <div className="mt-1.5 pt-1.5 border-t border-card-border/40">
                      <span className={cn('text-sm font-black tracking-tight leading-none', pal.score)}>{ph.score}%</span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── 2. CULTURE TIMELINE (compact) ─────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
          className="bg-card border border-card-border rounded-2xl px-3 py-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Calendar size={11} className="text-emerald-500" />
              <p className="text-[7px] font-black text-ink/40 uppercase tracking-widest">Culture Timeline</p>
            </div>
            <p className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">
              {selectedPond ? `Start: ${format(startOfDay(new Date(selectedPond.stockingDate)), 'MMM d')}` : '—'}
            </p>
          </div>
          <div ref={dateRailRef} className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {(() => {
              if (!selectedPond) return null;
              const start     = startOfDay(new Date(selectedPond.stockingDate));
              const today     = startOfToday();
              const totalDays = Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86400000) + 1);
              return Array.from({ length: totalDays }).map((_, i) => {
                const d        = addDays(start, i);
                const isActive = isSameDay(d, selectedDate);
                return (
                  <button key={i} onClick={() => setSelectedDate(d)}
                    className={cn(
                      'flex-shrink-0 w-9 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all border',
                      isActive ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-paper border-card-border text-ink/40'
                    )}>
                    <span className={cn('text-[5px] font-black uppercase', isActive ? 'text-white/60' : 'text-ink/30')}>{format(d, 'EEE')}</span>
                    <span className="text-[10px] font-black leading-none">{format(d, 'd')}</span>
                    <span className={cn('text-[4px] font-black', isActive ? 'text-white/40' : 'text-ink/20')}>D{i + 1}</span>
                  </button>
                );
              });
            })()}
          </div>
        </motion.div>

        {/* ── 3. HEALTH SCORE + IoT (side by side) ─────────────── */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className={cn(
            'rounded-2xl px-4 py-3 border relative overflow-hidden transition-all',
            isLiveMode ? 'bg-[#011a12] border-emerald-500/20' : 'bg-card border-card-border shadow-sm'
          )}>
          {isLiveMode && <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/6 blur-[50px] rounded-full" />}
          <div className="relative z-10 flex items-center gap-4">

            {/* Compact ring */}
            <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
              <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="27" strokeWidth="5" stroke="currentColor" fill="none" className="text-slate-100 opacity-50" />
                <circle cx="32" cy="32" r="27" strokeWidth="5" fill="none"
                  stroke={health.ring} strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 27}`}
                  strokeDashoffset={`${2 * Math.PI * 27 * (1 - health.score / 100)}`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="text-center z-10">
                <p className={cn('text-xs font-black tracking-tight leading-none', isLiveMode ? 'text-white' : 'text-ink')}>{health.score}%</p>
              </div>
            </div>

            {/* Status info */}
            <div className="flex-1 min-w-0">
              <p className={cn('text-[6px] font-black uppercase tracking-widest mb-0.5', isLiveMode ? 'text-emerald-400' : 'text-ink/30')}>
                {isLiveMode ? `● NODE LIVE — ${selectedPond?.name}` : 'Pond Health'}
              </p>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn('text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', health.badge)}>
                  {health.status}
                </span>
                <span className={cn('text-[7px] font-medium', isLiveMode ? 'text-white/40' : 'text-ink/40')}>
                  {auditCount}/8 logged
                </span>
              </div>
              <p className={cn('text-[7px] font-medium leading-snug', isLiveMode ? 'text-white/40' : 'text-ink/40')}>
                {health.score >= 90 ? 'All parameters stable.' : health.score >= 70 ? 'Monitor DO & pH.' : 'Check critical parameters now.'}
              </p>
            </div>

            {/* IoT / disconnect */}
            {isLiveMode ? (
              <button onClick={() => setIsLiveMode(false)}
                className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center flex-shrink-0">
                <X size={14} />
              </button>
            ) : (
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button onClick={() => handleSyncIoT('BLE')} className="w-9 h-9 rounded-xl bg-paper border border-card-border flex flex-col items-center justify-center active:scale-90 transition-all">
                  {isConnecting && connType === 'BLE' ? <RefreshCcw size={14} className="animate-spin text-amber-500" /> : <Bluetooth size={14} className="text-amber-600" />}
                </button>
                <button onClick={() => handleSyncIoT('WiFi')} className="w-9 h-9 rounded-xl bg-paper border border-card-border flex flex-col items-center justify-center active:scale-90 transition-all">
                  {isConnecting && connType === 'WiFi' ? <RefreshCcw size={14} className="animate-spin text-emerald-500" /> : <Wifi size={14} className="text-emerald-500" />}
                </button>
              </div>
            )}
          </div>
          {isConnecting && (
            <div className="mt-2 h-0.5 bg-slate-100 rounded-full overflow-hidden relative z-10">
              <motion.div animate={{ x: ['-100%', '400%'] }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                className="h-full w-1/3 bg-emerald-500 rounded-full" />
            </div>
          )}
        </motion.div>

        {/* ── 4. AI SCANNER CTA (slim single row) ──────────────── */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate('/water-test-scanner')}
            className="w-full rounded-2xl overflow-hidden border border-emerald-900/40 text-left"
            style={{ background: 'linear-gradient(135deg,#022b1e 0%,#011a12 100%)' }}>
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Camera size={17} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-emerald-400 text-[5px] font-black uppercase tracking-[0.3em]">✨ AI Lab Scanner</p>
                <p className="text-white font-black text-[11px] tracking-tight">Water Quality Test Scanner</p>
                <p className="text-white/35 text-[7px] font-medium">Photo → AI reads pH · DO · Ammonia · Colour</p>
              </div>
              <span className="text-emerald-400 text-sm font-black flex-shrink-0">→</span>
            </div>
          </motion.button>
        </motion.div>

        {/* ── 5. PARAMETER GRID ─────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <div className="flex items-center justify-between mb-2 px-1">
            <div>
              <h2 className={cn('font-black text-sm tracking-tight', isLiveMode ? 'text-ink' : 'text-ink')}>
                {isLiveMode ? 'Live Readings' : 'Water Parameters'}
              </h2>
              <p className="text-[7px] font-black text-ink/30 uppercase tracking-widest mt-0.5">
                {format(selectedDate, 'MMM d, yyyy')} · {auditCount}/8 logged
              </p>
            </div>
            <button className="w-8 h-8 rounded-xl bg-card border border-card-border flex items-center justify-center text-ink/30">
              <History size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {METRICS.map((m, i) => {
              const hasVal = m.val !== undefined && m.val !== null;
              const isWarn = hasVal && m.warn(m.val as number);
              const status = !hasVal ? 'none' : isWarn ? 'warn' : 'ok';
              return (
                <motion.div key={m.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={cn(
                    'relative rounded-2xl px-3 pt-3 pb-2.5 border overflow-hidden',
                    status === 'warn' ? 'bg-amber-50 border-amber-100'
                    : status === 'ok' ? 'bg-card border-card-border shadow-sm'
                    : 'bg-slate-50 border-slate-100'
                  )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center',
                      status === 'warn' ? 'bg-amber-100 text-amber-600' :
                      status === 'ok'   ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-300')}>
                      <m.icon size={14} />
                    </div>
                    <span className={cn('text-[5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border',
                      status === 'warn' ? 'bg-amber-100 border-amber-200 text-amber-600' :
                      status === 'ok'   ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                      'bg-slate-100 border-slate-200 text-slate-400')}>
                      {isLiveMode ? 'LIVE' : status === 'ok' ? 'OK' : status === 'warn' ? 'WARN' : 'N/A'}
                    </span>
                  </div>
                  <p className="text-[6px] font-black text-ink/35 uppercase tracking-widest leading-none mb-1">{m.label}</p>
                  <div className="flex items-baseline gap-0.5">
                    <span className={cn('text-lg font-black tracking-tight leading-none',
                      status === 'warn' ? 'text-amber-600' : status === 'ok' ? 'text-ink' : 'text-ink/20')}>
                      {hasVal ? (typeof m.val === 'number' ? m.val.toFixed(1) : m.val) : '—'}
                    </span>
                    {m.unit && <span className="text-[7px] font-black text-ink/25 uppercase">{m.unit}</span>}
                  </div>
                  <p className="text-[5px] font-black text-ink/20 uppercase tracking-widest mt-0.5">
                    {m.target}
                  </p>
                  <div className="absolute -right-2 -bottom-2 opacity-[0.035]"><m.icon size={44} /></div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── 6. 7-DAY CHART (only if data) ─────────────────────── */}
        {chartData.some(d => d.do !== null) && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="bg-card border border-card-border rounded-2xl px-4 pt-3 pb-2 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[7px] font-black text-ink/30 uppercase tracking-widest">7-Day Trend</p>
                <h3 className="text-ink font-black text-xs tracking-tight">DO & pH History</h3>
              </div>
              <TrendingUp size={15} className="text-emerald-500" />
            </div>
            <ResponsiveContainer width="100%" height={90}>
              <ComposedChart data={chartData} margin={{ top: 2, right: 2, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 6, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 9 }} />
                <Line type="monotone" dataKey="do" stroke="#10b981" strokeWidth={2} dot={false} name="DO (mg/L)" connectNulls={false} />
                <Line type="monotone" dataKey="ph" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="pH" strokeDasharray="4 2" connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex gap-3 mt-1">
              <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-emerald-500 rounded" /><span className="text-[6px] font-black text-ink/35 uppercase">DO</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-blue-500 rounded" /><span className="text-[6px] font-black text-ink/35 uppercase">pH</span></div>
            </div>
          </motion.div>
        )}

        {/* ── 7. LOG BUTTON ─────────────────────────────────────── */}
        {selectedPond?.status === 'harvested' ? (
          <div className="w-full rounded-2xl py-3.5 font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 bg-slate-100 border border-slate-200 text-slate-400">
            🏁 Pond Harvested — No Logging Required
          </div>
        ) : (
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => selectedPond && navigate(`/ponds/${selectedPond.id}/water-log/${dateStr}`)}
            className="w-full bg-emerald-600 text-white rounded-2xl py-3.5 font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
            <Plus size={14} /> Log Today's Water Parameters
          </motion.button>
        )}


      </div>
    </div>
  );
};
