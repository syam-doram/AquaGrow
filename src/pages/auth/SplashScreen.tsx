/**
 * SplashScreen — AquaGrow Premium
 * ─────────────────────────────────────────────────────────────────────────────
 * Icon style exactly matches onboarding slides:
 *  • Dark #0D0D0D background with per-slide ambient glow
 *  • w-32 h-32 rounded-[2.5rem] gradient card with inner shimmer
 *  • Big emoji centred inside with drop-shadow
 *  • Blur-3xl glow blob underneath card
 *  • Progress bar + status text at bottom
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type Phase = 'logo' | 'text' | 'progress' | 'done';

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>('logo');

  // Deterministic floating particles (no random → no hydration mismatch)
  const particles = useMemo(() =>
    Array.from({ length: 26 }).map((_, i) => ({
      id: i,
      size:  (((i * 7 + 11) % 12) + 3),
      left:  ((i * 39) % 100),
      dur:   (((i * 13) % 8) + 5),
      delay: ((i * 17) % 7),
      opacity: 0.06 + ((i * 3) % 22) / 100,
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
    const t1 = setTimeout(() => setPhase('text'),     450);
    const t2 = setTimeout(() => setPhase('progress'), 1050);
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
          setTimeout(onComplete, 650);
        }, 350);
      }
    }, 30);
    return () => clearInterval(id);
  }, [phase, onComplete]);

  const isDone = phase === 'done';

  // Brand gradient — matches first onboarding slide style but with emerald (brand colour)
  // Brand gradient — matches premium sunset energy-leaf theme
  const GRADIENT = 'from-[#F97316] to-[#D946EF]';
  const GLOW_COLOR  = '#D946EF';
  const BG_GLOW = 'radial-gradient(ellipse 90% 70% at 50% 15%, rgba(217,70,239,0.14) 0%, rgba(249,115,22,0.04) 50%, transparent 80%)';

  return (
    <motion.div
      className="h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden relative bg-[#0D0D0D]"
      animate={isDone ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* ── Ambient glow — same as onboarding ── */}
      {/* ── Premium Ambient depth glow ── */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: BG_GLOW }} />

      {/* ── Subtle dot grid — same as onboarding ── */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── Rotating concentric rings (subtle depth) ── */}
      {[480, 350, 230].map((size, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{ width: size, height: size, borderColor: `rgba(5,150,105,${0.05 + i * 0.03})` }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 38 - i * 8, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      {/* ── Floating particles ── */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size, height: p.size,
              left: `${p.left}%`, bottom: '-4%',
              opacity: p.opacity,
              background: 'radial-gradient(circle, rgba(52,211,153,0.85), rgba(14,165,233,0.3))',
            }}
            animate={{ y: [0, -1200], x: [0, 20, -10, 0], opacity: [p.opacity, p.opacity * 1.8, 0] }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeIn' }}
          />
        ))}
      </div>

      {/* ── MAIN CONTENT ── */}
      <motion.div
        className="relative z-20 flex flex-col items-center px-8 text-center"
        animate={isDone ? { opacity: 0, scale: 1.06, filter: 'blur(14px)' } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── Icon card — EXACT onboarding style ── */}
        <motion.div
          className="relative mb-7"
          initial={{ scale: 0.75, opacity: 0, y: 24 }}
          animate={phase !== 'logo'
            ? { scale: 1, opacity: 1, y: 0 }
            : { scale: 0.75, opacity: 0, y: 24 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Glow blob — exact onboarding pattern */}
          {/* 3D Volume glow blob */}
          <div className={`absolute -inset-10 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${GRADIENT}`} />

          {/* High-end Glassmorphic Card (Sunset Tint) */}
          <div
            className={`relative w-36 h-36 rounded-[2.8rem] bg-pink-500/5 backdrop-blur-md flex items-center justify-center overflow-hidden`}
            style={{
              background: `linear-gradient(145deg, rgba(249,115,22,0.1) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.8) 100%)`,
              border: '1.5px solid rgba(217,70,239,0.25)',
              boxShadow: `0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}
          >
            {/* Inner premium shimmer (Sunset) */}
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, rgba(217,70,239,0.1) 0%, transparent 50%, rgba(249,115,22,0.05) 100%)' }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3.5, repeat: Infinity }}
            />

            {/* Scanning beam */}
            <motion.div
              className="absolute left-0 right-0 h-px z-20"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(217,70,239,0.6), transparent)' }}
              animate={{ top: ['-10%', '110%'] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
            />

            {/* Main brand icon */}
            <span
              className="text-6xl z-10 relative select-none flex gap-2"
              style={{ filter: `drop-shadow(0 8px 24px rgba(0,0,0,0.6))` }}
            >
              ⚡🌿
            </span>
          </div>
        </motion.div>

        {/* ── Brand name ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: phase !== 'logo' ? 1 : 0, y: phase !== 'logo' ? 0 : 12 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Badge pill — same as onboarding */}
          <div
            className="inline-flex mx-auto mb-4 px-4 py-1.5 rounded-full border"
            style={{ backgroundColor: `${GLOW_COLOR}18`, borderColor: `${GLOW_COLOR}40` }}
          >
            <span className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: GLOW_COLOR }}>
              Smart Farming
            </span>
          </div>

          <h1
            className="text-white text-[2.8rem] font-black tracking-tight leading-tight mb-1"
            style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic', textShadow: `0 0 50px ${GLOW_COLOR}40` }}
          >
            AquaGrow
          </h1>

          <div className="flex items-center justify-center gap-3 mt-1">
            <div className="h-px w-7 bg-gradient-to-r from-transparent to-emerald-500/40" />
            <p className="text-[8.5px] font-black uppercase tracking-[0.5em] text-emerald-400/55">
              Elite Aquaculture Platform
            </p>
            <div className="h-px w-7 bg-gradient-to-l from-transparent to-emerald-500/40" />
          </div>
        </motion.div>

        {/* ── Feature pills — matching onboarding feature strip style ── */}
        <motion.div
          className="mt-8 w-full max-w-[300px] space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: phase === 'progress' || phase === 'done' ? 1 : 0, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
        >
          {[
            { emoji: '💧', label: 'Live Water Monitor' },
            { emoji: '🤖', label: 'AI Disease Detection' },
            { emoji: '📡', label: 'IoT Command Center' },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-left"
              style={{ background: `${GLOW_COLOR}10`, border: `1px solid ${GLOW_COLOR}22` }}
            >
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                style={{ background: `${GLOW_COLOR}22` }}
              >
                {f.emoji}
              </div>
              <p className="text-[10px] font-bold text-white/60 leading-tight">{f.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── BOTTOM PROGRESS BAR ── */}
      <AnimatePresence>
        {(phase === 'progress' || phase === 'done') && (
          <motion.div
            className="absolute bottom-14 left-0 right-0 px-10 z-20"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div
              className="relative h-[3px] w-full rounded-full overflow-hidden mb-4"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <motion.div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, #059669, #34D399, #0EA5E9)`,
                  boxShadow: `0 0 10px rgba(52,211,153,0.55)`,
                }}
                transition={{ ease: 'easeOut' }}
              />
              <motion.div
                className="absolute top-0 h-full w-14 rounded-full"
                style={{
                  left: `${Math.max(0, progress - 11)}%`,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <AnimatePresence mode="wait">
                <motion.p
                  key={msgIndex}
                  initial={{ opacity: 0, x: -7 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 7 }}
                  transition={{ duration: 0.2 }}
                  className="text-[9px] font-black uppercase tracking-[0.25em] text-white/25"
                >
                  {statusMessages[msgIndex]}
                </motion.p>
              </AnimatePresence>
              <p className="text-[9px] font-black tracking-widest" style={{ color: GLOW_COLOR }}>
                {Math.round(progress)}%
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Version watermark */}
      <motion.p
        className="absolute bottom-4 text-white/10 text-[7px] font-black uppercase tracking-[0.3em] z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'progress' || phase === 'done' ? 1 : 0 }}
        transition={{ delay: 0.8 }}
      >
        v2.0 · aquagrow.io
      </motion.p>
    </motion.div>
  );
};
