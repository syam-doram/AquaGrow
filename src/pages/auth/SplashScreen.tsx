/**
 * SplashScreen — AquaGrow Premium
 * ─────────────────────────────────────────────────────────────────────────────
 * Extremely premium initial app loading experience.
 * Features deep mesh gradients, ultra-smooth spring animations, glowing
 * glassmorphism, and the new Purple Grid Lightning Bolt core branding.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type Phase = 'logo' | 'text' | 'progress' | 'done';

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>('logo');

  // Deterministic floating micro-particles
  const particles = useMemo(() =>
    Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      size: (i % 3 === 0) ? 4 : (i % 2 === 0) ? 6 : 3,
      left: 5 + ((i * 17) % 90),
      dur: 6 + ((i * 5) % 6),
      delay: ((i * 3) % 4),
      opacity: 0.1 + ((i * 7) % 30) / 100,
    })), []);

  const statusMessages = [
    'Initializing Neural Engine…',
    'Syncing IoT Mesh Network…',
    'Loading AquaGrow Protocol…',
    'Finalizing Security Handshake…',
    'Farm Intelligence Online.',
  ];
  const msgIndex = progress < 25 ? 0 : progress < 50 ? 1 : progress < 75 ? 2 : progress < 90 ? 3 : 4;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 600);
    const t2 = setTimeout(() => setPhase('progress'), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase !== 'progress') return;
    let v = 0;
    const id = setInterval(() => {
      // Non-linear premium loading speed
      const speed = v < 30 ? 1.5 : v < 70 ? 2.5 : v < 92 ? 0.8 : 3.0;
      v = Math.min(v + speed, 100);
      setProgress(v);
      if (v >= 100) {
        clearInterval(id);
        setTimeout(() => {
          setPhase('done');
          setTimeout(onComplete, 700);
        }, 400);
      }
    }, 25);
    return () => clearInterval(id);
  }, [phase, onComplete]);

  const isDone = phase === 'done';

  // Branding Colors: High-End Purple & Emerald Sync
  const CORE_PURPLE = '#8B5CF6';
  const CORE_EMERALD = '#10B981';

  return (
    <motion.div
      className="h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden relative bg-[#030305]"
      animate={isDone ? { opacity: 0, scale: 1.05 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── PREMIUM MESH BACKGROUND ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Soft center illumination */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8B5CF6]/[0.03] rounded-full blur-[100px]" />
        
        {/* Dynamic sweeping glows */}
        <motion.div 
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[50%] bg-[#8B5CF6]/10 rounded-full blur-[90px]"
          animate={{ x: [0, 30, 0], y: [0, 40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[60%] bg-[#10B981]/10 rounded-full blur-[100px]"
          animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Abstract Grid Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)'
          }}
        />
      </div>

      {/* ── FLOATING PARTICLES ── */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size, height: p.size,
              left: `${p.left}%`, bottom: '-5%',
              opacity: p.opacity,
              background: p.id % 2 === 0 ? CORE_PURPLE : CORE_EMERALD,
              boxShadow: `0 0 12px ${p.id % 2 === 0 ? CORE_PURPLE : CORE_EMERALD}`,
            }}
            animate={{ 
              y: [0, -800], 
              x: [0, (p.id % 2 === 0 ? 30 : -30), 0], 
              opacity: [0, p.opacity * 2, 0] 
            }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeOut' }}
          />
        ))}
      </div>

      {/* ── MAIN CENTER CONTENT ── */}
      <motion.div
        className="relative z-20 flex flex-col items-center px-6 text-center w-full max-w-[340px]"
        animate={isDone ? { y: -20, filter: 'blur(10px)' } : { y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.5, ease: 'easeIn' }}
      >
        {/* ── GLASSMORPHIC LOGO TILE ── */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={phase !== 'logo' ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.8, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 22, stiffness: 200 }}
        >
          {/* Intense backlight aura */}
          <div className="absolute inset-0 rounded-[2.5rem] blur-2xl bg-gradient-to-tr from-[#8B5CF6]/50 to-[#10B981]/40 opacity-50 scale-110" />

          {/* Premium Frost Tile */}
          <div 
            className="relative w-36 h-36 rounded-[2.5rem] flex items-center justify-center overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -1px 1px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            {/* Spinning edge indicator */}
            <motion.div 
              className="absolute w-[200%] h-[200%] opacity-40 z-0"
              style={{
                background: `conic-gradient(from 0deg, transparent 60%, ${CORE_PURPLE} 80%, ${CORE_EMERALD} 100%)`
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            {/* Inner mask to block center of spin */}
            <div className="absolute inset-[2px] rounded-[2.4rem] bg-[#0A0A0F]" />

            {/* Emblem icon */}
            <span 
              className="text-6xl z-10 relative drop-shadow-[0_0_25px_rgba(139,92,246,0.6)]"
              style={{ paddingBottom: '4px' }}
            >
              ⚡
            </span>
          </div>
        </motion.div>

        {/* ── TYPOGRAPHY & BRANDING ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: phase !== 'logo' ? 1 : 0, y: phase !== 'logo' ? 0 : 15 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        >
          {/* Top Label */}
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-white/5 bg-white/[0.03] backdrop-blur-md">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">
              System Online
            </span>
          </div>

          <h1 className="text-white text-[2.75rem] font-bold tracking-tight leading-none mb-2"
              style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                textShadow: '0 4px 20px rgba(139,92,246,0.3)'
              }}>
            AquaGrow
          </h1>

          <p className="text-[10px] uppercase font-bold tracking-[0.4em] bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#10B981]">
            Elite Aquaculture
          </p>
        </motion.div>

        {/* ── PREMIUM FEATURE PILLS ── */}
        <motion.div
          className="mt-10 flex flex-col gap-2.5 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'progress' || phase === 'done' ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        >
          {[
            { tag: 'AI', text: 'Predictive Intelligence', color: CORE_PURPLE },
            { tag: 'IoT', text: 'Real-time Telemetry', color: CORE_EMERALD },
            { tag: 'Pro', text: 'Secure Enclave', color: '#3B82F6' }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={phase === 'progress' || phase === 'done' ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + (i * 0.1) }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-sm"
            >
              <div 
                className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest"
                style={{ background: `${item.color}20`, color: item.color }}
              >
                {item.tag}
              </div>
              <p className="text-[11px] font-medium text-white/70">{item.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── ULTRA-SMOOTH PROGRESS BAR ── */}
      <AnimatePresence>
        {(phase === 'progress' || phase === 'done') && (
          <motion.div
            className="absolute bottom-12 left-0 right-0 px-8 z-30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="relative h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden backdrop-blur-md mb-3 border border-white/[0.05]">
              {/* Animated Progress Fill */}
              <motion.div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${CORE_PURPLE}, ${CORE_EMERALD})`,
                  boxShadow: `0 0 14px ${CORE_PURPLE}80`,
                }}
                transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
              />
              {/* Highlight sweep */}
              <motion.div
                className="absolute top-0 bottom-0 w-20"
                style={{
                  left: `${Math.max(0, progress - 15)}%`,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
                }}
              />
            </div>
            
            <div className="flex items-end justify-between px-1">
              <div className="overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={msgIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="text-[9px] font-semibold tracking-wider text-white/40"
                  >
                    {statusMessages[msgIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
              <p className="text-[10px] font-bold tracking-widest text-[#10B981] font-mono">
                {Math.round(progress)}%
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.p
        className="absolute bottom-4 text-white/20 text-[8px] font-bold tracking-[0.25em] z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'progress' || phase === 'done' ? 1 : 0 }}
        transition={{ delay: 0.8 }}
      >
        AQUAGROW OS v3.0
      </motion.p>
    </motion.div>
  );
};
