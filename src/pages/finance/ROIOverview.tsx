import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ReferenceLine,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Plus,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

// ─── Entry Card ────────────────────────────────────────────────────────────────
const EntryCard = ({ entry, onClick, isDark }: { entry: any; onClick: () => void; isDark: boolean; key?: React.Key }) => {
  const roi = entry.roi ?? 0;
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-[2rem] border p-4 transition-all',
        isDark ? 'bg-[#0D1520] border-white/5 hover:border-white/10' : 'bg-white border-slate-100 shadow-sm hover:border-[#C78200]/20'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[#C78200] text-[7px] font-black uppercase tracking-widest">{entry.harvestDate}</p>
          <p className={cn('font-black text-sm tracking-tight mt-0.5', isDark ? 'text-white' : 'text-slate-900')}>
            {entry.buyerName || 'Harvest Cycle'}{entry.countPerKg ? ` · ${entry.countPerKg}/kg` : ''}
          </p>
        </div>
        <span className={cn(
          'px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest flex-shrink-0',
          roi >= 40 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
          roi >= 0  ? 'bg-amber-50 border-amber-200 text-amber-600' :
                      'bg-red-50 border-red-200 text-red-600'
        )}>
          {roi.toFixed(1)}% ROI
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Invested',  value: `₹${(entry.totalInvested / 100000).toFixed(1)}L`, color: isDark ? 'text-white' : 'text-slate-700' },
          { label: 'Revenue',   value: `₹${(entry.totalRevenue / 100000).toFixed(1)}L`,  color: 'text-emerald-600' },
          { label: 'Net',       value: `${entry.netProfit >= 0 ? '+' : ''}₹${(entry.netProfit / 100000).toFixed(1)}L`, color: entry.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500' },
        ].map((m, i) => (
          <div key={i}>
            <p className={cn('text-[7px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>{m.label}</p>
            <p className={cn('font-black text-sm tracking-tight', m.color)}>{m.value}</p>
          </div>
        ))}
      </div>
    </motion.button>
  );
};

// ─── Entry Detail Sheet ────────────────────────────────────────────────────────
const EntryDetailSheet = ({ entry, onClose, isDark }: { entry: any; onClose: () => void; isDark: boolean }) => {
  const roi = entry.roi ?? 0;
  const categories = [
    { label: 'Seed / PLs',  value: entry.seedCost || 0,     color: 'bg-blue-400' },
    { label: 'Feed',         value: entry.feedCost || 0,     color: 'bg-emerald-500' },
    { label: 'Medicine',     value: entry.medicineCost || 0, color: 'bg-amber-400' },
    { label: 'Labor',        value: entry.laborCost || 0,    color: 'bg-purple-400' },
    { label: 'Other',        value: entry.otherCost || 0,    color: 'bg-slate-400' },
  ];
  const total = categories.reduce((a, c) => a + c.value, 0) || 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className={cn('relative w-full max-w-md rounded-t-[2.5rem] p-5 shadow-2xl max-h-[85vh] overflow-y-auto',
          isDark ? 'bg-[#0D1520] border-t border-white/10' : 'bg-white'
        )}
      >
        <div className={cn('w-12 h-1 rounded-full mx-auto mb-4', isDark ? 'bg-white/15' : 'bg-slate-300')} />

        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[#C78200] text-[7px] font-black uppercase tracking-widest">{entry.harvestDate}</p>
            <h2 className={cn('text-xl font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              {entry.buyerName || 'Harvest Cycle'}
            </h2>
          </div>
          <span className={cn(
            'px-3 py-1.5 rounded-xl border text-[10px] font-black',
            roi >= 40 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
            roi >= 0  ? 'bg-amber-50 border-amber-200 text-amber-600' :
                        'bg-red-50 border-red-200 text-red-600'
          )}>
            {roi.toFixed(1)}% ROI
          </span>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Invested', value: `₹${(entry.totalInvested / 100000).toFixed(2)}L` },
            { label: 'Revenue',  value: `₹${(entry.totalRevenue / 100000).toFixed(2)}L` },
            { label: 'Net',      value: `${entry.netProfit >= 0 ? '+' : ''}₹${(entry.netProfit / 100000).toFixed(2)}L` },
          ].map((m, i) => (
            <div key={i} className={cn('rounded-2xl p-3 border text-center',
              isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
            )}>
              <p className={cn('text-[6px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/25' : 'text-slate-400')}>{m.label}</p>
              <p className={cn('text-sm font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Cost breakdown bars */}
        <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/20' : 'text-slate-400')}>Cost Breakdown</p>
        <div className="space-y-2 mb-4">
          {categories.filter(c => c.value > 0).map((c, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <p className={cn('text-[9px] font-black', isDark ? 'text-white/60' : 'text-slate-600')}>{c.label}</p>
                <p className={cn('text-[9px] font-black', isDark ? 'text-white' : 'text-slate-900')}>₹{c.value.toLocaleString()}</p>
              </div>
              <div className={cn('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-slate-100')}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(c.value / total) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className={cn('h-full rounded-full', c.color)} />
              </div>
            </div>
          ))}
        </div>

        {/* Extra info */}
        {entry.countPerKg && (
          <div className="flex gap-2 flex-wrap mb-4">
            {[
              { label: 'Count', value: `${entry.countPerKg}/kg` },
              { label: 'Biomass', value: entry.biomassKg ? `${entry.biomassKg} kg` : 'N/A' },
              { label: 'Rate', value: entry.pricePerKg ? `₹${entry.pricePerKg}/kg` : 'N/A' },
            ].map((m, i) => (
              <div key={i} className={cn('px-3 py-2 rounded-xl border text-center',
                isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
              )}>
                <p className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>{m.label}</p>
                <p className={cn('text-[10px] font-black mt-0.5', isDark ? 'text-white' : 'text-slate-900')}>{m.value}</p>
              </div>
            ))}
          </div>
        )}

        <button onClick={onClose}
          className="w-full py-4 bg-[#C78200] text-white font-black rounded-2xl text-[10px] uppercase tracking-widest">
          Close
        </button>
      </motion.div>
    </div>
  );
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export const ROIOverview = ({ t }: { t: Translations }) => {
  const navigate  = useNavigate();
  const { theme, roiEntries } = useData();
  const isDark    = theme === 'dark' || theme === 'midnight';
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const entries: any[] = useMemo(() => roiEntries || [], [roiEntries]);


  const totalCycles    = entries.length;
  const avgROI         = totalCycles > 0 ? entries.reduce((a, e) => a + (e.roi ?? 0), 0) / totalCycles : 0;
  const totalNetProfit = entries.reduce((a, e) => a + (e.netProfit ?? 0), 0);
  const totalRevenue   = entries.reduce((a, e) => a + (e.totalRevenue ?? 0), 0);
  const bestROI        = totalCycles > 0 ? Math.max(...entries.map(e => e.roi ?? 0)) : 0;

  const chartData = entries.slice(0, 6).reverse().map((e, i) => ({
    cycle: `C${i + 1}`,
    invested: Math.round((e.totalInvested || 0) / 1000),
    revenue:  Math.round((e.totalRevenue || 0) / 1000),
    profit:   Math.round((e.netProfit || 0) / 1000),
    roi:      parseFloat((e.roi ?? 0).toFixed(1)),
  }));

  const tickColor = isDark ? '#ffffff30' : '#00000030';
  const gridColor = isDark ? '#ffffff08' : '#00000008';

  return (
    <div className={cn('min-h-screen pb-32', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title="Overall Performance" showBack />

      <div className="pt-20 px-4 space-y-4">

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Total Cycles',   value: totalCycles,    sub: 'harvest recorded',            color: isDark ? 'text-white' : 'text-slate-900' },
            { label: 'Avg ROI',        value: `${avgROI >= 0 ? '+' : ''}${avgROI.toFixed(1)}%`, sub: 'per cycle', color: avgROI >= 0 ? 'text-emerald-500' : 'text-red-500' },
            { label: 'Net Profit',     value: `${totalNetProfit >= 0 ? '+' : ''}₹${(Math.abs(totalNetProfit)/100000).toFixed(1)}L`, sub: 'total earnings', color: totalNetProfit >= 0 ? 'text-emerald-500' : 'text-red-500' },
            { label: 'Best ROI',       value: `${bestROI.toFixed(1)}%`, sub: 'single cycle peak', color: 'text-[#C78200]' },
          ].map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={cn('rounded-[1.5rem] border px-4 py-3', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
            >
              <p className={cn('text-[7px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/20' : 'text-slate-400')}>{m.label}</p>
              <p className={cn('text-xl font-black tracking-tight', m.color)}>{m.value}</p>
              <p className={cn('text-[7px] font-bold mt-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ROI Trend Chart */}
        {chartData.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className={cn('rounded-[2rem] border px-4 pt-4 pb-3', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
          >
            <p className={cn('text-[7px] font-black uppercase tracking-widest mb-3', isDark ? 'text-white/20' : 'text-slate-400')}>ROI % — Cycle Trend</p>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="4 4" />
                <XAxis dataKey="cycle" tick={{ fontSize: 9, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: tickColor }} axisLine={false} tickLine={false} />
                <ReferenceLine y={0} stroke={isDark ? '#ffffff20' : '#00000015'} strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{ background: isDark ? '#0D1520' : '#fff', border: '1px solid #ccc', borderRadius: 12, fontSize: 10 }}
                  formatter={(v: any) => [`${v}%`, 'ROI']}
                />
                <Line type="monotone" dataKey="roi" stroke="#C78200" strokeWidth={2.5} dot={{ r: 4, fill: '#C78200' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Revenue vs Invested Chart */}
        {chartData.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className={cn('rounded-[2rem] border px-4 pt-4 pb-3', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
          >
            <p className={cn('text-[7px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/20' : 'text-slate-400')}>Revenue vs Invested (₹'000)</p>
            <div className="flex gap-3 mb-3">
              {[{ label: 'Revenue', color: 'bg-emerald-500' }, { label: 'Invested', color: 'bg-blue-400' }].map((l, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={cn('w-2 h-2 rounded-sm', l.color)} />
                  <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>{l.label}</p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barSize={14} barGap={4}>
                <CartesianGrid stroke={gridColor} strokeDasharray="4 4" />
                <XAxis dataKey="cycle" tick={{ fontSize: 9, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: tickColor }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: isDark ? '#0D1520' : '#fff', border: '1px solid #ccc', borderRadius: 12, fontSize: 10 }} />
                <Bar dataKey="revenue"  fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="invested" fill="#60A5FA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Cycle History */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
              Cycle History ({totalCycles})
            </p>
            <button onClick={() => navigate('/roi-entry')}
              className="flex items-center gap-1 text-[#C78200] text-[8px] font-black uppercase tracking-widest">
              <Plus size={11} /> Add
            </button>
          </div>

          {entries.length === 0 ? (
            <div className={cn('rounded-[2rem] border p-8 text-center', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100')}>
              <p className="text-3xl mb-2">📊</p>
              <p className={cn('text-xs font-black', isDark ? 'text-white/30' : 'text-slate-400')}>No entries yet. Add your first harvest cycle ROI.</p>
              <button onClick={() => navigate('/roi-entry')}
                className="mt-4 px-4 py-2 bg-[#C78200] text-white text-[9px] font-black uppercase tracking-widest rounded-xl">
                Add Entry
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {entries.map((entry, i) => (
                <EntryCard entry={entry} isDark={isDark} onClick={() => setSelectedEntry(entry)} key={`entry-${i}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Entry Detail Sheet */}
      <AnimatePresence>
        {selectedEntry && (
          <EntryDetailSheet entry={selectedEntry} isDark={isDark} onClose={() => setSelectedEntry(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
