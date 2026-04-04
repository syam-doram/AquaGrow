import React, { useState } from 'react';
import { 
  TrendingUp, 
  ChevronRight, 
  MapPin, 
  Filter,
  Activity,
  Zap,
  Box
} from 'lucide-react';
import { Header } from '../../components/Header';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

export const MarketPrices = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const { marketPrices } = useData();
  const [activeTab, setActiveTab] = useState('vannamei');
  const [selectedArea, setSelectedArea] = useState('Bhimavaram');
  const [selectedCount, setSelectedCount] = useState<any>(null);
  
  const speciesData = [
    { id: 'vannamei', name: 'Vannamei' },
    { id: 'tiger', name: t.blackTiger },
    { id: 'scampi', name: t.scampi }
  ];

  const areas = [
    { id: 'Bhimavaram', name: t.bhimavaram },
    { id: 'Nellore', name: t.nellore },
    { id: 'Vizag', name: t.vizag },
    { id: 'Kakinada', name: t.kakinada }
  ];

  const filteredPrices = marketPrices.filter(p => !selectedArea || p.location === selectedArea);

  if (selectedCount) {
    return (
      <CountDetailView 
        price={selectedCount} 
        t={t} 
        onBack={() => setSelectedCount(null)} 
      />
    );
  }

  return (
    <div className="pb-40 bg-transparent min-h-screen relative overflow-hidden">
      {/* ── Page Accents (Layered with Global) ── */}
      <div className="absolute top-20 right-[-10%] w-[80%] h-[30%] bg-amber-100/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-[10%] left-[-10%] w-[60%] h-[40%] bg-emerald-50/10 rounded-full blur-[120px] -z-10" />
      <Header title={t.market} onMenuClick={onMenuClick} />
      
      <div className="pt-24 px-4 py-6">
        {/* Daily Export Price Index Snapshot - PERSISTENT IN MARKET PAGE */}
        <div className="bg-[#0D523C] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-[#0D523C]/20 mb-8">
          <div className="relative z-10 flex justify-between items-start">
            <div className="text-left">
              <p className="text-[#C78200] text-[9px] font-black uppercase tracking-[0.3em] mb-2">{t.marketSnapshot}</p>
              <h3 className="text-xl font-black tracking-tighter tracking-tight mb-4">{t.dailyExportPriceIndex}</h3>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-black">₹485.50</p>
                <div className="flex items-center gap-1.5 text-emerald-400 font-black text-[10px] mb-1.5">
                  <TrendingUp size={12} />
                  <span>+2.4%</span>
                </div>
              </div>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-4">Updated: Today, 09:30 AM</p>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
               <Activity size={24} className="text-emerald-400" />
            </div>
          </div>
          <div className="absolute right-[-10%] bottom-[-10%] opacity-10">
            <TrendingUp size={180} />
          </div>
        </div>

        {/* Area & Species Selector */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-3xl border border-[#C78200]/10 shadow-sm overflow-x-auto scrollbar-hide">
            {areas.map(a => (
              <button 
                key={a.id}
                onClick={() => setSelectedArea(a.id)}
                className={cn(
                  "px-6 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  selectedArea === a.id ? "bg-[#C78200] text-white shadow-lg" : "text-[#4A2C2A]/40"
                )}
              >
                {a.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
             {speciesData.map(s => (
               <button 
                 key={s.id}
                 onClick={() => setActiveTab(s.id)}
                 className={cn(
                   "px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                   activeTab === s.id ? "bg-[#4A2C2A] text-white border-[#4A2C2A]" : "bg-white text-[#4A2C2A]/30 border-black/5"
                 )}
               >
                 {s.name}
               </button>
             ))}
           </div>
        </div>

         {/* Price Table Section */}
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-black/5">
           <div className="bg-[#0D523C] p-4 flex text-white text-[9px] font-black uppercase tracking-widest text-left">
             <div className="flex-[0.8] pl-2">{t.count}</div>
             <div className="flex-1 text-center">Price (₹/KG)</div>
             <div className="flex-1.5 text-right pr-4">Market Dynamics</div>
             <div className="w-6"></div>
           </div>
           <div className="divide-y divide-black/5">
             {[...filteredPrices].sort((a, b) => b.shrimpSize - a.shrimpSize).map((price, i) => {
               const isUp = price.shrimpSize <= 50; 
               const reason = price.shrimpSize <= 40 ? t.exportDemand : 
                             price.shrimpSize <= 60 ? t.festiveSeason : 
                             t.stockAccumulation;
               
               return (
                 <div 
                   key={i} 
                   onClick={() => setSelectedCount(price)}
                   className={cn("p-6 flex items-center group transition-colors cursor-pointer", i % 2 === 1 ? "bg-[#F8F9FE]" : "bg-white")}
                 >
                   <div className="flex-[0.8] text-left pl-2">
                     <p className="font-black text-base text-[#4A2C2A] tracking-tight">{price.shrimpSize} {t.count}</p>
                     <p className="text-[8px] text-[#4A2C2A]/30 uppercase font-black tracking-widest mt-0.5">{price.demand === 'HIGH' ? t.premium : t.standard}</p>
                   </div>
                   <div className="flex-1 text-center font-black text-lg text-[#0D523C] tracking-tighter">
                     ₹{price.price}.00
                   </div>
                   <div className="flex-1.5 text-right flex flex-col items-end pr-2">
                      <div className="flex items-center gap-1.5 font-black text-[9px] uppercase tracking-widest">
                         {isUp ? (
                           <><TrendingUp size={12} className="text-emerald-500" /> <span className="text-emerald-500">{t.priceUp}</span></>
                         ) : (
                           <><TrendingUp size={12} className="text-red-500 rotate-180" /> <span className="text-red-500">{t.priceDown}</span></>
                         )}
                      </div>
                      <p className="text-[7px] text-[#4A2C2A]/40 font-black uppercase tracking-widest mt-1 text-right max-w-[80px] leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
                         {reason}
                      </p>
                   </div>
                   <div className="w-6 flex justify-end">
                     <ChevronRight size={16} className="text-[#4A2C2A]/10 group-hover:text-[#C78200] group-hover:translate-x-1 transition-all" />
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
      </div>
    </div>
  );
};

const CountDetailView = ({ price, t, onBack }: { price: any, t: Translations, onBack: () => void }) => {
  const trendData = [
    { day: 'MON', price: 480, height: 60 },
    { day: 'TUE', price: 470, height: 45 },
    { day: 'WED', price: 510, height: 75 },
    { day: 'THU', price: 490, height: 55 },
    { day: 'FRI', price: 410, height: 30 },
    { day: 'SAT', price: 380, height: 10 },
    { day: 'SUN', price: 540, height: 100 }
  ];

  return (
    <div className="pb-40 bg-transparent min-h-screen text-left relative overflow-hidden">
      {/* ── Page Accents (Layered with Global) ── */}
      <div className="absolute top-20 right-[-10%] w-[80%] h-[30%] bg-blue-100/10 rounded-full blur-[100px] -z-10" />
      <Header title={`${price.shrimpSize} ${t.count}`} showBack onBack={onBack} />
      
      <div className="pt-24 px-4 py-8 space-y-8 animate-in slide-in-from-right duration-500">
        {/* Price Hero Section */}
        <div className="bg-[#0D523C] rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-emerald-300" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">{t.premium} Status</p>
            </div>
            <h2 className="text-5xl font-black tracking-tighter tracking-tight mb-2">₹{price.price}<span className="text-xl opacity-50 ml-1">/kg</span></h2>
            <div className="flex items-center gap-4 mt-6">
              <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest">
                {price.location}
              </div>
              <div className="text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                +2% {t.stable}
              </div>
            </div>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-emerald-400/10 blur-[100px] rounded-full"></div>
        </div>

        {/* 7-Day Trend Section */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-black/5">
          <div className="mb-10">
            <h3 className="text-[#4A2C2A] font-black text-lg tracking-tight">7-Day Price Trend</h3>
            <p className="text-[#4A2C2A]/40 text-[9px] font-bold uppercase tracking-widest mt-0.5">{t.priceHistory} (Market Avg)</p>
          </div>
          <div className="relative h-48 flex items-end justify-between gap-3 pt-4 border-b border-black/5 pb-8">
             {trendData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end">
                   <div className="relative w-full h-full flex items-end">
                      <div 
                        className={cn(
                          "w-full rounded-md transition-all duration-1000",
                          i === trendData.length - 1 
                            ? "bg-emerald-400" 
                            : "bg-[#0D523C]/5"
                        )}
                        style={{ height: `${d.height}%` }}
                      >
                         <div className={cn(
                            "absolute w-full h-0.5 top-0",
                            i === trendData.length - 1 ? "bg-emerald-500" : "bg-black/5"
                         )} style={{ top: `${(100 - d.height)}%` }} />
                      </div>
                   </div>
                   <span className={cn(
                      "text-[8px] font-black tracking-widest uppercase",
                      i === trendData.length - 1 ? "text-emerald-500" : "text-[#4A2C2A]/20"
                   )}>{d.day}</span>
                </div>
             ))}
          </div>
        </div>

        {/* Analytics Card */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-black/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#4A2C2A]/30 mb-2">{t.profitMargin}</p>
            <p className="text-2xl font-black text-[#4A2C2A] tracking-tighter tracking-tight tracking-tight">₹145<span className="text-xs text-emerald-500 ml-2">HIGH</span></p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-black/5 text-[#C78200]">
            <Zap size={20} className="mb-2" />
            <p className="text-[9px] font-black uppercase tracking-widest text-[#4A2C2A]/30">{t.recommendationStatus}</p>
            <p className="text-2xl font-black text-[#4A2C2A] tracking-tighter tracking-tight tracking-tight mt-1">{t.harvestLabel}</p>
          </div>
        </div>

        {/* Advice Section */}
        <div className="p-10 rounded-[3rem] bg-[#C78200]/5 border border-[#C78200]/10 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6 text-[#C78200]">
              <Activity size={20} />
              <h3 className="text-xs font-black uppercase tracking-widest">{t.harvestAdvice}</h3>
            </div>
            <p className="text-sm leading-relaxed font-bold text-[#4A2C2A]/70">
              The current market velocity for {price.shrimpSize} {t.count} indicates a supply shortage in the next 48 hours. Secure your export contract now for maximum premium.
            </p>
          </div>
          <div className="absolute right-[-10%] bottom-[-10%] w-32 h-32 bg-[#C78200]/10 blur-[50px] rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
