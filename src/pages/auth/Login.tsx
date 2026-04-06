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
  const { login, setUser, updateUser } = useData();
  const [role, setRole] = useState<'farmer' | 'provider'>('farmer');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
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
        // Automatic Trigger
        const phoneRaw = lastPhone.replace('+91 ', '');
        setPhone(phoneRaw); // Pre-fill
        
        // Wait slightly for UI to settle, then trigger
        setTimeout(() => {
           handleBiometricLogin(lastPhone);
        }, 500);
      }
    };
    initBio();
  }, []);

  const primaryColor = role === 'farmer' ? '#10B981' : '#F59E0B';
  const accentColor = role === 'farmer' ? '#059669' : '#D97706';
  const shadowColor = role === 'farmer' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)';

  const handleLogin = async () => {
    setError('');
    if (!phone || !password) {
      setError(t.fillAllFields || "Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const result = await login(`+91 ${phone.replace(/\D/g, '')}`, password);
      if (result.success) {
        // Handle Biometric Check
        if (canBiometric) {
          if (result.user.biometricEnabled) {
             await setBiometric(phone, password);
          } else if (!localStorage.getItem('aqua_bio_asked')) {
             if (window.confirm("Enable Biometric Login?")) {
                await setBiometric(phone, password);
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
    <div className="min-h-[100dvh] bg-[#021811] relative overflow-hidden flex flex-col items-center font-sans tracking-tight">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-[#10B981]/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#F59E0B]/5 rounded-full blur-[120px]" />
      </div>

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

      <div className="relative z-10 w-full px-6 flex-1 flex flex-col justify-start pt-24 pb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] backdrop-blur-3xl rounded-[2.2rem] p-6 border border-white/10 shadow-2xl"
        >
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-9 h-9 bg-white/10 backdrop-blur-3xl rounded-xl flex items-center justify-center border border-white/10 shadow-2xl">
                <Waves size={18} className="text-emerald-400" />
              </div>
              <h1 className="text-xl font-serif italic text-white tracking-tight">AquaGrow</h1>
            </div>
            <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.4em]">{t.login}</p>
          </div>

          <div className="flex p-1 bg-black/20 backdrop-blur-2xl rounded-[1.8rem] border border-white/5 mb-6 relative z-10">
            {['farmer', 'provider'].map((r) => (
              <button 
                key={r}
                onClick={() => setRole(r as any)}
                className={cn(
                  "flex-1 py-3 rounded-[1.5rem] flex items-center justify-center gap-2.5 transition-all text-[10px] font-black uppercase tracking-widest relative z-10",
                  role === r ? "text-white" : "text-white/30"
                )}
              >
                {role === r && (
                  <motion.div 
                    layoutId="role-bg-login" 
                    className="absolute inset-0 rounded-[1.5rem] -z-10"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, boxShadow: `0 8px 30px ${shadowColor}` }}
                  />
                )}
                {r === 'farmer' ? <UserIcon size={14} /> : <Zap size={14} />}
                <span>{t[r as keyof Translations] as string}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-red-400/10 border border-red-400/20 rounded-2xl flex items-center gap-3 text-red-400 leading-none">
                  <AlertCircle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Automatic Biometric Check Handled Below */}

            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400 transition-colors">
                <Smartphone size={16} />
              </div>
              <input 
                className="w-full pl-14 pr-6 py-3.5 rounded-[1.8rem] border border-white/5 bg-white/[0.02] focus:border-emerald-500/30 focus:bg-white/[0.08] outline-none transition-all text-sm font-semibold text-white placeholder:text-white/10 shadow-inner" 
                placeholder={t.phoneNumber || "Phone Number"} 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400 transition-colors">
                <Lock size={16} />
              </div>
              <input 
                className="w-full pl-14 pr-14 py-3.5 rounded-[1.8rem] border border-white/5 bg-white/[0.02] focus:border-emerald-500/40 focus:bg-white/[0.08] outline-none transition-all text-sm font-semibold text-white placeholder:text-white/10 shadow-inner" 
                placeholder={t.password || "Password"} 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              onClick={handleLogin}
              className="w-full py-4.5 rounded-[1.8rem] shadow-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white overflow-hidden relative group/btn"
              style={{ backgroundColor: primaryColor, boxShadow: `0 15px 40px ${shadowColor}` }}
            >
              {loading ? (
                <div className="animate-spin"><Waves size={18} /></div>
              ) : (
                <>
                  <span>{t.signInPrompt || 'Sign In'}</span>
                  <ChevronRight size={16} />
                </>
              )}
            </motion.button>

            <div className="text-center pt-4">
              <p className="text-white/20 text-[9px] font-black uppercase tracking-widest">
                Don't have an account? {' '}
                <Link to="/register" className="text-emerald-400 hover:underline">Register Now</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
