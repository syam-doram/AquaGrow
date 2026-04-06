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
  const { register } = useData();
  const [role, setRole] = useState<'farmer' | 'provider'>('farmer');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [locationValue, setLocationValue] = useState('');
  const [pondCount, setPondCount] = useState('');
  const [acres, setAcres] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const currentLang = lang;

  const primaryColor = role === 'farmer' ? '#10B981' : '#F59E0B';
  const accentColor = role === 'farmer' ? '#059669' : '#D97706';
  const shadowColor = role === 'farmer' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)';

  const handleRegisterSteps = async () => {
    setError('');
    const phoneClean = phone.replace(/\D/g, '');
    const phoneRegex = /^[6789]\d{9}$/;

    if (step === 'form') {
      if (!name || !phone || !email || !password || (role === 'farmer' && (!locationValue || !pondCount || !acres))) {
        setError(t.fillAllFields || "Fill all required fields");
        return;
      }
      if (!phoneRegex.test(phoneClean)) {
        setError("Invalid phone number format");
        return;
      }
      
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/auth/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile: `+91 ${phoneClean}`, email })
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
        const result = await register({
          name,
          phoneNumber: `+91 ${phoneClean}`,
          email,
          password,
          location: locationValue || 'Unknown',
          role,
          farmSize: parseFloat(acres) || 0,
          pondCount: parseInt(pondCount) || 0,
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
     <div className="min-h-[100dvh] bg-[#021811] relative overflow-hidden flex flex-col items-center font-sans tracking-tight">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-[#10B981]/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#F59E0B]/5 rounded-full blur-[120px]" />
      </div>

      {/* Dynamic Language Selector */}
      <div className="absolute top-6 right-8 z-50">
         <div className="flex bg-white/5 backdrop-blur-2xl p-1 rounded-[1.5rem] border border-white/10 shadow-2xl">
          {(['English', 'Telugu'] as const).map((l) => (
            <button
              key={l}
              onClick={() => { if (onLanguageChange) onLanguageChange(l); }}
              className={cn(
                "px-5 py-2.5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                currentLang === l ? "bg-white text-[#021811] shadow-xl" : "text-white/40 hover:text-white/70"
              )}
            >
              {l === 'English' ? 'EN' : 'తె'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full px-6 flex-1 flex flex-col justify-start pt-24 pb-8 min-h-0">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/[0.03] backdrop-blur-3xl rounded-[2.2rem] p-6 border border-white/10 shadow-2xl flex flex-col max-h-full">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-9 h-9 bg-white/10 backdrop-blur-3xl rounded-xl flex items-center justify-center border border-white/10">
                <Waves size={18} className="text-emerald-400" />
              </div>
              <h1 className="text-xl font-serif italic text-white">AquaGrow</h1>
            </div>
            <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.4em]">{t.register}</p>
          </div>

          <div className="flex p-1 bg-black/20 rounded-[1.8rem] border border-white/5 mb-6 shrink-0">
            {['farmer', 'provider'].map((r) => (
              <button key={r} onClick={() => setRole(r as any)} className={cn("flex-1 py-3 rounded-[1.5rem] flex items-center justify-center gap-2.5 text-[10px] font-black uppercase tracking-widest relative z-10", role === r ? "text-white" : "text-white/30")}>
                {role === r && <motion.div layoutId="role-bg-reg" className="absolute inset-0 rounded-[1.5rem] -z-10 shadow-xl" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }} />}
                {r === 'farmer' ? <UserIcon size={14} /> : <Zap size={14} />}
                <span>{t[r as keyof Translations] as string}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 relative z-10 overflow-x-hidden pb-4">
             <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-red-400/10 border border-red-400/20 rounded-2xl flex items-center gap-3 text-red-400 leading-none">
                      <AlertCircle size={14} />
                      <span className="text-[10px] font-black uppercase tracking-wider">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {step === 'form' ? (
                  <div className="space-y-3">
                    <div className="relative"><UserIcon size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                      <input className="w-full pl-14 pr-6 py-3.5 rounded-[1.8rem] border border-white/5 bg-white/[0.02] text-white outline-none" placeholder={t.fullName} value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="relative"><Smartphone size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                      <input className="w-full pl-14 pr-6 py-3.5 rounded-[1.8rem] border border-white/5 bg-white/[0.02] text-white outline-none" placeholder={t.phoneNumber} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} />
                    </div>
                    <div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 text-lg font-bold">@</span>
                      <input className="w-full pl-14 pr-6 py-3.5 rounded-[1.8rem] border border-white/5 bg-white/[0.02] text-white outline-none" placeholder={t.emailAddress} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    {role === 'farmer' && (
                       <div className="space-y-3">
                         <div className="relative"><MapPin size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                          <input className="w-full pl-14 pr-6 py-3.5 rounded-[1.8rem] border border-white/5 bg-white/[0.02] text-white outline-none" placeholder={t.farmLocation} value={locationValue} onChange={(e) => setLocationValue(e.target.value)} />
                         </div>
                         <div className="flex gap-3">
                           <div className="relative flex-1"><Layers size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                            <input className="w-full pl-12 pr-4 py-3.5 rounded-[1.8rem] border border-white/5 bg-white/[0.02] text-white outline-none" placeholder={t.numberOfPonds} type="number" value={pondCount} onChange={(e) => setPondCount(e.target.value)} />
                           </div>
                           <div className="relative flex-1"><Maximize size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                            <input className="w-full pl-12 pr-4 py-3.5 rounded-[1.8rem] border border-white/5 bg-white/[0.02] text-white outline-none" placeholder={t.acres} type="number" value={acres} onChange={(e) => setAcres(e.target.value)} />
                           </div>
                         </div>
                       </div>
                    )}
                    <div className="relative"><Lock size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                      <input className="w-full pl-14 pr-14 py-3.5 rounded-[1.8rem] border border-white/5 bg-white/[0.02] text-white outline-none" placeholder={t.password} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <ShieldCheck size={32} className="mx-auto text-emerald-400 mb-4" />
                    <h3 className="text-white text-base font-black mb-4">{t.enterOtp}</h3>
                    <input autoFocus className="bg-transparent border-b border-white/20 text-3xl text-white text-center w-32 tracking-widest outline-none mb-4" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value)} />
                    <button onClick={() => setStep('form')} className="flex items-center gap-2 mx-auto text-emerald-400 text-[9px] font-black uppercase tracking-widest"><ArrowLeft size={10} /> {t.back}</button>
                  </div>
                )}
             </div>
          </div>

          <button onClick={handleRegisterSteps} disabled={loading} className="shrink-0 w-full py-4.5 rounded-[1.8rem] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
             {loading ? <div className="animate-spin"><Waves size={18} className="mx-auto" /></div> : (step === 'form' ? t.verifyAndJoin : t.verifyOtp)}
          </button>
          
          <div className="text-center pt-4">
             <p className="text-white/20 text-[9px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">
               {t.alreadyHaveAccount.split('?')[0]}? <Link to="/login" className="text-emerald-400">{t.signInPrompt}</Link>
             </p>
          </div>
        </motion.div>
      </div>
     </div>
  );
};
