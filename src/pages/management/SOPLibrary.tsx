import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Droplets,
  Zap,
  Pill,
  Utensils,
  AlertTriangle,
  X,
  ChevronRight,
  Activity,
  Moon,
  BookOpen,
  Bell,
  CheckCircle2,
  Clock,
  Layers,
  CalendarDays,
  FlaskConical,
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
  color: string;
  tasks: SOPTask[];
}

const SOP_DOC_RANGES: SOPRange[] = [
  {
    doc: 'PRE-STOCKING',
    title: 'Pond Preparation & Bio-Security',
    emoji: '🏗️',
    color: '#3B82F6',
    tasks: [
      { type: 'Soil', med: 'Drying & Tilling', desc: 'Sun-dry until soil cracks (7-10 days)', priority: 'HIGH', appType: 'WATER', category: 'WATER' },
      { type: 'Treatment', med: 'Liming (Dolomite)', desc: 'Adjust soil pH to 7.5–8.5', priority: 'HIGH', appType: 'WATER', category: 'WATER' },
      { type: 'Sterilization', med: 'TCC / Chlorine 30ppm', desc: 'Kill pathogens before filling', priority: 'HIGH', appType: 'WATER', category: 'WATER' },
      { type: 'Conditioning', med: 'Bloom Development', desc: 'Molasses + Probiotics (Organic Juice)', priority: 'HIGH', appType: 'WATER', category: 'WATER' },
      { type: 'Mineralization', med: 'Pre-Stocking Mix', desc: 'Add 20kg/acre minerals for water aging', priority: 'MEDIUM', appType: 'WATER', category: 'MOLTING' },
    ],
  },
  {
    doc: '1-10',
    title: 'Nursery (Baby) Stage',
    emoji: '🟢',
    color: '#10B981',
    tasks: [
      { type: 'Daily', med: 'Gut Probiotic Foundation', desc: 'CP Gut Probiotic (5-10g/kg)', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
      { type: 'Daily', med: 'Starter Micro-Feed', desc: 'Protein 38%+, apply 4-5 times/day', priority: 'HIGH', appType: 'FEED', category: 'FEED' },
      { type: '3-Day', med: 'Water Probiotic (1st)', desc: 'Establish microbes (250g/acre)', priority: 'MEDIUM', appType: 'WATER', category: 'WATER' },
      { type: 'Weekly', med: 'Mineral Mix (Baby)', desc: '5-10 kg / acre for initial shell forming', priority: 'MEDIUM', appType: 'WATER', category: 'MOLTING' },
      { type: 'Anti-Stress', med: 'Vitamin C + Betaine', desc: 'Apply during stocking (DOC 1-3)', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
    ],
  },
  {
    doc: '11-20',
    title: 'Early Shuffling Phase',
    emoji: '🟡',
    color: '#F59E0B',
    tasks: [
      { type: 'Daily', med: 'Gut Conditioners', desc: 'Maintain flora (Avanti Gut Health)', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
      { type: 'Feed', med: 'Transition to Grade 1S', desc: 'Gradually mix starter with grower', priority: 'MEDIUM', appType: 'FEED', category: 'FEED' },
      { type: '5-Day', med: 'Soil Probiotics', desc: 'Bottom bacteria (Sanolife PRO-W)', priority: 'HIGH', appType: 'WATER', category: 'WATER' },
      { type: 'DOC 15', med: 'Vitamin C Spike', desc: 'Critical immunity booster', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
      { type: 'Weekly', med: 'Mineral Check', desc: 'Adjust Ca:Mg ratio (3:1 suggested)', priority: 'MEDIUM', appType: 'WATER', category: 'MOLTING' },
    ],
  },
  {
    doc: '21-30',
    title: 'Risk Transition Stage',
    emoji: '🟠',
    color: '#F97316',
    tasks: [
      { type: 'Alternate', med: 'Water Probiotic', desc: 'Maintain clean water column', priority: 'HIGH', appType: 'WATER', category: 'WATER' },
      { type: 'Molting', med: 'Mineral Mix High', desc: '10-15 kg / acre (Night apply)', priority: 'HIGH', appType: 'WATER', category: 'MOLTING' },
      { type: 'DOC 25', med: 'Immunity Pulse', desc: 'Prepare for critical DOC 30', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
      { type: 'Tray Check', med: 'Feed Consumption Audit', desc: 'Observe for waste feed on trays', priority: 'HIGH', appType: 'FEED', category: 'FEED' },
      { type: 'Vigilance', med: 'Tail Redness Check', desc: 'Scan for early Vibriosis signs', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
    ],
  },
  {
    doc: '31-45',
    title: 'Critical Warning Stage',
    emoji: '🔴',
    color: '#EF4444',
    tasks: [
      { type: 'Daily', med: 'Gut (Shield)', desc: 'Max intestinal protection', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
      { type: 'Feed', med: 'Meal Reduction Strategy', desc: 'Reduce feed by 10% on cloudy days', priority: 'HIGH', appType: 'FEED', category: 'FEED' },
      { type: '2-3 Days', med: 'Water (Anti-Vir)', desc: 'Combat viral load risk (Bioclean)', priority: 'HIGH', appType: 'WATER', category: 'WATER' },
      { type: 'DOC 40', med: 'Vit-Min Booster', desc: 'Metabolic boost at critical peak', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
      { type: 'Molting', med: 'Ashtami Mineral Pulse', desc: 'High dose before moon peak', priority: 'HIGH', appType: 'WATER', category: 'MOLTING' },
      { type: 'DO Alert', med: 'Max Aeration (9PM-5AM)', desc: 'Maintain DO above 4.5 mg/L', priority: 'HIGH', appType: 'WATER', category: 'WATER' },
    ],
  },
  {
    doc: '46-60',
    title: 'High Growth Spurt',
    emoji: '🔵',
    color: '#6366F1',
    tasks: [
      { type: 'Every 2d', med: 'Water Probiotic (Max)', desc: 'Waste removal during 1g spike', priority: 'HIGH', appType: 'WATER', category: 'WATER' },
      { type: 'Weekly', med: 'Mineral Mix 20kg', desc: 'Full mineralization support', priority: 'HIGH', appType: 'WATER', category: 'MOLTING' },
      { type: 'DOC 50', med: 'Liver Tonic', desc: 'Hepatopancreas protection', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
      { type: 'Feed', med: 'Grade 2 Feed + Probiotics', desc: 'Optimize FCR to 1.3-1.4 range', priority: 'HIGH', appType: 'FEED', category: 'FEED' },
    ],
  },
  {
    doc: '61-80',
    title: 'Late Cycle Stability',
    emoji: '🟣',
    color: '#8B5CF6',
    tasks: [
      { type: 'Regular', med: 'Water Probiotic Pulse', desc: 'Moderate water conditioning', priority: 'MEDIUM', appType: 'WATER', category: 'WATER' },
      { type: 'Weekly', med: 'Mineral Mix 25kg', desc: 'Prepare for final heavy molts', priority: 'HIGH', appType: 'WATER', category: 'MOLTING' },
      { type: 'DOC 70', med: 'Final Immunity Boost', desc: 'Prevent harvest-stage crashes', priority: 'HIGH', appType: 'FEED', category: 'MEDICINE' },
      { type: 'Feed', med: 'Tray Vigilance', desc: 'Stop feeding if 10% tray leftovers', priority: 'HIGH', appType: 'FEED', category: 'FEED' },
    ],
  },
  {
    doc: '81-100',
    title: 'Final Harvest Prep',
    emoji: '⚫',
    color: '#64748B',
    tasks: [
      { type: 'Weekly', med: 'Mineral Pulse Light', desc: '10kg / acre for shell hardness', priority: 'LOW', appType: 'WATER', category: 'MOLTING' },
      { type: 'DOC 90+', med: 'Withdrawal Protocol', desc: 'ZERO heavy medicines, clean water', priority: 'HIGH', appType: 'WATER', category: 'MEDICINE' },
      { type: 'Alert', med: 'Harvest Check-trays', desc: 'Final check for shell quality', priority: 'HIGH', appType: 'FEED', category: 'MOLTING' },
      { type: 'Flush', med: 'Fresh Water Exchange', desc: 'Improve water clarity for buyer', priority: 'MEDIUM', appType: 'WATER', category: 'WATER' },
    ],
  },
];

const BRAND_LIST = [
  { cat: 'Water Probiotics', icon: Droplets, color: '#3B82F6', brands: ['Bioclean Aqua Plus', 'Sanolife PRO-W'] },
  { cat: 'Gut Probiotics', icon: Pill, color: '#10B981', brands: ['CP Gut Probiotic', 'Avanti Gut Health'] },
  { cat: 'Minerals', icon: Zap, color: '#8B5CF6', brands: ['Avanti Mineral Mix', 'Growel Aqua Minerals'] },
  { cat: 'Immunity Boosters', icon: ShieldCheck, color: '#F59E0B', brands: ['Vitamin C', 'Herbal Tonics'] },
];

const CATEGORY_CONFIG = {
  MEDICINE: { label: 'Medicine', icon: Pill, color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
  FEED: { label: 'Feed', icon: Utensils, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  WATER: { label: 'Water', icon: Droplets, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  MOLTING: { label: 'Molting', icon: Zap, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
};

export const SOPLibrary = () => {
  const navigate = useNavigate();
  const { theme, ponds, waterRecords, feedLogs, medicineLogs, serverError } = useData();
  const activePonds = ponds.filter(p => p.status === 'active' || p.status === 'planned');
  const [selectedPondId, setSelectedPondId] = React.useState(activePonds[0]?.id || ponds[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = React.useState<'ALL' | 'MEDICINE' | 'FEED' | 'WATER' | 'MOLTING'>('ALL');
  const [viewMode, setViewMode] = React.useState<'ALERTS' | 'STAGES' | 'DAILY'>('ALERTS');
  const [dismissedAlertIds, setDismissedAlertIds] = React.useState<string[]>([]);
  const [expandedPhase, setExpandedPhase] = React.useState<string | null>(null);
  const isDark = theme === 'dark' || theme === 'midnight';

  const selectedPond = ponds.find(p => p.id === selectedPondId);
  const currentDoc = selectedPond ? calculateDOC(selectedPond.stockingDate) : 0;
  const lunar = getLunarStatus(new Date());

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
  const lunarCount = allSituationAlerts.filter(a => a.type === 'lunar').length;

  const ALL_CATEGORIES = ['MEDICINE', 'FEED', 'WATER', 'MOLTING'] as const;

  const getDOCDate = (doc: number) => {
    if (!selectedPond) return new Date();
    const date = new Date(selectedPond.stockingDate);
    date.setDate(date.getDate() + doc);
    return date;
  };

  const getWeekdayName = (date: Date) => ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()];

  const getCategoryRules = (cat: string) => {
    switch (cat) {
      case 'MEDICINE': return [
        'Use probiotics specifically for gut health foundation.',
        'Immunity boosters like Vitamin C help during DOC 15–45.',
        'Check for Vibriosis and tail redness every week.',
        'Withdraw heavy medicines 10 days before harvest.',
      ];
      case 'FEED': return [
        'Match feed size to DOC and check-tray observations.',
        'Reduce feed by 25% during molting or heavy rain.',
        'Add gut probiotics to every meal for better FCR.',
        'Monitor feed trays every 2 hours after application.',
      ];
      case 'WATER': return [
        'Apply water probiotics every 3–5 days for waste removal.',
        'Sterilize water with 30ppm Chlorine during pond prep.',
        'Do NOT mix water probiotics with disinfectants same day.',
        'Monitor DO levels specifically between 2 AM and 5 AM.',
      ];
      case 'MOLTING': return [
        'Apply Mineral Mix (15–20kg/acre) during full/new moon.',
        'Provide shell hardening minerals like Ca and Mg.',
        'Run 100% aerators during the peak molting cycle.',
        'Reduce feed during heavy molting to prevent water crash.',
      ];
      default: return [];
    }
  };

  if (activePonds.length === 0) return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Header title="SOP Hub" showBack onBack={() => navigate('/dashboard')} />
      <div className="pt-28 flex-1 flex items-center justify-center">
        {serverError ? (
          <ServerErrorState isDark={isDark} />
        ) : (
          <NoPondState isDark={isDark} subtitle="Add a pond to access live SOP alerts, stage roadmap, and 100-day schedule." />
        )}
      </div>
    </div>
  );

  const alertColors: Record<string, { badge: string; dot: string; textColor: string; cardBg: string; cardBorder: string }> = {
    critical: {
      badge: 'bg-red-500/10 text-red-500 border-red-500/20',
      dot: 'bg-red-500',
      textColor: 'text-red-500',
      cardBg: isDark ? 'bg-red-500/5' : 'bg-red-50',
      cardBorder: isDark ? 'border-red-500/20' : 'border-red-100',
    },
    warning: {
      badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      dot: 'bg-amber-500',
      textColor: 'text-amber-500',
      cardBg: isDark ? 'bg-amber-500/5' : 'bg-amber-50',
      cardBorder: isDark ? 'border-amber-500/20' : 'border-amber-100',
    },
    lunar: {
      badge: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      dot: 'bg-indigo-500',
      textColor: 'text-indigo-500',
      cardBg: isDark ? 'bg-indigo-500/5' : 'bg-indigo-50',
      cardBorder: isDark ? 'border-indigo-500/20' : 'border-indigo-100',
    },
    info: {
      badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      dot: 'bg-blue-500',
      textColor: 'text-blue-500',
      cardBg: isDark ? 'bg-blue-500/5' : 'bg-blue-50',
      cardBorder: isDark ? 'border-blue-500/20' : 'border-blue-100',
    },
    success: {
      badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      dot: 'bg-emerald-500',
      textColor: 'text-emerald-500',
      cardBg: isDark ? 'bg-emerald-500/5' : 'bg-emerald-50',
      cardBorder: isDark ? 'border-emerald-500/20' : 'border-emerald-100',
    },
  };

  return (
    <div className="pb-32 bg-transparent min-h-screen relative">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[80px]" />
      </div>

      <Header
        title="SOP Hub"
        showBack
        onBack={() => navigate('/dashboard')}
        rightElement={
          <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
            <BookOpen size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wide">Expert</span>
          </div>
        }
      />

      <div className="px-4 pt-[calc(env(safe-area-inset-top)+5.5rem)] space-y-5">

        {/* ── Pond Selector ── */}
        {activePonds.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {activePonds.map(p => {
              const doc = calculateDOC(p.stockingDate);
              const isSelected = selectedPondId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPondId(p.id)}
                  className={cn(
                    'flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all',
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : isDark
                        ? 'bg-white/5 text-ink/50 border-white/10 hover:border-white/20'
                        : 'bg-white text-ink/50 border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div className={cn('w-2 h-2 rounded-full', p.status === 'active' ? 'bg-emerald-400' : 'bg-slate-400')} />
                  <span className="text-[11px] font-bold whitespace-nowrap">{p.name}</span>
                  {p.status === 'active' && (
                    <span className={cn('text-[9px] font-black', isSelected ? 'text-white/70' : 'text-primary')}>
                      D{doc}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── View Mode Tabs ── */}
        <div className={cn(
          'flex rounded-2xl p-1 border gap-1',
          isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
        )}>
          {([
            { key: 'ALERTS', label: 'Live Alerts', icon: Bell, badge: criticalCount + warningCount + lunarCount },
            { key: 'STAGES', label: 'SOP Stages', icon: Layers, badge: 0 },
            { key: 'DAILY', label: '100-Day Plan', icon: CalendarDays, badge: 0 },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all relative',
                viewMode === tab.key
                  ? 'bg-primary text-white shadow-md'
                  : isDark ? 'text-ink/40 hover:text-ink/70' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <tab.icon size={12} />
              <span className="hidden xs:inline">{tab.label}</span>
              <span className="xs:hidden">{tab.key === 'ALERTS' ? 'Alerts' : tab.key === 'STAGES' ? 'Stages' : 'Plan'}</span>
              {tab.badge > 0 && (
                <span className={cn(
                  'absolute -top-1 -right-1 w-4 h-4 rounded-full text-[7px] font-black flex items-center justify-center',
                  criticalCount > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Category Filter ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide border transition-all',
              selectedCategory === 'ALL'
                ? 'bg-ink text-white border-ink'
                : isDark ? 'bg-white/5 text-ink/40 border-white/10' : 'bg-white text-slate-400 border-slate-200'
            )}
          >
            All
          </button>
          {ALL_CATEGORIES.map(cat => {
            const cfg = CATEGORY_CONFIG[cat];
            const Icon = cfg.icon;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide border transition-all',
                  isActive
                    ? 'text-white border-transparent'
                    : isDark ? 'bg-white/5 text-ink/40 border-white/10' : 'bg-white text-slate-400 border-slate-200'
                )}
                style={isActive ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
              >
                <Icon size={11} />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════
            VIEW: ALERTS
        ══════════════════════════════════════ */}
        {viewMode === 'ALERTS' && (
          <div className="space-y-4">

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Critical', count: criticalCount, emoji: '🚨', color: '#EF4444', bg: isDark ? 'rgba(239,68,68,0.08)' : '#FEF2F2', border: isDark ? 'rgba(239,68,68,0.2)' : '#FECACA' },
                { label: 'Warnings', count: warningCount, emoji: '⚠️', color: '#F59E0B', bg: isDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB', border: isDark ? 'rgba(245,158,11,0.2)' : '#FDE68A' },
                { label: 'Lunar', count: lunarCount, emoji: '🌙', color: '#6366F1', bg: isDark ? 'rgba(99,102,241,0.08)' : '#EEF2FF', border: isDark ? 'rgba(99,102,241,0.2)' : '#C7D2FE' },
              ].map(item => (
                <div
                  key={item.label}
                  className="rounded-2xl p-4 border flex flex-col items-center gap-1"
                  style={{ backgroundColor: item.bg, borderColor: item.border }}
                >
                  <span className="text-base">{item.emoji}</span>
                  <span className="text-xl font-black" style={{ color: item.color }}>{item.count}</span>
                  <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: item.color }}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Pond Context Bar */}
            {selectedPond && (
              <div className={cn(
                'flex items-center justify-between px-4 py-3 rounded-2xl border',
                isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
              )}>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <p className="text-[11px] font-black text-ink truncate">{selectedPond.name}</p>
                    <p className="text-[9px] text-ink/40 font-medium">Day of Culture: {currentDoc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lunar.phase !== 'NORMAL' && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                      <Moon size={10} className="text-indigo-500" />
                      <span className="text-[8px] font-black text-indigo-500">{lunar.phase}</span>
                    </div>
                  )}
                  <div className={cn(
                    'px-2 py-1 rounded-lg text-[8px] font-black',
                    currentDoc <= 10 ? 'bg-emerald-500/10 text-emerald-500' :
                    currentDoc <= 30 ? 'bg-amber-500/10 text-amber-500' :
                    'bg-red-500/10 text-red-500'
                  )}>
                    {currentDoc <= 10 ? 'Nursery' : currentDoc <= 30 ? 'Growth' : 'Critical'}
                  </div>
                </div>
              </div>
            )}

            {/* Alert Cards */}
            {allSituationAlerts.length === 0 ? (
              <div className={cn(
                'rounded-2xl p-8 border text-center space-y-2',
                isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
              )}>
                <div className="text-4xl">✅</div>
                <p className={cn('text-sm font-black', isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                  All Ponds Look Healthy
                </p>
                <p className={cn('text-[10px]', isDark ? 'text-white/40' : 'text-emerald-600/60')}>
                  No critical situations detected right now.
                </p>
              </div>
            ) : (
              <AnimatePresence>
                <div className="space-y-3">
                  {allSituationAlerts.map((alert, i) => {
                    const c = alertColors[alert.type] || alertColors.info;
                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}
                        className={cn('rounded-2xl border overflow-hidden', c.cardBg, c.cardBorder)}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <span className="text-xl flex-shrink-0 mt-0.5">{alert.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={cn('text-[12px] font-black leading-snug', c.textColor)}>
                                    {alert.title}
                                  </p>
                                  {alert.type === 'critical' && (
                                    <span className="text-[7px] px-2 py-0.5 rounded-full bg-red-500 text-white font-black uppercase tracking-wide">
                                      Urgent
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => setDismissedAlertIds(p => [...p, alert.id])}
                                  className={cn('flex-shrink-0 p-1 rounded-lg transition-colors', isDark ? 'text-white/20 hover:text-white/40 hover:bg-white/10' : 'text-slate-300 hover:text-slate-500 hover:bg-black/5')}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <p className={cn('text-[10px] leading-relaxed', isDark ? 'text-white/50' : 'text-slate-600')}>
                                {alert.body}
                              </p>
                              {alert.action && alert.actionPath && (
                                <button
                                  onClick={() => navigate(alert.actionPath!)}
                                  className={cn('mt-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-wide', c.textColor)}
                                >
                                  {alert.action} <ChevronRight size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            VIEW: STAGES
        ══════════════════════════════════════ */}
        {viewMode === 'STAGES' && (
          <div className="space-y-6">
            {(selectedCategory === 'ALL' ? ALL_CATEGORIES : [selectedCategory]).map(cat => {
              const cfg = CATEGORY_CONFIG[cat];
              const Icon = cfg.icon;
              const rules = getCategoryRules(cat);

              return (
                <section key={cat} className="space-y-4">
                  {/* Category Header */}
                  <div
                    className="flex items-center gap-4 p-5 rounded-2xl"
                    style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: cfg.color }}
                    >
                      <Icon size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: cfg.color }}>
                        {cat} Protocol
                      </p>
                      <h3 className="text-[14px] font-black text-ink leading-tight">
                        {cat === 'MEDICINE' ? 'Health & Disease Management' :
                         cat === 'FEED' ? 'Feeding & Growth Optimization' :
                         cat === 'WATER' ? 'Water Quality & Stability' :
                         'Molting & Shell Development'}
                      </h3>
                    </div>
                  </div>

                  {/* Rules */}
                  <div className="grid grid-cols-1 gap-2">
                    {rules.map((rule, ri) => (
                      <div
                        key={ri}
                        className={cn(
                          'flex items-start gap-3 p-4 rounded-xl border',
                          isDark ? 'bg-white/3 border-white/8' : 'bg-white border-slate-100'
                        )}
                      >
                        <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
                        <p className="text-[11px] font-semibold text-ink leading-relaxed">{rule}</p>
                      </div>
                    ))}
                  </div>

                  {/* Stage Cards */}
                  <div>
                    <h4 className={cn('text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2', isDark ? 'text-white/30' : 'text-slate-400')}>
                      <Clock size={11} /> Stage Roadmap
                    </h4>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none">
                      {SOP_DOC_RANGES.map((phase, pi) => {
                        const catTasks = phase.tasks.filter(t => t.category === cat);
                        if (catTasks.length === 0) return null;
                        return (
                          <div
                            key={pi}
                            className={cn(
                              'w-[230px] flex-shrink-0 rounded-2xl border overflow-hidden',
                              isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
                            )}
                          >
                            {/* Phase Header */}
                            <div
                              className="px-4 py-3 flex items-center justify-between"
                              style={{ borderBottom: `1px solid ${cfg.border}`, backgroundColor: cfg.bg }}
                            >
                              <div>
                                <p className="text-[8px] font-black uppercase tracking-wider" style={{ color: cfg.color }}>
                                  DOC {phase.doc}
                                </p>
                                <p className="text-[11px] font-black text-ink leading-tight mt-0.5">
                                  {phase.title}
                                </p>
                              </div>
                              <span className="text-lg">{phase.emoji}</span>
                            </div>
                            {/* Tasks */}
                            <div className="p-3 space-y-2">
                              {catTasks.map((task, ti) => (
                                <div
                                  key={ti}
                                  className={cn(
                                    'p-3 rounded-xl border space-y-1',
                                    isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-100'
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-black uppercase tracking-wide" style={{ color: cfg.color }}>
                                      {task.type}
                                    </span>
                                    <span className={cn(
                                      'text-[7px] font-black uppercase px-2 py-0.5 rounded-full',
                                      task.priority === 'HIGH'
                                        ? 'bg-red-500/10 text-red-500'
                                        : task.priority === 'MEDIUM'
                                          ? 'bg-amber-500/10 text-amber-500'
                                          : 'bg-slate-500/10 text-slate-500'
                                    )}>
                                      {task.priority}
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-bold text-ink leading-tight">{task.med}</p>
                                  <p className="text-[9px] text-ink/40 leading-relaxed">{task.desc}</p>
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
            })}
          </div>
        )}

        {/* ══════════════════════════════════════
            VIEW: DAILY (100-Day Plan)
        ══════════════════════════════════════ */}
        {viewMode === 'DAILY' && (
          <div className="space-y-4">
            {/* Context bar */}
            {selectedPond && (
              <div className={cn(
                'flex items-center justify-between px-4 py-3 rounded-2xl border',
                isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
              )}>
                <div>
                  <p className="text-[11px] font-black text-ink">{selectedPond.name}</p>
                  <p className="text-[9px] text-ink/40">Synced to DOC {currentDoc}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[9px] font-black text-emerald-500">Live Sync</span>
                </div>
              </div>
            )}

            {/* Day rows */}
            <div className="space-y-3">
              {Array.from({ length: 111 }).map((_, i) => {
                const doc = i - 10;
                const docDate = getDOCDate(doc);
                const dayLunar = getLunarStatus(docDate);
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
                  return true;
                });

                const lunarTasks: any[] = [];
                if (dayLunar.phase === 'AMAVASYA' && (selectedCategory === 'ALL' || selectedCategory === 'MOLTING')) {
                  lunarTasks.push({ category: 'MOLTING', type: 'LUNAR', med: 'Amavasya High Molt Risk', desc: '100% Aeration, Reduce Feed 25%', priority: 'HIGH' });
                }

                const allDayTasks = [...baseTasks, ...lunarTasks];
                if (allDayTasks.length === 0) return null;

                return (
                  <motion.div
                    key={doc}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.005, 0.3) }}
                    className={cn(
                      'rounded-2xl border overflow-hidden transition-all',
                      isToday
                        ? 'border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/10'
                        : isDark ? 'bg-white/3 border-white/8' : 'bg-white border-slate-200'
                    )}
                  >
                    {/* Day Header */}
                    <div
                      className={cn(
                        'px-4 py-3 flex items-center justify-between border-b',
                        isToday ? 'bg-primary/5 border-primary/15' : isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-100'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-12 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-black',
                          isToday ? 'bg-primary text-white' : isDark ? 'bg-white/10 text-ink' : 'bg-slate-200 text-slate-700'
                        )}>
                          <span className="text-[6px] opacity-60 uppercase tracking-tighter">{doc <= 0 ? 'PREP' : 'DOC'}</span>
                          <span className="text-sm leading-none">{Math.abs(doc)}</span>
                        </div>
                        <div>
                          <p className={cn('text-[9px] font-bold uppercase tracking-wide', isDark ? 'text-white/30' : 'text-slate-400')}>
                            {getWeekdayName(docDate)} · {docDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                          <p className="text-[12px] font-black text-ink">{phase.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isToday && (
                          <span className="text-[8px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg uppercase tracking-wide">
                            Today
                          </span>
                        )}
                        {dayLunar.phase !== 'NORMAL' && (
                          <span className="text-[8px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-lg">
                            {dayLunar.phase}
                          </span>
                        )}
                        <span className="text-base">{phase.emoji}</span>
                      </div>
                    </div>

                    {/* Tasks Grid */}
                    <div className="p-3 grid grid-cols-1 gap-2">
                      {allDayTasks.map((task, ti) => {
                        const cfg = CATEGORY_CONFIG[task.category as keyof typeof CATEGORY_CONFIG];
                        const TIcon = cfg?.icon || ShieldCheck;
                        return (
                          <div
                            key={ti}
                            className={cn(
                              'flex items-start gap-3 p-3 rounded-xl border',
                              isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-100'
                            )}
                          >
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: cfg?.bg || 'rgba(100,116,139,0.1)' }}
                            >
                              <TIcon size={14} style={{ color: cfg?.color || '#64748B' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[8px] font-black uppercase tracking-wide" style={{ color: cfg?.color }}>
                                  {task.type}
                                </span>
                                <span className={cn(
                                  'text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full',
                                  task.priority === 'HIGH' ? 'bg-red-500/10 text-red-500' :
                                  task.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' :
                                  'bg-slate-500/10 text-slate-500'
                                )}>
                                  {task.priority}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-ink leading-snug">{task.med}</p>
                              {task.desc && (
                                <p className="text-[9px] text-ink/40 mt-0.5 leading-relaxed">{task.desc}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Expert Inventory Section ── */}
        <section className={cn(
          'rounded-2xl border p-5 space-y-4',
          isDark ? 'bg-white/3 border-white/8' : 'bg-white border-slate-200'
        )}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <FlaskConical size={16} className="text-indigo-500" />
            </div>
            <div>
              <h3 className="text-[13px] font-black text-ink">Expert Inventory</h3>
              <p className={cn('text-[9px] font-bold uppercase tracking-wider', isDark ? 'text-white/30' : 'text-slate-400')}>
                Recommended Professional Systems
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {BRAND_LIST.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className={cn(
                    'p-4 rounded-2xl border space-y-2',
                    isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-100'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      <Icon size={13} style={{ color: item.color }} />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-wide" style={{ color: item.color }}>
                      {item.cat}
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {item.brands.map((b, bi) => (
                      <li key={bi} className="flex items-center gap-2 text-[10px] font-semibold text-ink">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
};
