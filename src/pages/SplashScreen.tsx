import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Waves } from 'lucide-react';

type Phase = 'logo' | 'text' | 'progress' | 'done';

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>('logo');
  const [wave1, setWave1] = useState(0);
  const [wave2, setWave2] = useState(0);
  const [wave3, setWave3] = useState(0);

  // Phases: logo appears → text fades in → progress bar fills → exit
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 900);
    const t2 = setTimeout(() => setPhase('progress'), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Animated water wave offsets
  useEffect(() => {
    let frame: number;
    let t = 0;
    const animate = () => {
      t += 0.02;
      setWave1(Math.sin(t) * 6);
      setWave2(Math.sin(t + 1.2) * 5);
      setWave3(Math.sin(t + 2.4) * 4);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Progress fill  
  useEffect(() => {
    if (phase !== 'progress') return;
    let val = 0;
    const interval = setInterval(() => {
      // Ease-in-out style: faster start, slow near 90, burst to 100
      const speed = val < 70 ? 1.8 : val < 90 ? 0.6 : 2;
      val = Math.min(val + speed, 100);
      setProgress(val);
      if (val >= 100) {
        clearInterval(interval);
        setPhase('done');
        setTimeout(onComplete, 700);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [phase, onComplete]);

  // Status messages
  const statusMessages = [
    'Connecting to servers...',
    'Loading pond data...',
    'Preparing dashboard...',
    'Ready!',
  ];
  const msgIndex =
    progress < 30 ? 0 : progress < 60 ? 1 : progress < 90 ? 2 : 3;

  return (
    <motion.div
      className="h-screen w-full flex flex-col items-center justify-center overflow-hidden relative"
      style={{ background: 'linear-gradient(145deg, #8B5A00 0%, #C78200 40%, #E09400 70%, #A66A00 100%)' }}
      animate={phase === 'done' ? { opacity: 0, scale: 1.05 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ─── Background layers ─── */}

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '150px 150px',
        }}
      />

      {/* Radial center glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(255,220,100,0.25) 0%, transparent 70%)',
        }}
      />

      {/* Soft vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 110% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      {/* Animated water ripple rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-white/10"
          style={{
            width: 240 + i * 80,
            height: 240 + i * 80,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.05, 0.15] }}
          transition={{
            repeat: Infinity,
            duration: 3 + i * 0.8,
            delay: i * 0.6,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* ─── Logo section ─── */}
      <motion.div
        className="relative flex flex-col items-center"
        initial={{ opacity: 0, y: 40, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Glow halo behind icon */}
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 220,
            height: 220,
            background: 'rgba(255,200,50,0.3)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -56%)',
          }}
        />

        {/* Icon container */}
        <div
          className="relative w-40 h-40 rounded-[3.5rem] flex items-center justify-center mb-8"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow:
              '0 30px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06) inset, 0 2px 12px rgba(255,210,80,0.3) inset',
          }}
        >
          {/* Animated wave lines inside icon */}
          <svg
            className="absolute inset-0 w-full h-full rounded-[3.5rem] overflow-visible"
            style={{ opacity: 0.12 }}
          >
            <line
              x1="0%" x2="100%"
              y1={`${50 + wave1}%`} y2={`${50 - wave1}%`}
              stroke="white" strokeWidth="40"
            />
          </svg>
          <Waves size={72} strokeWidth={1.2} className="text-white relative z-10 drop-shadow-xl" />
        </div>

        {/* ─── Brand text ─── */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: phase !== 'logo' ? 1 : 0, y: phase !== 'logo' ? 0 : 16 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1
            className="text-white tracking-tighter font-serif italic leading-none drop-shadow-2xl mb-3"
            style={{ fontSize: 'clamp(3.5rem, 14vw, 5.5rem)' }}
          >
            AquaGrow
          </h1>
          <p
            className="text-white/45 font-black uppercase"
            style={{ fontSize: '10px', letterSpacing: '0.45em' }}
          >
            Smart Shrimp Farming Assistant
          </p>
        </motion.div>
      </motion.div>

      {/* ─── Animated water waves (decorative) ─── */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ height: 160 }}>
        <svg viewBox="0 0 400 160" className="absolute bottom-0 w-full" preserveAspectRatio="none">
          <motion.path
            fill="rgba(0,0,0,0.18)"
            animate={{
              d: [
                `M0,80 C100,${80 + wave1} 200,${80 - wave2} 300,${80 + wave3} L400,80 L400,160 L0,160 Z`,
                `M0,80 C100,${80 - wave2} 200,${80 + wave3} 300,${80 - wave1} L400,80 L400,160 L0,160 Z`,
              ],
            }}
            transition={{ repeat: Infinity, repeatType: 'mirror', duration: 3, ease: 'easeInOut' }}
          />
          <motion.path
            fill="rgba(0,0,0,0.12)"
            animate={{
              d: [
                `M0,100 C80,${100 + wave2} 160,${100 - wave1} 280,${100 + wave3} L400,100 L400,160 L0,160 Z`,
                `M0,100 C80,${100 - wave1} 160,${100 + wave3} 280,${100 - wave2} L400,100 L400,160 L0,160 Z`,
              ],
            }}
            transition={{ repeat: Infinity, repeatType: 'mirror', duration: 4, ease: 'easeInOut', delay: 0.5 }}
          />
        </svg>
      </div>

      {/* ─── Progress section ─── */}
      <motion.div
        className="absolute left-8 right-8"
        style={{ bottom: 64 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: phase === 'progress' || phase === 'done' ? 1 : 0, y: phase === 'progress' || phase === 'done' ? 0 : 20 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Status text + percentage */}
        <div className="flex items-end justify-between mb-3 px-0.5">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-white/35 text-[10px] font-black uppercase tracking-[0.3em]"
          >
            {statusMessages[msgIndex]}
          </motion.p>
          <p className="text-white/70 text-sm font-mono font-black tabular-nums">
            {Math.round(progress)}%
          </p>
        </div>

        {/* Track */}
        <div
          className="w-full rounded-full overflow-hidden relative"
          style={{
            height: 6,
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Fill */}
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.95) 100%)',
              boxShadow: '0 0 16px rgba(255,255,255,0.7), 0 0 6px rgba(255,255,255,0.5)',
            }}
            transition={{ ease: 'linear' }}
          />
          {/* Shimmer sweep */}
          <motion.div
            className="absolute top-0 bottom-0 w-8 rounded-full"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
              left: `${Math.max(0, progress - 8)}%`,
            }}
          />
        </div>

        {/* Dot indicators */}
        <div className="flex justify-between mt-3 px-0.5">
          {[25, 50, 75, 100].map((milestone) => (
            <div
              key={milestone}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="w-1.5 h-1.5 rounded-full transition-all duration-500"
                style={{
                  background: progress >= milestone ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                  boxShadow: progress >= milestone ? '0 0 6px rgba(255,255,255,0.6)' : 'none',
                  transform: progress >= milestone ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Powered-by footnote */}
      <motion.p
        className="absolute text-white/20 text-[9px] font-black uppercase tracking-[0.35em]"
        style={{ bottom: 22 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase !== 'logo' ? 1 : 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        Powered by Gemini AI
      </motion.p>
    </motion.div>
  );
};
