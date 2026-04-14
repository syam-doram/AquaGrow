import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ReferenceLine,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Plus, Calendar, ChevronDown,
  Filter, CheckCircle2, AlertTriangle, Trophy,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useBottomSheet } from '../../context/BottomSheetContext';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

// ─── Entry Card ────────────────────────────────────────────────────────────────
const EntryCard = ({ entry, onClick, isDark, t }: { entry: any; onClick: () => void; isDark: boolean; t: Translations }) => {
  const roi = entry.roi ?? 0;
  const roiColor =
    roi >= 40 ? 'text-emerald-500' :
    roi >= 0  ? 'text-amber-500' :
                'text-red-500';
  const roiBg =
    roi >= 40
      ? isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
      : roi >= 0
      ? isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'       : 'bg-amber-50 border-amber-200 text-amber-600'
      : isDark ? 'bg-red-500/10 border-red-500/20 text-red-400'             : 'bg-red-50 border-red-200 text-red-600';

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-[2rem] border p-4 transition-all',
        isDark ? 'bg-[#0D1520] border-white/5 hover:border-white/12' : 'bg-white border-slate-100 shadow-sm hover:border-[#C78200]/25'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-0.5">
            <Calendar size={9} className={isDark ? 'text-[#C78200]/60' : 'text-[#C78200]'} />
            <p className="text-[#C78200] text-[7px] font-black uppercase tracking-widest">
              {new Date(entry.harvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <p className={cn('font-black text-sm tracking-tight truncate', isDark ? 'text-white' : 'text-slate-900')}>
            {entry.buyerName || 'Harvest Cycle'}
          </p>
          {entry.countPerKg && (
            <p className={cn('text-[7px] font-bold mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>
              Size: {entry.countPerKg}/kg
              {entry.harvestWeightKg ? ` · ${entry.harvestWeightKg} kg` : ''}
              {entry.cultureDays ? ` · DOC ${entry.cultureDays}` : ''}
            </p>
          )}
        </div>
        <span className={cn('px-2.5 py-1 rounded-xl border text-[8px] font-black uppercase tracking-widest flex-shrink-0', roiBg)}>
          {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: t.investments,  value: `₹${(entry.totalInvested / 100000).toFixed(1)}L`,   color: isDark ? 'text-white/70' : 'text-slate-700' },
          { label: t.revenueEarned,   value: `₹${(entry.totalRevenue / 100000).toFixed(1)}L`,    color: 'text-emerald-500' },
          { label: t.netProfitLoss, value: `${entry.netProfit >= 0 ? '+' : ''}₹${(Math.abs(entry.netProfit) / 100000).toFixed(1)}L`, color: entry.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500' },
        ].map((m, i) => (
          <div key={i} className={cn('rounded-xl p-2 border text-center', isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-100')}>
            <p className={cn('text-[6px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>{m.label}</p>
            <p className={cn('font-black text-[10px] tracking-tight', m.color)}>{m.value}</p>
          </div>
        ))}
      </div>
    </motion.button>
  );
};

// ─── Entry Detail Sheet ────────────────────────────────────────────────────────
const EntryDetailSheet = ({ entry, onClose, isDark, t }: { entry: any; onClose: () => void; isDark: boolean; t: Translations }) => {
  const roi = entry.roi ?? 0;
  const categories = [
    { label: t.seedPlsCost,      value: entry.seedCost || 0,           color: 'bg-blue-400',    fill: '#60a5fa' },
    { label: t.feedCostLabel,             value: entry.feedCost || 0,           color: 'bg-emerald-500', fill: '#10b981' },
    { label: t.medicineProbiotics,         value: entry.medicineCost || 0,       color: 'bg-amber-400',   fill: '#fbbf24' },
    { label: t.laborWages,            value: entry.laborCost || 0,          color: 'bg-purple-400',  fill: '#a78bfa' },
    { label: t.gridPowerBill,  value: entry.utilityCost || 0,        color: 'bg-orange-400',  fill: '#fb923c' },
    { label: t.infrastructurePower,   value: entry.infrastructureCost || 0, color: 'bg-pink-400',    fill: '#f472b6' },
    { label: t.otherTesting,            value: entry.otherCost || 0,          color: 'bg-slate-400',   fill: '#94a3b8' },
  ].filter(c => c.value > 0);
  const totalCost = categories.reduce((a, c) => a + c.value, 0) || 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className={cn('relative w-full max-w-[420px] rounded-t-[2.5rem] p-5 shadow-2xl max-h-[88vh] overflow-y-auto',
          isDark ? 'bg-[#0A1520] border-t border-white/8' : 'bg-white'
        )}
      >
        <div className={cn('w-10 h-1 rounded-full mx-auto mb-4', isDark ? 'bg-white/15' : 'bg-slate-200')} />

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl',
            roi >= 40 ? isDark ? 'bg-emerald-500/15' : 'bg-emerald-50' :
            roi >= 0  ? isDark ? 'bg-amber-500/15'   : 'bg-amber-50'   :
                        isDark ? 'bg-red-500/15'       : 'bg-red-50'
          )}>
            {roi >= 40 ? '🏆' : roi >= 0 ? '📈' : '📉'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#C78200] text-[7px] font-black uppercase tracking-widest">
              {new Date(entry.harvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h2 className={cn('text-lg font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              {entry.buyerName || 'Harvest Cycle'}
            </h2>
          </div>
          <span className={cn('px-3 py-1.5 rounded-xl border text-[10px] font-black flex-shrink-0',
            roi >= 40 ? isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700' :
            roi >= 0  ? isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'       : 'bg-amber-50 border-amber-200 text-amber-700' :
                        isDark ? 'bg-red-500/10 border-red-500/20 text-red-400'             : 'bg-red-50 border-red-200 text-red-700'
          )}>
            {roi >= 0 ? '+' : ''}{roi.toFixed(1)}% ROI
          </span>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: t.investments,  value: `₹${(entry.totalInvested / 100000).toFixed(2)}L`,   color: isDark ? 'text-white' : 'text-slate-900' },
            { label: t.revenueEarned,   value: `₹${(entry.totalRevenue / 100000).toFixed(2)}L`,    color: 'text-emerald-500' },
            { label: t.netProfitLoss,       value: `${entry.netProfit >= 0 ? '+' : ''}₹${(Math.abs(entry.netProfit) / 100000).toFixed(2)}L`, color: entry.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500' },
          ].map((m, i) => (
            <div key={i} className={cn('rounded-2xl p-3 border text-center', isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100')}>
              <p className={cn('text-[6px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/25' : 'text-slate-400')}>{m.label}</p>
              <p className={cn('text-[11px] font-black tracking-tight', m.color)}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Operational stats */}
        {(entry.harvestWeightKg || entry.countPerKg || entry.cultureDays || entry.survivalRate) && (
          <div className="flex gap-2 flex-wrap mb-4">
            {[
              { label: t.harvestLabel,  value: entry.harvestWeightKg ? `${entry.harvestWeightKg} kg` : null },
              { label: t.countPerKgSize, value: entry.countPerKg ? `${entry.countPerKg}/kg` : null },
              { label: t.cultureDuration,      value: entry.cultureDays ? `${entry.cultureDays} ${t.days || 'days'}` : null },
              { label: t.survival, value: entry.survivalRate ? `${entry.survivalRate}%` : null },
              { label: t.pricePerKgReceived,     value: entry.pricePerKg   ? `₹${entry.pricePerKg}/kg` : null },
            ].filter(m => m.value).map((m, i) => (
              <div key={i} className={cn('px-3 py-2 rounded-xl border',
                isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100')}>
                <p className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>{m.label}</p>
                <p className={cn('text-[10px] font-black mt-0.5', isDark ? 'text-white' : 'text-slate-900')}>{m.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Cost breakdown */}
        <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/20' : 'text-slate-400')}>{t.costBreakdown}</p>
        <div className="space-y-2 mb-5">
          {categories.map((c, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <p className={cn('text-[9px] font-black', isDark ? 'text-white/60' : 'text-slate-600')}>{c.label}</p>
                <p className={cn('text-[9px] font-black', isDark ? 'text-white' : 'text-slate-900')}>
                  ₹{c.value.toLocaleString('en-IN')}
                  <span className={cn('ml-1 text-[7px]', isDark ? 'text-white/20' : 'text-slate-400')}>
                    ({Math.round((c.value / totalCost) * 100)}%)
                  </span>
                </p>
              </div>
              <div className={cn('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/8' : 'bg-slate-100')}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${(c.value / totalCost) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className={cn('h-full rounded-full', c.color)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {entry.notes && (
          <div className={cn('rounded-2xl p-3.5 border mb-4', isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-100')}>
            <p className={cn('text-[8px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/20' : 'text-slate-400')}>{t.additionalNotes}</p>
            <p className={cn('text-[9px] font-medium italic leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>"{entry.notes}"</p>
          </div>
        )}

        <button onClick={onClose}
          className="w-full py-4 bg-gradient-to-r from-[#C78200] to-[#a06600] text-white font-black rounded-2xl text-[9px] uppercase tracking-widest">
          {t.close || 'Close'}
        </button>
      </motion.div>
    </div>
  );
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export const ROIOverview = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { theme, roiEntries } = useData();
  const { openBottomSheet, closeBottomSheet } = useBottomSheet();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  // Sync with global bottom sheet state to hide BottomNav
  React.useEffect(() => {
    if (selectedEntry) {
      openBottomSheet();
    } else {
      closeBottomSheet();
    }
    return () => closeBottomSheet();
  }, [selectedEntry, openBottomSheet, closeBottomSheet]);

  const [selectedYear, setSelectedYear]   = useState<string>('all');
  const [showYearPicker, setShowYearPicker] = useState(false);

  const allEntries: any[] = useMemo(() => (roiEntries || []).slice().sort(
    (a, b) => new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime()
  ), [roiEntries]);

  // Extract all unique years from entries
  const years = useMemo(() => {
    const ys = [...new Set(allEntries.map(e => new Date(e.harvestDate).getFullYear()))].sort((a, b) => b - a);
    return ys;
  }, [allEntries]);

  // Year-filtered entries
  const entries = useMemo(() =>
    selectedYear === 'all'
      ? allEntries
      : allEntries.filter(e => new Date(e.harvestDate).getFullYear() === parseInt(selectedYear)),
    [allEntries, selectedYear]
  );

  // Aggregate stats
  const totalCycles    = entries.length;
  const avgROI         = totalCycles > 0 ? entries.reduce((a, e) => a + (e.roi ?? 0), 0) / totalCycles : 0;
  const totalNetProfit = entries.reduce((a, e) => a + (e.netProfit ?? 0), 0);
  const totalRevenue   = entries.reduce((a, e) => a + (e.totalRevenue ?? 0), 0);
  const totalInvested  = entries.reduce((a, e) => a + (e.totalInvested ?? 0), 0);
  const bestROI        = totalCycles > 0 ? Math.max(...entries.map(e => e.roi ?? 0)) : 0;
  const bestCycle      = totalCycles > 0 ? entries.find(e => e.roi === bestROI) : null;

  // Chart data — ALL entries in chronological order
  const chartData = [...entries].reverse().map((e, i) => ({
    cycle: `C${i + 1}`,
    label: new Date(e.harvestDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    invested: Math.round((e.totalInvested || 0) / 1000),
    revenue:  Math.round((e.totalRevenue || 0) / 1000),
    profit:   Math.round((e.netProfit || 0) / 1000),
    roi:      parseFloat((e.roi ?? 0).toFixed(1)),
  }));

  const tickColor = isDark ? '#ffffff25' : '#00000025';
  const gridColor = isDark ? '#ffffff06' : '#00000006';

  return (
    <div className={cn('min-h-screen pb-32', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title={t.overallPerformance} showBack
        rightElement={
          <button onClick={() => navigate('/roi-entry')}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center',
              isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')}>
            <Plus size={15} />
          </button>
        }
      />

      <div className="pt-20 px-4 max-w-[420px] mx-auto space-y-4">

        {/* ── Year Filter ── */}
        {years.length > 0 && (
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setSelectedYear('all')}
                className={cn(
                  'px-3.5 py-2 rounded-2xl text-[8px] font-black uppercase tracking-widest whitespace-nowrap border flex-shrink-0 transition-all',
                  selectedYear === 'all'
                    ? isDark ? 'bg-[#C78200] border-[#C78200] text-white shadow-md' : 'bg-[#C78200] border-[#C78200] text-white shadow-md'
                    : isDark ? 'bg-white/5 border-white/8 text-white/40' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
                )}>
                {t.allYears}
              </button>
              {years.map(yr => (
                <button key={yr}
                  onClick={() => setSelectedYear(String(yr))}
                  className={cn(
                    'px-3.5 py-2 rounded-2xl text-[8px] font-black uppercase tracking-widest whitespace-nowrap border flex-shrink-0 transition-all flex items-center gap-1',
                    selectedYear === String(yr)
                      ? isDark ? 'bg-[#C78200] border-[#C78200] text-white shadow-md' : 'bg-[#C78200] border-[#C78200] text-white shadow-md'
                      : isDark ? 'bg-white/5 border-white/8 text-white/40' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
                  )}>
                  <Calendar size={8} />
                  {yr}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: t.totalCycles,
              value: totalCycles,
              sub: selectedYear === 'all' ? t.allTime : String(selectedYear),
              color: isDark ? 'text-white' : 'text-slate-900',
            },
            {
              label: t.avgRoi,
              value: totalCycles > 0 ? `${avgROI >= 0 ? '+' : ''}${avgROI.toFixed(1)}%` : '--',
              sub: t.perCycle,
              color: avgROI >= 30 ? 'text-emerald-500' : avgROI >= 0 ? 'text-amber-500' : 'text-red-500',
            },
            {
              label: t.netProfitLoss,
              value: totalNetProfit !== 0
                ? `${totalNetProfit >= 0 ? '+' : ''}₹${(Math.abs(totalNetProfit) / 100000).toFixed(1)}L`
                : '--',
              sub: t.totalEarnings,
              color: totalNetProfit >= 0 ? 'text-emerald-500' : 'text-red-500',
            },
            {
              label: t.bestRoi,
              value: bestROI > 0 ? `${bestROI.toFixed(1)}%` : '--',
              sub: bestCycle
                ? new Date(bestCycle.harvestDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                : t.singleCyclePeak,
              color: 'text-[#C78200]',
            },
          ].map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={cn('rounded-[1.8rem] border px-4 py-3.5', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
              <p className={cn('text-[7px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/20' : 'text-slate-400')}>{m.label}</p>
              <p className={cn('text-xl font-black tracking-tight', m.color)}>{m.value}</p>
              <p className={cn('text-[7px] font-bold mt-0.5', isDark ? 'text-white/15' : 'text-slate-400')}>{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Revenue Summary Row ── */}
        {totalCycles > 0 && (
          <div className={cn('rounded-[1.8rem] border px-4 py-3 grid grid-cols-2 gap-4',
            isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
            <div>
              <p className={cn('text-[6.5px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>{t.totalInvestment}</p>
              <p className={cn('text-base font-black tracking-tight', isDark ? 'text-white/80' : 'text-slate-700')}>
                ₹{(totalInvested / 100000).toFixed(2)}L
              </p>
            </div>
            <div>
              <p className={cn('text-[6.5px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>{t.totalSaleAmount}</p>
              <p className="text-base font-black tracking-tight text-emerald-500">
                ₹{(totalRevenue / 100000).toFixed(2)}L
              </p>
            </div>
          </div>
        )}

        {/* ── ROI Trend Chart (all entries) ── */}
        {chartData.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className={cn('rounded-[2rem] border px-4 pt-4 pb-3', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
            <div className="flex items-center justify-between mb-3">
              <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
                ROI % — All {chartData.length} Cycles
              </p>
              {avgROI >= 0
                ? <TrendingUp size={13} className="text-emerald-500" />
                : <TrendingDown size={13} className="text-red-500" />}
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="4 4" />
                <XAxis dataKey="label" tick={{ fontSize: 7, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: tickColor }} axisLine={false} tickLine={false} />
                <ReferenceLine y={0} stroke={isDark ? '#ffffff15' : '#00000010'} strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{ background: isDark ? '#0D1520' : '#fff', border: `1px solid ${isDark ? '#ffffff15' : '#e2e8f0'}`, borderRadius: 12, fontSize: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
                  formatter={(v: any) => [`${v}%`, 'ROI']}
                />
                <Line type="monotone" dataKey="roi" stroke="#C78200" strokeWidth={2.5} dot={{ r: 3.5, fill: '#C78200', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#C78200' }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* ── Revenue vs Invested Bar Chart ── */}
        {chartData.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className={cn('rounded-[2rem] border px-4 pt-4 pb-3', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
            <div className="flex items-center justify-between mb-2">
              <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
                Revenue vs Invested (₹'000)
              </p>
              <div className="flex gap-3">
                {[{ label: t.revenueEarned, color: 'bg-emerald-500' }, { label: t.investments, color: 'bg-blue-400' }].map((l, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className={cn('w-2 h-2 rounded-sm', l.color)} />
                    <p className={cn('text-[6.5px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>{l.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barSize={12} barGap={3}>
                <CartesianGrid stroke={gridColor} strokeDasharray="4 4" />
                <XAxis dataKey="label" tick={{ fontSize: 7, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: tickColor }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: isDark ? '#0D1520' : '#fff', border: `1px solid ${isDark ? '#ffffff15' : '#e2e8f0'}`, borderRadius: 12, fontSize: 10 }} />
                <Bar dataKey="revenue"  fill="#10B981" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="invested" fill="#60A5FA" radius={[4, 4, 0, 0]} name="Invested" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* ── Best Cycle Highlight ── */}
        {bestCycle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className={cn('rounded-[1.8rem] border p-4 flex items-center gap-3',
              isDark ? 'bg-amber-500/8 border-amber-500/15' : 'bg-amber-50 border-amber-200')}>
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', isDark ? 'bg-amber-500/15' : 'bg-amber-100')}>
              <Trophy size={18} className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-amber-400/70' : 'text-amber-700')}>
                {t.bestPerformingCycle}
              </p>
              <p className={cn('text-[11px] font-black tracking-tight truncate', isDark ? 'text-white' : 'text-slate-900')}>
                {bestCycle.buyerName || 'Harvest Cycle'} · {new Date(bestCycle.harvestDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </p>
            </div>
            <p className="text-lg font-black text-amber-500 flex-shrink-0">+{bestROI.toFixed(1)}%</p>
          </motion.div>
        )}

        {/* ── Cycle History — ALL entries ── */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
                {t.cycleHistory}
              </p>
              <p className={cn('text-[6px] font-bold', isDark ? 'text-white/15' : 'text-slate-300')}>
                {totalCycles} record{totalCycles !== 1 ? 's' : ''}{selectedYear !== 'all' ? ` in ${selectedYear}` : ' · all time'}
              </p>
            </div>
            <button onClick={() => navigate('/roi-entry')}
              className={cn('flex items-center gap-1 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border',
                isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700')}>
              <Plus size={10} /> {t.add}
            </button>
          </div>

          {entries.length === 0 ? (
            <div className={cn('rounded-[2rem] border p-8 text-center', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
              <p className="text-3xl mb-2">📊</p>
              <p className={cn('text-[11px] font-black mb-1', isDark ? 'text-white/50' : 'text-slate-700')}>
                {selectedYear === 'all' ? t.noEntriesYet : `${t.noEntriesYet} in ${selectedYear}`}
              </p>
              <p className={cn('text-[8.5px] font-medium leading-relaxed mb-4', isDark ? 'text-white/25' : 'text-slate-400')}>
                {selectedYear === 'all'
                  ? 'Add your first harvest cycle ROI to start tracking performance.'
                  : `Try selecting "All Years" or add a new entry for ${selectedYear}.`}
              </p>
              {selectedYear === 'all' && (
                <button onClick={() => navigate('/roi-entry')}
                  className="px-4 py-2 bg-[#C78200] text-white text-[9px] font-black uppercase tracking-widest rounded-xl">
                  {t.addEntry}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {entries.map((entry, i) => (
                <EntryCard key={`entry-${i}`} entry={entry} isDark={isDark} t={t} onClick={() => setSelectedEntry(entry)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Entry Detail Sheet */}
      <AnimatePresence>
        {selectedEntry && (
          <EntryDetailSheet entry={selectedEntry} isDark={isDark} t={t} onClose={() => setSelectedEntry(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
