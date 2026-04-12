import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Calendar, Waves, ChevronRight, Layers as LayersIcon,
  Calculator, Fish, Bell, ShoppingBag, TrendingUp, ShieldCheck,
  Activity, Award, Droplets, Zap, Star
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

// Compute a Trust Score for a pond based on its log compliance
const computeTrustScore = (
  pondId: string,
  doc: number,
  waterRecords: any[],
  feedLogs: any[],
  medicineLogs: any[]
): { score: number; labelKey: string; color: string; bg: string } => {
  if (doc <= 0) return { score: 0, labelKey: 'statusNotStarted', color: 'text-slate-400', bg: 'bg-slate-100' };

  const pondWater = waterRecords.filter(r => r.pondId === pondId);
  const pondFeed = feedLogs.filter(f => f.pondId === pondId);
  const pondMeds = medicineLogs.filter(m => m.pondId === pondId);

  // Water log compliance: expect at least 1 log per 2 days
  const expectedWaterLogs = Math.ceil(doc / 2);
  const waterScore = Math.min(1, pondWater.length / Math.max(1, expectedWaterLogs));

  // Feed compliance: expect at least 1 log per day
  const feedScore = Math.min(1, pondFeed.length / Math.max(1, doc));

  // Medicine compliance: at least some medicine applications
  const medScore = Math.min(1, pondMeds.length / Math.max(1, Math.floor(doc / 10)));

  const total = Math.round(((waterScore * 0.4 + feedScore * 0.4 + medScore * 0.2)) * 100);

  if (total >= 85) return { score: total, labelKey: 'trustExcellent', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (total >= 65) return { score: total, labelKey: 'trustGood', color: 'text-blue-600', bg: 'bg-blue-50' };
  if (total >= 40) return { score: total, labelKey: 'trustFair', color: 'text-amber-600', bg: 'bg-amber-50' };
  return { score: total, labelKey: 'trustNeedsWork', color: 'text-red-500', bg: 'bg-red-50' };
};

const STATUS_CONFIG: Record<string, { labelKey: string; color: string; bg: string; dot: string }> = {
  active:           { labelKey: 'statusActive',    color: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200', dot: 'bg-emerald-500' },
  planned:          { labelKey: 'statusPlanned',   color: 'text-blue-700',    bg: 'bg-blue-50 border border-blue-200',       dot: 'bg-blue-400' },
  harvest_pending:  { labelKey: 'statusSelling',   color: 'text-indigo-700',  bg: 'bg-indigo-50 border border-indigo-200',   dot: 'bg-indigo-500' },
  harvested:        { labelKey: 'statusHarvested', color: 'text-[#C78200]',   bg: 'bg-amber-50 border border-amber-200',     dot: 'bg-[#C78200]' },
  archive:          { labelKey: 'statusArchived',  color: 'text-slate-600',   bg: 'bg-slate-100 border border-slate-200',    dot: 'bg-slate-400' },
};

export const PondManagement = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, deletePond, user, isPro, theme, waterRecords, feedLogs, medicineLogs, reminders, unreadCount, harvestRequests, serverError } = useData();
  const [activeTab, setActiveTab] = useState<'active' | 'planned' | 'harvested' | 'archive'>('active');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const isDark = theme === 'dark' || theme === 'midnight';

  const activePonds = useMemo(() => ponds.filter(p => p.status === 'active' || p.status === 'planned' || p.status === 'harvest_pending'), [ponds]);

  const totalArea = useMemo(() => activePonds.reduce((a, p) => a + safeNum(p.size), 0), [activePonds]);

  const totalBiomassKg = useMemo(() => activePonds.reduce((acc, p) => {
    const doc = calculateDOC(p.stockingDate);
    const weight = calculateWeight(doc);
    const live = safeNum(p.seedCount, 100000) * 0.80;
    return acc + (live * weight) / 1000;
  }, 0), [activePonds]);

  const pendingAlerts = useMemo(() =>
    (reminders || []).filter((r: any) => r.status === 'pending').length + (unreadCount || 0),
    [reminders, unreadCount]
  );

  // Average trust score across active ponds
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
    const status = user?.subscriptionStatus;
    if (status === 'pro_silver') return 3;
    if (status === 'pro_gold') return 6;
    if (status === 'pro_diamond') return 9;
    if (status === 'pro') return 3;
    return 1;
  };

  const limit = getPondLimit();
  const activePondsCount = ponds.filter(p => p.status === 'active').length;
  const isLimitReached = activePondsCount >= limit;

  const handleAddPond = () => {
    if (isLimitReached) {
      navigate('/subscription');
      return;
    }
    navigate('/ponds/new');
  };

  const filteredPonds = ponds.filter(p => {
    if (activeTab === 'active') return p.status === 'active' || p.status === 'planned' || p.status === 'harvest_pending';
    return p.status === activeTab;
  });

  const harvestedCount = ponds.filter(p => p.status === 'harvested').length;
  const archiveCount   = ponds.filter(p => p.status === 'archive').length;

  const TABS = [
    { key: 'active',  label: t.activePonds || 'Active',  count: ponds.filter(p => p.status === 'active' || p.status === 'harvest_pending').length },
    { key: 'planned', label: t.planned || 'Planned',     count: ponds.filter(p => p.status === 'planned').length },
    // Only show Harvested tab when at least one pond has been harvested
    ...(harvestedCount > 0 ? [{ key: 'harvested', label: t.harvest || 'Harvested', count: harvestedCount }] : []),
    // Only show Archive tab when at least one pond is archived
    ...(archiveCount > 0   ? [{ key: 'archive',   label: t.archive || 'Archive',   count: archiveCount   }] : []),
  ];

  return (
    <div className="pb-36 min-h-screen relative overflow-hidden">
      {/* Ambient background */}
      <div className={cn("absolute top-0 right-0 w-[80%] h-[35%] rounded-full blur-[120px] -z-10 pointer-events-none",
        isDark ? "bg-emerald-500/10" : "bg-emerald-400/8")} />
      <div className={cn("absolute bottom-0 left-0 w-[60%] h-[25%] rounded-full blur-[100px] -z-10 pointer-events-none",
        isDark ? "bg-blue-500/8" : "bg-blue-400/5")} />

      <Header title={t.ponds} onMenuClick={onMenuClick} />

      <div className="pt-24 px-4 space-y-5">

        {/* ── FARM OVERVIEW HERO ── */}
        {ponds.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className={cn(
              "rounded-[2rem] p-5 relative overflow-hidden shadow-xl border",
              isDark ? "bg-[#0D1F17] border-white/5" : "bg-gradient-to-br from-[#0D523C] to-[#064E3B]"
            )}>
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 blur-[60px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-5 -left-5 w-32 h-32 bg-emerald-400/10 blur-[40px] rounded-full pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-emerald-300/60 text-[8px] font-black uppercase tracking-[0.3em] mb-1">{t.farmOverview}</p>
                    <h2 className="text-white text-xl font-black tracking-tighter leading-tight">
                      {user?.farmName || t.myFarm}
                    </h2>
                  </div>
                  {/* Trust Score Badge */}
                  <div className={cn(
                    "flex flex-col items-center px-3 py-2 rounded-2xl border",
                    avgTrustScore >= 80 ? "bg-emerald-500/20 border-emerald-500/30" :
                    avgTrustScore >= 60 ? "bg-blue-500/20 border-blue-500/30" :
                    avgTrustScore >= 40 ? "bg-amber-500/20 border-amber-500/30" :
                    "bg-red-500/20 border-red-500/30"
                  )}>
                    <Award size={16} className={
                      avgTrustScore >= 80 ? "text-emerald-400" :
                      avgTrustScore >= 60 ? "text-blue-400" :
                      avgTrustScore >= 40 ? "text-amber-400" : "text-red-400"
                    } />
                    <p className="text-white font-black text-base leading-none mt-1">{avgTrustScore}%</p>
                    <p className="text-white/40 text-[7px] font-black uppercase tracking-widest">{t.trustScore}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                  {[
                    { label: t.ponds,   value: activePonds.length, icon: LayersIcon, color: 'text-emerald-300' },
                    { label: t.acres,   value: totalArea.toFixed(1), icon: Calculator, color: 'text-blue-300' },
                    { label: t.biomass, value: `${(totalBiomassKg/1000).toFixed(1)}T`, icon: Fish, color: 'text-amber-300' },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <s.icon size={14} className={cn("mx-auto mb-1 opacity-60", s.color)} />
                      <p className="text-white font-black text-lg leading-none">{s.value}</p>
                      <p className="text-white/30 text-[7px] font-black uppercase tracking-widest mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── QUICK STATS ROW ── */}
        {ponds.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="grid grid-cols-2 gap-3">
              {/* Alerts */}
              <div
                onClick={() => navigate('/dashboard')}
                className={cn(
                  "rounded-[1.5rem] p-4 border shadow-sm flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all",
                  pendingAlerts > 0
                    ? isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"
                    : isDark ? "bg-white/5 border-white/5" : "bg-card border-card-border"
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  pendingAlerts > 0 ? "bg-red-500/10" : isDark ? "bg-white/5" : "bg-slate-50"
                )}>
                  <Bell size={18} className={pendingAlerts > 0 ? "text-red-500" : "text-slate-400"} />
                  {pendingAlerts > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-[7px] text-white font-black">{pendingAlerts}</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className={cn("font-black text-xl leading-none", pendingAlerts > 0 ? "text-red-500" : isDark ? "text-white" : "text-slate-800")}>{pendingAlerts}</p>
                  <p className={cn("text-[8px] font-black uppercase tracking-widest mt-0.5", isDark ? "text-white/40" : "text-slate-400")}>{t.activeAlerts}</p>
                </div>
              </div>

              {/* Harvest Ready */}
              <div className={cn(
                "rounded-[1.5rem] p-4 border shadow-sm flex items-center gap-3",
                isDark ? "bg-white/5 border-white/5" : "bg-card border-card-border"
              )}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  isDark ? "bg-emerald-500/10" : "bg-emerald-50"
                )}>
                  <ShoppingBag size={18} className="text-emerald-500" />
                </div>
                <div>
                  <p className={cn("font-black text-xl leading-none", isDark ? "text-white" : "text-slate-800")}>
                    {activePonds.filter(p => calculateDOC(p.stockingDate) >= 90).length}
                  </p>
                  <p className={cn("text-[8px] font-black uppercase tracking-widest mt-0.5", isDark ? "text-white/40" : "text-slate-400")}>{t.harvestReady}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── NO SUBSCRIPTION GUIDE ── */}
        {!isPro && ponds.length > 0 && (
          <NoSubscriptionState
            isDark={isDark}
            reason="You're on the free plan (1 pond max). Upgrade to Pro to manage multiple ponds, access real-time monitoring, AI disease detection, and full ROI analytics."
          />
        )}

        {/* ── TAB PILLS ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex-shrink-0",
                activeTab === tab.key
                  ? "bg-[#C78200] text-white border-[#C78200] shadow-lg shadow-[#C78200]/20"
                  : isDark ? "bg-white/5 text-white/40 border-white/5" : "bg-card text-ink/40 border-card-border"
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  "text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center",
                  activeTab === tab.key ? "bg-white/30 text-white" : isDark ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── POND CARDS ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {filteredPonds.length > 0 ? (
              filteredPonds.map((pond, idx) => {
                const doc = calculateDOC(pond.stockingDate);
                const weight = calculateWeight(doc);
                const growth = getGrowthPercentage(doc);
                const trust = computeTrustScore(pond.id, doc, waterRecords || [], feedLogs || [], medicineLogs || []);
                const latestWater = (waterRecords || [])
                  .filter(r => r.pondId === pond.id)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                const isWarning = latestWater && (latestWater.ph < 7.5 || latestWater.ph > 8.5 || latestWater.do < 4);
                const isHarvestReady = doc >= 90 && pond.status === 'active';
                const statusCfg = STATUS_CONFIG[pond.status] || STATUS_CONFIG['active'];
                const hasTracking = (harvestRequests || []).some((r: any) => r.pondId === pond.id && r.status !== 'completed');

                return (
                  <motion.div
                    key={pond.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => navigate(`/ponds/${pond.id}`)}
                    className={cn(
                      "rounded-[2rem] border shadow-sm cursor-pointer overflow-hidden group transition-all active:scale-[0.985]",
                      isDark ? "bg-[#0D1A13] border-white/5 hover:border-emerald-500/20" : "bg-white border-slate-100 hover:border-emerald-200 hover:shadow-md"
                    )}
                  >
                    {/* Card Top Banner */}
                    <div className={cn(
                      "h-1.5 w-full",
                      pond.status === 'active' ? (isHarvestReady ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-gradient-to-r from-emerald-500 to-teal-400") :
                      pond.status === 'planned' ? "bg-gradient-to-r from-blue-400 to-indigo-500" :
                      pond.status === 'harvest_pending' ? "bg-gradient-to-r from-indigo-500 to-purple-500" :
                      "bg-gradient-to-r from-slate-300 to-slate-400"
                    )} />

                    <div className="p-4">
                      {/* Row 1: Name + Status + Delete */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Pond avatar */}
                          <div className="w-11 h-11 rounded-[1rem] overflow-hidden flex-shrink-0 shadow-sm">
                            <img
                              src={`https://picsum.photos/seed/${pond.id}/100/100`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              alt={pond.name}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className={cn("font-black text-sm tracking-tight truncate", isDark ? "text-white" : "text-slate-900")}>{pond.name}</h3>
                              {isHarvestReady && <Star size={12} className="text-amber-500 flex-shrink-0" fill="currentColor" />}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={cn("text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full", statusCfg.bg, statusCfg.color)}>
                                <span className={cn("inline-block w-1 h-1 rounded-full mr-1 align-middle", statusCfg.dot)} />
                                {t[statusCfg.labelKey as keyof typeof t] as string}
                                {pond.status === 'active' && ` · D${doc}`}
                                {pond.status === 'planned' && ` · ${Math.abs(doc)}d ${t.days}`}
                              </span>
                              {hasTracking && (
                                <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 animate-pulse">
                                  {t.liveTracking}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Mini Trust Badge */}
                          <div className={cn("flex flex-col items-center px-2 py-1 rounded-xl", trust.bg)} title={t[trust.labelKey as keyof typeof t] as string}>
                            <ShieldCheck size={10} className={trust.color} />
                            <p className={cn("text-[7px] font-black", trust.color)}>{trust.score}%</p>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (doc > 7) { setShowDeleteAlert(true); return; }
                              setConfirmDeleteId(pond.id);
                            }}
                            className={cn("p-2 rounded-xl transition-all", isDark ? "text-white/10 hover:text-red-400 hover:bg-red-500/10" : "text-slate-200 hover:text-red-500 hover:bg-red-50")}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Species + Location + Size */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn("flex items-center gap-1 px-2 py-1 rounded-lg", isDark ? "bg-white/5" : "bg-slate-50")}>
                          <Fish size={10} className="text-emerald-500" />
                          <span className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/60" : "text-slate-600")}>{pond.species || 'Vannamei'}</span>
                        </div>
                        <div className={cn("flex items-center gap-1 px-2 py-1 rounded-lg", isDark ? "bg-white/5" : "bg-slate-50")}>
                          <Waves size={10} className="text-blue-400" />
                          <span className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/60" : "text-slate-600")}>{safeNum(pond.size, 1)} Ac</span>
                        </div>
                        <div className={cn("flex items-center gap-1 px-2 py-1 rounded-lg", isDark ? "bg-white/5" : "bg-slate-50")}>
                          <Activity size={10} className="text-purple-400" />
                          <span className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/60" : "text-slate-600")}>{(safeNum(pond.seedCount) / 1000).toFixed(0)}k PL</span>
                        </div>
                      </div>

                      {/* Row 3: Stats */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className={cn("rounded-xl p-2 text-center", isDark ? "bg-white/[0.03]" : "bg-slate-50")}>
                          <p className={cn("text-sm font-black leading-none", isDark ? "text-white" : "text-slate-800")}>{weight.toFixed(1)}g</p>
                          <p className={cn("text-[6px] font-black uppercase tracking-widest mt-0.5", isDark ? "text-white/30" : "text-slate-400")}>{t.weightLabel}</p>
                        </div>
                        <div className={cn("rounded-xl p-2 text-center", isDark ? "bg-white/[0.03]" : "bg-slate-50")}>
                          <p className={cn("text-sm font-black leading-none",
                            isWarning ? "text-amber-500" : isDark ? "text-emerald-400" : "text-emerald-600"
                          )}>
                            {latestWater ? `${latestWater.do || '—'}` : '—'}
                          </p>
                          <p className={cn("text-[6px] font-black uppercase tracking-widest mt-0.5", isDark ? "text-white/30" : "text-slate-400")}>DO mg/L</p>
                        </div>
                        <div className={cn("rounded-xl p-2 text-center", isDark ? "bg-white/[0.03]" : "bg-slate-50")}>
                          <p className={cn("text-sm font-black leading-none", isDark ? "text-white" : "text-slate-800")}>{latestWater ? latestWater.ph || '—' : '—'}</p>
                          <p className={cn("text-[6px] font-black uppercase tracking-widest mt-0.5", isDark ? "text-white/30" : "text-slate-400")}>pH</p>
                        </div>
                      </div>

                      {/* Row 4: Growth progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <p className={cn("text-[7px] font-black uppercase tracking-widest", isDark ? "text-white/30" : "text-slate-400")}>
                            {t.growthStage}
                          </p>
                          <p className={cn("text-[7px] font-black", isDark ? "text-emerald-400" : "text-emerald-600")}>
                            {growth.toFixed(0)}% · {pond.status === 'active' ? `${100 - doc}d ${t.days}` : pond.status === 'planned' ? t.preStockingPreparation : t.success}
                          </p>
                        </div>
                        <div className={cn("h-1 rounded-full overflow-hidden", isDark ? "bg-white/5" : "bg-slate-100")}>
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-1000 shadow-sm",
                              isHarvestReady ? "bg-gradient-to-r from-amber-400 to-orange-400" :
                              pond.status === 'planned' ? "bg-gradient-to-r from-blue-400 to-indigo-400" :
                              "bg-gradient-to-r from-emerald-500 to-teal-400"
                            )}
                            style={{ width: `${Math.max(2, growth)}%` }}
                          />
                        </div>
                      </div>

                      {/* Row 5: Alert flags */}
                      <div className="flex items-center gap-2 mt-3">
                        {isWarning && (
                          <span className="text-[7px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1">
                            <Zap size={8} /> {t.waterQualityAlerts}
                          </span>
                        )}
                        {isHarvestReady && (
                          <span className="text-[7px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <ShoppingBag size={8} /> {t.harvestReady}
                          </span>
                        )}
                        {!latestWater && doc > 0 && (
                          <span className="text-[7px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1">
                            <Droplets size={8} /> {t.noWaterData}
                          </span>
                        )}
                        <div className="ml-auto">
                          <ChevronRight size={14} className={cn("transition-all group-hover:translate-x-0.5", isDark ? "text-white/10 group-hover:text-emerald-400" : "text-slate-200 group-hover:text-emerald-500")} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-4"
              >
                {serverError ? (
                  <ServerErrorState isDark={isDark} />
                ) : (
                  <NoPondState
                    isDark={isDark}
                    subtitle={
                      activeTab === 'active'
                        ? t.addFirstPondDesc
                        : activeTab === 'planned'
                        ? t.needToRelease
                        : activeTab === 'harvested'
                        ? t.harvestHistory
                        : t.archive
                    }
                  />
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleAddPond}
        className={cn(
          "fixed bottom-28 right-5 w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-2xl z-40 transition-all",
          isLimitReached
            ? "bg-red-500 shadow-red-500/30"
            : "bg-gradient-to-br from-[#C78200] to-[#a06600] shadow-[#C78200]/30"
        )}
      >
        <Plus size={28} className="text-white" />
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
