import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  TrendingUp, 
  Download, 
  CheckCircle2, 
  Clock, 
  Building2, 
  History,
  FileText,
  ShieldCheck,
  Scale,
  Fish,
  Calendar,
  IndianRupee,
  Star,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

// ─── SETTLEMENT DETAIL SHEET ───────────────────────────────────────────────
const SettlementDetailSheet = ({ entry, onClose, t }: { entry: any, onClose: () => void, t: Translations }) => {
  const n = (v: any) => parseFloat(v) || 0;
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="w-full max-w-md mx-auto bg-[#051F19] rounded-t-[3rem] p-6 pb-12 shadow-2xl border-t border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-card/20 rounded-full mx-auto mb-8" />
        
        <div className="flex items-center gap-4 mb-8">
           <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={24} />
           </div>
           <div>
              <p className="text-emerald-500/60 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{t.settledAndVerified}</p>
              <h3 className="text-white text-xl font-black tracking-tighter">{t.harvest} {t.payment}</h3>
           </div>
        </div>

        <div className="bg-[#02130F] rounded-[2rem] p-6 border border-white/5 mb-6">
           <p className="text-white/30 text-[9px] font-black uppercase tracking-widest text-center mb-1">{t.totalReceivedAmount}</p>
           <p className="text-4xl font-black text-[#EAB308] tracking-tighter text-center">₹{n(entry.totalRevenue).toLocaleString()}</p>
        </div>

        <div className="space-y-4 mb-8">
           <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{t.buyerEntity}</span>
              <span className="text-white text-sm font-black">{entry.buyerName || 'Local Trader'}</span>
           </div>
           <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{t.saleDate}</span>
              <span className="text-white text-sm font-black">{entry.harvestDate}</span>
           </div>
           <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{t.totalHarvestWeight}</span>
              <span className="text-emerald-500 text-sm font-black">{n(entry.harvestWeightKg).toLocaleString()} kg</span>
           </div>
           <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{t.countSize}</span>
              <span className="text-[#EAB308] text-sm font-black">{entry.countPerKg || '--'} /kg</span>
           </div>
           <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{t.baseRate}</span>
              <span className="text-white text-sm font-black">₹{n(entry.pricePerKg).toLocaleString()}/kg</span>
           </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-5 bg-card/5 text-white rounded-[1.8rem] border border-white/5 font-black text-[10px] uppercase tracking-widest hover:bg-card/10 transition-all"
        >
          {t.closeLedger}
        </button>
      </motion.div>
    </motion.div>
  );
};

// ─── MAIN PAGE COMPONENT ───────────────────────────────────────────────────
export const HarvestRevenue = ({ t, onMenuClick }: { t: Translations, onMenuClick?: () => void }) => {
  const navigate = useNavigate();
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);

  // Load from local ROI entries to find actual harvest revenues!
  const savedEntries = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('roi_entries') || '[]').reverse(); } 
    catch { return []; }
  }, []);

  const n = (v: any) => parseFloat(v) || 0;

  // Use the most recent entry for the hero, or a realistic shrimp farming mock
  const latestEntry = savedEntries.length > 0 ? savedEntries[0] : null;
  
  const totalWeight = latestEntry ? n(latestEntry.harvestWeightKg) : 4850;
  const countSize = latestEntry ? latestEntry.countPerKg : "30";
  const priceKg = latestEntry ? n(latestEntry.pricePerKg) : 420;
  const baseRevenue = latestEntry ? n(latestEntry.saleAmountTotal) : totalWeight * priceKg;
  const subsidyAmount = latestEntry ? n(latestEntry.subsidyAmount) : 45000; // Mock subsidy/bonus
  
  const netEarnings = baseRevenue + subsidyAmount;
  const date = latestEntry ? latestEntry.harvestDate : new Date().toISOString().split('T')[0];

  return (
    <div className="pb-[180px] bg-[#02130F] min-h-[100dvh] text-left font-sans text-white">
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-[#02130F]/90 backdrop-blur-xl px-5 py-6 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-3 text-white/50 hover:bg-card/5 rounded-2xl transition-all">
           <ChevronLeft size={22} />
        </button>
        <div className="flex flex-col items-center">
           <h1 className="text-sm font-black text-white tracking-tight">{t.harvestRevenue}</h1>
           <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">{t.yieldLedger}</p>
        </div>
        <div className="w-12" />
      </header>

      {/* DETAIL SHEET */}
      <AnimatePresence>
         {selectedEntry && (
            <SettlementDetailSheet entry={selectedEntry} onClose={() => setSelectedEntry(null)} t={t} />
         )}
      </AnimatePresence>

      <div className="pt-28 px-5 space-y-8">
        
        {/* HERO CARD */}
        <motion.div 
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="bg-gradient-to-br from-[#0D523C] via-[#0A4030] to-[#041F1A] p-8 rounded-[3rem] shadow-2xl relative overflow-hidden border border-emerald-500/20"
        >
           <div className="relative z-10">
              <div className="bg-emerald-500/20 w-max px-4 py-1.5 rounded-full flex items-center gap-2 mb-8 border border-emerald-500/30">
                 <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">{t.latestHarvestSettlement}</span>
              </div>
              
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                 <IndianRupee size={12} /> {t.totalNetEarnings}
              </p>
              <div className="flex items-baseline gap-2 mb-8">
                 <h3 className="text-5xl font-black tracking-tighter">₹{(netEarnings / 100000).toFixed(2)}<span className="text-2xl text-white/40">L</span></h3>
                 <div className="flex flex-col">
                    <span className="text-emerald-400 text-xs font-black">+4.2%</span>
                    <span className="text-emerald-400/40 text-[7px] font-bold uppercase tracking-widest">{t.premiumMargin}</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-t border-white/10 pt-6">
                 <div>
                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5"><Scale size={10} /> {t.totalHarvestWeight}</p>
                    <p className="text-lg font-black">{totalWeight.toLocaleString()} <span className="text-white/40 text-[10px]">kg</span></p>
                 </div>
                 <div>
                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5"><Fish size={10} /> {t.countPerKgSize}</p>
                    <p className="text-lg font-black text-[#EAB308]">{countSize} <span className="text-white/40 text-[10px]">/kg</span></p>
                 </div>
                 <div>
                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5"><TrendingUp size={10} /> {t.baseRate}</p>
                    <p className="text-lg font-black">₹{priceKg.toLocaleString()} <span className="text-white/40 text-[10px]">/kg</span></p>
                 </div>
                 <div>
                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5"><Clock size={10} /> {t.settledDate}</p>
                    <p className="text-sm font-black">{date}</p>
                 </div>
              </div>
           </div>
           
           <div className="absolute right-[-15%] top-[-5%] opacity-5 pointer-events-none">
              <TrendingUp size={200} strokeWidth={3} />
           </div>
        </motion.div>

        {/* EARNINGS BREAKDOWN */}
        <div className="bg-[#051F19] rounded-[2.5rem] p-6 border border-white/5 space-y-6">
           <div className="flex items-center justify-between">
              <p className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em]">{t.revenueComposition}</p>
              <div className="bg-card/5 px-2 py-1 rounded-md">
                 <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">{t.totalAmount}</span>
              </div>
           </div>
           
           <div className="space-y-6">
              <div>
                 <div className="flex justify-between items-baseline mb-2">
                    <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">{t.baseBiomassSales}</span>
                    <span className="text-white text-base font-black">₹{baseRevenue.toLocaleString()}</span>
                 </div>
                 <div className="h-1.5 w-full bg-card/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(baseRevenue/netEarnings)*100}%` }} transition={{ duration: 1 }} className="h-full bg-emerald-500 rounded-full" />
                 </div>
              </div>
              
              <div>
                 <div className="flex justify-between items-baseline mb-2">
                    <span className="text-white/60 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Star size={10} className="text-[#EAB308]" /> {t.bonusSubsidies}</span>
                    <span className="text-[#EAB308] text-base font-black">₹{subsidyAmount.toLocaleString()}</span>
                 </div>
                 <div className="h-1.5 w-full bg-card/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(subsidyAmount/netEarnings)*100}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-[#EAB308] rounded-full" />
                 </div>
              </div>
           </div>
        </div>

        {/* SETTLEMENT HISTORY */}
        <div className="space-y-4 pt-4">
           <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-white text-lg font-black tracking-tight">{t.settlementAudit}</h3>
              <button className="text-emerald-500 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                {t.pdfStatement}
              </button>
           </div>
           
           <div className="bg-[#051F19] rounded-[2.5rem] p-5 border border-white/5">
              
              {savedEntries.length > 0 ? (
                 savedEntries.map((entry: any, i: number) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedEntry(entry)}
                      className="flex items-center justify-between py-5 border-b border-white/5 last:border-0 group cursor-pointer active:scale-95 transition-all"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-card/5 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all border border-emerald-500/10">
                             <ShieldCheck size={20} />
                          </div>
                          <div>
                             <h4 className="text-sm font-black tracking-tight text-white mb-0.5 group-hover:text-emerald-400 transition-colors">
                               {entry.buyerName || `Harvest C-${savedEntries.length - i}`}
                             </h4>
                             <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                               <Calendar size={10} className="text-white/20" /> {entry.harvestDate}
                             </p>
                          </div>
                       </div>
                       <div className="text-right flex flex-col items-end gap-1.5">
                          <p className="text-sm font-black tracking-tighter text-white">₹{n(entry.totalRevenue).toLocaleString()}</p>
                          <span className="text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 flex items-center gap-1">
                             <CheckCircle2 size={8} /> {t.settled}
                          </span>
                       </div>
                    </div>
                 ))
              ) : (
                 // Fallback Mock Ledger
                 <>
                    <LedgerItem 
                       company="Godrej Seafood Processors" 
                       date="Nov 12, 2025" 
                       amount={2036500} 
                       status="SETTLED" 
                       onTap={() => setSelectedEntry({ buyerName: 'Godrej Seafood', harvestDate: '2025-11-12', totalRevenue: 2036500, harvestWeightKg: 4850, countPerKg: 30, pricePerKg: 420 })}
                    />
                    <LedgerItem 
                       company="Apex Marine Exports" 
                       date="Aug 04, 2025" 
                       amount={1840000} 
                       status="SETTLED" 
                       onTap={() => setSelectedEntry({ buyerName: 'Apex Marine', harvestDate: '2025-08-04', totalRevenue: 1840000, harvestWeightKg: 4600, countPerKg: 32, pricePerKg: 400 })}
                    />
                 </>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

// Internal Mock Ledger Item generator
const LedgerItem = ({ company, date, amount, status }: any) => (
  <div className="flex items-center justify-between py-5 border-b border-white/5 last:border-0 group cursor-pointer active:scale-95 transition-all">
     <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-card/5 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all border border-emerald-500/10">
           <ShieldCheck size={20} />
        </div>
        <div>
           <h4 className="text-sm font-black tracking-tight text-white mb-0.5 group-hover:text-emerald-400 transition-colors">{company}</h4>
           <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
             <Calendar size={10} className="text-white/20" /> {date}
           </p>
        </div>
     </div>
     <div className="text-right flex flex-col items-end gap-1.5">
        <p className="text-sm font-black tracking-tighter text-white">₹{amount.toLocaleString()}</p>
        <span className="text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 flex items-center gap-1">
           <CheckCircle2 size={8} /> {status}
        </span>
     </div>
  </div>
);
