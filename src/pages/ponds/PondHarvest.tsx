import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Waves, CheckCircle2, TrendingUp, Target, Scale,
  DollarSign, User, ShoppingBag, Info, AlertTriangle, ShieldCheck,
  Clock, Home, Users, ChevronRight, FileText, Zap, Fish,
  IndianRupee, PackageCheck, AlignLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import { calculateDOC, calculateWeight } from '../../utils/pondUtils';
import type { Translations } from '../../translations';

// Self-harvest reason presets
const SELF_HARVEST_REASONS = [
  { label: 'Local Buyer',          desc: 'Sold directly to local buyers or cold storage',   icon: '🏪' },
  { label: 'Emergency Harvest',    desc: 'Disease risk, weather issue, or emergency',        icon: '🚨' },
  { label: 'Better Local Rate',    desc: 'Better price available in local market',           icon: '💰' },
  { label: 'Partial Harvest',      desc: 'Thinning harvest to reduce stocking density',      icon: '🔀' },
  { label: 'Family / Own Use',     desc: 'Personal consumption or family distribution',      icon: '🏠' },
  { label: 'Contracted Buyer',     desc: 'Pre-arranged sale to a contracted buyer',          icon: '📋' },
];

export const PondHarvest = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { ponds, updatePond, addHarvestRequest, theme } = useData();
  const pond = ponds.find(p => p.id === id);
  const isDark = theme === 'dark' || theme === 'midnight';

  if (!pond) return (
    <div className="p-10 text-center text-ink font-black uppercase tracking-widest bg-card min-h-screen">
      {t.pondNotFound}
    </div>
  );

  const currentDoc = calculateDOC(pond.stockingDate);
  const currentWeight = calculateWeight(currentDoc);

  // SOP readiness checks
  const abwCheck     = currentWeight >= 15;
  const docCheck     = currentDoc >= 70;
  const isIdealDoc   = currentDoc >= 90;
  const readinessChecks = [
    { label: 'Avg Body Weight ≥ 15g',      pass: abwCheck,   value: `${currentWeight.toFixed(1)}g`, detail: 'Minimum marketable size for Vannamei' },
    { label: 'Culture Age ≥ 70 DOC',       pass: docCheck,   value: `DOC ${currentDoc}`,            detail: 'Early harvest reduces biomass and price' },
    { label: 'Ideal Window ≥ 90 DOC',      pass: isIdealDoc, value: isIdealDoc ? 'Ready' : `${90 - currentDoc}d left`, detail: 'Premium rates at 20–25g ABW' },
  ];
  const passCount       = readinessChecks.filter(r => r.pass).length;
  const readinessGrade  = passCount === 3 ? 'Ready' : passCount === 2 ? 'Acceptable' : 'Too Early';
  const readinessColor  = passCount === 3 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : passCount === 2 ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-red-600 bg-red-50 border-red-200';

  // ── Harvest Mode: 'market' | 'self' ──
  const [harvestMode, setHarvestMode] = useState<'market' | 'self'>('market');

  // Market sale form
  const [formData, setFormData] = useState({
    harvestType: 'full',
    avgWeight: currentWeight.toString(),
    totalBiomass: ((parseFloat(pond.seedCount) * 0.8 * currentWeight) / 1000).toFixed(0),
    marketRate: '600',
    selectedBuyers: [] as string[],
    harvestDate: new Date().toISOString().split('T')[0],
  });

  // Self-harvest form
  const [selfForm, setSelfForm] = useState({
    avgWeight: currentWeight.toString(),
    totalBiomass: ((parseFloat(pond.seedCount) * 0.8 * currentWeight) / 1000).toFixed(0),
    salePrice: '',
    selectedReason: '',
    customReason: '',
  });

  const [loading, setLoading] = useState(false);

  const toggleBuyer = (buyerName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedBuyers: prev.selectedBuyers.includes(buyerName)
        ? prev.selectedBuyers.filter(b => b !== buyerName)
        : [...prev.selectedBuyers, buyerName],
    }));
  };

  // ── Submit: Market Sale ──
  const handleMarketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const isPartial = formData.harvestType === 'partial';
    try {
      await addHarvestRequest({
        pondId: pond.id,
        biomass: parseFloat(formData.totalBiomass),
        avgWeight: parseFloat(formData.avgWeight),
        price: parseFloat(formData.marketRate),
        targetedBuyers: formData.selectedBuyers,
        broadcastRadius: 150,
        status: 'pending',
        isPartialHarvest: isPartial,            // ← flag for HarvestTracking
        harvestType: formData.harvestType,      // 'partial' | 'full'
        totalSeedCount: parseFloat(pond.seedCount as any), // original seed count for adjustment
      });
      await updatePond(pond.id, {
        // Partial keeps pond active mid-cycle; full moves to harvest_pending
        status: isPartial ? 'active' : 'harvest_pending',
        harvestData: {
          ...formData,
          finalDoc: currentDoc,
          harvestStartedAt: new Date().toISOString(),
          isPartialHarvest: isPartial,
        },
      });
      navigate(isPartial ? `/ponds/${pond.id}/tracking` : '/ponds');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Submit: Self Harvest ──
  const handleSelfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const reason = selfForm.customReason.trim() || selfForm.selectedReason;
    if (!reason) return;
    setLoading(true);
    try {
      await updatePond(pond.id, {
        status: 'harvested',
        harvestData: {
          totalBiomass: selfForm.totalBiomass,
          avgWeight: selfForm.avgWeight,
          marketRate: selfForm.salePrice || '0',
          harvestType: 'self',
          selfHarvestReason: reason,
          finalDoc: currentDoc,
          harvestDate: new Date().toISOString(),
          harvestStartedAt: new Date().toISOString(),
        },
      });

      // ── Route to ROI Entry to complete the harvest cycle ──
      const params = new URLSearchParams({
        pondId:       pond.id,
        fromHarvest:  'self',
        biomass:      selfForm.totalBiomass,
        avgWeight:    selfForm.avgWeight,
        salePrice:    selfForm.salePrice || '',
        doc:          String(currentDoc),
        reason:       encodeURIComponent(reason),
      });
      navigate(`/roi-entry?${params.toString()}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const BUYERS = [
    { name: 'Reddy Aqua Exports',    loc: 'Bhimavaram', rate: '₹680/kg', company: 'Global Aqua',   rating: 4.9, icon: 'RA' },
    { name: 'Coastal Shrimp Traders',loc: 'Nellore',    rate: '₹675/kg', company: 'SeaPort Inc.',  rating: 4.8, icon: 'CS' },
    { name: 'Vannamei Direct',        loc: 'Kakinada',   rate: '₹690/kg', company: 'Export Hub',   rating: 5.0, icon: 'VD' },
    { name: 'Elite Seafoods',         loc: 'Amalapuram', rate: '₹685/kg', company: 'Premium Pack', rating: 4.7, icon: 'ES' },
  ];

  return (
    <div className={cn("pb-40 min-h-screen text-left relative overflow-hidden", isDark ? "bg-[#080F0C]" : "bg-[#F5F7FA]")}>
      {/* Ambient */}
      <div className="absolute top-0 right-0 w-[70%] h-[25%] bg-amber-500/8 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[20%] bg-emerald-500/8 rounded-full blur-[80px] -z-10" />

      <Header title={t.harvestPond} showBack={true} onBack={() => navigate(-1)} />

      <div className="pt-24 px-4 max-w-xl mx-auto space-y-5">

        {/* ── SOP READINESS CARD ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className={cn("rounded-[2rem] border overflow-hidden shadow-sm", isDark ? "bg-[#0D1A13] border-white/5" : "bg-white border-slate-100")}>
            <div className={cn("px-5 pt-4 pb-3 border-b flex items-center justify-between", isDark ? "border-white/5" : "border-slate-100")}>
              <div>
                <h3 className={cn("text-sm font-black tracking-tight", isDark ? "text-white" : "text-ink")}>{t.harvestReadiness}</h3>
                <p className={cn("text-[7px] font-black uppercase tracking-widest mt-0.5", isDark ? "text-white/30" : "text-ink/30")}>{t.sopComplianceCheck}</p>
              </div>
              <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border", readinessColor)}>
                {readinessGrade}
              </span>
            </div>
            <div className="divide-y divide-card-border">
              {readinessChecks.map((check, i) => (
                <div key={i} className={cn("flex items-center gap-3 px-5 py-3", isDark ? "" : "")}>
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                    check.pass ? isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                    : isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-500"
                  )}>
                    {check.pass ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[9px] font-black uppercase tracking-tight",
                      check.pass ? isDark ? "text-emerald-400" : "text-emerald-900"
                      : isDark ? "text-red-400" : "text-red-800"
                    )}>{check.label}</p>
                    <p className={cn("text-[7px] font-bold mt-0.5", isDark ? "text-white/25" : "text-ink/40")}>{check.detail}</p>
                  </div>
                  <p className={cn("text-[10px] font-black flex-shrink-0",
                    check.pass ? isDark ? "text-emerald-400" : "text-emerald-600"
                    : isDark ? "text-red-400" : "text-red-500"
                  )}>{check.value}</p>
                </div>
              ))}
            </div>
            {!isIdealDoc && (
              <div className={cn("mx-4 mb-4 mt-1 p-3 rounded-2xl border flex items-start gap-2",
                isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-100"
              )}>
                <Clock size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className={cn("text-[8px] font-bold leading-relaxed", isDark ? "text-amber-300" : "text-amber-800")}>
                  <span className="font-black">{t.earlyHarvestRisk.split('.')[0]}:</span> {t.earlyHarvestRisk}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── HERO INFO CARD ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="bg-gradient-to-br from-[#0D523C] to-[#064E3B] p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />
            <div className="absolute left-0 bottom-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-xl" />
            <div className="relative z-10">
              <p className="text-emerald-300/60 text-[8px] font-black uppercase tracking-[0.3em] mb-1">{pond.name} · {t.finalCycle}</p>
              <h2 className="text-2xl font-black tracking-tighter mb-3">{t.finalizingHarvest}</h2>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
                {[
                  { label: t.doc, value: currentDoc, icon: Clock },
                  { label: t.weightLabel, value: `${currentWeight.toFixed(1)}g`, icon: Scale },
                  { label: t.species, value: pond.species || 'Vannamei', icon: Fish },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <s.icon size={12} className="text-white/30 mx-auto mb-1" />
                    <p className="text-white font-black text-base leading-none">{s.value}</p>
                    <p className="text-white/30 text-[6px] font-black uppercase tracking-widest mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <ShoppingBag className="absolute -right-4 -bottom-4 opacity-5" size={100} />
          </div>
        </motion.div>

        {/* ── HARVEST MODE SELECTOR ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className={cn("text-[8px] font-black uppercase tracking-widest mb-2 px-1", isDark ? "text-white/30" : "text-ink/40")}>
            {t.chooseHarvestMethod}
          </p>
          <div className={cn("rounded-2xl p-1.5 flex gap-1.5 border", isDark ? "bg-white/5 border-white/5" : "bg-slate-100 border-transparent")}>
            {/* Market Sale Tab */}
            <button
              type="button"
              onClick={() => setHarvestMode('market')}
              className={cn(
                "flex-1 py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest",
                harvestMode === 'market'
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : isDark ? "text-white/30" : "text-slate-400"
              )}
            >
              <Users size={13} />
              {t.marketSale}
            </button>
            {/* Self Harvest Tab */}
            <button
              type="button"
              onClick={() => setHarvestMode('self')}
              className={cn(
                "flex-1 py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest",
                harvestMode === 'self'
                  ? "bg-[#C78200] text-white shadow-lg shadow-amber-500/20"
                  : isDark ? "text-white/30" : "text-slate-400"
              )}
            >
              <Home size={13} />
              {t.selfHarvest}
            </button>
          </div>

          {/* Mode description */}
          <div className={cn("mt-2 px-4 py-3 rounded-xl border flex items-start gap-2.5",
            harvestMode === 'market'
              ? isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-100"
              : isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-100"
          )}>
            <Info size={13} className={harvestMode === 'market' ? "text-indigo-500 flex-shrink-0 mt-0.5" : "text-amber-600 flex-shrink-0 mt-0.5"} />
            <p className={cn("text-[8px] font-bold leading-relaxed",
              harvestMode === 'market'
                ? isDark ? "text-indigo-300" : "text-indigo-800"
                : isDark ? "text-amber-300" : "text-amber-800"
            )}>
              {harvestMode === 'market' ? t.marketSaleDesc : t.selfHarvestDesc}
            </p>
          </div>
        </motion.div>

        {/* ══════════════════════════════════ */}
        {/*   MARKET SALE FORM                */}
        {/* ══════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {harvestMode === 'market' && (
            <motion.form
              key="market"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleMarketSubmit}
              className="space-y-4"
            >
              {/* Harvest type */}
              <div className={cn("rounded-2xl p-1.5 flex gap-1.5 border", isDark ? "bg-white/5 border-white/5" : "bg-card border-card-border")}>
                {['partial', 'full'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFormData({ ...formData, harvestType: mode })}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all capitalize",
                      formData.harvestType === mode
                        ? "bg-[#C78200] text-white shadow-md"
                        : isDark ? "text-white/25" : "text-ink/30"
                    )}
                  >
                    {mode === 'partial' ? t.partialHarvest : t.fullHarvest}
                  </button>
                ))}
              </div>

              {/* Metric inputs */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t.avgWeightG,  key: 'avgWeight',    placeholder: '25.5', icon: Scale },
                  { label: t.biomassKg,   key: 'totalBiomass', placeholder: '5000', icon: Target },
                  { label: t.targetRate,  key: 'marketRate',   placeholder: '650',  icon: IndianRupee },
                ].map((field, i) => (
                  <div key={i} className={i === 2 ? "col-span-2" : ""}>
                    <label className={cn("text-[8px] font-black uppercase tracking-widest mb-1.5 block ml-1", isDark ? "text-white/30" : "text-ink/40")}>
                      {field.label}
                    </label>
                    <div className="relative">
                      <field.icon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C78200]" size={14} />
                      <input
                        type="number"
                        value={(formData as any)[field.key]}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                        className={cn("w-full rounded-xl py-3.5 pl-10 pr-4 text-[12px] font-black outline-none transition-all border",
                          isDark ? "bg-white/5 border-white/10 text-white focus:border-[#C78200]/50"
                          : "bg-card border-card-border focus:border-[#C78200] shadow-sm"
                        )}
                        placeholder={field.placeholder}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Buyer selection */}
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <p className={cn("text-[9px] font-black uppercase tracking-widest flex items-center gap-2", isDark ? "text-white/50" : "text-ink")}>
                    <Users size={12} className="text-[#C78200]" /> {t.availableBuyers}
                  </p>
                  <span className="text-[7px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest">{t.liveQuotes}</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hidden -mx-4 px-4">
                  {BUYERS.map((buyer, i) => {
                    const selected = formData.selectedBuyers.includes(buyer.name);
                    return (
                      <div
                        key={i}
                        onClick={() => toggleBuyer(buyer.name)}
                        className={cn(
                          "min-w-[160px] p-4 rounded-[1.8rem] border transition-all cursor-pointer active:scale-95 shrink-0",
                          selected
                            ? "bg-gradient-to-br from-[#0D523C] to-[#064E3B] border-emerald-600 shadow-lg shadow-emerald-900/20 text-white"
                            : isDark ? "bg-white/5 border-white/10 text-white" : "bg-card border-card-border"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black",
                            selected ? "bg-white/10 text-white" : isDark ? "bg-white/5 text-white/50" : "bg-slate-100 text-slate-500"
                          )}>
                            {buyer.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-[8px] font-black truncate", selected ? "text-white" : isDark ? "text-white" : "text-ink")}>{buyer.name}</p>
                            <p className={cn("text-[6px] font-black uppercase tracking-widest", selected ? "text-white/50" : isDark ? "text-white/25" : "text-ink/30")}>{buyer.loc}</p>
                          </div>
                          {selected && <CheckCircle2 size={14} className="text-emerald-300 flex-shrink-0" />}
                        </div>
                        <div className={cn("px-2 py-1 rounded-full inline-block", selected ? "bg-white/10" : "bg-emerald-50")}>
                          <p className={cn("text-[9px] font-black", selected ? "text-emerald-300" : "text-emerald-600")}>{buyer.rate}</p>
                        </div>
                        <div className={cn("flex justify-between mt-3 pt-2 border-t", selected ? "border-white/10" : isDark ? "border-white/5" : "border-slate-100")}>
                          <p className={cn("text-[6px] font-black uppercase", selected ? "text-white/20" : isDark ? "text-white/15" : "text-ink/15")}>{buyer.company}</p>
                          <p className={cn("text-[8px] font-black", selected ? "text-amber-300" : "text-[#C78200]")}>★ {buyer.rating}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Broadcast info */}
              <div className={cn("p-4 rounded-2xl border flex items-start gap-3",
                isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-100"
              )}>
                <Info size={15} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={cn("text-[9px] font-black uppercase tracking-widest mb-0.5", isDark ? "text-indigo-300" : "text-indigo-800")}>{t.smartBroadcastActive}</p>
                  <p className={cn("text-[8px] font-bold leading-relaxed", isDark ? "text-indigo-300/60" : "text-indigo-700/70")}>
                    {t.broadcastRadius}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black py-4.5 py-4 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.broadcasting}
                  </div>
                ) : (
                  <>
                    <Users size={15} />
                    {t.broadcastToMarket}
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* ══════════════════════════════════ */}
          {/*   SELF HARVEST FORM               */}
          {/* ══════════════════════════════════ */}
          {harvestMode === 'self' && (
            <motion.form
              key="self"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSelfSubmit}
              className="space-y-4"
            >
              {/* Self-harvest reason presets */}
              <div>
                <p className={cn("text-[8px] font-black uppercase tracking-widest mb-2 px-1", isDark ? "text-white/30" : "text-ink/40")}>
                  {t.selectHarvestReason} *
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SELF_HARVEST_REASONS.map((reason, i) => {
                    const selected = selfForm.selectedReason === reason.label;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelfForm(prev => ({ ...prev, selectedReason: reason.label, customReason: '' }))}
                        className={cn(
                          "p-3 rounded-2xl border text-left transition-all active:scale-95",
                          selected
                            ? "bg-[#C78200] border-[#C78200] shadow-lg shadow-amber-500/20"
                            : isDark ? "bg-white/5 border-white/10 hover:border-amber-500/30" : "bg-white border-slate-100 hover:border-amber-300 shadow-sm"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base leading-none">{reason.icon}</span>
                          {selected && <CheckCircle2 size={11} className="text-white ml-auto" />}
                        </div>
                        <p className={cn("text-[9px] font-black leading-tight",
                          selected ? "text-white" : isDark ? "text-white/80" : "text-ink"
                        )}>{reason.label}</p>
                        <p className={cn("text-[7px] font-bold mt-0.5 leading-tight",
                          selected ? "text-white/60" : isDark ? "text-white/25" : "text-ink/40"
                        )}>{reason.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom reason override */}
              <div>
                <label className={cn("text-[8px] font-black uppercase tracking-widest mb-1.5 block px-1", isDark ? "text-white/30" : "text-ink/40")}>
                  {t.customReason}
                </label>
                <div className="relative">
                  <AlignLeft size={14} className="absolute left-4 top-4 text-[#C78200]" />
                  <textarea
                    value={selfForm.customReason}
                    onChange={e => setSelfForm(prev => ({ ...prev, customReason: e.target.value, selectedReason: '' }))}
                    className={cn(
                      "w-full rounded-2xl pl-10 pr-4 py-4 text-[11px] font-bold outline-none border transition-all min-h-[80px] resize-none",
                      isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#C78200]/50"
                      : "bg-white border-slate-200 focus:border-[#C78200] shadow-sm"
                    )}
                    placeholder={t.customReasonPlaceholder}
                  />
                </div>
              </div>

              {/* Biomass & financial inputs */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t.avgWeightG,    key: 'avgWeight',    placeholder: '25.5', icon: Scale },
                  { label: t.biomassKg,     key: 'totalBiomass', placeholder: '5000', icon: Target },
                  { label: t.targetRate,    key: 'salePrice',    placeholder: '600 (optional)', icon: IndianRupee },
                ].map((field, i) => (
                  <div key={i} className={i === 2 ? "col-span-2" : ""}>
                    <label className={cn("text-[8px] font-black uppercase tracking-widest mb-1.5 block ml-1", isDark ? "text-white/30" : "text-ink/40")}>
                      {field.label}
                    </label>
                    <div className="relative">
                      <field.icon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C78200]" size={14} />
                      <input
                        type="number"
                        value={(selfForm as any)[field.key]}
                        onChange={e => setSelfForm({ ...selfForm, [field.key]: e.target.value })}
                        className={cn("w-full rounded-xl py-3.5 pl-10 pr-4 text-[12px] font-black outline-none border transition-all",
                          isDark ? "bg-white/5 border-white/10 text-white focus:border-[#C78200]/50"
                          : "bg-card border-card-border focus:border-[#C78200] shadow-sm"
                        )}
                        placeholder={field.placeholder}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Audit trail notice */}
              <div className={cn("p-4 rounded-2xl border flex items-start gap-3",
                isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"
              )}>
                <PackageCheck size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={cn("text-[9px] font-black uppercase tracking-widest mb-0.5", isDark ? "text-amber-300" : "text-amber-900")}>{t.auditRecordCreated}</p>
                  <p className={cn("text-[8px] font-bold leading-relaxed", isDark ? "text-amber-300/60" : "text-amber-800/70")}>
                    {t.auditRecordDesc}
                  </p>
                </div>
              </div>

              {/* Validation warning */}
              {!selfForm.selectedReason && !selfForm.customReason.trim() && (
                <div className={cn("p-3 rounded-2xl border flex items-center gap-2",
                  isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"
                )}>
                  <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
                  <p className={cn("text-[8px] font-bold", isDark ? "text-red-400" : "text-red-700")}>
                    {t.pleaseSelectReason}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!selfForm.selectedReason && !selfForm.customReason.trim())}
                className="w-full bg-gradient-to-r from-[#C78200] to-[#a06600] text-white font-black py-4 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.recordingHarvest}
                  </div>
                ) : (
                  <>
                    <Home size={15} />
                    Confirm Harvest → Complete ROI Entry
                  </>
                )}
              </button>

            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
