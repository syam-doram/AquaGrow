import React, { useState } from 'react';
import { Waves, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  CheckCircle2,
  Star,
  Pill,
  AlertCircle,
  Eye,
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  Calendar,
  Info,
  TrendingUp,
  Clock,
  AlertTriangle,
  Thermometer,
  Wind,
  Droplets,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { Header } from '../components/Header';
import { Translations } from '../translations';
import { calculateDOC } from '../utils/pondUtils';
import { getSOPGuidance, SOPSuggestion } from '../utils/sopRules';
import { getLunarStatus } from '../utils/lunarUtils';
import { cn } from '../utils/cn';

// Full SOP cycle overview data (for the "Culture Timeline" card)
const SOP_CYCLE_PHASES = [
  {
    range: 'DOC 1–10',
    label: 'Early Establishment',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    meds: [
      { name: 'Gut Probiotic (Daily)', dose: '5–10 g/kg feed', brand: 'CP Gut Probiotic', priority: 'HIGH' },
      { name: 'Water Probiotic', dose: '250 g/acre', brand: 'Bioclean Aqua Plus', freq: 'Every 3 days', priority: 'MEDIUM' },
    ],
  },
  {
    range: 'DOC 11–20',
    label: 'Growth Spurt',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
    meds: [
      { name: 'Gut Probiotic Continue', dose: '10 g/kg feed', brand: 'Avanti Gut Health', priority: 'HIGH' },
      { name: 'Water & Soil Probiotic', dose: 'Normal Dose', brand: 'Sanolife PRO-W', freq: 'Every 5 days', priority: 'MEDIUM' },
      { name: 'Vitamin C Booster', dose: 'High Dose', brand: '', freq: 'DOC 15 only', priority: 'HIGH' },
    ],
  },
  {
    range: 'DOC 21–30',
    label: 'Risk Stage',
    color: 'bg-amber-500',
    textColor: 'text-amber-600',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
    meds: [
      { name: 'Water Probiotic', dose: '300 g/acre', brand: '', freq: 'Alternate days', priority: 'HIGH' },
      { name: 'Immunity Booster', dose: 'High Dose', brand: '', freq: 'DOC 25 only', priority: 'MEDIUM' },
    ],
  },
  {
    range: 'DOC 31–45',
    label: '⚠ Critical Stage',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgLight: 'bg-red-50',
    borderColor: 'border-red-200',
    meds: [
      { name: 'Water Probiotic', dose: '400 g/acre', brand: '', freq: 'Every 3 days', priority: 'HIGH' },
      { name: 'Anti-Stress Tonic', dose: 'Normal', brand: '', freq: 'DOC 30–35', priority: 'MEDIUM' },
      { name: 'Vitamin + Mineral Booster', dose: 'Boost', brand: '', freq: 'DOC 40 only', priority: 'HIGH' },
    ],
  },
  {
    range: 'DOC 46–80',
    label: 'Peak Growth',
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    bgLight: 'bg-purple-50',
    borderColor: 'border-purple-200',
    meds: [
      { name: 'Liver Tonic', dose: 'Normal', brand: '', freq: 'DOC 50 only', priority: 'HIGH' },
      { name: 'Mineral Mix', dose: '15–20 kg/acre', brand: '', freq: 'Continuous', priority: 'MEDIUM' },
    ],
  },
  {
    range: 'DOC 81–100',
    label: 'Harvest Stage',
    color: 'bg-[#C78200]',
    textColor: 'text-[#C78200]',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
    meds: [
      { name: 'Stop heavy medicines', dose: '—', brand: 'Clean water only', priority: 'HIGH' },
    ],
  },
];

const getIconForType = (type: string) => {
  switch (type) {
    case 'MEDICINE': return Pill;
    case 'ALERT': return AlertTriangle;
    case 'LUNAR': return Star;
    case 'RULE': return Info;
    case 'TIP': return TrendingUp;
    default: return Pill;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'HIGH': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'LOW': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  }
};

const getTypeAccent = (type: string) => {
  switch (type) {
    case 'MEDICINE': return 'text-emerald-500 bg-emerald-500/10';
    case 'ALERT': return 'text-red-500 bg-red-500/10';
    case 'LUNAR': return 'text-indigo-500 bg-indigo-500/10';
    case 'RULE': return 'text-blue-500 bg-blue-500/10';
    case 'TIP': return 'text-[#C78200] bg-[#C78200]/10';
    default: return 'text-emerald-500 bg-emerald-500/10';
  }
};

const getCurrentPhaseIndex = (doc: number) => {
  if (doc >= 1 && doc <= 10) return 0;
  if (doc >= 11 && doc <= 20) return 1;
  if (doc >= 21 && doc <= 30) return 2;
  if (doc >= 31 && doc <= 45) return 3;
  if (doc >= 46 && doc <= 80) return 4;
  if (doc >= 81) return 5;
  return -1;
};

const getNextMilestone = (doc: number): { doc: number; label: string } | null => {
  const milestones = [
    { doc: 3, label: 'Water Probiotic (1st)' },
    { doc: 10, label: 'End of Establishment Phase' },
    { doc: 15, label: 'Vitamin C Booster' },
    { doc: 21, label: 'Risk Stage Begins' },
    { doc: 25, label: 'Immunity Booster & Vibriosis Check' },
    { doc: 31, label: 'CRITICAL STAGE – Max Aeration' },
    { doc: 40, label: 'Vitamin + Mineral Booster' },
    { doc: 50, label: 'Liver Tonic Day' },
    { doc: 81, label: 'Wind-Down / Harvest Prep' },
  ];
  return milestones.find(m => m.doc > doc) || null;
};

// ─── Lunar helpers ───────────────────────────────────────────────────────────
const MOON_META = {
  AMAVASYA: {
    emoji: '🌑',
    label: 'Amavasya — New Moon',
    sublabel: 'HIGH RISK NIGHT',
    bg: 'bg-indigo-950',
    border: 'border-indigo-800/50',
    textColor: 'text-indigo-300',
    badge: 'bg-red-500/20 text-red-300 border-red-400/30',
    rules: [
      '🔴 Reduce feed by 20–30% tonight',
      '🔵 Run ALL aerators through the night',
      '💊 Apply Mineral Mix (High Dose) — morning only',
      '💊 Apply Vitamin C / Immunity boost — morning only',
      '⚠️ Do NOT apply probiotics after 6 PM',
    ],
  },
  ASHTAMI_NAVAMI: {
    emoji: '🌓',
    label: 'Ashtami / Navami — Quarter Moon',
    sublabel: 'MEDIUM RISK',
    bg: 'bg-violet-950',
    border: 'border-violet-800/40',
    textColor: 'text-violet-300',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    rules: [
      '🟡 Reduce feed by 10–15% today',
      '🔵 Ensure stable night-time O₂ levels',
      '💊 Apply Mineral Mix (Medium Dose) — morning',
      '⚠️ Avoid medicine applications after sunset',
    ],
  },
  NORMAL: {
    emoji: '🌕',
    label: 'Normal Moon Phase',
    sublabel: 'SAFE PERIOD',
    bg: 'bg-[#0D523C]',
    border: 'border-emerald-800/40',
    textColor: 'text-emerald-300',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    rules: [
      '✅ Standard feeding schedule applies',
      '✅ Apply medicines as per DOC SOP',
      '💡 Best time to apply: 7–9 AM or 4–6 PM',
    ],
  },
};
// ─────────────────────────────────────────────────────────────────────────────

export const MedicineSchedule = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, addMedicineLog, medicineLogs } = useData();
  const [selectedPondId, setSelectedPondId] = useState(ponds[0]?.id || '');
  const [completedMeds, setCompletedMeds] = useState<string[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'cycle'>('today');

  const selectedPond = ponds.find(p => p.id === selectedPondId);
  const currentDoc = selectedPond ? calculateDOC(selectedPond.stockingDate) : 0;

  // Filter logs for this specific pond to show the count
  const pondMedicineLogs = medicineLogs.filter(l => l.pondId === selectedPondId);

  // Lunar status — computed once at render
  const now = new Date();
  const lunar = getLunarStatus(now);
  const moonMeta = MOON_META[lunar.phase];
  const isHighRiskMoon = lunar.phase !== 'NORMAL';

  // Use the proper sopRules.ts with day-of-week
  const dayOfWeek = now.getDay();
  const todayGuidance: SOPSuggestion[] = currentDoc > 0
    ? getSOPGuidance(currentDoc, dayOfWeek).filter(s => s.type !== 'RULE' || s.title !== 'Amavasya Tip')
    : [];

  const currentPhaseIdx = getCurrentPhaseIndex(currentDoc);
  const nextMilestone = getNextMilestone(currentDoc);

  const toggleMed = (name: string) => {
    setCompletedMeds(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleLog = async () => {
    if (completedMeds.length === 0 || !selectedPond) return;
    setIsLogging(true);
    
    try {
      const logPromises = completedMeds.map(medName => {
        const guidance = todayGuidance.find(g => g.title === medName);
        return addMedicineLog({
          pondId: selectedPond.id,
          date: new Date().toISOString(),
          name: medName,
          dosage: guidance?.dose || 'As per SOP',
          doc: currentDoc
        });
      });

      await Promise.all(logPromises);
      setCompletedMeds([]);
    } catch (error) {
      console.error("Error logging medication:", error);
      alert("Failed to save logs. Please try again.");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="pb-40 bg-[#F8F9FE] min-h-screen text-left">
      {/* Sync Success Overlay */}
      <AnimatePresence>
        {isLogging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0D523C]/97 backdrop-blur-xl flex flex-col items-center justify-center text-white"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center text-[#0D523C] shadow-2xl mb-8"
            >
              <ShieldCheck size={64} />
            </motion.div>
            <h3 className="text-3xl font-black tracking-tighter mb-2">Logs Synced!</h3>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Pond health history updated</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Header */}
      <Header 
        title={t.medicine} 
        showBack={false} 
        onMenuClick={onMenuClick} 
        rightElement={
          selectedPond && (
            <div className={cn(
              'px-3 py-1.5 rounded-full border',
              currentDoc > 30 && currentDoc <= 45 ? 'bg-red-50 border-red-200' : 'bg-[#FFF8E6] border-[#C78200]/20'
            )}>
              <span className={cn(
                'text-[9px] font-black uppercase tracking-widest whitespace-nowrap',
                currentDoc > 30 && currentDoc <= 45 ? 'text-red-500' : 'text-[#C78200]'
              )}>
                DOC: {currentDoc}
              </span>
            </div>
          )
        }
      />

      <div className="pt-28 px-5 space-y-5">
        {/* Pond Selector Tabs */}
        {ponds.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {ponds.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedPondId(p.id); setCompletedMeds([]); }}
                className={cn(
                  'px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex-shrink-0',
                  selectedPondId === p.id
                    ? 'bg-[#0D523C] text-white border-[#0D523C] shadow-lg'
                    : 'bg-white text-[#4A2C2A]/40 border-black/5 hover:border-black/15'
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        ) : (
          /* No Ponds Empty State */
          <div className="mt-8 bg-white rounded-[2.5rem] p-10 text-center border border-dashed border-[#4A2C2A]/10 shadow-sm">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-500">
              <Plus size={36} />
            </div>
            <h3 className="text-[#4A2C2A] font-black text-lg tracking-tighter mb-2">{t.addFirstPond}</h3>
            <p className="text-[#4A2C2A]/40 text-xs leading-relaxed mb-6">Add a pond to start tracking your medicine SOP schedule.</p>
            <button
              onClick={() => navigate('/ponds/new')}
              className="bg-[#0D523C] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
            >
              {t.addPond}
            </button>
          </div>
        )}

        {ponds.length > 0 && selectedPond && (
          <>
            {/* ─── LUNAR + WEATHER AWARENESS BANNER ─── */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('rounded-[2rem] overflow-hidden border', moonMeta.bg, moonMeta.border)}
            >
              {/* Moon Phase Header */}
              <div className="px-6 pt-5 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl leading-none">{moonMeta.emoji}</span>
                  <div>
                    <p className={cn('font-black text-base tracking-tight', moonMeta.textColor)}>
                      {moonMeta.label}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn(
                        'text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
                        moonMeta.badge
                      )}>
                        {moonMeta.sublabel}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Days to Amavasya counter */}
                <div className="text-right">
                  <p className="text-white/20 text-[8px] font-black uppercase tracking-widest">Next Amavasya</p>
                  <p className="text-white font-black text-xl leading-tight">
                    {lunar.daysToAmavasya <= 1 ? 'Tonight' : `${lunar.daysToAmavasya}d`}
                  </p>
                  <p className="text-white/20 text-[7px] font-black uppercase tracking-widest">
                    Day {Math.round(lunar.daysSinceAmavasya)}/29
                  </p>
                </div>
              </div>

              {/* Rules List */}
              <div className="px-6 pb-5 space-y-2 border-t border-white/5 pt-4">
                {moonMeta.rules.map((rule, i) => (
                  <p key={i} className="text-white/70 text-[11px] font-bold leading-snug tracking-tight">
                    {rule}
                  </p>
                ))}
              </div>

              {/* Weather Caution Row */}
              <div className="mx-5 mb-5 bg-white/5 rounded-2xl px-5 py-3.5 flex items-center gap-3 border border-white/5">
                <Thermometer size={16} className="text-white/40 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white/80 text-[10px] font-black tracking-tight">Weather × Lunar Interaction</p>
                  <p className="text-white/40 text-[9px] font-medium mt-0.5">
                    {lunar.phase === 'AMAVASYA'
                      ? 'Temp drops amplify DO risk tonight. Run aerators from 9 PM.'
                      : lunar.phase === 'ASHTAMI_NAVAMI'
                      ? 'Quarter moon stress + heat stress can compound. Monitor O₂ closely.'
                      : 'Stable phase. Apply medicines 7–9 AM for best absorption.'}
                  </p>
                </div>
                <Droplets size={16} className="text-white/20 flex-shrink-0" />
              </div>
            </motion.div>

            {/* Next Milestone Banner */}
            {nextMilestone && currentDoc > 0 && (
              <div className="bg-indigo-900 rounded-[2rem] px-6 py-4 flex items-center justify-between border border-indigo-700/30">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Clock size={20} className="text-indigo-300" />
                  </div>
                  <div>
                    <p className="text-indigo-300/60 text-[8px] font-black uppercase tracking-widest">Next Milestone</p>
                    <p className="text-white font-black text-sm tracking-tight">{nextMilestone.label}</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                  <p className="text-white font-black text-lg leading-none">+{nextMilestone.doc - currentDoc}</p>
                  <p className="text-indigo-300/60 text-[8px] font-black uppercase tracking-widest">days</p>
                </div>
              </div>
            )}

            {/* Phase Status Bar */}
            {currentDoc > 0 && (
              <div className="bg-white rounded-[2rem] p-5 border border-black/5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[#4A2C2A]/50 text-[9px] font-black uppercase tracking-widest">Current Phase</p>
                  <span className={cn(
                    'text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full',
                    currentPhaseIdx >= 0
                      ? `${SOP_CYCLE_PHASES[currentPhaseIdx].textColor} ${SOP_CYCLE_PHASES[currentPhaseIdx].bgLight}`
                      : 'text-[#4A2C2A]/30 bg-[#F8F9FE]'
                  )}>
                    {currentPhaseIdx >= 0 ? SOP_CYCLE_PHASES[currentPhaseIdx].label : 'Not started'}
                  </span>
                </div>
                {/* Progress Strip */}
                <div className="flex gap-1">
                  {SOP_CYCLE_PHASES.map((phase, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 h-2 rounded-full transition-all',
                        i < currentPhaseIdx ? 'bg-emerald-400' :
                        i === currentPhaseIdx ? SOP_CYCLE_PHASES[i].color :
                        'bg-[#F0F0F0]'
                      )}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[7px] font-black text-[#4A2C2A]/20 uppercase tracking-widest">DOC 1</span>
                  <span className="text-[7px] font-black text-[#4A2C2A]/20 uppercase tracking-widest">DOC 100</span>
                </div>
              </div>
            )}

            {/* Tab Switch: Today vs Full Cycle */}
            <div className="flex gap-3">
              {(['today', 'cycle'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border',
                    activeTab === tab
                      ? 'bg-[#0D523C] text-white border-[#0D523C] shadow-lg'
                      : 'bg-white text-[#4A2C2A]/40 border-black/5'
                  )}
                >
                  {tab === 'today' ? "Today's SOP" : 'Full Cycle'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'today' ? (
                <motion.div
                  key="today"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* DOC=0 / Not Started State */}
                  {currentDoc === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-10 text-center border border-dashed border-[#4A2C2A]/10">
                      <div className="w-16 h-16 bg-[#F8F9FE] rounded-3xl flex items-center justify-center mx-auto mb-4 text-[#C78200]">
                        <Calendar size={32} />
                      </div>
                      <h3 className="text-[#4A2C2A] font-black text-base tracking-tight mb-2">Culture Not Started</h3>
                      <p className="text-[#4A2C2A]/40 text-[11px] leading-relaxed">
                        Set a stocking date for <span className="text-[#C78200] font-black">{selectedPond.name}</span> to begin tracking SOP medicines.
                      </p>
                    </div>
                  ) : todayGuidance.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-10 text-center border border-dashed border-[#4A2C2A]/10">
                      <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
                      <h3 className="text-[#4A2C2A] font-black text-base tracking-tight mb-2">All Clear Today!</h3>
                      <p className="text-[#4A2C2A]/40 text-[11px]">No specific SOP medicines for DOC {currentDoc}. Maintain routine aeration.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between px-1">
                        <div>
                          <h2 className="text-[#4A2C2A] font-black text-lg tracking-tight">{t.dailySOP}</h2>
                          <p className="text-[#C78200] text-[9px] font-black uppercase tracking-widest mt-0.5">
                            Required Today — DOC {currentDoc} ({new Date().toLocaleDateString('en-IN', { weekday: 'long' })})
                          </p>
                        </div>
                        <div className={cn(
                          'w-12 h-12 rounded-2xl flex items-center justify-center',
                          currentDoc >= 31 && currentDoc <= 45 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                        )}>
                          <ShieldCheck size={24} />
                        </div>
                      </div>

                      <div className="space-y-3">
                        {todayGuidance.map((item, i) => {
                          // Check if this specific medicine was ALREADY logged today for this pond
                          const isAlreadyInHistory = medicineLogs.some(l => 
                            l.pondId === selectedPond.id && 
                            l.name === item.title && 
                            new Date(l.date).toDateString() === new Date().toDateString()
                          );

                          const isCompleted = isAlreadyInHistory || completedMeds.includes(item.title);
                          const Icon = getIconForType(item.type);
                          
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              onClick={() => !isAlreadyInHistory && item.type === 'MEDICINE' && toggleMed(item.title)}
                              className={cn(
                                'p-5 rounded-[2rem] shadow-sm border transition-all flex items-center justify-between group',
                                (item.type === 'MEDICINE' && !isAlreadyInHistory) ? 'cursor-pointer' : 'cursor-default',
                                isCompleted
                                  ? 'bg-emerald-50 border-emerald-200'
                                  : item.type === 'ALERT' || item.priority === 'HIGH'
                                  ? 'bg-white border-red-100 hover:border-red-200'
                                  : 'bg-white border-black/5 hover:border-emerald-200'
                              )}
                            >
                              <div className={cn("flex items-center gap-4 flex-1 min-w-0", isAlreadyInHistory && "opacity-60")}>
                                <div className={cn(
                                  'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all',
                                  isCompleted
                                    ? 'bg-emerald-500 text-white'
                                    : getTypeAccent(item.type)
                                )}>
                                  {isCompleted ? <CheckCircle2 size={22} /> : <Icon size={22} />}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <h4 className={cn(
                                      'font-black text-sm tracking-tight truncate',
                                      isCompleted ? 'text-emerald-800' : 'text-[#4A2C2A]'
                                    )}>
                                      {item.title}
                                    </h4>
                                    {isAlreadyInHistory && (
                                      <span className="text-[7px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white border-none flex-shrink-0 animate-pulse">
                                        Synced
                                      </span>
                                    )}
                                    <span className={cn(
                                      'text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border flex-shrink-0',
                                      getPriorityColor(item.priority)
                                    )}>
                                      {item.priority}
                                    </span>
                                  </div>
                                  <p className="text-[#4A2C2A]/40 text-[10px] font-medium leading-snug truncate">
                                    {isAlreadyInHistory ? "Already applied and synced for today" : item.description}
                                  </p>
                                </div>
                              </div>
                              {item.type === 'MEDICINE' && (
                                <div className={cn(
                                  'w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ml-3',
                                  isCompleted
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-[#4A2C2A]/10 text-transparent'
                                )}>
                                  <CheckCircle2 size={16} />
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Log Button */}
                      <button
                        onClick={handleLog}
                        disabled={completedMeds.length === 0}
                        className={cn(
                          'w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3',
                          completedMeds.length > 0
                            ? 'bg-[#0D523C] text-white shadow-2xl shadow-emerald-900/20 active:scale-95'
                            : 'bg-[#F0F0F0] text-[#4A2C2A]/20 cursor-not-allowed'
                        )}
                      >
                        {isLogging ? 'Syncing...' : `${t.logMedication} (${completedMeds.length})`}
                        <ArrowRight size={18} />
                      </button>
                    </>
                  )}
                </motion.div>
              ) : (
                /* Full SOP Cycle View */
                <motion.div
                  key="cycle"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between px-1 mb-3">
                    <h2 className="text-[#4A2C2A] font-black text-lg tracking-tight">{t.cultureTimeline}</h2>
                    <span className="text-[8px] font-black text-[#4A2C2A]/30 uppercase tracking-widest bg-[#F8F9FE] px-3 py-1.5 rounded-xl">
                      Vannamei SOP
                    </span>
                  </div>

                  {SOP_CYCLE_PHASES.map((phase, phaseIdx) => {
                    const isActive = phaseIdx === currentPhaseIdx;
                    const isPast = phaseIdx < currentPhaseIdx;

                    /* ── Active phase: full card with medicine details ── */
                    if (isActive) {
                      return (
                        <div
                          key={phaseIdx}
                          className={cn(
                            'rounded-[2rem] border overflow-hidden shadow-md',
                            phase.bgLight, phase.borderColor
                          )}
                        >
                          {/* Header */}
                          <div className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn('w-3 h-3 rounded-full flex-shrink-0', phase.color)} />
                              <div>
                                <p className={cn('font-black text-sm tracking-tight', phase.textColor)}>
                                  {phase.label}
                                </p>
                                <p className="text-[#4A2C2A]/40 text-[9px] font-black uppercase tracking-widest">{phase.range}</p>
                              </div>
                            </div>
                            <span className={cn(
                              'text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border bg-white',
                              phase.textColor, phase.borderColor
                            )}>
                              ▶ Active
                            </span>
                          </div>

                          {/* Medicine list */}
                          <div className="px-6 pb-5 space-y-3">
                            {phase.meds.map((med, medIdx) => (
                              <div key={medIdx} className="flex items-start gap-3 pt-3 border-t border-black/5 first:border-t-0 first:pt-0">
                                <Pill size={14} className={cn('flex-shrink-0 mt-0.5', phase.textColor)} />
                                <div>
                                  <p className="text-[#4A2C2A] text-[11px] font-black tracking-tight">{med.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    {med.dose && med.dose !== '—' && (
                                      <span className="text-[8px] font-black text-[#4A2C2A]/40 uppercase tracking-widest">{med.dose}</span>
                                    )}
                                    {med.brand && (
                                      <span className="text-[8px] font-black text-[#C78200] bg-[#C78200]/10 px-1.5 py-0.5 rounded-md">{med.brand}</span>
                                    )}
                                    {med.freq && (
                                      <span className="text-[8px] font-black text-[#4A2C2A]/30 italic">{med.freq}</span>
                                    )}
                                    <span className={cn(
                                      'text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border',
                                      getPriorityColor(med.priority)
                                    )}>
                                      {med.priority}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    /* ── Past / upcoming phases: compact title-only pill ── */
                    return (
                      <div
                        key={phaseIdx}
                        className={cn(
                          'rounded-2xl border px-5 py-3.5 flex items-center justify-between transition-all',
                          isPast
                            ? 'bg-white border-emerald-100/60 opacity-55'
                            : 'bg-white border-black/5 opacity-70'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', phase.color)} />
                          <div>
                            <p className="font-black text-[12px] tracking-tight text-[#4A2C2A]">{phase.label}</p>
                            <p className="text-[#4A2C2A]/30 text-[8px] font-black uppercase tracking-widest">{phase.range}</p>
                          </div>
                        </div>
                        {isPast ? (
                          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                        ) : (
                          <span className="text-[7px] font-black text-[#4A2C2A]/20 uppercase tracking-widest flex-shrink-0">Upcoming</span>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dynamic Disease Alert Section */}
            {currentDoc > 0 && (
              <section className="bg-red-50 rounded-[2.5rem] p-7 border border-red-100 relative overflow-hidden">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-[#4A2C2A] text-lg font-black tracking-tighter">{t.diseaseAlert}</h2>
                    <p className="text-red-400 text-[9px] font-black uppercase tracking-widest leading-tight">
                      {currentDoc <= 30 ? "Early Risk: Bacteria / PL Stress" :
                       currentDoc <= 60 ? "Critical Zone: Vibriosis / WSSV" :
                       "Late Risk: EHP / EMS Stage"} (DOC {currentDoc})
                    </p>
                  </div>
                </div>

                <p className="text-red-900/50 text-[11px] font-bold tracking-tight leading-relaxed mb-5">
                  Your pond is entering a {currentDoc <= 45 ? 'growth' : 'peak'} risk stage. Monitor these symptoms carefully:
                </p>

                <div className="space-y-2.5 mb-6">
                   {currentDoc <= 30 ? (
                     <>
                       <SymptomItem icon={Activity} label="Poor feeding response" />
                       <SymptomItem icon={Eye} label="Slow / Erratic swimming" />
                       <SymptomItem icon={Waves} label="Dirty water / Foaming" />
                     </>
                   ) : currentDoc <= 60 ? (
                     <>
                       <SymptomItem icon={Eye} label={t.opaqueMuscleSign} />
                       <SymptomItem icon={Activity} label={t.softShellSign} />
                       <SymptomItem icon={Zap} label="Reddish body tint" />
                     </>
                   ) : (
                     <>
                       <SymptomItem icon={Zap} label={t.surfaceBubbleSign} />
                       <SymptomItem icon={CheckCircle2} label="White spots on cephalothorax" />
                       <SymptomItem icon={AlertTriangle} label="Empty midgut / Pale liver" />
                     </>
                   )}
                </div>

                <button 
                  onClick={() => navigate('/disease-detection')}
                  className="w-full py-4 bg-red-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <span className="animate-pulse">★</span> {t.diagnoseNow}
                </button>
              </section>
            )}

            {/* Weekly Model Card */}
            <section className="bg-white rounded-[2.5rem] p-7 border border-black/5 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[#C78200]/10 rounded-2xl flex items-center justify-center text-[#C78200]">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-[#4A2C2A] font-black text-base tracking-tight">Weekly SOP Model</h3>
                  <p className="text-[#4A2C2A]/40 text-[9px] font-black uppercase tracking-widest">Recurring schedule</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { day: 'Mon', task: 'Mineral Mix Application', color: 'bg-amber-500' },
                  { day: 'Tue', task: 'Water Probiotic (1st)', color: 'bg-blue-500' },
                  { day: 'Wed', task: 'Gut Probiotic (Intensive)', color: 'bg-emerald-500' },
                  { day: 'Thu', task: 'Water Probiotic (2nd)', color: 'bg-blue-400' },
                  { day: 'Fri', task: 'Mineral Stabilization', color: 'bg-amber-400' },
                  { day: 'Sat', task: 'Immunity Booster', color: 'bg-red-500' },
                  { day: 'Sun', task: 'Full Water Parameter Check', color: 'bg-[#0D523C]' },
                ].map((item, i) => {
                  const dayIdx = [1,2,3,4,5,6,0][i];
                  const isToday = dayIdx === dayOfWeek;
                  return (
                    <div key={i} className={cn(
                      'flex items-center gap-4 p-3 rounded-2xl transition-all',
                      isToday ? 'bg-[#0D523C]/5 border border-[#0D523C]/10' : 'hover:bg-[#F8F9FE]'
                    )}>
                      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', item.color)}>
                        <span className="text-[9px] font-black text-white">{item.day}</span>
                      </div>
                      <p className={cn('text-[11px] font-black tracking-tight flex-1', isToday ? 'text-[#0D523C]' : 'text-[#4A2C2A]')}>
                        {item.task}
                      </p>
                      {isToday && (
                        <span className="text-[7px] font-black text-[#0D523C] bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Today</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

          </>
        )}
      </div>
    </div>
  );
};

const SymptomItem = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <div className="p-4 rounded-2xl bg-white flex items-center gap-4 shadow-sm border border-red-50 transition-all hover:scale-[1.01]">
    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
      <Icon size={18} />
    </div>
    <span className="text-[#4A2C2A] text-[11px] font-black tracking-tight">{label}</span>
  </div>
);
