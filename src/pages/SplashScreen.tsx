import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Waves } from 'lucide-react';

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 800);
          return 100;
        }
        return prev + 1.5;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="h-screen w-full bg-[#C78200] flex flex-col items-center justify-center text-white overflow-hidden relative font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"></div>
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-16"
      >
        <div className="absolute inset-0 bg-white/20 blur-[120px] rounded-full scale-150 animate-pulse"></div>
        <div className="relative flex items-center justify-center w-48 h-48 rounded-[3.5rem] border border-white/10 bg-white/5 backdrop-blur-3xl shadow-[0_40px_80px_rgba(0,0,0,0.3)]">
          <Waves size={96} strokeWidth={1} className="text-white" />
        </div>
      </motion.div>
      
      <div className="text-center space-y-4 relative z-10">
        <h1 className="text-white tracking-tighter text-7xl font-serif italic leading-none drop-shadow-2xl">
          AquaGrow
        </h1>
        <p className="text-white/40 text-[11px] font-black tracking-[0.5em] uppercase">
          Smart Shrimp Farming Assistant
        </p>
      </div>

      <div className="absolute bottom-32 left-20 right-20 space-y-6">
        <div className="flex justify-between items-end">
          <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">System Initialization</p>
          <p className="text-white text-xs font-mono font-black">{Math.round(progress)}%</p>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/5 p-0.5">
          <motion.div 
            className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
