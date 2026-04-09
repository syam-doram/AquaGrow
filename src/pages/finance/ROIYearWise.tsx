import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

export const ROIYearWise = ({ t }: { t: Translations }) => {
  const { theme } = useData();
  const isDark    = theme === 'dark' || theme === 'midnight';

  const entries: any[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('roi_entries') || '[]'); }
    catch { return []; }
  }, []);

  const yearStats = useMemo(() => {
    const map = new Map<string, any>();
    entries.forEach(e => {
      const year = e.harvestDate
        ? new Date(e.harvestDate).getFullYear().toString()
        : new Date().getFullYear().toString();
      if (!map.has(year)) map.set(year, { year, revenue: 0, profit: 0, invested: 0, cycles: 0 });
      const d = map.get(year)!;
      d.revenue  += (e.totalRevenue || 0);
      d.profit   += (e.netProfit || 0);
      d.invested += (e.totalInvested || 0);
      d.cycles++;
    });
    return Array.from(map.values())
      .sort((a, b) => parseInt(a.year) - parseInt(b.year))
      .map(y => ({
        ...y,
        avgROI: y.invested > 0 ? (y.profit / y.invested) * 100 : 0,
        dispRev:  Math.round(y.revenue  / 100000),
        dispProf: Math.round(y.profit   / 100000),
        dispInv:  Math.round(y.invested / 100000),
      }));
  }, [entries]);

  const tickColor = isDark ? '#ffffff30' : '#00000030';
  const gridColor = isDark ? '#ffffff08' : '#00000008';
  const COLORS    = ['#10B981', '#60A5FA', '#F59E0B', '#A78BFA'];

  const totalRevAll  = yearStats.reduce((a, y) => a + y.revenue, 0);
  const totalProfAll = yearStats.reduce((a, y) => a + y.profit, 0);
  const bestYear     = yearStats.reduce<any>((best, y) => (!best || y.profit > best.profit ? y : best), null);

  return (
    <div className={cn('min-h-screen pb-32', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title="Year-wise Summary" showBack />

      <div className="pt-20 px-4 space-y-4">

        {/* Top stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Revenue', value: `₹${(totalRevAll / 100000).toFixed(1)}L`, color: 'text-emerald-500' },
            { label: 'Total Profit',  value: `${totalProfAll >= 0 ? '+' : ''}₹${(Math.abs(totalProfAll) / 100000).toFixed(1)}L`, color: totalProfAll >= 0 ? 'text-emerald-500' : 'text-red-500' },
            { label: 'Best Year',     value: bestYear?.year ?? '—', color: 'text-[#C78200]' },
          ].map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={cn('rounded-[1.5rem] border px-3 py-3', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
            >
              <p className={cn('text-[6px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/20' : 'text-slate-400')}>{m.label}</p>
              <p className={cn('text-lg font-black tracking-tight', m.color)}>{m.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Revenue bar chart */}
        {yearStats.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className={cn('rounded-[2rem] border px-4 pt-4 pb-3', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
          >
            <p className={cn('text-[7px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/20' : 'text-slate-400')}>
              Annual Revenue (₹ Lakh)
            </p>
            <div className="flex gap-3 mb-3">
              {[{ label: 'Revenue', color: 'bg-emerald-500' }, { label: 'Invested', color: 'bg-blue-400' }].map((l, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={cn('w-2 h-2 rounded-sm', l.color)} />
                  <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>{l.label}</p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={yearStats} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barSize={22} barGap={4}>
                <CartesianGrid stroke={gridColor} strokeDasharray="4 4" />
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: tickColor }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: isDark ? '#0D1520' : '#fff', border: '1px solid #ccc', borderRadius: 12, fontSize: 10 }}
                  formatter={(v: any, name: any) => [`₹${v}L`, name === 'dispRev' ? 'Revenue' : 'Invested']} />
                <Bar dataKey="dispRev" fill="#10B981" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="dispInv" fill="#60A5FA" radius={[4, 4, 0, 0]} name="Invested" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Year cards */}
        <div>
          <p className={cn('text-[7px] font-black uppercase tracking-widest mb-3 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
            Year-wise Details
          </p>

          {yearStats.length === 0 ? (
            <div className={cn('rounded-[2rem] border p-8 text-center', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100')}>
              <p className="text-3xl mb-2">📅</p>
              <p className={cn('text-xs font-black', isDark ? 'text-white/30' : 'text-slate-400')}>
                No year data yet. Add ROI entries with harvest dates.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {[...yearStats].reverse().map((y, i) => (
                <motion.div key={y.year}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className={cn('rounded-[2rem] border p-4', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
                >
                  {/* Year header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{ background: COLORS[i % COLORS.length] + '20', border: `1.5px solid ${COLORS[i % COLORS.length]}40` }}>
                        <Calendar size={15} style={{ color: COLORS[i % COLORS.length] }} />
                      </div>
                      <div>
                        <p className={cn('text-base font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{y.year}</p>
                        <p className={cn('text-[8px] font-bold', isDark ? 'text-white/30' : 'text-slate-400')}>
                          {y.cycles} harvest cycle{y.cycles !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      'px-2.5 py-1 rounded-xl border text-[9px] font-black',
                      y.avgROI >= 30 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                      y.avgROI >= 0  ? 'bg-amber-50 border-amber-200 text-amber-600' :
                                       'bg-red-50 border-red-200 text-red-600'
                    )}>
                      {y.avgROI >= 0 ? '+' : ''}{y.avgROI.toFixed(1)}% ROI
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: 'Revenue',  value: `₹${y.dispRev}L`,  color: 'text-emerald-600' },
                      { label: 'Invested', value: `₹${y.dispInv}L`,  color: isDark ? 'text-white' : 'text-slate-700' },
                      { label: 'Profit',   value: `${y.profit >= 0 ? '+' : ''}₹${y.dispProf}L`, color: y.profit >= 0 ? 'text-emerald-600' : 'text-red-500' },
                    ].map((m, j) => (
                      <div key={j} className={cn('rounded-xl px-3 py-2 border', isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-100')}>
                        <p className={cn('text-[6px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>{m.label}</p>
                        <p className={cn('text-xs font-black tracking-tight', m.color)}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Revenue progress bar */}
                  <div>
                    <div className={cn('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-slate-100')}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${totalRevAll > 0 ? (y.revenue / totalRevAll) * 100 : 0}%` }}
                        transition={{ duration: 0.8, delay: i * 0.06 }}
                        className="h-full rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                    </div>
                    <p className={cn('text-[6px] font-black uppercase tracking-widest mt-1', isDark ? 'text-white/15' : 'text-slate-300')}>
                      {totalRevAll > 0 ? ((y.revenue / totalRevAll) * 100).toFixed(0) : 0}% of total revenue
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
