/**
 * ProGate.tsx — Beautiful subscription paywall gate
 * Wrap any premium feature with this to enforce subscription access.
 * Shows a stunning frosted-glass overlay with pricing and a clear CTA.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles, ChevronRight, Crown, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils/cn';
import { useData } from '../context/DataContext';

interface ProGateProps {
  /** Feature name shown in the paywall headline */
  featureName: string;
  /** Short description of what unlocks */
  description?: string;
  /** Which plan minimum is required: 'any' | 'gold' | 'diamond' */
  requiredPlan?: 'any' | 'gold' | 'diamond';
  /** Override isDark from parent if you don't want auto-detection */
  isDark?: boolean;
  children?: React.ReactNode;
}

const PLAN_META = {
  any: {
    planLabel: 'Aqua Silver',
    price: '₹500',
    period: '/month',
    badge: 'Starting at',
    color: '#C78200',
    colorLight: 'rgba(199,130,0,0.12)',
  },
  gold: {
    planLabel: 'Aqua Gold',
    price: '₹999',
    period: '/month',
    badge: 'Gold & above',
    color: '#C78200',
    colorLight: 'rgba(199,130,0,0.12)',
  },
  diamond: {
    planLabel: 'Aqua Diamond',
    price: '₹1,499',
    period: '/month',
    badge: 'Diamond plan',
    color: '#3B82F6',
    colorLight: 'rgba(59,130,246,0.12)',
  },
};

/**
 * Full-page paywall (use when the entire page is pro-only)
 */
export const ProGatePage: React.FC<ProGateProps> = ({
  featureName,
  description,
  requiredPlan = 'any',
  isDark = false,
}) => {
  const navigate = useNavigate();
  const meta = PLAN_META[requiredPlan];

  return (
    <div className={cn(
      'min-h-screen flex flex-col items-center justify-center px-6 pb-24 relative overflow-hidden',
      isDark ? 'bg-[#070D12]' : 'bg-[#FBFBFE]'
    )}>
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? `radial-gradient(ellipse 60% 40% at 50% 30%, rgba(199,130,0,0.08) 0%, transparent 70%)`
            : `radial-gradient(ellipse 60% 40% at 50% 30%, rgba(199,130,0,0.06) 0%, transparent 70%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm text-center"
      >
        {/* Lock Icon */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
          className="mx-auto mb-6 relative w-20 h-20"
        >
          <div
            className="w-20 h-20 rounded-[1.8rem] flex items-center justify-center shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${meta.color}22, ${meta.color}44)`, border: `1.5px solid ${meta.color}44` }}
          >
            <Lock size={32} style={{ color: meta.color }} />
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-xl bg-[#C78200] flex items-center justify-center shadow-lg">
            <Crown size={13} className="text-white" />
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4"
          style={{ background: meta.colorLight, border: `1px solid ${meta.color}33` }}
        >
          <Sparkles size={10} style={{ color: meta.color }} />
          <span className="text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: meta.color }}>
            {meta.badge}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className={cn('text-2xl font-black tracking-tighter mb-3 leading-tight', isDark ? 'text-white' : 'text-slate-900')}
        >
          {featureName}
          <br />
          <span style={{ color: meta.color }}>is a Pro Feature</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          className={cn('text-[11px] font-medium leading-relaxed mb-8 max-w-xs mx-auto', isDark ? 'text-white/40' : 'text-slate-500')}
        >
          {description || `Unlock ${featureName} along with AI diagnostics, multi-pond management, IoT monitoring and more.`}
        </motion.p>

        {/* Pricing pill */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className={cn('rounded-[1.8rem] p-5 mb-6 text-left', isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-100 shadow-md')}
        >
          <p className={cn('text-[7px] font-black uppercase tracking-[0.25em] mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
            Starting from
          </p>
          <div className="flex items-baseline gap-1 mb-3">
            <span className={cn('text-4xl font-black tracking-tighter', isDark ? 'text-white' : 'text-slate-900')}>
              {meta.price}
            </span>
            <span className={cn('text-[10px] font-black', isDark ? 'text-white/30' : 'text-slate-400')}>
              {meta.period}
            </span>
          </div>
          <div className="space-y-1.5">
            {[
              '🤖 AI Disease Detection (unlimited scans)',
              '🌦️ Weather & Disaster Alerts',
              '📊 Profit Forecasting & ROI Reports',
              '📡 Live IoT Monitoring',
              '💬 Expert Consultations',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                <span className={cn('text-[9px] font-bold', isDark ? 'text-white/50' : 'text-slate-500')}>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/subscription')}
          className="w-full py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.25em] text-white flex items-center justify-center gap-3 shadow-2xl transition-all"
          style={{
            background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
            boxShadow: `0 12px 40px ${meta.color}33`,
          }}
        >
          <Sparkles size={16} />
          Upgrade to {meta.planLabel}
          <ChevronRight size={16} />
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.44 }}
          className={cn('text-[8px] font-bold mt-4 tracking-wider', isDark ? 'text-white/20' : 'text-slate-400')}
        >
          CANCEL ANYTIME · SECURE PAYMENT · GST INCLUDED
        </motion.p>
      </motion.div>
    </div>
  );
};

/**
 * Inline overlay gate — blurs children and shows a compact paywall CTA.
 * Use when you want to tease the content but block interaction.
 */
export const ProGateOverlay: React.FC<ProGateProps & { minHeight?: string }> = ({
  featureName,
  description,
  requiredPlan = 'any',
  isDark = false,
  children,
  minHeight = '280px',
}) => {
  const navigate = useNavigate();
  const meta = PLAN_META[requiredPlan];

  return (
    <div className="relative overflow-hidden rounded-[1.5rem]" style={{ minHeight }}>
      {/* Blurred content preview */}
      {children && (
        <div className="absolute inset-0 select-none pointer-events-none" style={{ filter: 'blur(6px) brightness(0.7)', transform: 'scale(1.04)' }}>
          {children}
        </div>
      )}

      {/* Gate overlay */}
      <div className={cn(
        'absolute inset-0 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm',
        isDark ? 'bg-black/60' : 'bg-white/80'
      )}>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${meta.color}22, ${meta.color}44)` }}
        >
          <Lock size={22} style={{ color: meta.color }} />
        </div>

        <p className={cn('text-sm font-black tracking-tight mb-1', isDark ? 'text-white' : 'text-slate-800')}>
          {featureName}
        </p>
        <p className={cn('text-[9px] font-medium mb-4 max-w-[200px]', isDark ? 'text-white/40' : 'text-slate-500')}>
          {description || 'Upgrade to access this feature'}
        </p>

        <button
          onClick={() => navigate('/subscription')}
          className="px-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] text-white flex items-center gap-2 transition-all active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
            boxShadow: `0 8px 24px ${meta.color}33`,
          }}
        >
          <Zap size={12} />
          Unlock · {meta.price}{meta.period}
        </button>
      </div>
    </div>
  );
};

/**
 * Lightweight hook guard — use at the top of a component to redirect if not pro
 */
export const useProGuard = (requiredPlan: 'any' | 'gold' | 'diamond' = 'any') => {
  const { isPro, user } = useData();
  const navigate = useNavigate();

  const planRank = { any: 1, gold: 2, diamond: 3 }[requiredPlan];
  const userPlanRank = user?.subscriptionStatus === 'pro_diamond' ? 3
    : user?.subscriptionStatus === 'pro_gold' ? 2
    : (user?.subscriptionStatus === 'pro_silver' || user?.subscriptionStatus === 'pro') ? 1
    : 0;

  const hasRequiredPlan = isPro && userPlanRank >= planRank;

  return { isPro, hasRequiredPlan, navigate };
};
