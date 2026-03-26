import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers as LayersIcon,
  Calculator,
  Zap,
  Utensils,
  AlertTriangle,
  Box,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  Activity,
  X,
  Plus,
  Moon,
  BarChart2,
  ArrowUpRight,
  Fish,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { calculateDOC, getGrowthPercentage } from '../utils/pondUtils';
import { runScheduleEngine } from '../utils/scheduleEngine';
import { Header } from '../components/Header';
import { API_BASE_URL } from '../config';
import { cn } from '../utils/cn';
import { getLunarStatus } from '../utils/lunarUtils';
import { Translations } from '../translations';
import { User } from '../types';
import { useFirebaseAlerts } from '../hooks/useFirebaseAlerts';

// ─── MARKET RATE DATA ────────────────────────────────────────────────────────
const MARKET_RATES = [
  { count: 20, price: 620, demand: 'ULTRA HIGH', trend: 'up' },
  { count: 30, price: 540, demand: 'HIGH',       trend: 'up' },
  { count: 40, price: 490, demand: 'HIGH',       trend: 'up' },
  { count: 50, price: 450, demand: 'STABLE',     trend: 'stable' },
  { count: 60, price: 410, demand: 'STABLE',     trend: 'stable' },
  { count: 70, price: 385, demand: 'MEDIUM',     trend: 'down' },
  { count: 80, price: 365, demand: 'MEDIUM',     trend: 'down' },
  { count: 100, price: 310, demand: 'LOW',       trend: 'down' },
  { count: 120, price: 280, demand: 'LOW',       trend: 'down' },
];

// ─── LIVE MARKET TICKER ───────────────────────────────────────────────────────
const LiveMarketTicker = () => {
  const tickerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  
  // Rotating Areas logic - Now synced to scroll completion
  const AREAS = ['Bhimavaram', 'Nellore', 'Kakinada', 'Balasore', 'Surat', 'Pattukkottai'];
  const [areaIdx, setAreaIdx] = useState(0);

  // Realistic Market Price Variations - Memoized to ensure UI reactivity
  const items = React.useMemo(() => {
    // Each region has a distinct economic multiplier to make the "Market Change" visible
    const areaMultipliers = [1.0, 1.12, 0.92, 0.88, 1.25, 1.05];
    const mult = areaMultipliers[areaIdx] || 1;
    
    return [...MARKET_RATES, ...MARKET_RATES].map(r => ({
      ...r,
      price: Math.round(r.price * mult)
    }));
  }, [areaIdx]);

  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;
    let pos = 0;
    
    // Ensure accurate metrics for the loop
    const getScrollWidth = () => ticker.scrollWidth / 2;

    const animate = () => {
      pos += 0.5; // Smooth scroll speed
      const scrollLimit = getScrollWidth();
      
      if (pos >= scrollLimit) {
        pos = 0;
        // Cycle to next area ONLY when scroll finishes
        // This triggers a React re-render, but ONLY once per full scroll
        setAreaIdx(prev => (prev + 1) % AREAS.length);
      }
      
      // Direct DOM manipulation bypasses React render cycle for 60fps smoothness
      if (ticker) {
        ticker.style.transform = `translateX(-${pos}px)`;
      }
      
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [items]); // Re-start when items change to ensure scrollWidth is correct

  return (
    <div className="bg-[#02130F] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl shadow-black/30">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live Market Rates</p>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
             <motion.p 
               key={AREAS[areaIdx]}
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -5 }}
               className="text-[8px] font-black text-white/40 uppercase tracking-widest"
             >
               ₹/Kg · <span className="text-white">{AREAS[areaIdx]}</span>
             </motion.p>
          </AnimatePresence>
          <button
            onClick={() => {/* navigate to market */}}
            className="text-[7px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full font-black uppercase tracking-widest border border-emerald-500/20"
          >
            Full Market →
          </button>
        </div>
      </div>

      {/* Scrolling ticker */}
      <div className="overflow-hidden py-3">
        <div
          ref={tickerRef}
          className="flex gap-3 px-4"
          style={{ willChange: 'transform' }}
        >
          {items.map((rate, i) => (
            <div
              key={`${areaIdx}-${i}`}
              className={cn(
                'flex-shrink-0 rounded-2xl px-4 py-2.5 border',
                rate.demand === 'ULTRA HIGH' || rate.demand === 'HIGH'
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : rate.trend === 'down'
                  ? 'bg-red-900/10 border-red-500/10'
                  : 'bg-white/5 border-white/5'
              )}
            >
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">{rate.count}/kg</p>
              <p className={cn(
                'font-black text-lg tracking-tighter',
                rate.demand === 'ULTRA HIGH' ? 'text-emerald-300' :
                rate.demand === 'HIGH' ? 'text-white' :
                rate.trend === 'down' ? 'text-red-400' : 'text-white/70'
              )}>₹{rate.price}</p>
              <div className="flex items-center gap-1 mt-1">
                {rate.trend === 'up' ? (
                  <TrendingUp size={9} className="text-emerald-400" />
                ) : rate.trend === 'down' ? (
                  <TrendingDown size={9} className="text-red-400" />
                ) : (
                  <Minus size={9} className="text-white/20" />
                )}
                <p className={cn(
                  'text-[7px] font-black uppercase tracking-widest',
                  rate.demand === 'HIGH' || rate.demand === 'ULTRA HIGH' ? 'text-emerald-400' :
                  rate.demand === 'STABLE' ? 'text-blue-400' :
                  rate.demand === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'
                )}>{rate.demand}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price grid 3-col footer */}
      <div className="grid grid-cols-3 border-t border-white/5">
        {items.slice(0, 6).map((rate, i) => (
          <div key={`${areaIdx}-foot-${i}`} className={cn(
            'px-3 py-2.5 text-center border-r border-b border-white/5',
            i % 3 === 2 && 'border-r-0',
            i >= 3 && 'border-b-0'
          )}>
            <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">{rate.count}/kg</p>
            <p className={cn(
              'font-black text-sm tracking-tighter mt-0.5',
              rate.demand === 'HIGH' || rate.demand === 'ULTRA HIGH' ? 'text-emerald-300' : 'text-white/50'
            )}>₹{rate.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── DOC PROGRESS RADIAL ──────────────────────────────────────────────────────
const DocProgressRing = ({ doc, target = 90, label }: { doc: number; target?: number; label: string }) => {
  const pct = Math.min(100, (doc / target) * 100);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
          <circle cx="32" cy="32" r={r} strokeWidth="5" stroke="rgba(255,255,255,0.06)" fill="none" />
          <circle
            cx="32" cy="32" r={r} strokeWidth="5" fill="none"
            stroke={pct >= 100 ? '#34d399' : pct >= 70 ? '#fbbf24' : '#60a5fa'}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-black text-white">{doc}</span>
        </div>
      </div>
      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-1.5 text-center max-w-[60px] leading-tight">{label}</p>
    </div>
  );
};

// ─── MINI BAR SPARKLINE ───────────────────────────────────────────────────────
const MiniBarChart = ({
  data,
  color = '#34d399',
  label,
}: {
  data: number[];
  color?: string;
  label: string;
}) => {
  const max = Math.max(...data);
  return (
    <div>
      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-end gap-1 h-10">
        {data.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${(v / max) * 100}%`,
              background: i === data.length - 1 ? color : `${color}44`,
              transition: `height 0.6s ease ${i * 0.05}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ─── PRICE LINE SPARKLINE ─────────────────────────────────────────────────────
const SparkLine = ({ data, color = '#34d399' }: { data: number[]; color?: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point highlight */}
      <circle
        cx={(data.length - 1) / (data.length - 1) * w}
        cy={h - ((data[data.length - 1] - min) / range) * h}
        r="3"
        fill={color}
      />
    </svg>
  );
};

// ─── ANALYTICS SECTION ────────────────────────────────────────────────────────
const AnalyticsSection = ({ activePonds }: { activePonds: any[] }) => {
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const feedData  = [82, 75, 90, 88, 95, 70, 92];
  const phData    = [7.8, 7.9, 8.1, 7.7, 7.8, 8.0, 7.8];
  const doData    = [5.2, 5.5, 4.9, 5.8, 6.0, 5.3, 5.7];
  const priceWeek = [480, 470, 510, 490, 500, 485, 490];

  const hasEnoughData = activePonds.some(p => calculateDOC(p.stockingDate) >= 7);

  const totalBiomassT = activePonds.reduce((acc, p) => {
    const doc = calculateDOC(p.stockingDate);
    const wG = Math.min(35, doc * 0.38);
    const live = (p.seedCount ?? 100000) * 0.80;
    return acc + (live * wG) / 1_000_000;
  }, 0);

  const avgDoc = activePonds.length > 0
    ? Math.round(activePonds.reduce((a, p) => a + calculateDOC(p.stockingDate), 0) / activePonds.length)
    : 0;
  const avgCountPerKg = avgDoc > 0 ? Math.round(1000 / Math.min(35, avgDoc * 0.38)) : 999;

  if (!hasEnoughData && activePonds.length > 0) {
    return (
      <section className="px-6 mt-10">
        <div className="bg-white rounded-[2.5rem] p-10 text-center border border-black/5 shadow-sm">
           <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500 animate-pulse">
              <BarChart2 size={40} />
           </div>
           <h3 className="text-[#4A2C2A] font-black text-xl tracking-tighter mb-4">Analytics Compiling</h3>
           <p className="text-[#4A2C2A]/40 text-xs leading-relaxed">
             Insights and trends will appear here once your ponds reach **DOC 7**. We need a full week of data to generate accurate farm trends.
           </p>
           <div className="mt-8 h-2 bg-black/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(Math.max(...activePonds.map(p => calculateDOC(p.stockingDate))) / 7) * 100}%` }}
                className="h-full bg-amber-400"
              />
           </div>
           <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-4">
              {Math.max(...activePonds.map(p => calculateDOC(p.stockingDate)))} / 7 Days Sampled
           </p>
        </div>
      </section>
    );
  }

  if (activePonds.length === 0) return null;

  return (
    <section className="px-4 mt-6 space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-[#4A2C2A] font-black text-lg tracking-tight flex items-center gap-2">
            <BarChart2 size={20} className="text-[#C78200]" /> Farm Analytics
          </h2>
          <p className="text-[#4A2C2A]/40 text-[9px] font-black uppercase tracking-widest mt-0.5">Live Insights — Updated Daily</p>
        </div>
        <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-200 text-[8px] font-black uppercase tracking-widest">
          Live
        </div>
      </div>

      {/* ── ROW 1: Pond DOC Progress Rings ── */}
      {activePonds.length > 0 && (
        <div className="bg-[#02130F] rounded-[2rem] p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Pond DOC Progress</p>
            <p className="text-[8px] text-white/20 font-black uppercase tracking-widest">Target: DOC 90</p>
          </div>
          <div className="flex justify-around">
            {activePonds.slice(0, 4).map((p, i) => (
              <div key={p.id}>
                <DocProgressRing
                  doc={calculateDOC(p.stockingDate)}
                  label={p.name.split(' ').pop() ?? p.name}
                />
              </div>
            ))}
            {activePonds.length === 0 && (
              <p className="text-white/20 text-xs font-black">No active ponds</p>
            )}
          </div>
        </div>
      )}

      {/* ── ROW 2: Two mini-charts ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Feed Efficiency */}
        <div className="bg-[#02130F] rounded-[2rem] p-4 border border-white/5">
          <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-3">Feed Efficiency</p>
          <MiniBarChart data={feedData} color="#34d399" label="% of target this week" />
          <div className="flex justify-between mt-2">
            {weekDays.map((d, i) => (
              <p key={i} className="flex-1 text-center text-[7px] font-black text-white/20">{d}</p>
            ))}
          </div>
          <div className="mt-3 border-t border-white/5 pt-2">
            <p className="text-emerald-300 font-black text-xl tracking-tighter">
              {feedData[feedData.length - 1]}%
              <span className="text-[8px] text-white/20 ml-1">today</span>
            </p>
          </div>
        </div>

        {/* Pond Health Score */}
        <div className="bg-[#02130F] rounded-[2rem] p-4 border border-white/5">
          <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-3">Water pH Trend</p>
          <div className="h-10 mb-1">
            <SparkLine data={phData} color="#60a5fa" />
          </div>
          <div className="flex justify-between mt-1">
            {weekDays.map((d, i) => (
              <p key={i} className="flex-1 text-center text-[7px] font-black text-white/20">{d}</p>
            ))}
          </div>
          <div className="mt-3 border-t border-white/5 pt-2">
            <p className="text-blue-300 font-black text-xl tracking-tighter">
              {phData[phData.length - 1]}
              <span className="text-[8px] text-white/20 ml-1">pH today</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Price trend + DO sparkline ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Market Price Trend */}
        <div className="bg-[#02130F] rounded-[2rem] p-4 border border-white/5">
          <p className="text-[8px] font-black text-[#C78200] uppercase tracking-widest mb-3">Market Price (₹/kg)</p>
          <div className="h-10 mb-1">
            <SparkLine data={priceWeek} color="#C78200" />
          </div>
          <div className="flex justify-between mt-1">
            {weekDays.map((d, i) => (
              <p key={i} className="flex-1 text-center text-[7px] font-black text-white/20">{d}</p>
            ))}
          </div>
          <div className="mt-3 border-t border-white/5 pt-2">
            <p className="text-[#C78200] font-black text-xl tracking-tighter">
              ₹{priceWeek[priceWeek.length - 1]}
              <span className="text-[8px] text-white/20 ml-1">avg 50/kg</span>
            </p>
          </div>
        </div>

        {/* DO trend */}
        <div className="bg-[#02130F] rounded-[2rem] p-4 border border-white/5">
          <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mb-3">Dissolved O₂</p>
          <MiniBarChart data={doData} color="#fbbf24" label="mg/L this week" />
          <div className="flex justify-between mt-2">
            {weekDays.map((d, i) => (
              <p key={i} className="flex-1 text-center text-[7px] font-black text-white/20">{d}</p>
            ))}
          </div>
          <div className="mt-3 border-t border-white/5 pt-2">
            <p className="text-amber-300 font-black text-xl tracking-tighter">
              {doData[doData.length - 1]}
              <span className="text-[8px] text-white/20 ml-1">mg/L today</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── ROW 4: Farm Summary Metrics ── */}
      <div className="bg-gradient-to-br from-[#0D523C] to-[#051F19] rounded-[2rem] p-5 border border-emerald-500/10">
        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-4">Farm Overview</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Est. Biomass', value: `${totalBiomassT.toFixed(1)}T`, icon: Fish, color: 'text-emerald-300' },
            { label: 'Avg DOC',      value: `${avgDoc} days`,              icon: Activity, color: 'text-blue-300' },
            { label: 'Avg Count',    value: `~${avgCountPerKg > 200 ? '???' : avgCountPerKg}/kg`, icon: BarChart2, color: 'text-[#C78200]' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className={cn('w-8 h-8 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-2', item.color)}>
                <item.icon size={16} />
              </div>
              <p className={cn('font-black text-base tracking-tighter', item.color)}>{item.value}</p>
              <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Revenue estimate bar */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <div className="flex justify-between items-baseline mb-2">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Est. Harvest Revenue</p>
            <p className="text-emerald-300 font-black text-sm">
              ₹{(totalBiomassT * 1000 * 450 / 100000).toFixed(1)}L
            </p>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, totalBiomassT * 20)}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              className="h-full bg-emerald-400 rounded-full"
            />
          </div>
          <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-1">Based on ₹450/kg avg market rate</p>
        </div>
      </div>
    </section>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export const Dashboard = ({ user, t, onMenuClick }: { user: User, t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, reminders } = useData();
  const [showWeatherAlert, setShowWeatherAlert] = React.useState(true);
  const [showSystemAlert, setShowSystemAlert] = React.useState(true);
  const [showMarketAlert, setShowMarketAlert] = React.useState(true);
  const [showLunarAlert, setShowLunarAlert] = React.useState(true);
  const activePonds = ponds.filter(p => p.status === 'active');
  const [selectedPondId, setSelectedPondId] = React.useState<string>(activePonds[0]?.id || '');

  const selectedPond = React.useMemo(() => 
    ponds.find(p => p.id === selectedPondId) || activePonds[0]
  , [selectedPondId, ponds, activePonds]);

  // Firebase Auto Schedule Sync
  const { incomingAlert, clearAlert } = useFirebaseAlerts(user.language);

  const engineAlerts = React.useMemo(() => {
    return activePonds.flatMap(p => {
      const doc = calculateDOC(p.stockingDate);
      const result = runScheduleEngine(doc, Number(p.size ? p.size * 20000 : 200000), p.status === 'harvested');
      return result?.activeAlerts.map(a => ({ ...a, pondName: p.name, pondId: p.id })) || [];
    });
  }, [activePonds]);

  const pondTasks = React.useMemo(() => {
    if (!selectedPond) return [];
    const p = selectedPond;
    const doc = calculateDOC(p.stockingDate);
    const result = runScheduleEngine(doc, Number(p.seedCount) || 200000, p.status === 'harvested');
    return result?.dailySchedule.map(s => ({
       title: s.task,
       desc: `${s.time} • Optimized as per SOP DOC ${doc}`,
       tag: s.type.toUpperCase(),
       icon: s.type === 'feed' ? Utensils : s.type === 'check' ? Activity : s.type === 'med' ? Box : Zap,
       color: s.type === 'feed' ? 'text-emerald-500' : s.type === 'check' ? 'text-blue-500' : s.type === 'med' ? 'text-[#C78200]' : 'text-amber-500'
    })) || [];
  }, [activePonds]);

  const lunar = getLunarStatus(new Date());

  const avgDoc = activePonds.length > 0
    ? Math.floor(activePonds.reduce((acc, p) => {
      const start = p.stockingDate ? new Date(p.stockingDate).getTime() : Date.now();
      const diff = Math.max(0, Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)));
      return acc + diff;
    }, 0) / activePonds.length)
    : 0;

  const totalArea = activePonds.reduce((acc, p) => acc + (Number(p.size) || 0), 0);
  const totalSeeds = activePonds.reduce((acc, p) => acc + (Number(p.seedCount) || 0), 0);

  return (
    <div className="pb-32 bg-[#F8F9FE] min-h-screen">
      <Header title="AquaGrow" onMenuClick={onMenuClick} />

      {/* High Alert Banners */}
      <div className="px-4 pt-24 space-y-4">
        {/* SOP Engine Alerts */}
        <AnimatePresence>
          {engineAlerts.map((alert, i) => (
            <motion.div 
              key={`engine-alert-${alert.pondId}-${i}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                "p-5 rounded-[2.2rem] border shadow-lg flex items-start gap-4 transition-all relative overflow-hidden",
                alert.type === 'critical' ? "bg-red-50 border-red-200 text-red-900" : "bg-amber-50 border-amber-200 text-amber-900"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                alert.type === 'critical' ? "bg-red-500 text-white" : "bg-amber-500 text-white"
              )}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <span className={cn(
                     "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                     alert.type === 'critical' ? "bg-red-500/10 border-red-500/20 text-red-600" : "bg-amber-500/10 border-amber-500/20 text-amber-600"
                   )}>
                      SOP Engine Alert • {alert.pondName}
                   </span>
                </div>
                <h3 className="font-black text-base tracking-tighter leading-tight mb-1">{alert.title}</h3>
                <p className="text-[10px] font-medium opacity-60 leading-relaxed italic truncate max-w-[200px]">{alert.trigger}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {activePonds.length === 0 ? (
          <div className="mt-10">
            <div className="bg-white p-10 rounded-[3rem] text-center shadow-xl border border-black/5">
              <div className="w-20 h-20 bg-[#F8F9FE] rounded-full flex items-center justify-center mx-auto mb-6 text-[#C78200]">
                <Plus size={40} />
              </div>
              <h3 className="text-[#4A2C2A] font-black text-xl tracking-tighter mb-4">{t.startYourFirstPond}</h3>
              <p className="text-[#4A2C2A]/40 text-xs leading-relaxed mb-8">
                {t.addFirstPondDesc}
              </p>
              <button
                onClick={() => navigate('/ponds/new')}
                className="w-full py-5 bg-[#C78200] text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[#C78200]/20 transition-all active:scale-95"
              >
                {t.addPond}
              </button>
            </div>
          </div>
        ) : (
          <>
        {/* ── FIREBASE ALERTS / SYNC ── */}
        <AnimatePresence>
          {incomingAlert && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#0D523C] text-white p-5 rounded-[2.5rem] shadow-2xl border border-emerald-500/30">
               <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                     <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
                        <Bell size={24} className="text-emerald-300" />
                     </div>
                     <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">Auto Engine Alert</p>
                       <h3 className="font-black text-lg tracking-tighter leading-tight mb-1">{incomingAlert.title}</h3>
                       <p className="text-xs text-white/70 font-black leading-relaxed">{incomingAlert.body}</p>
                     </div>
                  </div>
                  <button onClick={clearAlert} className="text-white/40 bg-white/5 p-2 rounded-xl transition-colors hover:text-white shrink-0"><X size={16}/></button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lunar Alert */}
        {showLunarAlert && lunar.phase === 'AMAVASYA' && (
          <div className="bg-[#1A1C2E] border border-white/5 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/10 group animate-in fade-in slide-in-from-top-4 duration-700">
            <button
              onClick={(e) => { e.stopPropagation(); setShowLunarAlert(false); }}
              className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors p-2 z-20"
            >
              <X size={18} />
            </button>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Moon size={20} className="text-white fill-white animate-pulse" />
                </div>
                <h3 className="text-sm font-black tracking-tight text-white uppercase tracking-[0.2em]">{t.moonPhaseTitle}</h3>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tighter mb-2">{t.amavasyaWarning}</h2>
              <p className="text-white/60 text-xs font-black tracking-tight leading-relaxed mb-6">
                {t.massMoltingRisk} Action required immediately.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-[7px] text-white/40 font-black uppercase tracking-widest mb-1">Night Aeration</p>
                  <p className="text-[10px] font-black text-emerald-400">Run ALL Units</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-[7px] text-white/40 font-black uppercase tracking-widest mb-1">Feeding Plan</p>
                  <p className="text-[10px] font-black text-orange-400">Reduce 30%</p>
                </div>
              </div>
            </div>
            <div className="absolute right-[-10%] bottom-[-10%] opacity-5 group-hover:scale-110 transition-transform duration-1000">
              <Moon size={200} />
            </div>
          </div>
        )}

        {/* Weather Alert */}
        {showWeatherAlert && (
          <div
            onClick={() => navigate('/weather')}
            className="bg-[#F3F4FF] border border-[#D9DFFF] rounded-[1.5rem] p-5 flex items-start gap-4 shadow-sm relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
          >
            <button
              onClick={(e) => { e.stopPropagation(); setShowWeatherAlert(false); }}
              className="absolute top-4 right-4 text-[#4A2C2A]/20 hover:text-[#4A2C2A] transition-colors p-1"
            >
              <X size={16} />
            </button>
            <div className="flex-1 relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#4A2C2A] font-black text-sm tracking-tight">{t.weatherAlert}</span>
                <AlertTriangle size={14} className="text-[#99472E]" />
              </div>
              <p className="text-[#4A2C2A]/60 text-[10px] leading-relaxed">
                {t.heavyRainfallDesc}
              </p>
            </div>
          </div>
        )}


        {/* ── LIVE MARKET RATES TICKER ── */}
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
          <LiveMarketTicker />
        </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              {[
                { icon: LayersIcon, label: t.totalPonds,  value: ponds.length.toString(),             sub: 'Operational Count', color: 'text-[#C78200]' },
                { icon: Calculator, label: t.totalArea,   value: `${totalArea} ${t.acres}`,           sub: 'Combined Farm Size', color: 'text-[#C78200]' },
                { icon: Zap,        label: t.totalStock,  value: totalSeeds.toLocaleString(),          sub: 'Seed Population',   color: 'text-[#C78200]' },
                { icon: Utensils,   label: t.feedAlerts,  value: reminders.filter((r: any) => r.status === 'pending').length.toString().padStart(2, '0'), sub: 'Action Required', color: 'text-red-500', path: '/notifications' },
              ].map((stat, i) => (
                <div key={i} onClick={() => stat.path && navigate(stat.path)} className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-black/5 hover:scale-[1.02] transition-all cursor-pointer">
                  <div className={cn('p-2 bg-[#F8F9FE] rounded-lg inline-block mb-3', stat.color)}>
                    <stat.icon size={16} />
                  </div>
                  <p className="text-[#4A2C2A]/30 text-[8px] font-black uppercase tracking-widest">{stat.label}</p>
                  <p className="text-[#4A2C2A] text-xl font-black tracking-tighter mt-1">{stat.value}</p>
                  <p className={cn('text-[8px] font-bold tracking-tight mt-1 opacity-60', i === 3 && 'text-red-500 opacity-100')}>{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* ── ANALYTICS GRAPHS ── */}
            <AnalyticsSection activePonds={activePonds} />

            {/* Today's Tasks */}
            <section className="mt-6">
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-[#4A2C2A] text-lg font-black tracking-tight">{t.todaysTasks}</h2>
                <button className="text-[#C78200] text-[9px] font-black uppercase tracking-widest">{t.viewSchedule}</button>
              </div>
              <div className="space-y-3">
                {pondTasks.length > 0 ? (
                  pondTasks.map((task, i) => (
                    <div key={`task-${i}`} className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-black/5 flex items-center gap-4 group hover:border-[#C78200]/30 transition-all">
                      <div className={cn('p-2.5 rounded-2xl bg-[#F8F9FE] transition-colors group-hover:bg-[#C78200]/5', task.color)}>
                        <task.icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="text-[#4A2C2A] font-black text-sm tracking-tight">{task.title}</h3>
                          <span className={cn(
                            "text-[7px] font-black px-2 py-0.5 rounded-md whitespace-nowrap uppercase tracking-widest",
                            task.tag === 'FEED' ? 'bg-emerald-50 text-emerald-500' :
                            task.tag === 'CHECK' ? 'bg-blue-50 text-blue-500' :
                            'bg-amber-50 text-amber-500'
                          )}>{task.tag}</span>
                        </div>
                        <p className="text-[#4A2C2A]/40 text-[9px] mt-1 pr-6 leading-tight truncate">{task.desc}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-10 rounded-[2rem] text-center border border-black/5">
                     <p className="text-[#4A2C2A]/30 text-xs font-black">No tasks computed for this stage.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Active Ponds Summary */}
            <section className="mt-6">
              <h2 className="text-[#4A2C2A] text-lg font-black tracking-tight mb-4 px-2">{t.activePonds}</h2>
              <div className="space-y-4">
                {activePonds.slice(0, 3).map((p, i) => (
                  <div key={`pond-dash-${p.id}-${i}`} onClick={() => navigate(`/ponds/${p.id}`)} className="bg-white p-6 rounded-[2.2rem] shadow-sm border border-black/5 relative group cursor-pointer active:scale-[0.98] transition-all">
                    <div className="absolute top-6 right-6 p-2 bg-[#F8F9FE] rounded-xl text-[#C78200]">
                      <ArrowRight size={16} />
                    </div>
                    <h3 className="text-[#4A2C2A] font-black text-base tracking-tight mb-1">{p.name}</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <p className="text-[#C78200] text-[9px] font-black uppercase tracking-widest">{p.species}</p>
                      <div className="w-1 h-1 bg-black/10 rounded-full" />
                      <p className="text-ink/30 text-[9px] font-black uppercase tracking-widest">{t.doc}: {calculateDOC(p.stockingDate)} {t.days}</p>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-ink/30">
                        <span>{t.growthStage}</span>
                        <span className="text-emerald-500">{getGrowthPercentage(calculateDOC(p.stockingDate))}%</span>
                      </div>
                      <div className="h-1 bg-[#F8F9FE] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                          style={{ width: `${getGrowthPercentage(calculateDOC(p.stockingDate))}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="bg-[#F8F9FE] px-3 py-1.5 rounded-xl border border-black/5 flex items-center gap-2">
                        <Droplets size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-[#4A2C2A]">pH 7.8</span>
                      </div>
                      <div className="bg-[#F8F9FE] px-3 py-1.5 rounded-xl border border-black/5 flex items-center gap-2">
                        <Zap size={12} className="text-[#C78200]" />
                        <span className="text-[10px] font-black text-[#4A2C2A]">DO 5.2</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

const ArrowRight = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14m-7-7 7 7-7 7" />
  </svg>
);
