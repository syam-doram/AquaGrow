import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Target, ArrowRight, Clock, Waves, Layers, Zap, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '../../components/Header';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

const InputGroup = ({ label, icon: Icon, value, onChange, placeholder, type = 'text', suffix, min }: any) => (
  <div className="space-y-1.5">
    <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-ink/30 ml-2">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C78200]/30 group-focus-within:text-[#C78200] transition-colors">
        <Icon size={16} />
      </div>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        className="w-full pl-12 pr-5 py-2.5 rounded-2xl border border-[#4A2C2A]/5 bg-card/60 shadow-inner focus:ring-4 focus:ring-[#C78200]/5 focus:border-[#C78200] outline-none transition-all text-xs font-bold text-ink placeholder:text-ink/15" 
        placeholder={placeholder}
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-ink/20 uppercase tracking-widest">{suffix}</span>
      )}
    </div>
  </div>
);

export const PondEntry = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { addPond } = useData();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    species: 'Vannamei',
    size: '',
    seedCount: '',
    stockingDate: new Date().toISOString().split('T')[0],
    plAge: '12',
    waterSource: 'Borewell',
    targetWeight: '35',
    waterDepth: '1.5',
    waterType: 'Borewell',
    initialSalinity: '5',
    stockingMode: 'stocked' as 'planned' | 'stocked'
  });

  const nowStr = new Date().toISOString().split('T')[0];
  const isReleased = formData.stockingMode === 'stocked';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.size) return;

    setLoading(true);
    try {
      await addPond({
        userId: 'local_user',
        name: formData.name,
        size: parseFloat(formData.size),
        species: formData.species as 'Vannamei' | 'Tiger',
        seedCount: parseInt(formData.seedCount.replace(/,/g, '')),
        plAge: parseInt(formData.plAge),
        stockingDate: formData.stockingDate,
        status: isReleased ? 'active' : 'planned',
        seedSource: 'Local Hatchery',
        waterType: formData.waterType,
        initialSalinity: parseInt(formData.initialSalinity),
        isStocked: isReleased
      });
      navigate('/ponds');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FE] selection:bg-[#C78200]/20">
      {/* Living Background Accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[#C78200]/5 blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <Header 
        title={t.newPondEntry}
        showBack
        rightElement={
          <div className="w-10 h-10 rounded-xl bg-[#C78200]/10 flex items-center justify-center text-[#C78200] shadow-inner">
            <Waves size={20} strokeWidth={2.5} className="animate-pulse" />
          </div>
        }
      />

      <main className="max-w-md mx-auto pt-24 pb-32 px-5 relative z-10 space-y-6">
        {/* Elite Strategy Selector */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="flex flex-col gap-3">
              <div className="bg-white/40 backdrop-blur-md p-1.5 rounded-[1.8rem] border border-white/60 flex gap-1 shadow-lg shadow-[#4A2C2A]/5">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, stockingMode: 'planned'})}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-[1.4rem] text-[8px] font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-1.5",
                    formData.stockingMode === 'planned' 
                      ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]" 
                      : "text-ink/40 hover:bg-card/50"
                  )}
                >
                  <Clock size={12} strokeWidth={3} /> {t.preStockingPreparation}
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, stockingMode: 'stocked'})}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-[1.4rem] text-[8px] font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-1.5",
                    formData.stockingMode === 'stocked' 
                      ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]" 
                      : "text-ink/40 hover:bg-card/50"
                  )}
                >
                  <Zap size={12} strokeWidth={3} /> {t.activeStocking}
                </button>
              </div>

              {/* Dynamic Guidance Box */}
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                key={formData.stockingMode}
                className={cn(
                  "px-4 py-3 rounded-2xl border text-[9px] font-bold leading-tight shadow-sm flex items-center gap-3",
                  formData.stockingMode === 'planned' 
                    ? "bg-blue-50/60 border-blue-100 text-blue-700" 
                    : "bg-emerald-50/60 border-emerald-100 text-emerald-700"
                )}
              >
                <Info size={14} className="shrink-0" />
                <p>{formData.stockingMode === 'planned' ? t.prepGuidance : t.activeGuidance}</p>
              </motion.div>
           </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primary Management Card */}
          <section className="bg-card/80 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-xl shadow-[#4A2C2A]/5 space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <Layers size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-[11px] font-black text-ink">{t.primaryDetails}</h2>
                <p className="text-[8px] font-bold text-ink/30 uppercase tracking-widest">Base Identity</p>
              </div>
            </div>
            
            <InputGroup 
              label={t.pondName} 
              icon={Layers} 
              placeholder="e.g. North Sector Pond A" 
              value={formData.name} 
              onChange={(v: string) => setFormData({...formData, name: v})} 
            />

            <div className="grid grid-cols-2 gap-3">
              <InputGroup 
                label={t.pondSize} 
                icon={Target} 
                placeholder="0.5" 
                suffix="AC"
                value={formData.size} 
                onChange={(v: string) => setFormData({...formData, size: v})} 
              />
              <div className="space-y-1.5">
                <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-ink/30 ml-2">{t.species}</label>
                <div className="relative">
                  <select 
                    value={formData.species}
                    onChange={(e) => setFormData({...formData, species: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#4A2C2A]/5 bg-card/60 shadow-inner focus:border-[#C78200] outline-none transition-all text-[11px] font-black text-ink appearance-none"
                  >
                    <option>Vannamei</option>
                    <option>Tiger</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#C78200]">
                    <ChevronLeft size={12} className="-rotate-90" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stocking Analytics Card */}
          <section className="bg-card/80 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-xl shadow-[#4A2C2A]/5 space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600">
                <Zap size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-[11px] font-black text-ink">{t.stockingAnalytics}</h2>
                <p className="text-[8px] font-bold text-ink/30 uppercase tracking-widest">Growth Markers</p>
              </div>
            </div>

            <InputGroup 
              label={t.seedCount} 
              icon={Zap} 
              placeholder="50,000" 
              value={formData.seedCount} 
              onChange={(v: string) => setFormData({...formData, seedCount: v})} 
            />

            <div className="grid grid-cols-2 gap-3">
              <InputGroup 
                label={t.stockingDate} 
                icon={Clock} 
                type="date"
                min={formData.stockingMode === 'planned' ? new Date().toISOString().split('T')[0] : undefined}
                value={formData.stockingDate} 
                onChange={(v: string) => setFormData({...formData, stockingDate: v})} 
              />
              <InputGroup 
                label={t.plAge} 
                icon={Target} 
                placeholder="12" 
                suffix="DAYS"
                value={formData.plAge} 
                onChange={(v: string) => setFormData({...formData, plAge: v})} 
              />
            </div>
          </section>

          {/* Environmental Foundation Card */}
          <section className="bg-card/80 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-xl shadow-[#4A2C2A]/5 space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-600">
                <Waves size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-[11px] font-black text-ink">{t.operationalData}</h2>
                <p className="text-[8px] font-bold text-ink/30 uppercase tracking-widest">Water Foundation</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-ink/30 ml-2">{t.waterType}</label>
                <div className="relative">
                  <select 
                    value={formData.waterType}
                    onChange={(e) => setFormData({...formData, waterType: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#4A2C2A]/5 bg-card/60 shadow-inner focus:border-[#C78200] outline-none transition-all text-[11px] font-black text-ink appearance-none"
                  >
                    <option value="Borewell">{t.borewell}</option>
                    <option value="Canal">{t.canal}</option>
                    <option value="Creek">{t.creek}</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#C78200]">
                    <ChevronLeft size={12} className="-rotate-90" />
                  </div>
                </div>
              </div>
              <InputGroup 
                label={t.initialSalinity} 
                icon={Waves} 
                placeholder="5" 
                suffix="PPT"
                value={formData.initialSalinity} 
                onChange={(v: string) => setFormData({...formData, initialSalinity: v})} 
              />
            </div>
          </section>

          <button 
            type="submit"
            disabled={loading}
            className="group relative w-full py-5 bg-gradient-to-br from-[#C78200] to-[#A66C00] text-white rounded-[1.5rem] font-black text-[9px] uppercase tracking-[0.2em] shadow-xl shadow-[#C78200]/25 active:scale-95 transition-all overflow-hidden disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-card/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <div className="relative flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  {t.processingEntry}
                </>
              ) : (
                <>
                  {t.completePondEntry} <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </div>
          </button>
        </form>
      </main>
    </div>
  );
};
