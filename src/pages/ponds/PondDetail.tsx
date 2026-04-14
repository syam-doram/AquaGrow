import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Trash2, Activity, Droplets, Info,
  CheckCircle2, Calendar, TrendingUp, Clock, Zap, AlertCircle,
  Stethoscope, ShieldCheck, Scale, ArrowRight, Moon, Camera,
  AlertTriangle, BarChart2, Fish, ShoppingBag, Send, UserCheck,
  Award, Waves, Thermometer, FlaskConical, Star, Target,
  Play, PlusCircle, Wind,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { useBottomSheet } from '../../context/BottomSheetContext';
import type { Translations } from '../../translations';
import { calculateDOC, calculateWeight } from '../../utils/pondUtils';
import { getSOPGuidance } from '../../utils/sopRules';
import { cn } from '../../utils/cn';
import { ConfirmModal } from '../../components/ConfirmModal';
import { AlertModal } from '../../components/AlertModal';
import { AeratorManagement } from './AeratorManagement';

const safeNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};

// ── Water quality color helper ──
const phColor = (ph?: number) => {
  if (!ph) return 'text-slate-400';
  if (ph >= 7.5 && ph <= 8.5) return 'text-emerald-500';
  if (ph >= 7.0 && ph < 7.5) return 'text-amber-500';
  return 'text-red-500';
};
const doColor = (doVal?: number) => {
  if (!doVal) return 'text-slate-400';
  if (doVal >= 4) return 'text-emerald-500';
  if (doVal >= 3) return 'text-amber-500';
  return 'text-red-500';
};

// ── Water Health Score utility ──
function calcHealthScore(water: any) {
  if (!water) return 100;
  let score = 100;
  const ph = safeNum(water.ph, 7.8);
  const doVal = safeNum(water.do, 5.5);
  const ammonia = safeNum(water.ammonia, 0.1);
  if (ph < 7.0 || ph > 8.8) score -= 30; else if (ph < 7.5 || ph > 8.3) score -= 15;
  if (doVal < 4.0) score -= 40; else if (doVal < 5.0) score -= 20;
  if (ammonia > 0.5) score -= 25; else if (ammonia > 0.25) score -= 10;
  return Math.max(0, score);
}

const CriticalMedicalWorkflow = ({ pond, latestWater, updatePond, navigate }: any) => {
  const healthScore = calcHealthScore(latestWater);
  const medStatus = pond.customData?.medicineStatus;
  const medDate = pond.customData?.medicineAppliedAt;

  const isCritical = healthScore < 60 || medStatus === 'pending' || medStatus === 'applied' || medStatus === 'failed';
  if (!isCritical && medStatus !== 'recovered') return null;

  const handleApply = () => {
    updatePond(pond.id, {
      ...pond,
      customData: { ...pond.customData, medicineStatus: 'applied', medicineAppliedAt: new Date().toISOString() }
    });
  };

  const handleRecovered = (recovered: boolean) => {
    updatePond(pond.id, {
      ...pond,
      customData: { ...pond.customData, medicineStatus: recovered ? 'recovered' : 'failed' }
    });
  };

  if (medStatus === 'recovered') return null;

  if (medStatus === 'failed') {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-[1.5rem] p-5 shadow-lg mb-4">
        <h4 className="text-red-500 font-black text-sm mb-1 uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle size={16} /> Treatment Failed
        </h4>
        <p className="text-red-400/80 text-[10px] font-bold mb-4 leading-relaxed">
          Pond did not recover after primary medicine application. High risk of immediate mortality.
        </p>
        <button onClick={() => navigate('/disease-detection')} className="w-full bg-red-600 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl shadow-lg active:scale-95 transition-all">
          Contact Expert Immediately
        </button>
      </div>
    );
  }

  if (medStatus === 'applied') {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-[1.5rem] p-5 shadow-lg mb-4">
        <h4 className="text-amber-500 font-black text-sm mb-1 uppercase tracking-widest flex items-center gap-2">
          <Stethoscope size={16} /> Under Treatment
        </h4>
        <p className="text-amber-400/80 text-[10px] font-bold mb-4 leading-relaxed">
          Medicine was tracked as applied. Continue with reduced feed (-20%). Has the pond recovered?
        </p>
        <div className="flex gap-2">
          <button onClick={() => handleRecovered(true)} className="flex-1 bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl active:scale-95 transition-all">
            Yes, Recovered
          </button>
          <button onClick={() => handleRecovered(false)} className="flex-1 bg-red-600/20 border border-red-500/50 text-red-400 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl active:scale-95 transition-all">
            No, It's Worse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-500/10 border border-orange-500/30 rounded-[1.5rem] p-5 shadow-lg shadow-orange-900/20 relative overflow-hidden mb-4">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/20 blur-xl rounded-full" />
      <h4 className="text-orange-500 font-black text-sm mb-1 uppercase tracking-widest flex items-center gap-2 relative z-10">
        <AlertCircle size={16} className="animate-pulse" /> Critical Action Required
      </h4>
      <p className="text-orange-400/80 text-[10px] font-bold mb-4 relative z-10 leading-relaxed">
        Pond is in critical state (Health &lt; 60). Immediate probiotics required. Reduce feeding by 20% immediately.
      </p>
      <button onClick={handleApply} className="relative z-10 w-full bg-orange-500 border border-orange-400 text-white font-black text-[10px] uppercase tracking-widest py-3 hover:bg-orange-600 rounded-xl shadow-xl active:scale-95 transition-all">
        Confirm Meds Applied & Feed Reduced
      </button>
    </div>
  );
};

export const PondDetail = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [wasCancelledSuccessfully, setWasCancelledSuccessfully] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'timeline' | 'certificate' | 'aerators'>('overview');
  const { ponds, deletePond, waterRecords, feedLogs, theme, harvestRequests, updatePond, updateHarvestRequest } = useData();
  const { openBottomSheet, closeBottomSheet } = useBottomSheet();

  // Sync any open sheet/modal to global BottomSheetContext so BottomNav hides
  useEffect(() => {
    const anyOpen = showDeleteConfirm || showDeleteAlert || showCancelConfirm;
    if (anyOpen) openBottomSheet(); else closeBottomSheet();
    return () => closeBottomSheet(); // cleanup on unmount
  }, [showDeleteConfirm, showDeleteAlert, showCancelConfirm]);

  // Auto-activate a tab when navigated from push notification deep-link
  useEffect(() => {
    if (!id) return;
    const tabKey = `pond_tab_${id}`;
    const savedTab = sessionStorage.getItem(tabKey);
    if (savedTab && ['overview', 'timeline', 'certificate', 'aerators'].includes(savedTab)) {
      setActiveSection(savedTab as any);
      sessionStorage.removeItem(tabKey); // consume once
    }
  }, [id]);

  const pond = ponds.find(p => p.id === id);
  const isDark = theme === 'dark' || theme === 'midnight';

  const currentRequest = harvestRequests?.find((r: any) => (
    r.pondId?.toString() === pond?.id?.toString() || r.pondId?.toString() === (pond as any)?._id?.toString()
  ) && r.status !== 'completed' && r.status !== 'cancelled');

  const lastCancelledRequest = harvestRequests
    ?.filter((r: any) => (
      r.pondId?.toString() === pond?.id?.toString() || r.pondId?.toString() === (pond as any)?._id?.toString()
    ) && r.status === 'cancelled')
    .sort((a: any, b: any) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0];

  const hasRecentlyCancelled = !!pond?.harvestData?.cancelledAt && !currentRequest;
  const harvestStartedAt = pond?.harvestData?.harvestStartedAt;
  const canCancel = harvestStartedAt && (new Date().getTime() - new Date(harvestStartedAt).getTime()) < 5 * 60 * 1000;



  if (!pond) return (
    <div className="min-h-screen flex items-center justify-center bg-card">
      <div className="text-center">
        <Fish size={48} className="text-ink/10 mx-auto mb-4" />
        <p className="text-ink font-black uppercase tracking-widest text-sm">{t.pondNotFound}</p>
      </div>
    </div>
  );

  const isCancelledState = wasCancelledSuccessfully || hasRecentlyCancelled;
  const effectiveRequest = isCancelledState ? undefined : currentRequest;
  const effectiveStatus = isCancelledState ? 'active' : pond.status;

  const currentDoc = calculateDOC(pond.stockingDate);
  const isPlanned = pond.status === 'planned';
  const currentWeight = isPlanned ? 0 : calculateWeight(currentDoc);
  const guidance = getSOPGuidance(isPlanned ? -1 : currentDoc, new Date());
  const today = new Date().toISOString().split('T')[0];

  const todayRecord = waterRecords
    .filter(r => r.pondId === pond.id && r.date === today)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const pondRecords = waterRecords
    .filter(r => r.pondId === pond.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const hasLoggedToday = !!todayRecord;

  const pondFeedLogs = feedLogs.filter(f => f.pondId === pond.id);
  const totalFeedKg = pondFeedLogs.reduce((acc, f) => acc + safeNum(f.quantity), 0);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weeklyFeedKg = pondFeedLogs.filter(f => new Date(f.date) >= sevenDaysAgo).reduce((acc, f) => acc + safeNum(f.quantity), 0);

  const theoreticalYield = (safeNum(pond.seedCount) * 0.82 * currentWeight) / 1000;
  const fcrBasedYield = totalFeedKg / 1.4;
  const estHarvestYield = currentDoc < 20 ? theoreticalYield : Math.max(theoreticalYield, fcrBasedYield);
  const weeklyFeedExp = weeklyFeedKg * 60;
  const fcrScore = totalFeedKg > 0 && estHarvestYield > 0 ? (totalFeedKg / estHarvestYield) : 0;

  const isCriticalStage = currentDoc >= 31 && currentDoc <= 45;
  const isHarvestPrepStage = currentDoc >= 83;
  const isFCRHigh = fcrScore > 1.6 && currentDoc >= 20;
  const isHarvestReady = currentDoc >= 90 && pond.status === 'active';
  const lunarSops = guidance.filter(g => g.type === 'LUNAR');

  const milestones = [
    { g: '5g', val: 5, targetDoc: 30 },
    { g: '10g', val: 10, targetDoc: 45 },
    { g: '15g', val: 15, targetDoc: 60 },
    { g: '20g', val: 20, targetDoc: 75 },
    { g: '25g', val: 25, targetDoc: 90 },
    { g: '30g', val: 30, targetDoc: 105 },
    { g: '35g', val: 35, targetDoc: 125 },
  ];

  const getTimelineDates = () => {
    const dates = [];
    const start = new Date(pond.stockingDate);
    const end = new Date();
    let count = 0;
    while (start <= end && count < 200) {
      dates.push(new Date(start));
      start.setDate(start.getDate() + 1);
      count++;
    }
    return dates.reverse();
  };

  // Trust Certificate computation
  const expectedWaterLogs = Math.ceil(currentDoc / 2);
  const waterCompliance = Math.min(100, Math.round((pondRecords.length / Math.max(1, expectedWaterLogs)) * 100));
  const feedCompliance = Math.min(100, Math.round((pondFeedLogs.length / Math.max(1, currentDoc)) * 100));
  const certScore = Math.round(waterCompliance * 0.5 + feedCompliance * 0.5);
  const certGrade = certScore >= 85 ? { label: 'PLATINUM', color: 'from-slate-600 to-slate-400', icon: '🏆' }
    : certScore >= 70 ? { label: 'GOLD', color: 'from-amber-600 to-yellow-500', icon: '🥇' }
      : certScore >= 50 ? { label: 'SILVER', color: 'from-slate-400 to-slate-300', icon: '🥈' }
        : { label: 'BRONZE', color: 'from-orange-700 to-orange-500', icon: '🥉' };

  // Hero gradient per status
  const heroGradient = effectiveStatus === 'planned' ? 'from-[#1E1B4B] to-[#312E81]'
    : effectiveStatus === 'harvest_pending' ? 'from-[#1e1b4b] to-[#4338ca]'
      : effectiveStatus === 'harvested' ? 'from-[#064E3B] to-[#065F46]'
        : isHarvestReady ? 'from-[#78350F] to-[#92400E]'
          : 'from-[#0D523C] to-[#065F46]';

  const TABS = [
    { key: 'overview', label: t.pondOverview, icon: Activity },
    { key: 'timeline', label: t.pondTimeline, icon: Calendar },
    { key: 'aerators', label: t.pondAerators, icon: Wind },
    { key: 'certificate', label: t.pondCertificate, icon: Award },
  ];

  return (
    <div className={cn("pb-40 min-h-screen text-left", isDark ? "bg-[#080F0C]" : "bg-[#F5F7FA]")}>

      {/* ── STICKY HEADER ── */}
      <header className={cn(
        "fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center justify-between border-b backdrop-blur-xl",
        isDark ? "bg-[#080F0C]/90 border-white/5" : "bg-white/90 border-slate-100"
      )}>
        <button
          onClick={() => navigate(-1)}
          className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90", isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-700")}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center">
          <h1 className={cn("text-sm font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>{pond.name}</h1>
          <div className="flex items-center justify-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full",
              pond.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                pond.status === 'planned' ? 'bg-blue-400' :
                  pond.status === 'harvest_pending' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'
            )} />
            <p className="text-[8px] font-black text-[#C78200] uppercase tracking-widest">{pond.species}</p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/ponds/${pond.id}/sop`)}
          className="w-10 h-10 bg-[#C78200]/10 text-[#C78200] rounded-2xl flex items-center justify-center active:scale-90 transition-all"
        >
          <ShieldCheck size={18} />
        </button>
      </header>

      <div className="pt-[calc(env(safe-area-inset-top)+4.5rem)]">

        {/* ── PREMIUM HERO CARD ── */}
        <div className={cn("bg-gradient-to-br mx-0 relative overflow-hidden", heroGradient)} style={{ minHeight: 300 }}>
          {/* Ambient blobs */}
          <div className="absolute -right-20 -top-20 w-60 h-60 bg-white/5 rounded-full blur-[80px]" />
          <div className="absolute -left-10 bottom-0 w-40 h-40 bg-black/20 rounded-full blur-[60px]" />

          <div className="relative z-10 px-5 pt-6 pb-4">
            {/* Top row: weight + DOC */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-white/40 text-[8px] font-black uppercase tracking-[0.3em] mb-1">
                  {effectiveStatus === 'planned' ? 'Pre-Stocking Phase' :
                    effectiveStatus === 'harvest_pending' ? 'Market Tracking' :
                      effectiveStatus === 'harvested' ? 'Cycle Complete' :
                        isHarvestReady ? 'Harvest Ready! 🎉' : 'Live Culture Data'}
                </p>
                <h2 className="text-white text-5xl font-black tracking-tighter leading-none">
                  {effectiveStatus === 'planned' ? `D-${Math.abs(currentDoc)}`
                    : effectiveStatus === 'harvested' ? '✓'
                      : effectiveStatus === 'harvest_pending' ? '⚡'
                        : `${currentWeight.toFixed(1)}`}
                  {effectiveStatus === 'active' &&
                    <span className="text-xl text-white/30 font-bold ml-1">g</span>
                  }
                </h2>
                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-1">
                  {effectiveStatus === 'planned' ? 'Days to stocking'
                    : effectiveStatus === 'harvested' ? 'Archived cycle'
                      : effectiveStatus === 'harvest_pending' ? 'Live sale in progress'
                        : 'Avg. shrimp weight'}
                </p>
              </div>

              {/* DOC ring */}
              <div className="text-center">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke={isHarvestReady ? '#F59E0B' : effectiveStatus === 'planned' ? '#818CF8' : '#34D399'}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - Math.min(1, currentDoc / 100))}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-white font-black text-xl leading-none">
                      {effectiveStatus === 'harvested' ? '✓' : effectiveStatus === 'planned' ? Math.abs(currentDoc) : currentDoc}
                    </p>
                    <p className="text-white/40 text-[6px] font-black uppercase tracking-widest">
                      {effectiveStatus === 'harvested' ? 'DONE' : 'DOC'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                {
                  label: 'Est. Yield',
                  value: isPlanned ? `${(safeNum(pond.seedCount) / 1000).toFixed(0)}k PL` : `${estHarvestYield.toFixed(0)}kg`,
                  icon: Fish, color: 'text-emerald-300'
                },
                {
                  label: isPlanned ? 'Pond Size' : 'Weekly Feed',
                  value: isPlanned ? `${pond.size} Ac` : `₹${weeklyFeedExp.toLocaleString()}`,
                  icon: Zap, color: 'text-amber-300'
                },
                {
                  label: 'FCR',
                  value: fcrScore > 0 ? fcrScore.toFixed(2) : '—',
                  icon: TrendingUp, color: fcrScore > 1.6 ? 'text-red-300' : 'text-blue-300'
                },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                  <s.icon size={12} className={cn("mx-auto mb-1.5", s.color)} />
                  <p className="text-white font-black text-sm leading-none">{s.value}</p>
                  <p className="text-white/30 text-[6px] font-black uppercase tracking-widest mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Growth milestones strip */}
            {!isPlanned && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white/40 text-[8px] font-black uppercase tracking-widest">{t.growthMilestonesTitle}</p>
                  {(() => {
                    const nextMs = milestones.find(m => currentDoc < m.targetDoc);
                    if (!nextMs) return <p className="text-white/40 text-[8px] font-black">Max size reached 🎊</p>;
                    const daysLeft = nextMs.targetDoc - currentDoc;
                    const reachDate = new Date();
                    reachDate.setDate(reachDate.getDate() + daysLeft);
                    const label = reachDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    return (
                      <div className="text-right">
                        <p className="text-emerald-300/80 text-[7px] font-black">Next: {nextMs.g} · {label}</p>
                        <p className="text-white/30 text-[6px] font-black">{daysLeft} days · DOC {nextMs.targetDoc}</p>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex gap-1 items-center">
                  {milestones.filter(m => [5, 10, 20, 25, 30].includes(m.val)).map((step, i) => {
                    const achieved = currentDoc >= step.targetDoc;
                    const active = !achieved && (i === 0 || currentDoc >= milestones.filter(m => [5, 10, 20, 25, 30].includes(m.val))[i - 1]?.targetDoc);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className={cn(
                          "w-full h-1.5 rounded-full transition-all duration-700",
                          achieved ? (isHarvestReady ? 'bg-amber-400' : 'bg-emerald-400') :
                            active ? 'bg-white/30' : 'bg-white/10'
                        )} />
                        <p className={cn("text-[6px] font-black",
                          achieved ? 'text-emerald-300' : active ? 'text-white/60' : 'text-white/20'
                        )}>{step.g}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick action bar — hide AI Scan and Checklist when harvested */}
          <div className="px-5 pb-5 pt-1">
            <div className={cn('grid gap-2', effectiveStatus === 'harvested' ? 'grid-cols-2' : 'grid-cols-4')}>
              {[
                { icon: Droplets, label: 'Water', action: () => navigate(`/ponds/${pond.id}/water-log`), accent: hasLoggedToday ? 'bg-emerald-400/20 text-emerald-300' : 'bg-red-400/20 text-red-300', hidden: effectiveStatus === 'harvested' },
                { icon: BarChart2, label: 'Monitor', action: () => navigate(`/ponds/${pond.id}/monitor`), accent: 'bg-white/10 text-white', hidden: false },
                { icon: CheckCircle2, label: 'Checklist', action: () => navigate(`/ponds/${pond.id}/entry`), accent: 'bg-amber-400/20 text-amber-300', hidden: effectiveStatus === 'harvested' },
                { icon: Camera, label: 'AI Scan', action: () => navigate('/disease-detection'), accent: 'bg-purple-400/20 text-purple-300', hidden: effectiveStatus === 'harvested' },
              ].filter(btn => !btn.hidden).map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  className={cn("rounded-2xl py-3 flex flex-col items-center gap-1.5 transition-all active:scale-90 border border-white/10", btn.accent)}
                >
                  <btn.icon size={16} />
                  <span className="text-[7px] font-black uppercase tracking-wider">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── LIVE MARKETPLACE TRACKER ── */}
        <div className="px-4 pt-4 space-y-3">
          <AnimatePresence>
            {(effectiveStatus === 'harvest_pending' || effectiveRequest) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={() => navigate(`/ponds/${id}/tracking`)}
                className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] p-5 shadow-2xl shadow-indigo-500/20 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />
                <div className="relative z-10 flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <ShoppingBag size={22} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-indigo-200 text-[9px] font-black uppercase tracking-[0.2em]">Live Tracking Active</p>
                    <h3 className="text-white text-base font-black tracking-tight">Market Sale Journey</h3>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="flex gap-1 h-2 w-full bg-white/10 rounded-full overflow-hidden mb-3">
                  {['pending', 'accepted', 'quality_checked', 'weighed', 'rate_confirmed', 'harvested', 'paid', 'completed'].map((s, i, a) => {
                    const idx = a.indexOf(currentRequest?.status || 'pending');
                    return (
                      <div key={i} className={cn("flex-1 h-full rounded-full transition-all duration-700",
                        a.indexOf(s) <= idx ? "bg-indigo-300" : "bg-transparent"
                      )} />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-indigo-200 text-[9px] font-bold capitalize">
                    {currentRequest?.status?.replace(/_/g, ' ') || 'Selling Stage'}
                  </span>
                  <span className="text-indigo-300 text-[9px] font-black flex items-center gap-1">
                    View Details <ChevronRight size={12} />
                  </span>
                </div>
                {canCancel && (
                  <button
                    type="button"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); setShowCancelConfirm(true); }}
                    className="mt-4 w-full py-2.5 bg-red-500/20 border border-red-400/30 text-red-300 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Trash2 size={12} /> Cancel Order
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CANCELLED STATE — Enhanced with reason, date, restart option ── */}
          {isCancelledState && (
            <div className={cn("rounded-[2rem] p-5 border", isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200")}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <AlertCircle size={18} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[11px] font-black text-amber-900 uppercase tracking-tight">{t.orderCancelled}</h3>
                  {lastCancelledRequest && (
                    <p className="text-[7px] font-black text-amber-600/50 uppercase tracking-widest">#H-{lastCancelledRequest.id?.slice(-4) || 'XXXX'}</p>
                  )}
                </div>
                <span className="text-2xl">🚫</span>
              </div>

              {/* Cancellation reason */}
              {lastCancelledRequest?.cancellationReason && (
                <div className={cn('rounded-xl p-3 mb-3', isDark ? 'bg-amber-500/10' : 'bg-amber-100')}>
                  <p className="text-[7px] font-black uppercase tracking-widest text-amber-700 mb-1">Reason</p>
                  <p className="text-[10px] font-bold text-amber-800/80 italic leading-snug">"{lastCancelledRequest.cancellationReason}"</p>
                </div>
              )}

              {/* Cancellation timestamp */}
              {pond?.harvestData?.cancelledAt && (
                <p className="text-[8px] font-bold text-amber-700/50 mb-3">
                  Cancelled on {new Date(pond.harvestData.cancelledAt as any).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}

              <p className={cn('text-[9px] font-medium leading-relaxed mb-4', isDark ? 'text-amber-200/60' : 'text-amber-800/60')}>
                Your harvest order was cancelled. The pond is back to active status. You can submit a new harvest order when ready.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => updatePond(pond.id, { harvestData: { ...pond.harvestData, cancelledAt: undefined } as any })}
                  className="flex-1 py-2.5 bg-amber-500/20 border border-amber-400/30 text-amber-700 rounded-xl text-[9px] font-black uppercase tracking-widest"
                >{t.gotIt}</button>
                <button
                  onClick={() => navigate(`/ponds/${pond.id}/harvest`)}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest"
                >Re-submit Harvest</button>
              </div>
            </div>
          )}


          {/* Alert banners — only show when pond is active, never on harvested */}
          {!isPlanned && effectiveStatus !== 'harvested' && isCriticalStage && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500 rounded-[1.5rem] p-4 flex items-start gap-3 shadow-lg shadow-red-500/20">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white text-[10px] font-black uppercase tracking-widest">⚠️ WSSV Critical — DOC {currentDoc}</p>
                <p className="text-white/70 text-[9px] font-bold mt-0.5 leading-relaxed">White Spot Syndrome Virus risk period (DOC 31–45). Max aeration. Reduce feed if stressed. Check daily.</p>
                <button onClick={() => navigate(`/ponds/${pond.id}/monitor`)} className="mt-2 text-[8px] font-black text-white/80 flex items-center gap-1">
                  Monitor Water <ArrowRight size={10} />
                </button>
              </div>
            </motion.div>
          )}

          {!isPlanned && effectiveStatus !== 'harvested' && isHarvestPrepStage && !isCriticalStage && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-[1.5rem] p-4 flex items-start gap-3 border", isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200")}>
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-amber-900 text-[10px] font-black uppercase tracking-widest">{t.harvestPrepDoc} — DOC {currentDoc}</p>
                <p className="text-amber-700/70 text-[9px] font-bold mt-0.5 leading-relaxed">
                  {currentDoc >= 90 ? '🔴 STOP heavy medicines now. Withdrawal period active.' : `Stop medicines in ${90 - currentDoc} days for safe harvest.`}
                </p>
              </div>
            </motion.div>
          )}

          {effectiveStatus !== 'harvested' && isFCRHigh && (
            <div className={cn("rounded-[1.5rem] p-4 flex items-center gap-3 border", isDark ? "bg-orange-500/10 border-orange-500/20" : "bg-orange-50 border-orange-200")}>
              <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} className="text-orange-600" />
              </div>
              <div>
                <p className="text-orange-900 text-[10px] font-black uppercase tracking-widest">{t.highFcr}: {fcrScore.toFixed(2)}</p>
                <p className="text-orange-700/60 text-[9px] font-bold mt-0.5">{t.sopTarget}</p>
              </div>
            </div>
          )}

          {lunarSops.length > 0 && !isPlanned && effectiveStatus !== 'harvested' && (
            <div className={cn("rounded-[1.5rem] p-4 flex items-center gap-3 border", isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200")}>
              <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🌙</span>
              </div>
              <div>
                <p className="text-indigo-900 text-[10px] font-black uppercase tracking-widest">{lunarSops[0].title}</p>
                <p className="text-indigo-700/60 text-[9px] font-bold mt-0.5 leading-relaxed line-clamp-2">{lunarSops[0].description}</p>
              </div>
            </div>
          )}

          {!isPlanned && !hasLoggedToday && effectiveStatus === 'active' && (
            <button
              onClick={() => navigate(`/ponds/${pond.id}/water-log`)}
              className="w-full bg-blue-500 rounded-[1.5rem] p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
            >
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Droplets size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white text-[10px] font-black uppercase tracking-widest">{t.noWaterLogToday}</p>
                <p className="text-white/70 text-[9px] font-bold mt-0.5">{t.tapToLogNow}</p>
              </div>
              <ArrowRight size={16} className="text-white/60" />
            </button>
          )}

          {/* ── WATER QUALITY CARD ── */}
          <div className={cn("rounded-[2rem] border shadow-sm overflow-hidden", isDark ? "bg-[#0D1A13] border-white/5" : "bg-white border-slate-100")}>
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <div>
                <h3 className={cn("font-black text-sm tracking-tight", isDark ? "text-white" : "text-slate-900")}>{t.waterQualitySection}</h3>
                <p className={cn("text-[8px] font-black uppercase tracking-widest mt-0.5", isDark ? "text-white/30" : "text-slate-400")}>
                  {hasLoggedToday ? 'Today · Live data' : 'No log today'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", hasLoggedToday ? "bg-emerald-500 animate-pulse" : "bg-red-400")} />
                <button
                  onClick={() => navigate(`/ponds/${pond.id}/water-log`)}
                  className="px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-[8px] font-black uppercase tracking-widest"
                >
                  {hasLoggedToday ? 'Update' : 'Log Now'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-0 border-t border-card-border divide-x divide-card-border">
              {[
                { label: 'pH', value: todayRecord?.ph, unit: '', good: (v: number) => v >= 7.5 && v <= 8.5, range: '7.5–8.5' },
                { label: 'DO', value: todayRecord?.do, unit: 'mg/L', good: (v: number) => v >= 4, range: '>4.0' },
                { label: 'Temp', value: todayRecord?.temperature, unit: '°C', good: (v: number) => v >= 27 && v <= 33, range: '27–33' },
                { label: 'NH₃', value: todayRecord?.ammonia, unit: 'ppm', good: (v: number) => v < 0.3, range: '<0.3' },
              ].map((param, i) => (
                <div key={i} className="py-4 text-center">
                  <p className={cn("text-base font-black leading-none",
                    param.value != null
                      ? param.good(param.value) ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
                        : 'text-red-500'
                      : isDark ? 'text-white/20' : 'text-slate-300'
                  )}>
                    {param.value != null ? param.value : '—'}
                  </p>
                  <p className={cn("text-[6px] font-black uppercase tracking-widest mt-1", isDark ? "text-white/30" : "text-slate-400")}>{param.label}</p>
                  <p className={cn("text-[5px] font-bold mt-0.5", isDark ? "text-white/15" : "text-slate-300")}>{param.range}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── TAB NAV ── */}
          <div className={cn("rounded-2xl p-1 flex gap-1 border", isDark ? "bg-white/5 border-white/5" : "bg-slate-100 border-transparent")}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key as any)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[9px] font-black uppercase tracking-widest",
                  activeSection === tab.key
                    ? isDark ? "bg-white/10 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                    : isDark ? "text-white/30" : "text-slate-400"
                )}
              >
                <tab.icon size={11} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── TAB CONTENT ── */}
          <AnimatePresence mode="wait">
            {activeSection === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-3">

                {/* Critical Medicine Action Flow */}
                <CriticalMedicalWorkflow pond={pond} latestWater={todayRecord || pondRecords[0]} updatePond={updatePond} navigate={navigate} />

                {/* SOP Mentor */}
                <div className={cn("rounded-[2rem] border overflow-hidden", isDark ? "bg-[#0D1A13] border-white/5" : "bg-white border-slate-100")}>
                  <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-card-border">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#C78200]/10 rounded-xl flex items-center justify-center">
                        <ShieldCheck size={15} className="text-[#C78200]" />
                      </div>
                      <div>
                        <h3 className={cn("font-black text-sm tracking-tight", isDark ? "text-white" : "text-slate-900")}>{t.expertMentor || 'Expert SOP'}</h3>
                        <p className={cn("text-[7px] font-black uppercase tracking-widest", isDark ? "text-white/30" : "text-slate-400")}>{t.liveCultureOversightLabel}</p>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-card-border">
                    {guidance.slice(0, 3).map((item, i) => (
                      <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                          item.type === 'LUNAR' ? "bg-indigo-500/10 text-indigo-400" : "bg-[#C78200]/10 text-[#C78200]"
                        )}>
                          {item.type === 'LUNAR' ? <span className="text-sm">🌙</span> : <Zap size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-[10px] font-black truncate", isDark ? "text-white" : "text-slate-900")}>{item.title}</p>
                          <p className={cn("text-[8px] font-bold mt-0.5 truncate", isDark ? "text-white/40" : "text-slate-400")}>{item.description}</p>
                        </div>
                        <ArrowRight size={12} className={isDark ? "text-white/20" : "text-slate-300"} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Harvest CTA */}
                {effectiveStatus === 'active' && (
                  <div
                    onClick={() => navigate(`/ponds/${pond.id}/harvest`)}
                    className={cn(
                      "rounded-[2rem] p-5 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all shadow-xl group",
                      isHarvestReady
                        ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30"
                        : "bg-gradient-to-br from-[#0D523C] to-[#065F46] shadow-emerald-900/30"
                    )}
                  >
                    <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center">
                      <ShoppingBag size={22} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white/60 text-[8px] font-black uppercase tracking-[0.2em]">
                        {isHarvestReady ? '🎉 Ready to sell!' : 'When ready'}
                      </p>
                      <h3 className="text-white font-black text-sm tracking-tight">
                        {isHarvestReady ? 'Submit Harvest Order' : 'Finalize Cycle'}
                      </h3>
                    </div>
                    <ChevronRight size={18} className="text-white/40 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}

                {/* Harvested Summary — handles both Market Sale & Self Harvest */}
                {effectiveStatus === 'harvested' && pond.harvestData && (() => {
                  const hd = pond.harvestData as any;
                  const isSelfHarvest = hd.harvestType === 'self';
                  const revenue = parseFloat(hd.totalBiomass || 0) * parseFloat(hd.marketRate || 0);
                  return (
                    <div className={cn("rounded-[2rem] border overflow-hidden shadow-lg", isDark ? "bg-[#0D1A13] border-white/5" : "bg-white border-slate-100")}>
                      {/* Header banner — different color for self vs market */}
                      <div className={cn(
                        "p-5 text-white relative overflow-hidden",
                        isSelfHarvest
                          ? "bg-gradient-to-br from-[#C78200] to-[#92400E]"
                          : "bg-gradient-to-br from-emerald-600 to-teal-700"
                      )}>
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{isSelfHarvest ? '🏠' : '🏪'}</span>
                            <p className="text-white/60 text-[8px] font-black uppercase tracking-[0.2em]">
                              {isSelfHarvest ? 'Self Harvested' : 'Market Sale — Completed'}
                            </p>
                          </div>
                          {revenue > 0 ? (
                            <>
                              <h3 className="text-3xl font-black tracking-tighter leading-none">
                                ₹{revenue.toLocaleString('en-IN')}
                              </h3>
                              <p className="text-white/60 text-[9px] font-bold mt-1">
                                {hd.totalBiomass} kg × ₹{hd.marketRate}/kg
                              </p>
                            </>
                          ) : (
                            <h3 className="text-xl font-black tracking-tighter text-white/60">{t.revenueNotRecorded}</h3>
                          )}
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div className={cn("grid divide-x divide-card-border", "grid-cols-3")}>
                        {[
                          { label: 'Biomass', value: hd.totalBiomass ? `${hd.totalBiomass} kg` : '—' },
                          { label: 'Avg Weight', value: hd.avgWeight ? `${hd.avgWeight}g` : '—' },
                          { label: 'Rate /kg', value: hd.marketRate ? `₹${hd.marketRate}` : '—' },
                        ].map((item, i) => (
                          <div key={i} className="py-4 text-center">
                            <p className={cn("font-black text-sm leading-none", isDark ? "text-white" : "text-slate-800")}>{item.value}</p>
                            <p className={cn("text-[6px] font-black uppercase tracking-widest mt-1", isDark ? "text-white/25" : "text-slate-400")}>{item.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Self-harvest reason strip */}
                      {isSelfHarvest && hd.selfHarvestReason && (
                        <div className={cn("px-5 py-4 border-t flex items-start gap-3", isDark ? "border-white/5 bg-amber-500/5" : "border-amber-100 bg-amber-50")}>
                          <span className="text-xl flex-shrink-0 mt-0.5">📋</span>
                          <div>
                            <p className={cn("text-[8px] font-black uppercase tracking-widest mb-0.5", isDark ? "text-amber-400" : "text-amber-700")}>{t.selfHarvestReason}</p>
                            <p className={cn("text-[10px] font-bold italic leading-snug", isDark ? "text-amber-300/80" : "text-amber-800")}>
                              "{hd.selfHarvestReason}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Final DOC & date */}
                      <div className={cn("px-5 py-3 border-t flex items-center justify-between", isDark ? "border-white/5" : "border-slate-100")}>
                        <p className={cn("text-[7px] font-black uppercase tracking-widest", isDark ? "text-white/20" : "text-slate-400")}>
                          Final DOC: {hd.finalDoc || currentDoc}
                        </p>
                        <p className={cn("text-[7px] font-black", isDark ? "text-white/20" : "text-slate-400")}>
                          {hd.harvestDate ? new Date(hd.harvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : ''}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* ── PARTIAL HARVEST HISTORY (active ponds that have done partial harvests) ── */}
                {effectiveStatus === 'active' && (() => {
                  const partials: any[] = (pond as any).partialHarvests || [];
                  if (partials.length === 0) return null;
                  const totalHarvested = partials.reduce((s: number, p: any) => s + (p.harvestedBiomass || 0), 0);
                  const totalRevenue = partials.reduce((s: number, p: any) => s + (p.revenue || 0), 0);
                  const lastAvgWeight = partials[partials.length - 1]?.avgWeight || 0;
                  const remainingBiomass = (safeNum(pond.seedCount) * 0.8 * lastAvgWeight) / 1000;
                  return (
                    <div className={cn("rounded-[2rem] border overflow-hidden shadow-sm", isDark ? "bg-[#0D1A13] border-amber-500/20" : "bg-white border-amber-200")}>
                      {/* Header */}
                      <div className={cn("px-5 pt-4 pb-3 border-b flex items-center justify-between", isDark ? "border-amber-500/10 bg-amber-500/5" : "border-amber-100 bg-amber-50")}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                            <span className="text-base">🔀</span>
                          </div>
                          <div>
                            <h3 className={cn("font-black text-sm tracking-tight", isDark ? "text-amber-300" : "text-amber-900")}>{t.partialHarvestHistory}</h3>
                            <p className={cn("text-[7px] font-black uppercase tracking-widest", isDark ? "text-amber-400/50" : "text-amber-700/60")}>
                              {partials.length} round{partials.length > 1 ? 's' : ''} completed
                            </p>
                          </div>
                        </div>
                        <span className={cn("text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full border",
                          isDark ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-amber-100 border-amber-300 text-amber-700"
                        )}>
                          Pond Active
                        </span>
                      </div>

                      {/* Summary strip */}
                      <div className="grid grid-cols-3 divide-x divide-card-border border-b border-card-border">
                        {[
                          { label: 'Total Harvested', value: `${totalHarvested.toFixed(0)} kg` },
                          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}` },
                          { label: 'Est. Remaining', value: `~${remainingBiomass.toFixed(0)} kg` },
                        ].map((s, i) => (
                          <div key={i} className="py-3 text-center">
                            <p className={cn("font-black text-sm leading-none", i === 2 ? isDark ? "text-amber-300" : "text-amber-700" : isDark ? "text-white" : "text-slate-800")}>{s.value}</p>
                            <p className={cn("text-[6px] font-black uppercase tracking-widest mt-1", isDark ? "text-white/20" : "text-slate-400")}>{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Per-harvest rows */}
                      <div className="divide-y divide-card-border">
                        {partials.map((ph: any, i: number) => (
                          <div key={i} className="px-5 py-3 flex items-center gap-3">
                            <div className={cn("w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border text-center",
                              isDark ? "bg-white/5 border-white/10" : "bg-amber-50 border-amber-100"
                            )}>
                              <p className={cn("text-[6px] font-black uppercase leading-none", isDark ? "text-white/30" : "text-amber-600")}>
                                {new Date(ph.date).toLocaleString('default', { month: 'short' })}
                              </p>
                              <p className={cn("text-sm font-black leading-none", isDark ? "text-white" : "text-amber-800")}>
                                {new Date(ph.date).getDate()}
                              </p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-[10px] font-black tracking-tight", isDark ? "text-white" : "text-slate-800")}>
                                Round {i + 1} · DOC {ph.doc || '—'} · {ph.harvestedBiomass} kg
                              </p>
                              <p className={cn("text-[8px] font-bold mt-0.5", isDark ? "text-white/30" : "text-slate-400")}>
                                ₹{ph.ratePerKg}/kg · Avg {ph.avgWeight}g
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={cn("text-sm font-black", isDark ? "text-emerald-400" : "text-emerald-600")}>
                                ₹{(ph.revenue || 0).toLocaleString('en-IN')}
                              </p>
                              <p className={cn("text-[7px] font-bold", isDark ? "text-white/20" : "text-slate-400")}>{t.revenueLabel}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Remaining pond footer */}
                      <div className={cn("px-5 py-3 border-t flex items-center gap-2", isDark ? "border-white/5 bg-amber-500/5" : "border-amber-100 bg-amber-50/60")}>
                        <span className="text-base">🐟</span>
                        <p className={cn("text-[8px] font-bold leading-relaxed", isDark ? "text-amber-300/60" : "text-amber-800/70")}>
                          Remaining stock: ~<span className="font-black">{safeNum(pond.seedCount).toLocaleString()}</span> shrimps · Est. <span className="font-black">~{remainingBiomass.toFixed(0)} kg</span> at harvest
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {activeSection === 'timeline' && (
              <motion.div key="timeline" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <div className={cn("rounded-[2rem] border overflow-hidden", isDark ? "bg-[#0D1A13] border-white/5" : "bg-white border-slate-100")}>
                  <div className="px-5 pt-5 pb-3 border-b border-card-border">
                    <h3 className={cn("font-black text-sm", isDark ? "text-white" : "text-slate-900")}>
                      {isPlanned ? 'Preparation Schedule' : t.cultureTimeline}
                    </h3>
                    <p className={cn("text-[8px] font-black uppercase tracking-widest mt-0.5", isDark ? "text-white/30" : "text-slate-400")}>
                      {isPlanned
                        ? `Target stocking: ${new Date(pond.stockingDate).toLocaleDateString()} · ${Math.abs(currentDoc)} days left`
                        : `Total: 100d cycle · ${100 - currentDoc > 0 ? `${100 - currentDoc}d remaining` : 'Full maturity'}`}
                    </p>
                  </div>
                  <div className="max-h-[520px] overflow-y-auto scrollbar-hide">
                    {getTimelineDates().map((date, i) => {
                      const dateStr = date.toISOString().split('T')[0];
                      const rec = pondRecords.find(r => r.date === dateStr);
                      const dayDoc = currentDoc - i;
                      const dayWeight = calculateWeight(dayDoc);
                      const isToday = i === 0;
                      return (
                        <div
                          key={i}
                          onClick={() => navigate(`/ponds/${pond.id}/water-log/${dateStr}`)}
                          className={cn(
                            "px-5 py-3 flex items-center gap-3 cursor-pointer transition-all active:scale-[0.98] border-b last:border-b-0 border-card-border",
                            isToday ? isDark ? "bg-emerald-500/5" : "bg-emerald-50/50" : "hover:bg-ink/[0.02]"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-[1.2rem] flex flex-col items-center justify-center shrink-0 border",
                            isToday
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : rec
                                ? isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-100 text-slate-700"
                                : isDark ? "bg-white/3 border-white/5 text-white/20" : "bg-slate-50 border-slate-100 text-slate-300"
                          )}>
                            <p className="text-[6px] font-black uppercase tracking-widest leading-none">{date.toLocaleString('default', { month: 'short' })}</p>
                            <p className="text-sm font-black tracking-tighter leading-none mt-0.5">{date.getDate()}</p>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={cn("font-black text-[11px] tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                              {isToday ? `Today · DOC ${dayDoc}` : `DOC ${dayDoc}`}
                            </p>
                            {rec ? (
                              <p className={cn("text-[7px] font-black uppercase tracking-widest mt-0.5 flex items-center gap-1.5",
                                (rec.ph >= 7.5 && rec.ph <= 8.5 && rec.do >= 4) ? "text-emerald-500" : "text-amber-500"
                              )}>
                                <span>pH {rec.ph}</span>
                                <span>·</span>
                                <span>DO {rec.do}</span>
                                {rec.temperature && <><span>·</span><span>{rec.temperature}°C</span></>}
                              </p>
                            ) : (
                              <p className={cn("text-[7px] font-black uppercase tracking-widest mt-0.5", isDark ? "text-white/15" : "text-slate-300")}>
                                No log recorded
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <p className={cn("text-sm font-black leading-none", isDark ? "text-white/80" : "text-slate-700")}>{dayWeight.toFixed(1)}g</p>
                            {rec ? (
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-auto mt-1.5" />
                            ) : (
                              <div className={cn("w-1.5 h-1.5 rounded-full ml-auto mt-1.5", isDark ? "bg-white/10" : "bg-slate-200")} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'aerators' && (
              <motion.div key="aerators" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <AeratorManagement pond={pond} isDark={isDark} />
              </motion.div>
            )}

            {activeSection === 'certificate' && (
              <motion.div key="certificate" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-3">
                {currentDoc > 10 ? (
                  <>
                    {/* Certificate card */}
                    <div className={cn("rounded-[2rem] overflow-hidden border shadow-xl", isDark ? "border-white/5" : "border-slate-100")}>
                      <div className={cn("bg-gradient-to-br p-6 text-white relative overflow-hidden", certGrade.color)}>
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />
                        <div className="absolute right-5 top-4 text-5xl opacity-50">{certGrade.icon}</div>
                        <div className="relative z-10">
                          <p className="text-white/50 text-[8px] font-black uppercase tracking-[0.3em] mb-1">{t.auditCertificate}</p>
                          <h3 className="text-3xl font-black tracking-tighter">{certGrade.label}</h3>
                          <p className="text-white/60 text-[9px] font-bold mt-1">{pond.name} · {pond.species || 'Vannamei'} · {pond.size} Ac</p>
                        </div>
                        <div className="flex items-end justify-between mt-5 pt-4 border-t border-white/15 relative z-10">
                          <div>
                            <p className="text-white/40 text-[7px] font-black uppercase tracking-widest">Audit Score</p>
                            <p className="text-4xl font-black tracking-tighter">{certScore}<span className="text-lg text-white/40">/100</span></p>
                          </div>
                          <div className="text-right">
                            <p className="text-white/40 text-[7px] font-black uppercase tracking-widest">Culture Days</p>
                            <p className="text-2xl font-black">{currentDoc}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white/40 text-[7px] font-black uppercase tracking-widest">{t.stockingDate}</p>
                            <p className="text-[10px] font-black">{new Date(pond.stockingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
                          </div>
                        </div>
                      </div>

                      {/* Audit items */}
                      <div className={cn("divide-y", isDark ? "divide-white/5 bg-[#0D1A13]" : "divide-slate-100 bg-white")}>
                        {[
                          { label: 'Water Quality Logs', detail: `${pondRecords.length} logs · pH & DO tracked`, compliance: waterCompliance, icon: Droplets, pass: waterCompliance >= 60 },
                          { label: 'Feed Compliance', detail: `${pondFeedLogs.length} feed entries · ${totalFeedKg.toFixed(0)}kg total`, compliance: feedCompliance, icon: Fish, pass: feedCompliance >= 60 },
                          { label: 'Culture SOP Progress', detail: `DOC ${currentDoc} of 90-day cycle`, compliance: Math.min(100, Math.round((currentDoc / 90) * 100)), icon: Target, pass: true },
                          { label: 'Medicine Withdrawal', detail: currentDoc >= 90 ? 'Harvest-safe zone ✓' : `${90 - currentDoc}d until withdrawal`, compliance: currentDoc >= 90 ? 100 : Math.min(100, Math.round((currentDoc / 83) * 90)), icon: ShieldCheck, pass: currentDoc < 83 || currentDoc >= 90 },
                        ].map((item, i) => (
                          <div key={i} className="px-5 py-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2.5">
                                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center",
                                  item.pass ? isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                                    : "bg-red-50 text-red-500"
                                )}>
                                  <item.icon size={14} />
                                </div>
                                <div>
                                  <p className={cn("text-[10px] font-black", isDark ? "text-white" : "text-slate-900")}>{item.label}</p>
                                  <p className={cn("text-[8px] font-bold", isDark ? "text-white/30" : "text-slate-400")}>{item.detail}</p>
                                </div>
                              </div>
                              <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full",
                                item.pass ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                              )}>
                                {item.pass ? '✓ PASS' : '✗ WORK'}
                              </span>
                            </div>
                            <div className={cn("h-1.5 rounded-full overflow-hidden", isDark ? "bg-white/5" : "bg-slate-100")}>
                              <div
                                className={cn("h-full rounded-full transition-all duration-1000",
                                  item.compliance >= 80 ? "bg-emerald-500" :
                                    item.compliance >= 60 ? "bg-amber-400" : "bg-red-400"
                                )}
                                style={{ width: `${item.compliance}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className={cn("px-5 py-4 flex items-center justify-between", isDark ? "bg-white/[0.02]" : "bg-slate-50")}>
                        <div>
                          <p className={cn("text-[7px] font-black uppercase tracking-widest", isDark ? "text-white/20" : "text-slate-400")}>{t.verifiedBy}</p>
                          <p className={cn("text-[8px] font-bold mt-0.5", isDark ? "text-white/30" : "text-slate-500")}>
                            {pondRecords.length} water logs · {pondFeedLogs.length} feed logs · DOC {currentDoc}
                          </p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                          <p className="text-emerald-600 text-[8px] font-black uppercase tracking-widest">{certGrade.label}</p>
                        </div>
                      </div>
                    </div>

                    {certScore >= 60 && (
                      <div className={cn("rounded-[1.5rem] p-4 border flex items-center gap-3", isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200")}>
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <UserCheck size={18} className="text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-indigo-900 text-[10px] font-black uppercase tracking-widest">{t.buyerTrustReady}</p>
                          <p className="text-indigo-600/70 text-[9px] font-bold mt-0.5 leading-relaxed">
                            {certGrade.label.toLowerCase()} grade certificate. Buyers can verify your farming standards.
                          </p>
                        </div>
                        <Send size={16} className="text-indigo-300" />
                      </div>
                    )}

                    {/* ── CERTIFICATE PROCESS GUIDANCE (only after harvest) ── */}
                    {effectiveStatus === 'harvested' && (
                      <div className={cn("rounded-[2rem] border overflow-hidden shadow-sm", isDark ? "bg-[#0D1A13] border-emerald-500/20" : "bg-white border-emerald-200")}>
                        {/* Header */}
                        <div className={cn("px-5 pt-5 pb-4 border-b", isDark ? "border-white/5 bg-emerald-500/5" : "border-emerald-100 bg-emerald-50")}>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl">🏛️</span>
                            <div>
                              <h3 className={cn("font-black text-sm tracking-tight", isDark ? "text-emerald-300" : "text-emerald-900")}>
                                Aquaculture Certificate
                              </h3>
                              <p className={cn("text-[7px] font-black uppercase tracking-widest", isDark ? "text-emerald-400/50" : "text-emerald-600/60")}>
                                Post-Harvest Official Process
                              </p>
                            </div>
                          </div>
                          <p className={cn("text-[9px] font-medium leading-relaxed", isDark ? "text-emerald-200/60" : "text-emerald-800/70")}>
                            Your harvest is complete! Apply for the official Aquaculture Farm Certificate through MPEDA or your State Fisheries Department to sell to export markets and increase buyer trust.
                          </p>
                        </div>

                        {/* Steps */}
                        <div className="divide-y divide-card-border">
                          {[
                            { step: '1', icon: '📋', title: 'Gather Documents', detail: 'Gather land records / lease agreement, Aadhaar, pond size proof, stocking details (species, seed count, date), and harvest weight receipt.' },
                            { step: '2', icon: '🏢', title: 'Visit MPEDA / State Office', detail: 'Go to your nearest MPEDA Regional Office or State Fisheries Dept. For Andhra Pradesh: AP Fisheries Dept. / Fisheries University Narasapur.' },
                            { step: '3', icon: '📝', title: 'Submit Application', detail: 'Fill MPEDA Aquaculture Farm Registration Form. Attach harvest record, water quality logs (from AquaGrow export), and biomass certificate from buyer.' },
                            { step: '4', icon: '🔍', title: 'Inspection', detail: 'An officer will visit your farm within 15–30 days to verify pond size, records, and compliance. Keep your AquaGrow data accessible.' },
                            { step: '5', icon: '🎓', title: 'Certificate Issued', detail: 'Certificate valid for 5 years. Renew before expiry. Use it to access premium export buyers, government subsidies, and NABARD loans.' },
                          ].map((s, i) => (
                            <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                              <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 border text-[9px] font-black", isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-700")}>
                                {s.step}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn("text-[10px] font-black mb-0.5", isDark ? "text-white" : "text-slate-900")}>
                                  {s.icon} {s.title}
                                </p>
                                <p className={cn("text-[8px] font-medium leading-relaxed", isDark ? "text-white/40" : "text-slate-500")}>{s.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Info footer */}
                        <div className={cn("px-5 py-4 border-t", isDark ? "border-white/5 bg-emerald-500/5" : "border-emerald-100 bg-emerald-50")}>
                          <p className={cn("text-[8px] font-bold leading-relaxed", isDark ? "text-emerald-300/60" : "text-emerald-800/60")}>
                            💡 <strong>Tip:</strong> Your AquaGrow water quality logs and feed records are accepted as official documentation. Export them from Profile → My Data.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={cn("rounded-[2rem] p-8 text-center border", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-100")}>
                    <Award size={40} className="text-slate-300 mx-auto mb-4" />
                    <p className={cn("font-black text-sm", isDark ? "text-white/50" : "text-slate-400")}>Certificate Available After DOC 10</p>
                    <p className={cn("text-[9px] font-bold mt-2", isDark ? "text-white/20" : "text-slate-300")}>Keep logging daily to build your trust score</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── MODALS ── */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { deletePond(pond.id); navigate('/ponds'); }}
        title="Delete Pond?"
        message="This permanently removes all culture data and growth history."
        confirmText="Confirm Delete"
        cancelText="Cancel"
      />
      <AlertModal
        isOpen={showDeleteAlert}
        onClose={() => setShowDeleteAlert(false)}
        title="Deletion Locked"
        message="A pond past DOC 7 cannot be deleted to preserve historical records."
        buttonText="I Understand"
      />

      <AnimatePresence>
        {showCancelConfirm && (
          <div className="fixed inset-0 z-[1000] flex items-end justify-center px-4 pb-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCancelConfirm(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-card w-full max-w-sm rounded-[2.5rem] border border-card-border shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Trash2 size={28} className="text-red-500" />
                </div>
                <h3 className="text-ink font-black text-lg text-center tracking-tight mb-1 uppercase">{t.stopHarvest}</h3>
                <p className="text-ink/40 text-[10px] font-bold text-center uppercase tracking-widest leading-relaxed mb-5">
                  Provide a reason to help improve market matching
                </p>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="w-full bg-ink/5 border border-card-border rounded-2xl p-4 text-xs font-bold focus:border-red-400 transition-all min-h-[80px] outline-none"
                  placeholder="e.g. Better rate elsewhere, Quality issue..."
                />
              </div>
              <div className="grid grid-cols-2 border-t border-card-border h-14">
                <button onClick={() => setShowCancelConfirm(false)} className="text-[10px] font-black uppercase tracking-widest text-ink/40 border-r border-card-border hover:bg-ink/5 transition-colors">
                  Keep Order
                </button>
                <button
                  onClick={async () => {
                    const reason = cancelReason.trim() || 'No reason provided';
                    const capturedRequest = currentRequest;
                    setShowCancelConfirm(false);
                    setWasCancelledSuccessfully(true);
                    const pId = id || pond.id || (pond as any)._id;
                    try {
                      const tasks: Promise<any>[] = [];
                      if (capturedRequest) {
                        const rId = capturedRequest.id || (capturedRequest as any)._id;
                        tasks.push(updateHarvestRequest(rId, { status: 'cancelled', cancellationReason: reason }));
                      }
                      tasks.push(updatePond(pId, { status: 'active', harvestData: { ...pond.harvestData, cancelledAt: new Date().toISOString() } }));
                      await Promise.allSettled(tasks);
                    } catch (err) {
                      console.error('[Cancellation Error]', err);
                    } finally {
                      setCancelReason('');
                    }
                  }}
                  className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all"
                >
                  Yes, Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
