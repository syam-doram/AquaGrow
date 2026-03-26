import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  Settings, 
  ShieldCheck, 
  CreditCard, 
  ChevronRight, 
  LogOut, 
  MapPin, 
  Activity,
  Zap,
  Globe,
  Sparkles
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Header } from '../components/Header';
import { cn } from '../utils/cn';
import { Translations } from '../translations';
import { format } from 'date-fns';

export const Profile = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { user, setUser, isPro } = useData();

  if (!user) return <div className="p-10 text-center">Please login to view profile</div>;

  return (
    <div className="pb-40 bg-[#F8F9FE] min-h-screen">
      <Header title={t.profile} onMenuClick={onMenuClick} />
      
      <div className="pt-24 px-4 py-8">
        <div className="relative mb-12">
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-[#C78200]/10 bg-[#C78200]/5 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="relative mb-8">
              <div className="w-40 h-40 rounded-[3.5rem] border-4 border-white shadow-2xl overflow-hidden relative z-10 group-hover:scale-105 transition-transform duration-500">
                <img src={`https://picsum.photos/seed/${user.name}/400/400`} className="w-full h-full object-cover" alt={user.name} />
              </div>
              <div className="absolute -inset-4 bg-[#C78200]/10 blur-3xl rounded-full scale-150 group-hover:scale-175 transition-transform"></div>
            </div>
            
            <h2 className="text-3xl font-black text-[#4A2C2A] tracking-tighter mb-2 relative z-10">{user.name}</h2>
            <div className="flex flex-col items-center gap-3 relative z-10">
              {user.subscriptionStatus === 'pro_silver' ? (
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-slate-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-slate-400/20">
                  <ShieldCheck size={14} />
                  Aqua Silver
                </div>
              ) : user.subscriptionStatus === 'pro_gold' ? (
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-[#C78200] rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-amber-500/20">
                  <Sparkles size={14} />
                  Aqua Gold
                </div>
              ) : user.subscriptionStatus === 'pro_diamond' ? (
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-blue-500 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-blue-500/20">
                  <Zap size={14} />
                  Aqua Diamond
                </div>
              ) : (
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-black/30 border border-black/5">
                  <UserIcon size={14} />
                  Aqua Standard
                </div>
              )}
            </div>
            
            <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-[#C78200]/10 blur-3xl opacity-30 rounded-full"></div>
          </div>
        </div>

        {/* SUBSCRIPTION STATUS OVERVIEW */}
        <section className="mb-px px-2">
           <div className={cn(
             "rounded-[2.5rem] p-7 flex items-center justify-between border shadow-2xl overflow-hidden relative",
             isPro ? "bg-[#0D1B17] border-emerald-500/20" : "bg-white border-slate-100"
           )}>
              {isPro && <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-white"><Sparkles size={100} /></div>}
              
              <div className="flex items-center gap-6 relative z-10">
                 <div className={cn(
                   "w-16 h-16 rounded-2xl flex items-center justify-center border",
                   isPro ? "bg-emerald-500/10 border-emerald-500/20 text-[#C78200]" : "bg-slate-50 border-slate-100 text-slate-300"
                 )}>
                    <CreditCard size={28} />
                 </div>
                 <div>
                    <h3 className={cn("text-lg font-black tracking-tight", isPro ? "text-white" : "text-slate-800")}>
                      {isPro ? (user.subscriptionStatus === 'pro_silver' ? 'Aqua 3 (Silver)' : user.subscriptionStatus === 'pro_gold' ? 'Aqua 6 (Gold)' : 'Aqua 9 (Diamond)') : 'Aqua Standard'}
                    </h3>
                    <p className={cn("text-[8px] font-black uppercase tracking-[0.2em] mt-1", isPro ? "text-emerald-500" : "text-slate-400")}>
                      Capacity: {isPro ? (user.subscriptionStatus === 'pro_silver' ? '3' : user.subscriptionStatus === 'pro_gold' ? '6' : '9') : '1'} Ponds / Year
                    </p>
                    {isPro && user.subscriptionExpiry && (
                      <p className="text-white/40 text-[7px] font-black uppercase tracking-widest mt-1">
                        Expires: {format(new Date(user.subscriptionExpiry), 'MMM d, yyyy')}
                      </p>
                    )}
                 </div>
              </div>
              
              <button 
                onClick={() => navigate('/subscription')}
                className={cn(
                  "px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all shadow-xl active:scale-95",
                  isPro ? "bg-[#C78200] text-white shadow-[#C78200]/20" : "bg-indigo-500 text-white shadow-indigo-500/20"
                )}
              >
                {isPro ? 'Manage' : 'Upgrade'}
              </button>
           </div>
        </section>

        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-black/5 hover:border-[#C78200]/30 transition-all flex flex-col items-center text-center">
            <div className="p-3 bg-[#C78200]/10 rounded-2xl text-[#C78200] mb-4 shadow-sm group-hover:scale-110">
              <MapPin size={24} />
            </div>
            <p className="text-[10px] font-black text-[#4A2C2A]/30 uppercase tracking-[0.2em] mb-1">{t.region}</p>
            <p className="font-black text-sm text-[#4A2C2A] tracking-tight">{user.location}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-black/5 hover:border-[#C78200]/30 transition-all flex flex-col items-center text-center">
            <div className="p-3 bg-[#C78200]/10 rounded-2xl text-[#C78200] mb-4 shadow-sm group-hover:scale-110">
              <Activity size={24} />
            </div>
            <p className="text-[10px] font-black text-[#4A2C2A]/30 uppercase tracking-[0.2em] mb-1">{t.acres}</p>
            <p className="font-black text-sm text-[#4A2C2A] tracking-tight">{user.farmSize} Acres</p>
          </div>
        </div>

        {/* Language Selection moved from System Settings */}
        <section className="mb-10 space-y-6 px-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/10">
              <Globe size={24} />
            </div>
            <div>
              <h3 className="text-[#4A2C2A] text-lg font-black tracking-tight">{t.language}</h3>
              <p className="text-[9px] text-[#4A2C2A]/30 font-bold uppercase tracking-widest mt-0.5">{t.selectLanguage}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-[2.5rem] p-5 shadow-sm border border-black/5 overflow-hidden">
            <div className="flex bg-[#4A2C2A]/5 p-2 rounded-[1.8rem] gap-2 h-14 items-center overflow-x-auto scrollbar-hide">
              {[t.english, t.telugu, t.bengali, t.odia, t.gujarati, t.tamil, t.malayalam].map((opt) => {
                 const mapping: Record<string, string> = {
                   [t.english]: 'English', [t.telugu]: 'Telugu', [t.bengali]: 'Bengali',
                   [t.odia]: 'Odia', [t.gujarati]: 'Gujarati', [t.tamil]: 'Tamil',
                   [t.malayalam]: 'Malayalam'
                 };
                 const targetLang = mapping[opt] || 'English';
                 const isSelected = user.language === targetLang;
                 return (
                    <button 
                      key={opt}
                      onClick={() => setUser({ ...user, language: targetLang as any })}
                      className={cn(
                        "px-6 h-full rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                        isSelected 
                          ? "bg-[#C78200] text-white shadow-xl shadow-[#C78200]/20 scale-105" 
                          : "text-[#4A2C2A]/40 hover:text-[#4A2C2A]/60"
                      )}
                    >
                      {opt}
                    </button>
                 );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[#4A2C2A] text-lg font-black tracking-tighter px-2 mb-6">Account Settings</h3>
          {[
            { icon: UserIcon, label: t.editProfile, path: '/profile/edit', color: 'text-[#C78200]' },
            { icon: ShieldCheck, label: t.securityPrivacy, path: '/profile/security', color: 'text-emerald-500' },
            { icon: CreditCard, label: t.subscriptionPlan, path: '/profile/subscription', color: 'text-[#4F7AFF]' },
            { icon: Settings, label: t.systemSettings, path: '/profile/settings', color: 'text-[#4A2C2A]/40' }
          ].map((item, i) => (
            <button 
              key={i} 
              onClick={() => navigate(item.path)}
              className="w-full bg-white p-6 rounded-[2rem] shadow-sm border border-black/5 flex items-center justify-between group hover:border-[#C78200]/30 transition-all"
            >
              <div className="flex items-center gap-6">
                <div className={cn("p-3 rounded-2xl bg-paper transition-transform group-hover:scale-110", item.color)}>
                  <item.icon size={22} className={cn("text-current opacity-80")} />
                </div>
                <p className="font-black text-base text-[#4A2C2A] tracking-tight">{item.label}</p>
              </div>
              <ChevronRight size={20} className="text-[#4A2C2A]/10 group-hover:text-[#C78200] group-hover:translate-x-1 transition-all" />
            </button>
          ))}
          
          <button 
            onClick={() => setUser(null)}
            className="w-full mt-10 bg-red-50 p-6 rounded-[2.5rem] border border-red-100 flex items-center justify-between group hover:bg-red-500 hover:border-red-500 transition-all"
          >
            <div className="flex items-center gap-6">
              <div className="p-3 rounded-2xl bg-white text-red-500 shadow-sm transition-transform group-hover:scale-110">
                <LogOut size={22} />
              </div>
              <p className="font-black text-base text-red-500 group-hover:text-white tracking-tight">{t.logout}</p>
            </div>
            <ChevronRight size={20} className="text-red-200 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
        </section>
      </div>
    </div>
  );
};
