import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Droplets, 
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  Activity,
  Waves
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Translations } from '../translations';
import { calculateDOC } from '../utils/pondUtils';
import { cn } from '../utils/cn';

const CheckboxField = ({ label, value, onChange }: any) => (
  <button 
    type="button"
    onClick={() => onChange(!value)}
    className={cn(
      "w-full p-6 rounded-[2rem] border transition-all flex items-center justify-between group",
      value 
        ? "bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20" 
        : "bg-white border-black/5 text-[#4A2C2A]/40 hover:border-[#C78200]/20"
    )}
  >
    <span className="text-sm font-black tracking-tight">{label}</span>
    <div className={cn(
      "w-7 h-7 rounded-full flex items-center justify-center transition-all",
      value ? "bg-white text-emerald-500" : "bg-black/5 text-transparent"
    )}>
      <CheckCircle2 size={18} />
    </div>
  </button>
);

const InputField = ({ label, icon: Icon, value, onChange, placeholder, suffix }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase tracking-widest text-[#4A2C2A]/20 ml-4">{label}</label>
    <div className="relative group">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#C78200]/30 group-focus-within:text-[#C78200] transition-colors">
        <Icon size={18} />
      </div>
      <input 
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-14 pr-6 py-5 rounded-[2.2rem] border border-black/5 bg-white shadow-sm focus:border-[#C78200] outline-none transition-all text-sm font-black text-[#4A2C2A] placeholder:text-[#4A2C2A]/10" 
        placeholder={placeholder}
      />
      {suffix && (
        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[8px] font-black text-[#4A2C2A]/20 uppercase tracking-widest">{suffix}</span>
      )}
    </div>
  </div>
);

export const DailySOPLog = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { ponds } = useData();
  const pond = ponds.find(p => p.id === id);
  const [loading, setLoading] = useState(false);
  
  const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const targetDate = new Date(dateStr);

  const [form, setForm] = useState({
    avgWeight: '',
    feedQty: '',
    mortality: '0',
    checks: {} as Record<string, boolean>
  });

  if (!pond) return null;
  const docOnDate = calculateDOC(pond.stockingDate); 

  const getStageQuestions = () => {
    if (docOnDate === 0) return [
      { key: 'acclimatizationDone', label: t.acclimatizationDone },
      { key: 'probioticApplied', label: t.probioticApplied },
      { key: 'aerationReady', label: 'Aeration Ready?' },
      { key: 'noFeedFirst', label: 'No Feeding (First 4h)?' }
    ];
    if (docOnDate <= 10) return [
      { key: 'starterFeed', label: 'Starter Feed (4-5x Today)?' },
      { key: 'probioticApplied', label: 'Water Probiotic Done?' },
      { key: 'mineralsApplied', label: t.mineralsApplied },
      { key: 'phStable', label: 'pH Stable (7.5 - 8.5)?' }
    ];
    if (docOnDate <= 20) return [
      { key: 'gutProbiotic', label: t.gutProbioticMixed },
      { key: 'zeoliteApplied', label: t.zeoliteApplied },
      { key: 'aerationNight', label: 'Night Aeration Scheduled?' }
    ];
    if (docOnDate <= 30) return [
      { key: 'mineralsApplied', label: 'Mineral Mix (2x/week)?' },
      { key: 'sludgeChecked', label: t.sludgeChecked },
      { key: 'vibriosisCheck', label: t.vibriosisSigns }
    ];
    if (docOnDate <= 45) return [
      { key: 'feedTrayCheck', label: t.feedTrayCheck },
      { key: 'immunityBoost', label: t.immunityBoostersAdded },
      { key: 'aerator24h', label: t.aerator24h },
      { key: 'wssvCheck', label: 'WSSV Symptom Check?' }
    ];
    if (docOnDate <= 70) return [
       { key: 'extraAerators', label: 'Extra Aerators Active?' },
       { key: 'pondClean', label: t.pondBottomCleaned },
       { key: 'alternateProbiotics', label: 'Alternate Day Probiotics?' }
    ];
    return [
       { key: 'feedControl', label: 'Feed Quantity Controlled?' },
       { key: 'waterExchange', label: t.waterExchangeDone },
       { key: 'targetSize', label: t.targetSizeAchieved }
    ];
  };

  const handleToggle = (key: string) => {
    setForm(prev => ({
      ...prev,
      checks: { ...prev.checks, [key]: !prev.checks[key] }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate(`/ponds/${id}`);
    }, 1500);
  };

  return (
    <div className="pb-40 bg-[#F8F9FE] min-h-screen text-left">
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-white shadow-sm px-4 py-8 flex items-center justify-between border-b border-black/5">
        <button onClick={() => navigate(-1)} className="p-3 text-[#4A2C2A] hover:bg-black/5 rounded-2xl transition-all">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
            <h1 className="text-sm font-black text-[#4A2C2A] tracking-tighter uppercase">{t.dailyLogTitle}</h1>
            <p className="text-[8px] font-black text-[#C78200] uppercase tracking-widest">{targetDate.toLocaleDateString()} • DOC {docOnDate}</p>
        </div>
        <div className="w-12 h-12 flex items-center justify-center text-emerald-500">
           <ClipboardCheck size={24} />
        </div>
      </header>

      <form onSubmit={handleSubmit} className="pt-32 px-6 space-y-10">
        {/* Stage Banner */}
        <div className="bg-[#0D523C] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
           <div className="relative z-10">
              <p className="text-emerald-300 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Stage Based Log</p>
              <h2 className="text-2xl font-black tracking-tighter uppercase">
                 {docOnDate <= 10 ? t.earlyStage : docOnDate <= 45 ? t.highRiskPeriod : t.finalStage}
              </h2>
              <p className="text-white/40 text-[10px] font-black mt-2">Required by Gold Standard SOP</p>
           </div>
           <Activity size={100} className="absolute right-[-5%] bottom-[-5%] opacity-10 text-emerald-400" />
        </div>

        {/* Global Stats */}
        <section className="space-y-6">
           <div className="flex items-center gap-3 mb-2">
              <div className="h-1 w-8 bg-[#C78200] rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-widest text-[#C78200]">{t.dailyStats}</h2>
           </div>
           
           <div className="grid grid-cols-2 gap-6">
              <InputField 
                label={t.weightLabel} 
                icon={Zap} 
                suffix="GRMS" 
                placeholder="0.0" 
                value={form.avgWeight}
                onChange={(v: string) => setForm({...form, avgWeight: v})}
              />
              <InputField 
                label="Daily Feed" 
                icon={Droplets} 
                suffix="KGS" 
                placeholder="0.0" 
                value={form.feedQty}
                onChange={(v: string) => setForm({...form, feedQty: v})}
              />
           </div>
           <InputField 
             label="Mortality (Est)" 
             icon={AlertTriangle} 
             suffix="PCS" 
             placeholder="0" 
             value={form.mortality}
             onChange={(v: string) => setForm({...form, mortality: v})}
           />
        </section>

        {/* Dynamic SOP Questions */}
        <section className="space-y-6">
           <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-8 bg-emerald-500 rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-widest text-emerald-500">SOP Compliance</h2>
           </div>
           
           <div className="space-y-4">
              {getStageQuestions().map((q) => (
                <CheckboxField 
                  key={q.key}
                  label={q.label}
                  value={form.checks[q.key] || false}
                  onChange={() => handleToggle(q.key)}
                />
              ))}
           </div>
        </section>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-6 bg-[#C78200] text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#C78200]/20 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
        >
          {loading ? t.processingEntry : t.saveEntry} <ArrowRight size={20} />
        </button>

        <div className="p-8 text-center bg-[#4A2C2A]/5 rounded-[3rem] border border-dashed border-[#4A2C2A]/10">
           <p className="text-[10px] text-[#4A2C2A]/40 font-black uppercase tracking-widest leading-loose">
             Verified stage logs are stored in your Secure Journal.<br/>Required for Golden Export Certifications.
           </p>
        </div>
      </form>
    </div>
  );
};
