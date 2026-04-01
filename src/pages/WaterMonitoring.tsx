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
  ShieldCheck
} from 'lucide-react';
import { useData } from '../context/DataContext';
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
import { cn } from '../utils/cn';
import { Translations } from '../translations';
import { Header } from '../components/Header';
import { format, subDays, isSameDay, addDays, startOfToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { iotService, SensorData } from '../services/iotService';
import { motion } from 'motion/react';

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

  const MetricCard = ({ 
    label, 
    value, 
    unit, 
    target, 
    buttonText, 
    status = 'good', 
    fullWidth = false,
    liveValue 
  }: any) => (
    <div className={cn(
      "bg-white border border-slate-100 rounded-[2.2rem] p-7 relative overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98]",
      fullWidth ? "col-span-2" : "col-span-1"
    )}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
        <div className="flex gap-2">
           {isLiveMode && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />}
           {status === 'good' && <CheckCircle2 size={16} className="text-emerald-500" />}
           {status === 'warning' && <AlertTriangle size={16} className="text-amber-500" />}
           {status === 'error' && <AlertCircle size={16} className="text-red-500" />}
        </div>
      </div>
      
      <div className="flex items-baseline gap-1 mb-1">
        <h3 className={cn(
           "text-4xl font-black tracking-tighter transition-all",
           isLiveMode ? "text-emerald-600" : "text-slate-800"
        )}>
           {(isLiveMode && liveValue !== undefined) ? (typeof liveValue === 'number' ? liveValue.toFixed(1) : liveValue) : (value !== undefined ? value : '--')}
        </h3>
        {unit && value !== undefined && <span className="text-[10px] font-bold text-slate-300 uppercase">{unit}</span>}
      </div>
      <p className="text-[9px] font-bold text-slate-400 mb-6 uppercase tracking-widest leading-none">
         {isLiveMode ? "LIVE FROM NODE" : target}
      </p>

      <button className={cn(
        "w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all",
        isLiveMode 
          ? "bg-emerald-50 text-emerald-600 border border-emerald-500/10"
          : status === 'warning' 
            ? "bg-[#C78200] text-white shadow-xl shadow-amber-500/20" 
            : "bg-slate-50 text-slate-400 hover:bg-slate-100"
      )}>
        {isLiveMode ? "READING LIVE" : buttonText}
      </button>
    </div>
  );

  return (
    <div className="pb-40 bg-[#F8F9FE] min-h-screen text-left font-sans">
      <Header title={t.monitor} showBack onMenuClick={onMenuClick} />

      <div className="pt-28 px-6 space-y-8">
        
        {/* 📅 1. PRIMARY DATE AUDIT BAR (MOVED TO TOP) */}
        <section className="bg-white border border-slate-100 rounded-[2.2rem] p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center justify-between mb-6 relative z-10 px-2">
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-[#C78200]" />
              <h3 className="font-black text-slate-800 tracking-tight">Audit Date</h3>
            </div>
            <p className="text-[10px] font-black text-[#C78200] uppercase tracking-widest">{format(selectedDate, 'MMM d, yyyy')}</p>
          </div>
          
          <div className="flex items-center gap-3 relative z-10">
            <button 
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              disabled={selectedPond && isSameDay(selectedDate, new Date(selectedPond.stockingDate))}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm active:scale-90",
                selectedPond && isSameDay(selectedDate, new Date(selectedPond.stockingDate)) ? "bg-slate-50 text-slate-200 cursor-not-allowed" : "bg-slate-50 text-slate-400 hover:bg-[#C78200] hover:text-white"
              )}
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex-1 flex overflow-x-auto gap-4 scrollbar-hide py-3">
              {(() => {
                if (!selectedPond) return null;
                const start = new Date(selectedPond.stockingDate);
                const end = new Date();
                const totalDays = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))) + 2; 
                
                return Array.from({ length: totalDays }).map((_, i) => {
                  const d = subDays(new Date(), (totalDays - 1) - i);
                  if (d < start) return null;
                  const isActive = isSameDay(d, selectedDate);
                  return (
                    <button 
                      key={i}
                      onClick={() => setSelectedDate(d)}
                      className={cn(
                        "flex-shrink-0 w-12 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-[0.98]",
                        isActive ? "bg-[#C78200] text-white shadow-lg shadow-amber-500/20" : "bg-white border border-slate-100 text-slate-400"
                      )}
                    >
                      <span className="text-[7px] font-black uppercase tracking-widest">{format(d, 'EEE')}</span>
                      <span className="text-xs font-black">{format(d, 'd')}</span>
                    </button>
                  );
                }).filter(Boolean);
              })()}
            </div>

            <button 
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              disabled={isSameDay(selectedDate, startOfToday())}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm active:scale-90",
                isSameDay(selectedDate, startOfToday()) ? "bg-slate-100 text-slate-200 cursor-not-allowed" : "bg-slate-50 text-slate-400 hover:bg-[#C78200] hover:text-white"
              )}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </section>

        {/* 📋 2. POND WISE HEALTH AUDIT (NEW SUMMARY) */}
        <section>
           <div className="flex justify-between items-center mb-5 px-1">
              <h2 className="text-xl font-black text-slate-800 tracking-tighter">Pond-wise Audit</h2>
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">Overall {ponds.length} Ponds</span>
           </div>
           <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
              {ponds.map(p => {
                 const pRecord = waterRecords
                    .filter(r => r.pondId === p.id && (r.date === dateStr || isSameDay(new Date(r.date), selectedDate)))
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                 const pHealth = calculateOverallHealth(pRecord);
                 const isActive = selectedPondId === p.id;

                 return (
                    <button 
                      key={p.id}
                      onClick={() => setSelectedPondId(p.id)}
                      className={cn(
                        "flex-shrink-0 min-w-[130px] p-5 rounded-[2.5rem] border transition-all relative overflow-hidden group",
                        isActive ? "bg-[#C78200] border-[#C78200] shadow-2xl scale-105" : "bg-white border-slate-100 shadow-sm"
                      )}
                    >
                       <div className="relative z-10 flex flex-col items-start text-left">
                          <div className={cn(
                             "w-1.5 h-1.5 rounded-full mb-3",
                             pHealth.color.replace('text-', 'bg-'),
                             pHealth.score > 0 ? "animate-pulse" : "opacity-20"
                          )} />
                          <h4 className={cn("text-xs font-black tracking-tight mb-0.5", isActive ? "text-white" : "text-slate-800")}>{p.name}</h4>
                          <p className={cn("text-[8px] font-black mb-1 uppercase tracking-widest", isActive ? "text-white/60" : "text-slate-400")}>{pHealth.status}</p>
                          <p className={cn("text-xl font-black tracking-tighter", isActive ? "text-white" : pHealth.color)}>
                             {pHealth.score}%
                          </p>
                       </div>
                    </button>
                 );
              })}
           </div>
        </section>

        {/* 🚀 2. IoT LIVE MONITOR STATUS */}
        <div className={cn(
          "rounded-[3.5rem] p-8 flex flex-col gap-6 border shadow-2xl transition-all duration-700",
          isLiveMode 
            ? "bg-[#02130F] border-emerald-500/30 shadow-emerald-900/10" 
            : "bg-white border-slate-100 shadow-slate-200/50"
        )}>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                 <div className={cn(
                   "w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-xl shadow-black/5",
                   isLiveMode ? "bg-emerald-500 text-white rotate-0" : "bg-slate-50 text-slate-300"
                 )}>
                    {isLiveMode ? <RefreshCcw size={28} className="animate-spin" /> : <TrendingUp size={28} />}
                 </div>
                 <div>
                    <p className={cn(
                      "text-[9px] font-black uppercase tracking-[0.3em] mb-1",
                      isLiveMode ? "text-emerald-500" : "text-slate-300"
                    )}>
                       {isLiveMode ? `• NODE ACTIVE: AG-${selectedPond?.id?.slice(-3).toUpperCase()}` : 'IoT Sensor Hub'}
                    </p>
                    <h3 className={cn(
                      "text-xl font-black tracking-tighter",
                      isLiveMode ? "text-white" : "text-slate-800"
                    )}>
                       {isConnecting ? (connectionType === 'BLE' ? 'Scanning Bluetooth...' : 'Syncing WiFi Node...') : (isLiveMode ? `${selectedPond?.name}: LIVE` : 'Ready to Connect')}
                    </h3>
                 </div>
              </div>
              {isLiveMode && (
                 <button 
                   onClick={() => setIsLiveMode(false)}
                   className="p-4 bg-red-500/20 text-red-500 rounded-full border border-red-500/20 active:scale-90 transition-all"
                 >
                    <X size={16} />
                 </button>
              )}
           </div>

           {!isLiveMode && !isConnecting && (
              <div className="flex gap-4">
                 <button 
                   onClick={() => handleSyncIoT('BLE')}
                   className="flex-1 bg-white border border-slate-100 p-4 rounded-2xl flex flex-col items-center gap-2 group hover:border-[#C78200]/20 transition-all active:scale-95"
                 >
                    <Bluetooth size={20} className="text-[#C78200]" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-[#C78200]">Bluetooth Scan</span>
                 </button>
                 <button 
                  onClick={() => handleSyncIoT('WiFi')}
                  className="flex-1 bg-white border border-slate-100 p-4 rounded-2xl flex flex-col items-center gap-2 group hover:border-emerald-500/20 transition-all active:scale-95"
                 >
                    <Wifi size={20} className="text-emerald-500" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-500">WiFi Cloud Sync</span>
                 </button>
              </div>
           )}

           {isConnecting && (
              <div className="bg-emerald-500/5 h-2 w-full rounded-full overflow-hidden">
                 <motion.div 
                   animate={{ x: [-100, 400] }} 
                   transition={{ repeat: Infinity, duration: 1.5 }} 
                   className="h-full w-1/4 bg-emerald-500" 
                 />
              </div>
           )}
        </div>

        {/* 🌟 3. SELECTED POND DETAIL HEALTH GAUGE */}
        <section className={cn(
           "rounded-[3.5rem] p-10 border shadow-sm relative overflow-hidden transition-all duration-700",
           isLiveMode ? "bg-[#02130F] border-emerald-500/20" : "bg-white border-slate-100"
        )}>
           <div className="flex flex-col items-center">
              <div className="relative w-52 h-52 flex items-center justify-center mb-8">
                 {/* Progress Ring Background */}
                 <svg className="absolute w-full h-full -rotate-90">
                    <circle cx="104" cy="104" r="96" strokeWidth="12" stroke="rgba(0,0,0,0.03)" fill="none" />
                    <circle 
                      cx="104" cy="104" r="96" strokeWidth="12" 
                      stroke="currentColor" 
                      strokeDasharray={603} 
                      strokeDashoffset={603 - (603 * health.score) / 100}
                      className={cn("transition-all duration-1000 ease-out fill-none", isLiveMode ? "text-emerald-500" : health.color)}
                    />
                 </svg>
                 <div className="text-center z-10">
                    <p className={cn("text-[9px] font-black uppercase tracking-[0.4em] mb-1", isLiveMode ? "text-emerald-500" : health.color)}>Health Score</p>
                    <h2 className={cn("text-6xl font-black tracking-tighter", isLiveMode ? "text-white" : "text-slate-800")}>{health.score}%</h2>
                 </div>
              </div>
              <div className={cn("px-10 py-4 rounded-3xl border flex items-center gap-4 transition-all shadow-xl", 
                 isLiveMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : `${health.bg} ${health.color.replace('text-', 'border-')} ${health.color}`
              )}>
                 <ShieldCheck size={18} />
                 <span className="text-xs font-black uppercase tracking-[0.3em]">{health.status} STATUS</span>
              </div>
           </div>
        </section>

        {/* VITAL METRICS */}
        <section>
           <div className="flex justify-between items-center mb-6 px-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Vital Metrics</h2>
              <button 
                onClick={() => navigate(`/water-logs/${selectedPondId}/${dateStr}`)}
                className="flex items-center gap-2 text-[9px] font-black text-[#C78200] uppercase tracking-widest bg-amber-500/10 px-4 py-2 rounded-full"
              >
                 <History size={12} /> Actual Log
              </button>
           </div>
           
           <div className="grid grid-cols-2 gap-5">
              <MetricCard 
                label={t.phLevel} 
                value={latestRecord?.ph} 
                liveValue={liveData?.ph}
                target="Target: 7.5 - 8.5" 
                buttonText="New Reading" 
                status={latestRecord?.ph && (latestRecord.ph < 7.5 || latestRecord.ph > 8.5) ? 'warning' : 'good'} 
              />
              <MetricCard 
                label={t.dissolvedO2} 
                value={latestRecord?.do} 
                liveValue={liveData?.do}
                unit="mg/L" 
                target="Critical: < 5.0" 
                buttonText={latestRecord === undefined ? "Log Needed" : "Check Tray"} 
                status={latestRecord?.do && latestRecord.do < 5 ? 'warning' : 'good'} 
              />
              <MetricCard 
                label={t.salinity} 
                value={latestRecord?.salinity} 
                liveValue={liveData?.salinity}
                unit="ppt" 
                target="Range: 10 - 20" 
                buttonText="Add Water" 
                status={latestRecord?.salinity && (latestRecord.salinity < 10 || latestRecord.salinity > 20) ? 'warning' : 'good'} 
              />
              <MetricCard 
                label={t.ammonia} 
                value={latestRecord?.ammonia} 
                unit="ppm" 
                target="Limit: 0.05" 
                buttonText="Watching" 
                status={latestRecord?.ammonia && latestRecord.ammonia > 0.05 ? 'warning' : 'good'} 
              />
              <MetricCard 
                label={t.temperature} 
                value={latestRecord?.temperature ? `${latestRecord.temperature}°C` : undefined} 
                liveValue={liveData?.temp ? `${liveData.temp}°C` : undefined}
                target="Seasonal Average: 26-30°C" 
                buttonText="Analyze Trend" 
                status={latestRecord?.temperature && (latestRecord.temperature < 26 || latestRecord.temperature > 30) ? 'warning' : 'good'} 
                fullWidth 
              />
           </div>
        </section>

        {/* OXYGEN TREND */}
        <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
           <div className="flex justify-between items-start mb-10 relative z-10">
              <div>
                 <h3 className="text-xl font-black text-slate-800 tracking-tight mb-1">Oxygen Concentration</h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Historical context from {format(selectedDate, 'MMM d')}</p>
              </div>
              <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                 <span className="text-[9px] font-black text-emerald-500 tracking-widest uppercase">{format(selectedDate, 'EEE')} ACT.</span>
              </div>
           </div>

           <div className="h-[280px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                 <ComposedChart data={chartData}>
                    <defs>
                       <linearGradient id="glow-light-real-date" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                    <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: 'rgba(0,0,0,0.2)', fontSize: 10, fontWeight: 900 }} 
                       dy={10}
                    />
                    <YAxis hide domain={[2, 8]} />
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                       itemStyle={{ color: '#C78200', fontSize: '10px', fontWeight: 900 }}
                    />
                    <Bar dataKey="value" fill="rgba(16,185,129,0.08)" barSize={4} radius={[2, 2, 0, 0]} />
                    <Line 
                       type="monotone" 
                       dataKey="value" 
                       stroke="#10B981" 
                       strokeWidth={5} 
                       dot={{ fill: '#10B981', stroke: '#fff', strokeWidth: 2, r: 4 }}
                    />
                 </ComposedChart>
              </ResponsiveContainer>
           </div>
        </section>

        {/* ANALYTICS */}
        <section className="bg-[#0D3B2E] rounded-[3.5rem] p-12 relative overflow-hidden group shadow-2xl shadow-emerald-900/30">
           <div className="relative z-10 flex flex-col items-center text-center">
              <TrendingUp size={48} className="text-[#C78200] mb-6 animate-pulse" />
              <h4 className="text-3xl font-black text-white tracking-tighter mb-4">Forecaster</h4>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-10 max-w-[200px]">Compare {format(selectedDate, 'MMMM')} data with previous culture cycles</p>
              <button className="bg-white text-[#0D3B2E] px-12 py-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-black/10 transition-all">
                 Unlock Analytics
              </button>
           </div>
        </section>
      </div>
    </div>
  );
};
