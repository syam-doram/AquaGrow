import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  Trash2, 
  Activity, 
  Droplets, 
  Info,
  CheckCircle2,
  Calendar,
  PlusCircle,
  TrendingUp,
  MapPin,
  Clock,
  Zap,
  AlertCircle,
  Stethoscope,
  ShieldCheck,
  Dna,
  ArrowRight,
  Moon,
  Camera,
  Sparkles,
  Thermometer,
  FlaskConical,
  Waves,
  AlertTriangle,
  BarChart2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useData } from '../context/DataContext';
import { MetricCard } from '../components/MetricCard';
import { Translations } from '../translations';
import { calculateDOC } from '../utils/pondUtils';
import { getSOPGuidance } from '../utils/sopRules';
import { cn } from '../utils/cn';

export const PondDetail = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { ponds, deletePond, waterRecords } = useData();
  const pond = ponds.find(p => p.id === id);

  if (!pond) return <div className="p-10 text-center text-[#4A2C2A] font-black uppercase tracking-widest bg-white min-h-screen">Pond not found</div>;

  const currentDoc = calculateDOC(pond.stockingDate);
  const dayOfWeek = new Date().getDay();
  const guidance = getSOPGuidance(currentDoc, dayOfWeek);
  const today = new Date().toISOString().split('T')[0];

  // Today's water conditions
  const todayRecord = waterRecords
    .filter(r => r.pondId === pond.id && r.date === today)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  // All records for this pond (for timeline)
  const pondRecords = waterRecords
    .filter(r => r.pondId === pond.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const hasLoggedToday = !!todayRecord;
  
  // Growth Milestone Logic (Reference)
  const milestones = [
    { g: '5g', val: 5, targetDoc: 30, prevDoc: 0 },
    { g: '10g', val: 10, targetDoc: 45, prevDoc: 30 },
    { g: '15g', val: 15, targetDoc: 60, prevDoc: 45 },
    { g: '20g', val: 20, targetDoc: 75, prevDoc: 60 },
    { g: '25g', val: 25, targetDoc: 90, prevDoc: 75 },
    { g: '30g', val: 30, targetDoc: 105, prevDoc: 90 },
    { g: '35g', val: 35, targetDoc: 125, prevDoc: 105 }
  ];

  const currentWeight = currentDoc >= 125 ? 35 : currentDoc >= 105 ? 30 : currentDoc >= 90 ? 25 : currentDoc >= 75 ? 20 : currentDoc >= 60 ? 15 : currentDoc >= 45 ? 10 : currentDoc >= 30 ? 5 : 2;

  const getTimelineDates = () => {
    const dates = [];
    const start = new Date(pond.stockingDate);
    const end = new Date();
    let count = 0;
    while (start <= end && count < 200) {
      dates.push(new Date(start));
      start.setDate(start.getDate() + 1);
      count++;
    }
    return dates.reverse();
  };

  const handleLevelDelete = () => {
    if (confirm('Are you sure you want to delete this pond? This action cannot be undone.')) {
      deletePond(pond.id);
      navigate('/ponds');
    }
  };

  return (
    <div className="pb-40 bg-[#F8F9FE] min-h-screen text-left">
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-white/95 backdrop-blur-md px-4 py-8 flex items-center justify-between border-b border-black/5">
        <button onClick={() => navigate(-1)} className="p-3 text-[#4A2C2A] hover:bg-black/5 rounded-2xl transition-all">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
            <h1 className="text-sm font-black text-[#4A2C2A] tracking-tighter">{pond.name}</h1>
            <p className="text-[8px] font-black text-[#C78200] uppercase tracking-widest">{pond.species}</p>
        </div>
        <button onClick={handleLevelDelete} className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all">
          <Trash2 size={24} />
        </button>
      </header>
      
      <div className="pt-32 px-4 py-8 space-y-8">
        {/* Growth Stats Hero */}
        <div className="bg-[#0D523C] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <p className="text-emerald-300 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{t.growthMilestones}</p>
                    <h2 className="text-4xl font-black tracking-tighter">{currentWeight}g</h2>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">{t.weightLabel}</p>
                 </div>
                 <div className="flex flex-col items-end gap-1">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                       <Activity size={24} className="text-emerald-300" />
                    </div>
                    <p className="text-[8px] font-black text-emerald-300 uppercase tracking-widest mt-2">DOC: {currentDoc}</p>
                 </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10">
                 <div className="flex items-center justify-between px-2 mb-4">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t.growthMilestones} Analysis</p>
                    <p className="text-[9px] font-black text-emerald-300 uppercase italic">Goal: 35g Maturity</p>
                 </div>
                 <div className="flex justify-between">
                    {milestones.filter(m => [5, 10, 20, 30].includes(m.val)).map((step, i) => {
                       const achieved = currentDoc >= step.targetDoc;
                       return (
                         <div key={i} className="flex flex-col items-center gap-2">
                            <div className={cn(
                              "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                              achieved ? "bg-emerald-400 border-emerald-400 text-[#0D523C]" : "bg-white/5 border-white/20 text-white/20"
                            )}>
                               {achieved ? <CheckCircle2 size={16} /> : <p className="text-[8px] font-black">{step.g.replace('g', '')}</p>}
                            </div>
                            <p className="text-[6px] font-black text-white/40 uppercase">{step.g}</p>
                         </div>
                       );
                    })}
                 </div>
              </div>
           </div>
           <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-400/20 blur-[100px] rounded-full"></div>
        </div>
        {/* ── TODAY'S WATER CONDITIONS CARD ── */}
        {hasLoggedToday ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-5 border border-black/5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Today's Conditions</p>
                <p className="text-[#4A2C2A] font-black text-sm tracking-tight">Water Quality — {today}</p>
              </div>
              <button
                onClick={() => navigate(`/ponds/${pond.id}/monitor`)}
                className="text-[9px] font-black text-[#C78200] bg-[#C78200]/10 px-3 py-1.5 rounded-xl uppercase tracking-widest hover:bg-[#C78200]/20 transition-colors"
              >
                Full Monitor →
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: FlaskConical,  label: 'pH',   value: todayRecord.ph,          unit: '',      warn: todayRecord.ph < 7.5 || todayRecord.ph > 8.5 },
                { icon: Waves,         label: 'DO',   value: todayRecord.do,          unit: 'mg/L',  warn: todayRecord.do < 5 },
                { icon: Thermometer,   label: 'Temp', value: todayRecord.temperature, unit: '°C',    warn: todayRecord.temperature > 32 || todayRecord.temperature < 24 },
                { icon: Droplets,      label: 'Sal',  value: todayRecord.salinity,    unit: 'ppt',   warn: todayRecord.salinity < 10 || todayRecord.salinity > 20 },
              ].map((item, i) => (
                <div key={i} className={cn(
                  'rounded-2xl p-3 text-center border',
                  item.warn ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-100'
                )}>
                  <item.icon size={14} className={cn('mx-auto mb-1', item.warn ? 'text-amber-500' : 'text-emerald-500')} />
                  <p className={cn('font-black text-sm tracking-tighter', item.warn ? 'text-amber-600' : 'text-emerald-600')}>{item.value}</p>
                  <p className="text-[7px] font-black text-[#4A2C2A]/30 uppercase tracking-widest mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
            {(todayRecord.ammonia > 0.05 || todayRecord.do < 5) && (
              <div className="mt-3 bg-red-50 rounded-2xl px-4 py-3 flex items-center gap-2 border border-red-100">
                <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-[10px] font-bold leading-snug">
                  {todayRecord.do < 5 ? '🚨 DO critical — run aerators immediately, stop feeding' :
                   todayRecord.ammonia > 0.05 ? '⚠️ Ammonia high — apply probiotic + zeolite today' : ''}
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          /* CTA to log conditions today */
          <motion.button
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(`/ponds/${pond.id}/water-log`)}
            className="w-full bg-amber-50 border-2 border-dashed border-amber-300 rounded-[2.5rem] p-5 flex items-center justify-between group hover:border-amber-400 hover:bg-amber-100 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white">
                <Droplets size={22} />
              </div>
              <div className="text-left">
                <p className="font-black text-sm text-[#4A2C2A] tracking-tight">Log Today's Conditions</p>
                <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest mt-0.5">pH · DO · Temp · Ammonia · more</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black text-amber-700 bg-amber-200 px-2 py-1 rounded-full uppercase tracking-widest animate-pulse">Not logged</span>
              <ArrowRight size={18} className="text-amber-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        )}

        {/* ── QUICK ACTION ROW ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: BarChart2,   label: 'Monitor',   sublabel: 'Analysis', path: `/ponds/${pond.id}/monitor`, bg: 'bg-indigo-900', text: 'text-white' },
            { icon: Droplets,    label: 'Water Log',  sublabel: 'Daily log', path: `/ponds/${pond.id}/water-log`, bg: 'bg-blue-50', text: 'text-blue-600' },
            { icon: CheckCircle2,label: 'Checklist',  sublabel: 'SOP tasks', path: `/ponds/${pond.id}/entry`, bg: 'bg-[#C78200]/10', text: 'text-[#C78200]' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className={cn(
                'rounded-[2rem] p-4 flex flex-col items-center gap-2 border transition-all active:scale-95',
                i === 0 ? 'border-indigo-800' : 'border-black/5 bg-white',
                item.bg
              )}
            >
              <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', i === 0 ? 'bg-white/15' : `${item.bg}/30`)}>
                <item.icon size={20} className={item.text} />
              </div>
              <p className={cn('font-black text-[11px] tracking-tight', item.text)}>{item.label}</p>
              <p className={cn('text-[8px] font-black uppercase tracking-widest opacity-50', item.text)}>{item.sublabel}</p>
            </button>
          ))}
        </div>

        {/* AI DISEASE DETECTION QUICK LINK */}
        <button 
          onClick={() => navigate('/disease-detection')}
          className="w-full bg-white rounded-[2.5rem] p-6 shadow-sm border border-[#C78200]/10 flex items-center justify-between group hover:border-[#C78200]/30 transition-all active:scale-98 overflow-hidden relative"
        >
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-[#C78200] rounded-[1.8rem] flex items-center justify-center text-white shadow-xl shadow-[#C78200]/20 group-hover:scale-110 transition-transform duration-500">
               <Camera size={28} />
            </div>
            <div className="text-left">
              <h3 className="font-black text-lg tracking-tight text-[#4A2C2A]">{t.aiDisease}</h3>
              <p className="text-[10px] text-[#4A2C2A]/40 font-black uppercase tracking-[0.2em] mt-1">{t.scanShrimpDesc}</p>
            </div>
          </div>
          <div className="text-[#C78200] relative z-10">
             <div className="bg-[#C78200]/5 p-3 rounded-2xl group-hover:bg-[#C78200] group-hover:text-white transition-all">
               <Sparkles size={18} className="animate-pulse" />
             </div>
          </div>
          <div className="absolute right-[-5%] bottom-[-10%] w-32 h-32 bg-[#C78200]/5 blur-3xl rounded-full"></div>
        </button>

        {/* Proactive SOP Mentor (ALERTS & SUGGESTIONS) */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <div>
                 <h2 className="text-[#4A2C2A] font-black text-lg tracking-tight flex items-center gap-2">
                    <Stethoscope size={20} className="text-[#C78200]" /> {t.expertMentor}
                 </h2>
                 <p className="text-[#4A2C2A]/40 text-[9px] font-black uppercase tracking-widest mt-0.5">Live Culture Oversight</p>
              </div>
              <div className="bg-[#C78200]/10 text-[#C78200] px-3 py-1.5 rounded-full flex items-center gap-2">
                 <ShieldCheck size={14} />
                 <span className="text-[8px] font-black uppercase">Protected Mode</span>
              </div>
           </div>

           <div className="space-y-4">
              {guidance.map((item, i) => (
                <div key={i} className={cn(
                  "p-6 rounded-[2.2rem] border transition-all animate-in fade-in slide-in-from-bottom-4",
                  item.type === 'LUNAR'
                    ? "bg-[#1A1C2E] border-white/5 text-white shadow-2xl shadow-indigo-500/10"
                    : item.priority === 'HIGH' 
                      ? "bg-red-50 border-red-100 shadow-xl shadow-red-500/5 text-[#4A2C2A]" 
                      : item.priority === 'MEDIUM' 
                        ? "bg-amber-50 border-amber-100 text-[#4A2C2A]" 
                        : "bg-[#F8F9FE] border-black/5 text-[#4A2C2A]"
                )}>
                   <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-5">
                         <div className={cn(
                           "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                           item.type === 'LUNAR' ? "bg-white/10 text-white backdrop-blur-md" : item.type === 'ALERT' ? "bg-red-500 text-white" : item.type === 'RULE' ? "bg-blue-500 text-white" : "bg-[#C78200] text-white"
                         )}>
                            {item.type === 'LUNAR' ? <Moon size={20} /> : item.type === 'ALERT' ? <AlertCircle size={20} /> : item.type === 'RULE' ? <Dna size={20} /> : <Zap size={20} />}
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                               <h3 className={cn("text-sm font-black tracking-tight", item.type === 'LUNAR' ? "text-white" : "text-[#4A2C2A]")}>{item.title}</h3>
                               {item.priority === 'HIGH' && <span className="text-[6px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">Urgent</span>}
                            </div>
                            <p className={cn("text-[10px] font-black tracking-tight leading-relaxed mt-1.5", item.type === 'LUNAR' ? "text-white/60" : "text-[#4A2C2A]/60")}>
                               {item.description}
                            </p>
                            {(item.brand || item.dose) && (
                               <div className={cn("mt-4 p-4 rounded-2xl border", item.type === 'LUNAR' ? "bg-white/5 border-white/10" : "bg-white/50 border-black/5")}>
                                  <div className="flex items-center justify-between">
                                     {item.brand && (
                                       <div>
                                          <p className="text-[7px] font-black text-[#C78200] uppercase tracking-widest">{t.medicineBrand}</p>
                                          <p className={cn("text-[11px] font-black tracking-tighter mt-0.5", item.type === 'LUNAR' ? "text-white" : "text-[#4A2C2A]")}>{item.brand}</p>
                                       </div>
                                     )}
                                     {item.dose && (
                                        <div className="text-right">
                                           <p className="text-[7px] font-black text-[#C78200] uppercase tracking-widest">{t.recommendedDose}</p>
                                           <p className={cn("text-[11px] font-black tracking-tighter mt-0.5", item.type === 'LUNAR' ? "text-white" : "text-[#4A2C2A]")}>{item.dose}</p>
                                        </div>
                                     )}
                                  </div>
                               </div>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
              ))}
              
              <button 
                onClick={() => navigate(`/ponds/${pond.id}/entry`)}
                className="w-full p-6 bg-white border border-black/5 rounded-[2.2rem] flex items-center justify-between group active:scale-95 transition-all shadow-sm"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#C78200]/10 text-[#C78200] rounded-xl flex items-center justify-center">
                       <CheckCircle2 size={20} />
                    </div>
                    <span className="text-sm font-black text-[#4A2C2A] tracking-tight">{t.viewChecklist}</span>
                 </div>
                 <ArrowRight size={20} className="text-[#C78200] group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </section>

        {/* Standard Timeline dates */}
        <section>
          <div className="flex items-center justify-between mb-6 px-2">
            <div>
               <h3 className="text-[#4A2C2A] font-black text-lg tracking-tight">{t.cultureTimeline}</h3>
               <p className="text-[#4A2C2A]/40 text-[9px] font-black uppercase tracking-widest mt-0.5">{t.dailyStats}</p>
            </div>
          </div>
          <div className="space-y-3">
             {getTimelineDates().slice(0, 5).map((date, i) => {
                const dateStr = date.toISOString().split('T')[0];
                const rec = pondRecords.find(r => r.date === dateStr);
                const dayDoc = currentDoc - i;
                const dayWeight = Math.max(0, currentWeight - (i * 0.45));
                return (
                  <div
                    key={i}
                    onClick={() => navigate(`/ponds/${pond.id}/monitor`)}
                    className="bg-white p-5 rounded-[2.2rem] shadow-sm flex items-center justify-between border border-black/5 cursor-pointer hover:border-emerald-200 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex flex-col items-center justify-center",
                        i === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-[#F8F9FE] text-[#4A2C2A]/40'
                      )}>
                        <p className="text-[6px] font-black uppercase tracking-widest mb-0">{date.toLocaleString('default', { month: 'short' })}</p>
                        <p className="text-lg font-black tracking-tighter mt-[-2px]">{date.getDate()}</p>
                      </div>
                      <div>
                        <p className="text-[#4A2C2A] font-black text-sm tracking-tight">
                          {i === 0 ? "Today" : `DOC ${dayDoc}`}
                        </p>
                        {rec ? (
                          <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500 mt-1 flex items-center gap-1">
                            <CheckCircle2 size={9} /> pH {rec.ph} · DO {rec.do} · {rec.temperature}°C
                          </p>
                        ) : (
                          <p className="text-[8px] font-black uppercase tracking-widest text-amber-400 mt-1">
                            Not logged yet
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-[#4A2C2A]">{dayWeight.toFixed(1)}g</p>
                      <p className="text-[7px] text-[#4A2C2A]/20 font-black uppercase tracking-widest mt-0.5">{t.weightLabel}</p>
                    </div>
                  </div>
                );
             })}
          </div>
        </section>

        <div className="space-y-4">
           <div 
             onClick={() => navigate(`/ponds/${pond.id}/sop`)}
             className="p-6 bg-[#C78200] rounded-[2.5rem] text-white shadow-xl shadow-[#C78200]/20 flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-all"
           >
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <CheckCircle2 size={24} />
                 </div>
                 <div>
                    <h3 className="font-black text-sm tracking-tight">{t.cultureSOP}</h3>
                    <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mt-1">Golden Rules & Schedule</p>
                 </div>
              </div>
              <ChevronLeft size={20} className="rotate-180 opacity-40 group-hover:translate-x-1 transition-transform" />
           </div>
        </div>
      </div>
    </div>
  );
};
