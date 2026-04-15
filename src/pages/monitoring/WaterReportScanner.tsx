import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Upload,
  Scan,
  CheckCircle2,
  X,
  ChevronRight,
  FileText,
  Droplets,
  FlaskConical,
  Thermometer,
  Waves,
  AlertTriangle,
  Info,
  ArrowRight,
  ZoomIn,
  Sun,
  RefreshCw,
  ClipboardList,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Header } from '../../components/Header';
import { useBottomSheet } from '../../context/BottomSheetContext';
import { useData } from '../../context/DataContext';
import type { Translations } from '../../translations';

interface Props {
  t: Translations;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
type ScanStatus = 'guide' | 'camera' | 'processing' | 'result';

interface ParsedReport {
  ph: number;
  do: number;
  ammonia: number;
  salinity: number;
  temperature: number;
  alkalinity?: number;
  turbidity?: string;
}

const getQuality = (key: string, value: number) => {
  const ranges: Record<string, { ok: [number, number]; warn: [number, number] }> = {
    ph:          { ok: [7.5, 8.3], warn: [7.0, 8.5] },
    do:          { ok: [5.0, 9.0], warn: [4.0, 9.0] },
    ammonia:     { ok: [0, 0.25],  warn: [0, 0.5] },
    salinity:    { ok: [10, 25],   warn: [5, 35] },
    temperature: { ok: [26, 30],   warn: [24, 32] },
  };
  const r = ranges[key];
  if (!r) return 'good';
  if (value >= r.ok[0] && value <= r.ok[1]) return 'good';
  if (value >= r.warn[0] && value <= r.warn[1]) return 'warn';
  return 'bad';
};

const qualityStyle = (q: string, isDark: boolean) => ({
  good: { bg: isDark ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200', text: 'text-emerald-500', badge: 'bg-emerald-500', label: 'OPTIMAL' },
  warn: { bg: isDark ? 'bg-amber-500/15 border-amber-500/30'   : 'bg-amber-50 border-amber-200',   text: 'text-amber-500',   badge: 'bg-amber-500',   label: 'CAUTION' },
  bad:  { bg: isDark ? 'bg-red-500/15 border-red-500/30'       : 'bg-red-50 border-red-200',       text: 'text-red-500',     badge: 'bg-red-500',     label: 'CRITICAL' },
}[q] || { bg: '', text: 'text-white', badge: 'bg-slate-500', label: 'N/A' });

// ─── Main Component ──────────────────────────────────────────────────────────
export const WaterReportScanner = ({ t }: Props) => {
  const navigate = useNavigate();
  const { theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openBottomSheet, closeBottomSheet } = useBottomSheet();

  const [stream, setStream]       = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [status, setStatus]       = useState<ScanStatus>('guide');
  const [scannedData, setScannedData] = useState<ParsedReport | null>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const [guideStep, setGuideStep] = useState(0);

  const PROCESSING_STEPS = [
    'Detecting document edges…',
    'Extracting table data via OCR…',
    'Parsing parameter values…',
    'Running AquaGrow AI analysis…',
    'Generating quality report…',
  ];

  // ── Camera helpers ──────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setCameraError(false);
    } catch {
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  };

  useEffect(() => {
    openBottomSheet();
    return () => { closeBottomSheet(); stopCamera(); };
  }, []);

  useEffect(() => {
    if (status === 'camera' && !cameraError) startCamera();
    if (status !== 'camera') stopCamera();
  }, [status]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  // ── Simulate AI parsing ─────────────────────────────────────────────────────
  const runProcessing = () => {
    setStatus('processing');
    setProcessingStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setProcessingStep(step);
      if (step >= PROCESSING_STEPS.length) {
        clearInterval(interval);
        setTimeout(() => {
          setScannedData({
            ph:          7.82,
            do:          5.64,
            ammonia:     0.08,
            salinity:    14.5,
            temperature: 28.2,
            alkalinity:  140,
            turbidity:   'Clear',
          });
          setStatus('result');
        }, 500);
      }
    }, 700);
  };

  const handleScan = () => {
    captureFrame();
    runProcessing();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) runProcessing();
  };

  // ── Guide steps content ─────────────────────────────────────────────────────
  const guideSteps = [
    {
      icon: FileText,
      color: '#3B82F6',
      title: 'Prepare Your Lab Report',
      desc: 'Have your printed or digital water quality lab report ready. This scanner works with reports from certified aquaculture labs (MPEDA, CIBA, NACA, State Fisheries Labs).',
      tips: [
        'Printout or phone screenshot both work',
        'Ensure the report shows: pH, DO, Ammonia, Salinity, Temperature',
        'Report date should be within last 7 days for accuracy',
      ],
    },
    {
      icon: Sun,
      color: '#F59E0B',
      title: 'Lighting & Environment',
      desc: 'Good lighting is critical for accurate OCR. Avoid shadows falling across the text. Natural daylight or bright indoor light works best.',
      tips: [
        'Place report on a flat, dark-coloured surface',
        'No direct sunlight glare or reflections on paper',
        'Turn on all room lights if indoors',
        'Disable flash — it causes overexposure on white paper',
      ],
    },
    {
      icon: ZoomIn,
      color: '#8B5CF6',
      title: 'Framing the Report',
      desc: 'Align the entire parameter table inside the green viewfinder box. The scanner needs to see all column headers and values clearly.',
      tips: [
        'Hold phone 20–30 cm above the report',
        'Keep the phone perfectly parallel to the paper (no tilt)',
        'Ensure all 4 corners of the table are inside the frame',
        'The entire table must be visible — not cropped at edges',
      ],
    },
    {
      icon: Camera,
      color: '#10B981',
      title: 'Capture & Upload',
      desc: 'You can either use the live camera scanner or upload a saved photo/PDF of your report. Both methods use the same AI extraction engine.',
      tips: [
        'Tap the green camera button when the frame is steady',
        'Or tap ↑ Upload to select a saved image or PDF',
        'Hold your breath for 1–2 seconds before tapping — camera shake causes blurs',
        'If the scan fails, retake from a slightly closer distance',
      ],
    },
  ];

  const currentGuide = guideSteps[guideStep];
  const GuideIcon = currentGuide.icon;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className={cn('min-h-[100dvh] flex flex-col font-sans relative', isDark ? 'bg-[#030E1B]' : 'bg-[#F0F8FF]')}>
      <Header
        title="Water Report Scanner"
        showBack
        onBack={() => status === 'camera' ? setStatus('guide') : navigate(-1)}
      />

      <div className="flex-1 pt-[calc(env(safe-area-inset-top)+4rem)] overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ══════════════════ GUIDE SCREEN ══════════════════ */}
          {status === 'guide' && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col min-h-full px-5 pb-10"
            >
              {/* Header badge */}
              <div className="flex items-center justify-between py-4">
                <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl border', isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200')}>
                  <ClipboardList size={12} className="text-blue-500" />
                  <span className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-blue-400' : 'text-blue-700')}>Step {guideStep + 1} of {guideSteps.length}</span>
                </div>
                {/* Step dots */}
                <div className="flex items-center gap-1.5">
                  {guideSteps.map((_, i) => (
                    <button key={i} onClick={() => setGuideStep(i)}
                      className={cn('rounded-full transition-all', i === guideStep ? 'w-5 h-2' : 'w-2 h-2')}
                      style={{ background: i <= guideStep ? currentGuide.color : isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}
                    />
                  ))}
                </div>
              </div>

              {/* Big icon */}
              <motion.div
                key={guideStep}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-6"
              >
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center mb-5 shadow-2xl"
                  style={{ background: `${currentGuide.color}20`, border: `2px solid ${currentGuide.color}30` }}
                >
                  <GuideIcon size={40} style={{ color: currentGuide.color }} />
                </div>
                <h2 className={cn('text-xl font-black tracking-tight text-center mb-2', isDark ? 'text-white' : 'text-slate-900')}>{currentGuide.title}</h2>
                <p className={cn('text-[11px] font-medium text-center leading-relaxed px-2', isDark ? 'text-white/50' : 'text-slate-500')}>{currentGuide.desc}</p>
              </motion.div>

              {/* Tips card */}
              <motion.div
                key={`tips-${guideStep}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={cn('rounded-2xl p-4 border space-y-2.5 mb-5', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}
              >
                <p className={cn('text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-3', isDark ? 'text-white/30' : 'text-slate-400')}>
                  <Info size={10} /> Key Instructions
                </p>
                {currentGuide.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-[8px] font-black" style={{ background: currentGuide.color }}>{i + 1}</div>
                    <p className={cn('text-[10px] font-medium leading-snug', isDark ? 'text-white/60' : 'text-slate-600')}>{tip}</p>
                  </div>
                ))}
              </motion.div>

              {/* What parameters are read */}
              {guideStep === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className={cn('rounded-2xl p-4 border mb-5', isDark ? 'bg-indigo-500/8 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200')}
                >
                  <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3', isDark ? 'text-indigo-400' : 'text-indigo-700')}>Detected Parameters</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: 'pH', icon: FlaskConical, color: '#3B82F6' },
                      { name: 'DO', icon: Droplets, color: '#10B981' },
                      { name: 'Ammonia', icon: AlertTriangle, color: '#F59E0B' },
                      { name: 'Salinity', icon: Waves, color: '#8B5CF6' },
                      { name: 'Temp °C', icon: Thermometer, color: '#EF4444' },
                      { name: 'Alkalinity', icon: FlaskConical, color: '#06B6D4' },
                    ].map((p, i) => (
                      <div key={i} className={cn('rounded-xl p-2.5 border flex flex-col items-center gap-1', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100')}>
                        <p.icon size={14} style={{ color: p.color }} />
                        <span className={cn('text-[7px] font-black uppercase tracking-widest text-center', isDark ? 'text-white/50' : 'text-slate-600')}>{p.name}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Navigation buttons */}
              <div className="flex gap-3 mt-auto pt-2">
                {guideStep > 0 && (
                  <button
                    onClick={() => setGuideStep(g => g - 1)}
                    className={cn('flex-1 py-3.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest', isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-slate-200 text-slate-600')}
                  >
                    ← Back
                  </button>
                )}
                {guideStep < guideSteps.length - 1 ? (
                  <button
                    onClick={() => setGuideStep(g => g + 1)}
                    className="flex-[2] py-3.5 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.12em] shadow-lg flex items-center justify-center gap-2"
                    style={{ background: `linear-gradient(135deg, ${currentGuide.color}, ${currentGuide.color}cc)` }}
                  >
                    Next <ChevronRight size={12} />
                  </button>
                ) : (
                  <button
                    onClick={() => setStatus('camera')}
                    className="flex-[2] py-3.5 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.12em] shadow-xl flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                  >
                    <Camera size={14} /> Start Scanning
                  </button>
                )}
              </div>

              {/* Upload shortcut */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn('mt-3 w-full py-3 rounded-2xl border flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest', isDark ? 'bg-white/4 border-white/8 text-white/30' : 'bg-slate-50 border-slate-200 text-slate-400')}
              >
                <Upload size={12} /> Skip Guide — Upload Report Directly
              </button>
            </motion.div>
          )}

          {/* ══════════════════ CAMERA SCREEN ══════════════════ */}
          {status === 'camera' && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50 flex flex-col"
            >
              {/* Camera view */}
              {cameraError ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-900">
                  <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mb-4 border border-red-500/30">
                    <Camera size={32} className="text-red-400" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Camera Blocked</h3>
                  <p className="text-[11px] text-white/40 leading-relaxed mb-6 max-w-xs">
                    Camera permission was denied. Please go to your device Settings → Browser/App → Camera → Allow, then return here.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-emerald-600 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                  >
                    <Upload size={14} /> Upload Report Instead
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Dark vignette overlay */}
                  <div className="absolute inset-0 bg-black/40 pointer-events-none" />

                  {/* Viewfinder */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-72 h-[210px]">
                      {/* Animated corners */}
                      {[
                        'top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl',
                        'top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl',
                        'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl',
                        'bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl',
                      ].map((cls, i) => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                          className={cn('absolute w-8 h-8 border-emerald-400', cls)}
                        />
                      ))}

                      {/* Scanning laser */}
                      <motion.div
                        animate={{ y: [0, 200, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-0 right-0 h-0.5"
                        style={{ background: 'linear-gradient(90deg, transparent, #10b981, transparent)', boxShadow: '0 0 12px 2px rgba(16,185,129,0.6)' }}
                      />

                      {/* Center label */}
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 bg-black/70 px-3 py-1 rounded-full backdrop-blur-md">
                          Align Lab Report Table
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top bar */}
                  <div className="absolute top-0 left-0 right-0 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-5 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
                    <button
                      onClick={() => setStatus('guide')}
                      className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md"
                    >
                      <X size={16} className="text-white" />
                    </button>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Water Quality Scanner</span>
                    <div className="w-10 h-10" />
                  </div>

                  {/* Tips strip */}
                  <div className="absolute top-24 left-0 right-0 flex justify-center">
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                      <Sun size={10} className="text-amber-400" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Good lighting · Paper flat · No shadows</span>
                    </div>
                  </div>

                  {/* Bottom controls */}
                  <div className="absolute bottom-0 left-0 right-0 px-8 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-6 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md active:scale-90 transition-all">
                        <Upload size={20} className="text-white" />
                      </div>
                      <span className="text-[7px] font-black uppercase tracking-widest text-white/40">Upload</span>
                    </button>

                    {/* Main shutter */}
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={handleScan}
                      className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        boxShadow: '0 0 40px rgba(16,185,129,0.5)',
                        border: '4px solid rgba(0,0,0,0.3)',
                        outline: '3px solid rgba(16,185,129,0.3)',
                      }}
                    >
                      <Scan size={28} className="text-white" />
                    </motion.button>

                    <button
                      onClick={() => { setGuideStep(1); setStatus('guide'); }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md active:scale-90 transition-all">
                        <Info size={20} className="text-white" />
                      </div>
                      <span className="text-[7px] font-black uppercase tracking-widest text-white/40">Tips</span>
                    </button>
                  </div>
                </>
              )}

              <canvas ref={canvasRef} className="hidden" />
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </motion.div>
          )}

          {/* ══════════════════ PROCESSING SCREEN ══════════════════ */}
          {status === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn('fixed inset-0 z-50 flex flex-col items-center justify-center px-6', isDark ? 'bg-[#030E1B]' : 'bg-[#F0F8FF]')}
            >
              {/* Animated ring */}
              <div className="relative w-28 h-28 mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-[3px] border-emerald-500/20 border-t-emerald-500"
                />
                <motion.div
                  animate={{ rotate: -180 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-2 rounded-full border-[2px] border-blue-500/20 border-t-blue-500"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Scan size={32} className="text-emerald-500" />
                </div>
              </div>

              <h2 className={cn('text-lg font-black tracking-tight mb-1', isDark ? 'text-white' : 'text-slate-900')}>AquaGrow AI Reading…</h2>
              <p className={cn('text-[10px] font-black uppercase tracking-widest mb-8', isDark ? 'text-emerald-400' : 'text-emerald-600')}>OCR + Parameter Extraction</p>

              {/* Step list */}
              <div className={cn('w-full max-w-xs rounded-2xl border p-4 space-y-3', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
                {PROCESSING_STEPS.map((step, i) => {
                  const done = i < processingStep;
                  const active = i === processingStep;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all', done ? 'bg-emerald-500' : active ? 'bg-blue-500/30 border border-blue-500' : (isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200'))}>
                        {done ? (
                          <CheckCircle2 size={12} className="text-white" />
                        ) : active ? (
                          <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-2 h-2 rounded-full bg-blue-400" />
                        ) : (
                          <div className={cn('w-2 h-2 rounded-full', isDark ? 'bg-white/10' : 'bg-slate-300')} />
                        )}
                      </div>
                      <span className={cn('text-[9px] font-medium', done ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : active ? (isDark ? 'text-white' : 'text-slate-800') : (isDark ? 'text-white/20' : 'text-slate-400'))}>{step}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ══════════════════ RESULT SCREEN ══════════════════ */}
          {status === 'result' && scannedData && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-5 pb-10 space-y-4"
            >
              {/* Success header */}
              <div className={cn('rounded-2xl p-5 border relative overflow-hidden', isDark ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200')}>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 bg-emerald-500" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', isDark ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-emerald-100 border border-emerald-300')}>
                    <CheckCircle2 size={24} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className={cn('text-[8px] font-black uppercase tracking-[0.25em] mb-0.5', isDark ? 'text-emerald-400' : 'text-emerald-700')}>Scan Successful</p>
                    <h2 className={cn('text-lg font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Parameters Extracted</h2>
                    <p className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-slate-500')}>AI extracted 6 parameters · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {/* Parameter cards */}
              <div>
                <p className={cn('text-[8px] font-black uppercase tracking-widest px-1 mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>Extracted Values</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'ph',          label: 'pH Level',    value: scannedData.ph,          unit: '',      icon: FlaskConical,  range: '7.5 – 8.3 optimal' },
                    { key: 'do',          label: 'Dissolved O₂', value: scannedData.do,          unit: 'mg/L',  icon: Droplets,      range: '> 5.0 optimal' },
                    { key: 'ammonia',     label: 'Ammonia',      value: scannedData.ammonia,     unit: 'ppm',   icon: AlertTriangle, range: '< 0.25 ppm safe' },
                    { key: 'salinity',    label: 'Salinity',     value: scannedData.salinity,    unit: 'ppt',   icon: Waves,         range: '10 – 25 ppt optimal' },
                    { key: 'temperature', label: 'Temperature',  value: scannedData.temperature, unit: '°C',    icon: Thermometer,   range: '26 – 30°C optimal' },
                    { key: 'alkalinity',  label: 'Alkalinity',   value: scannedData.alkalinity!, unit: 'mg/L',  icon: FlaskConical,  range: '120 – 180 mg/L' },
                  ].map((param) => {
                    const q = getQuality(param.key, param.value);
                    const style = qualityStyle(q, isDark);
                    const ParamIcon = param.icon;
                    return (
                      <motion.div
                        key={param.key}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn('rounded-2xl p-4 border', style.bg)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <ParamIcon size={14} className={style.text} />
                          <span className={cn('text-[6px] font-black px-1.5 py-0.5 rounded-full text-white uppercase tracking-widest', style.badge)}>{style.label}</span>
                        </div>
                        <p className={cn('text-xl font-black tracking-tighter', isDark ? 'text-white' : 'text-slate-900')}>
                          {param.value}
                          <span className={cn('text-[10px] font-bold ml-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>{param.unit}</span>
                        </p>
                        <p className={cn('text-[8px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/40' : 'text-slate-600')}>{param.label}</p>
                        <p className={cn('text-[7px] font-medium mt-1', isDark ? 'text-white/20' : 'text-slate-400')}>{param.range}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Turbidity */}
              {scannedData.turbidity && (
                <div className={cn('rounded-2xl p-4 border flex items-center gap-3', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isDark ? 'bg-blue-500/15 border border-blue-500/25' : 'bg-blue-50 border border-blue-200')}>
                    <Waves size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>Turbidity / Visibility</p>
                    <p className={cn('text-sm font-black', isDark ? 'text-white' : 'text-slate-800')}>{scannedData.turbidity}</p>
                  </div>
                  <span className="ml-auto text-[7px] font-black px-2 py-1 rounded-full bg-emerald-500 text-white uppercase">GOOD</span>
                </div>
              )}

              {/* Action recommendations */}
              <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-amber-500/8 border-amber-500/20' : 'bg-amber-50 border-amber-200')}>
                <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5', isDark ? 'text-amber-400' : 'text-amber-700')}>
                  <Info size={10} /> AI Recommendations
                </p>
                <div className="space-y-1.5">
                  {scannedData.ammonia > 0.05 && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={10} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className={cn('text-[9px] font-medium', isDark ? 'text-white/50' : 'text-slate-600')}>Ammonia slightly elevated — apply zeolite (10 kg/acre) and increase aeration for 4 hours.</p>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={10} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className={cn('text-[9px] font-medium', isDark ? 'text-white/50' : 'text-slate-600')}>pH and DO are within optimal range — no immediate action needed.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={10} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className={cn('text-[9px] font-medium', isDark ? 'text-white/50' : 'text-slate-600')}>Temperature is ideal for Vannamei growth. Continue current feeding schedule.</p>
                  </div>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setStatus('guide'); setGuideStep(0); setScannedData(null); }}
                  className={cn('flex-1 py-3.5 rounded-2xl border text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5', isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-white border-slate-200 text-slate-500')}
                >
                  <RefreshCw size={12} /> Rescan
                </button>
                <button
                  onClick={() => navigate('/monitor')}
                  className="flex-[2] py-3.5 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.1em] shadow-xl flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  Import to Water Log <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Hidden file input always mounted */}
        {status !== 'camera' && (
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
        )}
      </div>
    </div>
  );
};
