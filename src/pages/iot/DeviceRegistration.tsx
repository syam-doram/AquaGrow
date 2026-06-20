/**
 * DeviceRegistration.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-screen IoT Device Registration page for AquaGrow.
 *
 * Features:
 *  • Mode 1 — QR Code Scan  : Uses @capacitor-community/barcode-scanner to read
 *                             a QR code printed on the Smart Box label.
 *                             QR payload: JSON { boxId, deviceClass, fwVersion }
 *  • Mode 2 — Manual Entry  : Farmer types the Box ID (e.g. SB001) + selects
 *                             device type from a picker.
 *  • Step 2 (shared)        : Name the device + pick pond → calls
 *                             espnowService.assignDevice()
 */

import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, QrCode, Keyboard, CheckCircle2, AlertTriangle,
  Wind, Droplets, Waves, Settings, Fish, ChevronRight,
  Radio, Flashlight, X, ScanLine, Search, Cpu,
} from 'lucide-react';
import { espnowService, DEVICE_TYPE_OPTIONS, type DeviceType } from '../../services/espnowService';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type RegistrationMode = 'choose' | 'qr' | 'manual';
type RegistrationStep = 'scan_or_type' | 'configure' | 'success';

interface ScannedDevice {
  boxId: string;
  deviceClass?: number;
  fwVersion?: string;
  source: 'qr' | 'manual';
}

// ─── Icon mapping ─────────────────────────────────────────────────────────────

const DEVICE_ICONS: Record<string, React.ElementType> = {
  AERATOR: Wind,
  SENSOR:  Droplets,
  FEEDER:  Fish,
  PUMP:    Waves,
  CUSTOM:  Settings,
  MASTER:  Radio,
};

// device class number → DeviceType (matches firmware enum)
const CLASS_TO_TYPE: Record<number, DeviceType> = {
  0: 'AERATOR',
  1: 'SENSOR',
  2: 'FEEDER',
  3: 'PUMP',
  4: 'CUSTOM',
};

// ─────────────────────────────────────────────────────────────────────────────
//  QR SCANNER VIEW
// ─────────────────────────────────────────────────────────────────────────────

const QRScannerView = ({
  isDark,
  onScanned,
  onCancel,
}: {
  isDark: boolean;
  onScanned: (boxId: string, deviceClass?: number, fwVersion?: string) => void;
  onCancel: () => void;
}) => {
  const [scanning,   setScanning]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [torchOn,    setTorchOn]    = useState(false);
  const [scannedRaw, setScannedRaw] = useState<string | null>(null);

  const startScan = useCallback(async () => {
    setError(null);
    setScanning(true);
    setScannedRaw(null);

    try {
      // Dynamically import to avoid crash if plugin not installed
      const { BarcodeScanner } = await import('@capacitor-community/barcode-scanner');

      // Request camera permission
      const status = await BarcodeScanner.checkPermission({ force: true });
      if (!status.granted) {
        setError('Camera permission denied. Please allow camera access in Settings.');
        setScanning(false);
        return;
      }

      // Hide the WebView background so camera shows through
      document.body.classList.add('scanner-active');
      await BarcodeScanner.hideBackground();

      const result = await BarcodeScanner.startScan();

      // Restore WebView
      document.body.classList.remove('scanner-active');
      await BarcodeScanner.showBackground();
      setScanning(false);

      if (result.hasContent && result.content) {
        setScannedRaw(result.content);
        // Try to parse JSON QR payload: { boxId, deviceClass, fwVersion }
        try {
          const parsed = JSON.parse(result.content);
          if (parsed?.boxId) {
            onScanned(parsed.boxId.toUpperCase(), parsed.deviceClass, parsed.fwVersion);
            return;
          }
        } catch {
          // Not JSON — treat plain text as Box ID directly (e.g. "SB001")
          const plain = result.content.trim().toUpperCase();
          if (/^[A-Z]{1,3}\d{3,}$/.test(plain)) {
            onScanned(plain);
            return;
          }
        }
        setError(`Unrecognised QR code: "${result.content}". Please scan an AquaGrow Smart Box label.`);
      } else {
        setError('No QR code detected. Please try again.');
      }
    } catch (err: any) {
      document.body.classList.remove('scanner-active');
      setScanning(false);
      if (err?.message?.includes('not implemented')) {
        setError('QR scanning requires the app to run on a physical Android device.');
      } else {
        setError(err.message || 'Scan failed. Please try again.');
      }
    }
  }, [onScanned]);

  const stopScan = useCallback(async () => {
    try {
      const { BarcodeScanner } = await import('@capacitor-community/barcode-scanner');
      await BarcodeScanner.stopScan();
      await BarcodeScanner.showBackground();
      document.body.classList.remove('scanner-active');
    } catch {}
    setScanning(false);
  }, []);

  const toggleTorch = useCallback(async () => {
    try {
      const { BarcodeScanner } = await import('@capacitor-community/barcode-scanner');
      if (torchOn) {
        await BarcodeScanner.disableTorch();
      } else {
        await BarcodeScanner.enableTorch();
      }
      setTorchOn(t => !t);
    } catch {}
  }, [torchOn]);

  return (
    <div className="flex flex-col items-center px-4 py-6 gap-6">

      {/* Scanner viewfinder (decorative when not scanning) */}
      <div className="relative w-full max-w-[260px] aspect-square">
        {/* Corner brackets */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <div className={cn(
            'absolute inset-0 rounded-3xl border-2',
            scanning ? 'border-emerald-400' : isDark ? 'border-white/15' : 'border-slate-300',
          )} />
          {/* Animated scan line */}
          {scanning && (
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.6)]"
              initial={{ top: '10%' }}
              animate={{ top: '90%' }}
              transition={{ duration: 1.8, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
            />
          )}
        </div>

        {/* Corner accents */}
        {['tl', 'tr', 'bl', 'br'].map(corner => (
          <div
            key={corner}
            className={cn(
              'absolute w-6 h-6 border-[3px] rounded-sm',
              scanning ? 'border-emerald-400' : isDark ? 'border-white/40' : 'border-slate-600',
              corner === 'tl' ? 'top-0 left-0 border-r-0 border-b-0 rounded-br-none rounded-tl-xl' :
              corner === 'tr' ? 'top-0 right-0 border-l-0 border-b-0 rounded-bl-none rounded-tr-xl' :
              corner === 'bl' ? 'bottom-0 left-0 border-r-0 border-t-0 rounded-tr-none rounded-bl-xl' :
                                'bottom-0 right-0 border-l-0 border-t-0 rounded-tl-none rounded-br-xl',
            )}
          />
        ))}

        {/* Centre icon */}
        {!scanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center',
              isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200',
            )}>
              <QrCode size={28} className={isDark ? 'text-white/30' : 'text-slate-400'} />
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center">
        <p className={cn('text-xs font-black', isDark ? 'text-white' : 'text-slate-900')}>
          {scanning ? 'Point camera at QR code' : 'Scan Smart Box Label'}
        </p>
        <p className={cn('text-[9px] font-medium mt-1', isDark ? 'text-white/30' : 'text-slate-500')}>
          {scanning
            ? 'Keep the QR code inside the frame'
            : 'Each Smart Box has a QR code sticker on the side panel'
          }
        </p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 flex items-start gap-3"
          >
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-[9px] font-bold">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      {scanning ? (
        <div className="flex gap-3 w-full">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleTorch}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 rounded-2xl border py-3.5 text-[10px] font-black uppercase tracking-widest',
              torchOn
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-slate-100 border-slate-200 text-slate-600',
            )}
          >
            <Flashlight size={14} />
            {torchOn ? 'Light On' : 'Torch'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={stopScan}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl border bg-red-500/10 border-red-500/20 text-red-400 py-3.5 text-[10px] font-black uppercase tracking-widest"
          >
            <X size={14} /> Cancel
          </motion.button>
        </div>
      ) : (
        <motion.button
          id="start-qr-scan-btn"
          whileTap={{ scale: 0.97 }}
          onClick={startScan}
          className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <ScanLine size={16} />
          Start Scanning
        </motion.button>
      )}

      <button
        onClick={onCancel}
        className={cn('text-[9px] font-bold', isDark ? 'text-white/30' : 'text-slate-400')}
      >
        Enter Box ID manually instead →
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  MANUAL ENTRY VIEW
// ─────────────────────────────────────────────────────────────────────────────

const ManualEntryView = ({
  isDark,
  onConfirm,
}: {
  isDark: boolean;
  onConfirm: (boxId: string, deviceClass?: number) => void;
}) => {
  const [boxId,      setBoxId]      = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType>('AERATOR');
  const [error,      setError]      = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleConfirm = () => {
    const id = boxId.trim().toUpperCase();
    if (!id) { setError('Please enter a Box ID.'); return; }
    if (!/^[A-Z]{1,3}\d{1,}$/.test(id)) {
      setError('Box ID format should be like SB001 or MB001.');
      return;
    }
    const classNum = DEVICE_TYPE_OPTIONS.findIndex(o => o.value === deviceType);
    onConfirm(id, classNum >= 0 ? classNum : 0);
  };

  return (
    <div className="px-4 pb-4 space-y-5">

      {/* Box ID field */}
      <div>
        <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
          Box ID
        </p>
        <div className={cn(
          'flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all',
          isDark ? 'bg-white/5 border-white/10 focus-within:border-emerald-500/40'
                 : 'bg-slate-50 border-slate-200 focus-within:border-emerald-500',
        )}>
          <Cpu size={15} className={isDark ? 'text-white/30' : 'text-slate-400'} />
          <input
            ref={inputRef}
            id="manual-boxid-input"
            type="text"
            value={boxId}
            onChange={e => { setBoxId(e.target.value.toUpperCase()); setError(null); }}
            placeholder="e.g.  SB001  or  MB001"
            maxLength={12}
            className={cn(
              'flex-1 bg-transparent outline-none text-sm font-black font-mono tracking-widest',
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
          Find the Box ID on the label stuck to the Smart Box (e.g. SB001, SB002, MB001)
        </p>
      </div>

      {/* Device Type */}
      <div>
        <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
          Device Type
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DEVICE_TYPE_OPTIONS.map(opt => {
            const Icon      = DEVICE_ICONS[opt.value] || Settings;
            const isSelected = deviceType === opt.value;
            return (
              <motion.button
                key={opt.value}
                id={`device-type-${opt.value.toLowerCase()}`}
                whileTap={{ scale: 0.97 }}
                onClick={() => setDeviceType(opt.value)}
                className={cn(
                  'flex items-center gap-2.5 rounded-2xl border px-3 py-3 text-left transition-all',
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500/30'
                    : isDark
                    ? 'bg-white/5 border-white/8'
                    : 'bg-slate-50 border-slate-200',
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isDark ? 'bg-white/8 text-white/40' : 'bg-white text-slate-500',
                )}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0">
                  <p className={cn(
                    'text-[10px] font-black leading-tight',
                    isSelected ? 'text-emerald-400' : isDark ? 'text-white' : 'text-slate-800',
                  )}>{opt.label}</p>
                  <p className={cn(
                    'text-[6.5px] font-medium mt-0.5 line-clamp-1',
                    isDark ? 'text-white/25' : 'text-slate-400',
                  )}>{opt.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-red-400 text-[9px] font-bold px-1"
          >
            ⚠ {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Confirm */}
      <motion.button
        id="manual-entry-confirm-btn"
        whileTap={{ scale: 0.97 }}
        onClick={handleConfirm}
        disabled={!boxId.trim()}
        className={cn(
          'w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
          boxId.trim()
            ? 'bg-emerald-500 text-white'
            : isDark ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-slate-100 text-slate-300 cursor-not-allowed',
        )}
      >
        <Search size={15} /> Verify & Continue
      </motion.button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURE STEP (shared by QR + Manual)
// ─────────────────────────────────────────────────────────────────────────────

const ConfigureStep = ({
  device,
  ponds,
  isDark,
  onRegister,
  onBack,
}: {
  device: ScannedDevice;
  ponds: any[];
  isDark: boolean;
  onRegister: (displayName: string, deviceType: DeviceType, pondId: string) => Promise<void>;
  onBack: () => void;
}) => {
  const initialType: DeviceType =
    device.deviceClass != null
      ? (CLASS_TO_TYPE[device.deviceClass] || 'AERATOR')
      : 'AERATOR';

  const [displayName,  setDisplayName]  = useState('');
  const [deviceType,   setDeviceType]   = useState<DeviceType>(initialType);
  const [selectedPond, setSelectedPond] = useState(ponds[0]?.id || ponds[0]?._id || '');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const suggestedName = DEVICE_TYPE_OPTIONS.find(o => o.value === deviceType)?.label ?? 'Smart Box';
  const DevIcon       = DEVICE_ICONS[deviceType] || Settings;

  const handleRegister = async () => {
    if (!selectedPond) { setError('Please select a pond.'); return; }
    setLoading(true);
    setError(null);
    try {
      await onRegister(displayName.trim() || suggestedName, deviceType, selectedPond);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pb-6 space-y-4">

      {/* Device preview banner */}
      <div className={cn(
        'rounded-2xl border px-4 py-3.5 flex items-center gap-3',
        isDark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200',
      )}>
        <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/25 rounded-2xl flex items-center justify-center flex-shrink-0">
          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-[11px] font-black', isDark ? 'text-white' : 'text-slate-900')}>
            {device.boxId}
          </p>
          <p className={cn('text-[8px] font-bold mt-0.5', isDark ? 'text-emerald-400/70' : 'text-emerald-600')}>
            {device.source === 'qr' ? '✓ Scanned via QR Code' : '✓ Entered manually'}
            {device.fwVersion ? `  ·  fw ${device.fwVersion}` : ''}
          </p>
        </div>
        <span className={cn(
          'text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full border',
          isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-700',
        )}>
          Ready
        </span>
      </div>

      {/* Device type picker (compact) */}
      <div>
        <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
          Device Type
        </p>
        <div className="flex gap-2 flex-wrap">
          {DEVICE_TYPE_OPTIONS.map(opt => {
            const isSelected = deviceType === opt.value;
            return (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDeviceType(opt.value)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all text-[9px] font-black uppercase tracking-widest',
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : isDark
                    ? 'bg-white/5 border-white/10 text-white/40'
                    : 'bg-slate-100 border-slate-200 text-slate-500',
                )}
              >
                <span>{opt.emoji}</span>
                {opt.label}
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
              const pid      = pond.id || pond._id;
              const isActive = selectedPond === pid;
              return (
                <motion.button
                  key={pid}
                  id={`pond-select-${pid}`}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPond(pid)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                    isActive
                      ? 'bg-emerald-500/15 border-emerald-500/30'
                      : isDark ? 'bg-white/5 border-white/8' : 'bg-slate-50 border-slate-200',
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0',
                    isActive ? 'bg-emerald-500/20' : isDark ? 'bg-white/8' : 'bg-white border border-slate-100',
                  )}>
                    🐠
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-[11px] font-black truncate', isDark ? 'text-white' : 'text-slate-900')}>
                      {pond.name}
                    </p>
                    <p className={cn('text-[7px] font-bold uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>
                      {pond.size ? `${pond.size} m²` : ''}{pond.species ? `  ·  ${pond.species}` : ''}
                    </p>
                  </div>
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 flex-shrink-0',
                    isActive ? 'bg-emerald-400 border-emerald-400' : isDark ? 'border-white/20' : 'border-slate-300',
                  )} />
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Device name */}
      <div>
        <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
          Device Name
        </p>
        <div className={cn(
          'flex items-center gap-3 rounded-2xl border px-4 py-3.5',
          isDark ? 'bg-white/5 border-white/10 focus-within:border-emerald-500/40'
                 : 'bg-slate-50 border-slate-200 focus-within:border-emerald-500',
        )}>
          <span className="text-xl flex-shrink-0">
            {DEVICE_TYPE_OPTIONS.find(o => o.value === deviceType)?.emoji ?? '📦'}
          </span>
          <input
            id="device-display-name-input"
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder={suggestedName}
            maxLength={40}
            className={cn(
              'flex-1 bg-transparent outline-none text-[11px] font-bold',
              isDark ? 'text-white placeholder:text-white/20' : 'text-slate-900 placeholder:text-slate-400',
            )}
          />
        </div>
        <p className={cn('text-[7px] font-medium mt-1.5 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
          E.g. "Pond 1 Aerator", "Corner Sensor". Leave blank to use type name.
        </p>
      </div>

      {/* Live preview */}
      <div className={cn(
        'rounded-2xl border px-4 py-3 flex items-center gap-3',
        isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-100',
      )}>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0', isDark ? 'bg-white/8' : 'bg-white border border-slate-200')}>
          {DEVICE_TYPE_OPTIONS.find(o => o.value === deviceType)?.emoji ?? '📦'}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-[11px] font-black truncate', isDark ? 'text-white' : 'text-slate-900')}>
            {displayName.trim() || suggestedName}
          </p>
          <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>
            {device.boxId} · {DEVICE_TYPE_OPTIONS.find(o => o.value === deviceType)?.label}
            {ponds.find((p: any) => (p.id || p._id) === selectedPond)
              ? ` · ${ponds.find((p: any) => (p.id || p._id) === selectedPond)?.name}`
              : ''}
          </p>
        </div>
        <ChevronRight size={11} className={isDark ? 'text-white/15' : 'text-slate-300'} />
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-red-400 text-[9px] font-bold px-1"
          >
            ⚠ {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center',
            isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-slate-100 border-slate-200 text-slate-500',
          )}
        >
          <ChevronLeft size={18} />
        </motion.button>

        <motion.button
          id="register-device-submit-btn"
          whileTap={{ scale: 0.97 }}
          onClick={handleRegister}
          disabled={loading || !selectedPond}
          className={cn(
            'flex-1 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
            loading || !selectedPond
              ? isDark ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              : 'bg-emerald-500 text-white',
          )}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Registering…
            </>
          ) : (
            <>
              <CheckCircle2 size={15} />
              Register Device
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  SUCCESS VIEW
// ─────────────────────────────────────────────────────────────────────────────

const SuccessView = ({
  deviceName,
  boxId,
  isDark,
  onDone,
  onRegisterAnother,
}: {
  deviceName: string;
  boxId: string;
  isDark: boolean;
  onDone: () => void;
  onRegisterAnother: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.92 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center px-6 py-10 gap-5 text-center"
  >
    {/* Animated checkmark */}
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
      className="w-20 h-20 bg-emerald-500/15 border-2 border-emerald-500/30 rounded-full flex items-center justify-center"
    >
      <CheckCircle2 size={36} className="text-emerald-400" />
    </motion.div>

    <div>
      <p className={cn('font-black text-lg', isDark ? 'text-white' : 'text-slate-900')}>Device Registered!</p>
      <p className={cn('text-[10px] font-bold mt-1.5', isDark ? 'text-white/40' : 'text-slate-500')}>
        <span className="text-emerald-400 font-black">{deviceName}</span> ({boxId}) is now active
        and will appear on your IoT dashboard.
      </p>
    </div>

    {/* Steps */}
    {[
      'Device visible on Smart Box dashboard',
      'Aerator can now be toggled remotely',
      'Sensor readings will start appearing',
    ].map((step, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 + i * 0.08 }}
        className="flex items-center gap-2.5 w-full text-left"
      >
        <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={10} className="text-emerald-400" />
        </div>
        <p className={cn('text-[9px] font-bold', isDark ? 'text-white/50' : 'text-slate-600')}>{step}</p>
      </motion.div>
    ))}

    <div className="flex flex-col gap-2.5 w-full mt-2">
      <motion.button
        id="registration-done-btn"
        whileTap={{ scale: 0.97 }}
        onClick={onDone}
        className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest"
      >
        Go to Dashboard
      </motion.button>
      <motion.button
        id="register-another-btn"
        whileTap={{ scale: 0.97 }}
        onClick={onRegisterAnother}
        className={cn(
          'w-full py-3.5 rounded-2xl border font-black text-[11px] uppercase tracking-widest',
          isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-slate-100 border-slate-200 text-slate-600',
        )}
      >
        Register Another Device
      </motion.button>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export const DeviceRegistration = () => {
  const navigate = useNavigate();
  const { theme, ponds } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [mode,    setMode]    = useState<RegistrationMode>('choose');
  const [step,    setStep]    = useState<RegistrationStep>('scan_or_type');
  const [device,  setDevice]  = useState<ScannedDevice | null>(null);
  const [success, setSuccess] = useState<{ deviceName: string; boxId: string } | null>(null);

  const handleDeviceFound = useCallback((
    boxId: string,
    deviceClass?: number,
    fwVersion?: string,
    source: 'qr' | 'manual' = 'qr',
  ) => {
    setDevice({ boxId, deviceClass, fwVersion, source });
    setStep('configure');
  }, []);

  const handleRegister = useCallback(async (
    displayName: string,
    deviceType: DeviceType,
    pondId: string,
  ) => {
    if (!device) return;
    await espnowService.assignDevice({
      boxId: device.boxId,
      displayName,
      deviceType,
      pondId,
    });
    setSuccess({ deviceName: displayName, boxId: device.boxId });
    setStep('success');
  }, [device]);

  const resetAll = () => {
    setMode('choose');
    setStep('scan_or_type');
    setDevice(null);
    setSuccess(null);
  };

  // ── Step label ──────────────────────────────────────────────────────────────
  const stepLabel =
    step === 'scan_or_type' ? (mode === 'qr' ? 'Scan QR Code' : 'Enter Box ID') :
    step === 'configure'    ? 'Configure Device' :
                               'Registration Complete';

  // ── Step progress ────────────────────────────────────────────────────────────
  const stepNum = step === 'scan_or_type' ? 1 : step === 'configure' ? 2 : 3;

  return (
    <div className={cn('min-h-screen pb-10', isDark ? 'bg-[#06100A]' : 'bg-[#F0F4F2]')}>

      {/* ── HEADER ── */}
      <header className={cn(
        'fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 px-4 backdrop-blur-xl border-b',
        'pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3',
        isDark ? 'bg-[#06100A]/90 border-white/5' : 'bg-white/90 border-slate-100',
      )}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (step === 'configure') { setStep('scan_or_type'); setDevice(null); }
              else navigate(-1);
            }}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90', isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-700')}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              Register IoT Device
            </h1>
            {step !== 'success' && (
              <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>
                Step {stepNum} of 2 · {stepLabel}
              </p>
            )}
          </div>
          {/* Step dots */}
          {step !== 'success' && (
            <div className="flex gap-1.5">
              {[1, 2].map(n => (
                <div key={n} className={cn(
                  'rounded-full transition-all duration-300',
                  n <= stepNum - (step === 'success' ? 0 : 0)
                    ? 'w-4 h-1.5 bg-emerald-400'
                    : isDark ? 'w-1.5 h-1.5 bg-white/15' : 'w-1.5 h-1.5 bg-slate-300',
                )} />
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="pt-[calc(env(safe-area-inset-top)+4rem)]">

        <AnimatePresence mode="wait">

          {/* ── STEP 0: Choose Mode ────────────────────────────────────────── */}
          {step === 'scan_or_type' && mode === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="px-4 pt-6 pb-4 space-y-4"
            >
              <div className="text-center mb-2">
                <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
                  How would you like to add the device?
                </p>
              </div>

              {/* QR Scan option */}
              <motion.button
                id="choose-qr-scan-btn"
                whileTap={{ scale: 0.97 }}
                onClick={() => setMode('qr')}
                className={cn(
                  'w-full rounded-[1.75rem] border p-5 text-left transition-all',
                  'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20',
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/25 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <QrCode size={26} className="text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={cn('font-black text-sm', isDark ? 'text-white' : 'text-slate-900')}>
                        Scan QR Code
                      </p>
                      <span className="bg-emerald-500/15 border border-emerald-500/20 rounded-full px-2 py-0.5 text-emerald-400 text-[6.5px] font-black uppercase tracking-widest">
                        Recommended
                      </span>
                    </div>
                    <p className={cn('text-[9px] font-medium leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
                      Point your camera at the QR code on the Smart Box label. Fastest and error-free.
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <CheckCircle2 size={9} className="text-emerald-400" />
                      <span className="text-emerald-400 text-[7.5px] font-bold">Auto-fills Box ID + device type</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className={isDark ? 'text-white/20' : 'text-slate-300'} />
                </div>
              </motion.button>

              {/* Manual Entry option */}
              <motion.button
                id="choose-manual-entry-btn"
                whileTap={{ scale: 0.97 }}
                onClick={() => setMode('manual')}
                className={cn(
                  'w-full rounded-[1.75rem] border p-5 text-left transition-all',
                  isDark ? 'bg-[#0A1410] border-white/8' : 'bg-white border-slate-100 shadow-sm',
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0',
                    isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200',
                  )}>
                    <Keyboard size={26} className={isDark ? 'text-white/40' : 'text-slate-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-black text-sm mb-1', isDark ? 'text-white' : 'text-slate-900')}>
                      Enter Manually
                    </p>
                    <p className={cn('text-[9px] font-medium leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
                      Type the Box ID from the label (e.g. SB001) and select the device type.
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <CheckCircle2 size={9} className={isDark ? 'text-white/20' : 'text-slate-300'} />
                      <span className={cn('text-[7.5px] font-bold', isDark ? 'text-white/25' : 'text-slate-400')}>
                        Works when camera is unavailable
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className={isDark ? 'text-white/20' : 'text-slate-300'} />
                </div>
              </motion.button>

              {/* Info note */}
              <div className={cn(
                'rounded-2xl border px-4 py-3 flex items-start gap-3',
                isDark ? 'bg-sky-500/5 border-sky-500/15' : 'bg-sky-50 border-sky-200',
              )}>
                <Radio size={13} className="text-sky-400 flex-shrink-0 mt-0.5" />
                <p className={cn('text-[8px] font-medium leading-relaxed', isDark ? 'text-sky-300/60' : 'text-sky-700')}>
                  Make sure your Smart Box is powered on. It will broadcast a signal for the Master Box to pick up automatically after registration.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: QR Scan ───────────────────────────────────────────── */}
          {step === 'scan_or_type' && mode === 'qr' && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="pt-4"
            >
              <QRScannerView
                isDark={isDark}
                onScanned={(boxId, dc, fv) => handleDeviceFound(boxId, dc, fv, 'qr')}
                onCancel={() => setMode('manual')}
              />
            </motion.div>
          )}

          {/* ── STEP 1: Manual Entry ──────────────────────────────────────── */}
          {step === 'scan_or_type' && mode === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="pt-4"
            >
              <ManualEntryView
                isDark={isDark}
                onConfirm={(boxId, dc) => handleDeviceFound(boxId, dc, undefined, 'manual')}
              />
            </motion.div>
          )}

          {/* ── STEP 2: Configure ─────────────────────────────────────────── */}
          {step === 'configure' && device && (
            <motion.div
              key="configure"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="pt-4"
            >
              <ConfigureStep
                device={device}
                ponds={ponds}
                isDark={isDark}
                onRegister={handleRegister}
                onBack={() => { setStep('scan_or_type'); setDevice(null); }}
              />
            </motion.div>
          )}

          {/* ── STEP 3: Success ───────────────────────────────────────────── */}
          {step === 'success' && success && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="pt-4"
            >
              <SuccessView
                deviceName={success.deviceName}
                boxId={success.boxId}
                isDark={isDark}
                onDone={() => navigate(-1)}
                onRegisterAnother={resetAll}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default DeviceRegistration;
