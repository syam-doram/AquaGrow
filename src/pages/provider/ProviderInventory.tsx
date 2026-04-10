import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package, Plus, ChevronRight, Fish, Wheat, Pill, Zap,
  Edit3, Trash2, CheckCircle2, AlertTriangle, Search, X,
  BarChart2, TrendingUp, IndianRupee,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

const CAT_CFG: Record<string,(props:any)=>React.ReactNode> = {
  seed:     ({ size = 16 }) => <Fish     size={size} className="text-blue-400" />,
  feed:     ({ size = 16 }) => <Wheat    size={size} className="text-amber-400" />,
  medicine: ({ size = 16 }) => <Pill     size={size} className="text-emerald-400" />,
  utility:  ({ size = 16 }) => <Zap      size={size} className="text-purple-400" />,
};
const CAT_COLOR: Record<string, string> = {
  seed: '#60a5fa', feed: '#fbbf24', medicine: '#34d399', utility: '#a78bfa',
};
const CAT_BG_DARK: Record<string, string> = {
  seed: 'bg-blue-500/12', feed: 'bg-amber-500/12', medicine: 'bg-emerald-500/12', utility: 'bg-purple-500/12',
};
const CAT_BG_LIGHT: Record<string, string> = {
  seed: 'bg-blue-50', feed: 'bg-amber-50', medicine: 'bg-emerald-50', utility: 'bg-purple-50',
};

const INITIAL_ITEMS = [
  { id: '1', name: 'Vannamei SPF Seed (L1)', category: 'seed',     price: 0.45, unit: 'per PL',  stock: 500000, minStock: 100000, sku: 'SEED-L1' },
  { id: '2', name: 'Vannamei SPF Seed (L2)', category: 'seed',     price: 0.38, unit: 'per PL',  stock: 280000, minStock: 100000, sku: 'SEED-L2' },
  { id: '3', name: 'HiPro Pellet Feed 40kg', category: 'feed',     price: 850,  unit: 'per bag', stock: 120,    minStock: 20,     sku: 'FEED-HP40' },
  { id: '4', name: 'Starter Feed 30 size',   category: 'feed',     price: 780,  unit: 'per bag', stock: 85,     minStock: 20,     sku: 'FEED-S30' },
  { id: '5', name: 'Probiotic Pond Care',    category: 'medicine', price: 450,  unit: 'per unit',stock: 42,     minStock: 10,     sku: 'MED-PPC' },
  { id: '6', name: 'WSSV Prevention Kit',    category: 'medicine', price: 1200, unit: 'per kit', stock: 18,     minStock: 5,      sku: 'MED-WSSV' },
  { id: '7', name: 'Pond Aerator Motor',     category: 'utility',  price: 4500, unit: 'per unit',stock: 6,      minStock: 2,      sku: 'UTL-AERATOR' },
];

export const ProviderInventory = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const { theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [items, setItems]           = useState(INITIAL_ITEMS);
  const [search, setSearch]         = useState('');
  const [activeCat, setActiveCat]   = useState<string>('all');
  const [showAdd, setShowAdd]       = useState(false);
  const [editing, setEditing]       = useState<any>(null);

  // new / edit form state
  const [form, setForm] = useState({ name: '', category: 'seed', price: '', unit: 'per PL', stock: '', minStock: '', sku: '' });
  const s = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const filtered = useMemo(() =>
    items.filter(it =>
      (activeCat === 'all' || it.category === activeCat) &&
      (!search || it.name.toLowerCase().includes(search.toLowerCase()))
    ), [items, activeCat, search]);

  const cats = ['all', 'seed', 'feed', 'medicine', 'utility'];
  const totalValue = items.reduce((a, it) => a + it.price * it.stock, 0);
  const lowStock   = items.filter(it => it.stock <= it.minStock).length;

  const openAdd = () => { setForm({ name: '', category: 'seed', price: '', unit: 'per PL', stock: '', minStock: '', sku: '' }); setEditing(null); setShowAdd(true); };
  const openEdit = (it: any) => { setForm({ name: it.name, category: it.category, price: String(it.price), unit: it.unit, stock: String(it.stock), minStock: String(it.minStock), sku: it.sku }); setEditing(it); setShowAdd(true); };
  const saveItem = () => {
    if (!form.name || !form.price || !form.stock) return;
    const item = { id: editing?.id || Date.now().toString(), name: form.name, category: form.category, price: parseFloat(form.price), unit: form.unit, stock: parseInt(form.stock), minStock: parseInt(form.minStock) || 0, sku: form.sku };
    setItems(prev => editing ? prev.map(it => it.id === editing.id ? item : it) : [...prev, item]);
    setShowAdd(false);
  };
  const deleteItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id));

  return (
    <div className={cn('min-h-screen pb-40', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title="Inventory" showBack
        rightElement={
          <motion.button whileTap={{ scale: 0.9 }} onClick={openAdd}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isDark ? 'bg-amber-500/12 text-amber-400' : 'bg-amber-50 text-amber-600 shadow-sm')}>
            <Plus size={16} />
          </motion.button>
        }
      />

      <div className="pt-20 px-4 max-w-[420px] mx-auto space-y-4">

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'SKUs',       value: String(items.length),      color: isDark ? 'text-white' : 'text-slate-900' },
            { label: 'Total Value',value: totalValue >= 100000 ? `₹${(totalValue/100000).toFixed(1)}L` : `₹${(totalValue/1000).toFixed(1)}K`, color: 'text-amber-500' },
            { label: 'Low Stock',  value: String(lowStock),          color: lowStock > 0 ? 'text-red-500' : 'text-emerald-500' },
          ].map((m, i) => (
            <div key={i} className={cn('rounded-[1.5rem] border px-3 py-2.5 text-center', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
              <p className={cn('text-[7px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>{m.label}</p>
              <p className={cn('font-black text-base tracking-tight', m.color)}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className={cn('flex items-center gap-2 rounded-2xl border px-3 py-2.5', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-200 shadow-sm')}>
          <Search size={14} className={isDark ? 'text-white/20' : 'text-slate-300'} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
            className={cn('flex-1 text-[11px] font-medium outline-none bg-transparent', isDark ? 'text-white placeholder:text-white/20' : 'text-slate-800 placeholder:text-slate-300')} />
          {search && <button onClick={() => setSearch('')}><X size={12} className={isDark ? 'text-white/30' : 'text-slate-400'} /></button>}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {cats.map(c => (
            <button key={c} onClick={() => setActiveCat(c)}
              className={cn('px-3.5 py-1.5 rounded-2xl text-[8px] font-black uppercase tracking-widest whitespace-nowrap border flex-shrink-0 transition-all',
                activeCat === c
                  ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                  : isDark ? 'bg-white/5 border-white/8 text-white/40' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
              )}>
              {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {/* Low stock alert */}
        {lowStock > 0 && (
          <div className={cn('rounded-2xl border p-3 flex items-center gap-2', isDark ? 'bg-red-500/8 border-red-500/15' : 'bg-red-50 border-red-200')}>
            <AlertTriangle size={13} className="text-red-500" />
            <p className={cn('text-[8px] font-black', isDark ? 'text-red-400' : 'text-red-700')}>
              {lowStock} product{lowStock > 1 ? 's' : ''} running low on stock — restock soon!
            </p>
          </div>
        )}

        {/* Items */}
        <div className="space-y-2.5">
          {filtered.map((item, i) => {
            const isLow = item.stock <= item.minStock;
            const Icon = CAT_CFG[item.category] || CAT_CFG.seed;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={cn('rounded-[1.8rem] border p-4 flex items-center gap-3', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0', isDark ? CAT_BG_DARK[item.category] : CAT_BG_LIGHT[item.category])}>
                  {Icon({ size: 18 })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-[10px] font-black tracking-tight truncate', isDark ? 'text-white' : 'text-slate-900')}>{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[8px] font-black text-amber-500">₹{item.price} <span className={cn('font-medium', isDark ? 'text-white/25' : 'text-slate-400')}>{item.unit}</span></p>
                    <span className={cn('text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full',
                      isLow
                        ? isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
                        : isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                    )}>
                      {item.stock.toLocaleString('en-IN')} {isLow ? '⚠ Low' : '✓ OK'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(item)}
                    className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-500')}>
                    <Edit3 size={12} />
                  </button>
                  <button onClick={() => deleteItem(item.id)}
                    className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'bg-red-500/8 text-red-400' : 'bg-red-50 text-red-500')}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-10 text-center">
              <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAdd(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={cn('relative w-full max-w-[420px] rounded-t-[2.5rem] p-5 space-y-3 max-h-[90vh] overflow-y-auto',
                isDark ? 'bg-[#0A1520] border-t border-white/8' : 'bg-white')}>
              <div className={cn('w-10 h-1 rounded-full mx-auto mb-2', isDark ? 'bg-white/15' : 'bg-slate-200')} />
              <h3 className={cn('text-base font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                {editing ? 'Edit Product' : 'Add Product'}
              </h3>

              {[
                { label: 'Product Name', key: 'name' as const, placeholder: 'e.g. Vannamei SPF Seed L1' },
                { label: 'SKU / Code',   key: 'sku'  as const, placeholder: 'e.g. SEED-L1' },
                { label: 'Price (₹)',    key: 'price' as const, placeholder: '0.45', type: 'number' },
                { label: 'Unit',         key: 'unit'  as const, placeholder: 'per PL / per bag' },
                { label: 'Stock (qty)',  key: 'stock' as const, placeholder: '50000', type: 'number' },
                { label: 'Min Stock',    key: 'minStock' as const, placeholder: '10000', type: 'number' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-[0.2em] text-amber-500 px-1">{f.label}</label>
                  <input value={form[f.key]} onChange={e => s(f.key)(e.target.value)} placeholder={f.placeholder}
                    type={f.type || 'text'}
                    className={cn('w-full rounded-[1.2rem] px-4 py-3 text-[12px] font-semibold outline-none border transition-all',
                      isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/15 focus:border-amber-500/40' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-amber-400 focus:bg-white')} />
                </div>
              ))}

              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-[0.2em] text-amber-500 px-1">Category</label>
                <div className="flex gap-2">
                  {['seed', 'feed', 'medicine', 'utility'].map(c => (
                    <button key={c} onClick={() => s('category')(c)}
                      className={cn('flex-1 py-2 rounded-2xl text-[7.5px] font-black uppercase tracking-widest border transition-all',
                        form.category === c ? 'bg-amber-500 border-amber-500 text-white' : isDark ? 'bg-white/5 border-white/8 text-white/40' : 'bg-slate-50 border-slate-200 text-slate-500')}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAdd(false)}
                  className={cn('flex-1 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border',
                    isDark ? 'bg-white/5 border-white/8 text-white/40' : 'bg-slate-50 border-slate-200 text-slate-500')}>
                  Cancel
                </button>
                <button onClick={saveItem} disabled={!form.name || !form.price || !form.stock}
                  className="flex-1 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-amber-500 text-white shadow-lg disabled:opacity-40">
                  {editing ? 'Update' : 'Add Product'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
