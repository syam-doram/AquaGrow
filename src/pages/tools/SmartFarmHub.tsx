import React, { useState, useMemo } from 'react';
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
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Settings,
  RefreshCw,
  Plus,
  X,
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
  Info,
  Scan,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { calculateDOC } from '../../utils/pondUtils';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Mock data helpers ────────────────────────────────────────────────────────
const RATE_PER_UNIT = 6.5; // ₹/kWh — AP agriculture tariff

const mockDevices: IoTDevice[] = [];

const mockElectricityHistory: ElectricityEntry[] = [
  { month: 'Jan', units: 1820, amount: 11830, aeratorShare: 62 },
  { month: 'Feb', units: 1650, amount: 10725, aeratorShare: 60 },
  { month: 'Mar', units: 1940, amount: 12610, aeratorShare: 65 },
  { month: 'Apr', units: 1760, amount: 11440, aeratorShare: 63 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusDot = ({ status }: { status: IoTDevice['status'] }) => {
  const colors = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-400',
    warning: 'bg-amber-500 animate-pulse',
  };
  return <span className={cn('w-2 h-2 rounded-full flex-shrink-0', colors[status])} />;
};

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

// ─── Main Component ──────────────────────────────────────────────────────────
export const SmartFarmHub = ({ t }: { t: Translations }) => {
  const navigate = useNavigate();
  const { ponds, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [activeTab, setActiveTab] = useState<'aerators' | 'iot' | 'electricity' | 'power'>('aerators');
  const [devices, setDevices] = useState<IoTDevice[]>(() => {
    // Seed devices from real ponds
    const result: IoTDevice[] = [];
    const activePonds = ponds.filter(p => p.status === 'active' || p.status === 'planned');
    activePonds.forEach((pond, pi) => {
      const doc = calculateDOC(pond.stockingDate);
      const aerCount = doc > 40 ? 3 : doc > 20 ? 2 : 1;
      for (let ai = 0; ai < aerCount; ai++) {
        result.push({
          id: `aer-${pond.id}-${ai}`,
          name: `Aerator ${ai + 1}`,
          type: 'aerator',
          pondId: pond.id,
          pondName: pond.name,
          status: Math.random() > 0.2 ? 'online' : 'warning',
          power: [750, 1100, 1500][Math.floor(Math.random() * 3)],
          runtime: Math.floor(Math.random() * 18 + 4),
          isOn: true,
          lastSeen: '2 min ago',
          signal: Math.floor(Math.random() * 40 + 60),
        });
      }
      // One sensor per pond
      result.push({
        id: `sensor-${pond.id}`,
        name: 'Water Sensor',
        type: 'sensor',
        pondId: pond.id,
        pondName: pond.name,
        status: pi === 0 && ponds.length > 2 ? 'offline' : 'online',
        power: 5,
        runtime: 24,
        isOn: pi !== 0 || ponds.length <= 2,
        lastSeen: pi === 0 && ponds.length > 2 ? '3 hrs ago' : 'Just now',
        signal: Math.floor(Math.random() * 30 + 50),
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
    { id: 'iot' as const, label: 'IoT Hub', icon: CircuitBoard, color: '#8B5CF6' },
    { id: 'electricity' as const, label: 'Power Bill', icon: IndianRupee, color: '#F59E0B' },
    { id: 'power' as const, label: 'Load', icon: Gauge, color: '#EF4444' },
  ];

  // ─── Aerator stage recommendations
  const aeratorStages = [
    { doc: '1–20', count: '1 Aerator', hp: '1 HP', tip: 'Gentle aeration, maintain DO > 4 mg/L at night', color: '#3B82F6' },
    { doc: '21–40', count: '2 Aerators', hp: '2 HP', tip: 'Increase aeration as biomass grows, run 20+ hrs/day', color: '#8B5CF6' },
    { doc: '41–60', count: '3–4 Aerators', hp: '3–5 HP', tip: 'Critical stage — run 24 hrs, monitor DO every 6 hrs', color: '#F59E0B' },
    { doc: '61–90', count: '5–6 Aerators', hp: '6–10 HP', tip: 'Heavy biomass stage, extra aeration at midnight', color: '#EF4444' },
  ];

  return (
    <div className={cn('min-h-[100dvh] pb-28 relative', isDark ? 'bg-[#030E1B]' : 'bg-[#F0F8FF]')}>
      {/* Ambient gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={cn('absolute top-[-5%] right-[-10%] w-[70%] h-[45%] blur-[130px] rounded-full', isDark ? 'bg-cyan-600/10' : 'bg-cyan-400/8')} />
        <div className={cn('absolute bottom-[-10%] left-[-5%] w-[60%] h-[40%] blur-[110px] rounded-full', isDark ? 'bg-violet-600/10' : 'bg-violet-400/6')} />
      </div>

      <Header
        title="Smart Farm Hub"
        showBack
        onBack={() => navigate('/dashboard')}
      />

      <div className="px-4 pt-[calc(env(safe-area-inset-top)+4.5rem)] space-y-5 relative z-10">

        {/* ── HERO STATS ── */}
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

        {/* ── LIVE POWER INDICATOR ── */}
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

        {/* ── TABS ── */}
        <div className={cn('flex gap-1.5 p-1.5 rounded-2xl border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all',
                activeTab === tab.id
                  ? isDark ? 'bg-white/10 shadow-inner' : 'bg-slate-100 shadow-inner'
                  : ''
              )}
            >
              <tab.icon size={14} style={{ color: activeTab === tab.id ? tab.color : isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8' }} />
              <span className={cn('text-[7px] font-black uppercase tracking-widest', activeTab === tab.id ? (isDark ? 'text-white' : 'text-slate-800') : isDark ? 'text-white/30' : 'text-slate-400')}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── SCAN WATER REPORT BANNER ── */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/monitor/scan')}
          className="w-full rounded-2xl p-4 border relative overflow-hidden flex items-center gap-4 text-left"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(59,130,246,0.08))'
              : 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(59,130,246,0.05))',
            borderColor: isDark ? 'rgba(6,182,212,0.25)' : 'rgba(6,182,212,0.3)',
            boxShadow: isDark ? '0 0 30px rgba(6,182,212,0.08)' : '0 4px 20px rgba(6,182,212,0.1)',
          }}
        >
          {/* Glow blob */}
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl opacity-20" style={{ background: '#06b6d4' }} />
          {/* Animated pulse ring */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.18)', border: '1.5px solid rgba(6,182,212,0.35)' }}>
              <Scan size={22} style={{ color: '#06b6d4' }} />
            </div>
            <motion.div
              animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-2xl border-2"
              style={{ borderColor: '#06b6d4' }}
            />
          </div>
          <div className="flex-1 min-w-0 relative z-10">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] mb-0.5" style={{ color: '#06b6d4' }}>Quick Action</p>
            <p className={cn('text-sm font-black tracking-tight leading-snug', isDark ? 'text-white' : 'text-slate-900')}>Scan Water Lab Report</p>
            <p className={cn('text-[9px] font-medium mt-0.5', isDark ? 'text-white/40' : 'text-slate-500')}>AI extracts pH, DO, Ammonia, Salinity & more in seconds</p>
          </div>
          <ChevronRight size={16} style={{ color: '#06b6d4', flexShrink: 0 }} />
        </motion.button>

        {/* ── TAB CONTENT ── */}
        <AnimatePresence mode="wait">

          {/* ── AERATORS TAB ── */}
          {activeTab === 'aerators' && (
            <motion.div key="aerators" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">

              {/* Stage recommendation guide */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className={cn('text-sm font-black tracking-tight flex items-center gap-2', isDark ? 'text-white' : 'text-slate-900')}>
                    <Wind size={15} className="text-cyan-500" /> Aerator Schedule by DOC
                  </h2>
                </div>
                <div className="space-y-2">
                  {aeratorStages.map((stage, i) => {
                    // Check if any pond is in this DOC range
                    const rangeParts = stage.doc.split('–').map(Number);
                    const activePondsInStage = ponds.filter(p => {
                      if (p.status !== 'active') return false;
                      const doc = calculateDOC(p.stockingDate);
                      return doc >= rangeParts[0] && doc <= rangeParts[1];
                    });
                    const isActive = activePondsInStage.length > 0;
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
                              Active · {activePondsInStage.map(p => p.name).join(', ')}
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

              {/* Aerator device list */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className={cn('text-sm font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                    Pond Aerators <span className={cn('text-[10px] font-black ml-1', isDark ? 'text-white/30' : 'text-slate-400')}>({aerators.length})</span>
                  </h2>
                  <button
                    onClick={() => setIsAddingDevice(true)}
                    className={cn('flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[8px] font-black uppercase tracking-widest', isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-slate-200 text-slate-600')}
                  >
                    <Plus size={10} /> Add
                  </button>
                </div>

                {aerators.length === 0 ? (
                  <div className={cn('rounded-2xl p-8 border text-center', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100')}>
                    <Wind size={32} className={cn('mx-auto mb-3', isDark ? 'text-white/20' : 'text-slate-300')} />
                    <p className={cn('text-xs font-black uppercase tracking-widest mb-1', isDark ? 'text-white/40' : 'text-slate-500')}>No aerators registered</p>
                    <p className={cn('text-[9px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>Add active ponds first, then register aerators</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {aerators.map((dev, i) => (
                      <motion.div
                        key={dev.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn('rounded-2xl p-4 border flex items-center gap-3', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}
                      >
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border', dev.isOn ? (isDark ? 'bg-cyan-500/15 border-cyan-500/25' : 'bg-cyan-50 border-cyan-200') : (isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'))}>
                          <Wind size={16} className={dev.isOn ? 'text-cyan-500' : isDark ? 'text-white/20' : 'text-slate-300'} style={dev.isOn ? { animation: 'spin 3s linear infinite' } : {}} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <StatusDot status={dev.status} />
                            <p className={cn('text-[11px] font-black tracking-tight truncate', isDark ? 'text-white' : 'text-slate-800')}>{dev.name}</p>
                          </div>
                          <p className={cn('text-[8px] font-medium truncate', isDark ? 'text-white/30' : 'text-slate-500')}>{dev.pondName} · {dev.power}W · {dev.runtime}h today</p>
                          <div className="flex items-center gap-2 mt-1">
                            <SignalBars signal={dev.signal} isDark={isDark} />
                            <span className={cn('text-[7px] font-black', isDark ? 'text-white/20' : 'text-slate-400')}>{dev.lastSeen}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleDevice(dev.id)}
                          className="flex-shrink-0"
                        >
                          {dev.isOn
                            ? <ToggleRight size={28} className="text-emerald-500" />
                            : <ToggleLeft size={28} className={isDark ? 'text-white/20' : 'text-slate-300'} />}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Aeration tips */}
              <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-indigo-500/8 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200')}>
                <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5', isDark ? 'text-indigo-400' : 'text-indigo-700')}>
                  <Info size={10} /> Expert Tip
                </p>
                <p className={cn('text-[9px] font-medium leading-relaxed', isDark ? 'text-white/50' : 'text-slate-600')}>
                  Run aerators <strong>between 2 AM – 6 AM</strong> at full power. DO levels drop to critical (&lt;4 mg/L) just before sunrise. For every 1,000 kg biomass, a minimum of 1 HP aerator is recommended.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── IoT HUB TAB ── */}
          {activeTab === 'iot' && (
            <motion.div key="iot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">

              {/* Connectivity overview */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Total Devices', value: devices.length, icon: Cpu, color: '#8b5cf6' },
                  { label: 'Ponds Covered', value: [...new Set(devices.map(d => d.pondId))].length, icon: Waves, color: '#0ea5e9' },
                  { label: 'Avg Signal', value: `${Math.round(devices.reduce((s, d) => s + d.signal, 0) / Math.max(devices.length, 1))}%`, icon: Radio, color: '#10b981' },
                  { label: 'Sensors Active', value: sensors.filter(s => s.isOn).length, icon: Activity, color: '#f59e0b' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn('rounded-2xl p-4 border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}18` }}>
                        <stat.icon size={14} style={{ color: stat.color }} />
                      </div>
                    </div>
                    <p className={cn('text-xl font-black tracking-tighter', isDark ? 'text-white' : 'text-slate-900')}>{stat.value}</p>
                    <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* All devices */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className={cn('text-sm font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>All Devices</h2>
                  <button
                    onClick={() => setIsAddingDevice(true)}
                    className={cn('flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[8px] font-black uppercase tracking-widest', isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-slate-200 text-slate-600')}
                  >
                    <Plus size={10} /> Add Device
                  </button>
                </div>
                {devices.length === 0 ? (
                  <div className={cn('rounded-2xl p-10 border text-center', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100')}>
                    <CircuitBoard size={36} className={cn('mx-auto mb-3', isDark ? 'text-white/20' : 'text-slate-300')} />
                    <p className={cn('text-xs font-black uppercase tracking-widest mb-1', isDark ? 'text-white/40' : 'text-slate-500')}>No IoT Devices</p>
                    <p className={cn('text-[9px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>Add ponds to auto-populate devices</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {devices.map((dev, i) => {
                      const typeIcon = { aerator: Wind, sensor: Activity, feeder: Droplets, pump: RefreshCw }[dev.type];
                      const typeColor = { aerator: '#0ea5e9', sensor: '#10b981', feeder: '#f59e0b', pump: '#8b5cf6' }[dev.type];
                      return (
                        <motion.div
                          key={dev.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={cn('rounded-2xl px-4 py-3 border flex items-center gap-3', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border" style={{ background: `${typeColor}15`, borderColor: `${typeColor}25` }}>
                            {React.createElement(typeIcon, { size: 14, style: { color: typeColor } })}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <StatusDot status={dev.status} />
                              <p className={cn('text-[11px] font-black tracking-tight truncate', isDark ? 'text-white' : 'text-slate-800')}>{dev.name}</p>
                              <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full text-white uppercase flex-shrink-0" style={{ background: typeColor }}>{dev.type}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-slate-500')}>{dev.pondName}</p>
                              <SignalBars signal={dev.signal} isDark={isDark} />
                              <span className={cn('text-[7px] font-black', isDark ? 'text-white/20' : 'text-slate-400')}>{dev.signal}%</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className={cn('px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest', dev.status === 'online' ? (isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : dev.status === 'warning' ? 'bg-amber-500/15 text-amber-400' : (isDark ? 'bg-white/5 text-white/20' : 'bg-slate-100 text-slate-400'))}>
                              {dev.status}
                            </div>
                            <button onClick={() => toggleDevice(dev.id)}>
                              {dev.isOn ? <ToggleRight size={24} className="text-emerald-500" /> : <ToggleLeft size={24} className={isDark ? 'text-white/20' : 'text-slate-300'} />}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Connection guide */}
              <div className={cn('rounded-2xl p-4 border space-y-3', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100')}>
                <p className={cn('text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5', isDark ? 'text-white/40' : 'text-slate-500')}>
                  <Wifi size={10} /> Supported IoT Connectors
                </p>
                {[
                  { name: 'DO / pH Sensor', protocol: 'Wi-Fi / RS485', icon: Droplets, color: '#0ea5e9' },
                  { name: 'Smart Aerator Controller', protocol: 'Wi-Fi / Relay', icon: Wind, color: '#10b981' },
                  { name: 'Auto Feeder', protocol: 'Bluetooth / Wi-Fi', icon: Cpu, color: '#f59e0b' },
                  { name: 'Water Pump', protocol: 'GSM / Wi-Fi', icon: RefreshCw, color: '#8b5cf6' },
                  { name: 'Weather Station', protocol: 'LoRaWAN', icon: Thermometer, color: '#ef4444' },
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${c.color}18` }}>
                      <c.icon size={13} style={{ color: c.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-[10px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-800')}>{c.name}</p>
                      <p className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>{c.protocol}</p>
                    </div>
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── ELECTRICITY BILL TAB ── */}
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
                  'Clean aerator paddle wheels monthly — dirty blades use 15% more power',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className={cn('text-[9px] font-medium leading-snug', isDark ? 'text-white/50' : 'text-slate-600')}>{tip}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── POWER / LOAD ANALYSIS TAB ── */}
          {activeTab === 'power' && (
            <motion.div key="power" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">

              {/* 24hr power profile */}
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
                              <span className="text-[8px]">🦐</span>
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
                  ].map((p, i) => (
                    <div key={i} className={cn('rounded-xl p-3 border text-center', isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-white')}>
                      <p className={cn('text-sm font-black tracking-tighter', isDark ? 'text-white' : 'text-slate-900')}>{p.value}</p>
                      <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>{p.label}</p>
                      <p className={cn('text-[6px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>{p.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── ADD DEVICE MODAL ── */}
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
