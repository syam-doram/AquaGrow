import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, TrendingDown, IndianRupee, Plus, Edit3,
  CheckCircle2, Fish, Wheat, Pill, Zap, Megaphone,
  Clock, X, Minus,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

const CAT_ICON: Record<string, any> = { seed: Fish, feed: Wheat, medicine: Pill, utility: Zap };
const CAT_COLOR: Record<string, string> = { seed: '#60a5fa', feed: '#fbbf24', medicine: '#34d399', utility: '#a78bfa' };

const INITIAL_RATES = [
  { id: '1', item: 'Vannamei SPF Seed (L1)', category: 'seed',     price: 0.45, unit: 'per PL',  prevPrice: 0.43, effective: '2026-04-10', note: 'SPF certified, PL12' },
  { id: '2', item: 'Vannamei SPF Seed (L2)', category: 'seed',     price: 0.38, unit: 'per PL',  prevPrice: 0.39, effective: '2026-04-10', note: '' },
  { id: '3', item: 'HiPro Pellet Feed 40kg', category: 'feed',     price: 850,  unit: 'per bag', prevPrice: 840,  effective: '2026-04-10', note: '40% protein' },
  { id: '4', item: 'Starter Feed 30 size',   category: 'feed',     price: 780,  unit: 'per bag', prevPrice: 780,  effective: '2026-04-09', note: '' },
  { id: '5', item: 'Probiotic Pond Care',    category: 'medicine', price: 450,  unit: 'per unit',prevPrice: 445,  effective: '2026-04-10', note: '' },
  { id: '6', item: 'WSSV Prevention Kit',    category: 'medicine', price: 1200, unit: 'per kit', prevPrice: 1200, effective: '2026-04-08', note: '' },
];

export const ProviderRates = ({ t }: { t: any }) => {
  const { theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [rates, setRates]         = useState(INITIAL_RATES);
  const [activeCat, setActiveCat] = useState('all');
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<any>(null);
  const [form, setForm] = useState({ item: '', category: 'seed', price: '', unit: 'per PL', note: '' });
  const s = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  const [published, setPublished] = useState(false);
  const [adjustId, setAdjustId]  = useState<string | null>(null);

  const filtered = useMemo(() =>
    activeCat === 'all' ? rates : rates.filter(r => r.category === activeCat),
    [rates, activeCat]);

  const openAdd = () => { setForm({ item: '', category: 'seed', price: '', unit: 'per PL', note: '' }); setEditing(null); setShowForm(true); };
  const openEdit = (r: any) => { setForm({ item: r.item, category: r.category, price: String(r.price), unit: r.unit, note: r.note }); setEditing(r); setShowForm(true); };
  const save = () => {
    if (!form.item || !form.price) return;
    const today = new Date().toISOString().slice(0, 10);
    const entry = { id: editing?.id || Date.now().toString(), item: form.item, category: form.category, price: parseFloat(form.price), unit: form.unit, prevPrice: editing?.price || parseFloat(form.price), effective: today, note: form.note };
    setRates(prev => editing ? prev.map(r => r.id === editing.id ? entry : r) : [...prev, entry]);
    setShowForm(false);
  };
  const quickAdjust = (id: string, delta: number) => {
    setRates(prev => prev.map(r => r.id === id ? { ...r, prevPrice: r.price, price: Math.max(0, parseFloat((r.price + delta).toFixed(2))) } : r));
  };
  const publishAll = () => { setPublished(true); setTimeout(() => setPublished(false), 3000); };

  return (
    <div className={cn('min-h-screen pb-40', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title="Market Rates" showBack
        rightElement={
          <button onClick={openAdd}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isDark ? 'bg-emerald-500/12 text-emerald-400' : 'bg-emerald-50 text-emerald-600 shadow-sm')}>
            <Plus size={16} />
          </button>
        }
      />

      <div className="pt-20 px-4 max-w-[420px] mx-auto space-y-4">

        {/* Publish banner */}
        <AnimatePresence>
          {published && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={cn('rounded-2xl border p-3 flex items-center gap-2', isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')}>
              <CheckCircle2 size={14} className="text-emerald-500" />
              <p className={cn('text-[8.5px] font-black', isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                ✅ Rates published to all connected farmers!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Publish button */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={publishAll}
          className="w-full py-3.5 rounded-[1.8rem] flex items-center justify-center gap-2.5 font-black text-[9.5px] uppercase tracking-widest text-white shadow-xl"
          style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
          <Megaphone size={15} /> Publish Today's Rates to Farmers
        </motion.button>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {['all', 'seed', 'feed', 'medicine', 'utility'].map(c => (
            <button key={c} onClick={() => setActiveCat(c)}
              className={cn('px-3.5 py-2 rounded-2xl text-[8px] font-black uppercase tracking-widest whitespace-nowrap border flex-shrink-0 transition-all',
                activeCat === c
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                  : isDark ? 'bg-white/5 border-white/8 text-white/40' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
              )}>
              {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {/* Rate cards */}
        <div className="space-y-2.5">
          {filtered.map((r, i) => {
            const change = parseFloat((r.price - r.prevPrice).toFixed(2));
            const Icon = CAT_ICON[r.category] || IndianRupee;
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={cn('rounded-[1.8rem] border p-4', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: CAT_COLOR[r.category] + '18' }}>
                    <Icon size={18} style={{ color: CAT_COLOR[r.category] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-[10px] font-black truncate', isDark ? 'text-white' : 'text-slate-900')}>{r.item}</p>
                    {r.note && <p className={cn('text-[7.5px]', isDark ? 'text-white/25' : 'text-slate-400')}>{r.note}</p>}
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock size={8} className={isDark ? 'text-white/20' : 'text-slate-300'} />
                      <p className={cn('text-[7px] font-medium', isDark ? 'text-white/25' : 'text-slate-400')}>
                        Effective {new Date(r.effective).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn('text-base font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                      ₹{r.price}
                    </p>
                    <p className={cn('text-[7px] font-bold', isDark ? 'text-white/25' : 'text-slate-400')}>{r.unit}</p>
                    {change !== 0 && (
                      <span className={cn('text-[7px] font-black', change > 0 ? 'text-emerald-500' : 'text-red-500')}>
                        {change > 0 ? '↑' : '↓'} ₹{Math.abs(change)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick adjust controls */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                  <button onClick={() => quickAdjust(r.id, -1)}
                    className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500')}>
                    <Minus size={12} />
                  </button>
                  <div className={cn('flex-1 text-center text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
                    Quick Adjust
                  </div>
                  <button onClick={() => quickAdjust(r.id, 1)}
                    className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-500')}>
                    <Plus size={12} />
                  </button>
                  <button onClick={() => openEdit(r)}
                    className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-500')}>
                    <Edit3 size={12} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit form */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowForm(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={cn('relative w-full max-w-[420px] rounded-t-[2.5rem] p-5 space-y-3 max-h-[88vh] overflow-y-auto shadow-2xl',
                isDark ? 'bg-[#0A1520] border-t border-white/8' : 'bg-white')}>
              <div className={cn('w-10 h-1 rounded-full mx-auto mb-2', isDark ? 'bg-white/15' : 'bg-slate-200')} />
              <h3 className={cn('text-base font-black', isDark ? 'text-white' : 'text-slate-900')}>{editing ? 'Update Rate' : 'Add Rate'}</h3>
              {[
                { label: 'Product Name', key: 'item' as const, placeholder: 'e.g. Vannamei SPF Seed L1' },
                { label: 'Price (₹)',    key: 'price' as const, placeholder: '0.45', type: 'number' },
                { label: 'Unit',         key: 'unit'  as const, placeholder: 'per PL / per bag' },
                { label: 'Note (opt)',   key: 'note'  as const, placeholder: 'Grade / specification' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-widest text-emerald-500 px-1">{f.label}</label>
                  <input value={form[f.key]} onChange={e => s(f.key)(e.target.value)} placeholder={f.placeholder} type={f.type || 'text'}
                    className={cn('w-full rounded-[1.2rem] px-4 py-3 text-[12px] font-semibold outline-none border transition-all',
                      isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/15 focus:border-emerald-500/40' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-emerald-400 focus:bg-white')} />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-widest text-emerald-500 px-1">Category</label>
                <div className="flex gap-2">
                  {['seed', 'feed', 'medicine', 'utility'].map(c => (
                    <button key={c} onClick={() => s('category')(c)}
                      className={cn('flex-1 py-2 rounded-2xl text-[7px] font-black uppercase tracking-widest border transition-all',
                        form.category === c ? 'bg-emerald-500 border-emerald-500 text-white' : isDark ? 'bg-white/5 border-white/8 text-white/40' : 'bg-slate-50 border-slate-200 text-slate-500')}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)}
                  className={cn('flex-1 py-3.5 rounded-2xl text-[8.5px] font-black uppercase tracking-widest border', isDark ? 'bg-white/5 border-white/8 text-white/30' : 'bg-slate-50 border-slate-200 text-slate-400')}>
                  Cancel
                </button>
                <button onClick={save} disabled={!form.item || !form.price}
                  className="flex-1 py-3.5 rounded-2xl text-[8.5px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg disabled:opacity-40">
                  {editing ? 'Update' : 'Add Rate'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
