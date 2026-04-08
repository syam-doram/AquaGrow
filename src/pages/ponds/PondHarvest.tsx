import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  Trash2, 
  Waves, 
  CheckCircle2, 
  TrendingUp, 
  Target,
  Scale,
  DollarSign,
  User,
  ShoppingBag,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import { calculateDOC, calculateWeight } from '../../utils/pondUtils';
import type { Translations } from '../../translations';

export const PondHarvest = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { ponds, updatePond, addHarvestRequest } = useData();
  const pond = ponds.find(p => p.id === id);

  if (!pond) return <div className="p-10 text-center text-ink font-black uppercase tracking-widest bg-card min-h-screen">Pond Not Found</div>;

  const currentDoc = calculateDOC(pond.stockingDate);
  const currentWeight = calculateWeight(currentDoc);
  
  const [formData, setFormData] = useState({
    harvestType: 'full',
    avgWeight: currentWeight.toString(),
    totalBiomass: ((parseFloat(pond.seedCount) * 0.8 * currentWeight) / 1000).toFixed(0),
    marketRate: '600',
    buyerName: '',
    harvestDate: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create a formal Market Request (Harvest Order)
      await addHarvestRequest({
        pondId: pond.id,
        biomass: parseFloat(formData.totalBiomass),
        avgWeight: parseFloat(formData.avgWeight),
        price: parseFloat(formData.marketRate),
        buyerName: formData.buyerName,
        status: 'pending' // Stage 1: Broadcast to area providers
      });

      // Update pond to transition into the "Selling" phase
      await updatePond(pond.id, { 
        status: 'harvest_pending',
        harvestData: {
            ...formData,
            finalDoc: currentDoc
        }
      });
      
      navigate('/ponds');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-40 bg-transparent min-h-screen text-left relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[80%] h-[30%] bg-amber-500/10 rounded-full blur-[100px] -z-10" />
      
      <Header title="Harvest Order" showBack={true} onBack={() => navigate(-1)} />

      <div className="pt-24 px-5 max-w-xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-[#1A1C2E] to-[#0D523C] p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
           <div className="relative z-10">
              <p className="text-emerald-400 text-[8px] font-black uppercase tracking-[0.3em] mb-1">{pond.name} • Final Cycle</p>
              <h2 className="text-2xl font-black tracking-tighter mb-3">Finalizing Harvest</h2>
              <div className="flex gap-6 pt-3 border-t border-white/10">
                 <div>
                    <p className="text-white/40 text-[7px] font-black uppercase tracking-widest">Growth DOC</p>
                    <p className="text-lg font-black">{currentDoc}</p>
                 </div>
                 <div>
                    <p className="text-white/40 text-[7px] font-black uppercase tracking-widest">Est. Weight</p>
                    <p className="text-lg font-black">{currentWeight}g</p>
                 </div>
              </div>
           </div>
           <ShoppingBag className="absolute -right-6 -bottom-6 opacity-10" size={120} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Harvest Mode Selection */}
          <div className="bg-card p-1.5 rounded-2xl border border-card-border flex gap-1.5 shadow-sm">
             {['partial', 'full'].map(mode => (
               <button
                 key={mode}
                 type="button"
                 onClick={() => setFormData({...formData, harvestType: mode})}
                 className={cn(
                   "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all capitalize",
                   formData.harvestType === mode ? "bg-[#C78200] text-white shadow-lg" : "text-ink/30"
                 )}
               >
                 {mode} Harvest
               </button>
             ))}
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1.5">
                <label className="text-[9px] font-black text-ink/40 uppercase tracking-widest ml-3">Avg Weight (G)</label>
                <div className="relative">
                   <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C78200]" size={14} />
                   <input
                     type="number"
                     value={formData.avgWeight}
                     onChange={(e) => setFormData({...formData, avgWeight: e.target.value})}
                     className="w-full bg-card border border-card-border rounded-xl py-3.5 px-10 text-[12px] font-black focus:border-[#C78200] outline-none transition-all shadow-sm"
                     placeholder="25.5"
                   />
                </div>
             </div>

             <div className="space-y-1.5">
                <label className="text-[9px] font-black text-ink/40 uppercase tracking-widest ml-3">Biomass (Kg)</label>
                <div className="relative">
                   <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C78200]" size={14} />
                   <input
                     type="number"
                     value={formData.totalBiomass}
                     onChange={(e) => setFormData({...formData, totalBiomass: e.target.value})}
                     className="w-full bg-card border border-card-border rounded-xl py-3.5 px-10 text-[12px] font-black focus:border-[#C78200] outline-none transition-all shadow-sm"
                     placeholder="5000"
                   />
                </div>
             </div>

             <div className="space-y-1.5">
                <label className="text-[9px] font-black text-ink/40 uppercase tracking-widest ml-3">Price (₹/Kg)</label>
                <div className="relative">
                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C78200]" size={14} />
                   <input
                     type="number"
                     value={formData.marketRate}
                     onChange={(e) => setFormData({...formData, marketRate: e.target.value})}
                     className="w-full bg-card border border-card-border rounded-xl py-3.5 px-10 text-[12px] font-black focus:border-[#C78200] outline-none transition-all shadow-sm"
                     placeholder="650"
                   />
                </div>
             </div>

             <div className="space-y-1.5">
                <label className="text-[9px] font-black text-ink/40 uppercase tracking-widest ml-3">Buyer Name</label>
                <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C78200]" size={14} />
                   <input
                     type="text"
                     value={formData.buyerName}
                     onChange={(e) => setFormData({...formData, buyerName: e.target.value})}
                     className="w-full bg-card border border-card-border rounded-xl py-3.5 px-10 text-[12px] font-black focus:border-[#C78200] outline-none transition-all shadow-sm"
                     placeholder="Buyer"
                   />
                </div>
             </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-ink uppercase tracking-[0.2em] flex items-center gap-2">
                   <Target size={14} className="text-[#C78200]" />
                   Available Market Buyers
                </h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-md">Live Quotes</span>
             </div>
             
             <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1 -mx-5 ml-0">
                {[
                   { name: 'Reddy Aqua Exports', loc: 'Bhimavaram', rate: '₹680/kg', company: 'Global Aqua', rating: 4.9, icon: 'RA' },
                   { name: 'Coastal Shrimp Traders', loc: 'Nellore', rate: '₹675/kg', company: 'SeaPort Inc.', rating: 4.8, icon: 'CS' },
                   { name: 'Vannamei Direct', loc: 'Kakinada', rate: '₹690/kg', company: 'Export Hub', rating: 5.0, icon: 'VD' },
                   { name: 'Elite Seafoods', loc: 'Amalapuram', rate: '₹685/kg', company: 'Premium Pack', rating: 4.7, icon: 'ES' },
                ].map((buyer, i) => (
                   <div 
                      key={i}
                      onClick={() => setFormData({...formData, buyerName: buyer.name, marketRate: buyer.rate.replace(/\D/g,'')})}
                      className={cn(
                         "min-w-[180px] p-5 rounded-[2.2rem] border transition-all cursor-pointer active:scale-95 shrink-0",
                         formData.buyerName === buyer.name 
                            ? "bg-[#0D523C] border-emerald-500 shadow-xl shadow-emerald-900/10" 
                            : "bg-card border-card-border hover:border-[#C78200]/30 shadow-sm"
                      )}
                   >
                      <div className="flex items-center gap-3 mb-4">
                         <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs",
                            formData.buyerName === buyer.name ? "bg-white/10 text-white" : "bg-ink/5 text-ink/40"
                         )}>
                            {buyer.icon}
                         </div>
                         <div>
                            <p className={cn("text-[9px] font-black truncate max-w-[80px]", formData.buyerName === buyer.name ? "text-white" : "text-ink")}>{buyer.name}</p>
                            <div className="flex items-center gap-1">
                               <TrendingUp size={8} className="text-emerald-500" />
                               <span className={cn("text-[7px] font-black uppercase tracking-widest", formData.buyerName === buyer.name ? "text-white/40" : "text-ink/20")}>{buyer.loc}</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className={cn("inline-block px-3 py-1.5 rounded-full", formData.buyerName === buyer.name ? "bg-white/10" : "bg-emerald-50")}>
                         <p className={cn("text-[10px] font-black", formData.buyerName === buyer.name ? "text-emerald-300" : "text-emerald-600")}>{buyer.rate}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                         <p className={cn("text-[7px] font-black uppercase tracking-widest", formData.buyerName === buyer.name ? "text-white/20" : "text-ink/10")}>{buyer.company}</p>
                         <div className="flex items-center gap-0.5">
                            <span className={cn("text-[8px] font-black", formData.buyerName === buyer.name ? "text-emerald-300" : "text-[#C78200]")}>{buyer.rating}</span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 flex items-start gap-3">
             <Info className="text-[#C78200] shrink-0 mt-0.5" size={16} />
             <p className="text-[9px] font-bold text-[#C78200]/80 leading-relaxed">
               Finalizing will mark <strong>{pond.name}</strong> harvested. Financial records will be anchored for ROI.
             </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0D523C] text-white font-black py-5 rounded-2xl shadow-lg flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : (
              <>
                <CheckCircle2 size={16} />
                Complete Harvest
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
