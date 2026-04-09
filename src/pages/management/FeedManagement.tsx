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

// â”€â”€â”€ WEATHER SIMULATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ EXACT FARMER SOP LOGIC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  if (weather.temp >= 34) adj.push({ factor: 0.80, label: `${t.heatStress} -20%`, reason: `Temp ${weather.temp}Â°C limits digestion`, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: Thermometer });
  if (weather.isRaining) adj.push({ factor: 0.85, label: `${t.rainEvent} -15%`, reason: 'Rain lowers dissolved oxygen', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: Droplets });
  
  if (lunarPhase === 'AMAVASYA') adj.push({ factor: 0.75, label: `ðŸŒ‘ Amavasya -25%`, reason: 'High mass molting energy demand', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', icon: Zap });
  else if (lunarPhase === 'POURNAMI') adj.push({ factor: 1.0, label: `ðŸŒ• Pournami +0%`, reason: 'High biological activity', color: 'text-indigo-300', bg: 'bg-indigo-400/10 border-indigo-400/20', icon: Zap });
  else if (lunarPhase === 'ASHTAMI') adj.push({ factor: 0.90, label: `ðŸŒ“ Ashtami -10%`, reason: 'Molting initiation risk', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', icon: Zap });
  else if (lunarPhase === 'NAVAMI') adj.push({ factor: 0.85, label: `ðŸŒ™ Navami -15%`, reason: 'Molting peak risk', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', icon: Zap });

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
  

  // â”€â”€ toggleSlot is defined further below after computed values â”€â”€
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

  // â”€â”€ FCR gauge & compliance for current pond
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

  // â”€â”€ Daily Sequence slot log handler (needs biomassKg, totalFeedConsumed, combinedFactor) â”€â”€â”€â”€â”€
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
        notes:            `Daily Sequence: ${slotLabel} (${slotTime}) â€” ${feedKg}kg ${profile.no} @ â‚¹${feedPricePerKg}/kg = â‚¹${slotCost}. DOC ${currentDoc}. Adj: ${combinedFactor.toFixed(2)}.`,
      } as any);
    }
    setSyncedSlots(prev => [...prev, slotTime]);
  };



  return (
    <div className="pb-32 min-h-[100dvh] font-sans relative overflow-hidden transition-colors duration-500"
      style={{ background: isDark ? '#030E1B' : '#F4F7FA' }}>

      {/* Ambient Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={cn("absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[140px]", isDark ? "bg-emerald-600/12" : "bg-emerald-400/10")} />
        <div className={cn("absolute bottom-20 -left-20 w-72 h-72 rounded-full blur-[140px]", isDark ? "bg-blue-500/10" : "bg-blue-400/8")} />
      </div>

      {/* â”€â”€ Header â”€â”€ */}
      <header className={cn(
        "fixed top-0 left-0 right-0 max-w-[420px] mx-auto z-50 px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3",
        "flex items-center justify-between border-b backdrop-blur-xl transition-all",
        isDark ? "bg-[#030E1B]/90 border-white/5" : "bg-white/95 border-slate-100 shadow-sm"
      )}>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/dashboard')}
          className={cn("w-9 h-9 rounded-xl flex items-center justify-center border",
            isDark ? "bg-white/5 border-white/10 text-white/60" : "bg-white border-slate-200 text-slate-500 shadow-sm")}>
          <ChevronLeft size={16} />
        </motion.button>
        <div className="text-center">
          <h1 className={cn("text-[11px] font-black tracking-widest uppercase", isDark ? "text-white" : "text-slate-900")}>Feed Intelligence</h1>
          <p className={cn("text-[7.5px] font-black uppercase tracking-[0.2em] mt-0.5", isDark ? "text-emerald-400/70" : "text-emerald-600")}>SOP-Driven Â· DOC Auto-Calculated</p>
        </div>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border",
          isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200")}>
          <Fish size={14} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
        </div>
      </header>

      <div className="pt-[calc(env(safe-area-inset-top)+4.5rem)] px-4 max-w-[420px] mx-auto relative z-10 space-y-4">

        {/* â”€â”€ Pond Tabs â”€â”€ */}
        {ponds.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none no-scrollbar">
            {ponds.map(p => (
              <button key={p.id}
                onClick={() => { setSelectedPondId(p.id); setSyncedSlots([]); }}
                className={cn(
                  'px-3.5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex-shrink-0',
                  selectedPondId === p.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20'
                    : isDark ? 'bg-white/5 text-white/40 border-white/8 hover:bg-white/10' : 'bg-white text-slate-500 border-slate-100 shadow-sm'
                )}>
                ðŸŸ {p.name} <span className="opacity-60 ml-1">D{calculateDOC(p.stockingDate)}</span>
              </button>
            ))}
          </div>
        )}

        {!selectedPond ? (
          <div className="mt-8">
            <NoPondState isDark={isDark} subtitle="Add a pond to start tracking daily feed schedules and FCR analytics." />
          </div>

        ) : selectedPond.status === 'planned' ? (
          /* â”€â”€ Pre-Stocking â”€â”€ */
          <div className={cn("rounded-[2rem] p-5 border space-y-4 relative overflow-hidden",
            isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
            <div className="absolute -top-8 -right-8 opacity-[0.04]"><Leaf size={160} /></div>

            <div className={cn("flex items-center gap-3 p-4 rounded-2xl border",
              isDark ? "bg-indigo-500/8 border-indigo-500/15" : "bg-indigo-50 border-indigo-100")}>
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0",
                isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100 text-indigo-600")}>
                <Info size={18} />
              </div>
              <div>
                <p className={cn("text-[9px] font-black uppercase tracking-widest", isDark ? "text-indigo-400" : "text-indigo-700")}>Pre-Stocking Phase</p>
                <h2 className={cn("text-sm font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                  {selectedPond.species || 'Vannamei'} Feed Prep Protocol
                </h2>
              </div>
            </div>

            {/* Starter Feed Specs */}
            <div className={cn("p-4 rounded-2xl border space-y-2", isDark ? "bg-blue-500/5 border-blue-500/15" : "bg-blue-50 border-blue-100")}>
              <p className={cn("text-[8px] font-black uppercase tracking-widest mb-2", isDark ? "text-blue-400" : "text-blue-700")}>ðŸŒ¾ Required Starter Feed</p>
              {(selectedPond.species === 'Tiger' ? [
                { label: 'Feed Type', value: 'Crumble No.1 (Tiger)' },
                { label: 'Protein', value: '42% minimum' },
                { label: 'Pellet Size', value: '0.4 â€“ 0.6 mm' },
                { label: 'Daily Rate', value: '1.2â€“1.5 kg/acre/day' },
                { label: 'Frequency', value: '4Ã— daily (blind feed)' },
              ] : [
                { label: 'Feed Type', value: 'Crumble No.1 (Vannamei)' },
                { label: 'Protein', value: '40% minimum' },
                { label: 'Pellet Size', value: '0.4 â€“ 0.8 mm' },
                { label: 'Daily Rate', value: '1.0â€“1.5 kg/acre/day' },
                { label: 'Frequency', value: '4Ã— daily (blind feed)' },
              ]).map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-blue-200/20 last:border-0">
                  <span className={cn("text-[9px] font-bold", isDark ? "text-white/40" : "text-slate-500")}>{item.label}</span>
                  <span className={cn("text-[9px] font-black", isDark ? "text-white" : "text-slate-800")}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* 30-Day Transition Plan */}
            <div className={cn("p-4 rounded-2xl border", isDark ? "bg-emerald-500/5 border-emerald-500/15" : "bg-emerald-50 border-emerald-100")}>
              <p className={cn("text-[8px] font-black uppercase tracking-widest mb-2", isDark ? "text-emerald-400" : "text-emerald-700")}>ðŸ“… First 30 Days Transition</p>
              <div className="space-y-2">
                {[
                  { phase: 'DOC 1â€“3', feed: 'Blind Feed Â· Scatter evenly', type: 'Crumble No.1' },
                  { phase: 'DOC 4â€“15', feed: 'Crumble + Start tray checks', type: '40%+ protein' },
                  { phase: 'DOC 16â€“30', feed: 'Pellet No.2 Â· 3-day transition', type: '38% protein' },
                ].map((row, i) => (
                  <div key={i} className={cn("flex items-center justify-between p-2.5 rounded-xl",
                    isDark ? "bg-black/20" : "bg-white/70")}>
                    <div>
                      <p className={cn("text-[9px] font-black", isDark ? "text-emerald-400" : "text-emerald-700")}>{row.phase}</p>
                      <p className={cn("text-[8px] font-medium", isDark ? "text-white/30" : "text-slate-400")}>{row.feed}</p>
                    </div>
                    <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-lg",
                      isDark ? "bg-white/5 text-white/60" : "bg-slate-100 text-slate-600")}>{row.type}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => navigate('/medicine')}
                className={cn("flex-1 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all",
                  isDark ? "bg-white/5 border border-white/10 text-white/60" : "bg-slate-100 text-slate-600")}>
                Medicine SOP
              </button>
              <button onClick={() => navigate('/ponds')}
                className="flex-1 py-3 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                Set Stocking Date â†’
              </button>
            </div>
          </div>

        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={selectedPond.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

              {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                  HERO COMMAND CARD
              â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
              <div className="rounded-[2rem] overflow-hidden shadow-2xl relative"
                style={{ background: 'linear-gradient(135deg, #054830 0%, #065F46 45%, #059669 100%)' }}>
                {/* Pattern bg */}
                <div className="absolute inset-0 opacity-[0.04]"
                  style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-white/5 blur-[60px] rounded-full" />

                <div className="relative z-10 p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[7.5px] font-black text-emerald-200/60 uppercase tracking-[0.25em] mb-0.5">
                        {selectedPond.name} Â· DOC {currentDoc}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-white tracking-tighter leading-none">{adjustedDailyKg}</span>
                        <span className="text-base text-emerald-300 font-black">kg/day</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {/* Feed type pill */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[8px] font-black text-emerald-100 uppercase tracking-widest">
                          <Package size={9} /> {feedProfile.no}
                        </span>
                        {/* Adjustment pill */}
                        {combinedFactor !== 1.0 && (
                          <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest",
                            combinedFactor < 1 ? "bg-red-500/20 border-red-400/30 text-red-200" : "bg-emerald-400/20 border-emerald-300/30 text-emerald-100")}>
                            {combinedFactor < 1.0 ? <TrendingDown size={9} /> : <TrendingUp size={9} />}
                            {combinedFactor < 1.0 ? '-' : '+'}{Math.abs((1 - combinedFactor) * 100).toFixed(0)}% adj
                          </span>
                        )}
                      </div>
                    </div>

                    {/* FCR Ring */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="relative w-20 h-20">
                        <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                          <circle cx="18" cy="18" r="15.9" fill="none"
                            stroke={fcrCritical ? '#f87171' : fcrWarning ? '#fbbf24' : '#34d399'}
                            strokeWidth="2.5" strokeLinecap="round"
                            strokeDasharray={`${Math.min(100, (fcrValue / 2.0) * 100)} 100`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-black text-white leading-none">{fcrValue > 0 ? fcrValue.toFixed(1) : 'â€”'}</span>
                          <span className="text-[6px] font-black text-emerald-300/60 uppercase tracking-widest">FCR</span>
                        </div>
                      </div>
                      <span className={cn("text-[7px] font-black uppercase tracking-widest",
                        fcrCritical ? 'text-red-300' : fcrWarning ? 'text-amber-300' : 'text-emerald-300')}>
                        {fcrCritical ? 'âš  High' : fcrWarning ? 'â— Watch' : 'âœ“ Good'}
                      </span>
                    </div>
                  </div>

                  {/* Adjustments row */}
                  {adjustments.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {adjustments.map((a, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/25 border border-white/10 text-[7.5px] font-black text-white/70">
                          <a.icon size={8} className={a.color} /> {a.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
                    {[
                      { label: 'Biomass', value: `${biomassKg}kg`, icon: Scale },
                      { label: 'Per Slot', value: `${kgPerSlot}kg`, icon: Activity },
                      { label: 'Protein', value: feedProfile.protein, icon: Leaf },
                    ].map((m, i) => (
                      <div key={i} className="text-center">
                        <m.icon size={11} className="text-emerald-300/50 mx-auto mb-0.5" />
                        <p className="text-sm font-black text-white leading-none">{m.value}</p>
                        <p className="text-[6.5px] font-black text-emerald-200/40 uppercase tracking-widest mt-0.5">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Compliance bar */}
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[7.5px] font-black text-emerald-200/50 uppercase tracking-widest">Today's Compliance</p>
                      <p className="text-[8.5px] font-black text-white/80">{slotsCompleted}/{feedSlots.length} slots Â· {todayCompliance}%</p>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${todayCompliance}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={cn('h-full rounded-full', todayCompliance >= 80 ? 'bg-emerald-400' : todayCompliance >= 50 ? 'bg-amber-400' : 'bg-red-400')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* WSSV Critical Alert */}
              {isCriticalStage && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className={cn('rounded-2xl p-3.5 border flex items-start gap-3',
                    isDark ? 'bg-red-500/8 border-red-500/25' : 'bg-red-50 border-red-200')}>
                  <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-red-400' : 'text-red-700')}>
                      WSSV Risk Â· DOC {currentDoc} â€” Critical Window
                    </p>
                    <p className={cn('text-[8px] font-medium mt-0.5 leading-snug', isDark ? 'text-red-300/60' : 'text-red-600/70')}>
                      Reduce feed 10% if tail redness observed. Monitor tray residue closely after each slot.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* â•â• TABS â•â• */}
              <div className={cn("flex p-1 rounded-2xl border gap-1",
                isDark ? "bg-white/5 border-white/8" : "bg-slate-100/80 border-slate-200")}>
                {(['schedule', 'sow', 'fcr'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={cn("flex-1 py-2 rounded-xl text-[8.5px] font-black uppercase tracking-widest transition-all",
                      activeTab === tab
                        ? isDark ? "bg-white/12 text-white shadow-sm" : "bg-white text-emerald-700 shadow-md"
                        : isDark ? "text-white/35 hover:text-white/60" : "text-slate-400 hover:text-slate-600"
                    )}>
                    {tab === 'schedule' ? 'ðŸŒ¿ Daily Plan' : tab === 'sow' ? 'ðŸ“‹ SOP Data' : 'ðŸ“ˆ FCR Track'}
                  </button>
                ))}
              </div>

              {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                  TAB: DAILY PLAN (SCHEDULE)
              â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
              {activeTab === 'schedule' && (
                <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">

                  {/* Next slot countdown */}
                  <div className={cn("rounded-2xl border flex items-center justify-between px-4 py-3",
                    isDark ? "bg-white/[0.04] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
                    <div>
                      <p className={cn("text-[7.5px] font-black uppercase tracking-widest mb-0.5",
                        isDark ? "text-emerald-400/70" : "text-emerald-600")}>Next Feed Slot</p>
                      <p className={cn("text-sm font-black", isDark ? "text-white" : "text-slate-800")}>
                        {nextFeedSlot.label} <span className={cn("text-[9px] font-bold ml-1", isDark ? "text-white/40" : "text-slate-400")}>{nextFeedSlot.time}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[
                        { val: countdownH.toString().padStart(2,'0'), unit:'HRS' },
                        { val: countdownM.toString().padStart(2,'0'), unit:'MIN' },
                      ].map((t, i) => (
                        <div key={i} className={cn("w-12 h-11 rounded-xl flex flex-col items-center justify-center border",
                          isDark ? "bg-black/30 border-emerald-500/20" : "bg-emerald-50 border-emerald-100")}>
                          <span className={cn("text-base font-black leading-none", isDark ? "text-emerald-400" : "text-emerald-700")}>{t.val}</span>
                          <span className="text-[6px] font-black uppercase tracking-widest opacity-50 mt-0.5">{t.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feed profile card */}
                  <div className={cn("flex items-center justify-between px-4 py-3 rounded-2xl border",
                    isDark ? "bg-blue-500/5 border-blue-500/15" : "bg-blue-50 border-blue-100")}>
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center",
                        isDark ? "bg-blue-500/15" : "bg-blue-100")}>
                        <Package size={14} className={isDark ? "text-blue-400" : "text-blue-600"} />
                      </div>
                      <div>
                        <p className={cn("text-[7px] font-black uppercase tracking-widest", isDark ? "text-blue-400/70" : "text-blue-500")}>Active Feed</p>
                        <p className={cn("text-sm font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>{feedProfile.no}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn("block text-[8px] font-black px-2.5 py-1 rounded-xl",
                        isDark ? "bg-blue-500/15 text-blue-300" : "bg-blue-100 text-blue-700")}>{feedProfile.protein}</span>
                      <p className={cn("text-[7px] font-bold mt-1", isDark ? "text-white/25" : "text-slate-400")}>{feedProfile.size}</p>
                    </div>
                  </div>

                  {/* â”€â”€ Daily Sequence Slots â”€â”€ */}
                  <div>
                    <p className={cn("text-[8px] font-black uppercase tracking-widest px-1 mb-2",
                      isDark ? "text-white/30" : "text-slate-400")}>Daily Sequence Â· {feedSlots.length} slots</p>
                    <div className="space-y-2">
                      {feedSlots.map((slot, i) => {
                        const isNow = now.getHours() === slot.hour;
                        const isSynced = syncedSlots.includes(slot.time);
                        const isPast = now.getHours() > slot.hour && !isSynced;

                        return (
                          <motion.div key={i}
                            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className={cn("rounded-[1.6rem] border overflow-hidden transition-all",
                              isSynced
                                ? isDark ? "bg-emerald-500/8 border-emerald-500/25" : "bg-emerald-50 border-emerald-200"
                                : isNow
                                ? isDark ? "bg-[#0A1628] border-[#059669]/40" : "bg-white border-emerald-300 shadow-md"
                                : isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm"
                            )}>
                            {/* Main row */}
                            <div className="flex items-center gap-3 px-4 py-3">
                              {/* Tap button */}
                              <motion.button whileTap={{ scale: 0.85 }}
                                onClick={() => toggleSlot(slot.time, kgPerSlot, slot.label)}
                                className={cn("w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all",
                                  isSynced
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                    : isNow
                                    ? "bg-[#059669] text-white shadow-md shadow-emerald-700/30"
                                    : isPast
                                    ? "bg-red-400/80 text-white"
                                    : isDark
                                    ? "bg-white/8 border border-white/10 text-white/40 hover:bg-white/15"
                                    : "bg-slate-100 border border-slate-200 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50"
                                )}>
                                {isSynced ? <CheckCircle2 size={17} /> : <Clock size={16} />}
                              </motion.button>

                              {/* Slot info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className={cn("font-black text-[13px] tracking-tight",
                                    isSynced ? isDark ? "text-emerald-400" : "text-emerald-700"
                                    : isDark ? "text-white/90" : "text-slate-800")}>
                                    {slot.label}
                                  </p>
                                  {isNow && !isSynced && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[6.5px] font-black uppercase tracking-widest">
                                      <span className="w-1 h-1 bg-white rounded-full animate-pulse inline-block" />NOW
                                    </span>
                                  )}
                                  {isPast && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-500 border border-red-500/20 text-[6.5px] font-black uppercase tracking-widest">Missed</span>
                                  )}
                                  {isSynced && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[6.5px] font-black uppercase tracking-widest">Logged âœ“</span>
                                  )}
                                </div>
                                <p className={cn("text-[8px] font-bold", isDark ? "text-white/30" : "text-slate-400")}>{slot.time}</p>
                              </div>

                              {/* Qty */}
                              <div className={cn("text-right px-3 py-2 rounded-xl border flex-shrink-0",
                                isSynced
                                  ? isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
                                  : isDark ? "bg-white/5 border-white/8" : "bg-slate-50 border-slate-200")}>
                                <p className={cn("text-lg font-black tracking-tighter leading-none",
                                  isSynced ? "text-emerald-500" : isDark ? "text-white" : "text-slate-900")}>{kgPerSlot}</p>
                                <p className={cn("text-[6.5px] font-black uppercase tracking-widest",
                                  isDark ? "text-white/25" : "text-slate-400")}>kg</p>
                              </div>
                            </div>

                            {/* Tray check footer */}
                            <div className={cn("px-4 py-2 border-t flex items-center justify-between",
                              isDark ? "bg-black/20 border-white/5" : "bg-slate-50/80 border-slate-100")}>
                              <div className="flex items-center gap-1.5">
                                <Eye size={9} className={isDark ? "text-white/25" : "text-slate-300"} />
                                <span className={cn("text-[7.5px] font-black uppercase tracking-widest",
                                  isDark ? "text-white/35" : "text-slate-400")}>Tray Check in {getTrayCheckTime(currentDoc)}</span>
                              </div>
                              <span className={cn("text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg",
                                isSynced
                                  ? isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                                  : isDark ? "bg-white/5 text-white/25" : "bg-white text-slate-400 border border-slate-100")}>
                                {isSynced ? 'Check Pending' : 'Awaiting Feed'}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                  TAB: SOP DATA
              â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
              {activeTab === 'sow' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className={cn("rounded-[2rem] border p-5 space-y-0",
                    isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
                    <p className={cn("text-[8px] font-black uppercase tracking-widest mb-4",
                      isDark ? "text-white/30" : "text-slate-400")}>Biomass Calculation</p>
                    {[
                      { label: 'Initial Stock', value: `${seedCount.toLocaleString()} PL`, color: 'text-blue-500' },
                      { label: 'Expected Survival Rate', value: `${survivalRate.toFixed(1)}%`, color: 'text-emerald-500' },
                      { label: 'Avg Body Weight (ABW)', value: `${sop.avgWeightG} g`, color: 'text-amber-500' },
                      { label: 'Current Population', value: `${currentPopulation.toLocaleString()} shrimp`, color: isDark ? 'text-white' : 'text-slate-800' },
                    ].map((row, i) => (
                      <div key={i} className={cn("flex justify-between items-center py-3 border-b last:border-0",
                        isDark ? "border-white/5" : "border-slate-100")}>
                        <span className={cn("text-[9px] font-bold", isDark ? "text-white/50" : "text-slate-500")}>{row.label}</span>
                        <span className={cn("text-[10px] font-black", row.color)}>{row.value}</span>
                      </div>
                    ))}
                    <div className={cn("mt-3 p-4 rounded-2xl border",
                      isDark ? "bg-emerald-500/5 border-emerald-500/15" : "bg-emerald-50 border-emerald-100")}>
                      <div className="flex justify-between items-center">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest",
                          isDark ? "text-emerald-400/70" : "text-emerald-700")}>Est. Total Biomass</span>
                        <span className={cn("text-xl font-black", isDark ? "text-emerald-400" : "text-emerald-700")}>
                          {biomassKg.toLocaleString()} <span className="text-xs opacity-60">kg</span>
                        </span>
                      </div>
                      <p className={cn("text-[7px] font-bold mt-1.5",
                        isDark ? "text-white/25" : "text-slate-400")}>
                        Formula: (Stock Ã— SR%) Ã— ABW Ã· 1000
                      </p>
                    </div>
                  </div>

                  <div className={cn("rounded-[2rem] border p-5",
                    isDark ? "bg-blue-500/5 border-blue-500/15" : "bg-blue-50 border-blue-100")}>
                    <p className={cn("text-[8px] font-black uppercase tracking-widest mb-2",
                      isDark ? "text-blue-400" : "text-blue-700")}>Feed Rate Formula Â· DOC {currentDoc}</p>
                    <p className={cn("text-[11px] font-black leading-snug",
                      isDark ? "text-white/70" : "text-slate-700")}>
                      {sop.feedRatePct > 0
                        ? `${biomassKg}kg biomass Ã— ${sop.feedRatePct}% feed rate = ${rawDailyKg}kg raw`
                        : `Blind feed phase: flat ${sop.staticKg}kg/day`}
                    </p>
                    {combinedFactor !== 1.0 && (
                      <p className={cn("text-[9px] font-black mt-2",
                        isDark ? "text-amber-400" : "text-amber-700")}>
                        After adjustments: {rawDailyKg}kg Ã— {combinedFactor.toFixed(2)} = <strong>{adjustedDailyKg}kg</strong>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                  TAB: FCR TRACK
              â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
              {activeTab === 'fcr' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">

                  {/* Big FCR Display */}
                  <div className={cn("rounded-[2rem] border p-6 text-center relative overflow-hidden",
                    isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[60%] blur-[60px] rounded-full"
                      style={{ background: fcrCritical ? 'rgba(239,68,68,0.08)' : fcrWarning ? 'rgba(251,191,36,0.08)' : 'rgba(52,211,153,0.08)' }} />
                    <div className="relative z-10">
                      <p className={cn("text-[8px] font-black uppercase tracking-[0.3em] mb-2",
                        isDark ? "text-white/30" : "text-slate-400")}>Live Feed Conversion Ratio</p>
                      <div className={cn("text-7xl font-black tracking-tighter mb-2",
                        fcrCritical ? 'text-red-500' : fcrWarning ? 'text-amber-500' : isDark ? 'text-emerald-400' : 'text-emerald-600')}>
                        {fcrValue > 0 ? fcrValue.toFixed(2) : 'â€”'}
                      </div>
                      <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[8.5px] font-black",
                        fcrCritical
                          ? isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
                          : fcrWarning
                          ? isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
                          : isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700')}>
                        {fcrCritical ? 'âš  High FCR â€” Check overfeeding' : fcrWarning ? 'â— Monitor closely' : 'âœ“ Excellent efficiency'}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Total Feed Logged', value: `${totalFeedConsumed} kg`, icon: Package, color: isDark ? 'text-white' : 'text-slate-800' },
                      { label: 'Est. Biomass', value: `${biomassKg} kg`, icon: Scale, color: 'text-emerald-500' },
                    ].map((s, i) => (
                      <div key={i} className={cn("rounded-[1.5rem] border p-4 text-center",
                        isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
                        <s.icon size={14} className={cn("mx-auto mb-2", s.color)} />
                        <p className={cn("text-lg font-black", s.color)}>{s.value}</p>
                        <p className={cn("text-[7px] font-black uppercase tracking-widest mt-0.5",
                          isDark ? "text-white/20" : "text-slate-400")}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* FCR Scale reference */}
                  <div className={cn("rounded-[1.5rem] border p-4",
                    isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
                    <p className={cn("text-[8px] font-black uppercase tracking-widest mb-3",
                      isDark ? "text-white/30" : "text-slate-400")}>FCR Reference Scale</p>
                    <div className="space-y-2">
                      {[
                        { range: '< 1.3', label: 'Excellent', color: 'bg-emerald-500', active: fcrValue < 1.3 && fcrValue > 0 },
                        { range: '1.3 â€“ 1.6', label: 'Normal', color: 'bg-amber-400', active: fcrValue >= 1.3 && fcrValue < 1.7 },
                        { range: '> 1.7', label: 'High â€” Review feed', color: 'bg-red-500', active: fcrValue >= 1.7 },
                      ].map((r, i) => (
                        <div key={i} className={cn("flex items-center gap-3 p-2.5 rounded-xl border transition-all",
                          r.active
                            ? isDark ? 'bg-white/5 border-white/15' : 'bg-slate-50 border-slate-200'
                            : isDark ? 'border-white/5' : 'border-transparent')}>
                          <div className={cn("w-2 h-6 rounded-full flex-shrink-0", r.color, !r.active && 'opacity-30')} />
                          <div className="flex-1">
                            <p className={cn("text-[9px] font-black", r.active ? isDark ? "text-white" : "text-slate-800" : isDark ? "text-white/30" : "text-slate-400")}>{r.range}</p>
                            <p className={cn("text-[7px] font-bold", isDark ? "text-white/20" : "text-slate-400")}>{r.label}</p>
                          </div>
                          {r.active && <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-white/10 text-white uppercase tracking-widest">Current</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent logs */}
                  {pondFeedLogs.length > 0 && (
                    <div className={cn("rounded-[1.5rem] border p-4",
                      isDark ? "bg-white/[0.03] border-white/8" : "bg-white border-slate-100 shadow-sm")}>
                      <p className={cn("text-[8px] font-black uppercase tracking-widest mb-3",
                        isDark ? "text-white/30" : "text-slate-400")}>Recent Feed Logs</p>
                      <div className="space-y-0">
                        {pondFeedLogs.slice(-5).reverse().map((log, i) => (
                          <div key={i} className={cn("flex items-center justify-between py-2.5 border-b last:border-0",
                            isDark ? "border-white/5" : "border-slate-100")}>
                            <div>
                              <p className={cn("text-[9px] font-black", isDark ? "text-white/70" : "text-slate-700")}>
                                {(log as any).slotLabel || new Date(log.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                              </p>
                              <p className={cn("text-[7px] font-bold", isDark ? "text-white/25" : "text-slate-400")}>
                                {(log as any).feedNo || 'Feed'} Â· {new Date(log.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                              </p>
                            </div>
                            <span className={cn("text-[11px] font-black", isDark ? "text-emerald-400" : "text-emerald-600")}>+{log.quantity}kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
