/**
 * DeviceRegistration.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * IoT Device Registration — two device categories:
 *
 *  1. MASTER BOX  (role=master)
 *     • Gateway device, connects to WiFi + cloud
 *     • Manages all Smart Boxes over ESP-NOW
 *     • Registered first — Smart Boxes must pair to a Master
 *     • Special registration card with management context
 *
 *  2. SMART BOX   (role=slave)
 *     • Slave devices (Aerator, Sensor, Feeder, Pump, Custom)
 *     • Must have a Master Box registered first
 *     • Get assigned to a Master after registration
 *
 * QR decode: @capacitor/camera photo → jsQR (pure JS, Cap 8 compatible)
 * OR: Live getUserMedia stream → jsQR frame scanning
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, QrCode, Keyboard, CheckCircle2, AlertTriangle,
  Wind, Droplets, Waves, Settings, Fish, ChevronRight,
  Radio, X, ScanLine, Search, Cpu, Camera,
  RotateCcw, Wifi, GitBranch, Zap, Shield,
  Smartphone, Lock, Eye, EyeOff, ExternalLink, RefreshCw, WifiOff,
} from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import jsQR from 'jsqr';
import {
  espnowService,
  DEVICE_TYPE_OPTIONS,
  MASTER_TYPE_OPTION,
  type DeviceType,
} from '../../services/espnowService';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type DeviceCategory  = 'choose_category' | 'master' | 'smart_box';
type RegistrationMode = 'choose_method' | 'qr' | 'manual';
type RegistrationStep = 'category' | 'method' | 'configure' | 'provision' | 'reg_error' | 'success';

interface ScannedDevice {
  boxId:        string;
  deviceClass?: number;   // 0-4 for slave, 99 = master
  fwVersion?:   string;
  source:       'qr' | 'manual';
  isMaster:     boolean;
}

// ─── Icon map ─────────────────────────────────────────────────────────────────

const DEVICE_ICONS: Record<string, React.ElementType> = {
  AERATOR: Wind,
  SENSOR:  Droplets,
  FEEDER:  Fish,
  PUMP:    Waves,
  CUSTOM:  Settings,
  MASTER:  Radio,
};

const CLASS_TO_TYPE: Record<number, DeviceType> = {
  0: 'AERATOR', 1: 'SENSOR', 2: 'FEEDER', 3: 'PUMP', 4: 'CUSTOM',
};

// ─── QR decode helper ─────────────────────────────────────────────────────────

async function decodeQRFromBase64(base64: string): Promise<string | null> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(d.data, d.width, d.height, { inversionAttempts: 'dontInvert' });
      resolve(code ? code.data : null);
    };
    img.onerror = () => resolve(null);
    img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  STEP 0 — CATEGORY CHOOSER
// ─────────────────────────────────────────────────────────────────────────────

const CategoryChooser = ({
  isDark,
  hasMaster,
  onChoose,
}: {
  isDark: boolean;
  hasMaster: boolean;   // true = a master already registered for this pond
  onChoose: (cat: DeviceCategory) => void;
}) => (
  <div className="px-4 pt-5 pb-4 space-y-3">

    <div className="text-center mb-1">
      <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
        What are you registering?
      </p>
    </div>

    {/* ── MASTER BOX ── */}
    <motion.button
      id="choose-master-box-btn"
      whileTap={{ scale: 0.97 }}
      onClick={() => onChoose('master')}
      className="w-full rounded-[1.75rem] border p-5 text-left bg-gradient-to-br from-violet-500/10 to-indigo-500/5 border-violet-500/25"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-violet-500/15 border border-violet-500/25 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Radio size={26} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={cn('font-black text-sm', isDark ? 'text-white' : 'text-slate-900')}>Master Box</p>
            {hasMaster ? (
              <span className="bg-emerald-500/15 border border-emerald-500/20 rounded-full px-2 py-0.5 text-emerald-400 text-[6.5px] font-black uppercase tracking-widest">
                Already Added
              </span>
            ) : (
              <span className="bg-violet-500/15 border border-violet-500/20 rounded-full px-2 py-0.5 text-violet-400 text-[6.5px] font-black uppercase tracking-widest">
                Register First
              </span>
            )}
          </div>
          <p className={cn('text-[9px] font-medium leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
            Gateway device that connects to WiFi and manages all Smart Boxes via ESP-NOW radio.
          </p>
          {/* Feature list */}
          <div className="mt-2 space-y-1">
            {['Connects to internet & cloud', 'Controls up to 20 Smart Boxes', 'Must be registered before Smart Boxes'].map((f, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                <span className="text-violet-400/80 text-[7.5px] font-bold">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <ChevronRight size={16} className={isDark ? 'text-white/20' : 'text-slate-300'} />
      </div>
    </motion.button>

    {/* ── SMART BOX ── */}
    <motion.button
      id="choose-smart-box-btn"
      whileTap={{ scale: 0.97 }}
      onClick={() => onChoose('smart_box')}
      disabled={!hasMaster}
      className={cn(
        'w-full rounded-[1.75rem] border p-5 text-left transition-all',
        hasMaster
          ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20'
          : isDark ? 'bg-white/3 border-white/8 opacity-50' : 'bg-slate-50 border-slate-200 opacity-50',
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border',
          hasMaster
            ? 'bg-emerald-500/15 border-emerald-500/25'
            : isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200',
        )}>
          <Cpu size={26} className={hasMaster ? 'text-emerald-400' : isDark ? 'text-white/25' : 'text-slate-400'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={cn('font-black text-sm', isDark ? 'text-white' : 'text-slate-900')}>Smart Box</p>
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[6.5px] font-black uppercase tracking-widest border',
              hasMaster
                ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'
                : isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-slate-100 border-slate-200 text-slate-400',
            )}>
              {hasMaster ? 'Recommended' : 'Needs Master First'}
            </span>
          </div>
          <p className={cn('text-[9px] font-medium leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
            Slave device controlled by the Master Box. Aerator, Sensor, Pump, Feeder, or Custom.
          </p>
          <div className="mt-2 space-y-1">
            {['Paired to Master Box via ESP-NOW', 'Remotely toggle aerators & pumps', 'Reports sensor readings automatically'].map((f, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', hasMaster ? 'bg-emerald-400' : isDark ? 'bg-white/15' : 'bg-slate-300')} />
                <span className={cn('text-[7.5px] font-bold', hasMaster ? 'text-emerald-400/80' : isDark ? 'text-white/20' : 'text-slate-400')}>
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>
        <ChevronRight size={16} className={isDark ? 'text-white/20' : 'text-slate-300'} />
      </div>
    </motion.button>

    {/* Warning if no master */}
    {!hasMaster && (
      <motion.div
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className={cn('rounded-2xl border px-4 py-3 flex items-start gap-3', isDark ? 'bg-amber-500/8 border-amber-500/20' : 'bg-amber-50 border-amber-200')}
      >
        <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className={cn('text-[8px] font-bold leading-relaxed', isDark ? 'text-amber-400/80' : 'text-amber-700')}>
          Register the <span className="font-black">Master Box</span> first. Smart Boxes must pair to a Master Box before they can communicate.
        </p>
      </motion.div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  QR SCANNER VIEW
// ─────────────────────────────────────────────────────────────────────────────

const QRScannerView = ({
  isDark, onScanned, onCancel,
}: {
  isDark: boolean;
  onScanned: (boxId: string, deviceClass?: number, fwVersion?: string) => void;
  onCancel: () => void;
}) => {
  const [scanning,   setScanning]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [preview,    setPreview]    = useState<string | null>(null);
  const [liveActive, setLiveActive] = useState(false);

  const videoRef        = useRef<HTMLVideoElement>(null);
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const rafRef          = useRef<number>(0);
  const isScanningRef   = useRef(false);

  const stopLive = useCallback(() => {
    isScanningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setLiveActive(false);
  }, []);

  useEffect(() => () => { stopLive(); }, [stopLive]);

  const scanFrame = useCallback((
    resolve: (boxId: string, dc?: number, fv?: string) => void,
    reject: (msg: string) => void,
  ) => {
    const tick = () => {
      if (!isScanningRef.current) return;
      const video = videoRef.current; const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) { rafRef.current = requestAnimationFrame(tick); return; }
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject('Canvas error'); return; }
      ctx.drawImage(video, 0, 0);
      const id   = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(id.data, id.width, id.height, { inversionAttempts: 'dontInvert' });
      if (code?.data) {
        stopLive();
        try {
          const p = JSON.parse(code.data);
          if (p?.boxId) { resolve(p.boxId.toUpperCase(), p.deviceClass, p.fwVersion); return; }
        } catch {}
        const plain = code.data.trim().toUpperCase();
        if (/^[A-Z]{1,3}\d{1,}$/.test(plain)) { resolve(plain); return; }
        reject(`Unrecognised QR: "${code.data}"`);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [stopLive]);

  const startLiveScan = useCallback(async () => {
    setError(null); setPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current     = stream;
      isScanningRef.current = true;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setLiveActive(true); setScanning(true);
      await new Promise<void>((res, rej) => {
        scanFrame(
          (boxId, dc, fv) => { onScanned(boxId, dc, fv); res(); },
          (msg) => { setError(msg); setScanning(false); rej(msg); },
        );
      });
    } catch (err: any) {
      stopLive(); setScanning(false);
      if (err?.name === 'NotAllowedError') setError('Camera permission denied. Please allow camera access.');
      else if (err?.name === 'NotFoundError') setError('No camera found. Use "Take Photo" instead.');
      else if (!err?.message?.includes('Unrecognised')) setError('Camera failed. Try "Take Photo" below.');
    }
  }, [scanFrame, onScanned, stopLive]);

  const takePhoto = useCallback(async () => {
    setError(null); setScanning(true);
    try {
      const photo = await CapCamera.getPhoto({ quality: 90, allowEditing: false, resultType: CameraResultType.Base64, source: CameraSource.Camera });
      if (!photo.base64String) { setScanning(false); return; }
      const dataUrl = `data:image/jpeg;base64,${photo.base64String}`;
      setPreview(dataUrl);
      const result = await decodeQRFromBase64(photo.base64String);
      if (!result) { setError('No QR code found. Make sure the label is clear and well-lit.'); setScanning(false); return; }
      try {
        const p = JSON.parse(result);
        if (p?.boxId) { onScanned(p.boxId.toUpperCase(), p.deviceClass, p.fwVersion); return; }
      } catch {}
      const plain = result.trim().toUpperCase();
      if (/^[A-Z]{1,3}\d{1,}$/.test(plain)) { onScanned(plain); return; }
      setError(`Unrecognised QR: "${result}". Scan an AquaGrow device label.`);
      setScanning(false);
    } catch (err: any) {
      setScanning(false);
      if (err?.message?.includes('cancelled') || err?.message?.includes('User cancelled')) return;
      setError('Failed to open camera. Please try again.');
    }
  }, [onScanned]);

  const isNative  = Capacitor.isNativePlatform();
  const hasGetMedia = !!navigator.mediaDevices?.getUserMedia;

  return (
    <div className="flex flex-col items-center px-4 py-4 gap-5">
      {/* Viewfinder */}
      <div className="relative w-full max-w-[260px] aspect-square rounded-3xl overflow-hidden border-2 border-emerald-500/30 bg-black">
        <video ref={videoRef} playsInline muted autoPlay className={cn('absolute inset-0 w-full h-full object-cover', liveActive ? 'block' : 'hidden')} />
        <canvas ref={canvasRef} className="hidden" />
        {!liveActive && !preview && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <QrCode size={30} className="text-white/20" />
            </div>
          </div>
        )}
        {preview && !liveActive && <img src={preview} className="absolute inset-0 w-full h-full object-cover" alt="Captured" />}
        {['tl','tr','bl','br'].map(c => (
          <div key={c} className={cn('absolute w-7 h-7 border-[3px] border-emerald-400',
            c==='tl'?'top-3 left-3 border-r-0 border-b-0 rounded-tl-xl':
            c==='tr'?'top-3 right-3 border-l-0 border-b-0 rounded-tr-xl':
            c==='bl'?'bottom-3 left-3 border-r-0 border-t-0 rounded-bl-xl':
                     'bottom-3 right-3 border-l-0 border-t-0 rounded-br-xl',
          )} />
        ))}
        {liveActive && (
          <motion.div
            className="absolute left-3 right-3 h-0.5 bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.7)]"
            initial={{ top: '12%' }} animate={{ top: '88%' }}
            transition={{ duration: 1.8, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
          />
        )}
        {scanning && !liveActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-10 h-10 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="text-center">
        <p className={cn('text-xs font-black', isDark ? 'text-white' : 'text-slate-900')}>
          {liveActive ? '🟢 Scanning live…' : scanning ? 'Processing…' : 'Scan Device QR Label'}
        </p>
        <p className={cn('text-[9px] font-medium mt-1', isDark ? 'text-white/30' : 'text-slate-500')}>
          {liveActive ? 'Point at the QR code on the device label' : 'Every device has a QR sticker on its panel'}
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 flex items-start gap-3"
          >
            <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-[9px] font-bold">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!liveActive ? (
        <div className="w-full space-y-2.5">
          {hasGetMedia && (
            <motion.button id="start-live-scan-btn" whileTap={{ scale: 0.97 }} onClick={startLiveScan} disabled={scanning}
              className={cn('w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2',
                scanning ? 'bg-emerald-500/30 text-emerald-400/50 cursor-not-allowed' : 'bg-emerald-500 text-white',
              )}
            >
              <ScanLine size={16} />{scanning ? 'Processing…' : 'Live Scan (Camera)'}
            </motion.button>
          )}
          {isNative && (
            <motion.button id="take-photo-scan-btn" whileTap={{ scale: 0.97 }} onClick={takePhoto} disabled={scanning}
              className={cn('w-full py-3.5 rounded-2xl border font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2',
                isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-slate-100 border-slate-200 text-slate-600',
              )}
            >
              <Camera size={15} /> Take Photo of Label
            </motion.button>
          )}
          {preview && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setPreview(null); setError(null); setScanning(false); }}
              className={cn('w-full py-3 rounded-2xl border font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2',
                isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-slate-50 border-slate-200 text-slate-500',
              )}
            >
              <RotateCcw size={13} /> Try Again
            </motion.button>
          )}
        </div>
      ) : (
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { stopLive(); setScanning(false); }}
          className="w-full py-3.5 rounded-2xl border bg-red-500/10 border-red-500/20 text-red-400 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <X size={14} /> Stop Scanning
        </motion.button>
      )}
      <button onClick={onCancel} className={cn('text-[9px] font-bold', isDark ? 'text-white/25' : 'text-slate-400')}>
        Enter ID manually instead →
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  MANUAL ENTRY VIEW
// ─────────────────────────────────────────────────────────────────────────────

const ManualEntryView = ({
  isDark, isMaster, onConfirm,
}: {
  isDark: boolean;
  isMaster: boolean;
  onConfirm: (boxId: string, deviceClass?: number) => void;
}) => {
  const [boxId,      setBoxId]      = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType>(isMaster ? 'MASTER' : 'AERATOR');
  const [error,      setError]      = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleConfirm = () => {
    const id = boxId.trim().toUpperCase();
    if (!id) { setError('Please enter a Box ID.'); return; }
    if (!/^[A-Z]{1,3}\d{1,}$/.test(id)) { setError('Box ID must be like MB001 or SB001 (letters + numbers).'); return; }
    const classNum = DEVICE_TYPE_OPTIONS.findIndex(o => o.value === deviceType);
    onConfirm(id, isMaster ? 99 : classNum >= 0 ? classNum : 0);
  };

  const options = isMaster ? [MASTER_TYPE_OPTION] : DEVICE_TYPE_OPTIONS;
  const placeholder = isMaster ? 'e.g.  MB001' : 'e.g.  SB001';

  return (
    <div className="px-4 pb-4 space-y-5">
      <div>
        <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
          {isMaster ? 'Master Box ID' : 'Smart Box ID'}
        </p>
        <div className={cn('flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all',
          isDark ? 'bg-white/5 border-white/10 focus-within:border-emerald-500/40' : 'bg-slate-50 border-slate-200 focus-within:border-emerald-500',
        )}>
          {isMaster ? <Radio size={15} className="text-violet-400" /> : <Cpu size={15} className={isDark ? 'text-white/30' : 'text-slate-400'} />}
          <input
            ref={inputRef}
            id="manual-boxid-input"
            type="text"
            value={boxId}
            onChange={e => { setBoxId(e.target.value.toUpperCase()); setError(null); }}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            placeholder={placeholder}
            maxLength={12}
            className={cn('flex-1 bg-transparent outline-none text-sm font-black font-mono tracking-widest',
              isDark ? 'text-white placeholder:text-white/15' : 'text-slate-900 placeholder:text-slate-400',
            )}
          />
          {boxId.length > 0 && (
            <button onClick={() => { setBoxId(''); setError(null); inputRef.current?.focus(); }}>
              <X size={13} className={isDark ? 'text-white/30' : 'text-slate-400'} />
            </button>
          )}
        </div>
        <p className={cn('text-[7px] font-medium mt-1.5 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
          {isMaster
            ? 'Find the Box ID on the sticker on the Master Box (usually starts with MB, e.g. MB001)'
            : 'Find the Box ID on the sticker on the Smart Box (usually starts with SB, e.g. SB001)'}
        </p>
      </div>

      {/* Device type picker — show only for slave */}
      {!isMaster && (
        <div>
          <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
            Device Type
          </p>
          <div className="grid grid-cols-2 gap-2">
            {options.map(opt => {
              const Icon       = DEVICE_ICONS[opt.value] || Settings;
              const isSelected = deviceType === opt.value;
              return (
                <motion.button key={opt.value} id={`device-type-${opt.value.toLowerCase()}`} whileTap={{ scale: 0.97 }}
                  onClick={() => setDeviceType(opt.value)}
                  className={cn('flex items-center gap-2.5 rounded-2xl border px-3 py-3 text-left transition-all',
                    isSelected ? 'bg-emerald-500/15 border-emerald-500/30' : isDark ? 'bg-white/5 border-white/8' : 'bg-slate-50 border-slate-200',
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                    isSelected ? 'bg-emerald-500/20 text-emerald-400' : isDark ? 'bg-white/8 text-white/40' : 'bg-white text-slate-500',
                  )}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-[10px] font-black leading-tight', isSelected ? 'text-emerald-400' : isDark ? 'text-white' : 'text-slate-800')}>
                      {opt.label}
                    </p>
                    <p className={cn('text-[6.5px] font-medium mt-0.5 line-clamp-1', isDark ? 'text-white/25' : 'text-slate-400')}>
                      {opt.description}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-red-400 text-[9px] font-bold px-1"
          >⚠ {error}</motion.p>
        )}
      </AnimatePresence>

      <motion.button id="manual-entry-confirm-btn" whileTap={{ scale: 0.97 }} onClick={handleConfirm} disabled={!boxId.trim()}
        className={cn('w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
          boxId.trim() ? 'bg-emerald-500 text-white' : isDark ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-slate-100 text-slate-300 cursor-not-allowed',
        )}
      >
        <Search size={15} /> Verify & Continue
      </motion.button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURE STEP — Master Box
// ─────────────────────────────────────────────────────────────────────────────

const MasterConfigureStep = ({
  device, ponds, isDark, onRegister, onBack,
}: {
  device: ScannedDevice;
  ponds: any[];
  isDark: boolean;
  onRegister: (displayName: string, deviceType: DeviceType, pondId: string, role: 'master' | 'slave') => Promise<void>;
  onBack: () => void;
}) => {
  const [displayName,  setDisplayName]  = useState('');
  const [selectedPond, setSelectedPond] = useState(ponds[0]?.id || ponds[0]?._id || '');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const handleRegister = async () => {
    if (!selectedPond) { setError('Please select a pond.'); return; }
    setLoading(true); setError(null);
    try {
      await onRegister(displayName.trim() || 'Master Box', 'MASTER', selectedPond, 'master');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="px-4 pb-6 space-y-4">

      {/* Master Banner */}
      <div className="rounded-2xl border px-4 py-4 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 border-violet-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-violet-500/15 border border-violet-500/25 rounded-2xl flex items-center justify-center">
            <Radio size={18} className="text-violet-400" />
          </div>
          <div>
            <p className={cn('text-[11px] font-black', isDark ? 'text-white' : 'text-slate-900')}>{device.boxId}</p>
            <p className="text-violet-400 text-[8px] font-bold">
              {device.source === 'qr' ? '✓ Scanned via QR' : '✓ Entered manually'}
              {device.fwVersion ? `  ·  fw ${device.fwVersion}` : ''}
            </p>
          </div>
          <span className="ml-auto text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">
            Master Box
          </span>
        </div>
        {/* Management capabilities */}
        <div className={cn('rounded-xl p-3 space-y-1.5', isDark ? 'bg-black/20' : 'bg-white/50')}>
          <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
            This device will manage:
          </p>
          {[
            { icon: Wifi,       label: 'Cloud connection & data upload' },
            { icon: GitBranch,  label: 'Up to 20 Smart Boxes via ESP-NOW' },
            { icon: Zap,        label: 'Aerator commands from app' },
            { icon: Shield,     label: 'Sensor data relay to dashboard' },
          ].map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-center gap-2">
              <Icon size={9} className="text-violet-400 flex-shrink-0" />
              <span className={cn('text-[8px] font-bold', isDark ? 'text-white/50' : 'text-slate-600')}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pond picker */}
      {ponds.length > 0 && (
        <div>
          <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
            Assign to Pond
          </p>
          <div className="space-y-2">
            {ponds.map((pond: any) => {
              const pid = pond.id || pond._id;
              const isActive = selectedPond === pid;
              return (
                <motion.button key={pid} id={`master-pond-select-${pid}`} whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPond(pid)}
                  className={cn('w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                    isActive ? 'bg-violet-500/15 border-violet-500/30' : isDark ? 'bg-white/5 border-white/8' : 'bg-slate-50 border-slate-200',
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0',
                    isActive ? 'bg-violet-500/20' : isDark ? 'bg-white/8' : 'bg-white border border-slate-100',
                  )}>🐠</div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-[11px] font-black truncate', isDark ? 'text-white' : 'text-slate-900')}>{pond.name}</p>
                    <p className={cn('text-[7px] font-bold uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>
                      {pond.size ? `${pond.size} m²` : ''}{pond.species ? `  ·  ${pond.species}` : ''}
                    </p>
                  </div>
                  <div className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0',
                    isActive ? 'bg-violet-400 border-violet-400' : isDark ? 'border-white/20' : 'border-slate-300',
                  )} />
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Name input */}
      <div>
        <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
          Gateway Name
        </p>
        <div className={cn('flex items-center gap-3 rounded-2xl border px-4 py-3.5',
          isDark ? 'bg-white/5 border-white/10 focus-within:border-violet-500/40' : 'bg-slate-50 border-slate-200 focus-within:border-violet-400',
        )}>
          <span className="text-xl flex-shrink-0">📡</span>
          <input
            id="master-display-name-input"
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Master Box"
            maxLength={40}
            className={cn('flex-1 bg-transparent outline-none text-[11px] font-bold',
              isDark ? 'text-white placeholder:text-white/20' : 'text-slate-900 placeholder:text-slate-400',
            )}
          />
        </div>
        <p className={cn('text-[7px] font-medium mt-1.5 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
          E.g. "Pond 1 Gateway", "Farm Master". Leave blank for "Master Box".
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-red-400 text-[9px] font-bold px-1"
          >⚠ {error}</motion.p>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <motion.button whileTap={{ scale: 0.95 }} onClick={onBack}
          className={cn('flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center',
            isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-slate-100 border-slate-200 text-slate-500',
          )}
        ><ChevronLeft size={18} /></motion.button>
        <motion.button id="register-master-submit-btn" whileTap={{ scale: 0.97 }} onClick={handleRegister}
          disabled={loading || !selectedPond}
          className={cn('flex-1 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
            loading || !selectedPond
              ? isDark ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              : 'bg-violet-500 text-white',
          )}
        >
          {loading
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Registering…</>
            : <><Radio size={15} />Register Master Box</>
          }
        </motion.button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURE STEP — Smart Box (slave)
// ─────────────────────────────────────────────────────────────────────────────

const SmartBoxConfigureStep = ({
  device, ponds, masterDevices, isDark, onRegister, onBack,
}: {
  device: ScannedDevice;
  ponds: any[];
  masterDevices: any[];
  isDark: boolean;
  onRegister: (displayName: string, deviceType: DeviceType, pondId: string, role: 'master' | 'slave', aeratorLabels: string[]) => Promise<void>;
  onBack: () => void;
}) => {
  const initialType: DeviceType = device.deviceClass != null ? (CLASS_TO_TYPE[device.deviceClass] || 'AERATOR') : 'AERATOR';

  const [displayName,     setDisplayName]     = useState('');
  const [deviceType,      setDeviceType]      = useState<DeviceType>(initialType);
  const [selectedPond,    setSelectedPond]    = useState(ponds[0]?.id || ponds[0]?._id || '');
  const [aeratorLabels,   setAeratorLabels]   = useState<string[]>([]);
  const [customAerator,   setCustomAerator]   = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  const suggestedName = DEVICE_TYPE_OPTIONS.find(o => o.value === deviceType)?.label ?? 'Smart Box';

  // Get aerator positions from the selected pond
  const selectedPondData = ponds.find((p: any) => (p.id || p._id) === selectedPond);
  const pondAeratorPositions: string[] = selectedPondData?.aerators?.positions?.filter(Boolean) ?? [];

  // Auto-select pond if only one master
  const masterForPond = masterDevices.find((m: any) => (m.pondId === selectedPond || m.pond === selectedPond));

  const toggleAerator = (label: string) => {
    setAeratorLabels(prev =>
      prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]
    );
  };

  const addCustomAerator = () => {
    const trimmed = customAerator.trim();
    if (!trimmed || aeratorLabels.includes(trimmed)) { setCustomAerator(''); return; }
    setAeratorLabels(prev => [...prev, trimmed]);
    setCustomAerator('');
  };

  const handleRegister = async () => {
    if (!selectedPond) { setError('Please select a pond.'); return; }
    setLoading(true); setError(null);
    try {
      await onRegister(displayName.trim() || suggestedName, deviceType, selectedPond, 'slave', aeratorLabels);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="px-4 pb-6 space-y-4">

      {/* Device banner */}
      <div className={cn('rounded-2xl border px-4 py-3.5 flex items-center gap-3',
        isDark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200',
      )}>
        <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/25 rounded-2xl flex items-center justify-center flex-shrink-0">
          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-[11px] font-black', isDark ? 'text-white' : 'text-slate-900')}>{device.boxId}</p>
          <p className={cn('text-[8px] font-bold mt-0.5', isDark ? 'text-emerald-400/70' : 'text-emerald-600')}>
            {device.source === 'qr' ? '✓ Scanned via QR Code' : '✓ Entered manually'}
            {device.fwVersion ? `  ·  fw ${device.fwVersion}` : ''}
          </p>
        </div>
        <span className={cn('text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full border',
          isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-700',
        )}>Smart Box</span>
      </div>

      {/* Master association info */}
      {masterDevices.length > 0 && (
        <div className={cn('rounded-2xl border px-4 py-3 flex items-start gap-3',
          isDark ? 'bg-violet-500/5 border-violet-500/15' : 'bg-violet-50 border-violet-200',
        )}>
          <Radio size={12} className="text-violet-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className={cn('text-[8px] font-black uppercase tracking-widest mb-1', isDark ? 'text-violet-400/70' : 'text-violet-700')}>
              Managed by Master Box
            </p>
            {masterDevices.slice(0, 3).map((m: any) => (
              <p key={m._id} className={cn('text-[8px] font-bold', isDark ? 'text-white/40' : 'text-slate-600')}>
                📡 {m.displayName || m.label || m.boxId}
                {m.boxId ? <span className={cn('ml-1 font-mono text-[7px]', isDark ? 'text-white/25' : 'text-slate-400')}>({m.boxId})</span> : ''}
              </p>
            ))}
            <p className={cn('text-[7px] font-medium mt-1', isDark ? 'text-violet-400/50' : 'text-violet-600')}>
              This Smart Box will pair automatically when powered on near the Master Box.
            </p>
          </div>
        </div>
      )}

      {/* Device type pills */}
      <div>
        <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
          Device Type
        </p>
        <div className="flex gap-2 flex-wrap">
          {DEVICE_TYPE_OPTIONS.map(opt => {
            const isSelected = deviceType === opt.value;
            return (
              <motion.button key={opt.value} whileTap={{ scale: 0.95 }}
                onClick={() => setDeviceType(opt.value)}
                className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all',
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-slate-100 border-slate-200 text-slate-500',
                )}
              >
                <span>{opt.emoji}</span>{opt.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Pond picker */}
      {ponds.length > 0 && (
        <div>
          <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
            Assign to Pond
          </p>
          <div className="space-y-2">
            {ponds.map((pond: any) => {
              const pid = pond.id || pond._id;
              const isActive = selectedPond === pid;
              const hasMasterForPond = masterDevices.some((m: any) => m.pondId === pid);
              return (
                <motion.button key={pid} id={`pond-select-${pid}`} whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPond(pid)}
                  className={cn('w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                    isActive ? 'bg-emerald-500/15 border-emerald-500/30' : isDark ? 'bg-white/5 border-white/8' : 'bg-slate-50 border-slate-200',
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0',
                    isActive ? 'bg-emerald-500/20' : isDark ? 'bg-white/8' : 'bg-white border border-slate-100',
                  )}>🐠</div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-[11px] font-black truncate', isDark ? 'text-white' : 'text-slate-900')}>{pond.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {hasMasterForPond && (
                        <span className="flex items-center gap-0.5 text-violet-400 text-[6.5px] font-black uppercase">
                          <Radio size={7} /> Master linked
                        </span>
                      )}
                      {pond.size && <span className={cn('text-[7px] font-bold', isDark ? 'text-white/25' : 'text-slate-400')}>{pond.size} m²</span>}
                    </div>
                  </div>
                  <div className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0',
                    isActive ? 'bg-emerald-400 border-emerald-400' : isDark ? 'border-white/20' : 'border-slate-300',
                  )} />
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Aerators Controlled (AERATOR type only) ──────────────────── */}
      {deviceType === 'AERATOR' && (
        <div>
          <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
            Aerators Controlled
          </p>

          {/* Pond aerator positions as toggle chips */}
          {pondAeratorPositions.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {pondAeratorPositions.map(pos => {
                const selected = aeratorLabels.includes(pos);
                return (
                  <motion.button key={pos} whileTap={{ scale: 0.93 }}
                    onClick={() => toggleAerator(pos)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all',
                      selected
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-slate-100 border-slate-200 text-slate-500',
                    )}
                  >
                    {selected && <CheckCircle2 size={10} />}
                    💨 {pos}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Custom-added aerators (not in pond positions) */}
          {aeratorLabels.filter(a => !pondAeratorPositions.includes(a)).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {aeratorLabels.filter(a => !pondAeratorPositions.includes(a)).map(label => (
                <span key={label}
                  className={cn('flex items-center gap-1 rounded-full border px-2.5 py-1 text-[8px] font-black',
                    isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-700',
                  )}
                >
                  💨 {label}
                  <button onClick={() => toggleAerator(label)} className="ml-0.5 opacity-60 hover:opacity-100">
                    <X size={9} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Custom aerator name input */}
          <div className={cn('flex items-center gap-2 rounded-2xl border px-3 py-2.5',
            isDark ? 'bg-white/5 border-white/10 focus-within:border-emerald-500/40' : 'bg-slate-50 border-slate-200 focus-within:border-emerald-400',
          )}>
            <Wind size={12} className={isDark ? 'text-white/30' : 'text-slate-400'} />
            <input
              id="custom-aerator-input"
              type="text"
              value={customAerator}
              onChange={e => setCustomAerator(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomAerator()}
              placeholder="Add aerator (e.g. NE Corner, Paddle 1)…"
              maxLength={30}
              className={cn('flex-1 bg-transparent outline-none text-[10px] font-bold',
                isDark ? 'text-white placeholder:text-white/20' : 'text-slate-900 placeholder:text-slate-400',
              )}
            />
            <motion.button whileTap={{ scale: 0.9 }} onClick={addCustomAerator}
              disabled={!customAerator.trim()}
              className={cn('text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full transition-all',
                customAerator.trim()
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isDark ? 'text-white/20' : 'text-slate-300',
              )}
            >
              Add
            </motion.button>
          </div>
          <p className={cn('text-[7px] font-medium mt-1.5 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
            {aeratorLabels.length === 0
              ? 'Optional — select or add which aerators this Smart Box controls.'
              : `${aeratorLabels.length} aerator${aeratorLabels.length > 1 ? 's' : ''} selected`}
          </p>
        </div>
      )}

      {/* Name input */}
      <div>
        <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
          Device Name
        </p>
        <div className={cn('flex items-center gap-3 rounded-2xl border px-4 py-3.5',
          isDark ? 'bg-white/5 border-white/10 focus-within:border-emerald-500/40' : 'bg-slate-50 border-slate-200 focus-within:border-emerald-500',
        )}>
          <span className="text-xl flex-shrink-0">{DEVICE_TYPE_OPTIONS.find(o => o.value === deviceType)?.emoji ?? '📦'}</span>
          <input
            id="device-display-name-input"
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder={suggestedName}
            maxLength={40}
            className={cn('flex-1 bg-transparent outline-none text-[11px] font-bold',
              isDark ? 'text-white placeholder:text-white/20' : 'text-slate-900 placeholder:text-slate-400',
            )}
          />
        </div>
        <p className={cn('text-[7px] font-medium mt-1.5 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
          E.g. "Pond 1 Aerator", "Corner Sensor". Leave blank to use type name.
        </p>
      </div>

      {/* Preview */}
      <div className={cn('rounded-2xl border px-4 py-3 flex items-center gap-3', isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-100')}>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0', isDark ? 'bg-white/8' : 'bg-white border border-slate-200')}>
          {DEVICE_TYPE_OPTIONS.find(o => o.value === deviceType)?.emoji ?? '📦'}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-[11px] font-black truncate', isDark ? 'text-white' : 'text-slate-900')}>
            {displayName.trim() || suggestedName}
          </p>
          <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>
            {device.boxId} · {DEVICE_TYPE_OPTIONS.find(o => o.value === deviceType)?.label}
            {ponds.find((p: any) => (p.id || p._id) === selectedPond) ? ` · ${ponds.find((p: any) => (p.id || p._id) === selectedPond)?.name}` : ''}
          </p>
        </div>
        <ChevronRight size={11} className={isDark ? 'text-white/15' : 'text-slate-300'} />
      </div>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-red-400 text-[9px] font-bold px-1"
          >⚠ {error}</motion.p>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <motion.button whileTap={{ scale: 0.95 }} onClick={onBack}
          className={cn('flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center',
            isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-slate-100 border-slate-200 text-slate-500',
          )}
        ><ChevronLeft size={18} /></motion.button>
        <motion.button id="register-device-submit-btn" whileTap={{ scale: 0.97 }} onClick={handleRegister}
          disabled={loading || !selectedPond}
          className={cn('flex-1 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
            loading || !selectedPond
              ? isDark ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              : 'bg-emerald-500 text-white',
          )}
        >
          {loading
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Registering…</>
            : <><CheckCircle2 size={15} />Register Smart Box</>
          }
        </motion.button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  MASTER BOX PROVISIONING WIZARD
//  Runs AFTER cloud registration: guides farmer to send WiFi creds to the box
// ─────────────────────────────────────────────────────────────────────────────

const MasterProvisionWizard = ({
  boxId, isDark, onDone,
}: {
  boxId: string;
  isDark: boolean;
  onDone: () => void;
}) => {
  const [subStep,       setSubStep]       = useState<1 | 2 | 3 | 4>(1);
  const [ssid,          setSsid]          = useState('');
  const [password,      setPassword]      = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [sending,       setSending]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [wifiSent,      setWifiSent]      = useState(false);
  const [apDetected,    setApDetected]    = useState(false);   // true when 192.168.4.1 responds

  // Editable AP credentials (in case farmer has custom AP_PASSWORD or BOX_ID)
  const defaultApSsid = `AquaGrow-${boxId}`;
  const [editingAp,    setEditingAp]    = useState(false);
  const [editApSsid,   setEditApSsid]   = useState(defaultApSsid);
  const [editApPass,   setEditApPass]   = useState('12345678');
  const [showApPass,   setShowApPass]   = useState(false);

  const apSsid = editApSsid || defaultApSsid;

  // Auto-detect: poll 192.168.4.1/status every 2 s while on sub-step 2
  // The moment the box AP answers, flash "Connected!" and move to step 3.
  React.useEffect(() => {
    if (subStep !== 2) return;
    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        try {
          const r = await fetch('http://192.168.4.1/status', { signal: AbortSignal.timeout(2000) });
          if (r.ok && !cancelled) {
            setApDetected(true);
            await new Promise(res => setTimeout(res, 900)); // brief "Connected!" flash
            if (!cancelled) setSubStep(3);
            return;
          }
        } catch {
          // not yet connected — wait and retry
        }
        await new Promise(res => setTimeout(res, 2000));
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [subStep]);

  // Open phone WiFi settings (works on iOS & Android via Capacitor)
  const openWifiSettings = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android')) {
      (window as any).location = 'intent:#Intent;action=android.settings.WIFI_SETTINGS;end';
    } else {
      // iOS — App Store URL scheme doesn't allow direct WiFi, show instructions
      window.open('App-Prefs:WIFI', '_system');
    }
  };

  const sendWifiCredentials = async () => {
    if (!ssid.trim()) { setError('Please enter your WiFi name (SSID).'); return; }
    setError(null); setSending(true);
    try {
      // ── Pre-flight: verify phone is actually on the Master Box AP ────────────
      // If we reach this, the box is at 192.168.4.1. If not, fail fast with a clear message.
      try {
        await fetch('http://192.168.4.1/status', {
          signal: AbortSignal.timeout(3000),
        });
      } catch {
        setError(
          `Your phone is still connected to your normal WiFi or mobile data. ` +
          `Please go to WiFi Settings → connect to "${defaultApSsid}" (password: ${editApPass}) → ` +
          `then come back here and try again.`
        );
        setSending(false);
        return;
      }

      // ── Send WiFi credentials to box ─────────────────────────────────────────
      const res = await fetch('http://192.168.4.1/wifi/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid: ssid.trim(), password: password }),
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWifiSent(true);
        setSubStep(4);
      } else {
        setError(data.error || 'Unexpected response from Master Box.');
      }
    } catch (err: any) {
      if (err?.name === 'TimeoutError' || err?.message?.includes('fetch') || err?.message?.includes('Failed to fetch')) {
        setError(
          `Could not reach the Master Box at 192.168.4.1. ` +
          `Make sure your phone WiFi is connected to "${defaultApSsid}" and try again.`
        );
      } else {
        setError('Failed to send credentials: ' + (err?.message || 'Unknown error'));
      }
    } finally { setSending(false); }
  };

  const steps = [
    { num: 1, label: 'Power On Box' },
    { num: 2, label: 'Connect Phone' },
    { num: 3, label: 'Enter WiFi'   },
    { num: 4, label: 'Done'         },
  ];

  return (
    <div className="px-4 pb-6 space-y-4">

      {/* Progress bar */}
      <div className="flex items-center gap-1.5 mb-2">
        {steps.map(s => (
          <div key={s.num} className="flex-1">
            <div className={cn('h-1 rounded-full transition-all duration-500',
              subStep > s.num ? 'bg-violet-400' :
              subStep === s.num ? 'bg-violet-400/60' : isDark ? 'bg-white/10' : 'bg-slate-200',
            )} />
            <p className={cn('text-[6px] font-black uppercase tracking-wide mt-1 text-center',
              subStep === s.num ? 'text-violet-400' : isDark ? 'text-white/20' : 'text-slate-400',
            )}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Sub-step 1: Power on Master Box ── */}
      {subStep === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className={cn('rounded-2xl border p-5 text-center space-y-3',
            isDark ? 'bg-violet-500/8 border-violet-500/20' : 'bg-violet-50 border-violet-200',
          )}>
            <div className="w-16 h-16 bg-violet-500/15 border border-violet-500/25 rounded-full flex items-center justify-center mx-auto">
              <Zap size={28} className="text-violet-400" />
            </div>
            <p className={cn('font-black text-sm', isDark ? 'text-white' : 'text-slate-900')}>
              Power On Your Master Box
            </p>
            <p className={cn('text-[9px] font-medium leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
              Plug in the Master Box (<span className="font-black text-violet-400">{boxId}</span>).
              Wait ~5 seconds for it to start in setup mode.
            </p>
            <div className={cn('rounded-xl p-3 space-y-2', isDark ? 'bg-black/20' : 'bg-white/70')}>
              <p className={cn('text-[7.5px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>What to expect</p>
              {[
                'LED blinks twice repeatedly = setup mode ready',
                'Box broadcasts: ' + apSsid,
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                  <span className={cn('text-[8px] font-bold', isDark ? 'text-white/50' : 'text-slate-600')}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSubStep(2)}
            className="w-full py-4 rounded-2xl bg-violet-500 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Wifi size={15} /> Box is On — Continue
          </motion.button>
        </motion.div>
      )}

      {/* ── Sub-step 2: Connect phone to AP ── */}
      {subStep === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className={cn('rounded-2xl border p-5 space-y-4',
            apDetected
              ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-300'
              : isDark ? 'bg-violet-500/8 border-violet-500/20'    : 'bg-violet-50 border-violet-200',
          )}>
            <div className="flex items-center gap-3">
              <div className={cn('w-12 h-12 border rounded-2xl flex items-center justify-center flex-shrink-0 transition-all',
                apDetected
                  ? 'bg-emerald-500/20 border-emerald-500/30'
                  : 'bg-violet-500/15 border-violet-500/25',
              )}>
                {apDetected
                  ? <CheckCircle2 size={22} className="text-emerald-400" />
                  : <Smartphone   size={22} className="text-violet-400" />}
              </div>
              <div>
                <p className={cn('font-black text-sm', isDark ? 'text-white' : 'text-slate-900')}>
                  {apDetected ? 'Connected to Box!' : 'Connect Phone to Box'}
                </p>
                <p className={cn('text-[8px] font-bold mt-0.5', isDark ? 'text-white/40' : 'text-slate-500')}>
                  {apDetected ? 'Automatically detected — moving to next step…' : 'Use your phone WiFi settings'}
                </p>
              </div>
            </div>

            {/* Auto-detect status indicator */}
            {!apDetected && (
              <div className={cn('rounded-xl border px-3 py-2 flex items-center gap-2',
                isDark ? 'bg-black/15 border-white/6' : 'bg-white/70 border-slate-200',
              )}>
                <div className="flex gap-0.5">
                  {[0,1,2].map(i => (
                    <motion.div key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-violet-400"
                    />
                  ))}
                </div>
                <span className={cn('text-[8px] font-bold', isDark ? 'text-white/35' : 'text-slate-500')}>
                  Waiting for connection to {editApSsid}…
                </span>
              </div>
            )}

            {/* AP credentials display / edit */}
            {!apDetected && (
              <div className={cn('rounded-xl border overflow-hidden', isDark ? 'bg-black/20 border-white/8' : 'bg-white border-slate-200')}>

                {/* Header row with Edit toggle */}
                <div className={cn('flex items-center justify-between px-3 py-2 border-b',
                  isDark ? 'border-white/6' : 'border-slate-100',
                )}>
                  <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
                    AP Credentials
                  </span>
                  <button
                    id="edit-ap-credentials-btn"
                    onClick={() => setEditingAp(e => !e)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded-lg text-[7.5px] font-black uppercase tracking-wide transition-all',
                      editingAp
                        ? 'bg-violet-500 text-white'
                        : isDark ? 'bg-white/8 text-white/40 hover:text-white/70' : 'bg-slate-100 text-slate-500 hover:text-slate-700',
                    )}
                  >
                    {editingAp
                      ? <><CheckCircle2 size={9} /> Done</>  
                      : <><Settings size={9} /> Edit</>}
                  </button>
                </div>

                {/* View mode */}
                {!editingAp && (
                  <div className="px-3 py-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>WiFi Name</span>
                      <code className="text-violet-400 font-mono font-black text-[10px]">{editApSsid}</code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>Password</span>
                      <code className="text-violet-400 font-mono font-black text-[10px]">{editApPass}</code>
                    </div>
                  </div>
                )}

                {/* Edit mode */}
                {editingAp && (
                  <div className="px-3 py-2 space-y-2">
                    {/* AP SSID */}
                    <div>
                      <p className={cn('text-[6.5px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/25' : 'text-slate-400')}>Box WiFi Name</p>
                      <div className={cn('flex items-center gap-2 rounded-xl border px-3 py-2',
                        isDark ? 'bg-white/5 border-white/10 focus-within:border-violet-500/40' : 'bg-slate-50 border-slate-200',
                      )}>
                        <Wifi size={11} className={isDark ? 'text-white/25' : 'text-slate-400'} />
                        <input
                          id="edit-ap-ssid-input"
                          type="text"
                          value={editApSsid}
                          onChange={e => setEditApSsid(e.target.value)}
                          placeholder={defaultApSsid}
                          className={cn('flex-1 bg-transparent outline-none text-[11px] font-bold',
                            isDark ? 'text-white placeholder:text-white/15' : 'text-slate-900 placeholder:text-slate-300',
                          )}
                        />
                        {editApSsid !== defaultApSsid && (
                          <button onClick={() => setEditApSsid(defaultApSsid)}
                            className={cn('text-[7px] font-black', isDark ? 'text-violet-400/60 hover:text-violet-400' : 'text-violet-500/50 hover:text-violet-500')}
                          >Reset</button>
                        )}
                      </div>
                    </div>
                    {/* AP Password */}
                    <div>
                      <p className={cn('text-[6.5px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/25' : 'text-slate-400')}>Box WiFi Password</p>
                      <div className={cn('flex items-center gap-2 rounded-xl border px-3 py-2',
                        isDark ? 'bg-white/5 border-white/10 focus-within:border-violet-500/40' : 'bg-slate-50 border-slate-200',
                      )}>
                        <Lock size={11} className={isDark ? 'text-white/25' : 'text-slate-400'} />
                        <input
                          id="edit-ap-password-input"
                          type={showApPass ? 'text' : 'password'}
                          value={editApPass}
                          onChange={e => setEditApPass(e.target.value)}
                          placeholder="12345678"
                          className={cn('flex-1 bg-transparent outline-none text-[11px] font-bold',
                            isDark ? 'text-white placeholder:text-white/15' : 'text-slate-900 placeholder:text-slate-300',
                          )}
                        />
                        <button onClick={() => setShowApPass(!showApPass)}>
                          {showApPass
                            ? <EyeOff size={11} className={isDark ? 'text-white/25' : 'text-slate-400'} />
                            : <Eye    size={11} className={isDark ? 'text-white/25' : 'text-slate-400'} />}
                        </button>
                      </div>
                      <p className={cn('text-[6.5px] font-medium mt-1 px-0.5', isDark ? 'text-white/18' : 'text-slate-400')}>
                        Change only if you modified AP_PASSWORD in the firmware.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className={cn('text-[7.5px] font-medium leading-relaxed', isDark ? 'text-white/35' : 'text-slate-500')}>
              {apDetected
                ? 'Box detected at 192.168.4.1 — advancing automatically.'
                : 'After connecting, come back to this app. Internet will temporarily disconnect — that\u2019s normal.'}
            </p>
          </div>

          {!apDetected && (
            <>
              <motion.button id="open-wifi-settings-btn" whileTap={{ scale: 0.97 }} onClick={openWifiSettings}
                className={cn('w-full py-3.5 rounded-2xl border font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2',
                  isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-white border-slate-200 text-slate-700',
                )}
              >
                <ExternalLink size={14} /> Open WiFi Settings
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSubStep(3)}
                className="w-full py-4 rounded-2xl bg-violet-500 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={15} /> I'm Connected — Continue
              </motion.button>
            </>
          )}

          <button onClick={() => setSubStep(1)}
            className={cn('text-[8px] font-bold w-full text-center', isDark ? 'text-white/25' : 'text-slate-400')}
          >← Back</button>
        </motion.div>
      )}

      {/* ── Sub-step 3: Enter farm WiFi ── */}
      {subStep === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className={cn('rounded-2xl border px-4 py-3 flex items-center gap-3',
            isDark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200',
          )}>
            <Wifi size={14} className="text-emerald-400 flex-shrink-0" />
            <p className={cn('text-[8px] font-bold', isDark ? 'text-emerald-400/80' : 'text-emerald-700')}>
              Enter the WiFi your pond area uses — the Master Box will connect to this.
            </p>
          </div>

          {/* SSID */}
          <div>
            <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>Farm WiFi Name (SSID)</p>
            <div className={cn('flex items-center gap-3 rounded-2xl border px-4 py-3.5',
              isDark ? 'bg-white/5 border-white/10 focus-within:border-violet-500/40' : 'bg-slate-50 border-slate-200 focus-within:border-violet-400',
            )}>
              <Wifi size={14} className={isDark ? 'text-white/30' : 'text-slate-400'} />
              <input
                id="provision-ssid-input"
                type="text"
                value={ssid}
                onChange={e => { setSsid(e.target.value); setError(null); }}
                placeholder="e.g. Jio_Fiber_Home"
                autoComplete="off"
                className={cn('flex-1 bg-transparent outline-none text-sm font-bold',
                  isDark ? 'text-white placeholder:text-white/15' : 'text-slate-900 placeholder:text-slate-400',
                )}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>WiFi Password</p>
            <div className={cn('flex items-center gap-3 rounded-2xl border px-4 py-3.5',
              isDark ? 'bg-white/5 border-white/10 focus-within:border-violet-500/40' : 'bg-slate-50 border-slate-200 focus-within:border-violet-400',
            )}>
              <Lock size={14} className={isDark ? 'text-white/30' : 'text-slate-400'} />
              <input
                id="provision-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="WiFi password"
                className={cn('flex-1 bg-transparent outline-none text-sm font-bold',
                  isDark ? 'text-white placeholder:text-white/15' : 'text-slate-900 placeholder:text-slate-400',
                )}
              />
              <button onClick={() => setShowPassword(!showPassword)}>
                {showPassword
                  ? <EyeOff size={14} className={isDark ? 'text-white/30' : 'text-slate-400'} />
                  : <Eye    size={14} className={isDark ? 'text-white/30' : 'text-slate-400'} />}
              </button>
            </div>
            <p className={cn('text-[7px] font-medium mt-1.5 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
              Works with any router, Jio Fiber, Airtel, BSNL, Hotspot, or any WiFi.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-2xl border bg-red-500/10 border-red-500/20 px-4 py-3 flex items-start gap-3"
              >
                <WifiOff size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-[9px] font-bold leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            id="send-wifi-to-box-btn"
            whileTap={{ scale: 0.97 }}
            onClick={sendWifiCredentials}
            disabled={sending || !ssid.trim()}
            className={cn('w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
              sending || !ssid.trim()
                ? isDark ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-violet-500 text-white',
            )}
          >
            {sending
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending to Box…</>
              : <><Wifi size={15} /> Send WiFi to Master Box</>}
          </motion.button>
          <button onClick={() => setSubStep(2)}
            className={cn('text-[8px] font-bold w-full text-center', isDark ? 'text-white/25' : 'text-slate-400')}
          >← Back (reconnect to {apSsid})</button>
        </motion.div>
      )}

      {/* ── Sub-step 4: Done ── */}
      {subStep === 4 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          <div className="text-center py-6 space-y-3">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mx-auto"
            >
              <CheckCircle2 size={36} className="text-emerald-400" />
            </motion.div>
            <p className={cn('font-black text-base', isDark ? 'text-white' : 'text-slate-900')}>WiFi Credentials Sent!</p>
            <p className={cn('text-[9px] font-medium leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
              The Master Box is restarting and connecting to your WiFi.
              It will automatically register with the AquaGrow cloud.
            </p>
          </div>
          <div className={cn('rounded-2xl border p-4 space-y-2', isDark ? 'bg-black/20 border-white/8' : 'bg-slate-50 border-slate-200')}>
            <p className={cn('text-[7.5px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>What happens next</p>
            {[
              'Master Box restarts (~10 seconds)',
              'Connects to your farm WiFi automatically',
              'Registers with AquaGrow cloud',
              'Smart Boxes will auto-discover it',
            ].map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2"
              >
                <CheckCircle2 size={10} className="text-emerald-400 flex-shrink-0" />
                <span className={cn('text-[8px] font-bold', isDark ? 'text-white/50' : 'text-slate-600')}>{t}</span>
              </motion.div>
            ))}
          </div>
          <div className={cn('rounded-2xl border px-4 py-3 flex items-start gap-3',
            isDark ? 'bg-amber-500/8 border-amber-500/20' : 'bg-amber-50 border-amber-200',
          )}>
            <Wifi size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <p className={cn('text-[8px] font-bold leading-relaxed', isDark ? 'text-amber-400/80' : 'text-amber-700')}>
              Reconnect your phone to your normal WiFi or mobile data now.
            </p>
          </div>
          <motion.button id="provision-done-btn" whileTap={{ scale: 0.97 }} onClick={onDone}
            className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest"
          >
            Go to Dashboard
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  DEVICE CLAIMED / OWNERSHIP ERROR VIEW
// ─────────────────────────────────────────────────────────────────────────────

const DeviceClaimedView = ({
  boxId, errorMsg, isDark, onBack,
}: {
  boxId: string;
  errorMsg: string;
  isDark: boolean;
  onBack: () => void;
}) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
    className="px-4 pb-6 space-y-4"
  >
    {/* Locked icon */}
    <div className="text-center py-6 space-y-3">
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 200 }}
        className="w-20 h-20 rounded-full bg-red-500/15 border-2 border-red-500/30 flex items-center justify-center mx-auto"
      >
        <Shield size={36} className="text-red-400" />
      </motion.div>
      <p className={cn('font-black text-base', isDark ? 'text-white' : 'text-slate-900')}>Device Already Claimed</p>
      <p className={cn('text-[9px] font-medium leading-relaxed max-w-xs mx-auto', isDark ? 'text-white/40' : 'text-slate-500')}>
        This Master Box is already registered under another AquaGrow account and cannot be re-registered.
      </p>
    </div>

    {/* Box ID pill */}
    <div className={cn('rounded-2xl border p-4 flex items-center gap-3', isDark ? 'bg-black/20 border-white/8' : 'bg-slate-50 border-slate-200')}>
      <div className="w-9 h-9 rounded-xl bg-red-500/12 border border-red-500/20 flex items-center justify-center flex-shrink-0">
        <Radio size={16} className="text-red-400" />
      </div>
      <div>
        <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>Box ID</p>
        <p className={cn('font-black text-sm font-mono', isDark ? 'text-white' : 'text-slate-900')}>{boxId}</p>
      </div>
    </div>

    {/* Error detail */}
    <div className="rounded-2xl border bg-red-500/8 border-red-500/20 px-4 py-3 flex items-start gap-3">
      <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-red-400 text-[9px] font-bold leading-relaxed">{errorMsg}</p>
    </div>

    {/* What to do */}
    <div className={cn('rounded-2xl border p-4 space-y-2', isDark ? 'bg-black/20 border-white/8' : 'bg-white border-slate-200')}>
      <p className={cn('text-[7.5px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>What to do</p>
      {[
        'Contact AquaGrow support with the Box ID above',
        'If you own this device, make sure you are logged in to the correct account',
        'If this box belongs to you, ask support to transfer ownership',
      ].map((t, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="w-1 h-1 rounded-full bg-red-400/60 flex-shrink-0 mt-1.5" />
          <span className={cn('text-[8px] font-bold leading-relaxed', isDark ? 'text-white/45' : 'text-slate-600')}>{t}</span>
        </div>
      ))}
    </div>

    <motion.button id="claimed-back-btn" whileTap={{ scale: 0.97 }} onClick={onBack}
      className={cn('w-full py-4 rounded-2xl border font-black text-[11px] uppercase tracking-widest',
        isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-slate-100 border-slate-200 text-slate-700',
      )}
    >
      ← Go Back
    </motion.button>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  SUCCESS VIEW
// ─────────────────────────────────────────────────────────────────────────────

const SuccessView = ({ deviceName, boxId, isMaster, isDark, apiKey, pondId, onDone, onRegisterAnother }: {
  deviceName: string; boxId: string; isMaster: boolean; isDark: boolean;
  apiKey?: string;
  pondId?: string;
  onDone: () => void; onRegisterAnother: () => void;
}) => {
  const [copied,    setCopied]    = useState(false);
  const [copiedPid, setCopiedPid] = useState(false);

  const copyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyPondId = () => {
    if (!pondId) return;
    navigator.clipboard.writeText(pondId).then(() => {
      setCopiedPid(true);
      setTimeout(() => setCopiedPid(false), 2000);
    });
  };

  const steps = isMaster
    ? ['Master Box is now live on your dashboard', 'Power on Smart Boxes near this Master Box', 'Smart Boxes will auto-discover and appear in app']
    : ['Smart Box visible on IoT dashboard', 'It will pair to the Master Box automatically', 'Aerator/sensor now remotely controllable'];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center px-6 py-10 gap-5 text-center"
    >
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
        className={cn('w-20 h-20 rounded-full flex items-center justify-center border-2',
          isMaster ? 'bg-violet-500/15 border-violet-500/30' : 'bg-emerald-500/15 border-emerald-500/30',
        )}
      >
        {isMaster ? <Radio size={36} className="text-violet-400" /> : <CheckCircle2 size={36} className="text-emerald-400" />}
      </motion.div>
      <div>
        <p className={cn('font-black text-lg', isDark ? 'text-white' : 'text-slate-900')}>
          {isMaster ? 'Master Box Registered!' : 'Smart Box Registered!'}
        </p>
        <p className={cn('text-[10px] font-bold mt-1.5', isDark ? 'text-white/40' : 'text-slate-500')}>
          <span className={cn('font-black', isMaster ? 'text-violet-400' : 'text-emerald-400')}>{deviceName}</span> ({boxId}) is now active.
        </p>
      </div>

      {/* ── API Key box — shown only for Master registrations ── */}
      {isMaster && apiKey && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="w-full rounded-2xl border overflow-hidden bg-gradient-to-br from-violet-500/10 to-indigo-500/5 border-violet-500/25"
        >
          <div className="px-4 pt-3 pb-2">
            <p className="text-violet-400 text-[7.5px] font-black uppercase tracking-widest mb-1.5">🔑 Firmware API Key</p>
            <p className={cn('text-[7px] font-medium leading-relaxed mb-2.5', isDark ? 'text-white/40' : 'text-slate-500')}>
              Copy this key into <code className="bg-black/20 px-1 py-0.5 rounded text-violet-300">API_KEY</code> in your Master Box firmware.
            </p>
            <div className={cn('flex items-center gap-2 rounded-xl border px-3 py-2.5',
              isDark ? 'bg-black/30 border-white/10' : 'bg-white border-slate-200',
            )}>
              <code className={cn('flex-1 text-[8px] font-mono break-all leading-relaxed text-left',
                isDark ? 'text-violet-300' : 'text-violet-700',
              )}>{apiKey}</code>
              <button id="copy-api-key-btn" onClick={copyKey}
                className={cn('flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[7.5px] font-black uppercase tracking-widest transition-all',
                  copied
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-violet-500/20 text-violet-400 border border-violet-500/30 active:scale-95',
                )}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className={cn('text-[6.5px] font-bold mt-2', isDark ? 'text-amber-400/60' : 'text-amber-600')}>
              ⚠ Store this key now — it will not be shown again.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Pond ID box — shown only for Master registrations ── */}
      {isMaster && pondId && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          className="w-full rounded-2xl border overflow-hidden bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-cyan-500/25"
        >
          <div className="px-4 pt-3 pb-3">
            <p className="text-cyan-400 text-[7.5px] font-black uppercase tracking-widest mb-1.5">🏠 Pond ID — for firmware</p>
            <p className={cn('text-[7px] font-medium leading-relaxed mb-2.5', isDark ? 'text-white/40' : 'text-slate-500')}>
              Copy this into <code className="bg-black/20 px-1 py-0.5 rounded text-cyan-300">POND_ID</code> in your Master Box firmware.
            </p>
            <div className={cn('flex items-center gap-2 rounded-xl border px-3 py-2.5',
              isDark ? 'bg-black/30 border-white/10' : 'bg-white border-slate-200',
            )}>
              <code className={cn('flex-1 text-[8px] font-mono break-all leading-relaxed text-left',
                isDark ? 'text-cyan-300' : 'text-cyan-700',
              )}>{pondId}</code>
              <button id="copy-pond-id-btn" onClick={copyPondId}
                className={cn('flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[7.5px] font-black uppercase tracking-widest transition-all',
                  copiedPid
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 active:scale-95',
                )}
              >
                {copiedPid ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {steps.map((step, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + i * 0.08 }}
          className="flex items-center gap-2.5 w-full text-left"
        >
          <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border',
            isMaster ? 'bg-violet-500/15 border-violet-500/25' : 'bg-emerald-500/15 border-emerald-500/25',
          )}>
            <CheckCircle2 size={10} className={isMaster ? 'text-violet-400' : 'text-emerald-400'} />
          </div>
          <p className={cn('text-[9px] font-bold', isDark ? 'text-white/50' : 'text-slate-600')}>{step}</p>
        </motion.div>
      ))}
      <div className="flex flex-col gap-2.5 w-full mt-2">
        <motion.button id="registration-done-btn" whileTap={{ scale: 0.97 }} onClick={onDone}
          className={cn('w-full py-4 rounded-2xl text-white font-black text-[11px] uppercase tracking-widest',
            isMaster ? 'bg-violet-500' : 'bg-emerald-500',
          )}
        >Go to Dashboard</motion.button>
        <motion.button id="register-another-btn" whileTap={{ scale: 0.97 }} onClick={onRegisterAnother}
          className={cn('w-full py-3.5 rounded-2xl border font-black text-[11px] uppercase tracking-widest',
            isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-slate-100 border-slate-200 text-slate-600',
          )}
        >
          {isMaster ? 'Register Smart Boxes' : 'Register Another Device'}
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export const DeviceRegistration = () => {
  const navigate = useNavigate();
  const { theme, ponds } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [category, setCategory] = useState<DeviceCategory>('choose_category');
  const [mode,     setMode]     = useState<RegistrationMode>('choose_method');
  const [step,     setStep]     = useState<RegistrationStep>('category');
  const [device,   setDevice]   = useState<ScannedDevice | null>(null);
  const [success,  setSuccess]  = useState<{ deviceName: string; boxId: string; isMaster: boolean; apiKey?: string; pondId?: string } | null>(null);
  const [registrationError, setRegistrationError] = useState<{ boxId: string; msg: string } | null>(null);

  // Fetch live IoT status to find existing master devices
  const [masterDevices, setMasterDevices] = useState<any[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    const fetchMasters = async () => {
      if (!ponds.length) return;
      setLoadingStatus(true);
      try {
        const results = await Promise.allSettled(
          ponds.map(p => espnowService.getPondStatus(p.id || p._id))
        );
        const masters: any[] = [];
        results.forEach(r => {
          if (r.status === 'fulfilled') {
            r.value.devices.filter(d => d.role === 'master').forEach(d => {
              masters.push({ ...d, pondId: r.value.pondId });
            });
          }
        });
        setMasterDevices(masters);
      } catch {}
      finally { setLoadingStatus(false); }
    };
    fetchMasters();
  }, [ponds]);

  const hasMaster = masterDevices.length > 0;
  const isMasterFlow = category === 'master';

  const handleDeviceFound = useCallback((
    boxId: string, deviceClass?: number, fwVersion?: string,
  ) => {
    const isMaster = isMasterFlow || deviceClass === 99;
    setDevice({ boxId, deviceClass, fwVersion, source: mode === 'qr' ? 'qr' : 'manual', isMaster });
    setStep('configure');
  }, [isMasterFlow, mode]);

  const handleRegister = useCallback(async (
    displayName: string, deviceType: DeviceType, pondId: string, role: 'master' | 'slave',
    aeratorLabels: string[] = [],
  ) => {
    if (!device) return;
    try {
      await espnowService.assignDevice({ boxId: device.boxId, displayName, deviceType, pondId, role, aeratorLabels });
      if (role === 'master') {
        // Master Box: go to provisioning wizard (sends WiFi to box)
        setStep('provision');
      } else {
        // Slave: go straight to success
        setSuccess({ deviceName: displayName, boxId: device.boxId, isMaster: false });
        setStep('success');
      }
    } catch (err: any) {
      const msg: string = err?.message || '';
      // 409 = already registered to another user; 403 = ownership denied
      const isOwnershipError = msg.toLowerCase().includes('already registered') ||
                               msg.toLowerCase().includes('already claimed') ||
                               msg.toLowerCase().includes('belongs to another') ||
                               msg.toLowerCase().includes('ownership') ||
                               msg.includes('409') || msg.includes('403');
      if (isOwnershipError) {
        setRegistrationError({
          boxId: device.boxId,
          msg: msg || 'This device is already registered under a different AquaGrow account.',
        });
        setStep('reg_error');
      } else {
        // Generic error — surface it to configure step (MasterConfigureStep / SmartBoxConfigureStep handles it)
        throw err;
      }
    }
  }, [device]);

  const resetAll = () => {
    setCategory('choose_category');
    setMode('choose_method');
    setStep('category');
    setDevice(null);
    setSuccess(null);
    setRegistrationError(null);
  };

  // After success of master, offer to register smart box
  const handleRegisterAnother = () => {
    if (success?.isMaster) {
      setCategory('smart_box');
      setMode('choose_method');
      setStep('method');
      setDevice(null);
      setSuccess(null);
      // Re-fetch masters
      setMasterDevices(prev => prev);
    } else {
      resetAll();
    }
  };

  const stepNum = step === 'category' ? 0 : step === 'method' ? 1 : step === 'configure' ? 2 : step === 'provision' ? 3 : 3;
  const totalSteps = isMasterFlow ? 4 : 3;

  return (
    <div className={cn('min-h-screen pb-10', isDark ? 'bg-[#06100A]' : 'bg-[#F0F4F2]')}>

      {/* HEADER */}
      <header className={cn(
        'fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 px-4 backdrop-blur-xl border-b',
        'pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3',
        isDark ? 'bg-[#06100A]/90 border-white/5' : 'bg-white/90 border-slate-100',
      )}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (step === 'configure') { setStep('method'); setDevice(null); }
              else if (step === 'method') { setStep('category'); setMode('choose_method'); }
              else navigate(-1);
            }}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-all',
              isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-700',
            )}
          ><ChevronLeft size={18} /></button>
          <div className="flex-1 min-w-0">
            <h1 className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              Register IoT Device
            </h1>
            {step !== 'success' && step !== 'category' && step !== 'provision' && (
              <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>
                {isMasterFlow ? '📡 Master Box' : '⚡ Smart Box'} · Step {stepNum} of {totalSteps}
              </p>
            )}
            {step === 'provision' && (
              <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>
                📡 Master Box · WiFi Setup
              </p>
            )}
          </div>
          {/* Progress dots */}
          {step !== 'success' && step !== 'category' && step !== 'provision' && (
            <div className="flex gap-1.5">
              {[1, 2, 3].map(n => (
                <div key={n} className={cn('rounded-full transition-all duration-300',
                  n <= stepNum
                    ? cn('w-4 h-1.5', isMasterFlow ? 'bg-violet-400' : 'bg-emerald-400')
                    : isDark ? 'w-1.5 h-1.5 bg-white/15' : 'w-1.5 h-1.5 bg-slate-300',
                )} />
              ))}
            </div>
          )}
        </div>
      </header>

      {/* BODY */}
      <div className="pt-[calc(env(safe-area-inset-top)+4rem)]">
        <AnimatePresence mode="wait">

          {/* STEP 0: Category */}
          {step === 'category' && (
            <motion.div key="category"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            >
              <CategoryChooser
                isDark={isDark}
                hasMaster={hasMaster}
                onChoose={cat => { setCategory(cat); setStep('method'); }}
              />
            </motion.div>
          )}

          {/* STEP 1: Choose scan/manual method */}
          {step === 'method' && mode === 'choose_method' && (
            <motion.div key="choose_method"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="px-4 pt-5 pb-4 space-y-3"
            >
              <p className={cn('text-center text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
                How would you like to add it?
              </p>
              {/* QR */}
              <motion.button id="choose-qr-scan-btn" whileTap={{ scale: 0.97 }} onClick={() => setMode('qr')}
                className="w-full rounded-[1.75rem] border p-5 text-left bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/25 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <QrCode size={26} className="text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={cn('font-black text-sm', isDark ? 'text-white' : 'text-slate-900')}>Scan QR Code</p>
                      <span className="bg-emerald-500/15 border border-emerald-500/20 rounded-full px-2 py-0.5 text-emerald-400 text-[6.5px] font-black uppercase tracking-widest">Recommended</span>
                    </div>
                    <p className={cn('text-[9px] font-medium leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
                      Point your camera at the QR code on the device label. Auto-fills ID and type.
                    </p>
                  </div>
                  <ChevronRight size={16} className={isDark ? 'text-white/20' : 'text-slate-300'} />
                </div>
              </motion.button>
              {/* Manual */}
              <motion.button id="choose-manual-entry-btn" whileTap={{ scale: 0.97 }} onClick={() => setMode('manual')}
                className={cn('w-full rounded-[1.75rem] border p-5 text-left transition-all',
                  isDark ? 'bg-[#0A1410] border-white/8' : 'bg-white border-slate-100 shadow-sm',
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border',
                    isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200',
                  )}>
                    <Keyboard size={26} className={isDark ? 'text-white/40' : 'text-slate-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-black text-sm mb-1', isDark ? 'text-white' : 'text-slate-900')}>Enter Manually</p>
                    <p className={cn('text-[9px] font-medium leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
                      Type the Box ID from the label (e.g. {isMasterFlow ? 'MB001' : 'SB001'}).
                    </p>
                  </div>
                  <ChevronRight size={16} className={isDark ? 'text-white/20' : 'text-slate-300'} />
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* QR Scanner */}
          {step === 'method' && mode === 'qr' && (
            <motion.div key="qr"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="pt-4"
            >
              <QRScannerView
                isDark={isDark}
                onScanned={(boxId, dc, fv) => handleDeviceFound(boxId, dc, fv)}
                onCancel={() => setMode('manual')}
              />
            </motion.div>
          )}

          {/* Manual Entry */}
          {step === 'method' && mode === 'manual' && (
            <motion.div key="manual"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="pt-4"
            >
              <ManualEntryView
                isDark={isDark}
                isMaster={isMasterFlow}
                onConfirm={(boxId, dc) => handleDeviceFound(boxId, dc, undefined)}
              />
            </motion.div>
          )}

          {/* Configure — Master */}
          {step === 'configure' && device?.isMaster && (
            <motion.div key="configure-master"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="pt-4"
            >
              <MasterConfigureStep
                device={device} ponds={ponds} isDark={isDark}
                onRegister={handleRegister}
                onBack={() => { setStep('method'); setDevice(null); }}
              />
            </motion.div>
          )}

          {/* Configure — Smart Box */}
          {step === 'configure' && device && !device.isMaster && (
            <motion.div key="configure-slave"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="pt-4"
            >
              <SmartBoxConfigureStep
                device={device} ponds={ponds} masterDevices={masterDevices} isDark={isDark}
                onRegister={handleRegister}
                onBack={() => { setStep('method'); setDevice(null); }}
              />
            </motion.div>
          )}

          {/* Provision — Master Box WiFi Setup Wizard */}
          {step === 'provision' && device?.isMaster && (
            <motion.div key="provision"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="pt-4"
            >
              <MasterProvisionWizard
                boxId={device.boxId}
                isDark={isDark}
                onDone={() => navigate(-1)}
              />
            </motion.div>
          )}

          {/* Success — Smart Box only (Master Box uses provision wizard) */}
          {step === 'success' && success && (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-4">
              <SuccessView
                deviceName={success.deviceName} boxId={success.boxId}
                isMaster={success.isMaster} isDark={isDark}
                onDone={() => navigate(-1)}
                onRegisterAnother={handleRegisterAnother}
              />
            </motion.div>
          )}

          {/* Ownership / Already Claimed Error */}
          {step === 'reg_error' && registrationError && (
            <motion.div key="reg_error" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="pt-4">
              <DeviceClaimedView
                boxId={registrationError.boxId}
                errorMsg={registrationError.msg}
                isDark={isDark}
                onBack={resetAll}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default DeviceRegistration;
