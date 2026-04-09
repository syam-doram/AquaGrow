import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Fish, TrendingUp, TrendingDown, ChevronRight, BarChart2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

export const ROIPondWise = ({ t }: { t: Translations }) => {
  const navigate  = useNavigate();
  const { ponds, theme, roiEntries } = useData();
  const isDark    = theme === 'dark' || theme === 'midnight';

  const entries: any[] = useMemo(() => roiEntries || [], [roiEntries]);



  const pondStats = useMemo(() => {
    const map = new Map<string, any>();
    entries.forEach(e => {
      if (!e.pondId) return;
      const pondName = ponds.find(p => p.id === e.pondId)?.name || `Pond ${e.pondId.slice(0, 4)}`;
      if (!map.has(e.pondId)) {
        map.set(e.pondId, {
          id: e.pondId, name: pondName, cycles: 0,
          revenue: 0, profit: 0, invested: 0,
        });
      }
      const d = map.get(e.pondId)!;
      d.cycles++;
      d.revenue  += (e.totalRevenue || 0);
      d.profit   += (e.netProfit || 0);
      d.invested += (e.totalInvested || 0);
    });
    return Array.from(map.values()).map(p => ({
      ...p,
      avgROI: p.invested > 0 ? (p.profit / p.invested) * 100 : 0,
    })).sort((a, b) => b.profit - a.profit);
  }, [entries, ponds]);

  const chartData = pondStats.map(p => ({
    name:     p.name.length > 8 ? p.name.slice(0, 8) + '…' : p.name,
    roi:      parseFloat(p.avgROI.toFixed(1)),
    profit:   Math.round(p.profit / 1000),
  }));

  const COLORS = ['#10B981', '#60A5FA', '#F59E0B', '#A78BFA', '#EC4899', '#34D399'];
  const tickColor = isDark ? '#ffffff30' : '#00000030';
  const gridColor = isDark ? '#ffffff08' : '#00000008';

  return (
    <div className={cn('min-h-screen pb-32', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title="Pond-wise Analysis" showBack />

      <div className="pt-20 px-4 space-y-4">

        {/* ROI Chart */}
        {chartData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={cn('rounded-[2rem] border px-4 pt-4 pb-3', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
          >
            <p className={cn('text-[7px] font-black uppercase tracking-widest mb-3', isDark ? 'text-white/20' : 'text-slate-400')}>
              Average ROI % by Pond
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barSize={28}>
                <CartesianGrid stroke={gridColor} strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: tickColor }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ background: isDark ? '#0D1520' : '#fff', border: '1px solid #ccc', borderRadius: 12, fontSize: 10 }}
                  formatter={(v: any) => [`${v}%`, 'Avg ROI']}
                />
                <Bar dataKey="roi" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Pond Cards */}
        <div>
          <p className={cn('text-[7px] font-black uppercase tracking-widest mb-3 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
            Individual Ponds
          </p>

          {pondStats.length === 0 ? (
            <div className={cn('rounded-[2rem] border p-8 text-center', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100')}>
              <p className="text-3xl mb-2">🐟</p>
              <p className={cn('text-xs font-black', isDark ? 'text-white/30' : 'text-slate-400')}>
                No pond-wise data yet. Add ROI entries with pond assignment.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pondStats.map((p, i) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={cn('rounded-[2rem] border p-4', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{ background: COLORS[i % COLORS.length] + '20', border: `1.5px solid ${COLORS[i % COLORS.length]}40` }}>
                        <Fish size={15} style={{ color: COLORS[i % COLORS.length] }} />
                      </div>
                      <div>
                        <p className={cn('text-sm font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{p.name}</p>
                        <p className={cn('text-[8px] font-bold', isDark ? 'text-white/30' : 'text-slate-400')}>
                          {p.cycles} cycle{p.cycles !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      'px-2.5 py-1 rounded-xl border text-[9px] font-black',
                      p.avgROI >= 30 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                      p.avgROI >= 0  ? 'bg-amber-50 border-amber-200 text-amber-600' :
                                       'bg-red-50 border-red-200 text-red-600'
                    )}>
                      {p.avgROI >= 0 ? '+' : ''}{p.avgROI.toFixed(1)}% ROI
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Revenue',  value: `₹${(p.revenue / 100000).toFixed(1)}L`,  color: 'text-emerald-600' },
                      { label: 'Invested', value: `₹${(p.invested / 100000).toFixed(1)}L`, color: isDark ? 'text-white' : 'text-slate-700' },
                      { label: 'Net',      value: `${p.profit >= 0 ? '+' : ''}₹${(p.profit / 100000).toFixed(1)}L`, color: p.profit >= 0 ? 'text-emerald-600' : 'text-red-500' },
                    ].map((m, j) => (
                      <div key={j} className={cn('rounded-xl px-3 py-2 border', isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-100')}>
                        <p className={cn('text-[6px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>{m.label}</p>
                        <p className={cn('text-xs font-black tracking-tight', m.color)}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* ROI bar */}
                  <div className="mt-3">
                    <div className={cn('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-slate-100')}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, p.avgROI))}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                        className="h-full rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                    </div>
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
