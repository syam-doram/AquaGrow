import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Target, ArrowRight, Clock, Waves, Layers, Zap } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

const InputGroup = ({ label, icon: Icon, value, onChange, placeholder, type = 'text', suffix }: any) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#4A2C2A]/25 ml-3">{label}</label>
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#C78200]/40 group-focus-within:text-[#C78200] transition-colors">
        <Icon size={18} />
      </div>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-14 pr-5 py-3.5 rounded-[1.5rem] border border-[#4A2C2A]/5 bg-white shadow-inner focus:ring-4 focus:ring-[#C78200]/5 focus:border-[#C78200] outline-none transition-all text-xs font-bold text-[#4A2C2A] placeholder:text-[#4A2C2A]/15" 
        placeholder={placeholder}
      />
      {suffix && (
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#4A2C2A]/15 uppercase tracking-widest">{suffix}</span>
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

      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-white/70 backdrop-blur-2xl border-b border-[#4A2C2A]/5 px-5 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2.5 rounded-xl bg-white border border-[#4A2C2A]/5 text-[#4A2C2A] hover:bg-[#C78200] hover:text-white transition-all shadow-sm active:scale-90"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-black text-[#4A2C2A] tracking-tight">{t.newPondEntry}</h1>
          <p className="text-[9px] font-bold text-[#4A2C2A]/30 uppercase tracking-[0.2em] mt-0.5">{t.pondStockingProfile}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#C78200]/10 flex items-center justify-center text-[#C78200] shadow-inner">
          <Waves size={20} strokeWidth={2.5} className="animate-pulse" />
        </div>
      </header>

      <main className="max-w-md mx-auto pt-24 pb-32 px-5 relative z-10 space-y-6">
        {/* Elite Strategy Selector */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="bg-white/40 backdrop-blur-md p-1.5 rounded-[2rem] border border-white flex gap-1.5 shadow-xl shadow-[#4A2C2A]/5">
            <button 
              type="button"
              onClick={() => setFormData({...formData, stockingMode: 'planned'})}
              className={cn(
                "flex-1 py-3 px-4 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-2",
                formData.stockingMode === 'planned' 
                  ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20 scale-[1.02]" 
                  : "text-[#4A2C2A]/40 hover:bg-white/50"
              )}
            >
              <Clock size={14} strokeWidth={3} /> {t.needToRelease}
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, stockingMode: 'stocked'})}
              className={cn(
                "flex-1 py-3 px-4 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-2",
                formData.stockingMode === 'stocked' 
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-[1.02]" 
                  : "text-[#4A2C2A]/40 hover:bg-white/50"
              )}
            >
              <Zap size={14} strokeWidth={3} /> {t.released}
            </button>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primary Management Card */}
          <section className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-6 shadow-2xl shadow-[#4A2C2A]/5 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <Layers size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xs font-black text-[#4A2C2A]">{t.primaryDetails}</h2>
                <p className="text-[9px] font-bold text-[#4A2C2A]/30 uppercase tracking-widest">Base Configuration</p>
              </div>
            </div>
            
            <InputGroup 
              label={t.pondName} 
              icon={Layers} 
              placeholder="e.g. North Sector Pond A" 
              value={formData.name} 
              onChange={(v: string) => setFormData({...formData, name: v})} 
            />

            <div className="grid grid-cols-2 gap-4">
              <InputGroup 
                label={t.pondSize} 
                icon={Target} 
                placeholder="0.5" 
                suffix="AC"
                value={formData.size} 
                onChange={(v: string) => setFormData({...formData, size: v})} 
              />
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[#4A2C2A]/30 ml-2">{t.species}</label>
                <div className="relative">
                  <select 
                    value={formData.species}
                    onChange={(e) => setFormData({...formData, species: e.target.value})}
                    className="w-full px-5 py-4 rounded-[1.5rem] border border-[#4A2C2A]/5 bg-white shadow-inner focus:border-[#C78200] outline-none transition-all text-xs font-black text-[#4A2C2A] appearance-none"
                  >
                    <option>Vannamei</option>
                    <option>Tiger</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#C78200]">
                    <ChevronLeft size={14} className="-rotate-90" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stocking Analytics Card */}
          <section className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-6 shadow-2xl shadow-[#4A2C2A]/5 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                <Zap size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xs font-black text-[#4A2C2A]">{t.stockingAnalytics}</h2>
                <p className="text-[9px] font-bold text-[#4A2C2A]/30 uppercase tracking-widest">Growth Markers</p>
              </div>
            </div>

            <InputGroup 
              label={t.seedCount} 
              icon={Zap} 
              placeholder="50,000" 
              value={formData.seedCount} 
              onChange={(v: string) => setFormData({...formData, seedCount: v})} 
            />

            <div className="grid grid-cols-2 gap-4">
              <InputGroup 
                label={t.stockingDate} 
                icon={Clock} 
                type="date"
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
          <section className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-6 shadow-2xl shadow-[#4A2C2A]/5 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600">
                <Waves size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xs font-black text-[#4A2C2A]">{t.operationalData}</h2>
                <p className="text-[9px] font-bold text-[#4A2C2A]/30 uppercase tracking-widest">Water Foundation</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[#4A2C2A]/30 ml-2">{t.waterType}</label>
                <div className="relative">
                  <select 
                    value={formData.waterType}
                    onChange={(e) => setFormData({...formData, waterType: e.target.value})}
                    className="w-full px-5 py-4 rounded-[1.5rem] border border-[#4A2C2A]/5 bg-white shadow-inner focus:border-[#C78200] outline-none transition-all text-xs font-black text-[#4A2C2A] appearance-none"
                  >
                    <option value="Borewell">{t.borewell}</option>
                    <option value="Canal">{t.canal}</option>
                    <option value="Creek">{t.creek}</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#C78200]">
                    <ChevronLeft size={14} className="-rotate-90" />
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
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
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
