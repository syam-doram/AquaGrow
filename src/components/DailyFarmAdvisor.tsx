/**
 * DailyFarmAdvisor.tsx
 * Collapsed banner with tap-to-expand dropdown.
 * Shows: Guide · Caution · Expert Tip · Seasonal Tip · Lunar Alert · Daily Wisdom
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Leaf, Sun, CloudRain, Snowflake, AlertTriangle,
  ShieldCheck, Lightbulb, TrendingUp, ChevronDown, Star,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getLunarStatus } from '../utils/lunarUtils';
import { calculateDOC } from '../utils/pondUtils';

// ─── SEASON ───────────────────────────────────────────────────────────────────
const getSeason = () => {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return { label: 'Summer', Icon: Sun,       emoji: '☀️', color: '#F97316', risk: 'Heat stress & Low DO' };
  if (m >= 6 && m <= 9) return { label: 'Monsoon', Icon: CloudRain, emoji: '🌧️', color: '#3B82F6', risk: 'Salinity crash & WSSV' };
  return                       { label: 'Winter',  Icon: Snowflake,  emoji: '❄️', color: '#06B6D4', risk: 'Slow growth & WSSV' };
};

// ─── SEASONAL TIPS ────────────────────────────────────────────────────────────
const SEASON_TIPS: Record<string, string[]> = {
  Summer: [
    'Skip the 12 PM–2 PM feed slot on days above 34°C. Shrimp digestion slows—leftover feed spikes ammonia.',
    'Run aerators at 100% capacity from 10 PM to 6 AM. DO crashes in hot weather after midnight.',
    'Add Vitamin C + Betaine to feed during heat waves to reduce stress hormones and keep immunity strong.',
    'Check DO and temperature twice daily — 6 AM and 6 PM. Act early, not after mortality appears.',
    'A 10–15% water exchange in the morning flushes ammonia and cools the pond slightly.',
  ],
  Monsoon: [
    'After heavy rain: reduce feed by 20%, add zeolite (50 kg/acre) to absorb ammonia from surface runoff.',
    'Salinity can drop sharply in rain. Monitor daily and add mineral mix to maintain ionic balance.',
    'WSSV risk is highest June–September. Apply immunity booster (Beta-Glucan) once a week preventively.',
    'Avoid applying probiotics 3 hours before or after heavy rain — pH crashes reduce effectiveness.',
    'Check water clarity after rain. Secchi depth < 25 cm means bloom crash — apply fresh probiotic.',
  ],
  Winter: [
    'If water temp falls below 26°C, reduce feed by 15–20%. Shrimp metabolism slows significantly.',
    'Apply Vitamin C + minerals in morning feed only. Avoid evening medicine application in cold weather.',
    'WSSV triggers in cold snaps. Watch for white spots on shell and fanning tail fin signs.',
    'Aerate continuously even on cold nights — photosynthesis is low, DO can still crash after midnight.',
    'Growth is slower in winter. Do not rush harvest — weigh shrimp weekly to track actual progress.',
  ],
};

// ─── DOC GUIDANCE ─────────────────────────────────────────────────────────────
const getDocGuidance = (doc: number, species: string) => {
  const isTiger = species === 'Tiger';
  if (doc <= 0) return { phase: 'Pre-Stocking', emoji: '🏗️', color: '#6366F1', guide: 'Prepare pond correctly — this single step determines your entire cycle success.', caution: 'Never stock before water is aged (Secchi 35–45 cm, pH 7.8–8.2).', tip: 'Apply Bloomex/Probiotic 7 days before stocking to build beneficial bacteria.' };
  if (doc <= 3) return { phase: 'Stocking & Blind Feed', emoji: '🐟', color: '#10B981', guide: 'First 72 hours are critical. Shrimp are stressed from transport — build immunity now.', caution: 'Do NOT use feed trays on DOC 1–3. Scatter feed evenly across the whole pond.', tip: `Apply Vitamin C + Betaine in water for first 3 days (${isTiger ? '3g/L' : '2g/L'}).` };
  if (doc <= 10) return { phase: 'Early Establishment', emoji: '🌱', color: '#10B981', guide: 'Shrimp are building gut bacteria. Apply gut probiotic in feed every single day this week.', caution: 'No water exchange in first 10 DOC unless pH > 8.8 or DO < 4 mg/L.', tip: 'Water probiotic on DOC 5 and DOC 10 — the most overlooked but powerful step.' };
  if (doc <= 20) return { phase: 'Growth Spurt', emoji: '📈', color: '#3B82F6', guide: 'Shrimp are growing fast. Increase feed 10% per day if tray shows < 5% residue.', caution: 'Do NOT increase feed when water looks dark or cloudy — check DO first.', tip: 'DOC 15 Vitamin C booster is mandatory. Boosts immunity before the high-risk zone.' };
  if (doc <= 30) return { phase: 'Risk Stage — Vibriosis', emoji: '⚠️', color: '#F59E0B', guide: 'Vibriosis risk is high (DOC 21–30). Watch for red tail, gill discoloration, slow feeders.', caution: 'Reduce feed 10% if you see any tail redness. Apply gut + water probiotic together.', tip: 'DOC 25 Immunity Booster is critical — think of it as a vaccine window.' };
  if (doc <= 45) return { phase: 'WSSV Critical Stage', emoji: '🦠', color: '#EF4444', guide: 'Most dangerous window of the culture cycle. Maximum monitoring required every meal.', caution: '⚠️ Check trays after EVERY feed. More than 20% residue → STOP next slot + check DO.', tip: `WSSV prevention: Apply ${isTiger ? 'Beta-Glucan 1g/kg feed' : 'Beta-Glucan + organic acid in water'} every 3rd day.` };
  if (doc <= 60) return { phase: 'Mid Growth', emoji: '💪', color: '#8B5CF6', guide: 'Shrimp past the critical zone. Focus on FCR — every wasted kg of feed costs profit.', caution: 'FCR > 1.6 means you are losing ₹200+ per kg of shrimp — reduce feed immediately.', tip: 'Sample 10 shrimp weekly. Track average body weight against your SOP chart.' };
  if (doc <= 80) return { phase: 'Peak Growth Phase', emoji: '🎯', color: '#C78200', guide: 'Shrimp at fastest growth rate. Consistent management maximizes final yield.', caution: 'Liver Tonic (DOC 50) is mandatory — hepatopancreas damage is invisible until it is too late.', tip: 'Take size samples at DOC 60 and 70 to plan harvest timing. 20g+ per shrimp is target.' };
  return { phase: 'Harvest Preparation', emoji: '🎣', color: '#EF4444', guide: 'Stop all heavy medicines. Final quality depends on clean water and medicine withdrawal.', caution: '🚫 Zero antibiotics from DOC 85. Residue testing at harvest is mandatory for export.', tip: 'Test size daily from DOC 85. Harvest window is narrow — timing matters more than waiting.' };
};

const DAILY_WISDOM = [
  { quote: 'Water quality is the first medicine. Fix the water before giving any treatment.', author: 'Aquaculture Principle' },
  { quote: 'A farmer who logs every day loses less. Data is your insurance policy.', author: 'AquaGrow Insight' },
  { quote: 'DO below 4 mg/L is an emergency. DO above 6 mg/L is your target every morning.', author: 'SOP Standard' },
  { quote: 'Feed the shrimp, not the pond. Leftover feed is the enemy of healthy water.', author: 'Feeding Protocol' },
  { quote: 'Amavasya and Pournami are not superstitions — they are proven molting cycles.', author: 'Lunar Farming Guide' },
  { quote: 'The best time to apply probiotics is before you see problems, not after.', author: 'Preventive Protocol' },
  { quote: 'A 1°C rise above 32°C can cut your DO by 10%. Shade and aeration matter.', author: 'Water Science' },
  { quote: 'Sample 10 shrimp weekly. Slow growth with healthy shrimp means wrong feed rate.', author: 'Growth Monitoring' },
];

const MOON_TIP: Record<string, string> = {
  AMAVASYA: 'Amavasya tonight — Reduce feed 25%, run max aeration, apply minerals in morning only.',
  POURNAMI: 'Pournami tonight — High activity. Increase aeration 100%, monitor DO at midnight.',
  ASHTAMI:  'Ashtami — Molting begins. Reduce feed 10%, apply mineral mix this evening.',
  NAVAMI:   'Navami — Peak molting recovery. Reduce feed 15%, maintain max aeration till 2 AM.',
  NORMAL:   '',
};
const MOON_EMOJI: Record<string, string> = { AMAVASYA: '🌑', POURNAMI: '🌕', ASHTAMI: '🌓', NAVAMI: '🌙', NORMAL: '🌤️' };

// ─── PROPS ────────────────────────────────────────────────────────────────────
interface DailyFarmAdvisorProps {
  isDark: boolean;
  ponds: any[];
  waterRecords?: any[];
}

export const DailyFarmAdvisor: React.FC<DailyFarmAdvisorProps> = ({ isDark, ponds, waterRecords = [] }) => {
  const [open, setOpen] = useState(false);

  const season  = useMemo(() => getSeason(), []);
  const lunar   = useMemo(() => getLunarStatus(new Date()), []);
  const hour    = new Date().getHours();

  const activePonds = ponds.filter(p => p.status === 'active' || p.status === 'planned');
  const focusPond   = activePonds[0];

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const wisdom    = DAILY_WISDOM[dayOfYear % DAILY_WISDOM.length];
  const seasonTips = SEASON_TIPS[season.label] || SEASON_TIPS['Summer'];
  const todayTip = seasonTips[dayOfYear % seasonTips.length];

  const docGuidance = useMemo(() => {
    if (!focusPond) return null;
    const doc = calculateDOC(focusPond.stockingDate);
    return getDocGuidance(doc, focusPond.species || 'Vannamei');
  }, [focusPond]);

  const isLunarRisk  = lunar.phase !== 'NORMAL';
  const lunarTip     = MOON_TIP[lunar.phase] ?? '';
  const lunarEmoji   = MOON_EMOJI[lunar.phase] ?? '🌤️';

  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

  if (activePonds.length === 0) return null;

  // Banner accent: phase color if guidance exists, else season color
  const accentColor = docGuidance?.color ?? season.color;

  return (
    <div className="space-y-0">
      {/* ════════════════════════════════════════════
          COLLAPSED BANNER (always visible)
      ════════════════════════════════════════════ */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all duration-300',
          open
            ? isDark ? 'rounded-b-none border-b-0' : 'rounded-b-none border-b-0'
            : '',
          isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-slate-200 shadow-sm'
        )}
      >
        {/* Left: colored pulse dot + label + phase badge */}
        <div className="flex items-center gap-2.5">
          {/* Accent dot */}
          <div className="relative flex-shrink-0">
            <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
            <motion.div
              animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full"
              style={{ background: accentColor }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className={cn('text-[8.5px] font-black uppercase tracking-[0.22em]', isDark ? 'text-white/60' : 'text-slate-700')}>
              🌾 Farm Intelligence
            </span>
            {docGuidance && (
              <span className="text-[7px] font-black px-2 py-0.5 rounded-full" style={{ background: `${accentColor}18`, color: accentColor }}>
                {docGuidance.emoji} {docGuidance.phase}
              </span>
            )}
            {isLunarRisk && (
              <span className="text-[7px] font-black px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">
                {lunarEmoji} Lunar
              </span>
            )}
          </div>
        </div>

        {/* Right: season badge + chevron */}
        <div className="flex items-center gap-2">
          <span className="text-[7px] font-black px-2 py-0.5 rounded-full" style={{ background: `${season.color}18`, color: season.color }}>
            {season.emoji} {season.label}
          </span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown size={14} className={isDark ? 'text-white/30' : 'text-slate-400'} />
          </motion.div>
        </div>
      </motion.button>

      {/* ════════════════════════════════════════════
          DROPDOWN PANEL
      ════════════════════════════════════════════ */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className={cn(
              'rounded-b-2xl border border-t-0 px-4 pb-4 pt-3 space-y-2.5',
              isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            )}>

              {/* Good [time] greeting sub-label */}
              <p className={cn('text-[7px] font-black uppercase tracking-[0.22em]', isDark ? 'text-white/20' : 'text-slate-300')}>
                Good {greeting}, Farmer · {focusPond?.name ?? ''}
              </p>

              {/* Accent divider */}
              <div className="h-px rounded-full" style={{ background: `linear-gradient(90deg, ${accentColor}60, transparent)` }} />

              {docGuidance && (
                <>
                  {/* GUIDE */}
                  <div className={cn('rounded-xl p-3 border flex items-start gap-2.5',
                    isDark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')}>
                    <ShieldCheck size={13} className={cn('flex-shrink-0 mt-0.5', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
                    <div>
                      <p className={cn('text-[6.5px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-emerald-400/70' : 'text-emerald-700')}>Today's Guidance</p>
                      <p className={cn('text-[8.5px] font-medium leading-snug', isDark ? 'text-white/60' : 'text-slate-600')}>{docGuidance.guide}</p>
                    </div>
                  </div>

                  {/* CAUTION */}
                  <div className={cn('rounded-xl p-3 border flex items-start gap-2.5',
                    isDark ? 'bg-amber-500/8 border-amber-500/20' : 'bg-amber-50 border-amber-200')}>
                    <AlertTriangle size={13} className={cn('flex-shrink-0 mt-0.5', isDark ? 'text-amber-400' : 'text-amber-600')} />
                    <div>
                      <p className={cn('text-[6.5px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-amber-400/70' : 'text-amber-700')}>Caution</p>
                      <p className={cn('text-[8.5px] font-medium leading-snug', isDark ? 'text-white/60' : 'text-slate-600')}>{docGuidance.caution}</p>
                    </div>
                  </div>

                  {/* TIP */}
                  <div className={cn('rounded-xl p-3 border flex items-start gap-2.5',
                    isDark ? 'bg-blue-500/8 border-blue-500/20' : 'bg-blue-50 border-blue-200')}>
                    <Lightbulb size={13} className={cn('flex-shrink-0 mt-0.5', isDark ? 'text-blue-400' : 'text-blue-600')} />
                    <div>
                      <p className={cn('text-[6.5px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-blue-400/70' : 'text-blue-700')}>Expert Tip</p>
                      <p className={cn('text-[8.5px] font-medium leading-snug', isDark ? 'text-white/60' : 'text-slate-600')}>{docGuidance.tip}</p>
                    </div>
                  </div>
                </>
              )}

              {/* SEASONAL TIP */}
              <div className={cn('rounded-xl p-3 border flex items-start gap-2.5',
                isDark ? 'bg-white/[0.03] border-white/8' : 'bg-slate-50 border-slate-100')}>
                <season.Icon size={13} style={{ color: season.color }} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[6.5px] font-black uppercase tracking-widest mb-0.5" style={{ color: season.color }}>{season.label} Season Tip</p>
                  <p className={cn('text-[8.5px] font-medium leading-snug', isDark ? 'text-white/60' : 'text-slate-600')}>{todayTip}</p>
                </div>
              </div>

              {/* LUNAR (only on risk nights) */}
              {isLunarRisk && (
                <div className={cn('rounded-xl p-3 border flex items-start gap-2.5',
                  isDark ? 'bg-indigo-500/8 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200')}>
                  <Star size={13} className={cn('flex-shrink-0 mt-0.5', isDark ? 'text-indigo-400' : 'text-indigo-600')} />
                  <div>
                    <p className={cn('text-[6.5px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-indigo-400/70' : 'text-indigo-700')}>
                      {lunarEmoji} Lunar Alert — {lunar.phase}
                    </p>
                    <p className={cn('text-[8.5px] font-medium leading-snug', isDark ? 'text-white/60' : 'text-slate-600')}>{lunarTip}</p>
                  </div>
                </div>
              )}

              {/* WISDOM QUOTE */}
              <div className={cn('rounded-xl p-3 border flex items-start gap-2.5',
                isDark ? 'bg-white/[0.02] border-white/6' : 'bg-amber-50/50 border-amber-100')}>
                <TrendingUp size={13} className={cn('flex-shrink-0 mt-0.5', isDark ? 'text-[#C78200]/80' : 'text-amber-600')} />
                <div>
                  <p className={cn('text-[6.5px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-[#C78200]/70' : 'text-amber-600')}>Farm Wisdom</p>
                  <p className={cn('text-[8.5px] font-medium leading-snug italic', isDark ? 'text-white/50' : 'text-slate-600')}>"{wisdom.quote}"</p>
                  <p className={cn('text-[6.5px] font-black uppercase tracking-widest mt-1', isDark ? 'text-white/15' : 'text-slate-400')}>— {wisdom.author}</p>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
