import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Search, X, Phone, MessageSquare, ChevronRight,
  MapPin, Fish, Wheat, Droplets, TrendingUp, Calendar,
  CheckCircle2, AlertTriangle, Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';

const FARMERS = [
  {
    id: 'f1', name: 'Ravi Kumar',   location: 'Nellore',    phone: '9876543210',
    totalPonds: 4, activePonds: 3, totalOrders: 8, totalSpend: 120000,
    lastOrder: '2026-04-09', status: 'active', categories: ['seed', 'feed'],
    since: '2024-06', notes: 'Prefers SPF L1. Bulk orders once a month.',
  },
  {
    id: 'f2', name: 'Suresh Rao',   location: 'Bhimavaram', phone: '9845012345',
    totalPonds: 2, activePonds: 2, totalOrders: 5, totalSpend: 65000,
    lastOrder: '2026-04-08', status: 'active', categories: ['feed'],
    since: '2025-01', notes: 'Feed only customer. Very prompt with payments.',
  },
  {
    id: 'f3', name: 'Lakshmi Devi', location: 'Kakinada',   phone: '9912344567',
    totalPonds: 3, activePonds: 1, totalOrders: 3, totalSpend: 32000,
    lastOrder: '2026-04-07', status: 'active', categories: ['medicine'],
    since: '2025-03', notes: 'Medicine and probiotic buyer.',
  },
  {
    id: 'f4', name: 'Venkat Reddy', location: 'Guntur',     phone: '9900112233',
    totalPonds: 6, activePonds: 5, totalOrders: 14, totalSpend: 420000,
    lastOrder: '2026-04-05', status: 'active', categories: ['seed', 'feed', 'medicine'],
    since: '2023-08', notes: 'Top customer. Regularly buys seed + feed combo.',
  },
  {
    id: 'f5', name: 'Narayana Rao', location: 'Ongole',     phone: '9988776655',
    totalPonds: 1, activePonds: 0, totalOrders: 2, totalSpend: 15000,
    lastOrder: '2026-04-03', status: 'inactive', categories: ['feed'],
    since: '2025-06', notes: 'Seasonal. Active March–September.',
  },
];

const currency = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` :
  v >= 1000   ? `₹${(v / 1000).toFixed(1)}K` : `₹${Math.round(v)}`;

const CAT_PILL: Record<string, string> = {
  seed: 'bg-blue-500/10 text-blue-500',
  feed: 'bg-amber-500/10 text-amber-500',
  medicine: 'bg-emerald-500/10 text-emerald-500',
};

export const ProviderFarmers = ({ t }: { t: any }) => {
  const navigate  = useNavigate();
  const { theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter]     = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = useMemo(() =>
    FARMERS.filter(f =>
      (filter === 'all' || f.status === filter) &&
      (!search || f.name.toLowerCase().includes(search.toLowerCase()) || f.location.toLowerCase().includes(search.toLowerCase()))
    ), [search, filter]);

  const totalActive  = FARMERS.filter(f => f.status === 'active').length;
  const totalSpend   = FARMERS.reduce((a, f) => a + f.totalSpend, 0);
  const totalOrders  = FARMERS.reduce((a, f) => a + f.totalOrders, 0);

  return (
    <div className={cn('min-h-screen pb-40', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title="My Farmers" showBack />

      <div className="pt-20 px-4 max-w-[420px] mx-auto space-y-4">

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Farmers', value: String(FARMERS.length), color: isDark ? 'text-white' : 'text-slate-900' },
            { label: 'Active',        value: String(totalActive),    color: 'text-emerald-500' },
            { label: 'Total Revenue', value: currency(totalSpend),   color: 'text-amber-500'  },
          ].map((m, i) => (
            <div key={i} className={cn('rounded-[1.5rem] border px-3 py-2.5 text-center',
              isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
              <p className={cn('text-[7px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>{m.label}</p>
              <p className={cn('font-black text-base tracking-tight', m.color)}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className={cn('flex items-center gap-2 rounded-2xl border px-3 py-2.5',
          isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-200 shadow-sm')}>
          <Search size={14} className={isDark ? 'text-white/20' : 'text-slate-300'} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search farmers or location…"
            className={cn('flex-1 text-[11px] font-medium outline-none bg-transparent',
              isDark ? 'text-white placeholder:text-white/20' : 'text-slate-800 placeholder:text-slate-300')} />
          {search && <button onClick={() => setSearch('')}><X size={12} className={isDark ? 'text-white/30' : 'text-slate-400'} /></button>}
        </div>

        {/* Status filter */}
        <div className={cn('flex p-1 rounded-2xl border gap-1', isDark ? 'bg-white/5 border-white/8' : 'bg-white border-slate-200 shadow-sm')}>
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all',
                filter === f
                  ? f === 'active' ? 'bg-emerald-500 text-white shadow-md'
                    : f === 'inactive' ? 'bg-slate-500 text-white shadow-md'
                    : isDark ? 'bg-white/10 text-white' : 'bg-slate-800 text-white shadow-md'
                  : isDark ? 'text-white/30' : 'text-slate-400')}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Farmer cards */}
        <div className="space-y-2.5">
          {filtered.map((farmer, i) => (
            <motion.button key={farmer.id}
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(farmer)}
              className={cn('w-full text-left rounded-[1.8rem] border p-4 transition-all',
                isDark ? 'bg-white/[0.03] border-white/8 hover:border-pink-500/20' : 'bg-white border-slate-100 shadow-sm hover:border-pink-200')}>
              <div className="flex items-center gap-3 mb-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-base font-black flex-shrink-0">
                  {farmer.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{farmer.name}</p>
                    <span className={cn('text-[6.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full',
                      farmer.status === 'active'
                        ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                        : isDark ? 'bg-slate-500/10 text-slate-400' : 'bg-slate-100 text-slate-500')}>
                      {farmer.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={8} className={isDark ? 'text-white/20' : 'text-slate-300'} />
                    <p className={cn('text-[7.5px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>{farmer.location}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                {[
                  { label: 'Ponds', value: `${farmer.activePonds}/${farmer.totalPonds}` },
                  { label: 'Orders', value: String(farmer.totalOrders) },
                  { label: 'Spend',  value: currency(farmer.totalSpend) },
                ].map((m, j) => (
                  <div key={j} className={cn('rounded-xl px-2 py-1.5 border text-center',
                    isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-100')}>
                    <p className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>{m.label}</p>
                    <p className={cn('text-[9px] font-black mt-0.5', isDark ? 'text-white/70' : 'text-slate-700')}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Category tags */}
              <div className="flex items-center gap-1.5">
                {farmer.categories.map(c => (
                  <span key={c} className={cn('text-[6.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full', CAT_PILL[c])}>
                    {c}
                  </span>
                ))}
                <span className={cn('ml-auto text-[7px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>
                  Last: {new Date(farmer.lastOrder).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </motion.button>
          ))}

          {filtered.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-3xl mb-2">👨‍🌾</p>
              <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>No farmers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Farmer Detail Sheet */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelected(null)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={cn('relative w-full max-w-[420px] rounded-t-[2.5rem] p-5 space-y-4 max-h-[88vh] overflow-y-auto shadow-2xl',
                isDark ? 'bg-[#0A1520] border-t border-white/8' : 'bg-white')}>
              <div className={cn('w-10 h-1 rounded-full mx-auto mb-2', isDark ? 'bg-white/15' : 'bg-slate-200')} />

              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
                  {selected.name[0]}
                </div>
                <div className="flex-1">
                  <p className={cn('text-[7px] font-black uppercase tracking-widest text-pink-500')}>Farmer</p>
                  <h3 className={cn('text-lg font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{selected.name}</h3>
                  <p className={cn('text-[8.5px] font-medium', isDark ? 'text-white/40' : 'text-slate-500')}>
                    {selected.location} · Customer since {new Date(selected.since + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Active Ponds',  value: `${selected.activePonds} / ${selected.totalPonds}`, icon: Droplets, color: 'text-blue-500' },
                  { label: 'Total Orders',  value: String(selected.totalOrders),                        icon: Fish,     color: 'text-amber-500' },
                  { label: 'Total Spend',   value: currency(selected.totalSpend),                       icon: TrendingUp,color: 'text-emerald-500' },
                  { label: 'Last Order',    value: new Date(selected.lastOrder).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), icon: Calendar, color: isDark ? 'text-white/60' : 'text-slate-600' },
                ].map((m, i) => (
                  <div key={i} className={cn('rounded-2xl border p-3', isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100')}>
                    <m.icon size={14} className={cn('mb-1.5', m.color)} />
                    <p className={cn('font-black text-[11px] tracking-tight', m.color)}>{m.value}</p>
                    <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {selected.notes && (
                <div className={cn('rounded-2xl border p-3.5', isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-100')}>
                  <p className={cn('text-[7px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/20' : 'text-slate-400')}>Notes</p>
                  <p className={cn('text-[9px] font-medium italic leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
                    "{selected.notes}"
                  </p>
                </div>
              )}

              {/* Category preferences */}
              <div>
                <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/20' : 'text-slate-400')}>Buys From You</p>
                <div className="flex gap-2 flex-wrap">
                  {selected.categories.map((c: string) => (
                    <span key={c} className={cn('px-3 py-1.5 rounded-2xl text-[8px] font-black uppercase tracking-widest border', CAT_PILL[c],
                      isDark ? 'border-white/5' : 'border-transparent')}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2.5">
                <a href={`tel:${selected.phone}`}
                  className={cn('flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[8.5px] font-black uppercase tracking-widest border',
                    isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700')}>
                  <Phone size={13} /> Call
                </a>
                <button onClick={() => { setSelected(null); navigate('/provider/chat'); }}
                  className={cn('flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[8.5px] font-black uppercase tracking-widest border',
                    isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700')}>
                  <MessageSquare size={13} /> Chat
                </button>
              </div>

              <button onClick={() => setSelected(null)}
                className={cn('w-full py-3.5 rounded-2xl text-[8.5px] font-black uppercase tracking-widest border',
                  isDark ? 'bg-white/5 border-white/8 text-white/30' : 'bg-slate-50 border-slate-200 text-slate-400')}>
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
