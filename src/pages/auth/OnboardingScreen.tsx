import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Waves,
  Droplets,
  Stethoscope,
  TrendingUp,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    id: 1,
    icon: Waves,
    gradient: 'from-[#C78200] to-[#E8A000]',
    bgGlow: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(199,130,0,0.35) 0%, transparent 70%)',
    title: 'Welcome to AquaGrow',
    subtitle: 'Smart Shrimp Farming Assistant',
    description:
      'Your all-in-one platform designed for modern aquaculture farmers. Manage your ponds, monitor water quality and grow your yield — all from your phone.',
    badge: 'Smart Farming',
    badgeColor: '#C78200',
  },
  {
    id: 2,
    icon: Droplets,
    gradient: 'from-[#0369A1] to-[#0EA5E9]',
    bgGlow: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(14,165,233,0.3) 0%, transparent 70%)',
    title: 'Real-Time Water Monitoring',
    subtitle: 'Always In Control',
    description:
      'Track pH, dissolved oxygen, salinity and temperature in real time. Get instant alerts when pond conditions deviate from safe thresholds.',
    badge: 'Live Monitor',
    badgeColor: '#0369A1',
  },
  {
    id: 3,
    icon: Stethoscope,
    gradient: 'from-[#059669] to-[#10B981]',
    bgGlow: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(5,150,105,0.3) 0%, transparent 70%)',
    title: 'AI Disease Detection',
    subtitle: 'Powered by Gemini AI',
    description:
      'Upload a photo of your shrimp and our AI instantly diagnoses diseases, provides treatment recommendations and auto-schedules your medicine dosage.',
    badge: 'AI Powered',
    badgeColor: '#059669',
  },
  {
    id: 4,
    icon: TrendingUp,
    gradient: 'from-[#7C3AED] to-[#A855F7]',
    bgGlow: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(124,58,237,0.3) 0%, transparent 70%)',
    title: 'Profit & ROI Insights',
    subtitle: 'Maximize Your Returns',
    description:
      'Track expenses, harvest revenue and feed conversion ratios. Get data-driven insights to cut costs and maximize your profit every cycle.',
    badge: 'Smart Analytics',
    badgeColor: '#7C3AED',
  },
];

const FeatureDot = ({ active, color }: { active: boolean; color: string }) => (
  <motion.div
    animate={{ width: active ? 32 : 8, opacity: active ? 1 : 0.3 }}
    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    style={{ backgroundColor: color }}
    className="h-2 rounded-full"
  />
);

export const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef<number | null>(null);

  const slide = slides[current];
  const Icon = slide.icon;
  const isLast = current === slides.length - 1;

  const goNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setDirection(1);
    setCurrent((p) => p + 1);
  };

  const goPrev = () => {
    if (current === 0) return;
    setDirection(-1);
    setCurrent((p) => p - 1);
  };

  const goTo = (idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  };

  // Touch / swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0, scale: 0.96 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0, scale: 0.96 }),
  };

  return (
    <div
      className="h-screen w-full overflow-hidden relative flex flex-col bg-[#0D0D0D]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip button */}
      <div className="absolute top-6 right-6 z-30">
        <button
          onClick={onComplete}
          className="text-white/30 text-[11px] font-black uppercase tracking-widest py-2 px-4 rounded-full border border-white/10 hover:border-white/30 hover:text-white/60 transition-all"
        >
          Skip
        </button>
      </div>

      {/* Animated background glow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`glow-${current}`}
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          style={{ background: slide.bgGlow }}
        />
      </AnimatePresence>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
            className="w-full flex flex-col items-center text-center"
          >
            {/* Icon blob */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative mb-10"
            >
              {/* Outer ring pulse */}
              <div
                className={`absolute inset-0 rounded-[3rem] bg-gradient-to-br ${slide.gradient} opacity-20 blur-2xl scale-150 animate-pulse`}
              />
              {/* Icon card */}
              <div
                className={`relative w-36 h-36 rounded-[3rem] bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-2xl`}
                style={{
                  boxShadow: `0 30px 80px ${slide.badgeColor}55`,
                }}
              >
                <Icon size={72} strokeWidth={1.5} className="text-white" />
              </div>
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              style={{ backgroundColor: `${slide.badgeColor}22`, borderColor: `${slide.badgeColor}44` }}
              className="mb-5 px-4 py-1.5 rounded-full border"
            >
              <span
                className="text-[10px] font-black uppercase tracking-[0.25em]"
                style={{ color: slide.badgeColor }}
              >
                {slide.badge}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-white text-3xl font-bold tracking-tight leading-tight mb-2"
            >
              {slide.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              style={{ color: slide.badgeColor }}
              className="text-xs font-black uppercase tracking-[0.2em] mb-6"
            >
              {slide.subtitle}
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.45 }}
              className="text-white/50 text-sm leading-7 max-w-xs font-medium"
            >
              {slide.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="pb-14 px-8 space-y-8">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((s, i) => (
            <button key={i} onClick={() => goTo(i)}>
              <FeatureDot active={i === current} color={slide.badgeColor} />
            </button>
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          onClick={goNext}
          whileTap={{ scale: 0.95 }}
          className={`w-full py-5 rounded-[2rem] bg-gradient-to-r ${slide.gradient} text-white font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl transition-all`}
          style={{ boxShadow: `0 20px 60px ${slide.badgeColor}50` }}
        >
          {isLast ? (
            <>
              Get Started <ArrowRight size={20} />
            </>
          ) : (
            <>
              Next <ChevronRight size={20} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};
