import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Waves, Sparkles, Droplets, ShieldCheck } from 'lucide-react';

type Phase = 'logo' | 'text' | 'progress' | 'done';

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>('logo');
  const [wave, setWave] = useState(0);

  // High-fidelity background bubbles
  const bubbles = useMemo(() => 
    Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      size: Math.random() * 12 + 2,
      left: Math.random() * 100,
      duration: Math.random() * 6 + 4,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.3 + 0.1
    })), []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 600);
    const t2 = setTimeout(() => setPhase('progress'), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase !== 'progress') return;
    let val = 0;
    const interval = setInterval(() => {
      const speed = val < 30 ? 3.5 : val < 75 ? 1.2 : 4.5;
      val = Math.min(val + speed, 100);
      setProgress(val);
      if (val >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setPhase('done');
          setTimeout(onComplete, 1000);
        }, 500);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [phase, onComplete]);

  const statusMessages = [
    'Initializing Neural Core...',
    'Calibrating Bio-Sensors...',
    'Syncing Satellite Feeds...',
    'Eco-Engine: Online'
  ];
  const msgIndex = progress < 25 ? 0 : progress < 50 ? 1 : progress < 80 ? 2 : 3;

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center overflow-hidden relative bg-[#012B1D]">
      {/* ─── ATMOSPHERIC BACKGROUND ─── */}
      <motion.div 
        className="absolute inset-0 z-0"
        animate={{ filter: `blur(${10 - (progress/10) }px)` }}
        style={{ background: 'radial-gradient(circle at center, #0D523C 0%, #012B1D 100%)' }}
      />
      
      {/* Dynamic Glow Rings */}
      <motion.div 
        className="absolute w-[150%] h-[150%] rounded-full border border-white/5 z-0"
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div 
        className="absolute w-[120%] h-[120%] rounded-full border border-white/10 z-0"
        animate={{ rotate: -360, scale: [1.1, 1, 1.1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      {/* Bubbles / Dust Particles */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {bubbles.map((b) => (
          <motion.div
            key={b.id}
            className="absolute bg-emerald-400/30 rounded-full blur-[2px]"
            style={{ width: b.size, height: b.size, left: `${b.left}%`, bottom: '-10%', opacity: b.opacity }}
            animate={{ 
              y: ['0vh', '-120vh'], 
              x: [0, Math.sin(b.id) * 40, 0],
              scale: [1, 1.5, 0.8]
            }}
            transition={{ 
              duration: b.duration, 
              repeat: Infinity, 
              delay: b.delay,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <motion.div
        className="relative z-20 flex flex-col items-center px-8 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={phase === 'done' ? { opacity: 0, scale: 1.1, filter: 'blur(20px)' } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* The Premium Icon Asset */}
        <div className="relative mb-8 sm:mb-12">
           <motion.div 
             className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl"
             animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
             transition={{ duration: 3, repeat: Infinity }}
           />
           <motion.div
             className="w-32 h-32 sm:w-44 sm:h-44 rounded-3xl sm:rounded-[4rem] flex items-center justify-center relative z-10 overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(16,185,129,0.2)] bg-card/5 backdrop-blur-3xl"
             initial={{ rotateX: 45, rotateY: -10 }}
             animate={{ rotateX: 0, rotateY: 0 }}
             transition={{ duration: 2, ease: 'easeOut' }}
           >
             <Waves size={60} className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] sm:w-20 sm:h-20" />
             
             {/* Scanning Line Effect */}
             <motion.div 
                className="absolute left-0 right-0 h-[3px] bg-emerald-400/40 blur-[2px] z-20"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
             />
           </motion.div>
        </div>

        {/* Brand Text */}
        <div className="space-y-1 sm:space-y-2">
          <motion.h1 
            className="text-4xl sm:text-6xl font-serif italic text-white tracking-tighter drop-shadow-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: phase !== 'logo' ? 1 : 0, y: 0 }}
          >
            AquaGrow
          </motion.h1>
          <motion.div 
            className="flex items-center justify-center gap-2 sm:gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase !== 'logo' ? 1 : 0 }}
            transition={{ delay: 0.2 }}
          >
             <div className="h-[1px] w-6 sm:w-8 bg-gradient-to-r from-transparent to-white/20" />
             <p className="text-white/40 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em]">
               Elite Aquaculture
             </p>
             <div className="h-[1px] w-6 sm:w-8 bg-gradient-to-l from-transparent to-white/20" />
          </motion.div>
        </div>
      </motion.div>

      {/* ─── BOTTOM PROGRESS ─── */}
      <AnimatePresence>
        {(phase === 'progress' || phase === 'done') && (
          <motion.div
            className="absolute bottom-12 sm:bottom-20 left-0 right-0 px-8 sm:px-12 z-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="relative h-[2px] w-full bg-card/5 rounded-full overflow-hidden">
               <motion.div 
                 className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                 style={{ width: `${progress}%` }}
               />
            </div>
            
            <div className="flex items-center justify-between mt-4">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{statusMessages[msgIndex]}</p>
               <p className="text-[10px] font-black tracking-widest text-emerald-400">{Math.round(progress)}%</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
