import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Camera, Upload, RotateCcw, CheckCircle,
  AlertTriangle, XCircle, Droplets, Thermometer, FlaskConical,
  Waves, Activity, Info, Zap, RefreshCw, BookOpen, Bug,
  Lock, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/cn';
import { useData } from '../../context/DataContext';
import { analyzeWaterTest } from '../../services/geminiService';

// ─── WATER COLOR GUIDE ───────────────────────────────────────────────────────
const WATER_COLORS = [
  { key: 'LIGHT_GREEN',   emoji: '🟢', label: 'Light Green',   hex: '#86efac', bg: 'bg-green-100',   border: 'border-green-300',   text: 'text-green-800',   status: 'Healthy',   meaning: 'Balanced phytoplankton bloom — ideal pond condition' },
  { key: 'DARK_GREEN',    emoji: '🟩', label: 'Dark Green',    hex: '#16a34a', bg: 'bg-green-200',   border: 'border-green-500',   text: 'text-green-900',   status: 'Warning',   meaning: 'Excess algae — night DO crash, pH swing risk' },
  { key: 'BROWN',         emoji: '🟤', label: 'Brown / Tea',   hex: '#92400e', bg: 'bg-amber-100',   border: 'border-amber-400',   text: 'text-amber-900',   status: 'Monitor',   meaning: 'Diatoms or organic load — check NH₃ levels' },
  { key: 'BLACK',         emoji: '⚫', label: 'Black / Dark',  hex: '#1c1917', bg: 'bg-stone-200',   border: 'border-stone-600',   text: 'text-stone-900',   status: 'Critical',  meaning: 'Heavy organic waste, H₂S gas — emergency action' },
  { key: 'BLUE_GREEN',    emoji: '🔵', label: 'Blue-Green',    hex: '#0284c7', bg: 'bg-sky-100',     border: 'border-sky-400',     text: 'text-sky-900',     status: 'Danger',    meaning: 'Cyanobacteria bloom — toxin release, EMS risk' },
  { key: 'CLEAR',         emoji: '⚪', label: 'Clear Water',   hex: '#e0f2fe', bg: 'bg-slate-100',   border: 'border-slate-300',   text: 'text-slate-700',   status: 'Poor',      meaning: 'No plankton — weak shrimp, easy disease entry' },
  { key: 'MURKY_YELLOW',  emoji: '🟡', label: 'Yellow / Murky',hex: '#ca8a04', bg: 'bg-yellow-100',  border: 'border-yellow-400',  text: 'text-yellow-900',  status: 'Warning',   meaning: 'Turbidity / soil particles — gill stress' },
  { key: 'REDDISH',       emoji: '🔴', label: 'Red / Brown',   hex: '#b91c1c', bg: 'bg-red-100',     border: 'border-red-400',     text: 'text-red-900',     status: 'Warning',   meaning: 'Iron / flagellate bloom — metallic toxicity risk' },
];

const PARAM_CONFIG = {
  ph:          { label: 'pH Level',      emoji: '🧪', icon: <FlaskConical size={16} />, unit: '',      safe: '7.5–8.5',  opt: '7.8–8.3' },
  do_:         { label: 'Dissolved O₂',  emoji: '💧', icon: <Waves size={16} />,        unit: 'mg/L',  safe: '>5 mg/L',  opt: '6–8 mg/L' },
  ammonia:     { label: 'Ammonia (NH₃)', emoji: '⚗️', icon: <Activity size={16} />,     unit: 'mg/L',  safe: '<0.1',      opt: '<0.05' },
  salinity:    { label: 'Salinity',      emoji: '🌊', icon: <Droplets size={16} />,     unit: 'ppt',   safe: '10–25 ppt', opt: '15–20 ppt' },
  temperature: { label: 'Temperature',   emoji: '🌡️', icon: <Thermometer size={16} />,  unit: '°C',    safe: '23–31°C',   opt: '27–30°C' },
};

const STATUS_STYLE = {
  safe:     { bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700',  badge: 'bg-emerald-100 text-emerald-700',  icon: <CheckCircle size={13} />   },
  warning:  { bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-700',    badge: 'bg-amber-100 text-amber-700',      icon: <AlertTriangle size={13} /> },
  critical: { bg: 'bg-red-50',      border: 'border-red-200',     text: 'text-red-700',      badge: 'bg-red-100 text-red-700',          icon: <XCircle size={13} />       },
  unknown:  { bg: 'bg-slate-50',    border: 'border-slate-200',   text: 'text-slate-500',    badge: 'bg-slate-100 text-slate-500',      icon: <Info size={13} />          },
};

const OVERALL_HERO = {
  excellent: { grad: 'from-emerald-600 to-teal-700',  emoji: '✅', label: 'Excellent' },
  good:      { grad: 'from-blue-600 to-emerald-700',  emoji: '👍', label: 'Good'      },
  warning:   { grad: 'from-amber-500 to-orange-600',  emoji: '⚠️', label: 'Warning'   },
  critical:  { grad: 'from-red-600 to-red-900',       emoji: '🚨', label: 'Critical'  },
};

export function WaterTestScanner() {
  const navigate = useNavigate();
  const fileRef  = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isPro, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [mode,          setMode]          = useState<'color' | 'kit'>('color');
  const [step,          setStep]          = useState<'guide' | 'scanning' | 'result'>('guide');
  const [image,         setImage]         = useState<string | null>(null);
  const [result,        setResult]        = useState<any | null>(null);
  const [loadingMsg,    setLoadingMsg]    = useState('');
  const [isCamActive,   setIsCamActive]   = useState(false);
  const [stream,        setStream]        = useState<MediaStream | null>(null);
  const [expandParam,   setExpandParam]   = useState<string | null>(null);
  const [error,         setError]         = useState<string | null>(null);

  const handleScanAttempt = (action: () => void) => {
    if (!isPro) { setShowLimitDialog(true); return; }
    action();
  };

  // Wire stream to always-mounted video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Rotate scanning messages
  useEffect(() => {
    if (step !== 'scanning') return;
    const msgs = [
      'Reading water colour…', 'Identifying phytoplankton…',
      'Checking parameter values…', 'Cross-referencing disease risks…',
      'Generating SOP plan…',
    ];
    let i = 0;
    const iv = setInterval(() => setLoadingMsg(msgs[i++ % msgs.length]), 1800);
    return () => clearInterval(iv);
  }, [step]);

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(ms);
      setIsCamActive(true);
    } catch {
      setError('Camera access denied. Please allow camera permission and try again.');
    }
  };

  const stopCamera = () => { stream?.getTracks().forEach(t => t.stop()); setStream(null); setIsCamActive(false); };

  const capturePhoto = () => {
    if (!videoRef.current || videoRef.current.readyState < 2) return;
    const c = document.createElement('canvas');
    c.width = videoRef.current.videoWidth;
    c.height = videoRef.current.videoHeight;
    c.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const url = c.toDataURL('image/jpeg', 0.9);
    stopCamera();
    runAnalysis(url);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => runAnalysis(reader.result as string);
    reader.readAsDataURL(file);
  };

  const runAnalysis = async (img: string) => {
    setImage(img); setStep('scanning'); setError(null);
    try {
      const res = await analyzeWaterTest(img);
      setResult(res);
      setStep('result');
    } catch (err: any) {
      const is503 = err?.message?.includes('overloaded') || err?.message?.includes('503');
      setError(is503 ? '🔴 AI server busy. Wait 30–60 seconds and try again.' : (err?.message || 'Analysis failed.'));
      setStep('guide');
    }
  };

  const reset = () => { stopCamera(); setStep('guide'); setImage(null); setResult(null); setError(null); setExpandParam(null); };

  const waterColorInfo = result?.waterColor
    ? WATER_COLORS.find(c => c.key === result.waterColor.detected) || null
    : null;

  return (
    <div className="min-h-screen bg-paper pb-12">

      {/* ── Inline limit dialog (non-Pro gate) ── */}
      <AnimatePresence>
        {showLimitDialog && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={() => setShowLimitDialog(false)}
            />
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-[70] bg-[#0A1218]/97 backdrop-blur-2xl rounded-t-[2.5rem] border border-white/10 shadow-2xl px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
            >
              <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-4" />
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-[#C78200]/20 rounded-lg border border-[#C78200]/30 flex items-center justify-center">
                      <Sparkles size={11} className="text-[#C78200]" />
                    </div>
                    <p className="text-[#C78200] text-[7px] font-black uppercase tracking-widest">Pro Feature</p>
                  </div>
                  <h2 className="text-white text-[18px] font-black tracking-tight leading-tight">
                    Unlock AI<br />Water Scanner
                  </h2>
                </div>
                <div className="bg-[#C78200]/10 border border-[#C78200]/20 rounded-2xl px-3 py-2 text-center">
                  <p className="text-[22px] leading-none">💧</p>
                  <p className="text-[#C78200] text-[6px] font-black uppercase tracking-widest mt-1">Water AI</p>
                </div>
              </div>
              <p className="text-white/40 text-[9px] font-medium leading-relaxed mb-4">
                AI reads your pond water colour or test kit photo and instantly diagnoses pH, DO, ammonia, salinity, disease risks and corrective SOP actions.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {['🟢 Light Green', '⚫ Black Water', '🔵 Cyanobacteria', '🧪 pH Check', '💧 DO Level', '⚗️ Ammonia'].map((c, i) => (
                  <motion.span key={i}
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.06 * i }}
                    className="bg-white/5 border border-white/10 text-white/60 text-[8px] font-black px-2.5 py-1 rounded-full"
                  >{c}</motion.span>
                ))}
              </div>
              <div className="flex gap-2.5">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowLimitDialog(false)}
                  className="flex-1 py-3.5 rounded-2xl border border-white/10 text-white/50 font-black text-[9px] uppercase tracking-widest">
                  Close
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }}
                  onClick={() => { setShowLimitDialog(false); navigate('/subscription'); }}
                  className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-[#C78200] to-[#E09400] text-white font-black text-[9px] uppercase tracking-widest shadow-xl shadow-[#C78200]/25 flex items-center justify-center gap-2">
                  <Sparkles size={12} /> Upgrade to Pro
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ FULL-SCREEN CAMERA OVERLAY ═══ */}
      <AnimatePresence>
        {isCamActive && (
          <motion.div key="cam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col">

            {/* Video — always mounted, stream wired via useEffect */}
            <video ref={videoRef} autoPlay playsInline muted
              className="flex-1 w-full object-cover" />

            {/* Framing overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {/* Top/bottom dark bars */}
              <div className="absolute top-0 left-0 right-0 h-[18%] bg-black/60" />
              <div className="absolute bottom-0 left-0 right-0 h-[22%] bg-black/70" />

              {/* Corner frame */}
              <div className="relative w-[78%] aspect-[4/3]">
                {[['top-0 left-0','border-t-2 border-l-2 rounded-tl-xl'],
                  ['top-0 right-0','border-t-2 border-r-2 rounded-tr-xl'],
                  ['bottom-0 left-0','border-b-2 border-l-2 rounded-bl-xl'],
                  ['bottom-0 right-0','border-b-2 border-r-2 rounded-br-xl']
                ].map(([pos, cls]) => (
                  <div key={pos} className={`absolute ${pos} w-8 h-8 border-emerald-400 ${cls}`} />
                ))}
                {/* Scan line */}
                <motion.div
                  animate={{ top: ['8%','88%','8%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ position: 'absolute' }}
                  className="left-0 right-0 h-[2px] bg-emerald-400/70 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                />
              </div>

              <p className="text-white/80 text-[9px] font-black uppercase tracking-[0.2em] mt-4 bg-black/50 px-4 py-1.5 rounded-full">
                {mode === 'color' ? '📷 Point at pond water surface' : '📷 Fill frame with test kit'}
              </p>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 pb-safe">
              <div className="flex items-center justify-between px-10 py-6">
                {/* Cancel */}
                <button onClick={stopCamera}
                  className="w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm">
                  <XCircle size={22} className="text-white" />
                </button>

                {/* Capture */}
                <motion.button whileTap={{ scale: 0.93 }} onClick={capturePhoto}
                  className="w-20 h-20 rounded-full bg-white border-4 border-emerald-400 flex items-center justify-center shadow-2xl shadow-emerald-900/50">
                  <div className="w-14 h-14 rounded-full bg-emerald-500" />
                </motion.button>

                {/* Flip placeholder (visually balanced) */}
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <Camera size={18} className="text-white/60" />
                </div>
              </div>

              <p className="text-white/30 text-[7px] font-black uppercase tracking-widest text-center pb-4">
                Tap the white button to capture
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden video ref fallback (keeps ref alive when overlay unmounts) */}
      <video ref={videoRef} className="hidden" autoPlay playsInline muted />

      {/* HEADER */}
      <div className="sticky top-0 z-50 px-5 pt-12 pb-4 flex items-center gap-4"
        style={{ background: 'linear-gradient(160deg,#022b1e 0%,#011a12 100%)' }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div className="flex-1">
          <p className="text-emerald-400 text-[6px] font-black uppercase tracking-[0.3em]">AI Water Lab</p>
          <h1 className="text-white font-black text-lg tracking-tight">Water Test Scanner</h1>
        </div>
        {step === 'result' && (
          <button onClick={reset} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <RefreshCw size={18} className="text-white" />
          </button>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* ERROR */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-[10px] font-semibold leading-relaxed">{error}</p>
          </motion.div>
        )}

        {/* ═══════════════ GUIDE STEP ═══════════════ */}
        {step === 'guide' && (
          <motion.div key="guide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {/* Mode toggle */}
            <div className="bg-card border border-card-border rounded-[2rem] p-2 grid grid-cols-2 gap-1">
              {[
                { key: 'color', label: '🎨 Water Colour', sub: 'Photo your pond water' },
                { key: 'kit',   label: '🧪 Test Kit',     sub: 'Photo your test strip/meter' },
              ].map(m => (
                <button key={m.key} onClick={() => setMode(m.key as any)}
                  className={cn('rounded-2xl py-3 px-3 transition-all text-left',
                    mode === m.key ? 'bg-[#022b1e] text-white' : 'text-ink/60')}>
                  <p className="text-[10px] font-black">{m.label}</p>
                  <p className={cn('text-[7px] font-medium', mode === m.key ? 'text-white/50' : 'text-ink/30')}>{m.sub}</p>
                </button>
              ))}
            </div>

            {/* Hero */}
            <div className="rounded-[2.5rem] overflow-hidden relative p-6"
              style={{ background: 'linear-gradient(135deg,#022b1e 0%,#0d3b29 100%)' }}>
              <div className="absolute right-0 top-0 text-[100px] opacity-5 select-none">
                {mode === 'color' ? '🌊' : '🧪'}
              </div>
              <div className="relative z-10">
                <p className="text-emerald-400 text-[6px] font-black uppercase tracking-[0.4em] mb-1">AI-Powered Diagnosis</p>
                <h2 className="text-white font-black text-xl tracking-tight leading-tight mb-2">
                  {mode === 'color' ? 'Water Colour\nDiagnosis' : 'Test Kit\nScanner'}
                </h2>
                <p className="text-white/40 text-[9px] leading-relaxed mb-4">
                  {mode === 'color'
                    ? 'AI identifies your pond water colour and immediately diagnoses phytoplankton health, disease risks and corrective SOP actions.'
                    : 'Photograph test strips, API kit vials, digital meters or refractometers. AI reads all values and checks against shrimp-safe ranges.'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(mode === 'color'
                    ? ['Light Green ✅', 'Dark Green ⚠️', 'Brown', 'Black 🚨', 'Blue-Green', 'Clear']
                    : ['pH', 'DO', 'Ammonia', 'Salinity', 'Temp']
                  ).map(t => (
                    <span key={t} className="bg-white/10 text-white/60 text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Water color guide (visible in color mode) */}
            {mode === 'color' && (
              <div className="bg-card border border-card-border rounded-[2rem] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={14} className="text-emerald-500" />
                  <p className="text-ink font-black text-[9px] uppercase tracking-widest">Colour → Problem Guide</p>
                </div>
                <div className="space-y-2">
                  {WATER_COLORS.map(c => (
                    <div key={c.key} className={cn('flex items-center gap-3 rounded-xl px-3 py-2 border', c.bg, c.border)}>
                      <span className="text-lg flex-shrink-0">{c.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-[9px] font-black', c.text)}>{c.label}</p>
                        <p className="text-ink/40 text-[7px] font-medium leading-snug truncate">{c.meaning}</p>
                      </div>
                      <span className={cn('text-[5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-current', c.text)}>{c.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Capture buttons */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleScanAttempt(startCamera)}
                className="bg-[#022b1e] text-white rounded-[2rem] py-5 flex flex-col items-center gap-2 border border-emerald-900">
                <Camera size={24} className="text-emerald-400" />
                <span className="text-[9px] font-black uppercase tracking-widest">Open Camera</span>
                <span className="text-white/30 text-[7px]">Live rear camera</span>
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleScanAttempt(() => fileRef.current?.click())}
                className="bg-card border border-card-border text-ink rounded-[2rem] py-5 flex flex-col items-center gap-2">
                <Upload size={24} className="text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest">Upload Photo</span>
                <span className="text-ink/30 text-[7px]">Gallery image</span>
              </motion.button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

            {/* Tips */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-amber-700 text-[7px] font-black uppercase tracking-widest mb-2">📸 Photo Tips</p>
              <ul className="space-y-1">
                {mode === 'color' ? [
                  'Take photo in daylight — natural light shows true water colour',
                  'Fill the frame with the pond water surface',
                  'Avoid shadows or reflections on the water',
                  'Early morning light gives most accurate colour reading',
                ] : [
                  'Place test strip next to the colour reference card',
                  'Good lighting — no blur on the reading values',
                  'Fill frame with the test equipment display',
                  'For refractometer — hold up to bright light before shooting',
                ].map((tip, i) => (
                  <li key={i} className="text-amber-800/70 text-[8px] font-medium flex gap-1.5">
                    <span className="text-amber-500">•</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ SCANNING ═══════════════ */}
        {step === 'scanning' && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {image && (
              <div className="rounded-[2rem] overflow-hidden border border-emerald-500/20 relative">
                <img src={image} alt="Scan" className="w-full aspect-video object-cover" />
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-white font-black text-sm">{loadingMsg}</p>
                  <div className="flex gap-1 mt-2">
                    {[0,1,2].map(i => (
                      <motion.div key={i} animate={{ opacity: [0.3,1,0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i*0.4 }}
                        className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    ))}
                  </div>
                </div>
                <motion.div animate={{ top: ['0%','100%','0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  style={{ position: 'absolute' }}
                  className="left-0 right-0 h-0.5 bg-emerald-400/50 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              </div>
            )}
            <div className="bg-card border border-card-border rounded-[2rem] p-5 space-y-2">
              <p className="text-ink/30 text-[7px] font-black uppercase tracking-widest text-center mb-3">AI Analysis</p>
              {['Water Colour', 'pH Level', 'Dissolved O₂', 'Ammonia', 'Disease Risk'].map((label, i) => (
                <motion.div key={label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12 }} className="flex items-center gap-3">
                  <p className="text-ink/40 text-[7px] font-black uppercase w-20 flex-shrink-0">{label}</p>
                  <div className="flex-1 h-1 bg-paper rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '100%' }}
                      transition={{ duration: 2.5, delay: i * 0.2, ease: 'easeOut' }}
                      className="h-full bg-emerald-400 rounded-full" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════════════ RESULT ═══════════════ */}
        {step === 'result' && result && (() => {
          const overall    = OVERALL_HERO[result.overallStatus as keyof typeof OVERALL_HERO] || OVERALL_HERO.warning;
          const critCount  = ['ph','do_','ammonia','salinity','temperature'].filter(k => {
            const p = result[k]; return p?.status === 'critical';
          }).length;

          // ── NOT DETECTED ─────────────────────────────────────
          if (result.imageValid === false) {
            return (
              <motion.div key="not-detected" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                {/* Thumbnail dimmed */}
                {image && (
                  <div className="relative rounded-[2rem] overflow-hidden">
                    <img src={image} alt="Uploaded" className="w-full aspect-video object-cover opacity-50" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2 flex items-center gap-2">
                        <span className="text-2xl">❌</span>
                        <span className="text-white text-[9px] font-black uppercase tracking-widest">Water / Test Kit Not Detected</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Not detected card */}
                <div className="rounded-[2.5rem] border border-slate-200 bg-slate-50 p-6 relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-6xl opacity-8 select-none">💧</div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400">
                        <FlaskConical size={22} />
                      </div>
                      <div>
                        <p className="text-slate-400 text-[6px] font-black uppercase tracking-[0.3em]">AI Scan Result</p>
                        <h2 className="text-slate-800 font-black text-lg tracking-tight">Water Not Detected</h2>
                      </div>
                    </div>

                    {result.notDetectedReason && (
                      <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4">
                        <p className="text-slate-400 text-[6px] font-black uppercase tracking-widest mb-1">What AI Saw in Your Photo</p>
                        <p className="text-slate-600 text-[10px] font-medium leading-relaxed">{result.notDetectedReason}</p>
                      </div>
                    )}

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
                      <p className="text-amber-700 text-[7px] font-black uppercase tracking-widest mb-2">📸 How to get a valid scan</p>
                      {(mode === 'color' ? [
                        'Point camera directly at the pond water surface',
                        'Use natural daylight — avoid shadows on water',
                        'Fill the frame with water, not surroundings',
                        'Avoid taking photo of dry land or equipment only',
                      ] : [
                        'Place test strip / vial in clear view, fill the frame',
                        'Ensure reading scale or colour bands are visible',
                        'Good lighting — avoid glare on digital displays',
                        'For meter screens — zoom in so digits are readable',
                      ]).map((tip, i) => (
                        <div key={i} className="flex gap-2 items-start mb-1">
                          <span className="text-amber-500 font-black text-[8px] flex-shrink-0">{i + 1}.</span>
                          <p className="text-amber-800/70 text-[8px] font-medium">{tip}</p>
                        </div>
                      ))}
                    </div>

                    <button onClick={reset}
                      className="w-full rounded-[2rem] py-4 font-black text-[10px] uppercase tracking-widest text-white flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg,#022b1e,#011a12)' }}>
                      <Camera size={14} className="text-emerald-400" /> Scan Again
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          }

          // ── NORMAL RESULT ─────────────────────────────────────
          return (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

              {/* Overall hero */}
              <div className={cn('rounded-[2.5rem] p-6 bg-gradient-to-br text-white relative overflow-hidden', overall.grad)}>
                <div className="absolute right-4 top-4 text-5xl opacity-20">{overall.emoji}</div>
                <div className="relative z-10">
                  <p className="text-white/40 text-[6px] font-black uppercase tracking-[0.4em] mb-1">Water Quality Status</p>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{overall.emoji}</span>
                    <div>
                      <h2 className="text-white font-black text-2xl tracking-tight">{overall.label}</h2>
                      <p className="text-white/50 text-[8px] font-medium">{result.summary?.split('.')[0]}.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/20 rounded-full">
                      <div className="h-full bg-white rounded-full" style={{ width: `${result.confidence || 70}%` }} />
                    </div>
                    <span className="text-white/50 text-[7px] font-black">{result.confidence || 70}% confidence</span>
                  </div>
                </div>
              </div>

              {/* Water Colour Card */}
              {result.waterColor && (() => {
                const wc = WATER_COLORS.find(c => c.key === result.waterColor.detected) || null;
                return (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className={cn('rounded-[2rem] border p-5', wc?.bg || 'bg-card', wc?.border || 'border-card-border')}>
                    <p className={cn('text-[6px] font-black uppercase tracking-[0.3em] mb-2', wc?.text || 'text-ink/40')}>
                      🎨 Detected Water Colour
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ backgroundColor: result.waterColor.hex || wc?.hex || '#e5e7eb', borderColor: wc?.hex || '#9ca3af' }}>
                        {wc?.emoji || '💧'}
                      </div>
                      <div className="flex-1">
                        <h3 className={cn('font-black text-base tracking-tight', wc?.text || 'text-ink')}>
                          {result.waterColor.label || wc?.label}
                        </h3>
                        <p className="text-ink/50 text-[8px] font-medium leading-relaxed mt-0.5">
                          {result.waterColor.meaning || wc?.meaning}
                        </p>
                      </div>
                      <span className={cn('text-[6px] font-black uppercase tracking-widest px-2 py-1 rounded-full border', wc?.text || 'text-ink', wc?.border || 'border-card-border')}>
                        {wc?.status || result.waterColor.status}
                      </span>
                    </div>
                  </motion.div>
                );
              })()}

              {/* Problems Identified */}
              {result.problems?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="bg-orange-50 border border-orange-200 rounded-[2rem] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} className="text-orange-500" />
                    <p className="text-orange-700 font-black text-[9px] uppercase tracking-widest">Problems Detected</p>
                  </div>
                  <div className="space-y-2">
                    {result.problems.map((p: string, i: number) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="text-orange-400 text-[9px] font-black flex-shrink-0">⚠</span>
                        <p className="text-orange-800/70 text-[9px] font-medium leading-relaxed">{p}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Disease Risks */}
              {result.diseaseRisks?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="bg-red-50 border border-red-200 rounded-[2rem] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Bug size={16} className="text-red-500" />
                    <p className="text-red-700 font-black text-[9px] uppercase tracking-widest">Disease Risks</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.diseaseRisks.map((d: string, i: number) => (
                      <span key={i} className="bg-red-100 border border-red-200 text-red-700 text-[8px] font-black px-2.5 py-1 rounded-full">
                        🦠 {d}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Urgent Action */}
              {critCount > 0 && result.urgentAction && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-300 rounded-2xl p-4 flex gap-3">
                  <Zap size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-600 text-[6px] font-black uppercase tracking-widest mb-1">🚨 Urgent Action</p>
                    <p className="text-red-800 text-[10px] font-semibold leading-relaxed">{result.urgentAction}</p>
                  </div>
                </motion.div>
              )}

              {/* Parameter readings */}
              <div className="space-y-2">
                <p className="text-ink/30 text-[7px] font-black uppercase tracking-widest px-1">Parameter Readings</p>
                {(Object.entries(PARAM_CONFIG) as [string, any][]).map(([key, cfg], i) => {
                  const param = result[key];
                  if (!param) return null;
                  const st = STATUS_STYLE[param.status as keyof typeof STATUS_STYLE] || STATUS_STYLE.unknown;
                  const isExpanded = expandParam === key;
                  return (
                    <motion.div key={key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={cn('rounded-[1.8rem] border overflow-hidden', st.bg, st.border)}>
                      <button className="w-full p-4 flex items-center gap-3 text-left"
                        onClick={() => setExpandParam(isExpanded ? null : key)}>
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          param.status === 'safe' ? 'bg-emerald-100 text-emerald-600' :
                          param.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                          param.status === 'critical' ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-400')}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-[6px] font-black uppercase tracking-widest text-ink/40">{cfg.emoji} {cfg.label}</p>
                          <p className={cn('font-black text-lg leading-tight', st.text)}>
                            {param.raw || '—'}{param.value && cfg.unit ? ` ${cfg.unit}` : ''}
                          </p>
                          <p className="text-ink/30 text-[5px] font-black uppercase tracking-widest">Safe: {cfg.safe}</p>
                        </div>
                        <div className={cn('px-2 py-1 rounded-full flex items-center gap-1 text-[6px] font-black uppercase', st.badge)}>
                          {st.icon} {param.status}
                        </div>
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-4 pt-2 border-t border-current/10 grid grid-cols-2 gap-2">
                              <div className="bg-white/60 rounded-xl p-2.5">
                                <p className="text-[5px] font-black uppercase text-ink/30">Safe Range</p>
                                <p className="text-ink font-black text-[9px] mt-0.5">{cfg.safe}</p>
                              </div>
                              <div className="bg-emerald-50 rounded-xl p-2.5">
                                <p className="text-[5px] font-black uppercase text-emerald-500/50">Optimal</p>
                                <p className="text-emerald-700 font-black text-[9px] mt-0.5">{cfg.opt}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              {/* SOP Recommendations */}
              {result.recommendations?.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={16} className="text-emerald-500" />
                    <p className="text-emerald-700 font-black text-[9px] uppercase tracking-widest">SOP Actions</p>
                  </div>
                  <div className="space-y-2">
                    {result.recommendations.map((r: string, i: number) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="text-emerald-500 font-black text-[8px] flex-shrink-0 mt-0.5">{i + 1}.</span>
                        <p className="text-emerald-800/70 text-[9px] font-medium leading-relaxed">{r}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Summary */}
              {result.summary && (
                <div className="bg-card border border-card-border rounded-[2rem] p-4">
                  <p className="text-ink/30 text-[6px] font-black uppercase tracking-widest mb-2">AI Expert Assessment</p>
                  <p className="text-ink text-[10px] font-semibold leading-relaxed">{result.summary}</p>
                  <p className="text-ink/30 text-[6px] font-black uppercase tracking-widest mt-2">
                    📷 {result.detectedEquipment}
                  </p>
                </div>
              )}

              {/* Captured image */}
              {image && (
                <div className="bg-card border border-card-border rounded-2xl p-3 flex items-center gap-3">
                  <img src={image} alt="Test" className="w-14 h-10 object-cover rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-ink font-black text-[9px]">Scanned Image</p>
                    <p className="text-ink/30 text-[7px]">{result.detectedEquipment}</p>
                  </div>
                  <button onClick={reset} className="bg-paper border border-card-border rounded-xl px-3 py-1.5">
                    <span className="text-[7px] font-black text-ink/40 uppercase tracking-widest">Retake</span>
                  </button>
                </div>
              )}

              <button onClick={() => navigate('/monitor')}
                className="w-full bg-[#022b1e] text-white rounded-[2rem] py-4 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                <Droplets size={15} className="text-emerald-400" />
                Log to Pond Water Monitor
              </button>
              <button onClick={reset}
                className="w-full bg-card border border-card-border text-ink rounded-[2rem] py-4 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                <RotateCcw size={15} />
                Scan Again
              </button>
            </motion.div>
          );
        })()}
      </div>
    </div>
  );
}
