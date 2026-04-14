import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  TrendingUp, TrendingDown, BarChart2, Calendar,
  FileText, ChevronRight, Layers, Fish, Receipt,
  ArrowUpRight, Calculator, Lock, Sparkles,
  Waves, AlertTriangle, Plus,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import { ServerErrorState } from '../../components/ServerErrorState';
import type { Translations } from '../../translations';

// ─── Subscription Gate Banner ─────────────────────────────────────────────────
const SubGateBanner = ({ isDark, navigate }: { isDark: boolean; navigate: ReturnType<typeof useNavigate> }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    className={cn(
      'rounded-2xl border overflow-hidden',
      isDark ? 'bg-[#1A0F00]/80 border-[#C78200]/20' : 'bg-amber-50 border-amber-200'
    )}
  >
    <div className="h-[3px] w-full bg-gradient-to-r from-[#C78200] via-amber-400 to-orange-400" />
    <div className="px-4 py-3 flex items-center gap-3">
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border',
        isDark ? 'bg-[#C78200]/15 border-[#C78200]/25' : 'bg-amber-100 border-amber-200'
      )}>
        <Lock size={16} className="text-[#C78200]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
          {t.proFeature}
        </p>
        <p className={cn('text-[8.5px] font-medium leading-snug', isDark ? 'text-white/40' : 'text-slate-500')}>
          {t.proROIUnlockMsg}
        </p>
      </div>
      <button
        onClick={() => navigate('/subscription')}
        className="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-gradient-to-br from-[#C78200] to-[#a06600] text-white rounded-xl font-black text-[8px] uppercase tracking-widest shadow-md"
      >
        <Sparkles size={10} />
        {t.upgrade}
        <ChevronRight size={10} />
      </button>
    </div>
  </motion.div>
);

// ─── ROI Hub Page ──────────────────────────────────────────────────────────────
export const ProfitROI = ({ t, onMenuClick }: { t: Translations; onMenuClick?: () => void }) => {
  const navigate = useNavigate();
  const { theme, roiEntries, ponds, isPro, serverError } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  // ── Derived data from live context ──────────────────────────────────────────
  const entries: any[] = useMemo(() => roiEntries || [], [roiEntries]);
  const harvestedPonds = useMemo(() => ponds.filter(p => p.status === 'harvested'), [ponds]);
  const activePonds = useMemo(() => ponds.filter(p => p.status === 'active' || p.status === 'planned'), [ponds]);
  const hasActivePond = useMemo(() => ponds.some(p => p.status === 'active'), [ponds]);
  const goToROIEntry = () => { if (!hasActivePond) { navigate('/ponds'); } else { navigate('/roi-entry'); } };

  const totalCycles = entries.length;
  const avgROI = totalCycles > 0 ? entries.reduce((a, e) => a + (e.roi ?? 0), 0) / totalCycles : 0;
  const totalNetProfit = entries.reduce((a, e) => a + (e.netProfit ?? 0), 0);
  const bestROI = totalCycles > 0 ? Math.max(...entries.map(e => e.roi ?? 0)) : 0;

  // ── Scenario detection ──────────────────────────────────────────────────────
  const noPonds = ponds.length === 0;
  const onlyActivePonds = !noPonds && harvestedPonds.length === 0;
  const hasHarvestedButNoROI = harvestedPonds.length > 0 && totalCycles === 0;
  const hasROIData = totalCycles > 0;

  // ── Nav sections with pro gating ────────────────────────────────────────────
  const sections = [
    {
      id: 'overview',
      route: '/roi/overview',
      icon: BarChart2,
      label: t.overallPerformance,
      sub: t.roiProfileSaved, // Or similar descriptive key
      color: '#10b981',
      bg: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5',
      badge: totalCycles > 0 ? `${totalCycles} ${t.totalCycles}` : null,
      proRequired: false,
    },
    {
      id: 'revenue',
      route: '/harvest-revenue',
      icon: Layers,
      label: t.yieldLedger,
      sub: t.revenueEarned,
      color: '#6366f1',
      bg: isDark ? 'rgba(99,102,241,0.1)' : '#eef2ff',
      badge: harvestedPonds.length > 0 ? `${harvestedPonds.length} ${t.statusHarvested}` : null,
      proRequired: false,
    },
    {
      id: 'expenses',
      route: '/expense-report',
      icon: Receipt,
      label: t.expensesLabel || 'Expense Breakdown',
      sub: t.trackReturnsDesc,
      color: '#f59e0b',
      bg: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb',
      badge: null,
      proRequired: true,
    },
    {
      id: 'pondwise',
      route: '/roi/pond-wise',
      icon: Fish,
      label: t.pondwiseReport,
      sub: t.proROIUnlockMsg,
      color: '#0ea5e9',
      bg: isDark ? 'rgba(14,165,233,0.1)' : '#f0f9ff',
      badge: null,
      proRequired: true,
    },
    {
      id: 'yearwise',
      route: '/roi/year-wise',
      icon: Calendar,
      label: t.allYears,
      sub: t.trackReturnsDesc,
      color: '#a855f7',
      bg: isDark ? 'rgba(168,85,247,0.1)' : '#faf5ff',
      badge: null,
      proRequired: true,
    },
  ];

  return (
    <div className={cn('min-h-screen pb-32', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title={t.financeROI} showBack={false} onMenuClick={onMenuClick} />

      <div className="pt-20 px-4 space-y-4">

        {/* ── Hero Summary Card ── Only shown when ponds exist ── */}
        {!noPonds && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#012B1D] via-[#02180F] to-[#051015] rounded-[2.5rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -right-8 -bottom-8 opacity-5">
            <Calculator size={160} strokeWidth={0.5} />
          </div>
          <div className="relative z-10">
            <p className="text-[#C78200] text-[7px] font-black uppercase tracking-widest mb-1">
              AquaGrow · {t.financeIntelligence}
            </p>
            <h1 className="text-white text-2xl font-black tracking-tight mb-1">{t.profitROI}</h1>
            <p className="text-white/30 text-[9px] font-medium max-w-[230px] leading-relaxed">
              {t.trackReturnsDesc}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/5">
              <div>
                <p className="text-white/20 text-[6px] font-black uppercase tracking-widest">{t.avgRoi}</p>
                <p className={cn('text-lg font-black tracking-tight',
                  hasROIData ? (avgROI >= 30 ? 'text-emerald-400' : avgROI >= 0 ? 'text-amber-400' : 'text-red-400') : 'text-white/20'
                )}>
                  {hasROIData ? `${avgROI >= 0 ? '+' : ''}${avgROI.toFixed(1)}%` : '--'}
                </p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-white/20 text-[6px] font-black uppercase tracking-widest">{t.netProfitLoss}</p>
                <p className={cn('text-lg font-black tracking-tight',
                  hasROIData ? (totalNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-white/20'
                )}>
                  {hasROIData ? `${totalNetProfit >= 0 ? '+' : ''}₹${(Math.abs(totalNetProfit) / 100000).toFixed(1)}L` : '--'}
                </p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-white/20 text-[6px] font-black uppercase tracking-widest">{t.bestRoi}</p>
                <p className={cn('text-lg font-black tracking-tight', hasROIData ? 'text-emerald-400' : 'text-white/20')}>
                  {hasROIData ? `${bestROI.toFixed(1)}%` : '--'}
                </p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-white/20 text-[6px] font-black uppercase tracking-widest">{t.totalCycles}</p>
                <p className={cn('text-lg font-black tracking-tight', hasROIData ? 'text-white' : 'text-white/20')}>
                  {totalCycles > 0 ? totalCycles : '0'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
        )}

        {/* ── SCENARIO: No ponds added — show empty/server error state, hide everything else ── */}
        {noPonds ? (
          serverError ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <ServerErrorState isDark={isDark} />
            </motion.div>
          ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={cn('rounded-2xl border p-6 text-center', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}
          >
            <div className={cn('w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center',
              isDark ? 'bg-slate-500/10' : 'bg-slate-100'
            )}>
              <Waves size={26} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
            </div>
            <p className={cn('text-sm font-black mb-1', isDark ? 'text-white' : 'text-slate-900')}>{t.noPondsAdded}</p>
            <p className={cn('text-[9px] font-medium leading-relaxed mb-4', isDark ? 'text-white/40' : 'text-slate-500')}>
              {t.addFirstPondDesc}
            </p>
            <button
              onClick={() => navigate('/ponds/new')}
              className="px-4 py-2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-sm flex items-center gap-1.5 mx-auto"
            >
              <Plus size={11} /> {t.addFirstPond}
            </button>
          </motion.div>
          )
        ) : (
          <>
            {/* ── SUBSCRIPTION BANNER (free plan) ── */}
            {!isPro && <SubGateBanner isDark={isDark} navigate={navigate} />}

            {/* ── ROI Performance Badge (when data exists) ── */}
            {hasROIData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  'rounded-2xl border px-4 py-3 flex items-center gap-3',
                  avgROI >= 30
                    ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')
                    : avgROI >= 0
                    ? (isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200')
                    : (isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200')
                )}
              >
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center',
                  avgROI >= 30 ? 'bg-emerald-500' : avgROI >= 0 ? 'bg-amber-500' : 'bg-red-500'
                )}>
                  {avgROI >= 0
                    ? <TrendingUp size={15} className="text-white" />
                    : <TrendingDown size={15} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-0.5">
                    <p className={cn('text-[10px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                      {avgROI >= 30 ? t.premiumPerformance : avgROI >= 15 ? t.goodFarmReturns : avgROI >= 0 ? t.lowReturnsWarning : t.lossCycleWarning}
                    </p>
                </div>
                    <p className={cn('text-[8px] font-medium', isDark ? 'text-white/40' : 'text-slate-500')}>
                      {avgROI >= 30
                        ? `Excellent ROI across ${totalCycles} cycle${totalCycles !== 1 ? 's' : ''}. Keep it up!`
                        : avgROI >= 15
                        ? `Solid returns across ${totalCycles} cycle${totalCycles !== 1 ? 's' : ''}. Room to improve.`
                        : avgROI >= 0
                        ? `Low profit margin. Review feed, medicine & operational costs.`
                        : `Net loss detected. Check if all revenue was logged correctly.`}
                    </p>
                  </div>
                <ArrowUpRight size={14} className={isDark ? 'text-white/20' : 'text-slate-300'} />
              </motion.div>
            )}

            {/* ── SCENARIO: Has ponds but none harvested yet ── */}
            {onlyActivePonds && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={cn('rounded-2xl border p-5 flex items-start gap-4',
                  isDark ? 'bg-blue-500/8 border-blue-500/15' : 'bg-blue-50 border-blue-200'
                )}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  isDark ? 'bg-blue-500/15 border border-blue-500/25' : 'bg-blue-100'
                )}>
                  <AlertTriangle size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className={cn('text-[11px] font-black mb-1', isDark ? 'text-white' : 'text-slate-900')}>
                    {t.cultureInProgress}
                  </p>
                  <p className={cn('text-[8.5px] font-medium leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
                    {t.cultureInProgressDesc(activePonds.length)}
                  </p>
                  <button
                    onClick={() => navigate('/ponds')}
                    className="mt-3 text-blue-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1"
                  >
                    {t.viewPonds} <ChevronRight size={10} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── SCENARIO: Harvested ponds but no ROI entry logged ── */}
            {hasHarvestedButNoROI && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={cn('rounded-2xl border p-5 flex items-start gap-4',
                  isDark ? 'bg-amber-500/8 border-amber-500/15' : 'bg-amber-50 border-amber-200'
                )}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  isDark ? 'bg-amber-500/15 border border-amber-500/25' : 'bg-amber-100'
                )}>
                  <FileText size={16} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-[11px] font-black mb-1', isDark ? 'text-white' : 'text-slate-900')}>
                    {t.harvestCompleteLogROI}
                  </p>
                  <p className={cn('text-[8.5px] font-medium leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
                    {t.harvestCompleteLogROIDesc(harvestedPonds.length)}
                  </p>
                  <button
                    onClick={goToROIEntry}
                    className="mt-3 px-3 py-1.5 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded-xl flex items-center gap-1.5"
                  >
                    <Plus size={10} /> {t.addEntry}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Finance Module Navigation Cards ── */}
            <div>
              <p className={cn('text-[7px] font-black uppercase tracking-widest mb-3 px-1',
                isDark ? 'text-white/20' : 'text-slate-400'
              )}>
                {t.financeModules}
              </p>
              <div className="space-y-2.5">
                {sections.map((s, i) => {
                  const isLocked = s.proRequired && !isPro;
                  return (
                    <motion.button
                      key={s.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => isLocked ? navigate('/subscription') : navigate(s.route)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-[1.8rem] border text-left transition-all',
                        isDark
                          ? 'bg-[#0D1520] border-white/5 hover:border-white/10'
                          : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'
                      )}
                    >
                      {/* Icon */}
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border"
                        style={{ background: s.bg, borderColor: s.border }}
                      >
                        <s.icon size={18} style={{ color: isLocked ? (isDark ? '#ffffff25' : '#94a3b8') : s.color }} />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={cn('text-[12px] font-black tracking-tight',
                            isLocked
                              ? (isDark ? 'text-white/50' : 'text-slate-400')
                              : (isDark ? 'text-white' : 'text-slate-900')
                          )}>
                            {s.label}
                          </p>
                          {s.badge && !isLocked && (
                            <span
                              className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                              style={{ background: s.bg, borderColor: s.border, color: s.color }}
                            >
                              {s.badge}
                            </span>
                          )}
                          {isLocked && (
                            <span className={cn(
                              'text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
                              isDark ? 'bg-[#C78200]/10 border-[#C78200]/20 text-[#C78200]' : 'bg-amber-100 border-amber-300 text-amber-700'
                            )}>
                              Pro
                            </span>
                          )}
                        </div>
                        <p className={cn('text-[9px] font-medium',
                          isLocked
                            ? (isDark ? 'text-white/20' : 'text-slate-300')
                            : (isDark ? 'text-white/30' : 'text-slate-500')
                        )}>
                          {s.sub}
                        </p>
                      </div>

                      {/* Arrow or Lock */}
                      {isLocked
                        ? <Lock size={14} className="text-[#C78200] flex-shrink-0 opacity-70" />
                        : <ChevronRight size={16} className={isDark ? 'text-white/15 flex-shrink-0' : 'text-slate-300 flex-shrink-0'} />
                      }
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* ── CTA: Log new harvest when ROI data exists ── */}
            {hasROIData && (
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                onClick={goToROIEntry}
                className="w-full py-4 rounded-[1.5rem] border font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                style={{
                  background: isDark ? 'rgba(16,185,129,0.08)' : '#ecfdf5',
                  borderColor: isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0',
                  color: '#10b981',
                }}
              >
                <Plus size={14} />
                {t.logNewHarvestCycle}
              </motion.button>
            )}
          </>
        )}

      </div>
    </div>
  );
};
