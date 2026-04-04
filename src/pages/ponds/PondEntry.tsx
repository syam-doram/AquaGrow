import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Target, ArrowRight, Clock, Waves, Layers, Zap } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

const InputGroup = ({ label, icon: Icon, value, onChange, placeholder, type = 'text', suffix }: any) => (
  <div className="space-y-4">
    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4A2C2A]/30 ml-2">{label}</label>
    <div className="relative group">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#C78200]/40 group-focus-within:text-[#C78200] transition-colors">
        <Icon size={20} />
      </div>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-16 pr-6 py-5 rounded-[2rem] border border-[#4A2C2A]/5 bg-white shadow-sm focus:ring-4 focus:ring-[#C78200]/5 focus:border-[#C78200] outline-none transition-all text-sm font-black text-[#4A2C2A] placeholder:text-[#4A2C2A]/20" 
        placeholder={placeholder}
      />
      {suffix && (
        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#4A2C2A]/20 uppercase tracking-widest">{suffix}</span>
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
    waterDepth: '1.5'
  });

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
        status: 'active',
        seedSource: 'Local Hatchery'
      });
      navigate('/ponds');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-32 bg-[#FFFDF5] min-h-screen">
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-white/90 backdrop-blur-md border-b border-[#4A2C2A]/5 px-4 py-8 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-3 rounded-2xl bg-[#F8F9FE] text-[#4A2C2A] hover:bg-[#C78200]/10 transition-all">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-[#4A2C2A] tracking-tighter">{t.newPondEntry}</h1>
        <div className="w-12 h-12 rounded-2xl bg-[#C78200]/5 flex items-center justify-center text-[#C78200]">
          <Waves size={24} />
        </div>
      </header>

      <form onSubmit={handleSubmit} className="pt-32 px-6 space-y-10">
        <section className="space-y-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-8 bg-[#C78200] rounded-full" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#C78200]">{t.primaryDetails}</h2>
          </div>
          
          <InputGroup 
            label={t.pondName} 
            icon={Layers} 
            placeholder="e.g. North Sector Pond A" 
            value={formData.name} 
            onChange={(v: string) => setFormData({...formData, name: v})} 
          />

          <div className="grid grid-cols-2 gap-6">
            <InputGroup 
              label={t.pondSize} 
              icon={Target} 
              placeholder="0.5" 
              suffix="AC"
              value={formData.size} 
              onChange={(v: string) => setFormData({...formData, size: v})} 
            />
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4A2C2A]/30 ml-2">{t.species}</label>
              <select 
                value={formData.species}
                onChange={(e) => setFormData({...formData, species: e.target.value})}
                className="w-full px-6 py-5 rounded-[2rem] border border-[#4A2C2A]/5 bg-white shadow-sm focus:border-[#C78200] outline-none transition-all text-sm font-black text-[#4A2C2A] appearance-none"
              >
                <option>Vannamei</option>
                <option>Tiger</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-8 bg-[#C78200] rounded-full" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#C78200]">{t.stockingAnalytics}</h2>
          </div>

          <InputGroup 
            label={t.seedCount} 
            icon={Zap} 
            placeholder="50,000" 
            value={formData.seedCount} 
            onChange={(v: string) => setFormData({...formData, seedCount: v})} 
          />

          <div className="grid grid-cols-2 gap-6">
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

        <section className="space-y-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-8 bg-[#C78200] rounded-full" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#C78200]">{t.operationalData}</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <InputGroup 
              label={t.waterQuality} 
              icon={Waves} 
              placeholder="1.5" 
              suffix="MTRS"
              value={formData.waterDepth} 
              onChange={(v: string) => setFormData({...formData, waterDepth: v})} 
            />
            <InputGroup 
              label={t.target} 
              icon={Target} 
              placeholder="35" 
              suffix="GRMS"
              value={formData.targetWeight} 
              onChange={(v: string) => setFormData({...formData, targetWeight: v})} 
            />
          </div>
        </section>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-6 bg-[#C78200] text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#C78200]/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
        >
          {loading ? t.processingEntry : t.completePondEntry} <ArrowRight size={20} />
        </button>
      </form>
    </div>
  );
};
