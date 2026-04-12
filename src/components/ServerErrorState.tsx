import React from 'react';
import { motion } from 'motion/react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '../utils/cn';

interface ServerErrorStateProps {
  isDark?: boolean;
  fullScreen?: boolean;
  message?: string;
}

export const ServerErrorState: React.FC<ServerErrorStateProps> = ({
  isDark = false,
  fullScreen = false,
  message = 'Could not connect to AquaGrow servers. Check your internet connection and try again.',
}) => {
  const card = (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 24, stiffness: 220 }}
      className="flex flex-col items-center text-center px-5 py-8"
    >
      {/* Icon */}
      <div className="relative mb-4">
        <div className={cn(
          'absolute inset-0 rounded-[1.5rem] blur-[20px] opacity-25',
          isDark ? 'bg-red-500' : 'bg-red-400'
        )} />
        <div className={cn(
          'relative w-16 h-16 rounded-[1.5rem] flex items-center justify-center border',
          isDark ? 'bg-[#1A0A10] border-red-500/25' : 'bg-red-50 border-red-200'
        )}>
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className={cn('absolute w-full h-full rounded-[1.5rem]', isDark ? 'bg-red-500/15' : 'bg-red-200/50')}
          />
          <WifiOff size={28} className={isDark ? 'text-red-400' : 'text-red-500'} />
        </div>
      </div>

      <h2 className={cn('text-base font-black tracking-tight mb-1', isDark ? 'text-white' : 'text-slate-900')}>
        Server Unreachable
      </h2>
      <p className={cn('text-[10px] font-medium leading-relaxed mb-5 max-w-[220px]', isDark ? 'text-white/40' : 'text-slate-500')}>
        {message}
      </p>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => window.location.reload()}
        className={cn(
          'px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-[0.18em] flex items-center gap-2',
          isDark
            ? 'bg-white/8 border border-white/10 text-white/70'
            : 'bg-slate-100 border border-slate-200 text-slate-600'
        )}
      >
        <RefreshCw size={12} strokeWidth={3} />
        Retry Connection
      </motion.button>
    </motion.div>
  );

  if (!fullScreen) return card;

  return (
    <div className={cn('min-h-screen flex flex-col items-center justify-center', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      {card}
    </div>
  );
};
