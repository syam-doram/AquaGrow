/**
 * SplashScreen — AquaGrow Premium
 * ─────────────────────────────────────────────────────────────────────────────
 * Logo: Custom SVG water-drop + flow-lines mark (no shrimp, no emoji)
 * Design: Deep ocean gradient · animated concentric rings · rising droplets
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type Phase = 'logo' | 'text' | 'progress' | 'done';

// ─── SVG AquaGrow Logo Mark ───────────────────────────────────────────────────
// A stylised water-drop with three flowing lines inside
const AquaMarkSVG = () => (
  <svg viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="86">
    <defs>
      <linearGradient id="drop-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0" />
        <stop offset="40%" stopColor="#34D399" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#6EE7B7" stopOpacity="0" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    {/* Drop outline */}
    <path
      d="M40 4 C40 4 8 42 8 62 C8 80.4 22.4 92 40 92 C57.6 92 72 80.4 72 62 C72 42 40 4 40 4Z"
      fill="url(#drop-grad)"
      opacity="0.15"
    />
    <path
      d="M40 4 C40 4 8 42 8 62 C8 80.4 22.4 92 40 92 C57.6 92 72 80.4 72 62 C72 42 40 4 40 4Z"
      stroke="url(#drop-grad)"
      strokeWidth="1.8"
      fill="none"
      filter="url(#glow)"
    />

    {/* Three horizontal flow lines inside drop */}
    <line x1="20" y1="52" x2="60" y2="52" stroke="url(#line-grad)" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="22" y1="63" x2="58" y2="63" stroke="url(#line-grad)" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="25" y1="74" x2="55" y2="74" stroke="url(#line-grad)" strokeWidth="1.8" strokeLinecap="round" />

    {/* Center dot */}
    <circle cx="40" cy="36" r="3" fill="#34D399" opacity="0.6" />
  </svg>
);

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>('logo');

  // Deterministic floating drops
  const drops = useMemo(() =>
    Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      size: (((i * 5 + 8) % 10) + 4),       // 4–13px
      left: ((i * 41) % 100),
      dur:  (((i * 13) % 8) + 6),            // 6–13s
      delay: ((i * 19) % 8),
      opacity: 0.06 + ((i * 4) % 20) / 100,
    })), []);

  const statusMessages = [
    'Connecting to AquaGrow Network…',
    'Loading Water Intelligence…',
    'Syncing Pond Data…',
    'Warming up AI Engine…',
    'All Systems Ready!',
  ];
  const msgIndex = progress < 20 ? 0 : progress < 45 ? 1 : progress < 65 ? 2 : progress < 90 ? 3 : 4;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'),     480);
    const t2 = setTimeout(() => setPhase('progress'), 1050);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

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
          setTimeout(onComplete, 700);
        }, 350);
      }
    }, 30);
    return () => clearInterval(id);
  }, [phase, onComplete]);

  const isDone = phase === 'done';

  return (
    <motion.div
      className="h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden relative"
      animate={isDone ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.65 }}
    >
      {/* Deep ocean gradient */}
      <div className="absolute inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 130% 110% at 50% -5%, #0A3D2B 0%, #010F0A 55%, #000000 100%)',
      }} />

      {/* Rotating concentric rings */}
      {[520, 390, 265, 155].map((size, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: size, height: size,
            borderColor: `rgba(52,211,153,${0.04 + i * 0.03})`,
          }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 35 - i * 7, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      {/* Floating water drops */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {drops.map(d => (
          <motion.div
            key={d.id}
            className="absolute"
            style={{
              width: d.size, height: d.size * 1.3,
              left: `${d.left}%`,
              bottom: '-4%',
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              opacity: d.opacity,
              background: 'radial-gradient(circle at 40% 35%, rgba(110,231,183,0.9), rgba(16,185,129,0.4))',
            }}
            animate={{ y: [0, -1200], x: [0, 15, -10, 0], opacity: [d.opacity, d.opacity * 2, 0] }}
            transition={{ duration: d.dur, repeat: Infinity, delay: d.delay, ease: 'easeIn' }}
          />
        ))}
      </div>

      {/* Radial glow behind logo */}
      <motion.div
        className="absolute w-80 h-80 rounded-full z-10"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.16) 0%, transparent 68%)' }}
        animate={{ scale: [1, 1.22, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── MAIN CONTENT ── */}
      <motion.div
        className="relative z-20 flex flex-col items-center px-8 text-center"
        animate={isDone ? { opacity: 0, scale: 1.07, filter: 'blur(14px)' } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo badge */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={phase !== 'logo'
            ? { scale: 1, opacity: 1, y: 0 }
            : { scale: 0.5, opacity: 0, y: 20 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute -inset-8 rounded-full z-0"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.85, 0.4] }}
            transition={{ duration: 2.8, repeat: Infinity }}
          />

          {/* Badge card */}
          <div
            className="w-[120px] h-[120px] rounded-[2.2rem] flex items-center justify-center relative z-10 overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #0B5C40 0%, #053223 60%, #011C14 100%)',
              border: '1.5px solid rgba(52,211,153,0.22)',
              boxShadow: '0 0 0 1px rgba(52,211,153,0.06), 0 24px 70px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.07)',
            }}
          >
            {/* Scan line */}
            <motion.div
              className="absolute left-0 right-0 h-px z-20"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.6), transparent)' }}
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            />
            {/* SVG Logo mark */}
            <div style={{ filter: 'drop-shadow(0 0 18px rgba(52,211,153,0.55))' }}>
              <AquaMarkSVG />
            </div>
          </div>
        </motion.div>

        {/* Brand name */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: phase !== 'logo' ? 1 : 0, y: phase !== 'logo' ? 0 : 14 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1
            className="text-5xl font-black tracking-tighter text-white mb-1.5"
            style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic', textShadow: '0 0 55px rgba(52,211,153,0.3)' }}
          >
            AquaGrow
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-7 bg-gradient-to-r from-transparent to-emerald-500/40" />
            <p className="text-emerald-400/55 text-[8.5px] font-black uppercase tracking-[0.55em]">
              Elite Aquaculture Platform
            </p>
            <div className="h-px w-7 bg-gradient-to-l from-transparent to-emerald-500/40" />
          </div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mt-7 max-w-[280px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: phase === 'progress' || phase === 'done' ? 0.65 : 0, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {['💧 Live Water Monitor', '🤖 AI Engine', '📡 IoT Control', '🌦️ Weather Alerts', '💰 Profit Analytics'].map((f, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(52,211,153,0.07)',
                border: '1px solid rgba(52,211,153,0.14)',
                color: 'rgba(52,211,153,0.65)',
              }}
            >
              {f}
            </motion.span>
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
            transition={{ duration: 0.45 }}
          >
            <div className="relative h-[3px] w-full rounded-full overflow-hidden mb-4"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <motion.div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #059669, #34D399, #6EE7B7)',
                  boxShadow: '0 0 10px rgba(52,211,153,0.55)',
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
                  transition={{ duration: 0.22 }}
                  className="text-[9px] font-black uppercase tracking-[0.25em] text-white/25"
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

      {/* Version watermark */}
      <motion.p
        className="absolute bottom-4 text-white/10 text-[7px] font-black uppercase tracking-[0.3em] z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'progress' || phase === 'done' ? 1 : 0 }}
        transition={{ delay: 0.9 }}
      >
        v2.0 · aquagrow.io
      </motion.p>
    </motion.div>
  );
};
