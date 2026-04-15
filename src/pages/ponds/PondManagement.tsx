import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Calendar, Waves, ChevronRight, Layers as LayersIcon,
  Calculator, Fish, Bell, ShoppingBag, TrendingUp, ShieldCheck,
  Activity, Award, Droplets, Zap, Star, MapPin, Sparkles,
  AlertTriangle, Crown, BarChart2, Target, Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import { ConfirmModal } from '../../components/ConfirmModal';
import { AlertModal } from '../../components/AlertModal';
import { NoPondState } from '../../components/NoPondState';
import { ServerErrorState } from '../../components/ServerErrorState';
import { NoSubscriptionState } from '../../components/NoSubscriptionState';
import { calculateDOC, getGrowthPercentage, calculateWeight } from '../../utils/pondUtils';
import type { Translations } from '../../translations';

const safeNum = (v: any, fallback = 0) => {
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
};

const computeTrustScore = (
  pondId: string, doc: number,
  waterRecords: any[], feedLogs: any[], medicineLogs: any[]
): { score: number; labelKey: string; color: string; bg: string; ring: string } => {
  if (doc <= 0) return { score: 0, labelKey: 'statusNotStarted', color: 'text-slate-400', bg: 'bg-slate-100', ring: 'ring-slate-300' };
  const pondWater = waterRecords.filter(r => r.pondId === pondId);
  const pondFeed  = feedLogs.filter(f => f.pondId === pondId);
  const pondMeds  = medicineLogs.filter(m => m.pondId === pondId);
  const waterScore = Math.min(1, pondWater.length / Math.max(1, Math.ceil(doc / 2)));
  const feedScore  = Math.min(1, pondFeed.length  / Math.max(1, doc));
  const medScore   = Math.min(1, pondMeds.length  / Math.max(1, Math.floor(doc / 10)));
  const total = Math.round((waterScore * 0.4 + feedScore * 0.4 + medScore * 0.2) * 100);
  if (total >= 85) return { score: total, labelKey: 'trustExcellent', color: 'text-emerald-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-400' };
  if (total >= 65) return { score: total, labelKey: 'trustGood',      color: 'text-blue-500',    bg: 'bg-blue-500/10',    ring: 'ring-blue-400' };
  if (total >= 40) return { score: total, labelKey: 'trustFair',      color: 'text-amber-500',   bg: 'bg-amber-500/10',   ring: 'ring-amber-400' };
  return              { score: total, labelKey: 'trustNeedsWork',  color: 'text-red-400',     bg: 'bg-red-500/10',     ring: 'ring-red-400' };
};

const STATUS_CONFIG: Record<string, {
  labelKey: string; gradFrom: string; gradTo: string;
  dot: string; glow: string; textColor: string; badgeBg: string;
}> = {
  active:          { labelKey: 'statusActive',    gradFrom: '#10B981', gradTo: '#059669', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/30', textColor: 'text-emerald-300', badgeBg: 'bg-emerald-500/20 border-emerald-500/30' },
  planned:         { labelKey: 'statusPlanned',   gradFrom: '#3B82F6', gradTo: '#6366F1', dot: 'bg-blue-400',    glow: 'shadow-blue-500/30',    textColor: 'text-blue-300',    badgeBg: 'bg-blue-500/20 border-blue-500/30' },
  harvest_pending: { labelKey: 'statusSelling',   gradFrom: '#8B5CF6', gradTo: '#7C3AED', dot: 'bg-violet-400',  glow: 'shadow-violet-500/30',  textColor: 'text-violet-300',  badgeBg: 'bg-violet-500/20 border-violet-500/30' },
  harvested:       { labelKey: 'statusHarvested', gradFrom: '#C78200', gradTo: '#D97706', dot: 'bg-amber-400',   glow: 'shadow-amber-500/30',   textColor: 'text-amber-300',   badgeBg: 'bg-amber-500/20 border-amber-500/30' },
  archive:         { labelKey: 'statusArchived',  gradFrom: '#64748B', gradTo: '#475569', dot: 'bg-slate-400',   glow: 'shadow-slate-500/20',   textColor: 'text-slate-400',   badgeBg: 'bg-slate-500/15 border-slate-500/20' },
};

// Gradient colors per pond index for visual variety
const POND_GRADIENTS = [
  'from-emerald-600 via-teal-700 to-cyan-800',
  'from-blue-600 via-indigo-700 to-violet-800',
  'from-amber-600 via-orange-600 to-red-700',
  'from-purple-600 via-fuchsia-700 to-pink-700',
  'from-teal-600 via-emerald-700 to-green-800',
  'from-sky-600 via-blue-700 to-indigo-800',
];

export const PondManagement = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, deletePond, user, isPro, theme, waterRecords, feedLogs, medicineLogs, reminders, unreadCount, harvestRequests, serverError } = useData();
  const [activeTab, setActiveTab] = useState<'active' | 'harvested' | 'archive'>('active');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const isDark = theme === 'dark' || theme === 'midnight';

  const activePonds = useMemo(() => ponds.filter(p => p.status === 'active' || p.status === 'planned' || p.status === 'harvest_pending'), [ponds]);
  const totalArea   = useMemo(() => activePonds.reduce((a, p) => a + safeNum(p.size), 0), [activePonds]);
  const totalBiomassKg = useMemo(() => activePonds.reduce((acc, p) => {
    const doc = calculateDOC(p.stockingDate);
    const weight = calculateWeight(doc);
    const live = safeNum(p.seedCount, 100000) * 0.80;
    return acc + (live * weight) / 1000;
  }, 0), [activePonds]);
  const pendingAlerts = useMemo(() => (reminders || []).filter((r: any) => r.status === 'pending').length + (unreadCount || 0), [reminders, unreadCount]);
  const avgTrustScore = useMemo(() => {
    if (activePonds.length === 0) return 0;
    const scores = activePonds.map(p => {
      const doc = calculateDOC(p.stockingDate);
      return computeTrustScore(p.id, doc, waterRecords || [], feedLogs || [], medicineLogs || []).score;
    });
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [activePonds, waterRecords, feedLogs, medicineLogs]);

  const getPondLimit = () => {
    if (!isPro) return 1;
    const s = user?.subscriptionStatus;
    if (s === 'pro_silver') return 1;
    if (s === 'pro_gold')   return 3;
    if (s === 'pro_diamond') return 6;
    if (s === 'pro') return 1;
    return 1;
  };
  const limit = getPondLimit();
  const activePondsCount = ponds.filter(p => p.status === 'active').length;
  const isLimitReached = activePondsCount >= limit;

  const handleAddPond = () => {
    if (isLimitReached) { navigate('/subscription'); return; }
    navigate('/ponds/new');
  };

  const filteredPonds = ponds.filter(p => {
    if (activeTab === 'active') return p.status === 'active' || p.status === 'planned' || p.status === 'harvest_pending';
    return p.status === activeTab;
  });
  const harvestedCount = ponds.filter(p => p.status === 'harvested').length;
  const archiveCount   = ponds.filter(p => p.status === 'archive').length;
  const TABS = [
    { key: 'active',    label: t.activePonds || 'Active',    count: ponds.filter(p => p.status === 'active' || p.status === 'planned' || p.status === 'harvest_pending').length },
    ...(harvestedCount > 0 ? [{ key: 'harvested', label: t.harvest || 'Harvested', count: harvestedCount }] : []),
    ...(archiveCount > 0   ? [{ key: 'archive',   label: t.archive || 'Archive',   count: archiveCount   }] : []),
  ];

  return (
    <div className={cn('pb-36 min-h-screen relative overflow-hidden', isDark ? 'bg-[#070D12]' : 'bg-[#F4F7FA]')}>

      {/* ── Rich ambient BG ── */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className={cn('absolute top-[-10%] right-[-15%] w-[55%] h-[40%] rounded-full blur-[120px]', isDark ? 'bg-emerald-600/10' : 'bg-emerald-400/12')} />
        <div className={cn('absolute bottom-[20%] left-[-10%] w-[45%] h-[30%] rounded-full blur-[100px]', isDark ? 'bg-blue-600/8' : 'bg-blue-400/8')} />
        <div className={cn('absolute top-[40%] right-[-5%] w-[30%] h-[20%] rounded-full blur-[80px]', isDark ? 'bg-amber-600/5' : 'bg-amber-400/6')} />
      </div>

      <Header title={t.ponds} onMenuClick={onMenuClick} />

      <div className="pt-24 px-4 space-y-4">

        {/* ── HERO BANNER ── */}
        {ponds.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="rounded-[2.4rem] overflow-hidden relative shadow-2xl">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#064E3B] via-[#065F46] to-[#047857]" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04]" />
              {/* Decorative circles */}
              <div className="absolute -right-12 -top-12 w-52 h-52 rounded-full bg-white/5 blur-[60px]" />
              <div className="absolute -left-8  bottom-0  w-40 h-40 rounded-full bg-emerald-300/10 blur-[50px]" />
              <div className="absolute right-8  bottom-4  w-20 h-20 rounded-full bg-teal-400/10 blur-[30px]" />

              <div className="relative z-10 px-5 pt-5 pb-4">
                {/* Top row */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <p className="text-emerald-300/60 text-[7px] font-black uppercase tracking-[0.35em]">{t.farmOverview}</p>
                    </div>
                    <h2 className="text-white text-[22px] font-black tracking-tighter leading-none">
                      {user?.farmName || t.myFarm}
                    </h2>
                    {user?.location && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin size={9} className="text-emerald-300/50" />
                        <p className="text-white/30 text-[8px] font-bold">{user.location}</p>
                      </div>
                    )}
                  </div>

                  {/* Trust Score ring */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-14 h-14">
                      <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                        <circle cx="28" cy="28" r="22" stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="none" />
                        <circle cx="28" cy="28" r="22" fill="none"
                          stroke={avgTrustScore >= 80 ? '#34D399' : avgTrustScore >= 60 ? '#60A5FA' : avgTrustScore >= 40 ? '#FBBF24' : '#F87171'}
                          strokeWidth="4" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 22}`}
                          strokeDashoffset={`${2 * Math.PI * 22 * (1 - avgTrustScore / 100)}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-white font-black text-sm leading-none">{avgTrustScore}</p>
                      </div>
                    </div>
                    <p className="text-white/30 text-[6px] font-black uppercase tracking-widest mt-1">{t.trustScore}</p>
                  </div>
                </div>

                {/* Metric strip */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: t.ponds,   value: activePonds.length,              icon: LayersIcon, color: 'text-emerald-300', iconBg: 'bg-emerald-500/20' },
                    { label: t.acres,   value: `${totalArea.toFixed(1)} ac`,    icon: Calculator, color: 'text-teal-300',    iconBg: 'bg-teal-500/20' },
                    { label: t.biomass, value: `${(totalBiomassKg).toFixed(0)}kg`, icon: Fish,  color: 'text-amber-300',   iconBg: 'bg-amber-500/20' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/6 rounded-[1.2rem] px-3 py-2.5 text-center border border-white/8">
                      <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center mx-auto mb-1', s.iconBg)}>
                        <s.icon size={13} className={s.color} />
                      </div>
                      <p className="text-white font-black text-[13px] leading-none">{s.value}</p>
                      <p className="text-white/30 text-[6px] font-black uppercase tracking-widest mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Quick action pills */}
                <div className="flex gap-2">
                  <button onClick={() => navigate('/dashboard')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white/8 border border-white/10 rounded-2xl py-2 text-white/70 text-[8px] font-black uppercase tracking-widest active:scale-95 transition-transform">
                    <Bell size={12} className={pendingAlerts > 0 ? 'text-red-400' : 'text-white/40'} />
                    {pendingAlerts > 0 ? `${pendingAlerts} Alerts` : 'No Alerts'}
                  </button>
                  <button onClick={() => navigate('/water')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white/8 border border-white/10 rounded-2xl py-2 text-white/70 text-[8px] font-black uppercase tracking-widest active:scale-95 transition-transform">
                    <Droplets size={12} className="text-blue-300" />
                    {t.waterLog || 'Water Log'}
                  </button>
                  <button onClick={() => navigate('/roi')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white/8 border border-white/10 rounded-2xl py-2 text-white/70 text-[8px] font-black uppercase tracking-widest active:scale-95 transition-transform">
                    <TrendingUp size={12} className="text-emerald-300" />
                    ROI
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── FREE PLAN BANNER ── */}
        {!isPro && ponds.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div
              className="rounded-[1.8rem] p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
              style={{ background: 'linear-gradient(135deg, #78350f22, #92400e22)', border: '1px solid #C7820030' }}
              onClick={() => navigate('/subscription')}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-amber-500/15">
                <Crown size={18} className="text-[#C78200]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-[10px] font-black tracking-tight', isDark ? 'text-[#C78200]' : 'text-amber-700')}>
                  Free Plan — 1 Pond Max
                </p>
                <p className={cn('text-[8px] font-medium leading-snug mt-0.5', isDark ? 'text-white/30' : 'text-slate-500')}>
                  Upgrade to Silver (₹500/mo) for AI diagnostics & more
                </p>
              </div>
              <ChevronRight size={16} className="text-[#C78200] flex-shrink-0" />
            </div>
          </motion.div>
        )}

        {/* ── TAB PILLS ── */}
        {ponds.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[8px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all border flex-shrink-0',
                  activeTab === tab.key
                    ? 'bg-[#C78200] text-white border-[#C78200] shadow-lg shadow-[#C78200]/25'
                    : isDark ? 'bg-white/5 text-white/40 border-white/8' : 'bg-white text-slate-400 border-slate-100 shadow-sm'
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn('text-[7px] font-black w-4 h-4 rounded-full flex items-center justify-center',
                    activeTab === tab.key ? 'bg-white/25 text-white' : isDark ? 'bg-white/10 text-white/50' : 'bg-slate-100 text-slate-500'
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── POND CARDS ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-3"
          >
            {filteredPonds.length > 0 ? (
              filteredPonds.map((pond, idx) => {
                const doc    = calculateDOC(pond.stockingDate);
                const weight = calculateWeight(doc);
                const growth = getGrowthPercentage(doc);
                const trust  = computeTrustScore(pond.id, doc, waterRecords || [], feedLogs || [], medicineLogs || []);
                const latestWater = (waterRecords || [])
                  .filter(r => r.pondId === pond.id)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                const isWarning     = latestWater && (latestWater.ph < 7.5 || latestWater.ph > 8.5 || latestWater.do < 4);
                const isHarvReady   = doc >= 90 && pond.status === 'active';
                const isCritical    = doc >= 31 && doc <= 45 && pond.status === 'active';
                const statusCfg     = STATUS_CONFIG[pond.status] || STATUS_CONFIG['active'];
                const hasTracking   = (harvestRequests || []).some((r: any) => r.pondId === pond.id && r.status !== 'completed');
                const gradClass     = POND_GRADIENTS[idx % POND_GRADIENTS.length];
                // Biomass estimate
                const biomassKg     = Math.round((safeNum(pond.seedCount, 100000) * 0.8 * weight) / 1000);

                return (
                  <motion.div
                    key={pond.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    onClick={() => navigate(`/ponds/${pond.id}`)}
                    className={cn(
                      'rounded-[2.2rem] border cursor-pointer overflow-hidden group transition-all duration-200 active:scale-[0.983]',
                      isDark
                        ? 'bg-[#0C1A14] border-white/6 hover:border-emerald-500/25 shadow-xl shadow-black/20'
                        : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg shadow-md shadow-slate-200/70'
                    )}
                  >
                    {/* ── Colored accent bar (top) ── */}
                    <div className={cn('h-[3px] w-full bg-gradient-to-r', gradClass)} />

                    {/* ── Thumbnail header ── */}
                    <div className={cn('relative h-[88px] overflow-hidden bg-gradient-to-br', gradClass)}>
                      <div className="absolute inset-0 bg-black/20" />
                      {/* Decorative water ripple */}
                      <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-white/5 blur-[30px]" />
                      <div className="absolute bottom-2 left-0 right-0 px-4 flex items-end justify-between z-10">
                        <div>
                          <h3 className="text-white font-black text-lg tracking-tight leading-none drop-shadow-md">
                            {pond.name}
                            {isHarvReady && <Star size={13} className="inline ml-1.5 text-amber-300 mb-0.5" fill="currentColor" />}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={cn('inline-flex items-center gap-1 text-[6.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', statusCfg.badgeBg, statusCfg.textColor)}>
                              <span className={cn('w-1 h-1 rounded-full', statusCfg.dot)} />
                              {t[statusCfg.labelKey as keyof typeof t] as string}
                              {pond.status === 'active' && ` · D${doc}`}
                              {pond.status === 'planned' && ` · ${Math.abs(doc)}d`}
                            </span>
                            {hasTracking && (
                              <span className="text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-white/20 text-white animate-pulse">
                                {t.liveTracking || 'LIVE'}
                              </span>
                            )}
                            {isCritical && (
                              <span className="text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-red-500/30 text-red-200 border border-red-400/30 animate-pulse">
                                ⚠ CRITICAL
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Trust ring badge */}
                        <div className="flex flex-col items-center">
                          <div className={cn('w-10 h-10 rounded-full ring-2 flex items-center justify-center bg-black/30 backdrop-blur-sm', trust.ring)}>
                            <p className={cn('text-[10px] font-black', trust.color)}>{trust.score}%</p>
                          </div>
                          <p className="text-white/40 text-[5px] font-black uppercase tracking-widest mt-0.5">TRUST</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-3">
                      {/* ── Chips row ── */}
                      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                        <span className={cn('flex items-center gap-1 text-[7px] font-black uppercase px-2 py-1 rounded-xl', isDark ? 'bg-white/6 text-white/60' : 'bg-slate-50 text-slate-600')}>
                          <Fish size={9} className="text-emerald-500" /> {pond.species || 'Vannamei'}
                        </span>
                        <span className={cn('flex items-center gap-1 text-[7px] font-black uppercase px-2 py-1 rounded-xl', isDark ? 'bg-white/6 text-white/60' : 'bg-slate-50 text-slate-600')}>
                          <Waves size={9} className="text-blue-400" /> {safeNum(pond.size, 1)} Ac
                        </span>
                        <span className={cn('flex items-center gap-1 text-[7px] font-black uppercase px-2 py-1 rounded-xl', isDark ? 'bg-white/6 text-white/60' : 'bg-slate-50 text-slate-600')}>
                          <Activity size={9} className="text-purple-400" /> {(safeNum(pond.seedCount) / 1000).toFixed(0)}k PL
                        </span>
                        <span className={cn('flex items-center gap-1 text-[7px] font-black uppercase px-2 py-1 rounded-xl', isDark ? 'bg-white/6 text-white/60' : 'bg-slate-50 text-slate-600')}>
                          <Leaf size={9} className="text-teal-400" /> {biomassKg}kg
                        </span>
                      </div>

                      {/* ── Metric pillars ── */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          {
                            label: t.weightLabel || 'Weight',
                            value: `${weight.toFixed(1)}g`,
                            sub: 'Est. ABW',
                            color: isDark ? 'text-white' : 'text-slate-800',
                          },
                          {
                            label: 'DO mg/L',
                            value: latestWater ? `${latestWater.do ?? '—'}` : '—',
                            sub: latestWater?.do < 4 ? '⚠ Low' : 'Normal',
                            color: !latestWater ? (isDark ? 'text-white/40' : 'text-slate-400') : latestWater.do < 4 ? 'text-red-500' : 'text-emerald-500',
                          },
                          {
                            label: 'pH',
                            value: latestWater ? `${latestWater.ph ?? '—'}` : '—',
                            sub: latestWater?.ph > 8.5 ? '⚠ High' : latestWater?.ph < 7.5 ? '⚠ Low' : 'Normal',
                            color: !latestWater ? (isDark ? 'text-white/40' : 'text-slate-400') : (latestWater.ph > 8.5 || latestWater.ph < 7.5) ? 'text-amber-500' : 'text-emerald-500',
                          },
                        ].map((m, i) => (
                          <div key={i} className={cn('rounded-[1.2rem] p-2.5 text-center border', isDark ? 'bg-white/[0.03] border-white/6' : 'bg-slate-50/80 border-slate-100')}>
                            <p className={cn('text-[13px] font-black leading-none', m.color)}>{m.value}</p>
                            <p className={cn('text-[6px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>{m.label}</p>
                            <p className={cn('text-[5.5px] font-bold mt-0.5', isDark ? 'text-white/15' : 'text-slate-300')}>{m.sub}</p>
                          </div>
                        ))}
                      </div>

                      {/* ── Growth bar ── */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex justify-between items-center">
                          <p className={cn('text-[7px] font-black uppercase tracking-widest flex items-center gap-1', isDark ? 'text-white/30' : 'text-slate-400')}>
                            <Target size={8} /> {t.growthStage}
                          </p>
                          <p className={cn(
                            'text-[7px] font-black',
                            isHarvReady ? 'text-amber-500' : isDark ? 'text-emerald-400' : 'text-emerald-600'
                          )}>
                            {growth.toFixed(0)}%
                            {pond.status === 'active' && ` · ${100 - doc}d left`}
                            {pond.status === 'planned' && ` · Pre-stock`}
                          </p>
                        </div>
                        <div className={cn('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/6' : 'bg-slate-100')}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(2, growth)}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.05 + 0.2 }}
                            className={cn('h-full rounded-full',
                              isHarvReady ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                              isCritical   ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                              pond.status === 'planned' ? 'bg-gradient-to-r from-blue-400 to-indigo-400' :
                              'bg-gradient-to-r from-emerald-400 to-teal-400'
                            )}
                          />
                        </div>
                      </div>

                      {/* ── Footer flags ── */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isWarning && (
                          <span className={cn('text-[6.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border', isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/25' : 'bg-amber-50 text-amber-700 border-amber-200')}>
                            <Zap size={7} /> {t.waterQualityAlerts}
                          </span>
                        )}
                        {isHarvReady && (
                          <span className={cn('text-[6.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border', isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' : 'bg-emerald-50 text-emerald-700 border-emerald-200')}>
                            <ShoppingBag size={7} /> {t.harvestReady}
                          </span>
                        )}
                        {!latestWater && doc > 0 && (
                          <span className={cn('text-[6.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border', isDark ? 'bg-blue-500/15 text-blue-300 border-blue-500/25' : 'bg-blue-50 text-blue-600 border-blue-200')}>
                            <Droplets size={7} /> {t.noWaterData}
                          </span>
                        )}

                        {/* Delete + chevron */}
                        <div className="ml-auto flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (doc > 7) { setShowDeleteAlert(true); return; }
                              setConfirmDeleteId(pond.id);
                            }}
                            className={cn('p-1.5 rounded-xl transition-all', isDark ? 'text-white/10 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-200 hover:text-red-500 hover:bg-red-50')}
                          >
                            <Trash2 size={11} />
                          </button>
                          <ChevronRight size={14} className={cn('transition-all group-hover:translate-x-0.5', isDark ? 'text-white/12 group-hover:text-emerald-400' : 'text-slate-200 group-hover:text-emerald-500')} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-4">
                {serverError ? (
                  <ServerErrorState isDark={isDark} />
                ) : (
                  <NoPondState
                    isDark={isDark}
                    subtitle={activeTab === 'active' ? t.addFirstPondDesc : activeTab === 'harvested' ? t.harvestHistory : t.archive}
                  />
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── FAB ── */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.05 }}
        onClick={handleAddPond}
        className={cn(
          'fixed bottom-28 right-5 w-14 h-14 rounded-[1.6rem] flex items-center justify-center shadow-2xl z-40 transition-all',
          isLimitReached
            ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/40'
            : 'bg-gradient-to-br from-[#C78200] to-[#a06600] shadow-[#C78200]/40'
        )}
      >
        <Plus size={26} className="text-white" />
      </motion.button>

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => { if (confirmDeleteId) deletePond(confirmDeleteId); }}
        title={t.deletePondConfirm.split('?')[0]}
        message={t.deletePondConfirm}
        confirmText={t.save}
        cancelText={t.cancel}
      />
      <AlertModal
        isOpen={showDeleteAlert}
        onClose={() => setShowDeleteAlert(false)}
        title={t.protectedMode}
        message={t.deletePondConfirm}
        buttonText={t.gotIt}
      />
    </div>
  );
};
