import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Smartphone,
  Lock,
  Waves,
  AlertCircle,
  Eye,
  EyeOff,
  Fingerprint,
  Zap,
  ArrowRight,
  ShieldCheck,
  Droplets,
  ChevronRight,
  X,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { checkBiometric, getBiometric, setBiometric } from '../../utils/biometric';
import { Language } from '../../types';

export const Login = ({ t, lang, onLanguageChange }: { t: Translations; lang: Language; onLanguageChange?: (l: Language) => void }) => {
  const { login, loginWithOtp, updateUser, user: ctxUser, theme } = useData();
  const [role, setRole] = useState<'farmer' | 'provider'>('farmer');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [canBiometric, setCanBiometric] = useState(false);
  const [hasSavedBio, setHasSavedBio] = useState(false);

  // Setup prompt: shown after first successful login if biometric available
  const [showBioSetup, setShowBioSetup] = useState(false);
  const [pendingLoginResult, setPendingLoginResult] = useState<any>(null);
  const [bioSuccess, setBioSuccess] = useState(false);

  const navigate = useNavigate();
  const isDark = theme === 'dark';

  // Helper: navigate to the correct home based on user role from server
  const goHome = (userObj?: any) => {
    const resolvedRole = userObj?.role || ctxUser?.role;
    navigate(resolvedRole === 'provider' ? '/provider/dashboard' : '/dashboard');
  };

  const farmerGradient = 'linear-gradient(135deg, #059669 0%, #0D523C 100%)';
  const providerGradient = 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)';
  const activeGradient = role === 'farmer' ? farmerGradient : providerGradient;
  const accentColor = role === 'farmer' ? '#10b981' : '#6366f1';
  const shadowColor = role === 'farmer' ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.25)';
  const primaryColor = role === 'farmer' ? '#059669' : '#4f46e5';

  // ── Check biometric on mount ──────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const bioAvailable = await checkBiometric();
      setCanBiometric(bioAvailable);

      const lastPhone = localStorage.getItem('aqua_phone');
      if (bioAvailable && lastPhone) {
        const phoneRaw = lastPhone.replace('+91 ', '');
        setPhone(phoneRaw);
        setHasSavedBio(true);
        // Auto-trigger after short delay so the UI renders first
        setTimeout(() => handleBiometricLogin(lastPhone), 600);
      }
    };
    init();
  }, []);

  // ── Biometric Login ───────────────────────────────────────────────────────
  const handleBiometricLogin = async (providedPhone?: string) => {
    const targetPhone = (providedPhone || phone).replace(/\D/g, '');
    if (!targetPhone) { setError('Enter phone number first'); return; }
    setLoading(true);
    setError('');
    try {
      const pass = await getBiometric(targetPhone);
      if (pass) {
        const result = await login(`+91 ${targetPhone}`, pass, role);
        if (result.success) {
          setBioSuccess(true);
          setTimeout(() => goHome(result?.user), 800);
        } else {
          setError(result.error || 'Biometric login failed');
          setHasSavedBio(false);
        }
      } else {
        setError('No saved credentials. Use password to login.');
        setHasSavedBio(false);
      }
    } catch {
      setError('Biometric auth failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Password / OTP Login ──────────────────────────────────────────────────
  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const fullPhone = `+91 ${phone.replace(/\D/g, '')}`;
      let result;
      if (step === 'otp') {
        result = await loginWithOtp(fullPhone, otp, role);
      } else {
        result = await login(fullPhone, password, role);
      }

      if (result.success) {
        // If biometric is available and user has it enabled → save creds silently, go to dashboard
        if (canBiometric && (result.user as any)?.biometricEnabled) {
          if (step !== 'otp') await setBiometric(phone, password);
          goHome(result.user);
          return;
        }

        // If biometric available but not yet set up → show our premium setup prompt
        if (canBiometric && !localStorage.getItem('aqua_bio_asked')) {
          setPendingLoginResult(result);
          setShowBioSetup(true);
          return;
        }

        goHome(result.user);
      } else {
        setError(result.error || t.loginFailed);
      }
    } catch {
      setError('Connection Error');
    } finally {
      setLoading(false);
    }
  };

  // ── Biometric Setup Decision ──────────────────────────────────────────────
  const acceptBioSetup = async () => {
    try {
      await setBiometric(phone, password);
      await updateUser({ biometricEnabled: true });
      localStorage.setItem('aqua_bio_asked', 'true');
    } catch { /* silent */ }
    setShowBioSetup(false);
    goHome(pendingLoginResult?.user);
  };

  const declineBioSetup = () => {
    localStorage.setItem('aqua_bio_asked', 'true');
    setShowBioSetup(false);
    goHome(pendingLoginResult?.user);
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden flex flex-col items-center font-sans tracking-tight" style={{ background: isDark ? '#030E1B' : '#F8FAFC' }}>

      {/* ── Premium Mesh Background ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[100%] h-[80%] rounded-full blur-[140px] animate-pulse" style={{ background: `${accentColor}15` }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[90%] h-[70%] rounded-full blur-[120px]" style={{ background: `${primaryColor}10` }} />
        <div className="absolute top-[40%] right-[5%] w-[40%] h-[40%] rounded-full blur-[100px]" style={{ background: `${accentColor}08` }} />
        <svg className="absolute bottom-0 left-0 w-full opacity-10" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,64L48,74.7C96,85,192,107,288,101.3C384,96,480,64,576,48C672,32,768,32,864,42.7C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L0,120Z" fill={accentColor} />
        </svg>
      </div>

      {/* ── BIOMETRIC SETUP MODAL ── */}
      <AnimatePresence>
        {showBioSetup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-end justify-center p-4 pb-8"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 260 }}
              className={cn('w-full max-w-[380px] rounded-[2.5rem] p-7 border relative overflow-hidden',
                isDark ? 'bg-[#0D1520] border-white/10' : 'bg-white border-slate-100 shadow-2xl'
              )}
            >
              {/* Top shine */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

              {/* Dismiss */}
              <button onClick={declineBioSetup}
                className={cn('absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center',
                  isDark ? 'bg-white/5 text-white/30 hover:text-white/60' : 'bg-slate-50 text-slate-300 hover:text-slate-600'
                )}>
                <X size={14} />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-5">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-20 h-20 rounded-[2rem] flex items-center justify-center relative"
                  style={{ background: 'linear-gradient(135deg, #059669, #0D523C)' }}
                >
                  <Fingerprint size={38} className="text-white" />
                  <div className="absolute inset-0 rounded-[2rem]" style={{ boxShadow: '0 0 40px rgba(16,185,129,0.4)' }} />
                </motion.div>
              </div>

              <div className="text-center mb-6">
                <h2 className={cn('text-lg font-black tracking-tight mb-2', isDark ? 'text-white' : 'text-slate-900')}>
                  Enable Biometric Login
                </h2>
                <p className={cn('text-[10px] font-medium leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
                  Use your fingerprint or Face ID to sign in instantly — no password needed next time.
                </p>
              </div>

              {/* Features list */}
              <div className={cn('rounded-2xl p-4 space-y-2.5 mb-6 border',
                isDark ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-emerald-50 border-emerald-100'
              )}>
                {[
                  '🔐 Login in under 1 second',
                  '🛡 Credentials stored in your phone\'s secure chip',
                  '🚫 Password never leaves your device',
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <p className={cn('text-[10px] font-bold leading-snug', isDark ? 'text-white/60' : 'text-slate-700')}>{f}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={declineBioSetup}
                  className={cn('flex-1 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all',
                    isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white/60' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                  )}>
                  Skip
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={acceptBioSetup}
                  className="flex-[2] py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 shadow-lg"
                  style={{ background: farmerGradient, boxShadow: '0 10px 30px rgba(16,185,129,0.3)' }}
                >
                  <Fingerprint size={15} />
                  Enable Now
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Language Selector ── */}
      <div className="absolute top-6 right-6 z-50">
        <div className={cn('flex p-1 rounded-2xl border shadow-lg', isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-100 backdrop-blur-xl')}>
          {(['English', 'Telugu'] as const).map((l) => (
            <button
              key={l}
              onClick={() => { if (onLanguageChange) onLanguageChange(l); }}
              className={cn(
                'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500',
                lang === l ? 'text-white shadow-lg' : isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'
              )}
              style={lang === l ? { background: activeGradient } : {}}
            >
              {l === 'English' ? 'EN' : 'తె'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full px-5 flex-1 flex flex-col justify-center max-w-[360px]">

        {/* ── Brand Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80 }}
          className="text-center mb-8"
        >
          <div className="relative inline-flex mb-5">
            <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl relative overflow-hidden" style={{ background: activeGradient }}>
              <Droplets size={36} className="text-white relative z-10" />
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-[2rem] -z-10"
              style={{ background: activeGradient, filter: 'blur(20px)' }}
            />
          </div>
          <h1 className={cn('text-3xl font-black tracking-tighter mb-1', isDark ? 'text-white' : 'text-slate-900')}>AquaGrow</h1>
          <p className={cn('text-[10px] font-black uppercase tracking-[0.4em]', isDark ? 'text-white/30' : 'text-slate-400')}>
            Smart Aquaculture Platform
          </p>
        </motion.div>

        {/* ── Role Switcher ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={cn('flex p-1.5 rounded-[1.6rem] mb-6 border shadow-sm', isDark ? 'bg-white/5 border-white/10' : 'bg-white/70 border-gray-100 backdrop-blur-xl')}
        >
          {['farmer', 'provider'].map((r) => (
            <button
              key={r} onClick={() => setRole(r as any)}
              className={cn(
                'flex-1 py-3 rounded-[1.2rem] flex items-center justify-center gap-2 transition-all duration-500 text-[10px] font-black uppercase tracking-wider',
                role === r ? 'text-white shadow-xl' : isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'
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
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20, delay: 0.15 }}
          className={cn(
            'rounded-[2rem] p-6 border relative overflow-hidden',
            isDark
              ? 'bg-white/[0.04] border-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]'
              : 'bg-white/80 border-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]'
          )}
        >
          {/* Top shine */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-2xl" style={{ background: activeGradient }} />

          <div className="space-y-5 relative z-10">

            {/* Error banner */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider leading-tight">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── BIOMETRIC QUICK-LOGIN BUTTON (if creds are saved) ── */}
            <AnimatePresence>
              {canBiometric && hasSavedBio && !bioSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={cn('rounded-2xl border p-4 flex items-center gap-4',
                    isDark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                  )}
                >
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleBiometricLogin()}
                    disabled={loading}
                    className="w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden"
                    style={{ background: farmerGradient }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {loading && hasSavedBio
                        ? <Waves size={24} className="text-white animate-spin" />
                        : <Fingerprint size={26} className="text-white" />
                      }
                    </motion.div>
                    <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: '0 0 24px rgba(16,185,129,0.5)' }} />
                  </motion.button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                      {t.biometricLogin}
                    </p>
                    <p className={cn('text-[9px] font-medium mt-0.5', isDark ? 'text-white/40' : 'text-slate-500')}>
                      Tap fingerprint to login instantly
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-emerald-400' : 'text-emerald-600')}>Active</span>
                  </div>
                </motion.div>
              )}

              {/* Biometric success flash */}
              {bioSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border p-4 flex items-center justify-center gap-3 bg-emerald-500/10 border-emerald-500/20"
                >
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Biometric Verified!</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Divider if bio visible */}
            {canBiometric && hasSavedBio && (
              <div className="flex items-center gap-3">
                <div className={cn('h-px flex-1', isDark ? 'bg-white/8' : 'bg-slate-100')} />
                <span className={cn('text-[8px] font-black uppercase tracking-[0.3em]', isDark ? 'text-white/20' : 'text-slate-300')}>or use password</span>
                <div className={cn('h-px flex-1', isDark ? 'bg-white/8' : 'bg-slate-100')} />
              </div>
            )}

            {/* ── PASSWORD FORM ── */}
            {step === 'form' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Phone */}
                <div className="space-y-2">
                  <label className={cn('ml-4 text-[8px] font-black uppercase tracking-[0.25em] block', isDark ? 'text-white/30' : 'text-slate-400')}>
                    {t.phoneNumber}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-500 group-focus-within:scale-110" style={{ color: accentColor }}>
                      <Smartphone size={16} />
                    </div>
                    <div className={cn('absolute left-12 top-1/2 -translate-y-1/2 text-[11px] font-black', isDark ? 'text-white/30' : 'text-slate-400')}>+91</div>
                    <input
                      className={cn(
                        'w-full pl-20 pr-5 py-4 rounded-[1.3rem] border outline-none transition-all duration-300 text-[13px] font-semibold',
                        isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:bg-white/8'
                          : 'bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-300 focus:border-emerald-200 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.08)]'
                      )}
                      placeholder="00000 00000"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className={cn('ml-4 text-[8px] font-black uppercase tracking-[0.25em] block', isDark ? 'text-white/30' : 'text-slate-400')}>
                    {t.password}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-500 group-focus-within:scale-110" style={{ color: accentColor }}>
                      <Lock size={16} />
                    </div>
                    <input
                      className={cn(
                        'w-full pl-12 pr-12 py-4 rounded-[1.3rem] border outline-none transition-all duration-300 text-[13px] font-semibold',
                        isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:bg-white/8'
                          : 'bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-300 focus:border-emerald-200 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.08)]'
                      )}
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && phone.length >= 10 && password && handleLogin()}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className={cn('absolute right-4 top-1/2 -translate-y-1/2 hover:scale-110 transition-all duration-300', isDark ? 'text-white/30 hover:text-white/60' : 'text-slate-300 hover:text-slate-600')}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={() => navigate('/forgot-password')}
                    className="text-[10px] font-black uppercase tracking-wider hover:opacity-80 transition-all"
                    style={{ color: accentColor }}>
                    {t.forgotPassword}
                  </button>
                </div>

                {/* Sign In */}
                <motion.button
                  onClick={handleLogin}
                  disabled={loading || phone.length < 10 || !password}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-[1.4rem] text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all duration-500 disabled:opacity-40 relative overflow-hidden"
                  style={{ background: activeGradient, boxShadow: `0 12px 32px ${shadowColor}` }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? <Waves size={18} className="animate-spin" /> : (
                      <>{t.signInPrompt}<ArrowRight size={14} /></>
                    )}
                  </span>
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className={cn('h-px flex-1', isDark ? 'bg-white/10' : 'bg-slate-100')} />
                  <span className={cn('text-[8px] font-black uppercase tracking-[0.3em]', isDark ? 'text-white/20' : 'text-slate-300')}>Or</span>
                  <div className={cn('h-px flex-1', isDark ? 'bg-white/10' : 'bg-slate-100')} />
                </div>

                {/* OTP Button */}
                <motion.button
                  onClick={() => setStep('otp')}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'w-full py-4 rounded-[1.4rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 border',
                    isDark
                      ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                      : 'bg-slate-50/80 border-slate-100 text-slate-500 hover:bg-white hover:text-slate-900'
                  )}
                >
                  <Smartphone size={16} className="opacity-60" />
                  <span>Login with OTP</span>
                </motion.button>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  <p className={cn('text-[8px] font-black uppercase tracking-[0.2em]', isDark ? 'text-white/20' : 'text-slate-300')}>256-bit encrypted · Secure login</p>
                </div>
              </motion.div>
            )}

            {/* ── OTP STEP ── */}
            {step === 'otp' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 border"
                  style={{ background: `${accentColor}15`, borderColor: `${accentColor}30` }}>
                  <Smartphone style={{ color: accentColor }} size={26} />
                </div>
                <h3 className={cn('text-xs font-black uppercase tracking-[0.3em] mb-2', isDark ? 'text-white' : 'text-slate-900')}>{t.enterOtp}</h3>
                <p className={cn('text-[9px] font-bold uppercase tracking-wider mb-6', isDark ? 'text-white/30' : 'text-slate-400')}>
                  Code sent to +91 {phone}
                </p>
                <input
                  autoFocus
                  className={cn(
                    'bg-transparent border-b-2 text-4xl text-center w-40 tracking-[0.5em] outline-none mb-8 transition-colors',
                    isDark ? 'text-white border-white/20 focus:border-white/60' : 'text-slate-900 border-slate-200 focus:border-emerald-500'
                  )}
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <div className="space-y-3">
                  <motion.button
                    onClick={handleLogin}
                    disabled={loading || otp.length < 4}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 rounded-[1.8rem] text-white text-[11px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50 transition-all duration-500"
                    style={{ background: activeGradient, boxShadow: `0 16px 36px ${shadowColor}` }}
                  >
                    {loading ? <Waves size={20} className="animate-spin mx-auto" /> : t.verifyOtp}
                  </motion.button>
                  <button
                    onClick={() => setStep('form')}
                    className={cn('flex items-center justify-center gap-2 mx-auto text-[10px] font-bold uppercase tracking-widest transition-colors', isDark ? 'text-white/30 hover:text-white/60' : 'text-slate-400 hover:text-slate-600')}
                  >
                    <div className="rotate-180 inline-block"><ChevronRight size={14} /></div>
                    <span>Back to Password</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <p className={cn('text-[9px] font-black uppercase tracking-[0.2em]', isDark ? 'text-white/20' : 'text-slate-400')}>
            {t.dontHaveAccount}{' '}
            <span
              onClick={() => navigate('/register')}
              className="cursor-pointer hover:opacity-80 transition-all hover:underline underline-offset-4 font-black"
              style={{ color: accentColor }}
            >
              {t.register}
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
