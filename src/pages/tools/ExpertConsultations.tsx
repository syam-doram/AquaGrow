import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Sparkles, ChevronLeft, Star, Phone, MessageCircle,
  Video, Shield, Clock, Award, CheckCircle2, ArrowRight, Zap,
  Calendar, ChevronRight,
} from 'lucide-react';
import type { Translations } from '../../translations';
import { User } from '../../types';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';

// ─── EXPERT DATA ──────────────────────────────────────────────────────────────
const EXPERTS = [
  {
    id: '1',
    name: 'Dr. Sarah Wilson',
    title: 'Shrimp Virologist & Disease Expert',
    specialization: 'WSSV · EHP · EMS · Vibriosis',
    experience: '15 Years',
    rating: 4.9,
    reviews: 287,
    available: true,
    languages: ['English', 'Telugu'],
    callRate: '₹499 / 30 min',
    chatRate: '₹199 / session',
    nextSlot: 'Today 2:00 PM',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200',
    badge: 'Top Rated',
    badgeColor: 'emerald',
    bio: 'NACA-certified virologist with 15 years in disease management across Andhra & Tamil Nadu hatcheries.',
    tags: ['Disease', 'Emergency', 'Diagnostics'],
  },
  {
    id: '2',
    name: 'Prof. Arjun Mehta',
    title: 'Water Quality & Bio-Security Specialist',
    specialization: 'DO · pH · Alkalinity · Probiotics',
    experience: '22 Years',
    rating: 5.0,
    reviews: 512,
    available: true,
    languages: ['English', 'Hindi', 'Telugu'],
    callRate: '₹699 / 30 min',
    chatRate: '₹299 / session',
    nextSlot: 'Today 4:30 PM',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
    badge: 'Expert Choice',
    badgeColor: 'amber',
    bio: 'Former MPEDA researcher. Specialises in water chemistry optimisation and SOP audits for intensive culture.',
    tags: ['Water Quality', 'SOP', 'Intensive Culture'],
  },
  {
    id: '3',
    name: 'James Chen',
    title: 'Yield Optimisation & ROI Analyst',
    specialization: 'FCR · Feed Strategy · Harvest Timing',
    experience: '12 Years',
    rating: 4.8,
    reviews: 193,
    available: false,
    languages: ['English', 'Tamil'],
    callRate: '₹399 / 30 min',
    chatRate: '₹149 / session',
    nextSlot: 'Tomorrow 10:00 AM',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200',
    badge: 'ROI Expert',
    badgeColor: 'blue',
    bio: 'Data-driven consultant tracking FCR, feed conversion, and market-linked harvest timing across 50+ farms.',
    tags: ['FCR', 'Harvest', 'Profitability'],
  },
  {
    id: '4',
    name: 'Dr. Priya Nair',
    title: 'Shrimp Nutrition & Feed Specialist',
    specialization: 'Feed Grades · Gut Health · Probiotics',
    experience: '9 Years',
    rating: 4.7,
    reviews: 145,
    available: true,
    languages: ['English', 'Malayalam', 'Telugu'],
    callRate: '₹349 / 30 min',
    chatRate: '₹129 / session',
    nextSlot: 'Today 6:00 PM',
    photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200',
    badge: 'New Expert',
    badgeColor: 'purple',
    bio: 'Specialist in species-specific nutrition planning and gut probiotic protocols for Vannamei & Tiger Prawn.',
    tags: ['Nutrition', 'Gut Health', 'Feed Grades'],
  },
];

const BADGE_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', darkBg: 'bg-emerald-500/15', darkText: 'text-emerald-400' },
  amber:   { bg: 'bg-amber-100',   text: 'text-amber-700',   darkBg: 'bg-amber-500/15',   darkText: 'text-amber-400' },
  blue:    { bg: 'bg-blue-100',    text: 'text-blue-700',    darkBg: 'bg-blue-500/15',    darkText: 'text-blue-400' },
  purple:  { bg: 'bg-purple-100',  text: 'text-purple-700',  darkBg: 'bg-purple-500/15',  darkText: 'text-purple-400' },
};

// ─── EXPERT CARD ─────────────────────────────────────────────────────────────
const ExpertCard = ({ expert, i, isDark }: { expert: typeof EXPERTS[0]; i: number; isDark: boolean; key?: React.Key }) => {
  const [expanded, setExpanded] = useState(false);
  const badge = BADGE_COLORS[expert.badgeColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07 }}
      className={cn('rounded-[2rem] overflow-hidden border transition-all', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
    >
      {/* Header row */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-card-border">
              <img src={expert.photo} alt={expert.name} className="w-full h-full object-cover" />
            </div>
            {/* Availability dot */}
            <div className={cn('absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center',
              isDark ? 'border-[#0D1520]' : 'border-white',
              expert.available ? 'bg-emerald-500' : 'bg-slate-400'
            )}>
              {expert.available && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className={cn('font-black text-sm tracking-tight leading-tight', isDark ? 'text-white' : 'text-slate-900')}>{expert.name}</h3>
                <p className="text-[#C78200] text-[8px] font-black uppercase tracking-widest mt-0.5">{expert.title}</p>
              </div>
              {/* Badge */}
              <span className={cn('text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0 border',
                isDark ? `${badge.darkBg} ${badge.darkText} border-transparent` : `${badge.bg} ${badge.text} border-transparent`
              )}>{expert.badge}</span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={9} className={j < Math.floor(expert.rating) ? 'text-[#C78200]' : isDark ? 'text-white/15' : 'text-slate-200'} fill={j < Math.floor(expert.rating) ? 'currentColor' : 'none'} />
                ))}
              </div>
              <span className={cn('text-[8px] font-black', isDark ? 'text-white/50' : 'text-slate-600')}>{expert.rating}</span>
              <span className={cn('text-[7px] font-bold', isDark ? 'text-white/25' : 'text-slate-400')}>({expert.reviews} reviews)</span>
            </div>
          </div>
        </div>

        {/* Specialization + exp */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-xl border',
            isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200'
          )}>
            <Clock size={9} className={isDark ? 'text-white/30' : 'text-slate-400'} />
            <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/40' : 'text-slate-500')}>{expert.experience}</span>
          </div>
          <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-xl border',
            expert.available
              ? isDark ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : isDark ? 'bg-white/3 border-white/8 text-white/30' : 'bg-slate-50 border-slate-200 text-slate-400'
          )}>
            <Calendar size={9} />
            <span className="text-[7px] font-black uppercase tracking-widest">{expert.nextSlot}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {expert.tags.map(tag => (
            <span key={tag} className={cn('text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
              isDark ? 'bg-white/5 border-white/10 text-white/25' : 'bg-slate-50 border-slate-200 text-slate-400'
            )}>{tag}</span>
          ))}
        </div>

        {/* Expandable bio */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={cn('mt-3 pt-3 border-t', isDark ? 'border-white/5' : 'border-slate-100')}>
                <p className={cn('text-[9px] font-medium leading-relaxed mb-2', isDark ? 'text-white/40' : 'text-slate-500')}>{expert.bio}</p>
                <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
                  Languages: {expert.languages.join(' · ')}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setExpanded(e => !e)}
          className={cn('mt-2 text-[7px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors',
            isDark ? 'text-white/20 hover:text-white/50' : 'text-slate-400 hover:text-slate-600'
          )}
        >
          {expanded ? 'Less info' : 'More info'}
          <ChevronRight size={10} className={cn('transition-transform', expanded ? 'rotate-90' : '')} />
        </button>
      </div>

      {/* CTA row */}
      <div className={cn('px-5 pb-5 pt-0 grid grid-cols-2 gap-2.5')}>
        {/* Rates */}
        <div className={cn('col-span-2 grid grid-cols-2 gap-2 mb-2', 'text-center')}>
          {[
            { icon: Video, label: 'Video Call', rate: expert.callRate },
            { icon: MessageCircle, label: 'Chat',      rate: expert.chatRate },
          ].map((opt, i) => (
            <div key={i} className={cn('rounded-xl px-3 py-2 border', isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200')}>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <opt.icon size={10} className={isDark ? 'text-white/30' : 'text-slate-400'} />
                <span className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>{opt.label}</span>
              </div>
              <p className={cn('font-black text-xs tracking-tighter', isDark ? 'text-[#C78200]' : 'text-amber-700')}>{opt.rate}</p>
            </div>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!expert.available}
          className={cn('py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2',
            expert.available
              ? 'bg-[#0D523C] text-white shadow-lg shadow-emerald-900/20 hover:bg-[#065F46]'
              : isDark ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          )}
        >
          <Phone size={13} /> Book Call
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          className={cn('py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest border transition-all flex items-center justify-center gap-2',
            isDark ? 'bg-[#C78200]/10 border-[#C78200]/20 text-[#C78200] hover:bg-[#C78200]/20' : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
          )}
        >
          <MessageCircle size={13} /> Chat Now
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export const ExpertConsultations = ({ user, t, onMenuClick }: { user: User; t: Translations; onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { theme } = useData();
  const isDark   = theme === 'dark' || theme === 'midnight';

  // ── Free user gate ── 
  if (user.subscriptionStatus === 'free') {
    return (
      <div className={cn('min-h-screen flex flex-col items-center justify-center p-8 text-center relative overflow-hidden', isDark ? 'bg-[#070D12]' : 'bg-[#F8F9FE]')}>
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#C78200]/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#4A2C2A]/10 blur-[120px] rounded-full animate-pulse delay-1000" />
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-[#C78200] rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-[#C78200]/30">
            <Users size={44} className="text-white" />
          </div>
          <h2 className={cn('text-3xl font-black tracking-tighter mb-3', isDark ? 'text-white' : 'text-slate-900')}>{t.proFeature}</h2>
          <p className={cn('text-sm leading-relaxed mb-8 max-w-[260px] font-medium', isDark ? 'text-white/50' : 'text-slate-500')}>
            {t.expertConsultations} — {t.proSubscriptionRequired}
          </p>

          {/* Benefits */}
          <div className={cn('w-full max-w-[300px] rounded-[2rem] p-5 border mb-8 space-y-3', isDark ? 'bg-white/3 border-white/8' : 'bg-white border-slate-200 shadow-sm')}>
            {[
              'Consult NACA-certified shrimp experts',
              'Get emergency disease diagnosis',
              'Personalised SOP for your pond',
              'Priority 2-hour response time',
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                <p className={cn('text-[10px] font-bold', isDark ? 'text-white/60' : 'text-slate-600')}>{b}</p>
              </div>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/subscription')}
            className="bg-[#C78200] text-white px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-[#C78200]/30 flex items-center gap-3 mb-5"
          >
            {t.upgradeToPro} <Sparkles size={16} className="text-white/60" />
          </motion.button>

          <button onClick={() => navigate(-1)} className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/20 hover:text-white/40' : 'text-slate-400 hover:text-slate-600')}>
            {t.maybeLater}
          </button>
        </motion.div>
      </div>
    );
  }

  const availableCount = EXPERTS.filter(e => e.available).length;

  return (
    <div className={cn('min-h-screen pb-40', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>

      {/* ── HEADER ── */}
      <header className={cn(
        'fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 backdrop-blur-xl px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center justify-between border-b',
        isDark ? 'bg-[#070D12]/90 border-white/5' : 'bg-white/90 border-slate-100 shadow-sm'
      )}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
          className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border',
            isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-white border-slate-200 text-slate-600 shadow-sm'
          )}>
          <ChevronLeft size={18} />
        </motion.button>

        <div className="text-center">
          <h1 className={cn('text-xs font-black tracking-tight uppercase', isDark ? 'text-white' : 'text-slate-900')}>{t.expertConsultations}</h1>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">{availableCount} experts online</p>
          </div>
        </div>

        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border',
          isDark ? 'bg-[#C78200]/10 border-[#C78200]/20 text-[#C78200]' : 'bg-amber-50 border-amber-200 text-amber-600'
        )}>
          <Award size={18} />
        </div>
      </header>

      <div className="pt-24 px-4 space-y-4">

        {/* ── PRIORITY ACCESS BANNER ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#C78200] to-[#A66C00] rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-2xl shadow-amber-900/30"
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-[60px]" />
          <Sparkles size={80} strokeWidth={0.5} className="absolute -right-5 -bottom-5 text-white/5" />
          <div className="relative z-10">
            <p className="text-white/50 text-[7px] font-black uppercase tracking-widest mb-2">{t.priorityAccess}</p>
            <h2 className="text-2xl font-black tracking-tight leading-tight mb-2">{t.connectExpertTitle}</h2>
            <p className="text-white/60 text-[9px] font-medium leading-relaxed mb-4">{t.expertConsultationsDesc}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Shield, label: 'Certified', sub: 'NACA experts' },
                { icon: Zap,    label: 'Fast',      sub: '< 2hr reply' },
                { icon: Video,  label: 'Video Call', sub: 'HD Quality' },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 rounded-xl py-2.5 text-center border border-white/10">
                  <s.icon size={14} className="text-white/60 mx-auto mb-1" />
                  <p className="font-black text-[9px] leading-none">{s.label}</p>
                  <p className="text-white/40 text-[6px] font-black uppercase tracking-widest mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── EXPERT LIST ── */}
        <div>
          <div className="flex items-center justify-between px-1 mb-3">
            <h2 className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{t.availableExperts}</h2>
            <span className={cn('text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl border',
              isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            )}>
              {availableCount} Online
            </span>
          </div>
          <div className="space-y-4">
            {EXPERTS.map((expert, i) => (
              <ExpertCard key={expert.id} expert={expert} i={i} isDark={isDark} />
            ))}
          </div>
        </div>

        {/* ── EMERGENCY CONSULT ── */}
        <div className={cn('rounded-[2rem] p-5 border', isDark ? 'bg-red-500/5 border-red-500/15' : 'bg-red-50 border-red-200')}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-red-500 rounded-2xl flex items-center justify-center text-white">
              <Phone size={20} />
            </div>
            <div>
              <p className={cn('font-black text-sm tracking-tight', isDark ? 'text-red-300' : 'text-slate-900')}>Emergency Disease Line</p>
              <p className="text-[8px] text-red-500 font-black uppercase tracking-widest">24/7 · WSSV / Mass Mortality</p>
            </div>
          </div>
          <p className={cn('text-[9px] font-medium leading-relaxed mb-4', isDark ? 'text-white/40' : 'text-slate-500')}>
            Mass mortality, DO crash, or sudden disease outbreak? Our emergency expert line connects you to a certified disease specialist within 30 minutes.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
          >
            <Phone size={14} /> Call Emergency Expert Now
          </motion.button>
        </div>

      </div>
    </div>
  );
};
