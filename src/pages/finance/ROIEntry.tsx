import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, CheckCircle2, Fish, Wheat, Pill,
  Zap, Users, Wrench, PackageCheck, TrendingUp, BarChart2,
  Scale, Wallet, FileText, Calendar, Building2, DollarSign,
  Percent, Star, ArrowRight, AlertTriangle, Home,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/cn';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import { NoPondState } from '../../components/NoPondState';
import { ServerErrorState } from '../../components/ServerErrorState';
import type { Translations } from '../../translations';
import { API_BASE_URL } from '../../config';

// ─── Types ────────────────────────────────────────────────────────────────────
type FormData = {
  pondId: string;
  harvestDate: string;
  harvestWeightKg: string;
  countPerKg: string;
  survivalRate: string;
  gradeA: string;
  gradeB: string;
  seedCost: string;
  feedCost: string;
  medicineCost: string;
  laborCost: string;
  utilityCost: string;
  infrastructureCost: string;
  otherCost: string;
  cultureDays: string;
  saleAmountTotal: string;
  buyerName: string;
  pricePerKg: string;
  subsidyAmount: string;
  notes: string;
};

const EMPTY: FormData = {
  pondId: '', harvestDate: new Date().toISOString().split('T')[0],
  harvestWeightKg: '', countPerKg: '', survivalRate: '80',
  gradeA: '85', gradeB: '15',
  seedCost: '', feedCost: '', medicineCost: '', laborCost: '',
  utilityCost: '', infrastructureCost: '', otherCost: '',
  cultureDays: '90',
  saleAmountTotal: '', buyerName: '', pricePerKg: '', subsidyAmount: '0',
  notes: '',
};

// ─── Field Input ──────────────────────────────────────────────────────────────
const Field = ({
  label, value, onChange, type = 'text', placeholder = '',
  icon: Icon, unit, isDark,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; icon?: any; unit?: string; isDark: boolean;
}) => (
  <div className="space-y-1.5">
    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#C78200] px-1">{label}</label>
    <div className="relative">
      {Icon && (
        <div className={cn('absolute left-4 top-1/2 -translate-y-1/2', isDark ? 'text-white/20' : 'text-slate-300')}>
          <Icon size={16} />
        </div>
      )}
      <input
        type={type}
        inputMode={type === 'number' ? 'decimal' : undefined}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-[1.4rem] py-4 pr-4 text-[13px] font-black outline-none transition-all border',
          Icon ? 'pl-10' : 'pl-4',
          unit ? 'pr-14' : 'pr-4',
          isDark
            ? 'bg-white/5 border-white/10 text-white placeholder:text-white/15 focus:border-[#C78200]/50 focus:bg-white/8'
            : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-[#C78200] shadow-sm'
        )}
      />
      {unit && (
        <span className={cn('absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase tracking-widest',
          isDark ? 'text-white/20' : 'text-slate-400')}>
          {unit}
        </span>
      )}
    </div>
  </div>
);

// ─── Spend Bar ────────────────────────────────────────────────────────────────
const SpendBar = ({ label, amount, total, color, isDark }: {
  label: string; amount: number; total: number; color: string; isDark: boolean; key?: React.Key;
}) => {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/40' : 'text-slate-500')}>{label}</p>
        <p className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-800')}>₹{amount.toLocaleString('en-IN')}</p>
      </div>
      <div className={cn('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-slate-100')}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', color)}
        />
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const ROIEntry = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { ponds, expenses, feedLogs, medicineLogs, apiFetch, theme, serverError } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  // ── Only truly active ponds in the pond selector — NEVER harvested or planned
  const activePonds = useMemo(
    () => ponds.filter(p => p.status === 'active'),
    [ponds]
  );
  const hasActivePond = activePonds.length > 0;

  // ── Harvest context from query params (from PondHarvest flow) ──
  const fromHarvest   = searchParams.get('fromHarvest') === 'self';
  const harvestPondId = searchParams.get('pondId') || '';
  const harvestBiomass    = searchParams.get('biomass') || '';
  const harvestSalePrice  = searchParams.get('salePrice') || '';
  const harvestDoc        = searchParams.get('doc') || '';
  const harvestReason     = searchParams.get('reason') ? decodeURIComponent(searchParams.get('reason')!) : '';
  const harvestPond       = harvestPondId ? ponds.find(p => p.id === harvestPondId) : null;

  const STEPS = [
    { id: 1, title: t.harvestDetails,  subtitle: t.whatDidYouHarvest, icon: Fish,      color: 'from-blue-600 to-blue-800',    accent: '#3b82f6' },
    { id: 2, title: t.investments,      subtitle: t.whatDidYouSpend,   icon: Wallet,    color: 'from-red-600 to-red-800',      accent: '#ef4444' },
    { id: 3, title: t.revenueEarned,   subtitle: t.whatDidYouReceive,  icon: TrendingUp, color: 'from-emerald-600 to-emerald-800', accent: '#10b981' },
    { id: 4, title: t.profileSummary,  subtitle: t.yourROIAnalysis,    icon: BarChart2,  color: 'from-[#C78200] to-[#8a5900]', accent: '#C78200' },
  ];

  const [step, setStep] = useState(1);
  const [saved, setSaved] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  const initialForm: FormData = {
    ...EMPTY,
    pondId: harvestPondId || activePonds[0]?.id || '',
    harvestWeightKg: harvestBiomass || '',
    pricePerKg: harvestSalePrice || '',
    saleAmountTotal: harvestBiomass && harvestSalePrice
      ? String(Math.round(parseFloat(harvestBiomass) * parseFloat(harvestSalePrice)))
      : '',
    cultureDays: harvestDoc || '',
    buyerName: harvestReason ? `Self Harvest — ${harvestReason}` : '',
    harvestDate: new Date().toISOString().split('T')[0],
  };
  const [form, setForm] = useState<FormData>(initialForm);

  // Auto-fill costs from logs when pond changes
  React.useEffect(() => {
    if (!form.pondId) return;
    const pe = (expenses || []).filter((e: any) => e.pondId === form.pondId);
    const feedFromExp = pe.filter((e: any) => e.category === 'feed').reduce((a: number, e: any) => a + (e.amount || 0), 0);
    const medFromExp  = pe.filter((e: any) => e.category === 'medicine').reduce((a: number, e: any) => a + (e.amount || 0), 0);
    const diesel      = pe.filter((e: any) => e.category === 'diesel').reduce((a: number, e: any) => a + (e.amount || 0), 0);
    const power       = pe.filter((e: any) => e.category === 'power').reduce((a: number, e: any) => a + (e.amount || 0), 0);
    const labor       = pe.filter((e: any) => e.category === 'labor').reduce((a: number, e: any) => a + (e.amount || 0), 0);
    const other       = pe.filter((e: any) => e.category === 'other').reduce((a: number, e: any) => a + (e.amount || 0), 0);
    const feedFromLogs = (feedLogs || []).filter((l: any) => l.pondId === form.pondId).reduce((a: number, l: any) => a + (l.cost || l.quantity * 65 || 0), 0);
    const medFromLogs  = (medicineLogs || []).filter((l: any) => l.pondId === form.pondId).reduce((a: number, l: any) => a + (l.cost || 0), 0);
    const totalFeed = feedFromExp + feedFromLogs;
    const totalMed  = medFromExp + medFromLogs;
    if (totalFeed > 0 || totalMed > 0 || (diesel + power) > 0 || labor > 0 || other > 0) setAutoFilled(true);
    setForm(f => ({
      ...f,
      feedCost:     totalFeed > 0 ? totalFeed.toString() : f.feedCost,
      medicineCost: totalMed  > 0 ? totalMed.toString()  : f.medicineCost,
      utilityCost:  (diesel + power) > 0 ? (diesel + power).toString() : f.utilityCost,
      laborCost:    labor > 0 ? labor.toString() : f.laborCost,
      otherCost:    other > 0 ? other.toString() : f.otherCost,
    }));
  }, [form.pondId, expenses, feedLogs, medicineLogs]);

  const set = (key: keyof FormData) => (v: string) => setForm(f => ({ ...f, [key]: v }));
  const n = (v: string) => parseFloat(v) || 0;

  const totalInvested = n(form.seedCost) + n(form.feedCost) + n(form.medicineCost) +
    n(form.laborCost) + n(form.utilityCost) + n(form.infrastructureCost) + n(form.otherCost);
  const totalRevenue  = n(form.saleAmountTotal) + n(form.subsidyAmount);
  const netProfit     = totalRevenue - totalInvested;
  const roi           = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
  const costPerKg     = n(form.harvestWeightKg) > 0 ? totalInvested / n(form.harvestWeightKg) : 0;
  const revenuePerKg  = n(form.harvestWeightKg) > 0 ? totalRevenue / n(form.harvestWeightKg) : 0;
  const profitPerKg   = revenuePerKg - costPerKg;

  // ABW guard — shrimp body weight inferred from count/kg
  // 1000g / count_per_kg = avg body weight (g). Minimum allowed = 10g → countPerKg ≤ 100
  const abwGrams    = n(form.countPerKg) > 0 ? (1000 / n(form.countPerKg)) : null;
  const abwTooSmall = abwGrams !== null && abwGrams < 10;

  // ── Step 1 validation ──
  const step1Errors: string[] = [];
  if (!form.pondId)                              step1Errors.push(t.selectPondError);
  if (!form.harvestWeightKg || n(form.harvestWeightKg) <= 0) step1Errors.push(t.enterHarvestWeightError);
  if (!form.countPerKg || n(form.countPerKg) <= 0)           step1Errors.push(t.enterCountError);
  if (!form.survivalRate || n(form.survivalRate) <= 0)        step1Errors.push(t.enterSurvivalError);
  if (!form.cultureDays || n(form.cultureDays) <= 0)          step1Errors.push(t.enterDurationError);
  if (abwTooSmall) step1Errors.push(t.abwTooSmallError(abwGrams!.toFixed(1)));
  const step1Valid = step1Errors.length === 0;

  // ── Step 3 validation ──
  const step3Errors: string[] = [];
  if (!form.saleAmountTotal || n(form.saleAmountTotal) <= 0) step3Errors.push(t.enterSaleAmountError);
  if (!form.pricePerKg || n(form.pricePerKg) <= 0)           step3Errors.push(t.enterPricePerKgError);
  const step3Valid = step3Errors.length === 0;

  const [showStepErrors, setShowStepErrors] = useState(false);

  const handleSave = async () => {
    setSaved(true);
    try {
      await apiFetch(`${API_BASE_URL}/roi-entries`, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          harvestWeightKg: n(form.harvestWeightKg), countPerKg: n(form.countPerKg),
          survivalRate: n(form.survivalRate), gradeA: n(form.gradeA), gradeB: n(form.gradeB),
          seedCost: n(form.seedCost), feedCost: n(form.feedCost), medicineCost: n(form.medicineCost),
          laborCost: n(form.laborCost), utilityCost: n(form.utilityCost),
          infrastructureCost: n(form.infrastructureCost), otherCost: n(form.otherCost),
          cultureDays: n(form.cultureDays), saleAmountTotal: n(form.saleAmountTotal),
          pricePerKg: n(form.pricePerKg), subsidyAmount: n(form.subsidyAmount),
          totalInvested, totalRevenue, netProfit, roi,
          savedAt: new Date().toISOString(),
          harvestType: fromHarvest ? 'self' : 'market',
        }),
      });
    } catch (err) {
      console.error('[ROI] Save failed:', err);
    }
    setTimeout(() => navigate(fromHarvest ? '/ponds' : '/roi-report'), 2200);
  };

  const currentStep = STEPS[step - 1];

  // ── No active ponds guard — block ROI entry if no active pond exists ──
  if (!fromHarvest && !hasActivePond) {
    return (
      <div className={cn('min-h-screen', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
        <Header title={t.postHarvestROI} showBack />
        <div className="pt-24 px-4">
          {serverError ? (
            <ServerErrorState isDark={isDark} />
          ) : (
            <div className={cn('rounded-3xl p-8 text-center border mx-2 mt-4', isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
              <div className="text-5xl mb-4">🚫</div>
              <h3 className={cn('font-black text-base tracking-tight mb-2', isDark ? 'text-white' : 'text-slate-900')}>{t.noActivePond}</h3>
              <p className={cn('text-[10px] font-medium leading-relaxed mb-6', isDark ? 'text-white/40' : 'text-slate-500')}>
                {t.noActivePondROIDesc}
              </p>
              <button
                onClick={() => navigate('/ponds')}
                className="px-6 py-3 rounded-2xl bg-[#C78200] text-white text-[10px] font-black uppercase tracking-widest"
              >
                {t.goToPonds} →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen pb-40 font-sans', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>

      {/* ── SUCCESS OVERLAY ── */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#0D523C]/97 backdrop-blur-xl flex flex-col items-center justify-center text-white p-10 text-center"
          >
            <motion.div
              initial={{ scale: 0.3, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="w-28 h-28 bg-white/10 rounded-[2.5rem] flex items-center justify-center text-emerald-400 shadow-2xl mb-8 border border-white/10"
            >
              <CheckCircle2 size={60} />
            </motion.div>
            <h3 className="text-3xl font-black tracking-tighter mb-2">
              {fromHarvest ? t.harvestClosedSuccess : t.roiProfileSaved}
            </h3>
            <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
              {fromHarvest ? `${t.roiProfileSaved} · ${t.redirectingDashboard}` : t.redirectingDashboard}
            </p>
            <div className="mt-8 flex items-center gap-3">
              <div className="px-5 py-2.5 bg-white/10 rounded-2xl border border-white/10">
                <p className="font-black text-sm">ROI: <span className={roi >= 0 ? 'text-emerald-300' : 'text-red-300'}>{roi.toFixed(1)}%</span></p>
              </div>
              <div className="px-5 py-2.5 bg-white/10 rounded-2xl border border-white/10">
                <p className="font-black text-sm">Net: <span className="text-emerald-300">₹{netProfit.toLocaleString('en-IN')}</span></p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <Header
        title={fromHarvest ? 'Complete Harvest' : t.postHarvestROI}
        showBack
        onBack={() => step === 1 ? navigate(-1) : setStep(s => s - 1)}
        rightElement={<div className="w-10" />}
      />

      {/* ── FROM-HARVEST BANNER ── */}
      {fromHarvest && (
        <div className="fixed top-[60px] left-0 right-0 max-w-[420px] mx-auto z-50 px-4 pt-2">
          <div className="bg-gradient-to-r from-[#C78200] to-[#a06600] rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg">
            <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <Home size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[7px] font-black text-white/60 uppercase tracking-widest">Step 2 of 2 — Harvest Closing</p>
              <p className="text-[10px] font-black text-white truncate">
                {harvestPond?.name || 'Pond'} · {harvestBiomass}kg · {t.harvestDetails}
              </p>
            </div>
            <ArrowRight size={13} className="text-white/50 flex-shrink-0" />
          </div>
        </div>
      )}

      {/* ── STEP PROGRESS BAR ── */}
      <div className={cn(
        'fixed left-0 right-0 max-w-[420px] mx-auto z-40 px-5 pt-4 pb-2.5 border-b backdrop-blur-xl',
        fromHarvest ? 'top-[108px]' : 'top-[60px]',
        isDark ? 'bg-[#070D12]/90 border-white/5' : 'bg-white/95 border-slate-100 shadow-sm'
      )}>
        <div className="relative">
          {/* Connector Line (Background) */}
          <div className={cn('absolute top-[10px] left-8 right-8 h-0.5 -z-10 rounded-full', isDark ? 'bg-white/5' : 'bg-slate-100')} />
          {/* Progress Line */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            className="absolute top-[10px] left-8 right-8 h-0.5 bg-gradient-to-r from-[#C78200] to-amber-400 -z-10 rounded-full origin-left"
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />

          <div className="flex justify-between items-start">
            {STEPS.map((s, i) => {
              const done    = step > s.id;
              const current = step === s.id;
              return (
                <div key={s.id} className="flex flex-col items-center w-1/4">
                  {/* Step Dot */}
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center border transition-all text-[8px] font-black z-10',
                    done    ? 'bg-emerald-500 border-emerald-500 text-white' :
                    current ? 'bg-[#C78200] border-[#C78200] text-white shadow-lg shadow-amber-500/30' :
                              isDark ? 'bg-[#070D12] border-white/10 text-white/20' : 'bg-white border-slate-200 text-slate-400'
                  )}>
                    {done ? <CheckCircle2 size={11} /> : s.id}
                  </div>
                  {/* Step Title Label */}
                  <p className={cn(
                    'text-[6.5px] font-black uppercase tracking-tighter mt-1.5 text-center leading-tight transition-colors px-1',
                    current ? 'text-[#C78200]' : done ? (isDark ? 'text-white/40' : 'text-slate-500') : (isDark ? 'text-white/10' : 'text-slate-300')
                  )}>
                    {s.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className={cn('px-4 max-w-[420px] mx-auto', fromHarvest ? 'pt-56' : 'pt-40')}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Step header card */}
            <div className={cn('rounded-[2rem] overflow-hidden shadow-xl bg-gradient-to-br', currentStep.color)}>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center border border-white/10">
                    {React.createElement(currentStep.icon, { size: 22, className: 'text-white' })}
                  </div>
                  <div>
                    <p className="text-[7px] font-black text-white/50 uppercase tracking-[0.2em]">Step {step} of {STEPS.length}</p>
                    <h2 className="text-lg font-black tracking-tight text-white">{currentStep.title}</h2>
                  </div>
                </div>
                <p className="text-white/50 text-[8px] font-black uppercase tracking-widest">{currentStep.subtitle}</p>
              </div>
            </div>

            {/* ── STEP 1: Harvest Details ── */}
            {step === 1 && (
              <div className={cn('rounded-[2rem] border p-5 space-y-4', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>

                {/* Pond selector */}
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#C78200] px-1">
                    {t.selectCulturePond}
                  </label>
                  {activePonds.length === 0 ? (
                    <div className={cn('rounded-2xl p-3 border flex items-center gap-2', isDark ? 'bg-red-500/8 border-red-500/15' : 'bg-red-50 border-red-200')}>
                      <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
                      <p className={cn('text-[9px] font-bold', isDark ? 'text-red-400' : 'text-red-700')}>
                        No active ponds. Add a pond first.
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {activePonds.map(p => (
                        <button
                          key={p.id}
                          onClick={() => set('pondId')(p.id)}
                          className={cn(
                            'flex-shrink-0 px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all',
                            form.pondId === p.id
                              ? 'bg-[#C78200] text-white border-[#C78200] shadow-lg shadow-amber-500/20'
                              : isDark ? 'bg-white/5 text-white/40 border-white/8 hover:bg-white/8' : 'bg-slate-50 text-slate-500 border-slate-200'
                          )}
                        >
                          🐟 {p.name}
                          {p.status === 'planned' && <span className="ml-1 opacity-50">(Planned)</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Field label={t.stockingDate} value={form.harvestDate} onChange={set('harvestDate')} type="date" icon={Calendar} isDark={isDark} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.totalHarvestWeight} value={form.harvestWeightKg} onChange={set('harvestWeightKg')} type="number" placeholder="1200" icon={Scale} unit="kg" isDark={isDark} />
                  <Field label={t.countPerKgSize} value={form.countPerKg} onChange={set('countPerKg')} type="number" placeholder="40" icon={Fish} unit="/kg" isDark={isDark} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.survival} value={form.survivalRate} onChange={set('survivalRate')} type="number" placeholder="80" icon={Percent} unit="%" isDark={isDark} />
                  <Field label={t.cultureDuration} value={form.cultureDays} onChange={set('cultureDays')} type="number" placeholder="90" icon={Calendar} unit="days" isDark={isDark} />
                </div>

                {/* Grade split */}
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#C78200] px-1">{t.gradeSplit}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t.gradeAYield} value={form.gradeA} onChange={set('gradeA')} type="number" placeholder="85" unit="%" isDark={isDark} />
                    <Field label={t.gradeBYield} value={form.gradeB} onChange={set('gradeB')} type="number" placeholder="15" unit="%" isDark={isDark} />
                  </div>
                </div>

                {/* ABW < 10g warning */}
                {abwTooSmall && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className={cn('rounded-2xl p-4 border flex items-start gap-3', isDark ? 'bg-red-500/10 border-red-500/25' : 'bg-red-50 border-red-200')}
                  >
                    <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className={cn('text-[8px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-red-400' : 'text-red-700')}>
                        🔴 {t.harvestNotListed || 'Harvest Not Allowed'}
                      </p>
                      <p className={cn('text-[9px] font-medium leading-snug', isDark ? 'text-red-300/70' : 'text-red-700/80')}>
                        Current ABW: <strong>{abwGrams!.toFixed(1)}g</strong> ({form.countPerKg}/kg).
                        Minimum harvestable size is <strong>10g</strong> (≤100 count/kg).
                        Wait until shrimp reach 10g+ before harvesting.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Preview chip */}
                {n(form.harvestWeightKg) > 0 && (
                  <div className={cn('rounded-2xl p-3 border flex items-center justify-between', isDark ? 'bg-blue-500/8 border-blue-500/15' : 'bg-blue-50 border-blue-100')}>
                    <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-blue-400' : 'text-blue-600')}>Harvest estimated</p>
                    <p className={cn('text-sm font-black', isDark ? 'text-blue-300' : 'text-blue-700')}>{n(form.harvestWeightKg).toLocaleString('en-IN')} kg</p>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2: Investments ── */}
            {step === 2 && (
              <div className={cn('rounded-[2rem] border p-5 space-y-4', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                {autoFilled ? (
                  <div className={cn('rounded-2xl p-3.5 border flex items-start gap-2', isDark ? 'bg-emerald-500/8 border-emerald-500/15' : 'bg-emerald-50 border-emerald-100')}>
                    <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-emerald-400' : 'text-emerald-700')}>{t.autoFilledMsg}</p>
                      <p className={cn('text-[8px] font-medium mt-0.5', isDark ? 'text-emerald-400/60' : 'text-emerald-600/70')}>{t.feedMedLogsReviewMsg}</p>
                    </div>
                  </div>
                ) : (
                  <div className={cn('rounded-2xl p-3.5 border flex items-center gap-2', isDark ? 'bg-amber-500/8 border-amber-500/15' : 'bg-amber-50 border-amber-100')}>
                    <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                    <p className={cn('text-[8px] font-black', isDark ? 'text-amber-400' : 'text-amber-700')}>{t.enterAllCostsMsg}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.seedPlsCost} value={form.seedCost} onChange={set('seedCost')} type="number" placeholder="0" icon={Fish} unit="₹" isDark={isDark} />
                  <Field label={t.feedCostLabel} value={form.feedCost} onChange={set('feedCost')} type="number" placeholder="0" icon={Wheat} unit="₹" isDark={isDark} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.medicineProbiotics} value={form.medicineCost} onChange={set('medicineCost')} type="number" placeholder="0" icon={Pill} unit="₹" isDark={isDark} />
                  <Field label={t.laborWages} value={form.laborCost} onChange={set('laborCost')} type="number" placeholder="0" icon={Users} unit="₹" isDark={isDark} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.gridPowerBill} value={form.utilityCost} onChange={set('utilityCost')} type="number" placeholder="0" icon={Zap} unit="₹" isDark={isDark} />
                  <Field label={t.infrastructurePower} value={form.infrastructureCost} onChange={set('infrastructureCost')} type="number" placeholder="0" icon={Building2} unit="₹" isDark={isDark} />
                </div>
                <Field label={t.otherTesting} value={form.otherCost} onChange={set('otherCost')} type="number" placeholder="0" icon={PackageCheck} unit="₹" isDark={isDark} />

                {/* Live total */}
                {totalInvested > 0 && (
                  <div className="rounded-[1.5rem] p-4 bg-gradient-to-r from-red-700 to-red-900 text-white flex justify-between items-center">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/50">{t.totalInvestment}</p>
                    <p className="font-black text-xl tracking-tighter">₹{totalInvested.toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: Revenue ── */}
            {step === 3 && (
              <div className={cn('rounded-[2rem] border p-5 space-y-4', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                <div className={cn('rounded-2xl p-3.5 border', isDark ? 'bg-emerald-500/8 border-emerald-500/15' : 'bg-emerald-50 border-emerald-100')}>
                  <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-emerald-400' : 'text-emerald-700')}>{t.whatDidYouReceive}</p>
                </div>

                <Field label={t.totalSaleAmount} value={form.saleAmountTotal} onChange={set('saleAmountTotal')} type="number" placeholder="0" icon={DollarSign} unit="₹" isDark={isDark} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.pricePerKgReceived} value={form.pricePerKg} onChange={set('pricePerKg')} type="number" placeholder="380" icon={TrendingUp} unit="₹/kg" isDark={isDark} />
                  <Field label={t.subsidyGovtSupport} value={form.subsidyAmount} onChange={set('subsidyAmount')} type="number" placeholder="0" icon={Star} unit="₹" isDark={isDark} />
                </div>
                <Field label={t.buyerCompanyName} value={form.buyerName} onChange={set('buyerName')} placeholder="e.g. Global Seafood Ltd." icon={Building2} isDark={isDark} />

                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#C78200] px-1">{t.additionalNotes}</label>
                  <div className="relative">
                    <FileText size={15} className={cn('absolute left-4 top-4', isDark ? 'text-white/15' : 'text-slate-300')} />
                    <textarea
                      value={form.notes}
                      onChange={e => set('notes')(e.target.value)}
                      placeholder={t.marketConditionsMsg}
                      rows={3}
                      className={cn(
                        'w-full rounded-[1.4rem] py-3.5 pl-10 pr-4 text-[12px] font-black outline-none resize-none border transition-all',
                        isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder:text-white/15 focus:border-[#C78200]/50'
                          : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-[#C78200] shadow-sm'
                      )}
                    />
                  </div>
                </div>

                {/* Live P&L */}
                {totalRevenue > 0 && (
                  <div className={cn(
                    'rounded-[1.5rem] p-4 flex items-center justify-between',
                    netProfit >= 0 ? 'bg-gradient-to-r from-emerald-600 to-emerald-800' : 'bg-gradient-to-r from-red-600 to-red-800'
                  )}>
                    <div>
                      <p className="text-[7px] font-black uppercase tracking-widest text-white/50">{t.netProfitLoss}</p>
                      <p className="font-black text-xl tracking-tighter text-white">
                        {netProfit >= 0 ? '+' : ''}₹{Math.abs(netProfit).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[7px] font-black uppercase tracking-widest text-white/50">ROI</p>
                      <p className="font-black text-xl tracking-tighter text-white">{roi.toFixed(1)}%</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 4: ROI Summary ── */}
            {step === 4 && (
              <div className="space-y-4">
                {/* Hero ROI card */}
                <div className={cn(
                  'rounded-[2.5rem] p-7 text-white relative overflow-hidden shadow-2xl bg-gradient-to-br',
                  roi >= 40 ? 'from-[#0D523C] to-[#1a7a5a]' :
                  roi >= 0  ? 'from-[#C78200] to-[#8a5900]' :
                              'from-red-700 to-red-900'
                )}>
                  <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/5 blur-[50px] rounded-full" />
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                  <div className="relative z-10">
                    <p className="text-[7px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">{t.postHarvestROI} Profile</p>
                    <p className="text-white/50 text-[9px] font-black mb-4">
                      {form.buyerName || 'Harvest Cycle'} · {form.harvestDate}
                    </p>
                    <div className="flex items-baseline gap-3 mb-6">
                      <p className="text-6xl font-black tracking-tighter">{roi.toFixed(1)}<span className="text-2xl text-white/40 ml-1">%</span></p>
                      <span className={cn('text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border',
                        roi >= 40 ? 'bg-emerald-400/20 border-emerald-400/30 text-emerald-200' :
                        roi >= 0  ? 'bg-white/15 border-white/20 text-white' :
                                    'bg-red-400/20 border-red-400/30 text-red-200'
                      )}>
                        {roi >= 40 ? `🏆 ${t.excellent}` : roi >= 20 ? `✅ ${t.good}` : roi >= 0 ? `⚠️ ${t.breakEven}` : `🔴 ${t.lossCycle}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/10 pt-5">
                      {[
                        { label: t.totalInvestment, value: `₹${(totalInvested / 100000).toFixed(2)}L`, color: 'text-red-200' },
                        { label: t.totalAmount,     value: `₹${(totalRevenue / 100000).toFixed(2)}L`,  color: 'text-emerald-200' },
                        { label: t.netProfitLoss,   value: `${netProfit >= 0 ? '+' : ''}₹${(netProfit / 100000).toFixed(2)}L`, color: netProfit >= 0 ? 'text-emerald-300' : 'text-red-300' },
                        { label: 'Profit/kg',        value: `₹${profitPerKg.toFixed(0)}/kg`, color: profitPerKg >= 0 ? 'text-emerald-300' : 'text-red-300' },
                      ].map((m, i) => (
                        <div key={i}>
                          <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-0.5">{m.label}</p>
                          <p className={cn('text-lg font-black tracking-tighter', m.color)}>{m.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Harvest stats row */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { label: 'Harvest', value: `${n(form.harvestWeightKg).toLocaleString('en-IN')} kg`, color: 'text-blue-500', bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50' },
                    { label: 'Count/kg',  value: `${form.countPerKg || '—'}/kg`,                    color: 'text-emerald-500', bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50' },
                    { label: 'DOC',      value: `${form.cultureDays}d`,                            color: 'text-[#C78200]',   bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50' },
                  ].map((m, i) => (
                    <div key={i} className={cn('rounded-[1.8rem] p-4 border text-center', isDark ? 'border-white/8' : 'border-slate-100 shadow-sm', m.bg)}>
                      <p className={cn('font-black text-base tracking-tighter', m.color)}>{m.value}</p>
                      <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Per-kg economics */}
                <div className={cn('rounded-[2rem] p-5 border', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                  <p className="text-[8px] font-black text-[#C78200] uppercase tracking-widest mb-4">Per-kg Economics</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Cost/kg',   value: `₹${costPerKg.toFixed(0)}`,    color: 'text-red-500' },
                      { label: 'Price/kg',  value: `₹${revenuePerKg.toFixed(0)}`, color: 'text-[#C78200]' },
                      { label: 'Profit/kg', value: `₹${profitPerKg.toFixed(0)}`,  color: profitPerKg >= 0 ? 'text-emerald-500' : 'text-red-500' },
                    ].map((m, i) => (
                      <div key={i} className="text-center">
                        <p className={cn('text-[7px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>{m.label}</p>
                        <p className={cn('font-black text-base tracking-tighter', m.color)}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Investment breakdown */}
                <div className={cn('rounded-[2rem] p-5 border space-y-3', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                  <p className="text-[8px] font-black text-[#C78200] uppercase tracking-widest">Investment Breakdown</p>
                  {[
                    { label: t.seedCount,          amount: n(form.seedCost),           color: 'bg-blue-400' },
                    { label: t.feed,                amount: n(form.feedCost),           color: 'bg-emerald-500' },
                    { label: t.medicine,      amount: n(form.medicineCost),       color: 'bg-amber-400' },
                    { label: t.laborWages,               amount: n(form.laborCost),          color: 'bg-purple-400' },
                    { label: t.gridPowerBill,   amount: n(form.utilityCost),        color: 'bg-orange-400' },
                    { label: t.infrastructurePower,      amount: n(form.infrastructureCost), color: 'bg-slate-400' },
                    { label: t.otherTesting,               amount: n(form.otherCost),          color: 'bg-pink-400' },
                  ].filter(e => e.amount > 0).map((e, i) => (
                    <SpendBar key={i} label={e.label} amount={e.amount} total={totalInvested} color={e.color} isDark={isDark} />
                  ))}
                </div>

                {/* Survival & Grade */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: t.survival, value: `${form.survivalRate}%`, color: 'text-emerald-500', bar: 'bg-emerald-500', pct: form.survivalRate },
                    { label: 'Grade A',   value: `${form.gradeA}%`,       color: 'text-[#C78200]',  bar: 'bg-[#C78200]',  pct: form.gradeA },
                  ].map((m, i) => (
                    <div key={i} className={cn('rounded-[1.8rem] p-4 border', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                      <p className={cn('text-[7px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/25' : 'text-slate-400')}>{m.label}</p>
                      <p className={cn('text-2xl font-black tracking-tighter', m.color)}>{m.value}</p>
                      <div className={cn('mt-2 h-1 rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-slate-100')}>
                        <div className={cn('h-full rounded-full', m.bar)} style={{ width: `${m.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Buyer / notes */}
                {(form.buyerName || form.notes) && (
                  <div className={cn('rounded-[2rem] p-4 border', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-slate-50 border-slate-100')}>
                    {form.buyerName && (
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 size={14} className="text-[#C78200]" />
                        <p className={cn('font-black text-[11px]', isDark ? 'text-white' : 'text-slate-900')}>{form.buyerName}</p>
                      </div>
                    )}
                    {form.notes && (
                      <p className={cn('text-[9px] font-medium leading-relaxed italic', isDark ? 'text-white/30' : 'text-slate-400')}>"{form.notes}"</p>
                    )}
                  </div>
                )}

                {/* Save button */}
                <button
                  onClick={handleSave}
                  className="w-full py-5 bg-gradient-to-br from-[#0D523C] to-[#1a7a5a] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  <CheckCircle2 size={20} />
                  {t.save} {t.profileSummary}
                </button>
              </div>
            )}

            {/* ── NAVIGATION BUTTONS (steps 1–3) ── */}
            {step < 4 && (
              <div className="space-y-3 pt-2 pb-6">
                {/* Step validation error summary */}
                {showStepErrors && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className={cn('rounded-2xl p-4 border flex items-start gap-3',
                      isDark ? 'bg-red-500/10 border-red-500/25' : 'bg-red-50 border-red-200'
                    )}
                  >
                    <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className={cn('text-[8px] font-black uppercase tracking-widest mb-1',
                        isDark ? 'text-red-400' : 'text-red-700'
                      )}>{t.fillRequiredFields}</p>
                      {(step === 1 ? step1Errors : step3Errors).map((err, i) => (
                        <p key={i} className={cn('text-[9px] font-medium', isDark ? 'text-red-300/70' : 'text-red-700/80')}>
                          • {err}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-3">
                  {step > 1 && (
                    <button
                      onClick={() => { setStep(s => s - 1); setShowStepErrors(false); }}
                      className={cn(
                        'flex-1 py-4 rounded-[1.5rem] font-black text-[9px] uppercase tracking-widest border transition-all active:scale-95',
                        isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
                      )}
                    >
                      <ChevronLeft size={14} className="inline -mt-0.5 mr-1" />
                      {t.back}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (step === 1 && !step1Valid) { setShowStepErrors(true); return; }
                      if (step === 3 && !step3Valid) { setShowStepErrors(true); return; }
                      setShowStepErrors(false);
                      setStep(s => s + 1);
                    }}
                    className="flex-1 py-4 bg-gradient-to-r from-[#C78200] to-[#a06600] text-white rounded-[1.5rem] font-black text-[9px] uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {t.continue} <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
