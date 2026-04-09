import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, TrendingUp, Activity, Sparkles, Waves, Lock,
  Target, Scan, Shield, Zap, Eye, AlertTriangle, CheckCircle2, Fish,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import type { Translations } from '../../translations';
import { User } from '../../types';
import { analyzeLiveStream } from '../../services/geminiService';
import { cn } from '../../utils/cn';

// ─── METRIC PILLAR ────────────────────────────────────────────────────────────
const MetricPillar = ({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color: 'green' | 'amber' | 'red' | 'blue';
}) => {
  const colorMap = {
    green: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    amber: 'text-amber-400  border-amber-500/30  bg-amber-500/10',
    red:   'text-red-400    border-red-500/30    bg-red-500/10',
    blue:  'text-blue-400   border-blue-500/30   bg-blue-500/10',
  };
  return (
    <div className={cn('flex-1 text-center py-3 px-2 rounded-2xl border backdrop-blur-sm', colorMap[color])}>
      <p className="text-white/30 text-[7px] font-black uppercase tracking-widest mb-1">{label}</p>
      <p className={cn('font-black text-base tracking-tight', colorMap[color].split(' ')[0])}>{value}</p>
      {sub && <p className="text-white/20 text-[6px] font-black uppercase tracking-widest mt-0.5">{sub}</p>}
    </div>
  );
};

// ─── FREE-GATE FEATURES ───────────────────────────────────────────────────────
const FEATURES = [
  { icon: Activity,  label: 'Behavior Scan',    desc: 'Movement intelligence' },
  { icon: Sparkles,  label: 'Activity Score',   desc: 'AI stress detection' },
  { icon: Waves,     label: 'Feed Response',    desc: 'Adaptive decision' },
  { icon: Shield,    label: 'Risk Indication',  desc: 'Early warning' },
  { icon: Eye,       label: 'Visual Pathogen',  desc: 'Live disease flag' },
  { icon: Fish,      label: 'Biomass Estimate', desc: 'Count proxy' },
];

// ─── SETUP INSTRUCTIONS ───────────────────────────────────────────────────────
const SETUP_STEPS = [
  {
    icon: '💡',
    title: 'Good Lighting',
    desc: 'Use daylight or a torch. The AI needs a clear, well-lit view of the pond surface.',
  },
  {
    icon: '📏',
    title: '1–2 Metre Distance',
    desc: 'Hold the phone 1–2 m above water. Too close blurs the scan; too far loses detail.',
  },
  {
    icon: '🎯',
    title: 'Point at Shrimp Zone',
    desc: 'Aim at the feeding area or where shrimp are visible — edge or centre of pond.',
  },
  {
    icon: '📵',
    title: 'Keep Phone Steady',
    desc: 'Hold still for 3–5 seconds after each scan. Shaky frames reduce accuracy.',
  },
];

const SCAN_FEATURES = [
  { emoji: '🏃', label: 'Movement Activity',  desc: 'Is your shrimp school active or lethargic?' },
  { emoji: '🍽️', label: 'Feed Response',      desc: 'Are they eating well? Over-fed or under-fed?' },
  { emoji: '🔬', label: 'Visual Pathogen',    desc: 'Early signs of white spot, black gills etc.' },
  { emoji: '🧠', label: 'Stress Detection',   desc: 'Crowding, erratic swimming, surface gasping' },
  { emoji: '🐟', label: 'Biomass Estimate',   desc: 'Visual count proxy to gauge stock density' },
  { emoji: '⚠️', label: 'Risk Score',         desc: 'Overall health risk from 0–100%' },
];

const TIPS = [
  'Best results: scan at morning or evening feed time',
  'Run aerators during scan — active water shows natural behaviour',
  'If camera is blurry, tap the video frame to auto-focus',
];

// ─── INSTRUCTION SCREEN ───────────────────────────────────────────────────────
const InstructionScreen = ({
  onStart, isDark,
}: { onStart: () => void; isDark: boolean }) => (
  <div className={cn('min-h-screen pb-36', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
    {/* Header */}
    <div className={cn(
      'fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 backdrop-blur-xl px-4',
      'pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center justify-between border-b',
      isDark ? 'bg-[#070D12]/90 border-white/5' : 'bg-white/90 border-slate-100 shadow-sm',
    )}>
      <div className="w-10 h-10" />
      <div className="text-center">
        <h1 className={cn('text-xs font-black tracking-tight uppercase', isDark ? 'text-white' : 'text-slate-900')}>
          Live AI Monitor
        </h1>
        <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>
          Setup Guide
        </p>
      </div>
      <div className={cn(
        'w-10 h-10 rounded-2xl flex items-center justify-center border',
        isDark ? 'bg-[#C78200]/10 border-[#C78200]/20 text-[#C78200]' : 'bg-amber-50 border-amber-200 text-amber-600',
      )}>
        <Scan size={16} />
      </div>
    </div>

    <div className="pt-24 px-4 space-y-4">

      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#012B1D] via-[#02180F] to-[#051015] rounded-[2.5rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -right-6 -bottom-4 opacity-10">
          <Eye size={120} strokeWidth={0.5} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-[#C78200]/20 rounded-xl border border-[#C78200]/30 flex items-center justify-center">
              <Sparkles size={14} className="text-[#C78200]" />
            </div>
            <p className="text-[#C78200] text-[7px] font-black uppercase tracking-widest">AquaGrow · Smart Visibility AI</p>
          </div>
          <h2 className="text-white text-xl font-black tracking-tight leading-snug mb-2">
            AI that sees what<br />your eyes can't
          </h2>
          <p className="text-white/40 text-[9px] font-medium leading-relaxed">
            Point your camera at the pond and our AI scans every 5 seconds — detecting shrimp health, feeding response, and disease risk in real time.
          </p>
        </div>
      </motion.div>

      {/* Setup steps */}
      <div>
        <p className={cn('text-[7px] font-black uppercase tracking-widest mb-3 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
          Before You Start — 4 Steps
        </p>
        <div className="space-y-2">
          {SETUP_STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className={cn(
                'flex items-start gap-4 p-4 rounded-[1.75rem] border',
                isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm',
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 border',
                isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100',
              )}>
                {step.icon}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn(
                    'text-[6px] font-black uppercase tracking-widest w-4 h-4 rounded-full flex items-center justify-center',
                    isDark ? 'bg-white/10 text-white/50' : 'bg-slate-100 text-slate-500',
                  )}>
                    {i + 1}
                  </span>
                  <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                    {step.title}
                  </p>
                </div>
                <p className={cn('text-[9px] font-medium leading-relaxed', isDark ? 'text-white/35' : 'text-slate-500')}>
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* What AI scans */}
      <div>
        <p className={cn('text-[7px] font-black uppercase tracking-widest mb-3 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
          What the AI Scans
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SCAN_FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + 0.04 * i }}
              className={cn(
                'rounded-[1.5rem] border p-3.5 flex items-start gap-2.5',
                isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm',
              )}
            >
              <span className="text-lg flex-shrink-0 leading-none">{f.emoji}</span>
              <div className="min-w-0">
                <p className={cn('text-[9px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{f.label}</p>
                <p className={cn('text-[7px] font-medium mt-0.5 leading-relaxed', isDark ? 'text-white/30' : 'text-slate-400')}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className={cn(
          'rounded-[1.75rem] border p-4 space-y-2',
          isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200',
        )}
      >
        <p className="text-amber-600 text-[7px] font-black uppercase tracking-widest mb-1">💡 Pro Tips</p>
        {TIPS.map((tip, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
            <p className={cn('text-[9px] font-medium leading-relaxed', isDark ? 'text-white/50' : 'text-slate-600')}>{tip}</p>
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        className="pt-2"
      >
        <motion.button
          whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }}
          onClick={onStart}
          className="w-full bg-gradient-to-r from-[#C78200] to-[#E09400] text-white py-5 rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-[#C78200]/30 flex items-center justify-center gap-2.5"
        >
          <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
            <Scan size={13} />
          </div>
          Start Live Monitoring
        </motion.button>
        <p className={cn('text-center text-[7px] font-bold mt-2', isDark ? 'text-white/15' : 'text-slate-300')}>
          Camera permission will be requested on start
        </p>
      </motion.div>
    </div>
  </div>
);

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export const LiveMonitor = ({ user, t }: { user: User; t: Translations }) => {
  const navigate    = useNavigate();
  const { isPro, theme } = useData();
  const isDark      = theme === 'dark' || theme === 'midnight';

  // ── Instruction gate — show once per session ──
  const [showInstructions, setShowInstructions] = useState<boolean>(() => {
    return !sessionStorage.getItem('live_monitor_instructed');
  });

  const handleStartMonitoring = () => {
    sessionStorage.setItem('live_monitor_instructed', '1');
    setShowInstructions(false);
  };

  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const [stream,         setStream]         = useState<MediaStream | null>(null);
  const [isAnalyzing,    setIsAnalyzing]    = useState(false);
  const [lastUpdated,    setLastUpdated]    = useState<Date | null>(null);
  const [metrics,        setMetrics]        = useState({ activity: 85, health: 92, count: 1240 });
  const [cameraError,    setCameraError]    = useState<string | null>(null);
  const [analysisLabel,  setAnalysisLabel]  = useState('Analyzing Bio-Vibrations…');

  useEffect(() => {
    if (!isPro) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    let isMounted = true;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera not supported');
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (!isMounted) return;
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (err: any) {
        setCameraError(err.message || 'Camera access denied');
      }
    };

    const captureAndAnalyze = async () => {
      if (!isMounted) return;
      if (!videoRef.current || videoRef.current.readyState < 2) {
        timeoutId = setTimeout(captureAndAnalyze, 1000);
        return;
      }
      const w = videoRef.current.videoWidth, h = videoRef.current.videoHeight;
      if (!w || !h) { timeoutId = setTimeout(captureAndAnalyze, 1000); return; }

      const canvas     = canvasRef.current || document.createElement('canvas');
      canvas.width     = w; canvas.height = h;
      const ctx        = canvas.getContext('2d');
      if (!ctx) { timeoutId = setTimeout(captureAndAnalyze, 1000); return; }

      ctx.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.5);

      setIsAnalyzing(true);
      const labels = ['Scanning Behavior…', 'Detecting Bio-Markers…', 'Estimating Count…', 'Building Health Score…'];
      let li = 0;
      const lInt = setInterval(() => { setAnalysisLabel(labels[li++ % labels.length]); }, 1200);
      try {
        const result = await analyzeLiveStream(base64);
        if (isMounted && result) { setMetrics(result); setLastUpdated(new Date()); }
      } catch { /* silent */ }
      finally {
        clearInterval(lInt);
        if (isMounted) { setIsAnalyzing(false); timeoutId = setTimeout(captureAndAnalyze, 5000); }
      }
    };

    startCamera();
    captureAndAnalyze();

    return () => {
      isMounted = false;
      stream?.getTracks().forEach(t => t.stop());
      clearTimeout(timeoutId);
    };
  }, [isPro]);

  // ── Instruction gate (shown to ALL users, free & pro, once per session) ──
  if (showInstructions) {
    return <InstructionScreen isDark={isDark} onStart={handleStartMonitoring} />;
  }

  // ── FREE GATE — inline dialog overlay (no page redirect) ──
  if (!isPro) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Back button */}
        <div className="absolute top-[calc(env(safe-area-inset-top)+0.75rem)] left-4 z-20">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-11 h-11 bg-black/40 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/10"
          >
            <ChevronLeft size={20} />
          </motion.button>
        </div>

        {/* Blurred / dimmed locked camera preview */}
        <div className="absolute inset-0">
          {/* Fake camera static background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
          {/* Subtle animated scan effect */}
          <motion.div
            animate={{ top: ['5%', '95%', '5%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C78200]/30 to-transparent"
          />
          {/* HUD corners */}
          {[
            'top-[calc(env(safe-area-inset-top)+1rem)] left-6 border-t-2 border-l-2 rounded-tl-[2rem]',
            'top-[calc(env(safe-area-inset-top)+1rem)] right-6 border-t-2 border-r-2 rounded-tr-[2rem]',
            'bottom-[48%] left-6 border-b-2 border-l-2 rounded-bl-[2rem]',
            'bottom-[48%] right-6 border-b-2 border-r-2 rounded-br-[2rem]',
          ].map((cls, i) => (
            <div key={i} className={cn('absolute w-20 h-20 border-[#C78200]/20', cls)} />
          ))}
          {/* Lock icon badge */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="w-16 h-16 bg-[#C78200]/20 border border-[#C78200]/40 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl"
            >
              <Lock size={28} className="text-[#C78200]" />
            </motion.div>
            <div className="bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
              <p className="text-white/50 text-[7px] font-black uppercase tracking-widest">AI Vision Locked</p>
            </div>
          </div>
          {/* "LIVE" badge */}
          <div className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-4 flex items-center gap-2 bg-red-600/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-400/30">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span className="text-white text-[7px] font-black tracking-widest">LIVE</span>
          </div>
          {/* Blurred overlay on bottom half */}
          <div className="absolute bottom-0 left-0 right-0 h-[55%] bg-gradient-to-t from-black via-black/90 to-transparent" />
        </div>

        {/* ── Upgrade Dialog (bottom sheet) ── */}
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="absolute bottom-0 left-0 right-0 bg-[#0A1218]/95 backdrop-blur-2xl rounded-t-[2.5rem] border border-white/10 shadow-2xl px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
        >
          {/* Handle */}
          <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-4" />

          {/* Header row */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-[#C78200]/20 rounded-lg border border-[#C78200]/30 flex items-center justify-center">
                  <Sparkles size={11} className="text-[#C78200]" />
                </div>
                <p className="text-[#C78200] text-[7px] font-black uppercase tracking-widest">Pro Feature</p>
              </div>
              <h2 className="text-white text-[18px] font-black tracking-tight leading-tight">
                Unlock Smart<br />Visibility AI
              </h2>
            </div>
            <div className="bg-[#C78200]/10 border border-[#C78200]/20 rounded-2xl px-3 py-2 text-center">
              <p className="text-[#C78200] text-[18px] font-black leading-none">🔬</p>
              <p className="text-[#C78200] text-[6px] font-black uppercase tracking-widest mt-1">Live AI</p>
            </div>
          </div>

          <p className="text-white/40 text-[9px] font-medium leading-relaxed mb-4">
            Real-time AI scans your pond every 5 seconds — detecting feeding response, stress behaviour, and disease signals before they're visible to the eye.
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { emoji: '🏃', label: 'Activity Scan' },
              { emoji: '🍽️', label: 'Feed Response' },
              { emoji: '🔬', label: 'Pathogen Flag' },
              { emoji: '🧠', label: 'Stress Alert' },
              { emoji: '🐟', label: 'Biomass Count' },
              { emoji: '⚠️', label: 'Risk Score' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1"
              >
                <span className="text-[11px]">{f.emoji}</span>
                <span className="text-white/60 text-[8px] font-black tracking-tight">{f.label}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-2.5">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(-1)}
              className="flex-1 py-3.5 rounded-2xl border border-white/10 text-white/50 font-black text-[9px] uppercase tracking-widest"
            >
              Go Back
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => navigate('/subscription')}
              className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-[#C78200] to-[#E09400] text-white font-black text-[9px] uppercase tracking-widest shadow-xl shadow-[#C78200]/25 flex items-center justify-center gap-2"
            >
              <Sparkles size={12} /> Upgrade to Pro
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }


  // ── PRO: FULL CAMERA VIEW ──
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        {/* Camera feed */}
        <video ref={videoRef} autoPlay playsInline muted
          className="absolute inset-0 w-full h-full object-cover opacity-70" />
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera error */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center px-8">
              <AlertTriangle size={36} className="text-amber-400 mx-auto mb-3" />
              <p className="text-white font-black text-sm mb-1">Camera Unavailable</p>
              <p className="text-white/40 text-[9px] font-bold">{cameraError}</p>
            </div>
          </div>
        )}

        {/* ── HUD ── */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner brackets */}
          {[
            'top-[calc(env(safe-area-inset-top)+1rem)] left-6 border-t-2 border-l-2 rounded-tl-[2rem]',
            'top-[calc(env(safe-area-inset-top)+1rem)] right-6 border-t-2 border-r-2 rounded-tr-[2rem]',
            'bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-6 border-b-2 border-l-2 rounded-bl-[2rem]',
            'bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-6 border-b-2 border-r-2 rounded-br-[2rem]',
          ].map((cls, i) => (
            <div key={i} className={cn('absolute w-20 h-20 border-[#C78200]/50', cls)} />
          ))}

          {/* Scan cross-hairs */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[1px] h-full bg-white/5" />
          </div>
          <div className="absolute inset-0 flex items-center">
            <div className="h-[1px] w-full bg-white/5" />
          </div>

          {/* Scan line */}
          <motion.div
            animate={{ top: ['5%', '95%', '5%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C78200]/60 to-transparent"
          />

          {/* Floating data points */}
          <motion.div
            animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
            transition={{ duration: 9, repeat: Infinity }}
            className="absolute top-1/3 left-1/4"
          >
            <div className="w-3.5 h-3.5 border-2 border-emerald-400 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
            </div>
            <div className="absolute left-5 top-[-4px] whitespace-nowrap bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
              <p className="text-emerald-400 text-[6px] font-black uppercase tracking-widest">Normal</p>
              <p className="text-white text-[7px] font-bold">Pathogen: OK</p>
            </div>
          </motion.div>

          <motion.div
            animate={{ x: [0, -15, 0], y: [0, 30, 0] }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute bottom-1/3 right-1/4"
          >
            <div className="w-3.5 h-3.5 border-2 border-amber-400 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-amber-400 rounded-full animate-ping" />
            </div>
            <div className="absolute right-5 top-[-4px] whitespace-nowrap bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10 text-right">
              <p className="text-amber-400 text-[6px] font-black uppercase tracking-widest">Checking</p>
              <p className="text-white text-[7px] font-bold">Turbidity: 14.2</p>
            </div>
          </motion.div>

          {/* Analysis spinner */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4"
              >
                <div className="w-20 h-20 relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 border-4 border-[#C78200]/15 border-t-[#C78200] rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Scan size={28} className="text-[#C78200] animate-pulse" />
                  </div>
                </div>
                <div className="bg-black/70 backdrop-blur-xl px-5 py-2 rounded-2xl border border-white/10">
                  <p className="text-[#C78200] text-[8px] font-black uppercase tracking-[0.3em]">{analysisLabel}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── TOP BAR ── */}
        <div className="absolute top-[calc(env(safe-area-inset-top)+0.75rem)] left-4 right-4 flex justify-between items-start pointer-events-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { stream?.getTracks().forEach(t => t.stop()); navigate(-1); }}
            className="w-11 h-11 bg-black/40 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/10"
          >
            <ChevronLeft size={20} />
          </motion.button>

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2 bg-[#C78200]/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-[#C78200]/20">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              <span className="text-white text-[8px] font-black tracking-widest uppercase">Smart Visibility AI</span>
            </div>
            {lastUpdated && (
              <p className="text-white/40 text-[7px] font-black uppercase tracking-widest bg-black/40 backdrop-blur-md px-2 py-1 rounded-xl">
                Updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* ── BOTTOM METRICS ── */}
        <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-4 right-4">
          <div className="flex gap-2 mb-3">
            <MetricPillar
              label="Activity"
              value={`${metrics.activity}%`}
              sub={metrics.activity > 75 ? 'Active' : 'Low'}
              color={metrics.activity > 75 ? 'green' : 'amber'}
            />
            <MetricPillar
              label="Health"
              value={`${metrics.health}%`}
              sub={metrics.health > 80 ? 'Healthy' : 'Monitor'}
              color={metrics.health > 80 ? 'green' : metrics.health > 60 ? 'amber' : 'red'}
            />
            <MetricPillar
              label="Est. Count"
              value={`${metrics.count.toLocaleString()}`}
              sub="Visual proxy"
              color="blue"
            />
          </div>
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl px-4 py-2.5 border border-white/10 text-center">
            <p className="text-white/30 text-[7px] font-black uppercase tracking-widest">
              AI analysis every 5 seconds · Tap anywhere to pause
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
