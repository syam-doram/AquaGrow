import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Calendar, Waves, ChevronRight } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import { calculateDOC, getGrowthPercentage } from '../../utils/pondUtils';
import type { Translations } from '../../translations';

export const PondManagement = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, deletePond, user, isPro } = useData();
  const [activeTab, setActiveTab] = useState<'active' | 'harvested' | 'archive'>('active');

  const getPondLimit = () => {
    if (!isPro) return 1;
    const status = user?.subscriptionStatus;
    if (status === 'pro_silver') return 3;
    if (status === 'pro_gold') return 6;
    if (status === 'pro_diamond') return 9;
    if (status === 'pro') return 3;
    return 1;
  };

  const limit = getPondLimit();
  const activePondsCount = ponds.filter(p => p.status === 'active').length;
  const isLimitReached = activePondsCount >= limit;

  const handleAddPond = () => {
    if (isLimitReached) {
      alert(`Capacity Reached! Your current plan allows maximum ${limit} active ponds. Upgrade your plan to add more.`);
      navigate('/subscription');
      return;
    }
    navigate('/ponds/new');
  };

  const filteredPonds = ponds.filter(p => p.status === activeTab);

  return (
    <div className="pb-32 bg-transparent min-h-screen relative overflow-hidden">
      {/* ── Page Accents (Layered with Global) ── */}
      <div className="absolute top-0 right-0 w-[80%] h-[30%] bg-emerald-100/10 rounded-full blur-[100px] -z-10" />
      <Header title={t.ponds} onMenuClick={onMenuClick} />
      
      <div className="pt-24 px-4 flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setActiveTab('active')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
            activeTab === 'active' 
              ? "bg-[#C78200] text-white shadow-xl shadow-[#C78200]/20" 
              : "bg-white text-[#4A2C2A]/40 border border-[#4A2C2A]/5"
          )}
        >
          {t.activePonds}
        </button>
        <button 
          onClick={() => setActiveTab('harvested')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
            activeTab === 'harvested' 
              ? "bg-[#C78200] text-white shadow-xl shadow-[#C78200]/20" 
              : "bg-white text-[#4A2C2A]/40 border border-[#4A2C2A]/5"
          )}
        >
          {t.harvest}
        </button>
        <button 
          onClick={() => setActiveTab('archive')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
            activeTab === 'archive' 
              ? "bg-[#C78200] text-white shadow-xl shadow-[#C78200]/20" 
              : "bg-white text-[#4A2C2A]/40 border border-[#4A2C2A]/5"
          )}
        >
          {t.archive}
        </button>
      </div>

      <div className="px-4 space-y-3">
        {filteredPonds.length > 0 ? (
          filteredPonds.map(pond => (
            <div 
              key={pond.id} 
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-black/5 group cursor-pointer flex items-center p-3 gap-4" 
              onClick={() => navigate(`/ponds/${pond.id}`)}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#F8F9FE] relative overflow-hidden shrink-0">
                <img src={`https://picsum.photos/seed/${pond.id}/200/200`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={pond.name} />
                <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-[#4A2C2A] font-black text-sm tracking-tight truncate">{pond.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-black text-[7px] uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {calculateDOC(pond.stockingDate)} {t.days}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); if (confirm(t.deletePondConfirm)) deletePond(pond.id); }}
                      className="p-1 text-red-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-[#4A2C2A]/30 text-[8px] font-black uppercase tracking-widest mb-2 truncate">
                   <span className="flex items-center gap-1"><Waves size={10} className="text-[#C78200]" /> {pond.seedCount.toLocaleString()}</span>
                   <span>• {pond.species}</span>
                   <span>• {pond.size} {t.acres}</span>
                </div>

                <div className="relative h-1 bg-[#F8F9FE] rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-[#C78200] rounded-full shadow-[0_0_8px_rgba(199,130,0,0.3)] transition-all duration-1000" 
                     style={{ width: `${getGrowthPercentage(calculateDOC(pond.stockingDate))}%` }} 
                   />
                </div>
              </div>
              
              <div className="shrink-0 pl-2">
                <ChevronRight size={16} className="text-[#4A2C2A]/10 group-hover:text-[#C78200] group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-black/5 mx-4">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
              <Waves size={40} />
            </div>
            <p className="text-[#4A2C2A]/40 font-black uppercase tracking-widest text-[10px]">{t.noEntries}</p>
            <button onClick={() => navigate('/ponds/new')} className="mt-6 text-[#C78200] font-black underline text-xs">{t.addFirstPond}</button>
          </div>
        )}
      </div>

      <button 
        onClick={handleAddPond}
        className={cn(
          "fixed bottom-28 right-6 w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all z-40",
          isLimitReached ? "bg-red-500 shadow-red-500/20" : "bg-[#C78200] shadow-[#C78200]/30"
        )}
      >
        <Plus size={32} />
        {isLimitReached && <span className="text-[6px] font-bold uppercase tracking-tighter -mt-1">Limit Reached</span>}
      </button>
    </div>
  );
};
