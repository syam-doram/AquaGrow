import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  Calculator,
  Plus,
  Edit2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Waves,
  CheckCircle2,
  Bell,
  Thermometer,
  Wind,
  Droplets,
  ArrowRight,
  Zap,
  RefreshCw,
  ShieldCheck,
  Info,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { Translations } from '../translations';
import { calculateDOC } from '../utils/pondUtils';
import { getLunarStatus } from '../utils/lunarUtils';
import { cn } from '../utils/cn';

// ─── WEATHER SIMULATION ───────────────────────────────────────────────────────
const getSimulatedWeather = () => {
  const hour = new Date().getHours();
  const month = new Date().getMonth() + 1;
  const baseTemp = month >= 3 && month <= 5 ? 34 : month >= 6 && month <= 9 ? 30 : 27;
  const temp = baseTemp - (hour < 6 || hour > 18 ? 5 : 0);
  const humidity = month >= 6 && month <= 9 ? 88 : 70;
  const isRaining = month >= 6 && month <= 9 && Math.random() > 0.7;
  const windSpeed = isRaining ? 22 : 12;
  const doLevel = temp > 32 ? 'LOW' : isRaining ? 'MEDIUM' : 'HIGH';
  return { temp, humidity, windSpeed, isRaining, doLevel };
};

// ─── EXACT FARMER SOP LOGIC FROM USER PROMPT ──────────────────────────────────
const getSopData = (doc: number) => {
  // Survival Curve: 100% decaying to ~80%
  // Example expects 80% survival near harvest. We'll interpolate gently.
  const survivalPct = Math.max(0.80, 1 - (doc * 0.002));

  let avgWeightG = 0;
  let feedRatePct = 0;
  let staticKg = 0; // for DOC 1-3
  let slotCount = 4; // Default to 4
  
  // 🟢 DOC 1–10 (Starter Stage)
  if (doc <= 3) { avgWeightG = 0.005; feedRatePct = 0; staticKg = 1.5; slotCount = 4; }
  else if (doc <= 7) { avgWeightG = 0.01; feedRatePct = 100; slotCount = 4; } // 100% biomass
  else if (doc <= 10) { avgWeightG = 0.02; feedRatePct = 80; slotCount = 4; } // 80%

  // 🟡 DOC 11–20
  else if (doc <= 15) { avgWeightG = 0.05; feedRatePct = 50; slotCount = 4; }
  else if (doc <= 20) { avgWeightG = 0.1; feedRatePct = 30; slotCount = 4; }

  // 🟠 DOC 21–30
  else if (doc <= 25) { avgWeightG = 0.3; feedRatePct = 15; slotCount = 4; }
  else if (doc <= 30) { avgWeightG = 0.8; feedRatePct = 10; slotCount = 4; }

  // 🔴 DOC 31–45 (Feed 3-4 times, let's use 4)
  else if (doc <= 35) { avgWeightG = 2.0; feedRatePct = 5.0; slotCount = 4; }
  else if (doc <= 40) { avgWeightG = 4.0; feedRatePct = 4.0; slotCount = 4; }
  else if (doc <= 45) { avgWeightG = 6.0; feedRatePct = 3.0; slotCount = 4; }

  // 🔵 DOC 46–60 (Feed 4 times)
  else if (doc <= 50) { avgWeightG = 8.0; feedRatePct = 2.5; slotCount = 4; }
  else if (doc <= 55) { avgWeightG = 10.0; feedRatePct = 2.0; slotCount = 4; }
  else if (doc <= 60) { avgWeightG = 12.0; feedRatePct = 1.8; slotCount = 4; }

  // 🟣 DOC 61–80 (3-4 times, let's use 4)
  else if (doc <= 70) { avgWeightG = 15.0; feedRatePct = 1.5; slotCount = 4; }
  else if (doc <= 80) { avgWeightG = 18.0; feedRatePct = 1.3; slotCount = 4; }

  // ⚫ DOC 81–100 (Final Stage)
  else if (doc <= 90) { avgWeightG = 22.0; feedRatePct = 1.2; slotCount = 3; }
  else { avgWeightG = 28.0; feedRatePct = 1.0; slotCount = 3; }

  return { survivalPct, avgWeightG, feedRatePct, staticKg, slotCount };
};

const buildFeedSlots = (count: number) => {
  if (count === 5) return [
    { time: '06:00 AM', hour: 6, label: 'Morning 1' },
    { time: '09:30 AM', hour: 9, label: 'Morning 2' },
    { time: '01:00 PM', hour: 13, label: 'Afternoon' },
    { time: '04:30 PM', hour: 16, label: 'Evening 1' },
    { time: '08:00 PM', hour: 20, label: 'Evening 2' }
  ];
  if (count === 4) return [
    { time: '06:00 AM', hour: 6, label: 'Morning 1' },
    { time: '10:00 AM', hour: 10, label: 'Morning 2' },
    { time: '02:00 PM', hour: 14, label: 'Afternoon' },
    { time: '06:00 PM', hour: 18, label: 'Evening' }
  ];
  return [ // 3 slots
    { time: '06:30 AM', hour: 6, label: 'Morning' },
    { time: '12:30 PM', hour: 12, label: 'Mid-day' },
    { time: '05:30 PM', hour: 17, label: 'Evening' }
  ];
};

// ─── WEATHER × LUNAR ADJUSTMENTS ─────────────────────────────────────────────
interface Adjustment { factor: number; label: string; reason: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; color: string; icon: React.ElementType; }
const getAdjustments = (weather: ReturnType<typeof getSimulatedWeather>, lunarPhase: 'AMAVASYA' | 'ASHTAMI_NAVAMI' | 'NORMAL'): Adjustment[] => {
  const adj: Adjustment[] = [];
  if (weather.temp >= 34) adj.push({ factor: 0.80, label: 'Heat Stress -20%', reason: `Temp ${weather.temp}°C: shrimp reduce appetite. Uneaten feed rots and drops DO.`, severity: 'HIGH', color: 'text-red-500', icon: Thermometer });
  else if (weather.temp >= 32) adj.push({ factor: 0.90, label: 'Warm Day -10%', reason: `Temp ${weather.temp}°C: slight appetite suppression.`, severity: 'MEDIUM', color: 'text-amber-500', icon: Thermometer });
  if (weather.isRaining) adj.push({ factor: 0.85, label: 'Rain Event -15%', reason: 'Rain lowers DO and salinity. Withhold feed until water stabilises.', severity: 'HIGH', color: 'text-blue-500', icon: Droplets });
  if (weather.windSpeed > 20) adj.push({ factor: 0.95, label: 'High Wind -5%', reason: `Turbulence causes shrimp stress.`, severity: 'LOW', color: 'text-slate-500', icon: Wind });
  if (lunarPhase === 'AMAVASYA') adj.push({ factor: 0.75, label: '🌑 Amavasya -25%', reason: 'Mass molting night. Shrimp stop feeding during molt.', severity: 'HIGH', color: 'text-indigo-500', icon: Zap });
  else if (lunarPhase === 'ASHTAMI_NAVAMI') adj.push({ factor: 0.88, label: '🌓 Quarter Moon -12%', reason: 'Partial molting phase. Reduce feed slightly.', severity: 'MEDIUM', color: 'text-violet-500', icon: Zap });
  if (weather.doLevel === 'LOW') adj.push({ factor: 0.70, label: 'Low DO -30%', reason: 'Dissolved oxygen is low. Feed decomposition further drops DO.', severity: 'HIGH', color: 'text-red-600', icon: Waves });
  return adj;
};
const getCombinedFactor = (adjustments: Adjustment[]): number => Math.max(0.50, adjustments.reduce((acc, a) => acc * a.factor, 1.0));

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export const FeedManagement = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, feedLogs } = useData();
  const [selectedPondId, setSelectedPondId] = useState(ponds[0]?.id || '');
  const [completedAlerts, setCompletedAlerts] = useState<string[]>(() => {
    const saved = localStorage.getItem('completed_feed_alerts');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState<'schedule' | 'fcr'>('schedule');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedPond = ponds.find(p => p.id === selectedPondId);
  const currentDoc = selectedPond ? calculateDOC(selectedPond.stockingDate) : 0;
  
  // Real-time SOP Logic
  const sop = useMemo(() => getSopData(currentDoc), [currentDoc]);
  const feedSlots = useMemo(() => buildFeedSlots(sop.slotCount), [sop.slotCount]);
  
  const nextFeedSlot = useMemo(() => {
    const h = now.getHours();
    return feedSlots.find(s => s.hour > h) || feedSlots[0];
  }, [now, feedSlots]);

  const secsToNextFeed = useMemo(() => {
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const targetSecs = nextFeedSlot.hour * 3600;
    const currentSecs = h * 3600 + m * 60 + s;
    return targetSecs > currentSecs ? targetSecs - currentSecs : (24 * 3600) - currentSecs + targetSecs;
  }, [now, nextFeedSlot]);

  const countdownH = Math.floor(secsToNextFeed / 3600);
  const countdownM = Math.floor((secsToNextFeed % 3600) / 60);

  const seedCount = selectedPond?.seedCount || 200000;
  const stockingDateStr = selectedPond?.stockingDate || '2025-01-20';
  // Standard initial PL stock age is usually PL-15
  const estimatedPlAge = 15 + currentDoc;
  
  // Total surviving shrimp
  const survivingShrimpCount = Math.floor(seedCount * sop.survivalPct);
  // Biomass (kg)
  const biomassKg = Math.round((survivingShrimpCount * sop.avgWeightG) / 1000);
  
  // Daily Feed Kg
  const rawDailyKg = sop.staticKg > 0 ? sop.staticKg : (biomassKg * sop.feedRatePct) / 100;

  // Environment Adjustments
  const lunar = getLunarStatus(now);
  const weather = useMemo(() => getSimulatedWeather(), [now.getHours()]);
  const adjustments = useMemo(() => getAdjustments(weather, lunar.phase), [weather, lunar.phase]);
  const combinedFactor = getCombinedFactor(adjustments);
  const adjustedDailyKg = Math.round(rawDailyKg * combinedFactor * 10) / 10;
  
  const kgPerSlot = Math.round((adjustedDailyKg / sop.slotCount) * 10) / 10;

  // Alerts for checking trays
  const requiresTrayCheck = currentDoc > 10;

  return (
    <div className="pb-40 bg-[#F8F9FE] min-h-screen text-left">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-white/95 backdrop-blur-md px-4 py-5 flex items-center justify-between border-b border-black/5 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-3 text-[#4A2C2A] hover:bg-black/5 rounded-2xl transition-all">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-black text-[#4A2C2A] tracking-[0.1em] uppercase">{t.feedManagement}</h1>
          {selectedPond && (
            <p className="text-[9px] font-black text-[#C78200] uppercase tracking-widest">{selectedPond.name} • DOC {currentDoc}</p>
          )}
        </div>
        <div className="w-10"></div>
      </header>

      <div className="pt-28 px-5 space-y-5">
        {/* Pond Selector */}
        {ponds.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {ponds.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPondId(p.id)}
                className={cn(
                  'px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex-shrink-0',
                  selectedPondId === p.id ? 'bg-[#0D523C] text-white border-[#0D523C] shadow-lg' : 'bg-white text-[#4A2C2A]/40 border-black/5'
                )}
              >{p.name}</button>
            ))}
          </div>
        )}

        {/* ── EMPTY STATE VERIFICATION ── */}
        {!selectedPond ? (
           <div className="bg-white rounded-[2.5rem] p-8 text-center border border-black/5 shadow-sm mt-8">
             <div className="w-20 h-20 bg-[#F8F9FE] rounded-[2rem] flex items-center justify-center mx-auto mb-5 border border-black/5">
                <Waves size={32} className="text-[#0D523C]/30" />
             </div>
             <h2 className="text-xl font-black text-[#4A2C2A] tracking-tighter mb-2">No Active Ponds</h2>
             <p className="text-xs font-black text-[#4A2C2A]/40 tracking-tight leading-relaxed mb-6">You must establish a pond first to generate a scientific data-driven feed schedule.</p>
             <button onClick={() => navigate('/ponds')} className="bg-[#0D523C] text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#0D523C]/20 hover:scale-105 transition-transform">
               Create Pond
             </button>
           </div>
        ) : (
          <>
            {/* ── LIVE CONDITIONS STRIP ── */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Thermometer, label: 'Temp', value: `${weather.temp}°C`, color: weather.temp >= 34 ? 'text-red-500' : 'text-amber-500' },
                { icon: Droplets, label: 'Humidity', value: `${weather.humidity}%`, color: 'text-blue-500' },
                { icon: Wind, label: 'Wind', value: `${weather.windSpeed}km/h`, color: 'text-slate-500' },
                { icon: Waves, label: 'DO', value: weather.doLevel, color: weather.doLevel === 'LOW' ? 'text-red-500' : weather.doLevel === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-3 text-center border border-black/5 shadow-sm">
                  <item.icon size={14} className={cn('mx-auto mb-1', item.color)} />
                  <p className="text-[8px] font-black text-[#4A2C2A]/30 uppercase tracking-widest">{item.label}</p>
                  <p className={cn('text-[10px] font-black mt-0.5', item.color)}>{item.value}</p>
                </div>
              ))}
            </div>

        {/* ── NEXT FEED COUNTDOWN ── */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-black/5 overflow-hidden relative">
          <div className="flex justify-between items-center mb-5">
            <div>
              <p className="text-[9px] font-black text-[#C78200] uppercase tracking-widest bg-[#C78200]/10 px-3 py-1 rounded-xl w-max mb-1">Schedule Sync</p>
              <p className="text-[#4A2C2A] font-black text-2xl tracking-tighter">Next Feed</p>
            </div>
            <div className="flex gap-2">
              <div className="bg-[#F8F9FE] px-4 py-2 rounded-2xl text-center border border-black/5">
                <p className="text-2xl font-black tracking-tighter text-[#0D523C]">{countdownH.toString().padStart(2, '0')}</p>
                <p className="text-[7px] font-black text-black/30 uppercase tracking-widest">Hrs</p>
              </div>
              <div className="bg-[#F8F9FE] px-4 py-2 rounded-2xl text-center border border-black/5">
                <p className="text-2xl font-black tracking-tighter text-[#0D523C]">{countdownM.toString().padStart(2, '0')}</p>
                <p className="text-[7px] font-black text-black/30 uppercase tracking-widest">Min</p>
              </div>
            </div>
          </div>
          <p className="text-center font-black text-sm text-[#4A2C2A]">{nextFeedSlot.label} ({nextFeedSlot.time}) — <span className="text-[#C78200]">{kgPerSlot} kg dose</span></p>
        </div>

        {/* ── SMART ADJUSTMENT BANNER ── */}
        {adjustments.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] p-5 border overflow-hidden bg-red-50 border-red-200">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={20} className="text-red-500" />
              <div>
                <p className="font-black text-red-900 text-sm tracking-tight">Weather / Lunar Adjustments Active</p>
                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">{Math.round((1 - combinedFactor) * 100)}% Feed Reduction Applied</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TAB SWITCH ── */}
        <div className="flex bg-white rounded-2xl p-1 border border-black/5 shadow-sm">
          {(['schedule', 'fcr'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                activeTab === tab ? 'bg-[#0D523C] text-white shadow-md' : 'text-[#4A2C2A]/40'
              )}
            >
              {tab === 'schedule' ? 'DOC Feed Plan' : 'Metrics & FCR'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── SCHEDULE TAB (CORE SOP) ── */}
          {activeTab === 'schedule' && (
            <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              
              {/* Exact Stocking Metrics Breakdown */}
              <div className="bg-white p-5 rounded-[2rem] border border-black/5 shadow-sm space-y-4">
                 <p className="text-[#0D523C] text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5"><Info size={12}/> Pond Stocking Profile</p>
                 <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#F8F9FE] p-3 rounded-2xl border border-black/5">
                       <p className="text-[#4A2C2A]/40 text-[7px] font-black uppercase tracking-widest mb-1">Stocking Date</p>
                       <p className="font-black text-xs text-[#4A2C2A]">{stockingDateStr}</p>
                    </div>
                    <div className="bg-[#F8F9FE] p-3 rounded-2xl border border-black/5">
                       <p className="text-[#4A2C2A]/40 text-[7px] font-black uppercase tracking-widest mb-1">Seed Count</p>
                       <p className="font-black text-xs text-[#0D523C]">{(seedCount/100000).toFixed(1)} Lakh</p>
                    </div>
                    <div className="bg-[#F8F9FE] p-3 rounded-2xl border border-black/5">
                       <p className="text-[#4A2C2A]/40 text-[7px] font-black uppercase tracking-widest mb-1">PL Age / DOC</p>
                       <p className="font-black text-xs text-[#C78200]">PL-{estimatedPlAge} / {currentDoc}d</p>
                    </div>
                 </div>
              </div>

              {/* Intelligent Biomass & Formula Calculation View */}
              <div className="bg-gradient-to-br from-[#051F19] to-[#0D523C] p-6 rounded-[2.5rem] shadow-xl text-white space-y-5">
                 <div className="flex justify-between items-start border-b border-white/10 pb-4">
                    <div>
                       <p className="text-emerald-400/80 text-[8px] font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-1"><Scale size={10}/> Estimated Biomass</p>
                       <p className="text-3xl font-black tracking-tighter">{biomassKg.toLocaleString()} <span className="text-lg text-emerald-400">kg</span></p>
                    </div>
                    <div className="text-right">
                       <p className="text-white/40 text-[7px] font-black uppercase tracking-widest mb-1">Est. Surviving Count</p>
                       <p className="font-black text-sm text-emerald-400">{(survivingShrimpCount/1000).toFixed(1)}K <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">({(sop.survivalPct*100).toFixed(0)}% S.R.)</span></p>
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Application Formula</p>
                    <div className="flex items-center gap-3">
                       <div className="bg-[#02130F] p-3 rounded-2xl border border-white/5 flex-1 text-center">
                          <p className="text-white font-black text-lg">{biomassKg}</p>
                          <p className="text-white/40 text-[7px] font-black uppercase tracking-widest">Base (kg)</p>
                       </div>
                       <span className="text-white/20 font-black">×</span>
                       <div className="bg-[#02130F] p-3 rounded-2xl border border-white/5 flex-1 text-center relative overflow-hidden">
                          {sop.feedRatePct === 0 ? (
                             <p className="text-[#C78200] font-black text-lg text-center w-full">Fixed</p>
                          ) : (
                             <p className="text-emerald-400 font-black text-lg">{sop.feedRatePct}%</p>
                          )}
                          <p className="text-white/40 text-[7px] font-black uppercase tracking-widest">Rate</p>
                       </div>
                       <span className="text-white/20 font-black">=</span>
                       <div className="bg-[#C78200] p-3 rounded-2xl flex-1 text-center shadow-lg shadow-[#C78200]/20">
                          <p className="text-white font-black text-lg">{rawDailyKg}</p>
                          <p className="text-white/60 text-[7px] font-black uppercase tracking-widest">Gross Kg</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Feed Rules */}
              <div className="bg-white p-5 rounded-[2rem] border border-black/5 shadow-sm space-y-4">
                 <p className="text-[#C78200] text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5"><ShieldCheck size={12}/> Daily Execution Rules</p>
                 <ul className="text-[10px] font-black uppercase tracking-widest text-[#4A2C2A]/60 space-y-2">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Apply <span className="text-[#4A2C2A]">{sop.slotCount} meals</span> per day</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#C78200]" /> {requiresTrayCheck ? 'Monitor feed trays 1h post-feed' : 'Blind feeding currently active (Starter)'}</li>
                    <li className="flex items-center gap-2 line-clamp-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400" /> Adjust next slot if tray &gt;20% full</li>
                 </ul>
              </div>

              {/* Today's Feed Plan (Slots) */}
              <div className="space-y-3 pt-3">
                 <div className="flex items-center justify-between px-1 mb-2">
                   <h2 className="text-[#4A2C2A] font-black text-xl tracking-tighter">Today's Sequence</h2>
                   <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest">
                     Net: {adjustedDailyKg} kg / day
                   </div>
                 </div>

                 {feedSlots.map((slot, i) => {
                   const h = now.getHours();
                   const isPast = h > slot.hour;
                   const isNow = h === slot.hour;
                   return (
                     <div key={i} className={cn(
                       "bg-white rounded-[2rem] px-5 py-4 border shadow-sm flex items-center gap-4 transition-all",
                       isNow ? "border-[#C78200] ring-2 ring-[#C78200]/10" : "border-black/5 opacity-80"
                     )}>
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-inner", isNow ? 'bg-[#C78200]' : isPast ? 'bg-emerald-500' : 'bg-slate-200 text-slate-400')}>
                           {isPast ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                        </div>
                        <div className="flex-1">
                           <p className={cn("font-black text-base tracking-tight leading-none", isNow ? "text-[#C78200]" : "text-[#4A2C2A]")}>{slot.label}</p>
                           <p className="text-[9px] font-black text-[#4A2C2A]/40 uppercase tracking-widest mt-1">{slot.time}</p>
                        </div>
                        <div className="text-right">
                           <p className="font-black text-[#0D523C] text-lg tracking-tight">{kgPerSlot}<span className="text-[10px] text-[#0D523C]/50 ml-0.5">kg</span></p>
                        </div>
                     </div>
                   );
                 })}
              </div>
            </motion.div>
          )}

          {/* ── METRICS TAB ── */}
          {activeTab === 'fcr' && (
            <motion.div key="fcr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-[2.5rem] p-10 text-center border border-dashed border-[#C78200]/30 shadow-sm">
                <div className="w-16 h-16 bg-[#C78200]/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                  <TrendingUp size={32} className="text-[#C78200]" />
                </div>
                <h3 className="text-[#4A2C2A] font-black text-lg tracking-tighter mb-2">Metrics Central</h3>
                <p className="text-[#4A2C2A]/40 text-xs leading-relaxed mb-6">Real-time FCR and total consumption analytics are locked depending on hardware integrations.</p>
            </motion.div>
          )}

        </AnimatePresence>
        </>
        )}
      </div>
    </div>
  );
};
