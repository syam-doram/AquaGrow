import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { NoPondState } from '../../components/NoPondState';
import {
  Clock,
  Waves,
  CheckCircle2,
  Thermometer,
  Droplets,
  Zap,
  Scale,
  ChevronLeft,
  Activity,
  Package,
  Eye,
  Info,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Fish,
  Moon,
  ChevronRight,
  Leaf,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import type { Translations } from '../../translations';
import { calculateDOC } from '../../utils/pondUtils';
import { getLunarStatus, MoonPhase } from '../../utils/lunarUtils';
import { cn } from '../../utils/cn';

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

// ─── EXACT FARMER SOP LOGIC ──────────────────────────────────────────────────
const getSopData = (doc: number) => {
  const survivalPct = Math.max(0.80, 1 - (doc * 0.002));
  let avgWeightG = 0;
  let feedRatePct = 0;
  let staticKg = 0;
  let slotCount = 4;
  
  if (doc <= 3) { avgWeightG = 0.005; feedRatePct = 0; staticKg = 1.5; slotCount = 4; }
  else if (doc <= 7) { avgWeightG = 0.01; feedRatePct = 100; slotCount = 4; }
  else if (doc <= 10) { avgWeightG = 0.02; feedRatePct = 80; slotCount = 4; }
  else if (doc <= 15) { avgWeightG = 0.05; feedRatePct = 50; slotCount = 4; }
  else if (doc <= 20) { avgWeightG = 0.1; feedRatePct = 30; slotCount = 4; }
  else if (doc <= 25) { avgWeightG = 0.3; feedRatePct = 15; slotCount = 4; }
  else if (doc <= 30) { avgWeightG = 0.8; feedRatePct = 10; slotCount = 4; }
  else if (doc <= 35) { avgWeightG = 2.0; feedRatePct = 5.0; slotCount = 4; }
  else if (doc <= 40) { avgWeightG = 4.0; feedRatePct = 4.0; slotCount = 4; }
  else if (doc <= 45) { avgWeightG = 6.0; feedRatePct = 3.0; slotCount = 4; }
  else if (doc <= 50) { avgWeightG = 8.0; feedRatePct = 2.5; slotCount = 4; }
  else if (doc <= 55) { avgWeightG = 10.0; feedRatePct = 2.0; slotCount = 4; }
  else if (doc <= 60) { avgWeightG = 12.0; feedRatePct = 1.8; slotCount = 4; }
  else if (doc <= 70) { avgWeightG = 15.0; feedRatePct = 1.5; slotCount = 4; }
  else if (doc <= 80) { avgWeightG = 18.0; feedRatePct = 1.3; slotCount = 4; }
  else if (doc <= 90) { avgWeightG = 22.0; feedRatePct = 1.2; slotCount = 3; }
  else { avgWeightG = 28.0; feedRatePct = 1.0; slotCount = 3; }

  return { survivalPct, avgWeightG, feedRatePct, staticKg, slotCount };
};

const getFeedType = (doc: number): { type: string, no: string, size: string, protein: string } => {
  if (doc <= 15) return { type: 'Starter (Blind Feed)', no: 'Crumble No. 1', size: '0.4 - 0.8 mm', protein: '40%' };
  if (doc <= 30) return { type: 'Starter 2', no: 'Pellet No. 2', size: '1.0 - 1.2 mm', protein: '38%' };
  if (doc <= 60) return { type: 'Grower', no: 'Pellet No. 3', size: '1.5 - 1.8 mm', protein: '36%' };
  return { type: 'Finisher', no: 'Pellet No. 4', size: '2.0 - 2.5 mm', protein: '35%' };
}

const getTrayCheckTime = (doc: number) => {
  if (doc > 60) return "+1 Hrs";
  if (doc >= 30) return "+1:30 Hrs";
  return "+2 Hrs";
};

const buildFeedSlots = (count: number, t: Translations) => {
  if (count === 5) return [
    { time: '06:00 AM', hour: 6, label: t.morning1 },
    { time: '10:00 AM', hour: 10, label: t.morning2 },
    { time: '02:00 PM', hour: 14, label: t.afternoon },
    { time: '05:00 PM', hour: 17, label: t.evening1 },
    { time: '08:30 PM', hour: 20, label: t.evening2 }
  ];
  if (count === 4) return [
    { time: '06:00 AM', hour: 6, label: t.morning1 },
    { time: '10:00 AM', hour: 10, label: t.morning2 },
    { time: '02:00 PM', hour: 14, label: t.afternoon },
    { time: '05:00 PM', hour: 17, label: t.evening1 }
  ];
  return [
    { time: '07:00 AM', hour: 7, label: t.morning1 },
    { time: '01:00 PM', hour: 13, label: t.afternoon },
    { time: '05:00 PM', hour: 17, label: t.evening1 }
  ];
};

interface Adjustment { factor: number; label: string; reason: string; color: string; bg: string; icon: React.ElementType; }
const getAdjustments = (weather: ReturnType<typeof getSimulatedWeather>, lunarPhase: MoonPhase, t: Translations): Adjustment[] => {
  const adj: Adjustment[] = [];
  if (weather.temp >= 34) adj.push({ factor: 0.80, label: `${t.heatStress} -20%`, reason: `Temp ${weather.temp}°C limits digestion`, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: Thermometer });
  if (weather.isRaining) adj.push({ factor: 0.85, label: `${t.rainEvent} -15%`, reason: 'Rain lowers dissolved oxygen', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: Droplets });
  
  if (lunarPhase === 'AMAVASYA') adj.push({ factor: 0.75, label: `🌑 Amavasya -25%`, reason: 'High mass molting energy demand', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', icon: Zap });
  else if (lunarPhase === 'POURNAMI') adj.push({ factor: 1.0, label: `🌕 Pournami +0%`, reason: 'High biological activity', color: 'text-indigo-300', bg: 'bg-indigo-400/10 border-indigo-400/20', icon: Zap });
  else if (lunarPhase === 'ASHTAMI') adj.push({ factor: 0.90, label: `🌓 Ashtami -10%`, reason: 'Molting initiation risk', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', icon: Zap });
  else if (lunarPhase === 'NAVAMI') adj.push({ factor: 0.85, label: `🌙 Navami -15%`, reason: 'Molting peak risk', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', icon: Zap });

  if (weather.doLevel === 'LOW') adj.push({ factor: 0.70, label: `${t.lowDOAdjustment} -30%`, reason: 'Extremely poor oxygen levels', color: 'text-red-500', bg: 'bg-red-600/10 border-red-600/20', icon: Waves });
  return adj;
};

export const FeedManagement = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, feedLogs, addFeedLog, theme } = useData();
  const [selectedPondId, setSelectedPondId] = useState(ponds[0]?.id || '');
  const [syncedSlots, setSyncedSlots] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'schedule' | 'fcr' | 'sow'>('schedule'); // Added SOW Details tab
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [now, setNow] = useState(new Date());
  const [weather] = useState(getSimulatedWeather());

  const isDark = theme === 'dark' || theme === 'midnight';

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedPond = ponds.find(p => p.id === selectedPondId);
  const currentDoc = selectedPond ? calculateDOC(selectedPond.stockingDate) : 0;
  

  // ── toggleSlot is defined further below after computed values ──
  // (biomassKg, totalFeedConsumed, combinedFactor need to be in scope)

  const sop = useMemo(() => getSopData(currentDoc), [currentDoc]);
  const feedProfile = useMemo(() => getFeedType(currentDoc), [currentDoc]);
  const feedSlots = useMemo(() => buildFeedSlots(sop.slotCount, t), [sop.slotCount, t]);
  const lunar = useMemo(() => getLunarStatus(new Date()), []);
  const adjustments = useMemo(() => getAdjustments(weather, lunar.phase, t), [weather, lunar.phase, t]);
  const combinedFactor = useMemo(() => Math.max(0.5, adjustments.reduce((acc, a) => acc * a.factor, 1.0)), [adjustments]);

  const seedCount = selectedPond?.seedCount || 100000;
  const survivalRate = sop.survivalPct * 100;
  const currentPopulation = Math.round(seedCount * sop.survivalPct);
  const biomassKg = Math.round((currentPopulation * sop.avgWeightG) / 1000);
  
  const rawDailyKg = sop.feedRatePct === 0 ? sop.staticKg : Math.round((biomassKg * sop.feedRatePct) / 100);
  const adjustedDailyKg = Math.round(rawDailyKg * combinedFactor);
  const kgPerSlot = (adjustedDailyKg / (sop.slotCount || 1)).toFixed(1);

  // Next feed timer logic
  const nextFeedSlot = feedSlots.find(s => s.hour > now.getHours()) || feedSlots[0];
  const targetTime = new Date();
  targetTime.setHours(nextFeedSlot.hour, nextFeedSlot.hour === 6 ? 0 : 30, 0);
  if (nextFeedSlot.hour <= now.getHours()) targetTime.setDate(targetTime.getDate() + 1);
  const diffMs = targetTime.getTime() - now.getTime();
  const countdownH = Math.floor(diffMs / (1000 * 60 * 60));
  const countdownM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  // ── FCR gauge & compliance for current pond
  const pondFeedLogs = feedLogs.filter(l => l.pondId === selectedPondId);
  const totalFeedConsumed = pondFeedLogs.reduce((a, l) => a + l.quantity, 0);
  const fcrValue = biomassKg > 0 ? totalFeedConsumed / biomassKg : 0;
  const fcrHealthy = fcrValue < 1.4;
  const fcrWarning = fcrValue >= 1.4 && fcrValue < 1.7;
  const fcrCritical = fcrValue >= 1.7;
  const todayFedKg = pondFeedLogs
    .filter(l => new Date(l.date).toDateString() === now.toDateString())
    .reduce((a, l) => a + l.quantity, 0);
  const todayCompliance = adjustedDailyKg > 0 ? Math.min(100, Math.round((todayFedKg / adjustedDailyKg) * 100)) : 0;
  const slotsCompleted = syncedSlots.length;
  const isCriticalStage = currentDoc >= 31 && currentDoc <= 45;

  // ── Daily Sequence slot log handler (needs biomassKg, totalFeedConsumed, combinedFactor) ─────
  const toggleSlot = async (slotTime: string, kg: string, slotLabel: string) => {
    if (syncedSlots.includes(slotTime) || !selectedPond) return;
    const feedKg = Number(kg);
    const feedPricePerKg = currentDoc <= 15 ? 90 : currentDoc <= 30 ? 75 : currentDoc <= 60 ? 68 : 62;
    const slotCost = Math.round(feedKg * feedPricePerKg);
    const profile = getFeedType(currentDoc);
    const runningFCR = biomassKg > 0 ? (totalFeedConsumed + feedKg) / biomassKg : 0;

    if (addFeedLog) {
      await addFeedLog({
        pondId:           selectedPond.id,
        date:             new Date().toISOString(),
        time:             slotTime,
        slotLabel:        slotLabel,
        brand:            profile.type,
        feedType:         profile.type,
        feedNo:           profile.no,
        quantity:         feedKg,
        cost:             slotCost,
        doc:              currentDoc,
        fcr:              parseFloat(runningFCR.toFixed(3)),
        adjustmentFactor: parseFloat(combinedFactor.toFixed(3)),
        notes:            `Daily Sequence: ${slotLabel} (${slotTime}) — ${feedKg}kg ${profile.no} @ ₹${feedPricePerKg}/kg = ₹${slotCost}. DOC ${currentDoc}. Adj: ${combinedFactor.toFixed(2)}.`,
      } as any);
    }
    setSyncedSlots(prev => [...prev, slotTime]);
  };



  return (
    <div className="pb-32 min-h-[100dvh] text-left px-0 font-sans relative overflow-hidden transition-colors duration-500" style={{ background: isDark ? '#030E1B' : '#F8FAFC' }}>
      
      {/* ── Ambient BG ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden fixed">
        <div className={cn("absolute top-[-10%] right-[-5%] w-[70%] h-[40%] blur-[120px] rounded-full", isDark ? "bg-emerald-500/10" : "bg-emerald-400/8")} />
        <div className={cn("absolute bottom-[10%] left-[-10%] w-[60%] h-[40%] blur-[100px] rounded-full", isDark ? "bg-blue-500/8" : "bg-blue-400/6")} />
      </div>

      {/* ── Header ── */}
      <header className={cn("fixed top-0 left-0 right-0 max-w-[420px] mx-auto z-50 px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 flex items-center justify-between border-b backdrop-blur-xl transition-all", isDark ? "bg-[#030E1B]/90 border-white/5" : "bg-white/95 border-slate-100")}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/dashboard')}
          className={cn("w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm", isDark ? "bg-white/5 border-white/10 text-white/60" : "bg-white border-slate-200 text-slate-500")}>
          <ChevronLeft size={16} />
        </motion.button>
        <div className="text-center">
          <h1 className={cn("text-xs font-black tracking-widest uppercase", isDark ? "text-white" : "text-slate-900")}>Feed Intelligence</h1>
          <p className={cn("text-[8px] font-black uppercase tracking-widest mt-0.5", isDark ? "text-emerald-400" : "text-emerald-600")}>DOC-based Auto-Calculation</p>
        </div>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border", isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200")}>
          <Fish size={14} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
        </div>
      </header>

      <div className="pt-[calc(env(safe-area-inset-top)+4.5rem)] px-5 max-w-[420px] mx-auto relative z-10 space-y-5">
        
        {/* Pond Selector */}
        {ponds.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            {ponds.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedPondId(p.id); setSyncedSlots([]); }}
                className={cn(
                  'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex-shrink-0',
                  selectedPondId === p.id 
                    ? 'bg-[#059669] text-white border-[#059669] shadow-md' 
                    : isDark ? 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10' : 'bg-white text-slate-500 border-slate-100'
                )}
              >
                {p.name} <span className="opacity-70 ml-1">· D{calculateDOC(p.stockingDate)}</span>
              </button>
            ))}
          </div>
        )}

        {!selectedPond ? (
          <div className="mt-8 mb-8">
            <NoPondState
              isDark={isDark}
              subtitle="Add a pond to start tracking daily feed schedules and FCR analytics."
            />
          </div>
        ) : selectedPond.status === 'planned' ? (
          <div className={cn("rounded-[2rem] p-6 border shadow-sm space-y-4 relative overflow-hidden", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-100")}>
            <div className="absolute -top-10 -right-10 opacity-[0.03] rotate-12">
              <Scale size={200} />
            </div>

            {/* Header */}
            <div className={cn("flex items-center gap-3 p-4 rounded-2xl border", isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-100")}>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100 text-indigo-600")}>
                <Info size={20} />
              </div>
              <div>
                <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-indigo-400" : "text-indigo-700")}>Pre-Stocking Phase</p>
                <h2 className={cn("text-base font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                  Feed Prep — {selectedPond.species || 'Vannamei'} Protocol
                </h2>
              </div>
            </div>

            {/* Feed Type Required */}
            <div className={cn("p-5 rounded-2xl border", isDark ? "bg-[#0A1A2F]/80 border-[#1E3A8A]" : "bg-blue-50 border-blue-100")}>
              <p className={cn("text-[9px] font-black uppercase tracking-widest mb-3", isDark ? "text-blue-400" : "text-blue-700")}>
                🌾 Required Starter Feed — {selectedPond.species || 'Vannamei'}
              </p>
              <div className="space-y-2">
                {(selectedPond.species === 'Tiger' ? [
                  { label: 'Feed Type', value: 'Crumble No.1 (Tiger Grade)' },
                  { label: 'Protein', value: '42% minimum' },
                  { label: 'Pellet Size', value: '0.4 – 0.6 mm' },
                  { label: 'Daily Rate', value: '1.2–1.5 kg/acre/day (DOC 1–7)' },
                  { label: 'Frequency', value: '4× per day (blind feed)' },
                  { label: 'Stock Needed', value: '25–40 kg before stocking' },
                ] : [
                  { label: 'Feed Type', value: 'Crumble No.1 (Vannamei)' },
                  { label: 'Protein', value: '40% minimum' },
                  { label: 'Pellet Size', value: '0.4 – 0.8 mm' },
                  { label: 'Daily Rate', value: '1.0–1.5 kg/acre/day (DOC 1–7)' },
                  { label: 'Frequency', value: '4× per day (blind feed)' },
                  { label: 'Stock Needed', value: '20–35 kg before stocking' },
                ]).map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className={cn("text-[10px] font-bold", isDark ? "text-white/50" : "text-slate-500")}>{item.label}</span>
                    <span className={cn("text-[10px] font-black", isDark ? "text-white" : "text-slate-900")}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 30-Day Feed Plan Preview */}
            <div className={cn("p-5 rounded-2xl border", isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-100")}>
              <p className={cn("text-[9px] font-black uppercase tracking-widest mb-3", isDark ? "text-emerald-400" : "text-emerald-700")}>
                📅 Feed Transition Plan (First 30 Days)
              </p>
              <div className="space-y-2">
                {[
                  { phase: 'DOC 1–3', feed: 'Blind Feed (No tray)', type: 'Crumble No.1', note: 'Scatter evenly' },
                  { phase: 'DOC 4–15', feed: 'Crumble No.1 + Tray', type: '40%+ protein', note: 'Start tray checks' },
                  { phase: 'DOC 16–30', feed: 'Pellet No.2', type: '38% protein' , note: 'Transition over 3 days' },
                ].map((row, i) => (
                  <div key={i} className={cn("flex items-center justify-between p-2 rounded-xl", isDark ? "bg-black/20" : "bg-white/60")}>
                    <div>
                      <p className={cn("text-[9px] font-black", isDark ? "text-emerald-400" : "text-emerald-700")}>{row.phase}</p>
                      <p className={cn("text-[8px] font-bold", isDark ? "text-white/40" : "text-slate-400")}>{row.note}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-[9px] font-black", isDark ? "text-white" : "text-slate-800")}>{row.feed}</p>
                      <p className={cn("text-[7px] font-bold", isDark ? "text-white/30" : "text-slate-400")}>{row.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/medicine')}
                className={cn("flex-1 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-sm transition-all active:scale-[0.98]", isDark ? "bg-white/5 border border-white/10 text-white/70" : "bg-slate-100 border border-slate-200 text-slate-600")}
              >
                Medicine Prep SOP
              </button>
              <button
                onClick={() => navigate('/ponds')}
                className="flex-1 py-3.5 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
              >
                Confirm Stocking Date
              </button>
            </div>
          </div>

        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={selectedPond.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

              {/* ── FEED INTELLIGENCE HERO ── */}
              <div className="rounded-[2rem] p-5 text-white relative overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(135deg, #064E3B 0%, #059669 60%, #34D399 100%)' }}>
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/5 blur-[60px] rounded-full" />
                <div className="absolute top-0 left-0 w-full h-full opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <p className="text-[8px] font-black text-emerald-200/70 uppercase tracking-[0.3em] mb-1">{selectedPond.name} · DOC {currentDoc}</p>
                    <h2 className="text-5xl font-black tracking-tighter leading-none">
                      {adjustedDailyKg}
                      <span className="text-lg text-emerald-300 ml-1">kg</span>
                    </h2>
                    <p className="text-[9px] font-black text-emerald-200/60 uppercase tracking-widest mt-2">Daily Feed Target</p>
                    {combinedFactor !== 1.0 && (
                      <span className="mt-2 inline-flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full bg-black/20 text-emerald-200 border border-white/10">
                        {combinedFactor < 1.0 ? <TrendingDown size={9}/> : <TrendingUp size={9}/>}
                        {combinedFactor < 1.0 ? '-' : '+'}{Math.abs((1 - combinedFactor) * 100).toFixed(0)}% adjusted
                      </span>
                    )}
                  </div>

                  {/* FCR Ring Gauge */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-20 h-20">
                      <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.9" fill="none"
                          stroke={fcrCritical ? '#f87171' : fcrWarning ? '#fbbf24' : '#34d399'}
                          strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${Math.min(100, (fcrValue / 2.0) * 100)} 100`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-base font-black text-white leading-none">{fcrValue > 0 ? fcrValue.toFixed(1) : '—'}</span>
                        <span className="text-[6px] font-black text-white/50 uppercase">FCR</span>
                      </div>
                    </div>
                    <p className={cn('text-[7px] font-black uppercase tracking-widest mt-1',
                      fcrCritical ? 'text-red-300' : fcrWarning ? 'text-amber-300' : 'text-emerald-300'
                    )}>{fcrCritical ? 'High FCR!' : fcrWarning ? 'Monitor' : 'Optimal'}</p>
                  </div>
                </div>

                {/* Daily Compliance Bar */}
                <div className="mt-4 relative z-10">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[8px] font-black text-emerald-200/60 uppercase tracking-widest">Today's Compliance</p>
                    <p className="text-[9px] font-black text-white">{slotsCompleted}/{feedSlots.length} slots · {todayCompliance}%</p>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${todayCompliance}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={cn('h-full rounded-full', todayCompliance >= 80 ? 'bg-emerald-400' : todayCompliance >= 50 ? 'bg-amber-400' : 'bg-red-400')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 mt-4 border-t border-white/10 relative z-10">
                  {[
                    { label: 'Biomass', value: `${biomassKg}kg`, icon: Scale },
                    { label: 'Per Slot', value: `${kgPerSlot}kg`, icon: Activity },
                    { label: 'Feed Type', value: feedProfile.no.split(' ')[0], icon: Package },
                  ].map((m, i) => (
                    <div key={i} className="text-center">
                      <m.icon size={12} className="text-emerald-300/60 mx-auto mb-1" />
                      <p className="text-sm font-black text-white leading-none">{m.value}</p>
                      <p className="text-[7px] font-black text-emerald-200/50 uppercase tracking-widest mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── SOP SITUATION ALERTS ── */}
              <AnimatePresence>
                {isCriticalStage && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className={cn('rounded-2xl p-4 border flex items-start gap-3', isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200')}>
                    <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className={cn('text-[10px] font-black uppercase tracking-widest', isDark ? 'text-red-400' : 'text-red-700')}>WSSV Risk · DOC {currentDoc} — Critical Stage</p>
                      <p className={cn('text-[9px] font-medium mt-0.5 leading-relaxed', isDark ? 'text-red-300/70' : 'text-red-700/70')}>Reduce feed by 10% if shrimp show tail redness or lethargy. Check tray residue carefully.</p>
                    </div>
                  </motion.div>
                )}
                {adjustments.map((a, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className={cn('rounded-2xl p-3 border flex items-center gap-3', a.bg)}>
                    <a.icon size={16} className={cn('flex-shrink-0', a.color)} />
                    <div className="flex-1">
                      <p className={cn('text-[9px] font-black', a.color)}>{a.label}</p>
                      <p className={cn('text-[8px] font-medium', isDark ? 'text-white/50' : 'text-slate-500')}>{a.reason}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Active Tabs */}
              <div className={cn("flex p-1 rounded-xl border shadow-sm backdrop-blur-md", isDark ? "bg-white/5 border-white/10" : "bg-slate-100/50 border-slate-100")}>
                {(['schedule', 'sow', 'fcr'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      activeTab === tab 
                        ? isDark ? "bg-white/10 text-white shadow-sm" : "bg-white text-emerald-700 shadow-md border border-slate-200" 
                        : isDark ? "text-white/40" : "text-slate-500"
                    )}
                  >
                    {tab === 'schedule' ? 'Diet Plan' : tab === 'sow' ? 'SOP Details' : 'FCR Analytcis'}
                  </button>
                ))}
              </div>

              {activeTab === 'schedule' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  {/* Countdown Timer Block */}
                  <div className={cn("rounded-2xl flex items-center justify-between border shadow-sm pl-4 pr-1 py-1 overflow-hidden", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-100")}>
                     <div>
                       <p className={cn("text-[9px] font-black uppercase tracking-widest mb-1", isDark ? "text-emerald-400" : "text-emerald-600")}>Next Target Slot</p>
                       <div className="flex items-center gap-2">
                         <span className={cn("text-xs font-bold", isDark ? "text-white" : "text-slate-700")}>{nextFeedSlot.time}</span>
                         <span className={cn("text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest", isDark ? "bg-white/5 text-white/60" : "bg-slate-100 text-slate-500")}>{kgPerSlot}kg</span>
                       </div>
                     </div>
                     <div className="flex gap-1.5 p-2 bg-emerald-500/5 rounded-xl ml-4">
                        <div className={cn("w-12 h-12 rounded-[0.8rem] flex flex-col items-center justify-center border", isDark ? "bg-black/30 border-emerald-500/20" : "bg-white border-emerald-100 shadow-sm")}>
                          <span className={cn("text-lg font-black leading-none", isDark ? "text-emerald-400" : "text-emerald-600")}>{countdownH.toString().padStart(2, '0')}</span>
                          <span className="text-[6px] font-black uppercase tracking-widest opacity-50 mt-1">HRS</span>
                        </div>
                        <div className={cn("w-12 h-12 rounded-[0.8rem] flex flex-col items-center justify-center border", isDark ? "bg-black/30 border-emerald-500/20" : "bg-white border-emerald-100 shadow-sm")}>
                          <span className={cn("text-lg font-black leading-none", isDark ? "text-emerald-400" : "text-emerald-600")}>{countdownM.toString().padStart(2, '0')}</span>
                          <span className="text-[6px] font-black uppercase tracking-widest opacity-50 mt-1">MIN</span>
                        </div>
                     </div>
                  </div>

                  {/* Feed Type Profile Banner */}
                  <div className={cn("flex flex-col gap-2 p-4 rounded-2xl border shadow-sm backdrop-blur-md", isDark ? "bg-[#0A1A2F]/80 border-[#1E3A8A]" : "bg-blue-50 border-blue-100")}>
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <Package size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />
                           <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-blue-400" : "text-blue-700")}>Active Feed Type</p>
                        </div>
                        <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-md", isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-200/50 text-blue-800")}>{feedProfile.protein} Protein</span>
                     </div>
                     <div className="flex justify-between mt-1 items-end">
                       <h3 className={cn("text-lg font-black tracking-tighter", isDark ? "text-white" : "text-slate-900")}>
                         {feedProfile.no}
                       </h3>
                       <p className={cn("text-[10px] font-bold", isDark ? "text-white/60" : "text-slate-500")}>Size: {feedProfile.size}</p>
                     </div>
                  </div>

                  {/* Command Calculator */}
                  <div className="rounded-[1.5rem] p-5 text-white shadow-lg relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #059669 0%, #0D523C 100%)' }}>
                     <div className="absolute top-[-50%] right-[-10%] w-48 h-48 bg-white/10 blur-[40px] rounded-full pointer-events-none" />
                     
                     <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 relative z-10">
                       <div>
                         <p className="text-emerald-100/60 text-[9px] font-black uppercase tracking-widest mb-1">Total Daily Application</p>
                         <h2 className="text-4xl font-black tracking-tighter leading-none">{adjustedDailyKg}<span className="text-sm text-emerald-300 ml-1">kg</span></h2>
                       </div>
                       {combinedFactor !== 1.0 && (
                         <div className="text-right">
                           <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-black/30 text-emerald-200 border border-white/10 shadow-inner">
                             {combinedFactor < 1.0 ? '-' : '+'}{Math.abs((1 - combinedFactor) * 100).toFixed(0)}% Mod
                           </span>
                           <p className="text-[8px] text-emerald-100/50 uppercase tracking-widest mt-2">Adjusted from {rawDailyKg}kg</p>
                         </div>
                       )}
                     </div>

                     {/* Adjustments List */}
                     {adjustments.length > 0 ? (
                       <div className="flex flex-col gap-2 relative z-10">
                          <p className="text-[8.5px] font-black text-emerald-100/60 uppercase tracking-widest mb-1">Active Influences</p>
                          {adjustments.map((a, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl backdrop-blur-md border border-white/10 bg-black/20">
                               <div className="flex items-center gap-2.5">
                                  <a.icon size={12} className={a.color} />
                                  <span className="text-[10px] font-bold text-white/95">{a.reason}</span>
                               </div>
                               <span className={cn("text-[9px] font-black", a.color)}>{a.label}</span>
                            </div>
                          ))}
                       </div>
                     ) : (
                       <div className="flex items-center gap-2 relative z-10 px-2 py-1">
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          <p className="text-[9px] font-black text-emerald-100/80 uppercase tracking-widest">Normal Conditions (Optimal Digestibility)</p>
                       </div>
                     )}
                  </div>

                  {/* Enhanced Schedule List with Tray Workflows */}
                  <div className="space-y-3">
                    <h3 className={cn("font-black text-[11px] uppercase tracking-widest px-1", isDark ? "text-white/60" : "text-slate-500")}>Daily Sequence</h3>
                    {feedSlots.map((slot, i) => {
                      const isNow = now.getHours() === slot.hour;
                      const isSynced = syncedSlots.includes(slot.time);
                      const isPast = now.getHours() > slot.hour && !isSynced;
                      
                      return (
                        <div key={i} className={cn("rounded-2xl border shadow-sm transition-all overflow-hidden", isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-100")}>
                          {/* Main Row */}
                          <div className={cn("p-3 flex items-center justify-between", isSynced ? "bg-emerald-500/5" : "")}>
                             <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => toggleSlot(slot.time, kgPerSlot, slot.label)}
                                  className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95", 
                                  isSynced ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : isNow ? 'bg-[#059669] text-white shadow-md' : isPast ? 'bg-red-400 text-white' : isDark ? 'bg-black/30 text-white/50 border border-white/10' : 'bg-slate-50 border border-slate-200 text-slate-400 hover:border-emerald-400'
                                )}>
                                   {isSynced ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                </button>
                                <div>
                                   <div className="flex items-center gap-2 mb-0.5">
                                      <p className={cn("font-black text-sm", isSynced ? "text-emerald-600 dark:text-emerald-400" : isDark ? "text-white/90" : "text-slate-800")}>{slot.label}</p>
                                      {isPast && <span className="text-[7.5px] bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded uppercase font-black tracking-widest">Missed</span>}
                                   </div>
                                   <p className={cn("text-[9px] font-black uppercase tracking-widest", isDark ? "text-white/40" : "text-slate-400")}>{slot.time}</p>
                                </div>
                             </div>
                             <div className="text-right border-l border-white/10 dark:border-slate-100 pl-4">
                                <p className={cn("font-black text-base", isSynced ? "text-emerald-600 dark:text-emerald-400" : isDark ? "text-white/90" : "text-slate-700")}>{kgPerSlot}</p>
                                <p className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/40" : "text-slate-400")}>kg</p>
                             </div>
                          </div>

                          {/* Secondary Workflow (Check Tray) */}
                          <div className={cn("px-4 py-2 border-t flex items-center justify-between", isDark ? "bg-black/20 border-white/5" : "bg-slate-50 border-slate-100")}>
                             <div className="flex items-center gap-1.5">
                               <Eye size={10} className={isDark ? "text-white/40" : "text-slate-400"} />
                               <span className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/50" : "text-slate-500")}>Check Tray ({getTrayCheckTime(currentDoc)})</span>
                             </div>
                             <div className={cn("px-2 py-0.5 rounded flex items-center gap-1", isDark ? "bg-white/5" : "bg-white border border-slate-200")}>
                                <span className={cn("text-[7.5px] font-black uppercase tracking-widest", isDark ? "text-white/40" : "text-slate-400")}>{isSynced ? 'Pending Check' : 'Awaiting Feed'}</span>
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'sow' && (
                <motion.div initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                   <div className={cn("p-5 rounded-2xl border shadow-sm", isDark ? "bg-[#030E1B] border-white/10" : "bg-white border-slate-100")}>
                       <h3 className={cn("font-black text-xs uppercase tracking-widest mb-4", isDark ? "text-white/60" : "text-slate-500")}>Biomass Calculation Details</h3>
                       
                       <div className="space-y-4">
                          <div className="flex justify-between items-center pb-3 border-b border-white/5 dark:border-slate-100">
                             <div className="flex items-center gap-2">
                               <Users_FallbackIcon className={isDark ? "text-blue-400" : "text-blue-600"} />
                               <span className={cn("text-sm font-black", isDark ? "text-white/80" : "text-slate-700")}>Initial Stock</span>
                             </div>
                             <span className={cn("font-black", isDark ? "text-white" : "text-slate-900")}>{seedCount.toLocaleString()} <span className="text-[10px]">PL</span></span>
                          </div>
                          
                          <div className="flex justify-between items-center pb-3 border-b border-white/5 dark:border-slate-100">
                             <div className="flex items-center gap-2">
                               <Scale className={isDark ? "text-emerald-400" : "text-emerald-600"} size={16} />
                               <span className={cn("text-sm font-black", isDark ? "text-white/80" : "text-slate-700")}>Expected S.R. (Survival)</span>
                             </div>
                             <span className={cn("font-black", isDark ? "text-white" : "text-slate-900")}>{survivalRate.toFixed(1)}%</span>
                          </div>

                          <div className="flex justify-between items-center pb-3 border-b border-white/5 dark:border-slate-100">
                             <div className="flex items-center gap-2">
                               <Info className={isDark ? "text-amber-400" : "text-amber-600"} size={16} />
                               <span className={cn("text-sm font-black", isDark ? "text-white/80" : "text-slate-700")}>Avg Body Weight</span>
                             </div>
                             <span className={cn("font-black", isDark ? "text-white" : "text-slate-900")}>{sop.avgWeightG} <span className="text-[10px]">g</span></span>
                          </div>

                          <div className={cn("mt-4 p-4 rounded-xl", isDark ? "bg-white/5" : "bg-slate-50")}>
                             <div className="flex justify-between items-center mb-1">
                               <span className={cn("text-[9px] font-black uppercase tracking-widest", isDark ? "text-white/50" : "text-slate-500")}>Total Est. Biomass</span>
                               <span className={cn("text-lg font-black", isDark ? "text-emerald-400" : "text-emerald-600")}>{biomassKg.toLocaleString()} <span className="text-xs">kg</span></span>
                             </div>
                             <p className={cn("text-[8px] font-bold mt-2", isDark ? "text-white/40" : "text-slate-400")}>Equation: (Stock × S.R.) × ABW ÷ 1000</p>
                          </div>
                       </div>
                   </div>

                   <div className={cn("p-5 rounded-2xl border shadow-sm", isDark ? "bg-[#0A1A2F]/80 border-[#1E3A8A]" : "bg-blue-50 border-blue-100")}>
                      <h3 className={cn("font-black text-[10px] uppercase tracking-widest mb-1", isDark ? "text-blue-400" : "text-blue-700")}>SOP Feed Formulation</h3>
                      <p className={cn("text-sm font-black", isDark ? "text-white/90" : "text-slate-800")}>Feed prescribed strictly via standard AquaGrow logic for DOC {currentDoc}. Check trays meticulously for over-feeding waste.</p>
                   </div>
                </motion.div>
              )}

              {activeTab === 'fcr' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  {(() => {
                    const totalFeedConsumed = feedLogs.filter(l => l.pondId === selectedPondId).reduce((acc, l) => acc + l.quantity, 0);
                    const currentFcr = biomassKg > 0 ? (totalFeedConsumed / biomassKg).toFixed(2) : '0.00';
                    return (
                      <>
                        <div className={cn("p-8 rounded-[2rem] text-center shadow-lg border relative overflow-hidden", isDark ? "bg-[#030E1B] border-white/5" : "bg-white border-slate-100")}>
                           <div className="absolute top-[-20%] left-[10%] w-[80%] h-[80%] bg-emerald-500/5 rounded-full blur-[60px]" />
                           <Activity className={cn("mx-auto mb-3", isDark ? "text-emerald-400/50" : "text-emerald-600/50")} size={24} />
                           <p className={cn("text-[9px] font-black uppercase tracking-[0.4em] mb-2", isDark ? "text-emerald-400/60" : "text-emerald-700/60")}>Current FCR</p>
                           <div className={cn("text-6xl font-black tracking-tighter", isDark ? "text-white" : "text-slate-900")}>{currentFcr}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4">
                           <div className={cn("p-5 rounded-2xl border text-center", isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                              <p className={cn("text-[9px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Total Logged</p>
                              <p className={cn("text-xl font-black", isDark ? "text-white" : "text-slate-800")}>{totalFeedConsumed} <span className="text-xs opacity-50">kg</span></p>
                           </div>
                           <div className={cn("p-5 rounded-2xl border text-center", isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                              <p className={cn("text-[9px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Current Biomass</p>
                              <p className={cn("text-xl font-black", isDark ? "text-white" : "text-slate-800")}>{biomassKg} <span className="text-xs opacity-50">kg</span></p>
                           </div>
                        </div>

                        {/* Recent Feeding Logs Breakdown */}
                        <div className={cn("p-4 rounded-2xl border mt-4", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-100")}>
                           <h3 className={cn("font-black text-[10px] uppercase tracking-widest mb-3", isDark ? "text-white/60" : "text-slate-500")}>Recent Log History</h3>
                           {feedLogs.filter(l => l.pondId === selectedPondId).slice(-3).map((log, i) => (
                             <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 dark:border-slate-100 last:border-0 last:pb-0">
                               <div className="flex flex-col">
                                  <span className={cn("text-xs font-black", isDark ? "text-white/80" : "text-slate-700")}>{new Date(log.date).toLocaleDateString()}</span>
                                  <span className={cn("text-[9px] font-bold", isDark ? "text-white/40" : "text-slate-400")}>{log.notes || 'Routine'}</span>
                               </div>
                               <span className={cn("font-black text-sm", isDark ? "text-emerald-400" : "text-emerald-600")}>+{log.quantity}kg</span>
                             </div>
                           ))}
                           {feedLogs.length === 0 && <p className={cn("text-xs italic bg-transparent", isDark ? "text-white/40" : "text-slate-500")}>No logs yet.</p>}
                        </div>

                        <div className={cn("p-4 rounded-[1.5rem] border text-xs text-center leading-relaxed mt-4 font-bold flex items-start gap-3", isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-700")}>
                           <Info size={16} className="flex-shrink-0 mt-0.5" />
                           <span className="text-left">An FCR of {currentFcr} is {parseFloat(currentFcr) < 1.3 ? 'excellent.' : parseFloat(currentFcr) < 1.6 ? 'normal.' : 'concerning.'} Keep matching the daily targeted slots to optimize profitability.</span>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

// Fallback user icon component inline
const Users_FallbackIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
