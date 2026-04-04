import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft,
  Sunrise,
  Sunset,
  Zap,
  TrendingUp,
  Wind,
  Droplets,
  Navigation,
  Waves,
  Sun,
  CloudSun,
  CloudRain,
  MapPin,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  History,
  X,
  Target
} from 'lucide-react';
import type { Translations } from '../../translations';
import { cn } from '../../utils/cn';

export const WeatherFeedAlert = ({ t }: { t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const [showPlan, setShowPlan] = useState(false);
  
  const sunProgress = 0.84; // 16:06

  const isBadWeather = false;

  return (
    <div className="pb-32 bg-[#F6F8F7] min-h-screen text-left relative overflow-hidden font-sans selection:bg-cyan-500/10">
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E0F2F1] via-[#F6F8F7] to-white" />
        <div className="absolute top-[-10%] right-[-10%] w-[120%] h-[40%] bg-cyan-100/30 rounded-full blur-[100px]" />
      </div>

      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-[100] px-5 py-6">
        <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-b border-cyan-900/[0.03]" />
        <div className="relative flex items-center justify-between w-full">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-cyan-100 rounded-xl text-cyan-950 shadow-sm active:scale-95 transition-all">
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#02837C] rounded-lg"><MapPin size={10} className="text-white" /></div>
                <div>
                   <p className="text-[9px] font-black text-cyan-950 tracking-tight leading-none italic uppercase">Nellore Aqua Corridor</p>
                   <p className="text-[6px] font-black text-cyan-900/30 uppercase tracking-[0.2em] mt-0.5">ZONE-B POND MONITOR</p>
                </div>
            </div>
            <div className="w-9 h-9 bg-cyan-950 text-white rounded-xl flex items-center justify-center shadow-lg shadow-cyan-900/10">
                <Waves size={14} />
            </div>
        </div>
      </header>

      <div className="pt-24 px-5 space-y-5 relative z-10">
        
        {/* ── SOLAR TRACKER ── */}
        <div className="bg-white rounded-[2rem] p-6 border border-black/[0.02] shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-serif italic font-bold text-cyan-950 tracking-tight leading-none flex items-center gap-2">Solar Lifecycle</h3>
                    <p className="text-[7px] font-black text-cyan-900/30 uppercase tracking-widest mt-1">Metabolic Index Tracking</p>
                </div>
                <div className="text-right">
                    <p className="text-xl font-black text-cyan-950 tracking-tighter leading-none italic uppercase">16:06</p>
                    <p className="text-[7px] font-black text-[#02837C] uppercase tracking-widest mt-1">Local Time</p>
                </div>
            </div>

            <div className="relative h-28 w-full mt-2 flex items-center justify-center overflow-visible">
                <svg className="w-full h-full" viewBox="0 0 200 100" overflow="visible">
                    <path id="sunLine" d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="rgba(0,105,92,0.06)" strokeWidth="1" strokeDasharray="3 3"/>
                    <motion.path 
                        initial={{ pathLength: 0 }} animate={{ pathLength: sunProgress }} transition={{ duration: 1.5 }}
                        d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round"
                    />
                    <defs>
                        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FB8C00" /><stop offset="100%" stopColor="#FFC107" /></linearGradient>
                    </defs>
                    <motion.g style={{ offsetPath: "path('M 20 90 A 80 80 0 0 1 180 90')", offsetDistance: `${sunProgress * 100}%`, offsetRotate: "none" }}>
                        <circle r="7" fill="#FFC107" filter="drop-shadow(0 0 4px rgba(255,193,7,0.5))" />
                        <Sun size={10} x="-5" y="-5" className="text-white fill-white" />
                    </motion.g>
                </svg>
                <div className="w-full flex justify-between absolute bottom-0 px-1 opacity-60">
                    <div className="flex flex-col items-start"><Sunrise size={10} className="text-[#FB8C00] mb-0.5" /><span className="text-[6px] font-black text-cyan-900/40 uppercase">Rise 06:12</span></div>
                    <div className="flex flex-col items-end"><Sunset size={10} className="text-[#FB8C00] mb-0.5" /><span className="text-[6px] font-black text-cyan-900/40 uppercase">Set 06:24</span></div>
                </div>
            </div>
        </div>

        {/* ── CULTIVATION INTELLIGENCE ── */}
        <section className="relative">
            {isBadWeather ? (
              <div className="bg-red-500 rounded-[2.5rem] p-7 border border-red-400 shadow-xl relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5">
                      <div className="px-3 py-1 bg-white/10 rounded-full border border-white/10 flex items-center gap-2">
                        <AlertTriangle size={12} className="text-white animate-pulse" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Environmental Risk Detected</span>
                      </div>
                    </div>
                    <h2 className="text-2xl font-serif italic font-bold text-white tracking-tight leading-none uppercase">ADAPT FEED INTENSITY</h2>
                    <p className="text-[10px] text-white/80 leading-relaxed font-medium mt-4">Metabolic transit slowing due to rain. Prevent organic load peaks by skipping slot 4.</p>
                    <button onClick={() => navigate('/feed')} className="mt-8 flex items-center gap-3 text-[10px] font-black text-white uppercase tracking-widest">
                      <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center transition-all group-hover:bg-white/20"><TrendingUp size={14} /></div>
                      Execute Adapt Strategy
                    </button>
                  </div>
                  <AlertTriangle size={100} className="absolute -bottom-10 -right-10 text-white opacity-5 -rotate-12" />
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] p-7 border border-black/[0.02] shadow-[0_15px_45px_rgba(2,131,124,0.05)] relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="px-3 py-1 bg-[#02837C]/5 rounded-full border border-[#02837C]/10 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#02837C] animate-pulse" />
                        <span className="text-[8px] font-black text-[#02837C] uppercase tracking-widest">Pond Habitat Stabilized</span>
                      </div>
                      <Target size={14} className="text-[#02837C]/20" />
                    </div>
                    <h2 className="text-2xl font-serif italic font-bold text-cyan-950 tracking-tight leading-none uppercase">GROWTH PEAK: 100%</h2>
                    <p className="text-[10px] text-cyan-900/40 leading-relaxed font-medium mt-4 italic">Solar index is perfectly aligned with shrimp thermoreception. Maintain maximum nutrient push.</p>
                    
                    <div className="mt-8 flex items-center justify-between">
                      <button onClick={() => navigate('/feed')} className="flex items-center gap-3 text-[10px] font-black text-[#02837C] uppercase tracking-widest">
                        <div className="w-8 h-8 bg-[#02837C] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#02837C]/20"><TrendingUp size={14} /></div>
                        Plan Success
                      </button>
                    </div>
                  </div>
              </div>
            )}
        </section>

        {/* ── KEY METRICS ── */}
        <section className="grid grid-cols-2 gap-3">
            <MiniChip icon={Thermometer} label="Aqueous Temp" value="28.5°C" note="Ideal Range" color="cyan" />
            <MiniChip icon={Wind} label="Aeolian Force" value="14km/h" note="High DO" color="emerald" />
        </section>

        {/* ── SEVEN DAY FULL WEEK SCROLLER ── */}
        <section className="space-y-4 px-1 pb-4">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-[9px] font-black text-cyan-950/20 uppercase tracking-[0.3em]">Full Week Strategy</h3>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-cyan-950/20" />
                <span className="text-[7px] font-black text-cyan-950/30 uppercase tracking-[0.2em]">04 APR - 10 APR</span>
              </div>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none px-1">
                {[
                    { day: 'SAT', date: '04', icon: CloudRain, temp: '24°', status: 'RAIN SOP', color: 'text-blue-500', bg: 'bg-blue-50' },
                    { day: 'SUN', icon: CloudSun, temp: '26°', status: 'STABLE', color: 'text-[#02837C]', bg: 'bg-emerald-50' },
                    { day: 'MON', icon: Sun, temp: '29°', status: 'HEAT PEAK', color: 'text-[#02837C]', bg: 'bg-emerald-50' },
                    { day: 'TUE', icon: Wind, temp: '25°', status: 'WINDY', color: 'text-indigo-500', bg: 'bg-indigo-50' },
                    { day: 'WED', icon: CloudSun, temp: '27°', status: 'OPTIMAL', color: 'text-[#02837C]', bg: 'bg-emerald-50' },
                    { day: 'THU', icon: Sun, temp: '30°', status: 'EXTREME', color: 'text-amber-600', bg: 'bg-amber-50' },
                    { day: 'FRI', icon: CloudRain, temp: '23°', status: 'HEAVY RAIN', color: 'text-blue-600', bg: 'bg-blue-100' },
                ].map((item, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={item.day} 
                        className="flex-shrink-0 w-28 bg-white rounded-[2.2rem] p-5 border border-black/[0.01] flex flex-col items-center flex-1 shadow-sm"
                    >
                        <p className="text-[7px] font-black text-cyan-900/30 uppercase mb-2">{item.day}</p>
                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-3 shadow-inner", item.bg)}><item.icon size={18} className={item.color} /></div>
                        <p className="text-xl font-black text-cyan-950 tracking-tighter mb-0.5">{item.temp}</p>
                        <p className={cn("text-[6px] font-black uppercase tracking-widest", item.color)}>{item.status}</p>
                    </motion.div>
                ))}
            </div>
        </section>

        <motion.button onClick={() => setShowPlan(true)} whileTap={{ scale: 0.98 }} className="w-full py-5.5 bg-cyan-950 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.25em] shadow-xl shadow-cyan-950/20">Analyze Strategic Cycle</motion.button>
      </div>

      {/* ── PLAN OVERLAY ── */}
      <AnimatePresence>
        {showPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-cyan-950/20 backdrop-blur-sm flex items-end justify-center px-4 pb-10">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white rounded-[3rem] w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
              <button onClick={() => setShowPlan(false)} className="absolute top-6 right-6 p-2 bg-[#F6F8F7] rounded-full text-cyan-950"><X size={18} /></button>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#02837C] rounded-2xl flex items-center justify-center text-white"><FileCheck size={24} /></div>
                <div><h3 className="text-xl font-serif italic font-bold text-cyan-950 leading-none">Cycle Success Plan</h3><p className="text-[9px] font-black text-[#02837C] uppercase tracking-widest mt-1 italic">Generated for Nellore Pond B</p></div>
              </div>
              <div className="space-y-4">
                <PlanItem icon={TrendingUp} label="Feed Strategy" val="Standard Optimized" note="Maintain high absorption slots (1, 2, 4)" color="emerald" />
                <PlanItem icon={Waves} label="Water Site" val="pH Stabilization Req." note="Prepare buffering for Sat rain" color="cyan" />
                <PlanItem icon={History} label="Aerator Load" val="Hybrid Natural" note="Reduce runtime on Mon/Tue" color="blue" />
              </div>
              <div className="mt-10 grid grid-cols-2 gap-4">
                <button onClick={() => setShowPlan(false)} className="py-5 bg-[#F6F8F7] rounded-2xl text-[9px] font-black uppercase text-cyan-900/40 tracking-widest">Back</button>
                <button onClick={() => setShowPlan(false)} className="py-5 bg-[#02837C] text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg">Sync Strategy</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PlanItem = ({ icon: Icon, label, val, note, color }: { icon: any, label: string, val: string, note: string, color: 'emerald' | 'cyan' | 'blue' }) => {
  const colors = { emerald: 'text-[#02837C] bg-emerald-50', cyan: 'text-cyan-600 bg-cyan-50', blue: 'text-blue-600 bg-blue-50' };
  return (
    <div className="flex gap-4 p-5 bg-[#F4F7F6] rounded-[2rem] border border-black/[0.01]">
       <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", colors[color])}><Icon size={18} /></div>
       <div>
         <p className="text-[7px] font-black text-cyan-900/30 uppercase tracking-widest leading-none mb-1">{label}</p>
         <p className="text-sm font-black text-cyan-950 leading-tight mb-0.5">{val}</p>
         <p className="text-[9px] text-cyan-900/40 font-medium leading-tight">{note}</p>
       </div>
    </div>
  );
};

const MiniChip = ({ icon: Icon, label, value, note, color }: { icon: any, label: string, value: string, note: string, color: 'cyan' | 'emerald' }) => (
    <div className="bg-white p-5 rounded-[2.2rem] border border-black/[0.01] shadow-sm flex flex-col items-center">
        <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center mb-3", color === 'cyan' ? 'bg-cyan-50 text-cyan-700' : 'bg-emerald-50 text-emerald-600')}><Icon size={16} /></div>
        <p className="text-[7px] font-black text-cyan-900/30 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className="text-base font-black text-cyan-950 tracking-tighter leading-none mb-1">{value}</p>
        <p className={cn("text-[7px] font-black uppercase tracking-tighter opacity-60", color === 'cyan' ? 'text-cyan-700' : 'text-[#02837C]')}>{note}</p>
    </div>
);
