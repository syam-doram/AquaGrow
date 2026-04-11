import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Smartphone,
  Waves,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Droplets,
  CheckCircle2,
  Scale,
  MapPin,
  Navigation,
  Loader2,
  Store,
  Fish,
  Package,
  BarChart3,
  MessageSquare,
  ChevronRight,
  Building2,
  Tractor,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { Language } from '../../types';


// ─────────────────────────────────────────────────────────────────────────────
const FARMER_FEATURES = [
  { icon: Fish,         label: 'SOP-Driven Pond Intelligence',   sub: 'Daily culture guidance per DOC' },
  { icon: Droplets,     label: 'Live Water Quality Monitoring',  sub: 'DO, pH, temp, ammonia alerts' },
  { icon: BarChart3,    label: 'Harvest & ROI Tracking',        sub: 'Profit analysis per crop cycle' },
  { icon: MessageSquare, label: 'Disease & Lunar Alerts',       sub: 'WSSV, molting, vibriosis warnings' },
];
const PROVIDER_FEATURES = [
  { icon: Package,      label: 'Inventory Management',          sub: 'Seeds, feed, medicine, utility' },
  { icon: BarChart3,    label: 'Rate Cards & Market Pricing',   sub: 'Publish rates to farmers instantly' },
  { icon: Store,        label: 'Order & Delivery Tracking',     sub: 'Farmer order pipeline management' },
  { icon: MessageSquare, label: 'Farmer CRM & Chat',           sub: 'Direct farmer relationship hub' },
];

export const Register = ({ t, lang, onLanguageChange }: { t: Translations, lang: Language, onLanguageChange?: (l: Language) => void }) => {
  const { otpRegister, theme } = useData();
  const navigate = useNavigate();

  const [role, setRole] = useState<'farmer' | 'provider' | null>(null);
  const [step, setStep] = useState<'form' | 'terms' | 'otp'>('form');

  const [phone, setPhone]             = useState('');
  const [name, setName]               = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation]       = useState('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'done' | 'denied'>('idle');
  const [otp, setOtp]                 = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [otpSending, setOtpSending]   = useState(false);
  const [termsChecked, setTermsChecked]         = useState(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

  // Fast2SMS OTP state
  const [otpSent, setOtpSent]         = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const isDark      = theme === 'dark' || theme === 'midnight';
  const currentLang = lang;

  const farmerGradient   = 'linear-gradient(135deg, #059669 0%, #0D523C 100%)';
  const providerGradient = 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)';
  const accentColor      = role === 'provider' ? '#4f46e5' : '#059669';
  const accentGradient   = role === 'provider' ? providerGradient : farmerGradient;
  const shadowColor      = role === 'provider' ? 'rgba(79,70,229,0.25)' : 'rgba(5,150,105,0.25)';

  // ── GPS ─────────────────────────────────────────────────────────────────────
  const detectLocation = async () => {
    setLocationStatus('detecting');
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      const { latitude, longitude } = pos.coords;
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
      const geo  = await resp.json();
      const addr = geo.address;
      const label = [
        addr.village || addr.town || addr.suburb || addr.city_district || addr.city,
        addr.county || addr.state_district,
        addr.state,
      ].filter(Boolean).join(', ');
      setLocation(label || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
      setLocationStatus('done');
    } catch {
      setLocationStatus('denied');
    }
  };

  // ── Start resend cooldown timer ──────────────────────────────────────────────
  const startCooldown = (seconds = 60) => {
    setResendCooldown(seconds);
    const iv = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(iv); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Send OTP via Fast2SMS (server-side) ────────────────────────────────────
  const handleSendOtp = async () => {
    setError('');
    setOtpSending(true);
    try {
      const res = await fetch(`https://aquagrow.onrender.com/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\D/g, '') }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setOtpSent(true);
      startCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Check your connection.');
    } finally {
      setOtpSending(false);
    }
  };

  // ── Steps flow ───────────────────────────────────────────────────────────────
  const handleRegisterSteps = async () => {
    setError('');

    if (step === 'form') {
      const displayName = role === 'provider' ? (businessName.trim() || name.trim()) : name.trim();
      if (!displayName) { setError(role === 'provider' ? 'Please enter your business name' : 'Please enter your name'); return; }
      if (!phone)       { setError('Please enter your phone number'); return; }
      const phoneClean = phone.replace(/\D/g, '');
      if (!/^[6789]\d{9}$/.test(phoneClean)) { setError('Invalid phone number (10 digits required)'); return; }
      setStep('terms');
      return;
    }

    if (step === 'terms') {
      if (!termsChecked || !disclaimerChecked) { setError('Please accept both checkboxes to proceed.'); return; }
      // Move to OTP step and fire the OTP
      setStep('otp');
      await handleSendOtp();
      return;
    }

    // ── OTP step: verify via Fast2SMS then register ──────────────────────
    if (!otp || otp.length < 6) { setError('Please enter the 6-digit OTP'); return; }

    setLoading(true);
    try {
      const displayName = role === 'provider' ? (businessName.trim() || name.trim()) : name.trim();

      const result = await otpRegister(phone.replace(/\D/g, ''), otp, {
        name:     displayName || (role === 'provider' ? 'Provider' : 'Farmer Member'),
        role:     role!,
        location: location || 'Unknown',
        language: currentLang,
      });

      if (result.success) {
        navigate(role === 'provider' ? '/provider/dashboard' : '/dashboard');
      } else {
        setError(result.error || t.registrationFailed);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'otp')   { setStep('terms'); setOtpSent(false); setOtp(''); return; }
    if (step === 'terms') { setStep('form');  return; }
    setRole(null); setStep('form');
    setPhone(''); setName(''); setBusinessName(''); setLocation('');
    setLocationStatus('idle'); setOtp(''); setError('');
    setTermsChecked(false); setDisclaimerChecked(false);
    setOtpSent(false);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // ROLE GATEWAY
  // ───────────────────────────────────────────────────────────────────────────
  if (!role) {
    return (
      <div className="min-h-[100dvh] relative overflow-hidden flex flex-col font-sans tracking-tight" style={{ background: isDark ? '#030E1B' : '#F8FAFC' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[70%] rounded-full blur-[140px] bg-emerald-500/5" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[60%] rounded-full blur-[120px] bg-indigo-500/5" />
        </div>

        {/* Language */}
        <div className="absolute top-6 right-6 z-50">
          <div className={cn('flex p-1 rounded-2xl border shadow-lg', isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-100')}>
            {(['English', 'Telugu'] as const).map(l => (
              <button key={l} onClick={() => { if (onLanguageChange) onLanguageChange(l); }}
                className={cn('px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all', currentLang === l ? 'text-white shadow-lg bg-emerald-600' : isDark ? 'text-white/40' : 'text-slate-400')}
              >{l === 'English' ? 'EN' : 'తె'}</button>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="w-[4.5rem] h-[4.5rem] rounded-[1.8rem] flex items-center justify-center shadow-2xl bg-gradient-to-br from-emerald-500 to-teal-700 mx-auto mb-4">
              <Droplets size={30} className="text-white" />
            </div>
            <h1 className={cn('text-3xl font-black tracking-tighter mb-1', isDark ? 'text-white' : 'text-slate-900')}>AquaGrow</h1>
            <p className={cn('text-[8px] font-black uppercase tracking-[0.4em]', isDark ? 'text-white/25' : 'text-slate-400')}>Choose Your Portal</p>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className={cn('text-center text-[9px] font-bold uppercase tracking-widest mb-7', isDark ? 'text-white/25' : 'text-slate-400')}
          >← Select how you use AquaGrow →</motion.p>

          <div className="w-full max-w-[380px] space-y-4">
            {/* Farmer card */}
            <motion.button
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, type: 'spring', stiffness: 90 }}
              whileTap={{ scale: 0.98 }} onClick={() => setRole('farmer')}
              className="w-full rounded-[2.2rem] overflow-hidden border-2 border-emerald-500/30 shadow-xl text-left group"
              style={{ background: isDark ? 'rgba(13,82,60,0.25)' : 'rgba(240,253,244,0.95)' }}
            >
              <div className="h-[3px] w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: farmerGradient }}>
                      <Tractor size={22} className="text-white" />
                    </div>
                    <div>
                      <p className={cn('text-[9px] font-black uppercase tracking-[0.25em] mb-0.5', isDark ? 'text-emerald-400' : 'text-emerald-600')}>FARMER PORTAL</p>
                      <h2 className={cn('text-xl font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>I'm a Farmer</h2>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <ChevronRight size={16} className="text-emerald-500" />
                  </div>
                </div>
                <p className={cn('text-[9px] font-medium mb-4 leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
                  Managed ponds, SOP guidance, water quality tracking, harvest planning, and crop intelligence.
                </p>
                <div className="space-y-2">
                  {FARMER_FEATURES.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <f.icon size={10} className="text-emerald-500" />
                      </div>
                      <span className={cn('text-[8px] font-black uppercase tracking-wider', isDark ? 'text-white/50' : 'text-slate-600')}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.button>

            {/* Provider card */}
            <motion.button
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22, type: 'spring', stiffness: 90 }}
              whileTap={{ scale: 0.98 }} onClick={() => setRole('provider')}
              className="w-full rounded-[2.2rem] overflow-hidden border-2 border-indigo-500/30 shadow-xl text-left group"
              style={{ background: isDark ? 'rgba(30,27,75,0.35)' : 'rgba(245,243,255,0.95)' }}
            >
              <div className="h-[3px] w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: providerGradient }}>
                      <Building2 size={22} className="text-white" />
                    </div>
                    <div>
                      <p className={cn('text-[9px] font-black uppercase tracking-[0.25em] mb-0.5', isDark ? 'text-indigo-400' : 'text-indigo-600')}>SERVICE PROVIDER PORTAL</p>
                      <h2 className={cn('text-xl font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>I'm a Supplier</h2>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <ChevronRight size={16} className="text-indigo-500" />
                  </div>
                </div>
                <p className={cn('text-[9px] font-medium mb-4 leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
                  Sell seeds, feed, medicine & utilities to farmers. Manage inventory, orders, rates and customer relationships.
                </p>
                <div className="space-y-2">
                  {PROVIDER_FEATURES.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                        <f.icon size={10} className="text-indigo-500" />
                      </div>
                      <span className={cn('text-[8px] font-black uppercase tracking-wider', isDark ? 'text-white/50' : 'text-slate-600')}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.button>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className={cn('mt-7 text-[9px] font-black uppercase tracking-[0.2em] text-center', isDark ? 'text-white/20' : 'text-slate-400')}
          >
            {t.alreadyHaveAccount}{' '}
            <span onClick={() => navigate('/login')} className="cursor-pointer hover:underline underline-offset-4" style={{ color: '#059669' }}>{t.login}</span>
          </motion.p>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ROLE-SPECIFIC REGISTRATION FORM
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] relative overflow-hidden flex flex-col items-center font-sans tracking-tight" style={{ background: isDark ? '#030E1B' : '#F8FAFC' }}>


      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[100%] h-[80%] rounded-full blur-[140px] animate-pulse" style={{ background: `${accentColor}10` }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[90%] h-[70%] rounded-full blur-[120px]" style={{ background: `${accentColor}07` }} />
      </div>

      {/* Language */}
      <div className="absolute top-6 right-6 z-50">
        <div className={cn('flex p-1 rounded-2xl border shadow-lg', isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-100')}>
          {(['English', 'Telugu'] as const).map(l => (
            <button key={l} onClick={() => { if (onLanguageChange) onLanguageChange(l); }}
              className={cn('px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all', currentLang === l ? 'text-white shadow-lg' : isDark ? 'text-white/40' : 'text-slate-400')}
              style={currentLang === l ? { background: accentGradient } : {}}
            >{l === 'English' ? 'EN' : 'తె'}</button>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full px-5 flex-1 flex flex-col justify-center max-w-[360px] py-6">
        {/* Portal badge */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="relative inline-flex mb-4">
            <div className="w-[4.5rem] h-[4.5rem] rounded-[1.8rem] flex items-center justify-center shadow-2xl" style={{ background: accentGradient }}>
              {role === 'farmer' ? <Tractor size={28} className="text-white" /> : <Building2 size={28} className="text-white" />}
            </div>
            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute inset-0 rounded-[1.8rem] -z-10 blur-xl" style={{ background: accentGradient }} />
          </div>
          <h1 className={cn('text-xl font-black tracking-tighter mb-0.5', isDark ? 'text-white' : 'text-slate-900')}>
            {role === 'farmer' ? 'Farmer Registration' : 'Provider Registration'}
          </h1>
          <p className={cn('text-[7px] font-black uppercase tracking-[0.35em]', isDark ? 'text-white/25' : 'text-slate-400')}>
            {role === 'farmer' ? 'AquaGrow Farmer Portal' : 'AquaGrow Supplier Portal'}
          </p>
        </motion.div>

        {/* Portal role badge */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center justify-center gap-2 mb-5">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border text-[8px] font-black uppercase tracking-wider"
            style={{ background: `${accentColor}12`, borderColor: `${accentColor}30`, color: accentColor }}
          >
            {role === 'farmer' ? <Tractor size={11} /> : <Building2 size={11} />}
            {role === 'farmer' ? 'Farmer Portal · Pond & Crop Management' : 'Provider Portal · Inventory & Sales'}
          </div>
        </motion.div>

        {/* Auth Card */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20, delay: 0.15 }}
          className={cn('rounded-[2rem] p-6 border relative overflow-hidden',
            isDark ? 'bg-white/[0.04] border-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]'
                   : 'bg-white/80 border-white/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.07)]'
          )}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-2xl" style={{ background: accentGradient }} />

          <div className="space-y-5 relative z-10">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider leading-tight">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── FORM STEP ── */}
            {step === 'form' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3.5">
                <p className={cn('text-center text-[8px] font-black uppercase tracking-[0.25em]', isDark ? 'text-white/20' : 'text-slate-300')}>
                  {role === 'farmer' ? 'Join the Aquaculture Revolution' : 'Grow Your Supply Business'}
                </p>

                {/* Name fields */}
                {role === 'provider' ? (
                  <>
                    <div className="space-y-1.5">
                      <label className={cn('ml-4 text-[8px] font-black uppercase tracking-[0.25em] block', isDark ? 'text-white/30' : 'text-slate-400')}>Business / Company Name</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: accentColor }}><Building2 size={16} /></div>
                        <input className={cn('w-full pl-11 pr-5 py-4 rounded-[1.3rem] border outline-none transition-all text-[13px] font-semibold',
                          isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/30' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-300 focus:border-indigo-200 focus:bg-white')}
                          placeholder="e.g. Vijay Seeds & Agro" value={businessName} onChange={e => setBusinessName(e.target.value)} maxLength={80} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className={cn('ml-4 text-[8px] font-black uppercase tracking-[0.25em] block', isDark ? 'text-white/30' : 'text-slate-400')}>Owner / Contact Person</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: accentColor }}><UserIcon size={16} /></div>
                        <input className={cn('w-full pl-11 pr-5 py-4 rounded-[1.3rem] border outline-none transition-all text-[13px] font-semibold',
                          isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/30' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-300 focus:border-indigo-200 focus:bg-white')}
                          placeholder="e.g. Vijay Kumar" value={name} onChange={e => setName(e.target.value)} maxLength={60} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <label className={cn('ml-4 text-[8px] font-black uppercase tracking-[0.25em] block', isDark ? 'text-white/30' : 'text-slate-400')}>Your Full Name</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: accentColor }}><UserIcon size={16} /></div>
                      <input className={cn('w-full pl-11 pr-5 py-4 rounded-[1.3rem] border outline-none transition-all text-[13px] font-semibold',
                        isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/30' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-300 focus:border-emerald-200 focus:bg-white')}
                        placeholder="e.g. Ravi Kumar" value={name} onChange={e => setName(e.target.value)} maxLength={60} />
                    </div>
                  </div>
                )}

                {/* Location */}
                <div className="space-y-1.5">
                  <label className={cn('ml-4 text-[8px] font-black uppercase tracking-[0.25em] block', isDark ? 'text-white/30' : 'text-slate-400')}>
                    {role === 'farmer' ? 'Farm Location' : 'Business / Service Area'}
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: accentColor }}><MapPin size={16} /></div>
                    <input className={cn('w-full pl-11 pr-[4.5rem] py-4 rounded-[1.3rem] border outline-none transition-all text-[13px] font-semibold',
                      isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/30' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-300')}
                      placeholder={locationStatus === 'detecting' ? 'Detecting GPS...' : 'e.g. Nellore, AP'}
                      value={location} onChange={e => setLocation(e.target.value)} maxLength={80} />
                    <button type="button" disabled={locationStatus === 'detecting'} onClick={detectLocation}
                      className={cn('absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all',
                        locationStatus === 'detecting' ? 'opacity-50 cursor-not-allowed'
                          : locationStatus === 'done' ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                          : isDark ? 'bg-white/10 text-white/40' : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {locationStatus === 'detecting' ? <><Loader2 size={9} className="animate-spin" />...</>
                        : locationStatus === 'done' ? <><CheckCircle2 size={9} />GPS</>
                        : <><Navigation size={9} />GPS</>}
                    </button>
                  </div>
                  {locationStatus === 'denied' && <p className="ml-4 text-[8px] text-red-400 font-bold">GPS denied — type location manually above</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className={cn('ml-4 text-[8px] font-black uppercase tracking-[0.25em] block', isDark ? 'text-white/30' : 'text-slate-400')}>{t.phoneNumber}</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: accentColor }}><Smartphone size={16} /></div>
                    <div className={cn('absolute left-12 top-1/2 -translate-y-1/2 text-[11px] font-black', isDark ? 'text-white/30' : 'text-slate-400')}>+91</div>
                    <input className={cn('w-full pl-20 pr-5 py-4 rounded-[1.3rem] border outline-none transition-all text-[13px] font-semibold',
                      isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/30' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-300 focus:bg-white')}
                      placeholder="00000 00000" type="tel"
                      value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} maxLength={10} />
                  </div>
                </div>

                <motion.button onClick={handleRegisterSteps}
                  disabled={loading || phone.length < 10 || (role === 'provider' ? !businessName.trim() : !name.trim())}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-[1.4rem] text-[10px] font-black uppercase tracking-[0.3em] text-white disabled:opacity-40 transition-all"
                  style={{ background: accentGradient, boxShadow: `0 12px 32px ${shadowColor}` }}
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? <Waves size={18} className="animate-spin" /> : <>{t.getVerified} <ArrowRight size={14} /></>}
                  </span>
                </motion.button>

                <div className="flex items-center justify-center gap-2">
                  <ShieldCheck size={11} className="text-emerald-500" />
                  <p className={cn('text-[8px] font-black uppercase tracking-[0.2em]', isDark ? 'text-white/20' : 'text-slate-300')}>Your data is encrypted &amp; safe</p>
                </div>
              </motion.div>
            )}

            {/* ── TERMS STEP ── */}
            {step === 'terms' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Scale size={13} style={{ color: accentColor }} />
                  <p className={cn('text-[7px] font-black uppercase tracking-[0.2em]', isDark ? 'text-white/30' : 'text-slate-400')}>Terms &amp; Disclaimer — required to continue</p>
                </div>

                <label className={cn('flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all',
                  disclaimerChecked ? isDark ? 'bg-amber-500/10 border-amber-500/25' : 'bg-amber-50 border-amber-300' : isDark ? 'bg-white/3 border-white/8' : 'bg-white border-slate-200'
                )} onClick={() => setDisclaimerChecked(v => !v)}>
                  <div className={cn('w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                    disclaimerChecked ? 'bg-amber-500 border-amber-500' : isDark ? 'border-white/20' : 'border-slate-300')}>
                    {disclaimerChecked && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <div>
                    <p className={cn('text-[8px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-amber-400' : 'text-amber-700')}>⚠ Risk Disclaimer</p>
                    <p className={cn('text-[8px] leading-snug', isDark ? 'text-white/40' : 'text-slate-500')}>
                      AquaGrow is <strong>not responsible</strong> for crop loss, mortality, or financial losses.
                    </p>
                  </div>
                </label>

                <label className={cn('flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all',
                  termsChecked ? isDark ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-emerald-50 border-emerald-300' : isDark ? 'bg-white/3 border-white/8' : 'bg-white border-slate-200'
                )} onClick={() => setTermsChecked(v => !v)}>
                  <div className={cn('w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                    termsChecked ? 'bg-emerald-500 border-emerald-500' : isDark ? 'border-white/20' : 'border-slate-300')}>
                    {termsChecked && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <div>
                    <p className={cn('text-[8px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/50' : 'text-slate-700')}>📄 Terms &amp; Privacy Policy</p>
                    <p className={cn('text-[8px] leading-snug', isDark ? 'text-white/40' : 'text-slate-500')}>
                      I agree to AquaGrow's Terms of Service. Data is encrypted and never sold.
                    </p>
                  </div>
                </label>

                <motion.button onClick={handleRegisterSteps} disabled={loading || !termsChecked || !disclaimerChecked || otpSending}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-[1.4rem] text-[10px] font-black uppercase tracking-[0.3em] text-white disabled:opacity-40 transition-all"
                  style={{ background: accentGradient, boxShadow: `0 10px 28px ${shadowColor}` }}
                >
                  <span className="flex items-center justify-center gap-2">
                    {otpSending ? <><Waves size={16} className="animate-spin" /> Sending OTP...</> : <>Continue <ArrowRight size={13} /></>}
                  </span>
                </motion.button>
                <button onClick={goBack} className={cn('flex items-center justify-center gap-1.5 mx-auto text-[8px] font-bold uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
                  <ArrowLeft size={11} /> Change Number
                </button>
              </motion.div>
            )}

            {/* ── OTP STEP ── */}
            {step === 'otp' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-2">
                {/* Icon */}
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5 border"
                  style={{ background: `${accentColor}15`, borderColor: `${accentColor}30` }}>
                  {otpSending
                    ? <Waves style={{ color: accentColor }} size={26} className="animate-spin" />
                    : <ShieldCheck style={{ color: accentColor }} size={26} />}
                </div>

                <h3 className={cn('text-xs font-black uppercase tracking-[0.3em] mb-1', isDark ? 'text-white' : 'text-slate-900')}>
                  {otpSending ? 'Sending OTP...' : 'Enter OTP'}
                </h3>
                <p className={cn('text-[9px] font-bold uppercase tracking-wider mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
                  {otpSent ? `6-digit code sent to +91 ${phone}` : 'Preparing OTP...'}
                </p>

                {/* OTP type info */}
                <div className="flex items-center justify-center gap-1.5 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
                    Real SMS via Firebase · Delivered by Google
                  </span>
                </div>

                {/* OTP input */}
                <input
                  autoFocus
                  className={cn('bg-transparent border-b-2 text-4xl text-center w-48 tracking-[0.5em] outline-none mb-6 transition-colors',
                    isDark ? 'text-white border-white/20 focus:border-white/60' : 'text-slate-900 border-slate-200 focus:border-emerald-500'
                  )}
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  placeholder="------"
                  inputMode="numeric"
                />

                <div className="space-y-3">
                  <motion.button onClick={handleRegisterSteps} disabled={loading || otp.length < 6 || !otpSent}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 rounded-[1.8rem] text-white font-black text-[11px] uppercase tracking-widest disabled:opacity-50 transition-all"
                    style={{ background: accentGradient, boxShadow: `0 16px 36px ${shadowColor}` }}
                  >
                    {loading ? <Waves size={20} className="animate-spin mx-auto" /> : t.verifyAndJoin}
                  </motion.button>

                  {/* Resend */}
                  <button
                    onClick={handleSendOtp}
                    disabled={otpSending || resendCooldown > 0}
                    className={cn('flex items-center justify-center gap-1.5 mx-auto text-[9px] font-black uppercase tracking-widest transition-all',
                      isDark ? 'text-white/30 disabled:text-white/15' : 'text-slate-400 disabled:text-slate-300'
                    )}
                  >
                    {otpSending ? <><Loader2 size={11} className="animate-spin" /> Sending...</>
                      : resendCooldown > 0 ? `Resend in ${resendCooldown}s`
                      : <><RefreshCw size={11} /> Resend OTP</>}
                  </button>

                  <button onClick={goBack} className={cn('flex items-center justify-center gap-2 mx-auto text-[10px] font-bold uppercase tracking-widest transition-colors',
                    isDark ? 'text-white/30 hover:text-white/60' : 'text-slate-400 hover:text-slate-600')}>
                    <ArrowLeft size={14} /> <span>Change Phone</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-5 text-center space-y-2">
          <button onClick={goBack}
            className={cn('flex items-center justify-center gap-1.5 mx-auto text-[8px] font-black uppercase tracking-widest',
              isDark ? 'text-white/20 hover:text-white/40' : 'text-slate-300 hover:text-slate-500')}>
            <ArrowLeft size={10} />
            {step === 'form' ? `Switch to ${role === 'farmer' ? 'Provider' : 'Farmer'} Portal` : 'Back'}
          </button>
          <p className={cn('text-[9px] font-black uppercase tracking-[0.2em]', isDark ? 'text-white/20' : 'text-slate-400')}>
            {t.alreadyHaveAccount}{' '}
            <span onClick={() => navigate('/login')} className="cursor-pointer hover:underline underline-offset-4" style={{ color: accentColor }}>{t.login}</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
