import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon,
  Smartphone, 
  Lock,
  ChevronRight, 
  Zap, 
  Waves, 
  AlertCircle,
  MapPin,
  Layers,
  Maximize,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { cn } from '../utils/cn';
import { Translations } from '../translations';

export const AuthScreen = ({ t, onLanguageChange }: { t: Translations, onLanguageChange?: (l: 'English' | 'Telugu') => void }) => {
  const { register, login, user: currentUser } = useData();
  const [role, setRole] = useState<'farmer' | 'provider'>('farmer');
  const [lang, setLang] = useState<'English' | 'Telugu'>('English');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [locationValue, setLocationValue] = useState('');
  const [pondCount, setPondCount] = useState('');
  const [acres, setAcres] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const primaryColor = role === 'farmer' ? '#10B981' : '#C78200';
  const shadowColor = role === 'farmer' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(199, 130, 0, 0.2)';

  const handleAction = async () => {
    setError('');
    
    if (step === 'form') {
      if (!phone || !password) {
        setError(t.fillAllFields);
        return;
      }
      if (isRegister && (!name || !locationValue || !pondCount || !acres)) {
        setError(t.fillAllFields);
        return;
      }
      
      if (isRegister) {
        setLoading(true);
        // Save language when starting registration
        if (onLanguageChange) onLanguageChange(lang);
        // Simulate API call to send OTP
        setTimeout(() => {
          setLoading(false);
          setStep('otp');
        }, 1200);
        return;
      }
    } else if (step === 'otp') {
      if (!otp || otp.length !== 4) {
        setError(t.invalidOtp || "Please enter 4-digit OTP");
        return;
      }
      if (otp !== '1234') {
        setError(t.invalidOtp || "Invalid OTP. Use 1234");
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegister) {
        const result = await register({
          name,
          phoneNumber: `+91 ${phone}`,
          password,
          location: locationValue || 'Unknown',
          farmSize: parseFloat(acres) || 0,
          pondCount: parseInt(pondCount) || 0,
          language: lang,
          role: role
        }) as any;
        
        if (result.success) navigate('/dashboard');
        else setError(result.error || t.registrationFailed);
      } else {
        const result = await login(`+91 ${phone}`, password);
        if (result.success) navigate('/dashboard');
        else setError(result.error || t.loginFailed);
      }
    } catch (e) {
      setError('Connection Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#012B1D] relative overflow-hidden flex flex-col justify-center px-8 transition-colors duration-700">
      {/* ── ATMOSPHERIC LIGHTING ── */}
      <motion.div 
        animate={{ 
          background: role === 'farmer' 
            ? 'radial-gradient(circle at 100% 0%, rgba(16,185,129,0.15) 0%, transparent 50%)'
            : 'radial-gradient(circle at 100% 0%, rgba(199,130,0,0.15) 0%, transparent 50%)'
        }}
        className="absolute inset-0 pointer-events-none" 
      />
      
      <div className="absolute top-[-10%] right-[-10%] w-[100%] h-[50%] bg-[#0D523C]/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-[#C78200]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 max-w-sm mx-auto w-full">
        {/* ── HEADER ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-2xl group"
          >
            <Waves size={32} className="text-white group-hover:animate-pulse" />
          </motion.div>
          <h1 className="text-4xl font-serif italic text-white tracking-tighter mb-1 select-none">AquaGrow</h1>
          <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">
             {t.ecosystemForFarmers}
          </p>
        </motion.div>

        {/* ── LANGUAGE SELECTOR ── */}
        <div className="flex bg-white/5 backdrop-blur-2xl p-1 rounded-full border border-white/10 shadow-lg mb-6 mx-auto w-fit">
          {(['English', 'Telugu'] as const).map((l) => (
            <button
              key={l}
              onClick={() => {
                setLang(l);
                if (onLanguageChange) onLanguageChange(l);
              }}
              className={cn(
                "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all",
                lang === l ? "bg-white text-[#012B1D] shadow-xl" : "text-white/30 hover:text-white/60"
              )}
            >
              {l}
            </button>
          ))}
        </div>

        {/* ── ROLE SELECTOR ── */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex bg-white/5 backdrop-blur-2xl p-1.5 rounded-full border border-white/10 shadow-2xl mb-8 relative"
        >
          {['farmer', 'provider'].map((r) => (
            <button 
              key={r}
              onClick={() => { setRole(r as any); setError(''); }}
              className={cn(
                "flex-1 py-3.5 rounded-full flex items-center justify-center gap-2.5 transition-all text-[9.5px] font-black uppercase tracking-widest relative z-10",
                role === r ? "text-white" : "text-white/30"
              )}
            >
              {role === r && (
                <motion.div 
                  layoutId="active-role-pill" 
                  className="absolute inset-0 rounded-full shadow-lg"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 8px 25px ${shadowColor}` }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} 
                />
              )}
              {r === 'farmer' ? <UserIcon size={14} className="relative z-10" /> : <Zap size={14} className="relative z-10" />}
              <span className="relative z-10">{t[r as keyof Translations] as string}</span>
            </button>
          ))}
        </motion.div>

        {/* ── DYNAMIC AUTH FORM ── */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-[1.8rem] flex items-center gap-3 text-red-400 mb-2"
              >
                <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                  <AlertCircle size={16} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-wider">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <AnimatePresence mode="popLayout" initial={false}>
              {step === 'form' ? (
                <motion.div 
                  key="form-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3.5"
                >
                  {isRegister && (
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                        <UserIcon size={18} />
                      </div>
                      <input 
                        className="w-full pl-16 pr-6 py-5 rounded-[2.2rem] border border-white/5 bg-white/5 backdrop-blur-md focus:border-emerald-400 focus:bg-white/[0.08] outline-none transition-all text-sm font-bold text-white placeholder:text-white/20 shadow-inner" 
                        placeholder={t.fullName || "Full Name"}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  )}
                  
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                      <Smartphone size={18} />
                    </div>
                    <input 
                      className="w-full pl-16 pr-6 py-5 rounded-[2.2rem] border border-white/5 bg-white/5 backdrop-blur-md focus:border-emerald-400 focus:bg-white/[0.08] outline-none transition-all text-sm font-bold text-white placeholder:text-white/20 shadow-inner" 
                      placeholder={t.phoneNumber || "Phone Number"} 
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  {isRegister && role === 'farmer' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3.5 overflow-hidden"
                    >
                      <div className="relative group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                          <MapPin size={18} />
                        </div>
                        <input 
                          className="w-full pl-16 pr-6 py-5 rounded-[2.2rem] border border-white/5 bg-white/5 backdrop-blur-md focus:border-emerald-400 focus:bg-white/[0.08] outline-none transition-all text-sm font-bold text-white placeholder:text-white/20 shadow-inner" 
                          placeholder={t.farmLocation || "Farm Village / Mandal"}
                          value={locationValue}
                          onChange={(e) => setLocationValue(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative group">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                            <Layers size={18} />
                          </div>
                          <input 
                            className="w-full pl-16 pr-6 py-5 rounded-[2.2rem] border border-white/5 bg-white/5 backdrop-blur-md focus:border-emerald-400 focus:bg-white/[0.08] outline-none transition-all text-sm font-bold text-white placeholder:text-white/20 shadow-inner" 
                            placeholder={t.ponds || "Ponds"}
                            type="number"
                            value={pondCount}
                            onChange={(e) => setPondCount(e.target.value)}
                          />
                        </div>
                        <div className="relative group">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                            <Maximize size={18} />
                          </div>
                          <input 
                            className="w-full pl-16 pr-6 py-5 rounded-[2.2rem] border border-white/5 bg-white/5 backdrop-blur-md focus:border-emerald-400 focus:bg-white/[0.08] outline-none transition-all text-sm font-bold text-white placeholder:text-white/20 shadow-inner" 
                            placeholder={t.acres || "Acres"}
                            type="number"
                            value={acres}
                            onChange={(e) => setAcres(e.target.value)}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                      <Lock size={18} />
                    </div>
                    <input 
                      className="w-full pl-16 pr-6 py-5 rounded-[2.2rem] border border-white/5 bg-white/5 backdrop-blur-md focus:border-emerald-400 focus:bg-white/[0.08] outline-none transition-all text-sm font-bold text-white placeholder:text-white/20 shadow-inner" 
                      placeholder={t.password || "Password"} 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="otp-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8 text-center py-6"
                >
                  <div>
                     <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{t.otpSent || "Verification code sent to"}</p>
                     <p className="text-white font-black tracking-widest">+91 {phone}</p>
                     <div className="flex justify-center gap-4 mt-8">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center border border-emerald-500/20">
                          <ShieldCheck size={32} className="text-emerald-400 shadow-glow" />
                        </div>
                     </div>
                  </div>
                  
                  <input 
                    autoFocus
                    className="w-[200px] mx-auto bg-transparent border-b-2 border-white/10 focus:border-emerald-400 outline-none transition-all text-5xl font-black tracking-[0.4em] text-white text-center pb-2 mb-4" 
                    maxLength={4}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />

                  <button 
                    onClick={() => { setStep('form'); setOtp(''); }}
                    className="flex items-center gap-2 mx-auto text-emerald-400 text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <ArrowLeft size={12} /> {t.back}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            onClick={handleAction}
            className="w-full py-5 rounded-[2.2rem] shadow-2xl transition-all flex items-center justify-center gap-3 mt-6 text-[11px] font-black uppercase tracking-[0.3em] overflow-hidden relative"
            style={{ 
              backgroundColor: primaryColor, 
              color: 'white',
              boxShadow: `0 15px 40px ${shadowColor}`
            }}
          >
            {loading ? (
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <Waves size={20} />
              </motion.div>
            ) : (
              <>
                {isRegister ? (step === 'otp' ? t.verifyAndJoin : t.getVerified) : t.signInPrompt} 
                <ChevronRight size={18} />
              </>
            )}
          </motion.button>

          <div className="text-center pt-8 border-t border-white/5 mt-8">
            <button 
              onClick={() => { setIsRegister(!isRegister); setStep('form'); setError(''); }}
              className="text-white/60 text-[10px] uppercase font-black tracking-[0.2em] hover:text-emerald-400 transition-colors"
            >
              {isRegister ? (t.alreadyHaveAccount || 'Already have an account? Sign In') : (t.dontHaveAccount || "Don't have an account? Get Verified")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

