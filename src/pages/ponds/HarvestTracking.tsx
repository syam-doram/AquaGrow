import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  ShoppingBag, 
  ShieldCheck, 
  Scale, 
  DollarSign, 
  Waves, 
  CreditCard,
  Archive,
  Check,
  History,
  Phone,
  MessageSquare,
  HelpCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';

export const HarvestTracking = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { ponds, harvestRequests, theme } = useData();
  
  const pond = ponds.find(p => p.id === id);
  const request = harvestRequests.find(r => (r.pondId?.toString() === id?.toString()) && r.status !== 'cancelled');

  if (!pond || !request) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center bg-[#0D0E1A]">
        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10">
           <History size={40} className="text-white/20" />
        </div>
        <h3 className="text-white font-black text-xl mb-2">No Active Trackers</h3>
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-[240px]">
           No marketplace orders were found for this pond.
        </p>
        <button onClick={() => navigate(-1)} className="mt-8 px-8 py-3 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">
           Go Back
        </button>
      </div>
    );
  }

  const stages = [
    { id: 'pending', label: 'Selling', icon: ShoppingBag, desc: 'Request Broadcast', detail: 'Your harvest request is live. Local providers are reviewing the biomass and unit rate.' },
    { id: 'accepted', label: 'Accepted', icon: Check, desc: 'Buyer Found', detail: 'An area provider has accepted your harvest order. They will visit your farm shortly.' },
    { id: 'quality_checked', label: 'Quality Check', icon: ShieldCheck, desc: 'Expert Verification', detail: 'The provider is conducting a quality assessment of the shrimp count and health.' },
    { id: 'weighed', label: 'Weight Check', icon: Scale, desc: 'Tonnage confirmed', detail: 'Harvest weighing is in progress to finalize the exact biomass for payment.' },
    { id: 'rate_confirmed', label: 'Rate Confirm', icon: DollarSign, desc: 'Final Pricing', detail: 'The unit rate is locked based on the final quality and counts verified.' },
    { id: 'harvested', label: 'Harvesting', icon: Waves, desc: 'Pond Clearance', detail: 'The pond is being cleared. This marks the physical completion of the culture cycle.' },
    { id: 'paid', label: 'Payment', icon: CreditCard, desc: 'Funds Settled', detail: 'The provider has released the funds. Check your bank account or wallet for the settlement.' },
    { id: 'completed', label: 'Archived', icon: Archive, desc: 'Cycle Closed', detail: 'The sale is complete. All data has been archived for your ROI reports.' }
  ];

  const statusOrder = ['pending', 'accepted', 'quality_checked', 'weighed', 'rate_confirmed', 'harvested', 'paid', 'completed'];
  const currentStatusIdx = statusOrder.indexOf(request.status);

  const getStageStatus = (stageId: string) => {
    const stageStatusIdx = statusOrder.indexOf(stageId);
    if (request.status === 'completed') return 'completed';
    if (currentStatusIdx > stageStatusIdx) return 'completed';
    if (currentStatusIdx === stageStatusIdx) return 'current';
    return 'pending';
  };

  const finalActiveIdx = stages.findIndex(s => getStageStatus(s.id) === 'current') !== -1 
    ? stages.findIndex(s => getStageStatus(s.id) === 'current') 
    : (request.status === 'completed' ? stages.length - 1 : 0);

  return (
    <div className="pb-40 bg-[#0D0E1A] min-h-screen text-left relative overflow-hidden">
      {/* Background Accents (Elite Marketplace Theme) */}
      <div className="absolute top-0 right-0 w-[120%] h-[50%] bg-indigo-600/10 rounded-full blur-[140px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[80%] h-[30%] bg-emerald-600/10 rounded-full blur-[140px] -z-10" />

      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 bg-[#0D0E1A]/80 backdrop-blur-xl px-4 pt-[calc(env(safe-area-inset-top)+0.8rem)] pb-4 flex items-center justify-between border-b border-white/5 shadow-2xl">
        <button onClick={() => navigate(-1)} className="p-3 text-white hover:bg-white/5 rounded-2xl transition-all">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
            <h1 className="text-sm font-black text-white tracking-tighter uppercase">{pond.name} Sale</h1>
            <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Order ID #H-{request.id?.slice(-4) || 'TRACK'}</p>
        </div>
        <button className="p-3 text-white/20 hover:text-white transition-all">
          <HelpCircle size={24} />
        </button>
      </header>

      <div className="pt-28 px-6 space-y-10">
        {/* Dynamic Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
           <div className="flex items-center gap-2 mb-3">
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                 <p className="text-emerald-400 text-[8px] font-black uppercase tracking-[0.2em]">{request.status === 'completed' ? 'Order Fulfilled' : 'Active Tracking Mode'}</p>
              </div>
           </div>
           
           <h2 className="text-[42px] font-black text-white tracking-tighter leading-[0.95] mb-4">
              {stages[finalActiveIdx].label} <br/>
              <span className="text-emerald-400">In Progress</span>
           </h2>
           <p className="text-white/50 text-[13px] font-medium leading-relaxed max-w-[280px]">
              {stages[finalActiveIdx].detail}
           </p>
        </motion.div>

        {/* ── HIGH FIDELITY TRACKER ── */}
        <div className="relative pt-6 pb-2 overflow-x-auto scrollbar-hide -mx-6 px-6">
           <div className="flex items-center min-w-[1000px] gap-0 px-4">
              {stages.map((stage, idx) => {
                 const status = getStageStatus(stage.id);
                 const isCompleted = status === 'completed';
                 const isCurrent = status === 'current';
                 
                 return (
                    <div key={idx} className="flex items-center flex-1 relative">
                       {/* Connection Line */}
                       {idx !== 0 && (
                          <div className="absolute left-[-50%] right-[50%] h-[4px] bg-white/5 rounded-full transition-all duration-1000 overflow-hidden">
                             {(isCompleted || isCurrent) && (
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: '100%' }}
                                  className={cn(
                                    "h-full transition-all duration-1000",
                                    isCompleted ? "bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]" : "bg-emerald-400/30"
                                  )}
                                />
                             )}
                          </div>
                       )}

                       {/* Milestone Hub */}
                       <div className="relative z-10 flex flex-col items-center flex-1">
                          <motion.div 
                            initial={false}
                            animate={{ 
                               scale: isCurrent ? 1.1 : 1,
                               backgroundColor: isCompleted ? '#34D399' : '#1A1C30'
                            }}
                            className={cn(
                               "w-20 h-20 rounded-[2rem] flex items-center justify-center border-4 transition-all duration-500",
                               isCompleted ? "border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.25)]" : 
                               isCurrent ? "border-emerald-400 border-dashed animate-pulse bg-[#1A1C30]" : 
                               "border-white/5 bg-[#141521]"
                            )}
                          >
                             {isCompleted ? (
                                <Check size={32} className="text-[#0D0E1A] stroke-[4]" />
                             ) : (
                                <stage.icon size={28} className={cn(
                                   isCurrent ? "text-emerald-400" : "text-white/10"
                                )} />
                             )}
                          </motion.div>
                          
                          {/* Metadata */}
                          <div className="absolute top-24 text-center w-32">
                             <p className={cn(
                                "text-[12px] font-black uppercase tracking-tight leading-none mb-1.5 transition-colors",
                                isCompleted || isCurrent ? "text-white" : "text-white/10"
                             )}>
                                {stage.label}
                             </p>
                             <div className="flex items-center justify-center gap-1">
                                {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                <p className={cn(
                                   "text-[7.5px] font-black uppercase tracking-widest",
                                   isCurrent ? "text-emerald-400" : "text-white/5"
                                )}>
                                   {isCurrent ? 'NOW LIVE' : stage.desc}
                                </p>
                             </div>
                          </div>
                       </div>
                    </div>
                 );
              })}
           </div>
        </div>

        {/* Dynamic Contextual Information Grid */}
        <div className="grid grid-cols-1 gap-4 pt-12">
            {/* Financial Summary Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-10">
                     <div className="space-y-1">
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Est. Market Value</p>
                        <h4 className="text-[44px] font-black tracking-tighter leading-none">₹{(request.biomass * request.price).toLocaleString()}</h4>
                     </div>
                     <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                        <DollarSign size={28} />
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10 relative">
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[1px] bg-white/10" />
                     <div className="space-y-2">
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                           <Scale size={10} /> Order Mass
                        </p>
                        <p className="text-2xl font-black tracking-tight">{request.biomass.toLocaleString()} <span className="text-[10px] text-white/30 uppercase tracking-widest">KG</span></p>
                     </div>
                     <div className="space-y-2 pl-4">
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                           <Clock size={10} /> Market Rate
                        </p>
                        <p className="text-2xl font-black tracking-tight">₹{request.price}<span className="text-[10px] text-white/30 uppercase tracking-widest">/KG</span></p>
                     </div>
                  </div>
               </div>
               <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-[80px] -z-10 group-hover:scale-110 transition-transform duration-[2000ms]" />
               <ShoppingBag className="absolute -right-12 -bottom-12 opacity-5 rotate-12 transition-transform group-hover:scale-110" size={240} />
            </div>

            {/* Support & Action Hub */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] relative overflow-hidden group active:scale-95 transition-all">
                   <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                      <MessageSquare size={20} />
                   </div>
                   <h3 className="text-white font-black text-xs uppercase tracking-tight mb-1">Help Desk</h3>
                   <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Live Support</p>
                   <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] relative overflow-hidden group active:scale-95 transition-all">
                   <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                      <Phone size={20} />
                   </div>
                   <h3 className="text-white font-black text-xs uppercase tracking-tight mb-1">Call Agent</h3>
                   <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Immediate Contact</p>
                   <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>

            {/* Provider Logistics Card */}
            <div className="bg-card/40 border border-card-border p-6 rounded-[2.5rem] flex items-center justify-between group active:scale-[0.98] transition-all">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#C78200]/10 flex items-center justify-center text-[#C78200] border border-[#C78200]/20">
                     <Clock size={24} className="animate-pulse" />
                  </div>
                  <div>
                     <p className="text-white/10 text-[8px] font-black uppercase tracking-[0.2em] mb-1">Expected Arrival</p>
                     <p className="text-white font-black text-sm tracking-tight capitalize">Contact provider for ETA</p>
                  </div>
               </div>
               <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white transition-colors">
                  <ExternalLink size={16} />
               </div>
            </div>
        </div>

        <div className="flex flex-col items-center gap-8 py-10">
           <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Syncing Real-time Stream</p>
           </div>
           
           <button 
              onClick={() => navigate(-1)}
              className="text-[11px] font-black text-white/15 uppercase tracking-[0.5em] hover:text-white hover:tracking-[0.6em] transition-all duration-700"
           >
              TERMINATE MONITORING
           </button>
        </div>
      </div>
    </div>
  );
};
