import React, { useState } from 'react';
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
  Sparkles,
  Phone,
  Mail,
  Award,
  Building2,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { API_BASE_URL } from '../../config';

export const Profile = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { user, setUser, isPro } = useData();

  const [showBankModal, setShowBankModal] = useState(false);
  const [bankStep, setBankStep] = useState<'form' | 'verifying' | 'success'>('form');
  const [bankData, setBankData] = useState(user?.bankDetails || {
    bankName: 'Enter Bank Name',
    accountNumber: '**** **** 1234',
    ifscCode: 'IFSC0000000',
    isVerified: false
  });

  // Sync bankData with user.bankDetails whenever context updates
  React.useEffect(() => {
    if (user?.bankDetails) {
      setBankData(user.bankDetails);
    }
  }, [user?.bankDetails]);

  const handleVerifyBank = async () => {
    setBankStep('verifying');
    
    // 1. Simulate verification pulse
    setTimeout(async () => {
      const updatedBank = { ...bankData, isVerified: true };
      setBankStep('success');
      setBankData(updatedBank);

      // 2. Persist to MongoDB Database
      if (user?.id || (user as any)?._id) {
        try {
          const res = await fetch(`${API_BASE_URL}/user/${user.id || (user as any)._id}/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bankDetails: updatedBank })
          });

          if (res.ok) {
            // 3. Update Global Context
            const newUser = { ...user, bankDetails: updatedBank };
            setUser(newUser);
            localStorage.setItem('aqua_user', JSON.stringify(newUser));
          }
        } catch (err) {
          console.error('Critical Database Sync Error:', err);
        }
      }

      setTimeout(() => {
        setShowBankModal(false);
        setBankStep('form');
      }, 2000);
    }, 2500);
  };

  if (!user) return (
    <div className="min-h-screen bg-[#FFFDF5] flex flex-col items-center justify-center p-10 text-center">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
        <UserIcon size={32} className="text-[#C78200]" />
      </div>
      <h2 className="text-xl font-black text-[#4A2C2A] tracking-tighter mb-1">Not Logged In</h2>
      <p className="text-[#4A2C2A]/60 text-xs mb-6">Please login to view and manage your profile.</p>
      <button 
        onClick={() => navigate('/')}
        className="bg-[#C78200] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-600/20"
      >
        Go to Login
      </button>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="pb-32 bg-[#FBFBFE] min-h-screen relative overflow-hidden">
      {/* ── Page Accents ── */}
      <div className="absolute top-0 right-0 w-[80%] h-[25%] bg-[#C78200]/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-[20%] left-0 w-[60%] h-[35%] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />
      
      <Header title={t.profile} showBack={true} onBack={() => navigate('/dashboard')} onMenuClick={onMenuClick} />
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="pt-20 px-4 space-y-6"
      >
        {/* ── Hero Profile Card ── */}
        <motion.div variants={itemVariants} className="relative mt-2">
          <div className="bg-white rounded-[2rem] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-black/5 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-[2.2rem] p-1 bg-gradient-to-tr from-[#C78200] to-[#FFB800] shadow-xl relative z-10 group-hover:scale-105 transition-transform duration-500">
                <div className="w-full h-full rounded-[1.9rem] overflow-hidden border-[3px] border-white">
                  <img src={`https://picsum.photos/seed/${user.name}/400/400`} className="w-full h-full object-cover" alt={user.name} />
                </div>
              </div>
              <div className="absolute -inset-3 bg-[#C78200]/15 blur-2xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              {/* Badge Overlay */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-xl shadow-lg flex items-center justify-center z-20 border border-black/5">
                {isPro ? <Sparkles size={16} className="text-[#C78200]" /> : <Award size={16} className="text-slate-300" />}
              </div>
            </div>
            
            <h2 className="text-2xl font-black text-[#4A2C2A] tracking-tighter mb-0.5 relative z-10">{user.name}</h2>
            <p className="text-[#4A2C2A]/40 text-[9px] font-black uppercase tracking-[0.3em] mb-3">{user.role}</p>

            <div className="flex flex-col items-center gap-2 relative z-10">
              {user.subscriptionStatus === 'pro_silver' ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 shadow-sm">
                  <ShieldCheck size={12} className="text-slate-400" />
                  Silver Member
                </div>
              ) : user.subscriptionStatus === 'pro_gold' ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-[8px] font-black uppercase tracking-[0.2em] text-amber-600 shadow-sm">
                  <Sparkles size={12} className="text-amber-500" />
                  Gold Member
                </div>
              ) : user.subscriptionStatus === 'pro_diamond' ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-[8px] font-black uppercase tracking-[0.2em] text-blue-600 shadow-sm">
                  <Zap size={12} className="text-blue-500" />
                  Diamond Member
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 border border-slate-100">
                  <UserIcon size={12} />
                  Standard
                </div>
              )}
            </div>

            {/* Quick Contact Info */}
            <div className="flex gap-4 mt-6 pt-6 border-t border-black/5 w-full">
              <div className="flex-1 flex flex-col items-center gap-0.5 border-r border-black/5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-0.5">
                  <Phone size={12} />
                </div>
                <p className="text-[9px] font-black text-[#4A2C2A]">{user.phoneNumber}</p>
                <p className="text-[6px] font-black text-[#4A2C2A]/30 uppercase tracking-widest">Phone</p>
              </div>
              <div className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-0.5">
                  <Mail size={12} />
                </div>
                <p className="text-[9px] font-black text-[#4A2C2A] truncate max-w-[80px]">{user.email || 'No Email'}</p>
                <p className="text-[6px] font-black text-[#4A2C2A]/30 uppercase tracking-widest">Email</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Subscription Status ── */}
        <motion.div variants={itemVariants}>
           <div className={cn(
             "rounded-[1.8rem] p-5 flex flex-col sm:flex-row items-center justify-between border shadow-[0_10px_30px_rgba(0,0,0,0.03)] overflow-hidden relative gap-4",
             isPro ? "bg-[#012B1D] border-emerald-500/20" : "bg-white border-black/5"
           )}>
              {isPro && (
                <div className="absolute -right-3 -bottom-3 opacity-10 pointer-events-none text-emerald-400">
                  <Sparkles size={100} />
                </div>
              )}
              
              <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
                 <div className={cn(
                   "w-12 h-12 rounded-2xl flex items-center justify-center border",
                   isPro ? "bg-emerald-500/10 border-emerald-500/20 text-[#C78200]" : "bg-slate-50 border-slate-100 text-slate-300"
                 )}>
                    <CreditCard size={22} />
                 </div>
                 <div>
                    <h3 className={cn("text-base font-black tracking-tighter", isPro ? "text-white" : "text-slate-800")}>
                      {isPro ? (user.subscriptionStatus === 'pro_silver' ? 'Aqua 3 (Silver)' : user.subscriptionStatus === 'pro_gold' ? 'Aqua 6 (Gold)' : 'Aqua 9 (Diamond)') : 'Aqua Standard'}
                    </h3>
                    <p className={cn("text-[7px] font-black uppercase tracking-[0.2em] mt-1", isPro ? "text-emerald-500" : "text-slate-400")}>
                      Capacity: {isPro ? (user.subscriptionStatus === 'pro_silver' ? '3' : user.subscriptionStatus === 'pro_gold' ? '6' : '9') : '1'} Ponds / Year
                    </p>
                 </div>
              </div>
              
              <button 
                onClick={() => navigate('/profile/subscription')}
                className={cn(
                  "w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-lg active:scale-95 z-10",
                  isPro ? "bg-[#C78200] text-white shadow-amber-900/10" : "bg-indigo-600 text-white shadow-indigo-900/10"
                )}
              >
                {isPro ? 'Manage Plan' : 'Upgrade Now'}
              </button>
           </div>
        </motion.div>

        {/* ── Stats Grid ── */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4.5 rounded-[1.8rem] shadow-sm border border-black/5 flex flex-col items-center text-center group hover:border-[#C78200]/30 transition-all cursor-pointer">
            <div className="w-11 h-11 bg-[#C78200]/10 rounded-2xl flex items-center justify-center text-[#C78200] mb-3 group-hover:scale-105 transition-transform">
              <MapPin size={22} />
            </div>
            <p className="text-[8px] font-black text-[#4A2C2A]/25 uppercase tracking-[0.2em] mb-0.5">{t.region}</p>
            <p className="font-black text-xs text-[#4A2C2A] tracking-tight">{user.location}</p>
          </div>
          <div className="bg-white p-4.5 rounded-[1.8rem] shadow-sm border border-black/5 flex flex-col items-center text-center group hover:border-[#C78200]/30 transition-all cursor-pointer">
            <div className="w-11 h-11 bg-[#C78200]/10 rounded-2xl flex items-center justify-center text-[#C78200] mb-3 group-hover:scale-105 transition-transform">
              <Activity size={22} />
            </div>
            <p className="text-[8px] font-black text-[#4A2C2A]/25 uppercase tracking-[0.2em] mb-0.5">{t.acres}</p>
            <p className="font-black text-xs text-[#4A2C2A] tracking-tight">{user.farmSize} Acres</p>
          </div>
        </motion.div>

        {/* ── Settings Sections ── */}
        <motion.section variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <h3 className="text-[#4A2C2A] text-base font-black tracking-tighter">Settings</h3>
            <div className="w-7 h-7 rounded-lg bg-[#4A2C2A]/5 flex items-center justify-center">
              <Settings size={14} className="text-[#4A2C2A]/40" />
            </div>
          </div>

          {[
            { icon: UserIcon, label: t.editProfile, path: '/profile/edit', color: 'bg-amber-50 text-amber-600' },
            { icon: ShieldCheck, label: t.securityPrivacy, path: '/profile/security', color: 'bg-emerald-50 text-emerald-600' },
            { icon: Globe, label: t.language, path: '/profile/language', color: 'bg-[#C78200]/10 text-[#C78200]' },
            { icon: CreditCard, label: t.subscriptionPlan, path: '/profile/subscription', color: 'bg-blue-50 text-blue-600' },
            { icon: Building2, label: 'Banking & Payouts', onClick: () => setShowBankModal(true), color: 'bg-indigo-50 text-indigo-600' },
            { icon: Settings, label: t.systemSettings, path: '/profile/settings', color: 'bg-slate-50 text-slate-500' }
          ].map((item, i) => (
            <button 
              key={i} 
              onClick={() => item.onClick ? item.onClick() : navigate(item.path!)}
              className="w-full bg-white p-4 rounded-[1.5rem] shadow-sm border border-black/5 flex items-center justify-between group hover:border-[#C78200]/30 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105", item.color)}>
                  <item.icon size={18} />
                </div>
                <p className="font-black text-sm text-[#4A2C2A] tracking-tight">{item.label}</p>
              </div>
              <ChevronRight size={16} className="text-[#4A2C2A]/10 group-hover:text-[#C78200] group-hover:translate-x-1 transition-all" />
            </button>
          ))}
          
          <button 
            onClick={() => setUser(null)}
            className="w-full mt-4 bg-white p-4 rounded-[1.5rem] border-2 border-red-50 flex items-center justify-between group hover:bg-red-500 hover:border-red-500 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center transition-transform group-hover:bg-white/20 group-hover:text-white">
                <LogOut size={18} />
              </div>
              <p className="font-black text-sm text-red-500 group-hover:text-white tracking-tight">{t.logout}</p>
            </div>
            <ChevronRight size={16} className="text-red-200 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
        </motion.section>
      </motion.div>
      {/* ── Bank Verification Modal ── */}
      <AnimatePresence>
        {showBankModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBankModal(false)}
              className="absolute inset-0 bg-[#000]/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Building2 size={24} />
                </div>
                <button 
                  onClick={() => setShowBankModal(false)}
                  className="p-3 bg-[#4A2C2A]/5 rounded-2xl text-[#4A2C2A]/30 hover:text-[#4A2C2A] transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {bankStep === 'form' ? (
                <>
                  <div className="mb-8 text-left">
                    <h2 className="text-2xl font-black tracking-tighter text-[#4A2C2A]">Edit Account</h2>
                    <p className="text-[#4A2C2A]/40 text-xs font-bold uppercase tracking-widest mt-1">Update your settlement credentials</p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="space-y-2 text-left">
                      <label className="text-[8px] font-black text-[#4A2C2A]/30 uppercase tracking-widest ml-1">Bank Name</label>
                      <input 
                        className="w-full bg-[#F8F9FE] border border-black/5 p-4 rounded-xl text-[#4A2C2A] font-black outline-none focus:border-blue-500 transition-all text-sm" 
                        value={bankData.bankName} 
                        onChange={(e) => setBankData(prev => ({ ...prev, bankName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2 text-left">
                      <label className="text-[8px] font-black text-[#4A2C2A]/30 uppercase tracking-widest ml-1">Account Number</label>
                      <input 
                        className="w-full bg-[#F8F9FE] border border-black/5 p-4 rounded-xl text-[#4A2C2A] font-black outline-none focus:border-blue-500 transition-all text-sm" 
                        value={bankData.accountNumber}
                        placeholder="Enter Full Account Number" 
                        onChange={(e) => setBankData(prev => ({ ...prev, accountNumber: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2 text-left">
                      <label className="text-[8px] font-black text-[#4A2C2A]/30 uppercase tracking-widest ml-1">IFSC Code</label>
                      <input 
                        className="w-full bg-[#F8F9FE] border border-black/5 p-4 rounded-xl text-[#4A2C2A] font-black outline-none focus:border-blue-500 transition-all text-sm" 
                        value={bankData.ifscCode} 
                        onChange={(e) => setBankData(prev => ({ ...prev, ifscCode: e.target.value }))}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleVerifyBank}
                    className="w-full bg-blue-600 text-white font-black py-5 rounded-[1.8rem] shadow-xl flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all"
                  >
                    Save & Verify <ShieldCheck size={16} />
                  </button>
                </>
              ) : bankStep === 'verifying' ? (
                <div className="py-12 flex flex-col items-center text-center">
                   <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mb-6" />
                   <h2 className="text-xl font-black tracking-tighter text-[#4A2C2A] mb-2 leading-none uppercase">Verifying</h2>
                   <p className="text-[#4A2C2A]/40 text-[9px] font-black uppercase tracking-[0.3em]">Synching with Reserve Network...</p>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center text-center">
                   <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce">
                      <CheckCircle2 size={40} className="text-white" />
                   </div>
                   <h2 className="text-2xl font-black tracking-tighter text-[#4A2C2A] mb-2">Verified!</h2>
                   <p className="text-[#4A2C2A]/40 text-[9px] font-black uppercase tracking-[0.3em]">Bank details successfully updated.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
