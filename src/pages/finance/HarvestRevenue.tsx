import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ShieldCheck,
  Scale, Fish, Calendar, IndianRupee, TrendingUp,
  TrendingDown, Award, Layers, ArrowUpRight,
  ArrowDownRight, Home, Users, Target, X,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell,
} from 'recharts';
import { cn } from '../../utils/cn';
import { useData } from '../../context/DataContext';
import type { Translations } from '../../translations';

// ─── helpers ─────────────────────────────────────────────────────────────────
const n = (v: any) => parseFloat(v) || 0;
const currency = (v: number) =>
  v >= 100000
    ? `₹${(v / 100000).toFixed(2)}L`
    : v >= 1000
    ? `₹${(v / 1000).toFixed(1)}K`
    : `₹${Math.round(v)}`;

const fmt = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
  } catch {
    return iso;
  }
};

// ─── STATUS config ────────────────────────────────────────────────────────────
const statusConfig = (harvestType: string, isDark: boolean) => {
  if (harvestType === 'self') return {
    label: 'Self Harvest',
    icon: Home,
    color: 'text-amber-400',
    bg: isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200',
    fill: '#f59e0b',
  };
  return {
    label: 'Market Sale',
    icon: Users,
    color: 'text-emerald-400',
    bg: isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200',
    fill: '#10b981',
  };
};

// ─── ROI badge helper ─────────────────────────────────────────────────────────
const roiBadge = (roi: number) => {
  if (roi >= 30) return { label: 'Excellent', color: '#10b981' };
  if (roi >= 15) return { label: 'Good', color: '#f59e0b' };
  if (roi >= 0)  return { label: 'Break-even', color: '#94a3b8' };
  return { label: 'Loss', color: '#ef4444' };
};

// ─── MINI RING ────────────────────────────────────────────────────────────────
const MiniRing = ({ pct, fill, size = 36 }: { pct: number; fill: string; size?: number }) => {
  const r = 14, circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" className="-rotate-90">
      <circle cx={18} cy={18} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
      <motion.circle cx={18} cy={18} r={r} fill="none" stroke={fill} strokeWidth={3}
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (Math.min(100, Math.max(0, pct)) / 100) * circ }}
        transition={{ duration: 1.1, ease: 'easeOut' }} />
    </svg>
  );
};

// ─── DETAIL BOTTOM SHEET ──────────────────────────────────────────────────────
const DetailSheet = ({ entry, onClose, isDark }: { entry: any; onClose: () => void; isDark: boolean }) => {
  const st = statusConfig(entry.harvestType || 'market', isDark);
  const roi = n(entry.roi);
  const badge = roiBadge(roi);
  const netProfit = n(entry.netProfit);
  const totalRevenue = n(entry.totalRevenue || entry.saleAmountTotal);
  const totalInvested = n(entry.totalInvested);

  const rows = [
    { label: 'Buyer / Method', value: entry.buyerName || (entry.harvestType === 'self' ? 'Self Harvest' : 'Market Sale') },
    { label: 'Harvest Date', value: fmt(entry.harvestDate || entry.savedAt) },
    { label: 'Pond', value: entry.pondId || '--' },
    { label: 'Weight Sold', value: `${n(entry.harvestWeightKg).toLocaleString('en-IN')} kg` },
    { label: 'Count / kg', value: entry.countPerKg ? `${entry.countPerKg}/kg` : '--' },
    { label: 'Rate / kg', value: entry.pricePerKg ? `₹${n(entry.pricePerKg).toLocaleString('en-IN')}` : '--' },
    { label: 'Culture Days', value: entry.cultureDays ? `${entry.cultureDays} DOC` : '--' },
    { label: 'Survival Rate', value: entry.survivalRate ? `${entry.survivalRate}%` : '--' },
  ];

  const costBreakdown = [
    { label: 'Seed', value: n(entry.seedCost), fill: '#10b981' },
    { label: 'Feed', value: n(entry.feedCost), fill: '#f59e0b' },
    { label: 'Medicine', value: n(entry.medicineCost), fill: '#3b82f6' },
    { label: 'Labour', value: n(entry.laborCost), fill: '#f97316' },
    { label: 'Utilities', value: n(entry.utilityCost), fill: '#a855f7' },
    { label: 'Other', value: n(entry.otherCost) + n(entry.infrastructureCost), fill: '#94a3b8' },
  ].filter(c => c.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end"
      onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-[480px] mx-auto rounded-t-[2.5rem] border-t shadow-2xl max-h-[88vh] overflow-y-auto"
        style={{ background: isDark ? '#051F19' : '#fff', borderColor: isDark ? 'rgba(16,185,129,0.15)' : '#e2e8f0' }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="w-10 h-1.5 rounded-full mx-auto mt-4 mb-5" style={{ background: isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0' }} />

        {/* Header */}
        <div className="px-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center border', st.bg)}>
              <st.icon size={18} style={{ color: st.fill }} />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: st.fill }}>{st.label}</p>
              <h3 className={cn('text-base font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                Harvest Settlement
              </h3>
            </div>
          </div>
          <button onClick={onClose}
            className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'bg-white/8 text-white/50' : 'bg-slate-100 text-slate-500')}>
            <X size={14} />
          </button>
        </div>

        {/* Revenue hero */}
        <div className="mx-6 mb-5 rounded-[1.8rem] p-4 text-center relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${isDark ? '#022C1E' : '#ecfdf5'}, ${isDark ? '#064E3B' : '#d1fae5'})`, border: `1px solid ${isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0'}` }}>
          <p className={cn('text-[7.5px] font-black uppercase tracking-[0.3em] mb-1', isDark ? 'text-emerald-400/60' : 'text-emerald-700')}>
            Total Revenue
          </p>
          <p className="text-3xl font-black tracking-tighter" style={{ color: isDark ? '#34d399' : '#059669' }}>
            {currency(totalRevenue)}
          </p>
          <div className="flex items-center justify-center gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
            <div>
              <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: badge.color }}>{badge.label}</p>
              <p className="text-sm font-black" style={{ color: badge.color }}>ROI {roi.toFixed(1)}%</p>
            </div>
            <div className={cn('w-px h-8', isDark ? 'bg-white/10' : 'bg-slate-200')} />
            <div>
              <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>Net Profit</p>
              <p className={cn('text-sm font-black', netProfit >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                {netProfit >= 0 ? '+' : ''}{currency(netProfit)}
              </p>
            </div>
          </div>
        </div>

        {/* Details rows */}
        <div className="mx-6 mb-5 rounded-[1.6rem] border overflow-hidden"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', background: isDark ? 'rgba(255,255,255,0.02)' : '#fff' }}>
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: i < rows.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'}` : 'none' }}>
              <span className={cn('text-[8.5px] font-black uppercase tracking-widest', isDark ? 'text-white/35' : 'text-slate-400')}>{r.label}</span>
              <span className={cn('text-[10px] font-black', isDark ? 'text-white/80' : 'text-slate-800')}>{r.value}</span>
            </div>
          ))}
        </div>

        {/* Cost mini breakdown */}
        {costBreakdown.length > 0 && (
          <div className="mx-6 mb-6">
            <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3', isDark ? 'text-white/30' : 'text-slate-400')}>
              Cost Breakdown
            </p>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-3">
              {costBreakdown.map((c, i) => (
                <motion.div key={i}
                  initial={{ width: 0 }} animate={{ width: `${Math.round((c.value / totalInvested) * 100)}%` }}
                  transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                  className="h-full rounded-sm" style={{ background: c.fill }} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {costBreakdown.map((c, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: c.fill }} />
                  <span className={cn('text-[7px] font-black', isDark ? 'text-white/30' : 'text-slate-400')}>
                    {c.label} {currency(c.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mx-6 mb-8">
          <button onClick={onClose}
            className="w-full py-4 rounded-[1.5rem] font-black text-[9px] uppercase tracking-widest transition-all"
            style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` }}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export const HarvestRevenue = ({ t, onMenuClick }: { t: Translations; onMenuClick?: () => void }) => {
  const navigate = useNavigate();
  const { roiEntries, ponds, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'market' | 'self'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedPondId, setSelectedPondId] = useState<string>('all');

  const entries: any[] = useMemo(() => (roiEntries || []).slice().reverse(), [roiEntries]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalCycles   = entries.length;
  const totalRevenue  = entries.reduce((a, e) => a + n(e.totalRevenue || e.saleAmountTotal), 0);
  const totalInvested = entries.reduce((a, e) => a + n(e.totalInvested), 0);
  const totalProfit   = entries.reduce((a, e) => a + n(e.netProfit), 0);
  const avgROI        = totalCycles > 0 ? entries.reduce((a, e) => a + n(e.roi), 0) / totalCycles : 0;
  const bestROI       = totalCycles > 0 ? Math.max(...entries.map(e => n(e.roi))) : 0;
  const totalWeightKg = entries.reduce((a, e) => a + n(e.harvestWeightKg), 0);
  const avgPricePerKg = totalWeightKg > 0 ? totalRevenue / totalWeightKg : 0;

  // ── Trend chart: revenue per cycle ───────────────────────────────────────
  const trendData = useMemo(() =>
    entries.slice(-8).map((e, i) => ({
      label: `C${i + 1}`,
      revenue: n(e.totalRevenue || e.saleAmountTotal),
      cost: n(e.totalInvested),
      profit: n(e.netProfit),
    })),
    [entries]);

  // ── Available years from entries ──────────────────────────────────────────
  const availableYears = useMemo(() => {
    const yrs = new Set<string>();
    entries.forEach(e => {
      const date = e.harvestDate || e.createdAt || e.date;
      if (date) yrs.add(new Date(date).getFullYear().toString());
    });
    return ['all', ...Array.from(yrs).sort((a, b) => b.localeCompare(a))];
  }, [entries]);

  // ── Available ponds from entries ──────────────────────────────────────────
  const pondOptions = useMemo(() => {
    const seen = new Map<string, string>();
    entries.forEach(e => {
      if (e.pondId) {
        const pond = ponds.find(p => p.id === e.pondId);
        seen.set(e.pondId, pond?.name || e.pondName || e.pondId);
      }
    });
    return [{ id: 'all', name: 'All Ponds' }, ...Array.from(seen.entries()).map(([id, name]) => ({ id, name }))];
  }, [entries, ponds]);

  // ── Filtered entries (by type + year + pond) ──────────────────────────────
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchType = activeFilter === 'all' || (e.harvestType || 'market') === activeFilter;
      const matchYear = selectedYear === 'all' || (() => {
        const date = e.harvestDate || e.createdAt || e.date;
        return date && new Date(date).getFullYear().toString() === selectedYear;
      })();
      const matchPond = selectedPondId === 'all' || e.pondId === selectedPondId;
      return matchType && matchYear && matchPond;
    });
  }, [entries, activeFilter, selectedYear, selectedPondId]);

  // ── Harvested ponds for quick stats  ─────────────────────────────────────
  const harvestedPonds = useMemo(() =>
    ponds.filter(p => p.status === 'harvested'),
    [ponds]);


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border px-3 py-2 shadow-xl text-xs"
        style={{ background: isDark ? '#051F19' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}>
        <p className="font-black uppercase tracking-widest text-[8px] mb-1" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="font-black text-[10px]" style={{ color: p.color }}>
            {p.name}: {currency(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className={cn('pb-40 min-h-screen', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>

      <Header title="Harvest Revenue" showBack />

      {/* Detail Sheet */}
      <AnimatePresence>
        {selectedEntry && (
          <DetailSheet entry={selectedEntry} onClose={() => setSelectedEntry(null)} isDark={isDark} />
        )}
      </AnimatePresence>

      <div className="pt-20 px-4 max-w-[480px] mx-auto space-y-4">

        {/* ── HERO CARD ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-[2.2rem] overflow-hidden shadow-2xl relative"
            style={{ background: 'linear-gradient(135deg, #022C1E 0%, #064E3B 45%, #047857 85%, #059669 100%)' }}>
            <div className="absolute inset-0 opacity-[0.05]"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-emerald-400/10 blur-[80px] rounded-full" />

            <div className="relative z-10 p-5">
              {/* Cycle badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 mb-4">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[7.5px] font-black uppercase tracking-[0.25em] text-emerald-300">
                  {totalCycles} Harvest Cycles Settled
                </span>
              </div>

              {/* Total revenue */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[7.5px] font-black text-emerald-200/50 uppercase tracking-[0.25em] mb-1">
                    Total Revenue Earned
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white tracking-tighter leading-none"
                      style={{ textShadow: '0 2px 20px rgba(52,211,153,0.35)' }}>
                      {totalRevenue > 0 ? currency(totalRevenue) : '₹0'}
                    </span>
                  </div>
                  <p className="text-[8px] font-bold text-emerald-300/50 mt-1">
                    Net Profit: <span className={totalProfit >= 0 ? 'text-emerald-300' : 'text-red-300'}>{totalProfit >= 0 ? '+' : ''}{currency(totalProfit)}</span>
                  </p>
                </div>
                {/* ROI ring */}
                <div className="flex flex-col items-center gap-1">
                  <div className="relative w-16 h-16">
                    <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                      <circle cx={18} cy={18} r={14} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
                      <motion.circle cx={18} cy={18} r={14} fill="none"
                        stroke={avgROI >= 20 ? '#34d399' : avgROI >= 5 ? '#fbbf24' : '#f87171'}
                        strokeWidth={3} strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 14}
                        initial={{ strokeDashoffset: 2 * Math.PI * 14 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 14 - (Math.min(100, Math.abs(avgROI)) / 100) * 2 * Math.PI * 14 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-black text-white leading-none">{avgROI.toFixed(0)}%</span>
                      <span className="text-[5.5px] font-black text-emerald-300/50 uppercase tracking-widest">ROI</span>
                    </div>
                  </div>
                  <span className="text-[6px] font-black text-emerald-300/50 uppercase tracking-widest">Avg</span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/10">
                {[
                  { label: 'Total kg', value: totalWeightKg > 0 ? `${(totalWeightKg / 1000).toFixed(1)}T` : '--' },
                  { label: 'Avg Rate', value: avgPricePerKg > 0 ? `₹${Math.round(avgPricePerKg)}/kg` : '--' },
                  { label: 'Best ROI', value: bestROI > 0 ? `${bestROI.toFixed(0)}%` : '--' },
                  { label: 'Ponds', value: String(harvestedPonds.length) },
                ].map((m, i) => (
                  <div key={i} className="text-center">
                    <p className="text-[11px] font-black text-white leading-none">{m.value}</p>
                    <p className="text-[5.5px] font-black text-emerald-200/40 uppercase tracking-widest mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── FILTERS: Harvest Type / Year / Pond ── */}
        {entries.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {/* Harvest type pills */}
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
              {(['all', 'market', 'self'] as const).map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={cn('px-3.5 py-2 rounded-2xl text-[8px] font-black uppercase tracking-widest whitespace-nowrap border flex-shrink-0 transition-all',
                    activeFilter === f
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : isDark ? 'bg-white/5 text-white/40 border-white/8' : 'bg-white text-slate-500 border-slate-100 shadow-sm'
                  )}>
                  {f === 'all' ? '🏷 All Types' : f === 'market' ? '🏪 Market' : '🏠 Self'}
                </button>
              ))}
            </div>

            {/* Year + Pond row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Year filter */}
              <div className={cn('relative rounded-2xl border overflow-hidden', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className={cn('w-full pl-3 pr-8 py-2.5 text-[8.5px] font-black uppercase tracking-widest appearance-none outline-none bg-transparent',
                    isDark ? 'text-white' : 'text-slate-800'
                  )}
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y === 'all' ? '📅 All Years' : `📅 ${y}`}</option>
                  ))}
                </select>
                <div className={cn('absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px]', isDark ? 'text-white/30' : 'text-slate-400')}>▾</div>
              </div>

              {/* Pond filter */}
              <div className={cn('relative rounded-2xl border overflow-hidden', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
                <select
                  value={selectedPondId}
                  onChange={e => setSelectedPondId(e.target.value)}
                  className={cn('w-full pl-3 pr-8 py-2.5 text-[8.5px] font-black uppercase tracking-widest appearance-none outline-none bg-transparent',
                    isDark ? 'text-white' : 'text-slate-800'
                  )}
                >
                  {pondOptions.map(p => (
                    <option key={p.id} value={p.id}>{p.id === 'all' ? '🐟 All Ponds' : `🐟 ${p.name}`}</option>
                  ))}
                </select>
                <div className={cn('absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px]', isDark ? 'text-white/30' : 'text-slate-400')}>▾</div>
              </div>
            </div>

            {/* Active filter count */}
            {filteredEntries.length !== entries.length && (
              <p className={cn('text-[7.5px] font-black uppercase tracking-widest text-center', isDark ? 'text-white/30' : 'text-slate-400')}>
                Showing {filteredEntries.length} of {entries.length} records
              </p>
            )}
          </motion.div>
        )}

        {/* No data state */}
        {totalCycles === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={cn('rounded-[2rem] border p-8 text-center', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
            <div className={cn('w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center', isDark ? 'bg-emerald-500/10' : 'bg-emerald-50')}>
              <Layers size={28} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
            </div>
            <p className={cn('text-sm font-black', isDark ? 'text-white' : 'text-slate-900')}>No Harvest Records Yet</p>
            <p className={cn('text-[8px] font-bold mt-1', isDark ? 'text-white/30' : 'text-slate-400')}>
              Complete a harvest cycle to see your revenue records here.
            </p>
          </motion.div>
        )}


        {/* ── REVENUE TREND CHART ── */}
        {trendData.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className={cn('rounded-[2rem] border p-5', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>
                  Revenue Trend
                </p>
                <p className={cn('text-sm font-black', isDark ? 'text-white' : 'text-slate-900')}>
                  Cycle Performance
                </p>
              </div>
              <div className={cn('px-2.5 py-1 rounded-xl text-[7.5px] font-black uppercase tracking-widest border',
                isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700')}>
                Last {trendData.length} cycles
              </div>
            </div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} />
                  <XAxis dataKey="label"
                    tick={{ fontSize: 8, fontWeight: 900, fill: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)' }}
                    axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2}
                    fill="url(#revGrad)" dot={false} />
                  <Area type="monotone" dataKey="cost" name="Cost" stroke="#f59e0b" strokeWidth={1.5}
                    strokeDasharray="4 2" fill="url(#costGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2">
              {[{ color: '#10b981', label: 'Revenue' }, { color: '#f59e0b', label: 'Cost', dash: true }].map((l, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-5 h-0.5 rounded-full" style={{ background: l.color, opacity: l.dash ? 0.6 : 1 }} />
                  <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>{l.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── FILTER TABS ── */}
        {filteredEntries.length > 0 && (
          <div className={cn('flex p-1 rounded-2xl border gap-1', isDark ? 'bg-white/5 border-white/8' : 'bg-slate-100 border-transparent')}>
            {(['all', 'market', 'self'] as const).map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={cn('flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all',
                  activeFilter === f
                    ? isDark
                      ? 'bg-emerald-700/50 text-white border border-emerald-500/20 shadow-sm'
                      : 'bg-white text-emerald-700 shadow-md border border-emerald-100'
                    : isDark ? 'text-white/35' : 'text-slate-400'
                )}>
                {f === 'all' ? 'All' : f === 'market' ? 'Market' : 'Self'}
              </button>
            ))}
          </div>
        )}

        {/* ── SETTLEMENT LEDGER ── */}
        {filteredEntries.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>
                Settlement Ledger
              </p>
              <span className={cn('text-[8px] font-black px-2 py-0.5 rounded-lg',
                isDark ? 'bg-white/5 text-white/30' : 'bg-slate-100 text-slate-400')}>
                {filteredEntries.length} records
              </span>
            </div>

            <div className="space-y-2.5">
              {filteredEntries.map((entry, i) => {
                const st = statusConfig(entry.harvestType || 'market', isDark);
                const roi = n(entry.roi);
                const badge = roiBadge(roi);
                const revenue = n(entry.totalRevenue || entry.saleAmountTotal);
                const profit = n(entry.netProfit);
                const pondName = ponds.find(p => p.id === entry.pondId)?.name || entry.pondId || `Cycle ${i + 1}`;

                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={cn('rounded-[1.8rem] border overflow-hidden cursor-pointer transition-all active:scale-[0.98]',
                      isDark ? 'bg-white/[0.03] border-white/8 hover:border-emerald-600/30' : 'bg-white border-slate-100 shadow-sm hover:border-emerald-300')}
                    onClick={() => setSelectedEntry(entry)}>

                    {/* Main row */}
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      {/* Icon */}
                      <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center border flex-shrink-0', st.bg)}>
                        <ShieldCheck size={17} style={{ color: st.fill }} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={cn('text-[11px] font-black tracking-tight truncate', isDark ? 'text-white' : 'text-slate-900')}>
                            {entry.buyerName || pondName}
                          </p>
                          <span className="text-[6.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                            style={{ background: st.fill + '22', color: st.fill }}>
                            {st.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={8} className={isDark ? 'text-white/20' : 'text-slate-300'} />
                          <span className={cn('text-[7.5px] font-bold', isDark ? 'text-white/30' : 'text-slate-400')}>
                            {fmt(entry.harvestDate || entry.savedAt)}
                          </span>
                          {entry.harvestWeightKg && (
                            <>
                              <span className={cn('text-[7px]', isDark ? 'text-white/15' : 'text-slate-200')}>•</span>
                              <span className={cn('text-[7.5px] font-bold', isDark ? 'text-white/30' : 'text-slate-400')}>
                                {n(entry.harvestWeightKg).toLocaleString('en-IN')} kg
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Revenue + ROI */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black" style={{ color: isDark ? '#34d399' : '#059669' }}>
                          {currency(revenue)}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          {profit >= 0
                            ? <ArrowUpRight size={9} className="text-emerald-500" />
                            : <ArrowDownRight size={9} className="text-red-500" />}
                          <span className="text-[7px] font-black" style={{ color: badge.color }}>
                            {roi.toFixed(0)}% ROI
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Revenue vs cost mini bar */}
                    {revenue > 0 && n(entry.totalInvested) > 0 && (
                      <div className={cn('px-4 py-2 border-t flex items-center gap-2',
                        isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50/80 border-slate-100')}>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.round((revenue / (revenue + n(entry.totalInvested))) * 100))}%` }}
                            transition={{ duration: 0.9, ease: 'easeOut', delay: i * 0.05 }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, #059669, #34d399)` }} />
                        </div>
                        <span className={cn('text-[6.5px] font-black uppercase tracking-widest flex-shrink-0', isDark ? 'text-white/20' : 'text-slate-400')}>
                          {badge.label}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ROI by cycle bar chart ── */}
        {trendData.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className={cn('rounded-[2rem] border p-5', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
            <p className={cn('text-[8px] font-black uppercase tracking-widest mb-4', isDark ? 'text-white/30' : 'text-slate-400')}>
              Profit per Cycle
            </p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label"
                    tick={{ fontSize: 8, fontWeight: 900, fill: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)' }}
                    axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <CartesianGrid vertical={false} stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="profit" name="Net Profit" radius={[6, 6, 2, 2]} maxBarSize={32}>
                    {trendData.map((d, i) => (
                      <Cell key={i} fill={d.profit >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* ── Summary stats strip ── */}
        {totalCycles > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Total Invested', value: currency(totalInvested), icon: Target, color: '#f59e0b' },
              { label: 'Total Profit', value: currency(Math.abs(totalProfit)), icon: totalProfit >= 0 ? TrendingUp : TrendingDown, color: totalProfit >= 0 ? '#10b981' : '#ef4444' },
              { label: 'Avg Per kg', value: avgPricePerKg > 0 ? `₹${Math.round(avgPricePerKg)}` : '--', icon: Scale, color: '#3b82f6' },
              { label: 'Best Cycle ROI', value: `${bestROI.toFixed(0)}%`, icon: Award, color: '#a855f7' },
            ].map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                className={cn('rounded-[1.5rem] border p-4', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
                  style={{ background: m.color + '18' }}>
                  <m.icon size={14} style={{ color: m.color }} />
                </div>
                <p className="text-base font-black tracking-tight" style={{ color: m.color }}>{m.value}</p>
                <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>{m.label}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
