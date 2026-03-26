import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X,
  Sparkles, 
  Waves, 
  Camera, 
  TrendingUp, 
  Globe, 
  Headphones, 
  CreditCard, 
  Smartphone, 
  ChevronRight,
  ChevronLeft,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { cn } from '../utils/cn';
import { Translations } from '../translations';
import { format } from 'date-fns';

export const SubscriptionScreen = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { upgradePlan, user, isPro } = useData();
  
  const PLANS = [
    { id: 'pro_silver',  label: 'Aqua 3 (Silver)', price: '₹ 2,999',  ponds: 3, color: 'bg-slate-400', desc: 'Ideal for small-scale pilot crops' },
    { id: 'pro_gold',    label: 'Aqua 6 (Gold)',   price: '₹ 4,999',  ponds: 6, color: 'bg-[#C78200]', desc: 'The perfect balance for growing farms' },
    { id: 'pro_diamond', label: 'Aqua 9 (Diamond)', price: '₹ 6,999',  ponds: 9, color: 'bg-blue-500', desc: 'Maximum scale for professional operations' },
  ];

  const availablePlans = PLANS.filter(p => user?.subscriptionStatus !== p.id);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(availablePlans.length > 0 ? availablePlans[0].id : null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Sync selected plan if user status changes (e.g. login/expiry)
  React.useEffect(() => {
    const updatedAvailable = PLANS.filter(p => user?.subscriptionStatus !== p.id);
    if (selectedPlan && user?.subscriptionStatus === selectedPlan) {
      setSelectedPlan(updatedAvailable.length > 0 ? updatedAvailable[0].id : null);
    } else if (!selectedPlan && updatedAvailable.length > 0) {
      setSelectedPlan(updatedAvailable[0].id);
    }
  }, [user?.subscriptionStatus]);

  const handleUpgrade = () => {
    if (selectedPlan) {
      setIsPaymentModalOpen(true);
    } else {
      alert("Please select a plan to upgrade.");
    }
  };

  const currentPlanData = PLANS.find(p => p.id === selectedPlan);

  const handlePaymentSuccess = async () => {
    if (selectedPlan) {
      const success = await upgradePlan(selectedPlan);
      if (success) {
        navigate('/dashboard');
      } else {
        alert("Upgrade failed. Please check your connection.");
      }
    }
  };

  const features = [
    { icon: Camera, title: t.aiDisease, desc: 'Unlimited AI Diagnostics' },
    { icon: TrendingUp, title: 'Multi-Pond SOP', desc: 'Auto-schedules for every pond' },
    { icon: Globe, title: 'IoT Integration', desc: 'Live multi-sensor monitoring' },
  ];

  return (
    <div className="min-h-screen bg-[#0D1B17] text-white flex flex-col overflow-x-hidden pb-10 relative font-sans text-left">
      <button 
        onClick={() => navigate(-1)}
        className="absolute top-8 left-8 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all z-50 active:scale-90"
      >
        <ChevronLeft size={24} className="text-white/60" />
      </button>
      
      <div className="flex flex-col items-center pt-16 pb-8">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[#C78200]/20 blur-3xl rounded-full scale-150"></div>
          <div className="w-24 h-24 bg-[#C78200] rounded-full flex items-center justify-center relative z-10 shadow-[0_0_40px_rgba(199,130,0,0.3)]">
            <Waves size={48} className="text-white" />
          </div>
          <div className="absolute -top-2 -right-2 bg-white p-2 rounded-full border-2 border-[#4A2C2A] shadow-xl">
            <Sparkles size={16} className="text-[#C78200]" />
          </div>
        </div>
        <h1 className="text-2xl font-black tracking-tighter text-white text-center">
          AquaGrow <span className="text-[#C78200]">Scale Up</span>
        </h1>
        <p className="text-white/40 text-[10px] font-black tracking-[0.4em] uppercase mt-3">Choose Your Farming Capacity</p>
      </div>

      {isPro && user && (
        <div className="px-8 mb-8">
          <div className="bg-[#1A302A] border border-emerald-500/20 rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-[#C78200]"><Sparkles size={80} /></div>
            <p className="text-[#C78200] text-[8px] font-black uppercase tracking-[0.4em] mb-2">Current Active Status</p>
            <h3 className="text-2xl font-black tracking-tighter mb-4">
              {user.subscriptionStatus === 'pro_silver' ? 'Aqua 3 (Silver)' : 
               user.subscriptionStatus === 'pro_gold' ? 'Aqua 6 (Gold)' : 
               user.subscriptionStatus === 'pro_diamond' ? 'Aqua 9 (Diamond)' : 'Aqua Pro'}
            </h3>
            <div className="flex flex-col gap-1.5 mt-2">
              <p className="text-[#C78200]/40 text-[7px] font-black uppercase tracking-[0.2em]">Active Coverage Plan</p>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500"><CheckCircle2 size={12} /></div>
                <p className="text-emerald-400 text-[10px] font-black tracking-tight uppercase">
                  Expiry Date: <span className="text-white text-xs">{user.subscriptionExpiry ? format(new Date(user.subscriptionExpiry), 'MMM d, yyyy') : 'N/A'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-8 space-y-6 mb-12">
        {PLANS.filter(p => user?.subscriptionStatus !== p.id).map((plan) => {
          const isActivePlan = false; // Filtered out anyway, but kept for logic safety
          return (
            <div 
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id as any)}
              className={cn(
                "relative overflow-hidden rounded-[2.5rem] p-7 transition-all duration-500 cursor-pointer border",
                selectedPlan === plan.id ? "bg-white text-[#4A2C2A] border-white shadow-2xl scale-[1.02]" : "bg-white/5 border-white/10 text-white"
              )}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black tracking-tighter">{plan.label}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <div className={cn("w-1.5 h-1.5 rounded-full", plan.color)} />
                     <p className={cn("text-[9px] font-black uppercase tracking-widest", selectedPlan === plan.id ? "opacity-60" : "text-white/40")}>
                       {plan.ponds} Ponds / Year
                     </p>
                  </div>
                </div>
                {plan.id === 'pro_gold' && (
                  <div className="bg-[#C78200] text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-xl shadow-[#C78200]/20">Best Value</div>
                )}
              </div>
              
              <p className={cn("text-[10px] font-bold mb-6", selectedPlan === plan.id ? "opacity-60" : "text-white/40")}>
                 {plan.desc}
              </p>
  
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tighter">{plan.price}</span>
                <div className="flex flex-col">
                  <span className={cn("text-[8px] font-black uppercase tracking-widest", selectedPlan === plan.id ? "opacity-40" : "text-white/40")}>/year</span>
                  <span className={cn("text-[7px] font-bold uppercase tracking-widest text-[#C78200]")}>365 Days Validity</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-8 space-y-4 mb-10">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2 mb-2">Included In All Plans</h2>
        {features.map((f, i) => (
          <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-5 flex items-center gap-6 group">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#C78200] border border-white/10">
              <f.icon size={22} strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-white">{f.title}</h3>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-8 mt-12 pb-10">
        <button 
          onClick={handleUpgrade}
          disabled={!selectedPlan}
          className={cn(
            "w-full font-black py-6 rounded-[2rem] shadow-2xl transition-all flex items-center justify-center gap-4 uppercase tracking-[0.3em] text-[11px] active:scale-95",
            selectedPlan 
              ? "bg-[#C78200] text-white shadow-[#C78200]/30" 
              : "bg-white/10 text-white/20 cursor-not-allowed shadow-none"
          )}
        >
          {selectedPlan ? t.unlockPro : "Select a Plan"} <Sparkles size={18} />
        </button>
        <p className="text-center text-white/20 text-[9px] font-bold uppercase tracking-widest mt-8 px-10 leading-relaxed">
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
            t={t}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const PaymentModal = ({ isOpen, onClose, plan, price, t, onPaymentSuccess }: { isOpen: boolean, onClose: () => void, plan: string, price: string, t: Translations, onPaymentSuccess: () => void }) => {
  const [method, setMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onPaymentSuccess();
      }, 2000);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-8">
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
        className="relative w-full max-w-lg bg-white rounded-t-[3.5rem] sm:rounded-[3.5rem] p-10 overflow-hidden"
      >
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-2xl animate-bounce">
              <CheckCircle2 size={48} className="text-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-[#4A2C2A] mb-4">{t.paymentSuccess}</h2>
            <p className="text-[#4A2C2A]/40 text-sm font-bold uppercase tracking-widest">Your farm is now ready to scale</p>
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 border-4 border-[#C78200]/20 border-t-[#C78200] rounded-full animate-spin mb-8"></div>
            <h2 className="text-2xl font-black tracking-tighter text-[#4A2C2A] mb-4">{t.processingPayment}</h2>
            <p className="text-[#4A2C2A]/40 text-[10px] font-black uppercase tracking-[0.2em]">{t.doNotRefresh}</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-[#4A2C2A]">Pay Securely</h2>
                <p className="text-[#4A2C2A]/40 text-[10px] font-black uppercase tracking-widest mt-1">{plan.replace('_', ' ').toUpperCase()} • {price}</p>
              </div>
              <button onClick={onClose} className="p-3 bg-[#4A2C2A]/5 rounded-2xl text-[#4A2C2A]/40 hover:text-[#4A2C2A] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { id: 'card', icon: CreditCard, label: 'Card' },
                { id: 'upi', icon: Smartphone, label: 'UPI' },
                { id: 'netbanking', icon: Globe, label: 'Bank' },
              ].map((m) => (
                <button 
                  key={m.id}
                  onClick={() => setMethod(m.id as any)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-5 rounded-3xl border transition-all",
                    method === m.id ? "bg-[#C78200]/10 border-[#C78200] text-[#C78200]" : "bg-white border-black/5 text-[#4A2C2A]/40"
                  )}
                >
                  <m.icon size={28} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">{m.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-6 mb-10">
              {method === 'card' && (
                <>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-[#4A2C2A]/30 uppercase tracking-widest ml-2">Card Number</label>
                    <input className="w-full bg-[#F8F9FE] border border-black/5 p-5 rounded-2xl text-[#4A2C2A] font-black outline-none focus:border-[#C78200] transition-all" placeholder="0000 0000 0000 0000" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-[#4A2C2A]/30 uppercase tracking-widest ml-2">Expiry</label>
                      <input className="w-full bg-[#F8F9FE] border border-black/5 p-5 rounded-2xl text-[#4A2C2A] font-black outline-none focus:border-[#C78200] transition-all" placeholder="MM/YY" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-[#4A2C2A]/30 uppercase tracking-widest ml-2">CVV</label>
                      <input className="w-full bg-[#F8F9FE] border border-black/5 p-5 rounded-2xl text-[#4A2C2A] font-black outline-none focus:border-[#C78200] transition-all" placeholder="***" type="password" />
                    </div>
                  </div>
                </>
              )}
              {method === 'upi' && (
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-[#4A2C2A]/30 uppercase tracking-widest ml-2">UPI ID</label>
                  <input className="w-full bg-[#F8F9FE] border border-black/5 p-5 rounded-2xl text-[#4A2C2A] font-black outline-none focus:border-[#C78200] transition-all" placeholder="username@upi" />
                </div>
              )}
            </div>

            <div className="p-5 bg-[#C78200]/5 rounded-2xl border border-[#C78200]/10 mb-8 flex justify-between items-center">
              <p className="text-[#C78200]/60 text-[10px] font-black uppercase tracking-widest">Annual Total</p>
              <p className="text-xl font-black tracking-tighter text-[#4A2C2A]">{price}</p>
            </div>

            <button 
              onClick={handlePay}
              className="w-full bg-[#C78200] text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-[#C78200]/20 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.3em] text-[11px] active:scale-95"
            >
              {t.payNow} <ChevronRight size={18} />
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};
