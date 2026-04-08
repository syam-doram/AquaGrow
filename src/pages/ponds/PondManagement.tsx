import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Calendar, Waves, ChevronRight, Layers as LayersIcon, Calculator, Fish, Bell, ShoppingBag, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import { ConfirmModal } from '../../components/ConfirmModal';
import { AlertModal } from '../../components/AlertModal';
import { calculateDOC, getGrowthPercentage, calculateWeight } from '../../utils/pondUtils';
import type { Translations } from '../../translations';

const safeNum = (v: any, fallback = 0) => {
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
};

export const PondManagement = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, deletePond, user, isPro, theme, waterRecords, reminders, unreadCount, harvestRequests } = useData();
  const [activeTab, setActiveTab] = useState<'active' | 'planned' | 'harvested' | 'archive'>('active');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const activePonds = useMemo(() => ponds.filter(p => p.status === 'active' || p.status === 'planned' || p.status === 'harvest_pending'), [ponds]);
  const plannedPonds = useMemo(() => ponds.filter(p => p.status === 'planned'), [ponds]);

  // ── Farm-wide aggregates ──
  const totalArea  = useMemo(() => activePonds.reduce((a, p) => a + safeNum(p.size), 0), [activePonds]);
  
  const totalBiomassKg = useMemo(() => activePonds.reduce((acc, p) => {
    const doc = calculateDOC(p.stockingDate);
    const weight = calculateWeight(doc);
    const live = safeNum(p.seedCount, 100000) * 0.80; // Est. 80% survival
    return acc + (live * weight) / 1000;
  }, 0), [activePonds]);

  const pendingAlerts = useMemo(() => 
    reminders.filter((r: any) => r.status === 'pending').length + unreadCount,
    [reminders, unreadCount]
  );

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

  const filteredPonds = ponds.filter(p => {
    if (activeTab === 'active') return p.status === 'active' || p.status === 'planned' || p.status === 'harvest_pending';
    return p.status === activeTab;
  });

  return (
    <div className="pb-32 bg-transparent min-h-screen relative overflow-hidden">
      {/* ── Page Accents (Layered with Global) ── */}
      <div className={cn("absolute top-0 right-0 w-[80%] h-[30%] bg-primary/10 rounded-full blur-[100px] -z-10", theme === 'midnight' && "bg-glow-primary/20")} />
      <Header title={t.ponds} onMenuClick={onMenuClick} />
      
      <div className="pt-24 px-4">
        {/* Farm Overview KPIs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { label: t.totalPonds, value: activePonds.length, sub: 'Ponds', icon: LayersIcon, color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)' },
              { label: t.totalArea, value: totalArea.toFixed(1), sub: 'Acre', icon: Calculator, color: '#0369A1', bg: 'rgba(3, 105, 161, 0.08)' },
              { label: t.biomassEst, value: `${(totalBiomassKg/1000).toFixed(1)}T`, sub: 'Mass', icon: Fish, color: '#059669', bg: 'rgba(5, 150, 105, 0.08)' },
              { label: t.pendingAlerts, value: pendingAlerts, sub: 'Needs', icon: Bell, color: pendingAlerts > 0 ? '#ef4444' : '#6b7280', bg: pendingAlerts > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(107, 114, 128, 0.08)' },
            ].map((stat, i) => (
              <div key={i} className="bg-card/70 backdrop-blur-md rounded-2xl p-3 border border-card-border shadow-sm group text-center flex flex-col items-center">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-105 shadow-inner" style={{ background: stat.bg }}>
                  <stat.icon size={14} style={{ color: stat.color }} />
                </div>
                <p className="text-ink text-sm font-black tracking-tighter leading-none">{stat.value}</p>
                <p className="text-[6px] font-black text-ink/30 uppercase tracking-widest mt-1.5 leading-none">{stat.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="px-4 flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setActiveTab('active')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
            activeTab === 'active' 
              ? "bg-[#C78200] text-white shadow-xl shadow-[#C78200]/20" 
              : "bg-card text-ink/40 border border-card-border"
          )}
        >
          {t.activePonds}
        </button>
        <button 
          onClick={() => setActiveTab('planned')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
            activeTab === 'planned' 
              ? "bg-[#C78200] text-white shadow-xl shadow-[#C78200]/20" 
              : "bg-card text-ink/40 border border-card-border"
          )}
        >
          {t.planned || 'Planned'}
        </button>
        <button 
          onClick={() => setActiveTab('harvested')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
            activeTab === 'harvested' 
              ? "bg-[#C78200] text-white shadow-xl shadow-[#C78200]/20" 
              : "bg-card text-ink/40 border border-card-border"
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
              : "bg-card text-ink/40 border border-card-border"
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
              className="bg-card rounded-[2rem] overflow-hidden shadow-sm border border-card-border group cursor-pointer flex items-center p-2.5 gap-3" 
              onClick={() => navigate(`/ponds/${pond.id}`)}
            >
              <div className="w-12 h-12 rounded-[1.2rem] bg-ink/5 relative overflow-hidden shrink-0">
                <img src={`https://picsum.photos/seed/${pond.id}/200/200`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={pond.name} />
                <div className="absolute inset-0 bg-black/5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                   <div>
                      <h3 className="text-ink font-black text-sm tracking-tight truncate">{pond.name}</h3>
                      <p className="text-[7px] font-black text-ink/30 uppercase tracking-widest mt-0.5">
                         {new Date(pond.stockingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                   </div>
                   <div className="flex flex-col items-end gap-1.5 shrink-0">
                     <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-black text-[7px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full",
                          pond.status === 'planned' ? "bg-blue-500/10 text-blue-500" : 
                          pond.status === 'harvest_pending' ? "bg-indigo-500/10 text-indigo-600 animate-pulse" :
                          "bg-emerald-500/10 text-emerald-500"
                        )}>
                          {pond.status === 'planned' ? 'Planned' : 
                           pond.status === 'harvest_pending' ? 'Selling Live' :
                           `DOC ${calculateDOC(pond.stockingDate)}`}
                        </span>
                        
                        <button 
                           onClick={(e) => { 
                              e.stopPropagation(); 
                              const doc = calculateDOC(pond.stockingDate);
                              if (doc > 7) {
                                 setShowDeleteAlert(true);
                                 return;
                              }
                              setConfirmDeleteId(pond.id); 
                           }}
                           className="p-1 text-ink/10 hover:text-red-500 transition-colors"
                         >
                           <Trash2 size={10} />
                        </button>
                     </div>
                     
                     <div className="flex items-center gap-2">
                        {/* Health Status Indicator */}
                        {(() => {
                           const latest = waterRecords.filter(r => r.pondId === pond.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                           const isWarning = latest && (latest.ph < 7.5 || latest.ph > 8.5 || latest.do < 4);
                           return (
                              <div className="flex items-center gap-1 bg-card border border-card-border px-1.5 py-0.5 rounded-full">
                                 <div className={cn("w-1.5 h-1.5 rounded-full", isWarning ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                                 <span className="text-[6px] font-black uppercase text-ink/40 tracking-widest">{isWarning ? 'Warning' : 'Healthy'}</span>
                              </div>
                           );
                        })()}

                        {/* Harvest Availability */}
                        {calculateDOC(pond.stockingDate) >= 90 && pond.status === 'active' && (
                           <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full border border-emerald-100">
                              <ShoppingBag size={8} />
                              <span className="text-[6px] font-black uppercase tracking-widest">Harvest Ready</span>
                           </div>
                        )}

                        {/* Tracking Status */}
                        {harvestRequests?.some((r: any) => r.pondId === pond.id && r.status !== 'completed') && (
                           <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full border border-indigo-100">
                              <span className="text-[6px] font-black uppercase tracking-widest">Tracking</span>
                           </div>
                        )}
                     </div>
                   </div>
                </div>
                
                <div className="flex items-center gap-3 text-ink/30 text-[7px] font-bold uppercase tracking-widest mb-3 truncate">
                   <div className="flex items-center gap-1">
                      <Fish size={10} className="text-ink/20" />
                      <span>{safeNum(pond.seedCount).toLocaleString()} Seeds</span>
                   </div>
                   <div className="flex items-center gap-1 text-emerald-600/60">
                      <TrendingUp size={10} />
                      <span>{calculateWeight(calculateDOC(pond.stockingDate)).toFixed(1)}g</span>
                   </div>
                </div>

                <div className="relative h-1 bg-ink/5 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-[#C78200] rounded-full shadow-[0_0_8px_rgba(199,130,0,0.2)] transition-all duration-1000" 
                     style={{ width: `${getGrowthPercentage(calculateDOC(pond.stockingDate))}%` }} 
                   />
                </div>
              </div>
              
              <div className="shrink-0 pr-1">
                <ChevronRight size={14} className="text-ink/5 group-hover:text-[#C78200] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 bg-card rounded-[1.8rem] border border-card-border shadow-sm max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-primary border border-primary/10">
              <Plus size={24} strokeWidth={3} />
            </div>
            <p className="text-ink font-black tracking-tight text-xs mb-1">{t.noEntries}</p>
            <p className="text-[8px] text-muted-ink font-bold uppercase tracking-widest mb-4 max-w-[200px] mx-auto leading-relaxed">{t.addFirstPondDesc}</p>
            <button onClick={() => navigate('/ponds/new')} 
              className="w-4/5 py-3.5 bg-gradient-to-br from-primary to-accent text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all">
              {t.addFirstPond}
            </button>
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

      <ConfirmModal 
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
           if (confirmDeleteId) deletePond(confirmDeleteId);
        }}
        title="Delete Pond?"
        message="This action will remove all historical records for this pond and cannot be undone."
        confirmText="Confirm Delete"
        cancelText="Keep Pond"
      />

      <AlertModal 
        isOpen={showDeleteAlert}
        onClose={() => setShowDeleteAlert(false)}
        title="Deletion Locked"
        message="Since this pond is now over DOC 7, it cannot be deleted to preserve the historical yield and finance records of this culture cycle."
        buttonText="I Understand"
      />
    </div>
  );
};
