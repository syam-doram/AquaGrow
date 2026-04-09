import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Database, Eye, Share2, Lock,
  UserCheck, Trash2, Bell, Globe, ChevronDown, ChevronRight,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import { Header } from '../../components/Header';

// ─── EXPANDABLE SECTION CARD ──────────────────────────────────────────────────
const SectionCard = ({
  section, isDark, index,
}: { section: { icon: any; color: string; bg: string; title: string; content: string[] }; isDark: boolean; index: number }) => {
  const [open, setOpen] = useState(index === 0);

  const renderLine = (line: string) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return parts.map((p, i) =>
      i % 2 === 1
        ? <span key={i} className={cn('font-black', isDark ? 'text-white' : 'text-slate-900')}>{p}</span>
        : <span key={i}>{p}</span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={cn('rounded-[2rem] border overflow-hidden', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border flex-shrink-0', section.bg, section.color)}>
          <section.icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{section.title}</p>
          <p className={cn('text-[8px] font-bold uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
            {section.content.length} points
          </p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className={isDark ? 'text-white/20' : 'text-slate-400'} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className={cn('mx-4 mb-4 rounded-2xl border p-4 space-y-3', isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-100')}>
              {section.content.map((line, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={cn('w-1 h-1 rounded-full mt-2 flex-shrink-0', section.color.replace('text-', 'bg-'))} />
                  <p className={cn('text-[10px] font-medium leading-relaxed', isDark ? 'text-white/50' : 'text-slate-600')}>
                    {renderLine(line)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export const PrivacyPolicy = ({ t }: { t: any }) => {
  const navigate = useNavigate();
  const { theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  // All section data built from translation keys — auto-translates with user language
  const SECTIONS = [
    {
      icon: Database,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10 border-blue-500/20',
      title: t.ppSec1Title,
      content: [t.ppSec1P1, t.ppSec1P2, t.ppSec1P3, t.ppSec1P4, t.ppSec1P5],
    },
    {
      icon: Eye,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      title: t.ppSec2Title,
      content: [t.ppSec2P1, t.ppSec2P2, t.ppSec2P3, t.ppSec2P4, t.ppSec2P5],
    },
    {
      icon: Share2,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10 border-purple-500/20',
      title: t.ppSec3Title,
      content: [t.ppSec3P1, t.ppSec3P2, t.ppSec3P3, t.ppSec3P4, t.ppSec3P5],
    },
    {
      icon: Lock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10 border-amber-500/20',
      title: t.ppSec4Title,
      content: [t.ppSec4P1, t.ppSec4P2, t.ppSec4P3, t.ppSec4P4, t.ppSec4P5],
    },
    {
      icon: Bell,
      color: 'text-red-500',
      bg: 'bg-red-500/10 border-red-500/20',
      title: t.ppSec5Title,
      content: [t.ppSec5P1, t.ppSec5P2, t.ppSec5P3, t.ppSec5P4],
    },
    {
      icon: UserCheck,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      title: t.ppSec6Title,
      content: [t.ppSec6P1, t.ppSec6P2, t.ppSec6P3, t.ppSec6P4, t.ppSec6P5],
    },
    {
      icon: Globe,
      color: 'text-teal-500',
      bg: 'bg-teal-500/10 border-teal-500/20',
      title: t.ppSec7Title,
      content: [t.ppSec7P1, t.ppSec7P2, t.ppSec7P3, t.ppSec7P4],
    },
  ];

  const commitmentChips = [
    { icon: Lock,   label: t.ppChipNoSell },
    { icon: Shield, label: t.ppChipEncrypted },
    { icon: Trash2, label: t.ppChipDelete },
  ];

  return (
    <div className={cn('min-h-screen pb-32', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title={t.ppHeaderTitle} showBack />

      <div className="pt-22 px-4 py-5 space-y-4">

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#0D1520] to-[#051015] rounded-[2.5rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -right-6 -bottom-6 opacity-5">
            <Shield size={140} strokeWidth={0.5} />
          </div>
          <div className="relative z-10">
            <p className="text-white/40 text-[7px] font-black uppercase tracking-widest mb-1">AquaGrow · {t.ppDataPolicy}</p>
            <h1 className="text-white text-xl font-black tracking-tight mb-2">{t.ppHeaderTitle}</h1>
            <p className="text-white/30 text-[9px] font-medium leading-relaxed max-w-[260px]">
              {t.ppHeroDesc}
            </p>
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/5">
              {[
                { label: t.ppLastUpdated, value: 'April 2026' },
                { label: t.ppVersion,     value: '2.0' },
                { label: t.ppJurisdiction, value: 'India (DPDP)' },
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-white/20 text-[6px] font-black uppercase tracking-widest">{s.label}</p>
                  <p className="text-white/70 text-[9px] font-black">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Commitment chips */}
        <div className="flex gap-2 flex-wrap">
          {commitmentChips.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest',
                isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              )}
            >
              <c.icon size={10} />
              {c.label}
            </motion.div>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {SECTIONS.map((section, i) => (
            <React.Fragment key={i}>
              <SectionCard section={section} isDark={isDark} index={i} />
            </React.Fragment>
          ))}
        </div>

        {/* Contact footer */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className={cn('rounded-[2rem] border p-5 text-center', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
        >
          <p className={cn('text-[8px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/20' : 'text-slate-400')}>
            {t.ppContactQuestion}
          </p>
          <p className={cn('text-[11px] font-black', isDark ? 'text-white' : 'text-slate-900')}>
            privacy@aquagrow.in
          </p>
          <p className={cn('text-[8px] font-medium mt-1', isDark ? 'text-white/30' : 'text-slate-500')}>
            {t.ppDPO}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 flex items-center gap-1.5 mx-auto text-[8px] font-black uppercase tracking-widest text-emerald-500"
          >
            <ChevronRight size={12} className="rotate-180" /> {t.ppBackToSettings}
          </button>
        </motion.div>
      </div>
    </div>
  );
};
