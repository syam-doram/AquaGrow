import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Plus, Waves } from 'lucide-react';
import { cn } from '../utils/cn';

interface NoPondStateProps {
  icon?: React.ElementType;
  isDark?: boolean;
  subtitle?: string;
  fullScreen?: boolean;
}

export const NoPondState: React.FC<NoPondStateProps> = ({
  icon: Icon = Waves,
  isDark = false,
  subtitle = 'Create your first pond to unlock all features on this page.',
  fullScreen = false,
}) => {
  const navigate = useNavigate();

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 24, stiffness: 220 }}
      className="flex flex-col items-center text-center px-5 py-6"
    >
      {/* Icon */}
      <div className="relative mb-4">
        <div className={cn(
          'absolute inset-0 rounded-[1.5rem] blur-[20px] opacity-25',
          isDark ? 'bg-emerald-500' : 'bg-emerald-400'
        )} />
        <div className={cn(
          'relative w-16 h-16 rounded-[1.5rem] flex items-center justify-center border',
          isDark ? 'bg-[#0D1F18] border-emerald-500/25' : 'bg-emerald-50 border-emerald-200'
        )}>
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className={cn('absolute w-full h-full rounded-[1.5rem]', isDark ? 'bg-emerald-500/15' : 'bg-emerald-200/50')}
          />
          <Icon size={28} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
        </div>
      </div>

      {/* Aqua emoji row */}
      <div className="flex gap-1.5 mb-3">
        {['🦐', '🐟', '🌊', '🐠', '💧'].map((e, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06 }}
            className="text-sm"
          >
            {e}
          </motion.span>
        ))}
      </div>

      {/* Heading */}
      <h2 className={cn('text-base font-black tracking-tight mb-1', isDark ? 'text-white' : 'text-slate-900')}>
        No Pond Yet
      </h2>

      {/* Subtitle */}
      <p className={cn('text-[10px] font-medium leading-relaxed mb-5 max-w-[220px]', isDark ? 'text-white/40' : 'text-slate-500')}>
        {subtitle}
      </p>

      {/* CTA */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/ponds/new')}
        className="px-6 py-3 bg-gradient-to-br from-emerald-600 to-[#0D523C] text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.18em] shadow-lg shadow-emerald-900/20 flex items-center gap-2"
      >
        <Plus size={13} strokeWidth={3} />
        Create First Pond
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
