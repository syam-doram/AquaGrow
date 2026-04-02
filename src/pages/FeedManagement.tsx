import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  Waves,
  CheckCircle2,
  Thermometer,
  Wind,
  Droplets,
  Zap,
  Scale,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { Header } from '../components/Header';
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

const buildFeedSlots = (count: number, t: Translations) => {
  if (count === 5) return [
    { time: '06:00 AM', hour: 6, label: t.morning1 },
    { time: '09:30 AM', hour: 9, label: t.morning2 },
    { time: '01:00 PM', hour: 13, label: t.afternoon },
    { time: '04:30 PM', hour: 16, label: t.evening1 },
    { time: '08:00 PM', hour: 20, label: t.evening2 }
  ];
  if (count === 4) return [
    { time: '06:00 AM', hour: 6, label: t.morning1 },
    { time: '10:00 AM', hour: 10, label: t.morning2 },
    { time: '03:00 PM', hour: 15, label: t.afternoon },
    { time: '07:00 PM', hour: 19, label: t.evening1 }
  ];
  return [
    { time: '07:00 AM', hour: 7, label: t.morning1 },
    { time: '12:00 PM', hour: 12, label: t.afternoon },
    { time: '05:00 PM', hour: 17, label: t.evening1 }
  ];
};

interface Adjustment { factor: number; label: string; reason: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; color: string; icon: React.ElementType; }
const getAdjustments = (weather: ReturnType<typeof getSimulatedWeather>, lunarPhase: 'AMAVASYA' | 'ASHTAMI' | 'NAVAMI' | 'NORMAL', t: Translations): Adjustment[] => {
  const adj: Adjustment[] = [];
  if (weather.temp >= 34) adj.push({ factor: 0.80, label: `${t.heatStress} -20%`, reason: `Temp ${weather.temp}°C`, severity: 'HIGH', color: 'text-red-500', icon: Thermometer });
  if (weather.isRaining) adj.push({ factor: 0.85, label: `${t.rainEvent} -15%`, reason: 'Rain lowers DO', severity: 'HIGH', color: 'text-blue-500', icon: Droplets });
  
  if (lunarPhase === 'AMAVASYA') adj.push({ factor: 0.75, label: `🌑 Amavasya -25%`, reason: 'Max molting', severity: 'HIGH', color: 'text-indigo-500', icon: Zap });
  else if (lunarPhase === 'ASHTAMI') adj.push({ factor: 0.90, label: `🌓 Ashtami -10%`, reason: 'Molting start', severity: 'MEDIUM', color: 'text-violet-500', icon: Zap });
  else if (lunarPhase === 'NAVAMI') adj.push({ factor: 0.85, label: `🌙 Navami -15%`, reason: 'Molting peak', severity: 'HIGH', color: 'text-purple-500', icon: Zap });

  if (weather.doLevel === 'LOW') adj.push({ factor: 0.70, label: `${t.lowDOAdjustment} -30%`, reason: 'Low oxygen', severity: 'HIGH', color: 'text-red-600', icon: Waves });
  return adj;
};

export const FeedManagement = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, feedLogs } = useData();
  const [selectedPondId, setSelectedPondId] = useState(ponds[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'schedule' | 'fcr'>('schedule');
  const [now, setNow] = useState(new Date());
  const [weather] = useState(getSimulatedWeather());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedPond = ponds.find(p => p.id === selectedPondId);
  const currentDoc = selectedPond ? calculateDOC(selectedPond.stockingDate) : 0;
  const sop = useMemo(() => getSopData(currentDoc), [currentDoc]);
  const feedSlots = useMemo(() => buildFeedSlots(sop.slotCount, t), [sop.slotCount, t]);
  const lunar = useMemo(() => getLunarStatus(new Date()), []);
  const adjustments = useMemo(() => getAdjustments(weather, lunar.phase, t), [weather, lunar.phase, t]);
  const combinedFactor = useMemo(() => Math.max(0.5, adjustments.reduce((acc, a) => acc * a.factor, 1.0)), [adjustments]);

  const seedCount = selectedPond?.seedCount || 100000;
  const biomassKg = Math.round((seedCount * sop.survivalPct * sop.avgWeightG) / 1000);
  const rawDailyKg = sop.feedRatePct === 0 ? sop.staticKg : Math.round((biomassKg * sop.feedRatePct) / 100);
  const adjustedDailyKg = Math.round(rawDailyKg * combinedFactor);
  const kgPerSlot = (adjustedDailyKg / (sop.slotCount || 1)).toFixed(1);

  const nextFeedSlot = feedSlots.find(s => s.hour > now.getHours()) || feedSlots[0];
  const targetTime = new Date();
  targetTime.setHours(nextFeedSlot.hour, nextFeedSlot.hour === 6 ? 0 : 30, 0);
  if (nextFeedSlot.hour <= now.getHours()) targetTime.setDate(targetTime.getDate() + 1);
  const diffMs = targetTime.getTime() - now.getTime();
  const countdownH = Math.floor(diffMs / (1000 * 60 * 60));
  const countdownM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="pb-40 bg-transparent min-h-screen text-left relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-10 right-[-10%] w-[70%] h-[30%] bg-emerald-100/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-[10%] left-[-10%] w-[60%] h-[40%] bg-amber-50/10 rounded-full blur-[120px] -z-10" />

      <Header 
        title={t.feedManagement} 
        showBack={true} 
        onMenuClick={onMenuClick} 
        rightElement={selectedPond && (
          <div className="bg-white/80 backdrop-blur-md border border-black/5 px-4 py-2 rounded-full shadow-sm">
            <span className="text-[9px] font-black text-[#0D523C] uppercase tracking-widest">{t.doc} {currentDoc}</span>
          </div>
        )}
      />

      <div className="px-6 py-4 space-y-6 pt-24">
        {ponds.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {ponds.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPondId(p.id)}
                className={cn(
                  'px-6 py-3.5 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex-shrink-0',
                  selectedPondId === p.id ? 'bg-[#0D523C] text-white border-[#0D523C] shadow-lg' : 'bg-white/60 backdrop-blur-md text-[#4A2C2A]/40 border-black/5'
                )}
              >{p.name}</button>
            ))}
          </div>
        )}

        {!selectedPond ? (
           <div className="bg-white/80 backdrop-blur-md rounded-[3rem] p-10 text-center border border-black/5 shadow-xl mt-8">
             <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                <Waves size={48} className="text-emerald-600/30" />
             </div>
             <h2 className="text-2xl font-black text-[#4A2C2A] leading-tight mb-2">{t.noActivePonds}</h2>
             <button onClick={() => navigate('/ponds')} className="bg-[#0D523C] text-white px-10 py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl mt-4">
               {t.addPond}
             </button>
           </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Thermometer, label: t.temperature, value: `${weather.temp}°C`, color: weather.temp >= 34 ? 'text-red-500' : 'text-amber-500' },
                { icon: Droplets, label: t.humidity, value: `${weather.humidity}%`, color: 'text-blue-500' },
                { icon: Wind, label: t.wind, value: `${weather.windSpeed}k/h`, color: 'text-slate-500' },
                { icon: Waves, label: 'DO', value: weather.doLevel, color: weather.doLevel === 'LOW' ? 'text-red-500' : 'text-emerald-500' },
              ].map((item, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 text-center border border-black/5 shadow-sm">
                  <item.icon size={14} className={cn('mx-auto mb-1', item.color)} />
                  <p className="text-[7px] font-black text-[#4A2C2A]/30 uppercase tracking-widest">{item.label}</p>
                  <p className={cn('text-[9px] font-black mt-0.5', item.color)}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-[2.8rem] p-7 shadow-xl border border-black/5 relative overflow-hidden">
              <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                  <p className="text-[9px] font-black text-[#C78200] uppercase tracking-widest bg-[#C78200]/10 px-4 py-1.5 rounded-full w-max mb-2">{t.scheduleSync}</p>
                  <p className="text-[#4A2C2A] font-black text-2xl tracking-tighter">{t.nextFeed}</p>
                </div>
                <div className="flex gap-2">
                  <div className="bg-[#F8F9FE] px-5 py-3 rounded-2xl text-center border border-black/5 shadow-inner">
                    <p className="text-3xl font-black tracking-tighter text-[#0D523C] mb-1">{countdownH.toString().padStart(2, '0')}</p>
                    <p className="text-[8px] font-black text-black/30 uppercase tracking-widest">{t.hrs}</p>
                  </div>
                  <div className="bg-[#F8F9FE] px-5 py-3 rounded-2xl text-center border border-black/5 shadow-inner">
                    <p className="text-3xl font-black tracking-tighter text-[#0D523C] mb-1">{countdownM.toString().padStart(2, '0')}</p>
                    <p className="text-[8px] font-black text-black/30 uppercase tracking-widest">{t.min}</p>
                  </div>
                </div>
              </div>
              <p className="text-center font-black text-base text-[#4A2C2A]">{nextFeedSlot.label} ({nextFeedSlot.time}) — <span className="text-[#C78200]">{kgPerSlot} kg {t.dose}</span></p>
            </div>

            {adjustments.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2.5rem] p-6 bg-red-50/80 backdrop-blur-md border border-red-200/40 shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <p className="font-black text-red-900 text-base tracking-tight">{t.adjustmentsActive}</p>
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{Math.round((1 - combinedFactor) * 100)}% {t.feedReductionApplied}</p>
                  </div>
                </div>
                <div className="space-y-2">
                   {adjustments.map((a, i) => (
                     <div key={i} className="flex justify-between items-center bg-white/40 p-3 rounded-2xl border border-red-200/10">
                        <span className="text-[9px] font-black text-red-800 uppercase tracking-widest">{a.label}</span>
                        <span className="text-[8px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full">{a.severity}</span>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}

            <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-[2.2rem] border border-black/5 shadow-inner">
               {(['schedule', 'fcr'] as const).map(tab => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={cn(
                     "flex-1 py-4 rounded-[1.6rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                     activeTab === tab ? "bg-[#0D523C] text-white shadow-xl" : "text-[#4A2C2A]/30"
                   )}
                 >
                   {tab === 'schedule' ? t.docFeedPlan : t.metricsFcr}
                 </button>
               ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'schedule' && (
                <motion.div key="schedule" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                  <div className="bg-gradient-to-br from-[#051F19] to-[#0D523C] p-7 rounded-[2.8rem] shadow-2xl text-white relative overflow-hidden">
                     <div className="relative z-10 space-y-6 text-left">
                        <div className="flex justify-between items-start border-b border-white/5 pb-5">
                           <div>
                              <p className="text-emerald-400/60 text-[9px] font-black uppercase tracking-[0.3em] mb-2"><Scale size={14} className="inline mr-2"/>{t.estimatedBiomass}</p>
                              <p className="text-4xl font-black tracking-tighter">{biomassKg.toLocaleString()} <span className="text-xl text-emerald-400">kg</span></p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="bg-black/20 p-4 rounded-3xl border border-white/5 flex-1 text-center">
                              <p className="text-2xl font-black">{biomassKg}</p>
                              <p className="text-white/30 text-[8px] font-black uppercase tracking-widest mt-1">{t.baseKg}</p>
                           </div>
                           <span className="text-white/20 text-xl font-black">×</span>
                           <div className="bg-black/20 p-4 rounded-3xl border border-white/5 flex-1 text-center">
                              <p className="text-2xl font-black text-emerald-400">{sop.feedRatePct || t.fixed}%</p>
                              <p className="text-white/30 text-[8px] font-black uppercase tracking-widest mt-1">{t.rate}</p>
                           </div>
                           <span className="text-white/20 text-xl font-black">=</span>
                           <div className="bg-amber-500 p-4 rounded-3xl flex-1 text-center">
                              <p className="text-2xl font-black text-indigo-950">{rawDailyKg}</p>
                              <p className="text-indigo-950/40 text-[8px] font-black uppercase tracking-widest mt-1">{t.grossKg}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h2 className="text-[#4A2C2A] font-black text-xl px-1 tracking-tighter">{t.todaysSequence}</h2>
                     <motion.div className="space-y-3" variants={{ show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show">
                       {feedSlots.map((slot, i) => {
                         const isNow = now.getHours() === slot.hour;
                         const isPast = now.getHours() > slot.hour;
                         return (
                           <motion.div 
                             key={i} 
                             variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                             className={cn(
                               "bg-white/90 rounded-[2.5rem] px-7 py-6 border shadow-sm flex items-center gap-5",
                               isNow ? "border-[#C78200] ring-4 ring-[#C78200]/10" : "border-black/5 opacity-80"
                             )}
                           >
                              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white", isNow ? 'bg-[#C78200]' : isPast ? 'bg-emerald-500' : 'bg-slate-200')}>
                                 {isPast ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                              </div>
                              <div className="flex-1">
                                 <p className={cn("font-black text-base", isNow ? "text-[#C78200]" : "text-[#4A2C2A]")}>{slot.label}</p>
                                 <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">{slot.time}</p>
                              </div>
                              <p className="font-black text-xl text-[#0D523C]">{kgPerSlot}<span className="text-xs ml-1 opacity-40">kg</span></p>
                           </motion.div>
                         );
                       })}
                     </motion.div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'fcr' && (
                <motion.div key="fcr" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                  {(() => {
                    const totalFeedConsumed = feedLogs.filter(l => l.pondId === selectedPondId).reduce((acc, l) => acc + l.quantity, 0);
                    const currentFcr = biomassKg > 0 ? (totalFeedConsumed / biomassKg).toFixed(2) : '0.00';
                    return (
                      <div className="bg-[#051F19] p-10 rounded-[3rem] text-center shadow-2xl">
                         <p className="text-emerald-400/40 text-[10px] font-black uppercase tracking-[0.4em] mb-6">{t.feedConversionRatio}</p>
                         <div className="text-8xl font-black tracking-tighter text-emerald-500 mb-4">{currentFcr}</div>
                         <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-white/5">
                            <div>
                               <p className="text-white/20 text-[8px] font-black uppercase">{t.totalFeed}</p>
                               <p className="text-white font-black text-2xl">{totalFeedConsumed}kg</p>
                            </div>
                            <div>
                               <p className="text-white/20 text-[8px] font-black uppercase">{t.estimatedBiomass}</p>
                               <p className="text-white font-black text-2xl">{biomassKg}kg</p>
                            </div>
                         </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};
