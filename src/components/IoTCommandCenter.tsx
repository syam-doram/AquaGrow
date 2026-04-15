/**
 * IoTCommandCenter
 * ─────────────────────────────────────────────────────────────────────────────
 * A premium command-and-control panel for AquaGrow IoT devices.
 *
 * Features:
 *  • Polls `GET /api/iot/status/:userId` every 30 seconds to detect offline /
 *    warning devices. Falls back to client-side state when server is offline.
 *  • On connection loss or aerator fault → calls `POST /api/push/iot-alert`
 *    which triggers an FCM push notification to the farmer with step-by-step
 *    guidance (works even when screen is locked).
 *  • Tracks which devices were previously online so it only fires a NEW push
 *    when state transitions from online → offline (not every poll cycle).
 *  • Shows a live per-device card grid with: signal bars, ON/OFF toggle,
 *    connection state badge, last-seen time, watt consumption, and inline
 *    troubleshooting guide for offline devices.
 *  • A "Command Bar" at the top lets the farmer: refresh status, force-send a
 *    test alert, and see the overall health score at a glance.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wind, Wifi, WifiOff, Activity, Droplets, RefreshCw, AlertTriangle,
  CheckCircle2, Signal, Zap, Clock, Radio, ChevronDown, ChevronRight,
  Bell, BellOff, ToggleLeft, ToggleRight, Info, X, Cpu, Waves,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { API_BASE_URL } from '../config';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface IoTDevice {
  id: string;
  name: string;
  type: 'aerator' | 'sensor' | 'feeder' | 'pump';
  pondId: string;
  pondName: string;
  status: 'online' | 'offline' | 'warning';
  power: number;       // watts
  runtime: number;     // hours today
  isOn: boolean;
  lastSeen: string;
  signal: number;      // 0–100
  sensorId?: string | null;
}

type AlertType = 'connection_lost' | 'aerator_fault' | 'sensor_offline' | 'signal_weak' | 'reconnected';

interface IoTAlert {
  id: string;
  type: AlertType;
  deviceId: string;
  deviceName: string;
  pondName: string;
  ts: number;
  resolved: boolean;
}

interface Props {
  devices: IoTDevice[];
  isDark: boolean;
  onToggleDevice: (id: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('aqua_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function getUserId(): string | null {
  try {
    const raw = localStorage.getItem('aqua_user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.id || u?._id || null;
  } catch { return null; }
}

const TYPE_META = {
  aerator: { icon: Wind,       color: '#0EA5E9', label: 'Aerator'  },
  sensor:  { icon: Activity,   color: '#10B981', label: 'Sensor'   },
  feeder:  { icon: Droplets,   color: '#F59E0B', label: 'Feeder'   },
  pump:    { icon: RefreshCw,  color: '#8B5CF6', label: 'Pump'     },
};

const ALERT_GUIDANCE: Record<AlertType, { title: string; emoji: string; color: string; steps: string[] }> = {
  connection_lost: {
    emoji: '📡', color: '#EF4444',
    title: 'Device Offline — What To Do',
    steps: [
      'Check if the device power LED is ON (green/yellow)',
      'Verify the Wi-Fi router is working — try opening a website',
      'Move the device or router closer together (keep within 10m)',
      'If still offline, press the device reset button for 5 seconds',
      'Re-add the device from Smart Farm → IoT → Add Device',
    ],
  },
  aerator_fault: {
    emoji: '💨', color: '#F97316',
    title: 'Aerator Fault — Immediate Action',
    steps: [
      'Physically check if the aerator paddle is rotating',
      'Inspect the power cable for damage or loose contacts',
      'Check the relay/contactor board for burnt smell or tripped switch',
      'Test with a direct plug (bypass the controller) to isolate fault',
      'If motor is seized, replace bearings or contact supplier',
    ],
  },
  sensor_offline: {
    emoji: '🔌', color: '#F59E0B',
    title: 'Sensor Offline — Steps',
    steps: [
      'Check USB or 12V power cable is firmly connected',
      'Inspect the probe cable for cuts or kinks near the connector',
      'Try unplugging and replugging the sensor',
      'Clean probe tips with distilled water — debris can cause read failure',
      'Re-pair sensor: Smart Farm → IoT → select pond → Add Sensor ID',
    ],
  },
  signal_weak: {
    emoji: '📶', color: '#8B5CF6',
    title: 'Weak Signal — Improve Connection',
    steps: [
      'Install a Wi-Fi range extender near the pond',
      'Change router channel from Auto to Channel 1 or 6',
      'Remove metal obstructions between router and device',
      'Consider a 4G LTE IoT gateway for remote ponds',
      'Ensure device firmware is updated for better signal sensitivity',
    ],
  },
  reconnected: {
    emoji: '✅', color: '#10B981',
    title: 'Device Back Online',
    steps: [
      'Live monitoring has resumed automatically',
      'Check last water quality reading for any anomalies',
      'If reconnection was due to power cut — verify DO levels are stable',
    ],
  },
};

// ─── Signal Bar component ────────────────────────────────────────────────────
const SignalBars = ({ signal, isDark }: { signal: number; isDark: boolean }) => (
  <div className="flex items-end gap-[2px]">
    {[25, 50, 75, 100].map((threshold, i) => (
      <div
        key={i}
        className="rounded-[1px] transition-all"
        style={{
          width: 3,
          height: 4 + i * 3,
          background: signal >= threshold
            ? (signal >= 75 ? '#10b981' : signal >= 50 ? '#f59e0b' : '#ef4444')
            : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
        }}
      />
    ))}
  </div>
);

// ─── Device Card ─────────────────────────────────────────────────────────────
const DeviceCard = ({
  device, isDark, onToggle, onAlertDismiss, activeAlert,
}: {
  device: IoTDevice;
  isDark: boolean;
  onToggle: () => void;
  onAlertDismiss: () => void;
  activeAlert: IoTAlert | null;
  key?: React.Key;
}) => {
  const [showGuide, setShowGuide] = useState(false);
  const { icon: Icon, color, label } = TYPE_META[device.type];
  const isOffline  = device.status === 'offline';
  const isWarning  = device.status === 'warning';
  const borderColor = isOffline ? '#EF4444' : isWarning ? '#F59E0B' : undefined;
  const alertGuidance = activeAlert ? ALERT_GUIDANCE[activeAlert.type] : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border overflow-hidden transition-all',
        isOffline
          ? (isDark ? 'bg-red-500/5 border-red-500/30' : 'bg-red-50 border-red-200')
          : isWarning
          ? (isDark ? 'bg-amber-500/5 border-amber-500/30' : 'bg-amber-50 border-amber-200')
          : (isDark ? 'bg-white/4 border-white/10' : 'bg-white border-slate-100 shadow-sm'),
      )}
    >
      {/* ── Card Header ── */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
          style={{ background: `${color}15`, borderColor: `${color}25` }}
        >
          <Icon size={16} style={{ color }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {/* Live pulse or offline dot */}
            <span
              className={cn(
                'w-2 h-2 rounded-full flex-shrink-0',
                isOffline ? 'bg-red-500' : isWarning ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse',
              )}
            />
            <p className={cn('text-[11px] font-black tracking-tight truncate', isDark ? 'text-white' : 'text-slate-900')}>
              {device.name}
            </p>
            <span
              className="text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
              style={{ background: color }}
            >
              {label}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className={cn('text-[8px] font-medium truncate', isDark ? 'text-white/35' : 'text-slate-500')}>
              {device.pondName}
            </span>
            <SignalBars signal={device.signal} isDark={isDark} />
            <span className={cn('text-[7px] font-black', device.signal < 40 ? 'text-red-400' : device.signal < 65 ? 'text-amber-400' : isDark ? 'text-white/25' : 'text-slate-400')}>
              {device.signal}%
            </span>
          </div>
        </div>

        {/* Right-side controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Status badge */}
          <span className={cn(
            'text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full',
            isOffline
              ? (isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-100 text-red-600')
              : isWarning
              ? (isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-700')
              : (isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700'),
          )}>
            {isOffline ? 'Offline' : isWarning ? 'Warning' : 'Online'}
          </span>
          {/* Toggle */}
          <button onClick={onToggle} className="flex-shrink-0">
            {device.isOn
              ? <ToggleRight size={22} className="text-emerald-500" />
              : <ToggleLeft size={22} className={isDark ? 'text-white/20' : 'text-slate-300'} />}
          </button>
        </div>
      </div>

      {/* ── Power / runtime strip ── */}
      <div
        className={cn('flex items-center gap-4 px-4 py-2 border-t', isDark ? 'border-white/5' : 'border-slate-50')}
      >
        <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
          {device.power}W
        </span>
        <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
          {device.runtime}h/day
        </span>
        <span className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
          {device.lastSeen}
        </span>
        <div className="flex-1" />
        {/* Expand guide button for offline devices */}
        {(isOffline || isWarning) && alertGuidance && (
          <button
            onClick={() => setShowGuide(v => !v)}
            className={cn(
              'flex items-center gap-1 text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-lg',
              isDark ? 'text-amber-400 bg-amber-500/10' : 'text-amber-700 bg-amber-50',
            )}
          >
            <Info size={9} />
            Fix Guide
            {showGuide ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
          </button>
        )}
      </div>

      {/* ── Inline fix guide (expands when offline) ── */}
      <AnimatePresence>
        {showGuide && alertGuidance && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className={cn('px-4 py-3 border-t space-y-2', isDark ? 'border-white/5 bg-white/3' : 'border-slate-50 bg-slate-50')}>
              <div className="flex items-center justify-between">
                <p className={cn('text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5', isDark ? 'text-white/50' : 'text-slate-600')}>
                  <span>{alertGuidance.emoji}</span> {alertGuidance.title}
                </p>
                <button
                  onClick={onAlertDismiss}
                  className={cn('text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-lg', isDark ? 'text-white/30 bg-white/5' : 'text-slate-400 bg-slate-100')}
                >
                  Dismiss
                </button>
              </div>
              <ol className="space-y-1.5">
                {alertGuidance.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[7px] font-black text-white mt-0.5"
                      style={{ background: alertGuidance.color }}
                    >
                      {i + 1}
                    </span>
                    <p className={cn('text-[8px] font-medium leading-snug', isDark ? 'text-white/50' : 'text-slate-600')}>
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const IoTCommandCenter: React.FC<Props> = ({ devices: initialDevices, isDark, onToggleDevice }) => {
  const [devices, setDevices]           = useState<IoTDevice[]>(initialDevices);
  const [alerts, setAlerts]             = useState<IoTAlert[]>([]);
  const [isSending, setIsSending]       = useState<string | null>(null); // deviceId
  const [lastPolled, setLastPolled]     = useState<Date | null>(null);
  const [isPolling, setIsPolling]       = useState(false);
  const [pushEnabled, setPushEnabled]   = useState(true);
  const [showAlertBanner, setShowAlert] = useState<IoTAlert | null>(null);

  // Track previous statuses for transition detection
  const prevStatus = useRef<Record<string, IoTDevice['status']>>({});

  // ── Computed stats ───────────────────────────────────────────────────────
  const onlineCount  = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;
  const warnCount    = devices.filter(d => d.status === 'warning').length;
  const avgSignal    = devices.length
    ? Math.round(devices.reduce((s, d) => s + d.signal, 0) / devices.length)
    : 0;
  const healthPct    = devices.length
    ? Math.round((onlineCount / devices.length) * 100)
    : 100;

  // ── Fire IoT alert push via API ──────────────────────────────────────────
  const fireIoTPush = useCallback(async (
    alertType: AlertType,
    device: IoTDevice,
  ) => {
    if (!pushEnabled) return;
    setIsSending(device.id);
    try {
      const guidance = ALERT_GUIDANCE[alertType].steps.join('\n');
      await fetch(`${API_BASE_URL}/push/iot-alert`, {
        method:  'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          alertType,
          deviceId:   device.id,
          deviceName: device.name,
          deviceType: device.type,
          pondId:     device.pondId,
          pondName:   device.pondName,
          signal:     device.signal,
          guidance,
        }),
      });
    } catch (e) {
      console.warn('[IoT Push] Failed to send alert:', e);
    } finally {
      setIsSending(null);
    }
  }, [pushEnabled]);

  // ── Poll server for device status ────────────────────────────────────────
  const pollDeviceStatus = useCallback(async () => {
    const uid = getUserId();
    if (!uid) return;
    setIsPolling(true);
    try {
      const res = await fetch(`${API_BASE_URL}/iot/status/${uid}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Server offline');
      const data = await res.json();

      // Merge server status into local device state
      setDevices(prev => {
        const serverMap: Record<string, any> = {};
        (data.devices || []).forEach((d: any) => { serverMap[d.id] = d; });

        return prev.map(dev => {
          const srv = serverMap[dev.id];
          if (!srv) return dev;
          return {
            ...dev,
            status:   srv.status   ?? dev.status,
            signal:   srv.signal   ?? dev.signal,
            isOn:     srv.isOn     ?? dev.isOn,
            lastSeen: srv.lastSeen ? new Date(srv.lastSeen).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : dev.lastSeen,
          };
        });
      });

      setLastPolled(new Date());
    } catch {
      // Server offline — keep local state, mark as "last checked X ago"
    } finally {
      setIsPolling(false);
    }
  }, []);

  // ── Detect status transitions and fire push ──────────────────────────────
  useEffect(() => {
    devices.forEach(dev => {
      const prev = prevStatus.current[dev.id];
      if (prev === undefined) { prevStatus.current[dev.id] = dev.status; return; }

      if (prev !== dev.status) {
        // Transition detected
        if (dev.status === 'offline') {
          const alertType: AlertType = dev.type === 'sensor' ? 'sensor_offline'
            : dev.type === 'aerator' ? 'connection_lost' : 'connection_lost';

          const newAlert: IoTAlert = {
            id: `${dev.id}-${Date.now()}`,
            type: alertType,
            deviceId: dev.id,
            deviceName: dev.name,
            pondName: dev.pondName,
            ts: Date.now(),
            resolved: false,
          };
          setAlerts(a => [newAlert, ...a.slice(0, 19)]);
          setShowAlert(newAlert);
          fireIoTPush(alertType, dev);

        } else if (dev.status === 'warning' && prev === 'online') {
          const newAlert: IoTAlert = {
            id: `${dev.id}-${Date.now()}`,
            type: 'signal_weak',
            deviceId: dev.id,
            deviceName: dev.name,
            pondName: dev.pondName,
            ts: Date.now(),
            resolved: false,
          };
          setAlerts(a => [newAlert, ...a.slice(0, 19)]);
          fireIoTPush('signal_weak', dev);

        } else if (dev.status === 'online' && prev === 'offline') {
          const newAlert: IoTAlert = {
            id: `${dev.id}-${Date.now()}`,
            type: 'reconnected',
            deviceId: dev.id,
            deviceName: dev.name,
            pondName: dev.pondName,
            ts: Date.now(),
            resolved: true,
          };
          setAlerts(a => [newAlert, ...a.slice(0, 19)]);
          fireIoTPush('reconnected', dev);
        }

        prevStatus.current[dev.id] = dev.status;
      }
    });
  }, [devices, fireIoTPush]);

  // ── Init prevStatus on mount ──────────────────────────────────────────────
  useEffect(() => {
    devices.forEach(dev => { prevStatus.current[dev.id] = dev.status; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Polling interval: every 30 seconds ───────────────────────────────────
  useEffect(() => {
    pollDeviceStatus(); // immediate first call
    const interval = setInterval(pollDeviceStatus, 30_000);
    return () => clearInterval(interval);
  }, [pollDeviceStatus]);

  // Keep local devices in sync if parent changes prop
  useEffect(() => {
    setDevices(prev => {
      // Merge incoming changes but preserve server-fetched status
      return initialDevices.map(next => {
        const existing = prev.find(p => p.id === next.id);
        return existing ?? next;
      });
    });
  }, [initialDevices]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleToggle = (id: string) => {
    setDevices(prev => prev.map(d => d.id === id
      ? { ...d, isOn: !d.isOn, status: !d.isOn ? 'online' : 'offline' }
      : d,
    ));
    onToggleDevice(id);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, resolved: true } : a));
    if (showAlertBanner?.id === alertId) setShowAlert(null);
  };

  const sendTestAlert = async () => {
    const offlineDev = devices.find(d => d.status === 'offline');
    const target = offlineDev ?? devices[0];
    if (!target) return;
    await fireIoTPush(offlineDev ? 'connection_lost' : 'aerator_fault', target);
  };

  const groupedByPond = devices.reduce<Record<string, IoTDevice[]>>((acc, d) => {
    (acc[d.pondId] = acc[d.pondId] || []).push(d);
    return acc;
  }, {});

  const healthColor = healthPct >= 90 ? '#10b981' : healthPct >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-4">

      {/* ── ALERT BANNER ── */}
      <AnimatePresence>
        {showAlertBanner && (
          <motion.div
            key={showAlertBanner.id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${ALERT_GUIDANCE[showAlertBanner.type].color}CC, ${ALERT_GUIDANCE[showAlertBanner.type].color}88)` }}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-xl">{ALERT_GUIDANCE[showAlertBanner.type].emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-[11px] tracking-tight">
                  {showAlertBanner.deviceName} — {showAlertBanner.pondName}
                </p>
                <p className="text-white/70 text-[8px] font-medium">
                  {showAlertBanner.type === 'connection_lost' ? 'Lost connection. Notification sent.' :
                   showAlertBanner.type === 'aerator_fault'   ? 'Aerator fault detected. Check immediately.' :
                   showAlertBanner.type === 'sensor_offline'  ? 'Sensor offline. Water readings unavailable.' :
                   showAlertBanner.type === 'signal_weak'     ? 'Weak signal. Data may be delayed.' :
                   'Device is back online.'}
                </p>
              </div>
              <button onClick={() => setShowAlert(null)} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <X size={12} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COMMAND BAR ── */}
      <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-white/4 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
        {/* Health score header */}
        <div className="flex items-center gap-4 px-4 py-4">
          {/* Health ring */}
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg viewBox="0 0 52 52" className="w-full h-full -rotate-90">
              <circle cx="26" cy="26" r="22" strokeWidth="5" className={isDark ? 'stroke-white/8' : 'stroke-slate-100'} fill="none" />
              <circle
                cx="26" cy="26" r="22" strokeWidth="5" fill="none"
                stroke={healthColor}
                strokeDasharray={`${(healthPct / 100) * 138.2} 138.2`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-black" style={{ color: healthColor }}>{healthPct}%</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className={cn('text-[8px] font-black uppercase tracking-[0.25em] mb-0.5', isDark ? 'text-white/35' : 'text-slate-400')}>
              IoT Network Health
            </p>
            <p className={cn('text-sm font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              {onlineCount}/{devices.length} Devices Online
            </p>
            <p className={cn('text-[8px] font-medium mt-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>
              {lastPolled
                ? `Checked ${lastPolled.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                : 'Checking status…'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {/* Refresh */}
            <button
              onClick={pollDeviceStatus}
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center border transition-all active:scale-90',
                isDark ? 'bg-white/8 border-white/15 text-white/60' : 'bg-white border-slate-200 text-slate-500',
                isPolling ? 'opacity-50' : '',
              )}
            >
              <RefreshCw size={13} className={isPolling ? 'animate-spin' : ''} />
            </button>
            {/* Push toggle */}
            <button
              onClick={() => setPushEnabled(v => !v)}
              title={pushEnabled ? 'Push notifications ON' : 'Push notifications OFF'}
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center border transition-all active:scale-90',
                pushEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                  : (isDark ? 'bg-white/5 border-white/10 text-white/20' : 'bg-slate-50 border-slate-200 text-slate-300'),
              )}
            >
              {pushEnabled ? <Bell size={13} /> : <BellOff size={13} />}
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className={cn('flex border-t', isDark ? 'border-white/8' : 'border-slate-50')}>
          {[
            { label: 'Online',   value: onlineCount,  color: '#10b981' },
            { label: 'Offline',  value: offlineCount, color: '#ef4444' },
            { label: 'Warning',  value: warnCount,    color: '#f59e0b' },
            { label: 'Avg Sig.', value: `${avgSignal}%`, color: '#0ea5e9' },
          ].map((s, i) => (
            <div
              key={i}
              className={cn('flex-1 flex flex-col items-center py-2.5 gap-0.5', i > 0 ? (isDark ? 'border-l border-white/5' : 'border-l border-slate-50') : '')}
            >
              <span className="text-sm font-black tracking-tighter" style={{ color: s.color }}>{s.value}</span>
              <span className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Action buttons row */}
        <div className={cn('flex gap-2 px-4 py-3 border-t', isDark ? 'border-white/8' : 'border-slate-50')}>
          <button
            onClick={pollDeviceStatus}
            disabled={isPolling}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all active:scale-95 disabled:opacity-40',
              isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-slate-50 border-slate-200 text-slate-600',
            )}
          >
            <RefreshCw size={11} className={isPolling ? 'animate-spin' : ''} />
            {isPolling ? 'Checking…' : 'Refresh Status'}
          </button>
          <button
            onClick={sendTestAlert}
            disabled={!!isSending || devices.length === 0}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all active:scale-95 disabled:opacity-40',
              'bg-violet-500/10 border-violet-500/25 text-violet-500',
            )}
          >
            <Bell size={11} />
            Test Alert
          </button>
        </div>
      </div>

      {/* ── DEVICE CARDS grouped by pond ── */}
      {devices.length === 0 ? (
        <div className={cn('rounded-2xl p-10 border text-center', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100')}>
          <Cpu size={36} className={cn('mx-auto mb-3', isDark ? 'text-white/20' : 'text-slate-300')} />
          <p className={cn('text-xs font-black uppercase tracking-widest mb-1', isDark ? 'text-white/40' : 'text-slate-500')}>
            No IoT Devices Found
          </p>
          <p className={cn('text-[9px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>
            Add ponds with aerator data to auto-populate devices, or register manually via the Add Device button.
          </p>
        </div>
      ) : (
        (Object.entries(groupedByPond) as [string, IoTDevice[]][]).map(([pondId, pondDevices]) => {
          const pondOffline = pondDevices.filter(d => d.status === 'offline').length;
          const pondName    = pondDevices[0]?.pondName ?? 'Unknown';
          return (
            <div key={pondId}>
              {/* Pond group header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-sm">🦐</span>
                <p className={cn('text-[9px] font-black uppercase tracking-widest flex-1', isDark ? 'text-white/40' : 'text-slate-500')}>
                  {pondName}
                </p>
                {pondOffline > 0 && (
                  <span className="text-[7px] font-black px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 uppercase tracking-widest">
                    {pondOffline} offline
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {pondDevices.map(device => {
                  const activeAlert = alerts.find(a => a.deviceId === device.id && !a.resolved) ?? null;
                  return (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      isDark={isDark}
                      onToggle={() => handleToggle(device.id)}
                      onAlertDismiss={() => activeAlert && dismissAlert(activeAlert.id)}
                      activeAlert={activeAlert}
                    />
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* ── ALERT HISTORY ── */}
      {alerts.length > 0 && (
        <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
          <div className={cn('flex items-center justify-between px-4 py-3 border-b', isDark ? 'border-white/8' : 'border-slate-50')}>
            <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/40' : 'text-slate-500')}>
              Alert Log ({alerts.length})
            </p>
            <button
              onClick={() => setAlerts([])}
              className={cn('text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-lg', isDark ? 'text-white/25 bg-white/5' : 'text-slate-400 bg-slate-100')}
            >
              Clear
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
            {alerts.slice(0, 8).map(alert => {
              const g = ALERT_GUIDANCE[alert.type];
              return (
                <div key={alert.id} className={cn('flex items-center gap-3 px-4 py-3', isDark ? 'hover:bg-white/3' : 'hover:bg-slate-50')}>
                  <span className="text-base leading-none">{g.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-[9px] font-black truncate', isDark ? 'text-white/70' : 'text-slate-800')}>
                      {alert.deviceName}
                    </p>
                    <p className={cn('text-[7px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>
                      {alert.pondName} · {new Date(alert.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span
                    className="text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{
                      background: `${g.color}18`,
                      color: g.color,
                    }}
                  >
                    {alert.type.replace('_', ' ')}
                  </span>
                  {alert.resolved && (
                    <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PUSH NOTIFICATION GUIDE ── */}
      <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-violet-500/6 border-violet-500/15' : 'bg-violet-50 border-violet-100')}>
        <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2.5 flex items-center gap-1.5', isDark ? 'text-violet-400' : 'text-violet-700')}>
          <Radio size={10} /> How Push Alerts Work
        </p>
        <div className="space-y-1.5">
          {[
            { icon: Signal,     color: '#8B5CF6', text: 'AquaGrow polls your IoT devices every 30 seconds via Firebase + server API' },
            { icon: WifiOff,    color: '#EF4444', text: 'When a device goes offline, an instant push notification wakes your phone — even on lock screen' },
            { icon: Wind,       color: '#0EA5E9', text: 'Aerator faults trigger the highest priority alert with step-by-step repair guidance' },
            { icon: CheckCircle2, color: '#10B981', text: 'When a device reconnects, you get a recovery notification so you know the issue is resolved' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${item.color}15` }}>
                <item.icon size={10} style={{ color: item.color }} />
              </div>
              <p className={cn('text-[8px] font-medium leading-snug', isDark ? 'text-white/40' : 'text-slate-500')}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
