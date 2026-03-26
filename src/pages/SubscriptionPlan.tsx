import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { Header } from '../components/Header';
import { Translations } from '../translations';
import { useData } from '../context/DataContext';
import { cn } from '../utils/cn';
import { format } from 'date-fns';

export const SubscriptionPlan = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { user, isPro } = useData();

  if (!user) return null;

  const proFeatures = [
    t.aiDisease,
    t.profitForecasting,
    t.globalPriceAlerts,
    t.expertConsultations,
    t.realTimeHealthMonitoring
  ];

  const planName = isPro ? (user.subscriptionStatus === 'pro_silver' ? 'Aqua Silver' : user.subscriptionStatus === 'pro_gold' ? 'Aqua Gold' : user.subscriptionStatus === 'pro_diamond' ? 'Aqua Diamond' : 'Aqua Pro') : 'Free Plan';

  return (
    <div className="pb-32 bg-[#F8F9FE] min-h-screen text-left">
      <Header title={t.subscriptionPlan} showBack />
      
      <div className="pt-24 px-6 py-8 space-y-10">
        <div className={cn(
          "rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl transition-all duration-700",
          isPro ? "bg-[#0D1B17] border border-emerald-500/20" : "bg-[#4A2C2A]"
        )}>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{t.currentPlan}</span>
              {isPro && <Sparkles size={14} className="text-[#C78200] animate-pulse" />}
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-10 leading-none">
              {planName}
            </h2>
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/5 inline-flex">
              <Calendar size={18} className="text-white/60" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-white/40">{t.expiryDate}</p>
                <p className="font-black text-sm tracking-tight">
                  {isPro && user.subscriptionExpiry ? format(new Date(user.subscriptionExpiry), 'MMM d, yyyy') : "Never"}
                </p>
              </div>
            </div>
          </div>
          <Zap size={160} strokeWidth={0.5} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
        </div>

        <section className="space-y-6">
          <h3 className="text-[#4A2C2A]/30 text-[9px] font-black uppercase tracking-[0.2em] ml-2">What's Included</h3>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-black/5 space-y-6">
            {proFeatures.map((f, i) => (
              <div key={i} className="flex items-center gap-5 group">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  isPro ? "bg-[#C78200]/10 text-[#C78200]" : "bg-[#4A2C2A]/5 text-[#4A2C2A]/20"
                )}>
                  <CheckCircle2 size={20} />
                </div>
                <p className={cn(
                  "font-black text-base tracking-tight transition-all",
                  isPro ? "text-[#4A2C2A]" : "text-[#4A2C2A]/40"
                )}>{f}</p>
              </div>
            ))}
          </div>
        </section>

        {!isPro && (
          <button 
            onClick={() => navigate('/subscription')}
            className="w-full bg-[#C78200] text-white py-6 rounded-3xl font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl shadow-[#C78200]/20 transition-all active:scale-95 flex items-center justify-center gap-4"
          >
            {t.upgradeToPro} <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
