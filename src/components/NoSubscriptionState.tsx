import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, Lock, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

interface NoSubscriptionStateProps {
  isDark?: boolean;
  reason?: string;
}

export const NoSubscriptionState: React.FC<NoSubscriptionStateProps> = ({
  isDark = false,
  reason = 'Upgrade to Pro to manage more ponds and access advanced features.',
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 220 }}
      className={cn(
        'rounded-2xl border overflow-hidden',
        isDark
          ? 'bg-[#1A0F00]/80 border-[#C78200]/20'
          : 'bg-amber-50 border-amber-200'
      )}
    >
      {/* Thin accent bar */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#C78200] via-amber-400 to-orange-400" />

      <div className="px-4 py-3 flex items-center gap-3">
        {/* Icon */}
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
          isDark ? 'bg-[#C78200]/15 border border-[#C78200]/25' : 'bg-amber-100 border border-amber-200'
        )}>
          <Lock size={15} className="text-[#C78200]" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              Free Plan
            </p>
            <span className={cn('text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border',
              isDark ? 'bg-[#C78200]/10 border-[#C78200]/20 text-[#C78200]' : 'bg-amber-100 border-amber-200 text-amber-700'
            )}>1 Pond Max</span>
          </div>
          <p className={cn('text-[9px] font-medium leading-snug', isDark ? 'text-white/40' : 'text-slate-500')}>
            {reason}
          </p>
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/subscription')}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-gradient-to-br from-[#C78200] to-[#a06600] text-white rounded-xl font-black text-[8px] uppercase tracking-widest shadow-md"
        >
          <Sparkles size={10} />
          Upgrade
          <ChevronRight size={10} />
        </motion.button>
      </div>
    </motion.div>
  );
};
