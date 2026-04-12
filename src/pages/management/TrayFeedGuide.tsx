import React from 'react';
import { motion } from 'motion/react';
import { Eye, Target } from 'lucide-react';
import { cn } from '../../utils/cn';

// ── Tray Feed Engine ──────────────────────────────────────────────────────────
export const getTrayGuide = (doc: number, pondSizeAcre: number, abwGrams: number) => {
  if (doc < 20) return null;

  // Tray ratio drops as shrimp grow (industry SOP: 2-3% of daily feed in tray per slot)
  let trayRatioPct = 3.0;
  if (abwGrams >= 5)  trayRatioPct = 3.0;
  if (abwGrams >= 10) trayRatioPct = 2.5;
  if (abwGrams >= 15) trayRatioPct = 2.0;
  if (abwGrams >= 20) trayRatioPct = 1.5;
  if (abwGrams >= 25) trayRatioPct = 1.0;

  // Standard: 1 tray per acre; cap at 4
  const trayCount = pondSizeAcre <= 1 ? 1 : Math.min(Math.floor(pondSizeAcre), 4);

  // Check time after feeding
  const checkTime = doc > 60 ? '+1 Hr' : doc >= 30 ? '+1:30 Hrs' : '+2 Hrs';
  const checkOffsetHrs = doc > 60 ? 1 : doc >= 30 ? 1.5 : 2;

  const decisions = [
    { find: 'Tray EMPTY before check time',         action: 'Increase next slot by 10–15%. Shrimp appetite is HIGH.',           icon: '🔺', color: 'text-emerald-500' },
    { find: 'Tray EMPTY exactly at check time',     action: 'Feed quantity is PERFECT. No change needed.',                       icon: '✅', color: 'text-emerald-400' },
    { find: 'Tray has leftover ≤ 20%',              action: 'Reduce next slot by 10%. Slight overfeeding.',                      icon: '⚠️', color: 'text-amber-500'  },
    { find: 'Tray has leftover > 20%',              action: 'Reduce next slot by 15–20%. Check DO and shrimp health.',           icon: '🔻', color: 'text-red-500'    },
    { find: 'Tray has RED / DARK coloured pellets', action: 'STOP feeding. Check for disease or DO crash immediately.',          icon: '🚨', color: 'text-red-600'    },
  ];

  return { trayRatioPct, trayCount, checkTime, checkOffsetHrs, decisions };
};

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  doc: number;
  pondSizeAcre: number;
  effectiveAbw: number;
  confirmedTrayAbw: number | null;
  trayEnabled: boolean;
  trayKgPerSlot: number;
  kgPerSlot: string;
  feedSlots: { time: string; hour: number; label: string }[];
  feedType: string;
  isDark: boolean;
  onRecalibrate: () => void;
  onEnableTray: () => void;
}

export const TrayFeedGuide: React.FC<Props> = ({
  doc, pondSizeAcre, effectiveAbw, confirmedTrayAbw, trayEnabled,
  trayKgPerSlot, kgPerSlot, feedSlots, feedType, isDark, onRecalibrate, onEnableTray,
}) => {
  const trayGuide = getTrayGuide(doc, pondSizeAcre, effectiveAbw);

  /* ── BLIND PHASE (DOC < 20) ── */
  if (doc < 20) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className={cn('rounded-[2rem] p-6 border text-center', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
        <div className={cn('w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center', isDark ? 'bg-blue-500/10' : 'bg-blue-50')}>
          <span className="text-3xl">🫣</span>
        </div>
        <h3 className={cn('font-black text-sm tracking-tight mb-1', isDark ? 'text-white' : 'text-slate-900')}>Blind Feed Phase</h3>
        <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3', isDark ? 'text-blue-400' : 'text-blue-600')}>
          DOC {doc} · Tray monitoring starts at DOC 20
        </p>
        <p className={cn('text-[10px] font-medium leading-relaxed mb-4', isDark ? 'text-white/40' : 'text-slate-500')}>
          Shrimp are too small to reliably consume from trays. Scatter feed evenly.
          Tray system unlocks in <span className="font-black">{20 - doc} more days</span>.
        </p>
        <div className={cn('p-3 rounded-2xl border text-left', isDark ? 'bg-blue-500/5 border-blue-500/15' : 'bg-blue-50 border-blue-100')}>
          <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2', isDark ? 'text-blue-400' : 'text-blue-700')}>Current Blind Feed SOP</p>
          {[
            `Scatter ${kgPerSlot} kg evenly per slot across pond`,
            'Feed 4× daily — 6AM · 10AM · 2PM · 8:30PM',
            'No tray — shrimp eat floating / sinking pellets',
            'Do NOT overfeed — turbid water = stressed shrimp',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-1.5 mb-1.5">
              <span className="text-blue-400 font-black text-[8px] flex-shrink-0">{i + 1}.</span>
              <p className={cn('text-[9px] font-medium', isDark ? 'text-white/50' : 'text-slate-600')}>{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  /* ── DOC ≥ 20 BUT FARMER HASN'T CONFIRMED TRAYS YET ── */
  if (doc >= 20 && !trayEnabled) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <div className={cn('rounded-[2rem] overflow-hidden border', isDark ? 'border-amber-500/25' : 'border-amber-200 shadow-sm')}>
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-5 text-center">
          <div className="text-5xl mb-3">🔬</div>
          <h3 className="text-white font-black text-base tracking-tight mb-1">Feed Tray Check Unlocked!</h3>
          <p className="text-white/70 text-[8px] font-bold">Your shrimp are now at DOC {doc} — tray monitoring is recommended from DOC 20</p>
        </div>
        <div className={cn('p-5', isDark ? 'bg-[#0A1810]' : 'bg-white')}>
          <div className={cn('rounded-2xl p-3.5 border mb-4', isDark ? 'bg-amber-500/8 border-amber-500/15' : 'bg-amber-50 border-amber-100')}>
            {[
              '🎯 See exactly how much shrimp are eating per slot',
              '📉 Prevent overfeeding — saves ₹200–500/day in feed',
              '⏰ Check tray 1–2 hrs after feed — adjust next slot',
              '📊 Mandatory for accurate FCR from DOC 20 onwards',
            ].map((tip, i) => (
              <p key={i} className={cn('text-[9px] font-medium leading-snug mb-1.5', isDark ? 'text-amber-200/70' : 'text-amber-900/80')}>{tip}</p>
            ))}
          </div>
          <button
            onClick={onEnableTray}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all"
          >
            🔴 Enable Tray Monitoring →
          </button>
        </div>
      </div>
    </motion.div>
  );

  if (!trayGuide) return null;

  /* ── ACTIVE TRAY GUIDE ── */
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">

      {/* Hero card */}
      <div className={cn('rounded-[2rem] overflow-hidden', isDark ? 'border border-amber-500/20' : 'bg-white border border-amber-200 shadow-sm')}>
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-white" />
              <p className="text-white font-black text-[9px] uppercase tracking-widest">Tray Feed Intelligence</p>
            </div>
            <span className="text-[6.5px] font-black text-white/70 bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
              DOC {doc} · ABW {effectiveAbw.toFixed(1)}g
            </span>
          </div>
          <p className="text-white/60 text-[7.5px] font-bold">
            {trayGuide.trayCount} tray{trayGuide.trayCount > 1 ? 's' : ''} for {pondSizeAcre} acre · Check {trayGuide.checkTime} after feed
          </p>
        </div>

        {/* Stats grid */}
        <div className={cn('grid grid-cols-3 divide-x divide-card-border border-b border-card-border', isDark ? 'bg-[#0A1A12]' : '')}>
          {[
            { label: 'Feed/Tray/Slot', value: `${trayKgPerSlot} kg`, sub: `${trayGuide.trayRatioPct}% of slot` },
            { label: 'Tray Count',      value: `${trayGuide.trayCount}`,      sub: `${pondSizeAcre} acre pond` },
            { label: 'Check After',     value: trayGuide.checkTime,            sub: 'Per feed slot' },
          ].map((s, i) => (
            <div key={i} className="py-4 text-center px-1">
              <p className={cn('font-black text-sm leading-none', isDark ? 'text-amber-300' : 'text-amber-700')}>{s.value}</p>
              <p className={cn('text-[6px] font-black uppercase tracking-widest mt-1', isDark ? 'text-white/20' : 'text-slate-400')}>{s.label}</p>
              <p className={cn('text-[5.5px] font-bold mt-0.5', isDark ? 'text-white/15' : 'text-slate-300')}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Per-slot schedule */}
        <div className={cn('px-5 py-3 border-b', isDark ? 'bg-[#0A1A12] border-amber-500/10' : 'border-amber-100')}>
          <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/25' : 'text-slate-400')}>Today's Tray Schedule</p>
          <div className="space-y-1.5">
            {feedSlots.map((slot, i) => {
              const raw = slot.hour + trayGuide.checkOffsetHrs;
              const hh  = Math.floor(raw) % 24;
              const mm  = raw % 1 === 0.5 ? '30' : '00';
              const h12 = hh % 12 === 0 ? 12 : hh % 12;
              const ap  = hh < 12 ? 'AM' : 'PM';
              return (
                <div key={i} className={cn('flex items-center justify-between px-3 py-2.5 rounded-xl border',
                  isDark ? 'bg-white/3 border-white/5' : 'bg-amber-50/50 border-amber-100')}>
                  <div>
                    <p className={cn('text-[9px] font-black', isDark ? 'text-white' : 'text-slate-900')}>Feed at {slot.time}</p>
                    <p className={cn('text-[7px] font-bold', isDark ? 'text-amber-400/70' : 'text-amber-600')}>
                      🔬 Check tray: {h12}:{mm} {ap}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-[10px] font-black', isDark ? 'text-amber-300' : 'text-amber-700')}>{trayKgPerSlot} kg</p>
                    <p className={cn('text-[6px] font-black uppercase', isDark ? 'text-white/20' : 'text-slate-400')}>per tray</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ABW row */}
        <div className={cn('px-5 py-3 flex items-center justify-between', isDark ? 'bg-[#0A1A12]' : '')}>
          <p className={cn('text-[8px] font-bold', isDark ? 'text-white/40' : 'text-slate-500')}>
            ABW: <span className={cn('font-black', isDark ? 'text-amber-300' : 'text-amber-700')}>{effectiveAbw.toFixed(2)}g</span>
            {confirmedTrayAbw !== null
              ? <span className="ml-1 text-emerald-500 text-[7px]">✓ Farmer set</span>
              : <span className="ml-1 text-slate-400 text-[7px]">(SOP estimate)</span>}
          </p>
          <button
            onClick={onRecalibrate}
            className={cn('text-[7px] font-black px-2.5 py-1.5 rounded-xl border transition-all active:scale-95',
              isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700')}
          >
            Recalibrate ABW
          </button>
        </div>
      </div>

      {/* Decision Table */}
      <div className={cn('rounded-[2rem] overflow-hidden border', isDark ? 'bg-[#0A1A12] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
        <div className={cn('px-5 py-4 border-b flex items-center gap-3', isDark ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-slate-50')}>
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'bg-emerald-500/10' : 'bg-emerald-100')}>
            <Target size={14} className="text-emerald-500" />
          </div>
          <div>
            <h3 className={cn('font-black text-[11px] tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Tray Result → Action Guide</h3>
            <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>What to do based on what you see in tray</p>
          </div>
        </div>
        <div className="divide-y divide-card-border">
          {trayGuide.decisions.map((d, i) => (
            <div key={i} className="px-5 py-3.5 flex items-start gap-3">
              <span className="text-lg flex-shrink-0">{d.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-[10px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{d.find}</p>
                <p className={cn('text-[8px] font-bold mt-0.5 leading-snug', d.color)}>{d.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stage SOP */}
      <div className={cn('rounded-[2rem] p-4 border', isDark ? 'bg-indigo-500/5 border-indigo-500/15' : 'bg-indigo-50 border-indigo-200')}>
        <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2', isDark ? 'text-indigo-400' : 'text-indigo-700')}>
          📋 DOC {doc} Tray SOP · {feedType}
        </p>
        {(doc <= 30 ? [
          `Put ${trayKgPerSlot}kg per tray per slot — shrimp are at 0.3–0.8g stage`,
          'Check tray +2 hours after feeding — they eat slowly at this stage',
          '10–20% leftover is NORMAL — do not panic',
          'Increase 5% if tray empty early for 2 consecutive days',
        ] : doc <= 45 ? [
          `Tray: ${trayKgPerSlot}kg — WSSV critical window (DOC 31–45)`,
          'Check tray +1:30 Hrs — any leftover is a disease warning',
          '⚠️ Empty tray early = stress eating OR high appetite — check DO immediately',
          'Leftover > 20% + red shrimp = reduce 20% and alert veterinarian',
        ] : doc <= 70 ? [
          `Tray: ${trayKgPerSlot}kg — High biomass, strong appetite`,
          'Check tray +1:30 Hrs — tray should be near empty',
          'Two consecutive clean trays → increase daily feed by 5%',
          'Track tray result per slot in your daily notes for certification',
        ] : [
          `Tray: ${trayKgPerSlot}kg — Pre-harvest phase (DOC ${doc})`,
          'Check tray +1 Hr — shrimp eat very fast at large size',
          'Tray always empty → consider advancing harvest date',
          'Reduce tray qty 15% in final 5–7 days to flush gut for clean shrimp',
        ]).map((tip, i) => (
          <div key={i} className="flex items-start gap-1.5 mb-1.5">
            <span className={cn('font-black text-[8px] flex-shrink-0', isDark ? 'text-indigo-400' : 'text-indigo-600')}>{i + 1}.</span>
            <p className={cn('text-[9px] font-medium leading-snug', isDark ? 'text-white/50' : 'text-slate-600')}>{tip}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
