import React from 'react';
import { Search, PlayCircle, CheckCircle2, Waves } from 'lucide-react';
import { Header } from '../components/Header';
import { Translations } from '../translations';
import { cn } from '../utils/cn';

export const LearningCenter = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  return (
    <div className="pb-32 bg-[#F8F9FE] min-h-screen">
      <Header title={t.learningCenter} showBack onMenuClick={onMenuClick} />
      <div className="pt-24 px-6 py-6 sticky top-[60px] bg-[#F8F9FE]/80 backdrop-blur-xl z-10 border-b border-[#4A2C2A]/5">
        <div className="flex items-center bg-white rounded-2xl border border-black/5 px-5 h-14 shadow-sm group focus-within:border-[#C78200]/30 transition-all">
          <Search size={20} className="text-[#4A2C2A]/20 mr-3" />
          <input className="flex-1 bg-transparent outline-none text-sm font-black text-[#4A2C2A] placeholder:text-[#4A2C2A]/20" placeholder={t.searchGuides} />
        </div>
      </div>
      <div className="px-6 py-8 space-y-10">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {[t.pondPrep, t.diseaseControl, t.harvesting, t.sustainability].map((tag, i) => (
            <button key={tag} className={cn(
              "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
              i === 0 ? "bg-[#C78200] text-white shadow-xl shadow-[#C78200]/20" : "bg-white border border-black/5 text-[#4A2C2A]/30 hover:text-[#C78200]"
            )}>
              {tag}
            </button>
          ))}
        </div>

        <section className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-lg font-black tracking-tighter text-[#4A2C2A]">{t.pondPrep}</h3>
            <button className="text-[#C78200] text-[9px] font-black uppercase tracking-widest hover:text-[#4A2C2A] transition-colors">{t.seeAll}</button>
          </div>
          <div className="flex overflow-x-auto gap-6 scrollbar-hide pb-4">
            {[1, 2].map(i => (
              <div key={i} className="min-w-[280px] flex flex-col gap-4 group cursor-pointer">
                <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-white shadow-sm border border-black/5">
                  <img src={`https://picsum.photos/seed/learn${i}/400/225`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute bottom-4 right-4 bg-[#4A2C2A]/40 backdrop-blur-md text-white text-[8px] px-3 py-1 rounded-lg font-black uppercase tracking-widest">12:04</div>
                  <div className="absolute inset-0 bg-[#C78200]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
                      <PlayCircle size={24} className="text-[#C78200]" />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-base font-black tracking-tight text-[#4A2C2A] leading-tight group-hover:text-[#C78200] transition-colors">{t.soilTreatmentGuide}</p>
                  <div className="flex items-center gap-2 text-[#4A2C2A]/30 text-[9px] font-black uppercase tracking-widest mt-2">
                    <PlayCircle size={12} /> <span>Video • 1.2k views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-[#4A2C2A] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-[#C78200] rounded-lg">
                <CheckCircle2 size={12} className="text-white" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#C78200]">Farmer Pro</span>
            </div>
            <h4 className="text-2xl font-black tracking-tighter">{t.elevateYield}</h4>
            <p className="text-sm text-white/60 mt-2 max-w-[200px] leading-relaxed">Unlock expert insights and real-time market forecasting.</p>
            <button className="mt-8 bg-[#C78200] text-white text-[10px] font-black uppercase tracking-[0.2em] px-10 py-4 rounded-2xl shadow-xl shadow-black/10 hover:scale-105 transition-transform active:scale-95">
              {t.unlockPro}
            </button>
          </div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#C78200]/10 blur-[80px] rounded-full"></div>
          <Waves size={160} className="absolute -right-10 -bottom-10 opacity-5 text-white" />
        </div>
      </div>
    </div>
  );
};
