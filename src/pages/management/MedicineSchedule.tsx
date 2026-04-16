import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Pill, CheckCircle2, AlertTriangle, ShieldCheck,
  Calendar, Star, Activity, Info, TrendingUp, Clock, Zap,
  Droplets, Moon, Plus, Trash2, FlaskConical, HeartPulse,
  BookOpen, RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { NoPondState } from '../../components/NoPondState';
import type { Translations } from '../../translations';
import { calculateDOC } from '../../utils/pondUtils';
import { getSOPGuidance, SOPSuggestion } from '../../utils/sopRules';
import { getLunarStatus, getLunarForecast } from '../../utils/lunarUtils';
import { cn } from '../../utils/cn';
import { computeDiseaseRisk } from '../../utils/diseaseRiskEngine';

// ─── SPECIES PROFILES ─────────────────────────────────────────────────────────
const SOP_PHASES = [
  {
    range: 'DOC 1–10', label: 'Early Establishment', color: '#10B981', icon: '🌱',
    meds: [
      { name: 'Gut Probiotic Foundation', dose: '5g/kg feed', freq: 'Daily', priority: 'HIGH' },
      { name: 'Stress Booster (Vit C + Betaine)', dose: 'High dose', freq: 'DOC 1–3', priority: 'HIGH' },
      { name: 'Water Probiotic', dose: '250g/acre', freq: 'DOC 5 & 10', priority: 'MEDIUM' },
      { name: 'Mineral Supplement', dose: '10kg/acre', freq: 'DOC 7', priority: 'MEDIUM' },
    ],
  },
  {
    range: 'DOC 11–20', label: 'Growth Spurt', color: '#3B82F6', icon: '📈',
    meds: [
      { name: 'Gut Probiotic Foundation', dose: '5g/kg feed', freq: 'Daily', priority: 'HIGH' },
      { name: 'Water Probiotic', dose: '250g/acre', freq: 'DOC 15 & 20', priority: 'MEDIUM' },
      { name: 'Vitamin C Booster', dose: 'High dose', freq: 'DOC 15 only', priority: 'HIGH' },
      { name: 'Mineral Supplement', dose: '10kg/acre', freq: 'DOC 14', priority: 'MEDIUM' },
    ],
  },
  {
    range: 'DOC 21–30', label: 'Risk Stage', color: '#F59E0B', icon: '⚠️',
    meds: [
      { name: 'Water Probiotic (Intensive)', dose: '300g/acre', freq: 'Alt days', priority: 'HIGH' },
      { name: 'Immunity Booster Pulse', dose: 'High dose', freq: 'DOC 25', priority: 'HIGH' },
      { name: 'Gut Probiotic Foundation', dose: '5g/kg feed', freq: 'Daily', priority: 'HIGH' },
    ],
  },
  {
    range: 'DOC 31–45', label: '⚠ Critical Stage', color: '#EF4444', icon: '🦠',
    meds: [
      { name: 'Water Probiotic (Pathogen Control)', dose: '400g/acre', freq: 'Every 3 days', priority: 'HIGH' },
      { name: 'Anti-Stress Tonic', dose: 'Normal', freq: 'DOC 30–35', priority: 'MEDIUM' },
      { name: 'Vitamin + Mineral Booster', dose: 'Boost', freq: 'DOC 40', priority: 'HIGH' },
    ],
  },
  {
    range: 'DOC 46–80', label: 'Peak Growth', color: '#8B5CF6', icon: '💪',
    meds: [
      { name: 'Liver Tonic (Hepatopancreas)', dose: '3g/kg feed', freq: 'DOC 50 (5 days)', priority: 'HIGH' },
      { name: 'Mineral Mix', dose: '15–20kg/acre', freq: 'Continuous', priority: 'MEDIUM' },
      { name: 'Late Immunity Booster', dose: 'High dose', freq: 'DOC 70', priority: 'MEDIUM' },
    ],
  },
  {
    range: 'DOC 81–100', label: 'Harvest Stage', color: '#C78200', icon: '🎣',
    meds: [
      { name: 'Stop heavy medicines', dose: '—', freq: 'Ongoing', priority: 'HIGH' },
      { name: 'Clean water treatment only', dose: '—', freq: 'Daily', priority: 'MEDIUM' },
    ],
  },
];

const MOON_META: Record<string, { emoji: string; label: string; badge: string; badgeText: string; rules: string[] }> = {
  AMAVASYA: {
    emoji: '🌑', label: 'Amavasya — New Moon', badge: '#EF4444', badgeText: 'HIGH RISK',
    rules: ['Reduce feed 20–30% tonight', 'Run ALL aerators through the night', 'Apply Mineral Mix (morning only)', 'Apply Vitamin C/Immunity boost (morning only)', 'Do NOT apply probiotics after 6 PM'],
  },
  ASHTAMI: {
    emoji: '🌓', label: 'Ashtami — Molting Begins', badge: '#F59E0B', badgeText: 'MOLTING',
    rules: ['Reduce feed 10% today', 'Start intensive aeration (Morning & Night)', 'Apply Minerals (Evening) for shell hardening', 'Watch for soft-shell shrimp'],
  },
  NAVAMI: {
    emoji: '🌙', label: 'Navami — Peak Recovery', badge: '#10B981', badgeText: 'VIGILANCE',
    rules: ['Maximum vigilance for molting recovery tonight', 'Watch for soft-shell / slow feeders', 'Reduce feed 15% if mortality seen', 'Apply Immunity boosters (Morning)', 'Maintain Max Aeration through 2 AM'],
  },
  POURNAMI: {
    emoji: '🌕', label: 'Pournami — Full Moon', badge: '#6366F1', badgeText: 'ACTIVE',
    rules: ['High biological activity tonight', 'Increase aeration levels (100% capacity)', 'Monitor DO levels afternoon & midnight', 'Mineral application suggested for partial molting'],
  },
  NORMAL: {
    emoji: '🌤️', label: 'Normal Phase — Safe Period', badge: '#10B981', badgeText: 'STABLE',
    rules: ['Standard feeding schedule applies', 'Apply medicines as per DOC SOP', 'Best time to apply: 7–9 AM or 4–6 PM'],
  },
};

const MEDICINE_COSTS: Record<string, number> = {
  'Gut Probiotic Foundation': 120, 'Water Probiotic': 90, 'Water Probiotic (Intensive)': 100,
  'Water Probiotic (Pathogen Control)': 110, 'Mineral Supplement': 75, 'Mineral Mix': 80,
  'Vitamin C Booster': 180, 'Vitamin + Mineral Booster': 220, 'Immunity Booster Pulse': 190,
  'Late Immunity Booster': 200, 'Anti-Stress Tonic': 160, 'Liver Tonic (Hepatopancreas)': 250,
  'Stress Booster (Vit C + Betaine)': 200, 'pH Correction — Zeolite': 100,
};

const getCostEstimate = (name: string, acres = 1) =>
  Math.round((MEDICINE_COSTS[name] ?? 100) * Math.max(1, acres));

const getPhaseForDOC = (doc: number) => {
  if (doc <= 0) return -1;
  if (doc <= 10) return 0;
  if (doc <= 20) return 1;
  if (doc <= 30) return 2;
  if (doc <= 45) return 3;
  if (doc <= 80) return 4;
  return 5;
};

const getPriorityStyle = (p: string) =>
  p === 'HIGH' ? { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'HIGH' }
    : p === 'MEDIUM' ? { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'MED' }
    : { bg: 'rgba(16,185,129,0.12)', color: '#10B981', label: 'LOW' };

const getNextMilestone = (doc: number) => {
  const ms = [
    { doc: 5, label: 'Water Probiotic (1st)' }, { doc: 10, label: 'End Establishment' },
    { doc: 15, label: 'Vitamin C Booster' }, { doc: 21, label: 'Risk Stage' },
    { doc: 25, label: 'Immunity Booster' }, { doc: 31, label: 'Critical Stage' },
    { doc: 40, label: 'Vit+Mineral Boost' }, { doc: 50, label: 'Liver Tonic Day' },
    { doc: 83, label: 'Pre-Harvest Prep' }, { doc: 90, label: 'Medicine Withdrawal' },
  ];
  return ms.find(m => m.doc > doc) ?? null;
};

// ─── FARMER CUSTOM SOP TYPE ──────────────────────────────────────────────────
interface FarmerSOP {
  id: string; name: string;
  type: 'probiotic'|'mineral'|'vitamin'|'antibiotic'|'feed_additive'|'other';
  rate: number; unit: 'kg'|'L'|'g'|'ml'|'packet';
  dosePerAcre: string; docRange: string; notes: string;
}
const TYPE_META: Record<FarmerSOP['type'], { emoji: string; color: string }> = {
  probiotic: { emoji: '🦠', color: '#10B981' }, mineral: { emoji: '💎', color: '#3B82F6' },
  vitamin: { emoji: '💊', color: '#8B5CF6' }, antibiotic: { emoji: '🔬', color: '#EF4444' },
  feed_additive: { emoji: '🌿', color: '#F59E0B' }, other: { emoji: '📦', color: '#6B7280' },
};

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'today',   icon: Clock,      label: 'Today'   },
  { id: 'cycle',   icon: Calendar,   label: 'Cycle'   },
  { id: 'disease', icon: FlaskConical, label: 'Risk'  },
  { id: 'lunar',   icon: Moon,       label: 'Lunar'   },
  { id: 'my_sop',  icon: BookOpen,   label: 'My SOP'  },
] as const;
type TabId = typeof TABS[number]['id'];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export const MedicineSchedule = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, addMedicineLog, medicineLogs, waterRecords, theme, serverError } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const activePonds = ponds.filter(p => p.status === 'active' || p.status === 'planned');
  const [selectedPondId, setSelectedPondId] = useState(activePonds[0]?.id || '');
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [completedMeds, setCompletedMeds] = useState<string[]>([]);
  const [isLogging, setIsLogging] = useState(false);

  // custom SOP state
  const SOPS_KEY = `aqua_farmer_sops_${selectedPondId || 'global'}`;
  const [farmerSOPs, setFarmerSOPs] = useState<FarmerSOP[]>(() => {
    try { return JSON.parse(localStorage.getItem(SOPS_KEY) || '[]'); } catch { return []; }
  });
  const [showSOPForm, setShowSOPForm] = useState(false);
  const [sopForm, setSopForm] = useState({ name:'', type:'probiotic' as FarmerSOP['type'], rate:'', unit:'kg' as FarmerSOP['unit'], dosePerAcre:'', docRange:'', notes:'' });

  useEffect(() => {
    try { setFarmerSOPs(JSON.parse(localStorage.getItem(`aqua_farmer_sops_${selectedPondId || 'global'}`) || '[]')); } catch {}
  }, [selectedPondId]);

  const saveSOPs = (list: FarmerSOP[]) => { setFarmerSOPs(list); localStorage.setItem(`aqua_farmer_sops_${selectedPondId || 'global'}`, JSON.stringify(list)); };
  const addSOP = () => {
    if (!sopForm.name.trim() || !sopForm.rate) return;
    saveSOPs([...farmerSOPs, { id: Date.now().toString(), ...sopForm, rate: parseFloat(sopForm.rate) }]);
    setSopForm({ name:'', type:'probiotic', rate:'', unit:'kg', dosePerAcre:'', docRange:'', notes:'' });
    setShowSOPForm(false);
  };

  const selectedPond = ponds.find(p => p.id === selectedPondId);
  const doc = selectedPond ? calculateDOC(selectedPond.stockingDate) : 0;
  const pondAcres = parseFloat(String((selectedPond as any)?.size || 1)) || 1;

  const today = new Date().toISOString().split('T')[0];
  const lunar = useMemo(() => getLunarStatus(new Date()), []);
  const lunarForecast = useMemo(() =>
    getLunarForecast(new Date(), 90).map(d => ({ date: d.date, phase: d.status.phase })),
  []);
  const moonMeta = MOON_META[lunar.phase] ?? MOON_META['NORMAL'];

  const pondWater = useMemo(() =>
    waterRecords.filter(r => r.pondId === selectedPondId)
      .sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime()),
    [waterRecords, selectedPondId]);
  const latestWater = pondWater[0];

  const diseaseRisk = useMemo(() => computeDiseaseRisk({
    doc, temperature: latestWater?.temperature ?? latestWater?.temp,
    doLevel: latestWater?.do, ammonia: latestWater?.ammonia, ph: latestWater?.ph,
  }), [doc, latestWater]);

  const todayGuidance: SOPSuggestion[] = useMemo(() =>
    getSOPGuidance(selectedPond?.status === 'planned' ? -1 : doc, new Date()),
    [doc, selectedPond?.status]);

  const pondMedLogs = useMemo(() => medicineLogs.filter(l => l.pondId === selectedPondId), [medicineLogs, selectedPondId]);
  const todayMedLogs = pondMedLogs.filter(l => l.date?.startsWith(today));
  const last7DaysMeds = pondMedLogs.filter(l => {
    const d = new Date(l.date); const w = new Date(); w.setDate(w.getDate() - 7); return d >= w;
  }).length;

  const complianceStreak = useMemo(() => {
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const key = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      if (pondMedLogs.some(l => l.date?.startsWith(key))) streak++;
      else if (i > 0) break;
    }
    return streak;
  }, [pondMedLogs]);

  const currentPhaseIdx = getPhaseForDOC(doc);
  const nextMilestone = getNextMilestone(doc);
  const isCritical = doc >= 31 && doc <= 45;
  const isWithdrawal = doc >= 90;

  const totalCost = completedMeds.reduce((acc, n) => acc + getCostEstimate(n, pondAcres), 0);

  const handleLog = async () => {
    if (!completedMeds.length || !selectedPond) return;
    setIsLogging(true);
    try {
      await Promise.all(completedMeds.map(name =>
        addMedicineLog({ pondId: selectedPond.id, date: new Date().toISOString(), name, dosage: 'As per SOP', doc, cost: getCostEstimate(name, pondAcres) })
      ));
      setCompletedMeds([]);
    } catch { alert(t.failedSaveLogs); }
    finally { setIsLogging(false); }
  };

  // ─── ACCENT COLOR ─────────────────────────────────────────────────────────
  const accent = isCritical ? '#EF4444' : isWithdrawal ? '#C78200' : '#8B5CF6';
  const accentHex = accent;

  return (
    <div className={cn('pb-32 min-h-[100dvh] font-sans relative overflow-hidden transition-colors duration-500', isDark ? 'bg-[#060A10]' : 'bg-[#F0EEF8]')}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={cn('absolute -top-20 -right-20 w-96 h-96 rounded-full blur-[160px]', isDark ? 'bg-purple-600/15' : 'bg-purple-400/12')} />
        <div className={cn('absolute bottom-20 -left-20 w-80 h-80 rounded-full blur-[140px]', isDark ? 'bg-indigo-500/10' : 'bg-blue-400/8')} />
      </div>

      {/* ─── LOGGING OVERLAY ─── */}
      <AnimatePresence>
        {isLogging && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-indigo-950/97 backdrop-blur-xl flex flex-col items-center justify-center text-white">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}
              className="w-28 h-28 bg-white/10 rounded-[2rem] flex items-center justify-center mb-4 shadow-2xl">
              <ShieldCheck size={56} className="text-purple-300" />
            </motion.div>
            <h3 className="text-2xl font-black tracking-tighter mb-1">Logs Synced!</h3>
            <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.25em]">Medicine history updated</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── FIXED HEADER ─── */}
      <header className={cn(
        'fixed top-0 left-0 right-0 max-w-[420px] mx-auto z-50 px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3',
        'flex items-center justify-between border-b backdrop-blur-xl transition-all',
        isDark ? 'bg-[#060A10]/90 border-white/5' : 'bg-white/95 border-slate-100 shadow-sm'
      )}>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/dashboard')}
          className={cn('w-9 h-9 rounded-xl flex items-center justify-center border',
            isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-slate-200 text-slate-500 shadow-sm')}>
          <ChevronLeft size={16} />
        </motion.button>
        <div className="text-center">
          <h1 className={cn('text-[11px] font-black tracking-widest uppercase', isDark ? 'text-white' : 'text-slate-900')}>Medicine Intelligence</h1>
          <p className={cn('text-[7.5px] font-black uppercase tracking-[0.2em] mt-0.5', isDark ? 'text-purple-400/70' : 'text-purple-600')}>SOP-Driven • DOC Auto-Calculated</p>
        </div>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border',
          isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200')}>
          <Pill size={14} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
        </div>
      </header>

      <div className="pt-[calc(env(safe-area-inset-top)+4.5rem)] px-4 max-w-[420px] mx-auto relative z-10 space-y-4">

        {/* ─── POND TABS ─── */}
        {activePonds.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {activePonds.map(p => (
              <button key={p.id} onClick={() => setSelectedPondId(p.id)}
                className={cn('px-3.5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex-shrink-0',
                  selectedPondId === p.id
                    ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/20'
                    : isDark ? 'bg-white/5 text-white/40 border-white/8' : 'bg-white text-slate-500 border-slate-100 shadow-sm')}>
                💊 {p.name} <span className="opacity-60 ml-1">D{calculateDOC(p.stockingDate)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-8"><NoPondState isDark={isDark} subtitle="Add a pond to start tracking medicine schedules." /></div>
        )}

        {!selectedPond ? null : (
          <AnimatePresence mode="wait">
            <motion.div key={selectedPond.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

              {/* ═══════════════════════════════════════════════════
                  HERO COMMAND CARD
              ═══════════════════════════════════════════════════ */}
              <div className="rounded-[2rem] overflow-hidden shadow-2xl relative"
                style={{ background: isCritical
                  ? 'linear-gradient(150deg,#2D0505,#6B0F0F,#B91C1C,#EF4444)'
                  : isWithdrawal
                  ? 'linear-gradient(150deg,#2D1500,#6B3500,#B45000,#C78200)'
                  : 'linear-gradient(150deg,#0D0520,#2A0A5E,#4F1D96,#7C3AED)' }}>
                {/* Mesh */}
                <div className="absolute inset-0 opacity-[0.05]"
                  style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                {/* Glow */}
                <div className="absolute -bottom-16 -right-16 w-64 h-64 blur-[80px] rounded-full" style={{ background: `${accentHex}20` }} />

                <div className="relative z-10 p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-purple-200/40 text-[7px] font-black uppercase tracking-[0.35em] mb-1">Medicine Command Center</p>
                      <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-2">{selectedPond.name}</h2>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-white tracking-tighter leading-none" style={{ textShadow: `0 2px 20px ${accentHex}50` }}>
                          {todayMedLogs.length}
                        </span>
                        <span className="text-base text-purple-300 font-black">today</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/15',
                          'text-[8px] font-black text-purple-100 uppercase tracking-widest')}>
                          <Pill size={9} /> DOC {doc}
                        </span>
                        {isCritical && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/25 border border-red-400/30 text-[8px] font-black text-red-200 uppercase tracking-widest">
                            ⚠️ Critical Stage
                          </span>
                        )}
                        {isWithdrawal && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-[8px] font-black text-amber-200 uppercase tracking-widest">
                            🚫 Withdrawal
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Compliance Ring */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="relative w-20 h-20">
                        <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                          <circle cx="18" cy="18" r="15.9" fill="none"
                            stroke={complianceStreak >= 7 ? '#34d399' : complianceStreak >= 3 ? '#fbbf24' : '#f87171'}
                            strokeWidth="2.5" strokeLinecap="round"
                            strokeDasharray={`${Math.min(100, (complianceStreak / 10) * 100)} 100`} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-black text-white leading-none">{complianceStreak}</span>
                          <span className="text-[6px] font-black text-purple-300/60 uppercase tracking-widest">streak</span>
                        </div>
                      </div>
                      <span className={cn('text-[7px] font-black uppercase tracking-widest',
                        complianceStreak >= 7 ? 'text-emerald-300' : complianceStreak >= 3 ? 'text-amber-300' : 'text-red-300')}>
                        {complianceStreak >= 7 ? '● Great' : complianceStreak >= 3 ? '● Good' : '● Low'}
                      </span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
                    {[
                      { label: 'Phase', value: SOP_PHASES[currentPhaseIdx]?.icon + ' ' + (currentPhaseIdx >= 0 ? SOP_PHASES[currentPhaseIdx].range : 'Pre-Stock'), icon: Activity },
                      { label: '7-Day Logs', value: `${last7DaysMeds}`, icon: Calendar },
                      { label: 'Next Event', value: nextMilestone ? `D${nextMilestone.doc}` : 'Harvest', icon: TrendingUp },
                    ].map((m, i) => (
                      <div key={i} className="text-center">
                        <m.icon size={11} className="text-purple-300/50 mx-auto mb-0.5" />
                        <p className="text-sm font-black text-white leading-none truncate">{m.value}</p>
                        <p className="text-[6.5px] font-black text-purple-200/40 uppercase tracking-widest mt-0.5">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Today's compliance bar */}
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[7.5px] font-black text-purple-200/50 uppercase tracking-widest">Today's Medicine Logs</p>
                      <p className="text-[8.5px] font-black text-white/80">{todayMedLogs.length} logged • {todayGuidance.length} recommended</p>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, todayGuidance.length > 0 ? (todayMedLogs.length / todayGuidance.length) * 100 : 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={cn('h-full rounded-full', todayMedLogs.length >= todayGuidance.length ? 'bg-emerald-400' : todayMedLogs.length > 0 ? 'bg-amber-400' : 'bg-red-400')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Next milestone alert */}
              {nextMilestone && nextMilestone.doc - doc <= 3 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className={cn('rounded-2xl p-3.5 border flex items-start gap-3',
                    isDark ? 'bg-amber-500/8 border-amber-500/25' : 'bg-amber-50 border-amber-200')}>
                  <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-amber-400' : 'text-amber-700')}>
                      DOC {nextMilestone.doc} in {nextMilestone.doc - doc} days
                    </p>
                    <p className={cn('text-[8px] font-medium mt-0.5', isDark ? 'text-amber-300/60' : 'text-amber-600/70')}>
                      Prepare: {nextMilestone.label}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════
                  TABS
              ═══════════════════════════════════════ */}
              <div className={cn('flex rounded-[1.6rem] border gap-1 p-1.5',
                isDark ? 'bg-black/30 border-white/8' : 'bg-slate-100 border-slate-200 shadow-inner')}>
                {TABS.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={cn('flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 rounded-[1.2rem] transition-all duration-200',
                        isActive
                          ? isDark
                            ? 'bg-gradient-to-b from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-900/40'
                            : 'bg-gradient-to-b from-purple-500 to-purple-700 text-white shadow-md shadow-purple-300/40'
                          : isDark ? 'text-white/35 hover:text-white/65 hover:bg-white/8' : 'text-slate-400 hover:text-slate-700 hover:bg-white/60')}>
                      <tab.icon size={11} strokeWidth={isActive ? 3 : 2} />
                      <span className="text-[6.5px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ══════════════════════════════════════════════════
                  TAB: TODAY'S SOP
              ══════════════════════════════════════════════════ */}
              {activeTab === 'today' && (
                <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">

                  {/* Lunar banner */}
                  <div className={cn('rounded-2xl border flex items-center justify-between px-4 py-3',
                    isDark ? 'bg-white/[0.04] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                    <div className="flex items-center gap-2.5">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center',
                        isDark ? 'bg-indigo-500/15' : 'bg-indigo-100')}>
                        <Moon size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                      </div>
                      <div>
                        <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-indigo-400/70' : 'text-indigo-500')}>Moon Phase</p>
                        <p className={cn('text-sm font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{moonMeta.emoji} {lunar.phase}</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-black px-2.5 py-1 rounded-xl text-white"
                      style={{ background: moonMeta.badge }}>{moonMeta.badgeText}</span>
                  </div>

                  {/* Today's medicine cards */}
                  <div>
                    <p className={cn('text-[8px] font-black uppercase tracking-widest px-1 mb-2',
                      isDark ? 'text-white/30' : 'text-slate-400')}>Today's Protocol • {todayGuidance.length} items</p>
                    <div className="space-y-2">
                      {todayGuidance.length === 0 ? (
                        <div className={cn('rounded-2xl p-4 border text-center', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100')}>
                          <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                          <p className={cn('text-[10px] font-black', isDark ? 'text-white/60' : 'text-slate-600')}>All clear today!</p>
                          <p className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>No specific medicine scheduled for DOC {doc}</p>
                        </div>
                      ) : todayGuidance.map((item, i) => {
                        const isDone = completedMeds.includes(item.title) || todayMedLogs.some(l => l.name === item.title);
                        const alreadyLogged = todayMedLogs.some(l => l.name === item.title);
                        const ps = getPriorityStyle(item.priority);
                        return (
                          <motion.div key={i}
                            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className={cn('rounded-2xl border transition-all duration-200',
                              isDone
                                ? isDark ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200'
                                : isDark ? 'bg-white/[0.04] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                            <div className="flex items-center gap-3 px-4 py-3.5">
                              {/* Checkbox */}
                              <button
                                onClick={() => !alreadyLogged && setCompletedMeds(prev =>
                                  prev.includes(item.title) ? prev.filter(n => n !== item.title) : [...prev, item.title])}
                                className={cn('w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all border',
                                  isDone ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/25' : isDark ? 'border-white/15 bg-white/5' : 'border-slate-200 bg-slate-50')}>
                                {isDone && <CheckCircle2 size={14} className="text-white" />}
                              </button>
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <p className={cn('text-[10px] font-black tracking-tight',
                                    isDone ? 'text-emerald-500' : isDark ? 'text-white' : 'text-slate-900', isDone && 'line-through opacity-60')}>
                                    {item.title}
                                  </p>
                                  <span className="text-[6.5px] font-black px-1.5 py-0.5 rounded-full" style={{ background: ps.bg, color: ps.color }}>{ps.label}</span>
                                </div>
                                <p className={cn('text-[8px] font-medium leading-snug', isDark ? 'text-white/35' : 'text-slate-500')}>
                                  {item.dose ?? item.description?.slice(0, 60)}{item.applicationType ? ` • ${item.applicationType === 'FEED' ? 'In feed' : 'In water'}` : ''}
                                </p>
                              </div>
                              {/* Cost */}
                              <div className="text-right flex-shrink-0">
                                <p className={cn('text-[9px] font-black', isDark ? 'text-white/50' : 'text-slate-600')}>
                                  ₹{getCostEstimate(item.title, pondAcres)}
                                </p>
                                {alreadyLogged && (
                                  <span className="text-[6.5px] font-black text-emerald-500 block">✓ Logged</span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Log CTA */}
                  {completedMeds.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={cn('rounded-2xl border p-4', isDark ? 'bg-purple-500/8 border-purple-500/25' : 'bg-purple-50 border-purple-200')}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-purple-400' : 'text-purple-700')}>
                            {completedMeds.length} medicine{completedMeds.length > 1 ? 's' : ''} selected
                          </p>
                          <p className={cn('text-[8px] font-medium', isDark ? 'text-white/40' : 'text-slate-500')}>
                            Est. cost: ₹{totalCost}
                          </p>
                        </div>
                        <button onClick={handleLog} disabled={isLogging}
                          className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/30 disabled:opacity-50">
                          Log Now →
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {completedMeds.map(m => (
                          <span key={m} className={cn('text-[7px] font-black px-2 py-1 rounded-lg flex items-center gap-1',
                            isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700')}>
                            {m}
                            <button onClick={() => setCompletedMeds(p => p.filter(n => n !== m))}>
                              <Trash2 size={8} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Recent logs */}
                  {pondMedLogs.length > 0 && (
                    <div>
                      <p className={cn('text-[8px] font-black uppercase tracking-widest px-1 mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
                        Recent History
                      </p>
                      <div className="space-y-1.5">
                        {pondMedLogs.slice(0, 5).map((log, i) => (
                          <div key={i} className={cn('flex items-center justify-between px-4 py-2.5 rounded-2xl border',
                            isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
                            <div className="flex items-center gap-2.5">
                              <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0',
                                isDark ? 'bg-purple-500/15' : 'bg-purple-100')}>
                                <Pill size={11} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                              </div>
                              <div>
                                <p className={cn('text-[9px] font-black', isDark ? 'text-white/80' : 'text-slate-800')}>{log.name}</p>
                                <p className={cn('text-[7px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>
                                  {log.date ? new Date(log.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '—'} • DOC {log.doc ?? '—'}
                                </p>
                              </div>
                            </div>
                            <p className={cn('text-[8px] font-black', isDark ? 'text-white/40' : 'text-slate-500')}>₹{log.cost ?? '—'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB: CULTURE CYCLE
              ══════════════════════════════════════════════════ */}
              {activeTab === 'cycle' && (
                <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                  <p className={cn('text-[8px] font-black uppercase tracking-widest px-1 mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
                    Full Culture Cycle SOP
                  </p>
                  {SOP_PHASES.map((phase, pi) => {
                    const isCurrentPhase = pi === currentPhaseIdx;
                    return (
                      <div key={pi} className={cn('rounded-2xl border overflow-hidden',
                        isCurrentPhase
                          ? isDark ? 'border-purple-500/40' : 'border-purple-300'
                          : isDark ? 'border-white/8' : 'border-slate-100')}>
                        {/* Phase header */}
                        <div className="flex items-center gap-3 px-4 py-3"
                          style={{ background: isCurrentPhase ? `${phase.color}18` : undefined }}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                            style={{ background: `${phase.color}20` }}>
                            {phase.icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-black" style={{ color: phase.color }}>{phase.range}</p>
                            <p className={cn('text-[8px] font-medium', isDark ? 'text-white/40' : 'text-slate-500')}>{phase.label}</p>
                          </div>
                          {isCurrentPhase && (
                            <span className="text-[6.5px] font-black px-2 py-1 rounded-full text-white"
                              style={{ background: phase.color }}>ACTIVE</span>
                          )}
                        </div>
                        {/* Phase medicines */}
                        <div className={cn('divide-y', isDark ? 'divide-white/5' : 'divide-slate-50')}>
                          {phase.meds.map((med, mi) => {
                            const ps = getPriorityStyle(med.priority);
                            return (
                              <div key={mi} className={cn('flex items-center gap-3 px-4 py-2.5',
                                isDark ? 'bg-white/[0.02]' : 'bg-white')}>
                                <Pill size={11} style={{ color: phase.color }} className="flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className={cn('text-[9px] font-black', isDark ? 'text-white/80' : 'text-slate-800')}>{med.name}</p>
                                  <p className={cn('text-[7px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>{med.dose} • {med.freq}</p>
                                </div>
                                <span className="text-[6.5px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                                  style={{ background: ps.bg, color: ps.color }}>{ps.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB: DISEASE RISK
              ══════════════════════════════════════════════════ */}
              {activeTab === 'disease' && (
                <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">

                  {/* Overall risk header */}
                  <div className={cn('rounded-2xl border p-4', isDark ? 'bg-white/[0.04] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: `${diseaseRisk?.riskLevel === 'CRITICAL' ? '#EF4444' : diseaseRisk?.riskLevel === 'HIGH' ? '#F59E0B' : '#10B981'}18` }}>
                        {diseaseRisk?.riskLevel === 'CRITICAL' ? '🚨' : diseaseRisk?.riskLevel === 'HIGH' ? '⚠️' : '✅'}
                      </div>
                      <div className="flex-1">
                        <p className={cn('text-[7px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>Overall Disease Risk</p>
                        <p className="text-base font-black" style={{ color: diseaseRisk?.riskLevel === 'CRITICAL' ? '#EF4444' : diseaseRisk?.riskLevel === 'HIGH' ? '#F59E0B' : '#10B981' }}>
                          {diseaseRisk?.riskLevel ?? 'STABLE'}
                        </p>
                        <p className={cn('text-[8px] font-medium', isDark ? 'text-white/40' : 'text-slate-500')}>
                          Score: {diseaseRisk?.totalScore ?? 0}/100 • DOC {doc}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Risk factors */}
                  {(diseaseRisk?.risks ?? []).length > 0 ? (
                    <div>
                      <p className={cn('text-[8px] font-black uppercase tracking-widest px-1 mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
                        Active Risk Factors
                      </p>
                      {(diseaseRisk?.risks ?? []).map((risk: any, i: number) => (
                        <div key={i} className={cn('rounded-2xl border p-3.5 mb-2',
                          isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                              style={{ background: '#EF444418' }}>
                              🦠
                            </div>
                            <div className="flex-1">
                              <p className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-800')}>{risk.disease ?? risk.name}</p>
                              <p className={cn('text-[8px] font-medium leading-snug mt-0.5', isDark ? 'text-white/40' : 'text-slate-500')}>
                                {risk.window ?? risk.description ?? ''}
                              </p>
                              {risk.prevention && (
                                <p className={cn('text-[7.5px] font-black mt-1', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
                                  💊 {risk.prevention}
                                </p>
                              )}
                            </div>
                            <span className="text-[6.5px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 text-white"
                              style={{ background: risk.score > 60 ? '#EF4444' : '#F59E0B' }}>
                              {risk.score > 60 ? 'HIGH' : 'MED'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={cn('rounded-2xl p-5 border text-center', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100')}>
                      <HeartPulse size={28} className="text-emerald-500 mx-auto mb-2" />
                      <p className={cn('text-[10px] font-black', isDark ? 'text-white/60' : 'text-slate-600')}>No active disease risks</p>
                      <p className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>DOC {doc} is a stable phase. Keep up the SOP.</p>
                    </div>
                  )}

                  {/* Protective actions */}
                  <div className={cn('rounded-2xl border p-4', isDark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')}>
                    <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                      🛡️ Preventive Protocol
                    </p>
                    {[
                      'Apply gut probiotic daily in feed (5–10g/kg)',
                      'Water probiotic every 3–5 days',
                      'Keep DO > 5 mg/L at all times',
                      'Monitor for lethargy or tail redness daily',
                      'Test water quality morning & evening',
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <p className={cn('text-[8px] font-medium leading-snug', isDark ? 'text-white/50' : 'text-slate-600')}>{tip}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB: LUNAR PLANNER
              ══════════════════════════════════════════════════ */}
              {activeTab === 'lunar' && (
                <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">

                  {/* Tonight's moon hero card */}
                  <div className="rounded-[1.8rem] overflow-hidden shadow-xl"
                    style={{ background:
                      lunar.phase === 'AMAVASYA' ? 'linear-gradient(150deg,#0a0005,#1a0a2e,#2D0259,#4C0875)'
                      : lunar.phase === 'POURNAMI' ? 'linear-gradient(150deg,#050B28,#0D1850,#1A2E8C,#2563eb)'
                      : lunar.phase === 'ASHTAMI'  ? 'linear-gradient(150deg,#1C1200,#3B2600,#7C5200,#C78200)'
                      : lunar.phase === 'NAVAMI'   ? 'linear-gradient(150deg,#001C12,#003D28,#047857,#10b981)'
                      : 'linear-gradient(150deg,#0B1A2E,#121F35,#1a3046)' }}>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-5xl leading-none">{moonMeta.emoji}</span>
                          <div>
                            <p className="text-[7px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Tonight</p>
                            <p className="text-lg font-black text-white">{moonMeta.label}</p>
                            <span className="text-[7.5px] font-black px-2 py-0.5 rounded-full text-white"
                              style={{ background: moonMeta.badge }}>{moonMeta.badgeText}</span>
                          </div>
                        </div>
                        {lunar.phase !== 'NORMAL' && (
                          <span className="text-[6.5px] font-black px-2 py-0.5 rounded-full bg-white/10 text-white/60 uppercase tracking-widest mt-1">
                            ⚠ Medicine timing critical
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 mb-3">
                        {moonMeta.rules.map((rule, i) => {
                          const isCaution = rule.startsWith('Do NOT') || rule.startsWith('Watch') || rule.startsWith('Reduce');
                          const isDo = rule.startsWith('Apply') || rule.startsWith('Run') || rule.startsWith('Increase') || rule.startsWith('Start') || rule.startsWith('Maintain') || rule.startsWith('Maximum');
                          return (
                            <div key={i} className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ background: isCaution ? 'rgba(239,68,68,0.2)' : isDo ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)' }}>
                                <span className="text-[9px]">{isCaution ? '⚠' : isDo ? '✓' : '·'}</span>
                              </div>
                              <p className="text-[8.5px] font-medium text-white/70 leading-snug">{rule}</p>
                            </div>
                          );
                        })}
                      </div>
                      {lunar.phase !== 'NORMAL' && (
                        <div className="rounded-xl bg-white/8 border border-white/12 p-3 flex items-center gap-2.5">
                          <span className="text-lg">💊</span>
                          <div>
                            <p className="text-[7px] font-black uppercase tracking-widest text-white/40 mb-0.5">Medicine Timing Rule</p>
                            <p className="text-[8.5px] font-black text-white/80">
                              {lunar.phase === 'AMAVASYA' ? 'Apply ALL medicines before 9 AM only. Zero treatments after 6 PM.'
                              : lunar.phase === 'POURNAMI' ? 'Mineral application allowed in evening. Probiotics in morning feed only.'
                              : lunar.phase === 'ASHTAMI'  ? 'Apply Mineral Mix 4–6 PM for shell hardening. No antibiotics today.'
                              : 'Immunity boosters morning only. Avoid pond disturbance after 8 PM.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── UPCOMING SPECIAL DAYS WITH CAUTIONS ── */}
                  {(() => {
                    const specialDays = lunarForecast
                      .map((day, i) => ({ ...day, idx: i }))
                      .filter(d => d.phase !== 'NORMAL');
                    if (specialDays.length === 0) return null;

                    type PhaseKey = 'AMAVASYA' | 'POURNAMI' | 'ASHTAMI' | 'NAVAMI';
                    const PHASE_DETAIL: Record<PhaseKey, { title: string; color: string; bg: string; border: string; severity: string; severityColor: string; cautions: string[]; dos: string[]; medicineTip: string; }> = {
                      AMAVASYA: {
                        title: 'Amavasya — New Moon', color: '#a855f7',
                        bg: isDark ? 'rgba(168,85,247,0.08)' : 'rgba(168,85,247,0.05)',
                        border: isDark ? 'rgba(168,85,247,0.25)' : 'rgba(168,85,247,0.18)',
                        severity: 'HIGHEST RISK', severityColor: '#EF4444',
                        cautions: ['Shrimp undergo mass molting — immunity is at its lowest', 'DO levels can crash rapidly after midnight', 'Vibrio and WSSV spread fastest during Amavasya', 'Ammonia spikes from uneaten feed are dangerous tonight'],
                        dos: ['Reduce feed by 25–30% for today\'s slots', 'Run ALL aerators at 100% through the night', 'Apply Mineral Mix in the morning (before 9 AM only)', 'Apply Vitamin C / Immunity booster in morning feed'],
                        medicineTip: 'Apply ALL medicines before 9 AM only. ZERO treatments after 6 PM.',
                      },
                      POURNAMI: {
                        title: 'Pournami — Full Moon', color: '#6366f1',
                        bg: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)',
                        border: isDark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.18)',
                        severity: 'HIGH ACTIVITY', severityColor: '#6366F1',
                        cautions: ['Plankton blooms can crash overnight causing DO drop', 'Partial molting — monitor tray residue at every slot', 'DO can drop unexpectedly at 2–4 AM', 'Overfeeding risk is high as shrimp may refuse trays'],
                        dos: ['Increase aeration to 100% from evening', 'Monitor DO at midnight and 4 AM', 'Apply Mineral Mix for shell hardening (evening)', 'Reduce feed 10% if tray shows > 15% residue'],
                        medicineTip: 'Probiotics in morning feed only. Minerals can be applied in evening.',
                      },
                      ASHTAMI: {
                        title: 'Ashtami — Molting Begins', color: '#C78200',
                        bg: isDark ? 'rgba(199,130,0,0.08)' : 'rgba(199,130,0,0.05)',
                        border: isDark ? 'rgba(199,130,0,0.25)' : 'rgba(199,130,0,0.18)',
                        severity: 'MOLTING DAY', severityColor: '#F59E0B',
                        cautions: ['Soft-shell shrimp are vulnerable to cannibalism', 'Crowding near aerators can damage molting shrimp', 'Do NOT handle or net the pond — severe stress', 'Low mineral levels worsen shell hardening time'],
                        dos: ['Reduce feed by 10–15% for today', 'Apply Mineral Mix in evening for shell hardening', 'Start intensive aeration both morning and night', 'Watch trays closely for high residue (sign of molting)'],
                        medicineTip: 'Apply Mineral Mix 4–6 PM for calcium support. No antibiotics today.',
                      },
                      NAVAMI: {
                        title: 'Navami — Peak Molting Recovery', color: '#10b981',
                        bg: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.05)',
                        border: isDark ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.18)',
                        severity: 'VIGILANCE', severityColor: '#10B981',
                        cautions: ['Shells still soft — vulnerability window open', 'Slow feeders or floating shrimp = poor molting recovery', 'Oxygen demand is highest as shrimp rebuild shells', 'No sampling or netting today — avoid stress'],
                        dos: ['Maintain max aeration through 2 AM tonight', 'Apply Immunity Boosters in morning feed', 'Reduce feed 15% if any mortality observed', 'Check tray residue every slot — act if > 20%'],
                        medicineTip: 'Immunity boosters morning only. Avoid pond disturbance after 8 PM.',
                      },
                    };

                    return (
                      <div>
                        <p className={cn('text-[8px] font-black uppercase tracking-widest px-1 mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
                          ⚠️ Special Days with Cautions — {specialDays.length} upcoming events
                        </p>
                        <div className="space-y-2">
                          {specialDays.map((day, si) => {
                            const detail = PHASE_DETAIL[day.phase as PhaseKey];
                            if (!detail) return null;
                            const docForDay = selectedPond?.stockingDate ? calculateDOC(selectedPond.stockingDate, day.date.toISOString()) : 0;
                            const isToday = day.idx === 0;
                            const dateLabel = day.date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
                            return (
                              <div key={si} className="rounded-2xl border overflow-hidden"
                                style={{ background: detail.bg, borderColor: detail.border }}>
                                <div className="flex items-center justify-between px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-2xl leading-none">{MOON_META[day.phase]?.emoji ?? '🌙'}</span>
                                    <div>
                                      <p className="text-[10px] font-black" style={{ color: detail.color }}>{detail.title}</p>
                                      <p className={cn('text-[7.5px] font-medium', isDark ? 'text-white/40' : 'text-slate-500')}>
                                        {isToday ? '🔴 Tonight' : `${day.idx} days away`} · {dateLabel} · DOC {docForDay}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[6.5px] font-black px-2 py-1 rounded-full text-white"
                                    style={{ background: detail.severityColor }}>{detail.severity}</span>
                                </div>
                                <div className="px-4 pb-1">
                                  <p className={cn('text-[6.5px] font-black uppercase tracking-widest mb-1.5', isDark ? 'text-red-400/70' : 'text-red-600')}>⚠ Cautions</p>
                                  {detail.cautions.map((c, ci) => (
                                    <div key={ci} className="flex items-start gap-2 mb-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0 opacity-80" />
                                      <p className={cn('text-[8px] font-medium leading-snug', isDark ? 'text-white/55' : 'text-slate-600')}>{c}</p>
                                    </div>
                                  ))}
                                </div>
                                <div className="px-4 pb-1 pt-1">
                                  <p className={cn('text-[6.5px] font-black uppercase tracking-widest mb-1.5', isDark ? 'text-emerald-400/70' : 'text-emerald-700')}>✓ What To Do</p>
                                  {detail.dos.map((d, di) => (
                                    <div key={di} className="flex items-start gap-2 mb-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                                      <p className={cn('text-[8px] font-medium leading-snug', isDark ? 'text-white/55' : 'text-slate-600')}>{d}</p>
                                    </div>
                                  ))}
                                </div>
                                <div className="mx-4 mb-3 mt-1 rounded-xl p-2.5 flex items-start gap-2"
                                  style={{ background: `${detail.color}12`, border: `1px solid ${detail.color}25` }}>
                                  <span className="text-base flex-shrink-0">💊</span>
                                  <p className={cn('text-[8px] font-black leading-snug', isDark ? 'text-white/70' : 'text-slate-700')}>{detail.medicineTip}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 90-day scroll calendar */}
                  {(() => {
                    const PHASE_COLORS: Record<string, { border: string; glow: string; text: string; name: string; bg: string }> = {
                      AMAVASYA: { border: '#a855f7', glow: 'rgba(168,85,247,0.20)', text: '#a855f7', name: 'Amavasya', bg: 'rgba(168,85,247,0.12)' },
                      POURNAMI: { border: '#6366f1', glow: 'rgba(99,102,241,0.20)',  text: '#6366f1', name: 'Pournami', bg: 'rgba(99,102,241,0.12)'  },
                      ASHTAMI:  { border: '#C78200', glow: 'rgba(199,130,0,0.20)',   text: '#C78200', name: 'Ashtami',  bg: 'rgba(199,130,0,0.12)'   },
                      NAVAMI:   { border: '#10b981', glow: 'rgba(16,185,129,0.20)',  text: '#10b981', name: 'Navami',   bg: 'rgba(16,185,129,0.12)'  },
                    };

                    // Group days by month for section headers
                    let lastMonth = -1;

                    return (
                      <div>
                        <div className="flex items-center justify-between px-1 mb-2">
                          <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>
                            90-Day Lunar Calendar
                          </p>
                          <p className={cn('text-[7px] font-black px-2 py-0.5 rounded-full', isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-600')}>
                            ← scroll →
                          </p>
                        </div>

                        <div className="overflow-x-auto no-scrollbar pb-2">
                          <div className="flex items-end gap-1.5" style={{ width: 'max-content' }}>
                            {lunarForecast.map((day, i) => {
                              const isToday  = i === 0;
                              const isRisk   = day.phase !== 'NORMAL';
                              const pc       = PHASE_COLORS[day.phase];
                              const docForDay = selectedPond?.stockingDate
                                ? calculateDOC(selectedPond.stockingDate, day.date.toISOString()) : 0;
                              const monthNum = day.date.getMonth();
                              const showMonthLabel = monthNum !== lastMonth;
                              if (showMonthLabel) lastMonth = monthNum;
                              const monthLabel = day.date.toLocaleDateString('en-IN', { month: 'short' });

                              return (
                                <div key={i} className="flex flex-col items-center gap-0.5 flex-shrink-0">
                                  {/* Month label */}
                                  {showMonthLabel && (
                                    <p className={cn('text-[6px] font-black uppercase tracking-widest mb-0.5 self-start', isDark ? 'text-white/20' : 'text-slate-300')}>
                                      {monthLabel}
                                    </p>
                                  )}

                                  {isRisk && pc ? (
                                    /* ── SPECIAL DAY — tall highlighted pill ── */
                                    <div className="relative flex flex-col items-center rounded-xl overflow-hidden"
                                      style={{
                                        width: 44,
                                        border: `1.5px solid ${pc.border}`,
                                        background: pc.bg,
                                        boxShadow: `0 0 12px ${pc.border}30, 0 2px 8px ${pc.border}20`,
                                      }}>
                                      {/* Top gradient stripe */}
                                      <div className="w-full h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${pc.border}, transparent)` }} />

                                      <div className="px-1 pt-1.5 pb-2 flex flex-col items-center gap-0.5 w-full">
                                        {/* Phase emoji */}
                                        <span className="text-xl leading-none">{MOON_META[day.phase]?.emoji}</span>

                                        {/* Date */}
                                        <p className="text-[10px] font-black leading-none" style={{ color: pc.text }}>
                                          {day.date.getDate()}
                                        </p>

                                        {/* Phase name */}
                                        <p className="text-[5px] font-black uppercase tracking-widest leading-none text-center" style={{ color: pc.text }}>
                                          {pc.name}
                                        </p>

                                        {/* DOC */}
                                        <span className="text-[5px] font-black px-1 py-0.5 rounded-full leading-none"
                                          style={{ background: `${pc.border}25`, color: pc.text }}>
                                          D{docForDay}
                                        </span>
                                      </div>

                                      {/* Pulsing ring for today */}
                                      {isToday && (
                                        <motion.div
                                          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 0.2, 0.7] }}
                                          transition={{ duration: 1.8, repeat: Infinity }}
                                          className="absolute inset-0 rounded-xl pointer-events-none"
                                          style={{ border: `2px solid ${pc.border}` }}
                                        />
                                      )}
                                    </div>
                                  ) : (
                                    /* ── NORMAL DAY — short subtle chip ── */
                                    <div className={cn('rounded-lg flex flex-col items-center justify-center relative overflow-hidden',
                                      isToday
                                        ? isDark ? 'border border-purple-500/50 bg-purple-500/12' : 'border border-purple-300 bg-purple-50'
                                        : isDark ? 'border border-white/5 bg-white/[0.02]' : 'border border-slate-100 bg-slate-50/50'
                                    )} style={{ width: 28, height: 36 }}>
                                      <p className={cn('text-[7.5px] font-black leading-none', isDark ? 'text-white/35' : 'text-slate-500')}>
                                        {day.date.getDate()}
                                      </p>
                                      {isToday && (
                                        <div className="w-1 h-1 rounded-full bg-purple-500 mt-0.5" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 px-1">
                          {[
                            { emoji: '🌑', label: 'Amavasya', color: '#a855f7', sub: 'Highest Risk' },
                            { emoji: '🌕', label: 'Pournami', color: '#6366f1', sub: 'Full Moon'    },
                            { emoji: '🌓', label: 'Ashtami',  color: '#C78200', sub: 'Molting'      },
                            { emoji: '🌙', label: 'Navami',   color: '#10b981', sub: 'Recovery'     },
                          ].map(l => (
                            <div key={l.label} className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-md flex items-center justify-center text-[9px]"
                                style={{ background: `${l.color}18`, border: `1px solid ${l.color}50` }}>
                                {l.emoji}
                              </div>
                              <div>
                                <p className="text-[6.5px] font-black uppercase tracking-widest leading-none" style={{ color: l.color }}>{l.label}</p>
                                <p className={cn('text-[5.5px] font-medium leading-none', isDark ? 'text-white/20' : 'text-slate-400')}>{l.sub}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB: MY SOP (Custom Farmer SOPs)
              ══════════════════════════════════════════════════ */}
              {activeTab === 'my_sop' && (
                <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">

                  <div className="flex items-center justify-between px-1">
                    <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>
                      My Custom SOPs ({farmerSOPs.length})
                    </p>
                    <button onClick={() => setShowSOPForm(!showSOPForm)}
                      className={cn('flex items-center gap-1 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest',
                        isDark ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25' : 'bg-purple-50 text-purple-600 border border-purple-200')}>
                      <Plus size={10} /> Add SOP
                    </button>
                  </div>

                  {/* Add SOP form */}
                  <AnimatePresence>
                    {showSOPForm && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
                        <div className="p-4 space-y-3">
                          <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/50' : 'text-slate-600')}>New Custom SOP</p>
                          {/* Name */}
                          <div className={cn('rounded-xl p-3 border flex items-center gap-2', isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}>
                            <Pill size={13} className={isDark ? 'text-white/30' : 'text-slate-400'} />
                            <input value={sopForm.name} onChange={e => setSopForm(f => ({ ...f, name: e.target.value }))}
                              placeholder="Medicine name (e.g. Gut Probiotic)"
                              className={cn('flex-1 bg-transparent text-sm font-medium outline-none', isDark ? 'text-white placeholder-white/20' : 'text-slate-800 placeholder-slate-400')} />
                          </div>
                          {/* Type + Unit row */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className={cn('rounded-xl p-3 border', isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}>
                              <p className={cn('text-[6.5px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/30' : 'text-slate-400')}>Type</p>
                              <select value={sopForm.type} onChange={e => setSopForm(f => ({ ...f, type: e.target.value as FarmerSOP['type'] }))}
                                className={cn('w-full bg-transparent text-[10px] font-black outline-none', isDark ? 'text-white' : 'text-slate-800')}>
                                {Object.keys(TYPE_META).map(k => <option key={k} value={k}>{TYPE_META[k as FarmerSOP['type']].emoji} {k}</option>)}
                              </select>
                            </div>
                            <div className={cn('rounded-xl p-3 border', isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}>
                              <p className={cn('text-[6.5px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/30' : 'text-slate-400')}>Unit</p>
                              <select value={sopForm.unit} onChange={e => setSopForm(f => ({ ...f, unit: e.target.value as FarmerSOP['unit'] }))}
                                className={cn('w-full bg-transparent text-[10px] font-black outline-none', isDark ? 'text-white' : 'text-slate-800')}>
                                {['kg','L','g','ml','packet'].map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                            </div>
                          </div>
                          {/* Rate + Dose */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className={cn('rounded-xl p-3 border flex items-center gap-2', isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}>
                              <input value={sopForm.rate} onChange={e => setSopForm(f => ({ ...f, rate: e.target.value }))}
                                placeholder="₹ per unit" type="number"
                                className={cn('flex-1 bg-transparent text-sm font-medium outline-none', isDark ? 'text-white placeholder-white/20' : 'text-slate-800 placeholder-slate-400')} />
                            </div>
                            <div className={cn('rounded-xl p-3 border flex items-center gap-2', isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}>
                              <input value={sopForm.dosePerAcre} onChange={e => setSopForm(f => ({ ...f, dosePerAcre: e.target.value }))}
                                placeholder="Dose / acre"
                                className={cn('flex-1 bg-transparent text-sm font-medium outline-none', isDark ? 'text-white placeholder-white/20' : 'text-slate-800 placeholder-slate-400')} />
                            </div>
                          </div>
                          {/* DOC Range */}
                          <div className={cn('rounded-xl p-3 border flex items-center gap-2', isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}>
                            <Calendar size={13} className={isDark ? 'text-white/30' : 'text-slate-400'} />
                            <input value={sopForm.docRange} onChange={e => setSopForm(f => ({ ...f, docRange: e.target.value }))}
                              placeholder="DOC range (e.g. 1-30)"
                              className={cn('flex-1 bg-transparent text-sm font-medium outline-none', isDark ? 'text-white placeholder-white/20' : 'text-slate-800 placeholder-slate-400')} />
                          </div>
                          {/* Buttons */}
                          <div className="flex gap-2">
                            <button onClick={() => setShowSOPForm(false)}
                              className={cn('flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border',
                                isDark ? 'border-white/10 text-white/30' : 'border-slate-200 text-slate-400')}>
                              Cancel
                            </button>
                            <button onClick={addSOP}
                              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                              Save SOP
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* SOP cards list */}
                  {farmerSOPs.length === 0 ? (
                    <div className={cn('rounded-2xl p-6 border text-center', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100')}>
                      <BookOpen size={28} className={cn('mx-auto mb-2', isDark ? 'text-white/20' : 'text-slate-300')} />
                      <p className={cn('text-[10px] font-black', isDark ? 'text-white/40' : 'text-slate-500')}>No custom SOPs yet</p>
                      <p className={cn('text-[8px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>Add your farmer-specific medicine protocols above</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {farmerSOPs.map(sop => {
                        const tm = TYPE_META[sop.type];
                        return (
                          <div key={sop.id} className={cn('rounded-2xl border p-4', isDark ? 'bg-white/[0.04] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                                style={{ background: `${tm.color}18` }}>
                                {tm.emoji}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn('text-[11px] font-black', isDark ? 'text-white' : 'text-slate-900')}>{sop.name}</p>
                                <p className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>
                                  {sop.dosePerAcre && `${sop.dosePerAcre}/acre`}{sop.docRange && ` • DOC ${sop.docRange}`}
                                </p>
                                <p className={cn('text-[9px] font-black mt-0.5', isDark ? 'text-white/60' : 'text-slate-600')}>
                                  ₹{sop.rate}/{sop.unit}
                                </p>
                              </div>
                              <button onClick={() => saveSOPs(farmerSOPs.filter(s => s.id !== sop.id))}
                                className={cn('w-7 h-7 rounded-xl flex items-center justify-center', isDark ? 'bg-white/5 text-white/30' : 'bg-slate-100 text-slate-400')}>
                                <Trash2 size={11} />
                              </button>
                            </div>
                            {sop.notes && (
                              <p className={cn('text-[7.5px] font-medium mt-2 leading-snug', isDark ? 'text-white/25' : 'text-slate-400')}>{sop.notes}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
