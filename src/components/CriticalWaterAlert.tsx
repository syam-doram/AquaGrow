/**
 * CriticalWaterAlert.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-screen critical water quality alert overlay.
 *
 * Shows when water log data contains dangerous readings.
 * Displays:
 *  - Emergency header with pulsing indicators
 *  - Per-parameter cautions (what's wrong + why it's dangerous)
 *  - Numbered action steps the farmer must take RIGHT NOW
 *  - Farmer acknowledgement flow:  "I've Done This" → returns to normal UI
 *
 * After acknowledgment the parent receives onAcknowledge() and stops
 * showing the overlay.  Acknowledgement is persisted in sessionStorage
 * so refreshes don't re-trigger within the same session.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, X, CheckCircle2, ArrowRight, Zap,
  Droplets, FlaskConical, Wind, Thermometer, Activity,
  ShieldAlert, PhoneCall, ChevronRight,
} from 'lucide-react';
import { cn } from '../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WaterCritical {
  param: string;         // e.g. "Dissolved O₂"
  emoji: string;
  value: number;
  unit: string;
  status: 'critical' | 'warning';
  caution: string;       // Short danger statement
  tip: string;           // Expert tip
  actions: string[];     // Ordered steps to take immediately
}

interface Props {
  criticals: WaterCritical[];
  pondName: string;
  isDark: boolean;
  onAcknowledge: (response: 'done' | 'noted') => void;
  /** Session key — prevents re-showing after farmer already acted */
  sessionKey?: string;
}

// ─── Helper: build caution objects from raw FormData ─────────────────────────

export interface RawWaterValues {
  ph?: number;
  do?: number;
  temperature?: number;
  salinity?: number;
  ammonia?: number;
  alkalinity?: number;
  turbidity?: number;
  mortality?: number;
}

export function buildCriticals(v: RawWaterValues): WaterCritical[] {
  const out: WaterCritical[] = [];

  if (v.do !== undefined && !isNaN(v.do)) {
    if (v.do < 3.0) {
      out.push({
        param: 'Dissolved O₂', emoji: '💧', value: v.do, unit: 'mg/L',
        status: 'critical',
        caution: `DO is ${v.do} mg/L — EMERGENCY level. Shrimp will suffocate within hours.`,
        tip: 'Keep DO above 5 mg/L at all times. Pre-dawn (3–6 AM) is highest risk window.',
        actions: [
          'Run ALL aerators immediately at full power',
          'STOP feeding — digestion consumes oxygen',
          'Apply emergency oxygen granules (3–5 kg/acre) if available',
          'Remove any dead shrimp from perimeter to prevent ammonia spike',
          'Log water again in 2 hours to confirm recovery',
        ],
      });
    } else if (v.do < 4.0) {
      out.push({
        param: 'Dissolved O₂', emoji: '💧', value: v.do, unit: 'mg/L',
        status: 'warning',
        caution: `DO is ${v.do} mg/L — below safe threshold of 4.0 mg/L.`,
        tip: 'Increase aeration and monitor every 2 hours. Shrimp stress begins below 4 mg/L.',
        actions: [
          'Increase aerator runtime — run all units now',
          'Reduce next feed slot by 30%',
          'Monitor DO again in 2 hours',
          'Check for surface-gasping shrimp as early mortality sign',
        ],
      });
    }
  }

  if (v.ph !== undefined && !isNaN(v.ph)) {
    if (v.ph < 7.0) {
      out.push({
        param: 'pH Level', emoji: '🧪', value: v.ph, unit: '',
        status: 'critical',
        caution: `pH is ${v.ph} — critically low. Causes gill damage and acidosis in shrimp.`,
        tip: 'Optimal pH is 7.5–8.5. Low pH inhibits oxygen uptake even when DO is adequate.',
        actions: [
          'Apply agricultural lime (Dolomite) 10 kg/acre immediately',
          'Stop all probiotic applications for 24 hours',
          'Increase aeration to stabilize pH naturally',
          'Recheck pH in 2–3 hours — target 7.5+',
          'Avoid feeding until pH reaches 7.5',
        ],
      });
    } else if (v.ph > 9.0) {
      out.push({
        param: 'pH Level', emoji: '🧪', value: v.ph, unit: '',
        status: 'critical',
        caution: `pH is ${v.ph} — critically high. Alkalosis and DO-absorption impairment.`,
        tip: 'High pH in late afternoon is often caused by algae photosynthesis. Partial water exchange is fastest remedy.',
        actions: [
          'Do a 15–20% water exchange with pre-adjusted water',
          'Stop heavy probiotic / algae bloom dosing',
          'Apply organic acid (citric acid / alum) if available',
          'Reduce noon–afternoon feed by 50%',
          'Recheck pH at dusk (6 PM)',
        ],
      });
    } else if (v.ph < 7.5) {
      out.push({
        param: 'pH Level', emoji: '🧪', value: v.ph, unit: '',
        status: 'warning',
        caution: `pH is ${v.ph} — slightly low. Monitor closely.`,
        tip: 'Apply dolomite 5 kg/acre and monitor morning vs evening readings.',
        actions: [
          'Apply Dolomite lime 5 kg/acre this evening',
          'Monitor morning and evening pH for the next 2 days',
          'Do not apply heavy probiotics until stable',
        ],
      });
    } else if (v.ph > 8.5) {
      out.push({
        param: 'pH Level', emoji: '🧪', value: v.ph, unit: '',
        status: 'warning',
        caution: `pH is ${v.ph} — slightly high. Risk of alkalosis.`,
        tip: 'Reduce afternoon feeding. Partial water exchange may be needed if pH climbs further.',
        actions: [
          'Reduce afternoon feed by 20%',
          '10% partial water exchange if pH > 8.8 by evening',
          'Monitor DO — high pH can reduce effective DO',
        ],
      });
    }
  }

  if (v.ammonia !== undefined && !isNaN(v.ammonia)) {
    if (v.ammonia > 0.1) {
      out.push({
        param: 'Ammonia (NH₃)', emoji: '⚗️', value: v.ammonia, unit: 'mg/L',
        status: 'critical',
        caution: `Ammonia is ${v.ammonia} mg/L — TOXIC level. Causes gill necrosis rapidly.`,
        tip: 'Ammonia spikes are usually caused by overfeeding or dead organic matter. Zeolite is the fastest absorber.',
        actions: [
          'STOP all feeding immediately',
          'Apply Zeolite 40–50 kg/acre broadcast across the pond now',
          'Do NOT apply any probiotics for 24 hours — they worsen it',
          'Remove visible dead shrimp and feed residue from trays',
          'Increase aeration to 100%',
          'Do 15% water exchange if ammonia doesn\'t drop in 4 hours',
        ],
      });
    } else if (v.ammonia > 0.05) {
      out.push({
        param: 'Ammonia (NH₃)', emoji: '⚗️', value: v.ammonia, unit: 'mg/L',
        status: 'warning',
        caution: `Ammonia is ${v.ammonia} mg/L — elevated, approaching danger range.`,
        tip: 'Apply Zeolite 10 kg/acre + water probiotic to convert ammonia biologically.',
        actions: [
          'Apply Zeolite 10 kg/acre this evening',
          'Apply water probiotic (250g/acre Bioclean Aqua Plus)',
          'Reduce next feed by 20%',
          'Check feed tray residue — leftover feed is likely the cause',
        ],
      });
    }
  }

  if (v.mortality !== undefined && !isNaN(v.mortality)) {
    if (v.mortality > 50) {
      out.push({
        param: 'Mortality', emoji: '⚠️', value: v.mortality, unit: 'shrimp',
        status: 'critical',
        caution: `${v.mortality} shrimp dead today — mass mortality event. Investigate immediately.`,
        tip: 'Mass mortality is usually caused by DO crash, disease, or toxic water. Identify cause before treating.',
        actions: [
          'Check DO immediately — DO crash is #1 cause of mass mortality',
          'Check pH and ammonia — toxic water kills fast',
          'Inspect dead shrimp for white spots (WSSV), red gills (Vibrio), or body lesions',
          'Contact your technical consultant / aquaculture extension officer NOW',
          'Do not harvest or sell until disease is ruled out',
          'Increase all aeration to 100%',
        ],
      });
    } else if (v.mortality > 10) {
      out.push({
        param: 'Mortality', emoji: '⚠️', value: v.mortality, unit: 'shrimp',
        status: 'warning',
        caution: `${v.mortality} shrimp dead today — elevated mortality. Investigate disease signs.`,
        tip: 'More than 10 dead per day should be taken seriously, especially in DOC 20–60 range.',
        actions: [
          'Inspect dead shrimp for disease signs (white spots, red legs, gill color)',
          'Check DO and pH — rule out water quality cause first',
          'Run disease detection scan if symptoms present',
          'Consult your medicine schedule — apply immunity booster',
        ],
      });
    }
  }

  if (v.salinity !== undefined && !isNaN(v.salinity)) {
    if (v.salinity < 5 || v.salinity > 30) {
      out.push({
        param: 'Salinity', emoji: '🌊', value: v.salinity, unit: 'ppt',
        status: 'critical',
        caution: `Salinity is ${v.salinity} ppt — extreme. Causes osmotic shock and rapid mortality.`,
        tip: 'Vannamei optimal range is 10–20 ppt. Sudden drops from heavy rain are the most common cause.',
        actions: [
          'Do controlled water exchange with pre-salinity-adjusted water',
          'If from rain: open overflow gates slowly — no sudden changes',
          'Apply electrolyte / mineral mix (15–20 kg/acre) to restore ion balance',
          'Reduce feed by 50% until salinity stabilises',
          'Monitor shrimp for surface gasping (stress sign)',
        ],
      });
    }
  }

  if (v.temperature !== undefined && !isNaN(v.temperature)) {
    if (v.temperature > 34) {
      out.push({
        param: 'Water Temp', emoji: '🌡️', value: v.temperature, unit: '°C',
        status: 'critical',
        caution: `Temperature is ${v.temperature}°C — dangerously high. Shrimp stop feeding and mortality risk rises sharply.`,
        tip: 'Above 32°C shrimp metabolism crashes. Above 34°C causes direct mortality.',
        actions: [
          'Skip all daytime feeding until temperature drops below 30°C',
          'Apply Vitamin C anti-stress tonic in water (250g/acre)',
          'Run all aerators — moving water surface cools the pond',
          'Apply cool deep-well water exchange if available',
          'Reduce stocking density if temperature stays above 32°C for more than 2 days',
        ],
      });
    } else if (v.temperature < 22) {
      out.push({
        param: 'Water Temp', emoji: '🌡️', value: v.temperature, unit: '°C',
        status: 'warning',
        caution: `Temperature is ${v.temperature}°C — too cold. Shrimp immune system is suppressed.`,
        tip: 'Below 22°C shrimp stop feeding and disease resistance drops sharply.',
        actions: [
          'Reduce feed by 40% — shrimp cannot digest in cold water',
          'Run aeration to keep surface water moving (helps retain warmth)',
          'Apply immunity booster if DOC > 20',
          'Monitor for disease — cold stress opens disease window',
        ],
      });
    }
  }

  // Sort: critical first
  return out.sort((a, b) => (a.status === 'critical' ? -1 : 1));
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CriticalWaterAlert: React.FC<Props> = ({
  criticals, pondName, isDark, onAcknowledge, sessionKey,
}) => {
  const [step, setStep] = useState<'alert' | 'actions' | 'confirm'>('alert');
  const [checkedActions, setCheckedActions] = useState<Set<string>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);

  const hasCritical = criticals.some(c => c.status === 'critical');
  const current = criticals[currentIdx];
  const allActionsChecked = current
    ? current.actions.every((_, i) => checkedActions.has(`${currentIdx}-${i}`))
    : true;

  const toggleAction = (key: string) => {
    setCheckedActions(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleFinalAck = (type: 'done' | 'noted') => {
    if (sessionKey) sessionStorage.setItem(sessionKey, type);
    onAcknowledge(type);
  };

  if (criticals.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex flex-col"
      style={{ background: hasCritical ? 'rgba(10,0,0,0.96)' : 'rgba(10,8,0,0.96)' }}
    >
      {/* Animated danger background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {hasCritical && (
          <>
            <motion.div
              animate={{ opacity: [0.05, 0.12, 0.05] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="absolute inset-0 bg-red-600"
            />
            <div className="absolute top-[-20%] left-[10%] w-[80%] h-[50%] bg-red-700/20 blur-[120px] rounded-full" />
          </>
        )}
        {!hasCritical && (
          <div className="absolute top-[-20%] left-[10%] w-[80%] h-[50%] bg-amber-700/20 blur-[120px] rounded-full" />
        )}
      </div>

      {/* ── ALERT STEP ── */}
      <AnimatePresence mode="wait">
        {step === 'alert' && (
          <motion.div
            key="alert"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col h-full overflow-y-auto"
          >
            {/* Header */}
            <div className={cn(
              'flex-shrink-0 px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 border-b',
              hasCritical ? 'border-red-500/30' : 'border-amber-500/30',
            )}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0',
                      hasCritical ? 'bg-red-500/20 border border-red-500/40' : 'bg-amber-500/20 border border-amber-500/40',
                    )}
                  >
                    <ShieldAlert size={24} className={hasCritical ? 'text-red-400' : 'text-amber-400'} />
                  </motion.div>
                  <div>
                    <p className={cn(
                      'text-[8px] font-black uppercase tracking-[0.3em] mb-0.5',
                      hasCritical ? 'text-red-400' : 'text-amber-400',
                    )}>
                      {hasCritical ? '🚨 Emergency Water Alert' : '⚠️ Water Quality Warning'}
                    </p>
                    <h1 className="text-white text-xl font-black tracking-tighter leading-tight">
                      {pondName}
                    </h1>
                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mt-0.5">
                      {criticals.length} parameter{criticals.length > 1 ? 's' : ''} need immediate attention
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Critical parameters list */}
            <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
              {criticals.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={cn(
                    'rounded-2xl border overflow-hidden',
                    c.status === 'critical'
                      ? 'border-red-500/40 bg-red-500/8'
                      : 'border-amber-500/40 bg-amber-500/8',
                  )}
                >
                  {/* Parameter header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                    <span className="text-2xl leading-none">{c.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-black text-sm tracking-tight">{c.param}</p>
                        <span className={cn(
                          'text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full',
                          c.status === 'critical'
                            ? 'bg-red-500 text-white'
                            : 'bg-amber-500 text-white',
                        )}>
                          {c.status === 'critical' ? 'CRITICAL' : 'WARNING'}
                        </span>
                      </div>
                      <p className={cn(
                        'text-2xl font-black tracking-tighter leading-none mt-0.5',
                        c.status === 'critical' ? 'text-red-400' : 'text-amber-400',
                      )}>
                        {c.value}<span className="text-sm text-white/30 ml-0.5">{c.unit}</span>
                      </p>
                    </div>
                  </div>

                  {/* Caution */}
                  <div className="px-4 py-2.5 border-b border-white/5">
                    <p className={cn(
                      'text-[9px] font-black leading-relaxed',
                      c.status === 'critical' ? 'text-red-300' : 'text-amber-300',
                    )}>
                      ❗ {c.caution}
                    </p>
                  </div>

                  {/* Tip */}
                  <div className="px-4 py-2.5">
                    <p className="text-[8px] font-medium text-white/40 leading-relaxed">
                      💡 {c.tip}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Expert helpline nudge */}
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3">
                <PhoneCall size={16} className="text-white/30 flex-shrink-0" />
                <p className="text-[8px] font-medium text-white/30 leading-relaxed">
                  For emergencies contact your local aquaculture technical officer or the MPEDA helpline.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 border-t border-white/10 space-y-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep('actions')}
                className={cn(
                  'w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] text-white flex items-center justify-center gap-2',
                  hasCritical
                    ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-900/40'
                    : 'bg-gradient-to-r from-amber-600 to-amber-500 shadow-lg shadow-amber-900/30',
                )}
              >
                <Zap size={14} /> View Emergency Actions <ArrowRight size={14} />
              </motion.button>
              <button
                onClick={() => handleFinalAck('noted')}
                className="w-full py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/30 border border-white/8"
              >
                I know — skip for now
              </button>
            </div>
          </motion.div>
        )}

        {/* ── ACTIONS STEP ── */}
        {step === 'actions' && current && (
          <motion.div
            key="actions"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 border-b border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => setStep('alert')}
                  className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center text-white/40"
                >
                  ←
                </button>
                <div>
                  <p className="text-white/40 text-[8px] font-black uppercase tracking-widest">
                    Action Plan ({currentIdx + 1} / {criticals.length})
                  </p>
                  <p className="text-white font-black text-sm tracking-tight">{current.emoji} {current.param}</p>
                </div>
              </div>

              {/* Progress dots */}
              {criticals.length > 1 && (
                <div className="flex gap-1.5">
                  {criticals.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIdx(i)}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i === currentIdx
                          ? (criticals[i].status === 'critical' ? 'w-6 bg-red-500' : 'w-6 bg-amber-500')
                          : 'w-1.5 bg-white/15',
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Caution recap */}
            <div className={cn(
              'mx-4 mt-3 rounded-xl px-3 py-2.5 border',
              current.status === 'critical'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-amber-500/10 border-amber-500/30',
            )}>
              <p className={cn(
                'text-[8px] font-black leading-relaxed',
                current.status === 'critical' ? 'text-red-300' : 'text-amber-300',
              )}>
                ❗ {current.caution}
              </p>
            </div>

            {/* Action checklist */}
            <div className="flex-1 px-4 py-3 space-y-2 overflow-y-auto">
              <p className="text-white/30 text-[7px] font-black uppercase tracking-widest px-1 mb-3">
                Do these steps in order:
              </p>
              {current.actions.map((action, ai) => {
                const key = `${currentIdx}-${ai}`;
                const done = checkedActions.has(key);
                return (
                  <motion.button
                    key={ai}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleAction(key)}
                    className={cn(
                      'w-full rounded-2xl px-4 py-3 border flex items-start gap-3 text-left transition-all',
                      done
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-white/5 border-white/10',
                    )}
                  >
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                      done ? 'bg-emerald-500' : 'bg-white/10 border border-white/20',
                    )}>
                      {done
                        ? <CheckCircle2 size={14} className="text-white" />
                        : <span className="text-[9px] font-black text-white/40">{ai + 1}</span>
                      }
                    </div>
                    <p className={cn(
                      'text-[10px] font-bold leading-relaxed flex-1',
                      done ? 'text-emerald-400 line-through opacity-60' : 'text-white/80',
                    )}>
                      {action}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex-shrink-0 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 border-t border-white/10 space-y-2">
              {currentIdx < criticals.length - 1 ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setCurrentIdx(i => i + 1)}
                  className="w-full py-4 rounded-2xl bg-white/10 border border-white/15 font-black text-[9px] uppercase tracking-[0.2em] text-white flex items-center justify-center gap-2"
                >
                  Next Issue <ChevronRight size={14} />
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStep('confirm')}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 font-black text-[9px] uppercase tracking-[0.2em] text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
                >
                  <CheckCircle2 size={14} /> I've Reviewed All Actions
                </motion.button>
              )}
              <button
                onClick={() => handleFinalAck('noted')}
                className="w-full py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/25"
              >
                Skip — I'll handle it manually
              </button>
            </div>
          </motion.div>
        )}

        {/* ── CONFIRM STEP ── */}
        {step === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col h-full items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 150, delay: 0.1 }}
              className="w-24 h-24 bg-emerald-500/15 rounded-[2rem] flex items-center justify-center border border-emerald-500/30 mb-6"
            >
              <CheckCircle2 size={44} className="text-emerald-400" />
            </motion.div>

            <h2 className="text-white text-2xl font-black tracking-tighter text-center mb-2">
              Good — actions noted.
            </h2>
            <p className="text-white/40 text-[9px] font-medium text-center leading-relaxed mb-10">
              Your pond data shows these critical readings. Continue monitoring and log the next water reading in 2 hours to confirm recovery.
            </p>

            <div className="w-full space-y-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handleFinalAck('done')}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} /> I've done the actions — back to dashboard
              </motion.button>

              <button
                onClick={() => handleFinalAck('noted')}
                className="w-full py-3 rounded-xl border border-white/10 text-[8px] font-black uppercase tracking-widest text-white/30"
              >
                I'll act soon — continue for now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Dashboard Inline Banner (non-modal, sticky critical banner) ──────────────

interface BannerProps {
  criticals: WaterCritical[];
  pondName: string;
  isDark: boolean;
  onExpand: () => void;
  onAcknowledge: () => void;
}

export const CriticalWaterBanner: React.FC<BannerProps> = ({
  criticals, pondName, isDark, onExpand, onAcknowledge,
}) => {
  if (criticals.length === 0) return null;
  const hasCritical = criticals.some(c => c.status === 'critical');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      className="overflow-hidden"
    >
      <div
        className={cn(
          'rounded-2xl border overflow-hidden',
          hasCritical
            ? isDark ? 'bg-red-500/10 border-red-500/40' : 'bg-red-50 border-red-300'
            : isDark ? 'bg-amber-500/10 border-amber-500/40' : 'bg-amber-50 border-amber-300',
        )}
      >
        {/* Pulsing danger stripe */}
        {hasCritical && (
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="h-1 w-full bg-gradient-to-r from-red-500 via-red-400 to-red-600"
          />
        )}
        {!hasCritical && (
          <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500" />
        )}

        <div className="px-4 py-3 flex items-start gap-3">
          <motion.div
            animate={hasCritical ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
              hasCritical
                ? isDark ? 'bg-red-500/20' : 'bg-red-100'
                : isDark ? 'bg-amber-500/20' : 'bg-amber-100',
            )}
          >
            <AlertTriangle size={16} className={hasCritical ? 'text-red-500' : 'text-amber-500'} />
          </motion.div>

          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-[9px] font-black uppercase tracking-widest mb-0.5',
              hasCritical
                ? isDark ? 'text-red-400' : 'text-red-700'
                : isDark ? 'text-amber-400' : 'text-amber-700',
            )}>
              {hasCritical ? '🚨 Critical Water Alert' : '⚠️ Water Quality Warning'} · {pondName}
            </p>
            <p className={cn(
              'text-[9px] font-medium leading-snug',
              isDark ? 'text-white/60' : 'text-slate-700',
            )}>
              {criticals[0].caution}
              {criticals.length > 1 && ` (+${criticals.length - 1} more)`}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={onExpand}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-[7px] font-black uppercase tracking-widest text-white shadow-sm',
                  hasCritical ? 'bg-red-500' : 'bg-amber-500',
                )}
              >
                View Actions →
              </button>
              <button
                onClick={onAcknowledge}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-[7px] font-black uppercase tracking-widest border',
                  isDark ? 'border-white/15 text-white/30' : 'border-slate-300 text-slate-500',
                )}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
