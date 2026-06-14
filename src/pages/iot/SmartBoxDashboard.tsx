import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, RefreshCw, Wifi, WifiOff, Zap, Thermometer,
  Droplets, Wind, Activity, Power, Clock, AlertTriangle,
  CheckCircle2, XCircle, Timer, Radio, Signal, BatteryMedium,
  ToggleLeft, ToggleRight, ChevronRight, Cpu, Waves,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import {
  espnowService,
  type PondIoTStatus,
  type EspDevice,
  type EspAeratorCommand,
  type EspSensorReading,
  type CommandAction,
} from '../../services/espnowService';
import { cn } from '../../utils/cn';

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5000;

const SENSOR_THRESHOLDS: Record<string, { min?: number; max?: number }> = {
  do:        { min: 4.0 },
  ph:        { min: 7.0, max: 8.5 },
  temp:      { min: 25.0, max: 32.0 },
  salinity:  { min: 5, max: 35 },
  ammonia:   { max: 0.1 },
  turbidity: { max: 60 },
  tds:       {},
};

const getSensorColor = (key: string, val?: number | null) => {
  if (val == null) return 'text-white/25';
  const t = SENSOR_THRESHOLDS[key];
  if (!t) return 'text-sky-400';
  const low  = t.min !== undefined && val < t.min;
  const high = t.max !== undefined && val > t.max;
  if (low || high) return 'text-red-400';
  if ((t.min && val < t.min * 1.1) || (t.max && val > t.max * 0.95)) return 'text-amber-400';
  return 'text-emerald-400';
};

const getSensorBg = (key: string, val?: number | null) => {
  const color = getSensorColor(key, val);
  if (color.includes('red'))     return 'bg-red-500/10 border-red-500/20';
  if (color.includes('amber'))   return 'bg-amber-500/10 border-amber-500/20';
  if (color.includes('emerald')) return 'bg-emerald-500/10 border-emerald-500/20';
  if (color.includes('sky'))     return 'bg-sky-500/10 border-sky-500/20';
  return 'bg-white/5 border-white/10';
};

// ─────────────────────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Animated pulsing "LIVE" dot */
const LiveBadge = () => (
  <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2.5 py-1">
    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
    <span className="text-emerald-400 text-[7px] font-black uppercase tracking-widest">Live</span>
  </div>
);

/** Online / offline status pill */
const OnlinePill = ({ online, lastSeenAgo }: { online: boolean; lastSeenAgo?: string }) => (
  <div className={cn(
    'flex items-center gap-1.5 rounded-full px-2.5 py-1 border',
    online
      ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
      : 'bg-red-500/10 border-red-500/20 text-red-400',
  )}>
    <div className={cn(
      'w-1.5 h-1.5 rounded-full',
      online ? 'bg-emerald-400 animate-pulse' : 'bg-red-400',
    )} />
    <span className="text-[7px] font-black uppercase tracking-widest">
      {online ? 'Online' : `Offline${lastSeenAgo ? ` · ${lastSeenAgo}` : ''}`}
    </span>
  </div>
);

/** Command status badge */
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

/** Single sensor tile */
const SensorTile = ({
  label, value, unit, keyName, icon: Icon,
}: { label: string; value?: number | null | undefined; unit: string; keyName: string; icon: any; key?: string }) => {
  const color = getSensorColor(keyName, value);
  const bg    = getSensorBg(keyName, value);
  return (
    <div className={cn('rounded-2xl border p-3 flex flex-col gap-1', bg)}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={10} className={color} />
        <span className="text-white/30 text-[6px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className={cn('font-black text-xl leading-none tracking-tight', color)}>
        {value != null ? value.toFixed(value < 10 ? 2 : 1) : '—'}
      </p>
      <p className="text-white/20 text-[6px] font-black uppercase tracking-widest">{unit}</p>
    </div>
  );
};

/** Power metric chip */
const PowerChip = ({ label, value, unit }: { label: string; value?: number | null; unit: string }) => (
  <div className="flex-1 text-center bg-white/5 border border-white/10 rounded-xl py-2 px-1">
    <p className="text-white/25 text-[6px] font-black uppercase tracking-widest mb-1">{label}</p>
    <p className={cn('font-black text-sm leading-none', value != null ? 'text-amber-400' : 'text-white/15')}>
      {value != null ? value.toFixed(1) : '—'}
    </p>
    <p className="text-white/20 text-[5.5px] font-black uppercase tracking-widest mt-0.5">{unit}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  AERATOR TOGGLE BUTTON
// ─────────────────────────────────────────────────────────────────────────────

interface AeratorToggleProps {
  device: EspDevice;
  pondId: string;
  hasPendingCmd: boolean;
  onCommandSent: () => void;
  isDark: boolean;
}

const AeratorToggle = ({ device, pondId, hasPendingCmd, onCommandSent, isDark }: AeratorToggleProps) => {
  const [loading, setLoading] = useState(false);
  const [localState, setLocalState] = useState<'ON' | 'OFF' | 'UNKNOWN'>(device.aeratorState);
  const [error, setError] = useState<string | null>(null);

  // Sync local when server state changes (after poll)
  useEffect(() => { setLocalState(device.aeratorState); }, [device.aeratorState]);

  const toggle = async () => {
    if (loading || hasPendingCmd) return;
    const action: CommandAction = localState === 'ON' ? 'OFF' : 'ON';
    const optimistic: 'ON' | 'OFF' = action === 'ON' ? 'ON' : 'OFF';

    setLoading(true);
    setError(null);
    setLocalState(optimistic); // optimistic update

    try {
      await espnowService.sendCommand({ pondId, targetMac: device.mac, action });
      onCommandSent();
    } catch (err: any) {
      setError(err.message || 'Command failed');
      setLocalState(device.aeratorState); // revert
    } finally {
      setLoading(false);
    }
  };

  const isOn = localState === 'ON';
  const isUnknown = localState === 'UNKNOWN';
  const locked = loading || hasPendingCmd;

  return (
    <div className="space-y-1">
      <motion.button
        id={`aerator-toggle-${device._id}`}
        whileTap={{ scale: 0.95 }}
        onClick={toggle}
        disabled={locked}
        className={cn(
          'w-full flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-all',
          locked   ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.98] cursor-pointer',
          isOn     ? 'bg-emerald-500/15 border-emerald-500/30' :
          isUnknown? 'bg-white/5 border-white/10' :
                     'bg-red-500/10 border-red-500/20',
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center border',
            isOn      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
            isUnknown ? 'bg-white/5 border-white/10 text-white/25' :
                        'bg-red-500/15 border-red-500/20 text-red-400',
          )}>
            <Wind size={14} />
          </div>
          <div>
            <p className={cn(
              'text-[10px] font-black uppercase tracking-widest',
              isOn ? 'text-emerald-400' : isUnknown ? 'text-white/30' : 'text-red-400',
            )}>
              Aerator {isUnknown ? '—' : isOn ? 'Running' : 'Stopped'}
            </p>
            {hasPendingCmd && (
              <p className="text-amber-400 text-[7px] font-bold">Command pending…</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {isOn
            ? <ToggleRight size={22} className="text-emerald-400" />
            : <ToggleLeft  size={22} className={isUnknown ? 'text-white/20' : 'text-red-400'} />
          }
        </div>
      </motion.button>
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
//  SMART BOX CARD (one per slave device)
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
  const hasPendingCmd = pendingCommands.some(c => c.targetMac === device.mac);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={cn(
        'rounded-[1.75rem] border overflow-hidden',
        isDark ? 'bg-[#0A1410] border-white/8' : 'bg-white border-slate-100 shadow-sm',
      )}
    >
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-2xl border flex items-center justify-center',
            device.online
              ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
              : 'bg-white/5 border-white/10 text-white/25',
          )}>
            <Cpu size={16} />
          </div>
          <div>
            <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              {device.label}
            </p>
            <p className={cn('text-[7px] font-mono mt-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>
              {device.mac}
            </p>
          </div>
        </div>
        <OnlinePill online={device.online ?? false} lastSeenAgo={device.lastSeenAgo} />
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Aerator Toggle */}
        <AeratorToggle
          device={device}
          pondId={pondId}
          hasPendingCmd={hasPendingCmd}
          onCommandSent={onCommandSent}
          isDark={isDark}
        />

        {/* Power row */}
        <div className="flex gap-2">
          <PowerChip label="Voltage" value={device.voltage}    unit="V" />
          <PowerChip label="Current" value={device.current}    unit="A" />
          <PowerChip label="Power"   value={device.powerWatts} unit="W" />
        </div>

        {/* Signal + last seen footer */}
        <div className="flex items-center justify-between pt-1">
          {device.signalStrength != null ? (
            <div className="flex items-center gap-1.5 text-white/30">
              <Signal size={10} />
              <span className="text-[7px] font-black">{device.signalStrength} dBm</span>
            </div>
          ) : <div />}
          <div className="flex items-center gap-1 text-white/20">
            <Clock size={9} />
            <span className="text-[7px] font-bold">{device.lastSeenAgo || 'Never'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

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
        <p className="text-[8px] font-black text-white/60 truncate font-mono">{cmd.targetMac}</p>
        <p className="text-[7px] text-white/20 mt-0.5">
          {new Date(cmd.issuedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>
      <StatusPill status={cmd.status} />
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
            <p className="text-white text-[11px] font-black tracking-tight">{device.label}</p>
          </div>
        </div>
        <OnlinePill online={device.online ?? false} lastSeenAgo={device.lastSeenAgo} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-[7px]">
        <div className="bg-white/5 border border-white/8 rounded-xl px-3 py-2">
          <p className="text-white/25 uppercase tracking-widest mb-0.5">MAC</p>
          <p className="text-white/60 font-mono font-bold">{device.mac}</p>
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
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export const SmartBoxDashboard = () => {
  const { id: pondId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [status,    setStatus]    = useState<PondIoTStatus | null>(null);
  const [commands,  setCommands]  = useState<EspAeratorCommand[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [lastPoll,  setLastPoll]  = useState<Date | null>(null);
  const [spinning,  setSpinning]  = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data fetch ──────────────────────────────────────────────────────────────
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

  // Initial + polling
  useEffect(() => {
    fetchAll();
    pollRef.current = setInterval(() => fetchAll(), POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchAll]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const masterDevice = status?.devices.find(d => d.role === 'master');
  const slaveDevices = status?.devices.filter(d => d.role === 'slave') ?? [];
  const reading: EspSensorReading | null = status?.latestReading ?? null;
  const pendingCmds = status?.pendingCommandDetails ?? [];

  const SENSORS: { key: string; label: string; value: number | undefined; unit: string; icon: any }[] = [
    { key: 'do',       label: 'DO',        unit: 'mg/L', icon: Droplets,     value: reading?.do },
    { key: 'ph',       label: 'pH',        unit: '',     icon: Activity,     value: reading?.ph },
    { key: 'temp',     label: 'Temp',      unit: '°C',   icon: Thermometer,  value: reading?.temp },
    { key: 'salinity', label: 'Salinity',  unit: 'ppt',  icon: Waves,        value: reading?.salinity },
    { key: 'ammonia',  label: 'Ammonia',   unit: 'mg/L', icon: AlertTriangle, value: reading?.ammonia },
    { key: 'turbidity',label: 'Turbidity', unit: 'NTU',  icon: Wind,         value: reading?.turbidity },
    { key: 'tds',      label: 'TDS',       unit: 'mg/L', icon: BatteryMedium, value: reading?.tds },
  ];

  // ── Loading skeleton ─────────────────────────────────────────────────────────
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

  // ── No devices state ─────────────────────────────────────────────────────────
  if (!loading && !error && status?.devices.length === 0) {
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
        </header>
        <div className="pt-24 flex items-center justify-center min-h-[60vh] px-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Cpu size={28} className="text-white/20" />
            </div>
            <h2 className={cn('font-black text-base mb-2', isDark ? 'text-white' : 'text-slate-900')}>No Devices Registered</h2>
            <p className={cn('text-[9px] font-medium leading-relaxed', isDark ? 'text-white/30' : 'text-slate-500')}>
              Register a Master ESP32 and Smart Box slaves to this pond to enable IoT control.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN RENDER ──────────────────────────────────────────────────────────────
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
          <LiveBadge />
          <motion.button
            id="iot-refresh-btn"
            whileTap={{ scale: 0.9 }}
            onClick={() => fetchAll(true)}
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

        {/* ── MASTER BOX ── */}
        {masterDevice && (
          <div>
            <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
              Master Gateway
            </p>
            <MasterBoxCard device={masterDevice} isDark={isDark} />
          </div>
        )}

        {/* ── SENSOR READINGS ── */}
        {reading && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
                Live Sensor Data
              </p>
              <p className={cn('text-[7px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>
                {new Date(reading.recordedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SENSORS.slice(0, 4).map(s => (
                <SensorTile
                  key={s.key}
                  label={s.label}
                  value={s.value ?? undefined}
                  unit={s.unit}
                  keyName={s.key}
                  icon={s.icon}
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {SENSORS.slice(4).map(s => (
                <SensorTile
                  key={s.key}
                  label={s.label}
                  value={s.value ?? undefined}
                  unit={s.unit}
                  keyName={s.key}
                  icon={s.icon}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── SMART BOXES (SLAVES) ── */}
        {slaveDevices.length > 0 && (
          <div>
            <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
              Smart Boxes · {slaveDevices.length} unit{slaveDevices.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-3">
              {slaveDevices.map((d, i) => (
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

        {/* ── COMMAND HISTORY ── */}
        {commands.length > 0 && (
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
    </div>
  );
};

export default SmartBoxDashboard;
