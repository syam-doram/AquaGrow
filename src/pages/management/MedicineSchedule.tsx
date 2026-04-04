import React, { useState, useEffect } from 'react';
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
  Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import type { Translations } from '../../translations';
import { calculateDOC } from '../../utils/pondUtils';
import { getSOPGuidance, SOPSuggestion } from '../../utils/sopRules';
import { getLunarStatus, getLunarForecast } from '../../utils/lunarUtils';
import { cn } from '../../utils/cn';

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
    sublabel: 'CRITICAL HIGH RISK',
    bg: 'bg-black',
    border: 'border-indigo-500/50',
    textColor: 'text-indigo-400',
    badge: 'bg-red-500/20 text-red-300 border-red-400/30',
    rules: [
      '🔴 Reduce feed by 20–30% tonight',
      '🔵 Run ALL aerators through the night',
      '💊 Apply Mineral Mix (High Dose) — morning only',
      '💊 Apply Vitamin C / Immunity boost — morning only',
      '⚠️ Do NOT apply probiotics after 6 PM',
    ],
  },
  ASHTAMI: {
    emoji: '🌓',
    label: 'Ashtami — Molting Begins',
    sublabel: 'SEQUENCE START: 48HR STRESS',
    bg: 'bg-violet-950',
    border: 'border-violet-800/40',
    textColor: 'text-violet-300',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    rules: [
      '🟡 Initial molting stress begins tonight',
      '🟡 Reduce feed by 10% today',
      '🔵 Start intensive aeration (Morning & Night)',
      '💊 Apply Minerals (Evening) for shell hardening',
    ],
  },
  NAVAMI: {
    emoji: '🌙',
    label: 'Navami — Peak Recovery',
    sublabel: 'CRITICAL VIGILANCE',
    bg: 'bg-[#0B1A2E]',
    border: 'border-sky-500/30',
    textColor: 'text-sky-300',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    rules: [
      '🟠 Maximum vigilance for molting recovery tonight',
      '🟠 Watch for soft-shell / slow feeders',
      '🟡 Reduce feed by 15% today if mortality seen',
      '💊 Apply Immunity boosters (Morning)',
      '🔵 Maintain Max Aeration through 2 AM',
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
  POURNAMI: {
    emoji: '🌕',
    label: 'Pournami — Full Moon',
    sublabel: 'HIGH BIOLOGICAL DEMAND',
    bg: 'bg-[#1A1C3E]',
    border: 'border-indigo-500/40',
    textColor: 'text-indigo-200',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
    rules: [
      '🔵 High biological activity tonight',
      '🔵 Increase aeration levels (100% capacity)',
      '🟡 Monitor DO levels afternoon & midnight',
      '💊 Mineral application suggested for partial molting',
    ],
  },
};
// ─────────────────────────────────────────────────────────────────────────────

export const MedicineSchedule = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, addMedicineLog, medicineLogs, waterRecords } = useData();
  const [selectedPondId, setSelectedPondId] = useState(ponds[0]?.id || '');
  const [completedMeds, setCompletedMeds] = useState<string[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'lunar' | 'full'>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const selectedPond = ponds.find(p => p.id === selectedPondId);
  const currentDoc = selectedPond ? calculateDOC(selectedPond.stockingDate) : 0;

  // Data-Driven Risk Analysis
  const pondWaterRecords = waterRecords
    .filter(r => r.pondId === selectedPond?.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const latestRead = pondWaterRecords[0];
  const isDOCRisk = currentDoc > 30 && currentDoc < 45 || currentDoc > 75;
  const isWaterRisk = latestRead && (latestRead.do < 4.0 || latestRead.ph > 8.5 || latestRead.temp > 31);
  const riskLevel = (isDOCRisk && isWaterRisk) ? 'CRITICAL' : (isDOCRisk || isWaterRisk) ? 'HIGH' : 'STABLE';

  // Lunar forecast for the planner
  const lunarForecast = React.useMemo(() => getLunarForecast(new Date(), 30), []);

  // ─── SYNC ACTIVE POND SELECTION ───────────────────────────────────────────
  useEffect(() => {
    if (!selectedPondId && ponds.length > 0) {
      setSelectedPondId(ponds[0].id);
    }
  }, [ponds, selectedPondId]);

  // Filter logs for this specific pond to show the count
  const pondMedicineLogs = medicineLogs.filter(l => l.pondId === selectedPondId);

  // Lunar status — computed once at render
  const lunar = getLunarStatus(selectedDate);
  const moonMeta = MOON_META[lunar.phase];
  const isHighRiskMoon = lunar.phase !== 'NORMAL';

  // Use the proper sopRules.ts with day-of-week
  const todayGuidance: SOPSuggestion[] = currentDoc > 0
    ? getSOPGuidance(currentDoc, selectedDate).filter(s => s.type !== 'RULE' || s.title !== 'Amavasya Tip')
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
    <div className="pb-40 bg-transparent min-h-screen text-left relative overflow-hidden">
      {/* ── Page Accents (Layered with Global) ── */}
      <div className="absolute top-10 right-[-10%] w-[70%] h-[30%] bg-purple-100/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-[10%] left-[-10%] w-[60%] h-[40%] bg-emerald-50/10 rounded-full blur-[120px] -z-10" />
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
          selectedPond && selectedPond.stockingDate && (
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
            {/* ─── SHARED DASHBOARD ELEMENTS (Hiden on Lunar Tab) ─── */}
            {activeTab !== 'lunar' && (
              <div className="space-y-4">
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

                  {/* Upcoming / Previous Sequence */}
                  {(lunar.phase === 'NORMAL' || lunar.phase === 'POURNAMI') && (
                    <div className="px-6 pb-2.5 flex gap-2 overflow-x-auto scrollbar-none">
                       {(lunar.phase === 'POURNAMI' ? [
                         { label: 'Prev Ashtami', days: lunar.daysSinceAshtami, emoji: '🌓', color: 'text-violet-300', suffix: ' ago' },
                         { label: 'Prev Navami', days: lunar.daysSinceNavami, emoji: '🌙', color: 'text-sky-300', suffix: ' ago' },
                         { label: 'Prev Amavasya', days: lunar.daysSinceAmavasya, emoji: '🌑', color: 'text-indigo-400', suffix: ' ago' },
                       ] : [
                         { label: 'Ashtami', days: lunar.daysToAshtami, emoji: '🌓', color: 'text-violet-300', suffix: 'd' },
                         { label: 'Navami', days: lunar.daysToNavami, emoji: '🌙', color: 'text-sky-300', suffix: 'd' },
                         { label: 'Amavasya', days: lunar.daysToAmavasya, emoji: '🌑', color: 'text-indigo-400', suffix: 'd' },
                       ]).sort((a,b) => a.days - b.days).map((ev, i) => (
                         <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center min-w-[80px]">
                            <span className="text-xl mb-1">{ev.emoji}</span>
                            <p className="text-[7px] font-black uppercase text-white/40 tracking-widest">{ev.label}</p>
                            <p className={cn("text-[10px] font-black", ev.color)}>{Math.round(ev.days)}{ev.suffix}</p>
                         </div>
                       ))}
                    </div>
                  )}

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
                          : (lunar.phase === 'ASHTAMI' || lunar.phase === 'NAVAMI')
                          ? 'Quarter moon stress + heat stress can compound. Monitor O₂ closely.'
                          : `Stable phase. Next major molting event starts in ${Math.min(lunar.daysToAmavasya, lunar.daysToAshtami, lunar.daysToNavami)} days.`}
                      </p>
                    </div>
                    <div className="mt-[-8px]">
                      <Droplets size={16} className="text-white/20 flex-shrink-0" />
                    </div>
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
              </div>
            )}

            {/* Tab Switch: Today vs Full Cycle vs Lunar */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(['today', 'cycle', 'lunar'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-1 py-4 px-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap',
                    activeTab === tab
                      ? 'bg-[#0D523C] text-white border-[#0D523C] shadow-lg'
                      : 'bg-white text-[#4A2C2A]/40 border-black/5'
                  )}
                >
                  {tab === 'today' ? "Today's SOP" : tab === 'cycle' ? 'Full Cycle' : 'Lunar Planner'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'today' && (
                <motion.div
                  key="today"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Not Stocked Empty State */}
                  {!selectedPond.stockingDate ? (
                    <div className="bg-white rounded-[2.5rem] p-10 text-center border border-dashed border-[#4A2C2A]/10">
                      <div className="w-16 h-16 bg-[#F8F9FE] rounded-3xl flex items-center justify-center mx-auto mb-4 text-[#C78200]">
                        <Calendar size={32} />
                      </div>
                      <h3 className="text-[#4A2C2A] font-black text-base tracking-tight mb-2">Culture Not Started</h3>
                      <p className="text-[#4A2C2A]/40 text-[11px] leading-relaxed">
                        Set a stocking date for <span className="text-[#C78200] font-black">{selectedPond.name}</span> to begin tracking SOP medicines.
                      </p>
                    </div>
                  ) : todayGuidance.length === 0 && currentDoc > 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-10 text-center border border-dashed border-[#4A2C2A]/10">
                      <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
                      <h3 className="text-[#4A2C2A] font-black text-base tracking-tight mb-2">All Clear Today!</h3>
                      <p className="text-[#4A2C2A]/40 text-[11px]">No specific SOP medicines for DOC {currentDoc}. Maintain routine aeration.</p>
                    </div>
                  ) : (
                    <>
                      {/* Guidance or Stocking Day Content */}
                      {currentDoc === 0 && todayGuidance.length === 0 && (
                        <div className="bg-emerald-50 border border-emerald-100/50 rounded-[2rem] p-6 text-center">
                           <Zap className="text-emerald-500 mx-auto mb-3" size={28} />
                           <h4 className="text-[#0D523C] font-black text-base tracking-tight mb-1">Stocking Day (DOC 0)</h4>
                           <p className="text-[#0D523C]/50 text-[11px] leading-relaxed mb-4">
                             Congratulations on starting your culture! Use Bio-Booster and Gut Probiotics for the next 3 days.
                           </p>
                           <span className="text-[9px] font-black uppercase text-emerald-800 tracking-widest bg-emerald-500/20 px-3 py-1.5 rounded-full">
                             Initial Stress Management
                           </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between px-1">
                        <div>
                          <h2 className="text-[#4A2C2A] font-black text-lg tracking-tight">{t.dailySOP}</h2>
                          <p className="text-[#C78200] text-[9px] font-black uppercase tracking-widest mt-0.5">
                            {selectedDate.toDateString() === new Date().toDateString() ? 'Required Today' : `Required on ${selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`} — DOC {calculateDOC(selectedPond.stockingDate, selectedDate.toISOString())} ({selectedDate.toLocaleDateString('en-IN', { weekday: 'long' })})
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
                        {isLogging ? 'Syncing...' : (selectedDate.toDateString() === new Date().toDateString() ? `${t.logMedication} (${completedMeds.length})` : 'Planning Only (Historical/Future)')}
                        <ArrowRight size={18} />
                      </button>
                      {selectedDate.toDateString() !== new Date().toDateString() && (
                        <button 
                          onClick={() => setSelectedDate(new Date())}
                          className="w-full py-3 text-[10px] font-black uppercase text-indigo-500 bg-indigo-500/10 rounded-2xl tracking-widest"
                        >
                          Return to Today
                        </button>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === 'cycle' && (
                /* Full SOP Cycle View */
                <motion.div
                  key="cycle"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
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

              {/* Lunar Planner Calendar View */}
              {activeTab === 'lunar' && (
                <motion.div
                  key="lunar"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 pb-10"
                >
                  {!selectedPond ? (
                    <div className="bg-white/80 backdrop-blur-md rounded-[3rem] p-10 text-center border border-black/5 shadow-xl">
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500 mx-auto mb-6">
                        <Waves size={40} />
                      </div>
                      <h3 className="text-[#4A2C2A] font-black text-xl tracking-tight mb-2">No Pond Selected</h3>
                      <p className="text-[#4A2C2A]/40 text-xs font-bold leading-relaxed max-w-[200px] mx-auto">
                        Please select a pond from the dashboard to see its personalized lunar molting schedule.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-[#051F19] p-7 rounded-[3rem] text-white relative overflow-hidden mb-6">
                        <div className="relative z-10">
                           <div className="flex items-center gap-2 mb-2">
                             <p className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.3em]">{selectedPond.name}</p>
                             <span className="w-1 h-1 rounded-full bg-emerald-400/30" />
                             <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em]">DOC {currentDoc}</p>
                           </div>
                           <h3 className="text-2xl font-black tracking-tighter mb-4">2026 Molting Forecast</h3>
                           <p className="text-white/40 text-[10px] font-medium leading-relaxed">
                              Calendar Sync: Active (Mar-Sep 2026) · SOP Integrated for {selectedPond.shrimpType}.
                           </p>
                        </div>
                        <div className="absolute right-[-5%] top-[-10%] opacity-10">
                           <Star size={180} />
                        </div>
                      </div>

                      {/* Weekly Day Headers */}
                      <div className="grid grid-cols-7 gap-1.5 px-1 mb-2">
                         {['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'].map((d, i) => (
                           <div key={i} className="text-center font-black text-[5px] text-[#4A2C2A]/20 uppercase tracking-[0.1em]">{d}</div>
                         ))}
                      </div>

                      {/* Scrollable Container with 4-row visibility limit */}
                      <div className="max-h-[480px] overflow-y-auto px-1 pr-2 space-y-4 custom-scrollbar">
                        <motion.div 
                          className="grid grid-cols-7 gap-1.5"
                          variants={{
                            show: { transition: { staggerChildren: 0.03 } }
                          }}
                          initial="hidden"
                          animate="show"
                        >
                          {lunarForecast.map((day, i) => {
                            const isToday = i === 0;
                            const isAmavasya = day.status.phase === 'AMAVASYA';
                            const isAshtami = day.status.phase === 'ASHTAMI';
                            const isNavami = day.status.phase === 'NAVAMI';
                            const isHighRisk = day.status.isHighRisk && !isAmavasya;
                            
                            const forecastDoc = calculateDOC(selectedPond.stockingDate, day.date.toISOString());
                            const moltCycle = forecastDoc <= 30 ? 4 : forecastDoc <= 60 ? 7 : 12;
                            const isBiologicalMolt = forecastDoc % moltCycle === 0;
                            const isLunarMolt = isAmavasya || isNavami || isAshtami;
                            
                            // Peak Molt: When biological cycle hits lunar high-tide
                            const isPeakMolt = isBiologicalMolt && isLunarMolt; 
                            const hasMoltRisk = isPeakMolt || isLunarMolt;
                            const isBioMarker = isBiologicalMolt && !isLunarMolt;

                            return (
                              <motion.div 
                                key={i}
                                variants={{
                                  hidden: { opacity: 0, scale: 0.8 },
                                  show: { opacity: 1, scale: 1 }
                                }}
                                animate={
                                  (isAmavasya || isAshtami || isNavami) ? { 
                                    scale: [0.9, 1.05, 1],
                                    opacity: [0, 1]
                                  } : { opacity: [0, 1], scale: [0.95, 1] }
                                }
                                transition={
                                  { duration: 0.8, ease: "easeOut", delay: i * 0.02 }
                                }
                                className={cn(
                                  "relative p-2 rounded-[1.2rem] border flex flex-col items-center justify-between transition-all min-h-[95px] cursor-pointer",
                                  isAmavasya ? "bg-black border-indigo-500 shadow-xl shadow-indigo-500/20" :
                                  isAshtami ? "bg-violet-950 border-violet-500/50 shadow-lg shadow-violet-500/10" :
                                  isNavami ? "bg-[#0B1A2E] border-sky-500/30 shadow-lg " :
                                  isBioMarker ? "bg-[#FFF9E6] border-amber-200/50 shadow-sm" :
                                  day.date.toDateString() === selectedDate.toDateString() ? "bg-emerald-500 border-white shadow-xl shadow-emerald-500/30" :
                                  "bg-white/90 backdrop-blur-md border-black/5",
                                  isHighRisk && !isAmavasya && "ring-1 ring-indigo-500/20",
                                  isPeakMolt && "ring-4 ring-amber-500 shadow-xl shadow-amber-500/20 scale-105 z-20"
                                )}
                                onClick={() => setSelectedDate(day.date)}
                              >
                                 <div className="w-full flex justify-between items-start mb-1">
                                    <div className="flex flex-col">
                                      <span className={cn(
                                        "text-[5px] font-black uppercase tracking-tighter opacity-70",
                                        (isAmavasya || isAshtami || isNavami || day.date.toDateString() === selectedDate.toDateString()) ? "text-white/40" : "text-black/20"
                                      )}>
                                        {day.date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
                                      </span>
                                      <span className={cn(
                                        "text-[5px] font-black",
                                        (isAmavasya || isAshtami || isNavami || day.date.toDateString() === selectedDate.toDateString()) ? "text-white/20" : "text-black/5"
                                      )}>
                                        D{forecastDoc}
                                      </span>
                                    </div>
                                    {isToday && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                 </div>
                                 
                                 <div className="relative flex flex-col items-center">
                                    <motion.span 
                                      animate={isLunarMolt ? { rotate: 360 } : {}}
                                      transition={isLunarMolt ? { duration: 25, repeat: Infinity, ease: "linear" } : {}}
                                      className="text-sm mb-0.5 inline-block"
                                    >
                                       {day.status.phase === 'AMAVASYA' ? '🌑' : 
                                        day.status.phase === 'POURNAMI' ? '🌕' : 
                                        day.status.phase === 'ASHTAMI' ? '🌗' :
                                        day.status.phase === 'NAVAMI' ? '🌘' :
                                        '🌑'}
                                    </motion.span>
                                    {(hasMoltRisk || isNavami || isAshtami) && (
                                      <div className={cn(
                                        "absolute -top-1 -right-3 p-1 rounded-full",
                                        isPeakMolt ? "bg-amber-500" : "bg-indigo-500"
                                      )}>
                                        <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                      </div>
                                    )}
                                 </div>
                                 
                                 <div className="text-center w-full">
                                     <p className={cn(
                                       "text-[9px] font-black tracking-tighter leading-none mb-1",
                                       (isAmavasya || isAshtami || isNavami || day.date.toDateString() === selectedDate.toDateString()) ? "text-white" : "text-[#4A2C2A]"
                                     )}>
                                       {day.date.getDate()} {day.date.toLocaleDateString('en-US', { month: 'short' })}
                                     </p>
                                     <div className={cn(
                                       "py-0.5 px-1 rounded-md text-[4px] font-black uppercase tracking-[0.2em] inline-block w-full",
                                       isAmavasya ? "bg-indigo-500 text-white" : 
                                       isAshtami ? "bg-violet-500 text-white" : 
                                       isNavami ? "bg-sky-500 text-white" :
                                       isBioMarker ? "bg-amber-500 text-white" :
                                       day.date.toDateString() === selectedDate.toDateString() ? "bg-white text-emerald-600" :
                                       isHighRisk ? "bg-indigo-100/50 text-indigo-400" :
                                       "bg-black/[0.03] text-black/20"
                                     )}>
                                       {isAmavasya ? 'AMAVASYA' : isPeakMolt ? 'PEAK' : isAshtami ? 'ASHTAMI' : isNavami ? 'NAVAMI' : isBioMarker ? 'BIOMOLT' : isHighRisk ? 'RISK' : 'OK'}
                                     </div>
                                 </div>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      </div>

                      {/* Quick Medicine Preview for Selected Date */}
                      <motion.div 
                        key={selectedDate.toISOString()}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] p-6 border border-black/5 shadow-lg mt-2"
                      >
                         <div className="flex items-center justify-between mb-4">
                            <div>
                               <p className="text-[#C78200] text-[8px] font-black uppercase tracking-widest leading-none mb-1">Schedule for</p>
                               <h3 className="text-[#4A2C2A] text-sm font-black tracking-tighter">
                                 {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })} — DOC {calculateDOC(selectedPond.stockingDate, selectedDate.toISOString())}
                               </h3>
                            </div>
                            <button 
                              onClick={() => setActiveTab('today')}
                              className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-xl uppercase tracking-widest"
                            >
                              Open Full SOP →
                            </button>
                         </div>

                         <div className="space-y-3">
                            {getSOPGuidance(calculateDOC(selectedPond.stockingDate, selectedDate.toISOString()), selectedDate)
                              .filter(s => s.type === 'MEDICINE' || s.type === 'LUNAR')
                              .map((med, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-3 bg-[#F8F9FE] rounded-2xl border border-black/5">
                                   <div className={cn(
                                     "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                                     med.type === 'LUNAR' ? "bg-[#1A1C2E] text-white" : "bg-[#C78200] text-white"
                                   )}>
                                      {med.type === 'LUNAR' ? <Moon size={14} /> : <Zap size={14} />}
                                   </div>
                                   <div>
                                      <p className="text-[#4A2C2A] text-[11px] font-black tracking-tight leading-none">{med.title}</p>
                                      <p className="text-[#4A2C2A]/40 text-[9px] font-medium leading-tight mt-1 line-clamp-1">{med.description}</p>
                                   </div>
                                </div>
                            ))}
                            {getSOPGuidance(calculateDOC(selectedPond.stockingDate, selectedDate.toISOString()), selectedDate)
                              .filter(s => s.type === 'MEDICINE' || s.type === 'LUNAR').length === 0 && (
                                <p className="text-[#4A2C2A]/30 text-[10px] font-black text-center py-4 uppercase tracking-widest">No primary medicines scheduled</p>
                            )}
                         </div>
                      </motion.div>

                      <div className="bg-[#C78200]/5 p-6 rounded-[2.5rem] border border-[#C78200]/10 mt-6">
                         <div className="flex items-center gap-3 mb-3 text-[#C78200]">
                            <AlertTriangle size={18} />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">personalized Planning Tip</h4>
                         </div>
                         <p className="text-[#4A2C2A]/60 text-[11px] leading-relaxed font-bold">
                            Based on your pond's stock date ({selectedPond.shrimpType}), the high-risk molting period is locked to the lunar cycle. 
                            <span className="text-indigo-900 font-black ml-1">🌑 New Moon</span> triggers on {lunarForecast.find(d => d.status.phase === 'AMAVASYA')?.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) || 'Cycle Peak'}. 
                            Ensure DO is &gt; 5ppm.
                         </p>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dynamic Disease Alert Section (Only shows when risk is HIGH or CRITICAL) */}
            {currentDoc > 0 && activeTab !== 'lunar' && riskLevel !== 'STABLE' && (
              <section className="bg-red-50 rounded-[2.5rem] p-7 border border-red-100 relative overflow-hidden">
                <div className="flex items-center gap-4 mb-5">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all",
                    riskLevel === 'CRITICAL' ? "bg-red-600 animate-pulse" : "bg-red-500"
                  )}>
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-[#4A2C2A] text-lg font-black tracking-tighter">
                      {riskLevel === 'CRITICAL' ? "⚠️ EXTREME RISK ALERT" : t.diseaseAlert}
                    </h2>
                    <p className={cn(
                      "text-[9px] font-black uppercase tracking-widest leading-tight",
                      riskLevel === 'CRITICAL' ? "text-red-700" : "text-red-400"
                    )}>
                      {currentDoc <= 30 ? "Early Risk: Bacteria / PL Stress" :
                       currentDoc <= 60 ? "Critical Zone: Vibriosis / WSSV" :
                       "Late Risk: EHP / EMS Stage"} {riskLevel === 'CRITICAL' && "- ENVIRONMENTAL STRESS DETECTED"}
                    </p>
                  </div>
                </div>

                <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 mb-5">
                  <p className="text-red-900/70 text-[10px] font-black uppercase tracking-widest mb-2">Live Analysis Summary:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/50 p-2 rounded-xl border border-red-100">
                       <p className="text-[7px] font-black text-red-400 uppercase">SOP Risk (Age)</p>
                       <p className="text-[11px] font-black text-[#4A2C2A]">{isDOCRisk ? 'ACTIVE' : 'STABLE'}</p>
                    </div>
                    <div className="bg-white/50 p-2 rounded-xl border border-red-100">
                       <p className="text-[7px] font-black text-red-400 uppercase">Pond Data (Latest)</p>
                       <p className="text-[11px] font-black text-[#4A2C2A]">{isWaterRisk ? 'STRESS DETECTED' : 'NORMAL'}</p>
                    </div>
                  </div>
                  {isWaterRisk && latestRead && (
                    <p className="text-red-600 text-[10px] font-bold mt-3 leading-tight">
                      ⚠️ Detectable risk due to {latestRead.do < 4.0 ? 'LOW DO (' + latestRead.do + ')' : ''} 
                      {latestRead.ph > 8.5 ? ' HIGH PH (' + latestRead.ph + ')' : ''} 
                      {latestRead.temp > 31 ? ' HIGH TEMP (' + latestRead.temp + ')' : ''}.
                    </p>
                  )}
                </div>

                <p className="text-red-900/50 text-[11px] font-bold tracking-tight leading-relaxed mb-5">
                  Based on **DOC {currentDoc}** + **Daily Pond Data**, monitor these specific symptoms:
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


            {/* Weekly Model Card (Hidden on Lunar and Full Cycle tabs to avoid confusion) */}
            {activeTab === 'today' && (
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
                    const isToday = dayIdx === selectedDate.getDay();
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
            )}

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
