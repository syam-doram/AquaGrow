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
  ArrowLeft,
  Eye,
  EyeOff,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { API_BASE_URL } from '../../config';
import { checkBiometric, getBiometric, setBiometric } from '../../utils/biometric';

export const AuthScreen = ({ t, onLanguageChange }: { t: Translations, onLanguageChange?: (l: 'English' | 'Telugu') => void }) => {
  const { register, login, user: currentUser, setUser, updateUser } = useData();
  const [role, setRole] = useState<'farmer' | 'provider'>('farmer');
  const [lang, setLang] = useState<'English' | 'Telugu'>('English');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [locationValue, setLocationValue] = useState('');
  const [pondCount, setPondCount] = useState('');
  const [acres, setAcres] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [canBiometric, setCanBiometric] = useState(false);

  React.useEffect(() => {
    checkBiometric().then(setCanBiometric);
  }, []);

  const handleBiometricLogin = async () => {
    if (!phone) {
      setError("Enter your phone/email first");
      return;
    }
    setLoading(true);
    try {
      const pass = await getBiometric(phone);
      if (pass) {
        const result = await login(phone, pass);
        if (result.success) {
          navigate('/dashboard');
        } else {
          setError(result.error || "Biometric login failed");
        }
      } else {
        setError("Biometric not set for this account");
      }
    } catch (e) {
      setError("Biometric auth error");
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = role === 'farmer' ? '#10B981' : '#F59E0B';
  const accentColor = role === 'farmer' ? '#059669' : '#D97706';
  const shadowColor = role === 'farmer' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)';

  const handleAction = async () => {
    setError('');
    
    if (step === 'form') {
      const phoneClean = phone.replace(/\D/g, '');
      const phoneRegex = /^[6789]\d{9}$/;
      const passRegex = /^(?=.*[0-9!@#$%^&*])(?=.{6,})/;

      if (!phone || !password) {
        setError(t.fillAllFields);
        return;
      }
      if (isRegister) {
        // EXHAUSTIVE FIELD VERIFICATION (Block registration if ANY field is empty)
        if (!name.trim() || !phone.trim() || !email.trim() || !password || !locationValue.trim() || !pondCount || !acres) {
          setError(t.fillAllFields || "Please fill all required profile fields");
          return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setError("Please enter a valid email address");
          return;
        }
        
        if (name.trim().length < 3) {
          setError("Name must be at least 3 characters");
          return;
        }
        if (locationValue.length > 20) {
          setError("Location must be 20 characters only");
          return;
        }
        if (!phoneRegex.test(phoneClean)) {
          setError("Phone must be 10 digits starting with 6,7,8 or 9");
          return;
        }
        if (!passRegex.test(password)) {
          setError("Password: Min 6 chars with 1 number or symbol");
          return;
        }
        
        setLoading(true);
        if (onLanguageChange) onLanguageChange(lang);
        
        // PROACTIVE IDENTITY CHECK — Restriction step
        try {
          const checkRes = await fetch(`${API_BASE_URL}/auth/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: `+91 ${phone}`, email })
          });
          const checkData = await checkRes.json();
          if (!checkRes.ok) {
            setError(checkData.error || "User already exists. Restricted.");
            setLoading(false);
            return;
          }
        } catch (err) {
          setError("Identity check failed. Restricted.");
          setLoading(false);
          return;
        }

        setTimeout(() => {
          setLoading(false);
          setStep('otp');
        }, 1200);
        return;
      } else {
        // Login handles both phone and email
        if (!phoneRegex.test(phoneClean) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(phone)) {
          setError("Please enter a valid phone number or email");
          return;
        }
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
          email,
          password,
          location: locationValue || 'Unknown',
          farmSize: parseFloat(acres) || 0,
          pondCount: parseInt(pondCount) || 0,
          language: lang,
          role: role
        }) as any;
        
        if (result.success) {
          await handlePostLoginBiometric(result.user || {}, password);
          navigate('/dashboard');
        } else setError(result.error || t.registrationFailed);
      } else {
        const result = await login(`+91 ${phone}`, password);
        if (result.success) {
          // Sync language preference if changed at login
          const loggedUser = result.user;
          if (loggedUser && loggedUser.language !== lang) {
             const updated = { ...loggedUser, language: lang };
             setUser(updated);
             try {
                fetch(`${API_BASE_URL}/user/${updated.id || (updated as any)._id}/profile`, {
                   method: 'PUT',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ language: lang })
                });
             } catch (err) {}
          }
            if (onLanguageChange) onLanguageChange(lang);
            await handlePostLoginBiometric(loggedUser, password);
            navigate('/dashboard');
          } else {
            setError(result.error || t.loginFailed);
          }
      }
    } catch (e) {
      setError('Connection Error');
    } finally {
      setLoading(false);
    }
  };

  const handlePostLoginBiometric = async (u: any, pass: string) => {
    if (!canBiometric) return;

    if (u.biometricEnabled) {
      await setBiometric(phone, pass);
    } else if (!localStorage.getItem('aqua_bio_asked')) {
      const wantBio = window.confirm("Enable Fingerprint/FaceID for faster logins?");
      if (wantBio) {
        const success = await setBiometric(phone, pass);
        if (success) {
          await updateUser({ biometricEnabled: true });
        }
      }
      localStorage.setItem('aqua_bio_asked', 'true');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#021811] relative overflow-hidden flex flex-col items-center font-sans tracking-tight">
      
      {/* ── AMBIENT BACKGROUND ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-[#10B981]/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#F59E0B]/5 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[20%] w-40 h-40 bg-white/5 rounded-full blur-[80px]" />
      </div>

      {/* ── TOP UTILITIES (Language Selector Only) ── */}
      <div className="absolute top-8 left-8 right-8 flex justify-end items-center z-50">

        <div className="flex bg-white/5 backdrop-blur-2xl p-1 rounded-[1.5rem] border border-white/10 shadow-2xl transition-all hover:bg-white/[0.08]">
          {(['English', 'Telugu'] as const).map((l) => (
            <button
              key={l}
              onClick={() => {
                setLang(l);
                if (onLanguageChange) onLanguageChange(l);
              }}
              className={cn(
                "px-5 py-2.5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                lang === l ? "bg-white text-[#021811] shadow-xl scale-105" : "text-white/40 hover:text-white/70"
              )}
            >
              {l === 'English' ? 'EN' : 'తె'}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT (Top-Aligned Card with Padding) ── */}
      <div className="relative z-10 w-full max-w-[420px] px-8 flex-1 flex flex-col justify-start pt-28 pb-8 min-h-0">
        
        {/* AUTH CARD */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/[0.03] backdrop-blur-3xl rounded-[3rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col max-h-full"
        >
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

          {/* AUTH TOGGLE (Moved Inside Card) */}
          <div className="flex bg-black/20 p-1 rounded-[1.6rem] border border-white/5 mb-8 relative z-20 overflow-hidden">
            <motion.div 
              layoutId="auth-bg"
              className="absolute inset-y-1 rounded-[1.3rem] shadow-xl"
              style={{ 
                left: isRegister ? '50%' : '4px',
                right: isRegister ? '4px' : '50%',
                background: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.6 }}
            />
            <button
              onClick={() => { setIsRegister(false); setStep('form'); setError(''); }}
              className={cn(
                "flex-1 py-2.5 rounded-[1.3rem] text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 relative z-10",
                !isRegister ? "text-[#021811]" : "text-white/40 hover:text-white/60"
              )}
            >
              {t.login}
            </button>
            <button
              onClick={() => { setIsRegister(true); setStep('form'); setError(''); }}
              className={cn(
                "flex-1 py-2.5 rounded-[1.3rem] text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 relative z-10",
                isRegister ? "text-[#021811]" : "text-white/40 hover:text-white/60"
              )}
            >
              {t.register}
            </button>
          </div>

          {/* LOGO AREA (Inside Card) */}
          <motion.div className="text-center mb-8 shrink-0">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-3xl rounded-xl flex items-center justify-center border border-white/10 shadow-2xl group">
                <Waves size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <h1 className="text-2xl font-serif italic text-white tracking-tight">AquaGrow</h1>
            </div>
          </motion.div>

          {/* ROLE SELECTOR (Inside Card, Fixed relative to scroll) */}
          <div className="flex p-1 bg-black/20 backdrop-blur-2xl rounded-[1.8rem] border border-white/5 mb-6 relative z-10 shrink-0">
            {['farmer', 'provider'].map((r) => (
              <button 
                key={r}
                onClick={() => { setRole(r as any); setError(''); }}
                className={cn(
                  "flex-1 py-3 rounded-[1.5rem] flex items-center justify-center gap-2.5 transition-all text-[10px] font-black uppercase tracking-widest relative z-10",
                  role === r ? "text-white" : "text-white/30"
                )}
              >
                {role === r && (
                  <motion.div 
                    layoutId="role-bg" 
                    className="absolute inset-0 rounded-[1.5rem] -z-10"
                    style={{ 
                      background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                      boxShadow: `0 8px 30px ${shadowColor}` 
                    }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} 
                  />
                )}
                {r === 'farmer' ? <UserIcon size={14} /> : <Zap size={14} />}
                <span>{t[r as keyof Translations] as string}</span>
              </button>
            ))}
          </div>

          {/* INTERNAL SCROLLABLE AREA */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 relative z-10 overflow-x-hidden pb-4">
            <div className="space-y-4">
              {/* ERROR ALERT */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-2"
                  >
                    <div className="p-4 bg-red-400/10 border border-red-400/20 rounded-2xl flex items-center gap-3 text-red-400 leading-none">
                      <AlertCircle size={14} />
                      <span className="text-[10px] font-black uppercase tracking-wider">{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* BIOMETRIC LOGIN BUTTON */}
              {!isRegister && canBiometric && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleBiometricLogin}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-[1.8rem] border border-amber-500/20 bg-amber-500/5 text-amber-500 group/bio hover:bg-amber-500/10 transition-all mb-4 shadow-lg shadow-amber-500/5"
                >
                  <Fingerprint size={18} className="group-hover/bio:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t.biometricLogin}</span>
                </motion.button>
              )}

              {/* INPUTS CONTAINER */}
              <AnimatePresence mode="popLayout" initial={false}>
                {step === 'form' ? (
                  <motion.div 
                    key="form-step"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-3"
                  >
                    {/* Basic Credentials Group */}
                    <div className="space-y-3">
                      {isRegister && (
                        <div className="relative group/input">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-emerald-400 transition-colors pointer-events-none">
                            <UserIcon size={16} />
                          </div>
                          <input 
                            className="w-full pl-14 pr-6 py-4 rounded-[1.8rem] border border-white/5 bg-white/[0.02] focus:border-emerald-500/30 focus:bg-white/[0.08] outline-none transition-all text-sm font-semibold text-white placeholder:text-white/10 placeholder:font-black placeholder:uppercase placeholder:text-[8.5px] placeholder:tracking-widest shadow-inner" 
                            placeholder={t.fullName || "Full Name"}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                      )}
                      
                      <div className="relative group/input">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-emerald-400 transition-colors pointer-events-none">
                          <Smartphone size={16} />
                        </div>
                        <input 
                          className="w-full pl-14 pr-6 py-4 rounded-[1.8rem] border border-white/5 bg-white/[0.02] focus:border-emerald-500/30 focus:bg-white/[0.08] outline-none transition-all text-sm font-semibold text-white placeholder:text-white/10 placeholder:font-black placeholder:uppercase placeholder:text-[8.5px] placeholder:tracking-widest shadow-inner" 
                          placeholder={isRegister ? (t.phoneNumber || "Phone Number") : "Phone or Email"} 
                          type={isRegister ? "tel" : "text"}
                          value={phone}
                          maxLength={isRegister ? 10 : 50}
                          onChange={(e) => setPhone(isRegister ? e.target.value.replace(/\D/g, '') : e.target.value)}
                        />
                      </div>

                      {isRegister && (
                        <div className="relative group/input">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-emerald-400 transition-colors pointer-events-none">
                            <span className="text-xl font-bold">@</span>
                          </div>
                          <input 
                            className="w-full pl-14 pr-6 py-4 rounded-[1.8rem] border border-white/5 bg-white/[0.02] focus:border-emerald-500/30 focus:bg-white/[0.08] outline-none transition-all text-sm font-semibold text-white placeholder:text-white/10 placeholder:font-black placeholder:uppercase placeholder:text-[8.5px] placeholder:tracking-widest shadow-inner" 
                            placeholder={t.email || "Email Address"} 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Business Details Group (Only during Register for Farmers) */}
                    {isRegister && role === 'farmer' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-3 pt-1"
                      >
                        <div className="relative group/input">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-emerald-400 transition-colors pointer-events-none">
                            <MapPin size={16} />
                          </div>
                          <input 
                            className="w-full pl-14 pr-6 py-4 rounded-[1.8rem] border border-white/5 bg-white/[0.02] focus:border-emerald-500/30 focus:bg-white/[0.08] outline-none transition-all text-sm font-semibold text-white placeholder:text-white/10 placeholder:font-black placeholder:uppercase placeholder:text-[8.5px] placeholder:tracking-widest shadow-inner" 
                            placeholder={t.farmLocation || "Farm Location"}
                            value={locationValue}
                            maxLength={20}
                            onChange={(e) => setLocationValue(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-3">
                          <div className="relative flex-1 group/input">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-emerald-400 transition-colors pointer-events-none">
                              <Layers size={14} />
                            </div>
                            <input 
                              className="w-full pl-12 pr-4 py-4 rounded-[1.8rem] border border-white/5 bg-white/[0.02] focus:border-emerald-500/30 focus:bg-white/[0.08] outline-none transition-all text-sm font-semibold text-white placeholder:text-white/10 placeholder:font-black placeholder:uppercase placeholder:text-[8px] placeholder:tracking-widest shadow-inner" 
                              placeholder={t.ponds || "Ponds"}
                              type="number"
                              value={pondCount}
                              onChange={(e) => setPondCount(e.target.value)}
                            />
                          </div>
                          <div className="relative flex-1 group/input">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-emerald-400 transition-colors pointer-events-none">
                              <Maximize size={14} />
                            </div>
                            <input 
                              className="w-full pl-12 pr-4 py-4 rounded-[1.8rem] border border-white/5 bg-white/[0.02] focus:border-emerald-500/30 focus:bg-white/[0.08] outline-none transition-all text-sm font-semibold text-white placeholder:text-white/10 placeholder:font-black placeholder:uppercase placeholder:text-[8px] placeholder:tracking-widest shadow-inner" 
                              placeholder={t.acres || "Acres"}
                              type="number"
                              value={acres}
                              onChange={(e) => setAcres(e.target.value)}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Security Group */}
                    <div className="pt-1">
                      <div className="relative group/input text-emerald-400/80 transition-colors">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 group-focus-within/input:opacity-100 transition-opacity pointer-events-none">
                          <Lock size={16} />
                        </div>
                        <input 
                          className="w-full pl-14 pr-14 py-4 rounded-[1.8rem] border border-white/5 bg-white/[0.02] focus:border-emerald-500/40 focus:bg-white/[0.08] outline-none transition-all text-sm font-semibold text-white placeholder:text-white/10 placeholder:font-black placeholder:uppercase placeholder:text-[8.5px] placeholder:tracking-widest shadow-inner" 
                          placeholder={t.password || "Set Password"} 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="otp-step"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6 text-center"
                  >
                    <div className="pt-2">
                       <h3 className="text-white font-black text-[9px] uppercase tracking-[0.4em] mb-1 opacity-50">{t.verifyOtp}</h3>
                       <p className="text-white font-black tracking-widest text-lg">****</p>
                       <div className="mt-8 flex justify-center">
                          <div className="w-16 h-16 bg-emerald-500/5 rounded-[2rem] flex items-center justify-center border border-emerald-500/20">
                             <ShieldCheck size={28} className="text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
                          </div>
                       </div>
                    </div>
                    
                    <input 
                      autoFocus
                      className="bg-transparent border-b border-white/10 focus:border-emerald-400 outline-none transition-all text-5xl font-black tracking-[0.4em] text-white text-center py-2 w-48" 
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />

                    <button 
                      onClick={() => { setStep('form'); setOtp(''); }}
                      className="flex items-center gap-2.5 mx-auto text-emerald-400 text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                    >
                      <ArrowLeft size={12} /> {t.back}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* SUBMIT BUTTON (Stay at Bottom) */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            onClick={handleAction}
            className="shrink-0 w-full py-4.5 rounded-[1.8rem] shadow-2xl transition-all flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white relative overflow-hidden group/btn z-20"
            style={{ backgroundColor: primaryColor, boxShadow: `0 15px 40px ${shadowColor}` }}
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
            {loading ? (
              <div className="animate-spin"><Waves size={18} /></div>
            ) : (
              <>
                <span className="relative z-10">{isRegister ? (step === 'otp' ? t.verifyAndJoin : t.getVerified) : t.signInPrompt}</span>
                <ChevronRight size={16} className="relative z-10" />
              </>
            )}
          </motion.button>
        </motion.div>

        {/* FOOTER MESSAGE */}
        <p className="text-center mt-6 text-white/10 text-[7.5px] font-black uppercase tracking-[0.4em] px-10 leading-loose shrink-0">
          Secure, Encrypted & Verified Cloud Service for Modern Aquaculture
        </p>
      </div>
    </div>
  );
};

