import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Sparkles } from 'lucide-react';
import { Header } from '../../components/Header';
import type { Translations } from '../../translations';
import { User } from '../../types';
import { cn } from '../../utils/cn';

const mockExperts = [
  { id: '1', name: 'Dr. Sarah Wilson', specialization: 'Shrimp Virologist', experience: '15 Years', rating: 4.9, available: true, photo: 'https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200' },
  { id: '2', name: 'Prof. Arjun Mehta', specialization: 'Water Bio-Security', experience: '22 Years', rating: 5.0, available: true, photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200' },
  { id: '3', name: 'James Chen', specialization: 'Yield Optimization', experience: '12 Years', rating: 4.8, available: false, photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200' },
];

export const ExpertConsultations = ({ user, t, onMenuClick }: { user: User, t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();

  if (user.subscriptionStatus === 'free') {
    return (
      <div className="min-h-screen bg-[#FFFDF5] flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C78200] blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#4A2C2A] blur-[120px] rounded-full animate-pulse delay-1000"></div>
        </div>
        
        <div className="w-24 h-24 bg-[#C78200] rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-[#C78200]/20">
          <Users size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-black tracking-tighter text-[#4A2C2A] mb-4">{t.proFeature}</h2>
        <p className="text-[#4A2C2A]/60 text-sm leading-relaxed mb-10 max-w-[240px] font-medium">{t.expertConsultations} {t.proSubscriptionRequired}</p>
        <button 
          onClick={() => navigate('/subscription')}
          className="bg-[#C78200] text-white px-10 py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-[#C78200]/20 active:scale-95 transition-all flex items-center gap-3"
        >
          {t.upgradeToPro} <Sparkles size={18} className="text-white/40" />
        </button>
        <button onClick={() => navigate(-1)} className="mt-8 text-[#4A2C2A]/20 text-[10px] font-black uppercase tracking-widest hover:text-[#4A2C2A] transition-colors">{t.maybeLater}</button>
      </div>
    );
  }

  return (
    <div className="pb-32 bg-[#F8F9FE] min-h-screen">
      <Header title={t.expertConsultations} showBack={true} onBack={() => navigate('/dashboard')} onMenuClick={onMenuClick} />
      <div className="pt-24 px-6 py-8 space-y-10">
        <div className="bg-[#C78200] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl shadow-[#C78200]/20">
          <div className="relative z-10">
            <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.2em] mb-4">{t.priorityAccess}</p>
            <h2 className="text-4xl font-black tracking-tighter leading-tight">{t.connectExpertTitle}</h2>
            <p className="text-white/60 text-sm mt-4 font-medium">{t.expertConsultationsDesc}</p>
          </div>
          <Sparkles size={100} strokeWidth={0.5} className="absolute -right-8 -bottom-8 text-white/5" />
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-black tracking-tighter text-[#4A2C2A] px-1">{t.availableExperts}</h3>
          <div className="space-y-6">
            {mockExperts.map(expert => (
              <div key={expert.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-black/5 flex flex-col gap-6 group hover:border-[#C78200]/30 transition-all">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-black/5 group-hover:border-[#C78200]/30 transition-all">
                      <img src={expert.photo} className="w-full h-full object-cover" />
                    </div>
                    {expert.available && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-lg tracking-tight text-[#4A2C2A]">{expert.name}</h4>
                      <div className="flex items-center gap-1 text-[#C78200]">
                        <Sparkles size={14} fill="currentColor" />
                        <span className="text-xs font-black">{expert.rating}</span>
                      </div>
                    </div>
                    <p className="text-[#C78200] text-[10px] font-black uppercase tracking-widest mt-1">{expert.specialization}</p>
                    <p className="text-[#4A2C2A]/30 text-[10px] font-black uppercase tracking-widest mt-1">{expert.experience} {t.experience}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button className="flex-1 bg-[#4A2C2A] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#4A2C2A]/10 active:scale-95 transition-all">
                    {t.bookCall}
                  </button>
                  <button className="flex-1 bg-[#C78200]/5 text-[#C78200] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-[#C78200]/10 hover:bg-[#C78200]/10 transition-all active:scale-95">
                    {t.chatNow}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
