import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { Battery, X, ChevronRight, Bell, Zap, Shield } from 'lucide-react';
import { cn } from '../utils/cn';

interface Props {
  onDismiss: () => void;
  isDark?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// BatteryOptimizationPrompt
//
// WHAT: Tells the farmer to whitelist AquaGrow from battery optimization.
// WHY:  On Xiaomi (MIUI), Samsung (One UI), OnePlus (OxygenOS) — the OS kills
//       background processes aggressively. FCM messages are dropped when the
//       app is not whitelisted. This is the #1 reason push notifications stop
//       working on Android.
// HOW:  We show this once after notification permission is granted. The farmer
//       taps "Fix It" which deep-links directly to Android battery settings.
// ─────────────────────────────────────────────────────────────────────────────
export const BatteryOptimizationPrompt: React.FC<Props> = ({ onDismiss, isDark }) => {
  const [step, setStep] = useState<'prompt' | 'guide'>('prompt');

  // Only relevant on native Android — don't show on web
  if (!Capacitor.isNativePlatform()) return null;

  const STEPS = [
    { icon: '⚙️', text: 'Open device Settings' },
    { icon: '📱', text: 'Tap Apps → AquaGrow' },
    { icon: '🔋', text: 'Tap Battery' },
    { icon: '✅', text: 'Select "Unrestricted"' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[200] rounded-t-[2.5rem] border-t shadow-2xl px-5 pt-6 pb-10',
          isDark ? 'bg-[#0D1A13] border-white/10' : 'bg-white border-slate-200'
        )}
      >
        {/* Drag handle */}
        <div className={cn('w-10 h-1 rounded-full mx-auto mb-5', isDark ? 'bg-white/10' : 'bg-slate-200')} />

        {/* Close */}
        <button
          onClick={onDismiss}
          className={cn('absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center', isDark ? 'bg-white/10 text-white/50' : 'bg-slate-100 text-slate-400')}
        >
          <X size={14} />
        </button>

        {step === 'prompt' ? (
          <div className="space-y-5">
            {/* Icon + Header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Battery size={26} className="text-amber-500" />
              </div>
              <div>
                <h3 className={cn('text-[15px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                  Enable Reliable Notifications
                </h3>
                <p className={cn('text-[11px] mt-0.5 leading-relaxed', isDark ? 'text-white/50' : 'text-slate-500')}>
                  Your device's battery optimizer may block AquaGrow alerts when the screen is off.
                </p>
              </div>
            </div>

            {/* What you'll miss */}
            <div className={cn('rounded-2xl p-4 border space-y-2.5', isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-100')}>
              <p className="text-[9px] font-black uppercase tracking-widest text-red-500">Without this setting, you'll miss:</p>
              {[
                { icon: '🦐', text: 'Critical WSSV & disease alerts (DOC 31–45)' },
                { icon: '🌑', text: 'Amavasya molt risk warnings at night' },
                { icon: '💰', text: 'Harvest payment & buyer notifications' },
                { icon: '💨', text: '9 PM aerator & DO level warnings' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-sm">{item.icon}</span>
                  <p className={cn('text-[10px] font-semibold', isDark ? 'text-white/60' : 'text-slate-600')}>{item.text}</p>
                </div>
              ))}
            </div>

            {/* What you get */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Bell,   label: 'Screen-off Alerts',  color: '#10B981' },
                { icon: Zap,    label: 'Instant Delivery',   color: '#3B82F6' },
                { icon: Shield, label: 'No Missed Alerts',   color: '#8B5CF6' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className={cn('p-3 rounded-2xl border text-center', isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-100')}>
                    <Icon size={16} className="mx-auto mb-1.5" style={{ color: item.color }} />
                    <p className="text-[8px] font-black text-ink/60 uppercase tracking-wide leading-tight">{item.label}</p>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep('guide')}
              className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-[13px] tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
            >
              🔋 Fix Battery Settings
              <ChevronRight size={16} />
            </button>
            <button
              onClick={onDismiss}
              className={cn('w-full py-3 rounded-2xl text-[11px] font-bold', isDark ? 'text-white/30' : 'text-slate-400')}
            >
              Skip for now (not recommended)
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h3 className={cn('text-[15px] font-black tracking-tight mb-1', isDark ? 'text-white' : 'text-slate-900')}>
                Follow These Steps
              </h3>
              <p className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-slate-400')}>
                Takes less than 30 seconds
              </p>
            </div>

            {/* Step list */}
            <div className="space-y-3">
              {STEPS.map((s, i) => (
                <div key={i} className={cn('flex items-center gap-4 p-4 rounded-2xl border', isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-100')}>
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-black flex-shrink-0', isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700')}>
                    {i + 1}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-base">{s.icon}</span>
                    <p className={cn('text-[12px] font-bold', isDark ? 'text-white' : 'text-slate-800')}>{s.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Manufacturer note */}
            <div className={cn('rounded-2xl p-3 border', isDark ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100')}>
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 mb-1">Xiaomi / Redmi users</p>
              <p className={cn('text-[10px] leading-relaxed', isDark ? 'text-white/50' : 'text-slate-600')}>
                Go to <strong>Settings → Battery & Performance → App Battery Saver → AquaGrow → No Restrictions</strong>
              </p>
            </div>

            <button
              onClick={onDismiss}
              className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-[13px] tracking-tight shadow-lg shadow-emerald-500/30"
            >
              ✅ Done — I've Set It
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
