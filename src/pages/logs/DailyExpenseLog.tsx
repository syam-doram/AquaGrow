import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NoPondState } from '../../components/NoPondState';
import { 
  ChevronLeft, 
  Calendar, 
  Tag, 
  Wallet,
  FileText,
  CheckCircle2,
  Wheat,
  Pill,
  Zap,
  Users,
  Box,
  TrendingDown,
  Droplets,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/cn';
import { useData } from '../../context/DataContext';
import type { Translations } from '../../translations';

export const DailyExpenseLog = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { ponds, addExpense } = useData();

  const activePonds = ponds.filter(p => p.status === 'active');
  
  const CATEGORIES = [
    { id: 'feed',     label: t.pelletFeed,     icon: Wheat,    color: 'bg-[#C78200]',    unit: 'Bags' },
    { id: 'medicine', label: t.medicineProbiotics,  icon: Pill,     color: 'bg-blue-500',     unit: 'Liters/Kg' },
    { id: 'diesel',   label: t.dieselFuel,     icon: Droplets, color: 'bg-orange-500',   unit: 'Liters' },
    { id: 'power',    label: t.gridPowerBill, icon: Zap,      color: 'bg-emerald-500',  unit: 'Units (kWh)' },
    { id: 'labor',    label: t.laborWages,   icon: Users,    color: 'bg-purple-500',   unit: 'Days/Heads' },
    { id: 'other',    label: t.otherTesting, icon: Box,      color: 'bg-card/500',    unit: 'Items' }
  ];

  const [pondId, setPondId] = useState(activePonds[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  
  const [showSuccess, setShowSuccess] = useState(false);

  // Live Analytics compute
  const amtNum = parseFloat(amount) || 0;
  const unitPrice = amtNum > 0 && parseFloat(quantity) > 0 ? amtNum / parseFloat(quantity) : 0;
  const runRateImpact = amtNum / 30; // rough monthly impact estimate for UI

  const handleSave = async () => {
    if (!amount) return;
    setShowSuccess(true);
    
    await addExpense({
      pondId,
      date,
      category: category.id,
      categoryLabel: category.label,
      amount: amtNum,
      quantity: parseFloat(quantity) || 0,
      notes
    });
    
    setTimeout(() => {
      navigate('/expense-report');
    }, 2500);
  };

  // No active ponds guard
  if (activePonds.length === 0) return (
    <div className="min-h-screen bg-[#F8F9FE] flex flex-col">
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-card/95 backdrop-blur-md px-4 py-5 flex items-center justify-between border-b border-card-border">
        <button onClick={() => navigate(-1)} className="p-3 text-ink hover:bg-black/5 rounded-2xl transition-all">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-sm font-black text-ink tracking-tighter uppercase tracking-[0.1em]">{t.logLiveExpense}</h1>
        <div className="w-10" />
      </header>
      <div className="pt-28 flex-1 flex items-center justify-center">
        <NoPondState
          isDark={false}
          subtitle="Add a pond to start tracking and logging your daily operational expenses."
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FE] text-left font-sans pb-32">
      
      {/* SUCCESS OVERLAY */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#02130F]/95 backdrop-blur-xl flex flex-col items-center justify-center text-white p-10 text-center"
          >
             <motion.div 
               initial={{ scale: 0.5, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ type: "spring", damping: 12 }}
               className="w-32 h-32 bg-card rounded-[2.5rem] flex items-center justify-center text-[#C78200] shadow-2xl mb-8 border border-white/10"
             >
                <CheckCircle2 size={64} />
             </motion.div>
             <h3 className="text-3xl font-black tracking-tighter mb-2">{t.expenseLogged}</h3>
             <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{t.updatingFinancialTrajectory}</p>
             
             <div className="mt-8 bg-card/5 border border-white/5 rounded-2xl p-4 flex gap-4 text-left min-w-[200px]">
               <div>
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">{t.added}</p>
                  <p className="font-black text-xl text-[#C78200]">₹{amtNum.toLocaleString()}</p>
               </div>
               <div className="w-px h-full bg-card/10" />
               <div>
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">+ {t.dailyTraj}</p>
                  <p className="font-black text-xl text-red-400">₹{Math.round(runRateImpact).toLocaleString()}</p>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-card/95 backdrop-blur-md px-4 py-5 flex items-center justify-between border-b border-card-border">
        <button onClick={() => navigate(-1)} className="p-3 text-ink hover:bg-black/5 rounded-2xl transition-all">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-black text-ink tracking-tighter uppercase tracking-[0.1em]">{t.logLiveExpense}</h1>
          <p className="text-[8px] font-black text-[#C78200] uppercase tracking-widest mt-0.5">{t.dailyOpexEntry}</p>
        </div>
        <div className="w-10" />
      </header>

      <div className="pt-28 px-5 space-y-6">
        
        {/* HERO */}
        <div className="bg-[#02130F] p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl border border-[#C78200]/20">
           <div className="relative z-10 flex items-center gap-5">
              <div className="w-14 h-14 bg-[#C78200]/20 rounded-2xl flex items-center justify-center border border-[#C78200]/30">
                 <Wallet size={24} className="text-[#C78200]" />
              </div>
              <div>
                 <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{t.operatingExpense}</p>
                 <h2 className="text-2xl font-black tracking-tighter leading-none">{t.dailyTracker}</h2>
              </div>
           </div>
           
           <div className="mt-6 pt-5 border-t border-white/10 flex items-end justify-between">
              <div>
                 <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{t.totalAmount}</p>
                 <p className="font-black text-4xl tracking-tighter text-[#C78200]">
                    <span className="text-2xl opacity-50 mr-1">₹</span>
                    {amount ? parseInt(amount).toLocaleString() : '0'}
                 </p>
              </div>
              <div className="bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/20 flex items-center gap-1.5">
                 <TrendingDown size={12} className="text-red-400" />
                 <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">{t.outflow}</span>
              </div>
           </div>
           <div className="absolute right-[-10%] top-[-10%] opacity-5 rotate-12 pointer-events-none">
              <Wallet size={160} />
           </div>
        </div>

        {/* INPUTS SECTION */}
        <section className="space-y-6">
           
           {/* Pond Select */}
           <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#C78200] px-2 flex items-center gap-1.5">
                <Tag size={12} /> {t.selectCulturePond}
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-1">
                {activePonds.length > 0 ? activePonds.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setPondId(p.id)}
                    className={cn(
                      "flex-shrink-0 px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest border transition-all",
                      pondId === p.id 
                        ? "bg-[#02130F] text-white border-[#02130F] shadow-lg shadow-black/10" 
                        : "bg-card text-ink/40 border-card-border shadow-sm"
                    )}
                  >{p.name}</button>
                )) : (
                  <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest">{t.noActivePonds}</p>
                )}
              </div>
           </div>

           {/* Date & Cost */}
           <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#C78200] px-2">{t.date}</label>
                 <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-card border border-card-border rounded-[1.5rem] py-4 pl-12 pr-4 text-xs font-black text-ink outline-none shadow-sm"
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 px-2">{t.totalAmount} (₹)</label>
                 <input 
                   type="number" 
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   placeholder="0"
                   className="w-full bg-red-50/50 border border-red-100 rounded-[1.5rem] py-4 px-5 text-xl font-black text-red-600 placeholder:text-red-200 outline-none focus:border-red-300 transition-all shadow-sm"
                 />
              </div>
           </div>

           {/* Category & Units */}
           <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#C78200] px-2 flex items-center gap-1.5">
                <Box size={12} /> {t.expenseCategory}
              </label>
              <div className="grid grid-cols-2 gap-3">
                 {CATEGORIES.map(cat => (
                   <button 
                     key={cat.id}
                     onClick={() => setCategory(cat)}
                     className={cn(
                        "p-4 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest border transition-all text-left flex items-center gap-3",
                        category.id === cat.id 
                          ? "bg-card border-[#C78200] text-[#C78200] shadow-md shadow-[#C78200]/5 ring-2 ring-[#C78200]/10" 
                          : "bg-card border-card-border text-ink/40 shadow-sm"
                     )}
                   >
                     <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white", cat.color)}>
                        <cat.icon size={14} />
                     </div>
                     <span className="flex-1 leading-tight">{cat.label}</span>
                   </button>
                 ))}
              </div>
           </div>

           {/* Invoice details */}
           <div className="bg-card rounded-[2rem] p-5 border border-card-border shadow-sm space-y-4">
              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase tracking-[0.2em] text-ink/40 px-1">{category.unit} {t.purchased}</label>
                 <div className="relative">
                    <input 
                      type="number" 
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder={`${t.total} ${category.unit.toLowerCase()}...`}
                      className="w-full bg-card/50 border border-card-border rounded-[1.2rem] py-3 pl-4 pr-16 text-sm font-black text-ink outline-none focus:border-black/10 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-ink/30 uppercase tracking-widest">
                      {category.unit}
                    </span>
                 </div>
              </div>
              
              {unitPrice > 0 && (
                <div className="bg-card/50 rounded-2xl p-3 border border-slate-100 flex items-center justify-between">
                   <p className="text-[8px] font-black text-ink/40 uppercase tracking-widest">{t.calculatedUnitPrice}</p>
                   <p className="font-black text-sm text-ink">₹{unitPrice.toLocaleString()}<span className="text-[10px] text-ink/40"> / {category.unit.split('/')[0]}</span></p>
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase tracking-[0.2em] text-ink/40 px-1">{t.merchantNotes}</label>
                 <div className="relative">
                    <FileText size={16} className="absolute left-4 top-4 text-ink/20" />
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t.merchantNotesPlaceholder}
                      className="w-full bg-card/50 border border-card-border rounded-[1.2rem] py-3 pl-11 pr-4 text-sm font-bold text-ink outline-none focus:border-black/10 transition-all h-20 resize-none"
                    />
                 </div>
              </div>
           </div>
        </section>
        
        <button 
          onClick={handleSave}
          disabled={!amount}
          className={cn(
             "w-full py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3",
             amount 
               ? "bg-[#C78200] text-white shadow-[#C78200]/20 active:scale-95 border border-[#C78200]/50" 
               : "bg-slate-200 text-white cursor-not-allowed"
          )}
        >
           <Plus size={18} strokeWidth={3} /> {t.submitExpense}
        </button>
      </div>
    </div>
  );
};
