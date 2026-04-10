import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  IndianRupee, TrendingUp, TrendingDown, Plus, Calendar,
  ArrowUpRight, ArrowDownRight, Filter, CheckCircle2, X,
  Download, Package,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';

const currency = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(2)}L` :
  v >= 1000   ? `₹${(v / 1000).toFixed(1)}K` : `₹${Math.round(v)}`;

const INITIAL_LEDGER = [
  { id: 'TXN-1010', type: 'credit', desc: 'Order ORD-1038 — Venkat Reddy',   amount: 45000, date: '2026-04-05', status: 'settled',  category: 'seed',     mode: 'UPI'  },
  { id: 'TXN-1009', type: 'credit', desc: 'Order ORD-1037 — Narayana Rao',   amount: 4250,  date: '2026-04-03', status: 'settled',  category: 'feed',     mode: 'Bank' },
  { id: 'TXN-1008', type: 'debit',  desc: 'Seed Stock Restock — 5L PLs',     amount: 18000, date: '2026-04-02', status: 'settled',  category: 'purchase', mode: 'Bank' },
  { id: 'TXN-1007', type: 'credit', desc: 'Order ORD-1036 — Ramesh Rao',     amount: 11500, date: '2026-03-30', status: 'settled',  category: 'seed',     mode: 'UPI'  },
  { id: 'TXN-1006', type: 'debit',  desc: 'Delivery Logistics Cost',         amount: 2400,  date: '2026-03-29', status: 'settled',  category: 'expense',  mode: 'Cash' },
  { id: 'TXN-1005', type: 'credit', desc: 'Order ORD-1039 — Lakshmi Devi',  amount: 2250,  date: '2026-04-07', status: 'pending',  category: 'medicine', mode: 'UPI'  },
  { id: 'TXN-1004', type: 'credit', desc: 'Order ORD-1040 — Suresh Rao',    amount: 8500,  date: '2026-04-08', status: 'pending',  category: 'feed',     mode: 'UPI'  },
  { id: 'TXN-1003', type: 'credit', desc: 'Order ORD-1041 — Ravi Kumar',    amount: 22500, date: '2026-04-09', status: 'pending',  category: 'seed',     mode: 'COD'  },
];

export const ProviderLedger = ({ t }: { t: any }) => {
  const { theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [entries, setEntries] = useState(INITIAL_LEDGER);
  const [activeFilter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'credit', desc: '', amount: '', date: new Date().toISOString().slice(0, 10), mode: 'UPI', category: 'seed' });
  const s = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const filtered = useMemo(() =>
    activeFilter === 'all' ? entries : entries.filter(e => e.type === activeFilter),
    [entries, activeFilter]);

  const totalCredit  = entries.filter(e => e.type === 'credit').reduce((a, e) => a + e.amount, 0);
  const totalDebit   = entries.filter(e => e.type === 'debit').reduce((a, e) => a + e.amount, 0);
  const netBalance   = totalCredit - totalDebit;
  const pendingAmt   = entries.filter(e => e.status === 'pending' && e.type === 'credit').reduce((a, e) => a + e.amount, 0);

  const markSettled = (id: string) => setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'settled' } : e));

  const saveEntry = () => {
    if (!form.desc || !form.amount) return;
    setEntries(prev => [{
      id: `TXN-${Date.now()}`, type: form.type as any, desc: form.desc, amount: parseFloat(form.amount),
      date: form.date, status: 'pending', category: form.category, mode: form.mode,
    }, ...prev]);
    setShowAdd(false);
  };

  // Group by date
  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    filtered.forEach(e => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e); });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  return (
    <div className={cn('min-h-screen pb-40', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title="Financial Ledger" showBack
        rightElement={
          <button onClick={() => setShowAdd(true)}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isDark ? 'bg-blue-500/12 text-blue-400' : 'bg-blue-50 text-blue-600 shadow-sm')}>
            <Plus size={16} />
          </button>
        }
      />

      <div className="pt-20 px-4 max-w-[420px] mx-auto space-y-4">

        {/* Net balance hero */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[2.5rem] overflow-hidden relative shadow-xl"
          style={{ background: netBalance >= 0 ? 'linear-gradient(135deg, #064E3B, #059669)' : 'linear-gradient(135deg, #450a0a, #b91c1c)' }}>
          <div className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
          <div className="relative z-10 p-5">
            <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Net Balance</p>
            <p className="text-4xl font-black text-white tracking-tighter">{currency(Math.abs(netBalance))}</p>
            <p className={cn('text-[8px] font-bold text-white/40 mt-0.5', netBalance < 0 ? 'text-red-300' : '')}>
              {netBalance >= 0 ? 'Surplus' : 'Deficit'}
            </p>
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
              {[
                { label: 'Total Received',  value: currency(totalCredit),  color: 'text-emerald-300' },
                { label: 'Total Paid Out',  value: currency(totalDebit),   color: 'text-red-300' },
                { label: 'Pending Inflow',  value: currency(pendingAmt),   color: 'text-amber-300' },
              ].map((m, i) => (
                <div key={i} className="text-center">
                  <p className="text-[6px] font-black text-white/25 uppercase tracking-widest">{m.label}</p>
                  <p className={cn('font-black text-[11px] mt-0.5', m.color)}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Pending receipts banner */}
        {pendingAmt > 0 && (
          <div className={cn('rounded-2xl border p-3 flex items-center gap-2', isDark ? 'bg-amber-500/8 border-amber-500/15' : 'bg-amber-50 border-amber-200')}>
            <IndianRupee size={13} className="text-amber-500" />
            <p className={cn('text-[8px] font-black flex-1', isDark ? 'text-amber-400' : 'text-amber-700')}>
              {currency(pendingAmt)} pending from {entries.filter(e => e.status === 'pending' && e.type === 'credit').length} orders — mark as received when collected
            </p>
          </div>
        )}

        {/* Type filter */}
        <div className={cn('flex p-1 rounded-2xl border gap-1', isDark ? 'bg-white/5 border-white/8' : 'bg-white border-slate-200 shadow-sm')}>
          {(['all', 'credit', 'debit'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all',
                activeFilter === f
                  ? f === 'credit' ? 'bg-emerald-500 text-white shadow-md'
                    : f === 'debit' ? 'bg-red-500 text-white shadow-md'
                    : isDark ? 'bg-white/10 text-white' : 'bg-slate-800 text-white shadow-md'
                  : isDark ? 'text-white/30' : 'text-slate-400')}>
              {f === 'all' ? 'All' : f === 'credit' ? '↑ Inflow' : '↓ Outflow'}
            </button>
          ))}
        </div>

        {/* Date-grouped ledger */}
        {grouped.map(([date, items]) => (
          <div key={date}>
            <div className="flex items-center gap-2 px-1 mb-2">
              <p className={cn('text-[7.5px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
                {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <div className={cn('flex-1 h-px', isDark ? 'bg-white/5' : 'bg-slate-100')} />
              <p className={cn('text-[7.5px] font-black', isDark ? 'text-white/20' : 'text-slate-400')}>
                {currency(items.reduce((a, e) => a + (e.type === 'credit' ? e.amount : -e.amount), 0))}
              </p>
            </div>
            <div className="space-y-2 mb-4">
              {items.map((entry, i) => (
                <motion.div key={entry.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={cn('rounded-[1.8rem] border p-4 flex items-center gap-3',
                    isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                  <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
                    entry.type === 'credit'
                      ? isDark ? 'bg-emerald-500/12' : 'bg-emerald-50'
                      : isDark ? 'bg-red-500/12' : 'bg-red-50')}>
                    {entry.type === 'credit'
                      ? <ArrowUpRight size={16} className="text-emerald-500" />
                      : <ArrowDownRight size={16} className="text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-[9px] font-black truncate', isDark ? 'text-white/80' : 'text-slate-800')}>{entry.desc}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn('text-[6.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full',
                        entry.status === 'settled'
                          ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                          : isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')}>
                        {entry.status}
                      </span>
                      <p className={cn('text-[6.5px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>{entry.mode}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn('font-black text-[11px]', entry.type === 'credit' ? 'text-emerald-500' : 'text-red-500')}>
                      {entry.type === 'credit' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                    </p>
                    {entry.status === 'pending' && entry.type === 'credit' && (
                      <button onClick={() => markSettled(entry.id)}
                        className="text-[6.5px] font-black uppercase tracking-widest text-emerald-500 mt-0.5">
                        Mark Received
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add entry modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAdd(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={cn('relative w-full max-w-[420px] rounded-t-[2.5rem] p-5 space-y-3 shadow-2xl',
                isDark ? 'bg-[#0A1520] border-t border-white/8' : 'bg-white')}>
              <div className={cn('w-10 h-1 rounded-full mx-auto mb-2', isDark ? 'bg-white/15' : 'bg-slate-200')} />
              <h3 className={cn('text-base font-black', isDark ? 'text-white' : 'text-slate-900')}>Log Transaction</h3>

              {/* Credit / Debit toggle */}
              <div className={cn('flex p-1 rounded-2xl border gap-1', isDark ? 'bg-white/5 border-white/8' : 'bg-slate-50 border-slate-200')}>
                {['credit', 'debit'].map(ty => (
                  <button key={ty} onClick={() => s('type')(ty)}
                    className={cn('flex-1 py-2.5 rounded-xl text-[8.5px] font-black uppercase tracking-widest transition-all',
                      form.type === ty
                        ? ty === 'credit' ? 'bg-emerald-500 text-white shadow-md' : 'bg-red-500 text-white shadow-md'
                        : isDark ? 'text-white/30' : 'text-slate-400')}>
                    {ty === 'credit' ? '↑ Received' : '↓ Paid Out'}
                  </button>
                ))}
              </div>

              {[
                { label: 'Description', key: 'desc' as const, placeholder: 'E.g. Settlement for ORD-1041' },
                { label: 'Amount (₹)',  key: 'amount' as const, placeholder: '22500', type: 'number' },
                { label: 'Date',        key: 'date' as const, type: 'date' },
                { label: 'Mode',        key: 'mode' as const, placeholder: 'UPI / Bank / Cash / COD' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className={cn('text-[7.5px] font-black uppercase tracking-widest px-1', form.type === 'credit' ? 'text-emerald-500' : 'text-red-500')}>{f.label}</label>
                  <input value={form[f.key]} onChange={e => s(f.key)(e.target.value)} placeholder={f.placeholder} type={f.type || 'text'}
                    className={cn('w-full rounded-[1.2rem] px-4 py-3 text-[12px] font-semibold outline-none border transition-all',
                      isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/15' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-blue-400 focus:bg-white')} />
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAdd(false)}
                  className={cn('flex-1 py-3.5 rounded-2xl text-[8.5px] font-black uppercase tracking-widest border', isDark ? 'bg-white/5 border-white/8 text-white/30' : 'bg-slate-50 border-slate-200 text-slate-400')}>
                  Cancel
                </button>
                <button onClick={saveEntry} disabled={!form.desc || !form.amount}
                  className={cn('flex-1 py-3.5 rounded-2xl text-[8.5px] font-black uppercase tracking-widest text-white shadow-lg disabled:opacity-40',
                    form.type === 'credit' ? 'bg-emerald-500' : 'bg-red-500')}>
                  Log Entry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
