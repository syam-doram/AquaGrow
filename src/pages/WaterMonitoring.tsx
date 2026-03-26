import React, { useState } from 'react';
import { 
  History, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Lightbulb,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight
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

export const WaterMonitoring = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, waterRecords, isPro } = useData();
  const [selectedPondId, setSelectedPondId] = useState(ponds[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const selectedPond = ponds.find(p => p.id === selectedPondId);

  // DATE STR FOR FILTERING
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const latestRecord = waterRecords
    .filter(r => r.pondId === selectedPondId && (r.date === dateStr || isSameDay(new Date(r.date), selectedDate)))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  // REAL DATA MAPPING FOR THE 7-DAY TREND (Still 7 days from TODAY or from selectedDate?)
  // Usually trend reflects the 7 days LEADING UP to the selected date.
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

  const MetricCard = ({ 
    label, 
    value, 
    unit, 
    target, 
    buttonText, 
    status = 'good', 
    fullWidth = false 
  }: any) => (
    <div className={cn(
      "bg-white border border-slate-100 rounded-[2.2rem] p-7 relative overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98]",
      fullWidth ? "col-span-2" : "col-span-1"
    )}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
        {status === 'good' && <CheckCircle2 size={16} className="text-emerald-500" />}
        {status === 'warning' && <AlertTriangle size={16} className="text-amber-500" />}
        {status === 'error' && <AlertCircle size={16} className="text-red-500" />}
      </div>
      
      <div className="flex items-baseline gap-1 mb-1">
        <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{value !== undefined ? value : '--'}</h3>
        {unit && value !== undefined && <span className="text-[10px] font-bold text-slate-300 uppercase">{unit}</span>}
      </div>
      <p className="text-[9px] font-bold text-slate-400 mb-6 uppercase tracking-widest leading-none">{target}</p>

      <button className={cn(
        "w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all",
        status === 'warning' 
          ? "bg-[#C78200] text-white shadow-xl shadow-amber-500/20" 
          : "bg-slate-50 text-slate-400 hover:bg-slate-100"
      )}>
        {buttonText}
      </button>
    </div>
  );

  return (
    <div className="pb-40 bg-[#F8F9FE] min-h-screen text-left font-sans">
      <Header title={t.monitor} showBack onMenuClick={onMenuClick} />

      <div className="pt-28 px-6 space-y-9">
        {/* 🚀 IoT LIVE MONITOR STATUS */}
        <div className={cn(
          "rounded-[2.5rem] p-6 flex items-center justify-between border shadow-2xl transition-all duration-700",
          isLiveMode 
            ? "bg-[#02130F] border-emerald-500/30 shadow-emerald-900/10" 
            : "bg-white border-slate-100 shadow-slate-200/50"
        )}>
           <div className="flex items-center gap-5">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                isLiveMode ? "bg-emerald-500/20 text-emerald-400 rotate-0" : "bg-slate-50 text-slate-300"
              )}>
                 <TrendingUp size={24} className={isLiveMode ? "animate-pulse" : ""} />
              </div>
              <div>
                 <p className={cn(
                   "text-[9px] font-black uppercase tracking-[0.2em] mb-0.5",
                   isLiveMode ? "text-emerald-500" : "text-slate-400"
                 )}>
                    {isLiveMode ? `• Node AG-${selectedPond?.id?.slice(-3).toUpperCase() || '101'}` : (isPro ? 'External Sensors' : 'Standard Farmer')}
                 </p>
                 <h3 className={cn(
                   "text-base font-black tracking-tight",
                   isLiveMode ? "text-white" : "text-slate-800"
                 )}>
                    {isLiveMode ? `${selectedPond?.name}: 2 Probes Active` : (isPro ? 'Not Connected' : 'Manual Logging Mode')}
                 </h3>
              </div>
           </div>
           <button 
             onClick={() => {
               if (!isPro) {
                 navigate('/subscription');
                 return;
               }
               if (!isLiveMode) {
                 setIsConnecting(true);
                 setTimeout(() => { setIsConnecting(false); setIsLiveMode(true); }, 2500);
               } else {
                 setIsLiveMode(false);
               }
             }}
             className={cn(
               "px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95",
               !isPro ? "bg-amber-500/10 text-[#C78200] border border-[#C78200]/20" :
               isLiveMode 
                 ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                 : isConnecting 
                 ? "bg-amber-500/10 text-amber-500 px-8" 
                 : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
             )}
           >
              {!isPro ? 'Get Node Pro' : isConnecting ? 'Syncing...' : isLiveMode ? 'Disconnect' : 'Connect Hub'}
           </button>
        </div>

        {/* DATE & POND SELECTOR GRID */}
        <section className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-[2.2rem] p-6 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between mb-6 relative z-10 px-2">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-[#C78200]" />
                <h3 className="font-black text-slate-800 tracking-tight">Ecosystem Audit Date</h3>
              </div>
              <p className="text-[10px] font-black text-[#C78200] uppercase tracking-widest">{format(selectedDate, 'MMM d, yyyy')}</p>
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              <button 
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex-1 flex overflow-x-auto gap-4 scrollbar-hide py-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const d = subDays(new Date(), 4 - i);
                  const isActive = isSameDay(d, selectedDate);
                  return (
                    <button 
                      key={i}
                      onClick={() => setSelectedDate(d)}
                      className={cn(
                        "flex-shrink-0 w-12 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all",
                        isActive ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-50 text-slate-400"
                      )}
                    >
                      <span className="text-[7px] font-black uppercase tracking-widest">{format(d, 'EEE')}</span>
                      <span className="text-xs font-black">{format(d, 'd')}</span>
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                disabled={isSameDay(selectedDate, startOfToday())}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                  isSameDay(selectedDate, startOfToday()) ? "bg-slate-100 text-slate-200 cursor-not-allowed" : "bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                )}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto gap-4 scrollbar-hide -mx-6 px-6 pb-2">
            {ponds.map((pond) => (
              <button 
                key={pond.id}
                onClick={() => setSelectedPondId(pond.id)}
                className={cn(
                  "flex-shrink-0 px-8 py-5 rounded-[2rem] border transition-all flex flex-col items-center gap-2 min-w-[160px]",
                  selectedPondId === pond.id 
                    ? "bg-[#C78200] text-white border-[#C78200] shadow-2xl shadow-amber-500/20 scale-105" 
                    : "bg-white border-slate-100 text-slate-400 hover:border-[#C78200]/20"
                )}
              >
                  <p className="font-black text-sm tracking-tight">{pond.name}</p>
                  <p className="text-[7px] font-black uppercase tracking-[0.2em] opacity-60 leading-none mb-1">{pond.species}</p>
                  {isPro && <span className="text-[6px] font-black text-[#C78200] bg-amber-500/10 px-1.5 py-0.5 rounded-md mt-1">Node: AG-{pond.id.slice(-3).toUpperCase()}</span>}
                </button>
            ))}
          </div>
        </section>

        {/* VITAL METRICS - FILTERED BY DATE */}
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
                target="Target: 7.5 - 8.5" 
                buttonText="New Reading" 
                status={latestRecord?.ph && (latestRecord.ph < 7.5 || latestRecord.ph > 8.5) ? 'warning' : 'good'} 
              />
              <MetricCard 
                label={t.dissolvedO2} 
                value={latestRecord?.do} 
                unit="mg/L" 
                target="Critical: < 5.0" 
                buttonText={latestRecord === undefined ? "Log Needed" : "Check Tray"} 
                status={latestRecord?.do && latestRecord.do < 5 ? 'warning' : 'good'} 
              />
              <MetricCard 
                label={t.salinity} 
                value={latestRecord?.salinity} 
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
                target="Seasonal Average: 26-30°C" 
                buttonText="Analyze Trend" 
                status={latestRecord?.temperature && (latestRecord.temperature < 26 || latestRecord.temperature > 30) ? 'warning' : 'good'} 
                fullWidth 
              />
           </div>
        </section>

        {/* OXYGEN TREND - DYNAMICALLY TIED TO SELECTED DATE */}
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
                       animationDuration={2000}
                    />
                 </ComposedChart>
              </ResponsiveContainer>
           </div>
        </section>

        {/* AQUAPRO ELITE */}
        <section className="bg-[#0D3B2E] rounded-[3.5rem] p-12 relative overflow-hidden group shadow-2xl shadow-emerald-900/30">
           <div className="relative z-10 flex flex-col items-center text-center">
              <TrendingUp size={48} className="text-[#C78200] mb-6 animate-pulse" />
              <h4 className="text-3xl font-black text-white tracking-tighter mb-4">Historical Forecaster</h4>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-10 max-w-[200px]">Compare {format(selectedDate, 'MMMM')} data with previous culture cycles</p>
              <button className="bg-white text-[#0D3B2E] px-12 py-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-black/10 hover:scale-[1.05] active:scale-95 transition-all">
                 Unlock Analytics
              </button>
           </div>
        </section>
      </div>
    </div>
  );
};
