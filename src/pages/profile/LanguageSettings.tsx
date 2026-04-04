import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, CheckCircle2, ChevronLeft } from 'lucide-react';
import { Header } from '../../components/Header';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { API_BASE_URL } from '../../config';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../../types';

export const LanguageSettings = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { user, setUser } = useData();
  const [isSyncing, setIsSyncing] = useState(false);

  const languages = [
    { label: t.english, value: 'English' },
    { label: t.telugu, value: 'Telugu' },
    { label: t.bengali, value: 'Bengali' },
    { label: t.odia, value: 'Odia' },
    { label: t.gujarati, value: 'Gujarati' },
    { label: t.tamil, value: 'Tamil' },
    { label: t.malayalam, value: 'Malayalam' }
  ];

  const handleLanguageChange = async (newLang: Language) => {
    if (user?.id || (user as any)?._id) {
       // 1. Optimistic Update
       const uInfo = { ...user, language: newLang };
       setUser(uInfo as any);
       localStorage.setItem('aqua_user', JSON.stringify(uInfo));
       
       setIsSyncing(true);
       try {
         // 2. Persist to MongoDB
         await fetch(`${API_BASE_URL}/user/${user.id || (user as any)._id}/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: newLang })
         });
         
         // Visual feedback delay
         setTimeout(() => {
           setIsSyncing(false);
           navigate(-1); // Go back after successful selection
         }, 800);
       } catch (err) {
         console.error('Failed to sync language preference:', err);
         setIsSyncing(false);
       }
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFE] pb-32">
      <Header title={t.language} showBack />
      
      <AnimatePresence>
        {isSyncing && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center"
           >
              <div className="w-12 h-12 border-4 border-[#C78200] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C78200]">Syncing Experience...</p>
           </motion.div>
        )}
      </AnimatePresence>
      
      <div className="pt-24 px-6">
        <div className="bg-[#4A2C2A] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl mb-8">
          <div className="relative z-10">
            <h2 className="text-3xl font-black tracking-tighter mb-3">{t.selectLanguage}</h2>
            <p className="text-white/40 text-xs font-semibold leading-relaxed max-w-[200px]">Choose your native language for precise farm guidance and SOPS.</p>
          </div>
          <Globe size={120} strokeWidth={0.5} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
        </div>

        <div className="grid grid-cols-1 gap-3">
          {languages.map((lang, idx) => {
            const isSelected = user?.language === lang.value;
            return (
              <button
                key={idx}
                onClick={() => handleLanguageChange(lang.value as Language)}
                className={cn(
                  "w-full p-5 rounded-[1.8rem] flex items-center justify-between transition-all active:scale-[0.98] border",
                  isSelected 
                    ? "bg-white border-[#C78200] shadow-xl shadow-amber-900/5 translate-x-2" 
                    : "bg-white border-black/5 text-[#4A2C2A]/40"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    isSelected ? "bg-amber-50 text-[#C78200]" : "bg-slate-50 text-slate-300"
                  )}>
                    <Globe size={18} />
                  </div>
                  <span className={cn(
                    "font-black text-sm tracking-tight",
                    isSelected ? "text-[#4A2C2A]" : "text-[#4A2C2A]/40"
                  )}>{lang.label}</span>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <CheckCircle2 size={14} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
