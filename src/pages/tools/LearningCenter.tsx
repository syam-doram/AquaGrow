import React, { useState } from 'react';
import {
  Search, PlayCircle, CheckCircle2, ChevronLeft, BookOpen,
  Zap, Shield, Fish, Leaf, ArrowRight, Clock, Eye, Star,
  TrendingUp, Award,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Translations } from '../../translations';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',       label: 'All',          icon: BookOpen, color: 'emerald' },
  { id: 'pond-prep', label: 'Pond Prep',    icon: Leaf,     color: 'blue' },
  { id: 'disease',   label: 'Disease',      icon: Shield,   color: 'red' },
  { id: 'feed',      label: 'Feed & FCR',   icon: Fish,     color: 'amber' },
  { id: 'harvest',   label: 'Harvest',      icon: TrendingUp, color: 'purple' },
];

// ─── LEARNING CONTENT ────────────────────────────────────────────────────────
const ARTICLES = [
  {
    id: '1', cat: 'pond-prep',
    title: 'Gold Standard Pond Preparation SOP',
    desc: 'Step-by-step guide: pond drying, liming, water filling, probiotic seeding, and green water bloom development.',
    type: 'guide', readMin: 8, level: 'Essential',
    thumb: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&q=80&w=400',
    tags: ['Liming', 'Water pH', 'Probiotic'],
  },
  {
    id: '2', cat: 'disease',
    title: 'WSSV Prevention Protocol (DOC 25–45)',
    desc: 'Recognise early signs of White Spot Syndrome and apply the 5-step response protocol to prevent mass mortality.',
    type: 'video', readMin: 12, level: 'Critical',
    thumb: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400',
    tags: ['WSSV', 'Biosecurity', 'Immunity'],
  },
  {
    id: '3', cat: 'feed',
    title: 'Mastering Feed Tray Monitoring & FCR',
    desc: 'How to calculate FCR, read feed tray results, and adjust daily rations to maximise biomass gain without DO risk.',
    type: 'guide', readMin: 6, level: 'Important',
    thumb: 'https://images.unsplash.com/photo-1421789665209-c9b2a435e3dc?auto=format&fit=crop&q=80&w=400',
    tags: ['FCR', 'Feed Tray', 'Efficiency'],
  },
  {
    id: '4', cat: 'harvest',
    title: 'Partial Harvest Strategy for Maximum ROI',
    desc: 'When and how to execute a partial harvest to secure income mid-cycle while maintaining pond productivity.',
    type: 'guide', readMin: 10, level: 'Advanced',
    thumb: 'https://images.unsplash.com/photo-1531844251246-9a1bfaae09ab?auto=format&fit=crop&q=80&w=400',
    tags: ['Partial Harvest', 'ROI', 'Market Rate'],
  },
  {
    id: '5', cat: 'pond-prep',
    title: 'Vannamei vs Tiger: Choosing Your Species',
    desc: 'Comprehensive species comparison covering feed costs, disease risks, market rates, and DOC targets.',
    type: 'video', readMin: 15, level: 'Essential',
    thumb: 'https://images.unsplash.com/photo-1553923843-8b2b8b3b3b3b?auto=format&fit=crop&q=80&w=400&sig=species',
    tags: ['Vannamei', 'Tiger Prawn', 'Species'],
  },
  {
    id: '6', cat: 'disease',
    title: 'Vibriosis Detection & Treatment (DOC 20–30)',
    desc: 'Identify bacterial Vibriosis symptoms, apply the 3-day probiotic protocol, and log corrective actions.',
    type: 'guide', readMin: 7, level: 'Critical',
    thumb: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f3?auto=format&fit=crop&q=80&w=400',
    tags: ['Vibriosis', 'Probiotic', 'Water Quality'],
  },
];

const LEVEL_CONFIG: Record<string, { color: string; isDarkColor: string }> = {
  'Essential': { color: 'bg-blue-100 text-blue-700 border-blue-200', isDarkColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'Critical':  { color: 'bg-red-100 text-red-700 border-red-200',   isDarkColor: 'bg-red-500/10 text-red-400 border-red-500/20' },
  'Important': { color: 'bg-amber-100 text-amber-700 border-amber-200', isDarkColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  'Advanced':  { color: 'bg-purple-100 text-purple-700 border-purple-200', isDarkColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

export const LearningCenter = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { theme } = useData();
  const isDark    = theme === 'dark' || theme === 'midnight';

  const [activecat, setActivecat] = useState('all');
  const [search,    setSearch]    = useState('');

  const filtered = ARTICLES.filter(a => {
    const matchCat    = activecat === 'all' || a.cat === activecat;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className={cn('min-h-screen pb-40', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>

      {/* ── HEADER ── */}
      <header className={cn(
        'fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 backdrop-blur-xl px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 border-b',
        isDark ? 'bg-[#070D12]/90 border-white/5' : 'bg-white/90 border-slate-100 shadow-sm'
      )}>
        <div className="flex items-center justify-between mb-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border',
              isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-white border-slate-200 text-slate-600 shadow-sm'
            )}>
            <ChevronLeft size={18} />
          </motion.button>
          <div className="text-center">
            <h1 className={cn('text-xs font-black tracking-tight uppercase', isDark ? 'text-white' : 'text-slate-900')}>{t.learningCenter}</h1>
            <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>
              {ARTICLES.length} guides & videos
            </p>
          </div>
          <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border',
            isDark ? 'bg-[#C78200]/10 border-[#C78200]/20 text-[#C78200]' : 'bg-amber-50 border-amber-200 text-amber-600'
          )}>
            <Award size={18} />
          </div>
        </div>

        {/* Search bar */}
        <div className={cn('flex items-center rounded-2xl border px-4 h-11 gap-3 transition-all focus-within:border-[#C78200]/40',
          isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
        )}>
          <Search size={15} className={isDark ? 'text-white/25' : 'text-slate-400'} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={cn('flex-1 bg-transparent outline-none text-xs font-bold placeholder:opacity-40',
              isDark ? 'text-white placeholder:text-white' : 'text-slate-800 placeholder:text-slate-500'
            )}
            placeholder="Search guides, videos, topics…"
          />
        </div>
      </header>

      <div className="pt-[calc(6rem+5rem)] px-4 space-y-5">

        {/* ── CATEGORY TABS ── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActivecat(cat.id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all duration-300',
                activecat === cat.id
                  ? 'bg-[#0D523C] text-white shadow-lg'
                  : isDark ? 'bg-white/5 text-white/30 hover:text-white/60' : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-200 shadow-sm'
              )}
            >
              <cat.icon size={11} />
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── FEATURED / STATS BANNER ── */}
        <div className="bg-gradient-to-br from-[#0D523C] to-[#065F46] rounded-[2rem] p-6 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-[60px]" />
          <div className="relative z-10">
            <p className="text-emerald-300/60 text-[7px] font-black uppercase tracking-widest mb-1">Knowledge Base</p>
            <h2 className="text-xl font-black tracking-tight mb-3">Your AquaGrow Academy</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Guides', value: ARTICLES.filter(a => a.type === 'guide').length },
                { label: 'Videos', value: ARTICLES.filter(a => a.type === 'video').length },
                { label: 'Topics', value: CATEGORIES.length - 1 },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 rounded-xl py-2 text-center border border-white/10">
                  <p className="font-black text-xl tracking-tighter">{s.value}</p>
                  <p className="text-white/40 text-[6px] font-black uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ARTICLE CARDS ── */}
        <div>
          <div className="flex items-center justify-between px-1 mb-3">
            <h2 className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              {activecat === 'all' ? 'All Resources' : CATEGORIES.find(c => c.id === activecat)?.label}
            </h2>
            <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
              {filtered.length} results
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activecat + search} className="space-y-3">
              {filtered.length === 0 ? (
                <div className={cn('rounded-[2rem] p-10 text-center border border-dashed', isDark ? 'bg-white/3 border-white/10' : 'bg-white border-slate-200')}>
                  <BookOpen size={32} className={cn('mx-auto mb-3', isDark ? 'text-white/20' : 'text-slate-300')} />
                  <p className={cn('font-black text-sm tracking-tight', isDark ? 'text-white/40' : 'text-slate-500')}>No matching results</p>
                </div>
              ) : filtered.map((article, i) => {
                const levelConf = LEVEL_CONFIG[article.level];
                return (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn('rounded-[2rem] overflow-hidden border group cursor-pointer transition-all active:scale-[0.98]',
                      isDark ? 'bg-[#0D1520] border-white/5 hover:border-white/15' : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-36 overflow-hidden">
                      <img  src={article.thumb} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                      {/* Type badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className={cn('flex items-center gap-1 text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border backdrop-blur-sm',
                          levelConf ? (isDark ? levelConf.isDarkColor : levelConf.color) : 'bg-white/20 border-white/30 text-white'
                        )}>
                          {article.level}
                        </span>
                      </div>

                      {/* Video play button */}
                      {article.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                            <PlayCircle size={24} className="text-white" />
                          </div>
                        </div>
                      )}

                      {/* Duration */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                        <Clock size={9} className="text-white/60" />
                        <span className="text-[7px] font-black text-white/70 uppercase tracking-widest">{article.readMin} min</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className={cn('font-black text-sm tracking-tight leading-snug flex-1', isDark ? 'text-white' : 'text-slate-900')}>{article.title}</h3>
                        <ArrowRight size={15} className={cn('flex-shrink-0 mt-0.5 group-hover:translate-x-1 transition-transform', isDark ? 'text-white/20' : 'text-slate-300')} />
                      </div>
                      <p className={cn('text-[9px] font-medium leading-relaxed mb-3', isDark ? 'text-white/35' : 'text-slate-500')}>{article.desc}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {article.tags.map(tag => (
                          <span key={tag} className={cn('text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
                            isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-slate-100 border-slate-200 text-slate-500'
                          )}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── PRO UPGRADE CARD ── */}
        <div className="bg-gradient-to-br from-[#4A2C2A] to-[#2d1a18] rounded-[2rem] p-6 text-white relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#C78200]/10 blur-[80px] rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-[#C78200] rounded-xl flex items-center justify-center">
                <Star size={13} className="text-white" fill="currentColor" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#C78200]">Farmer Pro</span>
            </div>
            <h3 className="text-xl font-black tracking-tight mb-2">{t.elevateYield}</h3>
            <p className="text-white/50 text-[10px] font-medium leading-relaxed mb-5">
              Unlock 50+ expert guides, live expert consultations, AI disease detection, and real-time market intelligence.
            </p>
            <button className="bg-[#C78200] text-white text-[9px] font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all">
              {t.unlockPro}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
