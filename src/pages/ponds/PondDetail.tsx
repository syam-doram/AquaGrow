import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight,
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
   Scale,
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
   Fish,
   ShoppingBag,
   History,
   Send,
   UserCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useData } from '../../context/DataContext';
import { MetricCard } from '../../components/MetricCard';
import type { Translations } from '../../translations';
import { calculateDOC, calculateWeight } from '../../utils/pondUtils';
import { getSOPGuidance } from '../../utils/sopRules';
import { cn } from '../../utils/cn';
import { ConfirmModal } from '../../components/ConfirmModal';
import { AlertModal } from '../../components/AlertModal';

const safeNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};

export const PondDetail = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { ponds, deletePond, waterRecords, feedLogs, theme, harvestRequests } = useData();
  const pond = ponds.find(p => p.id === id);
  const currentRequest = harvestRequests?.find((r: any) => (r.pondId?.toString() === pond?.id?.toString() || r.pondId?.toString() === (pond as any)?._id?.toString()) && r.status !== 'completed' && r.status !== 'cancelled');

  if (!pond) return <div className="p-10 text-center text-ink font-black uppercase tracking-widest bg-card min-h-screen">{t.pondNotFound}</div>;

  const currentDoc = calculateDOC(pond.stockingDate);
  const isPlanned = pond.status === 'planned';
  const currentWeight = isPlanned ? 0 : calculateWeight(currentDoc);
  const guidance = getSOPGuidance(isPlanned ? -1 : currentDoc, new Date());
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

  // ── Feed Consumption Intelligence ──
  const pondFeedLogs = feedLogs.filter(f => f.pondId === pond.id);
  const totalFeedKg = pondFeedLogs.reduce((acc, f) => acc + safeNum(f.quantity), 0);
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weeklyFeedKg = pondFeedLogs
    .filter(f => new Date(f.date) >= sevenDaysAgo)
    .reduce((acc, f) => acc + safeNum(f.quantity), 0);

  // Harvesting Yield Analysis (Biomass is either theoretical or FCR based)
  // Standard FCR for Vannamei is ~1.2 to 1.5. Using 1.4 as expert benchmark.
  const theoreticalYield = (safeNum(pond.seedCount) * 0.82 * currentWeight) / 1000;
  const fcrBasedYield = totalFeedKg / 1.4;
  
  // Use whichever is more realistic based on age
  const estHarvestYield = currentDoc < 20 ? theoreticalYield : Math.max(theoreticalYield, fcrBasedYield);
  const weeklyFeedExp = weeklyFeedKg * 60; // ₹60/kg average feed price
  
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
    if (currentDoc > 7) {
      setShowDeleteAlert(true);
      return;
    }
    setShowDeleteConfirm(true);
  };

  return (
    <div className="pb-40 bg-transparent min-h-screen text-left">
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 bg-card/95 backdrop-blur-md px-4 pt-[calc(env(safe-area-inset-top)+0.8rem)] pb-4 flex items-center justify-between border-b border-card-border">
        <button onClick={() => navigate(-1)} className="p-3 text-ink hover:bg-ink/5 rounded-2xl transition-all">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
            <h1 className="text-sm font-black text-ink tracking-tighter">{pond.name}</h1>
            <p className="text-[8px] font-black text-[#C78200] uppercase tracking-widest">{pond.species}</p>
        </div>
        <button onClick={handleLevelDelete} className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all">
          <Trash2 size={24} />
        </button>
      </header>
      
      <div className="pt-[calc(env(safe-area-inset-top)+6.5rem)] px-4 pb-8 space-y-6">
        {/* ── LIVE MARKETPLACE TRACKER ── */}
        {(pond.status === 'harvest_pending' || currentRequest) && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             onClick={() => navigate(`/ponds/${id}/tracking`)}
             className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
           >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                 <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 text-white group-hover:rotate-12 transition-transform">
                    <ShoppingBag size={24} />
                 </div>
                 <div className="flex-1">
                    <h3 className="text-sm font-black text-indigo-900 tracking-tight">Market Sale Journey</h3>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-0.5 animate-pulse">Live Tracking Active</p>
                 </div>
                 <ChevronRight size={20} className="text-indigo-300 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="relative z-10 space-y-3">
                 <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-indigo-900/40 uppercase tracking-tight">Progress Status</p>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-full">
                       {currentRequest?.status?.replace('_', ' ') || 'Selling Stage'}
                    </span>
                 </div>
                 
                 <div className="flex gap-1 h-1.5 w-full bg-indigo-100/50 rounded-full overflow-hidden">
                    {['pending', 'accepted', 'quality_checked', 'weighed', 'rate_confirmed', 'harvested', 'paid', 'completed'].map((s, i, a) => {
                       const currentIdx = a.indexOf(currentRequest?.status || 'pending');
                       const isDone = a.indexOf(s) <= currentIdx;
                       return (
                          <div key={i} className={cn(
                             "flex-1 h-full rounded-full transition-all duration-1000",
                             isDone ? "bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.3)]" : "bg-transparent"
                          )} />
                       );
                    })}
                 </div>

                 <p className="text-[10px] font-medium text-indigo-900/50 leading-relaxed mt-4 italic">
                    Tap to view your detailed sale timeline and settlement breakdown.
                 </p>
              </div>
           </motion.div>
        )}

        {/* ── COMPACT TACTICAL HERO ── */}
        <div className={cn(
          "rounded-[2rem] p-6 text-white relative overflow-hidden shadow-2xl transition-all", 
          pond.status === 'planned' ? "bg-indigo-900" : 
          pond.status === 'harvest_pending' ? "bg-[#312E81]" : // Deep indigo for selling
          pond.status === 'harvested' ? "bg-[#064E3B]" :
          "bg-[#0D523C]"
        )}>
           <div className="relative z-10">
              <div className="flex justify-between items-center mb-5">
                 <div>
                    <p className="text-emerald-300 text-[8px] font-black uppercase tracking-[0.2em] mb-0.5">
                      {pond.status === 'harvest_pending' ? 'Market Tracking' : 
                       pond.status === 'planned' ? 'SOP Phase' : 
                       pond.status === 'harvested' ? 'Cycle Summary' :
                       t.growthMilestones}
                    </p>
                    <h2 className="text-3xl font-black tracking-tighter">
                      {pond.status === 'harvest_pending' ? 'Selling Stage' :
                       pond.status === 'planned' ? 'Water Prep' :
                       pond.status === 'harvested' ? 'Cycle Done' :
                       `${currentWeight}g`} 
                      {pond.status === 'active' && <span className="text-[10px] text-white/40 tracking-normal ml-1">avg</span>}
                    </h2>
                 </div>
                 <div className="text-right">
                    <p className="text-[14px] font-black text-emerald-300 tracking-tighter leading-tight">
                       {pond.status === 'harvest_pending' ? 'TRACKING' :
                        pond.status === 'planned' ? `PREP: ${Math.abs(currentDoc)}d` : 
                        `DOC ${currentDoc}`}
                    </p>
                   <p className="text-[7px] text-white/30 font-black uppercase tracking-widest mt-0.5">
                      {pond.status === 'harvest_pending' ? 'Market Linked' : 
                       pond.status === 'planned' ? 'Pre-Stocking' : 
                       pond.status === 'harvested' ? 'Archived' :
                       'Vannamei Pulse'}
                    </p>
                    {pond.status === 'harvest_pending' && (
                       <div className="mt-4 flex justify-end">
                          <button 
                            onClick={() => navigate(`/ponds/${id}/tracking`)}
                            className="bg-emerald-500 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest animate-bounce shadow-lg shadow-emerald-500/50"
                          >
                             Track Live Sale
                          </button>
                       </div>
                    )}
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-6 pt-3 border-t border-white/5">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                       <Fish size={14} className="text-emerald-400" />
                    </div>
                    <div>
                       <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">Est. {isPlanned ? 'Pond Capacity' : 'Yield'}</p>
                       <p className="text-sm font-black tracking-tight text-white">{isPlanned ? `${(safeNum(pond.seedCount)/1000).toFixed(0)}k PLs` : `${estHarvestYield.toFixed(0)} kg`}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                       <Zap size={14} className="text-amber-400" />
                    </div>
                    <div>
                       <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">{isPlanned ? 'Prep Progress' : 'Weekly Exp.'}</p>
                       <p className="text-sm font-black tracking-tight text-white">{isPlanned ? 'Active' : `₹${weeklyFeedExp.toLocaleString()}`}</p>
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-white/10 relative">
                 <div className="flex items-center justify-between px-2 mb-6">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{isPlanned ? 'Preparation Timeline' : `${t.growthMilestones} Analysis`}</p>
                    <p className="text-[9px] font-black text-emerald-300 uppercase italic">{isPlanned ? 'Goal: Healthy Bloom' : 'Goal: 35g Maturity'}</p>
                 </div>
                 
                 <div className="relative mb-8">
                    {/* Horizontal Progress Line */}
                    <div className="absolute top-[18px] left-[10%] right-[10%] h-[1px] bg-white/10 -z-10" />
                    <div 
                       className="absolute top-[18px] left-[10%] h-[1px] bg-emerald-400 -z-10 transition-all duration-1000 shadow-[0_0_8px_rgba(52,211,153,0.5)]" 
                       style={{ width: isPlanned ? '0%' : `${Math.max(0, Math.min(80, (currentDoc / 105) * 80))}%` }}
                    />

                    <div className="flex justify-between items-start">
                       {milestones.filter(m => [5, 10, 20, 30].includes(m.val)).map((step, i) => {
                          const achieved = !isPlanned && currentDoc >= step.targetDoc;
                          const active = !isPlanned && currentDoc < step.targetDoc && (i === 0 || currentDoc >= milestones.filter(m => [5,10,20,30].includes(m.val))[i-1].targetDoc);

                          return (
                            <div key={i} className="flex flex-col items-center gap-2 group relative">
                               <div className={cn(
                                 "w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-700 relative",
                                 achieved ? "bg-emerald-400 border-emerald-400 text-[#0D523C]" : 
                                 active ? "bg-[#0D523C] border-emerald-400 text-emerald-400 border-dashed" :
                                 "bg-card/5 border-white/10 text-white/20"
                               )}>
                                  {achieved ? <CheckCircle2 size={18} /> : <p className="text-[9px] font-black">{step.g.replace('g', '')}</p>}
                                  {active && <div className="absolute -inset-2 bg-emerald-400/20 rounded-full animate-ping -z-10" />}
                               </div>
                               <div className="text-center">
                                  <p className={cn("text-[7px] font-black uppercase tracking-widest", achieved ? "text-emerald-400" : "text-white/40")}>{step.g}</p>
                                  <p className="text-[6px] font-bold text-white/20 uppercase tracking-tighter mt-0.5">DOC {step.targetDoc}</p>
                                </div>
                             </div>
                           );
                        })}
                     </div>
                  </div>
 
                  {/* Contextual Focus & Insight */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        {isPlanned ? <Info size={16} className="text-emerald-400" /> : <TrendingUp size={16} className="text-emerald-400" />}
                        <div>
                           <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{isPlanned ? 'Current Focus' : 'Next Up Milestone'}</p>
                           <p className="text-[10px] font-black text-white italic">
                              {isPlanned 
                                ? 'Developing water color & bloom foundation'
                                : `Target ${milestones.filter(m => [5, 10, 20, 30].includes(m.val)).find(m => currentDoc < m.targetDoc)?.g} → In ${Math.max(0, (milestones.filter(m => [5, 10, 20, 30].includes(m.val)).find(m => currentDoc < m.targetDoc)?.targetDoc || 0) - currentDoc)} Days`
                              }
                           </p>
                        </div>
                     </div>
                     <button 
                        className="p-2 bg-white/10 rounded-xl transition-all active:scale-95" 
                        onClick={() => navigate(isPlanned ? '/medicine' : `/ponds/${pond.id}/monitor`)}
                     >
                        <ArrowRight size={14} className="text-emerald-300" />
                     </button>
                  </div>
               </div>
            </div>
            <div className={cn("absolute -right-20 -top-20 w-80 h-80 blur-[100px] rounded-full", isPlanned ? "bg-indigo-400/20" : "bg-emerald-400/20")}></div>
         </div>
        {/* ── TODAY'S WATER CONDITIONS CARD ── */}
        {/* ── COMPACT MONITOR & ACTIONS ── */}
        <div className="bg-card rounded-[2rem] p-2 border border-card-border shadow-sm">
           <div className="grid grid-cols-2 gap-2">
              {/* Water Card */}
              <div className="bg-emerald-50/50 rounded-[1.5rem] p-3 border border-emerald-100/50">
                 <div className="flex items-center justify-between mb-3">
                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">{t.waterQuality}</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div className="text-center">
                       <p className="text-[12px] font-black text-emerald-600">{todayRecord?.ph || '—'}</p>
                       <p className="text-[6px] font-black text-ink/30 uppercase">pH</p>
                    </div>
                    <div className="text-center">
                       <p className="text-[12px] font-black text-emerald-600">{todayRecord?.do || '—'}</p>
                       <p className="text-[6px] font-black text-ink/30 uppercase">DO</p>
                    </div>
                 </div>
                 <button onClick={() => navigate(`/ponds/${pond.id}/water-log`)} className="w-full mt-3 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">
                    Log Data
                 </button>
              </div>

              {/* Actions Card */}
              <div className="grid grid-rows-3 gap-2">
                 {[
                   { icon: BarChart2, label: t.monitor, path: `/ponds/${pond.id}/monitor`, bg: 'bg-indigo-900', text: 'text-white' },
                   { icon: CheckCircle2, label: t.checklist, path: `/ponds/${pond.id}/entry`, bg: 'bg-amber-50', text: 'text-[#C78200]' },
                   { icon: Camera, label: t.scanShrimp || 'AI Scan', path: '/disease-detection', bg: 'bg-purple-900', text: 'text-white' },
                 ].map((item, i) => (
                   <button 
                     key={i} 
                     onClick={() => navigate(item.path)}
                     className={cn("w-full h-full rounded-[1.2rem] flex items-center justify-between px-3 transition-all active:scale-95 border border-white/5 shadow-sm", item.bg)}
                   >
                     <span className={cn("text-[9px] font-black uppercase tracking-widest", item.text)}>{item.label}</span>
                     <item.icon size={12} className={item.text} />
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Proactive SOP Mentor (ALERTS & SUGGESTIONS) */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <div>
                 <h2 className="text-ink font-black text-lg tracking-tight flex items-center gap-2">
                    <Stethoscope size={20} className="text-[#C78200]" /> {t.expertMentor}
                 </h2>
                 <p className="text-ink/40 text-[9px] font-black uppercase tracking-widest mt-0.5">{t.liveCultureOversight}</p>
              </div>
              <div className="bg-[#C78200]/10 text-[#C78200] px-3 py-1.5 rounded-full flex items-center gap-2">
                 <ShieldCheck size={14} />
                 <span className="text-[8px] font-black uppercase">{t.protectedMode}</span>
              </div>
           </div>

           <div className="space-y-2">
              {guidance.slice(0, 3).map((item, i) => (
                <div key={i} className={cn(
                  "p-4 rounded-[1.5rem] border flex items-center gap-4",
                  item.type === 'LUNAR' ? "bg-[#1A1C2E] text-white" : "bg-card border-card-border"
                )}>
                   <div className={cn(
                     "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                     item.type === 'LUNAR' ? "bg-white/5" : "bg-[#C78200]/10 text-[#C78200]"
                   )}>
                      {item.type === 'LUNAR' ? <Moon size={16} /> : <Zap size={16} />}
                   </div>
                   <div className="flex-1 min-w-0">
                      <h3 className="text-[11px] font-black truncate">{item.title}</h3>
                      <p className="text-[9px] opacity-60 truncate">{item.description}</p>
                   </div>
                   <ArrowRight size={14} className="opacity-20" />
                </div>
              ))}
            </div>
        </section>

        {/* Standard Timeline dates */}
        <section>
          <div className="flex items-center justify-between mb-6 px-2">
            <div>
               <h3 className="text-ink font-black text-lg tracking-tight">{isPlanned ? 'Preparation Schedule' : t.cultureTimeline}</h3>
               <p className="text-ink/40 text-[9px] font-black uppercase tracking-widest mt-0.5">
                 {isPlanned 
                   ? `Target Stocking: ${new Date(pond.stockingDate).toLocaleDateString()} • ${Math.abs(currentDoc)} Days Left`
                   : `Total Cycle: 100 Days • ${100 - currentDoc > 0 ? `${100 - currentDoc} Days Remaining` : 'Full Maturity'}`
                 }
               </p>
            </div>
          </div>
          <div className="max-h-[480px] overflow-y-auto scrollbar-hide pr-1 space-y-3 pb-8">
             {getTimelineDates().map((date, i) => {
                const dateStr = date.toISOString().split('T')[0];
                const rec = pondRecords.find(r => r.date === dateStr);
                const dayDoc = currentDoc - i;
                const dayWeight = calculateWeight(dayDoc);
                return (
                  <div
                    key={i}
                    onClick={() => navigate(`/ponds/${pond.id}/water-log/${dateStr}`)}
                    className="bg-card p-3 rounded-[1.5rem] shadow-sm flex items-center justify-between border border-card-border cursor-pointer hover:border-emerald-200 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0",
                        i === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-[#F8F9FE] text-ink/40'
                      )}>
                        <p className="text-[5px] font-black uppercase tracking-widest leading-none">{date.toLocaleString('default', { month: 'short' })}</p>
                        <p className="text-sm font-black tracking-tighter">{date.getDate()}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-ink font-black text-[11px] tracking-tight truncate">
                          {i === 0 ? `${t.today} (DOC ${dayDoc})` : `DOC ${dayDoc}`}
                        </p>
                        {rec ? (
                          <p className="text-[7px] font-black uppercase tracking-widest text-emerald-500 mt-0.5 flex items-center gap-1">
                            pH {rec.ph} · DO {rec.do}
                          </p>
                        ) : (
                          <p className="text-[7px] font-black uppercase tracking-widest text-ink/20 mt-0.5">
                            No Log
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-black text-ink leading-none">{dayWeight.toFixed(1)}g</p>
                      <p className="text-[6px] text-ink/20 font-black uppercase tracking-widest mt-1">Weight</p>
                    </div>
                  </div>
                );
             })}
          </div>
        </section>

        <div className="space-y-4">
           {pond.status === 'active' && (
             <div 
               onClick={() => navigate(`/ponds/${pond.id}/harvest`)}
               className="p-6 bg-[#0D523C] rounded-[2.5rem] text-white shadow-xl shadow-[#0D523C]/20 flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-all"
             >
                <div className="flex items-center gap-6">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                      <ShoppingBag size={24} className="text-emerald-400" />
                   </div>
                   <div>
                      <h3 className="font-black text-sm tracking-tight text-emerald-400">Finalize Cycle</h3>
                      <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mt-1">Submit Harvest Order</p>
                   </div>
                </div>
                <ChevronLeft size={20} className="rotate-180 opacity-40 group-hover:translate-x-1 transition-transform" />
             </div>
           )}

           <div 
             onClick={() => navigate(`/ponds/${pond.id}/sop`)}
             className="p-6 bg-[#C78200] rounded-[2.5rem] text-white shadow-xl shadow-[#C78200]/20 flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-all"
           >
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 bg-card/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <CheckCircle2 size={24} />
                 </div>
                 <div>
                    <h3 className="font-black text-sm tracking-tight">{t.cultureSOP}</h3>
                    <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mt-1">{t.goldenRulesSchedule}</p>
                 </div>
              </div>
              <ChevronLeft size={20} className="rotate-180 opacity-40 group-hover:translate-x-1 transition-transform" />
           </div>

           {pond.status === 'harvested' && pond.harvestData && (
             <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem] space-y-6">
                <div className="flex items-center gap-4 text-emerald-600">
                   <ShoppingBag size={24} />
                   <h3 className="text-lg font-black tracking-tight uppercase">Harvest Summary</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <p className="text-[8px] font-black text-emerald-800/40 uppercase tracking-widest">Total Biomass</p>
                      <p className="text-xl font-black text-emerald-900">{pond.harvestData.totalBiomass} Kg</p>
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-emerald-800/40 uppercase tracking-widest">Average Weight</p>
                      <p className="text-xl font-black text-emerald-900">{pond.harvestData.avgWeight}g</p>
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-emerald-800/40 uppercase tracking-widest">Market Rate</p>
                      <p className="text-xl font-black text-emerald-900">₹{pond.harvestData.marketRate}/Kg</p>
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-emerald-800/40 uppercase tracking-widest">Total Revenue</p>
                      <p className="text-xl font-black text-emerald-600">₹{(parseFloat(pond.harvestData.totalBiomass) * parseFloat(pond.harvestData.marketRate)).toLocaleString()}</p>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
           deletePond(pond.id);
           navigate('/ponds');
        }}
        title="Delete Pond?"
        message="This action will permanently purge all culture data and growth history for this pond."
        confirmText="Confirm Delete"
        cancelText="Cancel"
      />

      <AlertModal 
        isOpen={showDeleteAlert}
        onClose={() => setShowDeleteAlert(false)}
        title="Deletion Locked"
        message="Since this pond is now over DOC 7, it cannot be deleted to preserve the historical yield and finance records of this culture cycle."
        buttonText="I Understand"
      />
    </div>
  );
};
