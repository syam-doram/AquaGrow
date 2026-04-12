import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon, Settings, ShieldCheck, CreditCard, ChevronRight,
  LogOut, MapPin, Activity, Zap, Globe, Sparkles, Phone, Mail,
  Award, Building2, XCircle, CheckCircle2, Fish, Droplets,
  TrendingUp, BarChart2, Moon, Sun, Star, Calendar,
  Target, Layers, Cpu, ArrowUpRight, Leaf, Fingerprint,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { API_BASE_URL } from '../../config';
import { calculateDOC } from '../../utils/pondUtils';
import { checkBiometric, deleteBiometric } from '../../utils/biometric';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';


export const Profile = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { user, setUser, isPro, theme, setAppTheme, ponds, feedLogs, waterRecords, medicineLogs } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  // ── Live farm metrics ──
  const activePonds  = useMemo(() => ponds.filter(p => p.status === 'active'), [ponds]);
  const totalFeedKg  = useMemo(() => Math.round(feedLogs.reduce((a, f) => a + (f.quantity || 0), 0) * 10) / 10, [feedLogs]);
  const avgDOC       = useMemo(() => {
    if (!activePonds.length) return 0;
    return Math.round(activePonds.reduce((a, p) => a + calculateDOC(p.stockingDate), 0) / activePonds.length);
  }, [activePonds]);
  const totalMedLogs  = medicineLogs.length;
  const totalWaterLogs = waterRecords.length;
  const harvestedPonds = ponds.filter(p => p.status === 'harvested').length;

  // ── Subscription label ──
  const subLabel = {
    pro_silver:  { name: 'Aqua Silver',  color: 'from-slate-400 to-slate-600',  badge: 'bg-slate-100 text-slate-600 border-slate-200' },
    pro_gold:    { name: 'Aqua Gold',    color: 'from-amber-400 to-amber-600',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    pro_diamond: { name: 'Aqua Diamond', color: 'from-blue-400 to-indigo-600',   badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    free:        { name: 'Free Tier',    color: 'from-slate-300 to-slate-500',   badge: 'bg-slate-50 text-slate-500 border-slate-200' },
    pro:         { name: 'AquaPro',      color: 'from-emerald-400 to-emerald-700',badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  }[user.subscriptionStatus] ?? { name: 'Standard', color: 'from-slate-300 to-slate-500', badge: 'bg-slate-50 text-slate-500 border-slate-200' };

  // ── Bank modal ──
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankStep, setBankStep]           = useState<'form' | 'verifying' | 'success'>('form');
  const [bankData, setBankData]           = useState(user?.bankDetails || {
    bankName: '', accountNumber: '', ifscCode: '', isVerified: false,
  });

  // ── Biometric toggle ──
  const [bioEnabled, setBioEnabled] = useState(user?.biometricEnabled ?? false);
  const [bioLoading, setBioLoading] = useState(false);

  React.useEffect(() => {
    if (user?.bankDetails) setBankData(user.bankDetails);
  }, [user?.bankDetails]);

  React.useEffect(() => {
    setBioEnabled(user?.biometricEnabled ?? false);
  }, [user?.biometricEnabled]);

  const toggleBiometric = async () => {
    if (bioLoading) return;
    setBioLoading(true);
    try {
      if (!bioEnabled) {
        // Check hardware first
        const available = await checkBiometric();
        if (!available) {
          alert('Biometric authentication is not available on this device.');
          return;
        }
        // Verify identity with fingerprint/face prompt
        try {
          await NativeBiometric.verifyIdentity({
            reason: 'Enable biometric login for AquaGrow',
            title: 'Verify Identity',
            subtitle: 'Confirm fingerprint / Face ID',
            description: 'This enables quick biometric login next time.',
          });
        } catch {
          alert('Biometric verification failed or was cancelled.');
          return;
        }
        // Mark enabled in DB + localStorage
        await updateUser({ biometricEnabled: true });
        const stored = localStorage.getItem('aqua_user');
        if (stored) {
          try {
            const u = JSON.parse(stored);
            localStorage.setItem('aqua_user', JSON.stringify({ ...u, biometricEnabled: true }));
            localStorage.setItem('aqua_bio_asked', 'true');
          } catch {}
        }
        setBioEnabled(true);
      } else {
        // Disable — remove stored credentials + flag
        await deleteBiometric();
        await updateUser({ biometricEnabled: false });
        const stored = localStorage.getItem('aqua_user');
        if (stored) {
          try {
            const u = JSON.parse(stored);
            localStorage.setItem('aqua_user', JSON.stringify({ ...u, biometricEnabled: false }));
          } catch {}
        }
        localStorage.removeItem('aqua_phone');
        setBioEnabled(false);
      }
    } catch (e) {
      console.error('[Biometric toggle]', e);
    } finally {
      setBioLoading(false);
    }
  };

  const handleVerifyBank = async () => {
    setBankStep('verifying');
    setTimeout(async () => {
      const updatedBank = { ...bankData, isVerified: true };
      setBankStep('success');
      setBankData(updatedBank);
      if (user?.id || (user as any)?._id) {
        try {
          const res = await fetch(`${API_BASE_URL}/user/${user.id || (user as any)._id}/profile`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bankDetails: updatedBank }),
          });
          if (res.ok) {
            const nu = { ...user, bankDetails: updatedBank };
            setUser(nu);
            localStorage.setItem('aqua_user', JSON.stringify(nu));
          }
        } catch (err) { console.error(err); }
      }
      setTimeout(() => { setShowBankModal(false); setBankStep('form'); }, 2000);
    }, 2500);
  };

  const navItems = [
    { icon: UserIcon,   label: t.editProfile,       path: '/profile/edit',         color: 'bg-amber-50 text-amber-600',          sub: 'Name, email, farm size' },
    { icon: ShieldCheck,label: t.securityPrivacy,   path: '/profile/security',     color: 'bg-emerald-50 text-emerald-600',      sub: 'Password, biometrics' },
    { icon: Globe,      label: t.language,           path: '/profile/language',     color: 'bg-[#C78200]/10 text-[#C78200]',      sub: '7 languages supported' },
    { icon: CreditCard, label: t.subscriptionPlan,  path: '/profile/subscription', color: 'bg-blue-50 text-blue-600',            sub: isPro ? 'Manage your plan' : 'Upgrade for more ponds' },
    { icon: Building2,  label: 'Banking & Payouts', onClick: () => navigate('/profile/bank'), color: 'bg-indigo-50 text-indigo-600', sub: user?.bankDetails?.isVerified ? '✓ Verified' : 'Add bank account' },
    { icon: Settings,   label: t.systemSettings,    path: '/profile/settings',     color: 'bg-slate-50 text-slate-500',          sub: 'Theme, units, push engine' },
  ];

  return (
    <div className={cn('pb-32 min-h-screen relative overflow-hidden', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>

      {/* Ambient glows */}
      <div className={cn('absolute top-0 right-0 w-[70%] h-[30%] rounded-full blur-[120px] -z-10', isDark ? 'bg-[#C78200]/5' : 'bg-amber-100/50')} />
      <div className={cn('absolute bottom-[20%] left-0 w-[50%] h-[30%] rounded-full blur-[120px] -z-10', isDark ? 'bg-emerald-900/20' : 'bg-emerald-100/40')} />

      <Header title={t.profile} showBack={true} onBack={() => navigate('/dashboard')} onMenuClick={onMenuClick} />

      <div className="pt-20 px-4 space-y-4">

        {/* ── HERO CARD ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className={cn('rounded-[2.5rem] p-5 relative overflow-hidden border shadow-lg', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100')}>
            {/* Gold gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#C78200]/5 via-transparent to-transparent pointer-events-none" />

            <div className="flex items-start gap-4 relative z-10">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-[1.8rem] ring-2 ring-[#C78200]/30 overflow-hidden shadow-xl">
                  <img src={`https://picsum.photos/seed/${user.name}/200/200`} className="w-full h-full object-cover" alt={user.name} />
                </div>
                <div className={cn('absolute -bottom-1 -right-1 w-7 h-7 rounded-xl flex items-center justify-center border-2', isDark ? 'border-[#0D1520]' : 'border-white', isPro ? 'bg-[#C78200] text-white' : 'bg-slate-200 text-slate-500')}>
                  {isPro ? <Sparkles size={12} /> : <UserIcon size={12} />}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={cn('text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', subLabel.badge)}>{subLabel.name}</span>
                  <span className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>{user.role}</span>
                </div>
                <h1 className={cn('text-xl font-black tracking-tight mb-0.5', isDark ? 'text-white' : 'text-slate-900')}>{user.name}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <div className={cn('flex items-center gap-1 text-[8px] font-bold', isDark ? 'text-white/30' : 'text-slate-500')}>
                    <Phone size={10} /> {user.phoneNumber}
                  </div>
                  {user.email && (
                    <div className={cn('flex items-center gap-1 text-[8px] font-bold', isDark ? 'text-white/30' : 'text-slate-500')}>
                      <Mail size={10} /> <span className="truncate max-w-[100px]">{user.email}</span>
                    </div>
                  )}
                  <div className={cn('flex items-center gap-1 text-[8px] font-bold', isDark ? 'text-white/30' : 'text-slate-500')}>
                    <MapPin size={10} /> {user.location}
                  </div>
                </div>
              </div>

              {/* Edit shortcut */}
              <button onClick={() => navigate('/profile/edit')} className={cn('w-9 h-9 rounded-2xl flex items-center justify-center border flex-shrink-0 transition-all', isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white/70' : 'bg-slate-100 border-slate-200 text-slate-500 shadow-sm')}>
                <ArrowUpRight size={15} />
              </button>
            </div>

            {/* Stats strip */}
            <div className={cn('grid grid-cols-4 gap-2 mt-4 pt-4 border-t', isDark ? 'border-white/5' : 'border-slate-100')}>
              {[
                { label: 'Active', value: activePonds.length, unit: 'ponds', icon: Fish, color: 'text-blue-400' },
                { label: 'Avg DOC', value: avgDOC,            unit: 'days',  icon: Calendar, color: 'text-amber-400' },
                { label: 'Feed',   value: `${totalFeedKg}kg`, unit: `${feedLogs.length} logs`, icon: Leaf, color: 'text-emerald-400' },
                { label: 'Harvested', value: harvestedPonds,  unit: 'ponds', icon: Target, color: 'text-purple-400' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <s.icon size={12} className={cn('mx-auto mb-1', s.color)} />
                  <p className={cn('text-sm font-black', s.color)}>{s.value}</p>
                  <p className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── CURRENT PLAN CARD ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className={cn('rounded-[2rem] p-4 relative overflow-hidden border', isDark ? 'border-white/5' : 'border-slate-100 shadow-sm',
            `bg-gradient-to-br ${subLabel.color}`)}>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white/50 text-[7px] font-black uppercase tracking-widest">Current Plan</p>
                  <h3 className="text-white font-black text-sm tracking-tight">{subLabel.name}</h3>
                  <p className="text-white/40 text-[7px] font-bold mt-0.5">{isPro ? `Up to ${user.pondCount} ponds · Premium features` : '1 pond · Upgrade for more'}</p>
                </div>
              </div>
              <button onClick={() => navigate('/profile/subscription')}
                className="px-4 py-2 bg-white/20 text-white font-black text-[8px] uppercase tracking-widest rounded-xl border border-white/20 hover:bg-white/30 transition-all">
                {isPro ? 'Manage' : 'Upgrade'}
              </button>
            </div>
            {user.subscriptionExpiry && (
              <p className="text-white/25 text-[7px] font-bold mt-3 relative z-10">
                Expires: {new Date(user.subscriptionExpiry).toLocaleDateString()}
              </p>
            )}
          </div>
        </motion.div>



        {/* ── ANALYTICS CARD ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
          <div className="bg-gradient-to-br from-[#051F19] to-[#0D523C] rounded-[2rem] p-5 border border-emerald-900/20 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-emerald-400/60 text-[7px] font-black uppercase tracking-widest">Live Farm Analytics</p>
                <h3 className="text-white font-black text-sm tracking-tight mt-0.5">Performance Overview</h3>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                <BarChart2 size={18} className="text-emerald-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Active Ponds',   value: activePonds.length,       unit: 'total ponds',       icon: Fish,       color: 'text-blue-400' },
                { label: 'Avg D.O.C',      value: `${avgDOC}d`,             unit: 'culture days',      icon: Activity,   color: 'text-amber-400' },
                { label: 'Feed Logged',    value: `${totalFeedKg}kg`,       unit: `${feedLogs.length} records`, icon: Droplets, color: 'text-emerald-400' },
                { label: 'Water Logs',     value: totalWaterLogs,           unit: 'quality readings',  icon: TrendingUp, color: 'text-sky-400' },
                { label: 'Medicine Apps',  value: totalMedLogs,             unit: 'treatments',        icon: Target,     color: 'text-purple-400' },
                { label: 'Harvested',      value: harvestedPonds,           unit: 'ponds done',        icon: Zap,        color: 'text-rose-400' },
              ].map((m, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-3 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <m.icon size={11} className={m.color} />
                    <p className="text-white/25 text-[6px] font-black uppercase tracking-widest">{m.label}</p>
                  </div>
                  <p className={cn('font-black text-xl tracking-tighter', m.color)}>{m.value}</p>
                  <p className="text-white/15 text-[6px] font-bold mt-0.5">{m.unit}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── DARK MODE TOGGLE ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <button
            onClick={() => setAppTheme(isDark ? 'light' : 'dark')}
            className={cn('w-full p-4 rounded-[2rem] border flex items-center justify-between group transition-all duration-500',
              isDark ? 'bg-[#0D1520] border-white/5 hover:border-white/10' : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'
            )}>
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border transition-all',
                isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-amber-50 border-amber-200 text-amber-600'
              )}>
                {isDark ? <Moon size={16} /> : <Sun size={16} />}
              </div>
              <div className="text-left">
                <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                  {isDark ? 'Midnight Mode' : 'Daylight Mode'}
                </p>
                <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
                  {isDark ? 'Optimized for night viewing' : 'Tap to switch to dark mode'}
                </p>
              </div>
            </div>
            <div className={cn('w-12 h-6 rounded-full relative transition-all duration-500', isDark ? 'bg-indigo-500' : 'bg-slate-200')}>
              <motion.div animate={{ x: isDark ? 24 : 2 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </button>
        </motion.div>

        {/* ── BIOMETRIC TOGGLE ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
          <button
            onClick={toggleBiometric}
            disabled={bioLoading}
            className={cn('w-full p-4 rounded-[2rem] border flex items-center justify-between group transition-all duration-500 disabled:opacity-60',
              isDark ? 'bg-[#0D1520] border-white/5 hover:border-white/10' : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'
            )}>
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border transition-all',
                bioEnabled
                  ? (isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600')
                  : (isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-slate-50 border-slate-200 text-slate-400')
              )}>
                {bioLoading
                  ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <Fingerprint size={16} />}
              </div>
              <div className="text-left">
                <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                  Biometric Login
                </p>
                <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
                  {bioEnabled ? '✓ Active — tap to disable' : 'Enable fingerprint / Face ID login'}
                </p>
              </div>
            </div>
            <div className={cn('w-12 h-6 rounded-full relative transition-all duration-500',
              bioEnabled ? 'bg-emerald-500' : (isDark ? 'bg-white/10' : 'bg-slate-200')
            )}>
              <motion.div animate={{ x: bioEnabled ? 24 : 2 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </button>
        </motion.div>

        {/* ── NAV ITEMS ── */}
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="space-y-2">
          <div className="flex items-center gap-2 px-1 mb-2">
            <Settings size={13} className={isDark ? 'text-white/20' : 'text-slate-400'} />
            <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>Account & Settings</p>
          </div>

          {navItems.map((item, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={() => item.onClick ? item.onClick() : navigate(item.path!)}
              className={cn('w-full p-4 rounded-[1.8rem] border flex items-center justify-between group transition-all',
                isDark ? 'bg-[#0D1520] border-white/5 hover:border-white/10' : 'bg-white border-slate-100 shadow-sm hover:border-[#C78200]/20'
              )}>
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border flex-shrink-0', item.color,
                  isDark ? 'border-white/5' : 'border-transparent'
                )}>
                  <item.icon size={16} />
                </div>
                <div className="text-left">
                  <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{item.label}</p>
                  <p className={cn('text-[7px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>{item.sub}</p>
                </div>
              </div>
              <ChevronRight size={14} className={cn('transition-all group-hover:translate-x-0.5', isDark ? 'text-white/15 group-hover:text-[#C78200]' : 'text-slate-300 group-hover:text-[#C78200]')} />
            </motion.button>
          ))}

          {/* Logout */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setUser(null)}
            className={cn('w-full mt-2 p-4 rounded-[1.8rem] border-2 flex items-center justify-between group transition-all',
              isDark ? 'bg-red-500/5 border-red-500/15 hover:bg-red-500/10' : 'bg-white border-red-100 hover:bg-red-50 shadow-sm'
            )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <LogOut size={16} />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black tracking-tight text-red-500">{t.logout}</p>
                <p className={cn('text-[7px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>Sign out from this device</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-red-400/40 group-hover:translate-x-0.5 transition-all" />
          </motion.button>
        </motion.section>

        {/* ── APP VERSION FOOTER ── */}
        <div className="text-center pb-4">
          <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/10' : 'text-slate-300')}>
            AquaGrow v2.0 · Smart Farm Intelligence
          </p>
        </div>
      </div>

      {/* ── BANK MODAL ── */}
      <AnimatePresence>
        {showBankModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBankModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className={cn('relative w-full max-w-md rounded-t-[2.5rem] p-5 shadow-2xl border-t',
                isDark ? 'bg-[#0D1520] border-white/10' : 'bg-white border-slate-100'
              )}>
              {/* Handle */}
              <div className={cn('w-12 h-1 rounded-full mx-auto mb-4', isDark ? 'bg-white/15' : 'bg-slate-300')} />

              <div className="flex items-center justify-between mb-5">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center border',
                  isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'
                )}>
                  <Building2 size={22} />
                </div>
                <button onClick={() => setShowBankModal(false)}
                  className={cn('w-9 h-9 rounded-2xl flex items-center justify-center border',
                    isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-slate-100 border-slate-200 text-slate-400'
                  )}>
                  <XCircle size={18} />
                </button>
              </div>

              {bankStep === 'form' ? (
                <>
                  <div className="mb-5">
                    <h2 className={cn('text-xl font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                      {user?.bankDetails?.isVerified ? 'Update Account' : 'Add Bank Account'}
                    </h2>
                    <p className={cn('text-[8px] font-black uppercase tracking-widest mt-1', isDark ? 'text-white/30' : 'text-slate-400')}>
                      For harvest payment settlements
                    </p>
                  </div>
                  <div className="space-y-3 mb-5">
                    {[
                      { label: 'Bank Name', field: 'bankName', placeholder: 'e.g. State Bank of India' },
                      { label: 'Account Number', field: 'accountNumber', placeholder: 'Full account number' },
                      { label: 'IFSC Code', field: 'ifscCode', placeholder: 'e.g. SBIN0001234' },
                    ].map(({ label, field, placeholder }) => (
                      <div key={field}>
                        <label className={cn('text-[7px] font-black uppercase tracking-widest mb-1.5 block', isDark ? 'text-white/25' : 'text-slate-400')}>{label}</label>
                        <input
                          className={cn('w-full px-4 py-3.5 rounded-2xl border text-sm font-bold outline-none transition-all',
                            isDark ? 'bg-white/5 border-white/10 text-white focus:border-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                          )}
                          value={(bankData as any)[field]}
                          placeholder={placeholder}
                          onChange={e => setBankData(prev => ({ ...prev, [field]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                  <button onClick={handleVerifyBank}
                    className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-xl shadow-blue-900/20">
                    Save & Verify <ShieldCheck size={14} />
                  </button>
                </>
              ) : bankStep === 'verifying' ? (
                <div className="py-14 flex flex-col items-center text-center">
                  <div className="w-14 h-14 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-5" />
                  <h2 className={cn('text-lg font-black tracking-tight mb-1', isDark ? 'text-white' : 'text-slate-900')}>Verifying</h2>
                  <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>Syncing with settlement network…</p>
                </div>
              ) : (
                <div className="py-14 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-5 shadow-xl shadow-emerald-900/20 animate-bounce">
                    <CheckCircle2 size={32} className="text-white" />
                  </div>
                  <h2 className={cn('text-xl font-black tracking-tight mb-1', isDark ? 'text-white' : 'text-slate-900')}>Verified!</h2>
                  <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>Account saved successfully</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
