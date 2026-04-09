import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, Shield, Eye, Database, ChevronRight,
  Fingerprint, KeyRound, Download, AlertTriangle,
  CheckCircle2, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../../components/Header';
import type { Translations } from '../../translations';
import { cn } from '../../utils/cn';
import { useData } from '../../context/DataContext';
import { checkBiometric, deleteBiometric } from '../../utils/biometric';

export const SecurityPrivacy = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { user, updateUser, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [biometricEnabled, setBiometricEnabled] = useState(user?.biometricEnabled ?? false);
  const [checkingBio, setCheckingBio]           = useState(false);
  const [showChangePass, setShowChangePass]      = useState(false);
  const [passData, setPassData]                  = useState({ current: '', next: '', confirm: '' });
  const [passErr, setPassErr]                    = useState('');
  const [passSaving, setPassSaving]              = useState(false);
  const [passSuccess, setPassSuccess]            = useState(false);

  const toggleBiometric = async () => {
    setCheckingBio(true);
    try {
      if (!biometricEnabled) {
        const available = await checkBiometric();
        if (available) {
          await updateUser({ biometricEnabled: true });
          setBiometricEnabled(true);
        } else {
          alert('Biometrics not available on this device.');
        }
      } else {
        await deleteBiometric();
        await updateUser({ biometricEnabled: false });
        setBiometricEnabled(false);
      }
    } catch (e) { console.error(e); }
    finally     { setCheckingBio(false); }
  };

  const handleChangePassword = async () => {
    if (!passData.next || passData.next.length < 6) { setPassErr('Password must be at least 6 characters'); return; }
    if (passData.next !== passData.confirm)          { setPassErr('Passwords do not match'); return; }
    setPassErr(''); setPassSaving(true);
    try {
      // Simulate API call
      await new Promise(r => setTimeout(r, 1500));
      setPassSuccess(true);
      setTimeout(() => { setShowChangePass(false); setPassSuccess(false); setPassData({ current: '', next: '', confirm: '' }); }, 2000);
    } catch { setPassErr('Failed to update password.'); }
    finally   { setPassSaving(false); }
  };

  const securityItems = [
    {
      icon: KeyRound, label: t.changePassword,
      desc: 'Update your login password',
      color: 'text-amber-500',
      bg: isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100',
      onClick: () => setShowChangePass(true),
    },
    {
      icon: Fingerprint, label: t.biometricLogin,
      desc: checkingBio ? 'Checking device…' : (biometricEnabled ? 'Active — tap to disable' : 'Use FaceID or Fingerprint'),
      color: 'text-emerald-500',
      bg: isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100',
      isToggle: true, value: biometricEnabled, onToggle: toggleBiometric,
    },
  ];

  const privacyItems: {
    icon: any; label: string; desc: string; color: string; bg: string;
    onClick: () => void; isExternal?: boolean;
  }[] = [
    {
      icon: Eye, label: t.privacyPolicy,
      desc: 'How AquaGrow handles your data',
      color: 'text-blue-500',
      bg: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100',
      onClick: () => navigate('/profile/privacy-policy'),
    },
    {
      icon: Download, label: t.dataExport,
      desc: 'Download complete farm history as CSV',
      color: 'text-indigo-500',
      bg: isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100',
      onClick: () => alert('Export feature coming soon'),
    },
  ];

  return (
    <div className={cn('min-h-screen pb-32', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title={t.securityPrivacy} showBack />

      <div className="pt-22 px-4 py-5 space-y-5">

        {/* Hero */}
        <div className="bg-gradient-to-br from-[#0D1520] to-[#051015] rounded-[2.5rem] p-6 border border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-5">
            <Shield size={120} strokeWidth={0.5} />
          </div>
          <p className="text-white/40 text-[7px] font-black uppercase tracking-widest mb-1">Account Protection</p>
          <h2 className="text-white text-xl font-black tracking-tight mb-1">Security & Privacy</h2>
          <p className="text-white/30 text-[9px] font-bold leading-snug max-w-[220px]">Your data is encrypted and never shared without your consent.</p>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <p className="text-emerald-400/70 text-[8px] font-black uppercase tracking-widest">Account Secure</p>
          </div>
        </div>

        {/* Security section */}
        <div>
          <p className={cn('text-[7px] font-black uppercase tracking-widest mb-3 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
            🔐 Security
          </p>
          <div className="space-y-2">
            {securityItems.map((item, i) => (
              <motion.div
                key={i} whileTap={{ scale: 0.98 }}
                onClick={() => !item.isToggle && item.onClick?.()}
                className={cn('p-4 rounded-[1.8rem] border flex items-center justify-between cursor-pointer transition-all',
                  isDark ? 'bg-[#0D1520] border-white/5 hover:border-white/10' : 'bg-white border-slate-100 shadow-sm hover:border-[#C78200]/20'
                )}>
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border', item.bg, item.color)}>
                    <item.icon size={16} />
                  </div>
                  <div>
                    <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{item.label}</p>
                    <p className={cn('text-[7px] font-bold', isDark ? 'text-white/25' : 'text-slate-400')}>{item.desc}</p>
                  </div>
                </div>
                {item.isToggle ? (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={e => { e.stopPropagation(); item.onToggle(); }}
                    className={cn('w-12 h-6 rounded-full relative transition-all duration-500',
                      item.value ? 'bg-[#C78200]' : isDark ? 'bg-white/10' : 'bg-slate-200'
                    )}>
                    <motion.div animate={{ x: item.value ? 24 : 2 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </motion.button>
                ) : (
                  <ChevronRight size={14} className={isDark ? 'text-white/15' : 'text-slate-300'} />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Privacy section */}
        <div>
          <p className={cn('text-[7px] font-black uppercase tracking-widest mb-3 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
            🔒 Privacy
          </p>
          <div className="space-y-2">
            {privacyItems.map((item, i) => (
              <motion.div
                key={i} whileTap={{ scale: 0.98 }}
                onClick={item.onClick}
                className={cn('p-4 rounded-[1.8rem] border flex items-center justify-between cursor-pointer transition-all',
                  isDark ? 'bg-[#0D1520] border-white/5 hover:border-white/10' : 'bg-white border-slate-100 shadow-sm'
                )}>
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border', item.bg, item.color)}>
                    <item.icon size={16} />
                  </div>
                  <div>
                    <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{item.label}</p>
                    <p className={cn('text-[7px] font-bold', isDark ? 'text-white/25' : 'text-slate-400')}>{item.desc}</p>
                  </div>
                </div>
                {item.isExternal
                  ? <ExternalLink size={13} className={isDark ? 'text-white/15' : 'text-slate-300'} />
                  : <ChevronRight size={14} className={isDark ? 'text-white/15' : 'text-slate-300'} />
                }
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Change Password Sheet ── */}
      <AnimatePresence>
        {showChangePass && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowChangePass(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className={cn('relative w-full max-w-md rounded-t-[2.5rem] p-5 shadow-2xl',
                isDark ? 'bg-[#0D1520] border-t border-white/10' : 'bg-white'
              )}>
              <div className={cn('w-12 h-1 rounded-full mx-auto mb-5', isDark ? 'bg-white/15' : 'bg-slate-300')} />

              {passSuccess ? (
                <div className="py-12 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                    <CheckCircle2 size={30} className="text-white" />
                  </div>
                  <h2 className={cn('text-xl font-black', isDark ? 'text-white' : 'text-slate-900')}>Password Updated!</h2>
                </div>
              ) : (
                <>
                  <h2 className={cn('text-xl font-black tracking-tight mb-1', isDark ? 'text-white' : 'text-slate-900')}>{t.changePassword}</h2>
                  <p className={cn('text-[8px] font-black uppercase tracking-widest mb-5', isDark ? 'text-white/25' : 'text-slate-400')}>Min 6 characters</p>

                  <div className="space-y-3 mb-4">
                    {[
                      { label: 'Current Password', key: 'current' },
                      { label: 'New Password',     key: 'next' },
                      { label: 'Confirm New',      key: 'confirm' },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className={cn('text-[7px] font-black uppercase tracking-widest mb-1 block', isDark ? 'text-white/25' : 'text-slate-400')}>{label}</label>
                        <input
                          type="password"
                          className={cn('w-full px-4 py-3.5 rounded-2xl border text-sm font-bold outline-none transition-all',
                            isDark ? 'bg-white/5 border-white/10 text-white focus:border-[#C78200]/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#C78200]'
                          )}
                          value={(passData as any)[key]}
                          onChange={e => setPassData(p => ({ ...p, [key]: e.target.value }))}
                          placeholder="••••••"
                        />
                      </div>
                    ))}
                    {passErr && (
                      <div className="flex items-center gap-2 text-red-500">
                        <AlertTriangle size={12} />
                        <p className="text-[9px] font-bold">{passErr}</p>
                      </div>
                    )}
                  </div>

                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleChangePassword} disabled={passSaving}
                    className="w-full bg-[#C78200] text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-70 shadow-xl">
                    {passSaving
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><Lock size={14} /> Update Password</>
                    }
                  </motion.button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
