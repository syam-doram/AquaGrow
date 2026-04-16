/**
 * OnboardingScreen — AquaGrow Premium
 * ─────────────────────────────────────────────────────────────────────────────
 * Fully rewritten with all current platform features:
 *  1. Welcome & Smart Pond Management
 *  2. Real-Time Water Quality Monitor
 *  3. AI Disease Detection (Gemini)
 *  4. Smart Farm Hub + IoT Command Center
 *  5. Live Weather Alerts + Push Notifications
 *  6. Aerator Management + Power Analytics
 *  7. Market, Harvest & Payment Tracking
 *  8. Profit, ROI & Finance Analytics
 *
 * Design:
 *  • Dark #0D0D0D base with per-slide ambient glow
 *  • Large illustrated icon card with gradient + inner shimmer
 *  • Feature bullet strips (3 per slide) showing specific capabilities
 *  • Swipe gesture + dot navigation + Skip
 *  • Full-bleed gradient CTA button per slide colour
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Waves, Droplets, Stethoscope, TrendingUp,
  Wind, CloudRain, BarChart2, ShoppingCart,
  ChevronRight, ArrowRight,
  Activity, Zap, Bell, Wifi, ToggleRight,
  Thermometer, ShieldCheck, Brain, MapPin,
  DollarSign, Scale, Package, Truck,
} from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface Slide {
  id: number;
  emoji?: string;
  imageUrl?: string;
  icon: React.ElementType;
  gradient: string;
  bgGlow: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeColor: string;
  features: { icon: React.ElementType; label: string }[];
}

const slides: Slide[] = [
  {
    id: 1,
    imageUrl: '/app_icon_3d.png',
    icon: Waves,
    gradient: 'from-[#FF6B00] to-[#FF9000]',
    bgGlow: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(255,107,0,0.45) 0%, transparent 70%)',
    title: 'Welcome to AquaGrow',
    subtitle: 'India\'s #1 Smart Shrimp Platform',
    description:
      'An end-to-end aquaculture command centre built for Telugu & coastal farmers. Manage every pond, every device, every rupee — from one app.',
    badge: 'Smart Farming',
    badgeColor: '#FF6B00',
    features: [
      { icon: MapPin,      label: 'Multi-pond dashboard with live DOC tracking' },
      { icon: Bell,        label: 'Push alerts even when your phone is locked' },
      { icon: ShieldCheck, label: 'SOP-guided decisions at every growth stage' },
    ],
  },
  {
    id: 2,
    emoji: '💧',
    icon: Droplets,
    gradient: 'from-[#0369A1] to-[#0EA5E9]',
    bgGlow: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(14,165,233,0.32) 0%, transparent 70%)',
    title: 'Real-Time Water Monitor',
    subtitle: 'Always In Control',
    description:
      'Track pH, Dissolved Oxygen, salinity, temperature and turbidity in real time. AI flags critical deviations instanly so you never miss a danger window.',
    badge: 'Live Monitor',
    badgeColor: '#0369A1',
    features: [
      { icon: Activity,    label: 'DO, pH, salinity & temperature at a glance' },
      { icon: Bell,        label: 'Critical water alerts → instant FCM push' },
      { icon: Thermometer, label: 'Pre-dawn 3–6 AM DO crash warnings' },
    ],
  },
  {
    id: 3,
    emoji: '🤖',
    icon: Brain,
    gradient: 'from-[#059669] to-[#10B981]',
    bgGlow: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(5,150,105,0.32) 0%, transparent 70%)',
    title: 'AI Disease Detection',
    subtitle: 'Powered by Gemini AI',
    description:
      'Snap a photo of your shrimp. Our Gemini AI instantly identifies WSSV, EMS, black-gill and 20+ diseases — with medicine doses, quarantine steps and cost estimate.',
    badge: 'AI Powered',
    badgeColor: '#059669',
    features: [
      { icon: Stethoscope, label: 'Photo-based instant disease diagnosis' },
      { icon: Zap,         label: 'Auto-schedules medicine dosage to your calendar' },
      { icon: ShieldCheck, label: 'WSSV & EMS SOP guidance for DOC 30–60' },
    ],
  },
  {
    id: 4,
    emoji: '📡',
    icon: Wifi,
    gradient: 'from-[#7C3AED] to-[#A855F7]',
    bgGlow: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(124,58,237,0.32) 0%, transparent 70%)',
    title: 'IoT Command Center',
    subtitle: 'Smart Farm Hub',
    description:
      'Monitor all your aerators, sensors and pumps in one panel. Get push alerts the moment a device goes offline. Step-by-step repair guide for every fault — right on your lock screen.',
    badge: 'IoT Control',
    badgeColor: '#7C3AED',
    features: [
      { icon: ToggleRight, label: 'Remote ON/OFF for aerators & pumps' },
      { icon: Activity,    label: 'Live signal strength & connection health' },
      { icon: Bell,        label: 'Device offline / aerator fault → instant FCM' },
    ],
  },
  {
    id: 5,
    emoji: '🌦️',
    icon: CloudRain,
    gradient: 'from-[#0284C7] to-[#38BDF8]',
    bgGlow: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(2,132,199,0.35) 0%, transparent 70%)',
    title: 'Live Weather Alerts',
    subtitle: 'Your Pond\'s Weather Guardian',
    description:
      'Real data from OpenWeatherMap — every 5 minutes. Heat wave, heavy rain, high winds, storm warnings all trigger instant push notifications with step-by-step SOP actions.',
    badge: 'Weather Intel',
    badgeColor: '#0284C7',
    features: [
      { icon: CloudRain,   label: 'Heavy rain → auto feed reduction guidance' },
      { icon: Thermometer, label: 'Extreme heat → skip noon feed alert' },
      { icon: Wind,        label: '7-day forecast with aquaculture impact tags' },
    ],
  },
  {
    id: 6,
    emoji: '💨',
    icon: Wind,
    gradient: 'from-[#0EA5E9] to-[#22D3EE]',
    bgGlow: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(14,165,233,0.32) 0%, transparent 70%)',
    title: 'Aerator Management',
    subtitle: 'Stage-Wise SOP Engine',
    description:
      'Auto-calculates HP, count and placement based on your pond size and DOC. Stage-gated reminders every 20 days. Power bill calculator shows daily running cost per pond.',
    badge: 'Auto-SOP',
    badgeColor: '#0EA5E9',
    features: [
      { icon: Zap,         label: 'Watt-based power bill estimate per pond' },
      { icon: ToggleRight, label: 'Stage-wise aerator position mapping' },
      { icon: Bell,        label: 'DOC 20/40/60/80 aerator check notifications' },
    ],
  },
  {
    id: 7,
    emoji: '🛒',
    icon: ShoppingCart,
    gradient: 'from-[#DC2626] to-[#F97316]',
    bgGlow: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(220,38,38,0.32) 0%, transparent 70%)',
    title: 'Market & Harvest Hub',
    subtitle: 'Zero-stress Trade',
    description:
      'List your harvest, connect with verified buyers, track status from quality check → weighing → payment in real time. Know your live shrimp price by DOC, weight and region.',
    badge: 'Live Market',
    badgeColor: '#DC2626',
    features: [
      { icon: Scale,    label: 'Buyer-side quality check & weighing workflow' },
      { icon: Truck,    label: 'Real-time harvest status push notifications' },
      { icon: DollarSign, label: 'Live shrimp price tracker (₹/kg by size)' },
    ],
  },
  {
    id: 8,
    emoji: '💰',
    icon: TrendingUp,
    gradient: 'from-[#7C3AED] to-[#EC4899]',
    bgGlow: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(124,58,237,0.32) 0%, transparent 70%)',
    title: 'Profit & ROI Analytics',
    subtitle: 'Every Rupee Tracked',
    description:
      'Full P&L per cycle: feed cost, medicine, electricity, labour and harvest revenue. FCR calculation, break-even price, and net ROI — with cycle-over-cycle comparison charts.',
    badge: 'Finance AI',
    badgeColor: '#7C3AED',
    features: [
      { icon: BarChart2,  label: 'FCR, survival rate & net margin per cycle' },
      { icon: DollarSign, label: 'Auto-calculates break-even price per kg' },
      { icon: Package,    label: 'Expense tracking: feed, medicine, power, labour' },
    ],
  },
];

const Dot = ({ active, color }: { active: boolean; color: string }) => (
  <motion.div
    animate={{ width: active ? 28 : 6, opacity: active ? 1 : 0.25 }}
    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    style={{ backgroundColor: active ? color : 'rgba(255,255,255,0.4)' }}
    className="h-[5px] rounded-full"
  />
);

export const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef<number | null>(null);

  const slide = slides[current];
  const isLast = current === slides.length - 1;

  const goNext = () => {
    if (isLast) { onComplete(); return; }
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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 45) { if (diff > 0) goNext(); else goPrev(); }
    touchStartX.current = null;
  };

  const variants = {
    enter:  (d: number) => ({ x: d > 0 ? '65%' : '-65%', opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit:   (d: number) => ({ x: d > 0 ? '-65%' : '65%', opacity: 0, scale: 0.95 }),
  };

  const Icon = slide.icon;

  return (
    <div
      className="h-[100dvh] w-full overflow-hidden relative flex flex-col bg-[#0D0D0D]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Ambient glow per slide ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`glow-${current}`}
          className="absolute inset-0 pointer-events-none z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65 }}
          style={{ background: slide.bgGlow }}
        />
      </AnimatePresence>

      {/* ── Subtle dot-grid ── */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── Skip button ── */}
      <div className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-5 z-40">
        <button
          onClick={onComplete}
          className="text-white/25 text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-full border border-white/10"
        >
          Skip
        </button>
      </div>

      {/* ── Slide counter ── */}
      <div className="absolute top-[calc(env(safe-area-inset-top)+1.1rem)] left-5 z-40">
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: `${slide.badgeColor}90` }}>
          {current + 1} / {slides.length}
        </p>
      </div>

      {/* ── Slide content area ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
            className="w-full flex flex-col items-center text-center"
          >
            {/* ── Icon card ── */}
            <motion.div
              initial={{ scale: 0.75, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative mb-7"
            >
              {/* Glow blob */}
              <div
                className={`absolute -inset-8 rounded-full blur-3xl opacity-30 bg-gradient-to-br ${slide.gradient}`}
              />
              {/* Card */}
              <div
                className={`relative w-32 h-32 rounded-[2.5rem] bg-gradient-to-br ${slide.gradient} flex items-center justify-center overflow-hidden`}
                style={{
                  boxShadow: `0 24px 72px ${slide.badgeColor}55, inset 0 1px 0 rgba(255,255,255,0.15)`,
                }}
              >
                {/* Inner shimmer */}
                <motion.div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)' }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
                {/* Big emoji or 3D image */}
                {slide.imageUrl ? (
                  <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover z-10 relative" />
                ) : (
                  <span className="text-5xl z-10 relative select-none" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>
                    {slide.emoji}
                  </span>
                )}
              </div>
            </motion.div>

            {/* ── Badge pill ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.12, duration: 0.35 }}
              className="mb-4 px-4 py-1.5 rounded-full border"
              style={{
                backgroundColor: `${slide.badgeColor}18`,
                borderColor: `${slide.badgeColor}40`,
              }}
            >
              <span
                className="text-[9px] font-black uppercase tracking-[0.25em]"
                style={{ color: slide.badgeColor }}
              >
                {slide.badge}
              </span>
            </motion.div>

            {/* ── Title ── */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.17, duration: 0.45 }}
              className="text-white text-[1.6rem] font-black tracking-tight leading-tight mb-1"
            >
              {slide.title}
            </motion.h1>

            {/* ── Subtitle ── */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.4 }}
              className="text-[10px] font-black uppercase tracking-[0.18em] mb-4"
              style={{ color: slide.badgeColor }}
            >
              {slide.subtitle}
            </motion.p>

            {/* ── Description ── */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.27, duration: 0.4 }}
              className="text-white/45 text-[12px] leading-[1.75] max-w-[290px] font-medium mb-6"
            >
              {slide.description}
            </motion.p>

            {/* ── Feature bullets ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.4 }}
              className="w-full max-w-[320px] space-y-2"
            >
              {slide.features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.07 }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-left"
                  style={{
                    background: `${slide.badgeColor}10`,
                    border: `1px solid ${slide.badgeColor}22`,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${slide.badgeColor}22` }}
                  >
                    <f.icon size={13} style={{ color: slide.badgeColor }} />
                  </div>
                  <p className="text-[10px] font-bold text-white/60 leading-tight">{f.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom controls ── */}
      <div className="pb-[calc(env(safe-area-inset-bottom)+1.5rem)] px-6 space-y-5 relative z-20">

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} className="p-1">
              <Dot active={i === current} color={slide.badgeColor} />
            </button>
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          onClick={goNext}
          whileTap={{ scale: 0.96 }}
          className={`w-full py-4.5 rounded-[2rem] bg-gradient-to-r ${slide.gradient} text-white font-black text-[11px] uppercase tracking-[0.22em] flex items-center justify-center gap-3`}
          style={{
            boxShadow: `0 16px 50px ${slide.badgeColor}50`,
            paddingTop: '1.1rem',
            paddingBottom: '1.1rem',
          }}
        >
          {isLast ? (
            <> Start Growing <ArrowRight size={18} /> </>
          ) : (
            <> Next <ChevronRight size={18} /> </>
          )}
        </motion.button>
      </div>
    </div>
  );
};
