import { AlertTriangle, CloudSun, Droplets, Home, Zap, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Translations } from '../translations';
import { cn } from '../utils/cn';

export const WeatherAlerts = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();
  return (
    <div className="pb-32 bg-[#F8F9FE] min-h-screen">
      <Header title={t.weather} showBack onMenuClick={onMenuClick} />
      <div className="pt-24 px-6 py-8 space-y-10">
        <div className="bg-[#4A2C2A] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl shadow-black/20">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[#C78200] text-[9px] font-black uppercase tracking-[0.2em]">{t.currentConditions}</p>
                <h2 className="text-6xl font-black tracking-tighter mt-4">32°<span className="text-2xl ml-1">C</span></h2>
                <p className="text-white/60 text-sm font-medium mt-2">{t.mostlyCloudy}</p>
              </div>
              <CloudSun size={80} strokeWidth={1.5} className="text-[#C78200]" />
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
              <div>
                <p className="text-[9px] uppercase font-black text-white/40 tracking-widest mb-1">{t.humidity}</p>
                <p className="text-xl font-black tracking-tighter">78%</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-black text-white/40 tracking-widest mb-1">{t.wind}</p>
                <p className="text-xl font-black tracking-tighter">12km/h</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-black text-white/40 tracking-widest mb-1">{t.uvIndex}</p>
                <p className="text-xl font-black tracking-tighter">High</p>
              </div>
            </div>
          </div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#C78200]/10 blur-[80px] rounded-full"></div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-black tracking-tighter text-[#4A2C2A] px-1">{t.criticalAlerts}</h3>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-red-500/10 bg-red-500/5 space-y-4">
            <div className="flex items-center gap-4 text-red-500">
              <AlertTriangle size={24} />
              <p className="font-black text-base tracking-tight">{t.heavyRainfall}</p>
            </div>
            <p className="text-sm text-[#4A2C2A]/60 leading-relaxed">{t.heavyRainfallDesc}</p>
            <p className="text-[9px] font-black text-red-500/40 uppercase tracking-widest">{t.issuedMinsAgo}</p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-black tracking-tighter text-[#4A2C2A] px-1">{t.forecast7Day}</h3>
          <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden divide-y divide-[#4A2C2A]/5">
            {[
              { day: 'Fri', temp: '31°', icon: CloudSun },
              { day: 'Sat', temp: '29°', icon: Droplets },
              { day: 'Sun', temp: '30°', icon: CloudSun },
              { day: 'Mon', temp: '33°', icon: Home },
            ].map((f, i) => (
              <div key={i} className="p-6 flex items-center justify-between hover:bg-[#C78200]/5 transition-colors">
                <span className="font-black text-sm text-[#4A2C2A] w-12">{f.day}</span>
                <f.icon size={20} className="text-[#4A2C2A]/20" />
                <span className="font-black text-sm text-[#4A2C2A]">{f.temp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FEED EFFICIENCY CARD - FROM DESIGN */}
        <section className="space-y-6">
           <div className="bg-[#C78200] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-[#C78200]/20 group hover:scale-[1.02] transition-all cursor-pointer">
              <div className="relative z-10">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <h3 className="text-xl font-black tracking-tight">{t.feedEfficiency || 'Feed Efficiency'}</h3>
                       <p className="text-white/60 text-[8px] font-black uppercase tracking-widest mt-1">Predicted FCR (Current Conditions)</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md group-hover:bg-white group-hover:text-[#C78200] transition-colors">
                       <TrendingUp size={24} />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/10 rounded-3xl p-6 border border-white/10 backdrop-blur-sm">
                       <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">FORECAST FCR</p>
                       <p className="text-3xl font-black tracking-tighter">1.54</p>
                    </div>
                    <div className="bg-white/10 rounded-3xl p-6 border border-white/10 backdrop-blur-sm">
                       <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">FEED ADJ.</p>
                       <p className="text-3xl font-black tracking-tighter text-emerald-300">-15%</p>
                    </div>
                 </div>

                 <button 
                  onClick={() => navigate('/feed')}
                  className="w-full py-5 bg-white text-[#C78200] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-black/10 active:scale-95 transition-all"
                 >
                    OPTIMIZE FEED PLAN
                 </button>
              </div>
              
              <div className="absolute right-[-10%] top-[-10%] opacity-5 rotate-12">
                 <Zap size={180} />
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};
