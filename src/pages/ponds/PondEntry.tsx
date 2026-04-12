import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Target, ArrowRight, Clock, Waves, Layers, Zap, Info,
  Fish, CheckCircle2, MapPin, Droplets, BarChart2, Wind, IndianRupee,
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

// ─── STYLED INPUT ─────────────────────────────────────────────────────────────
const FieldInput = ({
  label, icon: Icon, value, onChange, placeholder, type = 'text', suffix, min, required, isDark,
}: {
  label: string; icon: React.ElementType; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; suffix?: string; min?: string; required?: boolean; isDark: boolean;
}) => (
  <div className="space-y-1.5">
    <label className={cn("text-[8px] font-black uppercase tracking-[0.2em] ml-1 flex items-center gap-1", isDark ? "text-white/30" : "text-slate-400")}>
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative group">
      <div className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", isDark ? "text-white/20 group-focus-within:text-[#C78200]" : "text-slate-300 group-focus-within:text-[#C78200]")}>
        <Icon size={15} />
      </div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        placeholder={placeholder}
        className={cn(
          "w-full pl-11 pr-5 py-3 rounded-2xl border outline-none transition-all text-xs font-bold placeholder:opacity-30",
          suffix ? "pr-14" : "pr-5",
          isDark
            ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#C78200]/40 focus:bg-white/8"
            : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#C78200] focus:bg-white shadow-inner"
        )}
      />
      {suffix && (
        <span className={cn("absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/20" : "text-slate-400")}>{suffix}</span>
      )}
    </div>
  </div>
);

// ─── SELECT FIELD ─────────────────────────────────────────────────────────────
const FieldSelect = ({
  label, icon: Icon, value, onChange, children, isDark,
}: {
  label: string; icon: React.ElementType; value: string; onChange: (v: string) => void;
  children: React.ReactNode; isDark: boolean;
}) => (
  <div className="space-y-1.5">
    <label className={cn("text-[8px] font-black uppercase tracking-[0.2em] ml-1", isDark ? "text-white/30" : "text-slate-400")}>{label}</label>
    <div className="relative">
      <div className={cn("absolute left-4 top-1/2 -translate-y-1/2", isDark ? "text-white/20" : "text-slate-300")}>
        <Icon size={15} />
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          "w-full pl-11 pr-10 py-3 rounded-2xl border outline-none transition-all text-xs font-bold appearance-none",
          isDark
            ? "bg-white/5 border-white/10 text-white focus:border-[#C78200]/40"
            : "bg-slate-50 border-slate-200 text-slate-800 focus:border-[#C78200] shadow-inner"
        )}
      >
        {children}
      </select>
      <div className={cn("absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none", isDark ? "text-white/20" : "text-slate-400")}>
        <ChevronLeft size={12} className="-rotate-90" />
      </div>
    </div>
  </div>
);

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
const SectionCard = ({
  title, subtitle, icon: Icon, iconBg, children, isDark,
}: {
  title: string; subtitle: string; icon: React.ElementType; iconBg: string; children: React.ReactNode; isDark: boolean;
}) => (
  <div className={cn("rounded-[2rem] p-5 border space-y-4", isDark ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm")}>
    <div className="flex items-center gap-3 pb-1">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", iconBg)}>
        <Icon size={17} />
      </div>
      <div>
        <h2 className={cn("text-[11px] font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>{title}</h2>
        <p className={cn("text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/25" : "text-slate-400")}>{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
);

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export const PondEntry = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { addPond, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    name: '',
    species: 'Vannamei',
    size: '',
    seedCount: '',
    seedCost: '',
    stockingDate: new Date().toISOString().split('T')[0],
    plAge: '12',
    waterType: 'Borewell',
    initialSalinity: '5',
    seedSource: 'Local Hatchery',
    stockingMode: 'stocked' as 'planned' | 'stocked',
    aeratorCount: '',
    aeratorHp: '1',
  });


  const set = (key: keyof typeof form) => (v: string) => setForm(prev => ({ ...prev, [key]: v }));
  const isStocked = form.stockingMode === 'stocked';

  // ── Live-calculated preview values ──
  const preview = useMemo(() => {
    const size = parseFloat(form.size) || 0;
    const seedCount = parseInt(form.seedCount.replace(/,/g, '')) || 0;
    const densityPerSqm = size > 0 ? (seedCount / (size * 4046.86)).toFixed(0) : '—';
    const estBiomassAt90 = seedCount > 0 ? ((seedCount * 0.8 * 20) / 1e6).toFixed(2) : '—'; // T at DOC90 @20g
    const estRevenue     = seedCount > 0 ? ((seedCount * 0.8 * 0.020) * 450).toFixed(0) : '—'; // ₹ @ ₹450/kg
    return { densityPerSqm, estBiomassAt90, estRevenue };
  }, [form.size, form.seedCount]);

  const isValid = form.name.trim() && parseFloat(form.size) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      await addPond({
        userId: 'local_user',
        name: form.name,
        size: parseFloat(form.size),
        species: form.species as 'Vannamei' | 'Tiger',
        seedCount: parseInt(form.seedCount.replace(/,/g, '')),
        seedCost: parseFloat(form.seedCost) || 0,
        plAge: parseInt(form.plAge),
        stockingDate: form.stockingDate,
        status: isStocked ? 'active' : 'planned',
        seedSource: form.seedSource,
        waterType: form.waterType,
        initialSalinity: parseInt(form.initialSalinity),
        isStocked,
        // Initial aerator setup if provided
        ...(form.aeratorCount && parseInt(form.aeratorCount) > 0 ? {
          aerators: {
            count: parseInt(form.aeratorCount),
            hp: parseFloat(form.aeratorHp) || 1,
            positions: [],
            addedNew: false,
            lastUpdated: new Date().toISOString(),
            lastDoc: 0,
            log: [{
              doc: 0,
              date: new Date().toISOString(),
              count: parseInt(form.aeratorCount),
              hp: parseFloat(form.aeratorHp) || 1,
              positions: [],
              addedNew: false,
              notes: 'Initial aerator setup at pond creation',
            }],
          }
        } : {}),
      } as any);

      setDone(true);
      setTimeout(() => navigate('/ponds'), 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen selection:bg-[#C78200]/20", isDark ? "bg-[#070D12]" : "bg-[#F0F4F8]")}>

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={cn("absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse", isDark ? "bg-[#C78200]/8" : "bg-[#C78200]/5")} />
        <div className={cn("absolute top-[20%] -right-[10%] w-[35%] h-[35%] rounded-full blur-[120px]", isDark ? "bg-blue-500/8" : "bg-blue-500/5")} />
      </div>

      {/* ── STICKY HEADER ── */}
      <header className={cn(
        "fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 backdrop-blur-xl px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center justify-between border-b transition-all",
        isDark ? "bg-[#070D12]/90 border-white/5" : "bg-white/90 border-slate-100 shadow-sm"
      )}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
          className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border", isDark ? "bg-white/5 border-white/10 text-white/70" : "bg-white border-slate-200 text-slate-600 shadow-sm")}
        >
          <ChevronLeft size={18} />
        </motion.button>
        <div className="text-center">
          <h1 className={cn("text-xs font-black tracking-tight uppercase", isDark ? "text-white" : "text-slate-900")}>{t.newPondEntry}</h1>
          <p className={cn("text-[8px] font-black uppercase tracking-widest mt-0.5", isDark ? "text-white/30" : "text-slate-400")}>{t.pondRegistration}</p>
        </div>
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border", isDark ? "bg-[#C78200]/10 border-[#C78200]/20 text-[#C78200]" : "bg-amber-50 border-amber-200 text-amber-600")}>
          <Waves size={18} className="animate-pulse" />
        </div>
      </header>

      {/* ── SUCCESS OVERLAY ── */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className={cn("rounded-[2.5rem] p-8 text-center border shadow-2xl w-72", isDark ? "bg-[#0D1A13] border-emerald-500/20" : "bg-white border-emerald-200")}
            >
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-white" />
              </div>
              <p className={cn("font-black text-xl tracking-tight mb-1", isDark ? "text-white" : "text-slate-900")}>{t.success}!</p>
              <p className={cn("text-[9px] font-black uppercase tracking-widest", isDark ? "text-emerald-400" : "text-emerald-600")}>
                {form.name} · {isStocked ? t.activeculture : t.statusPlanned}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-md mx-auto pt-24 pb-36 px-4 relative z-10 space-y-4">

        {/* ── MODE TOGGLE ── */}
        <div className={cn("p-1.5 rounded-[1.8rem] border flex gap-1 shadow-sm", isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200")}>
          {([
            { key: 'planned', label: t.preStockingPreparation, icon: Clock, color: 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/20' },
            { key: 'stocked', label: t.activeStocking,         icon: Zap,   color: 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-600/20' },
          ] as const).map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => set('stockingMode')(opt.key)}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-[1.4rem] text-[8px] font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-1.5",
                form.stockingMode === opt.key
                  ? `${opt.color} text-white shadow-md scale-[1.02]`
                  : isDark ? "text-white/30 hover:text-white/50" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <opt.icon size={12} strokeWidth={3} />
              {opt.label}
            </button>
          ))}
        </div>

        {/* Guidance strip */}
        <AnimatePresence mode="wait">
          <motion.div
            key={form.stockingMode}
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className={cn(
              "px-4 py-3 rounded-2xl border text-[9px] font-bold leading-snug flex items-start gap-3",
              isStocked
                ? isDark ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-300/70" : "bg-emerald-50 border-emerald-100 text-emerald-700"
                : isDark ? "bg-blue-500/5 border-blue-500/15 text-blue-300/70" : "bg-blue-50 border-blue-100 text-blue-700"
            )}
          >
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            {isStocked ? t.activeGuidance : t.prepGuidance}
          </motion.div>
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── PRIMARY DETAILS ── */}
          <SectionCard title={t.primaryDetails} subtitle="Base identity" icon={Layers} iconBg={isDark ? "bg-indigo-500/15 text-indigo-400" : "bg-indigo-100 text-indigo-600"} isDark={isDark}>
            <FieldInput label={t.pondName} icon={Layers} value={form.name} onChange={set('name')} placeholder="e.g. North Sector Pond A" required isDark={isDark} />
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label={t.pondSize} icon={Target} value={form.size} onChange={set('size')} placeholder="0.5" suffix="ACRES" type="number" required isDark={isDark} />
              <FieldSelect label={t.species} icon={Fish} value={form.species} onChange={set('species')} isDark={isDark}>
                <option value="Vannamei">🦐 Vannamei</option>
                <option value="Tiger">🐯 Tiger</option>
              </FieldSelect>
            </div>
            <FieldInput label={t.seedSource} icon={MapPin} value={form.seedSource} onChange={set('seedSource')} placeholder="Local Hatchery" isDark={isDark} />
          </SectionCard>

          {/* ── STOCKING ANALYTICS ── */}
          <SectionCard title={t.stockingAnalytics} subtitle="Growth markers" icon={Zap} iconBg={isDark ? "bg-orange-500/15 text-orange-400" : "bg-orange-100 text-orange-600"} isDark={isDark}>
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Seed Count" icon={Fish} value={form.seedCount} onChange={set('seedCount')} placeholder="e.g. 50,000" isDark={isDark} />
              <FieldInput label="1 Seed Cost (per PL)" icon={IndianRupee} value={form.seedCost} onChange={set('seedCost')} placeholder="e.g. 0.85" suffix="₹" type="number" isDark={isDark} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={cn("text-[8px] font-black uppercase tracking-[0.2em] ml-1 flex items-center gap-1", isDark ? "text-white/30" : "text-slate-400")}>
                  {t.stockingDate} {isStocked && <span className="text-emerald-400">*</span>}
                </label>
                <input
                  type="date"
                  value={form.stockingDate}
                  onChange={e => set('stockingDate')(e.target.value)}
                  min={form.stockingMode === 'planned'
                    ? new Date().toISOString().split('T')[0]
                    : (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]; })()
                  }
                  max={form.stockingMode === 'planned'
                    ? (() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().split('T')[0]; })()
                    : new Date().toISOString().split('T')[0]
                  }
                  className={cn(
                    "w-full pl-4 pr-3 py-3 rounded-2xl border outline-none transition-all text-xs font-bold",
                    isDark
                      ? "bg-white/5 border-white/10 text-white focus:border-[#C78200]/40 focus:bg-white/8"
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-[#C78200] focus:bg-white shadow-inner"
                  )}
                />
                {isStocked ? (
                  <p className={cn("text-[7px] font-bold ml-1", isDark ? "text-emerald-500/60" : "text-emerald-600/70")}>
                    ↩ Up to 7 days back allowed
                  </p>
                ) : (
                  <p className={cn("text-[7px] font-bold ml-1", isDark ? "text-blue-400/60" : "text-blue-600/70")}>
                    ↑ Planned: select up to 5 days ahead
                  </p>
                )}
              </div>
              <FieldInput label={t.plAge} icon={Target} value={form.plAge} onChange={set('plAge')} placeholder="12" suffix="DAYS" isDark={isDark} />
            </div>


            {/* Live Preview Card */}
            <AnimatePresence>
              {(parseFloat(form.size) > 0 || parseInt(form.seedCount) > 0) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className={cn("rounded-2xl overflow-hidden border", isDark ? "bg-[#C78200]/5 border-[#C78200]/20" : "bg-amber-50 border-amber-200")}
                >
                  <div className={cn("px-4 py-2 border-b flex items-center gap-2", isDark ? "border-[#C78200]/10" : "border-amber-100")}>
                    <BarChart2 size={12} className="text-[#C78200]" />
                    <p className="text-[7px] font-black uppercase tracking-widest text-[#C78200]">{t.liveYieldPreview}</p>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-amber-200/30 px-0">
                    {[
                      { label: t.densityM2, value: preview.densityPerSqm },
                      { label: t.estBiomass, value: preview.estBiomassAt90 !== '—' ? `${preview.estBiomassAt90}T` : '—' },
                      { label: t.estRevenue, value: preview.estRevenue !== '—' ? `₹${parseInt(preview.estRevenue).toLocaleString('en-IN')}` : '—' },
                    ].map((p, i) => (
                      <div key={i} className="py-3 text-center">
                        <p className={cn("font-black text-sm tracking-tighter", isDark ? "text-[#C78200]" : "text-amber-700")}>{p.value}</p>
                        <p className={cn("text-[6px] font-black uppercase tracking-widest mt-0.5", isDark ? "text-[#C78200]/40" : "text-amber-600/60")}>{p.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className={cn("text-[7px] font-bold leading-relaxed px-4 pb-3", isDark ? "text-white/20" : "text-slate-400")}>
                    {t.estimatesNote}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>

          {/* ── WATER FOUNDATION ── */}
          <SectionCard title={t.operationalData} subtitle="Water foundation" icon={Waves} iconBg={isDark ? "bg-cyan-500/15 text-cyan-400" : "bg-cyan-100 text-cyan-600"} isDark={isDark}>
            <div className="grid grid-cols-2 gap-3">
              <FieldSelect label={t.waterType} icon={Droplets} value={form.waterType} onChange={set('waterType')} isDark={isDark}>
                <option value="Borewell">{t.borewell}</option>
                <option value="Canal">{t.canal}</option>
                <option value="Creek">{t.creek}</option>
              </FieldSelect>
              <FieldInput label={t.initialSalinity} icon={Waves} value={form.initialSalinity} onChange={set('initialSalinity')} placeholder="5" suffix="PPT" isDark={isDark} />
            </div>

            {/* SOP tip */}
            <div className={cn("rounded-xl px-3.5 py-2.5 flex items-start gap-2 border", isDark ? "bg-white/3 border-white/5" : "bg-slate-50 border-slate-100")}>
              <Info size={12} className={cn("flex-shrink-0 mt-0.5", isDark ? "text-white/25" : "text-slate-400")} />
              <p className={cn("text-[8px] font-bold leading-relaxed", isDark ? "text-white/25" : "text-slate-400")}>
                Vannamei: Salinity 5–20 ppt optimal. Borewell water preferred for disease prevention.
              </p>
            </div>
          </SectionCard>

          {/* ── AERATOR SETUP (optional) ── */}
          <SectionCard title="Initial Aerator Setup" subtitle="Optional · can update later" icon={Wind} iconBg={isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-100 text-blue-600"} isDark={isDark}>
            {/* Recommended hint */}
            {parseFloat(form.size) > 0 && (
              <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border", isDark ? "bg-blue-500/8 border-blue-500/15" : "bg-blue-50 border-blue-200")}>
                <Zap size={12} className="text-blue-500 flex-shrink-0" />
                <p className={cn("text-[8px] font-black", isDark ? "text-blue-400" : "text-blue-700")}>
                  SOP Minimum: <strong>{Math.ceil(parseFloat(form.size) * 4)} aerators</strong> for {form.size} acres
                </p>
              </div>
            )}

            {/* Count + HP row */}
            <div className="grid grid-cols-2 gap-3">

              {/* Count stepper */}
              <div className="space-y-1.5">
                <label className={cn("text-[8px] font-black uppercase tracking-[0.2em] ml-1", isDark ? "text-white/30" : "text-slate-400")}>
                  Aerator Count
                </label>
                <div className={cn("flex items-center justify-between rounded-2xl border p-2", isDark ? "bg-white/3 border-white/8" : "bg-slate-50 border-slate-200")}>
                  <button type="button"
                    onClick={() => set('aeratorCount')(String(Math.max(0, parseInt(form.aeratorCount || '0') - 1)))}
                    className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg transition-all",
                      isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-white border border-slate-200 text-slate-700 shadow-sm"
                    )}>−</button>
                  <div className="text-center">
                    <span className={cn("text-2xl font-black tracking-tighter", isDark ? "text-white" : "text-slate-900")}>
                      {form.aeratorCount || '0'}
                    </span>
                    <p className={cn("text-[6px] font-black uppercase tracking-widest", isDark ? "text-white/20" : "text-slate-400")}>units</p>
                  </div>
                  <button type="button"
                    onClick={() => set('aeratorCount')(String(parseInt(form.aeratorCount || '0') + 1))}
                    className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg transition-all",
                      isDark ? "bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30" : "bg-blue-50 border border-blue-200 text-blue-600 shadow-sm"
                    )}>+</button>
                </div>
              </div>

              {/* HP selector */}
              <div className="space-y-1.5">
                <label className={cn("text-[8px] font-black uppercase tracking-[0.2em] ml-1", isDark ? "text-white/30" : "text-slate-400")}>
                  HP Per Aerator
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[0.5, 1, 1.5, 2, 3, 5].map(h => (
                    <button type="button" key={h}
                      onClick={() => set('aeratorHp')(String(h))}
                      className={cn("py-2 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all",
                        parseFloat(form.aeratorHp) === h
                          ? isDark ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-blue-100 border-blue-400 text-blue-700"
                          : isDark ? "bg-white/5 border-white/8 text-white/30" : "bg-white border-slate-200 text-slate-500"
                      )}
                    >{h}HP</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live total HP display */}
            {parseInt(form.aeratorCount || '0') > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className={cn("rounded-2xl border p-3", isDark ? "bg-white/3 border-white/5" : "bg-slate-50 border-slate-100")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wind size={13} className="text-blue-500" />
                    <p className={cn("text-[9px] font-black", isDark ? "text-white/60" : "text-slate-700")}>
                      {form.aeratorCount} × {form.aeratorHp} HP = <span className="text-blue-500">{(parseInt(form.aeratorCount) * parseFloat(form.aeratorHp || '1')).toFixed(1)} HP total</span>
                    </p>
                  </div>
                  {parseFloat(form.size) > 0 && (
                    <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-lg",
                      parseInt(form.aeratorCount) >= Math.ceil(parseFloat(form.size) * 4)
                        ? isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                        : isDark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-700"
                    )}>
                      {parseInt(form.aeratorCount) >= Math.ceil(parseFloat(form.size) * 4) ? '✓ SOP Met' : `Need ${Math.max(0, Math.ceil(parseFloat(form.size) * 4) - parseInt(form.aeratorCount))} more`}
                    </span>
                  )}
                </div>
                {parseFloat(form.size) > 0 && (
                  <p className={cn("text-[7px] font-medium mt-1", isDark ? "text-white/20" : "text-slate-400")}>
                    {(parseInt(form.aeratorCount) * parseFloat(form.aeratorHp || '1') / parseFloat(form.size)).toFixed(1)} HP/acre
                  </p>
                )}
              </motion.div>
            )}
          </SectionCard>

          {/* ── SUBMIT ── */}
          <motion.button
            type="submit"
            disabled={loading || !isValid}
            whileTap={{ scale: 0.97 }}
            className="group relative w-full py-5 bg-gradient-to-br from-[#C78200] to-[#A66C00] text-white rounded-[1.5rem] font-black text-[9px] uppercase tracking-[0.2em] shadow-xl shadow-[#C78200]/25 overflow-hidden disabled:opacity-40 transition-all"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <div className="relative flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t.processingEntry}
                </>
              ) : (
                <>
                  {t.completePondEntry}
                  <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </div>
          </motion.button>

          {!isValid && (
            <p className={cn("text-center text-[8px] font-black uppercase tracking-widest", isDark ? "text-white/20" : "text-slate-400")}>
              {t.fillPondContinue}
            </p>
          )}
        </form>
      </main>
    </div>
  );
};

