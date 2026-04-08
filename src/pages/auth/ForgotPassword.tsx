import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Waves, 
  Smartphone, 
  AlertCircle, 
  ChevronRight, 
  Lock, 
  Eye, 
  EyeOff,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Language } from '../../types';
import { Translations } from '../../translations';
import { cn } from '../../utils/cn';

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

  const primaryColor = "#f97316"; // Orange 500

  const handleSendOtp = () => {
    if (phone.length < 10) {
      setError("Enter a valid 10-digit number");
      return;
    }
    setError(null);
    setLoading(true);
    // Mocking OTP send
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 1000);
  };

  const handleVerifyOtp = () => {
    if (otp !== '1234') {
      setError("Invalid OTP (Enter 1234)");
      return;
    }
    setError(null);
    setStep('reset');
  };

  const handleReset = async () => {
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const result = await resetPassword(phone, otp, newPassword);
    setLoading(false);
    if (result.success) {
      setStep('success');
    } else {
      setError(result.error || "Reset failed");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col relative overflow-hidden font-sans tracking-tight">
      {/* ── THEME MESH BACKGROUND ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={cn("absolute top-[-20%] left-[-10%] w-[100%] h-[80%] bg-primary/10 rounded-full blur-[140px] animate-pulse", theme === 'midnight' && "bg-glow-primary/20")} />
        <div className={cn("absolute bottom-[-15%] right-[-10%] w-[90%] h-[70%] bg-accent/10 rounded-full blur-[120px]", theme === 'midnight' && "bg-primary/10")} />
      </div>

      <div className="relative z-10 w-full px-4 flex-1 flex flex-col justify-center max-w-[320px] mx-auto">
        <button onClick={() => navigate('/login')} className="w-9 h-9 rounded-xl bg-card/40 backdrop-blur-xl border border-card-border flex items-center justify-center text-ink/40 mb-5 hover:bg-card hover:text-ink transition-all duration-700 shadow-sm ring-1 ring-white/10 hover:scale-110 group">
          <ArrowLeft size={17} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>

        {/* ── AUTH CARD ── */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="bg-card/50 backdrop-blur-[40px] rounded-[2rem] p-6 border border-white/80 shadow-[0_20px_50px_rgba(249,115,22,0.08)] relative overflow-hidden group ring-1 ring-white/30"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="text-center mb-6">
            <div className="w-13 h-13 bg-orange-100/50 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-200 group-hover:bg-orange-100 transition-colors duration-500 ring-1 ring-white/20">
              <Lock className="text-orange-600 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" size={22} />
            </div>
            <h2 className="text-xl font-serif italic text-ink mb-2 tracking-tight drop-shadow-sm">{t.forgotPassword}</h2>
            <p className="text-ink/40 text-[8px] font-black uppercase tracking-[0.25em] px-2 leading-relaxed opacity-80">
               {step === 'phone' && "Verify your identity to recover your account"}
               {step === 'otp' && "Enter the 4-digit code sent to your mobile"}
               {step === 'reset' && "Protect your account with a new password"}
               {step === 'success' && "Your account has been secured"}
            </p>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 text-red-600"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="text-[9px] font-black uppercase tracking-wider leading-tight">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {step === 'phone' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="space-y-1">
                  <label className="ml-4 text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.phoneNumber}</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-cyan-500 transition-colors duration-500">
                      <Smartphone size={14} />
                    </div>
                    <input 
                      className="w-full pl-12 pr-4 py-3 rounded-[1.2rem] border border-card-border bg-card/40 focus:border-primary/40 focus:bg-card outline-none transition-all duration-500 text-[12px] font-semibold text-ink placeholder:text-ink/20"
                      placeholder="00000 00000" 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} 
                      maxLength={10} 
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSendOtp} 
                  disabled={loading || phone.length < 10} 
                  className="group/btn w-full py-4 rounded-[1.4rem] bg-orange-500 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-xl relative overflow-hidden transition-all duration-700 disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-card/20 translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-700" />
                  <div className="absolute inset-x-0 top-0 h-px bg-card/30" />
                  <div className="relative z-10 flex items-center justify-center gap-2.5">
                    {loading ? <Waves size={18} className="animate-spin" /> : <span>Request Access</span>}
                    {!loading && <ChevronRight size={17} className="group-hover/btn:translate-x-1 transition-transform" />}
                  </div>
                </button>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                 <h3 className="text-ink text-[10px] font-black uppercase tracking-[0.3em] mb-6">{t.enterOtp}</h3>
                 <input 
                   autoFocus 
                   className="bg-transparent border-b-2 border-primary/20 text-3xl text-ink text-center w-32 tracking-[0.5em] outline-none mb-8 focus:border-primary transition-colors" 
                   maxLength={4} 
                   value={otp} 
                   onChange={(e) => setOtp(e.target.value)} 
                 />
                 <button 
                   onClick={handleVerifyOtp} 
                   className="w-full py-3.5 rounded-[1.2rem] bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all duration-700"
                 >
                  <span>Verify Identity</span>
                  <ChevronRight size={14} />
                </button>
              </motion.div>
            )}

            {step === 'reset' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="ml-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">New Password</label>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-cyan-500 transition-colors duration-500">
                      <Lock size={18} />
                    </div>
                    <input 
                      className="w-full pl-16 pr-14 py-4.5 rounded-[1.8rem] border border-slate-100 bg-card/50/50 focus:border-cyan-500/40 focus:bg-card outline-none transition-all duration-500 text-sm font-semibold text-slate-900 placeholder:text-slate-300" 
                      placeholder="••••••••" 
                      type={showPassword ? "text" : "password"} 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button 
                  onClick={handleReset} 
                  disabled={loading || newPassword.length < 6} 
                  className="w-full py-3.5 rounded-[1.2rem] bg-cyan-500 text-white text-[9px] font-black uppercase tracking-widest shadow transition-all duration-500 disabled:opacity-50"
                >
                   {loading ? <Waves size={16} className="animate-spin mx-auto" /> : <span>Secure Account</span>}
                </button>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6">
                 <div className="w-20 h-20 bg-orange-100/50 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-8 border border-orange-200 relative ring-1 ring-white/20">
                    <div className="absolute inset-0 bg-orange-100 rounded-full animate-ping opacity-30" />
                    <CheckCircle2 size={40} className="text-orange-600 relative z-10" />
                 </div>
                 <h3 className="text-ink text-xl font-bold mb-8 tracking-tight">Access Restored!</h3>
                 <p 
                  onClick={() => navigate('/login')} 
                  className="text-orange-600 hover:text-orange-700 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:underline underline-offset-4 transition-all"
                >
                   Return to Login
                 </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
