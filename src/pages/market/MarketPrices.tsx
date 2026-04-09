import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, ChevronRight, MapPin, Activity, Zap,
  RefreshCw, ChevronLeft, BarChart2, Info, ArrowRight, Star,
  Clock, AlertTriangle, Target, ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { motion, AnimatePresence } from 'motion/react';

// ─── DATASET ──────────────────────────────────────────────────────────────────
const weekData = [
  { day: 'Mon', price: 480, h: 60 },
  { day: 'Tue', price: 470, h: 45 },
  { day: 'Wed', price: 510, h: 75 },
  { day: 'Thu', price: 490, h: 55 },
  { day: 'Fri', price: 410, h: 30 },
  { day: 'Sat', price: 380, h: 15 },
  { day: 'Sun', price: 540, h: 100 },
];

const monthData = [
  470, 455, 480, 495, 510, 490, 475, 460, 485, 500,
  520, 510, 495, 480, 465, 450, 470, 490, 505, 515,
  500, 485, 470, 455, 480, 500, 520, 530, 540, 535,
];

// Size → avg price data
const sizeDistData = [
  { size: '20 ct', price: 620, pct: 100 },
  { size: '30 ct', price: 580, pct: 93 },
  { size: '40 ct', price: 545, pct: 87 },
  { size: '50 ct', price: 510, pct: 82 },
  { size: '60 ct', price: 470, pct: 75 },
  { size: '80 ct', price: 420, pct: 67 },
  { size: '100 ct', price: 375, pct: 60 },
];

// Location × signal demand map
const locationDemand = [
  { loc: 'Bhimavaram', score: 92, label: 'Very High', color: '#10B981' },
  { loc: 'Nellore',    score: 75, label: 'High',      color: '#3B82F6' },
  { loc: 'Vizag',      score: 58, label: 'Moderate',  color: '#F59E0B' },
  { loc: 'Kakinada',   score: 44, label: 'Low',       color: '#EF4444' },
];

// ─── CHARTS ───────────────────────────────────────────────────────────────────
const BarChart = ({ isDark }: { isDark: boolean }) => (
  <div className="flex items-end gap-1.5 h-20">
    {weekData.map((d, i) => {
      const isToday = i === weekData.length - 1;
      return (
        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
          <p className={cn('text-[5px] font-bold tabular-nums', isToday ? 'text-[#C78200]' : isDark ? 'text-white/25' : 'text-slate-400')}>
            {isToday ? `₹${d.price}` : ''}
          </p>
          <motion.div
            initial={{ height: 0 }} animate={{ height: `${d.h}%` }}
            transition={{ delay: i * 0.07, duration: 0.5, ease: 'easeOut' }}
            className={cn('w-full rounded-t-lg', isToday ? 'bg-[#C78200]' : isDark ? 'bg-white/8' : 'bg-slate-200')}
          />
          <p className={cn('text-[5px] font-black uppercase tracking-widest',
            isToday ? 'text-[#C78200]' : isDark ? 'text-white/20' : 'text-slate-400'
          )}>{d.day}</p>
        </div>
      );
    })}
  </div>
);

/** 30-day SVG Sparkline */
const SparkLine = ({ isDark }: { isDark: boolean }) => {
  const W = 320, H = 80, pad = 6;
  const min = Math.min(...monthData), max = Math.max(...monthData);
  const points = monthData.map((v, i) => {
    const x = pad + (i / (monthData.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / (max - min)) * (H - pad * 2);
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M ${points[0].split(',')[0]},${H - pad} L ${points.join(' L ')} L ${points[points.length - 1].split(',')[0]},${H - pad} Z`;
  const lastX = parseFloat(points[points.length - 1].split(',')[0]);
  const lastY = parseFloat(points[points.length - 1].split(',')[1]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="sp-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sp-grad)" />
      <path d={pathD} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="4" fill="#10B981" />
      <circle cx={lastX} cy={lastY} r="8" fill="#10B981" fillOpacity="0.2" />
    </svg>
  );
};

/** Price-by-size horizontal bar chart */
const SizeDistChart = ({ isDark }: { isDark: boolean }) => (
  <div className="space-y-2.5 mt-3">
    {sizeDistData.map((d, i) => (
      <div key={d.size} className="flex items-center gap-3">
        <p className={cn('text-[8px] font-black w-12 flex-shrink-0', isDark ? 'text-white/40' : 'text-slate-500')}>{d.size}</p>
        <div className={cn('flex-1 h-2 rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-slate-100')}>
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${d.pct}%` }}
            transition={{ delay: i * 0.06, duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(to right, #0D523C, #10B981)` }}
          />
        </div>
        <p className={cn('text-[9px] font-black w-12 text-right flex-shrink-0', isDark ? 'text-[#C78200]' : 'text-[#0D523C]')}>₹{d.price}</p>
      </div>
    ))}
  </div>
);

/** Demand score by location radar-style row */
const DemandHeatmap = ({ isDark }: { isDark: boolean }) => (
  <div className="grid grid-cols-2 gap-2 mt-3">
    {locationDemand.map((d, i) => (
      <motion.div key={d.loc}
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.07 }}
        className={cn('rounded-2xl p-3 border', isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-100')}
      >
        <div className="flex items-center justify-between mb-1.5">
          <p className={cn('text-[8px] font-black', isDark ? 'text-white/60' : 'text-slate-700')}>{d.loc}</p>
          <span className="text-[8px] font-black" style={{ color: d.color }}>{d.score}</span>
        </div>
        <div className={cn('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/8' : 'bg-slate-200')}>
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${d.score}%` }}
            transition={{ delay: i * 0.07 + 0.2, duration: 0.7, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: d.color }}
          />
        </div>
        <p className={cn('text-[6px] font-black uppercase tracking-widest mt-1', isDark ? 'text-white/20' : 'text-slate-400')}>{d.label}</p>
      </motion.div>
    ))}
  </div>
);

// ─── DETAIL VIEW ─────────────────────────────────────────────────────────────
const DetailView = ({ price, t, onBack, isDark }: { price: any; t: Translations; onBack: () => void; isDark: boolean }) => (
  <motion.div
    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
    className={cn('min-h-screen pb-40', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}
  >
    {/* Header */}
    <header className={cn(
      'fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 backdrop-blur-xl px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center justify-between border-b',
      isDark ? 'bg-[#070D12]/90 border-white/5' : 'bg-white/90 border-slate-100 shadow-sm'
    )}>
      <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}
        className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border',
          isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-white border-slate-200 text-slate-600 shadow-sm'
        )}>
        <ArrowLeft size={18} />
      </motion.button>
      <div className="text-center">
        <h1 className={cn('text-xs font-black tracking-tight uppercase', isDark ? 'text-white' : 'text-slate-900')}>{price.shrimpSize} Count</h1>
        <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>{price.location}</p>
      </div>
      <div className="w-10" />
    </header>

    <div className="pt-24 px-4 space-y-4">
      {/* Price Hero */}
      <div className="bg-gradient-to-br from-[#0D523C] to-[#02130F] rounded-[2.5rem] p-7 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-[80px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-emerald-400" />
            <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400">{t.premium} Status</p>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-white font-black text-6xl tracking-tighter">₹{price.price}</span>
            <span className="text-white/30 text-xl font-black">/kg</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/10">{price.location}</span>
            <span className="px-3 py-1 bg-emerald-500/20 rounded-xl text-[8px] font-black uppercase tracking-widest border border-emerald-500/30 text-emerald-300">+2% Today</span>
          </div>
        </div>
      </div>

      {/* 7-Day Chart */}
      <div className={cn('rounded-[2rem] p-5 border', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>7-Day Price Trend</h3>
            <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>Market Average (₹/kg)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#C78200] rounded-full" />
            <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>Today</span>
          </div>
        </div>
        <BarChart isDark={isDark} />
        <div className={cn('flex justify-between mt-3 pt-3 border-t', isDark ? 'border-white/5' : 'border-slate-100')}>
          {[{ label: '7d High', val: '₹540' }, { label: '7d Low', val: '₹380' }, { label: 'Avg', val: '₹469' }].map(s => (
            <div key={s.label} className="text-center">
              <p className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-800')}>{s.val}</p>
              <p className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: t.profitMargin, val: '₹145/kg', badge: 'HIGH', color: 'emerald' },
          { label: t.recommendationStatus, val: t.harvestLabel, badge: '🔥 NOW', color: 'amber' },
          { label: 'Demand Signal', val: price.demand || 'HIGH', badge: 'Live', color: 'blue' },
          { label: 'Supply Risk', val: 'Low', badge: '48h alert', color: 'red' },
        ].map((s, i) => (
          <div key={i} className={cn('rounded-2xl p-4 border', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
            <p className={cn('text-[7px] font-black uppercase tracking-widest mb-1.5', isDark ? 'text-white/25' : 'text-slate-400')}>{s.label}</p>
            <p className={cn('font-black text-lg tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{s.val}</p>
            <span className={cn('text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 inline-block',
              s.color === 'emerald' ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700' :
              s.color === 'amber'   ? isDark ? 'bg-amber-500/10 text-amber-400'   : 'bg-amber-100 text-amber-700' :
              s.color === 'blue'    ? isDark ? 'bg-blue-500/10 text-blue-400'     : 'bg-blue-100 text-blue-700' :
              isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700'
            )}>{s.badge}</span>
          </div>
        ))}
      </div>

      {/* Market Advice */}
      <div className={cn('rounded-[2rem] p-5 border', isDark ? 'bg-[#C78200]/5 border-[#C78200]/15' : 'bg-amber-50 border-amber-200')}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-[#C78200] rounded-xl flex items-center justify-center">
            <Target size={16} className="text-white" />
          </div>
          <div>
            <p className={cn('font-black text-sm tracking-tight', isDark ? 'text-[#C78200]' : 'text-amber-800')}>{t.harvestAdvice}</p>
            <p className="text-[7px] text-[#C78200]/60 font-black uppercase tracking-widest">AI Market Intelligence</p>
          </div>
        </div>
        <p className={cn('text-[10px] font-bold leading-relaxed', isDark ? 'text-white/50' : 'text-amber-900/70')}>
          The current market velocity for {price.shrimpSize} count indicates a supply shortage in the next 48 hours. Secure your export contract now for maximum premium. Consider contacting buyers at Bhimavaram market for priority placement.
        </p>
      </div>
    </div>
  </motion.div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export const MarketPrices = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const navigate       = useNavigate();
  const { marketPrices, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [activeTab,    setActiveTab]    = useState('vannamei');
  const [selectedArea, setSelectedArea] = useState('Bhimavaram');
  const [selectedCount, setSelectedCount] = useState<any>(null);

  const speciesData = [
    { id: 'vannamei', label: 'Vannamei', emoji: '🦐' },
    { id: 'tiger',   label: t.blackTiger, emoji: '🐚' },
    { id: 'scampi',  label: t.scampi,    emoji: '🦞' },
  ];

  const areas = [
    { id: 'Bhimavaram', label: t.bhimavaram  },
    { id: 'Nellore',    label: t.nellore     },
    { id: 'Vizag',      label: t.vizag       },
    { id: 'Kakinada',   label: t.kakinada    },
  ];

  const filteredPrices = [...marketPrices.filter(p => !selectedArea || p.location === selectedArea)]
    .sort((a, b) => b.shrimpSize - a.shrimpSize);

  const topPrice  = filteredPrices.reduce((max, p) => p.price > max ? p.price : max, 0);
  const indexAvg  = filteredPrices.length
    ? Math.round(filteredPrices.reduce((s, p) => s + p.price, 0) / filteredPrices.length)
    : 485;

  if (selectedCount) {
    return <DetailView price={selectedCount} t={t} onBack={() => setSelectedCount(null)} isDark={isDark} />;
  }

  return (
    <div className={cn('pb-40 min-h-screen', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>

      {/* ── HEADER with Back Arrow ── */}
      <header className={cn(
        'fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 backdrop-blur-xl px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center justify-between border-b',
        isDark ? 'bg-[#070D12]/90 border-white/5' : 'bg-white/90 border-slate-100 shadow-sm'
      )}>
        {/* ← Back Arrow */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
          className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border',
            isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-white border-slate-200 text-slate-600 shadow-sm'
          )}>
          <ArrowLeft size={18} />
        </motion.button>

        <div className="text-center">
          <h1 className={cn('text-xs font-black tracking-tight uppercase', isDark ? 'text-white' : 'text-slate-900')}>{t.market}</h1>
          <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>Live Price Intelligence</p>
        </div>

        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border',
          isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
        )}>
          <Activity size={18} />
        </div>
      </header>

      <div className="pt-24 px-4 space-y-4">

        {/* ── INDEX HERO with mini bar chart ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#0D523C] to-[#02130F] rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-2xl"
        >
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-[80px]" />
          <TrendingUp size={120} strokeWidth={0.5} className="absolute right-[-8%] bottom-[-15%] opacity-5" />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-emerald-400/70 text-[8px] font-black uppercase tracking-[0.25em] mb-1">{t.marketSnapshot}</p>
                <h2 className="text-white font-black text-lg tracking-tight leading-tight">{t.dailyExportPriceIndex}</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-400 text-[7px] font-black uppercase tracking-widest">LIVE</span>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-white font-black text-5xl tracking-tighter">₹{indexAvg}</span>
              <div className="flex items-center gap-1 text-emerald-400 font-black text-xs mb-1">
                <TrendingUp size={12} />
                <span>+2.4%</span>
              </div>
            </div>
            <p className="text-white/30 text-[7px] font-black uppercase tracking-widest mb-6">
              Updated: Today, 09:30 AM · {selectedArea}
            </p>

            {/* Mini 7-day bar chart */}
            <BarChart isDark={true} />
          </div>
        </motion.div>

        {/* ── QUICK STATS ── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Best Price', val: `₹${topPrice || 540}`, color: 'emerald', icon: Star },
            { label: 'Avg Today',  val: `₹${indexAvg}`,       color: 'blue',    icon: BarChart2 },
            { label: 'Updated',    val: '09:30 AM',            color: 'amber',   icon: Clock },
          ].map((s, i) => (
            <div key={i} className={cn('rounded-2xl p-3 border text-center', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
              <s.icon size={14} className={cn('mx-auto mb-1.5',
                s.color === 'emerald' ? 'text-emerald-500' : s.color === 'blue' ? 'text-blue-500' : 'text-[#C78200]'
              )} />
              <p className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{s.val}</p>
              <p className={cn('text-[6px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── CHART 1: 30-Day Price Trend Sparkline ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={cn('rounded-[2rem] p-5 border', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
        >
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>30-Day Price Trend</h3>
              <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>Avg Market Price · ₹/kg · {selectedArea}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>30d</span>
            </div>
          </div>
          <SparkLine isDark={isDark} />
          <div className={cn('flex justify-between pt-3 border-t', isDark ? 'border-white/5' : 'border-slate-100')}>
            {[
              { label: '30d High', val: `₹${Math.max(...monthData)}` },
              { label: '30d Low',  val: `₹${Math.min(...monthData)}` },
              { label: 'Today',    val: `₹${monthData[monthData.length - 1]}` },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-800')}>{s.val}</p>
                <p className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── CHART 2: Price by Count / Size Distribution ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className={cn('rounded-[2rem] p-5 border', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
        >
          <div className="flex items-center gap-3 mb-1">
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'bg-emerald-500/10' : 'bg-emerald-50')}>
              <BarChart2 size={15} className="text-emerald-500" />
            </div>
            <div>
              <h3 className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Price by Count Size</h3>
              <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>Avg ₹/kg · All Sizes · Today</p>
            </div>
          </div>
          <SizeDistChart isDark={isDark} />
          <p className={cn('text-[7px] font-medium mt-3', isDark ? 'text-white/20' : 'text-slate-400')}>
            💡 Lower count = larger shrimp = higher premium price per kg
          </p>
        </motion.div>

        {/* ── CHART 3: Demand Heatmap by Location ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={cn('rounded-[2rem] p-5 border', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
        >
          <div className="flex items-center gap-3 mb-1">
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'bg-blue-500/10' : 'bg-blue-50')}>
              <MapPin size={15} className="text-blue-500" />
            </div>
            <div>
              <h3 className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Buyer Demand by Market</h3>
              <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>Live demand signal · All regions</p>
            </div>
          </div>
          <DemandHeatmap isDark={isDark} />
          <div className={cn('flex items-center gap-1.5 mt-3 pt-3 border-t', isDark ? 'border-white/5' : 'border-slate-100')}>
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <p className={cn('text-[7px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>
              Bhimavaram has the strongest demand signal today — ideal for urgent sale
            </p>
          </div>
        </motion.div>

        {/* ── AREA TABS ── */}
        <div className={cn('flex gap-1.5 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide border', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
          {areas.map(a => (
            <button key={a.id} onClick={() => setSelectedArea(a.id)}
              className={cn('flex-shrink-0 flex items-center gap-1 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all',
                selectedArea === a.id ? 'bg-[#C78200] text-white shadow-md' : isDark ? 'text-white/30 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'
              )}>
              <MapPin size={9} /> {a.label}
            </button>
          ))}
        </div>

        {/* ── SPECIES TABS ── */}
        <div className="flex gap-2">
          {speciesData.map(s => (
            <button key={s.id} onClick={() => setActiveTab(s.id)}
              className={cn('flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[8px] font-black uppercase tracking-widest border transition-all',
                activeTab === s.id
                  ? isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-[#4A2C2A] border-[#4A2C2A] text-white'
                  : isDark ? 'bg-white/3 border-white/8 text-white/25' : 'bg-white border-slate-200 text-slate-400 shadow-sm'
              )}>
              <span>{s.emoji}</span> {s.label}
            </button>
          ))}
        </div>

        {/* ── PRICE TABLE ── */}
        <div className={cn('rounded-[2rem] overflow-hidden border', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
          {/* Table header */}
          <div className="bg-gradient-to-r from-[#0D523C] to-[#065F46] px-5 py-3 grid grid-cols-[0.8fr_1fr_1.2fr_auto] gap-2 text-[7px] font-black uppercase tracking-widest text-white/60">
            <div>{t.count}</div>
            <div className="text-center">₹/KG</div>
            <div className="text-center">Signal</div>
            <div className="w-4" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={selectedArea + activeTab} className={cn('divide-y', isDark ? 'divide-white/5' : 'divide-slate-100')}>
              {filteredPrices.map((price, i) => {
                const isHigh = price.shrimpSize <= 50;
                const priceDelta = Math.round((Math.random() * 6 - 3));
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedCount(price)}
                    className={cn('px-5 py-4 grid grid-cols-[0.8fr_1fr_1.2fr_auto] gap-2 items-center cursor-pointer group transition-all',
                      isDark ? 'hover:bg-white/3' : 'hover:bg-amber-50/50',
                      i % 2 === 1 && !isDark ? 'bg-slate-50/50' : ''
                    )}
                  >
                    <div>
                      <p className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{price.shrimpSize} ct</p>
                      <p className={cn('text-[6px] font-black uppercase tracking-widest mt-0.5',
                        price.demand === 'HIGH' ? isDark ? 'text-emerald-400' : 'text-emerald-600' : isDark ? 'text-white/20' : 'text-slate-400'
                      )}>{price.demand === 'HIGH' ? 'Premium' : 'Standard'}</p>
                    </div>

                    <div className="text-center">
                      <p className={cn('font-black text-base tracking-tighter', isDark ? 'text-[#C78200]' : 'text-[#0D523C]')}>₹{price.price}</p>
                      <p className={cn('text-[6px] font-black uppercase tracking-widest',
                        priceDelta >= 0 ? isDark ? 'text-emerald-400' : 'text-emerald-600' : isDark ? 'text-red-400' : 'text-red-600'
                      )}>
                        {priceDelta >= 0 ? '+' : ''}{priceDelta} today
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <div className={cn('flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[6px] font-black uppercase tracking-widest',
                        isHigh
                          ? isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-100 border-emerald-200 text-emerald-700'
                          : isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-100 border-red-200 text-red-700'
                      )}>
                        {isHigh ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                        {isHigh ? t.priceUp : t.priceDown}
                      </div>
                    </div>

                    <ChevronRight size={14} className={cn('transition-all', isDark ? 'text-white/10 group-hover:text-white/50 group-hover:translate-x-1' : 'text-slate-300 group-hover:text-[#C78200] group-hover:translate-x-1')} />
                  </motion.div>
                );
              })}

              {filteredPrices.length === 0 && (
                <div className={cn('p-10 text-center', isDark ? 'text-white/20' : 'text-slate-400')}>
                  <p className="text-[9px] font-black uppercase tracking-widest">No price data for this area</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── DISCLAIMER ── */}
        <p className={cn('text-center text-[7px] font-bold leading-relaxed px-4', isDark ? 'text-white/15' : 'text-slate-400')}>
          Prices are indicative based on last reported market data. Always confirm with your local market agent before a sale.
        </p>
      </div>
    </div>
  );
};
