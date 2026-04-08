import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, CheckCircle2, ChevronRight, Zap, Target, TrendingUp, Users, ShieldCheck, Crown, Receipt, ExternalLink, X, Headphones } from 'lucide-react';
import { Header } from '../../components/Header';
import type { Translations } from '../../translations';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export const SubscriptionPlan = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { user, isPro } = useData();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [policyType, setPolicyType] = useState<'refund' | 'terms' | null>(null);

  if (!user) return null;

  const proFeatures = [
    { label: t.aiDisease, icon: Target, color: 'text-rose-500' },
    { label: t.profitForecasting, icon: TrendingUp, color: 'text-emerald-500' },
    { label: t.globalPriceAlerts, icon: Zap, color: 'text-blue-500' },
    { label: t.expertConsultations, icon: Users, color: 'text-amber-500' },
    { label: t.realTimeHealthMonitoring, icon: ShieldCheck, color: 'text-indigo-500' }
  ];

  const calculateCredit = () => {
    if (!user?.subscriptionExpiry || !isPro) return 0;
    const expiry = new Date(user.subscriptionExpiry);
    const now = new Date();
    if (expiry <= now) return 0;
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const dailyRate = user.subscriptionStatus === 'pro_silver' ? 8.21 : 13.69;
    return Math.floor(diffDays * dailyRate);
  };

  const existingCredit = calculateCredit();

  // Mock transaction data based on user status
  const transactions = isPro ? [
    { 
      id: 'TXN_A827H921K',
      date: new Date('2026-04-02'),
      amount: '₹ 2,999',
      status: 'Upgraded',
      plan: 'Aqua 3 (Silver)'
    },
    { 
      id: 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      date: new Date(),
      amount: user.subscriptionStatus === 'pro_gold' ? `₹ ${4999 - existingCredit}` : user.subscriptionStatus === 'pro_diamond' ? `₹ ${6999 - existingCredit}` : '₹ 0',
      refund: `₹ ${existingCredit}`,
      status: 'Success',
      plan: user.subscriptionStatus === 'pro_gold' ? 'Aqua 6 (Gold)' : user.subscriptionStatus === 'pro_diamond' ? 'Aqua 9 (Diamond)' : 'N/A'
    }
  ].filter(t => t.plan !== 'N/A' && (t.plan === 'Aqua 3 (Silver)' || user.subscriptionStatus !== 'pro_silver')) : [];

  const planName = isPro 
    ? (user.subscriptionStatus === 'pro_silver' ? 'Aqua Silver' : user.subscriptionStatus === 'pro_gold' ? 'Aqua Gold' : user.subscriptionStatus === 'pro_diamond' ? 'Aqua Diamond' : 'Aqua Pro') 
    : 'Aqua Standard';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.08 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="pb-32 bg-[#FBFBFE] min-h-screen relative overflow-hidden text-left font-sans">
      {/* ── Page Accents ── */}
      <div className="absolute top-0 right-0 w-[80%] h-[25%] bg-[#C78200]/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-[20%] left-0 w-[60%] h-[35%] bg-emerald-500/10 rounded-full blur-[120px] -z-10" />
      
      <Header title={t.subscriptionPlan} showBack />
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="pt-20 px-4 space-y-6"
      >
        {/* ── Current Plan Card ── */}
        <motion.div variants={itemVariants} className="relative mt-2">
          <div className={cn(
            "rounded-[1.8rem] p-6 text-white relative overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.08)] border transition-all duration-700",
            isPro ? "bg-[#012B1D] border-emerald-500/20" : "bg-[#4A2C2A] border-white/5"
          )}>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  isPro ? "bg-emerald-500/20 text-[#C78200]" : "bg-card/10 text-white/40"
                )}>
                  {isPro ? <Crown size={14} /> : <Zap size={14} />}
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60">{t.currentPlan}</span>
              </div>
              
              <h2 className="text-3xl font-black tracking-tighter mb-6 leading-none">
                {planName}
              </h2>
              
              <div className="flex items-center gap-3 bg-card/5 backdrop-blur-md rounded-xl p-3 border border-white/5 inline-flex">
                <div className="w-8 h-8 rounded-lg bg-card/5 flex items-center justify-center">
                  <Calendar size={16} className="text-white/60" />
                </div>
                <div>
                  <p className="text-[7px] font-black uppercase tracking-widest text-white/40">{t.expiryDate}</p>
                  <p className="font-black text-[10px] tracking-tight">
                    {isPro && user.subscriptionExpiry ? format(new Date(user.subscriptionExpiry), 'MMMM d, yyyy') : "Perpetual Free"}
                  </p>
                </div>
              </div>
            </div>
            
            <Sparkles size={140} strokeWidth={0.5} className="absolute -right-12 -bottom-12 text-white/5 rotate-12 pointer-events-none" />
          </div>
        </motion.div>

        {/* ── Recent Transactions ── */}
        {isPro && (
          <motion.section variants={itemVariants} className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-ink text-base font-black tracking-tighter">{t.transactionHistory}</h3>
                <div className="px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">Audit Verified</span>
                </div>
             </div>
             
             <div className="bg-card rounded-[1.5rem] p-4 shadow-sm border border-card-border divide-y divide-black/5">
                {transactions.map((txn: any, idx) => (
                   <div 
                     key={idx} 
                     onClick={() => setSelectedTransaction(txn)}
                     className="py-4 first:pt-0 last:pb-0 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer"
                   >
                      <div className="flex items-center gap-3">
                         <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:rotate-12",
                           txn.status === 'Current' || txn.status === 'Success' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-card/50 text-slate-400 border-slate-100"
                         )}>
                            {txn.status === 'Success' ? <CheckCircle2 size={18} /> : <Receipt size={18} />}
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                               <p className="font-black text-xs text-ink tracking-tight">{txn.plan}</p>
                               {txn.refund && <span className="text-[6px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-widest">Refund Credit</span>}
                            </div>
                            <p className="text-[8px] font-bold text-ink/30 uppercase tracking-widest">{format(txn.date, 'MMM d, yyyy')}</p>
                         </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                         <div>
                            <p className="font-black text-xs text-ink">{txn.amount}</p>
                            {txn.refund && <p className="text-[6px] font-bold text-emerald-500 uppercase tracking-tighter">Applied: -{txn.refund}</p>}
                         </div>
                         <ChevronRight size={14} className="text-ink/10 group-hover:text-[#C78200] group-hover:translate-x-1 transition-all" />
                      </div>
                   </div>
                ))}
             </div>
          </motion.section>
        )}

        {/* ── Features List ── */}
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-ink text-base font-black tracking-tighter">{isPro ? 'Your Benefits' : 'Upgrade Benefits'}</h3>
            <div className="px-2 py-0.5 bg-[#4A2C2A]/5 rounded-full text-[7px] font-black uppercase tracking-widest text-ink/40">
              {isPro ? 'Active' : 'Locked'}
            </div>
          </div>
          
          <div className="bg-card rounded-[1.5rem] p-4 shadow-sm border border-card-border space-y-4">
            {proFeatures.map((f, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm border border-card-border bg-paper",
                  isPro ? f.color : "text-slate-200"
                )}>
                  <f.icon size={18} className={cn(isPro ? "opacity-100" : "opacity-40")} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "font-black text-xs tracking-tight transition-all",
                      isPro ? "text-ink" : "text-ink/30"
                    )}>{f.label}</p>
                    <CheckCircle2 size={14} className={cn(
                      "transition-all",
                      isPro ? "text-emerald-500 scale-100" : "text-slate-100 scale-90"
                    )} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── Support & Help ── */}
        <motion.div variants={itemVariants} className="pt-4 border-t border-card-border">
           <div className="bg-[#4A2C2A]/5 rounded-[1.5rem] p-5 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-ink/40 shadow-sm">
                    <Headphones size={20} />
                 </div>
                 <div>
                    <h4 className="text-[11px] font-black tracking-tight text-ink">{t.paymentGlitch}</h4>
                    <p className="text-[8px] font-bold text-ink/40 uppercase tracking-widest">{t.refundDetails}</p>
                 </div>
              </div>
              <button 
                onClick={() => window.open('tel:9123456789')}
                className="px-4 py-2 bg-card rounded-xl text-[9px] font-black uppercase tracking-widest text-ink shadow-sm active:scale-95 transition-all hover:bg-[#4A2C2A] hover:text-white"
              >
                 {t.supportContact}
              </button>
           </div>
           
           <div className="flex items-center justify-center gap-6 mt-6">
              <button 
                onClick={() => setPolicyType('refund')}
                className="text-[8px] font-black uppercase tracking-[0.2em] text-ink/30 hover:text-[#C78200] transition-colors"
              >
                 {t.refundPolicy}
              </button>
              <div className="w-1 h-1 rounded-full bg-black/10" />
              <button 
                onClick={() => setPolicyType('terms')}
                className="text-[8px] font-black uppercase tracking-[0.2em] text-ink/30 hover:text-[#C78200] transition-colors"
              >
                 Terms & Conditions
              </button>
           </div>
        </motion.div>

        {/* ── Action Button ── */}
        <motion.div variants={itemVariants} className="pt-2">
          {!isPro ? (
            <button 
              onClick={() => navigate('/subscription')}
              className="w-full bg-[#C78200] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-amber-900/10 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              {t.upgradeToPro}
              <ChevronRight size={16} className="ml-1" />
            </button>
          ) : (
            <button 
              onClick={() => navigate('/subscription')}
              className="w-full bg-card text-ink py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-black/10 hover:border-[#C78200]/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Manage Plan
              <ChevronRight size={16} />
            </button>
          ) }
        </motion.div>
      </motion.div>

      {/* ── Transaction Details Modal ── */}
      <AnimatePresence>
        {selectedTransaction && (
           <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTransaction(null)}
                className="absolute inset-0 bg-[#000]/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="relative w-full max-w-md bg-card rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 overflow-hidden shadow-2xl"
              >
                 <div className="flex justify-between items-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                       <Receipt size={24} />
                    </div>
                    <button 
                      onClick={() => setSelectedTransaction(null)}
                      className="p-3 bg-[#4A2C2A]/5 rounded-2xl text-ink/30 hover:text-ink transition-colors"
                    >
                       <X size={20} />
                    </button>
                 </div>

                 <div className="text-center mb-10">
                    <h2 className="text-3xl font-black tracking-tighter text-ink">{selectedTransaction.amount}</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mt-2">Payment Successful</p>
                 </div>

                 <div className="space-y-4 p-6 bg-[#4A2C2A]/5 rounded-[2rem] border border-[#4A2C2A]/5">
                    <div className="flex justify-between items-center">
                       <p className="text-[8px] font-black uppercase tracking-widest text-ink/30">{t.paymentDate}</p>
                       <p className="font-black text-xs text-ink">{format(selectedTransaction.date, 'MMMM d, yyyy')}</p>
                    </div>
                    {selectedTransaction.refund && (
                      <div className="flex justify-between items-center text-emerald-600">
                         <p className="text-[8px] font-black uppercase tracking-widest">Prorated Refund Applied</p>
                         <p className="font-black text-xs">- {selectedTransaction.refund}</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                       <p className="text-[8px] font-black uppercase tracking-widest text-ink/30">Service Plan</p>
                       <p className="font-black text-xs text-ink">{selectedTransaction.plan}</p>
                    </div>
                    <div className="flex justify-between items-center">
                       <p className="text-[8px] font-black uppercase tracking-widest text-ink/30">{t.transactionId}</p>
                       <p className="font-black text-[10px] text-ink/60 font-mono">{selectedTransaction.id}</p>
                    </div>
                    <div className="flex justify-between items-center">
                       <p className="text-[8px] font-black uppercase tracking-widest text-ink/30">Status</p>
                       <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">Verified</span>
                    </div>
                 </div>

                 <button className="w-full mt-8 bg-[#4A2C2A] text-white py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-opacity hover:opacity-90 active:scale-[0.98]">
                    <ExternalLink size={16} />
                    Download PDF Receipt
                 </button>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* ── Policy Content Modal ── */}
      <AnimatePresence>
        {policyType && (
           <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPolicyType(null)}
                className="absolute inset-0 bg-[#000]/70 backdrop-blur-lg"
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="relative w-full max-w-md bg-card rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 overflow-hidden max-h-[80vh] flex flex-col"
              >
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black tracking-tighter text-ink">
                       {policyType === 'refund' ? t.refundPolicy : 'Terms & Conditions'}
                    </h3>
                    <button 
                      onClick={() => setPolicyType(null)}
                      className="p-3 bg-[#4A2C2A]/5 rounded-2xl text-ink/30 hover:text-ink"
                    >
                       <X size={20} />
                    </button>
                 </div>

                 <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {policyType === 'refund' ? (
                       <div className="space-y-6 text-ink/70 text-[11px] leading-relaxed font-medium">
                          <p>
                             <strong className="text-ink block mb-1">PRORATED SCALE-UP REFUND</strong>
                             Subscriptions upgraded mid-cycle are eligible for a prorated refund credit. Our system calculates the monetary value of your remaining days on the lower tier and applies it as a direct deduction from the new tier's cost.
                          </p>
                          <p>
                             <strong className="text-ink block mb-1">CANCELLATION POLICY</strong>
                             Subscriptions are activated immediately upon payment. You may cancel your subscription at any time; however, the service will remain active until the end of the current billing cycle.
                          </p>
                          <p>
                             <strong className="text-ink block mb-1">REFUND ELIGIBILITY</strong>
                             As a digital service provider, AquaGrow operates a no-cash-refund policy except in cases of technical glitches. Credits applied during transitions are final and non-transferable.
                          </p>
                       </div>
                    ) : (
                       <div className="space-y-6 text-ink/70 text-[11px] leading-relaxed font-medium">
                          <p>
                             <strong className="text-ink block mb-1">1. SERVICE ACCESS</strong>
                             By upgrading to Aqua Pro, you gain access to premium AI diagnostics, market intelligence, and expert consultations subject to your specific tier (Silver, Gold, or Diamond).
                          </p>
                          <p>
                             <strong className="text-ink block mb-1">2. FAIR USAGE</strong>
                             Expert consultations and AI scanning are subject to reasonable fair usage policies. Excessive use that strains system resources or violates operational parameters may lead to temporary session throttling.
                          </p>
                          <p>
                             <strong className="text-ink block mb-1">3. DATA RESPONSIBILITY</strong>
                             While AquaGrow provides high-fidelity monitoring and recommendations, all farming decisions ultimately rest with the user. AquaGrow is not liable for crop loss due to environmental factors or incorrect data entry.
                          </p>
                          <p>
                             <strong className="text-ink block mb-1">4. INTELLECTUAL PROPERTY</strong>
                             All diagnostic models and intelligence reports provided are the property of AquaGrow and are for individual farm use only. Redistributing these reports or reverse-engineering our models is strictly prohibited.
                          </p>
                       </div>
                    )}
                 </div>

                 <button 
                   onClick={() => setPolicyType(null)}
                   className="w-full mt-8 bg-[#C78200] text-white py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl"
                 >
                    Got It
                 </button>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};
