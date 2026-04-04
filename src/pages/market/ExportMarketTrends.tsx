import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Sparkles } from 'lucide-react';
import { Header } from '../../components/Header';
import type { Translations } from '../../translations';
import { User } from '../../types';
import { cn } from '../../utils/cn';

const mockGlobalTrends = [
  { country: 'USA', demand: 'High', price: '14.20', trend: 'UP' },
  { country: 'China', demand: 'Medium', price: '12.80', trend: 'STABLE' },
  { country: 'Japan', demand: 'High', price: '15.50', trend: 'UP' },
  { country: 'Vietnam', demand: 'Low', price: '11.40', trend: 'DOWN' },
];

export const ExportMarketTrends = ({ user, t, onMenuClick }: { user: User, t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();

  if (user.subscriptionStatus === 'free') {
    return (
      <div className="min-h-screen bg-[#FFFDF5] flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C78200] blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#4A2C2A] blur-[120px] rounded-full animate-pulse delay-1000"></div>
        </div>
        
        <div className="w-24 h-24 bg-[#C78200] rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-[#C78200]/20">
          <Globe size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-black tracking-tighter text-[#4A2C2A] mb-4">{t.proFeature}</h2>
        <p className="text-[#4A2C2A]/60 text-sm leading-relaxed mb-10 max-w-[240px] font-medium">{t.exportMarketTrends} is only available for AquaGrow Pro subscribers.</p>
        <button 
          onClick={() => navigate('/subscription')}
          className="bg-[#C78200] text-white px-10 py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-[#C78200]/20 active:scale-95 transition-all flex items-center gap-3"
        >
          {t.upgradeToPro} <Sparkles size={18} className="text-white/40" />
        </button>
        <button onClick={() => navigate(-1)} className="mt-8 text-[#4A2C2A]/20 text-[10px] font-black uppercase tracking-widest hover:text-[#4A2C2A] transition-colors">{t.maybeLater}</button>
      </div>
    );
  }

  return (
    <div className="pb-32 bg-[#F8F9FE] min-h-screen">
      <Header title={t.exportMarketTrends} showBack onMenuClick={onMenuClick} />
      <div className="pt-24 px-6 py-8 space-y-10">
        <div className="bg-[#4A2C2A] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl shadow-black/20">
          <div className="relative z-10">
            <p className="text-[#C78200] text-[9px] font-black uppercase tracking-[0.2em] mb-4">{t.globalPriceAlerts}</p>
            <h2 className="text-4xl font-black tracking-tighter leading-tight">Global Demand is <span className="text-[#C78200]">Rising</span> in US & EU Markets</h2>
            <div className="mt-8 flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Avg. Export Price</p>
                <p className="text-xl font-black tracking-tighter">$14.20<span className="text-xs ml-1">/kg</span></p>
              </div>
              <div className="bg-[#C78200]/20 backdrop-blur-md px-4 py-2 rounded-xl border border-[#C78200]/20">
                <p className="text-[8px] font-black uppercase tracking-widest text-[#C78200]">Trend</p>
                <p className="text-xl font-black tracking-tighter text-[#C78200]">+12%</p>
              </div>
            </div>
          </div>
          <Globe size={120} strokeWidth={0.5} className="absolute -right-10 -bottom-10 text-white/5" />
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-black tracking-tighter text-[#4A2C2A] px-1">Demand Mapping</h3>
          <div className="space-y-4">
            {mockGlobalTrends.map(trend => (
              <div key={trend.country} className="bg-white p-6 rounded-[2rem] shadow-sm border border-black/5 flex items-center justify-between group hover:border-[#C78200]/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#C78200]/5 rounded-2xl flex items-center justify-center group-hover:bg-[#C78200]/10 transition-colors">
                    <span className="text-xl">
                      {trend.country === 'USA' ? '🇺🇸' : trend.country === 'China' ? '🇨🇳' : trend.country === 'Japan' ? '🇯🇵' : trend.country === 'Vietnam' ? '🇻🇳' : '🇹🇭'}
                    </span>
                  </div>
                  <div>
                    <p className="font-black text-base tracking-tight text-[#4A2C2A]">{trend.country}</p>
                    <p className="text-[10px] font-bold text-[#4A2C2A]/30 uppercase tracking-widest">Demand: {trend.demand}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg tracking-tighter text-[#4A2C2A]">${trend.price}</p>
                  <p className={cn(
                    "text-[9px] font-black uppercase tracking-widest",
                    trend.trend === 'UP' ? "text-emerald-500" : trend.trend === 'DOWN' ? "text-red-500" : "text-[#4A2C2A]/30"
                  )}>
                    {trend.trend === 'UP' ? '↑ Rising' : trend.trend === 'DOWN' ? '↓ Falling' : '→ Stable'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
