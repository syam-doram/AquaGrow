import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  ShieldCheck, 
  Droplets, 
  Zap, 
  Pill,
  Utensils,
  AlertTriangle,
  Bell,
  X,
  ChevronRight,
  Activity,
  Thermometer,
  Fish,
  Cloud,
  Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../../components/Header';
import { useData } from '../../context/DataContext';
import { NoPondState } from '../../components/NoPondState';
import { ServerErrorState } from '../../components/ServerErrorState';
import { cn } from '../../utils/cn';
import { calculateDOC } from '../../utils/pondUtils';
import { getLunarStatus } from '../../utils/lunarUtils';
import { analyzePondSituation, buildSituationInputs } from '../../utils/situationEngine';

interface SOPTask {
  type: string;
  med: string;
  desc: string;
  priority: string;
  appType: 'WATER' | 'FEED';
  category: 'MEDICINE' | 'FEED' | 'WATER' | 'MOLTING';
}

interface SOPRange {
  doc: string;
  title: string;
  emoji: string;
  bg: string;
  accent: string;
  tasks: SOPTask[];
}

const SOP_DOC_RANGES: SOPRange[] = [
  {
    doc: 'PRE-STOCKING',
    title: 'Pond Preparation & Bio-Security',
    emoji: '🏗️',
    bg: 'bg-blue-100',
    accent: 'blue',
    tasks: [
      { type: 'Soil', med: 'Drying & Tilling', desc: 'Sun-dry until soil cracks (7-10 days)', priority: 'HIGH', appType: 'WATER', category: 'WATER' },
      { type: 'Treatment', med: 'Liming (Dolomite)', desc: 'Adjust soil pH to 7.5-8.5', priority: 'HIGH', appType: 'WATER', category: 'WATER' },
      { type: 'Sterilization', med: 'TCC / Chlorine 30ppm', desc: 'Kill pathogens before filling', priority: 'HIGH', appType: 'WATER', category: 'WATER' },
      { type: 'Conditioning', med: 'Bloom Development', desc: 'Molasses + Probiotics (Organic Juice)', priority: 'HIGH', appType: 'WATER', category: 'WATER' },
      { type: 'Mineralization', med: 'Pre-Stocking Mix', desc: 'Add 20kg/acre minerals for water aging', priority: 'MEDIUM', appType: 'WATER', category: 'MOLTING' }
    ]
  },
  {
    doc: '1-10',
    title: 'Nursery (Baby) Stage',
    emoji: '🟢',
    bg: 'bg-emerald-50',
    accent: 'emerald',
    tasks: [
      { type: 'Daily', med: 'Gut Probiotic Foundation', desc: 'CP Gut Probiotic (5-10g/kg)', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
      { type: 'Daily', med: 'Starter Micro-Feed', desc: 'Protein 38%+, apply 4-5 times/day', priority: 'HIGH', appType: 'FEED', category: 'FEED' },
      { type: '3-Day', med: 'Water Probiotic (1st)', desc: 'Establish microbes (250g/acre)', priority: 'MEDIUM', appType: 'WATER', category: 'WATER' },
      { type: 'Weekly', med: 'Mineral Mix (Baby)', desc: '5-10 kg / acre for initial shell forming', priority: 'MEDIUM', appType: 'WATER', category: 'MOLTING' },
      { type: 'Anti-Stress', med: 'Vitamin C + Betaine', desc: 'Apply during stocking (DOC 1-3)', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' }
    ]
  },
  {
    doc: '11-20',
    title: 'Early Shuffling Phase',
    emoji: '🟡',
    bg: 'bg-blue-50',
    accent: 'blue',
    tasks: [
      { type: 'Daily', med: 'Gut Conditioners', desc: 'Maintain flora (Avanti Gut Health)', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
      { type: 'Feed', med: 'Transition to Grade 1S', desc: 'Gradually mix starter with grower', priority: 'MEDIUM', appType: 'FEED', category: 'FEED' },
      { type: '5-Day', med: 'Soil Probiotics', desc: 'Bottom bacteria (Sanolife PRO-W)', priority: 'HIGH', appType: 'WATER', category: 'WATER' },
      { type: 'DOC 15', med: 'Vitamin C Spike', desc: 'Critical immunity booster', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
      { type: 'Weekly', med: 'Mineral Check', desc: 'Adjust Ca:Mg ratio (3:1 suggested)', priority: 'MEDIUM', appType: 'WATER', category: 'MOLTING' }
    ]
  },
  {
    doc: '21-30',
    title: 'Risk Transition Stage',
    emoji: '🟠',
    bg: 'bg-amber-50',
    accent: 'amber',
    tasks: [
      { type: 'Alternate', med: 'Water Probiotic', desc: 'Maintain clean water column', priority: 'HIGH', appType: 'WATER', category: 'WATER' },
      { type: 'Molting', med: 'Mineral Mix High', desc: '10-15 kg / acre (Night apply)', priority: 'HIGH', appType: 'WATER', category: 'MOLTING' },
      { type: 'DOC 25', med: 'Immunity Pulse', desc: 'Prepare for critical DOC 30', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
      { type: 'Tray Check', med: 'Feed Consumption Audit', desc: 'Observe for waste feed on trays', priority: 'HIGH', appType: 'FEED', category: 'FEED' },
      { type: 'Vigilance', med: 'Tail Redness Check', desc: 'Scan for early Vibriosis signs', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' }
    ]
  },
  {
    doc: '31-45',
    title: 'Critical Warning Stage',
    emoji: '🔴',
    bg: 'bg-red-50',
    accent: 'red',
    tasks: [
      { type: 'Daily', med: 'Gut (Shield)', desc: 'Max intestinal protection', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
      { type: 'Feed', med: 'Meal Reduction Strategy', desc: 'Reduce feed by 10% on cloudy days', priority: 'HIGH', appType: 'FEED', category: 'FEED' },
      { type: '2-3 Days', med: 'Water (Anti-Vir)', desc: 'Combat viral load risk (Bioclean)', priority: 'HIGH', appType: 'WATER', category: 'WATER' },
      { type: 'DOC 40', med: 'Vit-Min Booster', desc: 'Metabolic boost at critical peak', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
      { type: 'Molting', med: 'Ashtami Mineral Pulse', desc: 'High dose before moon peak', priority: 'HIGH', appType: 'WATER', category: 'MOLTING' },
      { type: 'DO Alert', med: 'Max Aeration (9PM-5AM)', desc: 'Maintain DO above 4.5 mg/L', priority: 'HIGH', appType: 'WATER', category: 'WATER' }
    ]
  },
  {
    doc: '46-60',
    title: 'High Growth Spurt',
    emoji: '🔵',
    bg: 'bg-indigo-50',
    accent: 'indigo',
    tasks: [
      { type: 'Every 2d', med: 'Water Probiotic (Max)', desc: 'Waste removal during 1g spike', priority: 'HIGH', appType: 'WATER', category: 'WATER' },
      { type: 'Weekly', med: 'Mineral Mix 20kg', desc: 'Full mineralization support', priority: 'HIGH', appType: 'WATER', category: 'MOLTING' },
      { type: 'DOC 50', med: 'Liver Tonic', desc: 'Hepatopancreas protection', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
      { type: 'Feed', med: 'Grade 2 Feed + Probiotics', desc: 'Optimize FCR to 1.3-1.4 range', priority: 'HIGH', appType: 'FEED', category: 'FEED' }
    ]
  },
  {
    doc: '61-80',
    title: 'Late Cycle Stability',
    emoji: '🟣',
    bg: 'bg-purple-50',
    accent: 'purple',
    tasks: [
      { type: 'Regular', med: 'Water Probiotic Pulse', desc: 'Moderate water conditioning', priority: 'MEDIUM', appType: 'WATER', category: 'WATER' },
      { type: 'Weekly', med: 'Mineral Mix 25kg', desc: 'Prepare for final heavy molts', priority: 'HIGH', appType: 'WATER', category: 'MOLTING' },
      { type: 'DOC 70', med: 'Final Immunity Boost', desc: 'Prevent harvest-stage crashes', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
      { type: 'Feed', med: 'Tray Vigilance', desc: 'Stop feeding if 10% tray leftovers', priority: 'HIGH', appType: 'FEED', category: 'FEED' }
    ]
  },
  {
    doc: '81-100',
    title: 'Final Harvest Prep',
    emoji: '⚫',
    bg: 'bg-slate-100',
    accent: 'slate',
    tasks: [
      { type: 'Weekly', med: 'Mineral Pulse Light', desc: '10kg / acre for shell hardness', priority: 'LOW', appType: 'WATER', category: 'MOLTING' },
      { type: 'DOC 90+', med: 'Withdrawal Protocol', desc: 'ZERO heavy medicines, clean water', priority: 'HIGH', appType: 'WATER', category: 'MEDICINE' },
      { type: 'Alert', med: 'Harvest Check-trays', desc: 'Final check for shell quality', priority: 'HIGH', appType: 'FEED', category: 'MOLTING' },
      { type: 'Flush', med: 'Fresh Water Exchange', desc: 'Improve water clarity for buyer', priority: 'MEDIUM', appType: 'WATER', category: 'WATER' }
    ]
  }
];

const BRAND_LIST = [
  { cat: 'Water Probiotics', brands: ['Bioclean Aqua Plus', 'Sanolife PRO-W'] },
  { cat: 'Gut Probiotics', brands: ['CP Gut Probiotic', 'Avanti Gut Health'] },
  { cat: 'Minerals', brands: ['Avanti Mineral Mix', 'Growel Aqua Minerals'] },
  { cat: 'Immunity Boosters', brands: ['Vitamin C', 'Herbal Tonics'] }
];

export const SOPLibrary = () => {
  const navigate = useNavigate();
  const { theme, ponds, waterRecords, feedLogs, medicineLogs, serverError } = useData();
  const [selectedPondId, setSelectedPondId] = React.useState(ponds[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = React.useState<'ALL' | 'MEDICINE' | 'FEED' | 'WATER' | 'MOLTING'>('ALL');
  const [viewMode, setViewMode] = React.useState<'STAGES' | 'DAILY' | 'ALERTS'>('ALERTS');
  const [dismissedAlertIds, setDismissedAlertIds] = React.useState<string[]>([]);
  const isDark = theme === 'dark' || theme === 'midnight';
  const t = { sopLibrary: 'Expert SOP Handbook', operationalRoadmap: 'Operational Roadmap' };

  const selectedPond = ponds.find(p => p.id === selectedPondId);
  const currentDoc = selectedPond ? calculateDOC(selectedPond.stockingDate) : 0;
  const isPlanned = selectedPond?.status === 'planned';
  const lunar = getLunarStatus(new Date());

  // --- Build situation alerts for ALL ponds ---
  const allSituationAlerts = React.useMemo(() => {
    const inputs = buildSituationInputs(
      ponds.filter(p => p.status === 'active' || p.status === 'planned'),
      waterRecords, feedLogs, medicineLogs, calculateDOC
    );
    return inputs.flatMap(inp => analyzePondSituation(inp))
      .filter(a => !dismissedAlertIds.includes(a.id))
      .sort((a, b) => b.urgency - a.urgency);
  }, [ponds, waterRecords, feedLogs, medicineLogs, dismissedAlertIds]);

  const criticalCount = allSituationAlerts.filter(a => a.type === 'critical').length;
  const warningCount = allSituationAlerts.filter(a => a.type === 'warning').length;

  const ALL_CATEGORIES = ['MEDICINE', 'FEED', 'WATER', 'MOLTING'] as const;
  const categoriesToShow = selectedCategory === 'ALL' ? ALL_CATEGORIES : [selectedCategory];
  
  const getDOCDate = (doc: number) => {
    if (!selectedPond) return new Date();
    const date = new Date(selectedPond.stockingDate);
    date.setDate(date.getDate() + doc);
    return date;
  };

  const getWeekdayName = (date: Date) => ['SUN','MON','TUE','WED','THU','FRI','SAT'][date.getDay()];

  const getCategoryRules = (cat: string) => {
    switch(cat) {
      case 'MEDICINE': return [
        'Use probiotics specifically for gut health foundation.',
        'Immunity boosters like Vitamin C help during DOC 15-45.',
        'Check for Vibriosis and tail redness every week.',
        'Withdraw heavy medicines 10 days before harvest.'
      ];
      case 'FEED': return [
        'Match feed size to DOC and check-tray observations.',
        'Reduce feed by 25% during molting or heavy rain.',
        'Add gut probiotics to every meal for better FCR.',
        'Monitor feed trays every 2 hours after application.'
      ];
      case 'WATER': return [
        'Apply water probiotics every 3-5 days for waste removal.',
        'Sterilize water with 30ppm Chlorine during pond prep.',
        'Do NOT mix water probiotics with disinfectants same day.',
        'Monitor DO levels specifically between 2 AM and 5 AM.'
      ];
      case 'MOLTING': return [
        'Apply Mineral Mix (15-20kg/acre) during full/new moon.',
        'Provide shell hardening minerals like Ca and Mg.',
        'Run 100% aerators during the peak molting cycle.',
        'Reduce feed during heavy molting to prevent water crash.'
      ];
      default: return [];
    }
  };

  const getCategoryTheme = (cat: string) => {
    switch(cat) {
      case 'MEDICINE': return { bg: 'bg-[#064e3b]', iconBg: 'bg-emerald-500', accent: 'emerald' };
      case 'FEED': return { bg: 'bg-[#78350f]', iconBg: 'bg-amber-500', accent: 'amber' };
      case 'WATER': return { bg: 'bg-[#1e3a8a]', iconBg: 'bg-blue-500', accent: 'blue' };
      case 'MOLTING': return { bg: 'bg-[#4c1d95]', iconBg: 'bg-purple-500', accent: 'purple' };
      default: return { bg: 'bg-slate-900', iconBg: 'bg-slate-500', accent: 'slate' };
    }
  };

  // No pond guard — show premium empty state
  if (ponds.length === 0) return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Header
        title={t.sopLibrary}
        showBack={true}
        onBack={() => navigate('/dashboard')}
      />
      <div className="pt-28 flex-1 flex items-center justify-center">
        {serverError ? (
          <ServerErrorState isDark={isDark} />
        ) : (
          <NoPondState
            isDark={isDark}
            subtitle="Add a pond to access your live SOP alerts, stage roadmap, and 100-day schedule."
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="pb-32 bg-transparent min-h-screen text-left relative overflow-hidden">
      {/* Background Orbs */}
      <div className={cn("absolute top-10 right-[-10%] w-[70%] h-[30%] bg-primary/10 rounded-full blur-[100px] -z-10", theme === 'midnight' && "bg-glow-primary/20")} />
      
      <Header 
        title={t.sopLibrary} 
        showBack={true} 
        onBack={() => navigate('/dashboard')}
        rightElement={
          <div className="bg-emerald-500/10 p-2.5 rounded-2xl border border-emerald-500/20">
            <ShieldCheck size={20} className="text-emerald-500" />
          </div>
        }
      />

      <div className="px-5 py-8 space-y-16 pt-[calc(env(safe-area-inset-top)+5.5rem)]">
        
        {/* Sync Controls */}
        <div className="space-y-6 sticky top-[calc(env(safe-area-inset-top)+5rem)] z-40 -mx-5 px-5 pb-6 bg-transparent backdrop-blur-md">
           {ponds.length > 0 && (
             <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mb-1">
                {ponds.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPondId(p.id)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex-shrink-0',
                      selectedPondId === p.id 
                        ? 'bg-[#0D523C] text-white border-[#0D523C] shadow-lg' 
                        : 'bg-card text-ink/40 border-card-border'
                    )}
                  >
                    {p.name}
                  </button>
                ))}
             </div>
           )}

           <div className="bg-card/50 p-1.5 rounded-[2rem] border border-card-border flex gap-1">
              {(['ALERTS', 'STAGES', 'DAILY'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "flex-1 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all relative",
                    viewMode === mode ? "bg-primary text-white shadow-xl" : "text-ink/30 hover:text-ink/60"
                  )}
                >
                  {mode === 'ALERTS' ? 'Live Alerts' : mode === 'STAGES' ? 'SOP Stages' : '100-Day Plan'}
                  {mode === 'ALERTS' && (criticalCount + warningCount) > 0 && (
                    <span className={cn(
                      "absolute -top-1 -right-1 w-4 h-4 rounded-full text-[7px] font-black flex items-center justify-center",
                      criticalCount > 0 ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                    )}>
                      {criticalCount || warningCount}
                    </span>
                  )}
                </button>
              ))}
           </div>
           
           <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
             {(['ALL', 'MEDICINE', 'FEED', 'WATER', 'MOLTING'] as const).map(cat => (
               <button
                 key={cat}
                 onClick={() => setSelectedCategory(cat)}
                 className={cn(
                   'px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex-shrink-0 shadow-sm',
                   selectedCategory === cat 
                     ? 'bg-primary text-white border-primary ring-4 ring-primary/10' 
                     : 'bg-card text-ink/40 border-card-border hover:border-primary/20'
                 )}
               >
                 {cat}
               </button>
             ))}
           </div>
        </div>

        {viewMode === 'ALERTS' ? (
          <div className="space-y-4">
            {/* Summary Bar */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Critical', count: criticalCount, color: 'text-red-500', bg: isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200', emoji: '🚨' },
                { label: 'Warnings', count: warningCount, color: 'text-amber-500', bg: isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200', emoji: '⚠️' },
                { label: 'Lunar', count: allSituationAlerts.filter(a => a.type === 'lunar').length, color: 'text-indigo-500', bg: isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200', emoji: '🌙' },
              ].map(item => (
                <div key={item.label} className={cn('rounded-2xl p-3 border text-center', item.bg)}>
                  <div className="text-lg leading-none mb-1">{item.emoji}</div>
                  <div className={cn('text-xl font-black', item.color)}>{item.count}</div>
                  <div className={cn('text-[7px] font-black uppercase tracking-widest', item.color)}>{item.label}</div>
                </div>
              ))}
            </div>

            {allSituationAlerts.length === 0 ? (
              <div className={cn('rounded-2xl p-8 border text-center', isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')}>
                <div className="text-4xl mb-3">✅</div>
                <p className={cn('text-sm font-black', isDark ? 'text-emerald-400' : 'text-emerald-700')}>All ponds look healthy!</p>
                <p className={cn('text-[9px] font-bold mt-1', isDark ? 'text-white/40' : 'text-emerald-600/60')}>No critical situations detected at this time.</p>
              </div>
            ) : (
              <AnimatePresence>
                {allSituationAlerts.map((alert, i) => {
                  const colors = {
                    critical: { bg: isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200', text: 'text-red-500' },
                    warning: { bg: isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200', text: 'text-amber-500' },
                    info: { bg: isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200', text: 'text-blue-500' },
                    success: { bg: isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200', text: 'text-emerald-500' },
                    lunar: { bg: isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200', text: 'text-indigo-500' },
                  };
                  const c = colors[alert.type] || colors.info;
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn('rounded-2xl p-4 border', c.bg)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0 mt-0.5">{alert.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={cn('text-[11px] font-black leading-snug', c.text)}>{alert.title}</p>
                            {alert.type === 'critical' && (
                              <span className="text-[6px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-black uppercase">URGENT</span>
                            )}
                          </div>
                          <p className={cn('text-[9px] leading-relaxed', isDark ? 'text-white/60' : 'text-slate-600')}>{alert.body}</p>
                          <div className="flex items-center gap-3 mt-2">
                            {alert.action && alert.actionPath && (
                              <button
                                onClick={() => navigate(alert.actionPath!)}
                                className={cn('text-[8px] font-black uppercase tracking-widest flex items-center gap-1', c.text)}
                              >
                                {alert.action} <ChevronRight size={10} />
                              </button>
                            )}
                            <button
                              onClick={() => setDismissedAlertIds(p => [...p, alert.id])}
                              className={cn('text-[8px] font-black uppercase tracking-widest ml-auto', isDark ? 'text-white/20' : 'text-slate-400')}
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        ) : viewMode === 'STAGES' ? (
          categoriesToShow.map(cat => {
            const catTheme = getCategoryTheme(cat);
            const rules = getCategoryRules(cat);

            return (
              <section key={cat} className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                 <div className={cn("p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group", catTheme.bg)}>
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                       {cat === 'MEDICINE' && <Pill size={80} />}
                       {cat === 'FEED' && <Utensils size={80} />}
                       {cat === 'WATER' && <Droplets size={80} />}
                       {cat === 'MOLTING' && <Zap size={80} />}
                    </div>
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">{cat} PROTOCOL</p>
                      <h2 className="text-3xl font-black tracking-tighter mb-4 leading-none">
                        {cat === 'MEDICINE' ? 'Health & Disease' :
                         cat === 'FEED' ? 'Feeding & Growth' :
                         cat === 'WATER' ? 'Water Stability' :
                         'Molting & Shell'}
                      </h2>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rules.map((rule, ri) => (
                      <div key={ri} className="flex gap-4 items-center bg-card p-5 rounded-3xl border border-card-border shadow-sm">
                         <div className={cn("w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 text-white", catTheme.iconBg)}>
                            <ShieldCheck size={16} />
                         </div>
                         <p className="text-ink font-bold text-[11px] tracking-tight leading-relaxed">{rule}</p>
                      </div>
                    ))}
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-ink font-black text-sm px-4 uppercase tracking-[0.2em] flex items-center gap-3">
                       <History size={16} className="text-primary" />
                       {cat} Roadmap
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-6 px-1 scrollbar-none">
                       {SOP_DOC_RANGES.map((phase, pi) => {
                          const catTasks = phase.tasks.filter(t => t.category === cat);
                          if (catTasks.length === 0) return null;

                          return (
                            <div key={pi} className="w-[280px] shrink-0 bg-card border border-card-border rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
                               <div className={cn("px-6 py-4 flex justify-between items-center border-b border-card-border", phase.bg)}>
                                  <div>
                                     <p className="text-[8px] font-black text-black/20 uppercase tracking-widest mb-0.5">DOC {phase.doc}</p>
                                     <p className="text-ink font-black text-xs tracking-tight truncate">{phase.title}</p>
                                  </div>
                                  <span className="text-xl">{phase.emoji}</span>
                               </div>
                               <div className="p-5 space-y-3 flex-1">
                                  {catTasks.map((task, ti) => (
                                    <div key={ti} className="bg-card-border/10 p-4 rounded-2xl space-y-2 border border-card-border/50">
                                       <div className="flex items-center justify-between">
                                          <span className="text-[7px] font-black text-primary uppercase tracking-widest">{task.type}</span>
                                          <span className={cn(
                                            "text-[6px] font-black uppercase px-2 py-0.5 rounded-full",
                                            task.priority === 'HIGH' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                                          )}>{task.priority}</span>
                                       </div>
                                       <p className="text-ink font-black text-[11px] leading-tight">{task.med}</p>
                                    </div>
                                  ))}
                               </div>
                            </div>
                          );
                       })}
                    </div>
                 </div>
              </section>
            );
          })
        ) : (
          <div className="space-y-12">
            <header className="text-center space-y-3">
               <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Dynamic Sync Active</span>
               </div>
               <h2 className="text-3xl font-black tracking-tighter text-ink">Farm Execution Log</h2>
               {selectedPond && (
                 <div className="bg-primary/5 px-6 py-3 rounded-2xl inline-block border border-primary/10">
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest">Sync: {selectedPond.name} (DOC {currentDoc})</p>
                 </div>
               )}
            </header>
            
            <div className="space-y-4">
               {Array.from({ length: 111 }).map((_, i) => {
                  const doc = i - 10;
                  const docDate = getDOCDate(doc);
                  const lunar = getLunarStatus(docDate);
                  const isToday = doc === currentDoc;

                  const phase = doc <= 0 
                    ? SOP_DOC_RANGES.find(r => r.doc === 'PRE-STOCKING')
                    : SOP_DOC_RANGES.find(r => {
                        const [s, e] = r.doc.split('-').map(Number);
                        return doc >= s && doc <= e;
                      });
                  if (!phase) return null;

                  const baseTasks = phase.tasks.filter(t => {
                    if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
                    const type = t.type.toUpperCase();
                    if (type.includes('3-DAY')) return doc % 3 === 0;
                    if (type.includes('5-DAY')) return doc % 5 === 0;
                    if (type.includes('WEEKLY')) return doc % 7 === 0;
                    if (type.includes('EVERY 2D')) return doc % 2 === 0;
                    if (type.includes('DOC ')) return doc === parseInt(type.replace('DOC ', ''));
                    if (type === 'DAILY' || type === 'FEED') return true;
                    return true;
                  });

                  const lunarTasks = [];
                  if (lunar.phase === 'AMAVASYA' && (selectedCategory === 'ALL' || selectedCategory === 'MOLTING')) {
                    lunarTasks.push({ category: 'MOLTING', type: 'LUNAR', med: 'Amavasya High Molt Risk', desc: '100% Aeration, Reduce Feed 25%', priority: 'HIGH' });
                  }

                  // 3. Forced Daily Feed Baseline (Baseline for every day)
                  const baselineTasks = (selectedCategory === 'ALL' || selectedCategory === 'FEED') ? [{
                    category: 'FEED',
                    type: 'DAILY',
                    med: `Daily Feed Pulse - DOC ${doc}`,
                    desc: 'Expert SOP: Apply 4-5 nutrition-balanced meals. Observe check-trays for 100% consumption.',
                    priority: 'MEDIUM'
                  }] : [];

                  const allDayTasks = [...baseTasks, ...lunarTasks, ...baselineTasks];
                  if (allDayTasks.length === 0) return null;

                  return (
                    <motion.div 
                      key={doc} 
                      className={cn(
                        "bg-card border rounded-[2.5rem] shadow-xl overflow-hidden transition-all relative",
                        isToday ? "border-primary ring-4 ring-primary/5 scale-[1.02] z-20 shadow-primary/20" : "border-card-border"
                      )}
                    >
                       <div className={cn("px-8 py-5 flex items-center justify-between border-b border-card-border", phase.bg)}>
                          <div className="flex items-center gap-6">
                             <div className={cn("w-16 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-black transition-all", isToday ? "bg-primary text-white" : "bg-white/80 text-ink")}>
                                <p className="text-[7px] opacity-40 uppercase tracking-tighter -mb-1">{doc <= 0 ? 'PREP' : 'DOC'}</p>
                                <p className="text-lg tracking-tighter">{Math.abs(doc)}</p>
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em]">{getWeekdayName(docDate)} • {docDate.toLocaleDateString()}</p>
                                <p className="text-ink font-black text-sm tracking-tight">{phase.title}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             {lunar.phase !== 'NORMAL' && <span className="text-[7px] font-black text-primary px-2 py-1 bg-primary/10 rounded-lg animate-pulse">{lunar.phase}</span>}
                             <span className="text-xl">{phase.emoji}</span>
                          </div>
                       </div>
                       <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {allDayTasks.map((task, ti) => (
                            <div key={ti} className="flex gap-5 items-start bg-card-border/5 p-5 rounded-3xl border border-card-border/30">
                               <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-sm", getCategoryTheme(task.category).iconBg)}>
                                  {task.category === 'MEDICINE' && <Pill size={18} />}
                                  {task.category === 'FEED' && <Utensils size={18} />}
                                  {task.category === 'WATER' && <Droplets size={18} />}
                                  {task.category === 'MOLTING' && <Zap size={18} />}
                               </div>
                               <div className="space-y-1">
                                  <p className="text-[7px] font-black text-ink/30 uppercase tracking-widest">{task.type}</p>
                                  <p className="text-ink font-black text-xs tracking-tight">{task.med}</p>
                                  <p className="text-ink/40 text-[9px] font-medium leading-relaxed">{task.desc}</p>
                               </div>
                            </div>
                          ))}
                       </div>
                    </motion.div>
                  );
               })}
            </div>
          </div>
        )}

        <section className="bg-black/5 rounded-[3rem] p-10 border border-white/5 space-y-10">
           <div className="text-center space-y-3">
              <Pill size={36} className="text-indigo-500 mx-auto" />
              <h3 className="text-ink font-black text-2xl tracking-tighter text-center">Expert Inventory Handbook</h3>
              <p className="text-ink/40 text-[10px] font-bold uppercase tracking-widest text-center">Recommended Professional Systems</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {BRAND_LIST.map((item, i) => (
                <div key={i} className="space-y-3 bg-white/30 p-6 rounded-[2rem] border border-white/50 shadow-sm">
                   <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em]">{item.cat}</p>
                   <ul className="space-y-2">
                      {item.brands.map((b, bi) => (
                        <li key={bi} className="text-ink font-black text-[11px] flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                          {b}
                        </li>
                      ))}
                   </ul>
                </div>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
};
