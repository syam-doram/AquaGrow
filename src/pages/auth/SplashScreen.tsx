/**
 * SplashScreen — AquaGrow Premium
 * ─────────────────────────────────────────────────────────────────────────────
 * Fully rewritten:
 *  • Deep teal–to–midnight gradient with layered animated water rings
 *  • Logo shrimp + waves animating in with a 3D flip + glow pulse
 *  • Real-time status text cycling through what the app is loading
 *  • Smooth progress bar with eased speed curve
 *  • Fade-out to white on complete (matches onboarding background)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type Phase = 'logo' | 'text' | 'progress' | 'done';

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>('logo');

  // Deterministic particles (useMemo → no hydration mismatch)
  const particles = useMemo(() =>
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      size: (((i * 7 + 13) % 14) + 3),        // 3–16 px
      left: ((i * 37) % 100),
      dur:  (((i * 11) % 7) + 5),              // 5–11 s
      delay: ((i * 17) % 6),
      opacity: 0.08 + ((i * 3) % 25) / 100,   // 0.08–0.33
      drift: (((i * 19) % 80) - 40),           // −40 to +40 px
    })), []);

  const statusMessages = [
    'Connecting to AquaGrow Network…',
    'Loading Water Intelligence…',
    'Syncing Pond Data…',
    'Warming up AI Engine…',
    'All Systems Ready!',
  ];
  const msgIndex = progress < 20 ? 0 : progress < 45 ? 1 : progress < 65 ? 2 : progress < 90 ? 3 : 4;

  // Phase sequencing
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'),     500);
    const t2 = setTimeout(() => setPhase('progress'), 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Progress animation
  useEffect(() => {
    if (phase !== 'progress') return;
    let v = 0;
    const id = setInterval(() => {
      const speed = v < 25 ? 2.8 : v < 60 ? 1.0 : v < 85 ? 0.7 : 4.5;
      v = Math.min(v + speed, 100);
      setProgress(v);
      if (v >= 100) {
        clearInterval(id);
        setTimeout(() => {
          setPhase('done');
          setTimeout(onComplete, 800);
        }, 400);
      }
    }, 30);
    return () => clearInterval(id);
  }, [phase, onComplete]);

  const isDone = phase === 'done';

  return (
    <motion.div
      className="h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden relative"
      animate={isDone ? { backgroundColor: '#0D0D0D' } : { backgroundColor: '#011A12' }}
      transition={{ duration: 0.8 }}
    >
      {/* ── Deep gradient background ── */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 120% 100% at 50% -10%, #0D523C 0%, #011A12 55%, #000D08 100%)',
        }}
      />

      {/* ── Rotating orbital rings ── */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full border border-emerald-500/8"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-[380px] h-[380px] rounded-full border border-emerald-400/12"
        animate={{ rotate: -360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-[260px] h-[260px] rounded-full border border-emerald-300/8"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />

      {/* ── Floating particles ── */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              bottom: '-5%',
              opacity: p.opacity,
              background: `radial-gradient(circle, rgba(52,211,153,0.9), rgba(16,185,129,0.3))`,
            }}
            animate={{
              y: [0, -1100],
              x: [0, p.drift, 0],
              scale: [1, 1.6, 0.4],
              opacity: [p.opacity, p.opacity * 1.5, 0],
            }}
            transition={{
              duration: p.dur,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeIn',
            }}
          />
        ))}
      </div>

      {/* ── Large ambient glow behind logo ── */}
      <motion.div
        className="absolute w-72 h-72 rounded-full z-10"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── MAIN CONTENT ── */}
      <motion.div
        className="relative z-20 flex flex-col items-center px-8 text-center"
        animate={isDone
          ? { opacity: 0, scale: 1.08, filter: 'blur(16px)' }
          : { opacity: 1, scale: 1, filter: 'blur(0px)' }
        }
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── Logo Badge ── */}
        <motion.div
          className="relative mb-9"
          initial={{ rotateY: 90, opacity: 0, scale: 0.7 }}
          animate={phase !== 'logo'
            ? { rotateY: 0, opacity: 1, scale: 1 }
            : { rotateY: 90, opacity: 0, scale: 0.7 }
          }
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute -inset-6 rounded-[3rem] z-0"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2.8, repeat: Infinity }}
          />

          {/* Main badge */}
          <div
            className="w-36 h-36 rounded-[2.5rem] flex items-center justify-center relative z-10 overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #0D6B4A 0%, #064433 60%, #022B20 100%)',
              border: '1.5px solid rgba(52,211,153,0.25)',
              boxShadow: '0 0 0 1px rgba(52,211,153,0.08), 0 25px 80px rgba(16,185,129,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {/* Animated scan line */}
            <motion.div
              className="absolute left-0 right-0 h-px z-20"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.7), transparent)' }}
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            {/* Shrimp emoji — beautifully large */}
            <span
              className="text-6xl select-none z-10 relative"
              style={{ filter: 'drop-shadow(0 0 20px rgba(52,211,153,0.6))' }}
            >
              🦐
            </span>
          </div>
        </motion.div>

        {/* ── Brand Name ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: phase !== 'logo' ? 1 : 0, y: phase !== 'logo' ? 0 : 16 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1
            className="text-5xl font-black tracking-tighter text-white mb-2"
            style={{
              fontFamily: "'Georgia', serif",
              fontStyle: 'italic',
              textShadow: '0 0 60px rgba(52,211,153,0.35)',
            }}
          >
            AquaGrow
          </h1>
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-emerald-500/40" />
            <p className="text-emerald-400/60 text-[9px] font-black uppercase tracking-[0.5em]">
              Elite Aquaculture Platform
            </p>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-emerald-500/40" />
          </div>
        </motion.div>

        {/* ── Feature teaser pills ── */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mt-7 max-w-[280px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: phase === 'progress' || phase === 'done' ? 0.7 : 0, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {['🌊 Live Water Monitor', '🤖 AI Engine', '📡 IoT Control', '🌦️ Weather Alerts', '💰 Profit Analytics'].map((f, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(52,211,153,0.08)',
                border: '1px solid rgba(52,211,153,0.15)',
                color: 'rgba(52,211,153,0.7)',
              }}
            >
              {f}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>

      {/* ── BOTTOM PROGRESS ── */}
      <AnimatePresence>
        {(phase === 'progress' || phase === 'done') && (
          <motion.div
            className="absolute bottom-14 left-0 right-0 px-10 z-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Progress track */}
            <div
              className="relative h-[3px] w-full rounded-full overflow-hidden mb-4"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <motion.div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #059669, #34D399, #6EE7B7)',
                  boxShadow: '0 0 12px rgba(52,211,153,0.6)',
                }}
                transition={{ ease: 'easeOut' }}
              />
              {/* Shimmer on bar */}
              <motion.div
                className="absolute top-0 h-full w-16 rounded-full"
                style={{
                  left: `${Math.max(0, progress - 12)}%`,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                }}
              />
            </div>

            {/* Status text */}
            <div className="flex items-center justify-between">
              <AnimatePresence mode="wait">
                <motion.p
                  key={msgIndex}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.25 }}
                  className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30"
                >
                  {statusMessages[msgIndex]}
                </motion.p>
              </AnimatePresence>
              <p className="text-[9px] font-black tracking-widest text-emerald-400">
                {Math.round(progress)}%
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Version watermark ── */}
      <motion.p
        className="absolute bottom-4 text-white/10 text-[7px] font-black uppercase tracking-[0.3em] z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'progress' || phase === 'done' ? 1 : 0 }}
        transition={{ delay: 1 }}
      >
        v2.0 · aquagrow.io
      </motion.p>
    </motion.div>
  );
};
