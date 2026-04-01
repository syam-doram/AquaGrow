import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  TrendingDown, 
  TrendingUp,
  CreditCard,
  Plus,
  Zap,
  Users,
  Briefcase,
  Fish,
  Wheat,
  Pill,
  Droplets,
  PackageCheck,
  Building2,
  Calendar,
  Wallet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../utils/cn';
import { Translations } from '../translations';

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────
const CategoryProgressCard = ({ icon: Icon, label, value, progress, color, bg }: any) => (
  <div className={cn("rounded-[2.5rem] p-6 border", bg)}>
    <div className="flex items-center justify-between mb-4">
      <div className={cn("w-10 h-10 rounded-[1rem] flex items-center justify-center", color.bg, color.text)}>
         <Icon size={20} />
      </div>
      <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full", color.bg, color.text)}>
        {progress}%
      </span>
    </div>
    <div>
       <p className="text-[10px] font-black uppercase tracking-widest text-opacity-50 mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
       <h4 className="text-xl font-black tracking-tight text-white">₹{value.toLocaleString()}</h4>
    </div>
    <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
       <motion.div 
         initial={{ width: 0 }}
         animate={{ width: `${progress}%` }}
         transition={{ duration: 1, ease: "easeOut" }}
         className={cn("h-full rounded-full", color.fill)} 
       />
    </div>
  </div>
);

const LineItem = ({ icon: Icon, title, desc, amount, tag, tagColor }: any) => (
  <div className="flex items-center justify-between py-5 border-b border-white/5 last:border-0 group cursor-pointer active:scale-95 transition-all">
     <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:bg-[#C78200]/10 group-hover:text-[#C78200] transition-all border border-white/5">
           <Icon size={20} />
        </div>
        <div>
           <h4 className="text-sm font-black tracking-tight text-white mb-0.5 group-hover:text-[#C78200] transition-colors">{title}</h4>
           <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
             <Calendar size={10} className="text-white/20" /> {desc}
           </p>
        </div>
     </div>
     <div className="text-right flex flex-col items-end">
        <p className="text-sm font-black tracking-tighter text-white mb-1">₹{amount.toLocaleString()}</p>
        <span className={cn("text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border", tagColor.bg, tagColor.text, tagColor.border)}>
          {tag}
        </span>
     </div>
  </div>
);

// ─── MAIN EXPENSE REPORT PAGE ────────────────────────────────────────────────
export const ExpenseReport = ({ t, onMenuClick }: { t: Translations, onMenuClick?: () => void }) => {
  const navigate = useNavigate();

  // Load from local storage if available, else use a realistic active cycle mock
  const savedEntries = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('roi_entries') || '[]'); } 
    catch { return []; }
  }, []);

  // For Farmer view, we show "Active Cycle" expenses. Let's aggregate from the newest entry 
  // or use a very realistic mock for shrimp farming if none exists.
  const latestEntry = savedEntries.length > 0 ? savedEntries[savedEntries.length - 1] : null;

  const n = (v: any) => parseFloat(v) || 0;
  
  // Realistic Shrimp Farming breakdown (mock if no data)
  const feedCost = latestEntry ? n(latestEntry.feedCost) : 320000;
  const seedCost = latestEntry ? n(latestEntry.seedCost) : 85000;
  const medicineCost = latestEntry ? n(latestEntry.medicineCost) : 45000;
  const utilitiesCost = latestEntry ? n(latestEntry.utilityCost) : 95000;
  const laborCost = latestEntry ? n(latestEntry.laborCost) : 60000;
  const otherCost = latestEntry ? n(latestEntry.otherCost) + n(latestEntry.infrastructureCost) : 25000;

  const totalSpend = feedCost + seedCost + medicineCost + utilitiesCost + laborCost + otherCost;

  // Breakdown %
  const pct = (val: number) => totalSpend > 0 ? Math.round((val / totalSpend) * 100) : 0;

  // Daily run rate (assume DOC 65)
  const currentDoc = 65;
  const dailyRunRate = totalSpend / currentDoc;

  // Bar chart data showing daily expenses over last 14 days
  const trendData = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      day: `D${currentDoc - 13 + i}`,
      cost: i === 13 ? 0 : Math.random() * 5000 + 4000 + (i === 5 ? 15000 : 0), // spike for diesel/feed
      highlight: i === 5
    }));
  }, []);

  return (
    <div className="pb-[180px] bg-[#02130F] min-h-[100dvh] text-left font-sans text-white">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-[#02130F]/90 backdrop-blur-xl px-5 py-6 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-3 text-white/50 hover:bg-white/5 rounded-2xl transition-all">
          <ChevronLeft size={22} />
        </button>
        <div className="flex flex-col items-center">
           <h1 className="text-sm font-black text-white tracking-tight">{t.activeCycleAudit}</h1>
           <p className="text-[8px] font-black text-[#C78200] uppercase tracking-widest mt-0.5">{t.doc} {currentDoc} · {t.liveTracking}</p>
        </div>
        <div className="w-12" />
      </header>

      <div className="pt-28 px-5 space-y-8">
        
        {/* HERO TOTAL CARD */}
        <div className="bg-gradient-to-br from-[#051F19] to-[#02130F] p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
           <div className="absolute right-[-10%] top-[-10%] opacity-5 pointer-events-none">
              <Wallet size={200} strokeWidth={1} />
           </div>
           <div className="relative z-10 text-center">
              <div className="flex items-center justify-center gap-2 mb-6 text-[#C78200]">
                 <div className="w-2 h-2 rounded-full bg-[#C78200] animate-pulse" />
                 <p className="text-[9px] font-black uppercase tracking-[0.3em]">{t.totalCycleSpend}</p>
              </div>
              <h3 className="text-5xl font-black tracking-tighter text-white mb-6">₹{(totalSpend / 100000).toFixed(2)}<span className="text-2xl text-white/40">L</span></h3>
              
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6 mt-2">
                 <div>
                    <p className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">{t.avgRunRate}</p>
                    <p className="text-white font-black text-base tracking-tighter">₹{Math.round(dailyRunRate).toLocaleString()}<span className="text-[9px] text-white/40 ml-1">/day</span></p>
                 </div>
                 <div>
                    <p className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">{t.forecastTarget}</p>
                    <p className="text-emerald-500 font-black text-base tracking-tighter">{t.onBudget}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* 14-DAY SPENDING TREND */}
        <div className="bg-[#051F19] rounded-[2.5rem] p-6 border border-white/5 space-y-6">
           <div className="flex items-center justify-between">
              <div>
                 <p className="text-[#C78200] text-[9px] font-black uppercase tracking-[0.2em] mb-1">{t.fourteenDayTrajectory}</p>
                 <h3 className="text-white font-black tracking-tight">{t.dailyExpenses}</h3>
              </div>
              <div className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl text-[8px] font-black text-white/40 uppercase tracking-widest">
                 {t.live}
              </div>
           </div>

           <div className="h-40 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={trendData}>
                    <Bar dataKey="cost" radius={[4, 4, 0, 0]} maxBarSize={30}>
                       {trendData.map((entry, index) => (
                          <Cell key={index} fill={entry.highlight ? "#C78200" : "rgba(255,255,255,0.05)"} />
                       ))}
                    </Bar>
                    <Tooltip 
                       cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                       contentStyle={{ backgroundColor: '#02130F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                       formatter={(val: number) => [`₹${val.toLocaleString()}`, t.cost]}
                       labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                    />
                    <ReferenceLine y={dailyRunRate} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                 </BarChart>
              </ResponsiveContainer>
           </div>
           <p className="text-[8px] font-bold text-white/30 text-center uppercase tracking-widest">{t.dashedLineRunRate} (₹{Math.round(dailyRunRate).toLocaleString()})</p>
        </div>

        {/* CATEGORY PROGRESS GRID */}
        <div>
           <div className="flex items-center justify-between px-2 mb-4">
              <h3 className="text-white font-black tracking-tight">{t.categoryBreakdown}</h3>
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{t.pctOfTotalSpend}</span>
           </div>
           <div className="grid grid-cols-2 gap-3">
              <CategoryProgressCard 
                 icon={Wheat} 
                 label={t.pelletFeed} 
                 value={feedCost} 
                 progress={pct(feedCost)} 
                 color={{ bg: 'bg-[#C78200]/10', text: 'text-[#C78200]', fill: 'bg-[#C78200]' }} 
                 bg="bg-gradient-to-b from-[#C78200]/5 to-transparent border-[#C78200]/10"
              />
              <CategoryProgressCard 
                 icon={Fish} 
                 label={t.seedPlsCost} 
                 value={seedCost} 
                 progress={pct(seedCost)} 
                 color={{ bg: 'bg-emerald-500/10', text: 'text-emerald-500', fill: 'bg-emerald-500' }} 
                 bg="bg-[#051F19] border-white/5"
              />
              <CategoryProgressCard 
                 icon={Zap} 
                 label={t.gridPowerBill} 
                 value={utilitiesCost} 
                 progress={pct(utilitiesCost)} 
                 color={{ bg: 'bg-orange-500/10', text: 'text-orange-500', fill: 'bg-orange-500' }} 
                 bg="bg-[#051F19] border-white/5"
              />
              <CategoryProgressCard 
                 icon={Pill} 
                 label={t.medicineProbiotics} 
                 value={medicineCost} 
                 progress={pct(medicineCost)} 
                 color={{ bg: 'bg-blue-500/10', text: 'text-blue-500', fill: 'bg-blue-500' }} 
                 bg="bg-[#051F19] border-white/5"
              />
           </div>
        </div>

        {/* RECENTS / TOP LIST */}
        <div className="space-y-4 pt-4">
           <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-white font-black tracking-tight">{t.majorExpenses}</h3>
              <button className="text-[#C78200] text-[9px] font-black uppercase tracking-widest bg-[#C78200]/10 px-3 py-1.5 rounded-xl">{t.viewPdfLog}</button>
           </div>
           
           <div className="bg-[#051F19] rounded-[2.5rem] p-5 border border-white/5">
              <LineItem 
                icon={Wheat} 
                title="Grower Feed (Batch #92)" 
                desc="DOC 60 • Coastal Feed Vents" 
                amount={85000} 
                tag="FEED MGR" 
                tagColor={{ bg: 'bg-[#C78200]/10', text: 'text-[#C78200]', border: 'border-[#C78200]/20' }} 
              />
              <LineItem 
                icon={Zap} 
                title="Bulk Diesel Refill" 
                desc="DOC 52 • Reliance Petro" 
                amount={45000} 
                tag="UTILITIES" 
                tagColor={{ bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' }} 
              />
              <LineItem 
                icon={Pill} 
                title="Nitrite Fix & Minerals" 
                desc="DOC 48 • AquaCare Labs" 
                amount={22000} 
                tag="MEDICINE" 
                tagColor={{ bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' }} 
              />
              <LineItem 
                icon={Users} 
                title="Harvest Net Labor Advance" 
                desc="DOC 65 • Local Syndicate" 
                amount={15000} 
                tag="LABOR" 
                tagColor={{ bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' }} 
              />
           </div>
        </div>
      </div>

      {/* FIXED LOG BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-5 z-40 bg-gradient-to-t from-[#02130F] via-[#02130F] to-transparent pt-20">
         <button 
           onClick={() => navigate('/daily-expense')}
           className="w-full bg-[#C78200] text-white py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[#C78200]/20 flex items-center justify-center gap-3 active:scale-95 transition-all outline-none"
         >
           <Plus size={20} /> {t.logDailyExpense}
         </button>
      </div>
    </div>
  );
};
