import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon,
  Smartphone, 
  Waves, 
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  Zap,
  ArrowRight,
  Droplets,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Scale
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
  const [step, setStep] = useState<'form' | 'terms' | 'otp'>('form');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const navigate = useNavigate();

  const isDark = theme === 'dark';
  const currentLang = lang;

  const farmerGradient = 'linear-gradient(135deg, #059669 0%, #0D523C 100%)';
  const providerGradient = 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)';
  const activeGradient = role === 'farmer' ? farmerGradient : providerGradient;
  const accentColor = role === 'farmer' ? '#059669' : '#4f46e5';
  const shadowColor = role === 'farmer' ? 'rgba(5,150,105,0.25)' : 'rgba(79,70,229,0.25)';

  const handleRegisterSteps = async () => {
    setError('');
    if (step === 'form') {
      if (!phone) { setError(t.fillAllFields || 'Please enter your phone number'); return; }
      const phoneClean = phone.replace(/\D/g, '');
      if (!/^[6789]\d{9}$/.test(phoneClean)) { setError('Invalid phone number (10 digits required)'); return; }
      setError('');
      setStep('terms');
      return;
    }

    if (step === 'terms') {
      if (!termsChecked || !disclaimerChecked) {
        setError('Please accept both checkboxes to proceed.');
        return;
      }
      setError('');
      setLoading(true);
      const phoneClean = phone.replace(/\D/g, '');
      try {
        const res = await fetch(`${API_BASE_URL}/auth/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile: `+91 ${phoneClean}` })
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error || 'User already exists');
          return;
        }
        setStep('otp');
      } catch { setError('Connection error. Try again.'); }
      finally { setLoading(false); }
      return;
    }

    // OTP step
    if (otp !== '1234') { setError(t.invalidOtp || 'Invalid OTP'); return; }
    setLoading(true);
    const phoneClean = phone.replace(/\D/g, '');
    try {
      const result = await register({
        name: 'Farmer Member',
        phoneNumber: `+91 ${phoneClean}`,
        email: `${phoneClean}@aquagrow.com`,
        password: 'aquagrow123',
        location: 'Unknown',
        role,
        farmSize: 0,
        pondCount: 0,
        language: currentLang,
        termsAccepted: true,
        notResponsibleAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
      });
      if ((result as any).success) navigate('/dashboard');
      else setError((result as any).error || t.registrationFailed);
    } catch { setError('Connection Error'); }
    finally { setLoading(false); }
  };

  const features = [
    { label: 'SOP-Driven Intelligence' },
    { label: 'Live Water Monitoring' },
    { label: 'Market-Linked Harvest' },
  ];

  return (
    <div className="min-h-[100dvh] relative overflow-hidden flex flex-col items-center font-sans tracking-tight" style={{ background: isDark ? '#030E1B' : '#F8FAFC' }}>
      
      {/* ── Mesh Background ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[100%] h-[80%] rounded-full blur-[140px] animate-pulse" style={{ background: `${accentColor}12` }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[90%] h-[70%] rounded-full blur-[120px]" style={{ background: `${accentColor}08` }} />
        {/* Wave decoration */}
        <svg className="absolute bottom-0 left-0 w-full opacity-5" viewBox="0 0 1440 200" preserveAspectRatio="none">
          <path d="M0,128L60,117.3C120,107,240,85,360,90.7C480,96,600,128,720,133.3C840,139,960,117,1080,101.3C1200,85,1320,75,1380,69.3L1440,64L1440,200L0,200Z" fill={accentColor} />
        </svg>
      </div>

      {/* ── Language Selector ── */}
      <div className="absolute top-6 right-6 z-50">
        <div className={cn("flex p-1 rounded-2xl border shadow-lg", isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-gray-100 backdrop-blur-xl")}>
          {(['English', 'Telugu'] as const).map((l) => (
            <button key={l} onClick={() => { if (onLanguageChange) onLanguageChange(l); }}
              className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                currentLang === l ? "text-white shadow-lg" : isDark ? "text-white/40" : "text-slate-400"
              )}
              style={currentLang === l ? { background: activeGradient } : {}}
            >
              {l === 'English' ? 'EN' : 'తె'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full px-5 flex-1 flex flex-col justify-center max-w-[360px] py-6">
        
        {/* ── Brand ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-7">
          <div className="relative inline-flex mb-4">
            <div className="w-18 h-18 w-[4.5rem] h-[4.5rem] rounded-[1.8rem] flex items-center justify-center shadow-2xl" style={{ background: activeGradient }}>
              <Droplets size={32} className="text-white" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute inset-0 rounded-[1.8rem] -z-10 blur-xl"
              style={{ background: activeGradient }}
            />
          </div>
          <h1 className={cn("text-2xl font-black tracking-tighter mb-0.5", isDark ? "text-white" : "text-slate-900")}>AquaGrow</h1>
          <p className={cn("text-[8px] font-black uppercase tracking-[0.4em]", isDark ? "text-white/25" : "text-slate-400")}>{t.register}</p>
        </motion.div>

        {/* ── Feature Pills ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-2 justify-center mb-5 flex-wrap">
          {features.map((f, i) => (
            <div key={i} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[8px] font-black uppercase tracking-wider",
              isDark ? "bg-white/5 border-white/10 text-white/40" : "bg-white/80 border-gray-100 text-slate-400"
            )}>
              <CheckCircle2 size={9} style={{ color: accentColor }} />
              {f.label}
            </div>
          ))}
        </motion.div>

        {/* ── Role Switcher ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.12 }}
          className={cn("flex p-1.5 rounded-[1.6rem] mb-5 border", isDark ? "bg-white/5 border-white/10" : "bg-white/70 border-gray-100 backdrop-blur-xl")}
        >
          {['farmer', 'provider'].map((r) => (
            <button 
              key={r} 
              onClick={() => setRole(r as any)} 
              className={cn(
                "flex-1 py-3 rounded-[1.2rem] flex items-center justify-center gap-2 transition-all duration-500 text-[10px] font-black uppercase tracking-wider",
                role === r ? "text-white shadow-xl" : isDark ? "text-white/40" : "text-slate-400"
              )}
              style={role === r ? { background: activeGradient } : {}}
            >
              {r === 'farmer' ? <UserIcon size={13} /> : <Zap size={13} />}
              <span>{t[r as keyof Translations] as string}</span>
            </button>
          ))}
        </motion.div>

        {/* ── Auth Card ── */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.18 }}
          className={cn(
            "rounded-[2rem] p-6 border relative overflow-hidden",
            isDark 
              ? "bg-white/[0.04] border-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              : "bg-white/80 border-white/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.07)]"
          )}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-2xl" style={{ background: activeGradient }} />

          <div className="space-y-5 relative z-10">
            {/* Error */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider leading-tight">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {step === 'form' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <p className={cn("text-center text-[8px] font-black uppercase tracking-[0.25em]", isDark ? "text-white/20" : "text-slate-300")}>
                  Empowering the Blue Revolution
                </p>
                
                {/* Phone Input */}
                <div className="space-y-2">
                  <label className={cn("ml-4 text-[8px] font-black uppercase tracking-[0.25em] block", isDark ? "text-white/30" : "text-slate-400")}>
                    {t.phoneNumber}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-500" style={{ color: accentColor }}>
                      <Smartphone size={16} />
                    </div>
                    <div className={cn("absolute left-12 top-1/2 -translate-y-1/2 text-[11px] font-black", isDark ? "text-white/30" : "text-slate-400")}>+91</div>
                    <input 
                      className={cn(
                        "w-full pl-20 pr-5 py-4 rounded-[1.3rem] border outline-none transition-all duration-300 text-[13px] font-semibold",
                        isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/30" : "bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-300 focus:border-emerald-200 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.08)]"
                      )}
                      placeholder="00000 00000" 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} 
                      maxLength={10} 
                    />
                  </div>
                </div>

                <motion.button 
                  onClick={handleRegisterSteps} 
                  disabled={loading || phone.length < 10} 
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-[1.4rem] text-[10px] font-black uppercase tracking-[0.3em] text-white disabled:opacity-40 transition-all relative overflow-hidden" 
                  style={{ background: activeGradient, boxShadow: `0 12px 32px ${shadowColor}` }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? <Waves size={18} className="animate-spin" /> : (
                      <>{t.getVerified} <ArrowRight size={14} /></>
                    )}
                  </span>
                </motion.button>

                {/* Security note */}
                <div className="flex items-center justify-center gap-2">
                  <ShieldCheck size={11} className="text-emerald-500" />
                  <p className={cn("text-[8px] font-black uppercase tracking-[0.2em]", isDark ? "text-white/20" : "text-slate-300")}>Your data is encrypted & safe</p>
                </div>
              </motion.div>
            ) : step === 'terms' ? (
              /* ── TERMS & DISCLAIMER (compact) ── */
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <Scale size={13} style={{ color: accentColor }} />
                  <p className={cn("text-[7px] font-black uppercase tracking-[0.2em]", isDark ? "text-white/30" : "text-slate-400")}>
                    Terms &amp; Disclaimer — required to continue
                  </p>
                </div>

                {/* Disclaimer checkbox */}
                <label className={cn("flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all",
                  disclaimerChecked
                    ? isDark ? "bg-amber-500/10 border-amber-500/25" : "bg-amber-50 border-amber-300"
                    : isDark ? "bg-white/3 border-white/8" : "bg-white border-slate-200"
                )} onClick={() => setDisclaimerChecked(v => !v)}>
                  <div className={cn("w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                    disclaimerChecked ? "bg-amber-500 border-amber-500" : isDark ? "border-white/20" : "border-slate-300"
                  )}>
                    {disclaimerChecked && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <div>
                    <p className={cn("text-[8px] font-black uppercase tracking-widest mb-0.5", isDark ? "text-amber-400" : "text-amber-700")}>
                      ⚠ Risk Disclaimer
                    </p>
                    <p className={cn("text-[8px] leading-snug", isDark ? "text-white/40" : "text-slate-500")}>
                      AquaGrow is <strong>not responsible</strong> for crop loss, mortality, or financial losses. Guidance is for informational use only.
                    </p>
                  </div>
                </label>

                {/* T&C checkbox */}
                <label className={cn("flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all",
                  termsChecked
                    ? isDark ? "bg-emerald-500/10 border-emerald-500/25" : "bg-emerald-50 border-emerald-300"
                    : isDark ? "bg-white/3 border-white/8" : "bg-white border-slate-200"
                )} onClick={() => setTermsChecked(v => !v)}>
                  <div className={cn("w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                    termsChecked ? "bg-emerald-500 border-emerald-500" : isDark ? "border-white/20" : "border-slate-300"
                  )}>
                    {termsChecked && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <div>
                    <p className={cn("text-[8px] font-black uppercase tracking-widest mb-0.5", isDark ? "text-white/50" : "text-slate-700")}>
                      📄 Terms &amp; Privacy Policy
                    </p>
                    <p className={cn("text-[8px] leading-snug", isDark ? "text-white/40" : "text-slate-500")}>
                      I agree to AquaGrow's Terms of Service. Data is encrypted and never sold.
                    </p>
                  </div>
                </label>

                {/* CTA */}
                <motion.button
                  onClick={handleRegisterSteps}
                  disabled={loading || !termsChecked || !disclaimerChecked}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-[1.4rem] text-[10px] font-black uppercase tracking-[0.3em] text-white disabled:opacity-40 transition-all"
                  style={{ background: activeGradient, boxShadow: `0 10px 28px ${shadowColor}` }}
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? <Waves size={16} className="animate-spin" /> : <>Continue <ArrowRight size={13} /></>}
                  </span>
                </motion.button>

                <button onClick={() => setStep('form')}
                  className={cn("flex items-center justify-center gap-1.5 mx-auto text-[8px] font-bold uppercase tracking-widest", isDark ? "text-white/25" : "text-slate-400")}
                ><ArrowLeft size={11} /> Change Number</button>
              </motion.div>

            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                 <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 border" style={{ background: `${accentColor}15`, borderColor: `${accentColor}30` }}>
                    <ShieldCheck style={{ color: accentColor }} size={26} />
                 </div>
                 <h3 className={cn("text-xs font-black uppercase tracking-[0.3em] mb-2", isDark ? "text-white" : "text-slate-900")}>{t.enterOtp}</h3>
                 <p className={cn("text-[9px] font-bold uppercase tracking-wider mb-6", isDark ? "text-white/30" : "text-slate-400")}>
                   Verification code sent to +91 {phone}
                 </p>
                 <input 
                   autoFocus 
                   className={cn(
                     "bg-transparent border-b-2 text-4xl text-center w-40 tracking-[0.5em] outline-none mb-8 transition-colors",
                     isDark ? "text-white border-white/20 focus:border-white/60" : "text-slate-900 border-slate-200 focus:border-emerald-500"
                   )}
                   maxLength={4} 
                   value={otp} 
                   onChange={(e) => setOtp(e.target.value)} 
                 />
                 <div className="space-y-3">
                   <motion.button 
                     onClick={handleRegisterSteps} 
                     disabled={loading || otp.length < 4} 
                     whileTap={{ scale: 0.97 }}
                     className="w-full py-4 rounded-[1.8rem] text-white font-black text-[11px] uppercase tracking-widest disabled:opacity-50 transition-all"
                     style={{ background: activeGradient, boxShadow: `0 16px 36px ${shadowColor}` }}
                   >
                     {loading ? <Waves size={20} className="animate-spin mx-auto" /> : t.verifyAndJoin}
                   </motion.button>
                   <button 
                    onClick={() => setStep('form')} 
                    className={cn("flex items-center justify-center gap-2 mx-auto text-[10px] font-bold uppercase tracking-widest transition-colors", isDark ? "text-white/30 hover:text-white/60" : "text-slate-400 hover:text-slate-600")}
                  >
                    <ArrowLeft size={14} />
                    <span>Change Phone Number</span>
                  </button>
                 </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-5 text-center">
          <p className={cn("text-[9px] font-black uppercase tracking-[0.2em]", isDark ? "text-white/20" : "text-slate-400")}>
            {t.alreadyHaveAccount}{' '}
            <span 
              onClick={() => navigate('/login')} 
              className="cursor-pointer hover:opacity-80 transition-all hover:underline underline-offset-4"
              style={{ color: accentColor }}
            >
              {t.login}
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
