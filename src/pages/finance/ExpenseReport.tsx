import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fish, Wheat, Pill, Plus,
  Wind, Droplets, Users, Calendar,
  Target, IndianRupee, AlertTriangle,
} from 'lucide-react';
import { Header } from '../../components/Header';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/cn';
import { useData } from '../../context/DataContext';
import type { Translations } from '../../translations';
import { calculateDOC } from '../../utils/pondUtils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CategoryDef {
  key: string;
  label: string;
  unit?: string;
  icon: React.ElementType;
  color: string;          // text color
  bg: string;             // bg chip color
  fill: string;           // bar/donut fill
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
}

// ─── Category Config ──────────────────────────────────────────────────────────
const CATEGORIES: CategoryDef[] = [
  {
    key: 'feed',
    label: 'Pellet Feed',
    icon: Wheat,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    fill: '#f59e0b',
    borderColor: 'border-amber-500/20',
    gradientFrom: '#78350f',
    gradientTo: '#f59e0b22',
  },
  {
    key: 'seed',
    label: 'Seed / PL',
    icon: Fish,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    fill: '#10b981',
    borderColor: 'border-emerald-500/20',
    gradientFrom: '#064e3b',
    gradientTo: '#10b98122',
  },
  {
    key: 'medicine',
    label: 'Medicine',
    icon: Pill,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    fill: '#3b82f6',
    borderColor: 'border-blue-500/20',
    gradientFrom: '#1e3a8a',
    gradientTo: '#3b82f622',
  },
  {
    key: 'aerator',
    label: 'Aerator Power',
    icon: Wind,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    fill: '#a855f7',
    borderColor: 'border-purple-500/20',
    gradientFrom: '#4c1d95',
    gradientTo: '#a855f722',
  },
  {
    key: 'labor',
    label: 'Labour',
    icon: Users,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    fill: '#f97316',
    borderColor: 'border-orange-500/20',
    gradientFrom: '#7c2d12',
    gradientTo: '#f9731622',
  },
  {
    key: 'other',
    label: 'Other / Diesel',
    icon: Droplets,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    fill: '#94a3b8',
    borderColor: 'border-slate-500/20',
    gradientFrom: '#1e293b',
    gradientTo: '#94a3b822',
  },
];

// ─── Mini ring component ──────────────────────────────────────────────────────
const Ring = ({ pct, fill, size = 44 }: { pct: number; fill: string; size?: number }) => {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="-rotate-90">
      <circle cx={20} cy={20} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3.5} />
      <motion.circle
        cx={20} cy={20} r={r} fill="none"
        stroke={fill} strokeWidth={3.5} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />
    </svg>
  );
};

// ─── Category Card ─────────────────────────────────────────────────────────────
const CategoryCard: React.FC<{
  cat: CategoryDef; value: number; pct: number; isDark: boolean; isSelected: boolean; onClick: () => void;
}> = ({ cat, value, pct, isDark, isSelected, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    className={cn(
      'relative rounded-[1.8rem] p-4 border text-left transition-all overflow-hidden w-full',
      isSelected
        ? isDark ? 'border-white/20 shadow-lg' : 'border-slate-300 shadow-md'
        : isDark ? 'border-white/8 hover:border-white/15' : 'border-slate-100 hover:border-slate-200',
      isDark ? 'bg-white/[0.03]' : 'bg-white shadow-sm',
    )}
    style={isSelected ? { borderColor: cat.fill + '55', boxShadow: `0 4px 24px ${cat.fill}18` } : {}}
  >
    {/* Glow bg */}
    <div
      className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-[30px] opacity-30"
      style={{ background: cat.fill }}
    />
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', cat.bg)}
          style={{ boxShadow: `0 0 0 1px ${cat.fill}33` }}>
          <cat.icon size={16} style={{ color: cat.fill }} />
        </div>
        <Ring pct={pct} fill={cat.fill} size={40} />
      </div>
      <p className={cn('text-[8px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/40' : 'text-slate-400')}>
        {cat.label}
      </p>
      <p className="text-base font-black tracking-tight" style={{ color: cat.fill }}>
        ₹{value > 0 ? value.toLocaleString('en-IN') : '0'}
      </p>
      <p className={cn('text-[7px] font-black mt-0.5 uppercase tracking-wider', isDark ? 'text-white/20' : 'text-slate-400')}>
        {pct}% of total
      </p>
    </div>
  </motion.button>
);

// ─── Custom Pie Tooltip ────────────────────────────────────────────────────────
const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[#0A1A12] border border-white/10 rounded-2xl px-3 py-2 shadow-xl">
      <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-0.5">{d.name}</p>
      <p className="text-sm font-black text-white">₹{d.value.toLocaleString('en-IN')}</p>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export const ExpenseReport = ({ t, onMenuClick }: { t: Translations; onMenuClick?: () => void }) => {
  const navigate = useNavigate();
  const { expenses, feedLogs, medicineLogs, aeratorLogs, ponds, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedPondId, setSelectedPondId] = useState<string>('all');
  const [recentTypeFilter, setRecentTypeFilter] = useState<string | null>(null);

  // Only non-harvested ponds in the filter
  const activePonds = useMemo(() => ponds.filter(p => p.status !== 'harvested'), [ponds]);

  const n = (v: any) => parseFloat(v) || 0;

  // ── Filter by pond ──────────────────────────────────────────────────────────
  const filteredExpenses = useMemo(() =>
    selectedPondId === 'all' ? expenses : expenses.filter(e => e.pondId === selectedPondId),
    [expenses, selectedPondId]);

  const filteredFeedLogs = useMemo(() =>
    selectedPondId === 'all' ? feedLogs : feedLogs.filter(l => (l as any).pondId === selectedPondId),
    [feedLogs, selectedPondId]);

  const filteredMedLogs = useMemo(() =>
    selectedPondId === 'all' ? medicineLogs : medicineLogs.filter(l => (l as any).pondId === selectedPondId),
    [medicineLogs, selectedPondId]);

  const filteredAerLogs = useMemo(() =>
    selectedPondId === 'all' ? aeratorLogs : aeratorLogs.filter(l => l.pondId === selectedPondId),
    [aeratorLogs, selectedPondId]);

  // ── Cost Aggregations ───────────────────────────────────────────────────────
  // Feed: from expenses.feed + feedLogs cost field
  const feedFromExp  = useMemo(() => filteredExpenses.filter(e => e.category === 'feed').reduce((a, e) => a + n(e.amount), 0), [filteredExpenses]);
  const feedFromLogs = useMemo(() => filteredFeedLogs.reduce((a, l: any) => a + n(l.cost || l.quantity * 65), 0), [filteredFeedLogs]);
  const feedCost = feedFromExp + feedFromLogs;

  // Seed
  const seedCost = useMemo(() => filteredExpenses.filter(e => e.category === 'seed').reduce((a, e) => a + n(e.amount), 0), [filteredExpenses]);

  // Medicine: from expenses + medicineLogs
  const medFromExp  = useMemo(() => filteredExpenses.filter(e => e.category === 'medicine').reduce((a, e) => a + n(e.amount), 0), [filteredExpenses]);
  const medFromLogs = useMemo(() => filteredMedLogs.reduce((a, l: any) => a + n(l.cost), 0), [filteredMedLogs]);
  const medicineCost = medFromExp + medFromLogs;

  // Aerator: estimate electricity cost from HP × operating hours × kWh rate
  // HP × 0.746kW × 20hrs/day × ₹8/kWh × DOC days (or from power expenses)
  const powerFromExp = useMemo(() => filteredExpenses.filter(e => ['power', 'diesel'].includes(e.category)).reduce((a, e) => a + n(e.amount), 0), [filteredExpenses]);
  const aeratorEstimate = useMemo(() => {
    if (filteredAerLogs.length === 0) return 0;
    const latest = filteredAerLogs[filteredAerLogs.length - 1];
    const hp = n(latest?.hp) || 0;
    const count = n(latest?.count) || 0;
    const doc = n(latest?.doc) || 60;
    // HP × 0.746kW/HP × 20hr/day × ₹8/unit × doc days
    return Math.round(count * hp * 0.746 * 20 * 8 * doc);
  }, [filteredAerLogs]);
  const aeratorCost = powerFromExp > 0 ? powerFromExp : aeratorEstimate;

  // Labour & Other
  const laborCost = useMemo(() => filteredExpenses.filter(e => e.category === 'labor').reduce((a, e) => a + n(e.amount), 0), [filteredExpenses]);
  const otherCost = useMemo(() => filteredExpenses.filter(e => e.category === 'other').reduce((a, e) => a + n(e.amount), 0), [filteredExpenses]);

  // Total
  const totalSpend = feedCost + seedCost + medicineCost + aeratorCost + laborCost + otherCost;
  const pct = (val: number) => totalSpend > 0 ? Math.round((val / totalSpend) * 100) : 0;

  // ── Category values map ─────────────────────────────────────────────────────
  const catValues: Record<string, number> = {
    feed: feedCost,
    seed: seedCost,
    medicine: medicineCost,
    aerator: aeratorCost,
    labor: laborCost,
    other: otherCost,
  };

  // ── Pie chart data ──────────────────────────────────────────────────────────
  const pieData = CATEGORIES
    .map(c => ({ name: c.label, value: catValues[c.key], fill: c.fill }))
    .filter(d => d.value > 0);

  // ── DOC & daily run rate ────────────────────────────────────────────────────
  const activePond = ponds.find(p => p.id === selectedPondId && p.status === 'active');
  const currentDoc = activePond ? calculateDOC(activePond.stockingDate) : 90;
  const dailyRunRate = totalSpend > 0 && currentDoc > 0 ? totalSpend / currentDoc : 0;

  // ── Per-kg cost (from feedLogs totalFeed consumed; rough biomass est) ───────
  const totalFeedKg = useMemo(() => filteredFeedLogs.reduce((a, l: any) => a + n(l.quantity), 0), [filteredFeedLogs]);
  const biomassKg = activePond
    ? Math.round((n(activePond.seedCount) * 0.8 * (0.06 * currentDoc + 2)) / 1000)
    : 0;
  const costPerKg = biomassKg > 0 ? Math.round(totalSpend / biomassKg) : 0;
  const feedFCR = biomassKg > 0 && totalFeedKg > 0 ? (totalFeedKg / biomassKg).toFixed(2) : '-';

  // ── Pond breakdown ──────────────────────────────────────────────────────────
  const pondBreakdown = useMemo(() => {
    // Only show active/planned ponds in the breakdown
    return ponds
      .filter(pond => pond.status !== 'harvested')
      .map(pond => {
      const pe = expenses.filter(e => e.pondId === pond.id);
      const pf = feedLogs.filter((l: any) => l.pondId === pond.id);
      const pm = medicineLogs.filter((l: any) => l.pondId === pond.id);
      const feedTotal = pe.filter(e => e.category === 'feed').reduce((a, e) => a + n(e.amount), 0)
        + pf.reduce((a, l: any) => a + n(l.cost || l.quantity * 65), 0);
      const medTotal = pe.filter(e => e.category === 'medicine').reduce((a, e) => a + n(e.amount), 0)
        + pm.reduce((a, l: any) => a + n(l.cost), 0);
      const seedTotal = pe.filter(e => e.category === 'seed').reduce((a, e) => a + n(e.amount), 0);
      const powerTotal = pe.filter(e => ['power', 'diesel'].includes(e.category)).reduce((a, e) => a + n(e.amount), 0);
      const total = feedTotal + medTotal + seedTotal + powerTotal;
      return { pond, feedTotal, medTotal, seedTotal, powerTotal, total };
    }).filter(r => r.total > 0).sort((a, b) => b.total - a.total);
  }, [ponds, expenses, feedLogs, medicineLogs]);

  // ── Recent expense timeline ─────────────────────────────────────────────────
  const recentItems = useMemo(() => {
    const exp = filteredExpenses.map(e => ({
      label: e.categoryLabel || e.category,
      amount: n(e.amount),
      date: e.date || e.createdAt || new Date().toISOString(),
      cat: e.category,
      notes: e.notes,
    }));
    const fl = filteredFeedLogs.map((l: any) => ({
      label: `Feed - ${l.feedNo || 'Pellet'}`,
      amount: n(l.cost || l.quantity * 65),
      date: l.date || l.createdAt || new Date().toISOString(),
      cat: 'feed',
      notes: `${l.quantity}kg`,
    }));
    const ml = filteredMedLogs.map((l: any) => ({
      label: l.medicineName || 'Medicine',
      amount: n(l.cost),
      date: l.date || l.createdAt || new Date().toISOString(),
      cat: 'medicine',
      notes: l.dosage || '',
    }));
    return [...exp, ...fl, ...ml]
      .filter(i => i.amount > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);
  }, [filteredExpenses, filteredFeedLogs, filteredMedLogs]);

  // Filter items for selected category
  const displayItems = selectedCat
    ? recentItems.filter(i => i.cat === selectedCat)
    : recentItems;

  const getCatConfig = (key: string) => CATEGORIES.find(c => c.key === key) || CATEGORIES[5];

  return (
    <div className={cn('pb-10 min-h-screen', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>

      <Header title="Expense Report" showBack rightElement={
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/daily-expense')}
          className={cn('w-10 h-10 -mr-2 rounded-xl flex items-center justify-center',
            isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')}>
          <Plus size={16} />
        </motion.button>
      } />

      <div className="pt-20 px-4 max-w-[420px] mx-auto space-y-4">

        {/* ── Pond Filter Tabs (non-harvested only) ── */}
        {activePonds.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedPondId('all')}
              className={cn(
                'px-3.5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex-shrink-0',
                selectedPondId === 'all'
                  ? isDark ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-amber-500 text-white border-amber-500 shadow-md'
                  : isDark ? 'bg-white/5 text-white/40 border-white/8' : 'bg-white text-slate-500 border-slate-200 shadow-sm'
              )}>
              All Ponds
            </button>
            {activePonds.map(p => (
              <button key={p.id}
                onClick={() => setSelectedPondId(p.id)}
                className={cn(
                  'px-3.5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex-shrink-0 flex items-center gap-1',
                  selectedPondId === p.id
                    ? isDark ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-amber-500 text-white border-amber-500 shadow-md'
                    : isDark ? 'bg-white/5 text-white/40 border-white/8' : 'bg-white text-slate-500 border-slate-200 shadow-sm'
                )}>
                <Fish size={9} className="opacity-70" />
                {p.name} <span className="opacity-50">{p.status === 'active' ? '🟢' : '📋'}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Hero Total Card ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-[2.2rem] overflow-hidden shadow-2xl relative"
            style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #3d1a00 40%, #7c3500 80%, #c05a00 100%)' }}>
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
            <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-amber-400/10 blur-[80px] rounded-full" />

            <div className="relative z-10 p-5">
              {/* Top */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[7.5px] font-black text-amber-200/50 uppercase tracking-[0.25em] mb-1">
                    Total Cycle Spend
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white tracking-tighter leading-none"
                      style={{ textShadow: '0 2px 20px rgba(251,191,36,0.3)' }}>
                      {totalSpend > 0
                        ? totalSpend >= 100000
                          ? `${(totalSpend / 100000).toFixed(2)}L`
                          : `${(totalSpend / 1000).toFixed(1)}K`
                        : '0'}
                    </span>
                    <span className="text-sm text-amber-300/70 font-black">₹</span>
                  </div>
                </div>
                {/* Donut summary */}
                <div className="relative w-20 h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData.length > 0 ? pieData : [{ name: 'Empty', value: 1, fill: 'rgba(255,255,255,0.05)' }]}
                        cx="50%" cy="50%" innerRadius={26} outerRadius={36}
                        dataKey="value" strokeWidth={0}>
                        {(pieData.length > 0 ? pieData : [{ fill: 'rgba(255,255,255,0.05)' }]).map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IndianRupee size={12} className="text-amber-300/50" />
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
                {[
                  { label: 'Run Rate', value: dailyRunRate > 0 ? `₹${Math.round(dailyRunRate).toLocaleString('en-IN')}/day` : '--' },
                  { label: 'Cost/kg', value: costPerKg > 0 ? `₹${costPerKg.toLocaleString('en-IN')}` : '--' },
                  { label: 'FCR', value: feedFCR },
                ].map((m, i) => (
                  <div key={i} className="text-center">
                    <p className="text-sm font-black text-white leading-none">{m.value}</p>
                    <p className="text-[6px] font-black text-amber-200/40 uppercase tracking-widest mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* No data hint */}
              {totalSpend === 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <AlertTriangle size={11} className="text-amber-400" />
                  <p className="text-[8px] font-bold text-amber-300/60">No expenses logged yet. Tap + to add.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Category Cards Grid ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>
              Cost Breakdown
            </p>
            {selectedCat && (
              <button onClick={() => setSelectedCat(null)}
                className={cn('text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg',
                  isDark ? 'bg-white/8 text-white/50' : 'bg-slate-100 text-slate-500')}>
                Clear Filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {CATEGORIES.map(cat => (
              <CategoryCard
                key={cat.key}
                cat={cat}
                value={catValues[cat.key] || 0}
                pct={pct(catValues[cat.key] || 0)}
                isDark={isDark}
                isSelected={selectedCat === cat.key}
                onClick={() => setSelectedCat(selectedCat === cat.key ? null : cat.key)}
              />
            ))}
          </div>
        </div>

        {/* ── Visual Bar Comparison ── */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={cn('rounded-[2rem] border p-5', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
          <p className={cn('text-[8px] font-black uppercase tracking-widest mb-4', isDark ? 'text-white/30' : 'text-slate-400')}>
            Spend Distribution
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={CATEGORIES.map(c => ({ name: c.label.split(' ')[0], value: catValues[c.key] || 0, fill: c.fill }))}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <YAxis hide />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 8, fontWeight: 900, fill: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', textTransform: 'uppercase' }}
                  axisLine={false} tickLine={false}
                />
                <CartesianGrid vertical={false} stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' }}
                  content={<PieTooltip />}
                />
                <Bar dataKey="value" radius={[6, 6, 2, 2]} maxBarSize={36}>
                  {CATEGORIES.map((c, i) => <Cell key={i} fill={c.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── Aerator Power Detail Card ── */}
        {aeratorLogs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className={cn('rounded-[2rem] border p-5', isDark ? 'bg-purple-500/5 border-purple-500/15' : 'bg-purple-50 border-purple-100')}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isDark ? 'bg-purple-500/15' : 'bg-purple-100')}>
                <Wind size={15} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
              </div>
              <div>
                <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-purple-400/70' : 'text-purple-600')}>
                  Aerator Power Estimate
                </p>
                <p className={cn('text-sm font-black', isDark ? 'text-white' : 'text-slate-900')}>
                  ₹{aeratorCost.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            {(() => {
              const latest = aeratorLogs[aeratorLogs.length - 1];
              const hp = n(latest?.hp);
              const count = n(latest?.count);
              return (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Count', value: count || '--' },
                    { label: 'HP each', value: hp > 0 ? `${hp} HP` : '--' },
                    { label: 'Total HP', value: count && hp ? `${(count * hp).toFixed(0)} HP` : '--' },
                  ].map((m, i) => (
                    <div key={i} className={cn('p-2.5 rounded-xl text-center border',
                      isDark ? 'bg-purple-500/8 border-purple-500/15' : 'bg-purple-50 border-purple-100')}>
                      <p className={cn('text-sm font-black', isDark ? 'text-purple-300' : 'text-purple-700')}>{m.value}</p>
                      <p className={cn('text-[6.5px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>{m.label}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
            <p className={cn('text-[7px] font-bold mt-2.5', isDark ? 'text-white/25' : 'text-slate-400')}>
              Est: Count &times; HP &times; 0.746kW &times; 20hr/day &times; &#8377;8/unit &times; DOC
            </p>
          </motion.div>
        )}

        {/* ── Pond-wise Breakdown — only when viewing ALL ponds ── */}
        {selectedPondId === 'all' && pondBreakdown.length > 0 && (
          <div>
            <p className={cn('text-[9px] font-black uppercase tracking-widest mb-2.5 px-1', isDark ? 'text-white/30' : 'text-slate-400')}>
              Pond-wise Cost
            </p>
            <div className="space-y-2.5">
              {pondBreakdown.map(({ pond, feedTotal, medTotal, seedTotal, powerTotal, total }) => {
                const maxCat = Math.max(feedTotal, medTotal, seedTotal, powerTotal);
                const maxLabel = maxCat === feedTotal ? 'Feed' : maxCat === medTotal ? 'Medicine' : maxCat === seedTotal ? 'Seed' : 'Power';
                return (
                  <motion.div key={pond.id}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    className={cn('rounded-[1.8rem] border p-4', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'bg-emerald-500/10' : 'bg-emerald-50')}>
                          <Fish size={12} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                        </div>
                        <div>
                          <p className={cn('text-[10px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{pond.name}</p>
                          <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
                            D{calculateDOC(pond.stockingDate)} &bull; {maxLabel} heaviest
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-amber-500">₹{total.toLocaleString('en-IN')}</p>
                    </div>
                    {/* Mini bar breakdown */}
                    <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                      {[
                        { val: feedTotal, fill: '#f59e0b' },
                        { val: medTotal, fill: '#3b82f6' },
                        { val: seedTotal, fill: '#10b981' },
                        { val: powerTotal, fill: '#a855f7' },
                      ].filter(b => b.val > 0).map((b, i) => (
                        <motion.div key={i}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round((b.val / total) * 100)}%` }}
                          transition={{ duration: 0.9, ease: 'easeOut', delay: i * 0.1 }}
                          className="h-full rounded-full" style={{ background: b.fill }} />
                      ))}
                    </div>
                    {/* Legend */}
                    <div className="flex gap-3 mt-2 flex-wrap">
                      {[
                        { label: 'Feed', val: feedTotal, color: '#f59e0b' },
                        { label: 'Med', val: medTotal, color: '#3b82f6' },
                        { label: 'Seed', val: seedTotal, color: '#10b981' },
                        { label: 'Power', val: powerTotal, color: '#a855f7' },
                      ].filter(b => b.val > 0).map((b, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: b.color }} />
                          <span className={cn('text-[7px] font-black', isDark ? 'text-white/30' : 'text-slate-400')}>
                            {b.label} ₹{b.val.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Recent Expense Timeline ── */}
        {(() => {
          // Type filter chips
          const typeFiltered = recentTypeFilter
            ? recentItems.filter(i => i.cat === recentTypeFilter)
            : displayItems;
          // Group by date
          const grouped: Record<string, typeof recentItems> = {};
          typeFiltered.forEach(item => {
            const d = new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            if (!grouped[d]) grouped[d] = [];
            grouped[d].push(item);
          });
          const dates = Object.keys(grouped);
          // Unique cats present
          const presentCats = [...new Set<string>(recentItems.map(i => i.cat))];
          return (
            <div>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>
                  {recentTypeFilter
                    ? `${CATEGORIES.find(c => c.key === recentTypeFilter)?.label} Entries`
                    : selectedCat
                      ? `${CATEGORIES.find(c => c.key === selectedCat)?.label} Entries`
                      : 'Recent Expenses'}
                </p>
                <span className={cn('text-[8px] font-black px-2 py-0.5 rounded-lg',
                  isDark ? 'bg-white/5 text-white/30' : 'bg-slate-100 text-slate-400')}>
                  {typeFiltered.length} items
                </span>
              </div>

              {/* Type filter chips */}
              {presentCats.length > 1 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  <button
                    onClick={() => setRecentTypeFilter(null)}
                    className={cn('px-3 py-1.5 rounded-xl text-[7.5px] font-black uppercase tracking-widest whitespace-nowrap border flex-shrink-0 transition-all',
                      recentTypeFilter === null
                        ? isDark ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' : 'bg-amber-100 border-amber-200 text-amber-700'
                        : isDark ? 'bg-white/5 border-white/8 text-white/35' : 'bg-white border-slate-100 text-slate-400 shadow-sm'
                    )}>
                    All Types
                  </button>
                  {presentCats.map(cat => {
                    const cc = getCatConfig(cat);
                    return (
                      <button key={cat}
                        onClick={() => setRecentTypeFilter(recentTypeFilter === cat ? null : cat)}
                        className={cn('px-3 py-1.5 rounded-xl text-[7.5px] font-black uppercase tracking-widest whitespace-nowrap border flex-shrink-0 transition-all flex items-center gap-1',
                          recentTypeFilter === cat
                            ? isDark ? 'border-white/20 text-white' : 'border-slate-200 text-slate-800 shadow-sm'
                            : isDark ? 'bg-white/5 border-white/8 text-white/35' : 'bg-white border-slate-100 text-slate-400 shadow-sm'
                        )}
                        style={recentTypeFilter === cat ? { borderColor: cc.fill + '55', background: cc.fill + '18', color: cc.fill } : {}}>
                        <cc.icon size={8} style={{ color: cc.fill }} />
                        {cc.label}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className={cn('rounded-[2rem] border overflow-hidden', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                <AnimatePresence>
                  {dates.length > 0 ? dates.map((date, di) => (
                    <div key={date}>
                      {/* Date header */}
                      <div className={cn('flex items-center gap-2 px-4 py-2 border-b',
                        isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100')}>
                        <Calendar size={9} className={isDark ? 'text-white/20' : 'text-slate-300'} />
                        <span className={cn('text-[7.5px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
                          {date}
                        </span>
                        <span className={cn('text-[6.5px] font-black px-1.5 py-0.5 rounded-full ml-auto',
                          isDark ? 'bg-white/5 text-white/20' : 'bg-slate-100 text-slate-400')}>
                          ₹{grouped[date].reduce((a, i) => a + i.amount, 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {/* Items for this date */}
                      {grouped[date].map((item, i) => {
                        const cc = getCatConfig(item.cat);
                        return (
                          <motion.div key={`${di}-${i}`}
                            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className={cn('flex items-center gap-3 px-4 py-3 border-b last:border-0',
                              isDark ? 'border-white/5' : 'border-slate-50')}>
                            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', cc.bg)}>
                              <cc.icon size={13} style={{ color: cc.fill }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-[10px] font-black tracking-tight truncate', isDark ? 'text-white/80' : 'text-slate-800')}>
                                {item.label}
                              </p>
                              {item.notes && (
                                <p className={cn('text-[7px] font-medium mt-0.5 truncate', isDark ? 'text-white/25' : 'text-slate-400')}>
                                  {item.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-black" style={{ color: cc.fill }}>
                                ₹{item.amount.toLocaleString('en-IN')}
                              </p>
                              <span className={cn('text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full', cc.bg)}
                                style={{ color: cc.fill }}>
                                {cc.label}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )) : (
                    <div className="py-10 text-center">
                      <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-300')}>
                        No entries found
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
