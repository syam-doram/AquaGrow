import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package, ShoppingBag, Fish, ChevronLeft, RefreshCw,
  CheckCircle2, Clock, Truck, AlertCircle, X, Phone, MessageSquare,
  ArrowRight, MapPin, Star,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import { API_BASE_URL } from '../../config';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  assigned:  { label: 'Assigned',  bg: 'bg-amber-500/10',   text: 'text-amber-500',   icon: Clock        },
  pending:   { label: 'Pending',   bg: 'bg-amber-500/10',   text: 'text-amber-500',   icon: Clock        },
  confirmed: { label: 'Confirmed', bg: 'bg-blue-500/10',    text: 'text-blue-500',    icon: CheckCircle2 },
  shipped:   { label: 'Shipped',   bg: 'bg-purple-500/10',  text: 'text-purple-500',  icon: Truck        },
  delivered: { label: 'Delivered', bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', bg: 'bg-red-500/10',     text: 'text-red-500',     icon: X            },
  accepted:  { label: 'Accepted',  bg: 'bg-blue-500/10',    text: 'text-blue-500',    icon: CheckCircle2 },
};

// Harvest order status steps for progress bar
const HARVEST_STEPS = ['pending', 'accepted', 'confirmed', 'shipped', 'delivered'];
const SHOP_STEPS    = ['assigned', 'confirmed', 'shipped', 'delivered'];

const stepIndex = (steps: string[], status: string) => Math.max(0, steps.indexOf(status));

export const FarmerOrders = () => {
  const navigate = useNavigate();
  const { theme, user, apiFetch } = useData() as any;
  const isDark = theme === 'dark' || theme === 'midnight';

  const [tab, setTab]                   = useState<'shop' | 'harvest'>('shop');
  const [shopOrders, setShopOrders]     = useState<any[]>([]);
  const [harvestOrders, setHarvestOrders] = useState<any[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [selected, setSelected]         = useState<any>(null);

  const fetchOrders = async () => {
    setLoading(true); setError('');
    try {
      const userId = user?._id || user?.id;
      const [shopRes, harvestRes] = await Promise.all([
        apiFetch(`${API_BASE_URL}/shop/orders`),
        apiFetch(`${API_BASE_URL}/harvest-requests`),
      ]);
      const shopData    = shopRes.ok    ? await shopRes.json()    : [];
      const harvestData = harvestRes.ok ? await harvestRes.json() : [];

      // Filter shop orders for this farmer only
      const myShop = Array.isArray(shopData)
        ? shopData.filter((o: any) => o.farmerId === userId)
        : (shopData.orders || []).filter((o: any) => o.farmerId === userId);

      const myHarvest = Array.isArray(harvestData)
        ? harvestData.filter((o: any) => o.userId === userId || o.farmerId === userId)
        : [];

      setShopOrders(myShop);
      setHarvestOrders(myHarvest);
    } catch {
      setError('Could not load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const activeOrders = tab === 'shop' ? shopOrders : harvestOrders;

  return (
    <div className={cn('min-h-screen pb-32', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>

      {/* ── HEADER ── */}
      <header className={cn(
        'sticky top-0 z-50 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 border-b backdrop-blur-xl',
        isDark ? 'bg-[#070D12]/90 border-white/5' : 'bg-white/90 border-slate-100'
      )}>
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-700')}>
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <h1 className={cn('text-sm font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>My Orders</h1>
            <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>Track all your orders</p>
          </div>
          <button onClick={fetchOrders} className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-white/5 text-white/50' : 'bg-slate-100 text-slate-500')}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">

        {/* ── TABS ── */}
        <div className={cn('flex rounded-2xl p-1 border gap-1', isDark ? 'bg-white/5 border-white/8' : 'bg-slate-100 border-transparent')}>
          {([
            { key: 'shop',    label: '🛒 Shop Orders',    count: shopOrders.filter(o => o.status !== 'delivered').length },
            { key: 'harvest', label: '🐟 Harvest Orders', count: harvestOrders.filter(o => o.status !== 'delivered' && o.status !== 'completed').length },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5',
                tab === t.key ? isDark ? 'bg-white/15 text-white' : 'bg-white text-slate-900 shadow-sm' : isDark ? 'text-white/30' : 'text-slate-400')}>
              {t.label}
              {t.count > 0 && <span className="w-4 h-4 bg-[#C78200] text-white rounded-full text-[6px] flex items-center justify-center font-black">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className={cn('rounded-2xl p-3 border flex items-center gap-2', isDark ? 'bg-red-500/8 border-red-500/15' : 'bg-red-50 border-red-100')}>
            <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-red-500 text-[8px] font-medium">{error}</p>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && activeOrders.length === 0 && (
          <div className="text-center py-14">
            <RefreshCw size={28} className={cn('mx-auto mb-3 animate-spin', isDark ? 'text-white/20' : 'text-slate-300')} />
            <p className={cn('text-[9px] font-black', isDark ? 'text-white/20' : 'text-slate-400')}>Loading orders...</p>
          </div>
        )}

        {/* ── EMPTY ── */}
        {!loading && activeOrders.length === 0 && !error && (
          <div className="text-center py-16">
            <span className="text-5xl">{tab === 'shop' ? '🛒' : '🐟'}</span>
            <p className={cn('font-black text-sm mt-4', isDark ? 'text-white/30' : 'text-slate-400')}>
              No {tab === 'shop' ? 'shop' : 'harvest'} orders yet
            </p>
            {tab === 'shop' && (
              <button onClick={() => navigate('/shop')}
                className="mt-3 px-5 py-2.5 rounded-2xl text-white text-[9px] font-black uppercase tracking-widest"
                style={{ background: 'linear-gradient(135deg, #C78200, #92400E)' }}>
                Browse Shop →
              </button>
            )}
          </div>
        )}

        {/* ── SHOP ORDERS LIST ── */}
        {tab === 'shop' && shopOrders.map((order: any, i: number) => {
          const oid    = order._id || order.id;
          const st     = STATUS[order.status] || STATUS['pending'];
          const Icon   = st.icon;
          const step   = stepIndex(SHOP_STEPS, order.status);
          return (
            <motion.div key={oid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => setSelected({ ...order, _type: 'shop' })}
              className={cn('rounded-[1.8rem] border p-4 cursor-pointer active:scale-[0.98] transition-all',
                isDark ? 'bg-[#0D1520] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
              {/* Order head */}
              <div className="flex items-start gap-3 mb-3">
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', isDark ? 'bg-amber-500/10' : 'bg-amber-50')}>
                  <ShoppingBag size={16} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-amber-400/60' : 'text-amber-600')}>
                      Order #{oid?.slice?.(-6)?.toUpperCase()}
                    </p>
                    <span className={cn('px-2 py-0.5 rounded-lg text-[6.5px] font-black uppercase tracking-widest', st.bg, st.text)}>{st.label}</span>
                  </div>
                  <p className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-900')}>
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''} · ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                  </p>
                  {order.providerName && <p className={cn('text-[7.5px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>Provider: {order.providerName}</p>}
                  <p className={cn('text-[7px] font-medium', isDark ? 'text-white/20' : 'text-slate-300')}>{order.createdAt ? formatDate(order.createdAt) : ''}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-1">
                {SHOP_STEPS.map((s, si) => (
                  <React.Fragment key={s}>
                    <div className={cn('h-1.5 flex-1 rounded-full transition-all', si <= step ? 'bg-[#C78200]' : isDark ? 'bg-white/8' : 'bg-slate-100')} />
                    {si < SHOP_STEPS.length - 1 && <div className={cn('w-1 h-1 rounded-full flex-shrink-0', si < step ? 'bg-[#C78200]' : isDark ? 'bg-white/8' : 'bg-slate-100')} />}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {SHOP_STEPS.map((s, si) => (
                  <span key={s} className={cn('text-[5.5px] font-black uppercase tracking-widest capitalize', si <= step ? 'text-[#C78200]' : isDark ? 'text-white/15' : 'text-slate-300')}>
                    {s === 'assigned' ? 'Placed' : s}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* ── HARVEST ORDERS LIST ── */}
        {tab === 'harvest' && harvestOrders.map((order: any, i: number) => {
          const oid  = order._id || order.id;
          const st   = STATUS[order.status] || STATUS['pending'];
          const step = stepIndex(HARVEST_STEPS, order.status);
          return (
            <motion.div key={oid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => setSelected({ ...order, _type: 'harvest' })}
              className={cn('rounded-[1.8rem] border p-4 cursor-pointer active:scale-[0.98] transition-all',
                isDark ? 'bg-[#0D1520] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
              <div className="flex items-start gap-3 mb-3">
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', isDark ? 'bg-blue-500/10' : 'bg-blue-50')}>
                  <Fish size={16} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-blue-400/60' : 'text-blue-600')}>
                      Harvest #{oid?.slice?.(-6)?.toUpperCase()}
                    </p>
                    <span className={cn('px-2 py-0.5 rounded-lg text-[6.5px] font-black uppercase tracking-widest', st.bg, st.text)}>{st.label}</span>
                  </div>
                  <p className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-900')}>
                    {order.quantity || order.size || '—'} kg · ₹{(order.totalAmount || order.price || 0).toLocaleString('en-IN')}
                  </p>
                  {order.pondName && <p className={cn('text-[7.5px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>Pond: {order.pondName}</p>}
                  <p className={cn('text-[7px] font-medium', isDark ? 'text-white/20' : 'text-slate-300')}>{order.createdAt ? formatDate(order.createdAt) : ''}</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-1">
                {HARVEST_STEPS.map((s, si) => (
                  <React.Fragment key={s}>
                    <div className={cn('h-1.5 flex-1 rounded-full transition-all', si <= step ? 'bg-blue-500' : isDark ? 'bg-white/8' : 'bg-slate-100')} />
                    {si < HARVEST_STEPS.length - 1 && <div className={cn('w-1 h-1 rounded-full flex-shrink-0', si < step ? 'bg-blue-500' : isDark ? 'bg-white/8' : 'bg-slate-100')} />}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {HARVEST_STEPS.map((s, si) => (
                  <span key={s} className={cn('text-[5.5px] font-black uppercase tracking-widest capitalize', si <= step ? 'text-blue-500' : isDark ? 'text-white/15' : 'text-slate-300')}>{s}</span>
                ))}
              </div>
            </motion.div>
          );
        })}

      </div>

      {/* ── ORDER DETAIL BOTTOM SHEET ── */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={cn('fixed bottom-0 left-0 right-0 z-50 rounded-t-[2.5rem] max-h-[88vh] overflow-y-auto', isDark ? 'bg-[#0D1520]' : 'bg-white')}>
              <div className="flex justify-center pt-3"><div className={cn('w-10 h-1 rounded-full', isDark ? 'bg-white/20' : 'bg-slate-200')} /></div>

              <div className="px-5 pb-10 pt-3">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[7px] font-black uppercase tracking-widest text-[#C78200]">
                      {selected._type === 'shop' ? '🛒 Shop Order' : '🐟 Harvest Order'}
                    </span>
                    <h2 className={cn('text-lg font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                      #{(selected._id || selected.id)?.slice?.(-6)?.toUpperCase()}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => { const st = STATUS[selected.status] || STATUS['pending']; return <span className={cn('px-3 py-1 rounded-xl text-[7px] font-black uppercase tracking-widest', st.bg, st.text)}>{st.label}</span>; })()}
                    <button onClick={() => setSelected(null)} className={cn('w-8 h-8 rounded-full flex items-center justify-center', isDark ? 'bg-white/10 text-white/50' : 'bg-slate-100 text-slate-400')}><X size={14} /></button>
                  </div>
                </div>

                {/* ── Shop order items ── */}
                {selected._type === 'shop' && selected.items?.length > 0 && (
                  <div className={cn('rounded-2xl border divide-y mb-4 overflow-hidden', isDark ? 'border-white/8 divide-white/5' : 'border-slate-100 divide-slate-50')}>
                    {selected.items.map((item: any, i: number) => (
                      <div key={i} className={cn('flex items-center gap-3 px-4 py-2.5', isDark ? 'bg-white/[0.02]' : 'bg-white')}>
                        <div className="flex-1">
                          <p className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-900')}>{item.productName}</p>
                          <p className={cn('text-[7.5px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>{item.unit} × {item.qty}</p>
                        </div>
                        <p className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-900')}>₹{(item.subtotal || 0).toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                    <div className={cn('flex justify-between px-4 py-2.5', isDark ? 'bg-white/[0.03]' : 'bg-slate-50')}>
                      <span className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-500')}>Total</span>
                      <span className="text-[11px] font-black text-[#C78200]">₹{(selected.totalAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                {/* ── Delivery details ── */}
                <div className={cn('rounded-2xl border divide-y mb-4 overflow-hidden', isDark ? 'border-white/8 divide-white/5' : 'border-slate-100 divide-slate-50')}>
                  {[
                    selected.providerName && { label: 'Provider',    value: selected.providerName },
                    selected.deliveryNote && { label: 'Your Note',   value: selected.deliveryNote },
                    { label: 'Placed',       value: selected.createdAt ? formatDate(selected.createdAt) : '—' },
                    selected._type === 'harvest' && selected.quantity && { label: 'Quantity', value: `${selected.quantity} kg` },
                    selected._type === 'harvest' && selected.pondName && { label: 'Pond', value: selected.pondName },
                  ].filter(Boolean).map((row: any, i) => (
                    <div key={i} className={cn('flex justify-between px-4 py-2.5', isDark ? 'bg-white/[0.02]' : 'bg-white')}>
                      <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>{row.label}</p>
                      <p className={cn('text-[9px] font-black', isDark ? 'text-white/70' : 'text-slate-700')}>{row.value}</p>
                    </div>
                  ))}
                </div>

                {/* ── Progress steps ── */}
                <div className={cn('rounded-2xl border p-4 mb-4', isDark ? 'bg-white/[0.02] border-white/8' : 'bg-slate-50 border-slate-100')}>
                  <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3', isDark ? 'text-white/30' : 'text-slate-400')}>Delivery Progress</p>
                  {(selected._type === 'shop' ? SHOP_STEPS : HARVEST_STEPS).map((s, si, arr) => {
                    const currentStep = stepIndex(arr, selected.status);
                    const done = si <= currentStep;
                    return (
                      <div key={s} className="flex items-start gap-3 mb-2 last:mb-0">
                        <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', done ? 'bg-[#C78200]' : isDark ? 'bg-white/8' : 'bg-slate-100')}>
                          {done ? <CheckCircle2 size={10} className="text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />}
                        </div>
                        <div>
                          <p className={cn('text-[9px] font-black capitalize', done ? isDark ? 'text-white' : 'text-slate-900' : isDark ? 'text-white/25' : 'text-slate-300')}>
                            {s === 'assigned' ? 'Order Placed' : s.charAt(0).toUpperCase() + s.slice(1)}
                          </p>
                          {si === currentStep && <p className="text-[7px] font-medium text-[#C78200]">Current stage</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Contact ── */}
                {selected.farmerPhone && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <a href={`tel:${selected.farmerPhone}`} className={cn('flex items-center justify-center gap-2 py-3 rounded-2xl border text-[8px] font-black uppercase tracking-widest', isDark ? 'bg-white/5 border-white/8 text-white/60' : 'bg-slate-50 border-slate-200 text-slate-600')}>
                      <Phone size={12} /> Call Provider
                    </a>
                    <a href={`https://wa.me/${selected.farmerPhone}`} className="flex items-center justify-center gap-2 py-3 rounded-2xl text-[8px] font-black uppercase tracking-widest border" style={{ borderColor: '#25D366', color: '#25D366', backgroundColor: '#25D36615' }}>
                      <MessageSquare size={12} /> WhatsApp
                    </a>
                  </div>
                )}

                <button onClick={() => setSelected(null)}
                  className={cn('w-full py-3 rounded-2xl text-[8.5px] font-black uppercase tracking-widest border', isDark ? 'bg-white/5 border-white/8 text-white/30' : 'bg-slate-50 border-slate-200 text-slate-400')}>
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
