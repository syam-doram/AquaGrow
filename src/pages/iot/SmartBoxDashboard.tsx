import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, RefreshCw, Wifi, WifiOff, Zap, Thermometer,
  Droplets, Wind, Activity, Clock, AlertTriangle,
  CheckCircle2, XCircle, Timer, Radio, Signal, BatteryMedium,
  ToggleLeft, ToggleRight, ChevronRight, Cpu, Waves,
  Sparkles, GitBranch, Bell, Settings, QrCode, Plus,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import {
  espnowService,
  type PondIoTStatus,
  type EspDevice,
  type EspAeratorCommand,
  type EspSensorReading,
  type EspDiscoverEntry,
  type CommandAction,
  type DeviceType,
  DEVICE_TYPE_OPTIONS,
} from '../../services/espnowService';
import { DeviceAssignmentModal } from './DeviceAssignmentModal';
import { cn } from '../../utils/cn';

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS   = 5000;
const DISCOVER_POLL_MS   = 10000;

const SENSOR_THRESHOLDS: Record<string, { min?: number; max?: number }> = {
  do:        { min: 4.0 },
  ph:        { min: 7.0, max: 8.5 },
  temp:      { min: 25.0, max: 32.0 },
  salinity:  { min: 5, max: 35 },
  ammonia:   { max: 0.1 },
  turbidity: { max: 60 },
  tds:       {},
};

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getSensorColor = (key: string, val?: number | null) => {
  // Treat null, undefined, AND exactly 0 as 'no data' (sensor not calibrated / no reading)
  if (val == null || val === 0) return 'text-slate-400';
  const t = SENSOR_THRESHOLDS[key];
  if (!t) return 'text-sky-400';
  const low  = t.min !== undefined && val < t.min;
  const high = t.max !== undefined && val > t.max;
  if (low || high) return 'text-red-400';
  if ((t.min && val < t.min * 1.1) || (t.max && val > t.max * 0.95)) return 'text-amber-400';
  return 'text-emerald-400';
};

const getSensorBg = (key: string, val?: number | null, isDark = true) => {
  if (val == null || val === 0) return isDark
    ? 'bg-white/3 border-white/8'
    : 'bg-slate-50 border-slate-200';
  const color = getSensorColor(key, val);
  if (color.includes('red'))     return isDark ? 'bg-red-500/10 border-red-500/20'     : 'bg-red-50 border-red-200';
  if (color.includes('amber'))   return isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200';
  if (color.includes('emerald')) return isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200';
  if (color.includes('sky'))     return isDark ? 'bg-sky-500/10 border-sky-500/20'     : 'bg-sky-50 border-sky-200';
  return isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200';
};

const DEVICE_TYPE_ICONS: Record<string, React.ElementType> = {
  AERATOR: Wind,
  SENSOR:  Droplets,
  FEEDER:  BatteryMedium,
  PUMP:    Waves,
  CUSTOM:  Settings,
  MASTER:  Radio,
};

// ─────────────────────────────────────────────────────────────────────────────
//  SMALL SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const LiveBadge = () => (
  <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2.5 py-1">
    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
    <span className="text-emerald-400 text-[7px] font-black uppercase tracking-widest">Live</span>
  </div>
);

const OnlinePill = ({ online, lastSeenAgo }: { online: boolean; lastSeenAgo?: string }) => (
  <div className={cn(
    'flex items-center gap-1.5 rounded-full px-2.5 py-1 border',
    online
      ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
      : 'bg-red-500/10 border-red-500/20 text-red-400',
  )}>
    <div className={cn('w-1.5 h-1.5 rounded-full', online ? 'bg-emerald-400 animate-pulse' : 'bg-red-400')} />
    <span className="text-[7px] font-black uppercase tracking-widest">
      {online ? 'Online' : `Offline${lastSeenAgo ? ` · ${lastSeenAgo}` : ''}`}
    </span>
  </div>
);

const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string; Icon: any }> = {
    pending:   { label: 'Pending',   cls: 'bg-amber-500/15 border-amber-500/25 text-amber-400',   Icon: Timer },
    sent:      { label: 'Sent',      cls: 'bg-sky-500/15   border-sky-500/25   text-sky-400',     Icon: Radio },
    confirmed: { label: 'Confirmed', cls: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400', Icon: CheckCircle2 },
    failed:    { label: 'Failed',    cls: 'bg-red-500/15   border-red-500/20   text-red-400',     Icon: XCircle },
    timeout:   { label: 'Timeout',   cls: 'bg-white/5      border-white/10     text-white/30',    Icon: Clock },
  };
  const m = map[status] || map.timeout;
  return (
    <div className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 border text-[7px] font-black uppercase tracking-widest', m.cls)}>
      <m.Icon size={9} />
      {m.label}
    </div>
  );
};

const SensorTile = ({
  label, value, unit, keyName, icon: Icon, isDark,
}: { label: string; value?: number | null; unit: string; keyName: string; icon: any; isDark: boolean }) => {
  const hasData = value != null && value !== 0;
  const color   = hasData ? getSensorColor(keyName, value) : (isDark ? 'text-white/20' : 'text-slate-400');
  const bg      = getSensorBg(keyName, value, isDark);
  return (
    <div className={cn('rounded-2xl border p-3 flex flex-col gap-1', bg)}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={10} className={color} />
        <span className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-500')}>{label}</span>
      </div>
      <p className={cn('font-black text-xl leading-none tracking-tight', color)}>
        {hasData ? value!.toFixed(value! < 10 ? 2 : 1) : '—'}
      </p>
      <p className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>{unit}</p>
    </div>
  );
};

const PowerChip = ({ label, value, unit, isDark }: { label: string; value?: number | null; unit: string; isDark: boolean }) => (
  <div className={cn('flex-1 text-center rounded-xl py-2 px-1 border', isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}>
    <p className={cn('text-[6px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/25' : 'text-slate-400')}>{label}</p>
    <p className={cn('font-black text-sm leading-none', value != null && value !== 0 ? 'text-amber-500' : isDark ? 'text-white/15' : 'text-slate-300')}>
      {value != null && value !== 0 ? value.toFixed(1) : '—'}
    </p>
    <p className={cn('text-[5.5px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>{unit}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  DISCOVERY BANNER
// ─────────────────────────────────────────────────────────────────────────────

interface DiscoveryBannerProps {
  entries: EspDiscoverEntry[];
  isDark: boolean;
  onAssign: (entry: EspDiscoverEntry) => void;
}

const DiscoveryBanner = ({ entries, isDark, onAssign }: DiscoveryBannerProps) => {
  if (entries.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-2"
    >
      <p className={cn('text-[7px] font-black uppercase tracking-widest px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
        <Sparkles size={8} className="inline mr-1" />
        New Devices Found · {entries.length}
      </p>
      {entries.map(entry => (
        <motion.div
          key={entry.boxId}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            'rounded-[1.75rem] border overflow-hidden',
            isDark ? 'bg-gradient-to-r from-[#041A0E] to-[#071410] border-emerald-500/25' : 'bg-emerald-50 border-emerald-200',
          )}
        >
          <div className="px-4 py-3.5 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/25 rounded-2xl flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className={cn('text-[11px] font-black', isDark ? 'text-white' : 'text-slate-900')}>
                  New Device Found
                </p>
                <span className="bg-emerald-500/15 border border-emerald-500/20 rounded-full px-2 py-0.5 text-emerald-400 text-[7px] font-black uppercase tracking-widest">
                  {entry.boxId}
                </span>
              </div>
              <p className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-slate-500')}>
                Discovered {espnowService.relativeTime(entry.discoveredAt)} · via {entry.masterId}
              </p>
            </div>
            <motion.button
              id={`assign-btn-${entry.boxId}`}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAssign(entry)}
              className="flex items-center gap-1.5 bg-emerald-500 text-white rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest flex-shrink-0"
            >
              Assign <ChevronRight size={11} />
            </motion.button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────
//  MOTOR STATUS HELPERS
// ─────────────────────────────────────────────────────────────────

type MotorStatus = 'RUNNING' | 'STOPPED' | 'POWER_FAILURE' | 'FAULT' | 'OVERCURRENT';

const MOTOR_STATUS_CONFIG: Record<MotorStatus, {
  label: string;
  sublabel: string;
  color: string;
  bg: string;
  border: string;
  darkBg: string;
  darkBorder: string;
}> = {
  RUNNING: {
    label: 'Aerator Running',
    sublabel: 'Motor is operating normally',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    darkBg: 'bg-emerald-500/10',
    darkBorder: 'border-emerald-500/20',
  },
  STOPPED: {
    label: 'Aerator Stopped',
    sublabel: 'Relay OFF — stopped by command',
    color: 'text-slate-400',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    darkBg: 'bg-white/5',
    darkBorder: 'border-white/10',
  },
  POWER_FAILURE: {
    label: 'Power Failure',
    sublabel: 'Relay ON but no voltage — check EB / MCB',
    color: 'text-amber-400',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    darkBg: 'bg-amber-500/10',
    darkBorder: 'border-amber-500/25',
  },
  FAULT: {
    label: 'Motor Fault',
    sublabel: 'Relay ON + power OK but no current — check motor / contactor',
    color: 'text-red-400',
    bg: 'bg-red-50',
    border: 'border-red-200',
    darkBg: 'bg-red-500/10',
    darkBorder: 'border-red-500/25',
  },
  OVERCURRENT: {
    label: 'Overcurrent Alert',
    sublabel: 'Motor drawing too much current — check for short circuit',
    color: 'text-orange-400',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    darkBg: 'bg-orange-500/10',
    darkBorder: 'border-orange-200/25',
  },
};

const MOTOR_STATUS_ICONS: Record<MotorStatus, React.ComponentType<{ size?: number; className?: string }>> = {
  RUNNING:       Wind,
  STOPPED:       Wind,
  POWER_FAILURE: Zap,
  FAULT:         AlertTriangle,
  OVERCURRENT:   AlertTriangle,
};

// ─────────────────────────────────────────────────────────────────
//  AERATOR TOGGLE
// ─────────────────────────────────────────────────────────────────

interface AeratorToggleProps {
  device: EspDevice;
  pondId: string;
  hasPendingCmd: boolean;
  onCommandSent: () => void;
  isDark: boolean;
}

const AeratorToggle = ({ device, pondId, hasPendingCmd, onCommandSent, isDark }: AeratorToggleProps) => {
  const [loading, setLoading]       = useState(false);
  const [localState, setLocalState] = useState<'ON' | 'OFF' | 'UNKNOWN'>(device.aeratorState);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => { setLocalState(device.aeratorState); }, [device.aeratorState]);

  const toggle = async () => {
    if (loading || hasPendingCmd) return;
    const action: CommandAction    = localState === 'ON' ? 'OFF' : 'ON';
    const optimistic: 'ON' | 'OFF' = action;

    setLoading(true);
    setError(null);
    setLocalState(optimistic);

    try {
      if (device.boxId) {
        await espnowService.sendCommandById({ boxId: device.boxId, action, pondId });
      } else {
        throw new Error('Device has no Box ID. Please re-register the device.');
      }
      onCommandSent();
    } catch (err: any) {
      setError(err.message || 'Command failed');
      setLocalState(device.aeratorState);
    } finally {
      setLoading(false);
    }
  };

  // Derive display status — prefer firmware-reported motorStatus, fall back to relay state
  const motorStatus = ((device as any).motorStatus as MotorStatus | undefined)
    || (localState === 'ON' ? 'RUNNING' : localState === 'OFF' ? 'STOPPED' : undefined);
  const cfg = motorStatus ? MOTOR_STATUS_CONFIG[motorStatus] : MOTOR_STATUS_CONFIG.STOPPED;
  const StatusIcon = motorStatus ? MOTOR_STATUS_ICONS[motorStatus] : Wind;

  const isOn   = localState === 'ON';
  const locked = loading || hasPendingCmd;

  const isAlert = motorStatus === 'POWER_FAILURE' || motorStatus === 'FAULT' || motorStatus === 'OVERCURRENT';

  return (
    <div className="space-y-2">

      {/* ─ Real motor status banner ─ */}
      <motion.button
        id={`aerator-toggle-${device.boxId || device._id}`}
        whileTap={{ scale: 0.97 }}
        onClick={toggle}
        disabled={locked}
        className={cn(
          'w-full rounded-2xl border px-4 py-3 transition-all',
          locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
          isDark
            ? `${cfg.darkBg} ${cfg.darkBorder}`
            : `${cfg.bg} ${cfg.border}`,
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0',
              isDark ? `${cfg.darkBg} ${cfg.darkBorder}` : `${cfg.bg} ${cfg.border}`,
            )}>
              <StatusIcon
                size={15}
                className={cn(cfg.color, motorStatus === 'RUNNING' ? 'animate-pulse' : '')}
              />
            </div>
            <div className="text-left">
              <p className={cn('text-[10px] font-black uppercase tracking-widest', cfg.color)}>
                {cfg.label}
              </p>
              <p className={cn('text-[7px] font-medium mt-0.5', isDark ? 'text-white/30' : 'text-slate-500')}>
                {hasPendingCmd ? 'Command pending…' : cfg.sublabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {isOn
              ? <ToggleRight size={22} className={cfg.color} />
              : <ToggleLeft  size={22} className={isDark ? 'text-white/20' : 'text-slate-300'} />
            }
          </div>
        </div>

        {/* Voltage + Current inline */}
        {((device as any).voltage != null || (device as any).current != null) && (
          <div className={cn('flex gap-3 mt-3 pt-2.5 border-t', isDark ? 'border-white/5' : 'border-black/5')}>
            {(device as any).voltage != null && (
              <div className="flex items-center gap-1">
                <Zap size={9} className={isDark ? 'text-white/25' : 'text-slate-400'} />
                <span className={cn('text-[8px] font-black tabular-nums', isDark ? 'text-white/50' : 'text-slate-600')}>
                  {Number((device as any).voltage).toFixed(1)}V
                </span>
              </div>
            )}
            {(device as any).current != null && (
              <div className="flex items-center gap-1">
                <Activity size={9} className={isDark ? 'text-white/25' : 'text-slate-400'} />
                <span className={cn('text-[8px] font-black tabular-nums', isDark ? 'text-white/50' : 'text-slate-600')}>
                  {Number((device as any).current).toFixed(2)}A
                </span>
              </div>
            )}
            {(device as any).powerWatts != null && (
              <div className="flex items-center gap-1">
                <BatteryMedium size={9} className={isDark ? 'text-white/25' : 'text-slate-400'} />
                <span className={cn('text-[8px] font-black tabular-nums', isDark ? 'text-white/50' : 'text-slate-600')}>
                  {Number((device as any).powerWatts).toFixed(0)}W
                </span>
              </div>
            )}
          </div>
        )}
      </motion.button>

      {/* Alert chip for fault states */}
      <AnimatePresence>
        {isAlert && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-[7.5px] font-bold',
              motorStatus === 'POWER_FAILURE'
                ? isDark ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
                : isDark ? 'bg-red-500/10 border-red-500/25 text-red-400'       : 'bg-red-50 border-red-200 text-red-700'
            )}
          >
            <AlertTriangle size={10} className="flex-shrink-0" />
            {motorStatus === 'POWER_FAILURE' && 'Check EB supply, MCB, and wiring connections'}
            {motorStatus === 'FAULT'         && 'Relay ON but motor drawing no current — check motor and contactor'}
            {motorStatus === 'OVERCURRENT'   && 'Motor drawing too much current — turn off immediately and inspect'}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-red-400 text-[8px] font-bold px-1"
          >
            ⚠ {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
//  SMART BOX CARD  (one per slave)
// ─────────────────────────────────────────────────────────────────────────────

interface SmartBoxCardProps {
  device: EspDevice;
  pondId: string;
  pendingCommands: EspAeratorCommand[];
  onCommandSent: () => void;
  isDark: boolean;
  index: number;
}

const SmartBoxCard = ({ device, pondId, pendingCommands, onCommandSent, isDark, index }: SmartBoxCardProps) => {
  const hasPendingCmd = pendingCommands.some(c => c.targetBoxId === device.boxId);
  const DeviceIcon = DEVICE_TYPE_ICONS[device.deviceType || 'AERATOR'] || Wind;
  const displayName = espnowService.getDeviceLabel(device);
  const typeLabel   = DEVICE_TYPE_OPTIONS.find(o => o.value === device.deviceType)?.label || 'Smart Box';
  const isOnline    = device.online ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={cn(
        'rounded-[1.75rem] border overflow-hidden',
        isOnline
          ? isDark
            ? 'bg-gradient-to-br from-[#071A10] to-[#0A1410] border-emerald-500/20'
            : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-sm'
          : isDark
            ? 'bg-[#0D0D10] border-white/8'
            : 'bg-white border-slate-200 shadow-sm',
      )}
    >
      {/* Coloured top accent bar */}
      <div className={cn('h-0.5 w-full', isOnline ? 'bg-emerald-400' : isDark ? 'bg-white/10' : 'bg-slate-200')} />

      {/* Card header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-11 h-11 rounded-2xl border flex items-center justify-center',
            isOnline
              ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
              : isDark ? 'bg-white/5 border-white/10 text-white/20' : 'bg-slate-100 border-slate-200 text-slate-400',
          )}>
            <DeviceIcon size={18} />
          </div>
          <div>
            <p className={cn('text-[12px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              {displayName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn('text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border',
                isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-slate-100 border-slate-200 text-slate-400'
              )}>{device.boxId || '—'}</span>
              <span className={cn('text-[6.5px] font-bold uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>{typeLabel}</span>
            </div>
          </div>
        </div>
        <OnlinePill online={isOnline} lastSeenAgo={device.lastSeenAgo} />
      </div>

      {/* Offline callout — shows when device never seen */}
      {!isOnline && !device.lastSeenAgo && (
        <div className={cn('mx-4 mb-3 rounded-2xl border px-3 py-2.5 flex items-start gap-2',
          isDark ? 'bg-amber-500/8 border-amber-500/20' : 'bg-amber-50 border-amber-200'
        )}>
          <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 text-[8px] font-black uppercase tracking-widest">Not Yet Seen</p>
            <p className={cn('text-[7px] font-medium mt-0.5', isDark ? 'text-white/30' : 'text-slate-500')}>
              Power on the Smart Box. It will broadcast DISCOVER and pair with the Master Box automatically.
            </p>
          </div>
        </div>
      )}

      {/* Offline but was seen before */}
      {!isOnline && device.lastSeenAgo && (
        <div className={cn('mx-4 mb-3 rounded-2xl border px-3 py-2 flex items-center gap-2',
          isDark ? 'bg-red-500/8 border-red-500/15' : 'bg-red-50 border-red-200'
        )}>
          <WifiOff size={11} className="text-red-400 flex-shrink-0" />
          <p className={cn('text-[7.5px] font-bold', isDark ? 'text-red-400/80' : 'text-red-600')}>
            Last seen {device.lastSeenAgo} — check ESP-NOW range
          </p>
        </div>
      )}

      <div className="px-4 pb-4 space-y-3">
        {/* Aerator Toggle — only for AERATOR and PUMP type devices */}
        {(!device.deviceType || device.deviceType === 'AERATOR' || device.deviceType === 'PUMP' || device.deviceType === 'CUSTOM') && (
          <AeratorToggle
            device={device}
            pondId={pondId}
            hasPendingCmd={hasPendingCmd}
            onCommandSent={onCommandSent}
            isDark={isDark}
          />
        )}

        {/* Signal + last seen footer */}
        <div className={cn('flex items-center justify-between pt-1 border-t', isDark ? 'border-white/5' : 'border-slate-100')}>
          {device.signalStrength != null ? (
            <div className={cn('flex items-center gap-1.5', isDark ? 'text-white/30' : 'text-slate-400')}>
              <Signal size={10} />
              <span className="text-[7px] font-black">{device.signalStrength} dBm</span>
            </div>
          ) : <div />}
          <div className={cn('flex items-center gap-1', isDark ? 'text-white/20' : 'text-slate-400')}>
            <Clock size={9} />
            <span className="text-[7px] font-bold">{device.lastSeenAgo || 'Never seen'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  MASTER BOX CARD
// ─────────────────────────────────────────────────────────────────────────────

const MasterBoxCard = ({ device, isDark }: { device: EspDevice; isDark: boolean }) => (
  <div className={cn(
    'rounded-[1.75rem] border p-4 relative overflow-hidden',
    'bg-gradient-to-br from-[#01200F] to-[#071A10] border-emerald-500/15',
  )}>
    <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
            <Radio size={14} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-400 text-[7px] font-black uppercase tracking-widest">Master Gateway</p>
            <p className="text-white text-[11px] font-black tracking-tight">
              {espnowService.getDeviceLabel(device)}
            </p>
          </div>
        </div>
        <OnlinePill online={device.online ?? false} lastSeenAgo={device.lastSeenAgo} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-[7px]">
        {/* Show Box ID — not MAC */}
        <div className="bg-white/5 border border-white/8 rounded-xl px-3 py-2">
          <p className="text-white/25 uppercase tracking-widest mb-0.5">Box ID</p>
          <p className="text-white/70 font-black font-mono">{device.boxId || '—'}</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-xl px-3 py-2">
          <p className="text-white/25 uppercase tracking-widest mb-0.5">Heartbeat</p>
          <p className="text-white/60 font-bold">{device.heartbeatAgo || 'Never'}</p>
        </div>
        {device.firmwareVersion && (
          <div className="col-span-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2">
            <p className="text-white/25 uppercase tracking-widest mb-0.5">Firmware</p>
            <p className="text-white/60 font-bold">{device.firmwareVersion}</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  TOPOLOGY TREE
// ─────────────────────────────────────────────────────────────────────────────

const TopologyTree = ({
  master, slaves, isDark,
}: { master: EspDevice; slaves: EspDevice[]; isDark: boolean }) => (
  <div className={cn('rounded-[1.75rem] border p-4', isDark ? 'bg-[#0A1410] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
    <div className="flex items-center gap-2 mb-3">
      <GitBranch size={11} className={isDark ? 'text-white/25' : 'text-slate-400'} />
      <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
        Device Network
      </p>
    </div>

    {/* Master row */}
    <div className="flex items-center gap-3 mb-2">
      <div className="w-7 h-7 bg-emerald-500/15 border border-emerald-500/25 rounded-xl flex items-center justify-center flex-shrink-0">
        <Radio size={11} className="text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-[10px] font-black truncate', isDark ? 'text-white' : 'text-slate-900')}>
          {espnowService.getDeviceLabel(master)}
        </p>
        <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-emerald-400/60' : 'text-emerald-600')}>
          {master.boxId} · Master
        </p>
      </div>
      <OnlinePill online={master.online ?? false} />
    </div>

    {/* Branch lines + Smart Boxes */}
    {slaves.map((slave, i) => {
      const isLast    = i === slaves.length - 1;
      const DeviceIcon = DEVICE_TYPE_ICONS[slave.deviceType || 'AERATOR'] || Wind;
      const displayName = espnowService.getDeviceLabel(slave);
      const typeEmoji  = espnowService.getDeviceTypeEmoji(slave.deviceType);

      return (
        <div key={slave._id} className="flex items-start gap-0">
          {/* Branch connector */}
          <div className="flex flex-col items-center mr-2 mt-1" style={{ width: 16 }}>
            <div className={cn('w-px flex-1 min-h-[8px]', isDark ? 'bg-white/10' : 'bg-slate-200')} />
            <div className={cn('w-3 h-px', isDark ? 'bg-white/10' : 'bg-slate-200')} />
            {!isLast && <div className={cn('w-px flex-1', isDark ? 'bg-white/10' : 'bg-slate-200')} />}
          </div>
          {/* Device row */}
          <div className={cn(
            'flex-1 flex items-center gap-2.5 py-2 px-3 rounded-2xl mb-1.5',
            isDark ? 'bg-white/3' : 'bg-slate-50',
          )}>
            <div className={cn(
              'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0',
              slave.online
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-white/5 text-white/20',
            )}>
              <DeviceIcon size={11} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-[9px] font-black truncate', isDark ? 'text-white' : 'text-slate-900')}>
                {typeEmoji} {displayName}
              </p>
              <p className={cn('text-[6.5px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
                {slave.boxId}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {slave.aeratorState === 'ON' && (
                <div className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/20 rounded-full px-1.5 py-0.5">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-emerald-400 text-[6px] font-black uppercase">ON</span>
                </div>
              )}
              {slave.aeratorState === 'OFF' && (
                <div className="bg-red-500/10 border border-red-500/15 rounded-full px-1.5 py-0.5">
                  <span className="text-red-400 text-[6px] font-black uppercase">OFF</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    })}

    {slaves.length === 0 && (
      <p className={cn('text-[8px] font-medium text-center py-2', isDark ? 'text-white/20' : 'text-slate-400')}>
        No Smart Boxes paired yet
      </p>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  COMMAND HISTORY ITEM
// ─────────────────────────────────────────────────────────────────────────────

const CommandItem = ({ cmd, index }: { cmd: EspAeratorCommand; index: number }) => {
  const actionColor: Record<string, string> = {
    ON:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    OFF:   'bg-red-500/10    text-red-400    border-red-500/20',
    SPEED: 'bg-sky-500/10   text-sky-400    border-sky-500/20',
    RESET: 'bg-amber-500/15 text-amber-400  border-amber-500/25',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0"
    >
      <div className={cn(
        'w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 text-[8px] font-black uppercase tracking-widest',
        actionColor[cmd.action] || 'bg-white/5 text-white/30 border-white/10',
      )}>
        {cmd.action}
      </div>
      <div className="flex-1 min-w-0">
        {/* Show device name or boxId — never a raw MAC */}
        <p className="text-[9px] font-black text-white/70 truncate">
          {cmd.targetDisplayName || cmd.targetBoxId || 'Unknown Device'}
        </p>
        <p className="text-[7px] text-white/20 mt-0.5">
          {new Date(cmd.issuedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>
      <StatusPill status={cmd.status} />
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  OFFLINE ALERT BANNER
// ─────────────────────────────────────────────────────────────────────────────

const OfflineAlertBanner = ({ devices, isDark }: { devices: EspDevice[]; isDark: boolean }) => {
  const offlineDevices = devices.filter(d => d.role === 'slave' && d.online === false && d.pairingStatus === 'assigned');
  if (offlineDevices.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 flex items-start gap-3"
    >
      <Bell size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-amber-400 text-[9px] font-black uppercase tracking-widest mb-1">
          {offlineDevices.length} Device{offlineDevices.length > 1 ? 's' : ''} Offline
        </p>
        {offlineDevices.map(d => (
          <p key={d._id} className="text-amber-400/60 text-[8px] font-bold">
            ⚠ {espnowService.getDeviceLabel(d)} — {d.lastSeenAgo ? `last seen ${d.lastSeenAgo}` : 'never seen'}
          </p>
        ))}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export const SmartBoxDashboard = () => {
  const { id: pondId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [status,     setStatus]     = useState<PondIoTStatus | null>(null);
  const [commands,   setCommands]   = useState<EspAeratorCommand[]>([]);
  const [discoveries, setDiscoveries] = useState<EspDiscoverEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [lastPoll,   setLastPoll]   = useState<Date | null>(null);
  const [spinning,   setSpinning]   = useState(false);
  const [assignTarget, setAssignTarget] = useState<EspDiscoverEntry | null>(null);

  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const discoverRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (showSpinner = false) => {
    if (!pondId) return;
    if (showSpinner) setSpinning(true);
    try {
      const [s, c] = await Promise.all([
        espnowService.getPondStatus(pondId),
        espnowService.getCommandHistory(pondId, { limit: 10 }),
      ]);
      setStatus(s);
      setCommands(c);
      setError(null);
      setLastPoll(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch IoT status');
    } finally {
      setLoading(false);
      if (showSpinner) setSpinning(false);
    }
  }, [pondId]);

  const fetchDiscoveries = useCallback(async () => {
    if (!pondId) return;
    try {
      const entries = await espnowService.getPendingDiscoveries(pondId);
      setDiscoveries(entries);
    } catch {
      // Non-critical — don't show error for discovery polling
    }
  }, [pondId]);

  useEffect(() => {
    fetchAll();
    fetchDiscoveries();
    pollRef.current     = setInterval(() => fetchAll(), POLL_INTERVAL_MS);
    discoverRef.current = setInterval(() => fetchDiscoveries(), DISCOVER_POLL_MS);
    return () => {
      if (pollRef.current)     clearInterval(pollRef.current);
      if (discoverRef.current) clearInterval(discoverRef.current);
    };
  }, [fetchAll, fetchDiscoveries]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const masterDevice        = status?.devices.find(d => d.role === 'master');
  const slaveDevices        = status?.devices.filter(d => d.role === 'slave') ?? [];
  // Only show sensor data / commands for Smart Boxes that have been assigned by the farmer.
  // Discovered (unassigned) devices only appear in the "New Devices Found" banner.
  const assignedSlaves      = slaveDevices.filter(d => d.pairingStatus === 'assigned');
  const hasAssignedSlaves   = assignedSlaves.length > 0;
  const reading: EspSensorReading | null = status?.latestReading ?? null;
  const pendingCmds         = status?.pendingCommandDetails ?? [];

  const SENSORS: { key: string; label: string; value: number | undefined; unit: string; icon: any }[] = [
    { key: 'do',       label: 'DO',        unit: 'mg/L', icon: Droplets,      value: reading?.do },
    { key: 'ph',       label: 'pH',        unit: '',     icon: Activity,      value: reading?.ph },
    { key: 'temp',     label: 'Temp',      unit: '°C',   icon: Thermometer,   value: reading?.temp },
    { key: 'salinity', label: 'Salinity',  unit: 'ppt',  icon: Waves,         value: reading?.salinity },
    { key: 'ammonia',  label: 'Ammonia',   unit: 'mg/L', icon: AlertTriangle, value: reading?.ammonia },
    { key: 'turbidity',label: 'Turbidity', unit: 'NTU',  icon: Wind,          value: reading?.turbidity },
    { key: 'tds',      label: 'TDS',       unit: 'mg/L', icon: BatteryMedium, value: reading?.tds },
  ];

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={cn('min-h-screen flex flex-col', isDark ? 'bg-[#06100A]' : 'bg-[#F0F4F2]')}>
        <header className={cn(
          'fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 px-4 backdrop-blur-xl border-b',
          'pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center gap-3',
          isDark ? 'bg-[#06100A]/90 border-white/5' : 'bg-white/90 border-slate-100',
        )}>
          <button onClick={() => navigate(-1)} className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-700')}>
            <ChevronLeft size={18} />
          </button>
          <div className="h-4 w-32 bg-white/10 rounded-lg animate-pulse" />
        </header>
        <div className="pt-24 px-4 space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className={cn('rounded-[1.75rem] h-32 animate-pulse', isDark ? 'bg-white/5' : 'bg-slate-200')} />
          ))}
        </div>
      </div>
    );
  }

  // ── No devices state ───────────────────────────────────────────────────────
  if (!loading && !error && status?.devices.length === 0 && discoveries.length === 0) {
    return (
      <div className={cn('min-h-screen', isDark ? 'bg-[#06100A]' : 'bg-[#F0F4F2]')}>
        <header className={cn(
          'fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 px-4 backdrop-blur-xl border-b',
          'pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center gap-3',
          isDark ? 'bg-[#06100A]/90 border-white/5' : 'bg-white/90 border-slate-100',
        )}>
          <button onClick={() => navigate(-1)} className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-700')}>
            <ChevronLeft size={18} />
          </button>
          <h1 className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Smart Box Control</h1>
          <button
            onClick={() => fetchAll(true)}
            className={cn('ml-auto w-9 h-9 rounded-xl flex items-center justify-center border', isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-white border-slate-200 text-slate-500')}
          >
            <RefreshCw size={14} />
          </button>
        </header>
        <div className="pt-24 px-4 space-y-4">

          {/* Error banner if any */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
              <WifiOff size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-[9px] font-bold">{error}</p>
            </div>
          )}

          {/* No Master Box registered yet */}
          <div className={cn('rounded-[1.75rem] border p-6 text-center', isDark ? 'bg-[#0A1410] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
            <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Radio size={28} className="text-violet-400" />
            </div>
            <h2 className={cn('font-black text-sm mb-2', isDark ? 'text-white' : 'text-slate-900')}>No Master Box Found</h2>
            <p className={cn('text-[9px] font-medium leading-relaxed mb-5', isDark ? 'text-white/30' : 'text-slate-500')}>
              Register your Master Box first. It connects to the cloud and manages all Smart Boxes over ESP-NOW.
            </p>
            <motion.button
              id="empty-register-master-btn"
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/ponds/${pondId}/iot/register`)}
              className="w-full py-4 rounded-2xl bg-violet-500 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Plus size={15} /> Register Master Box
            </motion.button>
          </div>

          {/* Step guide */}
          <div className={cn('rounded-2xl border p-4 space-y-3', isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200')}>
            <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>Setup Guide</p>
            {[
              { step: '1', text: 'Register Master Box via this app → get API Key', color: 'text-violet-400' },
              { step: '2', text: 'Flash the API Key into Master Box firmware', color: 'text-sky-400' },
              { step: '3', text: 'Power on Master Box → heartbeat shows 200 OK', color: 'text-emerald-400' },
              { step: '4', text: 'Power on Smart Boxes → they auto-discover', color: 'text-amber-400' },
            ].map(({ step, text, color }) => (
              <div key={step} className="flex items-start gap-3">
                <div className={cn('w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 text-[7px] font-black', isDark ? 'border-white/15 text-white/30' : 'border-slate-300 text-slate-400')}>
                  {step}
                </div>
                <p className={cn('text-[8px] font-bold leading-relaxed pt-0.5', isDark ? 'text-white/40' : 'text-slate-500')}>
                  <span className={color}>{text.split(' → ')[0]}</span>
                  {text.includes(' → ') ? ` → ${text.split(' → ')[1]}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }


  // ── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <div className={cn('min-h-screen pb-10', isDark ? 'bg-[#06100A]' : 'bg-[#F0F4F2]')}>

      {/* ── HEADER ── */}
      <header className={cn(
        'fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 px-4 backdrop-blur-xl border-b',
        'pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center justify-between gap-3',
        isDark ? 'bg-[#06100A]/90 border-white/5' : 'bg-white/90 border-slate-100',
      )}>
        <button
          onClick={() => navigate(-1)}
          className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90', isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-700')}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className={cn('font-black text-sm tracking-tight truncate', isDark ? 'text-white' : 'text-slate-900')}>
            {status?.pondName || 'Smart Box Control'}
          </h1>
          <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>
            {status?.devices.length ?? 0} devices · auto-refresh 5s
          </p>
        </div>

        <div className="flex items-center gap-2">
          {discoveries.length > 0 && (
            <div className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/25 rounded-full px-2 py-1">
              <Sparkles size={9} className="text-emerald-400" />
              <span className="text-emerald-400 text-[7px] font-black">{discoveries.length} new</span>
            </div>
          )}
          {/* Register new device button */}
          <motion.button
            id="iot-register-device-btn"
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`/ponds/${pondId}/iot/register`)}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center border transition-all', isDark ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600')}
            title="Register New Device"
          >
            <QrCode size={15} />
          </motion.button>
          <LiveBadge />
          <motion.button
            id="iot-refresh-btn"
            whileTap={{ scale: 0.9 }}
            onClick={() => { fetchAll(true); fetchDiscoveries(); }}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center border transition-all', isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-white border-slate-200 text-slate-500')}
          >
            <motion.div animate={{ rotate: spinning ? 360 : 0 }} transition={{ duration: 0.5 }}>
              <RefreshCw size={14} />
            </motion.div>
          </motion.button>
        </div>
      </header>

      <div className="pt-[calc(env(safe-area-inset-top)+4.5rem)] px-4 space-y-4">

        {/* ── ERROR BANNER ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 flex items-center gap-3"
            >
              <WifiOff size={16} className="text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-400 text-[9px] font-black uppercase tracking-widest">Connection Error</p>
                <p className="text-red-400/60 text-[8px] mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── DISCOVERY BANNER (New Device Found) ── */}
        <AnimatePresence>
          {discoveries.length > 0 && (
            <DiscoveryBanner
              entries={discoveries}
              isDark={isDark}
              onAssign={entry => setAssignTarget(entry)}
            />
          )}
        </AnimatePresence>

        {/* ── OFFLINE ALERTS ── */}
        {status?.devices && (
          <OfflineAlertBanner devices={status.devices} isDark={isDark} />
        )}

        {/* ── MASTER BOX ── */}
        {masterDevice && (
          <div>
            <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
              Master Gateway
            </p>
            <MasterBoxCard device={masterDevice} isDark={isDark} />
          </div>
        )}

        {/* ── TOPOLOGY TREE ── */}
        {masterDevice && slaveDevices.length > 0 && (
          <TopologyTree master={masterDevice} slaves={slaveDevices} isDark={isDark} />
        )}




        {/* ── SMART BOXES (assigned slaves only) ── */}
        {assignedSlaves.length > 0 && (
          <div>
            <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
              Smart Boxes · {assignedSlaves.length} unit{assignedSlaves.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-3">
              {assignedSlaves.map((d, i) => (
                <React.Fragment key={d._id}>
                  <SmartBoxCard
                    device={d}
                    pondId={pondId!}
                    pendingCommands={pendingCmds}
                    onCommandSent={() => fetchAll()}
                    isDark={isDark}
                    index={i}
                  />
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* ── COMMAND HISTORY — only when ≥1 Smart Box assigned ── */}
        {hasAssignedSlaves && commands.length > 0 && (
          <div>
            <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
              Command History
            </p>
            <div className={cn('rounded-[1.75rem] border overflow-hidden', isDark ? 'bg-[#0A1410] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
              <div className="px-4 py-2">
                {commands.map((cmd, i) => (
                  <React.Fragment key={cmd._id}>
                    <CommandItem cmd={cmd} index={i} />
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LAST POLL FOOTER ── */}
        {lastPoll && (
          <p className={cn('text-center text-[7px] font-bold pb-4', isDark ? 'text-white/10' : 'text-slate-300')}>
            Last synced: {lastPoll.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        )}
      </div>

      {/* ── DEVICE ASSIGNMENT MODAL ── */}
      <AnimatePresence>
        {assignTarget && (
          <DeviceAssignmentModal
            entry={assignTarget}
            pondId={pondId!}
            isDark={isDark}
            onAssigned={() => {
              setAssignTarget(null);
              fetchAll(true);
              fetchDiscoveries();
            }}
            onDismiss={() => setAssignTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartBoxDashboard;
