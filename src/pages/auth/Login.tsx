import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User as UserIcon,
  Smartphone, 
  Lock,
  ChevronRight, 
  Waves, 
  AlertCircle,
  Eye,
  EyeOff,
  Fingerprint,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { checkBiometric, getBiometric, setBiometric } from '../../utils/biometric';
import { Language } from '../../types';

export const Login = ({ t, lang, onLanguageChange }: { t: Translations, lang: Language, onLanguageChange?: (l: Language) => void }) => {
  const { login, loginWithOtp, setUser, updateUser, theme } = useData();
  const [role, setRole] = useState<'farmer' | 'provider'>('farmer');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'form' | 'otp' | 'password'>('form');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [canBiometric, setCanBiometric] = useState(false);
  const navigate = useNavigate();

  const currentLang = lang;

  useEffect(() => {
    const initBio = async () => {
      const bioAvailable = await checkBiometric();
      setCanBiometric(bioAvailable);
      
      const lastPhone = localStorage.getItem('aqua_phone');
      if (bioAvailable && lastPhone) {
        const phoneRaw = lastPhone.replace('+91 ', '');
        setPhone(phoneRaw);
        setTimeout(() => {
           handleBiometricLogin(lastPhone);
        }, 500);
      }
    };
    initBio();
  }, []);

  const primaryColor = role === 'farmer' ? '#f97316' : '#f43f5e';
  const accentColor = role === 'farmer' ? '#f59e0b' : '#ec4899';
  const shadowColor = role === 'farmer' ? 'rgba(249, 115, 22, 0.25)' : 'rgba(244, 63, 94, 0.25)';

  const handleInitialAction = async () => {
    setError('');
    if (!phone) {
      setError(t.fillAllFields || "Please enter your phone number");
      return;
    }
    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    setStep('otp'); // Default to OTP login for better UX
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const fullPhone = `+91 ${phone.replace(/\D/g, '')}`;
      let result;
      
      if (step === 'otp') {
        result = await loginWithOtp(fullPhone, otp);
      } else {
        result = await login(fullPhone, password);
      }

      if (result.success) {
        if (canBiometric) {
          if ((result.user as any).biometricEnabled) {
             // If they logged in with OTP, we can only set biometric if we have a password
             // But for now we'll skip setting it unless they use a password
             if (step === 'password') await setBiometric(phone, password);
          } else if (!localStorage.getItem('aqua_bio_asked')) {
             if (window.confirm("Enable Biometric Login?")) {
                if (step === 'password') await setBiometric(phone, password);
                await updateUser({ biometricEnabled: true });
             }
             localStorage.setItem('aqua_bio_asked', 'true');
          }
        }
        navigate('/dashboard');
      } else {
        setError(result.error || t.loginFailed);
      }
    } catch (e) {
      setError('Connection Error');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async (providedPhone?: string) => {
    const targetPhone = (providedPhone || phone).replace(/\D/g, '');
    if (!targetPhone) {
      setError("Enter phone number first");
      return;
    }
    setLoading(true);
    try {
       const pass = await getBiometric(targetPhone);
       if (pass) {
         const result = await login(`+91 ${targetPhone}`, pass);
         if (result.success) navigate('/dashboard');
         else setError(result.error || "Biometric login failed");
       } else {
         setError("Biometric not set for this account");
       }
    } catch (e) {
      setError("Biometric auth error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-paper relative overflow-hidden flex flex-col items-center font-sans tracking-tight">
      {/* ── THEME MESH BACKGROUND ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={cn("absolute top-[-20%] left-[-10%] w-[100%] h-[80%] bg-primary/10 rounded-full blur-[140px] animate-pulse", theme === 'midnight' && "bg-glow-primary/20")} />
        <div className={cn("absolute bottom-[-15%] right-[-10%] w-[90%] h-[70%] bg-accent/10 rounded-full blur-[120px]", theme === 'midnight' && "bg-primary/10")} />
        <div className={cn("absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-primary-light/10 rounded-full blur-[100px]", theme === 'midnight' && "bg-glow-primary/10")} />
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

      <div className="relative z-10 w-full px-4 flex-1 flex flex-col justify-center max-w-[320px]">
        {/* ── BRANDING ── */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center justify-center p-3.5 bg-card/40 backdrop-blur-3xl rounded-[1.6rem] border border-white/60 shadow-[0_8px_32px_rgba(31,38,135,0.07)] mb-4 group ring-1 ring-white/20">
            <Waves size={26} className="text-cyan-500 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" />
          </div>
          <h1 className="text-2xl font-serif italic text-ink tracking-tight mb-1 drop-shadow-sm font-medium">AquaGrow</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-6 bg-ink/10" />
            <p className="text-ink/40 text-[8.5px] font-black uppercase tracking-[0.4em]">{t.login}</p>
            <div className="h-px w-6 bg-ink/10" />
          </div>
        </motion.div>

        {/* ── ROLE SWITCHER ── */}
        <div className="flex p-1 bg-card/40 backdrop-blur-3xl rounded-[1.4rem] border border-white/60 mb-6 relative z-10 shadow-[0_8px_32px_rgba(31,38,135,0.05)] ring-1 ring-white/20">
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
                  layoutId="role-bg-login" 
                  className="absolute inset-0 rounded-[1.1rem] -z-10 shadow-lg" 
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                    boxShadow: `0 8px 24px ${shadowColor}` 
                  }} 
                />
              )}
              {r === 'farmer' ? <UserIcon size={13} className={cn("transition-transform duration-500 group-hover/btn-role:scale-110", role === r ? "text-white" : "text-ink/40")} /> : <Zap size={13} className={cn("transition-transform duration-500 group-hover/btn-role:scale-110", role === r ? "text-white" : "text-ink/40")} />}
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

            {(step === 'form' || step === 'password') && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
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
                
                <div className="space-y-1.5 group/input">
                  <label className="ml-5 text-[7.5px] font-black text-slate-400 uppercase tracking-[0.25em] group-focus-within/input:text-orange-500 transition-colors duration-500">{t.password}</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-orange-500 group-focus-within/input:scale-110 transition-all duration-500">
                      <Lock size={15} />
                    </div>
                    <input 
                      className="w-full pl-13 pr-12 py-3.5 rounded-[1.3rem] border border-card-border bg-card/40 focus:border-primary/30 focus:bg-card focus:shadow-[0_8px_24px_rgba(249,115,22,0.08)] outline-none transition-all duration-500 text-[13px] font-semibold text-ink placeholder:text-ink/20 ring-1 ring-transparent focus:ring-primary/10" 
                      placeholder="••••••••" 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-all duration-500 hover:scale-110">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end px-4">
                  <button type="button" onClick={() => navigate('/forgot-password')} className="text-cyan-600 text-[10px] font-black uppercase tracking-widest hover:text-cyan-700 transition-colors hover:underline underline-offset-4">
                    {t.forgotPassword}
                  </button>
                </div>

                <button 
                  onClick={handleLogin} 
                  disabled={loading || phone.length < 10 || !password} 
                  className="group/btn w-full py-4 rounded-[1.4rem] shadow-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white relative overflow-hidden transition-all duration-700 disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]" 
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                    boxShadow: `0 12px 32px ${shadowColor}` 
                  }}
                >
                  <div className="absolute inset-0 bg-card/20 translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-700" />
                  <div className="absolute inset-x-0 top-0 h-px bg-card/30" />
                  {loading ? <Waves size={18} className="animate-spin" /> : <span className="relative z-10">{t.signInPrompt}</span>}
                </button>

                <div className="flex items-center gap-4 py-4">
                  <div className="h-px bg-slate-100 flex-1" />
                  <span className="text-[9px] text-slate-300 font-bold tracking-[0.3em] uppercase">Security First</span>
                  <div className="h-px bg-slate-100 flex-1" />
                </div>

                <button 
                  onClick={() => setStep('otp')} 
                  className="w-full py-4.5 rounded-[1.8rem] bg-card/50 border border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-card hover:text-slate-900 transition-all duration-500 flex items-center justify-center gap-3 shadow-sm"
                >
                  <Fingerprint size={16} className="text-cyan-500/10" />
                  <span>Login with OTP</span>
                </button>
              </motion.div>
            )}

            {step === 'otp' && (
               <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="text-center py-6"
              >
                 <div className="w-16 h-16 bg-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-cyan-200">
                    <Smartphone className="text-cyan-600" size={24} />
                 </div>
                 <h3 className="text-slate-900 text-xs font-black uppercase tracking-[0.3em] mb-6">{t.enterOtp}</h3>
                 <input 
                   autoFocus 
                   className="bg-transparent border-b-2 border-primary/20 text-4xl text-ink text-center w-40 tracking-[0.5em] outline-none mb-10 focus:border-primary transition-colors" 
                   maxLength={4} 
                   value={otp} 
                   onChange={(e) => setOtp(e.target.value)} 
                 />
                 <div className="space-y-4">
                   <button 
                     onClick={handleLogin} 
                     disabled={loading || otp.length < 4} 
                     className="w-full py-5 rounded-[1.8rem] bg-cyan-500 text-white text-[11px] font-black uppercase tracking-widest shadow-[0_20px_40px_rgba(6,182,212,0.3)] disabled:opacity-50 transition-all duration-500"
                   >
                     {loading ? <Waves size={20} className="animate-spin mx-auto" /> : t.verifyOtp}
                   </button>
                   <button 
                    onClick={() => setStep('form')} 
                    className="flex items-center justify-center gap-2 mx-auto text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    <div className="rotate-180 inline-block mr-2">
                       <ChevronRight size={14} />
                    </div>
                    <span>Back to Password</span>
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
            {t.dontHaveAccount} 
            <span 
              onClick={() => navigate('/register')} 
              className="text-orange-600 hover:text-orange-700 cursor-pointer ml-1.5 transition-colors hover:underline underline-offset-4"
            >
              {t.register}
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
