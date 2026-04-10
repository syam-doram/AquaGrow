import React, { useEffect, useState } from 'react';
import {
  AlertTriangle, CloudSun, Droplets, Zap, TrendingUp, RefreshCw,
  Wind, CloudRain, Thermometer, Eye, Sun, Moon, ChevronLeft,
  ShieldCheck, Activity, Info, CloudLightning,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Translations } from '../../translations';
import { cn } from '../../utils/cn';
import { fetchWeatherData, WeatherData } from '../../services/weatherService';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';

// ─── Weather condition icon mapper ───────────────────────────────────────────
const ConditionIcon = ({ code, size = 24, className = '' }: {
  code: string; size?: number; className?: string;
}) => {
  switch (code) {
    case 'storm': return <CloudLightning size={size} className={className} />;
    case 'rain':  return <CloudRain      size={size} className={className} />;
    case 'hot':   return <Thermometer    size={size} className={className} />;
    case 'fog':   return <Eye            size={size} className={className} />;
    default:      return <CloudSun       size={size} className={className} />;
  }
};

// ─── Hero gradient by condition ───────────────────────────────────────────────
const heroGradient = (code: string) => ({
  storm: 'from-slate-800 via-slate-900 to-indigo-950',
  rain:  'from-blue-900 via-slate-900 to-blue-950',
  hot:   'from-orange-900 via-red-900 to-slate-950',
  fog:   'from-slate-700 via-slate-800 to-slate-900',
  sunny: 'from-[#0D523C] via-[#065F46] to-[#02130F]',
  cloudy:'from-slate-700 via-slate-800 to-slate-900',
}[code] ?? 'from-[#0D523C] to-[#02130F]');

export const WeatherAlerts = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const navigate   = useNavigate();
  const { theme }  = useData();
  const isDark     = theme === 'dark' || theme === 'midnight';

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchWeatherData('Hyderabad');
      setWeather(data);
      setLastRefresh(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 300_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={cn('min-h-screen pb-40', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>

      {/* ── HEADER ── */}
      <header className={cn(
        'fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 backdrop-blur-xl px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center justify-between border-b',
        isDark ? 'bg-[#070D12]/90 border-white/5' : 'bg-white/90 border-slate-100 shadow-sm'
      )}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
          className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border',
            isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-white border-slate-200 text-slate-600 shadow-sm'
          )}>
          <ChevronLeft size={18} />
        </motion.button>

        <div className="text-center">
          <h1 className={cn('text-xs font-black tracking-tight uppercase', isDark ? 'text-white' : 'text-slate-900')}>{t.weather}</h1>
          <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>
            {weather?.location ? `📍 ${weather.location}` : 'Live Aquaculture Intelligence'}
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={load}
          className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border',
            isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white border-slate-200 text-slate-400 shadow-sm'
          )}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </motion.button>
      </header>


      {/* ── LOADING STATE ── */}
      {loading && !weather && (
        <div className="pt-48 flex flex-col items-center justify-center space-y-4">
          <div className={cn('w-14 h-14 rounded-full border-4 border-t-transparent animate-spin', isDark ? 'border-white/10 border-t-white/60' : 'border-slate-200 border-t-[#C78200]')} />
          <p className={cn('text-[9px] font-black uppercase tracking-widest animate-pulse', isDark ? 'text-white/30' : 'text-slate-400')}>Syncing satellite data…</p>
        </div>
      )}

      <AnimatePresence>
        {weather && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-24 px-4 space-y-4">

            {/* ── HERO WEATHER CARD ── */}
            <motion.div
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
              className={cn('rounded-[2.5rem] overflow-hidden shadow-2xl bg-gradient-to-br relative', heroGradient(weather.conditionCode))}
            >
              {/* Glow blob */}
              <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/5 rounded-full blur-[80px]" />
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-black/20 rounded-full" />

              {/* Main temp display */}
              <div className="relative z-10 px-7 pt-7 pb-5">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-white/40 text-[8px] font-black uppercase tracking-[0.25em] mb-3">
                      {t.currentConditions}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-white font-black text-7xl tracking-tighter leading-none">{weather.temp}</span>
                      <span className="text-white/30 text-3xl font-black">°C</span>
                    </div>
                    <p className="text-white/60 text-sm font-bold mt-2">{weather.condition}</p>
                    <p className="text-white/30 text-[8px] font-black uppercase tracking-widest mt-1">
                      Feels like {weather.feelsLike}°C
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                      <ConditionIcon code={weather.conditionCode} size={32} className="text-white" />
                    </div>
                    <p className="text-white/40 text-[6px] font-black uppercase tracking-widest">
                      {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 border-t border-white/10 pt-5">
                  {[
                    { label: t.humidity,  value: `${weather.humidity}%`,         icon: Droplets },
                    { label: t.wind,      value: `${weather.windSpeed}km/h`,      icon: Wind },
                    { label: 'UV Index',  value: `${weather.uvIndex}`,            icon: Sun },
                    { label: 'Rain %',    value: `${weather.rainChance}%`,        icon: CloudRain },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <s.icon size={14} className="text-white/30 mx-auto mb-1" />
                      <p className="text-white font-black text-sm tracking-tighter leading-none">{s.value}</p>
                      <p className="text-white/30 text-[6px] font-black uppercase tracking-widest mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Lunar strip */}
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon size={13} className="text-white/30" />
                    <p className="text-white/50 text-[8px] font-black uppercase tracking-widest">{weather.lunarPhase}</p>
                  </div>
                  <p className="text-white/30 text-[7px] font-black uppercase tracking-widest">Wind: {weather.windDir}</p>
                </div>
              </div>

              {/* Rain chance bar */}
              <div className="px-7 pb-6">
                <p className="text-white/30 text-[7px] font-black uppercase tracking-widest mb-2">Rain Probability</p>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${weather.rainChance}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', weather.rainChance > 60 ? 'bg-blue-400' : weather.rainChance > 30 ? 'bg-cyan-400' : 'bg-emerald-400')}
                  />
                </div>
              </div>
            </motion.div>

            {/* ── LIVE ALERTS ── */}
            <div className={cn('rounded-[2rem] overflow-hidden border', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
              <div className={cn('px-5 pt-4 pb-3 border-b flex items-center gap-3 bg-gradient-to-r from-[#0D523C] to-[#065F46]')}>
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                  <AlertTriangle size={16} className="text-amber-300" />
                </div>
                <div>
                  <h2 className="text-white font-black text-sm tracking-tight">Real-Time Aquaculture Alerts</h2>
                  <p className="text-emerald-200/50 text-[7px] font-black uppercase tracking-widest">Weather-linked SOP actions</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-emerald-400 text-[7px] font-black uppercase tracking-widest">LIVE</span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {weather.alerts.map((alert, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className={cn('rounded-2xl border overflow-hidden',
                      alert.type === 'critical' ? isDark ? 'bg-red-500/8 border-red-500/20' : 'bg-red-50 border-red-200' :
                      alert.type === 'warning'  ? isDark ? 'bg-amber-500/8 border-amber-500/20' : 'bg-amber-50 border-amber-200' :
                      isDark ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-emerald-50 border-emerald-100'
                    )}
                  >
                    <div className="px-4 pt-4 pb-3 flex items-start gap-3">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                        alert.type === 'critical' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                      )}>
                        {alert.type === 'info'
                          ? <ShieldCheck size={16} className="text-white" />
                          : <AlertTriangle size={16} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className={cn('font-black text-xs tracking-tight',
                          alert.type === 'critical' ? isDark ? 'text-red-300' : 'text-red-800' :
                          alert.type === 'warning'  ? isDark ? 'text-amber-300' : 'text-amber-800' :
                          isDark ? 'text-emerald-300' : 'text-emerald-800'
                        )}>{alert.title}</p>
                        <p className={cn('text-[9px] font-medium leading-relaxed mt-1',
                          isDark ? 'text-white/40' : 'text-slate-600'
                        )}>{alert.desc}</p>
                      </div>
                    </div>
                    <div className={cn('px-4 pb-3 pt-0 border-t flex items-center gap-2',
                      alert.type === 'critical' ? isDark ? 'border-red-500/10' : 'border-red-100' :
                      alert.type === 'warning'  ? isDark ? 'border-amber-500/10' : 'border-amber-100' :
                      isDark ? 'border-emerald-500/10' : 'border-emerald-100'
                    )}>
                      <Activity size={11} className={
                        alert.type === 'critical' ? 'text-red-500' :
                        alert.type === 'warning'  ? 'text-amber-500' : 'text-emerald-500'
                      } />
                      <p className={cn('text-[8px] font-bold',
                        alert.type === 'critical' ? isDark ? 'text-red-400/70' : 'text-red-700' :
                        alert.type === 'warning'  ? isDark ? 'text-amber-400/70' : 'text-amber-700' :
                        isDark ? 'text-emerald-400/70' : 'text-emerald-700'
                      )}>{alert.aqAction}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── 7-DAY FORECAST ── */}
            <div className={cn('rounded-[2rem] overflow-hidden border', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
              <div className={cn('px-5 pt-4 pb-3 border-b flex items-center justify-between', isDark ? 'border-white/5' : 'border-slate-100')}>
                <h2 className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{t.forecast7Day}</h2>
                <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>7-Day Outlook</span>
              </div>

              <div className={cn('divide-y', isDark ? 'divide-white/5' : 'divide-slate-100')}>
                {weather.forecast.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className={cn('px-5 py-3 flex items-center gap-3 hover:bg-opacity-50 transition-all' , (i === 0) ? isDark ? 'bg-white/3' : 'bg-amber-50/50' : '')}
                  >
                    {/* Day */}
                    <p className={cn('font-black text-xs w-11 uppercase tracking-wider flex-shrink-0', i === 0 ? isDark ? 'text-[#C78200]' : 'text-amber-600' : isDark ? 'text-white/70' : 'text-slate-700')}>{f.day}</p>

                    {/* Icon */}
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                      f.icon === 'storm' ? isDark ? 'bg-indigo-500/15' : 'bg-indigo-100' :
                      f.icon === 'rain'  ? isDark ? 'bg-blue-500/15'   : 'bg-blue-100' :
                      f.icon === 'hot'   ? isDark ? 'bg-red-500/15'    : 'bg-red-100' :
                      isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
                    )}>
                      <ConditionIcon code={f.icon} size={16} className={
                        f.icon === 'storm' ? isDark ? 'text-indigo-400' : 'text-indigo-600' :
                        f.icon === 'rain'  ? isDark ? 'text-blue-400'   : 'text-blue-600' :
                        f.icon === 'hot'   ? isDark ? 'text-red-400'    : 'text-red-600' :
                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                      } />
                    </div>

                    {/* Temps */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-800')}>{f.high}°</span>
                        <span className={cn('font-bold text-xs', isDark ? 'text-white/25' : 'text-slate-400')}>{f.low}°</span>
                      </div>
                      <p className={cn('text-[7px] font-black uppercase tracking-widest',
                        f.aqImpact === 'SOP Normal' ? isDark ? 'text-emerald-400/60' : 'text-emerald-600/70' :
                        isDark ? 'text-amber-400/60' : 'text-amber-600/70'
                      )}>{f.aqImpact}</p>
                    </div>

                    {/* Rain bar */}
                    <div className="text-right flex-shrink-0">
                      <p className={cn('text-[8px] font-black', f.rainChance > 50 ? isDark ? 'text-blue-400' : 'text-blue-600' : isDark ? 'text-white/30' : 'text-slate-400')}>
                        {f.rainChance}%
                      </p>
                      <div className={cn('w-12 h-1 rounded-full overflow-hidden mt-1', isDark ? 'bg-white/10' : 'bg-slate-100')}>
                        <div className={cn('h-full rounded-full', f.rainChance > 60 ? 'bg-blue-500' : f.rainChance > 30 ? 'bg-cyan-400' : 'bg-emerald-400')}
                          style={{ width: `${f.rainChance}%` }} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── AI FEED ADJUSTMENT ── */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-[#C78200] to-[#A66C00] rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-2xl shadow-amber-900/40 cursor-pointer"
            >
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/8 rounded-full blur-[60px]" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white/50 text-[7px] font-black uppercase tracking-widest mb-1">AI Weather-Linked</p>
                    <h3 className="text-xl font-black tracking-tight">{t.feedEfficiency || 'Smart Feed Adjustment'}</h3>
                  </div>
                  <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Precipitation Risk', value: weather.rainChance > 60 ? 'HIGH' : weather.rainChance > 30 ? 'MEDIUM' : 'LOW' },
                    { label: 'Auto-Adjust', value: weather.rainChance > 60 ? '-20%' : weather.temp >= 36 ? '-15%' : '-0%' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
                      <p className="text-[6px] font-black text-white/40 uppercase tracking-widest mb-1">{s.label}</p>
                      <p className="text-2xl font-black tracking-tighter text-white">{s.value}</p>
                    </div>
                  ))}
                </div>

                <p className="text-[8px] text-white/60 font-medium mb-4 leading-relaxed italic">
                  {weather.rainChance > 60
                    ? '"Heavy rain changes water chemistry and triggers mass molting. Reduce feed to avoid DO crash."'
                    : weather.temp >= 36
                    ? '"Extreme heat slows shrimp metabolism. Skip noon feed slot to prevent DO stress."'
                    : '"Weather conditions are stable. No automatic feed reduction required today."'}
                </p>

                <div className={cn('w-full py-3.5 text-[#C78200] rounded-2xl font-black text-[9px] text-center uppercase tracking-widest shadow-xl', isDark ? 'bg-white' : 'bg-white')}>
                  Apply Smart Ration
                </div>
              </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
