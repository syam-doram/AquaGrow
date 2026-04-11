import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Waves,
  Smartphone,
  AlertCircle,
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Language } from '../../types';
import { Translations } from '../../translations';
import { cn } from '../../utils/cn';
import { sendOtp, verifyOtp, toE164India, clearRecaptcha } from '../../lib/firebaseAuth';
import type { OtpSession } from '../../lib/firebaseAuth';

interface ForgotPasswordProps {
  t: Translations;
  lang: Language;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ t }) => {
  const navigate = useNavigate();
  const { resetPassword, theme } = useData();
  
  const [step, setStep] = useState<'phone' | 'otp' | 'reset' | 'success'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pwStrength, setPwStrength] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const sessionRef = useRef<OtpSession | null>(null);   // holds verificationId between steps
  const idTokenRef = useRef<string>('');                 // holds Firebase ID token for reset

  const isDark = theme === 'dark';
  const accentColor = '#059669';
  const shadowColor = 'rgba(5,150,105,0.25)';
  const gradient = 'linear-gradient(135deg, #059669 0%, #0D523C 100%)';

  const stepInfo = [
    { label: 'Verify', icon: Smartphone },
    { label: 'Confirm', icon: ShieldCheck },
    { label: 'Reset', icon: KeyRound },
  ];
  const stepIndex = step === 'phone' ? 0 : step === 'otp' ? 1 : step === 'reset' ? 2 : 3;

  const calcPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][pwStrength];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500', 'bg-emerald-600'][pwStrength];

  // ── Step 1: Send Firebase OTP ─────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (phone.length < 10) { setError('Enter a valid 10-digit number'); return; }
    setError(null);
    setLoading(true);
    try {
      clearRecaptcha();
      const session = await sendOtp(toE164India(phone), 'recaptcha-forgot-container');
      sessionRef.current = session;
      setStep('otp');
      // 60-second resend cooldown
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
      }, 1000);
    } catch (err: any) {
      if (err.code === 'auth/invalid-phone-number')  setError('Invalid phone number.');
      else if (err.code === 'auth/too-many-requests') setError('Too many requests. Wait a few minutes and try again.');
      else setError(err.message || 'Failed to send OTP. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify Firebase OTP → get ID token ────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) { setError('Enter the 6-digit OTP'); return; }
    if (!sessionRef.current) { setError('OTP session expired. Please resend.'); return; }
    setError(null);
    setLoading(true);
    try {
      const idToken = await verifyOtp(sessionRef.current, otp);
      idTokenRef.current = idToken;   // store for the reset step
      setStep('reset');
    } catch (err: any) {
      if (err.code === 'auth/invalid-verification-code') setError('Wrong OTP. Please try again.');
      else if (err.code === 'auth/code-expired')          setError('OTP expired. Please resend.');
      else setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset password using ID token ────────────────────────────────
  const handleReset = async () => {
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    // Pass the Firebase ID token so the server can verify identity
    const result = await resetPassword(phone, idTokenRef.current, newPassword);
    setLoading(false);
    if (result.success) { setStep('success'); }
    else { setError(result.error || 'Reset failed'); }
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden flex flex-col font-sans tracking-tight" style={{ background: isDark ? '#030E1B' : '#F8FAFC' }}>
      
      {/* ── Mesh Background ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[100%] h-[80%] rounded-full blur-[140px] animate-pulse" style={{ background: `${accentColor}12` }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[90%] h-[70%] rounded-full blur-[120px]" style={{ background: `${accentColor}08` }} />
      </div>

      <div className="relative z-10 w-full px-5 flex flex-col max-w-[360px] mx-auto pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-10">
        
        {/* Back Button */}
        <button onClick={() => navigate('/login')} 
          className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-6 transition-all hover:scale-110 border",
            isDark ? "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white" : "bg-white border-gray-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
          )}
        >
          <ArrowLeft size={17} />
        </button>

        {/* Progress Steps */}
        {step !== 'success' && (
          <div className="flex items-center mb-8 gap-1">
            {stepInfo.map((s, i) => (
              <React.Fragment key={i}>
                <div className={cn("flex items-center gap-2 transition-all duration-500",
                  i === stepIndex ? "opacity-100" : i < stepIndex ? "opacity-60" : "opacity-20"
                )}>
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all",
                    i <= stepIndex ? "scale-100" : "scale-90"
                  )}
                    style={{ background: i <= stepIndex ? gradient : isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0' }}
                  >
                    {i < stepIndex 
                      ? <CheckCircle2 size={14} /> 
                      : <s.icon size={14} className={i <= stepIndex ? "text-white" : isDark ? "text-white/40" : "text-slate-400"} />
                    }
                  </div>
                  <span className={cn("text-[8px] font-black uppercase tracking-widest hidden sm:block",
                    isDark ? "text-white/40" : "text-slate-400"
                  )}>{s.label}</span>
                </div>
                {i < stepInfo.length - 1 && (
                  <div className={cn("flex-1 h-px mx-1 transition-all duration-700",
                    i < stepIndex 
                      ? "bg-gradient-to-r from-emerald-500/60 to-emerald-300/30" 
                      : isDark ? "bg-white/10" : "bg-slate-200"
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
          className={cn(
            "rounded-[2rem] p-6 border relative overflow-hidden",
            isDark 
              ? "bg-white/[0.04] border-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              : "bg-white/80 border-white/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.07)]"
          )}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-2xl" style={{ background: gradient }} />

          {/* Error */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 mb-5"
              >
                <AlertCircle size={14} className="shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider leading-tight">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === 'phone' && (
              <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h2 className={cn("text-xl font-black tracking-tighter mb-1", isDark ? "text-white" : "text-slate-900")}>{t.forgotPassword}</h2>
                  <p className={cn("text-[9px] font-black uppercase tracking-[0.2em]", isDark ? "text-white/30" : "text-slate-400")}>Verify your identity to recover access</p>
                </div>
                <div className="space-y-2">
                  <label className={cn("ml-4 text-[8px] font-black uppercase tracking-[0.25em] block", isDark ? "text-white/30" : "text-slate-400")}>{t.phoneNumber}</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-all" style={{ color: accentColor }}><Smartphone size={16} /></div>
                    <div className={cn("absolute left-12 top-1/2 -translate-y-1/2 text-[11px] font-black", isDark ? "text-white/30" : "text-slate-400")}>+91</div>
                    <input 
                      className={cn("w-full pl-20 pr-5 py-4 rounded-[1.3rem] border outline-none transition-all text-[13px] font-semibold",
                        isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/30" : "bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-300 focus:border-emerald-200 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.08)]"
                      )}
                      placeholder="00000 00000" type="tel" value={phone} 
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} maxLength={10}
                    />
                  </div>
                </div>
                <motion.button 
                  onClick={handleSendOtp} disabled={loading || phone.length < 10} whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-[1.4rem] text-[10px] font-black uppercase tracking-[0.3em] text-white disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  style={{ background: gradient, boxShadow: `0 12px 32px ${shadowColor}` }}
                >
                  {loading ? <Waves size={18} className="animate-spin" /> : <><span>Request Access</span><ChevronRight size={16} /></>}
                </motion.button>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center py-2">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5 border" style={{ background: `${accentColor}15`, borderColor: `${accentColor}30` }}>
                  <ShieldCheck style={{ color: accentColor }} size={26} />
                </div>
                <h3 className={cn("text-lg font-black tracking-tight mb-1", isDark ? "text-white" : "text-slate-900")}>{t.enterOtp}</h3>
                <p className={cn("text-[9px] font-bold uppercase tracking-wider mb-6", isDark ? "text-white/30" : "text-slate-400")}>Code sent to +91 {phone}</p>

                {/* 6-digit OTP input */}
                <input
                  autoFocus
                  inputMode="numeric"
                  className={cn(
                    "bg-transparent border-b-2 text-4xl text-center w-48 tracking-[0.5em] outline-none mb-6 transition-colors",
                    isDark ? "text-white border-white/20 focus:border-white/60" : "text-slate-900 border-slate-200 focus:border-emerald-500"
                  )}
                  maxLength={6} value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />

                <motion.button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length < 6}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-[1.8rem] text-white font-black text-[11px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 mb-4"
                  style={{ background: gradient, boxShadow: `0 16px 36px ${shadowColor}` }}
                >
                  {loading
                    ? <Waves size={18} className="animate-spin" />
                    : <><span>Verify Identity</span><ChevronRight size={16} /></>}
                </motion.button>

                {/* Resend */}
                <button
                  onClick={handleSendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className={cn(
                    "text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 mx-auto transition-all",
                    resendCooldown > 0 ? (isDark ? 'text-white/20' : 'text-slate-300') : (isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700')
                  )}
                >
                  <RefreshCw size={11} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>

                {/* Hidden reCAPTCHA anchor for web fallback */}
                <div id="recaptcha-forgot-container" />
              </motion.div>
            )}

            {step === 'reset' && (
              <motion.div key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h2 className={cn("text-xl font-black tracking-tighter mb-1", isDark ? "text-white" : "text-slate-900")}>New Password</h2>
                  <p className={cn("text-[9px] font-black uppercase tracking-[0.2em]", isDark ? "text-white/30" : "text-slate-400")}>Secure your account with a strong key</p>
                </div>
                <div className="space-y-2">
                  <label className={cn("ml-4 text-[8px] font-black uppercase tracking-[0.25em] block", isDark ? "text-white/30" : "text-slate-400")}>New Password</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-all" style={{ color: accentColor }}><Lock size={16} /></div>
                    <input 
                      className={cn("w-full pl-12 pr-12 py-4 rounded-[1.3rem] border outline-none transition-all text-[13px] font-semibold",
                        isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/30" : "bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-300 focus:border-emerald-200 focus:bg-white"
                      )}
                      placeholder="••••••••" type={showPassword ? "text" : "password"} value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPwStrength(calcPasswordStrength(e.target.value)); }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} 
                      className={cn("absolute right-4 top-1/2 -translate-y-1/2 transition-all", isDark ? "text-white/30 hover:text-white/60" : "text-slate-300 hover:text-slate-600")}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* Strength Bar */}
                  {newPassword.length > 0 && (
                    <div className="px-1">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={cn("flex-1 h-1 rounded-full transition-all duration-500", i <= pwStrength ? strengthColor : isDark ? "bg-white/10" : "bg-slate-200")} />
                        ))}
                      </div>
                      <p className={cn("text-[8px] font-black uppercase tracking-wider", pwStrength <= 2 ? "text-red-500" : pwStrength <= 3 ? "text-amber-500" : "text-emerald-500")}>{strengthLabel}</p>
                    </div>
                  )}
                </div>
                <motion.button 
                  onClick={handleReset} disabled={loading || newPassword.length < 6} whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-[1.4rem] text-[10px] font-black uppercase tracking-[0.3em] text-white disabled:opacity-40 transition-all"
                  style={{ background: gradient, boxShadow: `0 12px 32px ${shadowColor}` }}
                >
                  {loading ? <Waves size={18} className="animate-spin mx-auto" /> : 'Secure Account'}
                </motion.button>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative border" style={{ background: `${accentColor}15`, borderColor: `${accentColor}30` }}>
                  <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 rounded-full" style={{ background: `${accentColor}20` }} />
                  <CheckCircle2 size={40} style={{ color: accentColor }} className="relative z-10" />
                </div>
                <h3 className={cn("text-2xl font-black tracking-tighter mb-2", isDark ? "text-white" : "text-slate-900")}>Access Restored!</h3>
                <p className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-8", isDark ? "text-white/30" : "text-slate-400")}>Your account has been secured</p>
                <motion.button 
                  onClick={() => navigate('/login')} whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-[1.8rem] text-white font-black text-[11px] uppercase tracking-widest transition-all"
                  style={{ background: gradient, boxShadow: `0 16px 36px ${shadowColor}` }}
                >
                  Return to Login
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
