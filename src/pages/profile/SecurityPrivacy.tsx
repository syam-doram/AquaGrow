import React, { useState } from 'react';
import { Lock, Shield, Eye, Database, ChevronRight, Fingerprint } from 'lucide-react';
import { Header } from '../../components/Header';
import type { Translations } from '../../translations';
import { cn } from '../../utils/cn';
import { useData } from '../../context/DataContext';
import { checkBiometric, deleteBiometric } from '../../utils/biometric';

export const SecurityPrivacy = ({ t }: { t: Translations }) => {
  const { user, updateUser } = useData();
  const [biometricEnabled, setBiometricEnabled] = useState(user?.biometricEnabled ?? false);
  const [checkingBio, setCheckingBio] = useState(false);

  const toggleBiometric = async () => {
    const nextValue = !biometricEnabled;
    setCheckingBio(true);
    try {
      if (nextValue) {
        const available = await checkBiometric();
        if (available) {
          // Typically we should verify with a password before enabling, but for MVP we'll just toggle the preference
          // Real functionality happens at login when we save or retrieve
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
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingBio(false);
    }
  };

  const securitySections = [
    { id: 'password', icon: Lock, label: t.changePassword, desc: 'Update your account access', color: 'text-[#C78200]' },
    { id: 'biometric', icon: Fingerprint, label: t.biometricLogin, desc: checkingBio ? 'Checking...' : 'Use FaceID or Fingerprint', color: 'text-amber-500', isToggle: true, value: biometricEnabled, onToggle: toggleBiometric },
  ];

  const privacySections = [
    { id: 'policy', icon: Eye, label: t.privacyPolicy, desc: 'How we handle your data', color: 'text-emerald-500' },
    { id: 'export', icon: Database, label: t.dataExport, desc: 'Download your farm history', color: 'text-vibrant-blue' },
  ];

  return (
    <div className="pb-32 bg-[#F8F9FE] min-h-screen">
      <Header title={t.securityPrivacy} showBack />
      
      <div className="pt-24 px-6 py-8 space-y-12">
        <div className="bg-[#4A2C2A] rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-3xl font-black tracking-tighter mb-4">{t.security}</h2>
            <p className="text-white/40 text-sm font-medium leading-relaxed max-w-[200px]">Protect your account and your farm data with advanced security.</p>
          </div>
          <Shield size={140} strokeWidth={0.5} className="absolute -right-10 -bottom-10 text-[#C78200]/10 rotate-12" />
        </div>

        <section className="space-y-6">
          <h3 className="text-ink/30 text-[9px] font-black uppercase tracking-[0.2em] ml-2">{t.security}</h3>
          <div className="space-y-4">
            {securitySections.map((s, i) => (
              <SectionItem key={i} {...s} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-ink/30 text-[9px] font-black uppercase tracking-[0.2em] ml-2">{t.privacy}</h3>
          <div className="space-y-4">
            {privacySections.map((s, i) => (
              <SectionItem key={i} {...s} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const SectionItem = ({ icon: Icon, label, desc, color, isToggle, value, onToggle }: any) => (
  <div className="bg-card p-6 rounded-[2.5rem] shadow-sm border border-card-border flex items-center justify-between group hover:border-[#C78200]/30 transition-all cursor-pointer">
    <div className="flex items-center gap-6">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-paper shadow-sm", color)}>
        <Icon size={26} strokeWidth={1.5} />
      </div>
      <div>
        <h4 className="font-black text-base tracking-tight text-ink">{label}</h4>
        <p className="text-ink/40 text-[10px] font-bold uppercase tracking-widest mt-1">{desc}</p>
      </div>
    </div>
    {isToggle ? (
      <button 
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={cn(
          "w-12 h-6 rounded-full relative transition-all duration-500",
          value ? "bg-[#C78200]" : "bg-[#4A2C2A]/10"
        )}
      >
        <div className={cn(
          "absolute top-1 w-4 h-4 bg-card rounded-full transition-all duration-500",
          value ? "right-1" : "left-1"
        )} />
      </button>
    ) : (
      <ChevronRight size={18} className="text-ink/10 group-hover:text-[#C78200] group-hover:translate-x-1 transition-all" />
    )}
  </div>
);
