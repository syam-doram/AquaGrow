import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wind,
  Zap,
  Wifi,
  WifiOff,
  Activity,
  Thermometer,
  Droplets,
  Battery,
  BatteryCharging,
  BatteryLow,
  BatteryMedium,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Settings,
  RefreshCw,
  Plus,
  X,
  XCircle,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Gauge,
  IndianRupee,
  CalendarDays,
  BarChart2,
  CircuitBoard,
  Waves,
  Sun,
  Moon,
  Power,
  Cpu,
  Radio,
  Signal,
  Info,
  HelpCircle,
  Sparkles,
  GitBranch,
  Bell,
  QrCode,
  Timer,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { calculateDOC } from '../../utils/pondUtils';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { IoTCommandCenter } from '../../components/IoTCommandCenter';
import {
  espnowService,
  type PondIoTStatus,
  type EspDevice,
  type EspAeratorCommand,
  type EspDiscoverEntry,
  type CommandAction,
  DEVICE_TYPE_OPTIONS,
} from '../../services/espnowService';
import { DeviceAssignmentModal } from '../iot/DeviceAssignmentModal';

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Types Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
interface IoTDevice {
  id: string;
  name: string;
  type: 'aerator' | 'sensor' | 'feeder' | 'pump';
  pondId: string;
  pondName: string;
  status: 'online' | 'offline' | 'warning';
  power: number; // watts
  runtime: number; // hours today
  isOn: boolean;
  lastSeen: string;
  signal: number; // 0-100
}

interface ElectricityEntry {
  month: string;
  units: number;
  amount: number;
  aeratorShare: number; // %
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Mock data helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const RATE_PER_UNIT = 6.5; // ₹/kWh — AP agriculture tariff

const mockDevices: IoTDevice[] = [];

const mockElectricityHistory: ElectricityEntry[] = [
  { month: 'Jan', units: 1820, amount: 11830, aeratorShare: 62 },
  { month: 'Feb', units: 1650, amount: 10725, aeratorShare: 60 },
  { month: 'Mar', units: 1940, amount: 12610, aeratorShare: 65 },
  { month: 'Apr', units: 1760, amount: 11440, aeratorShare: 63 },
];

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Sub-components Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬


// ─── SIGNAL BAR helper ───────────────────────────────────────────────────────────────────

const SignalBars = ({ signal, isDark }: { signal: number; isDark: boolean }) => {
  const bars = [25, 50, 75, 100];
  return (
    <div className="flex items-end gap-[2px]">
      {bars.map((threshold, i) => (
        <div
          key={i}
          className="rounded-[1px] transition-all"
          style={{
            width: 3,
            height: 4 + i * 3,
            background: signal >= threshold
              ? '#10b981'
              : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          }}
        />
      ))}
    </div>
  );
};

// ─── REAL IOT DEVICE SYNC PANEL ─────────────────────────────────────────────────────
// compact=true → horizontal pill strip (above Live Farm Load)
// compact=false → full IoT tab view identical to Pond IoT Dashboard

// ─ Sensor helpers (same thresholds as SmartBoxDashboard) ─────────────────────────────
const HUB_THRESHOLDS: Record<string, { min?: number; max?: number }> = {
  do: { min: 4.0 }, ph: { min: 7.0, max: 8.5 }, temp: { min: 25.0, max: 32.0 },
  salinity: { min: 5, max: 35 }, ammonia: { max: 0.1 }, turbidity: { max: 60 }, tds: {},
};
const hubSensorColor = (key: string, val?: number | null) => {
  if (val == null || val === 0) return 'text-slate-400';
  const t = HUB_THRESHOLDS[key];
  if (!t) return 'text-sky-400';
  const low = t.min !== undefined && val < t.min;
  const high = t.max !== undefined && val > t.max;
  if (low || high) return 'text-red-400';
  if ((t.min && val < t.min * 1.1) || (t.max && val > t.max * 0.95)) return 'text-amber-400';
  return 'text-emerald-400';
};
const hubSensorBg = (key: string, val?: number | null, isDark = true) => {
  if (val == null || val === 0) return isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200';
  const c = hubSensorColor(key, val);
  if (c.includes('red'))     return isDark ? 'bg-red-500/10 border-red-500/20'     : 'bg-red-50 border-red-200';
  if (c.includes('amber'))   return isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200';
  if (c.includes('emerald')) return isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200';
  return isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200';
};

// ─ Sensor Tile (identical to SmartBoxDashboard SensorTile) ──────────────────────────
const HubSensorTile = ({
  label, value, unit, keyName, icon: Icon, isDark,
}: { label: string; value?: number | null; unit: string; keyName: string; icon: any; isDark: boolean }) => {
  const hasData = value != null && value !== 0;
  const color   = hasData ? hubSensorColor(keyName, value) : (isDark ? 'text-white/20' : 'text-slate-400');
  const bg      = hubSensorBg(keyName, value, isDark);
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

// ─ Motor Status Config (exact copy from SmartBoxDashboard) ───────────────────────────
type MotorStatus = 'RUNNING' | 'STOPPED' | 'POWER_FAILURE' | 'FAULT' | 'OVERCURRENT';

const MOTOR_STATUS_CONFIG: Record<MotorStatus, {
  label: string; sublabel: string; color: string;
  bg: string; border: string; darkBg: string; darkBorder: string;
}> = {
  RUNNING:       { label: 'Aerator Running',   sublabel: 'Motor is operating normally',                                color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', darkBg: 'bg-emerald-500/10',  darkBorder: 'border-emerald-500/20' },
  STOPPED:       { label: 'Aerator Stopped',   sublabel: 'Relay OFF — stopped by command',                            color: 'text-slate-400',   bg: 'bg-slate-100',       border: 'border-slate-200',       darkBg: 'bg-white/5',         darkBorder: 'border-white/10'         },
  POWER_FAILURE: { label: 'Power Failure',     sublabel: 'Relay ON but no voltage — check EB / MCB',                 color: 'text-amber-400',   bg: 'bg-amber-50',        border: 'border-amber-200',       darkBg: 'bg-amber-500/10',    darkBorder: 'border-amber-500/25'     },
  FAULT:         { label: 'Motor Fault',       sublabel: 'Relay ON + power OK but no current — check motor/contactor',color: 'text-red-400',     bg: 'bg-red-50',          border: 'border-red-200',         darkBg: 'bg-red-500/10',      darkBorder: 'border-red-500/25'       },
  OVERCURRENT:   { label: 'Overcurrent Alert', sublabel: 'Motor drawing too much current — check for short circuit',  color: 'text-orange-400',  bg: 'bg-orange-50',       border: 'border-orange-200',      darkBg: 'bg-orange-500/10',   darkBorder: 'border-orange-200/25'    },
};

const MOTOR_STATUS_ICONS: Record<MotorStatus, React.ComponentType<{ size?: number; className?: string }>> = {
  RUNNING:       Wind,
  STOPPED:       Wind,
  POWER_FAILURE: Zap,
  FAULT:         AlertTriangle,
  OVERCURRENT:   AlertTriangle,
};

// ─ Full Aerator Toggle (exact match to SmartBoxDashboard AeratorToggle) ──────────────
const HubAeratorToggle = ({
  device, pondId, hasPendingCmd, onRefresh, isDark,
}: { device: any; pondId: string; hasPendingCmd: boolean; onRefresh: () => void; isDark: boolean }) => {
  const [loading,    setLoading]    = useState(false);
  const [localState, setLocalState] = useState<'ON' | 'OFF' | 'UNKNOWN'>(device.aeratorState ?? 'UNKNOWN');
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => { setLocalState(device.aeratorState ?? 'UNKNOWN'); }, [device.aeratorState]);

  const toggle = async () => {
    if (loading || hasPendingCmd || !device.boxId) return;
    const action: 'ON' | 'OFF' = localState === 'ON' ? 'OFF' : 'ON';
    setLoading(true); setError(null); setLocalState(action);
    try {
      await espnowService.sendCommandById({ boxId: device.boxId, action, pondId });
      setTimeout(onRefresh, 1500);
    } catch (e: any) {
      setError(e.message || 'Command failed');
      setLocalState(device.aeratorState ?? 'UNKNOWN');
    } finally { setLoading(false); }
  };

  // Derive motor status — prefer firmware-reported motorStatus, fall back to relay state
  const motorStatus = (device.motorStatus as MotorStatus | undefined)
    || (localState === 'ON' ? 'RUNNING' : localState === 'OFF' ? 'STOPPED' : undefined);
  const cfg        = motorStatus ? MOTOR_STATUS_CONFIG[motorStatus] : MOTOR_STATUS_CONFIG.STOPPED;
  const StatusIcon = motorStatus ? MOTOR_STATUS_ICONS[motorStatus] : Wind;

  const isOn    = localState === 'ON';
  const locked  = loading || hasPendingCmd;
  const isAlert = motorStatus === 'POWER_FAILURE' || motorStatus === 'FAULT' || motorStatus === 'OVERCURRENT';

  return (
    <div className="space-y-2">
      {/* ─ Real motor status banner ─ */}
      <motion.button
        id={`hub-aerator-${device.boxId || device._id}`}
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
        {(device.voltage != null || device.current != null) && (
          <div className={cn('flex gap-3 mt-3 pt-2.5 border-t', isDark ? 'border-white/5' : 'border-black/5')}>
            {device.voltage != null && (
              <div className="flex items-center gap-1">
                <Zap size={9} className={isDark ? 'text-white/25' : 'text-slate-400'} />
                <span className={cn('text-[8px] font-black tabular-nums', isDark ? 'text-white/50' : 'text-slate-600')}>
                  {Number(device.voltage).toFixed(1)}V
                </span>
              </div>
            )}
            {device.current != null && (
              <div className="flex items-center gap-1">
                <Activity size={9} className={isDark ? 'text-white/25' : 'text-slate-400'} />
                <span className={cn('text-[8px] font-black tabular-nums', isDark ? 'text-white/50' : 'text-slate-600')}>
                  {Number(device.current).toFixed(2)}A
                </span>
              </div>
            )}
            {device.powerWatts != null && (
              <div className="flex items-center gap-1">
                <BatteryMedium size={9} className={isDark ? 'text-white/25' : 'text-slate-400'} />
                <span className={cn('text-[8px] font-black tabular-nums', isDark ? 'text-white/50' : 'text-slate-600')}>
                  {Number(device.powerWatts).toFixed(0)}W
                </span>
              </div>
            )}
          </div>
        )}
      </motion.button>

      {/* Fault alert chip */}
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

      {/* Command error */}
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


// ─ Smart Box Card (matches SmartBoxDashboard SmartBoxCard) ──────────────────────────
type HubSmartBoxCardProps = {
  device: any;
  pondId: string;
  pendingCmds: any[];
  onRefresh: () => void;
  isDark: boolean;
  index: number;
};

const HubSmartBoxCard = ({
  device, pondId, pendingCmds, onRefresh, isDark, index,
}: HubSmartBoxCardProps) => {
  const hasPending = (pendingCmds ?? []).some((c: any) => c.targetBoxId === device.boxId);
  const isOnline   = device.online ?? false;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'rounded-[1.75rem] border overflow-hidden',
        isOnline
          ? isDark ? 'bg-gradient-to-br from-[#071A10] to-[#0A1410] border-emerald-500/20' : 'bg-emerald-50 border-emerald-200 shadow-sm'
          : isDark ? 'bg-[#0D0D10] border-white/8' : 'bg-white border-slate-200 shadow-sm',
      )}
    >
      <div className={cn('h-0.5 w-full', isOnline ? 'bg-emerald-400' : isDark ? 'bg-white/10' : 'bg-slate-200')} />
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-2xl border flex items-center justify-center',
            isOnline ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                     : isDark ? 'bg-white/5 border-white/10 text-white/20' : 'bg-slate-100 border-slate-200 text-slate-400',
          )}>
            <Wind size={16} />
          </div>
          <div>
            <p className={cn('text-[12px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              {espnowService.getDeviceLabel(device)}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn('text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border',
                isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-slate-100 border-slate-200 text-slate-400',
              )}>{device.boxId || '—'}</span>
              <span className={cn('text-[6.5px] font-bold uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
                {device.deviceType || 'AERATOR'}
              </span>
            </div>
          </div>
        </div>
        {/* Online pill */}
        <div className={cn(
          'flex items-center gap-1.5 rounded-full px-2.5 py-1 border',
          isOnline ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400',
        )}>
          <div className={cn('w-1.5 h-1.5 rounded-full', isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400')} />
          <span className="text-[7px] font-black uppercase tracking-widest">
            {isOnline ? 'Online' : device.lastSeenAgo ? `Offline · ${device.lastSeenAgo}` : 'Offline'}
          </span>
        </div>
      </div>

      {/* Offline warning */}
      {!isOnline && device.lastSeenAgo && (
        <div className={cn('mx-4 mb-2 rounded-2xl border px-3 py-2 flex items-center gap-2',
          isDark ? 'bg-red-500/8 border-red-500/15' : 'bg-red-50 border-red-200'
        )}>
          <WifiOff size={10} className="text-red-400 flex-shrink-0" />
          <p className={cn('text-[7.5px] font-bold', isDark ? 'text-red-400/80' : 'text-red-600')}>
            Last seen {device.lastSeenAgo} — check ESP-NOW range
          </p>
        </div>
      )}

      <div className="px-4 pb-4 space-y-2.5">
        {/* Aerator toggle */}
        <HubAeratorToggle device={device} pondId={pondId} hasPendingCmd={hasPending} onRefresh={onRefresh} isDark={isDark} />
        {/* Signal + last seen */}
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

// ─ Master Box Card (matches SmartBoxDashboard MasterBoxCard) ─────────────────────
const HubMasterBoxCard = ({ device, isDark }: { device: any; isDark: boolean }) => (
  <div className={cn(
    'rounded-[1.75rem] border p-4 relative overflow-hidden',
    isDark ? 'bg-gradient-to-br from-[#01200F] to-[#071A10] border-emerald-500/15'
           : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-sm',
  )}>
    <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center border',
            isDark ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-emerald-100 border-emerald-300',
          )}>
            <Radio size={14} className="text-emerald-500" />
          </div>
          <div>
            <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-emerald-400' : 'text-emerald-700')}>Master Gateway</p>
            <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              {espnowService.getDeviceLabel(device)}
            </p>
          </div>
        </div>
        <div className={cn(
          'flex items-center gap-1.5 rounded-full px-2.5 py-1 border',
          device.online ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400',
        )}>
          <div className={cn('w-1.5 h-1.5 rounded-full', device.online ? 'bg-emerald-400 animate-pulse' : 'bg-red-400')} />
          <span className="text-[7px] font-black uppercase tracking-widest">{device.online ? 'Online' : 'Offline'}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className={cn('rounded-xl px-3 py-2', isDark ? 'bg-white/5 border border-white/8' : 'bg-white border border-slate-100')}>
          <p className={cn('text-[6px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>Box ID</p>
          <p className={cn('text-[9px] font-black font-mono', isDark ? 'text-white/70' : 'text-slate-700')}>{device.boxId || '—'}</p>
        </div>
        <div className={cn('rounded-xl px-3 py-2', isDark ? 'bg-white/5 border border-white/8' : 'bg-white border border-slate-100')}>
          <p className={cn('text-[6px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>Heartbeat</p>
          <p className={cn('text-[9px] font-bold', isDark ? 'text-white/60' : 'text-slate-600')}>{device.heartbeatAgo || 'Never'}</p>
        </div>
      </div>
    </div>
  </div>
);

// ─ Command History Item ────────────────────────────────────────────────────────────────
const HubCommandItem = ({ cmd, isDark }: { cmd: any; isDark: boolean }) => {
  const STATUS_MAP: Record<string, { color: string; label: string }> = {
    pending:   { color: '#f59e0b', label: 'Pending' },
    sent:      { color: '#0ea5e9', label: 'Sent' },
    confirmed: { color: '#10b981', label: 'Confirmed' },
    failed:    { color: '#ef4444', label: 'Failed' },
    timeout:   { color: '#94a3b8', label: 'Timeout' },
  };
  const s = STATUS_MAP[cmd.status] || STATUS_MAP.timeout;
  const isOn = cmd.action === 'ON';
  return (
    <div className={cn('flex items-center gap-3 py-2.5', isDark ? 'border-b border-white/4' : 'border-b border-slate-50')}>
      <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 border',
        isOn ? isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
             : isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200',
      )}>
        <Wind size={11} className={isOn ? 'text-emerald-400' : isDark ? 'text-white/25' : 'text-slate-400'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-[9px] font-black', isDark ? 'text-white/70' : 'text-slate-800')}>
          {isOn ? '⚡ Aerator ON' : '⏹ Aerator OFF'}
          {cmd.targetBoxId && <span className={cn('ml-1 font-mono text-[7px]', isDark ? 'text-white/30' : 'text-slate-400')}>→ {cmd.targetBoxId}</span>}
        </p>
        <p className={cn('text-[7px] font-medium', isDark ? 'text-white/25' : 'text-slate-400')}>
          {cmd.createdAt ? new Date(cmd.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
        </p>
      </div>
      <span className="text-[6.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border flex-shrink-0"
        style={{ color: s.color, borderColor: `${s.color}30`, background: `${s.color}10` }}>
        {s.label}
      </span>
    </div>
  );
};

// ─ Main IotDeviceSyncPanel ────────────────────────────────────────────────────────────────
const IotDeviceSyncPanel = ({
  ponds, isDark, navigate, compact = false,
}: {
  ponds: any[];
  isDark: boolean;
  navigate: (path: string) => void;
  compact?: boolean;
}) => {
  const [byPond, setByPond]       = useState<Record<string, any>>({});
  const [cmdsByPond, setCmdsByPond] = useState<Record<string, any[]>>({});
  const [loading, setLoading]     = useState(false);
  const [lastSync, setLastSync]   = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    const active = ponds.filter((p: any) => p.status === 'active' || p.status === 'planned');
    if (active.length === 0) return;
    setLoading(true);
    try {
      const results = await Promise.allSettled(
        active.map((p: any) =>
          Promise.all([
            espnowService.getPondStatus(p.id),
            espnowService.getCommandHistory(p.id, { limit: 5 }),
          ]).then(([s, cmds]) => ({ pondId: p.id, name: p.name, s, cmds }))
        )
      );
      const map: Record<string, any> = {};
      const cmdMap: Record<string, any[]> = {};
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          map[r.value.pondId] = { ...r.value.s, pondName: r.value.name };
          cmdMap[r.value.pondId] = r.value.cmds;
        }
      });
      setByPond(map);
      setCmdsByPond(cmdMap);
      setLastSync(new Date());
    } catch { /* silent */ } finally { setLoading(false); }
  }, [ponds]);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 30_000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const allDevices  = Object.values(byPond).flatMap((d: any) => d?.devices ?? []);
  const masters     = allDevices.filter((d: any) => d.role === 'master');
  const slaves      = allDevices.filter((d: any) => d.role === 'slave' && d.pairingStatus === 'assigned');
  const onlineAll   = allDevices.filter((d: any) => d.online).length;
  const hasPonds    = ponds.filter((p: any) => p.status === 'active' || p.status === 'planned').length > 0;

  // ─── COMPACT MODE: horizontal pill strip ─────────────────────────────────────
  if (compact) {
    if (allDevices.length === 0) return null;
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="flex items-center justify-between mb-1.5 px-1">
          <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>IoT Device Sync</p>
          <p className={cn('text-[6.5px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>
            {loading ? 'Syncing…' : lastSync ? `Updated ${lastSync.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {masters.map((d: any) => (
            <div key={d._id} className={cn(
              'flex-shrink-0 flex flex-col gap-1 px-3 py-2.5 rounded-2xl border min-w-[108px] relative',
              d.online ? isDark ? 'bg-violet-500/8 border-violet-500/20' : 'bg-violet-50 border-violet-200'
                       : isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100 shadow-sm',
            )}>
              <div className="absolute top-2 right-2">
                <span className={cn('w-1.5 h-1.5 rounded-full block', d.online ? 'bg-emerald-500 animate-pulse' : 'bg-red-400')} />
              </div>
              <div className="flex items-center gap-1.5">
                <Radio size={10} className={d.online ? 'text-violet-400' : isDark ? 'text-white/20' : 'text-slate-400'} />
                <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-violet-400/70' : 'text-violet-600')}>Master</span>
              </div>
              <p className={cn('text-[8px] font-black tracking-tight leading-tight truncate', isDark ? 'text-white/80' : 'text-slate-800')}>
                {espnowService.getDeviceLabel(d)}
              </p>
              <p className="text-[7px] font-black uppercase tracking-wider" style={{ color: d.online ? '#10b981' : '#ef4444' }}>
                {d.online ? 'Online' : 'Offline'}
              </p>
              <p className={cn('text-[6.5px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>{d.boxId ?? 'MB'}</p>
            </div>
          ))}
          {slaves.map((d: any) => {
            const stateColor = d.aeratorState === 'ON' ? '#10b981' : d.aeratorState === 'OFF' ? '#64748b' : '#f59e0b';
            return (
              <div key={d._id} className={cn(
                'flex-shrink-0 flex flex-col gap-1 px-3 py-2.5 rounded-2xl border min-w-[108px] relative',
                d.online ? isDark ? 'bg-emerald-500/6 border-emerald-500/18' : 'bg-emerald-50 border-emerald-200'
                         : isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100 shadow-sm',
              )}>
                <div className="absolute top-2 right-2">
                  <span className={cn('w-1.5 h-1.5 rounded-full block', d.online ? 'bg-emerald-500' : 'bg-red-400')} />
                </div>
                <div className="flex items-center gap-1.5">
                  <Wind size={10} className={d.online ? 'text-emerald-400' : isDark ? 'text-white/20' : 'text-slate-400'} />
                  <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-emerald-400/70' : 'text-emerald-700')}>Smart Box</span>
                </div>
                <p className={cn('text-[8px] font-black tracking-tight leading-tight truncate', isDark ? 'text-white/80' : 'text-slate-800')}>
                  {espnowService.getDeviceLabel(d)}
                </p>
                <p className="text-[7px] font-black uppercase tracking-wider" style={{ color: stateColor }}>
                  {d.aeratorState === 'ON' ? '⚡ ON' : d.aeratorState === 'OFF' ? '⏹ OFF' : '~ Unknown'}
                </p>
                <p className={cn('text-[6.5px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>{d.boxId ?? 'SB'}</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // ─── FULL MODE ──────────────────────────────────────────────────────────────────────
  if (!hasPonds) return (
    <div className={cn('rounded-[1.75rem] border p-8 text-center', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100')}>
      <CircuitBoard size={32} className={cn('mx-auto mb-3', isDark ? 'text-white/20' : 'text-slate-300')} />
      <p className={cn('text-[9px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/40' : 'text-slate-500')}>No Active Ponds</p>
      <p className={cn('text-[8px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>Add a pond first to set up IoT devices.</p>
    </div>
  );

  if (!loading && allDevices.length === 0) return (
    <div className="space-y-4">
      <div className={cn('rounded-[1.75rem] border p-7 text-center', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100')}>
        <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border', isDark ? 'bg-violet-500/10 border-violet-500/20' : 'bg-violet-50 border-violet-200')}>
          <Radio size={24} className="text-violet-400" />
        </div>
        <p className={cn('text-[11px] font-black mb-1', isDark ? 'text-white' : 'text-slate-900')}>No IoT Devices Registered</p>
        <p className={cn('text-[8px] font-medium leading-relaxed mb-5', isDark ? 'text-white/30' : 'text-slate-500')}>
          Register a Master Box for any pond to start monitoring real-time aerator and sensor data.
        </p>
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/iot/register')}
          className="w-full py-3 rounded-2xl bg-violet-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Radio size={13} /> Register Master Box
        </motion.button>
      </div>
      <div className={cn('rounded-[1.75rem] border p-4', isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-100')}>
        <p className={cn('text-[7px] font-black uppercase tracking-widest mb-3', isDark ? 'text-white/25' : 'text-slate-400')}>How It Works</p>
        <div className="space-y-2.5">
          {[
            { icon: Radio,    color: '#8B5CF6', text: 'Register a Master Box — it connects to WiFi and manages Smart Boxes over ESP-NOW' },
            { icon: Cpu,      color: '#0EA5E9', text: 'Pair Smart Boxes to the Master Box — each controls an aerator' },
            { icon: Wind,     color: '#10B981', text: 'Remotely toggle aerators ON/OFF from any pond at a glance' },
            { icon: Activity, color: '#F59E0B', text: 'Monitor live DO, pH, Temperature and all water quality readings here' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${item.color}18` }}>
                <item.icon size={11} style={{ color: item.color }} />
              </div>
              <p className={cn('text-[8px] font-medium leading-snug', isDark ? 'text-white/35' : 'text-slate-500')}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );


  return (
    <div className="space-y-5">

      {/* Header stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Master Boxes', value: masters.length, icon: Radio,    color: '#8B5CF6' },
          { label: 'Smart Boxes',  value: slaves.length,  icon: Cpu,      color: '#0EA5E9' },
          { label: 'Online',       value: onlineAll,      icon: Activity, color: '#10B981' },
        ].map((s, i) => (
          <div key={i} className={cn('rounded-2xl border p-3 text-center', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center mx-auto mb-1" style={{ background: `${s.color}18` }}>
              <s.icon size={13} style={{ color: s.color }} />
            </div>
            <span className="text-lg font-black tracking-tighter block" style={{ color: s.color }}>{s.value}</span>
            <span className={cn('text-[6.5px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Refresh bar */}
      <div className="flex items-center justify-between px-1">
        <p className={cn('text-[7px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>
          {lastSync ? `Last synced ${lastSync.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Fetching…'}
        </p>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => fetchAll()}
          className={cn('flex items-center gap-1 text-[7px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full border',
            isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-slate-100 border-slate-200 text-slate-500',
          )}
        >
          <RefreshCw size={9} className={loading ? 'animate-spin' : ''} /> Refresh
        </motion.button>
      </div>

      {/* Per-pond sections */}
      {Object.entries(byPond).map(([pondId, data]: [string, any]) => {
        const pondMaster    = (data?.devices ?? []).find((d: any) => d.role === 'master');
        const pondSlaves    = (data?.devices ?? []).filter((d: any) => d.role === 'slave' && d.pairingStatus === 'assigned');
        const pondDiscov    = (data?.devices ?? []).filter((d: any) => d.role === 'slave' && d.pairingStatus !== 'assigned');
        const reading       = data?.latestReading;
        const pendingCmds   = data?.pendingCommandDetails ?? [];
        const cmds          = cmdsByPond[pondId] ?? [];
        if (!pondMaster && pondSlaves.length === 0 && pondDiscov.length === 0) return null;

        return (
          <div key={pondId} className="space-y-3">

            {/* Pond header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-base">🐠</span>
                <div>
                  <p className={cn('text-[11px] font-black', isDark ? 'text-white' : 'text-slate-900')}>{data.pondName}</p>
                  <p className={cn('text-[7px] font-bold uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
                    {pondMaster ? '📡 Master linked' : 'No Master'}
                    {pondSlaves.length > 0 ? ` · ${pondSlaves.length} Smart Box${pondSlaves.length > 1 ? 'es' : ''}` : ''}
                  </p>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/ponds/${pondId}/iot`)}
                className={cn('flex items-center gap-1 text-[7px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full border',
                  isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-700',
                )}
              >
                Dashboard <ChevronRight size={9} />
              </motion.button>
            </div>

            {/* Master Box card */}
            {pondMaster && <HubMasterBoxCard device={pondMaster} isDark={isDark} />}

            {/* NEW DEVICES FOUND */}
            {pondDiscov.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <p className={cn('text-[7px] font-black uppercase tracking-widest px-1 flex items-center gap-1', isDark ? 'text-white/20' : 'text-slate-400')}>
                  <Sparkles size={8} /> New Devices Found · {pondDiscov.length}
                </p>
                {pondDiscov.map((d: any) => (
                  <div key={d._id} className={cn('rounded-[1.75rem] border px-4 py-3 flex items-center gap-3',
                    isDark ? 'bg-gradient-to-r from-[#041A0E] to-[#071410] border-emerald-500/25' : 'bg-emerald-50 border-emerald-200',
                  )}>
                    <div className="w-8 h-8 bg-emerald-500/15 border border-emerald-500/25 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-900')}>New Smart Box</p>
                      <p className={cn('text-[7px] font-medium', isDark ? 'text-white/30' : 'text-slate-500')}>{d.boxId} · Not assigned yet</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(`/ponds/${pondId}/iot`)}
                      className="flex items-center gap-1.5 bg-emerald-500 text-white rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest flex-shrink-0"
                    >
                      Assign <ChevronRight size={10} />
                    </motion.button>
                  </div>
                ))}
              </motion.div>
            )}


            {/* SMART BOXES with aerator toggle */}
            {pondSlaves.length > 0 && (
              <div>
                <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
                  Smart Boxes · {pondSlaves.length} unit{pondSlaves.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-3">
                  {pondSlaves.map((slave: any, i: number) => (
                    <HubSmartBoxCard
                      key={slave._id}
                      device={slave}
                      pondId={pondId}
                      pendingCmds={pendingCmds}
                      onRefresh={fetchAll}
                      isDark={isDark}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* COMMAND HISTORY */}
            {pondSlaves.length > 0 && cmds.length > 0 && (
              <div>
                <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>Command History</p>
                <div className={cn('rounded-[1.75rem] border px-4 py-1', isDark ? 'bg-[#0A1410] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                  {cmds.map((cmd: any, i: number) => (
                    <HubCommandItem key={cmd._id || i} cmd={cmd} isDark={isDark} />
                  ))}
                </div>
              </div>
            )}

            {/* Divider between ponds */}
            <div className={cn('h-px mx-2', isDark ? 'bg-white/5' : 'bg-slate-100')} />
          </div>
        );
      })}

      {/* Register CTA */}
      <motion.button whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/iot/register')}
        className={cn('w-full py-3.5 rounded-2xl border flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest',
          isDark ? 'bg-white/4 border-white/10 text-white/40' : 'bg-white border-slate-200 text-slate-500',
        )}
      >
        <Radio size={12} /> Register New Device
      </motion.button>
    </div>
  );
};


// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Main Component Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const SmartFarmHub = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { ponds, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [activeTab, setActiveTab] = useState<'aerators' | 'electricity' | 'power' | 'load' | 'iot'>('aerators');
  const [analyticsView, setAnalyticsView] = useState<'pond' | 'month' | 'year'>('pond');
  const [selectedPondId, setSelectedPondId] = useState<string>('all');
  const [showIoTGuide, setShowIoTGuide] = useState(false);
  const [devices, setDevices] = useState<IoTDevice[]>(() => {
    // Seed devices from real pond aerator data recorded during pond creation
    const result: IoTDevice[] = [];
    const activePonds = ponds.filter(p => p.status === 'active' || p.status === 'planned');
    activePonds.forEach((pond, pi) => {
      const doc = calculateDOC(pond.stockingDate);
      // Use real aerator count from pond.aerators if available, else derive from DOC
      const realCount = pond.aerators?.count ?? (doc > 60 ? 5 : doc > 40 ? 3 : doc > 20 ? 2 : 1);
      const realHp = pond.aerators?.hp ?? (doc > 40 ? 3 : doc > 20 ? 2 : 1);
      const positions = pond.aerators?.positions ?? [];
      for (let ai = 0; ai < realCount; ai++) {
        const watt = realHp <= 1 ? 750 : realHp <= 2 ? 1100 : realHp <= 3 ? 2200 : 3700;
        result.push({
          id: `aer-${pond.id}-${ai}`,
          name: positions[ai] ? `Aerator – ${positions[ai]}` : `Aerator ${ai + 1}`,
          type: 'aerator',
          pondId: pond.id,
          pondName: pond.name,
          status: 'online',
          power: watt,
          runtime: doc > 40 ? 22 : doc > 20 ? 18 : 14,
          isOn: true,
          lastSeen: '2 min ago',
          signal: 75 + Math.floor(Math.random() * 20),
        });
      }
      // Sensor per pond (from sensorId field)
      result.push({
        id: `sensor-${pond.id}`,
        name: pond.sensorId ? `Sensor #${pond.sensorId}` : 'Water Sensor',
        type: 'sensor',
        pondId: pond.id,
        pondName: pond.name,
        status: pond.sensorId ? 'online' : (pi === 0 ? 'offline' : 'online'),
        power: 5,
        runtime: 24,
        isOn: !!pond.sensorId || pi !== 0,
        lastSeen: pond.sensorId ? 'Just now' : '3 hrs ago',
        signal: pond.sensorId ? 88 : 55,
      });
    });
    return result.length > 0 ? result : mockDevices;
  });

  const [electricityHistory] = useState<ElectricityEntry[]>(mockElectricityHistory);
  const [currentUnits, setCurrentUnits] = useState<string>('1240');
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDevicePond, setNewDevicePond] = useState('');
  const [newDeviceType, setNewDeviceType] = useState<IoTDevice['type']>('aerator');

  // ── Smart Box Tab IoT State (mirrors SmartBoxDashboard) ───────────────────
  const [iotStatus,      setIotStatus]      = useState<PondIoTStatus | null>(null);
  const [iotCommands,    setIotCommands]    = useState<EspAeratorCommand[]>([]);
  const [iotDiscoveries, setIotDiscoveries] = useState<EspDiscoverEntry[]>([]);
  const [iotLoading,     setIotLoading]     = useState(false);
  const [iotError,       setIotError]       = useState<string | null>(null);
  const [iotLastPoll,    setIotLastPoll]    = useState<Date | null>(null);
  const [iotSpinning,    setIotSpinning]    = useState(false);
  const [assignTarget,   setAssignTarget]   = useState<EspDiscoverEntry | null>(null);
  const iotPollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const iotDiscoverRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const iotPondId = selectedPondId !== 'all' ? selectedPondId : (ponds.find(p => p.status === 'active')?.id || '');

  const fetchIotAll = useCallback(async (showSpinner = false) => {
    if (!iotPondId) return;
    if (showSpinner) setIotSpinning(true);
    setIotLoading(true);
    try {
      const [s, c] = await Promise.all([
        espnowService.getPondStatus(iotPondId),
        espnowService.getCommandHistory(iotPondId, { limit: 10 }),
      ]);
      setIotStatus(s);
      setIotCommands(c);
      setIotError(null);
      setIotLastPoll(new Date());
    } catch (err: any) {
      setIotError(err.message || 'Failed to fetch IoT status');
    } finally {
      setIotLoading(false);
      if (showSpinner) setIotSpinning(false);
    }
  }, [iotPondId]);

  const fetchIotDiscoveries = useCallback(async () => {
    if (!iotPondId) return;
    try {
      const entries = await espnowService.getPendingDiscoveries(iotPondId);
      setIotDiscoveries(entries);
    } catch { /* non-critical */ }
  }, [iotPondId]);

  useEffect(() => {
    if (activeTab !== 'iot') return;
    fetchIotAll();
    fetchIotDiscoveries();
    iotPollRef.current     = setInterval(() => fetchIotAll(),          5000);
    iotDiscoverRef.current = setInterval(() => fetchIotDiscoveries(), 10000);
    return () => {
      if (iotPollRef.current)     clearInterval(iotPollRef.current);
      if (iotDiscoverRef.current) clearInterval(iotDiscoverRef.current);
    };
  }, [activeTab, fetchIotAll, fetchIotDiscoveries]);

  // Derived IoT values
  const iotMaster         = iotStatus?.devices.find(d => d.role === 'master');
  const iotSlaves         = iotStatus?.devices.filter(d => d.role === 'slave') ?? [];
  const iotAssignedSlaves = iotSlaves.filter(d => d.pairingStatus === 'assigned');
  const iotPendingCmds    = iotStatus?.pendingCommandDetails ?? [];


  // Computed stats
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;
  const warningCount = devices.filter(d => d.status === 'warning').length;

  const totalLoadKW = useMemo(() => {
    return devices.filter(d => d.isOn).reduce((sum, d) => sum + d.power, 0) / 1000;
  }, [devices]);

  const todayUnitsEst = useMemo(() => {
    return devices.filter(d => d.isOn).reduce((sum, d) => sum + (d.power * d.runtime) / 1000, 0);
  }, [devices]);

  const currentBillEst = useMemo(() => {
    const units = parseFloat(currentUnits) || 0;
    return (units * RATE_PER_UNIT).toFixed(0);
  }, [currentUnits]);

  const aerators = devices.filter(d => d.type === 'aerator');
  const sensors = devices.filter(d => d.type === 'sensor');

  const toggleDevice = (id: string) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, isOn: !d.isOn, status: !d.isOn ? 'online' : 'offline' } : d));
  };

  const addDevice = () => {
    if (!newDeviceName.trim() || !newDevicePond) return;
    const pond = ponds.find(p => p.id === newDevicePond);
    const newDev: IoTDevice = {
      id: `dev-${Date.now()}`,
      name: newDeviceName.trim(),
      type: newDeviceType,
      pondId: newDevicePond,
      pondName: pond?.name || 'Unknown',
      status: 'online',
      power: newDeviceType === 'aerator' ? 1100 : newDeviceType === 'feeder' ? 50 : 5,
      runtime: 0,
      isOn: true,
      lastSeen: 'Just now',
      signal: 85,
    };
    setDevices(prev => [...prev, newDev]);
    setNewDeviceName('');
    setNewDevicePond('');
    setIsAddingDevice(false);
  };

  const tabs = [
    { id: 'aerators' as const, label: 'Aerators', icon: Wind, color: '#0EA5E9' },
    { id: 'electricity' as const, label: 'EB Bill', icon: IndianRupee, color: '#F59E0B' },
    { id: 'power' as const, label: 'Reports', icon: BarChart2, color: '#EF4444' },
    { id: 'load' as const, label: 'Power', icon: Gauge, color: '#F97316' },
    { id: 'iot' as const, label: 'Smart Box', icon: CircuitBoard, color: '#8B5CF6' },
  ];

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Aerator stage recommendations
  const aeratorStages = [
    { doc: '1–20', count: '1 Aerator', hp: '1 HP', tip: 'Gentle aeration, maintain DO > 4 mg/L at night', color: '#3B82F6' },
    { doc: '21–40', count: '2 Aerators', hp: '2 HP', tip: 'Increase aeration as biomass grows, run 20+ hrs/day', color: '#8B5CF6' },
    { doc: '41–60', count: '3–4 Aerators', hp: '3–5 HP', tip: 'Critical stage — run 24 hrs, monitor DO every 6 hrs', color: '#F59E0B' },
    { doc: '61–90', count: '5–6 Aerators', hp: '6–10 HP', tip: 'Heavy biomass stage, extra aeration at midnight', color: '#EF4444' },
  ];

  return (
    <div className={cn('min-h-[100dvh] pb-8 relative', isDark ? 'bg-[#030E1B]' : 'bg-[#F0F8FF]')}>
      {/* Ambient gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={cn('absolute top-[-5%] right-[-10%] w-[70%] h-[45%] blur-[130px] rounded-full', isDark ? 'bg-cyan-600/10' : 'bg-cyan-400/8')} />
        <div className={cn('absolute bottom-[-10%] left-[-5%] w-[60%] h-[40%] blur-[110px] rounded-full', isDark ? 'bg-violet-600/10' : 'bg-violet-400/6')} />
      </div>
      <Header
        title="Smart Farm Hub"
        showBack
        onBack={() => navigate('/dashboard')}
        rightElement={
          <button
            onClick={() => setShowIoTGuide(true)}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-90',
              isDark ? 'bg-white/8 border-white/15 text-white/60' : 'bg-white border-slate-200 text-slate-500'
            )}
            title="IoT Device Connection Guide"
          >
            <HelpCircle size={16} />
          </button>
        }
      />

      <div className="px-4 pt-[calc(env(safe-area-inset-top)+4.5rem)] space-y-5 relative z-10">

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ HERO STATS Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 gap-2">
          {[
            { label: 'Online', value: onlineCount, icon: Wifi, color: '#10b981' },
            { label: 'Offline', value: offlineCount, icon: WifiOff, color: '#ef4444' },
            { label: 'Warning', value: warningCount, icon: AlertTriangle, color: '#f59e0b' },
            { label: 'kW Load', value: totalLoadKW.toFixed(1), icon: Zap, color: '#8b5cf6' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className={cn('rounded-2xl p-3 border flex flex-col items-center gap-1 shadow-sm', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100')}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}18` }}>
                <stat.icon size={14} style={{ color: stat.color }} />
              </div>
              <span className={cn('text-base font-black tracking-tighter', isDark ? 'text-white' : 'text-slate-900')}>{stat.value}</span>
              <span className={cn('text-[7px] font-black uppercase tracking-widest text-center', isDark ? 'text-white/30' : 'text-slate-400')}>{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>


        {/* ── IoT DEVICE SYNC STATUS (real Master Box + Smart Box data) ── */}
        <IotDeviceSyncPanel ponds={ponds} isDark={isDark} navigate={navigate} compact />
        {/* Ã¢â€â‚¬Ã¢â€â‚¬ LIVE POWER INDICATOR Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn('rounded-2xl p-4 border relative overflow-hidden shadow-sm', isDark ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200')}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: '#f59e0b' }} />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className={cn('text-[8px] font-black uppercase tracking-[0.25em] mb-0.5', isDark ? 'text-amber-400' : 'text-amber-700')}>Live Farm Load</p>
              <div className="flex items-baseline gap-1">
                <span className={cn('text-3xl font-black tracking-tighter', isDark ? 'text-white' : 'text-slate-900')}>{totalLoadKW.toFixed(2)}</span>
                <span className={cn('text-[11px] font-black', isDark ? 'text-white/40' : 'text-slate-500')}>kW</span>
              </div>
              <p className={cn('text-[8px] font-medium mt-0.5', isDark ? 'text-white/40' : 'text-slate-500')}>
                Est. today: <span className="font-black text-amber-500">{todayUnitsEst.toFixed(1)} units</span>
                <span className={cn('ml-1', isDark ? 'text-white/30' : 'text-slate-400')}>@ ₹{RATE_PER_UNIT}/unit</span>
              </p>
            </div>
            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg', isDark ? 'bg-amber-500/15 border border-amber-500/25' : 'bg-amber-100 border border-amber-300')}>
              <Zap size={24} className="text-amber-500" />
            </div>
          </div>
          {/* power bar */}
          <div className={cn('mt-3 h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-amber-100')}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (totalLoadKW / 20) * 100)}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #fbbf24, #ef4444)' }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>0 kW</span>
            <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>20 kW Max</span>
          </div>
        </motion.div>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ TABS Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {/* POND SELECTOR */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className={cn('flex items-center gap-3 rounded-2xl border p-3', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', isDark ? 'bg-cyan-500/15 border border-cyan-500/25' : 'bg-cyan-50 border border-cyan-200')}>
              <Waves size={14} className="text-cyan-500" />
            </div>
            <div className="flex-1">
              <p className={cn('text-[7px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>Viewing Pond</p>
              <select
                value={selectedPondId}
                onChange={e => setSelectedPondId(e.target.value)}
                className={cn('w-full text-[11px] font-black bg-transparent outline-none appearance-none cursor-pointer', isDark ? 'text-white' : 'text-slate-900')}
              >
                <option value="all">All Active Ponds</option>
                {ponds.filter(p => p.status === 'active').map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <ChevronRight size={12} className={cn('flex-shrink-0 -rotate-90', isDark ? 'text-white/20' : 'text-slate-300')} />
          </div>
        </motion.div>

        {/* TABS */}
        <div className={cn('flex gap-1.5 p-1.5 rounded-2xl border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all duration-200"
              style={activeTab === tab.id ? { background: `${tab.color}20` } : {}}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: activeTab === tab.id ? `${tab.color}30` : 'transparent' }}>
                <tab.icon size={14} style={{ color: activeTab === tab.id ? tab.color : isDark ? 'rgba(255,255,255,0.38)' : '#94a3b8' }} />
              </div>
              <span className="text-[6.5px] font-black uppercase tracking-widest" style={{ color: activeTab === tab.id ? tab.color : isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8' }}>{tab.label}</span>
            </button>
          ))}
        </div>


        {/* Ã¢â€â‚¬Ã¢â€â‚¬ TAB CONTENT Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <AnimatePresence mode="wait">

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ AERATORS TAB Ã¢â€â‚¬Ã¢â€â‚¬ */}
          {activeTab === 'aerators' && (
            <motion.div key="aerators" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">

              {/* Ã¢â€â‚¬Ã¢â€â‚¬ NO PONDS EMPTY STATE Ã¢â€â‚¬Ã¢â€â‚¬ */}
              {ponds.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn('rounded-3xl p-10 border text-center', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100 shadow-sm')}
                >
                  <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border', isDark ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-cyan-50 border-cyan-200')}>
                    <Wind size={28} className="text-cyan-500" />
                  </div>
                  <p className={cn('text-sm font-black uppercase tracking-widest mb-1', isDark ? 'text-white/60' : 'text-slate-600')}>No Ponds Yet</p>
                  <p className={cn('text-[9px] font-medium leading-relaxed', isDark ? 'text-white/30' : 'text-slate-400')}>
                    Add a pond first to see aerator schedules and manage your devices.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Ã¢â€â‚¬Ã¢â€â‚¬ AERATOR COMPLIANCE SUMMARY Ã¢â€â‚¬Ã¢â€â‚¬ */}
                  {(() => {
                    const activePonds = ponds.filter(p => p.status === 'active' && (selectedPondId === 'all' || p.id === selectedPondId));
                    const withData    = activePonds.filter(p => p.aerators && p.aerators.count > 0);
                    const compliant   = withData.filter(p => {
                      const doc = calculateDOC(p.stockingDate);
                      const rec = doc > 60 ? 5 : doc > 40 ? 3 : doc > 20 ? 2 : 1;
                      return (p.aerators?.count ?? 0) >= rec;
                    });
                    const noData      = activePonds.filter(p => !p.aerators || p.aerators.count === 0);
                    if (activePonds.length === 0) return null;
                    return (
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Data Recorded', value: withData.length, color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
                          { label: 'SOP Compliant', value: compliant.length, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
                          { label: 'No Data Yet', value: noData.length, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                        ].map((s, i) => (
                          <div key={i} className={cn('rounded-2xl px-3 py-3 border text-center', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                            <span className="text-xl font-black tracking-tighter block" style={{ color: s.color }}>{s.value}</span>
                            <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>{s.label}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Ã¢â€â‚¬Ã¢â€â‚¬ POND-WISE AERATOR CARDS Ã¢â€â‚¬Ã¢â€â‚¬ */}
                  <div>
                    <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2 px-1', isDark ? 'text-white/30' : 'text-slate-400')}>Pond Aerators</p>
                    <div className="space-y-4">
                      {ponds
                        .filter(p => p.status === 'active' && (selectedPondId === 'all' || p.id === selectedPondId))
                        .map((pond, pi) => {
                          const doc         = calculateDOC(pond.stockingDate);
                          const aerData     = pond.aerators;
                          const hasData     = aerData && aerData.count > 0;
                          const count       = aerData?.count ?? 0;
                          const hp          = aerData?.hp ?? 0;
                          const positions   = aerData?.positions ?? [];
                          const lastDoc     = aerData?.lastDoc ?? null;
                          const lastUpdated = aerData?.lastUpdated ? new Date(aerData.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null;
                          const log         = aerData?.log ?? [];
                          const watt        = hp <= 1 ? 750 : hp <= 2 ? 1100 : hp <= 3 ? 2200 : 3700;
                          const runtime     = doc > 40 ? 22 : doc > 20 ? 18 : 14;
                          // SOP recommended count
                          const recCount    = doc > 60 ? 5 : doc > 40 ? 3 : doc > 20 ? 2 : 1;
                          const isSopMet    = hasData && count >= recCount;
                          const isStale     = lastDoc !== null && (doc - lastDoc) > 20; // not updated in >20 DOC

                          return (
                            <motion.div
                              key={pond.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: pi * 0.07 }}
                              className={cn(
                                'rounded-2xl border overflow-hidden',
                                isDark ? 'bg-white/4 border-white/10' : 'bg-white border-slate-100 shadow-sm',
                                isStale && hasData ? (isDark ? 'border-amber-500/30' : 'border-amber-300') : '',
                              )}
                            >
                              {/* Pond header */}
                              <div className={cn('flex items-center justify-between px-4 py-3 border-b', isDark ? 'border-white/8 bg-white/4' : 'border-slate-50 bg-slate-50')}>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">🐟 </span>
                                  <div>
                                    <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{pond.name}</p>
                                    <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>
                                      DOC {doc}
                                      {hasData ? ` · ${count} aerator${count > 1 ? 's' : ''} · ${hp} HP each` : ' · No data recorded'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {hasData && (
                                    <span className={cn(
                                      'text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full',
                                      isSopMet
                                        ? (isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700')
                                        : (isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600')
                                    )}>
                                      {isSopMet ? '✅ SOP Met' : `Need ${recCount}`}
                                    </span>
                                  )}
                                  {hasData && (
                                    <div className="text-right">
                                      <p className="text-[10px] font-black text-cyan-500">{(count * watt / 1000).toFixed(1)} kW</p>
                                      <p className={cn('text-[6px] font-black', isDark ? 'text-white/25' : 'text-slate-400')}>load</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Stale warning */}
                              {isStale && hasData && (
                                <div className={cn('flex items-center gap-2 px-4 py-2', isDark ? 'bg-amber-500/8' : 'bg-amber-50')}>
                                  <AlertTriangle size={10} className="text-amber-500 flex-shrink-0" />
                                  <p className="text-[8px] font-black text-amber-500">
                                    Last updated at DOC {lastDoc} —  {doc - (lastDoc ?? 0)} days ago. Update recommended.
                                  </p>
                                </div>
                              )}

                              {/* NO DATA STATE */}
                              {!hasData ? (
                                <div className={cn('px-4 py-6 text-center space-y-3')}>
                                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border', isDark ? 'bg-amber-500/8 border-amber-500/20' : 'bg-amber-50 border-amber-200')}>
                                    <AlertTriangle size={20} className="text-amber-500" />
                                  </div>
                                  <div>
                                    <p className={cn('text-[10px] font-black tracking-tight mb-1', isDark ? 'text-white/60' : 'text-slate-700')}>No Aerator Data Recorded</p>
                                    <p className={cn('text-[8px] font-medium leading-relaxed', isDark ? 'text-white/30' : 'text-slate-400')}>
                                      SOP recommends <strong>{recCount} aerator{recCount > 1 ? 's' : ''}</strong> for DOC {doc}.<br />
                                      Go to Pond Details → Aerator Management to record your setup.
                                    </p>
                                  </div>
                                  <div className={cn('rounded-xl p-3 border text-left', isDark ? 'bg-white/4 border-white/8' : 'bg-slate-50 border-slate-100')}>
                                    <p className={cn('text-[7px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/25' : 'text-slate-400')}>Recommended for DOC {doc}</p>
                                    <p className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-800')}>
                                      {recCount} Aerator{recCount > 1 ? 's' : ''} · {doc > 40 ? '3–5 HP' : doc > 20 ? '2 HP' : '1 HP'} each
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Data summary row */}
                                  <div className="grid grid-cols-3 divide-x" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
                                    {[
                                      { label: 'Total HP', value: `${count * hp} HP` },
                                      { label: 'Est. kWh/day', value: `${(count * watt * runtime / 1000).toFixed(1)}` },
                                      { label: 'Updated', value: lastUpdated ?? 'Unknown' },
                                    ].map((s, i) => (
                                      <div key={i} className={cn('flex flex-col items-center py-2.5 gap-0.5', isDark ? 'bg-white/2' : 'bg-slate-50/80')}>
                                        <span className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-800')}>{s.value}</span>
                                        <span className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>{s.label}</span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Aerator rows */}
                                  <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                                    {Array.from({ length: count }).map((_, ai) => {
                                      const posLabel = positions[ai] ?? `Position ${ai + 1}`;
                                      const devId    = `aer-${pond.id}-${ai}`;
                                      const dev      = devices.find(d => d.id === devId);
                                      const isOn     = dev?.isOn ?? true;
                                      return (
                                        <div key={ai} className={cn('flex items-center gap-3 px-4 py-3', isDark ? 'bg-white/2' : 'bg-white')}>
                                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                            isOn ? (isDark ? 'bg-cyan-500/15 border border-cyan-500/25' : 'bg-cyan-50 border border-cyan-200') : (isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200')
                                          )}>
                                            <Wind size={13} className={isOn ? 'text-cyan-500' : isDark ? 'text-white/20' : 'text-slate-300'}
                                              style={isOn ? { animation: 'spin 3s linear infinite' } : {}} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className={cn('text-[10px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-800')}>
                                              Aerator {ai + 1} <span className={cn('font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>—  {posLabel}</span>
                                            </p>
                                            <p className={cn('text-[7px] font-medium', isDark ? 'text-white/25' : 'text-slate-400')}>
                                              {hp} HP · {watt}W · {runtime}h/day · ~{(watt * runtime / 1000).toFixed(1)} kWh
                                            </p>
                                          </div>
                                          <button onClick={() => dev && toggleDevice(dev.id)} className="flex-shrink-0">
                                            {isOn
                                              ? <ToggleRight size={24} className="text-emerald-500" />
                                              : <ToggleLeft size={24} className={isDark ? 'text-white/20' : 'text-slate-300'} />}
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Aerator History log */}
                                  {log.length > 1 && (
                                    <div className={cn('px-4 py-3 border-t', isDark ? 'border-white/5' : 'border-slate-50')}>
                                      <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/20' : 'text-slate-400')}>
                                        Update History ({log.length} entries)
                                      </p>
                                      <div className="space-y-1.5">
                                        {log.slice(-3).reverse().map((entry, li) => (
                                          <div key={li} className={cn('flex items-center justify-between py-1.5 px-2 rounded-lg', isDark ? 'bg-white/3' : 'bg-slate-50')}>
                                            <div className="flex items-center gap-2">
                                              <span className={cn('text-[7px] font-black px-1.5 py-0.5 rounded-full', isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-cyan-50 text-cyan-700')}>DOC {entry.doc}</span>
                                              <span className={cn('text-[8px] font-black', isDark ? 'text-white/60' : 'text-slate-700')}>{entry.count} aerator{entry.count > 1 ? 's' : ''} · {entry.hp} HP</span>
                                              {entry.addedNew && <span className="text-[6px] font-black text-emerald-500 uppercase tracking-widest">+Added</span>}
                                            </div>
                                            <span className={cn('text-[6px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>
                                              {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </motion.div>
                          );
                        })
                      }

                      {/* No active ponds under selected filter */}
                      {ponds.filter(p => p.status === 'active' && (selectedPondId === 'all' || p.id === selectedPondId)).length === 0 && (
                        <div className={cn('rounded-2xl p-8 border text-center', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100')}>
                          <Wind size={28} className={cn('mx-auto mb-2', isDark ? 'text-white/20' : 'text-slate-300')} />
                          <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>No active ponds</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DOC STAGE GUIDE */}
                  <div>
                    <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2 px-1', isDark ? 'text-white/30' : 'text-slate-400')}>Aerator SOP by DOC Stage</p>
                    <div className="space-y-2">
                      {aeratorStages.map((stage, i) => {
                        const rangeParts = stage.doc.split('–').map(Number);
                        const activePondsInStage = ponds.filter(p => {
                          if (p.status !== 'active') return false;
                          const doc = calculateDOC(p.stockingDate);
                          return doc >= rangeParts[0] && doc <= rangeParts[1];
                        });
                        const isActive = activePondsInStage.length > 0;
                        if (selectedPondId !== 'all' && !activePondsInStage.find(p => p.id === selectedPondId)) return null;
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className={cn(
                              'rounded-2xl p-4 border flex items-start gap-3 relative overflow-hidden',
                              isActive
                                ? isDark ? 'border-cyan-500/40 bg-cyan-500/8' : 'bg-cyan-50 border-cyan-300'
                                : isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100'
                            )}
                          >
                            {isActive && (
                              <div className="absolute top-2 right-3 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-cyan-400' : 'text-cyan-600')}>
                                  {activePondsInStage.map(p => p.name).join(', ')}
                                </span>
                              </div>
                            )}
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border" style={{ background: `${stage.color}18`, borderColor: `${stage.color}30` }}>
                              <Wind size={16} style={{ color: stage.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white" style={{ background: stage.color }}>DOC {stage.doc}</span>
                                <span className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/40' : 'text-slate-500')}>{stage.hp}</span>
                              </div>
                              <p className={cn('text-xs font-black tracking-tight mb-0.5', isDark ? 'text-white' : 'text-slate-800')}>{stage.count}</p>
                              <p className={cn('text-[9px] font-medium leading-snug', isDark ? 'text-white/40' : 'text-slate-500')}>{stage.tip}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expert tip */}
                  <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-indigo-500/8 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200')}>
                    <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5', isDark ? 'text-indigo-400' : 'text-indigo-700')}>
                      <Info size={10} /> Expert Tip
                    </p>
                    <p className={cn('text-[9px] font-medium leading-relaxed', isDark ? 'text-white/50' : 'text-slate-600')}>
                      Run aerators <strong>between 2 AM – 6 AM</strong> at full power. DO levels drop to critical (&lt;4 mg/L) just before sunrise. For every 1,000 kg biomass, a minimum of 1 HP aerator is recommended.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          )}
          {/* ELECTRICITY BILL TAB */}
          {activeTab === 'electricity' && (
            <motion.div key="electricity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">

              {/* Current month calc */}
              <div className={cn('rounded-2xl p-5 border relative overflow-hidden', isDark ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/8 border-amber-500/20' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200')}>
                <div className="absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 rounded-full" style={{ background: '#f59e0b' }} />
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div>
                    <p className={cn('text-[8px] font-black uppercase tracking-[0.25em] mb-1', isDark ? 'text-amber-400' : 'text-amber-700')}>This Month Estimate</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[11px] font-black text-amber-500">₹</span>
                      <span className={cn('text-3xl font-black tracking-tighter', isDark ? 'text-white' : 'text-slate-900')}>{parseInt(currentBillEst).toLocaleString('en-IN')}</span>
                    </div>
                    <p className={cn('text-[8px] font-medium mt-0.5', isDark ? 'text-white/30' : 'text-slate-500')}>@ ₹{RATE_PER_UNIT}/unit (AP Agri Tariff)</p>
                  </div>
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', isDark ? 'bg-amber-500/15 border border-amber-500/25' : 'bg-amber-100 border border-amber-200')}>
                    <IndianRupee size={20} className="text-amber-500" />
                  </div>
                </div>

                {/* Unit input */}
                <div className={cn('rounded-xl p-3 border flex items-center gap-3 relative z-10', isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-white')}>
                  <BatteryCharging size={16} className="text-amber-500 flex-shrink-0" />
                  <input
                    type="number"
                    value={currentUnits}
                    onChange={e => setCurrentUnits(e.target.value)}
                    placeholder="Enter meter reading (units)"
                    className={cn('flex-1 bg-transparent text-sm font-black outline-none', isDark ? 'text-white placeholder-white/20' : 'text-slate-800 placeholder-slate-400')}
                  />
                  <span className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>kWh</span>
                </div>
              </div>

              {/* Category breakdown */}
              <div className={cn('rounded-2xl p-4 border space-y-3', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
                <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/40' : 'text-slate-500')}>Cost Breakdown</p>
                {[
                  { label: 'Aerators (24h)', share: 60, color: '#0ea5e9', icon: Wind },
                  { label: 'Water Pumps', share: 20, color: '#8b5cf6', icon: RefreshCw },
                  { label: 'Sensors & Control', share: 8, color: '#10b981', icon: Cpu },
                  { label: 'Lighting & Other', share: 12, color: '#f59e0b', icon: Sun },
                ].map((item, i) => {
                  const amount = ((parseFloat(currentBillEst) || 0) * item.share / 100);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <item.icon size={12} style={{ color: item.color }} />
                          <span className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/60' : 'text-slate-700')}>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn('text-[9px] font-black', isDark ? 'text-white/40' : 'text-slate-500')}>{item.share}%</span>
                          <span className="text-[9px] font-black" style={{ color: item.color }}>₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                      <div className={cn('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-slate-100')}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.share}%` }}
                          transition={{ duration: 1.2, ease: 'easeOut', delay: i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ background: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Monthly history chart */}
              <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
                <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3', isDark ? 'text-white/40' : 'text-slate-500')}>Monthly History</p>
                <div className="flex items-end gap-2 h-24">
                  {electricityHistory.map((entry, i) => {
                    const maxAmt = Math.max(...electricityHistory.map(e => e.amount));
                    const pct = (entry.amount / maxAmt) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className={cn('text-[7px] font-black', isDark ? 'text-white/40' : 'text-slate-500')}>₹{(entry.amount / 1000).toFixed(1)}K</span>
                        <div className="w-full relative flex-1 flex items-end">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${pct}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                            className="w-full rounded-t-lg"
                            style={{ background: i === electricityHistory.length - 1 ? '#f59e0b' : isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}
                          />
                        </div>
                        <span className={cn('text-[7px] font-black', isDark ? 'text-white/30' : 'text-slate-400')}>{entry.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Saving tips */}
              <div className={cn('rounded-2xl p-4 border space-y-2', isDark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')}>
                <p className={cn('text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-2', isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                  <Zap size={10} /> Energy Saving Tips
                </p>
                {[
                  'Run aerators on timer: peak 12am–6am, reduce 10am–4pm',
                  'Replace 1.5 HP motors with energy-efficient 1 HP models where DOC < 30',
                  'Use solar-powered DO sensors to cut sensor power cost by 80%',
                  'Clean aerator paddle wheels monthly —  dirty blades use 15% more power',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className={cn('text-[9px] font-medium leading-snug', isDark ? 'text-white/50' : 'text-slate-600')}>{tip}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'power' && (
            <motion.div key="power" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">

              {/* View toggle: pond / month / year */}
              <div className={cn('flex rounded-xl overflow-hidden border', isDark ? 'border-white/10' : 'border-slate-200')}>
                {(['pond', 'month', 'year'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setAnalyticsView(v)}
                    className={cn(
                      'flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all',
                      analyticsView === v
                        ? 'bg-red-500 text-white'
                        : (isDark ? 'text-white/30 bg-white/4' : 'text-slate-500 bg-slate-50')
                    )}
                  >
                    {v === 'pond' ? '🐟 Pond' : v === 'month' ? '📅 Month' : '📆 Year'}
                  </button>
                ))}
              </div>

              {/* POND-WISE VIEW */}
              {analyticsView === 'pond' && (
                <div className="space-y-3">
                  <p className={cn('text-[8px] font-black uppercase tracking-widest px-1', isDark ? 'text-white/30' : 'text-slate-400')}>Pond-Wise Daily Electricity Cost</p>
                  {ponds.filter(p => p.status === 'active').length === 0 ? (
                    <div className={cn('rounded-2xl p-8 border text-center', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100')}>
                      <p className={cn('text-xs font-black', isDark ? 'text-white/30' : 'text-slate-400')}>No active ponds</p>
                    </div>
                  ) : (
                    ponds.filter(p => p.status === 'active').map((pond, i) => {
                      const doc = calculateDOC(pond.stockingDate);
                      const realCount = pond.aerators?.count ?? (doc > 60 ? 5 : doc > 40 ? 3 : doc > 20 ? 2 : 1);
                      const realHp = pond.aerators?.hp ?? (doc > 40 ? 3 : doc > 20 ? 2 : 1);
                      const wattPerUnit = realHp <= 1 ? 750 : realHp <= 2 ? 1100 : realHp <= 3 ? 2200 : 3700;
                      const totalKw = (realCount * wattPerUnit) / 1000;
                      const runtime = doc > 40 ? 22 : doc > 20 ? 18 : 14;
                      const dailyKwh = totalKw * runtime;
                      const dailyCost = dailyKwh * RATE_PER_UNIT;
                      const monthlyCost = dailyCost * 30;
                      return (
                        <motion.div
                          key={pond.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className={cn('rounded-2xl p-4 border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base">🐟 </span>
                              <div>
                                <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{pond.name}</p>
                                <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>DOC {doc} · {realCount} aerators × {realHp} HP</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-black tracking-tighter text-amber-500">₹{dailyCost.toFixed(0)}</p>
                              <p className={cn('text-[7px] font-black', isDark ? 'text-white/30' : 'text-slate-400')}>per day</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {[
                              { label: 'Total Load', value: `${totalKw.toFixed(1)} kW`, color: '#ef4444' },
                              { label: 'Daily Units', value: `${dailyKwh.toFixed(0)} kWh`, color: '#f59e0b' },
                              { label: 'Monthly Est', value: `₹${(monthlyCost / 1000).toFixed(1)}K`, color: '#10b981' },
                            ].map((stat, si) => (
                              <div key={si} className={cn('rounded-xl p-2 border text-center', isDark ? 'bg-white/4 border-white/8' : 'bg-slate-50 border-slate-100')}>
                                <p className="text-[10px] font-black" style={{ color: stat.color }}>{stat.value}</p>
                                <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>{stat.label}</p>
                              </div>
                            ))}
                          </div>
                          {/* Runtime bar */}
                          <div className="flex items-center gap-2">
                            <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>Runtime {runtime}h/day</span>
                            <div className={cn('flex-1 h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-slate-100')}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(runtime / 24) * 100}%` }}
                                transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                                className="h-full rounded-full"
                                style={{ background: 'linear-gradient(90deg,#ef4444,#f59e0b)' }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}

                  {/* Unit tariff table */}
                  <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100')}>
                    <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5', isDark ? 'text-white/40' : 'text-slate-500')}>
                      <IndianRupee size={10} /> AP Agriculture Tariff (Unit-wise Cost)
                    </p>
                    <div className="space-y-1.5">
                      {[
                        { slab: '0 – 50 units', rate: '₹0.00', desc: 'Free (subsidised farming)' },
                        { slab: '51 – 100 units', rate: '₹1.50', desc: 'Subsidised rate' },
                        { slab: '101 – 200 units', rate: '₹3.00', desc: 'Standard rate' },
                        { slab: '201 – 500 units', rate: '₹5.00', desc: 'Aquaculture category' },
                        { slab: '500+ units', rate: '₹6.00', desc: 'Commercial rate' },
                      ].map((slab, i) => (
                        <div key={i} className={cn('flex items-center justify-between py-1.5', i > 0 ? (isDark ? 'border-t border-white/5' : 'border-t border-slate-50') : '')}>
                          <div>
                            <p className={cn('text-[9px] font-black', isDark ? 'text-white' : 'text-slate-800')}>{slab.slab}</p>
                            <p className={cn('text-[7px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>{slab.desc}</p>
                          </div>
                          <span className="text-[11px] font-black text-amber-500">{slab.rate}<span className={cn('text-[7px] font-black', isDark ? 'text-white/30' : 'text-slate-400')}>/unit</span></span>
                        </div>
                      ))}
                    </div>
                    <p className={cn('text-[7px] font-medium mt-3 leading-relaxed', isDark ? 'text-white/20' : 'text-slate-400')}>
                      * Rates as per AP DISCOM agriculture tariff order 2023-24. Aquaculture farmers may apply for dedicated feeder under 24h agricultural supply scheme.
                    </p>
                  </div>
                </div>
              )}

              {/* MONTH-WISE VIEW */}
              {analyticsView === 'month' && (
                <div className="space-y-3">
                  <p className={cn('text-[8px] font-black uppercase tracking-widest px-1', isDark ? 'text-white/30' : 'text-slate-400')}>Month-Wise Electricity Expense</p>
                  <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
                    <div className="flex items-end gap-1.5 h-32 mb-2">
                      {electricityHistory.map((entry, i) => {
                        const maxAmt = Math.max(...electricityHistory.map(e => e.amount));
                        const pct = (entry.amount / maxAmt) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className={cn('text-[6px] font-black', isDark ? 'text-white/40' : 'text-slate-500')}>
                              ₹{(entry.amount / 1000).toFixed(0)}K
                            </span>
                            <div className="w-full relative flex-1 flex items-end">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${pct}%` }}
                                transition={{ duration: 1.2, ease: 'easeOut', delay: i * 0.08 }}
                                className="w-full rounded-t-lg"
                                style={{ background: i === electricityHistory.length - 1 ? '#ef4444' : (isDark ? 'rgba(239,68,68,0.25)' : '#fecaca') }}
                              />
                            </div>
                            <span className={cn('text-[6px] font-black', isDark ? 'text-white/30' : 'text-slate-400')}>{entry.month}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className={cn('pt-2 border-t flex items-center justify-between', isDark ? 'border-white/5' : 'border-slate-50')}>
                      <div>
                        <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>Avg Monthly</p>
                        <p className="text-sm font-black text-red-500">
                          ₹{Math.round(electricityHistory.reduce((s, e) => s + e.amount, 0) / electricityHistory.length).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>Peak Month</p>
                        <p className="text-sm font-black text-amber-500">
                          ₹{Math.max(...electricityHistory.map(e => e.amount)).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Month details table */}
                  <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'border-white/8' : 'border-slate-100')}>
                    {electricityHistory.map((entry, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex items-center justify-between px-4 py-3',
                          i > 0 ? (isDark ? 'border-t border-white/5' : 'border-t border-slate-50') : '',
                          i === electricityHistory.length - 1 ? (isDark ? 'bg-red-500/8' : 'bg-red-50') : (isDark ? 'bg-white/3' : 'bg-white')
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-6 rounded-full" style={{ background: i === electricityHistory.length - 1 ? '#ef4444' : '#e2e8f0' }} />
                          <div>
                            <p className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-800')}>{entry.month} {new Date().getFullYear()}</p>
                            <p className={cn('text-[7px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>{entry.units} kWh consumed</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn('text-[11px] font-black', i === electricityHistory.length - 1 ? 'text-red-500' : (isDark ? 'text-white' : 'text-slate-800'))}>₹{entry.amount.toLocaleString('en-IN')}</p>
                          <p className={cn('text-[7px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>₹{(entry.amount / entry.units).toFixed(2)}/unit</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* YEAR-WISE VIEW */}
              {analyticsView === 'year' && (
                <div className="space-y-3">
                  <p className={cn('text-[8px] font-black uppercase tracking-widest px-1', isDark ? 'text-white/30' : 'text-slate-400')}>Year-Wise Summary</p>
                  {[
                    { year: '2022–23', totalKwh: 8450, totalCost: 42250, ponds: 2, cycles: 2, color: '#8b5cf6' },
                    { year: '2023–24', totalKwh: 11200, totalCost: 56000, ponds: 3, cycles: 2, color: '#0ea5e9' },
                    { year: '2024–25', totalKwh: 14800, totalCost: 74000, ponds: ponds.filter(p => p.status === 'active').length, cycles: 1, color: '#ef4444' },
                  ].map((yr, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={cn('rounded-2xl p-4 border', i === 2 ? (isDark ? 'bg-red-500/8 border-red-500/20' : 'bg-red-50 border-red-200') : (isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'))}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${yr.color}18` }}>
                            <span className="text-xs">📆</span>
                          </div>
                          <div>
                            <p className={cn('text-[11px] font-black', isDark ? 'text-white' : 'text-slate-900')}>{yr.year}</p>
                            <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>{yr.ponds} ponds · {yr.cycles} culture cycle{yr.cycles > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        {i === 2 && <span className="text-[7px] font-black px-2 py-0.5 rounded-full bg-red-500 text-white uppercase">Current</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={cn('rounded-xl p-2.5 border text-center', isDark ? 'bg-white/5 border-white/8' : 'bg-slate-50 border-slate-100')}>
                          <p className="text-sm font-black text-amber-500">{yr.totalKwh.toLocaleString()} kWh</p>
                          <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>Total Consumed</p>
                        </div>
                        <div className={cn('rounded-xl p-2.5 border text-center', isDark ? 'bg-white/5 border-white/8' : 'bg-slate-50 border-slate-100')}>
                          <p className="text-sm font-black" style={{ color: yr.color }}>₹{(yr.totalCost / 1000).toFixed(0)}K</p>
                          <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>Total Expense</p>
                        </div>
                      </div>
                      <div className={cn('mt-2 h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-slate-100')}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(yr.totalKwh / 15000) * 100}%` }}
                          transition={{ duration: 1.2, ease: 'easeOut', delay: i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ background: yr.color }}
                        />
                      </div>
                    </motion.div>
                  ))}

                  {/* Savings insight */}
                  <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')}>
                    <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5', isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                      <Zap size={10} /> Potential Annual Savings
                    </p>
                    <p className={cn('text-lg font-black tracking-tighter text-emerald-500 mb-1')}>₹18,000 – ₹26,000</p>
                    <p className={cn('text-[8px] font-medium leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
                      By switching to energy-efficient 1.1 kW aerators, running timers (reduce 3h/day), and solar-powered sensors —  estimated savings for a 3-pond, 4-acre farm over 12 months.
                    </p>
                  </div>
                </div>
              )}

              {/* 24h load profile (always visible) */}
              <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
                <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5', isDark ? 'text-white/40' : 'text-slate-500')}>
                  <Clock size={10} /> Recommended 24h Aeration Profile
                </p>
                <div className="space-y-2">
                  {[
                    { time: '12AM – 6AM', load: 'MAX', desc: 'Full aerators —  DO critical zone before sunrise', icon: Moon, color: '#6366f1', pct: 100 },
                    { time: '6AM – 10AM', load: 'HIGH', desc: 'Feeding time —  keep DO > 5 mg/L', icon: Sun, color: '#10b981', pct: 85 },
                    { time: '10AM – 4PM', load: 'MED', desc: 'Daylight photosynthesis —  reduce 1 aerator', icon: Sun, color: '#f59e0b', pct: 55 },
                    { time: '4PM – 9PM', load: 'HIGH', desc: 'Feeding window —  aerators back up', icon: Wind, color: '#0ea5e9', pct: 80 },
                    { time: '9PM – 12AM', load: 'HIGH', desc: 'Night DO drop starts —  increase aeration', icon: Moon, color: '#8b5cf6', pct: 90 },
                  ].map((slot, i) => (
                    <div key={i} className={cn('rounded-xl p-2.5 border flex items-center gap-2.5', isDark ? 'bg-white/4 border-white/8' : 'bg-slate-50 border-slate-100')}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${slot.color}18` }}>
                        <slot.icon size={12} style={{ color: slot.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[6px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: slot.color }}>{slot.load}</span>
                          <span className={cn('text-[8px] font-black', isDark ? 'text-white/50' : 'text-slate-700')}>{slot.time}</span>
                        </div>
                        <div className={cn('h-1 rounded-full overflow-hidden mb-0.5', isDark ? 'bg-white/5' : 'bg-slate-200')}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${slot.pct}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                            className="h-full rounded-full"
                            style={{ background: slot.color }}
                          />
                        </div>
                        <p className={cn('text-[7px] font-medium leading-tight', isDark ? 'text-white/25' : 'text-slate-400')}>{slot.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* LOAD TAB */}
          {activeTab === 'load' && (
            <motion.div key="load" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">

              {/* 24hr power profile */}
              <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
                <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5', isDark ? 'text-white/40' : 'text-slate-500')}>
                  <Clock size={10} /> Recommended 24h Power Profile
                </p>
                <div className="space-y-2">
                  {[
                    { time: '12AM – 6AM', load: 'MAX', desc: 'Full aerators on —  DO critical zone', icon: Moon, color: '#6366f1', pct: 100 },
                    { time: '6AM – 10AM', load: 'HIGH', desc: 'Feeding time —  maintain DO > 5 mg/L', icon: Sun, color: '#10b981', pct: 85 },
                    { time: '10AM – 4PM', load: 'MED', desc: 'Daylight DO recovery —  can reduce 1 aerator', icon: Sun, color: '#f59e0b', pct: 60 },
                    { time: '4PM – 8PM', load: 'HIGH', desc: 'Feeding window —  aerators back up', icon: Wind, color: '#0ea5e9', pct: 80 },
                    { time: '8PM – 12AM', load: 'HIGH', desc: 'Night DO drop starts —  increase aeration', icon: Moon, color: '#8b5cf6', pct: 90 },
                  ].map((slot, i) => (
                    <div key={i} className={cn('rounded-xl p-3 border flex items-center gap-3', isDark ? 'bg-white/4 border-white/8' : 'bg-slate-50 border-slate-100')}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${slot.color}18` }}>
                        <slot.icon size={13} style={{ color: slot.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full text-white uppercase" style={{ background: slot.color }}>{slot.load}</span>
                          <span className={cn('text-[8px] font-black', isDark ? 'text-white/50' : 'text-slate-600')}>{slot.time}</span>
                        </div>
                        <p className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-slate-500')}>{slot.desc}</p>
                        <div className={cn('mt-1 h-1 rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-slate-200')}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${slot.pct}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                            className="h-full rounded-full"
                            style={{ background: slot.color }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pond-wise power usage */}
              {ponds.filter(p => p.status === 'active').length > 0 && (
                <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
                  <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3', isDark ? 'text-white/40' : 'text-slate-500')}>Pond-Wise Power Estimate</p>
                  <div className="space-y-3">
                    {ponds.filter(p => p.status === 'active').map((pond, i) => {
                      const doc = calculateDOC(pond.stockingDate);
                      const aerCount = doc > 40 ? 4 : doc > 20 ? 2 : 1;
                      const kw = aerCount * 0.75;
                      const dailyUnits = kw * 20;
                      const dailyCost = dailyUnits * RATE_PER_UNIT;
                      return (
                        <div key={pond.id}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[8px]">🐟 </span>
                              <span className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-800')}>{pond.name}</span>
                              <span className={cn('text-[7px] font-black', isDark ? 'text-white/30' : 'text-slate-400')}>DOC {doc}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black text-amber-500">{dailyUnits.toFixed(0)} kWh/day</span>
                              <span className={cn('text-[8px] font-black', isDark ? 'text-emerald-400' : 'text-emerald-600')}>₹{dailyCost.toFixed(0)}</span>
                            </div>
                          </div>
                          <div className={cn('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-slate-100')}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (kw / 5) * 100)}%` }}
                              transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                              className="h-full rounded-full"
                              style={{ background: 'linear-gradient(90deg, #0ea5e9, #8b5cf6)' }}
                            />
                          </div>
                          <p className={cn('text-[7px] font-medium mt-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>
                            {aerCount} aerator{aerCount > 1 ? 's' : ''} · {kw} kW · 20h run time
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Monthly projections */}
              <div className={cn('rounded-2xl p-4 border relative overflow-hidden', isDark ? 'bg-indigo-500/8 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200')}>
                <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3', isDark ? 'text-indigo-400' : 'text-indigo-700')}>Monthly Cost Projection</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Daily Cost', value: `₹${(todayUnitsEst * RATE_PER_UNIT).toFixed(0)}`, sub: `${todayUnitsEst.toFixed(0)} kWh` },
                    { label: 'Weekly', value: `₹${(todayUnitsEst * RATE_PER_UNIT * 7).toFixed(0)}`, sub: '7 days' },
                    { label: 'Monthly', value: `₹${(todayUnitsEst * RATE_PER_UNIT * 30 / 1000).toFixed(1)}K`, sub: '30 days' },
                  ].map((proj, i) => (
                    <div key={i} className={cn('rounded-xl p-3 border text-center', isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-white')}>
                      <p className={cn('text-sm font-black tracking-tighter', isDark ? 'text-white' : 'text-slate-900')}>{proj.value}</p>
                      <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>{proj.label}</p>
                      <p className={cn('text-[6px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>{proj.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* SMART BOX TAB — full SmartBoxDashboard embedded */}
          {activeTab === 'iot' && (
            <motion.div key="iot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-3">

              {/* Toolbar row: pond label + actions */}
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                    {iotStatus?.pondName || (ponds.find(p => p.id === iotPondId)?.name) || 'Smart Box Control'}
                  </p>
                  <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
                    {iotAssignedSlaves.length} aerator{iotAssignedSlaves.length !== 1 ? 's' : ''} connected
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {iotDiscoveries.length > 0 && (
                    <div className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/25 rounded-full px-2 py-1">
                      <Sparkles size={9} className="text-emerald-400" />
                      <span className="text-emerald-400 text-[7px] font-black">{iotDiscoveries.length} new</span>
                    </div>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(`/ponds/${iotPondId}/iot/register`)}
                    className={cn('w-8 h-8 rounded-xl flex items-center justify-center border', isDark ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600')}
                    title="Register New Device"
                  >
                    <QrCode size={14} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowIoTGuide(true)}
                    className={cn('w-8 h-8 rounded-xl flex items-center justify-center border', isDark ? 'bg-violet-500/15 border-violet-500/25 text-violet-400' : 'bg-violet-50 border-violet-200 text-violet-600')}
                    title="Setup Guide"
                  >
                    <HelpCircle size={14} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { fetchIotAll(true); fetchIotDiscoveries(); }}
                    className={cn('w-8 h-8 rounded-xl flex items-center justify-center border', isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-white border-slate-200 text-slate-500')}
                  >
                    <motion.div animate={{ rotate: iotSpinning ? 360 : 0 }} transition={{ duration: 0.5 }}>
                      <RefreshCw size={13} />
                    </motion.div>
                  </motion.button>
                </div>
              </div>

              {/* Loading skeleton */}
              {iotLoading && !iotStatus && (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className={cn('rounded-[1.75rem] h-28 animate-pulse', isDark ? 'bg-white/5' : 'bg-slate-200')} />
                  ))}
                </div>
              )}

              {/* Error banner */}
              <AnimatePresence>
                {iotError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 flex items-center gap-3"
                  >
                    <WifiOff size={14} className="text-red-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-400 text-[9px] font-black uppercase tracking-widest">Connection Error</p>
                      <p className="text-red-400/60 text-[8px] mt-0.5">{iotError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* No devices yet — empty state */}
              {!iotLoading && !iotError && (iotStatus?.devices.length === 0 || !iotStatus) && iotDiscoveries.length === 0 && (
                <div className="space-y-3">
                  <div className={cn('rounded-[1.75rem] border p-6 text-center', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                    <div className="w-14 h-14 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl">📡</div>
                    <p className={cn('font-black text-sm mb-2', isDark ? 'text-white' : 'text-slate-900')}>No Smart Box Set Up Yet</p>
                    <p className={cn('text-[9px] font-medium leading-relaxed mb-4', isDark ? 'text-white/30' : 'text-slate-500')}>
                      Register a Master Box first. It connects to your WiFi and manages all Smart Boxes wirelessly.
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(`/ponds/${iotPondId}/iot/register`)}
                      className="w-full py-3.5 rounded-2xl bg-violet-500 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> Register Master Box
                    </motion.button>
                  </div>
                  {/* Quick setup steps */}
                  <div className={cn('rounded-2xl border p-4 space-y-3', isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200')}>
                    <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>📖 How to Set Up</p>
                    {[
                      { step: '1', emoji: '📱', text: 'Tap "Register Master Box" above — app gives you a code.', color: '#8B5CF6' },
                      { step: '2', emoji: '🔑', text: 'Give code to your hardware supplier. They enter it in Master Box.', color: '#F59E0B' },
                      { step: '3', emoji: '🌐', text: 'Turn ON Master Box near WiFi router. Green LED = connected.', color: '#0EA5E9' },
                      { step: '4', emoji: '🔌', text: 'Electrician installs Smart Box at aerator motor.', color: '#EF4444' },
                      { step: '5', emoji: '✅', text: 'Turn ON Smart Box — it connects automatically. Tap Assign here.', color: '#10B981' },
                    ].map(({ step, emoji, text, color }) => (
                      <div key={step} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{ background: `${color}15` }}>{emoji}</div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full text-white mr-1.5" style={{ background: color }}>STEP {step}</span>
                          <span className={cn('text-[8px] font-medium', isDark ? 'text-white/50' : 'text-slate-600')}>{text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discovery Banner — new devices found */}
              <AnimatePresence>
                {iotDiscoveries.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-2">
                    <p className={cn('text-[7px] font-black uppercase tracking-widest px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
                      <Sparkles size={8} className="inline mr-1" />New Devices Found · {iotDiscoveries.length}
                    </p>
                    {iotDiscoveries.map(entry => (
                      <div key={entry.boxId} className={cn('rounded-[1.75rem] border overflow-hidden', isDark ? 'bg-gradient-to-r from-[#041A0E] to-[#071410] border-emerald-500/25' : 'bg-emerald-50 border-emerald-200')}>
                        <div className="px-4 py-3 flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-500/15 border border-emerald-500/25 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-[11px] font-black', isDark ? 'text-white' : 'text-slate-900')}>New Device Found</p>
                            <p className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-slate-500')}>
                              {entry.boxId} · via {entry.masterId}
                            </p>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(`/ponds/${iotPondId}/iot/register?boxId=${entry.boxId}`)}
                            className="bg-emerald-500 text-white rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest flex items-center gap-1"
                          >
                            Register →
                          </motion.button>

                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Offline alerts */}
              {iotStatus?.devices && (() => {
                const offline = iotStatus.devices.filter(d => d.role === 'slave' && !d.online && d.pairingStatus === 'assigned');
                if (!offline.length) return null;
                return (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 flex items-start gap-3"
                  >
                    <Bell size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-amber-400 text-[9px] font-black uppercase tracking-widest mb-1">
                        {offline.length} Device{offline.length > 1 ? 's' : ''} Offline
                      </p>
                      {offline.map(d => (
                        <p key={d._id} className="text-amber-400/60 text-[8px] font-bold">
                          ⚠ {espnowService.getDeviceLabel(d)} — {d.lastSeenAgo ? `last seen ${d.lastSeenAgo}` : 'never seen'}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                );
              })()}


              {/* Topology Tree — shows Master + all Smart Boxes network */}

              {iotMaster && iotSlaves.length > 0 && (
                <div className={cn('rounded-[1.75rem] border p-4', isDark ? 'bg-[#0A1410] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                  <div className="flex items-center gap-2 mb-3">
                    <GitBranch size={11} className={isDark ? 'text-white/25' : 'text-slate-400'} />
                    <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>Device Network</p>
                  </div>
                  {/* Master row */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-7 h-7 bg-emerald-500/15 border border-emerald-500/25 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Radio size={11} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-[10px] font-black truncate', isDark ? 'text-white' : 'text-slate-900')}>{espnowService.getDeviceLabel(iotMaster)}</p>
                      <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-emerald-400/60' : 'text-emerald-600')}>{iotMaster.boxId} · Master</p>
                    </div>
                    <div className={cn('flex items-center gap-1.5 rounded-full px-2 py-0.5 border', iotMaster.online ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400')}>
                      <div className={cn('w-1 h-1 rounded-full', iotMaster.online ? 'bg-emerald-400 animate-pulse' : 'bg-red-400')} />
                      <span className="text-[6px] font-black uppercase">{iotMaster.online ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>
                  {/* Slaves */}
                  {iotSlaves.map((slave, i) => {
                    const isLast = i === iotSlaves.length - 1;
                    const typeEmoji = espnowService.getDeviceTypeEmoji(slave.deviceType);
                    return (
                      <div key={slave._id} className="flex items-start gap-0">
                        <div className="flex flex-col items-center mr-2 mt-1" style={{ width: 16 }}>
                          <div className={cn('w-px flex-1 min-h-[8px]', isDark ? 'bg-white/10' : 'bg-slate-200')} />
                          <div className={cn('w-3 h-px', isDark ? 'bg-white/10' : 'bg-slate-200')} />
                          {!isLast && <div className={cn('w-px flex-1', isDark ? 'bg-white/10' : 'bg-slate-200')} />}
                        </div>
                        <div className={cn('flex-1 flex items-center gap-2 py-2 px-3 rounded-2xl mb-1.5', isDark ? 'bg-white/3' : 'bg-slate-50')}>
                          <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0', slave.online ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-white/20')}>
                            {typeEmoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-[9px] font-black truncate', isDark ? 'text-white' : 'text-slate-900')}>{espnowService.getDeviceLabel(slave)}</p>
                            <p className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>{slave.boxId}</p>
                          </div>
                          <div className="flex items-center gap-1">
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
                </div>
              )}

              {/* Smart Box Cards — assigned slaves */}
              {iotAssignedSlaves.length > 0 && (
                <div>
                  <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
                    Smart Boxes · {iotAssignedSlaves.length} unit{iotAssignedSlaves.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-3">
                    {iotAssignedSlaves.map((slave, i) => {
                      const hasPending = iotPendingCmds.some((c: any) => c.targetBoxId === slave.boxId);
                      const DevTypeIcon: React.ElementType = slave.deviceType === 'AERATOR' ? Wind : slave.deviceType === 'SENSOR' ? Droplets : slave.deviceType === 'PUMP' ? Waves : Wind;
                      const displayName = espnowService.getDeviceLabel(slave);
                      const typeLabel = DEVICE_TYPE_OPTIONS.find(o => o.value === slave.deviceType)?.label || 'Smart Box';
                      const isOnline = slave.online ?? false;
                      const motorStatus = (slave as any).motorStatus as string | undefined;
                      const msCfg: Record<string, { label: string; sublabel: string; color: string; bgDark: string; borderDark: string; bgLight: string; borderLight: string }> = {
                        RUNNING:       { label: 'Aerator Running',   sublabel: 'Motor operating normally',        color: 'text-emerald-400', bgDark: 'bg-emerald-500/10', borderDark: 'border-emerald-500/20', bgLight: 'bg-emerald-50',  borderLight: 'border-emerald-200' },
                        STOPPED:       { label: 'Aerator Stopped',   sublabel: 'Relay OFF — stopped by command',  color: 'text-slate-400',   bgDark: 'bg-white/5',       borderDark: 'border-white/10',        bgLight: 'bg-slate-100',  borderLight: 'border-slate-200'   },
                        POWER_FAILURE: { label: 'Power Failure',     sublabel: 'Relay ON but no voltage — check EB / MCB', color: 'text-amber-400', bgDark: 'bg-amber-500/10', borderDark: 'border-amber-500/25', bgLight: 'bg-amber-50', borderLight: 'border-amber-200' },
                        FAULT:         { label: 'Motor Fault',       sublabel: 'Relay ON + power OK but no current', color: 'text-red-400', bgDark: 'bg-red-500/10', borderDark: 'border-red-500/25', bgLight: 'bg-red-50', borderLight: 'border-red-200' },
                        OVERCURRENT:   { label: 'Overcurrent Alert', sublabel: 'Motor drawing too much current',   color: 'text-orange-400', bgDark: 'bg-orange-500/10', borderDark: 'border-orange-500/25', bgLight: 'bg-orange-50', borderLight: 'border-orange-200' },
                      };
                      const cfg = (motorStatus && msCfg[motorStatus]) || msCfg.STOPPED;
                      return (
                        <React.Fragment key={slave._id}>
                          <HubSmartBoxCard
                            device={slave}
                            pondId={iotPondId}
                            pendingCmds={iotPendingCmds}
                            onRefresh={() => fetchIotAll()}
                            isDark={isDark}
                            index={i}
                          />
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Command History */}
              {iotAssignedSlaves.length > 0 && iotCommands.length > 0 && (
                <div>
                  <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2 px-1', isDark ? 'text-white/20' : 'text-slate-400')}>Command History</p>
                  <div className={cn('rounded-[1.75rem] border overflow-hidden', isDark ? 'bg-[#0A1410] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                    <div className="px-4 py-2">
                      {iotCommands.map((cmd, i) => {
                        const actionColor: Record<string, string> = {
                          ON: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
                          OFF: 'bg-red-500/10 text-red-400 border-red-500/20',
                          SPEED: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                          RESET: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
                        };
                        const statusMap: Record<string, { cls: string; label: string }> = {
                          pending:   { cls: 'bg-amber-500/15 border-amber-500/25 text-amber-400',   label: 'Pending' },
                          sent:      { cls: 'bg-sky-500/15 border-sky-500/25 text-sky-400',         label: 'Sent' },
                          confirmed: { cls: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400', label: 'Confirmed' },
                          failed:    { cls: 'bg-red-500/15 border-red-500/20 text-red-400',         label: 'Failed' },
                          timeout:   { cls: 'bg-white/5 border-white/10 text-white/30',             label: 'Timeout' },
                        };
                        const sm = statusMap[cmd.status] || statusMap.timeout;
                        return (
                          <React.Fragment key={cmd._id}>
                            <motion.div
                              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0"
                            >
                              <div className={cn('w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 text-[8px] font-black uppercase tracking-widest', actionColor[cmd.action] || 'bg-white/5 text-white/30 border-white/10')}>
                                {cmd.action}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn('text-[9px] font-black truncate', isDark ? 'text-white/70' : 'text-slate-800')}>
                                  {(cmd as any).targetDisplayName || (cmd as any).targetBoxId || 'Unknown Device'}
                                </p>
                                <p className={cn('text-[7px] mt-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>
                                  {new Date(cmd.issuedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </p>
                              </div>
                              <div className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 border text-[7px] font-black uppercase tracking-widest', sm.cls)}>
                                {sm.label}
                              </div>
                            </motion.div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Last poll footer */}
              {iotLastPoll && (
                <p className={cn('text-center text-[7px] font-bold pb-2', isDark ? 'text-white/10' : 'text-slate-300')}>
                  Last synced: {iotLastPoll.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              )}

            </motion.div>
          )}

        </AnimatePresence>

      </div>

      {/* DEVICE ASSIGNMENT MODAL — Smart Box tab */}
      <AnimatePresence>
        {assignTarget && (
          <DeviceAssignmentModal
            entry={assignTarget}
            pondId={iotPondId}
            isDark={isDark}
            onAssigned={() => {
              setAssignTarget(null);
              fetchIotAll(true);
              fetchIotDiscoveries();
            }}
            onDismiss={() => setAssignTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* IoT GUIDE MODAL */}

      <AnimatePresence>
        {showIoTGuide && (
          <motion.div
            key="iot-guide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-end"
            onClick={() => setShowIoTGuide(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className={cn('relative w-full rounded-t-3xl max-h-[88dvh] overflow-y-auto', isDark ? 'bg-[#0D1824] border-t border-white/10' : 'bg-white')}
              onClick={e => e.stopPropagation()}
            >
              {/* Sticky header */}
              <div className={cn('sticky top-0 z-10 flex items-center justify-between px-5 pt-5 pb-4 border-b', isDark ? 'bg-[#0D1824] border-white/10' : 'bg-white border-slate-100')}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl bg-violet-500/15 border border-violet-500/25">
                    📡
                  </div>
                  <div>
                    <p className={cn('text-xs font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Smart Box Guide</p>
                    <p className={cn('text-[8px] font-medium', isDark ? 'text-white/40' : 'text-slate-500')}>How it works & how to set it up</p>
                  </div>
                </div>
                <button onClick={() => setShowIoTGuide(false)} className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'bg-white/10' : 'bg-slate-100')}>
                  <X size={14} className={isDark ? 'text-white/60' : 'text-slate-600'} />
                </button>
              </div>

              <div className="px-5 py-5 space-y-5">
                {/* HOW IT WORKS */}
                <div>
                  <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/25' : 'text-slate-400')}>📖 How It Works</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { emoji: '📶', title: 'Master Box', desc: 'Near WiFi router at home. Connects to internet.', color: '#8B5CF6' },
                      { emoji: '📻', title: 'Smart Box', desc: 'Near aerator at pond. Talks wirelessly.', color: '#0EA5E9' },
                      { emoji: '⚡', title: 'Your Phone', desc: 'Control aerators from anywhere anytime.', color: '#10B981' },
                    ].map((step, i) => (
                      <div key={i} className={cn('rounded-2xl border p-3 text-center', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
                        <div className="text-2xl mb-1.5">{step.emoji}</div>
                        <p className={cn('text-[9px] font-black tracking-tight mb-0.5', isDark ? 'text-white' : 'text-slate-800')}>{step.title}</p>
                        <p className={cn('text-[7px] font-medium leading-tight', isDark ? 'text-white/35' : 'text-slate-500')}>{step.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className={cn('mt-2 rounded-xl px-3 py-2 border flex items-center justify-center gap-2 flex-wrap', isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-100')}>
                    <span className={cn('text-[8px] font-black', isDark ? 'text-violet-400' : 'text-violet-700')}>Master Box</span>
                    <span className="text-sm">📻➡️</span>
                    <span className={cn('text-[8px] font-black', isDark ? 'text-sky-400' : 'text-sky-700')}>Smart Box</span>
                    <span className="text-sm">⚡➡️</span>
                    <span className={cn('text-[8px] font-black', isDark ? 'text-emerald-400' : 'text-emerald-700')}>Aerator Motor</span>
                  </div>
                </div>

                {/* 6 SETUP STEPS */}
                <div>
                  <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/25' : 'text-slate-400')}>🔧 Setup Steps — Do This Once</p>
                  <div className="space-y-2.5">
                    {[
                      {
                        step: 1, emoji: '📱', title: 'Register Master Box in This App',
                        desc: 'Go to any Pond page → Tap the IoT icon → Tap "Register Master Box". The app gives you a code.',
                        tag: 'In the App', tagColor: '#8B5CF6',
                        tips: ['Takes only 2 minutes', 'Select your pond first'],
                      },
                      {
                        step: 2, emoji: '🔑', title: 'Give Code to Your Supplier',
                        desc: 'Your hardware supplier enters the code into Master Box using their software. You don\'t do this yourself.',
                        tag: 'Ask Your Supplier', tagColor: '#F59E0B',
                        tips: ['Supplier does this — not the farmer', 'Test before bringing to farm'],
                      },
                      {
                        step: 3, emoji: '🌐', title: 'Connect Master Box to WiFi',
                        desc: 'Turn ON Master Box near your WiFi router. Wait 1 minute. Green LED = connected. Red LED = check WiFi.',
                        tag: 'Physical Setup', tagColor: '#0EA5E9',
                        tips: ['Keep within 10m of WiFi router', '🟢 Green LED = connected ✅', 'Use 2.4GHz WiFi only'],
                      },
                      {
                        step: 4, emoji: '🔌', title: 'Electrician Installs Smart Box',
                        desc: 'Your electrician connects Smart Box relay wires to the aerator motor. Must be within 200m of Master Box.',
                        tag: 'Needs Electrician', tagColor: '#EF4444',
                        tips: ['1 Smart Box = 1 Aerator only', 'Keep in dry, shaded area', 'Do NOT do wiring yourself!'],
                      },
                      {
                        step: 5, emoji: '🤝', title: 'Smart Box Auto-Connects',
                        desc: 'Turn ON Smart Box. It finds Master Box in 30 seconds. You\'ll see "New Device Found" — tap Assign.',
                        tag: 'Automatic', tagColor: '#10B981',
                        tips: ['No password needed — auto connects', 'Give it a name like "Pond 1 Aerator"'],
                      },
                      {
                        step: 6, emoji: '🎉', title: 'Done! Control from Your Phone',
                        desc: 'Your aerator appears in Smart Box tab. Turn ON/OFF anytime from anywhere. Get alerts if it stops at night.',
                        tag: 'All Done!', tagColor: '#10B981',
                        tips: ['Works 24/7', 'Alerts if aerator stops at night 🌙'],
                      },
                    ].map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100 shadow-sm')}
                      >
                        <div className="h-0.5 w-full" style={{ background: step.tagColor }} />
                        <div className="px-4 py-3 flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${step.tagColor}15` }}>
                            {step.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-1.5 mb-1">
                              <span className="text-[7px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: step.tagColor }}>STEP {step.step}</span>
                              <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase" style={{ background: `${step.tagColor}15`, color: step.tagColor }}>{step.tag}</span>
                            </div>
                            <p className={cn('text-[10px] font-black tracking-tight mb-1', isDark ? 'text-white' : 'text-slate-900')}>{step.title}</p>
                            <p className={cn('text-[8px] font-medium leading-relaxed mb-1.5', isDark ? 'text-white/45' : 'text-slate-500')}>{step.desc}</p>
                            <div className="flex flex-wrap gap-1">
                              {step.tips.map((tip, ti) => (
                                <span key={ti} className={cn('text-[7px] font-bold px-2 py-0.5 rounded-full', isDark ? 'bg-white/5 text-white/35' : 'bg-slate-100 text-slate-500')}>💡 {tip}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* ALERTS */}
                <div className={cn('rounded-2xl border p-4', isDark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')}>
                  <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3', isDark ? 'text-emerald-400' : 'text-emerald-700')}>🔔 Automatic Alerts You Will Get</p>
                  <div className="space-y-2">
                    {[
                      { emoji: '🌙', text: 'Aerator stopped at night — check immediately', urgency: 'HIGH' },
                      { emoji: '⚡', text: 'Power cut — aerator relay ON but no electricity', urgency: 'HIGH' },
                      { emoji: '🔧', text: 'Motor fault — running but no current flowing', urgency: 'HIGH' },
                      { emoji: '📶', text: 'Smart Box disconnected from Master Box', urgency: 'MED' },
                      { emoji: '✅', text: 'Aerator back online — issue resolved', urgency: 'OK' },
                    ].map((alert, i) => {
                      const urgencyColor = alert.urgency === 'HIGH' ? '#ef4444' : alert.urgency === 'MED' ? '#f59e0b' : '#10b981';
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-lg flex-shrink-0">{alert.emoji}</span>
                          <p className={cn('text-[9px] font-medium flex-1', isDark ? 'text-white/55' : 'text-slate-600')}>{alert.text}</p>
                          <span className="text-[6px] font-black px-1.5 py-0.5 rounded-full" style={{ background: `${urgencyColor}15`, color: urgencyColor }}>{alert.urgency}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TROUBLESHOOTING */}
                <div className={cn('rounded-2xl border p-4 space-y-2', isDark ? 'bg-amber-500/8 border-amber-500/20' : 'bg-amber-50 border-amber-200')}>
                  <p className={cn('text-[8px] font-black uppercase tracking-widest mb-1', isDark ? 'text-amber-400' : 'text-amber-700')}>❓ Problem? Try These Fixes</p>
                  {[
                    { problem: 'Smart Box shows Offline in app', fix: 'Check Master Box green LED. If red, restart it near WiFi router.' },
                    { problem: 'Toggled ON but aerator not running', fix: 'Check aerator manual switch is ON. Check relay wire connections at motor.' },
                    { problem: 'Master Box red LED (no internet)', fix: 'Move closer to WiFi router. Check WiFi password. Use 2.4GHz not 5GHz.' },
                    { problem: 'New Smart Box not showing in app', fix: 'Wait 1 minute after turning on Smart Box. Then tap refresh in Smart Box tab.' },
                  ].map((item, i) => (
                    <div key={i} className={cn('rounded-xl p-2.5 border', isDark ? 'bg-white/5 border-white/8' : 'bg-white/80 border-amber-100')}>
                      <p className={cn('text-[8px] font-black mb-0.5', isDark ? 'text-white/70' : 'text-slate-700')}>❌ {item.problem}</p>
                      <p className={cn('text-[8px] font-medium leading-snug', isDark ? 'text-white/40' : 'text-slate-500')}>✅ Fix: {item.fix}</p>
                    </div>
                  ))}
                </div>

                {/* Register CTA */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowIoTGuide(false); navigate(`/ponds`); }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
                >
                  <CircuitBoard size={14} /> Go to Pond to Register Master Box
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ ADD DEVICE MODAL Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <AnimatePresence>
        {isAddingDevice && (
          <motion.div
            key="add-device"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-end"
            onClick={() => setIsAddingDevice(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className={cn('relative w-full rounded-t-3xl p-6 space-y-4', isDark ? 'bg-[#0D1824] border-t border-white/10' : 'bg-white')}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className={cn('text-sm font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Register New Device</h3>
                <button onClick={() => setIsAddingDevice(false)} className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'bg-white/10' : 'bg-slate-100')}>
                  <X size={14} className={isDark ? 'text-white/60' : 'text-slate-600'} />
                </button>
              </div>

              {/* Type selector */}
              <div className="grid grid-cols-4 gap-2">
                {(['aerator', 'sensor', 'feeder', 'pump'] as IoTDevice['type'][]).map(type => {
                  const icons = { aerator: Wind, sensor: Activity, feeder: Droplets, pump: RefreshCw };
                  const colors = { aerator: '#0ea5e9', sensor: '#10b981', feeder: '#f59e0b', pump: '#8b5cf6' };
                  const Icon = icons[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setNewDeviceType(type)}
                      className={cn('rounded-2xl p-3 flex flex-col items-center gap-1.5 border transition-all', newDeviceType === type ? 'border-current shadow-sm' : (isDark ? 'bg-white/4 border-white/8' : 'bg-slate-50 border-slate-100'))}
                      style={newDeviceType === type ? { background: `${colors[type]}15`, borderColor: `${colors[type]}40` } : {}}
                    >
                      <Icon size={16} style={{ color: colors[type] }} />
                      <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: colors[type] }}>{type}</span>
                    </button>
                  );
                })}
              </div>

              {/* Name input */}
              <div className={cn('rounded-xl p-3 border flex items-center gap-2', isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}>
                <Settings size={14} className={isDark ? 'text-white/30' : 'text-slate-400'} />
                <input
                  value={newDeviceName}
                  onChange={e => setNewDeviceName(e.target.value)}
                  placeholder="Device name (e.g. Aerator 3)"
                  className={cn('flex-1 bg-transparent text-sm outline-none font-medium', isDark ? 'text-white placeholder-white/20' : 'text-slate-800 placeholder-slate-400')}
                />
              </div>

              {/* Pond selector */}
              <div className={cn('rounded-xl p-3 border flex items-center gap-2', isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}>
                <Waves size={14} className={isDark ? 'text-white/30' : 'text-slate-400'} />
                <select
                  value={newDevicePond}
                  onChange={e => setNewDevicePond(e.target.value)}
                  className={cn('flex-1 bg-transparent text-sm outline-none font-medium', isDark ? 'text-white' : 'text-slate-800')}
                >
                  <option value="">Select Pond</option>
                  {ponds.filter(p => p.status === 'active' || p.status === 'planned').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={addDevice}
                disabled={!newDeviceName.trim() || !newDevicePond}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[11px] font-black uppercase tracking-[0.12em] shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Register Device
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
