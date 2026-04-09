import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, ShoppingBag, ShieldCheck, Scale, Waves, CreditCard,
  Archive, Check, History, Clock, Send, MessageSquare, AlertTriangle,
  XCircle, IndianRupee, Trash2, User, Sparkles, TrendingUp, TrendingDown, Award,
  CheckCircle2, ArrowRight, Zap, Fish, Star, Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import type { Translations } from '../../translations';
import { cn } from '../../utils/cn';

// Stage definitions with colors
const STAGES = [
  { id: 'pending',         label: 'Broadcast',   short: 'Sent',      icon: ShoppingBag,  color: 'indigo',   desc: 'Harvest order is live. Verified providers within 150km are reviewing your lot.' },
  { id: 'accepted',        label: 'Matched',      short: 'Found',     icon: CheckCircle2, color: 'blue',     desc: 'A provider accepted your order. Discuss logistics and terms in the chat below.' },
  { id: 'quality_checked', label: 'Quality',      short: 'QC',        icon: ShieldCheck,  color: 'violet',   desc: 'Provider is conducting quality assessment — shrimp count, health, and grade.' },
  { id: 'weighed',         label: 'Weighed',      short: 'Wt.',       icon: Scale,        color: 'amber',    desc: 'Physical harvest being weighed to confirm final billing biomass.' },
  { id: 'rate_confirmed',  label: 'Rate Fixed',   short: 'Rate',      icon: IndianRupee,  color: 'orange',   desc: 'Final unit rate locked based on quality grade and verified biomass.' },
  { id: 'harvested',       label: 'Harvesting',   short: 'Done',      icon: Waves,        color: 'teal',     desc: 'Pond clearance is in progress — completing the full culture cycle.' },
  { id: 'paid',            label: 'Payment',      short: 'Paid',      icon: CreditCard,   color: 'emerald',  desc: 'Funds released. Settlement routing securely to your registered bank.' },
  { id: 'completed',       label: 'Archived',     short: 'Close',     icon: Archive,      color: 'slate',    desc: 'Sale complete. All data archived for ROI and audit reporting.' },
];

const STATUS_ORDER = STAGES.map(s => s.id);

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; glow: string; fill: string }> = {
  indigo:  { bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'border-indigo-500/30', glow: 'shadow-indigo-500/20',  fill: 'bg-indigo-500' },
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/30',   glow: 'shadow-blue-500/20',    fill: 'bg-blue-500' },
  violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/30', glow: 'shadow-violet-500/20',  fill: 'bg-violet-500' },
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30',  glow: 'shadow-amber-500/20',   fill: 'bg-amber-500' },
  orange:  { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/30', glow: 'shadow-orange-500/20',  fill: 'bg-orange-500' },
  teal:    { bg: 'bg-teal-500/10',    text: 'text-teal-400',    border: 'border-teal-500/30',   glow: 'shadow-teal-500/20',    fill: 'bg-teal-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30',glow: 'shadow-emerald-500/20', fill: 'bg-emerald-500' },
  slate:   { bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/30',  glow: 'shadow-slate-500/20',   fill: 'bg-slate-500' },
};

export const HarvestTracking = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { ponds, harvestRequests, updatePond, updateHarvestRequest, sendHarvestMessage, user, theme } = useData();

  const isDark = theme === 'dark' || theme === 'midnight';
  const pond = ponds.find(p => p.id === id);
  const request = harvestRequests.find(r => (r.pondId?.toString() === id?.toString()) && r.status !== 'cancelled');
  const cancelledRequest = harvestRequests.find(r => (r.pondId?.toString() === id?.toString()) && r.status === 'cancelled');

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [showPriceField, setShowPriceField] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const harvestStartedAt = pond?.harvestData?.harvestStartedAt;
  const canCancel = harvestStartedAt && (new Date().getTime() - new Date(harvestStartedAt).getTime()) < 5 * 60 * 1000;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [request?.chatMessages?.length]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isSending) return;
    setIsSending(true);
    const price = proposedPrice ? parseFloat(proposedPrice) : undefined;
    await sendHarvestMessage(request!.id || (request as any)._id, chatMessage.trim(), price);
    setChatMessage('');
    setProposedPrice('');
    setShowPriceField(false);
    setIsSending(false);
  };

  // ── CANCELLED STATE ──
  if (!request && cancelledRequest) {
    return (
      <div className={cn("min-h-screen", isDark ? "bg-[#070D12]" : "bg-[#F5F7FA]")}>
        <header className={cn(
          "fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 backdrop-blur-xl px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center justify-between border-b",
          isDark ? "bg-[#070D12]/90 border-white/5" : "bg-white/90 border-slate-100"
        )}>
          <button onClick={() => navigate(-1)} className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-600")}>
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <h1 className={cn("text-xs font-black tracking-tight uppercase", isDark ? "text-white" : "text-slate-900")}>{pond?.name}</h1>
            <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">{t.orderCancelled}</p>
          </div>
          <div className="w-10" />
        </header>

        <div className="pt-24 px-5 pb-16">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            className={cn("rounded-[2.5rem] overflow-hidden border shadow-xl", isDark ? "border-white/5" : "border-slate-100")}
          >
            <div className="bg-gradient-to-br from-red-600 to-red-800 p-8 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10"><XCircle size={200} className="absolute -right-10 -bottom-10 rotate-12" /></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <XCircle size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-black tracking-tight mb-1">{t.harvestCancelled}</h2>
                <p className="text-red-200/70 text-[9px] font-black uppercase tracking-[0.2em]">Order #H-{cancelledRequest.id?.slice(-4) || 'XXXX'}</p>
              </div>
            </div>
            <div className={cn("p-6 space-y-4", isDark ? "bg-[#0D1520]" : "bg-white")}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Biomass', value: `${cancelledRequest.biomass} kg` },
                  { label: 'Cancelled', value: new Date(cancelledRequest.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                ].map((item, i) => (
                  <div key={i} className={cn("p-4 rounded-2xl", isDark ? "bg-white/5" : "bg-slate-50")}>
                    <p className={cn("text-[8px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/30" : "text-slate-400")}>{item.label}</p>
                    <p className={cn("font-black text-lg", isDark ? "text-white" : "text-slate-800")}>{item.value}</p>
                  </div>
                ))}
              </div>
              {cancelledRequest.cancellationReason && (
                <div className={cn("p-4 rounded-2xl border", isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200")}>
                  <p className={cn("text-[8px] font-black uppercase tracking-widest mb-2", isDark ? "text-amber-400/60" : "text-amber-600")}>{t.reasonGiven}</p>
                  <p className={cn("text-[11px] font-bold italic leading-relaxed", isDark ? "text-amber-300" : "text-amber-800")}>"{cancelledRequest.cancellationReason}"</p>
                </div>
              )}
              <button onClick={() => navigate(-1)} className={cn("w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-600")}>
                ← Back to Pond
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── EMPTY STATE ──
  if (!pond || !request) {
    return (
      <div className={cn("min-h-screen flex flex-col items-center justify-center p-8 text-center", isDark ? "bg-[#070D12]" : "bg-[#F5F7FA]")}>
        <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center border mx-auto mb-6", isDark ? "bg-white/5 border-white/10 text-white/30" : "bg-white border-slate-200 text-slate-400 shadow-sm")}>
          <History size={36} />
        </div>
        <h3 className={cn("font-black text-xl mb-2 tracking-tight", isDark ? "text-white" : "text-slate-800")}>{t.noActiveHarvest}</h3>
        <p className={cn("text-[9px] font-bold uppercase tracking-widest mb-8", isDark ? "text-white/30" : "text-slate-400")}>{t.startHarvestFromPond}</p>
        <button onClick={() => navigate(-1)} className={cn("px-8 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl border", isDark ? "bg-white/5 text-white border-white/10" : "bg-white text-slate-700 border-slate-200 shadow-sm")}>
          Go Back
        </button>
      </div>
    );
  }

  const currentStatusIdx = STATUS_ORDER.indexOf(request.status);
  const currentStage = STAGES[currentStatusIdx] || STAGES[0];
  const currentColor = COLOR_MAP[currentStage.color];
  const chatMessages: any[] = request.chatMessages || [];
  const buyerHasAccepted = currentStatusIdx >= STATUS_ORDER.indexOf('accepted');
  const isCompleted = request.status === 'completed';
  const isPartialHarvest = !!(request as any).isPartialHarvest || (request as any).harvestType === 'partial';
  const estValue = (request.biomass || 0) * (request.price || 0);

  // helper (must be before its first use below)
  const safeNum = (v: any, fallback = 0) => { const n = Number(v); return isNaN(n) ? fallback : n; };

  // ── Partial harvest derived values ──
  const confirmedBiomassKg  = (request as any).confirmedBiomass  || request.biomass  || 0;
  const confirmedRatePerKg  = (request as any).confirmedRate     || request.price    || 0;
  const originalSeedCount   = (request as any).totalSeedCount    || safeNum(pond?.seedCount);
  // Deduct: assume each kg = ~1000 shrimps at Avg Weight
  const shrimpPerKg         = request.avgWeight ? (1000 / parseFloat(request.avgWeight)) : 50;
  const removedShrimp       = Math.round(confirmedBiomassKg * shrimpPerKg);
  const remainingSeedCount  = Math.max(0, originalSeedCount - removedShrimp);
  const remainingEstBiomass = (remainingSeedCount * 0.8 * (request.avgWeight || 20)) / 1000;
  const partialRevenue      = confirmedBiomassKg * confirmedRatePerKg;

  // ── Handle partial harvest completion ──
  const handlePartialCompletion = async () => {
    if (!pond || !request) return;
    const rId = request.id || (request as any)._id;
    const pId = pond.id || (pond as any)._id;
    const partialRecord = {
      date: new Date().toISOString(),
      harvestedBiomass: confirmedBiomassKg,
      avgWeight: request.avgWeight,
      ratePerKg: confirmedRatePerKg,
      revenue: partialRevenue,
      doc: pond ? Math.floor((new Date().getTime() - new Date((pond as any).stockingDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      orderId: rId,
    };
    const existingPartials = ((pond as any).partialHarvests || []) as any[];
    await Promise.allSettled([
      updateHarvestRequest(rId, { status: 'completed' }),
      updatePond(pId, {
        status: 'active',                               // keep pond running
        seedCount: remainingSeedCount as any,           // deduct harvested shrimps
        partialHarvests: [...existingPartials, partialRecord],
        harvestData: null as any,                       // clear pending harvest data
      }),
    ]);
    navigate(-1);
  };

  const getStageStatus = (stageId: string) => {
    const idx = STATUS_ORDER.indexOf(stageId);
    if (isCompleted) return 'completed';
    if (currentStatusIdx > idx) return 'completed';
    if (currentStatusIdx === idx) return 'current';
    return 'upcoming';
  };

  return (
    <div className={cn("min-h-screen pb-32 relative overflow-hidden", isDark ? "bg-[#070D12]" : "bg-[#F5F7FA]")}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={cn("absolute top-0 right-0 w-[70%] h-[40%] rounded-full blur-[120px]", isDark ? "bg-indigo-500/8" : "bg-indigo-400/5")} />
        <div className={cn("absolute bottom-0 left-0 w-[60%] h-[30%] rounded-full blur-[100px]", isDark ? "bg-emerald-500/8" : "bg-emerald-400/5")} />
      </div>

      {/* ── STICKY HEADER ── */}
      <header className={cn(
        "fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 backdrop-blur-xl px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center justify-between border-b transition-all",
        isDark ? "bg-[#070D12]/90 border-white/5" : "bg-white/90 border-slate-100 shadow-sm"
      )}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
          className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border", isDark ? "bg-white/5 border-white/10 text-white/70" : "bg-white border-slate-200 text-slate-500 shadow-sm")}
        >
          <ChevronLeft size={18} />
        </motion.button>

        <div className="text-center">
          <h1 className={cn("text-xs font-black tracking-tight uppercase", isDark ? "text-white" : "text-slate-900")}>
            {pond.name}
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isCompleted ? "bg-emerald-500" : "bg-amber-400")} />
            <p className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-indigo-400" : "text-indigo-600")}>
              #H-{request.id?.slice(-4) || 'XXXX'}
            </p>
          </div>
        </div>

        <div className={cn("px-3 py-1.5 rounded-xl border font-black text-[8px] uppercase tracking-widest",
          isPartialHarvest
            ? isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-600"
            : isCompleted
            ? isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"
            : isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-600"
        )}>
          {isCompleted ? 'Done' : 'Live'}
        </div>
      </header>

      <div className="relative z-10 pt-[calc(env(safe-area-inset-top)+5rem)]">

        {/* ── HERO STATUS BANNER ── */}
        <div className={cn("mx-4 mb-4 rounded-[2.5rem] overflow-hidden shadow-2xl")}>
          <div className={cn("p-6 text-white relative overflow-hidden",
            isDark
              ? `bg-gradient-to-br from-[#0D1A2F] to-[#0A1220]`
              : `bg-gradient-to-br from-[#1e1b4b] to-[#312e81]`
          )}>
            {/* Ambient */}
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-[60px]" />
            <div className={cn("absolute bottom-0 left-0 w-32 h-32 rounded-full blur-[40px]", currentColor.bg)} />

            <div className="relative z-10">
              {/* Current stage icon + label */}
              <div className="flex items-center gap-4 mb-5">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg flex-shrink-0", currentColor.bg, currentColor.border)}>
                  {React.createElement(currentStage.icon, { size: 24, className: currentColor.text })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border", currentColor.bg, currentColor.text, currentColor.border)}>
                      {isCompleted ? 'Completed' : 'Active Stage'}
                    </span>
                    {!isCompleted && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                  </div>
                  <h2 className="text-white text-2xl font-black tracking-tighter leading-none">{currentStage.label}</h2>
                </div>
              </div>

              <p className="text-white/50 text-[10px] font-bold leading-relaxed mb-5">{currentStage.desc}</p>

              {/* Revenue summary */}
              <div className={cn("rounded-2xl p-4 border", isDark ? "bg-white/5 border-white/10" : "bg-white/10 border-white/20")}>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-white/40 text-[7px] font-black uppercase tracking-widest mb-1">{t.estRevenueLabel}</p>
                    <p className="text-white font-black text-lg leading-none">
                      {estValue > 0 ? `₹${estValue.toLocaleString('en-IN')}` : <span className="text-white/30 text-sm">Pending</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[7px] font-black uppercase tracking-widest mb-1">{t.biomass}</p>
                    <p className="text-white font-black text-lg leading-none">
                      {request.biomass ? `${request.biomass} kg` : <span className="text-white/30 text-sm">—</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[7px] font-black uppercase tracking-widest mb-1">{t.ratePerKg}</p>
                    <p className="text-white font-black text-lg leading-none">
                      {request.price ? `₹${request.price}` : <span className="text-white/30 text-sm">{t.pendingLabel}</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── STAGE PROGRESS TIMELINE ── */}
        <div className="px-4 mb-4">
          <div className={cn("rounded-[2rem] border overflow-hidden", isDark ? "bg-[#0D1520] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
            <div className={cn("px-5 pt-4 pb-3 border-b", isDark ? "border-white/5" : "border-slate-100")}>
              <div className="flex items-center justify-between">
                <h3 className={cn("font-black text-sm tracking-tight", isDark ? "text-white" : "text-slate-900")}>{t.saleJourney}</h3>
                <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                  isDark ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-500"
                )}>
                  {currentStatusIdx + 1}/{STATUS_ORDER.length} Stages
                </span>
              </div>
              {/* Overall progress bar */}
              <div className={cn("mt-3 h-1.5 rounded-full overflow-hidden", isDark ? "bg-white/5" : "bg-slate-100")}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStatusIdx + 1) / STATUS_ORDER.length) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                />
              </div>
            </div>

            {/* Stage list — vertical */}
            <div className="divide-y divide-card-border">
              {STAGES.map((stage, idx) => {
                const status = getStageStatus(stage.id);
                const isComp = status === 'completed';
                const isCurr = status === 'current';
                const isUpcoming = status === 'upcoming';
                const c = COLOR_MAP[stage.color];

                return (
                  <motion.div
                    key={idx}
                    initial={false}
                    animate={{ opacity: isUpcoming ? 0.45 : 1 }}
                    className={cn("flex items-center gap-4 px-5 py-3.5 transition-all",
                      isCurr ? isDark ? "bg-white/[0.03]" : "bg-indigo-50/50" : ""
                    )}
                  >
                    {/* Icon node */}
                    <div className="relative flex-shrink-0">
                      <div className={cn(
                        "w-10 h-10 rounded-[1rem] flex items-center justify-center border-2 transition-all",
                        isComp ? "bg-emerald-500 border-emerald-500 text-white" :
                        isCurr ? cn(c.bg, c.border, c.text) :
                        isDark ? "bg-white/5 border-white/5 text-white/20" : "bg-slate-50 border-slate-100 text-slate-300"
                      )}>
                        {isComp ? <Check size={16} className="stroke-[3]" /> : React.createElement(stage.icon, { size: 15 })}
                      </div>
                      {isCurr && (
                        <div className={cn("absolute -inset-1.5 rounded-[1.2rem] animate-ping opacity-20", c.fill)} />
                      )}
                    </div>

                    {/* Labels */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-[11px] font-black tracking-tight",
                          isComp ? isDark ? "text-emerald-400" : "text-emerald-600" :
                          isCurr ? isDark ? "text-white" : "text-slate-900" :
                          isDark ? "text-white/30" : "text-slate-400"
                        )}>{stage.label}</p>
                        {isCurr && (
                          <span className={cn("text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border animate-pulse", c.bg, c.text, c.border)}>
                            NOW
                          </span>
                        )}
                      </div>
                      {isCurr && (
                        <p className={cn("text-[8px] font-bold mt-0.5 truncate", isDark ? "text-white/30" : "text-slate-400")}>
                          {stage.desc.substring(0, 55)}...
                        </p>
                      )}
                      {isComp && (
                        <p className={cn("text-[8px] font-bold mt-0.5", isDark ? "text-emerald-500/60" : "text-emerald-500/70")}>{t.stageComplete} ✓</p>
                      )}
                    </div>

                    {/* Right indicator */}
                    <div className="flex-shrink-0">
                      {isComp && <CheckCircle2 size={16} className="text-emerald-500" />}
                      {isCurr && <div className={cn("w-2 h-2 rounded-full animate-pulse", c.fill)} />}
                      {isUpcoming && <div className={cn("w-2 h-2 rounded-full", isDark ? "bg-white/10" : "bg-slate-200")} />}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── FINANCIAL BREAKDOWN: ESTIMATE vs ACTUAL ── */}
        <div className="px-4 mb-4">
          <div className={cn("rounded-[2rem] overflow-hidden border shadow-sm", isDark ? "bg-[#0D1520] border-white/5" : "bg-white border-slate-100")}>

            {/* Header */}
            <div className={cn("px-5 pt-4 pb-3 border-b flex items-center justify-between", isDark ? "border-white/5" : "border-slate-100")}>
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", isDark ? "bg-amber-500/10" : "bg-amber-50")}>
                  <IndianRupee size={14} className="text-amber-500" />
                </div>
                <div>
                  <h3 className={cn("font-black text-sm tracking-tight", isDark ? "text-white" : "text-slate-900")}>{t.revenueBreakdown}</h3>
                  <p className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/30" : "text-slate-400")}>
                    Estimate vs Actual Comparison
                  </p>
                </div>
              </div>
              {/* confirmation badge */}
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl border",
                (request as any).confirmedBiomass
                  ? isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700"
              )}>
                {(request as any).confirmedBiomass ? '✓ Confirmed' : 'Pending Confirmation'}
              </span>
            </div>

            {/* Revenue hero */}
            <div className={cn("px-5 py-5 border-b", isDark ? "border-white/5" : "border-slate-100")}>
              <div className="grid grid-cols-2 gap-4">
                {/* Farmer Estimate */}
                <div className={cn("rounded-2xl p-4 border", isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-100")}>
                  <p className={cn("text-[7px] font-black uppercase tracking-widest mb-2 flex items-center gap-1",
                    isDark ? "text-white/30" : "text-slate-400"
                  )}>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                    Your Estimate
                  </p>
                  <p className={cn("text-2xl font-black tracking-tighter leading-none", isDark ? "text-white" : "text-slate-800")}>
                    {request.biomass && request.price
                      ? `₹${(request.biomass * request.price).toLocaleString('en-IN')}`
                      : <span className={isDark ? "text-white/20" : "text-slate-300"}>₹—</span>
                    }
                  </p>
                  <p className={cn("text-[8px] font-bold mt-1", isDark ? "text-white/20" : "text-slate-400")}>
                    {request.biomass ? `${request.biomass} kg` : '—'} × {request.price ? `₹${request.price}` : '—'}
                  </p>
                </div>

                {/* Provider Actual */}
                <div className={cn("rounded-2xl p-4 border", (request as any).confirmedBiomass
                  ? isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
                  : isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-100"
                )}>
                  <p className={cn("text-[7px] font-black uppercase tracking-widest mb-2 flex items-center gap-1",
                    (request as any).confirmedBiomass ? isDark ? "text-emerald-400" : "text-emerald-700" : isDark ? "text-white/30" : "text-slate-400"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full inline-block",
                      (request as any).confirmedBiomass ? "bg-emerald-400" : isDark ? "bg-white/20" : "bg-slate-300"
                    )} />
                    Provider Actual
                  </p>
                  {(request as any).confirmedBiomass ? (
                    <>
                      <p className={cn("text-2xl font-black tracking-tighter leading-none",
                        isDark ? "text-emerald-400" : "text-emerald-700"
                      )}>
                        ₹{(((request as any).confirmedBiomass) * ((request as any).confirmedRate || request.price)).toLocaleString('en-IN')}
                      </p>
                      <p className={cn("text-[8px] font-bold mt-1", isDark ? "text-emerald-400/50" : "text-emerald-600/70")}>
                        {(request as any).confirmedBiomass} kg × ₹{(request as any).confirmedRate || request.price}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={cn("text-xl font-black tracking-tighter", isDark ? "text-white/15" : "text-slate-300")}>₹—</p>
                      <p className={cn("text-[8px] font-bold mt-1", isDark ? "text-white/15" : "text-slate-300")}>
                        Awaiting provider confirmation
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Variance row — only show if actual exists */}
              {(request as any).confirmedBiomass && (() => {
                const estRev = request.biomass * (request.price || 0);
                const actRev = (request as any).confirmedBiomass * ((request as any).confirmedRate || request.price || 0);
                const diff = actRev - estRev;
                const pct = estRev > 0 ? ((diff / estRev) * 100).toFixed(1) : '0';
                const isPositive = diff >= 0;
                return (
                  <div className={cn(
                    "mt-3 px-4 py-2.5 rounded-2xl border flex items-center justify-between",
                    isPositive
                      ? isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
                      : isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"
                  )}>
                    <div className="flex items-center gap-2">
                      {isPositive
                        ? <TrendingUp size={14} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
                        : <TrendingDown size={14} className={isDark ? "text-red-400" : "text-red-600"} />
                      }
                      <p className={cn("text-[9px] font-black uppercase tracking-widest",
                        isPositive ? isDark ? "text-emerald-400" : "text-emerald-700"
                        : isDark ? "text-red-400" : "text-red-700"
                      )}>
                        {isPositive ? 'Better Than Estimate' : 'Below Estimate'}
                      </p>
                    </div>
                    <p className={cn("text-sm font-black",
                      isPositive ? isDark ? "text-emerald-400" : "text-emerald-700"
                      : isDark ? "text-red-400" : "text-red-600"
                    )}>
                      {isPositive ? '+' : ''}₹{Math.abs(diff).toLocaleString('en-IN')} ({pct}%)
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Granular comparison table */}
            <div className="divide-y divide-card-border">
              {[
                {
                  label: 'Biomass (kg)',
                  icon: Scale,
                  est: request.biomass ? `${request.biomass} kg` : '—',
                  actual: (request as any).confirmedBiomass ? `${(request as any).confirmedBiomass} kg` : null,
                  diff: request.biomass && (request as any).confirmedBiomass
                    ? ((request as any).confirmedBiomass - request.biomass).toFixed(0)
                    : null,
                  diffUnit: 'kg',
                  stage: 'weighed',
                },
                {
                  label: 'Rate (₹/kg)',
                  icon: IndianRupee,
                  est: request.price ? `₹${request.price}` : '—',
                  actual: (request as any).confirmedRate ? `₹${(request as any).confirmedRate}` : null,
                  diff: request.price && (request as any).confirmedRate
                    ? ((request as any).confirmedRate - request.price).toFixed(0)
                    : null,
                  diffUnit: '₹/kg',
                  stage: 'rate_confirmed',
                },
                {
                  label: 'Avg. Weight (g)',
                  icon: Fish,
                  est: request.avgWeight ? `${request.avgWeight}g` : '—',
                  actual: (request as any).confirmedWeight ? `${(request as any).confirmedWeight}g` : null,
                  diff: request.avgWeight && (request as any).confirmedWeight
                    ? ((request as any).confirmedWeight - request.avgWeight).toFixed(1)
                    : null,
                  diffUnit: 'g',
                  stage: 'quality_checked',
                },
              ].map((row, i) => {
                const stageIdx = STATUS_ORDER.indexOf(row.stage);
                const isUnlocked = currentStatusIdx >= stageIdx;
                const diffNum = row.diff !== null ? parseFloat(row.diff as string) : null;
                return (
                  <div key={i} className={cn("px-5 py-3.5 flex items-center gap-3",
                    !isUnlocked ? isDark ? "opacity-40" : "opacity-50" : ""
                  )}>
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                      row.actual ? isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                      : isDark ? "bg-white/5 text-white/30" : "bg-slate-100 text-slate-400"
                    )}>
                      <row.icon size={14} />
                    </div>
                    <div className="flex-1">
                      <p className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/30" : "text-slate-400")}>{row.label}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {/* Est value */}
                        <span className={cn("text-[11px] font-black", isDark ? "text-white/50" : "text-slate-400")}>{row.est}</span>
                        {row.actual && <>
                          <span className={isDark ? "text-white/15" : "text-slate-300"}>→</span>
                          {/* Actual value */}
                          <span className={cn("text-[11px] font-black", isDark ? "text-emerald-400" : "text-emerald-600")}>{row.actual}</span>
                        </>}
                        {!row.actual && !isUnlocked && (
                          <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-md", isDark ? "bg-white/5 text-white/20" : "bg-slate-100 text-slate-300")}>
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Variance pill */}
                    {diffNum !== null && (
                      <div className={cn("px-2.5 py-1 rounded-xl border text-[8px] font-black flex-shrink-0",
                        diffNum >= 0
                          ? isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"
                      )}>
                        {diffNum >= 0 ? '+' : ''}{row.diff} {row.diffUnit}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer info */}
            <div className={cn("px-5 py-3 border-t flex items-center gap-2", isDark ? "border-white/5 bg-white/[0.01]" : "border-slate-100 bg-slate-50")}>
              <Info size={11} className={isDark ? "text-white/20" : "text-slate-400"} />
              <p className={cn("text-[7px] font-bold leading-relaxed", isDark ? "text-white/20" : "text-slate-400")}>
                Actual values are confirmed by the buyer/provider as the sale progresses through each stage.
              </p>
            </div>
          </div>
        </div>

        {/* ── BUYER CHAT ── */}
        <div className="px-4 mb-4">
          <div className={cn("rounded-[2rem] overflow-hidden border", isDark ? "bg-[#0D1520] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
            {/* Header */}
            <div className={cn("px-5 pt-4 pb-3 border-b flex items-center justify-between", isDark ? "border-white/5" : "border-slate-100")}>
              <div className="flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center",
                  buyerHasAccepted ? isDark ? "bg-indigo-500/15 text-indigo-400" : "bg-indigo-50 text-indigo-600"
                  : isDark ? "bg-white/5 text-white/30" : "bg-slate-100 text-slate-400"
                )}>
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className={cn("font-black text-sm tracking-tight", isDark ? "text-white" : "text-slate-900")}>{t.buyerChat}</h3>
                  <p className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/30" : "text-slate-400")}>
                    {buyerHasAccepted ? `${chatMessages.length} messages` : 'Opens after buyer match'}
                  </p>
                </div>
              </div>
              {chatMessages.length > 0 && (
                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black",
                  isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-700"
                )}>
                  {chatMessages.length}
                </span>
              )}
            </div>

            {!buyerHasAccepted ? (
              <div className={cn("px-6 py-10 text-center", isDark ? "bg-black/10" : "bg-slate-50")}>
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border",
                  isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"
                )}>
                  <Clock size={24} className="text-amber-500 animate-pulse" />
                </div>
                <p className={cn("text-[10px] font-black uppercase tracking-widest leading-relaxed max-w-[200px] mx-auto", isDark ? "text-white/30" : "text-slate-400")}>
                  Secure channel opens once a buyer accepts your lot
                </p>
              </div>
            ) : (
              <div>
                {/* Messages */}
                <div className={cn("px-4 py-4 max-h-[320px] overflow-y-auto space-y-3", isDark ? "bg-black/10" : "bg-slate-50/60")}>
                  {chatMessages.length === 0 ? (
                    <div className="py-10 text-center">
                      <Sparkles size={28} className={cn("mx-auto mb-3", isDark ? "text-white/15" : "text-slate-300")} />
                      <p className={cn("text-[9px] font-black uppercase tracking-widest", isDark ? "text-white/25" : "text-slate-400")}>
                        Channel open. Start negotiations.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg: any, i: number) => {
                      const isMe = msg.senderId === user?.id || msg.senderId === (user as any)?._id;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={cn("flex gap-2.5", isMe ? "justify-end" : "justify-start")}
                        >
                          {!isMe && (
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-[8px] font-black",
                              isDark ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400" : "bg-white border-indigo-100 text-indigo-600"
                            )}>
                              {(msg.senderName || 'B').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm",
                            isMe
                              ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm"
                              : isDark ? "bg-white/8 text-white border border-white/5 rounded-tl-sm backdrop-blur-sm"
                              : "bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm"
                          )}>
                            {!isMe && (
                              <p className={cn("text-[7px] font-black uppercase tracking-widest mb-1.5", isDark ? "text-indigo-300" : "text-indigo-600")}>
                                {msg.senderName || 'Buyer Network'}
                              </p>
                            )}
                            <p className="text-[12px] font-bold leading-snug">{msg.message}</p>
                            {msg.proposedPrice && (
                              <div className={cn("flex items-center gap-1.5 mt-2 pt-2 border-t", isMe ? "border-white/20" : isDark ? "border-white/10" : "border-slate-100")}>
                                <IndianRupee size={11} className={cn(isMe ? "text-emerald-200" : isDark ? "text-amber-400" : "text-amber-600")} />
                                <p className={cn("text-[10px] font-black", isMe ? "text-emerald-100" : isDark ? "text-amber-300" : "text-amber-700")}>
                                  Bid: ₹{msg.proposedPrice}/kg
                                </p>
                              </div>
                            )}
                            <p className={cn("text-[7px] font-bold text-right mt-1.5", isMe ? "text-white/50" : isDark ? "text-white/25" : "text-slate-400")}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input area */}
                <div className={cn("p-4 border-t", isDark ? "border-white/5 bg-[#0A1220]/60" : "border-slate-100 bg-white")}>
                  {/* Price toggle */}
                  <button
                    onClick={() => setShowPriceField(v => !v)}
                    className={cn("text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-3 transition-colors",
                      showPriceField
                        ? isDark ? "text-amber-400" : "text-amber-600"
                        : isDark ? "text-indigo-400" : "text-indigo-600"
                    )}
                  >
                    <IndianRupee size={11} />
                    {showPriceField ? 'Cancel Bid' : 'Attach Price Bid'}
                  </button>

                  <AnimatePresence>
                    {showPriceField && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
                        <div className={cn("flex items-center gap-2 rounded-xl px-4 py-3 border", isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200")}>
                          <IndianRupee size={14} className="text-amber-500" />
                          <input
                            type="number"
                            value={proposedPrice}
                            onChange={e => setProposedPrice(e.target.value)}
                            placeholder="Your rate per kg..."
                            className={cn("flex-1 bg-transparent text-sm font-black outline-none", isDark ? "text-amber-300 placeholder:text-amber-400/30" : "text-amber-900 placeholder:text-amber-400")}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={e => setChatMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className={cn("flex-1 rounded-2xl px-4 py-3 text-sm font-bold outline-none border transition-all",
                        isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-indigo-500/40"
                        : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 shadow-inner"
                      )}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatMessage.trim() || isSending}
                      className={cn("w-12 rounded-2xl flex items-center justify-center transition-all shrink-0 shadow-md bg-indigo-600 text-white disabled:opacity-40 active:scale-90")}
                    >
                      {isSending
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <Send size={16} />
                      }
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── CANCEL CTA ── */}
        {canCancel && (
          <div className="px-4 mb-4">
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCancelConfirm(true)}
              className={cn(
                "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border",
                isDark ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20" : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
              )}
            >
              <AlertTriangle size={14} />
              Cancel Order (5 min grace period)
            </motion.button>
          </div>
        )}

        {/* ── PARTIAL HARVEST — REMAINING STOCK CARD ── */}
        {isPartialHarvest && (
          <div className="px-4 mb-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("rounded-[2rem] overflow-hidden border shadow-sm", isDark ? "bg-[#0D1A13] border-amber-500/20" : "bg-white border-amber-200")}
            >
              {/* Header */}
              <div className={cn("px-5 pt-4 pb-3 border-b", isDark ? "border-amber-500/10 bg-amber-500/5" : "border-amber-100 bg-amber-50")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                      <span className="text-lg">🔀</span>
                    </div>
                    <div>
                      <h3 className={cn("font-black text-sm tracking-tight", isDark ? "text-amber-300" : "text-amber-900")}>{t.partialHarvest}</h3>
                      <p className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-amber-400/50" : "text-amber-600/70")}>
                        Pond stays active after this sale
                      </p>
                    </div>
                  </div>
                  <span className={cn("text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full border",
                    isDark ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-amber-100 border-amber-300 text-amber-700"
                  )}>
                    MID-CYCLE
                  </span>
                </div>
              </div>

              {/* Side-by-side: Harvested | Remaining */}
              <div className="grid grid-cols-2 divide-x divide-card-border">
                {/* Left — Harvested this round */}
                <div className="p-4">
                  <p className={cn("text-[7px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5", isDark ? "text-white/30" : "text-slate-400")}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Harvested
                  </p>
                  <p className={cn("text-xl font-black tracking-tighter leading-none", isDark ? "text-white" : "text-slate-800")}>
                    {confirmedBiomassKg > 0 ? `${confirmedBiomassKg} kg` : `${request.biomass || '—'} kg`}
                  </p>
                  <p className={cn("text-[8px] font-bold mt-1", isDark ? "text-white/25" : "text-slate-400")}>
                    ≈ {removedShrimp.toLocaleString()} shrimps
                  </p>
                  {partialRevenue > 0 && (
                    <p className={cn("text-[9px] font-black mt-2", isDark ? "text-emerald-400" : "text-emerald-600")}>
                      ₹{partialRevenue.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>

                {/* Right — Remaining in pond */}
                <div className="p-4">
                  <p className={cn("text-[7px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5", isDark ? "text-white/30" : "text-slate-400")}>
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Remaining
                  </p>
                  <p className={cn("text-xl font-black tracking-tighter leading-none", isDark ? "text-amber-300" : "text-amber-700")}>
                    ~{remainingEstBiomass.toFixed(0)} kg
                  </p>
                  <p className={cn("text-[8px] font-bold mt-1", isDark ? "text-white/25" : "text-slate-400")}>
                    ~{remainingSeedCount.toLocaleString()} shrimps
                  </p>
                  <p className={cn("text-[8px] font-bold mt-1.5", isDark ? "text-amber-400/60" : "text-amber-600/70")}>
                    Pond continues culture
                  </p>
                </div>
              </div>

              {/* Stock adjustment info */}
              <div className={cn("px-5 py-3 border-t", isDark ? "border-white/5" : "border-slate-100")}>
                <div className="flex items-center gap-2 mb-2">
                  <Info size={11} className={isDark ? "text-white/25" : "text-slate-400"} />
                  <p className={cn("text-[7px] font-bold leading-relaxed", isDark ? "text-white/25" : "text-slate-400")}>
                    Confirming will adjust your pond's stocking count from{' '}
                    <span className="font-black">{originalSeedCount.toLocaleString()}</span> → <span className="font-black text-amber-600">{remainingSeedCount.toLocaleString()}</span> and keep the pond active for continued culture.
                  </p>
                </div>
              </div>

              {/* Confirm Partial Complete */}
              {isCompleted ? (
                <div className={cn("px-5 pb-5")}>
                  <div className={cn("w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2",
                    isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                  )}>
                    <CheckCircle2 size={14} />
                    Partial Harvest Complete
                  </div>
                </div>
              ) : currentStatusIdx >= STATUS_ORDER.indexOf('paid') ? (
                <div className="px-5 pb-5">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handlePartialCompletion}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    <CheckCircle2 size={15} />
                    Confirm Partial Harvest & Keep Pond Active
                  </motion.button>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </div>

      {/* ── CANCEL CONFIRMATION BOTTOM SHEET ── */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] backdrop-blur-sm flex items-end justify-center bg-black/50"
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className={cn(
                "w-full max-w-[420px] rounded-t-[2.5rem] border-x border-t shadow-2xl overflow-hidden",
                isDark ? "bg-[#111827] border-white/10" : "bg-white border-slate-200"
              )}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className={cn("w-10 h-1 rounded-full", isDark ? "bg-white/10" : "bg-slate-200")} />
              </div>

              <div className="px-6 pb-2 pt-4">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4", isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600 border border-red-100")}>
                  <Trash2 size={26} />
                </div>
                <h3 className={cn("font-black text-xl text-center tracking-tight mb-1", isDark ? "text-white" : "text-slate-900")}>{t.retractBroadcast}</h3>
                <p className={cn("text-[10px] font-bold text-center uppercase tracking-widest leading-relaxed mb-5", isDark ? "text-white/40" : "text-slate-500")}>
                  This immediately terminates your market order
                </p>
                <div className="mb-5">
                  <label className={cn("text-[9px] font-black uppercase tracking-widest mb-2 block", isDark ? "text-white/40" : "text-slate-500")}>
                    Cancellation Reason
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    className={cn(
                      "w-full rounded-2xl p-4 text-xs font-bold min-h-[80px] outline-none transition-all border",
                      isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-red-500/50"
                      : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-red-400"
                    )}
                    placeholder="E.g. Found offline buyer, Waiting for better rate..."
                  />
                </div>
              </div>

              <div className={cn("grid grid-cols-2 border-t h-16", isDark ? "border-white/5" : "border-slate-100")}>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className={cn("text-[10px] font-black uppercase tracking-widest border-r transition-colors", isDark ? "border-white/5 text-white/40 hover:text-white hover:bg-white/5" : "border-slate-100 text-slate-500 hover:bg-slate-50")}
                >
                  Keep Live
                </button>
                <button
                  onClick={async () => {
                    const reason = cancelReason.trim() || 'No reason provided';
                    setShowCancelConfirm(false);
                    const rId = request.id || (request as any)._id;
                    const pId = pond.id || (pond as any)._id;
                    await Promise.allSettled([
                      updateHarvestRequest(rId, { status: 'cancelled', cancellationReason: reason }),
                      updatePond(pId, { status: 'active', harvestData: { ...pond.harvestData, cancelledAt: new Date().toISOString() } }),
                    ]);
                    navigate(-1);
                  }}
                  className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-500 active:scale-95 transition-all"
                >
                  Terminate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
