import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, Info, Droplets, Zap, AlertTriangle, CheckCircle2,
  Calendar, Clock, ShieldCheck, Thermometer, Wind, Waves, Pill,
  Moon, Sun, CloudRain, ShieldAlert, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { Translations } from '../translations';
import { calculateDOC } from '../utils/pondUtils';
import { getLunarStatus } from '../utils/lunarUtils';
import { cn } from '../utils/cn';
import { sop100Days } from '../utils/sopSchedule';

// ─── UTILS & GENERATORS ────────────────────────────────────────────────────────
const getSimulatedWeather = () => {
  const hour = new Date().getHours();
  const month = new Date().getMonth() + 1;
  const baseTemp = month >= 3 && month <= 5 ? 34 : month >= 6 && month <= 9 ? 30 : 27;
  const temp = baseTemp - (hour < 6 || hour > 18 ? 5 : 0);
  const isRaining = month >= 6 && month <= 9 && Math.random() > 0.7;
  const doLevel = temp > 32 ? 4.5 : isRaining ? 5.2 : 6.5; // ppm
  return { temp, isRaining, doLevel };
};

const getEnginePhase = (doc: number) => {
  if (doc <= 10) return { phase: 1, title: 'Phase 1: DOC 1–10', msg: 'Starter stage – maintain water stability', color: 'from-blue-500 to-indigo-600', iconColor: 'text-indigo-400', 
    tasks: [{ t: 'Feed', v: '4–5 times/day' }, { t: 'Probiotic', v: 'every 3 days' }, { t: 'Mineral', v: 'weekly' }] };
  if (doc <= 20) return { phase: 2, title: 'Phase 2: DOC 11–20', msg: 'Ammonia control important', color: 'from-emerald-500 to-green-600', iconColor: 'text-emerald-400',
    tasks: [{ t: 'Feed', v: 'Increase slowly' }, { t: 'Probiotic', v: 'Start gut probiotic' }, { t: 'Add-on', v: 'Zeolite reminder' }] };
  if (doc <= 30) return { phase: 3, title: 'Phase 3: DOC 21–30', msg: 'Disease risk starting – monitor shrimp', color: 'from-amber-400 to-orange-500', iconColor: 'text-amber-500',
    tasks: [{ t: 'Mineral', v: '2 times/week' }, { t: 'Probiotic', v: 'Alternate days' }, { t: 'Risk', v: 'Check for infections' }] };
  if (doc <= 45) return { phase: 4, title: 'Phase 4: DOC 31–45 (Critical)', msg: 'High risk of White Spot Syndrome', color: 'from-red-600 to-rose-700', iconColor: 'text-red-500',
    tasks: [{ t: 'Feed', v: '3–4 times' }, { t: 'Medicine', v: 'Immunity booster' }, { t: 'Aerator', v: 'Full time (24h)' }] };
  if (doc <= 60) return { phase: 5, title: 'Phase 5: DOC 46–60', msg: 'High biomass – oxygen demand high', color: 'from-blue-600 to-cyan-700', iconColor: 'text-cyan-400',
    tasks: [{ t: 'Feed', v: 'High feeding' }, { t: 'Medicine', v: 'Liver tonic' }, { t: 'Aerator', v: 'Extra aeration needed' }] };
  if (doc <= 80) return { phase: 6, title: 'Phase 6: DOC 61–80', msg: 'Growth stage – maintain stability', color: 'from-purple-600 to-fuchsia-700', iconColor: 'text-fuchsia-400',
    tasks: [{ t: 'Feed', v: 'Maintain volumes' }, { t: 'Mineral', v: 'High dose' }, { t: 'Check', v: 'Water toxicity check' }] };
  return { phase: 7, title: 'Phase 7: DOC 81–100', msg: 'Harvest planning stage', color: 'from-slate-800 to-black', iconColor: 'text-slate-400',
    tasks: [{ t: 'Feed', v: 'Reduce gradually' }, { t: 'Prep', v: 'Prepare for harvest' }, { t: 'Check', v: 'Size sampling' }] };
};

const getDailySchedule = (doc: number) => {
  // Simplified example derived from User's Example Day (DOC 35)
  if (doc <= 30) return [
    { time: '06:00 AM', task: 'Morning Feed', type: 'feed' },
    { time: '09:00 AM', task: 'Check Feed Trays', type: 'check' },
    { time: '10:00 AM', task: 'Mid-Morning Feed', type: 'feed' },
    { time: '02:00 PM', task: 'Afternoon Feed', type: 'feed' },
    { time: '06:00 PM', task: 'Evening Feed + Apply Probiotic', type: 'med' },
    { time: '09:00 PM', task: 'Aerator ON', type: 'aerator' },
  ];
  if (doc <= 60) return [ // User specifically mentioned DOC 35 example
    { time: '06:00 AM', task: 'Morning Feed', type: 'feed' },
    { time: '09:00 AM', task: 'Water Check (DO/pH)', type: 'check' },
    { time: '12:00 PM', task: 'Mid-Day Feed', type: 'feed' },
    { time: '03:00 PM', task: 'Afternoon Feed', type: 'feed' },
    { time: '06:00 PM', task: 'Apply Probiotic / Liver Tonic', type: 'med' },
    { time: '09:00 PM', task: 'Aerator Full ON', type: 'aerator' },
  ];
  return [ // DOC 60+ (3 feeds)
    { time: '06:00 AM', task: 'Morning Feed', type: 'feed' },
    { time: '10:00 AM', task: 'Water parameters check', type: 'check' },
    { time: '12:30 PM', task: 'Mid-Day Feed', type: 'feed' },
    { time: '05:30 PM', task: 'Evening Feed', type: 'feed' },
    { time: '07:00 PM', task: 'High Dose Minerals', type: 'med' },
    { time: '08:00 PM', task: 'Aerator 100% Capacity', type: 'aerator' },
  ];
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export const CultureSOP = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { ponds } = useData();
  const [selectedPondId, setSelectedPondId] = useState(id || ponds[0]?.id || '');
  
  const pond = ponds.find(p => p.id === selectedPondId);

  const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);

  if (!pond) return null;

  const currentDoc = calculateDOC(pond.stockingDate);
  const phaseInfo = getEnginePhase(currentDoc);
  const schedule = getDailySchedule(currentDoc);

  // Auto-scroll to today's row in the master schedule
  useEffect(() => {
    if (pond.status !== 'harvested') {
      setTimeout(() => {
        const todayRow = document.getElementById(`row-${currentDoc}`);
        if (todayRow) {
          todayRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [currentDoc, selectedPondId]);

  // External APIs / Environment
  const lunar = getLunarStatus(now);
  const weather = getSimulatedWeather();
  const isAmavasya = lunar.phase === 'AMAVASYA';
  const isAshtami = lunar.phase === 'ASHTAMI_NAVAMI';

  // Smart Alerts Logic
  const smartAlerts = [];
  if (weather.doLevel < 5) smartAlerts.push({ title: 'Increase aeration immediately', trigger: `DO < 5 (${weather.doLevel} ppm)`, type: 'critical' });
  if (currentDoc >= 30 && currentDoc <= 45) smartAlerts.push({ title: 'Disease risk extremely high', trigger: `DOC = ${currentDoc}`, type: 'warning' });
  if (weather.isRaining) smartAlerts.push({ title: 'Stop feeding temporarily & check salinity', trigger: 'Rain forecast', type: 'critical' });
  if (weather.temp < 25) smartAlerts.push({ title: 'Reduce feed + check shrimp stress', trigger: 'Temperature drop', type: 'warning' });
  // (In a real app, 'feed not consumed' would be derived from the tray check logs)

  return (
    <div className="pb-[400px] bg-[#F8F9FE] min-h-screen font-sans">
      
      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-[#02130F] text-white px-5 py-6 rounded-b-[2rem] shadow-xl">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-xl active:scale-95 transition-all">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <h1 className="text-sm font-black tracking-widest uppercase">Auto Schedule Engine</h1>
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-0.5">{pond.name}</p>
          </div>
          <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl relative">
             <Sparkles size={16} className="text-emerald-400" />
             <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Engine Input Parameters */}
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
           <div className="text-center">
              <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Stocking Date</p>
              <p className="text-xs font-black">{pond.stockingDate}</p>
           </div>
           <div className="bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-center">
              <p className="text-[7px] font-black text-emerald-300 uppercase tracking-[0.2em] mb-1">Auto Calc.</p>
              <p className="text-sm font-black text-white">DOC {currentDoc}</p>
           </div>
           <div className="text-center">
              <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Pond Size/Count</p>
              <p className="text-xs font-black">{pond.size} Ac / {(pond.seedCount/100000).toFixed(1)}L</p>
           </div>
        </div>
      </header>

      <div className="pt-[280px] px-5 space-y-6">
        
        {/* Pond Selector */}
        {!id && ponds.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none pt-[10px]">
            {ponds.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPondId(p.id)}
                className={cn(
                  'px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex-shrink-0',
                  selectedPondId === p.id ? 'bg-[#C78200] text-white border-[#C78200] shadow-lg' : 'bg-white text-[#4A2C2A]/40 border-black/5'
                )}
              >{p.name}</button>
            ))}
          </div>
        )}

        {pond.status === 'harvested' && (
          <div className="bg-slate-100 rounded-[2.5rem] p-8 text-center border border-black/5">
             <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-slate-400" />
             </div>
             <h2 className="text-xl font-black text-[#4A2C2A] tracking-tighter">Pond Harvested</h2>
             <p className="text-sm font-black text-[#4A2C2A]/40 mt-2 leading-relaxed">Active schedule, alerts, and suggestions are paused for this pond.</p>
          </div>
        )}

        {pond.status !== 'harvested' && (
          <>
            {/* ── 1. PHASE TRIGGER BANNER ── */}
        <div className={cn("p-6 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl bg-gradient-to-br", phaseInfo.color)}>
           <div className="absolute right-[-10%] top-[-10%] opacity-20 pointer-events-none">
              <Zap size={150} />
           </div>
           <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                 <div className="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-md">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white shadow-sm">{phaseInfo.title}</p>
                 </div>
              </div>
              <h2 className="text-2xl font-black tracking-tighter leading-tight mb-6">"{phaseInfo.msg}"</h2>
              
              <div className="grid grid-cols-3 gap-3">
                 {phaseInfo.tasks.map((task, i) => (
                   <div key={i} className="bg-black/20 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                      <p className="text-[7px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">{task.t}</p>
                      <p className="text-xs font-black tracking-tight leading-snug">{task.v}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* ── 2. DAILY AUTO SCHEDULE ── */}
        <div className="bg-white rounded-[2rem] p-6 border border-black/5 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black tracking-tighter text-[#4A2C2A]">Today's Plan</h3>
              <div className="bg-[#F8F9FE] px-2 py-1 rounded border border-black/5">
                <span className="text-[8px] font-black uppercase tracking-widest text-[#4A2C2A]/40">DOC {currentDoc} Gen.</span>
              </div>
           </div>
           <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-black/5 before:to-transparent">
              {schedule.map((item, i) => {
                const isMed = item.type === 'med';
                const isAerator = item.type === 'aerator';
                const isCheck = item.type === 'check';
                return (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className={cn(
                       "flex items-center justify-center w-9 h-9 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10",
                       isMed ? "bg-amber-400 text-white" : isAerator ? "bg-indigo-500 text-white" : isCheck ? "bg-blue-400 text-white" : "bg-[#C78200] text-white"
                     )}>
                        {isMed ? <Pill size={14} /> : isAerator ? <Wind size={14} /> : isCheck ? <Droplets size={14} /> : <CheckCircle2 size={14} />}
                     </div>
                     <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-[#F8F9FE] p-4 rounded-2xl border border-black/5 flex items-center justify-between shadow-sm">
                        <div>
                          <p className="font-black text-sm text-[#4A2C2A] tracking-tight">{item.task}</p>
                          <p className="text-[9px] font-black text-[#4A2C2A]/40 uppercase tracking-widest mt-0.5">{item.time}</p>
                        </div>
                     </div>
                  </div>
                )
              })}
           </div>
        </div>

        {/* ── 3. MOON CYCLE INTEGRATION ── */}
        <div className="bg-[#051F19] rounded-[2rem] p-6 border border-[#0D523C]/30 text-white shadow-lg relative overflow-hidden">
           <Moon size={100} className="absolute right-[-5%] top-[-5%] opacity-5 text-emerald-400" />
           <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                 <p className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5"><Moon size={12}/> Lunar Calendar Engine</p>
                 <h3 className="text-lg font-black tracking-tight">{lunar.phase === 'AMAVASYA' ? 'Amavasya Active' : lunar.phase === 'ASHTAMI_NAVAMI' ? 'Quarter Moon Active' : 'Normal Moon Phase'}</h3>
              </div>
           </div>
           
           <div className="space-y-3 relative z-10">
              {isAmavasya ? (
                <>
                  <LunarRule rule="Reduce feed (-20%)" desc="Mass molting prevents feeding" />
                  <LunarRule rule="Add minerals" desc="Required for new shell hardening" />
                  <LunarRule rule="Increase aeration" desc="DO drops heavily during molting" />
                </>
              ) : isAshtami ? (
                <>
                  <LunarRule rule="Add Mineral (Medium Dose)" desc="Partial molting support" />
                  <LunarRule rule="Light Probiotic" desc="Maintain gut health" />
                </>
              ) : (
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                  <p className="text-xs font-black text-emerald-300">No lunar restrictions today.</p>
                </div>
              )}
           </div>
        </div>

        {/* ── 4. WEATHER INTEGRATION ── */}
        <div className="grid grid-cols-2 gap-3">
           <div className={cn(
             "rounded-[2rem] p-5 border shadow-sm",
             weather.isRaining ? "bg-blue-50 border-blue-200" : "bg-white border-black/5"
           )}>
              <CloudRain size={20} className={cn("mb-3", weather.isRaining ? "text-blue-500" : "text-black/10")} />
              <p className="font-black text-xs text-[#4A2C2A] tracking-tight mb-1">Precipitation</p>
              {weather.isRaining ? (
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-relaxed">Alert: Stop feeding temporarily & check salinity.</p>
              ) : (
                <p className="text-[9px] font-black text-[#4A2C2A]/30 uppercase tracking-widest">Clear Skies. Standard SOP.</p>
              )}
           </div>
           <div className={cn(
             "rounded-[2rem] p-5 border shadow-sm",
             weather.temp < 25 ? "bg-cyan-50 border-cyan-200" : weather.temp > 33 ? "bg-red-50 border-red-200" : "bg-white border-black/5"
           )}>
              <Thermometer size={20} className={cn("mb-3", weather.temp < 25 ? "text-cyan-500" : weather.temp > 33 ? "text-red-500" : "text-black/10")} />
              <p className="font-black text-xs text-[#4A2C2A] tracking-tight mb-1">Temp ({weather.temp}°C)</p>
              {weather.temp < 25 ? (
                <p className="text-[9px] font-black text-cyan-600 uppercase tracking-widest leading-relaxed">Alert: Reduce feed + check shrimp stress.</p>
              ) : weather.temp > 33 ? (
                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest leading-relaxed">Alert: Heat stress. Lower noon feeds.</p>
              ) : (
                <p className="text-[9px] font-black text-[#4A2C2A]/30 uppercase tracking-widest">Optimal range. Standard SOP.</p>
              )}
           </div>
        </div>

        {/* ── 5. SMART ALERTS SYSTEM RECAP ── */}
        {(smartAlerts.length > 0 || weather.doLevel < 5) && (
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-red-500/20 relative overflow-hidden">
             <div className="flex items-center justify-between mb-4">
               <div>
                  <p className="text-red-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5"><ShieldAlert size={12}/> Condition Based Flags</p>
                  <h3 className="text-lg font-black tracking-tighter text-[#4A2C2A]">Smart Alerts</h3>
               </div>
               <div className="bg-red-50 w-10 h-10 rounded-xl flex items-center justify-center text-red-500">
                  <span className="font-black text-lg">{smartAlerts.length}</span>
               </div>
             </div>

             <div className="space-y-3">
                {smartAlerts.map((al, idx) => (
                  <div key={idx} className={cn(
                    "p-4 rounded-2xl border",
                    al.type === 'critical' ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
                  )}>
                     <div className="flex justify-between items-center mb-1">
                        <p className={cn("text-[9px] font-black uppercase tracking-widest", al.type === 'critical' ? "text-red-600/60" : "text-amber-600/60")}>
                           IF [{al.trigger}]
                        </p>
                     </div>
                     <p className={cn("font-black text-sm tracking-tight", al.type === 'critical' ? "text-red-600" : "text-amber-600")}>
                        👉 "{al.title}"
                     </p>
                  </div>
                ))}

                {smartAlerts.length === 0 && (
                   <div className="p-4 rounded-2xl border bg-emerald-50 border-emerald-200">
                     <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/60 mb-1">ALL SYSTEMS NOMINAL</p>
                     <p className="font-black text-sm tracking-tight text-emerald-700">No active risk flags dynamically detected.</p>
                   </div>
                )}
             </div>
          </div>
        )}
        </>
        )}

        {/* ── 6. FULL 100-DAY SCHEDULE TABLE ── */}
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
           <div className="p-5 border-b border-black/5 bg-[#F8F9FE]">
              <h3 className="font-black text-lg text-[#4A2C2A] tracking-tighter mb-1">100-Day Master Schedule</h3>
              <p className="text-[9px] font-black text-[#C78200] uppercase tracking-widest leading-relaxed">
                Feed logic specifically auto-scaled to {(pond.seedCount / 100000).toFixed(1)} Lakh seed density
              </p>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#4A2C2A] text-white">
                    <th className="p-4 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">DOC</th>
                    <th className="p-4 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Feed/Day (kg)</th>
                    <th className="p-4 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Action/Med</th>
                    <th className="p-4 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Alert / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {sop100Days.map((row) => {
                    const isToday = row.doc === currentDoc && pond.status !== 'harvested';
                    const feedScaled = Math.round(row.feed * (pond.seedCount / 200000));
                    return (
                      <tr 
                        key={row.doc} 
                        id={`row-${row.doc}`}
                        className={cn(
                          "transition-colors",
                          isToday ? "bg-[#C78200]/10 border-l-4 border-[#C78200]" : "hover:bg-[#F8F9FE] border-l-4 border-transparent"
                        )}
                      >
                        <td className="p-4 space-y-1">
                           {isToday && <span className="block text-[7px] font-black text-[#C78200] uppercase tracking-widest">TODAY</span>}
                           <span className={cn("font-black", isToday ? "text-[#C78200]" : "text-[#4A2C2A]")}>{row.doc}</span>
                        </td>
                        <td className="p-4 font-black text-[#0D523C]">{feedScaled} kg</td>
                        <td className="p-4 text-xs font-black text-[#4A2C2A]/70">{row.action}</td>
                        <td className="p-4 text-xs font-black text-red-500/80">{row.alert !== '—' ? `⚠️ ${row.alert}` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
             </table>
           </div>
        </div>

      </div>
    </div>
  );
};

// Subcomponent for Lunar Rules
const LunarRule = ({ rule, desc }: any) => (
  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/5 flex items-center gap-3">
    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
    <div>
      <p className="text-xs font-black text-emerald-300">{rule}</p>
      <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold mt-0.5">{desc}</p>
    </div>
  </div>
);
