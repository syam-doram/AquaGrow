import React, { useEffect, useState } from 'react';
import { AlertTriangle, CloudSun, Droplets, Home, Zap, TrendingUp, RefreshCw, Wind, Wind as WindIcon, CloudShowersHeavy, CloudRain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Translations } from '../translations';
import { cn } from '../utils/cn';
import { fetchWeatherData, WeatherData } from '../services/weatherService';
import { motion, AnimatePresence } from 'motion/react';

export const WeatherAlerts = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWeather = async () => {
    setLoading(true);
    try {
      const data = await fetchWeatherData('Current Location');
      setWeather(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
    // Auto-refresh every 5 minutes
    const timer = setInterval(loadWeather, 300000);
    return () => clearInterval(timer);
  }, []);

  if (loading && !weather) {
    return (
      <div className="pb-32 bg-[#F8F9FE] min-h-screen">
        <Header title={t.weather} showBack onMenuClick={onMenuClick} />
        <div className="pt-48 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#C78200] border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black text-[#4A2C2A]/40 uppercase tracking-widest animate-pulse">Syncing satellite data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 bg-[#F8F9FE] min-h-screen">
      <Header title={t.weather} showBack onMenuClick={onMenuClick} />
      
      <div className="pt-24 px-6 space-y-10">
        
        {/* CURRENT CONDITIONS CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#02130F] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-950/20"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em]">{t.currentConditions}</p>
                <div className="flex items-baseline gap-1 mt-4">
                  <h2 className="text-7xl font-black tracking-tighter">{weather?.temp || '--'}</h2>
                  <span className="text-3xl text-emerald-400/40 font-black">°C</span>
                </div>
                <p className="text-white/60 text-sm font-medium mt-2">{weather?.condition || '--'}</p>
              </div>
              <CloudSun size={100} strokeWidth={1} className="text-emerald-400 opacity-80" />
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/5 pt-8">
              <div>
                <p className="text-[9px] uppercase font-black text-white/40 tracking-widest mb-1">{t.humidity}</p>
                <p className="text-xl font-black tracking-tighter">{weather?.humidity}%</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-black text-white/40 tracking-widest mb-1">{t.wind}</p>
                <p className="text-xl font-black tracking-tighter">{weather?.windSpeed} <span className="text-[10px] text-white/20">km/h</span></p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-[9px] uppercase font-black text-emerald-400 tracking-widest">LIVE</p>
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                <button onClick={loadWeather} className="flex items-center gap-2 text-white/40 active:text-white transition-colors">
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Refresh</span>
                </button>
              </div>
            </div>
          </div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full" />
        </motion.div>

        {/* ALERTS SECTION - DYNAMIC */}
        <section className="space-y-6">
          <h3 className="text-xl font-black tracking-tighter text-[#4A2C2A] px-1 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" /> Real-time Warnings
          </h3>
          <AnimatePresence>
            {weather?.alerts.map((alert, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "p-8 rounded-[2.5rem] shadow-sm border space-y-4 relative overflow-hidden",
                  alert.type === 'critical' ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    alert.type === 'critical' ? "bg-red-100 text-red-500" : "bg-amber-100 text-amber-500"
                  )}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h4 className={cn("font-black text-base tracking-tight", alert.type === 'critical' ? "text-red-700" : "text-amber-700")}>{alert.title}</h4>
                    <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">Live Satellite Sync</p>
                  </div>
                </div>
                <p className="text-sm text-[#4A2C2A]/70 leading-relaxed font-medium">{alert.desc}</p>
                <div className="flex justify-end pt-2">
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", alert.type === 'critical' ? "text-red-400" : "text-amber-400")}>Action Required</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>

        {/* 7-DAY FORECAST */}
        <section className="space-y-6">
          <h3 className="text-lg font-black tracking-tighter text-[#4A2C2A] px-1">{t.forecast7Day}</h3>
          <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-black/5 divide-y divide-[#4A2C2A]/5">
            {weather?.forecast.map((f, i) => {
              const Icon = f.icon === 'CloudRain' ? CloudRain : (f.icon === 'Zap' ? Zap : CloudSun);
              return (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: i * 0.1 }}
                  className="p-6 flex items-center justify-between hover:bg-[#F8F9FE] transition-colors"
                >
                  <span className="font-black text-sm text-[#4A2C2A] w-14 uppercase tracking-widest">{f.day}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black/[0.03] rounded-xl flex items-center justify-center">
                      <Icon size={18} className="text-[#C78200]" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-black text-lg text-[#4A2C2A] tracking-tighter">{f.temp}</span>
                    <span className="text-[10px] text-[#4A2C2A]/30 font-bold uppercase">C</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* FEED EFFICIENCY CARD - DYNAMICALLY TRIGGERED */}
        <section className="pb-10">
          <motion.div 
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/feed')}
            className="bg-[#C78200] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-amber-900/40 cursor-pointer"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black tracking-tight">{t.feedEfficiency || 'AI Feed Adjustment'}</h3>
                  <p className="text-white/60 text-[8px] font-black uppercase tracking-widest mt-1">Satellite Weather-Driven Optimization</p>
                </div>
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <TrendingUp size={24} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/10 rounded-3xl p-6 border border-white/10 backdrop-blur-sm">
                  <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">PRECIPITATION RISK</p>
                  <p className="text-3xl font-black tracking-tighter">High</p>
                </div>
                <div className="bg-white/10 rounded-3xl p-6 border border-white/10 backdrop-blur-sm">
                  <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">AUTO-ADJUST</p>
                  <p className="text-3xl font-black tracking-tighter text-emerald-300">-15%</p>
                </div>
              </div>
              <p className="text-[9px] text-white/60 font-medium mb-6 leading-relaxed italic">"Heavy rain causes molting and changes water chemistry. AI suggests reducing feed ration to prevent wastage."</p>
              
              <div className="w-full py-5 bg-white text-[#C78200] rounded-2xl font-black text-[10px] text-center uppercase tracking-[0.2em] shadow-xl shadow-black/10">
                 APPLY AI RATION NOW
              </div>
            </div>
            
            <div className="absolute right-[-10%] top-[-10%] opacity-10 rotate-12">
               <Zap size={180} strokeWidth={2} />
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};
