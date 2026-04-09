import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, CheckCircle2 } from 'lucide-react';
import { Header } from '../../components/Header';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { API_BASE_URL } from '../../config';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../../types';

const LANGUAGE_META: Record<string, { native: string; flag: string; region: string }> = {
  English:   { native: 'English',    flag: '🇬🇧', region: 'Global' },
  Telugu:    { native: 'తెలుగు',      flag: '🇮🇳', region: 'Andhra Pradesh · Telangana' },
  Bengali:   { native: 'বাংলা',       flag: '🇮🇳', region: 'West Bengal · Bangladesh' },
  Odia:      { native: 'ଓଡ଼ିଆ',       flag: '🇮🇳', region: 'Odisha' },
  Gujarati:  { native: 'ગુજરાતી',     flag: '🇮🇳', region: 'Gujarat' },
  Tamil:     { native: 'தமிழ்',       flag: '🇮🇳', region: 'Tamil Nadu · Sri Lanka' },
  Malayalam: { native: 'മലയാളം',     flag: '🇮🇳', region: 'Kerala' },
};

export const LanguageSettings = ({ t, onLanguageChange }: { t: Translations; onLanguageChange?: (l: Language) => void }) => {
  const navigate = useNavigate();
  const { user, setUser, updateUser, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';
  const [isSyncing, setIsSyncing] = useState(false);
  const [selected, setSelected]   = useState<Language>(user?.language || 'English');

  const languages: { label: string; value: Language }[] = [
    { label: t.english,   value: 'English' },
    { label: t.telugu,    value: 'Telugu' },
    { label: t.bengali,   value: 'Bengali' },
    { label: t.odia,      value: 'Odia' },
    { label: t.gujarati,  value: 'Gujarati' },
    { label: t.tamil,     value: 'Tamil' },
    { label: t.malayalam, value: 'Malayalam' },
  ];

  const handleSelect = async (newLang: Language) => {
    setSelected(newLang);
    if (onLanguageChange) onLanguageChange(newLang);

    if (user?.id || (user as any)?._id) {
      const uInfo = { ...user, language: newLang } as any;
      setUser(uInfo);
      localStorage.setItem('aqua_user', JSON.stringify(uInfo));
      setIsSyncing(true);
      try {
        // Persist language preference to MongoDB user doc
        await updateUser({ language: newLang } as any);
        setTimeout(() => { setIsSyncing(false); navigate(-1); }, 700);
      } catch {
        setIsSyncing(false);
      }
    }
  };

  return (
    <div className={cn('min-h-screen pb-32', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title={t.language} showBack />

      {/* Syncing overlay */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-14 h-14 border-4 border-[#C78200] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#C78200]">Syncing Language…</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-22 px-4 py-5 space-y-5">

        {/* Hero */}
        <div className={cn('rounded-[2.5rem] p-6 relative overflow-hidden border',
          isDark ? 'bg-[#0D1520] border-white/5' : 'bg-gradient-to-br from-[#4A2C2A] to-[#2D1A18] border-transparent')}>
          <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
            <Globe size={120} strokeWidth={0.5} />
          </div>
          <p className={cn('text-[7px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/25' : 'text-white/50')}>
            Farm Intelligence Language
          </p>
          <h2 className="text-white text-xl font-black tracking-tight mb-1">{t.selectLanguage}</h2>
          <p className="text-white/40 text-[9px] font-bold leading-snug max-w-[230px]">
            AquaGrow delivers SOPs, alerts, and diagnostics in your native language for maximum precision.
          </p>
          {/* Current */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-base">{LANGUAGE_META[selected]?.flag ?? '🌐'}</span>
            <div>
              <p className="text-white/50 text-[6px] font-black uppercase tracking-widest">Current</p>
              <p className="text-white font-black text-xs">{LANGUAGE_META[selected]?.native ?? selected}</p>
            </div>
          </div>
        </div>

        {/* Language list */}
        <div className="space-y-2">
          {languages.map((lang, i) => {
            const meta = LANGUAGE_META[lang.value];
            const isSelected = selected === lang.value;
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(lang.value)}
                className={cn(
                  'w-full p-4 rounded-[1.8rem] border flex items-center justify-between transition-all',
                  isSelected
                    ? isDark
                      ? 'bg-[#C78200]/10 border-[#C78200]/30 shadow-lg'
                      : 'bg-amber-50 border-[#C78200] shadow-md shadow-amber-900/5'
                    : isDark
                      ? 'bg-[#0D1520] border-white/5 hover:border-white/10'
                      : 'bg-white border-slate-100 shadow-sm'
                )}>
                <div className="flex items-center gap-3">
                  {/* Flag */}
                  <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center text-xl border',
                    isSelected
                      ? isDark ? 'bg-[#C78200]/20 border-[#C78200]/20' : 'bg-amber-100 border-amber-200'
                      : isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'
                  )}>
                    {meta?.flag ?? '🌐'}
                  </div>
                  <div className="text-left">
                    <p className={cn('text-[11px] font-black tracking-tight', isSelected ? isDark ? 'text-[#C78200]' : 'text-[#C78200]' : isDark ? 'text-white' : 'text-slate-900')}>
                      {lang.label}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className={cn('text-[8px] font-black', isSelected ? 'text-[#C78200]/60' : isDark ? 'text-white/20' : 'text-slate-400')}>
                        {meta?.native}
                      </p>
                      <span className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/10' : 'text-slate-300')}>·</span>
                      <p className={cn('text-[6px] font-bold', isDark ? 'text-white/15' : 'text-slate-400')}>{meta?.region}</p>
                    </div>
                  </div>
                </div>
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center transition-all',
                  isSelected ? 'bg-emerald-500 shadow-lg shadow-emerald-900/20' : isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200'
                )}>
                  {isSelected && <CheckCircle2 size={14} className="text-white" />}
                </div>
              </motion.button>
            );
          })}
        </div>

        <p className={cn('text-center text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/10' : 'text-slate-300')}>
          Adding more languages soon
        </p>
      </div>
    </div>
  );
};
