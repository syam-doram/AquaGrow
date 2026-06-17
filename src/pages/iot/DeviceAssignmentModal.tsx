import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wind, Droplets, Fish, Waves, Settings, X, CheckCircle2, ChevronRight,
} from 'lucide-react';
import {
  espnowService,
  type EspDiscoverEntry,
  type DeviceType,
  DEVICE_TYPE_OPTIONS,
} from '../../services/espnowService';
import { cn } from '../../utils/cn';

// ─── Icon mapping per device type ────────────────────────────────────────────
const DEVICE_TYPE_ICONS: Record<DeviceType | string, React.ElementType> = {
  AERATOR: Wind,
  SENSOR:  Droplets,
  FEEDER:  Fish,
  PUMP:    Waves,
  CUSTOM:  Settings,
  MASTER:  Settings,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface DeviceAssignmentModalProps {
  entry: EspDiscoverEntry;          // the discover queue item to assign
  pondId: string;
  isDark: boolean;
  onAssigned: () => void;           // called after successful assignment
  onDismiss: () => void;            // called when user closes without assigning
}

// ─────────────────────────────────────────────────────────────────────────────
//  DEVICE ASSIGNMENT MODAL
// ─────────────────────────────────────────────────────────────────────────────

export const DeviceAssignmentModal = ({
  entry, pondId, isDark, onAssigned, onDismiss,
}: DeviceAssignmentModalProps) => {
  const [selectedType, setSelectedType] = useState<DeviceType>('AERATOR');
  const [displayName, setDisplayName]   = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [success, setSuccess]           = useState(false);

  // Auto-suggest a name based on selected type
  const suggestedName = DEVICE_TYPE_OPTIONS.find(o => o.value === selectedType)?.label ?? 'Smart Box';

  const handleAssign = async () => {
    const finalName = displayName.trim() || suggestedName;
    setLoading(true);
    setError(null);
    try {
      await espnowService.assignDevice({
        boxId: entry.boxId,
        displayName: finalName,
        deviceType: selectedType,
        pondId,
      });
      setSuccess(true);
      setTimeout(() => {
        onAssigned();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Assignment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center"
      onClick={e => { if (e.target === e.currentTarget) onDismiss(); }}
    >
      {/* Blurred scrim */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className={cn(
          'relative w-full max-w-[420px] rounded-t-[2rem] overflow-hidden pb-[env(safe-area-inset-bottom)]',
          isDark ? 'bg-[#0A1410]' : 'bg-white',
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className={cn('w-10 h-1 rounded-full', isDark ? 'bg-white/15' : 'bg-slate-200')} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-[7px] font-black uppercase tracking-widest">New Device Found</span>
            </div>
            <h2 className={cn('text-base font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              Assign Smart Box
            </h2>
            <p className={cn('text-[10px] font-bold mt-0.5', isDark ? 'text-white/30' : 'text-slate-500')}>
              Box ID: <span className={cn('font-black font-mono', isDark ? 'text-emerald-400' : 'text-emerald-600')}>{entry.boxId}</span>
            </p>
          </div>
          <button
            onClick={onDismiss}
            className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-500')}
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Success state */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/15 border border-emerald-500/25 rounded-2xl p-5 flex flex-col items-center gap-3"
              >
                <CheckCircle2 size={32} className="text-emerald-400" />
                <div className="text-center">
                  <p className="text-emerald-400 font-black text-sm">Device Assigned!</p>
                  <p className={cn('text-[9px] font-bold mt-0.5', isDark ? 'text-white/40' : 'text-slate-500')}>
                    {displayName.trim() || suggestedName} is now active on the dashboard.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!success && (
            <>
              {/* Device Type Picker */}
              <div>
                <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
                  What type of device is this?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DEVICE_TYPE_OPTIONS.map(opt => {
                    const Icon = DEVICE_TYPE_ICONS[opt.value] || Settings;
                    const isSelected = selectedType === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setSelectedType(opt.value);
                          setDisplayName(''); // reset name so suggestion updates
                        }}
                        className={cn(
                          'flex items-center gap-2.5 rounded-2xl border px-3 py-3 text-left transition-all',
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/30'
                            : isDark
                            ? 'bg-white/5 border-white/8 active:bg-white/10'
                            : 'bg-slate-50 border-slate-200 active:bg-slate-100',
                        )}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isDark ? 'bg-white/8 text-white/40' : 'bg-white text-slate-500',
                        )}>
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className={cn(
                            'text-[10px] font-black leading-tight',
                            isSelected ? 'text-emerald-400' : isDark ? 'text-white' : 'text-slate-800',
                          )}>
                            {opt.label}
                          </p>
                          <p className={cn(
                            'text-[7px] font-medium leading-tight mt-0.5 line-clamp-1',
                            isDark ? 'text-white/25' : 'text-slate-400',
                          )}>
                            {opt.description}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Device Name Input */}
              <div>
                <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/30' : 'text-slate-400')}>
                  Device Name
                </p>
                <div className={cn(
                  'flex items-center gap-3 rounded-2xl border px-4 py-3',
                  isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200',
                )}>
                  <div className={cn('text-lg flex-shrink-0')}>
                    {DEVICE_TYPE_OPTIONS.find(o => o.value === selectedType)?.emoji ?? '📦'}
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder={suggestedName}
                    className={cn(
                      'flex-1 bg-transparent outline-none text-[11px] font-bold',
                      isDark ? 'text-white placeholder:text-white/20' : 'text-slate-900 placeholder:text-slate-400',
                    )}
                    maxLength={40}
                  />
                </div>
                <p className={cn('text-[7px] font-medium mt-1.5 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
                  E.g. "Pond 1 Aerator", "DO Sensor", "Corner Pump". Leave blank to use the suggested name.
                </p>
              </div>

              {/* Preview */}
              <div className={cn(
                'rounded-2xl border px-4 py-3 flex items-center gap-3',
                isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-100',
              )}>
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0', isDark ? 'bg-white/8' : 'bg-white border border-slate-200')}>
                  {DEVICE_TYPE_OPTIONS.find(o => o.value === selectedType)?.emoji ?? '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-[10px] font-black truncate', isDark ? 'text-white' : 'text-slate-900')}>
                    {displayName.trim() || suggestedName}
                  </p>
                  <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>
                    {entry.boxId} · {DEVICE_TYPE_OPTIONS.find(o => o.value === selectedType)?.label}
                  </p>
                </div>
                <ChevronRight size={12} className={isDark ? 'text-white/15' : 'text-slate-300'} />
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

              {/* Submit */}
              <motion.button
                id={`assign-device-btn-${entry.boxId}`}
                whileTap={{ scale: 0.97 }}
                onClick={handleAssign}
                disabled={loading}
                className={cn(
                  'w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2',
                  loading
                    ? 'bg-emerald-500/30 text-emerald-400/50 cursor-not-allowed'
                    : 'bg-emerald-500 text-white active:bg-emerald-600',
                )}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Assigning…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    Assign Device
                  </>
                )}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DeviceAssignmentModal;
