import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  HelpCircle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { calculateDOC } from '../../utils/pondUtils';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { IoTCommandCenter } from '../../components/IoTCommandCenter';

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
const RATE_PER_UNIT = 6.5; // Ã¢â€šÂ¹/kWh Ã¢â‚¬â€ AP agriculture tariff

const mockDevices: IoTDevice[] = [];

const mockElectricityHistory: ElectricityEntry[] = [
  { month: 'Jan', units: 1820, amount: 11830, aeratorShare: 62 },
  { month: 'Feb', units: 1650, amount: 10725, aeratorShare: 60 },
  { month: 'Mar', units: 1940, amount: 12610, aeratorShare: 65 },
  { month: 'Apr', units: 1760, amount: 11440, aeratorShare: 63 },
];

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Sub-components Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

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
          name: positions[ai] ? `Aerator Ã¢â‚¬â€œ ${positions[ai]}` : `Aerator ${ai + 1}`,
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
    { id: 'electricity' as const, label: 'Power Bill', icon: IndianRupee, color: '#F59E0B' },
    { id: 'power' as const, label: 'Analytics', icon: BarChart2, color: '#EF4444' },
    { id: 'load' as const, label: 'Load', icon: Gauge, color: '#F97316' },
    { id: 'iot' as const, label: 'IoT', icon: CircuitBoard, color: '#8B5CF6' },
  ];

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Aerator stage recommendations
  const aeratorStages = [
    { doc: '1Ã¢â‚¬â€œ20', count: '1 Aerator', hp: '1 HP', tip: 'Gentle aeration, maintain DO > 4 mg/L at night', color: '#3B82F6' },
    { doc: '21Ã¢â‚¬â€œ40', count: '2 Aerators', hp: '2 HP', tip: 'Increase aeration as biomass grows, run 20+ hrs/day', color: '#8B5CF6' },
    { doc: '41Ã¢â‚¬â€œ60', count: '3Ã¢â‚¬â€œ4 Aerators', hp: '3Ã¢â‚¬â€œ5 HP', tip: 'Critical stage Ã¢â‚¬â€ run 24 hrs, monitor DO every 6 hrs', color: '#F59E0B' },
    { doc: '61Ã¢â‚¬â€œ90', count: '5Ã¢â‚¬â€œ6 Aerators', hp: '6Ã¢â‚¬â€œ10 HP', tip: 'Heavy biomass stage, extra aeration at midnight', color: '#EF4444' },
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
                <span className={cn('ml-1', isDark ? 'text-white/30' : 'text-slate-400')}>@ Ã¢â€šÂ¹{RATE_PER_UNIT}/unit</span>
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
                  {/* Ã¢â€â‚¬Ã¢â€â‚¬ POND FILTER CHIPS Ã¢â€â‚¬Ã¢â€â‚¬ */}
                  <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                    <button
                      onClick={() => setSelectedPondId('all')}
                      className={cn(
                        'flex-shrink-0 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all',
                        selectedPondId === 'all'
                          ? 'bg-cyan-500 text-white border-cyan-500'
                          : isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-white border-slate-200 text-slate-500'
                      )}
                    >
                      All Ponds
                    </button>
                    {ponds.filter(p => p.status === 'active').map(pond => (
                      <button
                        key={pond.id}
                        onClick={() => setSelectedPondId(pond.id)}
                        className={cn(
                          'flex-shrink-0 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all',
                          selectedPondId === pond.id
                            ? 'bg-cyan-500 text-white border-cyan-500'
                            : isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-white border-slate-200 text-slate-500'
                        )}
                      >
                        {pond.name}
                      </button>
                    ))}
                  </div>

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
                                  <span className="text-sm">Ã°Å¸Â¦Â</span>
                                  <div>
                                    <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{pond.name}</p>
                                    <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>
                                      DOC {doc}
                                      {hasData ? ` Ã‚Â· ${count} aerator${count > 1 ? 's' : ''} Ã‚Â· ${hp} HP each` : ' Ã‚Â· No data recorded'}
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
                                      {isSopMet ? 'Ã¢Å“â€œ SOP Met' : `Need ${recCount}`}
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
                                    Last updated at DOC {lastDoc} Ã¢â‚¬â€ {doc - (lastDoc ?? 0)} days ago. Update recommended.
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
                                      Go to Pond Details Ã¢â€ â€™ Aerator Management to record your setup.
                                    </p>
                                  </div>
                                  <div className={cn('rounded-xl p-3 border text-left', isDark ? 'bg-white/4 border-white/8' : 'bg-slate-50 border-slate-100')}>
                                    <p className={cn('text-[7px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/25' : 'text-slate-400')}>Recommended for DOC {doc}</p>
                                    <p className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-800')}>
                                      {recCount} Aerator{recCount > 1 ? 's' : ''} Ã‚Â· {doc > 40 ? '3Ã¢â‚¬â€œ5 HP' : doc > 20 ? '2 HP' : '1 HP'} each
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
                                              Aerator {ai + 1} <span className={cn('font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>Ã¢â‚¬â€ {posLabel}</span>
                                            </p>
                                            <p className={cn('text-[7px] font-medium', isDark ? 'text-white/25' : 'text-slate-400')}>
                                              {hp} HP Ã‚Â· {watt}W Ã‚Â· {runtime}h/day Ã‚Â· ~{(watt * runtime / 1000).toFixed(1)} kWh
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
                                              <span className={cn('text-[8px] font-black', isDark ? 'text-white/60' : 'text-slate-700')}>{entry.count} aerator{entry.count > 1 ? 's' : ''} Ã‚Â· {entry.hp} HP</span>
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

                  {/* Ã¢â€â‚¬Ã¢â€â‚¬ DOC STAGE GUIDE Ã¢â€â‚¬Ã¢â€â‚¬ */}
                  <div>
                    <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2 px-1', isDark ? 'text-white/30' : 'text-slate-400')}>Aerator SOP by DOC Stage</p>
                    <div className="space-y-2">
                      {aeratorStages.map((stage, i) => {
                        const rangeParts = stage.doc.split('Ã¢â‚¬â€œ').map(Number);
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
                      Run aerators <strong>between 2 AM Ã¢â‚¬â€œ 6 AM</strong> at full power. DO levels drop to critical (&lt;4 mg/L) just before sunrise. For every 1,000 kg biomass, a minimum of 1 HP aerator is recommended.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          )}
          {/* Ã¢â€â‚¬Ã¢â€â‚¬ ELECTRICITY BILL TAB Ã¢â€â‚¬Ã¢â€â‚¬ */}
          {activeTab === 'electricity' && (
            <motion.div key="electricity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">

              {/* Current month calc */}
              <div className={cn('rounded-2xl p-5 border relative overflow-hidden', isDark ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/8 border-amber-500/20' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200')}>
                <div className="absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 rounded-full" style={{ background: '#f59e0b' }} />
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div>
                    <p className={cn('text-[8px] font-black uppercase tracking-[0.25em] mb-1', isDark ? 'text-amber-400' : 'text-amber-700')}>This Month Estimate</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[11px] font-black text-amber-500">Ã¢â€šÂ¹</span>
                      <span className={cn('text-3xl font-black tracking-tighter', isDark ? 'text-white' : 'text-slate-900')}>{parseInt(currentBillEst).toLocaleString('en-IN')}</span>
                    </div>
                    <p className={cn('text-[8px] font-medium mt-0.5', isDark ? 'text-white/30' : 'text-slate-500')}>@ Ã¢â€šÂ¹{RATE_PER_UNIT}/unit (AP Agri Tariff)</p>
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
                          <span className="text-[9px] font-black" style={{ color: item.color }}>Ã¢â€šÂ¹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
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
                        <span className={cn('text-[7px] font-black', isDark ? 'text-white/40' : 'text-slate-500')}>Ã¢â€šÂ¹{(entry.amount / 1000).toFixed(1)}K</span>
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
                  'Run aerators on timer: peak 12amÃ¢â‚¬â€œ6am, reduce 10amÃ¢â‚¬â€œ4pm',
                  'Replace 1.5 HP motors with energy-efficient 1 HP models where DOC < 30',
                  'Use solar-powered DO sensors to cut sensor power cost by 80%',
                  'Clean aerator paddle wheels monthly Ã¢â‚¬â€ dirty blades use 15% more power',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className={cn('text-[9px] font-medium leading-snug', isDark ? 'text-white/50' : 'text-slate-600')}>{tip}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ ANALYTICS TAB Ã¢â€â‚¬Ã¢â€â‚¬ */}
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
                    {v === 'pond' ? 'Ã°Å¸Â¦Â Pond' : v === 'month' ? 'Ã°Å¸â€œâ€¦ Month' : 'Ã°Å¸â€œâ€  Year'}
                  </button>
                ))}
              </div>

              {/* Ã¢â€â‚¬Ã¢â€â‚¬ POND-WISE VIEW Ã¢â€â‚¬Ã¢â€â‚¬ */}
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
                              <span className="text-base">Ã°Å¸Â¦Â</span>
                              <div>
                                <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{pond.name}</p>
                                <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>DOC {doc} Ã‚Â· {realCount} aerators Ãƒâ€” {realHp} HP</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-black tracking-tighter text-amber-500">Ã¢â€šÂ¹{dailyCost.toFixed(0)}</p>
                              <p className={cn('text-[7px] font-black', isDark ? 'text-white/30' : 'text-slate-400')}>per day</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {[
                              { label: 'Total Load', value: `${totalKw.toFixed(1)} kW`, color: '#ef4444' },
                              { label: 'Daily Units', value: `${dailyKwh.toFixed(0)} kWh`, color: '#f59e0b' },
                              { label: 'Monthly Est', value: `Ã¢â€šÂ¹${(monthlyCost / 1000).toFixed(1)}K`, color: '#10b981' },
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
                        { slab: '0 Ã¢â‚¬â€œ 50 units', rate: 'Ã¢â€šÂ¹0.00', desc: 'Free (subsidised farming)' },
                        { slab: '51 Ã¢â‚¬â€œ 100 units', rate: 'Ã¢â€šÂ¹1.50', desc: 'Subsidised rate' },
                        { slab: '101 Ã¢â‚¬â€œ 200 units', rate: 'Ã¢â€šÂ¹3.00', desc: 'Standard rate' },
                        { slab: '201 Ã¢â‚¬â€œ 500 units', rate: 'Ã¢â€šÂ¹5.00', desc: 'Aquaculture category' },
                        { slab: '500+ units', rate: 'Ã¢â€šÂ¹6.00', desc: 'Commercial rate' },
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

              {/* Ã¢â€â‚¬Ã¢â€â‚¬ MONTH-WISE VIEW Ã¢â€â‚¬Ã¢â€â‚¬ */}
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
                              Ã¢â€šÂ¹{(entry.amount / 1000).toFixed(0)}K
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
                          Ã¢â€šÂ¹{Math.round(electricityHistory.reduce((s, e) => s + e.amount, 0) / electricityHistory.length).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>Peak Month</p>
                        <p className="text-sm font-black text-amber-500">
                          Ã¢â€šÂ¹{Math.max(...electricityHistory.map(e => e.amount)).toLocaleString('en-IN')}
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
                          <p className={cn('text-[11px] font-black', i === electricityHistory.length - 1 ? 'text-red-500' : (isDark ? 'text-white' : 'text-slate-800'))}>Ã¢â€šÂ¹{entry.amount.toLocaleString('en-IN')}</p>
                          <p className={cn('text-[7px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>Ã¢â€šÂ¹{(entry.amount / entry.units).toFixed(2)}/unit</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ã¢â€â‚¬Ã¢â€â‚¬ YEAR-WISE VIEW Ã¢â€â‚¬Ã¢â€â‚¬ */}
              {analyticsView === 'year' && (
                <div className="space-y-3">
                  <p className={cn('text-[8px] font-black uppercase tracking-widest px-1', isDark ? 'text-white/30' : 'text-slate-400')}>Year-Wise Summary</p>
                  {[
                    { year: '2022Ã¢â‚¬â€œ23', totalKwh: 8450, totalCost: 42250, ponds: 2, cycles: 2, color: '#8b5cf6' },
                    { year: '2023Ã¢â‚¬â€œ24', totalKwh: 11200, totalCost: 56000, ponds: 3, cycles: 2, color: '#0ea5e9' },
                    { year: '2024Ã¢â‚¬â€œ25', totalKwh: 14800, totalCost: 74000, ponds: ponds.filter(p => p.status === 'active').length, cycles: 1, color: '#ef4444' },
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
                            <span className="text-xs">Ã°Å¸â€œâ€ </span>
                          </div>
                          <div>
                            <p className={cn('text-[11px] font-black', isDark ? 'text-white' : 'text-slate-900')}>{yr.year}</p>
                            <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>{yr.ponds} ponds Ã‚Â· {yr.cycles} culture cycle{yr.cycles > 1 ? 's' : ''}</p>
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
                          <p className="text-sm font-black" style={{ color: yr.color }}>Ã¢â€šÂ¹{(yr.totalCost / 1000).toFixed(0)}K</p>
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
                    <p className={cn('text-lg font-black tracking-tighter text-emerald-500 mb-1')}>Ã¢â€šÂ¹18,000 Ã¢â‚¬â€œ Ã¢â€šÂ¹26,000</p>
                    <p className={cn('text-[8px] font-medium leading-relaxed', isDark ? 'text-white/40' : 'text-slate-500')}>
                      By switching to energy-efficient 1.1 kW aerators, running timers (reduce 3h/day), and solar-powered sensors Ã¢â‚¬â€ estimated savings for a 3-pond, 4-acre farm over 12 months.
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
                    { time: '12AM Ã¢â‚¬â€œ 6AM', load: 'MAX', desc: 'Full aerators Ã¢â‚¬â€ DO critical zone before sunrise', icon: Moon, color: '#6366f1', pct: 100 },
                    { time: '6AM Ã¢â‚¬â€œ 10AM', load: 'HIGH', desc: 'Feeding time Ã¢â‚¬â€ keep DO > 5 mg/L', icon: Sun, color: '#10b981', pct: 85 },
                    { time: '10AM Ã¢â‚¬â€œ 4PM', load: 'MED', desc: 'Daylight photosynthesis Ã¢â‚¬â€ reduce 1 aerator', icon: Sun, color: '#f59e0b', pct: 55 },
                    { time: '4PM Ã¢â‚¬â€œ 9PM', load: 'HIGH', desc: 'Feeding window Ã¢â‚¬â€ aerators back up', icon: Wind, color: '#0ea5e9', pct: 80 },
                    { time: '9PM Ã¢â‚¬â€œ 12AM', load: 'HIGH', desc: 'Night DO drop starts Ã¢â‚¬â€ increase aeration', icon: Moon, color: '#8b5cf6', pct: 90 },
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

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ LOAD TAB Ã¢â€â‚¬Ã¢â€â‚¬ */}
          {activeTab === 'load' && (
            <motion.div key="load" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">

              {/* 24hr power profile */}
              <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
                <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5', isDark ? 'text-white/40' : 'text-slate-500')}>
                  <Clock size={10} /> Recommended 24h Power Profile
                </p>
                <div className="space-y-2">
                  {[
                    { time: '12AM Ã¢â‚¬â€œ 6AM', load: 'MAX', desc: 'Full aerators on Ã¢â‚¬â€ DO critical zone', icon: Moon, color: '#6366f1', pct: 100 },
                    { time: '6AM Ã¢â‚¬â€œ 10AM', load: 'HIGH', desc: 'Feeding time Ã¢â‚¬â€ maintain DO > 5 mg/L', icon: Sun, color: '#10b981', pct: 85 },
                    { time: '10AM Ã¢â‚¬â€œ 4PM', load: 'MED', desc: 'Daylight DO recovery Ã¢â‚¬â€ can reduce 1 aerator', icon: Sun, color: '#f59e0b', pct: 60 },
                    { time: '4PM Ã¢â‚¬â€œ 8PM', load: 'HIGH', desc: 'Feeding window Ã¢â‚¬â€ aerators back up', icon: Wind, color: '#0ea5e9', pct: 80 },
                    { time: '8PM Ã¢â‚¬â€œ 12AM', load: 'HIGH', desc: 'Night DO drop starts Ã¢â‚¬â€ increase aeration', icon: Moon, color: '#8b5cf6', pct: 90 },
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
                              <span className="text-[8px]">Ã°Å¸Â¦Â</span>
                              <span className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-800')}>{pond.name}</span>
                              <span className={cn('text-[7px] font-black', isDark ? 'text-white/30' : 'text-slate-400')}>DOC {doc}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black text-amber-500">{dailyUnits.toFixed(0)} kWh/day</span>
                              <span className={cn('text-[8px] font-black', isDark ? 'text-emerald-400' : 'text-emerald-600')}>Ã¢â€šÂ¹{dailyCost.toFixed(0)}</span>
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
                            {aerCount} aerator{aerCount > 1 ? 's' : ''} Â· {kw} kW Â· 20h run time
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
                    { label: 'Daily Cost', value: `Ã¢â€šÂ¹${(todayUnitsEst * RATE_PER_UNIT).toFixed(0)}`, sub: `${todayUnitsEst.toFixed(0)} kWh` },
                    { label: 'Weekly', value: `Ã¢â€šÂ¹${(todayUnitsEst * RATE_PER_UNIT * 7).toFixed(0)}`, sub: '7 days' },
                    { label: 'Monthly', value: `Ã¢â€šÂ¹${(todayUnitsEst * RATE_PER_UNIT * 30 / 1000).toFixed(1)}K`, sub: '30 days' },
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

          {/* __ IoT HUB TAB __ Command Center */}
          {activeTab === 'iot' && (
            <motion.div key="iot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
              <IoTCommandCenter
                devices={devices}
                isDark={isDark}
                onToggleDevice={toggleDevice}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ IoT GUIDE MODAL Ã¢â€â‚¬Ã¢â€â‚¬ */}
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
              <div className={cn('sticky top-0 z-10 flex items-center justify-between px-6 pt-5 pb-4 border-b', isDark ? 'bg-[#0D1824] border-white/10' : 'bg-white border-slate-100')}>
                <div className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isDark ? 'bg-violet-500/15 border border-violet-500/25' : 'bg-violet-100 border border-violet-200')}>
                    <CircuitBoard size={16} className="text-violet-500" />
                  </div>
                  <div>
                    <p className={cn('text-xs font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>IoT Device Guide</p>
                    <p className={cn('text-[8px] font-medium', isDark ? 'text-white/40' : 'text-slate-500')}>Connect sensors & aerator controllers</p>
                  </div>
                </div>
                <button onClick={() => setShowIoTGuide(false)} className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isDark ? 'bg-white/10' : 'bg-slate-100')}>
                  <X size={14} className={isDark ? 'text-white/60' : 'text-slate-600'} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Step-by-step connection guide */}
                <div className="space-y-3">
                  <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>Connection Steps</p>
                  {[
                    {
                      step: '01', title: 'Hardware Requirements',
                      desc: 'Ensure your IoT device has one of these: Wi-Fi 2.4GHz, Bluetooth 4.0+, GSM SIM slot, or RS485 port. Check power supply Ã¢â‚¬â€ most sensors need 5VÃ¢â‚¬â€œ12V DC.',
                      icon: Cpu, color: '#8b5cf6',
                      tips: ['DO/pH Sensor: 5V USB powered', 'Aerator Controller: 12V adapter', 'Auto Feeder: 6 AA batteries or USB'],
                    },
                    {
                      step: '02', title: 'Connect Device to Wi-Fi',
                      desc: 'Power on the device. Hold the setup button 3 seconds until LED blinks blue. Open your phone Wi-Fi, connect to "AquaSensor_XXXX", then enter your farm Wi-Fi name and password.',
                      icon: Wifi, color: '#0ea5e9',
                      tips: ['Use 2.4GHz Wi-Fi Ã¢â‚¬â€ NOT 5GHz', 'Stand within 2m of device during setup', 'Router password: avoid special characters'],
                    },
                    {
                      step: '03', title: 'Pair Sensor to Pond',
                      desc: 'In AquaGrow, go to Smart Farm Ã¢â€ â€™ Add Device. Select the device type, enter its serial number (on label), and assign it to a pond. The sensor will sync live readings in 2Ã¢â‚¬â€œ3 minutes.',
                      icon: CircuitBoard, color: '#10b981',
                      tips: ['Serial number format: AQ-XXXXX-XX', 'Assign ONE sensor per pond', 'For aerators: select all aerator positions'],
                    },
                    {
                      step: '04', title: 'Place Sensor in Pond',
                      desc: 'Lower DO/pH probe 40Ã¢â‚¬â€œ60 cm deep at mid-pond. Do not place near aerator turbulence. Aerator controller mounts on the shed wall with relay wire running to motor.',
                      icon: Droplets, color: '#06b6d4',
                      tips: ['Calibrate pH probe before first use', 'Keep cable above water surface', 'Replace DO membrane every 6 months'],
                    },
                    {
                      step: '05', title: 'Verify Live Reading',
                      desc: 'Go to Water Monitor page. You should see Ã¢â€”Â LIVE badge on the health score widget. If readings show ---, press refresh or re-pair the device. Check signal strength Ã¢â‚¬â€ needs Ã¢â€°Â¥ 60% for stable data.',
                      icon: Activity, color: '#f59e0b',
                      tips: ['Green dot = connected', 'Yellow = weak signal Ã¢â‚¬â€ move router closer', 'Red = offline Ã¢â‚¬â€ check power supply'],
                    },
                    {
                      step: '06', title: 'Enable Auto-Alerts',
                      desc: 'Once connected, AquaGrow automatically sends alerts when DO drops below 4 mg/L, pH goes outside 7Ã¢â‚¬â€œ9, or ammonia exceeds safe limits. Enable push notifications for instant alerts.',
                      icon: Radio, color: '#ef4444',
                      tips: ['Alerts work even when app is closed', 'SMS backup available for low-connectivity areas', 'Set custom thresholds in Pond Settings'],
                    },
                  ].map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={cn('rounded-2xl p-4 border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0" style={{ background: `${step.color}18`, borderColor: `${step.color}30` }}>
                          <step.icon size={16} style={{ color: step.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[7px] font-black px-2 py-0.5 rounded-full text-white uppercase" style={{ background: step.color }}>Step {step.step}</span>
                            <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-800')}>{step.title}</p>
                          </div>
                          <p className={cn('text-[9px] font-medium leading-relaxed mb-2', isDark ? 'text-white/40' : 'text-slate-500')}>{step.desc}</p>
                          <div className="space-y-1">
                            {step.tips.map((tip, ti) => (
                              <div key={ti} className="flex items-start gap-1.5">
                                <span className="text-[8px] mt-0.5" style={{ color: step.color }}>Ã¢â‚¬Âº</span>
                                <p className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-slate-500')}>{tip}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Supported devices */}
                <div className={cn('rounded-2xl p-4 border', isDark ? 'bg-white/4 border-white/8' : 'bg-white border-slate-100')}>
                  <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5', isDark ? 'text-white/40' : 'text-slate-500')}>
                    <Wifi size={10} /> Supported IoT Hardware
                  </p>
                  {[
                    { name: 'DO / pH Combo Probe', protocol: 'Wi-Fi Ã‚Â· RS485', icon: Droplets, color: '#0ea5e9', compatible: true },
                    { name: 'Smart Aerator Controller', protocol: 'Wi-Fi Ã‚Â· Relay', icon: Wind, color: '#10b981', compatible: true },
                    { name: 'Automatic Feeder', protocol: 'BLE Ã‚Â· Wi-Fi', icon: Cpu, color: '#f59e0b', compatible: true },
                    { name: 'Submersible Water Pump', protocol: 'GSM Ã‚Â· Wi-Fi', icon: RefreshCw, color: '#8b5cf6', compatible: true },
                    { name: 'Pond Weather Station', protocol: 'LoRaWAN', icon: Thermometer, color: '#ef4444', compatible: true },
                    { name: 'Underwater CCTV Camera', protocol: 'Wi-Fi Ã‚Â· PoE', icon: Cpu, color: '#64748b', compatible: false },
                  ].map((c, i) => (
                    <div key={i} className={cn('flex items-center gap-3 py-2', i > 0 ? (isDark ? 'border-t border-white/5' : 'border-t border-slate-50') : '')}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${c.color}18` }}>
                        <c.icon size={13} style={{ color: c.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-[10px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-800')}>{c.name}</p>
                        <p className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>{c.protocol}</p>
                      </div>
                      {c.compatible
                        ? <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                        : <span className={cn('text-[7px] font-black px-1.5 py-0.5 rounded-full', isDark ? 'bg-white/8 text-white/30' : 'bg-slate-100 text-slate-400')}>Soon</span>}
                    </div>
                  ))}
                </div>

                {/* Troubleshooting */}
                <div className={cn('rounded-2xl p-4 border space-y-2', isDark ? 'bg-amber-500/8 border-amber-500/20' : 'bg-amber-50 border-amber-200')}>
                  <p className={cn('text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-2', isDark ? 'text-amber-400' : 'text-amber-700')}>
                    <Info size={10} /> Common Troubleshooting
                  </p>
                  {[
                    { problem: 'Device not found during setup', fix: 'Ensure device is in setup mode (blinking blue LED). Factory reset by holding button 10 seconds.' },
                    { problem: 'Signal keeps dropping', fix: 'Move Wi-Fi router closer or use a Wi-Fi repeater near the pond. Avoid metal sheds blocking signal.' },
                    { problem: 'pH reading seems wrong', fix: 'Calibrate probe using pH 4.0 and 7.0 buffer solutions. Rinse probe before each use.' },
                    { problem: 'DO shows 0 mg/L', fix: 'Replace the DO membrane. Ensure probe is submerged at least 30 cm and away from aerator bubbles.' },
                  ].map((item, i) => (
                    <div key={i} className={cn('rounded-xl p-2.5 border', isDark ? 'bg-white/5 border-white/8' : 'bg-white/70 border-amber-100')}>
                      <p className={cn('text-[8px] font-black mb-0.5', isDark ? 'text-white/70' : 'text-slate-700')}>Ã¢Ââ€œ {item.problem}</p>
                      <p className={cn('text-[8px] font-medium leading-snug', isDark ? 'text-white/40' : 'text-slate-500')}>Ã¢â€ â€™ {item.fix}</p>
                    </div>
                  ))}
                </div>
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
