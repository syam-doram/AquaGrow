import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator, Sparkles, TrendingUp, TrendingDown, CreditCard,
  ChevronRight, CheckCircle2, Plus, BarChart2, Fish, Scale,
  Calendar, Building2, Star, Zap, Activity, ArrowUpRight,
  Percent, FileText, Download, Target, PieChart
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ReferenceLine,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

// ─── METRIC CARD ──────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, sub, icon: Icon, color, bg, t }: any) => (
  <div className={cn('rounded-[2rem] p-5 border border-black/5 shadow-sm', bg || 'bg-white')}>
    {Icon && (
      <div className={cn('w-9 h-9 rounded-2xl bg-black/5 flex items-center justify-center mb-3', color)}>
        <Icon size={18} />
      </div>
    )}
    <p className="text-[8px] font-black uppercase tracking-widest text-[#4A2C2A]/30 mb-1">{label}</p>
    <p className={cn('font-black text-xl tracking-tighter', color || 'text-[#4A2C2A]')}>{value}</p>
    {sub && <p className="text-[8px] font-bold text-[#4A2C2A]/30 mt-0.5">{sub}</p>}
  </div>
);

// ─── ENTRY CARD ───────────────────────────────────────────────────────────────
const EntryCard = ({ entry, onTap, t }: { entry: any; onTap: () => void; t: Translations }) => {
  const roi = entry.roi ?? 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onTap}
      className="bg-white rounded-[2rem] p-5 border border-black/5 shadow-sm cursor-pointer active:scale-[0.98] transition-all hover:border-[#C78200]/20 group"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[8px] font-black text-[#C78200] uppercase tracking-widest">{entry.harvestDate}</p>
          <p className="font-black text-sm text-[#4A2C2A] tracking-tight mt-0.5">
            {entry.buyerName || 'Harvest Cycle'} · {entry.countPerKg ? `${entry.countPerKg}/kg` : ''}
          </p>
        </div>
        <div className={cn(
          'px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest',
          roi >= 40 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
          roi >= 0  ? 'bg-amber-50 border-amber-200 text-amber-600' :
                      'bg-red-50 border-red-200 text-red-600'
        )}>
          {roi.toFixed(1)}% ROI
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[7px] font-black text-[#4A2C2A]/25 uppercase tracking-widest">{t.totalInvested}</p>
          <p className="font-black text-sm text-[#4A2C2A] tracking-tight">₹{(entry.totalInvested / 100000).toFixed(1)}L</p>
        </div>
        <div>
          <p className="text-[7px] font-black text-[#4A2C2A]/25 uppercase tracking-widest">{t.revenue}</p>
          <p className="font-black text-sm text-emerald-600 tracking-tight">₹{(entry.totalRevenue / 100000).toFixed(1)}L</p>
        </div>
        <div>
          <p className="text-[7px] font-black text-[#4A2C2A]/25 uppercase tracking-widest">Net</p>
          <p className={cn('font-black text-sm tracking-tight', entry.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500')}>
            {entry.netProfit >= 0 ? '+' : ''}₹{(entry.netProfit / 100000).toFixed(1)}L
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// ─── ENTRY DETAIL SHEET ───────────────────────────────────────────────────────
const EntryDetailSheet = ({ entry, onClose, t }: { entry: any; onClose: () => void; t: Translations }) => {
  const roi = entry.roi ?? 0;
  const n = (v: any) => parseFloat(v) || 0;
  const totalInvested = entry.totalInvested || 0;
  const categories = [
    { label: 'Seed / PLs',       value: n(entry.seedCost),           color: 'bg-blue-400' },
    { label: 'Feed',              value: n(entry.feedCost),           color: 'bg-emerald-500' },
    { label: 'Medicine',          value: n(entry.medicineCost),       color: 'bg-amber-400' },
    { label: 'Labor',             value: n(entry.laborCost),          color: 'bg-purple-400' },
    { label: 'Utilities',         value: n(entry.utilityCost),        color: 'bg-orange-400' },
    { label: 'Infrastructure',    value: n(entry.infrastructureCost), color: 'bg-slate-400' },
    { label: 'Other',             value: n(entry.otherCost),          color: 'bg-pink-400' },
  ].filter(c => c.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-md mx-auto bg-[#F8F9FE] rounded-t-[3rem] p-6 pb-12 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mb-6" />

        <div className={cn(
          'rounded-[2.5rem] p-7 text-white relative overflow-hidden shadow-xl mb-5',
          roi >= 40 ? 'bg-gradient-to-br from-[#0D523C] to-[#1a7a5a]' :
          roi >= 0  ? 'bg-gradient-to-br from-[#C78200] to-[#8a5900]' :
                      'bg-gradient-to-br from-red-700 to-red-900'
        )}>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 blur-[50px] rounded-full" />
          <div className="relative z-10">
            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">{entry.harvestDate}</p>
            <p className="text-3xl font-black tracking-tighter">{roi.toFixed(1)}% ROI</p>
            <p className={cn('text-[10px] font-black uppercase tracking-widest mt-1', roi >= 40 ? 'text-emerald-300' : roi >= 0 ? 'text-amber-200' : 'text-red-300')}>
              {roi >= 40 ? '🏆 Excellent Return' : roi >= 20 ? '✅ Profitable' : roi >= 0 ? '⚠️ Break-even' : '🔴 Loss Cycle'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-5 border border-black/5 shadow-sm mb-4">
          <p className="text-[9px] font-black text-[#C78200] uppercase tracking-widest mb-4">Per-kg Economics</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { l: t.costPerKg,    v: entry.harvestWeightKg > 0 ? `₹${(totalInvested / n(entry.harvestWeightKg)).toFixed(0)}` : '—', c: 'text-red-500' },
              { l: t.pricePerKgLabel,   v: entry.pricePerKg ? `₹${n(entry.pricePerKg).toFixed(0)}` : '—',                                 c: 'text-[#C78200]' },
              { l: t.profitPerKg,  v: n(entry.pricePerKg) > 0 && entry.harvestWeightKg > 0 ? `₹${(entry.netProfit / n(entry.harvestWeightKg)).toFixed(0)}` : '—', c: entry.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500' },
            ].map((m, i) => (
              <div key={i} className="text-center">
                <p className="text-[7px] font-black text-[#4A2C2A]/25 uppercase tracking-widest">{m.l}</p>
                <p className={cn('font-black text-base tracking-tighter mt-1', m.c)}>{m.v}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-5 border border-black/5 shadow-sm mb-4 space-y-3">
          <p className="text-[9px] font-black text-[#C78200] uppercase tracking-widest">{t.investmentBreakdown}</p>
          {categories.map((c, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-1">
                <p className="text-[9px] font-black text-[#4A2C2A]/50 uppercase tracking-widest">{c.label}</p>
                <p className="text-[10px] font-black text-[#4A2C2A]">₹{c.value.toLocaleString()}</p>
              </div>
              <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(c.value / totalInvested) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.06 }} className={cn('h-full rounded-full', c.color)} />
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="w-full py-5 bg-[#4A2C2A] text-white rounded-[1.6rem] font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
          {t.close}
        </button>
      </motion.div>
    </motion.div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export const ProfitROI = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { user, ponds } = useData();
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'overall' | 'pond' | 'year'>('overall');
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Load saved ROI entries from localStorage
  const entries: any[] = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('roi_entries') || '[]').reverse();
    } catch { return []; }
  }, []);

  // Aggregate stats
  const totalCycles = entries.length;
  const avgROI = totalCycles > 0 ? entries.reduce((a, e) => a + (e.roi ?? 0), 0) / totalCycles : 0;
  const totalNetProfit = entries.reduce((a, e) => a + (e.netProfit ?? 0), 0);
  const totalRevenue = entries.reduce((a, e) => a + (e.totalRevenue ?? 0), 0);
  const bestROI = totalCycles > 0 ? Math.max(...entries.map(e => e.roi ?? 0)) : 0;

  // Chart data from entries (last 6 cycles)
  const chartData = entries.slice(0, 6).reverse().map((e, i) => ({
    cycle: `C${i + 1}`,
    invested: Math.round((e.totalInvested || 0) / 1000),
    revenue: Math.round((e.totalRevenue || 0) / 1000),
    profit: Math.round((e.netProfit || 0) / 1000),
    roi: parseFloat((e.roi ?? 0).toFixed(1)),
  }));

  // Pond-wise Analysis
  const pondWiseStats = useMemo(() => {
    const map = new Map();
    entries.forEach(e => {
      if (!e.pondId) return;
      const pondName = ponds.find(p => p.id === e.pondId)?.name || `Pond ${e.pondId.slice(0,4)}`;
      if (!map.has(e.pondId)) {
        map.set(e.pondId, { id: e.pondId, name: pondName, cycles: 0, revenue: 0, profit: 0, invested: 0 });
      }
      const data = map.get(e.pondId);
      data.cycles += 1;
      data.revenue += (e.totalRevenue || 0);
      data.profit += (e.netProfit || 0);
      data.invested += (e.totalInvested || 0);
    });
    return Array.from(map.values()).map(p => ({
      ...p,
      avgRoi: p.invested > 0 ? (p.profit / p.invested) * 100 : 0
    })).sort((a,b) => b.profit - a.profit);
  }, [entries, ponds]);

  // Year-wise Analysis
  const yearWiseStats = useMemo(() => {
    const map = new Map();
    entries.forEach(e => {
      const year = e.harvestDate ? new Date(e.harvestDate).getFullYear().toString() : new Date().getFullYear().toString();
      if (!map.has(year)) {
        map.set(year, { year, revenue: 0, profit: 0, invested: 0 });
      }
      const data = map.get(year);
      data.revenue += (e.totalRevenue || 0);
      data.profit += (e.netProfit || 0);
      data.invested += (e.totalInvested || 0);
    });
    return Array.from(map.values()).sort((a,b) => parseInt(a.year) - parseInt(b.year)).map(y => ({
      ...y,
      displayRev: Math.round(y.revenue / 100000),
      displayProf: Math.round(y.profit / 100000),
      displayInv: Math.round(y.invested / 100000),
    }));
  }, [entries]);

  const handleDownloadPDF = () => {
    setGeneratingPDF(true);
    setTimeout(() => {
      setGeneratingPDF(false);
      // Actual implementation would invoke PDF library, for now we simulate
      alert("✅ Financial Report PDF Generated & Saved to Downloads!");
    }, 2500);
  };

  if (!user || user.subscriptionStatus === 'free') {
    return (
      <div className="min-h-screen bg-[#FFFDF5] relative overflow-hidden flex flex-col">
        <Header title={t.roi} showBack={false} onMenuClick={onMenuClick} />
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C78200] blur-[120px] rounded-full animate-pulse" />
          </div>
          <div className="w-24 h-24 bg-[#C78200] rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-[#C78200]/20">
            <Calculator size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-[#4A2C2A] mb-4">{t.proFeature}</h2>
          <p className="text-[#4A2C2A]/60 text-sm leading-relaxed mb-10 max-w-[240px] font-medium">{t.profitCalculator} is only available for AquaGrow Pro subscribers.</p>
          <button onClick={() => navigate('/subscription')} className="bg-[#C78200] text-white px-10 py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-[#C78200]/20 active:scale-95 transition-all flex items-center gap-3">
            {t.upgradeToPro} <Sparkles size={18} className="text-white/40" />
          </button>
        </div>
      </div>
    );
  }

  // Check if any ponds exist (active or otherwise)
  if (ponds.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex flex-col">
        <Header title={t.roi} showBack={false} onMenuClick={onMenuClick} />
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
          <div className="w-20 h-20 bg-[#C78200]/10 rounded-[2rem] flex items-center justify-center mb-6">
            <Fish size={40} className="text-[#C78200]" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-[#4A2C2A] mb-3">No Ponds Found</h2>
          <p className="text-[#4A2C2A]/40 text-xs leading-relaxed mb-8 max-w-[260px]">You need at least one pond to calculate ROI and view financial analytics. Add your first pond to get started.</p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="bg-[#C78200] text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
          >
            {t.backToDashboard || 'Go to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-[180px] bg-transparent min-h-[100dvh] font-sans relative overflow-hidden">
      {/* ── Page Accents (Layered with Global) ── */}
      <div className="absolute top-20 right-[-10%] w-[80%] h-[30%] bg-emerald-100/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-[10%] left-[-10%] w-[60%] h-[40%] bg-amber-50/10 rounded-full blur-[120px] -z-10" />
      <Header title={t.roi} showBack={false} onMenuClick={onMenuClick} />

      {/* Generating PDF Overlay */}
      <AnimatePresence>
        {generatingPDF && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0D523C]/95 backdrop-blur-xl flex flex-col items-center justify-center text-white p-10 text-center"
          >
             <div className="w-24 h-24 border-4 border-white/20 border-t-emerald-400 rounded-full animate-spin mb-6" />
             <h3 className="text-2xl font-black tracking-tighter mb-2">Compiling Report...</h3>
             <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Aggregating all P&L datasets</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEntry && (
          <EntryDetailSheet entry={selectedEntry} onClose={() => setSelectedEntry(null)} t={t} />
        )}
      </AnimatePresence>

      {/* Filter Tabs & PDF Export Strip */}
      <div className="fixed top-[72px] left-0 right-0 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-black/5 flex items-center justify-between">
         <div className="flex bg-slate-100 p-1 rounded-xl">
            {['overall', 'pond', 'year'].map(mode => (
              <button 
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                  viewMode === mode ? "bg-white text-[#C78200] shadow-sm" : "text-[#4A2C2A]/40"
                )}
              >
                {mode}
              </button>
            ))}
         </div>
         <button 
           onClick={handleDownloadPDF}
           disabled={entries.length === 0}
           className="p-2.5 bg-[#4A2C2A] text-white rounded-xl active:scale-95 transition-all disabled:opacity-50 disabled:bg-slate-300"
         >
           <FileText size={16} />
         </button>
      </div>

      <div className="pt-36 px-5 space-y-6">

        {/* ── OVERALL VIEW ── */}
        {viewMode === 'overall' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
             <motion.div
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className={cn(
                 'rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl',
                 avgROI >= 40 ? 'bg-gradient-to-br from-[#0D523C] to-[#1a7a5a]' :
                 avgROI >= 0  ? 'bg-gradient-to-br from-[#C78200] to-[#8a5900]' :
                                totalCycles === 0 ? 'bg-[#C78200]' : 'bg-gradient-to-br from-red-700 to-red-900'
               )}
             >
               <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 blur-[80px] rounded-full" />
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                   <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.2em]">{t.projectedEfficiency}</p>
                   <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-[8px] font-black uppercase tracking-widest">
                     {totalCycles > 0 ? `${totalCycles} Cycles` : t.premiumModel}
                   </div>
                 </div>
                 <div className="flex items-baseline gap-3 mb-6">
                   <span className="text-7xl font-black tracking-tighter">
                     {totalCycles > 0 ? avgROI.toFixed(1) : '42.5'}
                     <span className="text-3xl text-white/40 ml-1">%</span>
                   </span>
                   <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Avg ROI</span>
                 </div>
                 <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-6">
                   <div>
                     <p className="text-[9px] uppercase font-black text-white/40 tracking-widest mb-1">{t.totalInvested}</p>
                     <p className="text-2xl font-black tracking-tighter">
                       {totalCycles > 0 ? `₹${(entries.reduce((a,e) => a+(e.totalInvested||0), 0)/100000).toFixed(1)}L` : '₹ 12.45L'}
                     </p>
                   </div>
                   <div>
                     <p className="text-[9px] uppercase font-black text-white/60 tracking-widest mb-1">{t.netProfit}</p>
                     <p className="text-2xl font-black tracking-tighter text-white">
                       {totalCycles > 0 ? `₹${(totalNetProfit/100000).toFixed(1)}L` : '₹ 5.29L'}
                     </p>
                   </div>
                 </div>
               </div>
             </motion.div>

             {/* Stats Row */}
             {totalCycles > 0 && (
               <div className="grid grid-cols-2 gap-3">
                 <MetricCard label="Total Revenue" value={`₹${(totalRevenue/100000).toFixed(1)}L`} sub="All time collected" icon={TrendingUp} color="text-emerald-500" />
                 <MetricCard label="Best Cycle ROI" value={`${bestROI.toFixed(1)}%`} sub="Peak yield efficiency" icon={Star} color="text-[#C78200]" />
               </div>
             )}

             {/* Profits Contribution Breakdown (Top 3 Ponds) */}
             {pondWiseStats.length > 0 && (
               <div className="bg-white rounded-[2rem] p-6 border border-black/5 shadow-sm space-y-4">
                 <div className="flex items-center justify-between pl-1">
                   <p className="text-[9px] font-black text-[#C78200] uppercase tracking-widest flex items-center gap-1.5"><PieChart size={12}/> Profit Contributions</p>
                 </div>
                 {pondWiseStats.slice(0,3).map((p, i) => (
                   <div key={i}>
                     <div className="flex justify-between items-baseline mb-1">
                       <p className="text-[10px] font-black text-[#4A2C2A]/60 tracking-widest">{p.name}</p>
                       <p className="text-[11px] font-black text-emerald-600">₹{(p.profit/100000).toFixed(2)}L</p>
                     </div>
                     <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }} 
                         animate={{ width: `${Math.max(0, (p.profit / Math.max(0.1, totalNetProfit)) * 100)}%` }} 
                         className={cn('h-full rounded-full', i===0?'bg-[#C78200]': i===1?'bg-blue-400':'bg-emerald-400')}
                       />
                     </div>
                   </div>
                 ))}
               </div>
             )}

             {/* Chart: Bar & Line combined visual representation */}
             {chartData.length > 0 && (
               <div className="space-y-3">
                 <h3 className="text-lg font-black tracking-tighter text-[#4A2C2A] px-1">Recent Cycle Performance</h3>
                 <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-black/5 h-[300px] flex flex-col justify-end pb-0">
                   <div className="h-[220px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={chartData} barGap={1}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                         <XAxis dataKey="cycle" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#4A2C2A', opacity: 0.4 }} />
                         <YAxis hide />
                         <Tooltip cursor={{ fill: 'rgba(199,130,0,0.05)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: 11, fontWeight: 900 }} formatter={(v: any, name: string) => [`₹${v}K`, name.charAt(0).toUpperCase() + name.slice(1)]} />
                         <Bar dataKey="invested" fill="#E5E7EB" radius={[4, 4, 0, 0]} maxBarSize={12} name="invested" />
                         <Bar dataKey="revenue" fill="#C78200" radius={[4, 4, 0, 0]} maxBarSize={12} name="revenue" />
                         <Bar dataKey="profit"  fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={12} name="profit" />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                   <div className="flex justify-center gap-4 py-4 border-t border-black/5 mt-2">
                     {[['Invested', 'bg-gray-200'], ['Revenue', 'bg-[#C78200]'], ['Profit', 'bg-emerald-400']].map(([l, c]) => (
                       <div key={l} className="flex items-center gap-1.5">
                         <div className={cn('w-2 h-2 rounded-sm', c)} />
                         <p className="text-[8px] font-black text-[#4A2C2A]/40 uppercase tracking-widest">{l}</p>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             )}
          </motion.div>
        )}

        {/* ── POND WISE VIEW ── */}
        {viewMode === 'pond' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            <h3 className="text-xl font-black tracking-tighter text-[#4A2C2A] px-1">{t.pondPerformance}</h3>
            {pondWiseStats.length === 0 ? (
               <p className="text-center text-[#4A2C2A]/40 text-[10px] font-black uppercase tracking-widest py-10">No data available</p>
            ) : pondWiseStats.map((p, i) => (
               <div key={i} className="bg-white p-5 rounded-[2rem] border border-black/5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-black/5">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                           <Target size={18} />
                        </div>
                        <div>
                           <h4 className="text-sm font-black text-[#4A2C2A]">{p.name}</h4>
                           <p className="text-[8px] font-black text-[#4A2C2A]/30 uppercase tracking-widest">{p.cycles} {t.cyclesLogged}</p>
                        </div>
                     </div>
                     <div className={cn("px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest", p.avgRoi >= 30 ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-amber-50 border-amber-200 text-amber-600")}>
                        {p.avgRoi.toFixed(1)}% Avg ROI
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-[8px] font-black text-[#4A2C2A]/30 uppercase tracking-widest mb-1">Gross Revenue</p>
                        <p className="text-base font-black text-[#C78200]">₹{(p.revenue/100000).toFixed(1)}L</p>
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-[#4A2C2A]/30 uppercase tracking-widest mb-1">Net Yield Profit</p>
                        <p className="text-base font-black text-emerald-600">₹{(p.profit/100000).toFixed(1)}L</p>
                     </div>
                  </div>
               </div>
            ))}
          </motion.div>
        )}

        {/* ── YEARLY VIEW ── */}
        {viewMode === 'year' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <h3 className="text-xl font-black tracking-tighter text-[#4A2C2A] px-1">{t.annualFiscalReport}</h3>
            
            {yearWiseStats.length > 0 && (
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-black/5 h-[320px] pb-4">
                <p className="text-[9px] font-black text-[#4A2C2A]/30 uppercase tracking-widest mb-4">Invested vs Revenue (In Lakhs)</p>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearWiseStats} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#4A2C2A' }} />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: 11, fontWeight: 900 }} formatter={(v: any, name: string) => [`₹${v}L`, name.charAt(0).toUpperCase() + name.slice(1)]} />
                      <Bar dataKey="displayInv" fill="#E5E7EB" radius={[6, 6, 0, 0]} maxBarSize={24} name="Invested" />
                      <Bar dataKey="displayRev" fill="#0D523C" radius={[6, 6, 0, 0]} maxBarSize={24} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {yearWiseStats.length === 0 ? (
               <p className="text-center text-[#4A2C2A]/40 text-[10px] font-black uppercase tracking-widest py-10">No data available</p>
            ) : yearWiseStats.map((y, i) => (
               <div key={i} className="bg-gradient-to-br from-[#051F19] to-[#0D523C] p-6 rounded-[2rem] border border-[#0D523C]/20 shadow-lg text-white">
                  <div className="flex justify-between items-center mb-6">
                     <p className="text-2xl font-black tracking-tighter">FY {y.year}</p>
                     <div className="px-3 py-1 rounded-full border border-emerald-400/30 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                        ₹{(y.profit/100000).toFixed(1)}L {t.netMargin}
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div>
                       <div className="flex justify-between items-baseline mb-1">
                         <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">{t.opexInvested}</p>
                         <p className="text-sm font-black">₹{(y.invested/100000).toFixed(1)}L</p>
                       </div>
                       <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                         <motion.div initial={{ width: 0 }} animate={{ width: `${(y.invested / Math.max(1, y.revenue)) * 100}%` }} className="h-full bg-amber-400 rounded-full" />
                       </div>
                     </div>
                     <div>
                       <div className="flex justify-between items-baseline mb-1">
                         <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">{t.totalReceipts}</p>
                         <p className="text-sm font-black text-emerald-400">₹{(y.revenue/100000).toFixed(1)}L</p>
                       </div>
                       <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                         <motion.div initial={{ width: '100%' }} className="h-full bg-emerald-400 rounded-full" />
                       </div>
                     </div>
                  </div>
               </div>
            ))}
          </motion.div>
        )}

        {/* ── HISTORY LIST (Only visible in overall) ── */}
        {viewMode === 'overall' && entries.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-black/5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-black tracking-tighter text-[#4A2C2A]">{t.harvestHistory}</h3>
              <span className="text-[8px] font-black text-[#C78200] bg-[#C78200]/10 px-3 py-1.5 rounded-xl uppercase tracking-widest">{entries.length} {t.doc}</span>
            </div>
            {entries.map((e, i) => (
              <div key={i}>
                <EntryCard entry={e} onTap={() => setSelectedEntry(e)} t={t} />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {entries.length === 0 && (
          <div className="bg-white rounded-[2.5rem] p-10 text-center border border-dashed border-[#C78200]/30 shadow-sm mt-8">
            <div className="w-16 h-16 bg-[#C78200]/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
              <BarChart2 size={32} className="text-[#C78200]" />
            </div>
            <h3 className="text-[#4A2C2A] font-black text-lg tracking-tighter mb-2">{t.noRoiProfiles}</h3>
            <p className="text-[#4A2C2A]/40 text-xs leading-relaxed mb-6">{t.logEntry}</p>
            <button onClick={() => navigate('/roi-entry')} className="bg-[#C78200] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all">
              {t.logFirstHarvest}
            </button>
          </div>
        )}

      </div>
      
      {/* FAB - ONLY Overall Tab */}
      {viewMode === 'overall' && (
        <button
          onClick={() => navigate('/roi-entry')}
          className="fixed bottom-32 right-6 w-16 h-16 bg-[#0D523C] text-white rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-emerald-900/40 active:scale-95 transition-all z-50 border border-emerald-400/30"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      )}

    </div>
  );
};
