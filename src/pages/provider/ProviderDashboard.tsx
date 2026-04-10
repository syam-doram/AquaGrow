import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, TrendingDown, Package, MessageSquare, IndianRupee,
  BarChart2, Bell, ChevronRight, ArrowUpRight, Zap, Users,
  Star, Clock, ShieldCheck, Building2, Fish, Wheat, Pill,
  CheckCircle2, AlertTriangle, Plus, Filter,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

const currency = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` :
  v >= 1000   ? `₹${(v / 1000).toFixed(1)}K` : `₹${Math.round(v)}`;

// ── Mock data (in real app comes from API) ──────────────────────────────────
const MOCK_ORDERS = [
  { id: 'ORD-1041', farmer: 'Ravi Kumar', location: 'Nellore', item: 'Vannamei SPF Seed', qty: '50,000 PLs', amount: 22500, status: 'pending',   date: '2026-04-09', category: 'seed' },
  { id: 'ORD-1040', farmer: 'Suresh Rao',  location: 'Bhimavaram', item: 'HiPro Pellet Feed 40kg', qty: '10 bags', amount: 8500, status: 'confirmed', date: '2026-04-08', category: 'feed' },
  { id: 'ORD-1039', farmer: 'Lakshmi Devi',location: 'Kakinada', item: 'Probiotic Pond Care', qty: '5 units', amount: 2250, status: 'shipped',   date: '2026-04-07', category: 'medicine' },
  { id: 'ORD-1038', farmer: 'Venkat Reddy',location: 'Guntur',   item: 'Vannamei SPF Seed', qty: '1,00,000 PLs', amount: 45000, status: 'delivered',date: '2026-04-05', category: 'seed' },
];

const MOCK_CHATS = [
  { id: 'c1', farmer: 'Ravi Kumar', lastMsg: 'When will the seed arrive?', time: '10 min ago', unread: 2 },
  { id: 'c2', farmer: 'Suresh Rao',  lastMsg: 'Feed quality is excellent 👍', time: '1 hr ago',  unread: 0 },
  { id: 'c3', farmer: 'Lakshmi Devi',lastMsg: 'Can you post today\'s rate?', time: '2 hr ago',  unread: 1 },
];

const MOCK_RATES = [
  { item: 'Vannamei SPF Seed (L1)', price: 0.45, unit: 'per PL',  change: +0.02, category: 'seed' },
  { item: 'Vannamei SPF Seed (L2)', price: 0.38, unit: 'per PL',  change: -0.01, category: 'seed' },
  { item: 'HiPro Feed 40 size',     price: 850,  unit: 'per bag', change: +10,   category: 'feed' },
  { item: 'Starter Feed 30 size',   price: 780,  unit: 'per bag', change: 0,     category: 'feed' },
  { item: 'Probiotic Pond Care',    price: 450,  unit: 'per unit',change: +5,    category: 'medicine' },
];

const STATUS_CFG: Record<string, any> = {
  pending:   { label: 'Pending',   bg: 'bg-amber-500/10',  text: 'text-amber-500',  dot: 'bg-amber-500'  },
  confirmed: { label: 'Confirmed', bg: 'bg-blue-500/10',   text: 'text-blue-500',   dot: 'bg-blue-500'   },
  shipped:   { label: 'Shipped',   bg: 'bg-purple-500/10', text: 'text-purple-500', dot: 'bg-purple-500' },
  delivered: { label: 'Delivered', bg: 'bg-emerald-500/10',text: 'text-emerald-500',dot: 'bg-emerald-500'},
};

// ── Main Dashboard ───────────────────────────────────────────────────────────
export const ProviderDashboard = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { theme, user } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const pendingOrders  = MOCK_ORDERS.filter(o => o.status === 'pending').length;
  const todayRevenue   = MOCK_ORDERS.filter(o => o.date === '2026-04-09').reduce((a, o) => a + o.amount, 0);
  const totalRevenue   = MOCK_ORDERS.reduce((a, o) => a + o.amount, 0);
  const totalUnread    = MOCK_CHATS.reduce((a, c) => a + c.unread, 0);
  const companyName    = (user as any)?.companyName || user?.name || 'My Company';

  const quickActions = [
    { icon: Package,      label: 'Orders',      badge: pendingOrders, route: '/provider/orders',    color: '#C78200',  bg: isDark ? 'rgba(199,130,0,0.12)' : '#fffbeb' },
    { icon: MessageSquare,label: 'Chats',       badge: totalUnread,   route: '/provider/chat',      color: '#6366f1',  bg: isDark ? 'rgba(99,102,241,0.12)' : '#eef2ff' },
    { icon: IndianRupee,  label: 'Rates',       badge: 0,             route: '/provider/rates',     color: '#10b981',  bg: isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5' },
    { icon: BarChart2,    label: 'Ledger',      badge: 0,             route: '/provider/ledger',    color: '#3b82f6',  bg: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff' },
    { icon: Package,      label: 'Inventory',   badge: 0,             route: '/provider/inventory', color: '#f59e0b',  bg: isDark ? 'rgba(245,158,11,0.12)' : '#fffbeb' },
    { icon: Users,        label: 'Farmers',     badge: 0,             route: '/provider/farmers',   color: '#ec4899',  bg: isDark ? 'rgba(236,72,153,0.12)' : '#fdf2f8' },
  ];

  return (
    <div className={cn('min-h-screen pb-40', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title="Provider Hub" onMenuClick={onMenuClick}
        rightElement={
          <button onClick={() => navigate('/provider/chat')}
            className={cn('relative w-9 h-9 rounded-xl flex items-center justify-center',
              isDark ? 'bg-white/8 text-white/60' : 'bg-white text-slate-500 shadow-sm')}>
            <Bell size={16} />
            {totalUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[7px] font-black text-white flex items-center justify-center">
                {totalUnread}
              </span>
            )}
          </button>
        }
      />

      <div className="pt-20 px-4 max-w-[420px] mx-auto space-y-4">

        {/* Hero company card */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[2.5rem] overflow-hidden relative shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #1d1200 0%, #4a2c00 50%, #7a4600 100%)' }}>
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative z-10 p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                <Building2 size={22} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[7px] font-black text-amber-400/60 uppercase tracking-widest">Service Provider</p>
                <h1 className="text-base font-black text-white tracking-tight truncate">{companyName}</h1>
              </div>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[7px] font-black text-emerald-400 uppercase tracking-widest">
                <ShieldCheck size={9} /> Verified
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/8">
              {[
                { label: "Today's Revenue", value: currency(todayRevenue), color: 'text-emerald-400' },
                { label: 'Total Revenue',   value: currency(totalRevenue),  color: 'text-white' },
                { label: 'Open Orders',     value: String(pendingOrders),   color: 'text-amber-400' },
              ].map((m, i) => (
                <div key={i} className="text-center">
                  <p className="text-[7px] font-black text-white/25 uppercase tracking-widest mb-0.5">{m.label}</p>
                  <p className={cn('font-black text-sm tracking-tight', m.color)}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick actions grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {quickActions.map((a, i) => (
            <motion.button key={a.label}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(a.route)}
              className={cn('rounded-[1.8rem] border p-3.5 flex flex-col items-center gap-2 relative transition-all',
                isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}
            >
              {a.badge > 0 && (
                <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-red-500 text-white text-[7px] font-black flex items-center justify-center">
                  {a.badge}
                </span>
              )}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: a.bg }}>
                <a.icon size={18} style={{ color: a.color }} />
              </div>
              <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/50' : 'text-slate-500')}>
                {a.label}
              </p>
            </motion.button>
          ))}
        </div>

        {/* Live market rates posted today */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className={cn('rounded-[2rem] border p-4', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
          <div className="flex items-center justify-between mb-3">
            <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>Today's Posted Rates</p>
            <button onClick={() => navigate('/provider/rates')}
              className="text-[8px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
              Update <ChevronRight size={10} />
            </button>
          </div>
          <div className="space-y-2">
            {MOCK_RATES.slice(0, 3).map((r, i) => (
              <div key={i} className="flex items-center justify-between">
                <p className={cn('text-[10px] font-black truncate flex-1', isDark ? 'text-white/70' : 'text-slate-700')}>{r.item}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-900')}>₹{r.price}</p>
                  {r.change !== 0 && (
                    <span className={cn('text-[7px] font-black', r.change > 0 ? 'text-emerald-500' : 'text-red-500')}>
                      {r.change > 0 ? '+' : ''}{r.change}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>Recent Orders</p>
            <button onClick={() => navigate('/provider/orders')}
              className="text-[8px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
              All <ChevronRight size={10} />
            </button>
          </div>
          <div className="space-y-2">
            {MOCK_ORDERS.slice(0, 3).map((order, i) => {
              const st = STATUS_CFG[order.status];
              return (
                <motion.div key={order.id}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                  onClick={() => navigate('/provider/orders')}
                  className={cn('rounded-[1.8rem] border p-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all',
                    isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                    order.category === 'seed' ? isDark ? 'bg-blue-500/15' : 'bg-blue-50' :
                    order.category === 'feed' ? isDark ? 'bg-amber-500/15' : 'bg-amber-50' :
                                                isDark ? 'bg-emerald-500/15' : 'bg-emerald-50')}>
                    {order.category === 'seed' ? <Fish size={15} className="text-blue-500" /> :
                     order.category === 'feed' ? <Wheat size={15} className="text-amber-500" /> :
                                                 <Pill size={15} className="text-emerald-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-[10px] font-black truncate', isDark ? 'text-white' : 'text-slate-900')}>{order.farmer}</p>
                    <p className={cn('text-[7.5px] font-bold truncate', isDark ? 'text-white/30' : 'text-slate-400')}>{order.item} · {order.qty}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-900')}>₹{order.amount.toLocaleString('en-IN')}</p>
                    <span className={cn('text-[6.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full', st.bg, st.text)}>{st.label}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Unread chats */}
        {totalUnread > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            onClick={() => navigate('/provider/chat')}
            className={cn('rounded-[2rem] border p-4 cursor-pointer active:scale-[0.98] transition-all',
              isDark ? 'bg-indigo-500/8 border-indigo-500/15' : 'bg-indigo-50 border-indigo-200')}>
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-indigo-500/15' : 'bg-indigo-100')}>
                <MessageSquare size={18} className="text-indigo-500" />
              </div>
              <div className="flex-1">
                <p className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-900')}>{totalUnread} unread message{totalUnread > 1 ? 's' : ''}</p>
                <p className={cn('text-[8px] font-medium', isDark ? 'text-white/40' : 'text-slate-500')}>Farmers are waiting for your reply</p>
              </div>
              <ChevronRight size={14} className={isDark ? 'text-white/20' : 'text-slate-300'} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
