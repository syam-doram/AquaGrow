import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  CloudSun, 
  Droplets, 
  Home, 
  Zap, 
  TrendingUp,
  Thermometer,
  Wind,
  Droplet,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { Translations } from '../translations';
import { cn } from '../utils/cn';

export const WeatherFeedAlert = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();
  
  return (
    <div className="pb-40 bg-[#F8F9FE] min-h-screen text-left">
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-white/95 backdrop-blur-md px-4 py-8 flex items-center justify-between border-b border-black/5">
        <button onClick={() => navigate(-1)} className="p-3 text-[#4A2C2A] hover:bg-black/5 rounded-2xl transition-all">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-sm font-black text-[#4A2C2A] tracking-tighter uppercase">{t.weather} & Feed</h1>
        <div className="bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-full flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-widest">Live</span>
        </div>
      </header>

      <div className="pt-32 px-6 space-y-8">
        {/* CURRENT CONDITIONS HERO */}
        <div className="bg-[#0D523C] rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">{t.currentConditions}</p>
                <div className="flex items-baseline mt-4">
                  <h2 className="text-7xl font-black tracking-tighter">28.5</h2>
                  <span className="text-2xl font-black ml-1 text-emerald-400">°C</span>
                </div>
                <div className="flex items-center gap-2 text-white/60 mt-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400/30" />
                  <p className="text-xs font-medium tracking-tight">East Basin, Pond A-12</p>
                </div>
              </div>
              <CloudSun size={90} strokeWidth={1.5} className="text-[#C78200]" />
            </div>

            <div className="mt-12 grid grid-cols-3 gap-8 pt-10 border-t border-white/10">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
                   <Droplet size={20} className="text-emerald-400" />
                </div>
                <p className="text-[7px] uppercase font-black text-white/40 tracking-widest mb-1">{t.humidity}</p>
                <p className="text-xl font-black tracking-tighter">82%</p>
              </div>
              <div className="text-center border-x border-white/5">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
                   <Droplets size={20} className="text-emerald-400" />
                </div>
                <p className="text-[7px] uppercase font-black text-white/40 tracking-widest mb-1">RAINFALL</p>
                <p className="text-xl font-black tracking-tighter">12mm</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
                   <Wind size={20} className="text-emerald-400" />
                </div>
                <p className="text-[7px] uppercase font-black text-white/40 tracking-widest mb-1">{t.wind}</p>
                <p className="text-xl font-black tracking-tighter">14km/h</p>
              </div>
            </div>
          </div>
          <div className="absolute right-[-20%] top-[-20%] w-80 h-80 bg-emerald-400/10 blur-[120px] rounded-full"></div>
        </div>

        {/* CRITICAL ALERTS */}
        <section className="space-y-6">
           <div className="flex items-center gap-3 px-1">
              <AlertTriangle size={20} className="text-red-500" />
              <h3 className="text-lg font-black tracking-tighter text-[#4A2C2A]">{t.criticalAlerts}</h3>
           </div>
           
           <div className="space-y-4">
              <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-red-500/10 flex items-start gap-6 group hover:border-red-500/30 transition-all">
                 <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-red-500">
                    <Thermometer size={28} />
                 </div>
                 <div className="flex-1">
                    <div className="flex justify-between mb-1">
                       <h4 className="font-black text-base text-[#4A2C2A] tracking-tight">Sudden Temp Drop</h4>
                       <span className="text-[8px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase">High Risk</span>
                    </div>
                    <p className="text-[11px] text-[#4A2C2A]/60 font-medium leading-relaxed">Water temp expected to drop 4°C tonight. Adjust feeding frequency and monitor DO levels.</p>
                 </div>
              </div>

              <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border-amber-500/10 flex items-start gap-6 opacity-60">
                 <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-amber-500">
                    <Zap size={28} />
                 </div>
                 <div className="flex-1">
                    <div className="flex justify-between mb-1">
                       <h4 className="font-black text-base text-[#4A2C2A] tracking-tight">Low Pressure Warning</h4>
                       <span className="text-[8px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full uppercase">Medium</span>
                    </div>
                    <p className="text-[11px] text-[#4A2C2A]/60 font-medium leading-relaxed">Atmospheric pressure falling. Aeration system check recommended.</p>
                 </div>
              </div>
           </div>
        </section>

        {/* FEED EFFICIENCY SYNC */}
        <section className="bg-[#C78200] rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-orange-900/20 group cursor-pointer hover:scale-[1.02] transition-all">
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                 <div>
                    <h3 className="text-3xl font-black tracking-tighter text-white">{t.feedEfficiency}</h3>
                    <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-2">{t.weatherAdj}</p>
                 </div>
                 <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-md">
                    <TrendingUp size={32} />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                 <div className="bg-black/10 rounded-[2rem] p-8 border border-white/5 backdrop-blur-sm">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 leading-none">FORECAST FCR</p>
                    <p className="text-4xl font-black tracking-tighter">1.54</p>
                 </div>
                 <div className="bg-black/10 rounded-[2rem] p-8 border border-white/5 backdrop-blur-sm">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 leading-none">FEED ADJ.</p>
                    <p className="text-4xl font-black tracking-tighter text-emerald-400">-15%</p>
                 </div>
              </div>

              <button 
                onClick={() => navigate('/feed')}
                className="w-full py-6 bg-white text-[#C78200] rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-black/10 flex items-center justify-center gap-4 transition-all active:scale-95"
              >
                 Optimize Feed Plan <ArrowRight size={20} />
              </button>
           </div>
           
           <div className="absolute right-[-20%] bottom-[-20%] opacity-10">
              <Zap size={280} />
           </div>
        </section>

        {/* FORECAST */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-black tracking-tighter text-[#4A2C2A]">Aquaculture Forecast</h3>
              <button className="text-[9px] font-black text-[#C78200] uppercase tracking-widest">7-Day Plan</button>
           </div>
           
           <div className="bg-white rounded-[3rem] shadow-sm border border-black/5 overflow-hidden divide-y divide-[#4A2C2A]/5">
              {[
                { day: 'TOMORROW', sub: 'MAY 12', icon: Droplets, color: 'text-[#4F7AFF]', status: 'HEAVY RAIN', temp: '24°/30°', note: 'Caution: pH Shift' },
                { day: 'MONDAY', sub: 'MAY 13', icon: Home, color: 'text-black/5', status: 'CLOUDY', temp: '26°/31°', note: 'Stable' },
                { day: 'TUESDAY', sub: 'MAY 14', icon: Wind, color: 'text-[#4F7AFF]', status: 'HIGH WIND', temp: '25°/29°', note: 'Aeration Plus' },
                { day: 'WEDNESDAY', sub: 'MAY 15', icon: CloudSun, color: 'text-[#C78200]', status: 'SUNNY', temp: '28°/34°', note: 'Ideal Growth' },
              ].map((row, i) => (
                <div key={i} className="p-8 flex items-center justify-between group hover:bg-[#C78200]/5 transition-colors">
                   <div className="flex-1">
                      <p className="text-sm font-black text-[#4A2C2A] tracking-tighter">{row.day}</p>
                      <p className="text-[8px] font-bold text-[#4A2C2A]/20 uppercase tracking-widest mt-0.5">{row.sub}</p>
                   </div>
                   <div className="flex-1 text-center">
                      <row.icon size={24} className={cn("mx-auto transition-transform group-hover:scale-110", row.color)} />
                      <p className={cn("text-[7px] font-black uppercase tracking-widest mt-2", row.color)}>{row.status}</p>
                   </div>
                   <div className="flex-1 text-right">
                      <p className="text-sm font-black text-[#4A2C2A] tracking-tighter">{row.temp}</p>
                      <p className="text-[8px] font-bold text-[#4A2C2A]/30 italic uppercase tracking-widest mt-0.5">{row.note}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>

        <button className="w-full py-6 bg-emerald-500 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-4">
           <Droplets size={22} /> {t.logEntry || 'Log Environment Data'}
        </button>
      </div>
    </div>
  );
};
