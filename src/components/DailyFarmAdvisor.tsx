/**
 * DailyFarmAdvisor.tsx
 * 
 * A rich, DOC-aware, seasonal "trusted expert" card shown on the Dashboard.
 * It guides, cautions, and educates — never just alarming.
 * Think: "your agronomist friend is here every morning".
 */
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Leaf, Sun, CloudRain, Snowflake, AlertTriangle, CheckCircle2,
  Lightbulb, ShieldCheck, TrendingUp, Clock, Fish, Droplets,
  Thermometer, Wind, Star,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getLunarStatus } from '../utils/lunarUtils';

// ─── SEASON ───────────────────────────────────────────────────────────────────
const getSeason = () => {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return { label: 'Summer', icon: Sun,       emoji: '☀️', color: '#F97316', risk: 'Heat stress · Low DO · Vibriosis risk' };
  if (m >= 6 && m <= 9) return { label: 'Monsoon', icon: CloudRain, emoji: '🌧️', color: '#3B82F6', risk: 'Salinity drop · WSSV peak · pH crash' };
  return                       { label: 'Winter',  icon: Snowflake,  emoji: '❄️', color: '#06B6D4', risk: 'Low temp · Slow growth · WSSV trigger' };
};

// ─── SEASONAL TIPS (indexed by season label) ─────────────────────────────────
const SEASON_TIPS: Record<string, string[]> = {
  Summer: [
    'Skip the 12 PM–2 PM feed slot on days above 34°C. Shrimp digestion slows, leftover feed rots and spikes ammonia.',
    'Run aerators at 100% capacity from 10 PM to 6 AM. Dissolved oxygen crashes in hot weather after midnight.',
    'Add Vitamin C + Betaine to feed during heat waves. This reduces stress hormones and keeps immunity strong.',
    'Check DO and temperature twice daily — morning (6 AM) and dusk (6 PM). Act early, not after mortality.',
    'Partial water exchange of 10–15% in morning hours helps flush ammonia and cool the pond slightly.',
  ],
  Monsoon: [
    'After heavy rain: reduce feed by 20%, add zeolite (50 kg/acre) to absorb ammonia from surface runoff.',
    'Salinity can drop sharply in rain. Monitor daily and add mineral mix to maintain ionic balance.',
    'WSSV risk is highest June–September. Apply immunity booster (Beta-Glucan) once a week preventively.',
    'Avoid applying probiotics 3 hours before or after heavy rain. pH crashes reduce bacterial effectiveness.',
    'Check for green water clarity after rain. Secchi depth < 25 cm means bloom crash — apply new probiotic.',
  ],
  Winter: [
    'If water temp falls below 26°C, reduce feed by 15–20%. Shrimp metabolism slows significantly.',
    'Apply Vitamin C + minerals in morning feed only. Avoid evening medicine application in cold weather.',
    'WSSV triggers in cold snap. Watch for white spots on shell and fanning tail fin signs.',
    'Aerate continuously even on cold nights — photosynthesis is low, DO can still crash after midnight.',
    'Growth is slower in winter. Do not rush harvest. Weight the shrimp weekly to track actual progress.',
  ],
};

// ─── DOC-SPECIFIC GUIDANCE ────────────────────────────────────────────────────
interface DocGuidance {
  phase:   string;
  emoji:   string;
  color:   string;
  guide:   string;
  caution: string;
  tip:     string;
}

const getDocGuidance = (doc: number, species: string): DocGuidance => {
  const isTiger = species === 'Tiger';

  if (doc <= 0) return {
    phase: 'Pre-Stocking', emoji: '🏗️', color: '#6366F1',
    guide:   'Prepare pond correctly — this single step determines your entire culture cycle success.',
    caution: 'Never stock shrimp before water is properly aged (green color, Secchi 35–45 cm, pH 7.8–8.2).',
    tip:     'Apply Bloomex / Probiotic 7 days before stocking. This builds beneficial bacteria that outcompete Vibrio.',
  };
  if (doc <= 3) return {
    phase: 'Stocking & Blind Feed', emoji: '🐟', color: '#10B981',
    guide:   'First 72 hours are the most critical. Shrimp are stressed from transport — build immunity now.',
    caution: 'Do NOT use feed trays on DOC 1–3. Scatter feed evenly across the whole pond surface.',
    tip:     `Apply Vitamin C + Betaine in water for first 3 days. Dosage: ${isTiger ? '3g/L stock water' : '2g/L stock water'}.`,
  };
  if (doc <= 10) return {
    phase: 'Early Establishment', emoji: '🌱', color: '#10B981',
    guide:   'Shrimp are building gut bacteria. Gut probiotic in feed every day is non-negotiable this week.',
    caution: 'Avoid water quality shocks — no water exchange in first 10 DOC unless pH > 8.8 or DO < 4.',
    tip:     'Apply water probiotic on DOC 5 and DOC 10 — this is the most overlooked but powerful step.',
  };
  if (doc <= 20) return {
    phase: 'Growth Spurt', emoji: '📈', color: '#3B82F6',
    guide:   'Shrimp are growing fast. Increase feed gradually — 10% per day if tray shows residue < 5%.',
    caution: 'DO NOT increase feed when water looks dark or cloudy. This means bloom collapse — check DO first.',
    tip:     'DOC 15 Vitamin C booster day is mandatory. It boosts immunity before the high-risk zone begins.',
  };
  if (doc <= 30) return {
    phase: 'Risk Stage — Vibriosis Window', emoji: '⚠️', color: '#F59E0B',
    guide:   `Vibriosis risk is high now (DOC 21–30). Watch for red tail, gill discoloration, and slow feeders.`,
    caution: 'Reduce feed 10% if you see any tail redness. Apply gut probiotic + water probiotic together.',
    tip:     'DOC 25 Immunity Booster is critical. Think of it as a vaccine window — apply it on schedule.',
  };
  if (doc <= 45) return {
    phase: 'WSSV Critical Stage', emoji: '🦠', color: '#EF4444',
    guide:   'This is the most dangerous window of the entire culture cycle. Maximum monitoring required.',
    caution: '⚠️ Check trays after EVERY feed slot. More than 20% residue = STOP next slot + check DO.',
    tip:     `WSSV prevention: Apply ${isTiger ? 'Beta-Glucan 1g/kg feed' : 'Beta-Glucan + organic acid in water'} every 3rd day this week.`,
  };
  if (doc <= 60) return {
    phase: 'Mid Growth — Building Biomass', emoji: '💪', color: '#8B5CF6',
    guide:   'Shrimp have passed the critical zone. Focus on FCR — every wasted kg of feed costs profit.',
    caution: 'Overfeeding is the #1 mistake now. FCR > 1.6 means you are losing ₹200+ per kg of shrimp.',
    tip:     'Sample 10 shrimp weekly. Track average body weight. If weight is below SOP chart → check DO + feed rate.',
  };
  if (doc <= 80) return {
    phase: 'Peak Growth Phase', emoji: '🎯', color: '#C78200',
    guide:   'Shrimp are at their fastest growth rate. Consistent management now maximizes final yield.',
    caution: 'Liver Tonic (DOC 50) is mandatory — hepatopancreas damage is invisible until it is too late.',
    tip:     'Take size samples at DOC 60 and DOC 70 to plan harvest timing. 20g+ per shrimp is target.',
  };
  return {
    phase: 'Harvest Preparation', emoji: '🎣', color: '#EF4444',
    guide:   'Stop all heavy medicines now. Final harvest quality depends on clean water and medicine withdrawal.',
    caution: '🚫 Zero antibiotics from DOC 85 onward. Residue testing at harvest is mandatory for export quality.',
    tip:     'Test size daily from DOC 85. Harvest window is narrow — timing matters more than waiting for more growth.',
  };
};

// ─── DAILY WISDOM (rotates each day) ─────────────────────────────────────────
const DAILY_WISDOM = [
  { quote: 'Water quality is the first medicine. Fix the water before giving any treatment.', author: 'Aquaculture Principle' },
  { quote: 'A farmer who logs every day loses less. Data is your insurance policy.', author: 'AquaGrow Insight' },
  { quote: 'DO below 4 mg/L is an emergency. DO above 6 mg/L is your target every single morning.', author: 'SOP Standard' },
  { quote: 'Feed the shrimp, not the pond. Leftover feed is the enemy of healthy water.', author: 'Feeding Protocol' },
  { quote: 'Amavasya and Pournami are not superstitions — they are proven molting cycles you must respect.', author: 'Lunar Farming Guide' },
  { quote: 'The best time to apply probiotics is before you see problems, not after.', author: 'Preventive Protocol' },
  { quote: 'A 1°C temperature rise above 32°C can cut your DO by 10%. Shade matters.', author: 'Water Science' },
  { quote: 'Sample 10 shrimp weekly. If they look healthy but growth is slow, the feed is wrong — not the shrimp.', author: 'Growth Monitoring' },
];

// ─── PROPS ────────────────────────────────────────────────────────────────────
interface DailyFarmAdvisorProps {
  isDark: boolean;
  ponds: any[];
  waterRecords?: any[];
}

export const DailyFarmAdvisor: React.FC<DailyFarmAdvisorProps> = ({ isDark, ponds, waterRecords = [] }) => {
  const season = useMemo(() => getSeason(), []);
  const lunar  = useMemo(() => getLunarStatus(new Date()), []);
  const hour   = new Date().getHours();

  // Pick the most active / earliest-stage pond
  const activePonds = ponds.filter(p => p.status === 'active' || p.status === 'planned');
  const focusPond   = activePonds[0];

  // Stable daily wisdom (day-of-year index)
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const wisdom    = DAILY_WISDOM[dayOfYear % DAILY_WISDOM.length];

  // Only compute DOC-guidance if there's an active pond
  const docGuidance = useMemo(() => {
    if (!focusPond) return null;
    const doc = focusPond.stockingDate
      ? Math.floor((Date.now() - new Date(focusPond.stockingDate).getTime()) / 86400000)
      : 0;
    return getDocGuidance(doc, focusPond.species || 'Vannamei');
  }, [focusPond]);

  // Today's seasonal tip (stable per day)
  const seasonTips = SEASON_TIPS[season.label] || SEASON_TIPS['Summer'];
  const todayTip   = seasonTips[dayOfYear % seasonTips.length];

  // Greeting time-of-day
  const greeting = hour < 12 ? '🌅 Good Morning' : hour < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening';

  // Lunar risk banner
  const isLunarRisk    = lunar.phase !== 'NORMAL';
  const lunarEmoji     = { AMAVASYA: '🌑', POURNAMI: '🌕', ASHTAMI: '🌓', NAVAMI: '🌙', NORMAL: '🌤️' }[lunar.phase] ?? '🌤️';
  const lunarAlertText = {
    AMAVASYA: 'Amavasya tonight — Reduce feed 25%, run max aeration, apply minerals in morning.',
    POURNAMI: 'Pournami tonight — High activity, increase aeration to 100%, monitor DO at midnight.',
    ASHTAMI:  'Ashtami — Molting begins. Reduce feed 10%, apply mineral mix this evening.',
    NAVAMI:   'Navami — Peak molting recovery. Reduce feed 15%, maintain max aeration till 2 AM.',
    NORMAL:   '',
  }[lunar.phase] ?? '';

  if (activePonds.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-3"
    >
      {/* ── Section label ── */}
      <div className="flex items-center gap-2 px-1">
        <div className={cn('w-5 h-5 rounded-lg flex items-center justify-center', isDark ? 'bg-emerald-500/15' : 'bg-emerald-100')}>
          <Leaf size={11} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
        </div>
        <p className={cn('text-[8px] font-black uppercase tracking-[0.25em]', isDark ? 'text-emerald-400/70' : 'text-emerald-700')}>
          Today's Farm Intelligence
        </p>
      </div>

      {/* ══════════════════════════════════════════
          MAIN ADVISOR CARD
      ══════════════════════════════════════════ */}
      <div className={cn(
        'rounded-[1.8rem] border overflow-hidden',
        isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm'
      )}>
        {/* Color accent bar — phase color */}
        <div className="h-[3px] w-full" style={{
          background: docGuidance
            ? `linear-gradient(90deg, ${docGuidance.color}, ${docGuidance.color}80)`
            : 'linear-gradient(90deg, #10B981, #3B82F6)'
        }} />

        <div className="p-4 space-y-4">
          {/* Greeting + phase */}
          <div className="flex items-center justify-between">
            <div>
              <p className={cn('text-[7.5px] font-black uppercase tracking-[0.25em]', isDark ? 'text-white/25' : 'text-slate-400')}>
                {greeting}
              </p>
              {docGuidance && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-base leading-none">{docGuidance.emoji}</span>
                  <p className="text-[10px] font-black" style={{ color: docGuidance.color }}>
                    {docGuidance.phase}
                  </p>
                </div>
              )}
            </div>
            {/* Season badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border"
              style={{ background: `${season.color}12`, borderColor: `${season.color}30` }}>
              <span className="text-sm">{season.emoji}</span>
              <div>
                <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: season.color }}>{season.label}</p>
                <p className={cn('text-[6px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>{season.risk}</p>
              </div>
            </div>
          </div>

          {/* DOC-specific guide blocks */}
          {docGuidance && (
            <div className="space-y-2">
              {/* GUIDE — what to do */}
              <div className={cn('rounded-2xl p-3 border flex items-start gap-2.5',
                isDark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')}>
                <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0',
                  isDark ? 'bg-emerald-500/20' : 'bg-emerald-100')}>
                  <ShieldCheck size={13} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                </div>
                <div>
                  <p className={cn('text-[7.5px] font-black uppercase tracking-widest mb-0.5',
                    isDark ? 'text-emerald-400/70' : 'text-emerald-700')}>Today's Guidance</p>
                  <p className={cn('text-[9px] font-medium leading-snug', isDark ? 'text-white/60' : 'text-slate-600')}>
                    {docGuidance.guide}
                  </p>
                </div>
              </div>

              {/* CAUTION — what not to do */}
              <div className={cn('rounded-2xl p-3 border flex items-start gap-2.5',
                isDark ? 'bg-amber-500/8 border-amber-500/20' : 'bg-amber-50 border-amber-200')}>
                <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0',
                  isDark ? 'bg-amber-500/20' : 'bg-amber-100')}>
                  <AlertTriangle size={13} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
                </div>
                <div>
                  <p className={cn('text-[7.5px] font-black uppercase tracking-widest mb-0.5',
                    isDark ? 'text-amber-400/70' : 'text-amber-700')}>Caution</p>
                  <p className={cn('text-[9px] font-medium leading-snug', isDark ? 'text-white/60' : 'text-slate-600')}>
                    {docGuidance.caution}
                  </p>
                </div>
              </div>

              {/* TIP — expert insight */}
              <div className={cn('rounded-2xl p-3 border flex items-start gap-2.5',
                isDark ? 'bg-blue-500/8 border-blue-500/20' : 'bg-blue-50 border-blue-200')}>
                <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0',
                  isDark ? 'bg-blue-500/20' : 'bg-blue-100')}>
                  <Lightbulb size={13} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                </div>
                <div>
                  <p className={cn('text-[7.5px] font-black uppercase tracking-widest mb-0.5',
                    isDark ? 'text-blue-400/70' : 'text-blue-700')}>Expert Tip</p>
                  <p className={cn('text-[9px] font-medium leading-snug', isDark ? 'text-white/60' : 'text-slate-600')}>
                    {docGuidance.tip}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Seasonal tip of the day */}
          <div className={cn('rounded-2xl p-3 border flex items-start gap-2.5',
            isDark ? 'bg-white/[0.03] border-white/8' : 'bg-slate-50 border-slate-100')}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${season.color}18` }}>
              <season.icon size={13} style={{ color: season.color }} />
            </div>
            <div>
              <p className="text-[7.5px] font-black uppercase tracking-widest mb-0.5" style={{ color: season.color }}>
                {season.label} Season Tip
              </p>
              <p className={cn('text-[9px] font-medium leading-snug', isDark ? 'text-white/60' : 'text-slate-600')}>
                {todayTip}
              </p>
            </div>
          </div>

          {/* Lunar alert (if active) */}
          <AnimatePresence>
            {isLunarRisk && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className={cn('rounded-2xl p-3 border flex items-start gap-2.5',
                  isDark ? 'bg-indigo-500/8 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200')}>
                <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0',
                  isDark ? 'bg-indigo-500/20' : 'bg-indigo-100')}>
                  <Star size={13} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                </div>
                <div>
                  <p className={cn('text-[7.5px] font-black uppercase tracking-widest mb-0.5',
                    isDark ? 'text-indigo-400/70' : 'text-indigo-700')}>
                    {lunarEmoji} Lunar Alert — {lunar.phase}
                  </p>
                  <p className={cn('text-[9px] font-medium leading-snug', isDark ? 'text-white/60' : 'text-slate-600')}>
                    {lunarAlertText}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DAILY WISDOM QUOTE
      ══════════════════════════════════════════ */}
      <div className={cn(
        'rounded-2xl px-4 py-3.5 border relative overflow-hidden',
        isDark ? 'bg-white/[0.025] border-white/6' : 'bg-white border-slate-100 shadow-sm'
      )}>
        <div className="absolute top-2 right-4 text-5xl font-black opacity-[0.04] select-none">"</div>
        <div className="flex items-start gap-3">
          <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
            isDark ? 'bg-[#C78200]/15' : 'bg-amber-50')}>
            <TrendingUp size={13} className={isDark ? 'text-[#C78200]' : 'text-amber-600'} />
          </div>
          <div>
            <p className={cn('text-[9px] font-black uppercase tracking-widest mb-1', isDark ? 'text-[#C78200]/80' : 'text-amber-600')}>
              Farm Wisdom of the Day
            </p>
            <p className={cn('text-[9px] font-medium leading-snug italic', isDark ? 'text-white/55' : 'text-slate-600')}>
              "{wisdom.quote}"
            </p>
            <p className={cn('text-[7px] font-black uppercase tracking-widest mt-1.5', isDark ? 'text-white/20' : 'text-slate-400')}>
              — {wisdom.author}
            </p>
          </div>
        </div>
      </div>

    </motion.div>
  );
};
