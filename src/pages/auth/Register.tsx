import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User as UserIcon,
  Smartphone, 
  Lock,
  ChevronRight, 
  Waves, 
  AlertCircle,
  MapPin,
  Layers,
  Maximize,
  ShieldCheck,
  ArrowLeft,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { API_BASE_URL } from '../../config';
import { Language } from '../../types';

export const Register = ({ t, lang, onLanguageChange }: { t: Translations, lang: Language, onLanguageChange?: (l: Language) => void }) => {
  const { register, theme } = useData();
  const [role, setRole] = useState<'farmer' | 'provider'>('farmer');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const currentLang = lang;

  const primaryColor = role === 'farmer' ? '#f97316' : '#f43f5e';
  const accentColor = role === 'farmer' ? '#f59e0b' : '#ec4899';
  const shadowColor = role === 'farmer' ? 'rgba(249, 115, 22, 0.25)' : 'rgba(244, 63, 94, 0.25)';

  const handleRegisterSteps = async () => {
    setError('');
    const phoneClean = phone.replace(/\D/g, '');
    const phoneRegex = /^[6789]\d{9}$/;

    if (step === 'form') {
      if (!phone) {
        setError(t.fillAllFields || "Please enter your phone number");
        return;
      }
      if (!phoneRegex.test(phoneClean)) {
        setError("Invalid phone number format (10 digits required)");
        return;
      }
      
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/auth/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile: `+91 ${phoneClean}` })
        });
        if (!res.ok) {
           const d = await res.json();
           setError(d.error || "User exists");
           setLoading(false);
           return;
        }
        setStep('otp');
      } catch (e) {
        setError('Check failed');
      } finally {
        setLoading(false);
      }
    } else {
      if (otp !== '1234') {
        setError(t.invalidOtp || "Invalid OTP");
        return;
      }
      setLoading(true);
      try {
        // Registering with default values as requested: "only then after farmer can edit him details"
        const result = await register({
          name: 'Farmer Member',
          phoneNumber: `+91 ${phoneClean}`,
          email: `${phoneClean}@aquagrow.com`, // Default email pattern
          password: 'aquagrow123', // Default temporary password
          location: 'Unknown',
          role,
          farmSize: 0,
          pondCount: 0,
          language: currentLang
        });
        if ((result as any).success) {
           navigate('/dashboard');
        } else setError((result as any).error || t.registrationFailed);
      } catch (e) {
        setError('Connection Error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-[100dvh] bg-paper relative overflow-hidden flex flex-col items-center font-sans tracking-tight">
      {/* ── THEME MESH BACKGROUND ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={cn("absolute top-[-20%] left-[-10%] w-[100%] h-[80%] bg-primary/10 rounded-full blur-[140px] animate-pulse", theme === 'midnight' && "bg-glow-primary/20")} />
        <div className={cn("absolute bottom-[-15%] right-[-10%] w-[90%] h-[70%] bg-accent/10 rounded-full blur-[120px]", theme === 'midnight' && "bg-primary/10")} />
      </div>

      {/* ── LANGUAGE SELECTOR ── */}
      <div className="absolute top-8 right-8 z-50">
        <div className="flex bg-card/50 backdrop-blur-3xl p-1 rounded-2xl border border-slate-200 shadow-xl">
          {(['English', 'Telugu'] as const).map((l) => (
            <button
              key={l}
              onClick={() => { if (onLanguageChange) onLanguageChange(l); }}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                currentLang === l ? "bg-card text-ink shadow-xl" : "text-ink/40 hover:text-ink/60"
              )}
            >
              {l === 'English' ? 'EN' : 'తె'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full px-4 flex-1 flex flex-col justify-center max-w-[320px] my-2">
        {/* ── BRANDING ── */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center justify-center p-3.5 bg-card/40 backdrop-blur-3xl rounded-[1.6rem] border border-white/60 shadow-[0_8px_32px_rgba(249,115,22,0.07)] mb-4 group ring-1 ring-white/20">
            <Waves size={26} className="text-orange-500 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" />
          </div>
          <h1 className="text-2xl font-serif italic text-ink tracking-tight mb-1 drop-shadow-sm font-medium">AquaGrow</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-6 bg-ink/10" />
            <p className="text-ink/40 text-[8.5px] font-black uppercase tracking-[0.4em]">{t.register}</p>
            <div className="h-px w-6 bg-ink/10" />
          </div>
        </motion.div>

        {/* ── ROLE SWITCHER ── */}
        <div className="flex p-1 bg-card/40 backdrop-blur-3xl rounded-[1.4rem] border border-white/60 mb-5 relative z-10 shadow-[0_8px_32px_rgba(249,115,22,0.05)] ring-1 ring-white/20">
          {['farmer', 'provider'].map((r) => (
            <button 
              key={r} 
              onClick={() => setRole(r as any)} 
              className={cn(
                "flex-1 py-2.5 rounded-[1.1rem] flex items-center justify-center gap-2.5 transition-all duration-700 text-[9.5px] font-black uppercase tracking-widest relative z-10 overflow-hidden group/btn-role", 
                role === r ? "text-white" : "text-ink/40 hover:text-ink"
              )}
            >
              {role === r && (
                <motion.div 
                  layoutId="role-bg-reg" 
                  className="absolute inset-0 rounded-[1.1rem] -z-10 shadow-lg" 
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                    boxShadow: `0 8px 24px ${shadowColor}` 
                  }} 
                />
              )}
              {r === 'farmer' ? <UserIcon size={13} className={cn("transition-transform duration-500 group-hover/btn-role:scale-110", role === r ? "text-white" : "text-slate-400")} /> : <Zap size={13} className={cn("transition-transform duration-500 group-hover/btn-role:scale-110", role === r ? "text-white" : "text-slate-400")} />}
              <span>{t[r as keyof Translations] as string}</span>
            </button>
          ))}
        </div>

        {/* ── AUTH CARD ── */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="bg-card/50 backdrop-blur-[40px] rounded-[2rem] p-6 border border-white/80 shadow-[0_20px_50px_rgba(249,115,22,0.08)] relative overflow-hidden group ring-1 ring-white/30"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.95 }} 
                  className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider leading-tight">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {step === 'form' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <p className="text-ink/40 text-[8px] font-black uppercase tracking-[0.25em] text-center mb-1 drop-shadow-sm opacity-80">Empowering the Blue Revolution</p>
                
                <div className="space-y-1.5 group/input">
                  <label className="ml-5 text-[7.5px] font-black text-slate-400 uppercase tracking-[0.25em] group-focus-within/input:text-orange-500 transition-colors duration-500">{t.phoneNumber}</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-orange-500 group-focus-within/input:scale-110 transition-all duration-500">
                      <Smartphone size={15} />
                    </div>
                    <input 
                      className="w-full pl-13 pr-5 py-3.5 rounded-[1.3rem] border border-card-border bg-card/40 focus:border-primary/30 focus:bg-card focus:shadow-[0_8px_24px_rgba(249,115,22,0.08)] outline-none transition-all duration-500 text-[13px] font-semibold text-ink placeholder:text-ink/20 ring-1 ring-transparent focus:ring-primary/10" 
                      placeholder="00000 00000" 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} 
                      maxLength={10} 
                    />
                  </div>
                </div>

                <button 
                  onClick={handleRegisterSteps} 
                  disabled={loading || phone.length < 10} 
                  className="group/btn w-full py-4 rounded-[1.4rem] shadow-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white relative overflow-hidden transition-all duration-700 disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]" 
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                    boxShadow: `0 12px 32px ${shadowColor}` 
                  }}
                >
                  <div className="absolute inset-0 bg-card/20 translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-700" />
                  <div className="absolute inset-x-0 top-0 h-px bg-card/30" />
                  {loading ? <Waves size={18} className="animate-spin" /> : <span className="relative z-10">{t.getVerified}</span>}
                </button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                 <div className="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-orange-200">
                    <ShieldCheck className="text-orange-600" size={24} />
                 </div>
                 <h3 className="text-ink text-xs font-black uppercase tracking-[0.3em] mb-6">{t.enterOtp}</h3>
                 <input 
                   autoFocus 
                   className="bg-transparent border-b-2 border-primary/20 text-4xl text-ink text-center w-40 tracking-[0.5em] outline-none mb-10 focus:border-primary transition-colors" 
                   maxLength={4} 
                   value={otp} 
                   onChange={(e) => setOtp(e.target.value)} 
                 />
                 <div className="space-y-4">
                   <button 
                     onClick={handleRegisterSteps} 
                     disabled={loading || otp.length < 4} 
                     className="w-full py-5 rounded-[1.8rem] bg-orange-500 text-white text-[11px] font-black uppercase tracking-widest shadow-[0_20px_40px_rgba(249,115,22,0.3)] disabled:opacity-50 transition-all duration-500"
                   >
                     {loading ? <Waves size={20} className="animate-spin mx-auto" /> : t.verifyAndJoin}
                   </button>
                   <button 
                    onClick={() => setStep('form')} 
                    className="flex items-center justify-center gap-2 mx-auto text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Change Phone Number</span>
                  </button>
                 </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ── FOOTER ── */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-ink/40 text-[9px] font-black uppercase tracking-[0.2em]">
            {t.alreadyHaveAccount} 
            <span 
              onClick={() => navigate('/login')} 
              className="text-orange-600 hover:text-orange-700 cursor-pointer ml-1.5 transition-colors hover:underline underline-offset-4"
            >
              {t.login}
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
