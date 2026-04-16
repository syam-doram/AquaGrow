import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X,
  Sparkles, 
  Waves, 
  Camera, 
  TrendingUp, 
  Globe, 
  Smartphone, 
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { format } from 'date-fns';

export const SubscriptionScreen = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { upgradePlan, user, isPro } = useData();
  
  const PLANS = [
    {
      id: 'pro_silver',
      label: 'Aqua 1 (Silver)',
      price: '₹ 500',
      priceNum: 500,
      monthly: '₹ 42',
      ponds: 1,
      color: 'bg-slate-400',
      desc: 'Starter plan — 1 pond, full SOP intelligence',
      rank: 1,
    },
    {
      id: 'pro_gold',
      label: 'Aqua 3 (Gold)',
      price: '₹ 1,200',
      priceNum: 1200,
      monthly: '₹ 100',
      ponds: 3,
      color: 'bg-[#C78200]',
      desc: 'Best value — 3 ponds, IoT + disease AI',
      rank: 2,
    },
    {
      id: 'pro_diamond',
      label: 'Aqua 6 (Diamond)',
      price: '₹ 2,000',
      priceNum: 2000,
      monthly: '₹ 167',
      ponds: 6,
      color: 'bg-blue-500',
      desc: 'Professional — 6 ponds, full expert access',
      rank: 3,
    },
  ];

  const getPlanRank = (id: string | undefined) => {
    if (!id) return 0;
    const plan = PLANS.find(p => p.id === id);
    return plan ? plan.rank : 0;
  };

  const userRank = getPlanRank(user?.subscriptionStatus);
  const availablePlans = PLANS.filter(p => p.rank > userRank);
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(availablePlans.length > 0 ? availablePlans[0].id : null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Sync selected plan if user status changes (e.g. login/expiry)
  React.useEffect(() => {
    const updatedAvailable = PLANS.filter(p => p.rank > getPlanRank(user?.subscriptionStatus));
    if (selectedPlan && PLANS.find(p => p.id === selectedPlan)!.rank <= getPlanRank(user?.subscriptionStatus)) {
      setSelectedPlan(updatedAvailable.length > 0 ? updatedAvailable[0].id : null);
    } else if (!selectedPlan && updatedAvailable.length > 0) {
      setSelectedPlan(updatedAvailable[0].id);
    }
  }, [user?.subscriptionStatus]);

  const handleUpgrade = () => {
    if (selectedPlan) {
      setIsPaymentModalOpen(true);
    } else {
      alert(t.selectPlanToUpgrade);
    }
  };

  const getSubscriptionDetails = () => {
    if (!user?.subscriptionExpiry || !isPro) return { credit: 0, usedDays: 0, usedAmount: 0, remainingDays: 0 };
    
    const expiry = new Date(user.subscriptionExpiry);
    const now = new Date();
    
    // Calculate remaining days
    const diffMs = expiry.getTime() - now.getTime();
    const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    
    // Assume 365 days cycle for used days detection
    const totalDays = 365;
    const usedDays = Math.max(0, totalDays - remainingDays);
    
    const currentPlan = PLANS.find(p => p.id === user.subscriptionStatus);
    const totalPaid = currentPlan ? currentPlan.priceNum : 0;
    const dailyRate = totalPaid / totalDays;
    
    const usedAmount = Math.ceil(usedDays * dailyRate);
    const credit = Math.max(0, totalPaid - usedAmount);
    
    return { credit, usedDays, usedAmount, remainingDays };
  };

  const { credit: existingCredit, usedDays, usedAmount } = getSubscriptionDetails();
  const currentPlanData = PLANS.find(p => p.id === selectedPlan);

  const handlePaymentSuccess = async () => {
    if (selectedPlan) {
      const success = await upgradePlan(selectedPlan);
      if (success) {
        navigate('/dashboard');
      } else {
        alert(t.upgradeFailed);
      }
    }
  };

  const features = [
    { icon: Camera, title: t.aiDisease, desc: 'Unlimited AI Diagnostics' },
    { icon: TrendingUp, title: 'Multi-Pond SOP', desc: 'Auto-schedules for every pond' },
    { icon: Globe, title: 'IoT Integration', desc: 'Live multi-sensor monitoring' },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#0D1B17] text-white flex flex-col overflow-x-hidden pb-8 relative font-sans text-left">
      <button 
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 p-2 rounded-xl bg-card/5 border border-white/10 hover:bg-card/10 transition-all z-50 active:scale-90"
      >
        <ChevronLeft size={20} className="text-white/60" />
      </button>
      
      <div className="flex flex-col items-center pt-12 pb-6">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-[#C78200]/20 blur-3xl rounded-full scale-150"></div>
          <div className="w-20 h-20 bg-[#C78200] rounded-full flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(199,130,0,0.2)]">
            <Waves size={40} className="text-white" />
          </div>
          <div className="absolute -top-1 -right-1 bg-card p-1.5 rounded-full border-2 border-[#4A2C2A] shadow-lg">
            <Sparkles size={12} className="text-[#C78200]" />
          </div>
        </div>
        <h1 className="text-xl font-black tracking-tighter text-white text-center">
          AquaGrow <span className="text-[#C78200]">Scale Up</span>
        </h1>
        <p className="text-white/40 text-[8px] font-black tracking-[0.4em] uppercase mt-2">Choose Your Capacity</p>
      </div>

      {isPro && user && (
        <div className="px-6 mb-8">
          <div className="bg-gradient-to-br from-[#1A302A] to-[#0D1B17] border border-emerald-500/20 rounded-[2rem] p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none text-[#C78200]"><Sparkles size={60} /></div>
            
            <div className="flex justify-between items-start mb-4">
               <div>
                  <p className="text-[#C78200] text-[7.5px] font-black uppercase tracking-[0.4em] mb-1.5">Current Status</p>
                  <h3 className="text-xl font-black tracking-tighter">
                    {user.subscriptionStatus === 'pro_silver' ? 'Aqua 3 (Silver)' : 
                     user.subscriptionStatus === 'pro_gold' ? 'Aqua 6 (Gold)' : 
                     user.subscriptionStatus === 'pro_diamond' ? 'Aqua 9 (Diamond)' : 'Aqua Pro'}
                  </h3>
               </div>
               <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                  <p className="text-emerald-400 text-[8px] font-black uppercase tracking-widest leading-none mb-1">Active Until</p>
                  <p className="text-white text-[12px] font-black">{user.subscriptionExpiry ? format(new Date(user.subscriptionExpiry), 'MMM d, yyyy') : 'N/A'}</p>
               </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 pt-0.5 shadow-sm">
                     <TrendingUp size={14} />
                  </div>
                  <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-[#C78200]">Prorated Upgrade Logic</h4>
                     <p className="text-[9px] text-white/40 font-bold leading-relaxed pr-8">
                        Used **{usedDays} days** (Cutting: ₹{usedAmount.toLocaleString()}). Your remaining balance of **₹{existingCredit.toLocaleString()}** will be credited to your new choice.
                     </p>
                  </div>
               </div>

               <div className="bg-card/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                  <div>
                     <p className="text-white/20 text-[7px] font-black uppercase tracking-widest">New Potential Expiry</p>
                     <p className="text-emerald-400 text-sm font-black tracking-tight">
                        {(() => {
                          const curr = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : new Date();
                          const next = new Date(curr > new Date() ? curr : new Date());
                          next.setFullYear(next.getFullYear() + 1);
                          return format(next, 'MMMM d, yyyy');
                        })()}
                     </p>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-500 opacity-50" />
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 space-y-4 mb-8">
        {PLANS.filter(p => user?.subscriptionStatus !== p.id).map((plan) => (
          <div 
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id as any)}
            className={cn(
              "relative overflow-hidden rounded-[1.8rem] p-5 transition-all duration-500 cursor-pointer border",
              selectedPlan === plan.id ? "bg-card text-ink border-white shadow-xl scale-[1.01]" : "bg-card/5 border-white/10 text-white"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-black tracking-tighter">{plan.label}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className={cn("w-1 h-1 rounded-full", plan.color)} />
                   <p className={cn("text-[8px] font-black uppercase tracking-widest", selectedPlan === plan.id ? "opacity-60" : "text-white/40")}>
                     {plan.ponds} Ponds / Year
                   </p>
                </div>
              </div>
              {plan.id === 'pro_gold' && (
                <div className="bg-[#C78200] text-white px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest shadow-lg">Best Value</div>
              )}
            </div>
            
            <p className={cn("text-[9px] font-bold mb-4", selectedPlan === plan.id ? "opacity-60" : "text-white/40")}>
               {plan.desc}
            </p>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tighter">{plan.price}</span>
              <div className="flex flex-col">
                <span className={cn("text-[7px] font-black uppercase tracking-widest", selectedPlan === plan.id ? "opacity-40" : "text-white/40")}>/year</span>
                <span className={cn("text-[6px] font-bold uppercase tracking-widest text-[#C78200]")}>{plan.monthly}/month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 space-y-3 mb-8">
        <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 ml-2 mb-1">Included Benefits</h2>
        {features.map((f, i) => (
          <div key={i} className="bg-card/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 group">
            <div className="w-10 h-10 bg-card/5 rounded-xl flex items-center justify-center text-[#C78200] border border-white/10">
              <f.icon size={18} strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-black text-xs tracking-tight text-white">{f.title}</h3>
              <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>


      <div className="px-6 mt-8 pb-8">
        <button 
          onClick={handleUpgrade}
          disabled={!selectedPlan}
          className={cn(
            "w-full font-black py-5 rounded-[1.5rem] shadow-xl transition-all flex items-center justify-center gap-3 uppercase tracking-[0.3em] text-[10px] active:scale-95",
            selectedPlan 
              ? "bg-[#C78200] text-white shadow-[#C78200]/20" 
              : "bg-card/10 text-white/20 cursor-not-allowed shadow-none"
          )}
        >
          {selectedPlan ? t.unlockPro : "Select a Plan"} <Sparkles size={16} />
        </button>
        <p className="text-center text-white/20 text-[8px] font-bold uppercase tracking-widest mt-6 px-8 leading-relaxed">
          {t.termsPrivacyPolicy}
        </p>
      </div>

      <AnimatePresence>
        {isPaymentModalOpen && currentPlanData && (
          <PaymentModal 
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            plan={selectedPlan!}
            price={currentPlanData.price}
            existingCredit={existingCredit}
            usedDays={usedDays}
            usedAmount={usedAmount}
            t={t}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const PaymentModal = ({ onClose, plan, price, existingCredit, usedDays, usedAmount, t, onPaymentSuccess }: { isOpen: boolean, onClose: () => void, plan: string, price: string, existingCredit: number, usedDays: number, usedAmount: number, t: Translations, onPaymentSuccess: () => void }) => {
  const [method, setMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');

  const handlePay = () => {
    setIsProcessing(true);
    setProcessStep('Verifying Active Account...');
    
    setTimeout(() => {
      setProcessStep('Calculating Used Days & Cutting...');
      setTimeout(() => {
        setProcessStep(`Applying ₹${existingCredit.toLocaleString()} Credit...`);
        setTimeout(() => {
           setProcessStep('Finalizing Upgrade...');
           setTimeout(() => {
              setIsProcessing(false);
              setIsSuccess(true);
              setTimeout(() => {
                onPaymentSuccess();
              }, 2000);
           }, 1500);
        }, 1200);
      }, 1000);
    }, 800);
  };

  const basePriceNum = parseInt(price.replace('₹ ', '').replace(',', ''));
  const finalPayable = Math.max(0, basePriceNum - existingCredit);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#000]/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="relative w-full max-w-md bg-card rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 overflow-hidden"
      >
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl animate-bounce">
              <CheckCircle2 size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter text-ink mb-3">{t.paymentSuccess}</h2>
            <p className="text-ink/40 text-xs font-bold uppercase tracking-widest">Upgrade confirmed. Credit Applied.</p>
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 border-4 border-[#C78200]/20 border-t-[#C78200] rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-black tracking-tighter text-ink mb-3">{processStep}</h2>
            <p className="text-ink/40 text-[9px] font-black uppercase tracking-[0.2em]">Transaction Securely Managed</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-black tracking-tighter text-ink">Prorated Transition</h2>
                <p className="text-ink/40 text-[9px] font-black uppercase tracking-widest mt-0.5">{plan.replace('_', ' ').toUpperCase()} Expansion</p>
              </div>
              <button onClick={onClose} className="p-2 bg-[#4A2C2A]/5 rounded-xl text-ink/40 hover:text-ink transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="bg-card/50 p-6 rounded-[2rem] border border-card-border mb-8 space-y-3">
               <div className="flex justify-between items-center opacity-40">
                  <span className="text-[9px] font-black uppercase tracking-widest">Selected Plan Price</span>
                  <span className="text-xs font-bold font-mono">₹{basePriceNum.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center text-red-500/60">
                  <span className="text-[9px] font-black uppercase tracking-widest">Cutting ({usedDays} used days)</span>
                  <span className="text-xs font-bold font-mono">+ ₹{usedAmount.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center text-emerald-600">
                  <span className="text-[9px] font-black uppercase tracking-widest">Adjustment Credit</span>
                  <span className="text-xs font-bold font-mono">- ₹{(basePriceNum - finalPayable).toLocaleString()}</span>
               </div>
               <div className="pt-3 border-t border-card-border flex justify-between items-center">
                  <span className="text-[10px] font-black text-ink uppercase tracking-widest">Net Payable</span>
                  <span className="text-2xl font-black tracking-tighter text-[#C78200]">₹{finalPayable.toLocaleString()}</span>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { id: 'card', icon: CreditCard, label: 'Card' },
                { id: 'upi', icon: Smartphone, label: 'UPI' },
                { id: 'netbanking', icon: Globe, label: 'Bank' },
              ].map((m) => (
                <button 
                  key={m.id}
                  onClick={() => setMethod(m.id as any)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                    method === m.id ? "bg-[#C78200]/10 border-[#C78200] text-[#C78200]" : "bg-card border-card-border text-ink/40"
                  )}
                >
                  <m.icon size={24} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">{m.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4 mb-8">
              {method === 'card' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-ink/30 uppercase tracking-widest ml-1">Card Number</label>
                    <input className="w-full bg-[#F8F9FE] border border-card-border p-4 rounded-xl text-ink font-black outline-none focus:border-[#C78200] transition-all text-sm" placeholder="0000 0000 0000 0000" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-ink/30 uppercase tracking-widest ml-1">Expiry</label>
                      <input className="w-full bg-[#F8F9FE] border border-card-border p-4 rounded-xl text-ink font-black outline-none focus:border-[#C78200] transition-all text-sm" placeholder="MM/YY" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-ink/30 uppercase tracking-widest ml-1">CVV</label>
                      <input className="w-full bg-[#F8F9FE] border border-card-border p-4 rounded-xl text-ink font-black outline-none focus:border-[#C78200] transition-all text-sm" placeholder="***" type="password" />
                    </div>
                  </div>
                </>
              )}
              {method === 'upi' && (
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-ink/30 uppercase tracking-widest ml-1">UPI ID</label>
                  <input className="w-full bg-[#F8F9FE] border border-card-border p-4 rounded-xl text-ink font-black outline-none focus:border-[#C78200] transition-all text-sm" placeholder="username@upi" />
                </div>
              )}
            </div>

            <button 
              onClick={handlePay}
              className="w-full bg-[#C78200] text-white font-black py-5 rounded-[1.8rem] shadow-xl shadow-[#C78200]/10 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.3em] text-[10px] active:scale-95"
            >
              {t.payNow} <ChevronRight size={16} />
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};
