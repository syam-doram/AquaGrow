import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Fish,
  Wheat,
  Pill,
  Zap,
  Users,
  Wrench,
  PackageCheck,
  TrendingUp,
  BarChart2,
  Scale,
  Wallet,
  FileText,
  Calendar,
  Building2,
  DollarSign,
  Percent,
  Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { useData } from '../context/DataContext';
import { Header } from '../components/Header';
import { Translations } from '../translations';

type FormData = {
  pondId: string;
  harvestDate: string;
  harvestWeightKg: string;
  countPerKg: string;
  survivalRate: string;
  gradeA: string;
  gradeB: string;
  // investments
  seedCost: string;
  feedCost: string;
  medicineCost: string;
  laborCost: string;
  utilityCost: string;
  infrastructureCost: string;
  otherCost: string;
  cultureDays: string;
  // revenue
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

// ─── FIELD INPUT ─────────────────────────────────────────────────────────────
const Field = ({
  label, value, onChange, type = 'text', placeholder = '', icon: Icon, unit,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; icon?: any; unit?: string;
}) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#C78200] px-1">{label}</label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#4A2C2A]/20">
          <Icon size={18} />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full bg-white border border-black/5 rounded-[1.6rem] py-5 pr-5 text-sm font-black text-[#4A2C2A] placeholder:text-slate-200 outline-none focus:border-[#C78200]/40 transition-all shadow-sm',
          Icon ? 'pl-12' : 'pl-5'
        )}
      />
      {unit && (
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#4A2C2A]/30 uppercase tracking-widest">
          {unit}
        </span>
      )}
    </div>
  </div>
);

// ─── METRIC TILE (for summary) ────────────────────────────────────────────────
const MetricTile = ({
  label, value, sub, color = 'text-[#4A2C2A]', bg = 'bg-white', icon: Icon,
}: any) => (
  <div className={cn('rounded-[1.8rem] p-5 border border-black/5 shadow-sm', bg)}>
    {Icon && (
      <div className={cn('w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center mb-3', color)}>
        <Icon size={16} />
      </div>
    )}
    <p className="text-[8px] font-black uppercase tracking-widest text-[#4A2C2A]/30 mb-1">{label}</p>
    <p className={cn('font-black text-xl tracking-tighter', color)}>{value}</p>
    {sub && <p className="text-[8px] font-bold text-[#4A2C2A]/30 mt-0.5">{sub}</p>}
  </div>
);

// ─── SPEND BAR ────────────────────────────────────────────────────────────────
const SpendBar = ({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) => {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <p className="text-[10px] font-black text-[#4A2C2A]/60 uppercase tracking-widest">{label}</p>
        <p className="text-[11px] font-black text-[#4A2C2A]">₹{amount.toLocaleString()}</p>
      </div>
      <div className="h-2 bg-black/5 rounded-full overflow-hidden">
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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export const ROIEntry = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { ponds } = useData();
  const activePonds = ponds.filter(p => p.status === 'active' || p.status === 'harvested');

  const STEPS = [
    { id: 1, title: t.harvestDetails,  subtitle: t.whatDidYouHarvest,          icon: Fish },
    { id: 2, title: t.investments,      subtitle: t.whatDidYouSpend,             icon: Wallet },
    { id: 3, title: t.revenueEarned,   subtitle: t.whatDidYouReceive,           icon: TrendingUp },
    { id: 4, title: t.profileSummary,  subtitle: t.yourROIAnalysis,               icon: BarChart2 },
  ];

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({ ...EMPTY, pondId: activePonds[0]?.id || '' });
  const [saved, setSaved] = useState(false);

  const set = (key: keyof FormData) => (v: string) => setForm(f => ({ ...f, [key]: v }));
  const n = (v: string) => parseFloat(v) || 0;

  const totalInvested =
    n(form.seedCost) + n(form.feedCost) + n(form.medicineCost) +
    n(form.laborCost) + n(form.utilityCost) + n(form.infrastructureCost) + n(form.otherCost);

  const totalRevenue = n(form.saleAmountTotal) + n(form.subsidyAmount);
  const netProfit = totalRevenue - totalInvested;
  const roi = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
  const costPerKg = n(form.harvestWeightKg) > 0 ? totalInvested / n(form.harvestWeightKg) : 0;
  const revenuePerKg = n(form.harvestWeightKg) > 0 ? totalRevenue / n(form.harvestWeightKg) : 0;
  const profitPerKg = revenuePerKg - costPerKg;

  const handleSave = () => {
    setSaved(true);
    const existing = JSON.parse(localStorage.getItem('roi_entries') || '[]');
    existing.push({ ...form, savedAt: new Date().toISOString(), totalInvested, totalRevenue, netProfit, roi });
    localStorage.setItem('roi_entries', JSON.stringify(existing));
    setTimeout(() => navigate('/roi-report'), 2200);
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FE] font-sans pb-[180px]">

      {/* SUCCESS OVERLAY */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0D523C]/97 backdrop-blur-xl flex flex-col items-center justify-center text-white p-10 text-center"
          >
            <motion.div
              initial={{ scale: 0.4, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 10 }}
              className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center text-emerald-500 shadow-2xl mb-8"
            >
              <CheckCircle2 size={60} />
            </motion.div>
            <h3 className="text-3xl font-black tracking-tighter mb-2">{t.roiProfileSaved}</h3>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{t.redirectingDashboard}</p>
            <div className="mt-8 flex items-center gap-3">
              <div className="px-5 py-2.5 bg-white/10 rounded-2xl border border-white/10">
                <p className="font-black text-sm">ROI: <span className={roi >= 0 ? 'text-emerald-300' : 'text-red-300'}>{roi.toFixed(1)}%</span></p>
              </div>
              <div className="px-5 py-2.5 bg-white/10 rounded-2xl border border-white/10">
                <p className="font-black text-sm">Net: <span className="text-emerald-300">₹{netProfit.toLocaleString()}</span></p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <Header 
        title={t.postHarvestROI} 
        showBack={true}
        onBack={() => step === 1 ? navigate(-1) : setStep(s => s - 1)}
        rightElement={<div className="w-10" />}
      />

      {/* STEP PROGRESS PILLS */}
      <div className="fixed top-[72px] left-0 right-0 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-md px-5 py-3 flex gap-2 border-b border-black/5">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={cn(
              'flex-1 h-1.5 rounded-full transition-all duration-500',
              step >= s.id ? 'bg-[#C78200]' : 'bg-black/5'
            )}
          />
        ))}
      </div>

      <div className="pt-36 px-5 space-y-6">

        {/* STEP TITLE */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
          >
            {/* Step header */}
            <div className="mb-6">
              <div className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg',
                step === 1 ? 'bg-blue-500' : step === 2 ? 'bg-red-500' : step === 3 ? 'bg-emerald-500' : 'bg-[#C78200]'
              )}>
                {React.createElement(STEPS[step - 1].icon, { size: 24, className: 'text-white' })}
              </div>
              <h2 className="text-2xl font-black tracking-tighter text-[#4A2C2A]">{STEPS[step - 1].title}</h2>
              <p className="text-[#4A2C2A]/40 text-[10px] font-black uppercase tracking-widest mt-1">{STEPS[step - 1].subtitle}</p>
            </div>

            {/* ── STEP 1: Harvest Details ── */}
            {step === 1 && (
              <div className="space-y-5">
                {/* Pond selector */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#C78200] px-1">{t.selectCulturePond}</label>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {activePonds.length > 0 ? activePonds.map(p => (
                      <button
                        key={p.id}
                        onClick={() => set('pondId')(p.id)}
                        className={cn(
                          'flex-shrink-0 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all',
                          form.pondId === p.id
                            ? 'bg-[#C78200] text-white border-[#C78200] shadow-lg'
                            : 'bg-white text-[#4A2C2A]/40 border-black/5'
                        )}
                      >{p.name}</button>
                    )) : (
                      <p className="text-[10px] font-black text-[#4A2C2A]/30 uppercase tracking-widest">No ponds available</p>
                    )}
                  </div>
                </div>

                <Field label={t.stockingDate} value={form.harvestDate} onChange={set('harvestDate')} type="date" icon={Calendar} />
                <Field label={t.totalHarvestWeight} value={form.harvestWeightKg} onChange={set('harvestWeightKg')} type="number" placeholder="e.g. 1200" icon={Scale} unit={t.kg} />
                <Field label={t.countPerKgSize} value={form.countPerKg} onChange={set('countPerKg')} type="number" placeholder="e.g. 40" icon={Fish} unit="/kg" />
                <Field label={t.survival} value={form.survivalRate} onChange={set('survivalRate')} type="number" placeholder="e.g. 80" icon={Percent} unit="%" />
                <Field label={t.cultureDuration} value={form.cultureDays} onChange={set('cultureDays')} type="number" placeholder="e.g. 90" icon={Calendar} unit={t.days} />

                {/* Grade split */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#C78200] px-1">{t.gradeSplit}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t.gradeAYield} value={form.gradeA} onChange={set('gradeA')} type="number" placeholder="85" unit="%" />
                    <Field label={t.gradeBYield} value={form.gradeB} onChange={set('gradeB')} type="number" placeholder="15" unit="%" />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Investments ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="bg-red-50 rounded-[1.5rem] p-4 border border-red-100">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{t.whatDidYouSpend}</p>
                </div>
                <Field label={t.seedPlsCost} value={form.seedCost} onChange={set('seedCost')} type="number" placeholder="0" icon={Fish} unit="₹" />
                <Field label={t.feedCostLabel} value={form.feedCost} onChange={set('feedCost')} type="number" placeholder="0" icon={Wheat} unit="₹" />
                <Field label={t.medicineProbiotics} value={form.medicineCost} onChange={set('medicineCost')} type="number" placeholder="0" icon={Pill} unit="₹" />
                <Field label={t.laborWages} value={form.laborCost} onChange={set('laborCost')} type="number" placeholder="0" icon={Users} unit="₹" />
                <Field label={t.gridPowerBill} value={form.utilityCost} onChange={set('utilityCost')} type="number" placeholder="0" icon={Zap} unit="₹" />
                <Field label={t.infrastructurePower} value={form.infrastructureCost} onChange={set('infrastructureCost')} type="number" placeholder="0" icon={Building2} unit="₹" />
                <Field label={t.otherTesting} value={form.otherCost} onChange={set('otherCost')} type="number" placeholder="0" icon={PackageCheck} unit="₹" />

                {/* Live total */}
                {totalInvested > 0 && (
                  <div className="bg-[#4A2C2A] rounded-[1.8rem] p-5 text-white flex justify-between items-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{t.totalInvestment}</p>
                    <p className="font-black text-2xl tracking-tighter">₹{totalInvested.toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: Revenue ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="bg-emerald-50 rounded-[1.5rem] p-4 border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t.whatDidYouReceive}</p>
                </div>
                <Field label={t.totalSaleAmount} value={form.saleAmountTotal} onChange={set('saleAmountTotal')} type="number" placeholder="0" icon={DollarSign} unit="₹" />
                <Field label={t.pricePerKgReceived} value={form.pricePerKg} onChange={set('pricePerKg')} type="number" placeholder="e.g. 380" icon={TrendingUp} unit="₹/kg" />
                <Field label={t.buyerCompanyName} value={form.buyerName} onChange={set('buyerName')} placeholder="e.g. Global Seafood Ltd." icon={Building2} />
                <Field label={t.subsidyGovtSupport} value={form.subsidyAmount} onChange={set('subsidyAmount')} type="number" placeholder="0" icon={Star} unit="₹" />
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#C78200] px-1">{t.additionalNotes}</label>
                  <div className="relative">
                    <FileText size={18} className="absolute left-5 top-5 text-[#4A2C2A]/20" />
                    <textarea
                      value={form.notes}
                      onChange={e => set('notes')(e.target.value)}
                      placeholder="Market conditions, deductions, remarks…"
                      className="w-full bg-white border border-black/5 rounded-[1.6rem] py-5 pl-12 pr-5 text-sm font-black text-[#4A2C2A] placeholder:text-slate-200 outline-none focus:border-[#C78200]/40 transition-all shadow-sm h-28 resize-none"
                    />
                  </div>
                </div>

                {/* Live P&L preview */}
                {totalRevenue > 0 && (
                  <div className={cn(
                    'rounded-[1.8rem] p-5 flex justify-between items-center',
                    netProfit >= 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                  )}>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/60">{t.netProfitLoss}</p>
                      <p className="font-black text-2xl tracking-tighter">
                        {netProfit >= 0 ? '+' : '-'}₹{Math.abs(netProfit).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/60">ROI</p>
                      <p className="font-black text-2xl tracking-tighter">{roi.toFixed(1)}%</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 4: ROI Profile Summary ── */}
            {step === 4 && (
              <div className="space-y-5">

                {/* Hero ROI card */}
                <div className={cn(
                  'rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl',
                  roi >= 40 ? 'bg-gradient-to-br from-[#0D523C] to-[#1a7a5a]' :
                  roi >= 0  ? 'bg-gradient-to-br from-[#C78200] to-[#8a5900]' :
                              'bg-gradient-to-br from-red-700 to-red-900'
                )}>
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 blur-[60px] rounded-full" />
                  <div className="relative z-10">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">{t.postHarvestROI} Profile</p>
                    <p className="text-white/60 text-xs font-black mb-4">
                      {form.buyerName || t.harvest + ' Cycle'} · {form.harvestDate}
                    </p>
                    <div className="flex items-baseline gap-3 mb-8">
                      <p className="text-6xl font-black tracking-tighter">{roi.toFixed(1)}<span className="text-2xl text-white/40 ml-1">%</span></p>
                      <span className={cn('text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border',
                        roi >= 40 ? 'bg-emerald-400/20 border-emerald-400/30 text-emerald-200' :
                        roi >= 0  ? 'bg-white/20 border-white/20 text-white' :
                                    'bg-red-400/20 border-red-400/30 text-red-200'
                      )}>
                        {roi >= 40 ? `🏆 ${t.excellent}` : roi >= 20 ? `✅ ${t.good}` : roi >= 0 ? `⚠️ ${t.breakEven}` : `🔴 ${t.lossCycle}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-6 border-t border-white/10 pt-6">
                      <div>
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">{t.totalInvestment}</p>
                        <p className="text-xl font-black">₹{(totalInvested / 100000).toFixed(2)}L</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">{t.totalAmount}</p>
                        <p className="text-xl font-black">₹{(totalRevenue / 100000).toFixed(2)}L</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">{t.netProfitLoss}</p>
                        <p className={cn('text-xl font-black', netProfit >= 0 ? 'text-emerald-300' : 'text-red-300')}>
                          {netProfit >= 0 ? '+' : ''}₹{(netProfit / 100000).toFixed(2)}L
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Profit / kg</p>
                        <p className={cn('text-xl font-black', profitPerKg >= 0 ? 'text-emerald-300' : 'text-red-300')}>
                          ₹{profitPerKg.toFixed(0)}/kg
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Harvest Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <MetricTile label={t.harvest} value={`${n(form.harvestWeightKg).toLocaleString()} kg`} icon={Scale} color="text-blue-500" />
                  <MetricTile label={t.countPerKgSize} value={`${form.countPerKg || '—'}/kg`} icon={Fish} color="text-emerald-500" />
                  <MetricTile label="DOC" value={`${form.cultureDays} days`} icon={Calendar} color="text-[#C78200]" />
                </div>

                {/* Per-kg economics */}
                <div className="bg-white rounded-[2rem] p-6 border border-black/5 shadow-sm">
                  <p className="text-[9px] font-black text-[#C78200] uppercase tracking-widest mb-4">Per-kg Economics</p>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Cost/kg',    value: `₹${costPerKg.toFixed(0)}`,    sub: 'production cost', color: 'text-red-500' },
                      { label: 'Price/kg',   value: `₹${revenuePerKg.toFixed(0)}`, sub: 'sale price',       color: 'text-[#C78200]' },
                      { label: 'Profit/kg',  value: `₹${profitPerKg.toFixed(0)}`,  sub: 'margin',           color: profitPerKg >= 0 ? 'text-emerald-600' : 'text-red-500' },
                    ].map((m, i) => (
                      <div key={i} className="text-center">
                        <p className="text-[7px] font-black text-[#4A2C2A]/30 uppercase tracking-widest">{m.label}</p>
                        <p className={cn('font-black text-lg tracking-tighter mt-1', m.color)}>{m.value}</p>
                        <p className="text-[7px] font-black text-[#4A2C2A]/20 uppercase tracking-widest mt-0.5">{m.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Investment breakdown bars */}
                <div className="bg-white rounded-[2rem] p-6 border border-black/5 shadow-sm space-y-4">
                  <p className="text-[9px] font-black text-[#C78200] uppercase tracking-widest">Investment Breakdown</p>
                  {[
                    { label: t.seedCount,       amount: n(form.seedCost),           color: 'bg-blue-400' },
                    { label: t.feed,              amount: n(form.feedCost),           color: 'bg-emerald-500' },
                    { label: t.medicine,    amount: n(form.medicineCost),       color: 'bg-amber-400' },
                    { label: t.laborWages,             amount: n(form.laborCost),          color: 'bg-purple-400' },
                    { label: t.gridPowerBill, amount: n(form.utilityCost),        color: 'bg-orange-400' },
                    { label: t.infrastructurePower,    amount: n(form.infrastructureCost), color: 'bg-slate-400' },
                    { label: t.otherTesting,             amount: n(form.otherCost),          color: 'bg-pink-400' },
                  ].filter(e => e.amount > 0).map((e, i) => (
                    <div key={i}>
                      <SpendBar label={e.label} amount={e.amount} total={totalInvested} color={e.color} />
                    </div>
                  ))}
                </div>

                {/* Survival & Quality */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-[2rem] p-5 border border-black/5 shadow-sm">
                    <p className="text-[8px] font-black text-[#4A2C2A]/30 uppercase tracking-widest mb-2">{t.survival}</p>
                    <p className="text-3xl font-black text-emerald-500 tracking-tighter">{form.survivalRate}%</p>
                    <div className="mt-3 h-1.5 bg-black/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${form.survivalRate}%` }} />
                    </div>
                  </div>
                  <div className="bg-white rounded-[2rem] p-5 border border-black/5 shadow-sm">
                    <p className="text-[8px] font-black text-[#4A2C2A]/30 uppercase tracking-widest mb-2">Grade A</p>
                    <p className="text-3xl font-black text-[#C78200] tracking-tighter">{form.gradeA}%</p>
                    <div className="mt-3 h-1.5 bg-black/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#C78200] rounded-full" style={{ width: `${form.gradeA}%` }} />
                    </div>
                  </div>
                </div>

                {/* Buyer & notes */}
                {(form.buyerName || form.notes) && (
                  <div className="bg-[#F8F9FE] rounded-[2rem] p-5 border border-black/5">
                    {form.buyerName && (
                      <div className="flex items-center gap-3 mb-3">
                        <Building2 size={16} className="text-[#C78200]" />
                        <p className="font-black text-sm text-[#4A2C2A]">{form.buyerName}</p>
                      </div>
                    )}
                    {form.notes && (
                      <p className="text-[10px] text-[#4A2C2A]/50 font-medium leading-relaxed italic">"{form.notes}"</p>
                    )}
                  </div>
                )}

                {/* Save button */}
                <button
                  onClick={handleSave}
                  className="w-full py-6 bg-[#0D523C] text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <CheckCircle2 size={20} /> {t.save} ROI Profile
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* NAVIGATION BUTTONS (steps 1-3) */}
        {step < 4 && (
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-5 bg-white border border-black/5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest text-[#4A2C2A]/40 active:scale-95 transition-all"
              >
                {t.back}
              </button>
            )}
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 py-5 bg-[#C78200] text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {t.continue} <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
