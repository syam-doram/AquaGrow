import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  TrendingUp, TrendingDown, BarChart2, Calendar, PieChart,
  FileText, ChevronRight, Layers, Fish, Receipt,
  ArrowUpRight, Target, Calculator
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

// ─── ROI Hub Page ──────────────────────────────────────────────────────────────
export const ProfitROI = ({ t, onMenuClick }: { t: Translations; onMenuClick?: () => void }) => {
  const navigate  = useNavigate();
  const { theme } = useData();
  const isDark    = theme === 'dark' || theme === 'midnight';

  // Load entries for summary stats
  const entries: any[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('roi_entries') || '[]'); }
    catch { return []; }
  }, []);

  const totalCycles   = entries.length;
  const avgROI        = totalCycles > 0 ? entries.reduce((a, e) => a + (e.roi ?? 0), 0) / totalCycles : 0;
  const totalNetProfit = entries.reduce((a, e) => a + (e.netProfit ?? 0), 0);
  const bestROI       = totalCycles > 0 ? Math.max(...entries.map(e => e.roi ?? 0)) : 0;

  // ── NAV SECTIONS ──────────────────────────────────────────────────────────
  const sections = [
    {
      id: 'overview',
      route: '/roi/overview',
      icon: BarChart2,
      emoji: '📊',
      label: 'Overall Performance',
      sub: 'ROI trends, net profit & cycle history',
      color: 'text-emerald-500',
      bg: isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200',
      badge: totalCycles > 0 ? `${totalCycles} cycles` : null,
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    {
      id: 'expenses',
      route: '/expense-report',
      icon: Receipt,
      emoji: '💸',
      label: 'Expense Breakdown',
      sub: 'Feed, medicine & operational costs',
      color: 'text-amber-500',
      bg: isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200',
      badge: null,
      badgeColor: '',
    },
    {
      id: 'pondwise',
      route: '/roi/pond-wise',
      icon: Fish,
      emoji: '🐟',
      label: 'Pond-wise Analysis',
      sub: 'Individual pond ROI & profit comparison',
      color: 'text-blue-500',
      bg: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200',
      badge: null,
      badgeColor: '',
    },
    {
      id: 'yearwise',
      route: '/roi/year-wise',
      icon: Calendar,
      emoji: '📅',
      label: 'Year-wise Summary',
      sub: 'Annual revenue & investment breakdown',
      color: 'text-purple-500',
      bg: isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200',
      badge: null,
      badgeColor: '',
    },
    {
      id: 'revenue',
      route: '/harvest-revenue',
      icon: Layers,
      emoji: '🏆',
      label: 'Harvest Revenue Ledger',
      sub: 'Settled harvest records & earnings',
      color: 'text-indigo-500',
      bg: isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200',
      badge: null,
      badgeColor: '',
    },

  ];

  return (
    <div className={cn('min-h-screen pb-32', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title="Finance & ROI" showBack={false} onMenuClick={onMenuClick} />

      <div className="pt-20 px-4 space-y-4">

        {/* ── Hero Summary Card ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#012B1D] via-[#02180F] to-[#051015] rounded-[2.5rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -right-8 -bottom-8 opacity-5">
            <Calculator size={160} strokeWidth={0.5} />
          </div>
          <div className="relative z-10">
            <p className="text-[#C78200] text-[7px] font-black uppercase tracking-widest mb-1">
              AquaGrow · Finance Intelligence
            </p>
            <h1 className="text-white text-2xl font-black tracking-tight mb-1">Profit & ROI</h1>
            <p className="text-white/30 text-[9px] font-medium max-w-[230px] leading-relaxed">
              Track investments, expenses, and returns across all your harvest cycles.
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/5">
              <div>
                <p className="text-white/20 text-[6px] font-black uppercase tracking-widest">Avg ROI</p>
                <p className={cn('text-lg font-black tracking-tight',
                  avgROI >= 30 ? 'text-emerald-400' : avgROI >= 0 ? 'text-amber-400' : 'text-red-400'
                )}>
                  {avgROI >= 0 ? '+' : ''}{avgROI.toFixed(1)}%
                </p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-white/20 text-[6px] font-black uppercase tracking-widest">Net Profit</p>
                <p className={cn('text-lg font-black tracking-tight',
                  totalNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {totalNetProfit >= 0 ? '+' : ''}₹{(Math.abs(totalNetProfit) / 100000).toFixed(1)}L
                </p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-white/20 text-[6px] font-black uppercase tracking-widest">Best ROI</p>
                <p className="text-emerald-400 text-lg font-black tracking-tight">
                  {bestROI.toFixed(1)}%
                </p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-white/20 text-[6px] font-black uppercase tracking-widest">Cycles</p>
                <p className="text-white text-lg font-black tracking-tight">{totalCycles}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── ROI Performance Badge ── */}
        {totalCycles > 0 && (
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
            <div className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center',
              avgROI >= 30 ? 'bg-emerald-500' : avgROI >= 0 ? 'bg-amber-500' : 'bg-red-500'
            )}>
              {avgROI >= 0
                ? <TrendingUp size={15} className="text-white" />
                : <TrendingDown size={15} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-[10px] font-black tracking-tight',
                avgROI >= 30 ? 'text-emerald-700' : avgROI >= 0 ? 'text-amber-700' : 'text-red-700',
                isDark && 'text-white'
              )}>
                {avgROI >= 30 ? '🏆 Premium Performance!' : avgROI >= 15 ? '✅ Good Farm Returns' : avgROI >= 0 ? '📈 Moderate Returns' : '⚠ Review Costs'}
              </p>
              <p className={cn('text-[8px] font-medium', isDark ? 'text-white/40' : 'text-slate-500')}>
                Average ROI across {totalCycles} harvest cycle{totalCycles !== 1 ? 's' : ''}
              </p>
            </div>
            <ArrowUpRight size={14} className={isDark ? 'text-white/20' : 'text-slate-300'} />
          </motion.div>
        )}

        {/* ── Navigation Cards ── */}
        <div>
          <p className={cn('text-[7px] font-black uppercase tracking-widest mb-3 px-1',
            isDark ? 'text-white/20' : 'text-slate-400'
          )}>
            Finance Modules
          </p>
          <div className="space-y-2.5">
            {sections.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(s.route)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-[1.8rem] border text-left transition-all',
                  isDark
                    ? 'bg-[#0D1520] border-white/5 hover:border-white/10'
                    : 'bg-white border-slate-100 shadow-sm hover:border-[#C78200]/20'
                )}
              >
                {/* Icon */}
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center border flex-shrink-0', s.bg, s.color)}>
                  <s.icon size={18} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={cn('text-[12px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                      {s.label}
                    </p>
                    {s.badge && (
                      <span className={cn('text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', s.badgeColor)}>
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <p className={cn('text-[9px] font-medium', isDark ? 'text-white/30' : 'text-slate-500')}>
                    {s.sub}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight size={16} className={isDark ? 'text-white/15 flex-shrink-0' : 'text-slate-300 flex-shrink-0'} />
              </motion.button>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
};
