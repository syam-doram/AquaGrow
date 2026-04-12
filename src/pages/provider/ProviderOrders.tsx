import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package, Fish, Wheat, Pill, ChevronRight, Truck,
  CheckCircle2, Clock, X, Phone, MessageSquare, MapPin,
  ShoppingBag, RefreshCw, AlertCircle,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { API_BASE_URL } from '../../config';

const ORDERS = [
  { id: 'ORD-1041', farmer: 'Ravi Kumar',   location: 'Nellore',     phone: '9876543210', item: 'Vannamei SPF Seed', qty: '50,000 PLs', amount: 22500, status: 'pending',   date: '2026-04-09', category: 'seed',     note: 'PL12 preferred. Deliver by evening.' },
  { id: 'ORD-1040', farmer: 'Suresh Rao',   location: 'Bhimavaram',  phone: '9845012345', item: 'HiPro Pellet Feed', qty: '10 bags',   amount: 8500,  status: 'confirmed', date: '2026-04-08', category: 'feed',     note: '' },
  { id: 'ORD-1039', farmer: 'Lakshmi Devi', location: 'Kakinada',    phone: '9912344567', item: 'Probiotic Pond Care',qty: '5 units',  amount: 2250,  status: 'shipped',   date: '2026-04-07', category: 'medicine', note: 'Handle carefully' },
  { id: 'ORD-1038', farmer: 'Venkat Reddy', location: 'Guntur',      phone: '9900112233', item: 'Vannamei SPF Seed', qty: '1,00,000', amount: 45000, status: 'delivered', date: '2026-04-05', category: 'seed',     note: '' },
  { id: 'ORD-1037', farmer: 'Narayana Rao', location: 'Ongole',      phone: '9988776655', item: 'HiPro Pellet Feed', qty: '5 bags',   amount: 4250,  status: 'delivered', date: '2026-04-03', category: 'feed',     note: '' },
];

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; icon: any; next?: string; nextLabel?: string }> = {
  assigned:  { label: 'New',       bg: 'bg-red-500/10',     text: 'text-red-500',    icon: Clock,        next: 'confirmed', nextLabel: 'Accept Order'     },
  pending:   { label: 'Pending',   bg: 'bg-amber-500/10',   text: 'text-amber-500',  icon: Clock,        next: 'confirmed', nextLabel: 'Confirm Order'    },
  confirmed: { label: 'Confirmed', bg: 'bg-blue-500/10',    text: 'text-blue-500',   icon: CheckCircle2, next: 'shipped',   nextLabel: 'Mark Shipped'     },
  shipped:   { label: 'Shipped',   bg: 'bg-purple-500/10',  text: 'text-purple-500', icon: Truck,        next: 'delivered', nextLabel: 'Confirm Delivery' },
  delivered: { label: 'Delivered', bg: 'bg-emerald-500/10', text: 'text-emerald-500',icon: CheckCircle2, next: undefined    },
};

const CAT_ICON: Record<string, any> = {
  seed: Fish, feed: Wheat, medicine: Pill,
};
const CAT_COLOR: Record<string, string> = {
  seed: 'text-blue-400', feed: 'text-amber-400', medicine: 'text-emerald-400',
};

export const ProviderOrders = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const { theme, user, apiFetch } = useData() as any;
  const isDark = theme === 'dark' || theme === 'midnight';

  const [orders, setOrders]          = useState(ORDERS);
  const [activeStatus, setStatus]    = useState<string>('all');
  const [selected, setSelected]      = useState<any>(null);
  const [orderTab, setOrderTab]      = useState<'regular' | 'shop'>('regular');

  // ── Shop orders from API ──────────────────────────────────────────────────
  const [shopOrders, setShopOrders]  = useState<any[]>([]);
  const [shopLoading, setShopLoading]= useState(false);
  const [shopError, setShopError]    = useState('');

  const fetchShopOrders = async () => {
    setShopLoading(true); setShopError('');
    try {
      const providerId = user?._id || user?.id;
      const res = await apiFetch(`${API_BASE_URL}/shop/orders?providerId=${providerId}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setShopOrders(Array.isArray(data) ? data : data.orders || []);
    } catch {
      setShopError('Could not load shop orders. Pull to refresh.');
    } finally {
      setShopLoading(false);
    }
  };

  useEffect(() => { fetchShopOrders(); }, []);

  const advanceShopOrder = async (orderId: string, newStatus: string) => {
    try {
      await apiFetch(`${API_BASE_URL}/shop/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setShopOrders(prev => prev.map(o => o._id === orderId || o.id === orderId ? { ...o, status: newStatus } : o));
      setSelected((s: any) => s?._id === orderId || s?.id === orderId ? { ...s, status: newStatus } : s);
    } catch { /* silent */ }
  };

  const advance = (orderId: string, nextStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    setSelected((s: any) => s?.id === orderId ? { ...s, status: nextStatus } : s);
  };

  const filtered = useMemo(() =>
    activeStatus === 'all' ? orders : orders.filter(o => o.status === activeStatus),
    [orders, activeStatus]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    orders.forEach(o => { c[o.status] = (c[o.status] || 0) + 1; });
    return c;
  }, [orders]);

  return (
    <div className={cn('min-h-screen pb-40', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title="Orders" showBack />

      <div className="pt-20 px-4 max-w-[420px] mx-auto space-y-4">

        {/* ── ORDER TYPE TABS ── */}
        <div className={cn('flex rounded-2xl p-1 border gap-1', isDark ? 'bg-white/5 border-white/8' : 'bg-slate-100 border-transparent')}>
          {([
            { key: 'regular', label: '📋 Regular Orders' },
            { key: 'shop',    label: '🛒 Shop Orders',   badge: shopOrders.filter(o => o.status === 'assigned' || o.status === 'pending').length },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setOrderTab(tab.key)}
              className={cn('flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5',
                orderTab === tab.key ? isDark ? 'bg-white/15 text-white' : 'bg-white text-slate-900 shadow-sm' : isDark ? 'text-white/30' : 'text-slate-400'
              )}>
              {tab.label}
              {'badge' in tab && tab.badge > 0 && (
                <span className="w-4 h-4 bg-red-500 text-white rounded-full text-[6px] flex items-center justify-center font-black">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── SHOP ORDERS TAB ── */}
        {orderTab === 'shop' && (
          <div className="space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between px-1">
              <div>
                <p className={cn('text-[10px] font-black uppercase tracking-widest', isDark ? 'text-white/50' : 'text-slate-500')}>AquaGrow Shop Orders</p>
                <p className={cn('text-[7px] font-medium', isDark ? 'text-white/25' : 'text-slate-400')}>Company-assigned · Deliver to farmers</p>
              </div>
              <button onClick={fetchShopOrders} className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'bg-white/8' : 'bg-slate-100')}>
                <RefreshCw size={13} className={cn(shopLoading ? 'animate-spin' : '', isDark ? 'text-white/40' : 'text-slate-500')} />
              </button>
            </div>

            {shopError && (
              <div className={cn('rounded-2xl p-3 border flex items-center gap-2', isDark ? 'bg-red-500/8 border-red-500/15' : 'bg-red-50 border-red-100')}>
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <p className="text-red-500 text-[8px] font-medium">{shopError}</p>
              </div>
            )}

            {shopLoading && shopOrders.length === 0 ? (
              <div className="text-center py-10">
                <RefreshCw size={24} className={cn('mx-auto mb-3 animate-spin', isDark ? 'text-white/20' : 'text-slate-300')} />
                <p className={cn('text-[9px] font-black', isDark ? 'text-white/20' : 'text-slate-400')}>Loading shop orders...</p>
              </div>
            ) : shopOrders.length === 0 && !shopLoading ? (
              <div className="text-center py-14">
                <span className="text-4xl">📦</span>
                <p className={cn('font-black text-sm mt-4', isDark ? 'text-white/30' : 'text-slate-400')}>No shop orders assigned</p>
                <p className={cn('text-[8px] font-medium mt-1', isDark ? 'text-white/15' : 'text-slate-300')}>When a farmer near you orders, it appears here</p>
              </div>
            ) : (
              shopOrders.map((order: any, i: number) => {
                const oid = order._id || order.id;
                const st = STATUS_CFG[order.status] || STATUS_CFG['pending'];
                return (
                  <motion.div key={oid} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => setSelected({ ...order, _isShop: true })}
                    className={cn('rounded-[1.8rem] border p-4 cursor-pointer active:scale-[0.98] transition-all',
                      isDark ? 'bg-white/[0.03] border-amber-500/15 hover:border-amber-500/25' : 'bg-white border-amber-100 shadow-sm')}>
                    <div className="flex items-start gap-3">
                      <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', isDark ? 'bg-amber-500/10' : 'bg-amber-50 border border-amber-100')}>
                        <ShoppingBag size={16} className="text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-amber-400/60' : 'text-amber-600')}>#{oid?.slice?.(-6) || 'SHOP'}</p>
                            <span className="text-[6px] font-black px-1.5 py-0.5 bg-amber-500 text-white rounded-full uppercase tracking-widest">Shop</span>
                          </div>
                          <span className={cn('px-2 py-0.5 rounded-lg text-[6.5px] font-black uppercase tracking-widest', st.bg, st.text)}>{st.label}</span>
                        </div>
                        <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{order.farmerName || 'Farmer'}</p>
                        <p className={cn('text-[7.5px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>
                          {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''} · ₹{(order.totalAmount || order.subtotal || 0).toLocaleString('en-IN')}
                        </p>
                        {order.deliveryNote && (
                          <p className={cn('text-[7px] font-medium mt-0.5 italic', isDark ? 'text-white/20' : 'text-slate-400')}>📝 {order.deliveryNote}</p>
                        )}
                      </div>
                    </div>
                    {st.next && (
                      <button onClick={e => { e.stopPropagation(); advanceShopOrder(oid, st.next!); }}
                        className={cn('mt-3 w-full py-2.5 rounded-2xl text-[8px] font-black uppercase tracking-widest text-white',
                          order.status === 'pending' || order.status === 'assigned' ? 'bg-amber-500' :
                          order.status === 'confirmed' ? 'bg-blue-500' : 'bg-purple-500')}>
                        {st.nextLabel}
                      </button>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* ── REGULAR ORDERS TAB ── */}
        {orderTab === 'regular' && <>
        {/* Status chip filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {(['all', 'pending', 'confirmed', 'shipped', 'delivered'] as const).map(st => (
            <button key={st} onClick={() => setStatus(st)}
              className={cn('px-3.5 py-2 rounded-2xl text-[7.5px] font-black uppercase tracking-widest whitespace-nowrap border flex-shrink-0 transition-all flex items-center gap-1.5',
                activeStatus === st
                  ? st === 'all' ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                    : STATUS_CFG[st]
                      ? st === 'pending' ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                        : st === 'confirmed' ? 'bg-blue-500 border-blue-500 text-white shadow-md'
                        : st === 'shipped'   ? 'bg-purple-500 border-purple-500 text-white shadow-md'
                        : 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                      : ''
                  : isDark ? 'bg-white/5 border-white/8 text-white/40' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
              )}>
              {st.charAt(0).toUpperCase() + st.slice(1)}
              {counts[st] > 0 && (
                <span className={cn('w-4 h-4 rounded-full flex items-center justify-center text-[6.5px] font-black',
                  activeStatus === st ? 'bg-white/20 text-white' : isDark ? 'bg-white/10 text-white/50' : 'bg-slate-100 text-slate-400')}>
                  {counts[st]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Order list */}
        <div className="space-y-2.5">
          {filtered.map((order, i) => {
            const st = STATUS_CFG[order.status];
            const Icon = CAT_ICON[order.category] || Package;
            return (
              <motion.div key={order.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(order)}
                className={cn('rounded-[1.8rem] border p-4 cursor-pointer active:scale-[0.98] transition-all',
                  isDark ? 'bg-white/[0.03] border-white/8 hover:border-amber-500/20' : 'bg-white border-slate-100 shadow-sm hover:border-amber-200')}>
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
                    isDark ? 'bg-white/8' : 'bg-slate-50 border border-slate-100')}>
                    <Icon size={16} className={CAT_COLOR[order.category] || 'text-slate-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-amber-400/60' : 'text-amber-600')}>{order.id}</p>
                      <span className={cn('px-2 py-0.5 rounded-lg text-[6.5px] font-black uppercase tracking-widest', st.bg, st.text)}>{st.label}</span>
                    </div>
                    <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{order.farmer}</p>
                    <p className={cn('text-[7.5px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>{order.item} · {order.qty}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <MapPin size={8} className={isDark ? 'text-white/20' : 'text-slate-300'} />
                        <p className={cn('text-[7px] font-bold', isDark ? 'text-white/25' : 'text-slate-400')}>{order.location}</p>
                      </div>
                      <p className={cn('text-[11px] font-black', isDark ? 'text-white' : 'text-slate-900')}>₹{order.amount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
                {st.next && (
                  <button onClick={e => { e.stopPropagation(); advance(order.id, st.next!); }}
                    className={cn('mt-3 w-full py-2.5 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all',
                      order.status === 'pending' ? 'bg-amber-500 text-white shadow-md' :
                      order.status === 'confirmed' ? 'bg-blue-500 text-white shadow-md' :
                      'bg-purple-500 text-white shadow-md')}>
                    {st.nextLabel}
                  </button>
                )}
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-3xl mb-2">📦</p>
              <p className={cn('text-[9px] font-black', isDark ? 'text-white/20' : 'text-slate-400')}>No {activeStatus !== 'all' ? activeStatus : ''} orders</p>
            </div>
          )}
        </div>
        </>}
      </div>

      {/* Order detail bottom sheet */}
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

              {/* Order header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[7px] font-black uppercase tracking-widest text-amber-500">{selected.id}</p>
                  <h3 className={cn('text-lg font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{selected.farmer}</h3>
                  <p className={cn('text-[8.5px]', isDark ? 'text-white/40' : 'text-slate-500')}>{selected.location}</p>
                </div>
                <span className={cn('px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest', STATUS_CFG[selected.status]?.bg, STATUS_CFG[selected.status]?.text)}>
                  {STATUS_CFG[selected.status]?.label}
                </span>
              </div>

              {/* Details grid */}
              <div className={cn('rounded-2xl border divide-y overflow-hidden', isDark ? 'border-white/5 divide-white/5' : 'border-slate-100 divide-slate-100')}>
                {[
                  { label: 'Item',     value: selected.item },
                  { label: 'Quantity', value: selected.qty },
                  { label: 'Amount',   value: `₹${selected.amount.toLocaleString('en-IN')}` },
                  { label: 'Date',     value: new Date(selected.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                  selected.note && { label: 'Note', value: selected.note },
                ].filter(Boolean).map((row: any, i) => (
                  <div key={i} className={cn('flex justify-between px-4 py-2.5', isDark ? 'bg-white/[0.02]' : 'bg-white')}>
                    <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>{row.label}</p>
                    <p className={cn('text-[9px] font-black', isDark ? 'text-white/70' : 'text-slate-700')}>{row.value}</p>
                  </div>
                ))}
              </div>

              {/* Contact actions */}
              <div className="grid grid-cols-2 gap-2.5">
                <a href={`tel:${selected.phone}`}
                  className={cn('flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-[8.5px] font-black uppercase tracking-widest',
                    isDark ? 'bg-white/5 border-white/8 text-white/60' : 'bg-slate-50 border-slate-200 text-slate-600')}>
                  <Phone size={13} /> Call Farmer
                </a>
                <a href={`sms:${selected.phone}`}
                  className={cn('flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-[8.5px] font-black uppercase tracking-widest',
                    isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700')}>
                  <MessageSquare size={13} /> Message
                </a>
              </div>

              {/* Advance status */}
              {STATUS_CFG[selected.status]?.next && (
                <button onClick={() => advance(selected.id, STATUS_CFG[selected.status].next!)}
                  className={cn('w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg transition-all',
                    selected.status === 'pending' ? 'bg-amber-500' : selected.status === 'confirmed' ? 'bg-blue-500' : 'bg-purple-500')}>
                  {STATUS_CFG[selected.status]?.nextLabel}
                </button>
              )}

              <button onClick={() => setSelected(null)}
                className={cn('w-full py-3 rounded-2xl text-[8.5px] font-black uppercase tracking-widest border',
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
