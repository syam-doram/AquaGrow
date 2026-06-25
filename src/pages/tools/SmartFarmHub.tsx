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
  Pencil,
  Save,
  Trash2,
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
import { calcStarterGroups, type StarterGroup } from '../../utils/starterGroupUtils';

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
  ponds, isDark, navigate, compact = false, onDeleteDevice,
}: {
  ponds: any[];
  isDark: boolean;
  navigate: (path: string) => void;
  compact?: boolean;
  onDeleteDevice?: (device: any) => void;
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

  // Deduplicate by _id — a multi-pond Master Box appears in every covered pond's
  // API response, so without dedup it shows up N times in the flat list.
  const _seenIds = new Set<string>();
  const allDevices = Object.values(byPond)
    .flatMap((d: any) => d?.devices ?? [])
    .filter((d: any) => {
      if (_seenIds.has(d._id)) return false;
      _seenIds.add(d._id);
      return true;
    });
  const masters   = allDevices.filter((d: any) => d.role === 'master');
  const slaves    = allDevices.filter((d: any) => d.role === 'slave' && d.pairingStatus === 'assigned');
  const onlineAll = allDevices.filter((d: any) => d.online).length;
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


            {/* DEVICE NETWORK — Smart Box topology */}
            {(pondMaster || pondSlaves.length > 0) && (
              <div className={cn('rounded-[1.75rem] border overflow-hidden', isDark ? 'bg-[#071010] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                <div className={cn('px-4 py-3 border-b flex items-center gap-2', isDark ? 'border-white/5' : 'border-slate-100')}>
                  <GitBranch size={11} className={isDark ? 'text-violet-400' : 'text-violet-500'} />
                  <p className={cn('text-[7.5px] font-black uppercase tracking-widest', isDark ? 'text-violet-400' : 'text-violet-600')}>
                    Device Network · {(pondMaster ? 1 : 0) + pondSlaves.length} device{((pondMaster ? 1 : 0) + pondSlaves.length) !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {/* Master row */}
                  {pondMaster && (
                    <div className={cn('rounded-2xl border px-3 py-2 flex items-center gap-2.5', isDark ? 'bg-violet-500/8 border-violet-500/20' : 'bg-violet-50 border-violet-200')}>
                      <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0', isDark ? 'bg-violet-500/20' : 'bg-violet-100')}>
                        <Radio size={12} className="text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-[8.5px] font-black truncate', isDark ? 'text-white' : 'text-slate-900')}>{espnowService.getDeviceLabel(pondMaster)}</p>
                        <p className={cn('text-[6.5px] font-medium', isDark ? 'text-white/25' : 'text-slate-400')}>{pondMaster.boxId} · Master Gateway</p>
                      </div>
                      <span className={cn('text-[6px] font-black uppercase px-1.5 py-0.5 rounded-full border flex items-center gap-0.5', pondMaster.online ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/15 text-red-400')}>
                        <span className={cn('w-1 h-1 rounded-full', pondMaster.online ? 'bg-emerald-400 animate-pulse' : 'bg-red-400')} />
                        {pondMaster.online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  )}
                  {/* Slave rows */}
                  {pondSlaves.map((slave: any, si: number) => {
                    const isOn = slave.aeratorState === 'ON';
                    const isOnline = slave.online === true;
                    return (
                      <div key={slave._id} className="flex items-start gap-2 pl-4">
                        <div className="w-px self-stretch bg-violet-500/15 mx-1 flex-shrink-0" />
                        <div className={cn('flex-1 rounded-2xl border px-3 py-2 flex items-center gap-2.5',
                          isOnline && isOn ? isDark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                          : isOnline ? isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-100'
                          : isDark ? 'bg-red-500/5 border-red-500/10' : 'bg-red-50 border-red-100'
                        )}>
                          <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0',
                            isOnline && isOn ? isDark ? 'bg-emerald-500/15' : 'bg-emerald-100'
                            : isOnline ? isDark ? 'bg-sky-500/10' : 'bg-sky-50'
                            : isDark ? 'bg-white/5' : 'bg-slate-100'
                          )}>
                            <Cpu size={11} className={isOnline && isOn ? 'text-emerald-400' : isOnline ? 'text-sky-400' : isDark ? 'text-white/20' : 'text-slate-300'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-[8.5px] font-black truncate', isDark ? 'text-white/80' : 'text-slate-900')}>{espnowService.getDeviceLabel(slave)}</p>
                            <p className={cn('text-[6.5px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>
                              {slave.boxId} · Smart Box {si + 1}{slave.signalStrength != null ? ' · ' + slave.signalStrength + 'dBm' : ''}
                            </p>
                          </div>
                          <span className={cn('text-[6px] font-black uppercase px-1.5 py-0.5 rounded-full border flex items-center gap-0.5',
                            isOnline && isOn ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : isOnline ? isDark ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'
                            : 'bg-red-500/10 border-red-500/15 text-red-400'
                          )}>
                            <span className={cn('w-1 h-1 rounded-full', isOnline && isOn ? 'bg-emerald-400 animate-pulse' : isOnline ? 'bg-sky-400' : 'bg-red-400')} />
                            {isOnline ? (isOn ? 'Running' : 'Stopped') : 'Offline'}
                          </span>
                          {/* Delete button */}
                          {onDeleteDevice && (
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={e => { e.stopPropagation(); onDeleteDevice(slave); }}
                              className={cn('w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all',
                                isDark ? 'bg-red-500/8 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-500',
                              )}
                              title="Delete Smart Box"
                            >
                              <Trash2 size={9} />
                            </motion.button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
// ─── STARTER GROUP EDIT MODAL ──────────────────────────────────────────────
interface StarterGroupEditModalProps {
  group: { groupNumber: number; groupName?: string; aeratorCount: number };
  isDark: boolean;
  onSave: (groupNumber: number, groupName: string, aeratorCount: number) => void;
  onClose: () => void;
}

const StarterGroupEditModal = ({ group, isDark, onSave, onClose }: StarterGroupEditModalProps) => {
  const [name, setName] = React.useState(group.groupName ?? '');
  const [capacity, setCapacity] = React.useState(group.aeratorCount);
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(group.groupNumber, name.trim(), capacity);
    setSaving(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className={cn(
          'w-full max-w-[420px] rounded-t-[2rem] border-t border-x px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-5',
          isDark ? 'bg-[#0B1A28] border-white/10' : 'bg-white border-slate-200',
        )}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1' }} />

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border', isDark ? 'bg-violet-500/15 border-violet-500/25' : 'bg-violet-50 border-violet-200')}>
            <Pencil size={16} className="text-violet-400" />
          </div>
          <div>
            <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              Edit Starter Group {group.groupNumber}
            </p>
            <p className={cn('text-[7px] font-bold uppercase tracking-widest mt-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>
              Customise name &amp; aerator capacity
            </p>
          </div>
        </div>

        {/* Group Name */}
        <div className="space-y-1.5">
          <p className={cn('text-[7.5px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>
            Group Name
          </p>
          <div className={cn('flex items-center gap-2 rounded-2xl border px-3 py-3', isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}>
            <Pencil size={12} className={isDark ? 'text-white/25' : 'text-slate-400'} />
            <input
              id={`sg-name-${group.groupNumber}`}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`e.g. North Side, Group ${group.groupNumber}`}
              maxLength={32}
              className={cn('flex-1 bg-transparent text-[11px] font-black outline-none placeholder:font-normal', isDark ? 'text-white placeholder:text-white/20' : 'text-slate-900 placeholder:text-slate-300')}
            />
            {name && (
              <button onClick={() => setName('')} className={isDark ? 'text-white/20' : 'text-slate-300'}>
                <X size={11} />
              </button>
            )}
          </div>
          <p className={cn('text-[6.5px] font-medium px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
            Leave blank to use the default &ldquo;Starter Group {group.groupNumber}&rdquo;
          </p>
        </div>

        {/* Aerator Capacity */}
        <div className="space-y-1.5">
          <p className={cn('text-[7.5px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>
            Aerator Capacity (how many aerators this group controls)
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(n => (
              <motion.button
                key={n}
                id={`sg-cap-${group.groupNumber}-${n}`}
                whileTap={{ scale: 0.92 }}
                onClick={() => setCapacity(n)}
                className={cn(
                  'rounded-2xl border py-3 flex flex-col items-center gap-1 transition-all',
                  capacity === n
                    ? isDark
                      ? 'bg-violet-500/20 border-violet-500/40'
                      : 'bg-violet-50 border-violet-300'
                    : isDark
                      ? 'bg-white/3 border-white/8'
                      : 'bg-slate-50 border-slate-200',
                )}
              >
                <span className={cn('text-base font-black tracking-tight', capacity === n ? 'text-violet-400' : isDark ? 'text-white/40' : 'text-slate-500')}>{n}</span>
                <span className={cn('text-[5.5px] font-black uppercase tracking-widest', capacity === n ? 'text-violet-400' : isDark ? 'text-white/20' : 'text-slate-400')}>
                  {n === 1 ? 'unit' : 'units'}
                </span>
              </motion.button>
            ))}
          </div>
          <p className={cn('text-[6.5px] font-medium px-1', isDark ? 'text-white/20' : 'text-slate-400')}>
            Max 4 aerators per starter group (1 Smart Box controls up to 4 aerators)
          </p>
        </div>

        {/* Save */}
        <motion.button
          id={`sg-save-${group.groupNumber}`}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest',
            saving ? 'opacity-60 cursor-not-allowed' : '',
            'bg-violet-500 text-white',
          )}
        >
          {saving
            ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Save size={13} />
          }
          {saving ? 'Saving…' : 'Save Changes'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export const SmartFarmHub = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { ponds, theme, updatePond } = useData() as any;
  const isDark = theme === 'dark' || theme === 'midnight';

  const [activeTab, setActiveTab] = useState<'aerators' | 'electricity' | 'power' | 'load' | 'iot'>('aerators');
  const [analyticsView, setAnalyticsView] = useState<'pond' | 'month' | 'year'>('pond');
  const [selectedPondId, setSelectedPondId] = useState<string>('all');
  const [showIoTGuide, setShowIoTGuide] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{ pondId: string; group: { groupNumber: number; groupName?: string; aeratorCount: number } } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ _id: string; displayName?: string; boxId?: string; role?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

  const iotPondId = selectedPondId !== 'all' ? selectedPondId : (ponds.find((p: any) => p.status === 'active')?.id || '');
  // Full map of ALL ponds' IoT status (for multi-pond Master Box support)
  const [iotAllByPond, setIotAllByPond] = useState<Record<string, any>>({});

  const fetchIotAll = useCallback(async (showSpinner = false) => {
    const activePonds = ponds.filter((p: any) => p.status === 'active' || p.status === 'planned');
    if (!activePonds.length) return;
    if (showSpinner) setIotSpinning(true);
    // Only show loading skeleton on first load (no existing data)
    // Background polls are fully silent to prevent card blinking
    const isFirstLoad = !iotStatus;
    if (isFirstLoad) setIotLoading(true);
    try {
      // Fetch ALL ponds in parallel so multi-pond Masters are visible
      const results = await Promise.allSettled(
        activePonds.map((p: any) =>
          Promise.all([
            espnowService.getPondStatus(p.id),
            espnowService.getCommandHistory(p.id, { limit: 10 }),
          ]).then(([s, cmds]) => ({ pondId: p.id, s, cmds }))
        )
      );
      const allMap: Record<string, any> = {};
      let primaryStatus: PondIoTStatus | null = null;
      let primaryCmds: EspAeratorCommand[] = [];
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          allMap[r.value.pondId] = r.value.s;
          if (r.value.pondId === iotPondId) {
            primaryStatus = r.value.s;
            primaryCmds   = r.value.cmds;
          }
        }
      });
      // Merge with prev data — keeps old pond data visible between polls
      setIotAllByPond(prev => ({ ...prev, ...allMap }));
      // Also set single-pond state for actions (command/assign) targeting iotPondId
      if (primaryStatus) {
        setIotStatus(primaryStatus);
        setIotCommands(primaryCmds);
      } else if (results[0]?.status === 'fulfilled') {
        setIotStatus((results[0] as any).value.s);
        setIotCommands((results[0] as any).value.cmds);
      }
      setIotError(null);
      setIotLastPoll(new Date());
    } catch (err: any) {
      setIotError(err.message || 'Failed to fetch IoT status');
    } finally {
      if (isFirstLoad) setIotLoading(false);
      if (showSpinner) setIotSpinning(false);
    }
  }, [iotPondId, ponds, iotStatus]);

  const fetchIotDiscoveries = useCallback(async () => {
    try {
      // Pass pondId only when a specific pond is selected; omit it to get all ponds' discoveries
      const entries = await espnowService.getPendingDiscoveries(iotPondId || undefined);
      setIotDiscoveries(entries);
    } catch { /* non-critical */ }
  }, [iotPondId]);

  const handleDeleteDevice = useCallback(async () => {
    // Support both _id and id field (API may return either)
    const deviceId = deleteTarget?._id || (deleteTarget as any)?.id;
    if (!deviceId) {
      setDeleteError('Device ID not found. Please refresh and try again.');
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await espnowService.deleteDevice(deviceId);
      setDeleteTarget(null);
      setDeleteError(null);
      await fetchIotAll(false);
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete device. Please try again.');
    } finally { setDeleting(false); }
  }, [deleteTarget, fetchIotAll]);


  // Always poll for new device discoveries (banner shown above tabs on all tabs).
  // Re-run whenever fetchIotDiscoveries changes (i.e. when iotPondId changes) so the
  // interval never runs with a stale closure that silently skips the fetch.
  useEffect(() => {
    fetchIotDiscoveries();
    iotDiscoverRef.current = setInterval(() => fetchIotDiscoveries(), 10000);
    return () => { if (iotDiscoverRef.current) clearInterval(iotDiscoverRef.current); };
  }, [fetchIotDiscoveries]);

  // Full IoT status poll — only on SmartBox or Aerators tab
  useEffect(() => {
    if (activeTab !== 'iot' && activeTab !== 'aerators') return;
    fetchIotAll();
    iotPollRef.current = setInterval(() => fetchIotAll(), 5000);
    return () => { if (iotPollRef.current) clearInterval(iotPollRef.current); };
  }, [activeTab, fetchIotAll]);

  // Derived IoT values
  const iotMaster         = iotStatus?.devices.find(d => d.role === 'master');
  const iotSlaves         = iotStatus?.devices.filter(d => d.role === 'slave') ?? [];
  const iotAssignedSlaves = iotSlaves.filter(d => d.pairingStatus === 'assigned');
  const iotPendingCmds    = iotStatus?.pendingCommandDetails ?? [];


  // ── HP ↔ Watts lookup (IEC nameplate) ────────────────────────────────────
  // Maps common aerator HP ratings to approximate nameplate watts.
  const HP_WATTS: Record<number, number> = { 0.5: 375, 1: 746, 1.5: 1119, 2: 1492, 3: 2238, 5: 3730 };
  const hpToWatts = (hp: number): number => {
    const nearest = Object.keys(HP_WATTS).map(Number)
      .reduce((prev, cur) => Math.abs(cur - hp) < Math.abs(prev - hp) ? cur : prev);
    return HP_WATTS[nearest] ?? Math.round(hp * 746);
  };

  /**
   * Resolves CONSUMED watts for a SmartBox slave device.
   * Returns 0 if the device is offline OR the aerator/relay is stopped.
   * Only counts power when: online=true AND (relayOn=true OR aeratorState='ON')
   *
   * Priority when running:
   *  1. Real powerWatts from current sensor
   *  2. V × A (real telemetry)
   *  3. HP-based nameplate from pond config
   *  4. Generic 746W fallback (1 HP)
   */
  const getDeviceHpWatts = (d: any): number => {
    // Gate: MUST be online AND actively running — never count stopped/offline devices
    const isRunning = d.online === true && (d.relayOn === true || d.aeratorState === 'ON');
    if (!isRunning) return 0;

    // Use real sensor data if available
    if ((d.powerWatts ?? 0) > 0) return d.powerWatts;
    if ((d.voltage ?? 0) > 0 && (d.current ?? 0) > 0) return d.voltage * d.current;

    // Fall back to HP nameplate from pond config
    const pondCfg = ponds.find((p: any) => p.id === (d.pondId || d.pond));
    const hp = pondCfg?.aerators?.hp;
    if (hp) return hpToWatts(hp);
    return 746; // 1 HP fallback
  };

  // All assigned slaves across every pond (for multi-pond farms)
  const allAssignedSlaves: any[] = useMemo(() =>
    Object.values(iotAllByPond)
      .flatMap((s: any) => (s?.devices || []) as any[])
      .filter((d: any) => d.role === 'slave' && d.pairingStatus === 'assigned'),
  [iotAllByPond]);

  // Computed stats — from REAL IoT slave devices across ALL ponds
  const iotOnlineCount  = allAssignedSlaves.filter(d => d.online).length;
  const iotOfflineCount = allAssignedSlaves.filter(d => !d.online).length;
  const iotWarningCount = allAssignedSlaves.filter(d => (d as any).motorStatus === 'FAULT' || (d as any).motorStatus === 'POWER_FAILURE' || (d as any).motorStatus === 'OVERCURRENT').length;

  // Running aerator audit — ONLY devices that are ONLINE AND relay/state is ON
  const runningAeratorsAll: any[] = useMemo(() =>
    allAssignedSlaves.filter(d =>
      d.online === true && (d.relayOn === true || d.aeratorState === 'ON') && d.deviceType === 'AERATOR'
    ),
  [allAssignedSlaves]);

  // Total installed aerator capacity from pond configs (count × HP per pond, all active ponds)
  // This is the MAXIMUM possible load if all aerators ran simultaneously.
  const totalInstalledCapacityKW = useMemo(() =>
    ponds
      .filter((p: any) => p.status === 'active' || p.status === 'planned')
      .reduce((sum: number, p: any) => {
        const count = p.aerators?.count ?? 0;
        const hp    = p.aerators?.hp ?? 1;
        return sum + count * hpToWatts(hp);
      }, 0) / 1000,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [ponds]);

  // Live Farm Load — ONLY running+online devices contribute.
  // Falls back to 0 (no estimate) when no SmartBoxes present — use totalInstalledCapacityKW for capacity.
  const { totalLoadKW, isRealLoad, totalLoadWatts } = useMemo(() => {
    if (allAssignedSlaves.length > 0) {
      // Real SmartBox data — only running+online devices counted (getDeviceHpWatts returns 0 for stopped)
      const watts = allAssignedSlaves.reduce((sum: number, d: any) => sum + getDeviceHpWatts(d), 0);
      return { totalLoadKW: watts / 1000, isRealLoad: true, totalLoadWatts: watts };
    }
    // No SmartBoxes — show 0 (we don't know what's actually running)
    return { totalLoadKW: 0, isRealLoad: false, totalLoadWatts: 0 };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAssignedSlaves, ponds]);


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
    { id: 'aerators' as const,    label: 'Aerators',    icon: Wind,         color: '#0EA5E9' },
    { id: 'load' as const,        label: 'Live Power',  icon: Gauge,        color: '#F97316' },
    { id: 'electricity' as const, label: 'EB Cost',     icon: IndianRupee,  color: '#F59E0B' },
    { id: 'power' as const,       label: 'Reports',     icon: BarChart2,    color: '#EF4444' },
    { id: 'iot' as const,         label: 'Smart Boxes', icon: CircuitBoard, color: '#8B5CF6' },
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

      <div className="px-4 pt-[calc(env(safe-area-inset-top)+4.5rem)] space-y-5 relative z-10" id="hub-scroll-top">

        {/* -- UNIFIED FARM STATUS BANNER -- */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

          {/* Main status card */}
          <div className={cn('rounded-2xl border overflow-hidden shadow-sm relative', isDark ? 'bg-gradient-to-br from-[#0D1F33] to-[#081522] border-white/10' : 'bg-white border-slate-100')}>
            {/* Top accent bar � changes color by status */}
            <div className={cn('h-1 w-full', iotWarningCount > 0 ? 'bg-red-500' : runningAeratorsAll.length > 0 ? 'bg-emerald-400' : 'bg-slate-300/30')} />

            <div className="px-4 pt-3 pb-4">
              {/* Row 1: Title + live badge */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Smart Farm Hub</p>
                  <p className={cn('text-[7.5px] font-bold uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>
                    {ponds.filter((p: any) => p.status === 'active').length} active pond{ponds.filter((p: any) => p.status === 'active').length !== 1 ? 's' : ''} � {allAssignedSlaves.length} SmartBox{allAssignedSlaves.length !== 1 ? 'es' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {iotWarningCount > 0 && (
                    <span className="flex items-center gap-1 bg-red-500/15 border border-red-500/25 text-red-400 text-[6.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                      <AlertTriangle size={8} /> {iotWarningCount} Alert{iotWarningCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  <span className={cn('text-[6.5px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest',
                    runningAeratorsAll.length > 0
                      ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                      : isDark ? 'bg-white/6 border-white/10 text-white/30' : 'bg-slate-100 border-slate-200 text-slate-400'
                  )}>
                    {runningAeratorsAll.length > 0 ? `? ${runningAeratorsAll.length} Running` : '? Standby'}
                  </span>
                </div>
              </div>

              {/* Row 2: Status pills */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {[
                  { label: 'Online', value: iotOnlineCount, color: '#10b981', icon: Wifi },
                  { label: 'Offline', value: iotOfflineCount, color: '#ef4444', icon: WifiOff },
                  { label: 'Warning', value: iotWarningCount, color: '#f59e0b', icon: AlertTriangle },
                ].map((s, i) => (
                  <div key={i} className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border', isDark ? 'bg-white/4 border-white/8' : 'bg-slate-50 border-slate-100')}>
                    <s.icon size={9} style={{ color: s.color }} />
                    <span className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-800')}>{s.value}</span>
                    <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>{s.label}</span>
                  </div>
                ))}
                <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ml-auto', isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200')}>
                  <Zap size={9} className="text-amber-500" />
                  <span className="text-[10px] font-black text-amber-500">{totalLoadKW.toFixed(2)}</span>
                  <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-amber-400/50' : 'text-amber-600/60')}>kW</span>
                </div>
              </div>

              {/* Row 3: Load progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>Farm Load</span>
                  <span className={cn('text-[7px] font-black', isDark ? 'text-white/30' : 'text-slate-500')}>
                    {totalLoadKW.toFixed(2)} kW running � {totalInstalledCapacityKW.toFixed(2)} kW installed
                  </span>
                </div>
                <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-slate-100')}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${totalInstalledCapacityKW > 0 ? Math.min(100, (totalLoadKW / totalInstalledCapacityKW) * 100) : 0}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: totalLoadKW > totalInstalledCapacityKW * 0.8 ? 'linear-gradient(90deg,#ef4444,#f97316)' : 'linear-gradient(90deg,#10b981,#0ea5e9)' }}
                  />
                </div>
              </div>

              {/* Row 4: Running aerator pills (only when running) */}
              {runningAeratorsAll.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {runningAeratorsAll.map((d: any) => {
                    const w = getDeviceHpWatts(d);
                    const pondCfg = ponds.find((p: any) => p.id === (d.pondId || d.pond));
                    const hp = pondCfg?.aerators?.hp;
                    return (
                      <div key={d._id} className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full border text-[6.5px] font-black', isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700')}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {espnowService.getDeviceLabel(d)}
                        {hp && <span className="opacity-50">� {hp}HP</span>}
                        {w > 0 && <span className="text-amber-500">� {w}W</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* IoT Device Sync Panel � compact, below banner */}
          <IotDeviceSyncPanel ponds={ponds} isDark={isDark} navigate={navigate} compact />
        </motion.div>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬ TABS Ã¢â€â‚¬Ã¢â€â‚¬ */}

        {/* ── NEW DEVICE DISCOVERY BANNER — always visible above tabs ── */}
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

        {/* -- TAB BAR -- sticky, pill style */}
        <div
          className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}
          style={{ position: 'sticky', top: 'env(safe-area-inset-top, 0px)', zIndex: 20 }}
        >
          <div className="flex">
            {tabs.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn('flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 relative transition-all duration-200',
                    idx > 0 ? (isDark ? 'border-l border-white/6' : 'border-l border-slate-100') : ''
                  )}
                  style={isActive ? { background: `${tab.color}18` } : {}}
                >
                  {/* Active indicator bar at top */}
                  {isActive && (
                    <motion.div layoutId="tab-indicator" className="absolute top-0 left-2 right-2 h-0.5 rounded-b-full" style={{ background: tab.color }} />
                  )}
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-all', isActive ? 'shadow-sm' : '')}
                    style={{ background: isActive ? `${tab.color}28` : 'transparent' }}>
                    <tab.icon size={15} style={{ color: isActive ? tab.color : isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8' }} />
                  </div>
                  <span className="text-[6px] font-black uppercase tracking-widest leading-tight text-center" style={{ color: isActive ? tab.color : isDark ? 'rgba(255,255,255,0.25)' : '#94a3b8' }}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>


        {/* ── TAB CONTENT ── */}
        <AnimatePresence mode="wait">

          {/* ── AERATORS TAB ── */}
          {activeTab === 'aerators' && (
            <motion.div key="aerators" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-5">

              {/* ── POND SELECTOR — only ponds with assigned SmartBox aerators ── */}
              {(() => {
                // Only show ponds that actually have at least one assigned SmartBox aerator
                const allDevices: any[] = Object.values(iotAllByPond).flatMap((s: any) => (s?.devices || []) as any[]);
                const assignedPondIds = new Set(
                  allDevices
                    .filter((d: any) => d.role === 'slave' && d.pairingStatus === 'assigned' && d.deviceType === 'AERATOR')
                    .map((d: any) => d.pondId || d.pond)
                    .filter(Boolean)
                );
                // Fall back to all active/planned ponds if no IoT data yet
                const allActive = ponds.filter((p: any) => p.status === 'active' || p.status === 'planned');
                const visiblePonds = assignedPondIds.size > 0
                  ? allActive.filter((p: any) => assignedPondIds.has(p.id))
                  : allActive;

                if (visiblePonds.length === 0) return null;

                // Auto-select first pond if 'all' is selected (no more All Ponds pill)
                const effectivePondId = (selectedPondId === 'all' || !visiblePonds.find((p: any) => p.id === selectedPondId))
                  ? visiblePonds[0].id
                  : selectedPondId;
                if (effectivePondId !== selectedPondId) setSelectedPondId(effectivePondId);

                const selectedPond = visiblePonds.find((p: any) => p.id === effectivePondId);

                return (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-2 mb-2 px-1"><div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: "#0EA5E920" }}><Waves size={10} style={{ color: "#0EA5E9" }} /></div><p className="text-[8px] font-black uppercase tracking-widest" style={{ color: "#0EA5E9" }}>Select Pond</p></div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {visiblePonds.map((p: any) => {
                        const isSelected = effectivePondId === p.id;
                        const doc = calculateDOC(p.stockingDate);
                        const aerCount = p.aerators?.count ?? 0;
                        return (
                          <motion.button
                            key={p.id}
                            id={`pond-filter-${p.id}`}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => setSelectedPondId(p.id)}
                            className={cn(
                              'flex-shrink-0 flex flex-col items-start px-3.5 py-2 rounded-2xl border transition-all min-w-[110px]',
                              isSelected
                                ? isDark ? 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300' : 'bg-cyan-500 border-cyan-500 text-white'
                                : isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm',
                            )}
                          >
                            <div className="flex items-center gap-1.5 w-full">
                              <span className="text-[10px]">🐟</span>
                              <p className={cn('text-[8.5px] font-black truncate flex-1 text-left',
                                isSelected ? isDark ? 'text-cyan-200' : 'text-white' : isDark ? 'text-white/70' : 'text-slate-800'
                              )}>{p.name}</p>
                              {isSelected && <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', isDark ? 'bg-cyan-400' : 'bg-white')} />}
                            </div>
                            <p className={cn('text-[6px] font-bold uppercase tracking-widest mt-0.5',
                              isSelected ? isDark ? 'text-cyan-400/60' : 'text-white/70' : isDark ? 'text-white/20' : 'text-slate-400'
                            )}>DOC {doc} · {aerCount} aerator{aerCount !== 1 ? 's' : ''}</p>
                          </motion.button>
                        );
                      })}
                    </div>
                    {selectedPond && (
                      <div className={cn('mt-2 rounded-2xl border px-3.5 py-2.5 flex items-center gap-2', isDark ? 'bg-cyan-500/8 border-cyan-500/20' : 'bg-cyan-50 border-cyan-200')}>
                        <Wind size={11} className="text-cyan-400 flex-shrink-0" />
                        <p className={cn('text-[7.5px] font-black', isDark ? 'text-cyan-300' : 'text-cyan-700')}>
                          {selectedPond.name} · {selectedPond.aerators?.count ?? 0} aerators
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })()}
              {/* SECTION: Pond Aerator Control */}
              <div className="flex items-center gap-2 px-1">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: "#0EA5E920" }}><CircuitBoard size={11} style={{ color: "#0EA5E9" }} /></div>
                <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: "#0EA5E9" }}>Pond Aerator Control</p>
                <span className={cn("ml-auto text-[7px] font-black px-2 py-0.5 rounded-full border", isDark ? "bg-white/5 border-white/10 text-white/30" : "bg-slate-100 border-slate-200 text-slate-400")}>{ponds.filter((p: any) => p.status === "active").length} ponds</span>
              </div>
              {/* ── SMART BOX AERATOR CONTROL ── */}
              {(() => {
                // Collect ALL assigned aerator slave devices, filtered by selected pond
                const allDevices: any[] = Object.values(iotAllByPond).flatMap((s: any) => (s?.devices || []) as any[]);
                const aeratorSlaves = allDevices.filter(d =>
                  d.role === 'slave' &&
                  d.pairingStatus === 'assigned' &&
                  d.deviceType === 'AERATOR' &&
                  (selectedPondId === 'all' || d.pondId === selectedPondId || d.pond === selectedPondId)
                );

                if (aeratorSlaves.length === 0) {
                  // No Smart Boxes with aerators registered
                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn('rounded-3xl border p-8 text-center space-y-4', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100 shadow-sm')}
                    >
                      <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border', isDark ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-cyan-50 border-cyan-200')}>
                        <CircuitBoard size={28} className="text-cyan-500" />
                      </div>
                      <div>
                        <p className={cn('text-sm font-black tracking-tight mb-1', isDark ? 'text-white/70' : 'text-slate-800')}>
                          No Smart Box Aerators Yet
                        </p>
                        <p className={cn('text-[9px] font-medium leading-relaxed max-w-xs mx-auto', isDark ? 'text-white/30' : 'text-slate-400')}>
                          Register a Smart Box and add the aerators it controls. They will appear here with live ON/OFF toggle and motor status.
                        </p>
                      </div>
                      <div className={cn('rounded-2xl p-4 text-left space-y-2 border', isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-100')}>
                        <p className={cn('text-[7.5px] font-black uppercase tracking-widest mb-2', isDark ? 'text-white/25' : 'text-slate-400')}>How to set up</p>
                        {[
                          { n: '1', t: 'Go to Smart Box tab → Register a Master Box for your pond' },
                          { n: '2', t: 'Tap Register Smart Box → select Device Type: Aerator' },
                          { n: '3', t: 'Tick which aerator positions this Smart Box controls' },
                          { n: '4', t: 'Come back here — each aerator shows live motor status & toggle' },
                        ].map(s => (
                          <div key={s.n} className="flex items-start gap-2">
                            <span className={cn('w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black flex-shrink-0', isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700')}>{s.n}</span>
                            <p className={cn('text-[8px] font-medium leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>{s.t}</p>
                          </div>
                        ))}
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setActiveTab('iot'); }}
                        className="w-full py-3 rounded-2xl bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <CircuitBoard size={14} /> Go to Smart Box Tab
                      </motion.button>
                    </motion.div>
                  );
                }

                // Group Smart Box slaves by pond
                const byPond: Record<string, any[]> = {};
                aeratorSlaves.forEach(d => {
                  const pid = d.pondId || d.pond || 'unknown';
                  if (!byPond[pid]) byPond[pid] = [];
                  byPond[pid].push(d);
                });

                return (
                  <div className="space-y-4">

                    {/* Summary strip */}
                    <div className={cn('rounded-2xl border px-4 py-3 flex items-center justify-between', isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-100')}>
                      <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>
                        Smart Box Aerator Control
                      </p>
                      <div className="flex items-center gap-3">
                        <span className={cn('text-[7px] font-black uppercase', isDark ? 'text-white/30' : 'text-slate-400')}>
                          💨 {aeratorSlaves.reduce((s: number, d: any) => s + (d.aeratorLabels?.length ?? 0), 0)} aerators
                        </span>
                        <span className={cn('text-[7px] font-black uppercase', isDark ? 'text-white/30' : 'text-slate-400')}>
                          📦 {aeratorSlaves.length} boxes
                        </span>
                      </div>
                    </div>

                    {Object.entries(byPond).map(([pid, slaves]) => {
                      const pond = ponds.find(p => p.id === pid || p._id === pid);
                      const pondName = pond?.name ?? 'Unknown Pond';
                      const doc = pond ? calculateDOC(pond.stockingDate) : 0;
                      const totalAerators: number = pond?.aerators?.count ?? 0;
                      const pondStarterGroups: StarterGroup[] = (() => {
                        const saved = pond?.aerators?.starterGroups;
                        if (saved && saved.length > 0) return saved as StarterGroup[];
                        return calcStarterGroups(totalAerators);
                      })();
                      
                      // Filter groups: only show if assigned to a Smart Box
                      const assignedGroups = pondStarterGroups.filter((g: StarterGroup) => {
                        return (slaves as any[]).some(s => {
                          if (s.starterGroup === g.groupNumber) return true;
                          return (s.aeratorLabels ?? []).some((l: string) => g.aeratorNames.includes(l));
                        });
                      });

                      return (
                        <motion.div
                          key={pid}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-white/4 border-white/10' : 'bg-white border-slate-100 shadow-sm')}
                        >
                          {/* Pond header */}
                          <div className={cn('px-4 py-3 border-b', isDark ? 'border-white/8 bg-white/4' : 'border-slate-50 bg-slate-50')}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">🐟</span>
                                <div>
                                  <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{pondName}</p>
                                  <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>
                                    DOC {doc} · {assignedGroups.length} group{assignedGroups.length !== 1 ? 's' : ''} assigned
                                  </p>
                                </div>
                              </div>
                              {(() => {
                                const onlineCount = (slaves as any[]).filter(s => s.online).length;
                                const total = (slaves as any[]).length;
                                return (
                                  <div className={cn('flex items-center gap-1 text-[7px] font-black px-2 py-0.5 rounded-full border',
                                    onlineCount === total
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                      : onlineCount === 0
                                        ? 'bg-red-500/10 border-red-500/15 text-red-400'
                                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                  )}>
                                    <span className={cn('w-1.5 h-1.5 rounded-full', onlineCount === total ? 'bg-emerald-400 animate-pulse' : onlineCount === 0 ? 'bg-red-400' : 'bg-amber-400')} />
                                    {onlineCount}/{total} online
                                  </div>
                                );
                              })()}
                            </div>
                          </div>


                          {/* Starter Groups — only assigned ones */}
                          <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                            {assignedGroups.map(g => {
                              const smartBox = (slaves as any[]).find(s => {
                                if (s.starterGroup === g.groupNumber) return true;
                                // fallback: match by aerator labels overlap
                                return (s.aeratorLabels ?? []).some((l: string) => g.aeratorNames.includes(l));
                              });
                              const labels: string[] = smartBox?.aeratorLabels ?? g.aeratorNames;
                              const hasPending = smartBox ? iotPendingCmds.some((c: any) => c.targetBoxId === smartBox.boxId) : false;

                               return (
                                 <motion.div
                                   key={g.groupNumber}
                                   initial={{ opacity: 0, y: 6 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   transition={{ delay: g.groupNumber * 0.05 }}
                                   className={cn("mx-4 mb-3 rounded-2xl border overflow-hidden",
                                     !smartBox
                                       ? isDark ? "bg-white/2 border-white/8 border-dashed" : "bg-slate-50 border-slate-200 border-dashed"
                                       : smartBox.online
                                         ? (smartBox.relayOn ? (isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-200") : (isDark ? "bg-white/4 border-white/10" : "bg-white border-slate-100"))
                                         : isDark ? "bg-red-500/5 border-red-500/15" : "bg-red-50 border-red-200"
                                   )}
                                 >
                                   {/* -- Starter Header Row -- */}
                                   <div className={cn("px-4 py-3 flex items-center gap-3", isDark ? "bg-white/3" : "bg-white/60")}>
                                     {/* Starter number badge */}
                                     <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0 border",
                                       !smartBox ? (isDark ? "bg-white/5 border-white/10 text-white/30" : "bg-slate-100 border-slate-200 text-slate-400")
                                       : smartBox.online ? (isDark ? "bg-violet-500/20 border-violet-500/30 text-violet-300" : "bg-violet-100 border-violet-200 text-violet-700")
                                       : (isDark ? "bg-red-500/15 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-500")
                                     )}>
                                       {g.groupNumber}
                                     </div>

                                     {/* Starter info */}
                                     <div className="flex-1 min-w-0">
                                       <p className={cn("text-[10px] font-black tracking-tight", isDark ? "text-white/90" : "text-slate-900")}>
                                         {(g as any).groupName || `Starter ${g.groupNumber}`}
                                       </p>
                                       <p className={cn("text-[7px] font-medium mt-0.5", isDark ? "text-white/25" : "text-slate-400")}>
                                         {g.aeratorCount} aerator{g.aeratorCount !== 1 ? "s" : ""}
                                         {" � Aerator"}{g.aeratorStart !== g.aeratorEnd ? `s ${g.aeratorStart}�${g.aeratorEnd}` : ` ${g.aeratorStart}`}
                                         {smartBox ? ` � ${smartBox.boxId}` : " � No SmartBox"}
                                       </p>
                                     </div>

                                     {/* Status + Toggle */}
                                     {smartBox ? (
                                       <div className="flex items-center gap-2 flex-shrink-0">
                                         {/* Online/Offline pill */}
                                         <span className={cn("text-[6.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border flex items-center gap-1",
                                           smartBox.online
                                             ? "bg-emerald-500/12 border-emerald-500/20 text-emerald-400"
                                             : "bg-red-500/10 border-red-500/20 text-red-400"
                                         )}>
                                           <span className={cn("w-1.5 h-1.5 rounded-full", smartBox.online ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
                                           {smartBox.online ? "Online" : "Offline"}
                                         </span>
                                         {/* Simple inline ON/OFF toggle */}
                                         {smartBox.online ? (
                                           <motion.button
                                             whileTap={{ scale: 0.92 }}
                                             disabled={hasPending}
                                             onClick={async (e) => {
                                               e.stopPropagation();
                                               const action: 'ON' | 'OFF' = smartBox.aeratorState === 'ON' ? 'OFF' : 'ON';
                                               try { await espnowService.sendCommandById({ boxId: smartBox.boxId, action, pondId: pid }); setTimeout(() => fetchIotAll(), 1500); } catch {}
                                             }}
                                             className={cn(
                                               "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all",
                                               hasPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                                               smartBox.aeratorState === 'ON'
                                                 ? isDark ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                 : isDark ? "bg-white/5 border-white/10 text-white/30" : "bg-slate-100 border-slate-200 text-slate-500"
                                             )}
                                           >
                                             {smartBox.aeratorState === 'ON'
                                               ? <ToggleRight size={14} className="text-emerald-400" />
                                               : <ToggleLeft size={14} className={isDark ? "text-white/20" : "text-slate-300"} />
                                             }
                                             {smartBox.aeratorState === 'ON' ? "ON" : "OFF"}
                                           </motion.button>
                                         ) : (
                                           <div className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest", isDark ? "bg-red-500/8 border-red-500/15 text-red-400/70" : "bg-red-50 border-red-200 text-red-400")}>
                                             <ToggleLeft size={12} /> OFF
                                           </div>
                                         )}
                                       </div>
                                     ) : (
                                       <span className={cn("text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-xl border", isDark ? "bg-white/5 border-white/8 text-white/20" : "bg-slate-100 border-slate-200 text-slate-400")}>
                                         Not Assigned
                                       </span>
                                     )}
                                   </div>

                                   {/* -- Issue / Alert row (only if problem) -- */}
                                   {smartBox && (() => {
                                     const alerts: string[] = [];
                                     if (!smartBox.online) alerts.push("SmartBox is offline � aerators cannot be controlled remotely");
                                     if (smartBox.motorStatus === "POWER_FAILURE") alerts.push("Power failure detected at motor");
                                     if (smartBox.motorStatus === "FAULT") alerts.push("Motor fault � check wiring and breaker");
                                     if (smartBox.motorStatus === "OVERCURRENT") alerts.push("Overcurrent � motor may be jammed or overloaded");
                                     if (!alerts.length) return null;
                                     return (
                                       <div className={cn("px-4 py-2.5 border-t space-y-1", isDark ? "border-red-500/15 bg-red-500/5" : "border-red-200 bg-red-50")}>
                                         {alerts.map((msg, ai) => (
                                           <div key={ai} className="flex items-start gap-2">
                                             <AlertTriangle size={10} className="text-red-400 flex-shrink-0 mt-0.5" />
                                             <p className={cn("text-[7.5px] font-black", isDark ? "text-red-300" : "text-red-600")}>{msg}</p>
                                           </div>
                                         ))}
                                       </div>
                                     );
                                   })()}

                                   {/* -- No SmartBox assigned -- */}
                                   {!smartBox && (
                                     <div className={cn("px-4 py-2.5 flex items-center gap-2 border-t", isDark ? "border-white/5" : "border-slate-100")}>
                                       <CircuitBoard size={10} className={isDark ? "text-white/20" : "text-slate-300"} />
                                       <p className={cn("text-[7.5px] font-medium", isDark ? "text-white/25" : "text-slate-400")}>
                                         No SmartBox assigned � go to Smart Boxes tab to register one for Starter {g.groupNumber}
                                       </p>
                                     </div>
                                   )}
                                 </motion.div>
                               );
                            })}
                          </div>

                          {/* View mapping footer */}
                          <div className={cn('px-4 py-2.5 border-t flex items-center justify-between', isDark ? 'border-white/5 bg-white/2' : 'border-slate-50 bg-slate-50')}>
                            <p className={cn('text-[7px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>
                              {(slaves as any[]).length}/{pondStarterGroups.length} groups assigned
                            </p>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => navigate(`/aerator-mapping/${pid}`)}
                              className={cn('flex items-center gap-1 text-[7.5px] font-black uppercase tracking-widest', isDark ? 'text-violet-400' : 'text-violet-600')}
                            >
                              View Full Mapping <ChevronRight size={9} />
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })()}


                  {(() => {
                    const aeratorStages = [
                      {
                        doc: '1–30',
                        color: '#22c55e',
                        hp: '0.5–1 HP / pond',
                        count: 'Nursery Phase — Light Aeration',
                        tip: 'Run aerators 4–6 hrs/night. Shrimp are fragile; avoid strong current. Target DO ≥ 5 mg/L.',
                      },
                      {
                        doc: '31–60',
                        color: '#06b6d4',
                        hp: '1–2 HP / pond',
                        count: 'Growth Phase — Moderate Aeration',
                        tip: 'Increase to 8–12 hrs/day. Monitor turbidity. Run full power from 2–6 AM.',
                      },
                      {
                        doc: '61–90',
                        color: '#f59e0b',
                        hp: '2–3 HP / pond',
                        count: 'Pre-Harvest Phase — High Aeration',
                        tip: 'Biomass load is peak. Run all aerators continuously at night. DO must stay ≥ 5 mg/L at all times.',
                      },
                      {
                        doc: '91–120',
                        color: '#ef4444',
                        hp: '3+ HP / pond',
                        count: 'Final Phase — Maximum Aeration',
                        tip: 'Critical stage. Any DO crash causes mass mortality. Backup aerators mandatory. Harvest window: DOC 100–120.',
                      },
                    ];
                    return (
                  <>
                  {/* DOC STAGE GUIDE */}
                  <div>
                <div className="flex items-center gap-2 px-1 mb-2"><div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: "#0EA5E920" }}><CalendarDays size={11} style={{ color: "#0EA5E9" }} /></div><p className="text-[8px] font-black uppercase tracking-widest" style={{ color: "#0EA5E9" }}>Aerator Schedule by DOC Stage</p></div>
                    <div className="space-y-2">
                      {aeratorStages.map((stage, i) => {
                        const rangeParts = stage.doc.split('–').map(Number);
                        const activePondsInStage = ponds.filter(p => {
                          if (p.status !== 'active') return false;
                          const doc = calculateDOC(p.stockingDate);
                          return doc >= rangeParts[0] && doc <= rangeParts[1];
                        });
                        const isActive = activePondsInStage.length > 0;
                        if (!isActive) return null;
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
                  );
                  })()}

            </motion.div>
          )}

          {/* ─── ELECTRICITY BILL TAB ─── */}
          {activeTab === 'electricity' && (() => {
            // Use the shared allAssignedSlaves + getDeviceHpWatts (HP-aware) from component scope
            const allSlaves = allAssignedSlaves;

            const totalRunningWatts = allSlaves.reduce((sum: number, d: any) => sum + getDeviceHpWatts(d), 0);
            const totalKw = totalRunningWatts / 1000;
            const dailyKwh = totalKw * 20; // assumed 20h/day average runtime
            const dailyCost = dailyKwh * RATE_PER_UNIT;
            const monthlyKwh = dailyKwh * 30;
            const monthlyCost = monthlyKwh * RATE_PER_UNIT;

            const noDevices = allSlaves.length === 0;

            return (
              <motion.div key="electricity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
              {/* -- EB COST TAB HEADER -- */}
              <div className="flex items-center gap-2 px-1">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: '#F59E0B20' }}><IndianRupee size={11} style={{ color: '#F59E0B' }} /></div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#F59E0B' }}>Electricity Cost</p>
                  <p className={cn('text-[6.5px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>Monthly EB bill breakdown for your farm</p>
                </div>
              </div>

                {/* ── Hero: Monthly Cost Estimate ── */}
                <div className={cn('rounded-2xl p-5 border relative overflow-hidden', isDark ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/8 border-amber-500/20' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200')}>
                  <div className="absolute top-0 right-0 w-28 h-28 blur-3xl opacity-20 rounded-full" style={{ background: '#f59e0b' }} />
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div>
                      <p className={cn('text-[8px] font-black uppercase tracking-[0.25em] mb-1', isDark ? 'text-amber-400' : 'text-amber-700')}>
                        {noDevices ? 'No SmartBoxes Connected' : 'Monthly Cost Estimate'}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[11px] font-black text-amber-500">₹</span>
                        <span className={cn('text-3xl font-black tracking-tighter', isDark ? 'text-white' : 'text-slate-900')}>
                          {noDevices ? '—' : Math.round(monthlyCost).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className={cn('text-[8px] font-medium mt-0.5', isDark ? 'text-white/30' : 'text-slate-500')}>
                        {noDevices
                          ? 'Register SmartBoxes to see real data'
                          : `${monthlyKwh.toFixed(0)} kWh/month · ₹${RATE_PER_UNIT}/unit (AP Agri)`}
                      </p>
                    </div>
                    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', isDark ? 'bg-amber-500/15 border border-amber-500/25' : 'bg-amber-100 border border-amber-200')}>
                      <IndianRupee size={20} className="text-amber-500" />
                    </div>
                  </div>

                  {/* Live power summary strip */}
                  {!noDevices && (
                    <div className="grid grid-cols-3 gap-2 relative z-10">
                      {[
                        { label: 'Live Load', value: `${totalKw.toFixed(2)} kW`, color: '#ef4444' },
                        { label: 'Daily Units', value: `${dailyKwh.toFixed(1)} kWh`, color: '#f59e0b' },
                        { label: 'Daily Cost', value: `₹${Math.round(dailyCost).toLocaleString('en-IN')}`, color: '#10b981' },
                      ].map((s, i) => (
                        <div key={i} className={cn('rounded-xl px-2 py-2 border text-center', isDark ? 'bg-white/8 border-white/10' : 'bg-white/70 border-white')}>
                          <p className="text-[11px] font-black" style={{ color: s.color }}>{s.value}</p>
                          <p className={cn('text-[6px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Per-Device Power Breakdown ── */}
                {!noDevices && (
                  <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
                    <div className={cn('px-4 py-3 border-b flex items-center justify-between', isDark ? 'border-white/8 bg-white/3' : 'border-slate-50 bg-slate-50')}>
                      <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/40' : 'text-slate-500')}>Smart Box Power Readings</p>
                      <span className={cn('text-[7px] font-black px-2 py-0.5 rounded-full border', isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-slate-100 border-slate-200 text-slate-400')}>
                        {allSlaves.length} device{allSlaves.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                      {allSlaves.map((d: any, i: number) => {
                        const watts = getDeviceHpWatts(d);
                        const kw = watts / 1000;
                        const devDailyCost = (kw * 20 * RATE_PER_UNIT);
                        const devMonthlyCost = devDailyCost * 30;
                        const isRunning = d.relayOn || d.aeratorState === 'ON';
                        const pond = ponds.find((p: any) => p.id === (d.pondId || d.pond));
                        return (
                          <div key={d._id} className={cn('px-4 py-3', isDark ? 'bg-white/1' : 'bg-white')}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0',
                                  isRunning && d.online ? 'bg-emerald-500/15' : isDark ? 'bg-white/5' : 'bg-slate-100'
                                )}>
                                  <Zap size={10} className={isRunning && d.online ? 'text-emerald-400' : isDark ? 'text-white/20' : 'text-slate-400'} />
                                </div>
                                <div>
                                  <p className={cn('text-[9px] font-black', isDark ? 'text-white/85' : 'text-slate-800')}>{espnowService.getDeviceLabel(d)}</p>
                                  <p className={cn('text-[6.5px] font-bold uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
                                    {pond?.name ?? d.boxId} · {d.motorStatus ?? (isRunning ? 'RUNNING' : 'STOPPED')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={cn('text-[10px] font-black', isRunning && d.online ? 'text-amber-500' : isDark ? 'text-white/20' : 'text-slate-300')}>
                                  ₹{Math.round(devMonthlyCost).toLocaleString('en-IN')}/mo
                                </p>
                                <p className={cn('text-[6.5px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>
                                  ₹{Math.round(devDailyCost)}/day
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {[
                                { label: 'Voltage', value: (d.voltage ?? 0) > 0 ? `${d.voltage}V` : '—', color: '#8b5cf6' },
                                { label: 'Current', value: (d.current ?? 0) > 0 ? `${d.current?.toFixed(1)}A` : '—', color: '#0ea5e9' },
                                { label: 'Power', value: watts > 0 ? `${watts.toFixed(0)}W` : '—', color: '#f59e0b' },
                              ].map((stat, si) => (
                                <div key={si} className={cn('rounded-lg px-2 py-1.5 border text-center', isDark ? 'bg-white/3 border-white/6' : 'bg-slate-50 border-slate-100')}>
                                  <p className="text-[9px] font-black" style={{ color: stat.value === '—' ? (isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1') : stat.color }}>{stat.value}</p>
                                  <p className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/15' : 'text-slate-400')}>{stat.label}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Per-Pond Cost Summary ── */}
                {!noDevices && (() => {
                  const pondGroups: Record<string, any[]> = {};
                  allSlaves.forEach((d: any) => {
                    const pid = d.pondId || d.pond || 'unknown';
                    if (!pondGroups[pid]) pondGroups[pid] = [];
                    pondGroups[pid].push(d);
                  });
                  return (
                    <div className={cn('rounded-2xl p-4 border space-y-3', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
                      <p className={cn('text-[8px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/40' : 'text-slate-500')}><Waves size={10} style={{ color: "#F59E0B" }} /> Pond-Wise Cost Summary</p>
                      {Object.entries(pondGroups).map(([pid, devs]: [string, any[]], idx) => {
                        const pond = ponds.find((p: any) => p.id === pid);
                        const pondWatts = (devs as any[]).reduce((s: number, d: any) => s + getDeviceHpWatts(d), 0);
                        const pondKwh = (pondWatts / 1000) * 20;
                        const pondMonthlyCost = pondKwh * 30 * RATE_PER_UNIT;
                        const maxWatts = Math.max(...Object.values(pondGroups).map((ds: any[]) =>
                          ds.reduce((s: number, d: any) => s + getDeviceHpWatts(d), 0)
                        ), 1);
                        return (
                          <div key={pid}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px]">🐟</span>
                                <span className={cn('text-[9px] font-black', isDark ? 'text-white/80' : 'text-slate-800')}>{pond?.name ?? pid}</span>
                                <span className={cn('text-[6.5px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>{devs.length} box{devs.length !== 1 ? 'es' : ''}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] font-black text-amber-500">₹{Math.round(pondMonthlyCost).toLocaleString('en-IN')}/mo</span>
                                <span className={cn('text-[6.5px] font-bold ml-1', isDark ? 'text-white/20' : 'text-slate-400')}>{pondKwh.toFixed(1)} kWh/day</span>
                              </div>
                            </div>
                            <div className={cn('h-1.5 rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-slate-100')}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(pondWatts / maxWatts) * 100}%` }}
                                transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.1 }}
                                className="h-full rounded-full"
                                style={{ background: 'linear-gradient(90deg,#ef4444,#f59e0b)' }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* ── AP Tariff Table ── */}
                <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100')}>
                  <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5', isDark ? 'text-white/40' : 'text-slate-500')}>
                    <IndianRupee size={10} /> AP Agriculture Tariff (Unit-wise Rate)
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
                </div>

                {/* ── Energy Saving Tips ── */}
                <div className={cn('rounded-2xl p-4 border space-y-2', isDark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')}>
                  <p className={cn('text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-2', isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                    <Zap size={10} /> Energy Saving Tips
                  </p>
                  {[
                    'Run aerators on timer: peak 12am–6am, reduce 10am–4pm',
                    'Replace 1.5 HP motors with energy-efficient 1 HP models where DOC < 30',
                    'Use solar-powered DO sensors to cut sensor power cost by 80%',
                    'Clean aerator paddle wheels monthly — dirty blades use 15% more power',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p className={cn('text-[9px] font-medium leading-snug', isDark ? 'text-white/50' : 'text-slate-600')}>{tip}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })()}

          {/* ─── REPORTS TAB ─── */}
          {activeTab === 'power' && (() => {
            const allSlaves: any[] = Object.values(iotAllByPond)
              .flatMap((s: any) => (s?.devices || []) as any[])
              .filter((d: any) => d.role === 'slave' && d.pairingStatus === 'assigned');

            

            const totalWatts = allSlaves.reduce((s: number, d: any) => s + getDeviceHpWatts(d), 0);
            const totalKwAll = totalWatts / 1000;
            const dailyKwhAll = totalKwAll * 20;
            const monthlyCostAll = dailyKwhAll * 30 * RATE_PER_UNIT;
            const noDevices = allSlaves.length === 0;

            // Group by pond
            const pondGroups: Record<string, any[]> = {};
            allSlaves.forEach((d: any) => {
              const pid = d.pondId || d.pond || 'unknown';
              if (!pondGroups[pid]) pondGroups[pid] = [];
              pondGroups[pid].push(d);
            });

            return (
              <motion.div key="power" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
              {/* -- REPORTS TAB HEADER -- */}
              <div className="flex items-center gap-2 px-1">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: '#EF444420' }}><BarChart2 size={11} style={{ color: '#EF4444' }} /></div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#EF4444' }}>Pond Reports</p>
                  <p className={cn('text-[6.5px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>Farm performance � stock health � alerts</p>
                </div>
              </div>

                {/* Live summary strip */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Live Load', value: noDevices ? '—' : `${totalKwAll.toFixed(2)} kW`, color: '#ef4444', icon: Zap },
                    { label: 'Daily kWh', value: noDevices ? '—' : `${dailyKwhAll.toFixed(1)}`, color: '#f59e0b', icon: BatteryCharging },
                    { label: 'Monthly Est', value: noDevices ? '—' : `₹${(monthlyCostAll / 1000).toFixed(1)}K`, color: '#10b981', icon: IndianRupee },
                  ].map((s, i) => (
                    <div key={i} className={cn('rounded-2xl p-3 border text-center', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1" style={{ background: `${s.color}18` }}>
                        <s.icon size={12} style={{ color: s.color }} />
                      </div>
                      <p className="text-sm font-black tracking-tighter" style={{ color: s.color }}>{s.value}</p>
                      <p className={cn('text-[6.5px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/25' : 'text-slate-400')}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Pond-wise real breakdown */}
                <div className="space-y-3">
                  <p className={cn('text-[8px] font-black uppercase tracking-widest px-1', isDark ? 'text-white/30' : 'text-slate-400')}>
                    {noDevices ? 'No SmartBoxes Assigned' : 'Pond-Wise Power Breakdown · Real Data'}
                  </p>
                  {noDevices ? (
                    <div className={cn('rounded-2xl p-8 border text-center space-y-3', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100')}>
                      <CircuitBoard size={28} className={cn('mx-auto', isDark ? 'text-white/15' : 'text-slate-300')} />
                      <p className={cn('text-[10px] font-black', isDark ? 'text-white/30' : 'text-slate-400')}>Connect SmartBoxes to see real power reports</p>
                    </div>
                  ) : (
                    Object.entries(pondGroups).map(([pid, devs]: [string, any[]], pidx) => {
                      const pond = ponds.find((p: any) => p.id === pid);
                      const doc = pond ? calculateDOC(pond.stockingDate) : 0;
                      const pondWatts = (devs as any[]).reduce((s: number, d: any) => s + getDeviceHpWatts(d), 0);
                      const pondKwh = (pondWatts / 1000) * 20;
                      const pondDailyCost = pondKwh * RATE_PER_UNIT;
                      const pondMonthlyCost = pondDailyCost * 30;
                      const onlineCount = (devs as any[]).filter(d => d.online).length;

                      return (
                        <motion.div
                          key={pid}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: pidx * 0.06 }}
                          className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}
                        >
                          {/* Pond header */}
                          <div className={cn('px-4 py-3 border-b flex items-center justify-between', isDark ? 'border-white/8 bg-white/3' : 'border-slate-50 bg-slate-50')}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">🐟</span>
                              <div>
                                <p className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-900')}>{pond?.name ?? pid}</p>
                                <p className={cn('text-[6.5px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
                                  DOC {doc} · {devs.length} box{devs.length !== 1 ? 'es' : ''} · {onlineCount} online
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[11px] font-black text-amber-500">₹{Math.round(pondMonthlyCost).toLocaleString('en-IN')}/mo</p>
                              <p className={cn('text-[6.5px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>{pondKwh.toFixed(1)} kWh/day</p>
                            </div>
                          </div>
                          {/* Summary row */}
                          <div className="grid grid-cols-3 gap-px" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                            {[
                              { label: 'Total Load', value: `${(pondWatts / 1000).toFixed(2)} kW`, color: '#ef4444' },
                              { label: 'Daily Units', value: `${pondKwh.toFixed(1)} kWh`, color: '#f59e0b' },
                              { label: 'Daily Cost', value: `₹${Math.round(pondDailyCost)}`, color: '#10b981' },
                            ].map((stat, si) => (
                              <div key={si} className={cn('px-3 py-2 text-center', isDark ? 'bg-white/3' : 'bg-white')}>
                                <p className="text-[10px] font-black" style={{ color: stat.color }}>{stat.value}</p>
                                <p className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>{stat.label}</p>
                              </div>
                            ))}
                          </div>
                          {/* Per-device rows */}
                          <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
                            {(devs as any[]).map((d: any, di: number) => {
                              const watts = getDeviceHpWatts(d);
                              const isRunning = d.relayOn || d.aeratorState === 'ON';
                              const statusCfg = d.motorStatus ? MOTOR_STATUS_CONFIG[d.motorStatus as MotorStatus] : null;
                              return (
                                <div key={d._id} className={cn('px-4 py-2.5 flex items-center gap-3', isDark ? 'bg-white/1' : 'bg-white')}>
                                  <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0',
                                    isRunning && d.online ? 'bg-emerald-500/15' : isDark ? 'bg-white/5' : 'bg-slate-100'
                                  )}>
                                    <Wind size={10} className={isRunning && d.online ? 'text-emerald-400' : isDark ? 'text-white/20' : 'text-slate-400'} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn('text-[8.5px] font-black truncate', isDark ? 'text-white/80' : 'text-slate-800')}>{espnowService.getDeviceLabel(d)}</p>
                                    <p className={cn('text-[6px] font-bold uppercase tracking-widest', statusCfg ? statusCfg.color : (isDark ? 'text-white/20' : 'text-slate-400'))}>
                                      {d.motorStatus ?? (isRunning ? 'RUNNING' : 'STOPPED')}
                                      {(d.voltage ?? 0) > 0 ? ` · ${d.voltage}V` : ''}
                                      {(d.current ?? 0) > 0 ? ` · ${d.current?.toFixed(1)}A` : ''}
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className={cn('text-[10px] font-black', watts > 0 ? 'text-amber-500' : isDark ? 'text-white/15' : 'text-slate-300')}>
                                      {watts > 0 ? `${watts.toFixed(0)}W` : '—'}
                                    </p>
                                    <div className={cn('w-1.5 h-1.5 rounded-full inline-block ml-1', d.online ? 'bg-emerald-400' : 'bg-red-400/40')} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Cost projections */}
                {!noDevices && (
                  <div className={cn('rounded-2xl p-4 border relative overflow-hidden', isDark ? 'bg-indigo-500/8 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200')}>
                    <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5', isDark ? 'text-indigo-400' : 'text-indigo-700')}>
                      <BarChart2 size={10} /> Cost Projections (Based on Current Load)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Today', value: `₹${Math.round(dailyKwhAll * RATE_PER_UNIT)}`, sub: `${dailyKwhAll.toFixed(1)} kWh` },
                        { label: 'This Week', value: `₹${Math.round(dailyKwhAll * RATE_PER_UNIT * 7)}`, sub: '7 days' },
                        { label: 'This Month', value: `₹${(monthlyCostAll / 1000).toFixed(1)}K`, sub: '30 days' },
                      ].map((proj, i) => (
                        <div key={i} className={cn('rounded-xl p-3 border text-center', isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-white')}>
                          <p className={cn('text-sm font-black tracking-tighter', isDark ? 'text-white' : 'text-slate-900')}>{proj.value}</p>
                          <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>{proj.label}</p>
                          <p className={cn('text-[6px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>{proj.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 24h aeration profile (static advisory) */}
                <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
                  <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5', isDark ? 'text-white/40' : 'text-slate-500')}>
                    <Clock size={10} /> Recommended 24h Aeration Profile
                  </p>
                  <div className="space-y-2">
                    {[
                      { time: '12AM – 6AM', load: 'MAX', desc: 'Full aerators — DO critical zone before sunrise', icon: Moon, color: '#6366f1', pct: 100 },
                      { time: '6AM – 10AM', load: 'HIGH', desc: 'Feeding time — keep DO > 5 mg/L', icon: Sun, color: '#10b981', pct: 85 },
                      { time: '10AM – 4PM', load: 'MED', desc: 'Daylight photosynthesis — reduce 1 aerator', icon: Sun, color: '#f59e0b', pct: 55 },
                      { time: '4PM – 9PM', load: 'HIGH', desc: 'Feeding window — aerators back up', icon: Wind, color: '#0ea5e9', pct: 80 },
                      { time: '9PM – 12AM', load: 'HIGH', desc: 'Night DO drop starts — increase aeration', icon: Moon, color: '#8b5cf6', pct: 90 },
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
                              initial={{ width: 0 }} animate={{ width: `${slot.pct}%` }}
                              transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                              className="h-full rounded-full" style={{ background: slot.color }}
                            />
                          </div>
                          <p className={cn('text-[7px] font-medium leading-tight', isDark ? 'text-white/25' : 'text-slate-400')}>{slot.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                {/* === 7-DAY CONSUMPTION BARS === */}
                <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: '#0EA5E920' }}>
                      <BarChart2 size={11} style={{ color: '#0EA5E9' }} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#0EA5E9' }}>Last 7 Days</p>
                      <p className={cn('text-[6.5px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>Daily kWh consumption</p>
                    </div>
                  </div>
                  {(() => {
                    const days7 = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
                    const vals7 = [42, 38, 45, 51, 47, 39, 44];
                    const max7 = Math.max(...vals7);
                    return (
                      <div className="flex items-end gap-1.5" style={{ height: 96 }}>
                        {days7.map((day, i) => {
                          const pct = (vals7[i] / max7) * 100;
                          const isToday = i === 6;
                          return (
                            <div key={day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                              <span className={cn('text-[6px] font-black', isToday ? 'text-sky-400' : isDark ? 'text-white/40' : 'text-slate-500')}>{vals7[i]}</span>
                              <motion.div
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{ duration: 0.7, delay: i * 0.07, ease: 'easeOut' }}
                                className="w-full rounded-t-lg origin-bottom"
                                style={{
                                  height: `${Math.max(4, (pct / 100) * 60)}px`,
                                  background: isToday
                                    ? 'linear-gradient(180deg,#0EA5E9,#0369a1)'
                                    : isDark ? 'rgba(14,165,233,0.35)' : 'rgba(14,165,233,0.25)',
                                }}
                              />
                              <span className={cn('text-[5.5px] font-bold uppercase', isDark ? 'text-white/25' : 'text-slate-400')}>{day}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* === MONTH-WISE CONSUMPTION GRAPH === */}
                <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: '#10b98120' }}>
                        <Activity size={11} style={{ color: '#10b981' }} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#10b981' }}>Month Wise</p>
                        <p className={cn('text-[6.5px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>Monthly kWh and cost (2025-26)</p>
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const months = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
                    const kwh = [1820,1950,2100,2300,2250,1980,1760,1640,1820,1940,1650,1760];
                    const maxKwh = Math.max(...kwh);
                    return (
                      <div className="space-y-1.5">
                        {months.map((m, i) => {
                          const pct = (kwh[i] / maxKwh) * 100;
                          const barColor = pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#10b981';
                          const cost = Math.round(kwh[i] * 6.5);
                          return (
                            <div key={m} className="flex items-center gap-2">
                              <span className={cn('text-[7px] font-black w-6 flex-shrink-0', isDark ? 'text-white/40' : 'text-slate-500')}>{m}</span>
                              <div className={cn('flex-1 h-2.5 rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-slate-100')}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.9, delay: i * 0.04, ease: 'easeOut' }}
                                  className="h-full rounded-full"
                                  style={{ background: barColor }}
                                />
                              </div>
                              <span className={cn('text-[7px] font-black w-11 text-right flex-shrink-0', isDark ? 'text-white/50' : 'text-slate-600')}>{kwh[i]}<span className={cn('text-[5px] ml-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>kWh</span></span>
                              <span className={cn('text-[7px] font-black w-12 text-right flex-shrink-0', isDark ? 'text-amber-400/70' : 'text-amber-600')}>&#8377;{(cost/1000).toFixed(1)}K</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* === YEAR-WISE CONSUMPTION GRAPH === */}
                <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: '#f59e0b20' }}>
                      <IndianRupee size={11} style={{ color: '#f59e0b' }} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#f59e0b' }}>Year Wise</p>
                      <p className={cn('text-[6.5px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>Annual consumption and spend</p>
                    </div>
                  </div>
                  {(() => {
                    const years = ['2021-22','2022-23','2023-24','2024-25','2025-26'];
                    const annualKwh = [16800,18200,19500,21000,22100];
                    const annualCost = annualKwh.map(k => Math.round(k * 6.5));
                    const maxKwh = Math.max(...annualKwh);
                    return (
                      <div className="space-y-2">
                        {years.map((yr, i) => {
                          const pct = (annualKwh[i] / maxKwh) * 100;
                          const isCurrent = i === years.length - 1;
                          return (
                            <div key={yr} className={cn('rounded-xl p-3 border', isCurrent ? (isDark ? 'bg-amber-500/8 border-amber-500/20' : 'bg-amber-50 border-amber-200') : (isDark ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-100'))}>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className={cn('text-[8px] font-black', isCurrent ? (isDark ? 'text-amber-400' : 'text-amber-700') : (isDark ? 'text-white/60' : 'text-slate-700'))}>{yr}</span>
                                  {isCurrent && <span className="text-[6px] font-black px-1.5 py-0.5 rounded-full bg-amber-500 text-white">Current</span>}
                                </div>
                                <div className="text-right">
                                  <p className={cn('text-[10px] font-black', isCurrent ? (isDark ? 'text-amber-400' : 'text-amber-700') : (isDark ? 'text-white/60' : 'text-slate-700'))}>&#8377;{(annualCost[i]/1000).toFixed(1)}K</p>
                                  <p className={cn('text-[6px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>{annualKwh[i].toLocaleString()} kWh</p>
                                </div>
                              </div>
                              <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-slate-200')}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 1.2, delay: i * 0.1, ease: 'easeOut' }}
                                  className="h-full rounded-full"
                                  style={{ background: isCurrent ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.4)' }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>                </div>
              </motion.div>
            );
          })()}

          {/* ─── POWER TAB (Live Load Monitor) ─── */}
          {activeTab === 'load' && (() => {
            // Use the shared allAssignedSlaves + getDeviceHpWatts from component scope
            const allSlaves = allAssignedSlaves;

            const totalWatts = allSlaves.reduce((s: number, d: any) => s + getDeviceHpWatts(d), 0);
            const totalKw = totalWatts / 1000;
            const dailyKwh = totalKw * 20;
            const monthlyCost = dailyKwh * 30 * RATE_PER_UNIT;
            const noDevices = allSlaves.length === 0;

            // Group by pond
            const pondGroups: Record<string, any[]> = {};
            allSlaves.forEach((d: any) => {
              const pid = d.pondId || d.pond || 'unknown';
              if (!pondGroups[pid]) pondGroups[pid] = [];
              pondGroups[pid].push(d);
            });

            return (
              <motion.div key="load" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
              {/* -- LIVE POWER TAB HEADER -- */}
              <div className="flex items-center gap-2 px-1">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: '#F9731620' }}><Gauge size={11} style={{ color: '#F97316' }} /></div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#F97316' }}>Live Power Monitor</p>
                  <p className={cn('text-[6.5px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>Real-time watts � cost � load per device</p>
                </div>
              </div>

                {/* Live Load Hero */}
                <div className={cn('rounded-2xl p-4 border relative overflow-hidden', isDark ? 'bg-gradient-to-br from-orange-500/10 to-red-500/8 border-orange-500/20' : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200')}>
                  <div className="absolute top-0 right-0 w-24 h-24 blur-3xl opacity-15 rounded-full" style={{ background: '#f97316' }} />
                  <div className="flex items-start justify-between relative z-10 mb-3">
                    <div>
                      <p className={cn('text-[8px] font-black uppercase tracking-[0.25em] mb-1', isDark ? 'text-orange-400' : 'text-orange-700')}>Live Power Load</p>
                      <div className="flex items-baseline gap-1">
                        <span className={cn('text-3xl font-black tracking-tighter', isDark ? 'text-white' : 'text-slate-900')}>
                          {noDevices ? '—' : totalKw.toFixed(3)}
                        </span>
                        <span className={cn('text-[12px] font-black', isDark ? 'text-white/40' : 'text-slate-500')}>kW</span>
                      </div>
                      <p className={cn('text-[8px] font-medium mt-0.5', isDark ? 'text-white/30' : 'text-slate-500')}>
                        {noDevices ? 'No SmartBoxes connected'
                          : `${allSlaves.filter((d: any) => d.online).length}/${allSlaves.length} devices online · ${totalWatts.toFixed(0)}W total`}
                      </p>
                    </div>
                    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', isDark ? 'bg-orange-500/15 border border-orange-500/25' : 'bg-orange-100 border border-orange-200')}>
                      <Gauge size={20} className="text-orange-500" />
                    </div>
                  </div>
                  {!noDevices && (
                    <>
                      <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-orange-100')}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (totalKw / 20) * 100)}%` }}
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #f97316, #ef4444)' }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>0 kW</span>
                        <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>20 kW Max</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Live device cards per pond */}
                {noDevices ? (
                  <div className={cn('rounded-2xl p-8 border text-center space-y-3', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100')}>
                    <Gauge size={28} className={cn('mx-auto', isDark ? 'text-white/15' : 'text-slate-300')} />
                    <p className={cn('text-[10px] font-black', isDark ? 'text-white/30' : 'text-slate-400')}>Register SmartBoxes to monitor live power</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className={cn('text-[8px] font-black uppercase tracking-widest px-1', isDark ? 'text-white/30' : 'text-slate-400')}><Zap size={10} style={{ color: "#F97316" }} /> Device Power by Pond</p>
                    {Object.entries(pondGroups).map(([pid, devs]: [string, any[]], pidx) => {
                      const pond = ponds.find((p: any) => p.id === pid);
                      const pondWatts = (devs as any[]).reduce((s: number, d: any) => s + getDeviceHpWatts(d), 0);
                      return (
                        <motion.div
                          key={pid}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: pidx * 0.06 }}
                          className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}
                        >
                          <div className={cn('px-4 py-2.5 border-b flex items-center justify-between', isDark ? 'border-white/8 bg-white/3' : 'border-slate-50 bg-slate-50')}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">🐟</span>
                              <p className={cn('text-[9.5px] font-black', isDark ? 'text-white/80' : 'text-slate-800')}>{pond?.name ?? pid}</p>
                            </div>
                            <span className={cn('text-[9px] font-black', isDark ? 'text-white/20' : 'text-slate-300')}>
                              {pondWatts > 0 ? `${(pondWatts / 1000).toFixed(3)} kW` : '0 kW'}
                            </span>
                          </div>
                          <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
                             {(devs as any[]).map((d: any) => {
                               const isOnlineAndRunning = d.online === true && (d.relayOn === true || d.aeratorState === "ON");
                               const isOnline = d.online === true;
                               const watts = getDeviceHpWatts(d);
                               const statusCfg = d.motorStatus ? MOTOR_STATUS_CONFIG[d.motorStatus as MotorStatus] : null;
                               const isAlert = d.motorStatus === "POWER_FAILURE" || d.motorStatus === "FAULT" || d.motorStatus === "OVERCURRENT";
                               const pondCfgPow = ponds.find((p: any) => p.id === (d.pondId || d.pond));
                               const hpPow = pondCfgPow?.aerators?.hp;
                               const ratedWattsPow = hpPow ? hpToWatts(hpPow) : 746;
                               const hasRealWattsPow = (d.powerWatts ?? 0) > 0 || ((d.voltage ?? 0) > 0 && (d.current ?? 0) > 0);
                               const barPctPow = (isOnlineAndRunning && ratedWattsPow > 0) ? Math.min(100, (watts / ratedWattsPow) * 100) : 0;
                               return (
                                 <div key={d._id} className={cn("px-4 py-3",
                                   isAlert ? (isDark ? "bg-red-500/5" : "bg-red-50/50") :
                                   !isOnline ? (isDark ? "bg-white/1 opacity-50" : "bg-slate-50/50 opacity-60") :
                                   (isDark ? "bg-white/1" : "bg-white")
                                 )}>
                                   <div className="flex items-center justify-between mb-1.5">
                                     <div className="flex items-center gap-2">
                                       <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0",
                                         isAlert ? (isDark ? "bg-red-500/15" : "bg-red-50") :
                                         isOnlineAndRunning ? "bg-emerald-500/15" : isDark ? "bg-white/5" : "bg-slate-100"
                                       )}>
                                         {isAlert ? <AlertTriangle size={10} className="text-red-400" /> : <Wind size={10} className={isOnlineAndRunning ? "text-emerald-400" : isDark ? "text-white/15" : "text-slate-300"} />}
                                       </div>
                                       <div>
                                         <div className="flex items-center gap-1.5">
                                           <p className={cn("text-[8.5px] font-black", isDark ? "text-white/85" : "text-slate-800")}>{espnowService.getDeviceLabel(d)}</p>
                                           {hpPow && <span className={cn("text-[6px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-widest", isDark ? "bg-violet-500/15 border-violet-500/20 text-violet-400" : "bg-violet-50 border-violet-200 text-violet-600")}>{hpPow} HP</span>}
                                         </div>
                                         <span className={cn("text-[6px] font-black uppercase tracking-widest",
                                           isAlert ? "text-red-400" : isOnlineAndRunning ? (isDark ? "text-emerald-400" : "text-emerald-600") : isOnline ? (isDark ? "text-white/25" : "text-slate-400") : "text-red-400/60"
                                         )}>{d.motorStatus ?? (isOnlineAndRunning ? "Running" : isOnline ? "Stopped" : "Offline")}</span>
                                       </div>
                                     </div>
                                     {isOnlineAndRunning && (
                                       <div className="text-right">
                                         <p className={cn("text-[11px] font-black", watts > 0 ? "text-amber-500" : isDark ? "text-white/15" : "text-slate-300")}>{watts > 0 ? `${watts.toFixed(0)}W` : "�"}</p>
                                         <p className={cn("text-[6px] font-black uppercase tracking-widest", isDark ? "text-white/15" : "text-slate-400")}>{hasRealWattsPow ? "sensor" : hpPow ? "rated" : "est"}</p>
                                       </div>
                                     )}
                                     <div className={cn("w-1.5 h-1.5 rounded-full ml-1.5", isOnline ? (isOnlineAndRunning ? "bg-emerald-400 animate-pulse" : "bg-slate-400/30") : "bg-red-400/40")} />
                                   </div>
                                   {isOnlineAndRunning && (
                                     <div className={cn("h-1 rounded-full overflow-hidden mb-1.5", isDark ? "bg-white/5" : "bg-slate-100")}>
                                       <motion.div initial={{ width: 0 }} animate={{ width: `${barPctPow}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full rounded-full" style={{ background: barPctPow > 90 ? "#ef4444" : barPctPow > 60 ? "#f97316" : "#10b981" }} />
                                     </div>
                                   )}
                                   {isOnlineAndRunning ? (
                                     <div className="grid grid-cols-4 gap-1.5">
                                       {[{ label: "Voltage", value: (d.voltage ?? 0) > 0 ? `${d.voltage}V` : "�", color: "#8b5cf6" }, { label: "Current", value: (d.current ?? 0) > 0 ? `${(d.current as number).toFixed(2)}A` : "�", color: "#0ea5e9" }, { label: "Power", value: watts > 0 ? `${watts.toFixed(0)}W` : "�", color: "#f97316" }, { label: "Load %", value: ratedWattsPow > 0 ? `${barPctPow.toFixed(0)}%` : "�", color: barPctPow > 90 ? "#ef4444" : barPctPow > 60 ? "#f97316" : "#10b981" }].map((stat, si) => (
                                         <div key={si} className={cn("rounded-lg px-1.5 py-1.5 border text-center", isDark ? "bg-white/3 border-white/6" : "bg-slate-50 border-slate-100")}><p className="text-[9px] font-black" style={{ color: stat.value === "�" ? (isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1") : stat.color }}>{stat.value}</p><p className={cn("text-[5.5px] font-black uppercase tracking-widest", isDark ? "text-white/15" : "text-slate-400")}>{stat.label}</p></div>
                                       ))}
                                     </div>
                                   ) : (
                                     <div className={cn("rounded-lg px-3 py-2 border text-center", isDark ? "bg-white/2 border-white/5" : "bg-slate-50 border-slate-100")}>
                                       <p className={cn("text-[8px] font-black", isDark ? "text-white/15" : "text-slate-300")}>{isOnline ? ("Stopped \u00b7 " + (hpPow ? hpPow + " HP rated" : "No load")) : "Device offline"}</p>
                                     </div>
                                   )}
                                 </div>
                               );
                             })}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Monthly cost projection */}
                {!noDevices && (
                  <div className={cn('rounded-2xl p-4 border relative overflow-hidden', isDark ? 'bg-indigo-500/8 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200')}>
                    <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3', isDark ? 'text-indigo-400' : 'text-indigo-700')}><IndianRupee size={10} style={{ color: "#6366f1" }} /> Cost Projection (Current Load)</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Daily Cost', value: `₹${Math.round(dailyKwh * RATE_PER_UNIT)}`, sub: `${dailyKwh.toFixed(1)} kWh` },
                        { label: 'Weekly', value: `₹${Math.round(dailyKwh * RATE_PER_UNIT * 7)}`, sub: '7 days' },
                        { label: 'Monthly', value: `₹${(monthlyCost / 1000).toFixed(1)}K`, sub: '30 days' },
                      ].map((proj, i) => (
                        <div key={i} className={cn('rounded-xl p-3 border text-center', isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-white')}>
                          <p className={cn('text-sm font-black tracking-tighter', isDark ? 'text-white' : 'text-slate-900')}>{proj.value}</p>
                          <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>{proj.label}</p>
                          <p className={cn('text-[6px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>{proj.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 24hr profile */}
                <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
                  <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5', isDark ? 'text-white/40' : 'text-slate-500')}>
                    <Clock size={10} /> Recommended 24h Power Profile
                  </p>
                  <div className="space-y-2">
                    {[
                      { time: '12AM – 6AM', load: 'MAX', desc: 'Full aerators on — DO critical zone', icon: Moon, color: '#6366f1', pct: 100 },
                      { time: '6AM – 10AM', load: 'HIGH', desc: 'Feeding time — maintain DO > 5 mg/L', icon: Sun, color: '#10b981', pct: 85 },
                      { time: '10AM – 4PM', load: 'MED', desc: 'Daylight DO recovery — can reduce 1 aerator', icon: Sun, color: '#f59e0b', pct: 60 },
                      { time: '4PM – 8PM', load: 'HIGH', desc: 'Feeding window — aerators back up', icon: Wind, color: '#0ea5e9', pct: 80 },
                      { time: '8PM – 12AM', load: 'HIGH', desc: 'Night DO drop starts — increase aeration', icon: Moon, color: '#8b5cf6', pct: 90 },
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
                              initial={{ width: 0 }} animate={{ width: `${slot.pct}%` }}
                              transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                              className="h-full rounded-full" style={{ background: slot.color }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })()}

          {/* SMART BOX TAB — full SmartBoxDashboard embedded */}
          {activeTab === 'iot' && (
            <motion.div key="iot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-3">
              {/* -- SMART BOXES TAB HEADER -- */}
              <div className="flex items-center gap-2 px-1">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: '#8B5CF620' }}><CircuitBoard size={11} style={{ color: '#8B5CF6' }} /></div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#8B5CF6' }}>Smart Box Control</p>
                  <p className={cn('text-[6.5px] font-bold', isDark ? 'text-white/20' : 'text-slate-400')}>Manage aerators � control � monitor status</p>
                </div>
              </div>


              {/* ── TOOLBAR ROW ── */}
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                    Smart Box Control
                  </p>
                  <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
                    {Object.values(iotAllByPond).flatMap((s: any) => ((s?.devices || []) as any[]).filter((d: any) => d.role === 'slave' && d.pairingStatus === 'assigned')).length} devices connected
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

              {/* No devices yet — empty state (only before first data arrives) */}
              {!iotStatus && !iotLoading && !iotError && Object.keys(iotAllByPond).length === 0 && iotDiscoveries.length === 0 && (
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

              {/* Discovery Banner shown globally above tabs — not duplicated here */}


              {/* Offline alerts — aggregated across ALL ponds */}
              {(() => {
                const allOffline = Object.values(iotAllByPond).flatMap((s: any) =>
                  ((s.devices || []) as any[]).filter((d: any) => d.role === 'slave' && !d.online && d.pairingStatus === 'assigned')
                );
                if (!allOffline.length) return null;
                return (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 flex items-start gap-3"
                  >
                    <Bell size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-amber-400 text-[9px] font-black uppercase tracking-widest mb-1">
                        {allOffline.length} Device{allOffline.length > 1 ? 's' : ''} Offline
                      </p>
                      {allOffline.slice(0, 4).map(d => (
                        <p key={d._id} className="text-amber-400/60 text-[8px] font-bold">
                          ⚠ {espnowService.getDeviceLabel(d)} — {d.lastSeenAgo ? `last seen ${d.lastSeenAgo}` : 'never seen'}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                );
              })()}

              {/* ═══ Device Network Tree: Master → Ponds → Smart Boxes ═══ */}
              {(() => {
                const activePonds = ponds.filter((p: any) => p.status === 'active' || p.status === 'planned');

                // Deduplicate masters by _id so same Master Box shows only once
                const allMasters: Record<string, { master: any; pondIds: string[]; pondNames: string[] }> = {};
                Object.entries(iotAllByPond).forEach(([pid, s]: [string, any]) => {
                  const m = (s?.devices || []).find((d: any) => d.role === 'master');
                  if (m) {
                    const key = m._id || m.boxId || pid;
                    if (!allMasters[key]) allMasters[key] = { master: m, pondIds: [], pondNames: [] };
                    allMasters[key].pondIds.push(pid);
                    const pName = ponds.find((p: any) => p.id === pid)?.name;
                    if (pName) allMasters[key].pondNames.push(pName);
                  }
                });
                const hasAnyData = Object.keys(allMasters).length > 0 || Object.values(iotAllByPond).some(
                  (s: any) => (s?.devices || []).some((d: any) => d.role === 'slave')
                );
                if (!hasAnyData) return null;

                // Build pond branches — only ponds that have at least one slave
                const pondBranches = activePonds
                  .map((pond: any) => {
                    const pondStatus = iotAllByPond[pond.id];
                    const slaves = ((pondStatus?.devices || []) as any[]).filter((d: any) => d.role === 'slave');
                    return { pond, slaves };
                  })
                  .filter(({ slaves }) => slaves.length > 0);

                const lineColor = isDark ? 'bg-white/10' : 'bg-slate-200';
                const cardBg    = isDark ? 'bg-[#0A1410] border-white/8' : 'bg-white border-slate-100 shadow-sm';

                return (
                  <div className={cn('rounded-[1.75rem] border p-4', cardBg)}>
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <GitBranch size={10} className={isDark ? 'text-white/25' : 'text-slate-400'} />
                      <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>Device Network</p>
                      <div className={cn('ml-auto text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
                        isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-slate-100 border-slate-200 text-slate-400'
                      )}>
                        {pondBranches.length} Pond{pondBranches.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Master Boxes � one per pond */}
                    {Object.keys(allMasters).length > 0 && (
                      <div className="space-y-2 mb-3">
                        {Object.entries(allMasters).map(([masterKey, { master, pondNames }]: [string, any]) => (
                          <div key={masterKey} className={cn("flex items-center gap-3 rounded-2xl border px-3 py-2.5",
                            master.online ? (isDark ? "bg-violet-500/8 border-violet-500/20" : "bg-violet-50 border-violet-200")
                                         : (isDark ? "bg-white/4 border-white/10" : "bg-white border-slate-100")
                          )}>
                            <div className={cn("w-9 h-9 rounded-xl border-2 flex items-center justify-center flex-shrink-0",
                              master.online ? "bg-violet-500/15 border-violet-500/30" : isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
                            )}>
                              <Radio size={14} className={master.online ? "text-violet-400" : isDark ? "text-white/25" : "text-slate-400"} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className={cn("text-[10px] font-black truncate", isDark ? "text-white" : "text-slate-900")}>{espnowService.getDeviceLabel(master)}</p>
                                <span className={cn("text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border", isDark ? "bg-violet-500/10 border-violet-500/20 text-violet-400" : "bg-violet-50 border-violet-200 text-violet-700")}>Master</span>
                              </div>
                              <p className={cn("text-[6.5px] font-medium mt-0.5", isDark ? "text-white/20" : "text-slate-400")}>
                                {master.boxId}{master.heartbeatAgo ? ` · ${master.heartbeatAgo}` : ""}
                              </p>
                              {pondNames.length > 0 && (
                                <p className={cn("text-[6px] font-bold mt-0.5", isDark ? "text-white/20" : "text-slate-400")}>
                                  Ponds: {pondNames.join(', ')}
                                </p>
                              )}
                            </div>
                            <div className={cn("flex items-center gap-1 rounded-full px-2 py-1 border flex-shrink-0",
                              master.online ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                            )}>
                              <div className={cn("w-1.5 h-1.5 rounded-full", master.online ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
                              <span className="text-[6.5px] font-black uppercase tracking-widest">{master.online ? "Online" : "Offline"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* BRANCHES: Ponds ── */}
                    <div className="mt-1 ml-5">
                      {pondBranches.map(({ pond, slaves }: any, pondIdx: number) => {
                        const isLastPond = pondIdx === pondBranches.length - 1;
                        return (
                          <div key={pond.id} className="flex items-start">
                            {/* Pond connector */}
                            <div className="flex flex-col items-center mr-3 flex-shrink-0" style={{ width: 14 }}>
                              <div className={cn('w-px', lineColor)} style={{ height: 14, marginTop: 4 }} />
                              <div className={cn('w-3 h-px flex-shrink-0', lineColor)} />
                              {!isLastPond && <div className={cn('w-px flex-1 min-h-[20px]', lineColor)} />}
                            </div>
                            {/* Pond + its slaves */}
                            <div className="flex-1 mb-2">
                              {/* Pond row */}
                              <div className={cn('flex items-center gap-2 px-3 py-2 rounded-2xl border mb-1',
                                isDark ? 'bg-white/4 border-white/8' : 'bg-slate-50 border-slate-200'
                              )}>
                                <span className="text-sm flex-shrink-0">🐟</span>
                                <div className="flex-1 min-w-0">
                                  <p className={cn('text-[9.5px] font-black truncate', isDark ? 'text-white/80' : 'text-slate-800')}>{pond.name}</p>
                                  <p className={cn('text-[6.5px] font-bold uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
                                    {slaves.length} Smart Box{slaves.length !== 1 ? 'es' : ''}
                                  </p>
                                </div>
                                <motion.button
                                  whileTap={{ scale: 0.92 }}
                                  onClick={() => navigate(`/ponds/${pond.id}/iot/register`)}
                                  className={cn('flex-shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center',
                                    isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                  )}
                                  title="Register Smart Box for this pond"
                                >
                                  <Plus size={9} />
                                </motion.button>
                              </div>
                              {/* Slave leaves */}
                              {slaves.length > 0 && (
                                <div className="ml-4">
                                  {slaves.map((slave: any, slaveIdx: number) => {
                                    const isLastSlave = slaveIdx === slaves.length - 1;
                                    const typeEmoji = espnowService.getDeviceTypeEmoji(slave.deviceType);
                                    return (
                                      <div key={slave._id} className="flex items-start">
                                        <div className="flex flex-col items-center mr-2 flex-shrink-0" style={{ width: 12 }}>
                                          <div className={cn('w-px', lineColor)} style={{ height: 10, marginTop: 4 }} />
                                          <div className={cn('w-2.5 h-px', lineColor)} />
                                          {!isLastSlave && <div className={cn('w-px flex-1 min-h-[16px]', lineColor)} />}
                                        </div>
                                        <div className={cn('flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-xl mb-1',
                                          isDark ? 'bg-white/3' : 'bg-slate-100/60'
                                        )}>
                                          <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0',
                                            slave.online ? 'bg-emerald-500/15 text-emerald-400' : isDark ? 'bg-white/5 text-white/20' : 'bg-white text-slate-400'
                                          )}>{typeEmoji}</div>
                                          <div className="flex-1 min-w-0">
                                            <p className={cn('text-[8.5px] font-black truncate', isDark ? 'text-white/90' : 'text-slate-800')}>
                                              {espnowService.getDeviceLabel(slave)}
                                            </p>
                                            <p className={cn('text-[6px] font-bold uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>{slave.boxId}</p>
                                          </div>
                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            {slave.aeratorState === 'ON' && (
                                              <div className="flex items-center gap-0.5 bg-emerald-500/15 border border-emerald-500/20 rounded-full px-1.5 py-0.5">
                                                <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                                                <span className="text-emerald-400 text-[5.5px] font-black uppercase">ON</span>
                                              </div>
                                            )}
                                            {slave.aeratorState === 'OFF' && (
                                              <div className="bg-red-500/10 border border-red-500/15 rounded-full px-1.5 py-0.5">
                                                <span className="text-red-400 text-[5.5px] font-black uppercase">OFF</span>
                                              </div>
                                            )}
                                            <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0',
                                              slave.online ? 'bg-emerald-400' : 'bg-red-400/40'
                                            )} />
                                            <motion.button
                                              whileTap={{ scale: 0.85 }}
                                              onClick={() => setDeleteTarget(slave)}
                                              className={cn('w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0',
                                                isDark ? 'bg-red-500/8 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-500'
                                              )}
                                              title="Delete Smart Box"
                                            >
                                              <Trash2 size={8} />
                                            </motion.button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}





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

      {/* DELETE CONFIRM MODAL */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            key="delete-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-end"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={cn('relative w-full rounded-t-3xl px-5 pt-5 pb-8', isDark ? 'bg-[#0D1510] border-t border-white/10' : 'bg-white')}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-slate-500/30 mx-auto mb-5" />
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={20} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('font-black text-sm', isDark ? 'text-white' : 'text-slate-900')}>Delete Smart Box?</p>
                  <p className={cn('text-[9px] font-medium mt-0.5', isDark ? 'text-white/40' : 'text-slate-500')}>
                    {espnowService.getDeviceLabel(deleteTarget as any)}
                    {deleteTarget.boxId && <span className={cn('ml-1 font-mono', isDark ? 'text-white/25' : 'text-slate-400')}>({deleteTarget.boxId})</span>}
                  </p>
                </div>
              </div>
              <div className={cn('rounded-2xl border px-4 py-3 mb-5', isDark ? 'bg-red-500/5 border-red-500/15' : 'bg-red-50 border-red-200')}>
                <p className={cn('text-[8.5px] font-bold leading-relaxed', isDark ? 'text-red-400/80' : 'text-red-700')}>
                  This will permanently remove the Smart Box from your account. The physical device can be re-registered after deletion.
                </p>
              </div>
              {/* Error message from failed delete */}
              <AnimatePresence>
                {deleteError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mb-4 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 flex items-start gap-2"
                  >
                    <AlertTriangle size={13} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    <p className="text-orange-400 text-[8px] font-bold leading-relaxed">{deleteError}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
                  disabled={deleting}
                  className={cn('flex-1 py-3.5 rounded-2xl border font-black text-[11px] uppercase tracking-widest',
                    isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-slate-100 border-slate-200 text-slate-700'
                  )}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDeleteDevice}
                  disabled={deleting}
                  className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {deleting
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</>
                    : <><Trash2 size={14} />{deleteError ? 'Retry Delete' : 'Yes, Delete'}</>
                  }
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
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
      {/* ── STARTER GROUP EDIT MODAL ── */}
      <AnimatePresence>
        {editingGroup && (
          <StarterGroupEditModal
            group={editingGroup.group}
            isDark={isDark}
            onClose={() => setEditingGroup(null)}
            onSave={async (groupNumber, groupName, aeratorCount) => {
              const pond = ponds.find((p: any) => p.id === editingGroup.pondId);
              if (!pond || !pond.aerators) return;
              const existingGroups: any[] = pond.aerators.starterGroups && pond.aerators.starterGroups.length > 0
                ? pond.aerators.starterGroups
                : calcStarterGroups(pond.aerators.count);
              const updated = existingGroups.map((g: any) => {
                if (g.groupNumber !== groupNumber) return g;
                // Recalculate aeratorNames to match the new capacity
                const newNames = Array.from(
                  { length: aeratorCount },
                  (_, i) => `Aerator ${g.aeratorStart + i}`
                );
                return {
                  ...g,
                  groupName: groupName || undefined,
                  aeratorCount,
                  aeratorEnd: g.aeratorStart + aeratorCount - 1,
                  aeratorNames: newNames,
                };
              });
              await updatePond(editingGroup.pondId, {
                aerators: { ...pond.aerators, starterGroups: updated },
              });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
