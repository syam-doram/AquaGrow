import React, { useState } from 'react';
import { 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Bluetooth,
  Wifi,
  RefreshCcw,
  X,
  ShieldCheck,
  Activity,
  FlaskConical,
  Waves,
  Zap,
  Wind,
  Thermometer,
  Droplets,
  Plus
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Bar,
  Line,
  ComposedChart
} from 'recharts';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { Header } from '../../components/Header';
import { format, subDays, isSameDay, addDays, startOfToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { iotService, SensorData } from '../../services/iotService';
import { motion } from 'motion/react';
import { calculateDOC } from '../../utils/pondUtils';

export const WaterMonitoring = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, waterRecords, isPro, addWaterRecord } = useData();
  const [selectedPondId, setSelectedPondId] = useState(ponds[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionType, setConnectionType] = useState<'BLE' | 'WiFi' | null>(null);
  const [liveData, setLiveData] = useState<SensorData | null>(null);

  const selectedPond = ponds.find(p => p.id === selectedPondId);

  // DATE STR FOR FILTERING
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const latestRecord = waterRecords
    .filter(r => r.pondId === selectedPondId && (r.date === dateStr || isSameDay(new Date(r.date), selectedDate)))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const calculateOverallHealth = (record: any) => {
    if (!record) return { score: 0, status: 'NO DATA', color: 'text-slate-300', bg: 'bg-slate-50' };
    
    let points = 100;
    
    // pH: 7.5 - 8.5 is ideal
    if (record.ph < 7.0 || record.ph > 9.0) points -= 25;
    else if (record.ph < 7.5 || record.ph > 8.5) points -= 10;
    
    // DO: > 5.0 is ideal
    if (record.do < 4.0) points -= 35;
    else if (record.do < 5.0) points -= 15;
    
    // Salinity: 10 - 20 ppt
    if (record.salinity < 5 || record.salinity > 30) points -= 15;
    else if (record.salinity < 10 || record.salinity > 20) points -= 5;
    
    // Ammonia: < 0.05
    if (record.ammonia && record.ammonia > 0.1) points -= 30;
    else if (record.ammonia && record.ammonia > 0.05) points -= 15;
    
    const score = Math.max(0, points);
    if (score >= 90) return { score, status: 'EXCELLENT', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (score >= 70) return { score, status: 'STABLE', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (score >= 50) return { score, status: 'WARNING', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    return { score, status: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500/10' };
  };

  const health = calculateOverallHealth(isLiveMode ? liveData : latestRecord);

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(selectedDate, 6 - i);
    const dStr = format(d, 'yyyy-MM-dd');
    const record = waterRecords.find(r => r.pondId === selectedPondId && (r.date === dStr || isSameDay(new Date(r.date), d)));
    
    return {
      name: format(d, 'EEE').toUpperCase(),
      value: record?.do || (latestRecord?.do || 5.0) + (Math.random() - 0.5), 
      ph: record?.ph || (latestRecord?.ph || 7.8) + (Math.random() * 0.2 - 0.1),
    };
  });

  const handleSyncIoT = async (type: 'BLE' | 'WiFi') => {
    if (!isPro) {
      navigate('/subscription');
      return;
    }

    setIsConnecting(true);
    setConnectionType(type);

    try {
       const data = type === 'BLE' 
          ? await iotService.connectViaBluetooth()
          : await iotService.syncViaFirebase(selectedPondId);

       if (data && selectedPondId) {
          setLiveData(data);
          setIsLiveMode(true);
          
          await addWaterRecord({
            pondId: selectedPondId,
            date: format(new Date(), 'yyyy-MM-dd'),
            ph: data.ph,
            do: data.do,
            ammonia: 0.02, 
            salinity: data.salinity,
            temperature: data.temp,
            isSynced: true
          });
       } else {
          throw new Error("Device data not retrieved.");
       }
    } catch (err) {
       console.error("Sync Failure:", err);
       alert(`Could not find ${type} Sensor Node. Please check probe power or range.`);
    } finally {
       setIsConnecting(false);
       setConnectionType(null);
    }
  };

  return (
    <div className="pb-40 bg-[#FFFDF5] min-h-screen text-left font-sans relative overflow-x-hidden">
      {/* ── BACKGROUND ACCENTS ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#FFFDF5]">
         <div className="absolute top-0 right-0 w-full h-[45%] bg-gradient-to-b from-[#012B1D] to-[#FFFDF5]" />
         <div className="absolute top-[10%] right-[-10%] w-[70%] h-[40%] bg-emerald-400/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <Header title={t.monitor} showBack onMenuClick={onMenuClick} />
      
      {/* ── STAGGERED CONTENT ── */}
      {ponds.length === 0 ? (
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="pt-32 px-10 flex flex-col items-center text-center gap-10"
         >
            <div className="relative">
               <div className="w-24 h-24 rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-center shadow-xl relative z-10">
                  <Waves size={40} className="text-[#C78200]" />
               </div>
               <div className="absolute inset-0 bg-[#C78200]/10 rounded-full blur-[40px] animate-pulse" />
            </div>
            
            <div className="space-y-4">
               <h2 className="text-2xl font-black text-white tracking-tighter uppercase tracking-[0.2em]">Zero Active Ponds</h2>
               <p className="text-white/40 text-sm font-bold leading-relaxed px-4">
                  Tactical monitoring requires at least one active sector. Initialize your first pond to begin autonomous health scans.
               </p>
            </div>
            
            <button 
              onClick={() => navigate('/ponds')}
              className="mt-6 w-full py-5 bg-[#C78200] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-amber-900/30 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
               <Plus size={20} />
               Launch First Pond
            </button>
         </motion.div>
      ) : (
         <motion.div 
           initial="hidden"
           animate="show"
           variants={{
             hidden: { opacity: 0 },
             show: {
               opacity: 1,
               transition: {
                 staggerChildren: 0.1
               }
             }
           }}
           className="pt-24 space-y-6 relative z-10"
         >
           
           {/* 📋 1. POND SWEEP RAIL (TACTICAL CHIPS) */}
           <motion.section 
             variants={{
                hidden: { opacity: 0, x: 20 },
                show: { opacity: 1, x: 0 }
             }}
             className="px-5"
           >
              <div className="flex justify-between items-center mb-4 px-1">
                 <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Sector Audit</h2>
                 <div className="flex items-center gap-1.5 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/20">
                    <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">{ponds.length} Active Ponds</span>
                 </div>
              </div>
              
              <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide -mx-5 px-5 pt-1">
                 {ponds.map(p => {
                    const pRecord = waterRecords
                       .filter(r => r.pondId === p.id && (r.date === dateStr || isSameDay(new Date(r.date), selectedDate)))
                       .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                    const pHealth = calculateOverallHealth(pRecord);
                    const isActive = selectedPondId === p.id;
                    const pondDoc = calculateDOC(p.stockingDate, dateStr);

                    return (
                       <motion.button 
                         key={p.id}
                         onClick={() => setSelectedPondId(p.id)}
                         whileTap={{ scale: 0.95 }}
                         className={cn(
                           "flex-shrink-0 min-w-[125px] p-4 rounded-[1.8rem] border transition-all relative overflow-hidden group",
                           isActive 
                             ? "bg-white border-white shadow-[0_20px_40px_rgba(0,0,0,0.1)] scale-105 z-10" 
                             : "bg-white/5 border-white/10 backdrop-blur-md shadow-sm"
                         )}
                       >
                          {/* Subtle Glow for Active */}
                          {isActive && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50" />}
                          
                          <div className="relative z-10 flex flex-col items-start text-left">
                             <div className="flex justify-between w-full items-start mb-2.5">
                                <div className={cn(
                                  "w-1.5 h-1.5 rounded-full ring-4 ring-transparent",
                                  pHealth.score >= 90 ? "bg-emerald-500 ring-emerald-500/10" : 
                                  pHealth.score >= 70 ? "bg-blue-500 ring-blue-500/10" : 
                                  pHealth.score >= 50 ? "bg-amber-500 ring-amber-500/10" : "bg-red-500 ring-red-500/10",
                                  pHealth.score > 0 && "animate-pulse"
                                )} />
                                <span className={cn(
                                   "text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                   isActive ? "bg-emerald-50 border-emerald-100 text-[#C78200]" : "bg-white/10 border-white/10 text-white/40"
                                )}>
                                   D{pondDoc}
                                </span>
                             </div>

                             <h4 className={cn("text-xs font-black tracking-tight mb-0.5", isActive ? "text-slate-800" : "text-white")}>{p.name}</h4>
                             <p className={cn("text-[8px] font-black uppercase tracking-widest mb-1", isActive ? "text-slate-400" : "text-white/30")}>{pHealth.status}</p>
                             
                             <div className="mt-2.5 pt-2.5 border-t w-full border-black/5 flex items-baseline gap-1">
                                <p className={cn("text-xl font-black tracking-tighter leading-none", isActive ? pHealth.color : "text-white")}>
                                   {pHealth.score}%
                                </p>
                                <span className={cn("text-[7px] font-black uppercase tracking-widest", isActive ? "text-slate-300" : "text-white/20")}>Health</span>
                             </div>
                          </div>
                       </motion.button>
                    );
                 })}
              </div>
           </motion.section>

           {/* 📅 2. PERSISTENT TIMELINE (HORIZONTAL DATE RAIL) */}
           <motion.section 
             variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 }
             }}
             className="px-5"
           >
              <div className="bg-white border-x border-b border-black/5 rounded-[2.2rem] p-5 shadow-sm relative overflow-hidden">
                 <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                       <Calendar size={14} className="text-[#C78200]" />
                       <h3 className="text-[10px] font-black text-slate-800 tracking-tight uppercase opacity-60">Culture Chronology</h3>
                    </div>
                    <p className="text-[9px] font-black text-[#C78200] uppercase tracking-[0.2em]">Start: {selectedPond ? format(new Date(selectedPond.stockingDate), 'MMM d') : '--'}</p>
                 </div>

                 <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 mask-fade-edges">
                    {(() => {
                       if (!selectedPond) return null;
                       const start = new Date(selectedPond.stockingDate);
                       const today = startOfToday();
                       // Show from start date to today
                       const totalDays = Math.max(0, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))) + 1;
                       
                       return Array.from({ length: totalDays }).map((_, i) => {
                          const currentD = addDays(start, i);
                          const isActive = isSameDay(currentD, selectedDate);
                          const docCount = i + 1;

                          return (
                             <button 
                               key={i}
                               onClick={() => setSelectedDate(currentD)}
                               className={cn(
                                  "flex-shrink-0 w-12 py-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all active:scale-[0.98] border",
                                  isActive 
                                    ? "bg-[#C78200] border-[#C78200] text-white shadow-lg shadow-amber-500/20" 
                                    : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                               )}
                             >
                                <span className={cn("text-[6px] font-black uppercase tracking-widest leading-none", isActive ? "text-white/60" : "text-slate-300")}>
                                   {format(currentD, 'EEE')}
                                </span>
                                <span className="text-xs font-black leading-none">{format(currentD, 'd')}</span>
                                <div className={cn("mt-1 px-1.5 py-0.5 rounded-full text-[5px] font-black uppercase tracking-tighter", isActive ? "bg-white/20 text-white" : "bg-white border border-slate-200 text-slate-400")}>
                                   D{docCount}
                                </div>
                             </button>
                          );
                       });
                    })()}
                 </div>
              </div>
           </motion.section>

           {/* 🚀 3. TACTICAL IoT NODE LINK */}
           <motion.section 
             variants={{
                hidden: { opacity: 0, y: 15 },
                show: { opacity: 1, y: 0 }
             }}
             className="px-5"
           >
              <div className={cn(
                "rounded-[2.2rem] p-6 flex flex-col gap-5 border shadow-xl transition-all duration-700 relative overflow-hidden group",
                isLiveMode 
                  ? "bg-[#02130F] border-emerald-500/30 shadow-emerald-900/10" 
                  : "bg-white border-white shadow-slate-200/40"
              )}>
                 {/* Background Accent for Active Node */}
                 {isLiveMode && <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 blur-[40px] rounded-full" />}
                 
                 <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                       <div className={cn(
                         "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
                         isLiveMode ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-slate-50 text-slate-300"
                       )}>
                          {isConnecting ? <RefreshCcw size={22} className="animate-spin" /> : (isLiveMode ? <Activity size={22} className="animate-pulse" /> : <TrendingUp size={22} />)}
                       </div>
                       <div>
                          <p className={cn(
                            "text-[8px] font-black uppercase tracking-[0.2em] mb-0.5",
                            isLiveMode ? "text-emerald-500" : "text-slate-300"
                          )}>
                             {isLiveMode ? `• NODE AG-${selectedPond?.id?.slice(-3).toUpperCase()} ACTIVE` : 'Sensor Node Link'}
                          </p>
                          <h3 className={cn(
                            "text-lg font-black tracking-tighter",
                            isLiveMode ? "text-white" : "text-slate-800"
                          )}>
                             {isConnecting ? `Linking via ${connectionType}...` : (isLiveMode ? `Live Analytics: ${selectedPond?.name}` : 'Hub on Standby')}
                          </h3>
                       </div>
                    </div>
                    {isLiveMode && (
                       <button 
                         onClick={() => setIsLiveMode(false)}
                         className="w-10 h-10 bg-red-500/10 text-red-500 rounded-full border border-red-500/10 active:scale-90 transition-all flex items-center justify-center"
                       >
                          <X size={16} />
                       </button>
                    )}
                 </div>

                 {!isLiveMode && !isConnecting && (
                    <div className="flex gap-3 relative z-10">
                       <button 
                         onClick={() => handleSyncIoT('BLE')}
                         className="flex-1 bg-white border border-slate-100 p-4 rounded-2xl flex flex-col items-center gap-2 group hover:border-[#C78200]/20 transition-all active:scale-95 shadow-sm"
                       >
                          <Bluetooth size={20} className="text-[#C78200]" />
                          <span className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 group-hover:text-[#C78200]">Direct Bluetooth</span>
                       </button>
                       <button 
                        onClick={() => handleSyncIoT('WiFi')}
                        className="flex-1 bg-white border border-slate-100 p-4 rounded-2xl flex flex-col items-center gap-2 group hover:border-emerald-500/20 transition-all active:scale-95 shadow-sm"
                       >
                          <Wifi size={20} className="text-emerald-500" />
                          <span className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-500">Cloud Sync</span>
                       </button>
                    </div>
                 )}

                 {isConnecting && (
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden relative z-10">
                       <motion.div 
                         animate={{ x: [-100, 400] }} 
                         transition={{ repeat: Infinity, duration: 1.5 }} 
                         className="h-full w-1/3 bg-emerald-500" 
                       />
                    </div>
                 )}
              </div>
           </motion.section>

           {/* 🌟 3. COMPACT HEALTH GAUGE & AUDIT */}
           <motion.section 
             variants={{
                hidden: { opacity: 0, scale: 0.95 },
                show: { opacity: 1, scale: 1 }
             }}
             className="px-5"
           >
              <div className={cn(
                 "rounded-[2.2rem] p-6 transition-all duration-700 relative overflow-hidden backdrop-blur-3xl shadow-xl shadow-emerald-950/10 border-x border-t",
                 isLiveMode ? "bg-[#02130F] border-emerald-500/30" : "bg-white border-white"
              )}>
                 <div className="relative z-10 flex items-center justify-between">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                       {/* Futuristic SVG Ring - COMPACT */}
                       <svg className="absolute w-full h-full -rotate-90">
                          <circle cx="64" cy="64" r="58" strokeWidth="8" stroke="rgba(0,0,0,0.03)" fill="none" />
                          <circle 
                            cx="64" cy="64" r="58" strokeWidth="8" 
                            stroke="currentColor" 
                            strokeDasharray={365} 
                            strokeDashoffset={365 - (365 * health.score) / 100}
                            className={cn("transition-all duration-1000 ease-out fill-none", isLiveMode ? "text-emerald-500" : health.color)}
                            strokeLinecap="round"
                          />
                          <circle cx="64" cy="64" r="58" strokeWidth="1" stroke="white" strokeDasharray="2 8" fill="none" className="opacity-10 animate-spin" style={{ animationDuration: '8s' }} />
                       </svg>
                       <div className="text-center z-10">
                          <div className="flex items-center gap-1 justify-center mb-0.5">
                             <p className={cn("text-[7px] font-black uppercase tracking-[0.3em] leading-none", isLiveMode ? "text-emerald-500" : "text-slate-400")}>Security</p>
                          </div>
                          <h2 className={cn("text-3xl font-black tracking-tighter leading-none mt-1", isLiveMode ? "text-white" : "text-slate-800")}>{health.score}%</h2>
                          <div className="bg-[#C78200]/10 px-1.5 py-0.5 rounded-full border border-[#C78200]/10 inline-block mt-2">
                             <span className="text-[5px] font-black text-[#C78200] uppercase tracking-widest whitespace-nowrap">
                                {(() => {
                                   const count = [latestRecord?.ph, latestRecord?.do, latestRecord?.salinity, latestRecord?.ammonia, latestRecord?.alkalinity, latestRecord?.turbidity, latestRecord?.temperature, latestRecord?.mortality].filter(v => v !== undefined).length;
                                   return `${count}/8 AUDITED`;
                                })()}
                             </span>
                          </div>
                       </div>
                    </div>

                    <div className="flex-1 pl-6 flex flex-col items-start gap-4">
                       <div className={cn("px-6 py-2.5 rounded-xl border flex items-center gap-2.5 transition-all shadow-sm", 
                          isLiveMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : `${health.bg} ${health.color.replace('text-', 'border-')} ${health.color}`
                       )}>
                          <ShieldCheck size={14} className="animate-pulse" />
                          <span className="text-[8px] font-black uppercase tracking-[0.3em]">{health.status}</span>
                       </div>

                       <div className={cn(
                          "w-full rounded-2xl p-4 border transition-all",
                          isLiveMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100 shadow-inner"
                       )}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                             <Activity size={8} className="text-[#C78200]" />
                             <p className={cn("text-[7px] font-bold uppercase tracking-widest leading-none", isLiveMode ? "text-white/40" : "text-slate-400")}>Tactical Scan</p>
                          </div>
                          <p className={cn("text-[9px] font-bold leading-snug line-clamp-2", isLiveMode ? "text-white/60" : "text-slate-600")}>
                             {health.score >= 90 ? "Stable. Maintain SOP." : "Alert: Fluctuation. Check DO levels."}
                          </p>
                       </div>
                    </div>
                 </div>
              </div>
           </motion.section>

           {/* ⚡ 4. VITAL METRICS GRID (ELITE TILES) */}
           <motion.section 
             variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
             }}
             className="px-5 pb-10"
           >
              <div className="flex justify-between items-center mb-5 px-1 pt-4">
                 <div className="flex flex-col">
                    <h2 className="text-xl font-black text-slate-800 tracking-tighter leading-none">{isLiveMode ? 'Live Analytics' : 'Farmer Audit Data'}</h2>
                    <p className="text-[7px] font-black text-[#C78200] uppercase tracking-[0.2em] mt-1.5">{isLiveMode ? 'REAL-TIME SENSOR FEED' : 'MANUALLY VERIFIED LOGS'}</p>
                 </div>
                 <div className="flex gap-2">
                    <button className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#C78200] transition-colors shadow-sm">
                       <History size={16} />
                    </button>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: t.phLevel, val: latestRecord?.ph, unit: '', target: '7.5-8.5', icon: FlaskConical, warn: (v: any) => v < 7.5 || v > 8.5 },
                   { label: t.dissolvedO2, val: latestRecord?.do, unit: 'mg/L', target: '>5.0', icon: Wind, warn: (v: any) => v < 5.0 },
                   { label: t.salinity, val: latestRecord?.salinity, unit: 'ppt', target: '10-20', icon: Waves, warn: (v: any) => v < 10 || v > 20 },
                   { label: t.ammonia, val: latestRecord?.ammonia, unit: 'ppm', target: '<.05', icon: Zap, warn: (v: any) => v > 0.05 },
                   { label: t.alkalinity, val: latestRecord?.alkalinity, unit: 'mg/L', target: '100-150', icon: Activity, warn: (v: any) => v < 80 },
                   { label: t.turbidity, val: latestRecord?.turbidity, unit: 'NTU', target: '20-40', icon: Droplets, warn: (v: any) => v > 60 },
                   { label: t.temperature, val: latestRecord?.temperature, unit: '°C', target: '26-30', icon: Thermometer, warn: (v: any) => v < 26 || v > 30 },
                   { label: t.mortality, val: latestRecord?.mortality, unit: 'shrimp', target: '<10/d', icon: AlertTriangle, warn: (v: any) => v > 10 }
                 ].map((m, i) => {
                    const status = m.val === undefined ? 'none' : m.warn(m.val) ? 'warning' : 'good';
                    return (
                       <motion.div 
                         key={m.label}
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: i * 0.05 }}
                         className="bg-white border-x border-b border-black/5 rounded-[2.2rem] p-5 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all"
                       >
                          <div className="flex justify-between items-start mb-3.5 relative z-10">
                             <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm border border-slate-50",
                                status === 'warning' ? "bg-amber-50 text-amber-500" : status === 'good' ? "bg-emerald-50 text-emerald-500" : "bg-slate-50 text-slate-300"
                             )}>
                                <m.icon size={18} />
                             </div>
                             
                             <div className={cn(
                                "px-1.5 py-0.5 rounded-full text-[5px] font-black uppercase tracking-widest border",
                                isLiveMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-amber-500/10 border-amber-500/20 text-[#C78200]"
                             )}>
                                {isLiveMode ? 'SENS.' : 'LOG'}
                             </div>
                          </div>
                          
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{m.label}</p>
                          <div className="flex items-baseline gap-1 relative z-10">
                             <h3 className="text-2xl font-black text-slate-800 tracking-tighter">
                                {m.val !== undefined ? (typeof m.val === 'number' ? m.val.toFixed(1) : m.val) : '--'}
                             </h3>
                             <span className="text-[7px] font-black text-slate-300 uppercase">{m.unit}</span>
                          </div>
                          <p className="text-[7px] font-bold text-slate-300 mt-0.5 uppercase tracking-widest">{m.target}</p>
                          
                          <div className="absolute -right-2 -bottom-2 opacity-5 text-slate-800 group-hover:scale-110 transition-transform">
                             <m.icon size={64} />
                          </div>
                       </motion.div>
                    );
                 })}
              </div>
           </motion.section>
         </motion.div>
       )}
    </div>
  );
};
