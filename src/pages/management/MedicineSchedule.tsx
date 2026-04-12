import React, { useState, useEffect, useMemo } from 'react';
import { Waves, Plus, Sun, CloudRain, Cloud, Snowflake, TrendingDown, Flame } from 'lucide-react';
import { NoPondState } from '../../components/NoPondState';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  CheckCircle2,
  Star,
  Pill,
  AlertCircle,
  Eye,
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  Calendar,
  Info,
  TrendingUp,
  Clock,
  AlertTriangle,
  Thermometer,
  Wind,
  Droplets,
  Moon,
  Utensils,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import type { Translations } from '../../translations';
import { calculateDOC } from '../../utils/pondUtils';
import { getSOPGuidance, SOPSuggestion } from '../../utils/sopRules';
import { getLunarStatus, getLunarForecast } from '../../utils/lunarUtils';
import { cn } from '../../utils/cn';
import { computeDiseaseRisk, RISK_COLORS, STAGE_META, SEASON_META } from '../../utils/diseaseRiskEngine';

const PRE_STOCKING_PHASE = {
  range: 'Prep Days 1-15',
  label: 'Water & Soil Preparation',
  color: 'bg-indigo-500',
  textColor: 'text-indigo-600',
  bgLight: 'bg-indigo-50',
  borderColor: 'border-indigo-200',
  meds: [
    { name: 'Pond Drying & Tilling', dose: '—', brand: 'Soil Exposure', freq: 'Start Day', priority: 'HIGH' },
    { name: 'Chlorine Treatment', dose: '30ppm', brand: 'TCC 90%', freq: 'Day 5', priority: 'HIGH' },
    { name: 'Dolomite / Lime', dose: '500kg/acre', brand: 'Dolomite', freq: 'Adjust pH', priority: 'MEDIUM' },
    { name: 'Bloom Developer', dose: 'Fermented Juice', brand: 'Molasses + Probiotic', freq: '7 Days before stock', priority: 'HIGH' },
  ],
};

// Full SOP cycle overview data (for the "Culture Timeline" card)
const SOP_CYCLE_PHASES = [
  {
    range: 'DOC 1–10',
    label: 'Early Establishment',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    meds: [
      { name: 'Gut Probiotic Foundation', dose: '5g / kg feed', brand: 'Daily Mix', priority: 'HIGH' },
      { name: 'Stress Booster (DOC 1-3)', dose: 'Vit C + Betaine', brand: '', freq: 'Daily', priority: 'HIGH' },
      { name: 'Water Probiotic', dose: '250 g/acre', brand: 'Bioclean Aqua Plus', freq: 'DOC 5 & 10', priority: 'MEDIUM' },
      { name: 'Mineral Supplement', dose: '10 kg/acre', brand: '', freq: 'DOC 7', priority: 'MEDIUM' },
    ],
  },
  {
    range: 'DOC 11–20',
    label: 'Growth Spurt',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
    meds: [
      { name: 'Gut Probiotic Foundation', dose: '5g / kg feed', brand: '', freq: 'Daily', priority: 'HIGH' },
      { name: 'Water Probiotic', dose: '250 g/acre', brand: '', freq: 'DOC 15 & 20', priority: 'MEDIUM' },
      { name: 'Mineral Supplement', dose: '10 kg/acre', brand: '', freq: 'DOC 14', priority: 'MEDIUM' },
      { name: 'Vitamin C Booster', dose: 'High Dose', brand: '', freq: 'DOC 15 only', priority: 'HIGH' },
    ],
  },
  {
    range: 'DOC 21–30',
    label: 'Risk Stage',
    color: 'bg-amber-500',
    textColor: 'text-amber-600',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
    meds: [
      { name: 'Water Probiotic', dose: '300 g/acre', brand: '', freq: 'Alternate days', priority: 'HIGH' },
      { name: 'Immunity Booster', dose: 'High Dose', brand: '', freq: 'DOC 25 only', priority: 'MEDIUM' },
    ],
  },
  {
    range: 'DOC 31–45',
    label: '⚠ Critical Stage',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgLight: 'bg-red-50',
    borderColor: 'border-red-200',
    meds: [
      { name: 'Water Probiotic', dose: '400 g/acre', brand: '', freq: 'Every 3 days', priority: 'HIGH' },
      { name: 'Anti-Stress Tonic', dose: 'Normal', brand: '', freq: 'DOC 30–35', priority: 'MEDIUM' },
      { name: 'Vitamin + Mineral Booster', dose: 'Boost', brand: '', freq: 'DOC 40 only', priority: 'HIGH' },
    ],
  },
  {
    range: 'DOC 46–80',
    label: 'Peak Growth',
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    bgLight: 'bg-purple-50',
    borderColor: 'border-purple-200',
    meds: [
      { name: 'Liver Tonic', dose: 'Normal', brand: '', freq: 'DOC 50 only', priority: 'HIGH' },
      { name: 'Mineral Mix', dose: '15–20 kg/acre', brand: '', freq: 'Continuous', priority: 'MEDIUM' },
    ],
  },
  {
    range: 'DOC 81–100',
    label: 'Harvest Stage',
    color: 'bg-[#C78200]',
    textColor: 'text-[#C78200]',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
    meds: [
      { name: 'Stop heavy medicines', dose: '—', brand: 'Clean water only', priority: 'HIGH' },
    ],
  },
];

const getIconForType = (type: string) => {
  switch (type) {
    case 'MEDICINE': return Pill;
    case 'ALERT': return AlertTriangle;
    case 'LUNAR': return Star;
    case 'RULE': return Info;
    case 'TIP': return TrendingUp;
    case 'FEED': return Utensils;
    default: return Pill;
  }
};

// ─── Medicine Cost Estimator ─────────────────────────────────────────────────
const MEDICINE_UNIT_COSTS: Record<string, number> = {
  'Gut Probiotic Foundation': 120,
  'Gut Probiotic': 120,
  'Gut Probiotic (Pulse)': 120,
  'Gut Probiotic (Risk Management)': 120,
  'Gut Probiotic (Shield)': 130,
  'Gut Probiotics (Absorption)': 130,
  'Gut Probiotic (Stability Maintenance)': 100,
  'Water Probiotic': 90,
  'Water Probiotic (Foundation)': 90,
  'Water Probiotic (Maintenance)': 90,
  'Water Probiotic (Pathogen Control)': 110,
  'Water Probiotic (Intensive)': 100,
  'Water Probiotic (Regular)': 90,
  'Water Probiotic (Flush)': 85,
  'Mineral Mix': 80,
  'Mineral Mix (Hardening)': 90,
  'Mineral Pulse': 80,
  'Mineral Supplement': 75,
  'Vitamin C Booster': 180,
  'Vitamin C Anti-Stress (Heat)': 200,
  'Vitamin + Mineral Booster': 220,
  'Late Immunity Booster': 200,
  'Immunity Booster Pulse': 190,
  'Anti-Stress Tonic': 160,
  'Liver Tonic (Hepatopancreas)': 250,
  'Light Probiotic maintenance': 70,
  'pH Correction — Zeolite/Organic Acid': 100,
  'pH Stabilizer — Dolomite Lime': 60,
  'Emergency Zeolite Application': 100,
  'Zeolite': 100,
  'Soil Liming (Dolomite)': 60,
  'Water Color Bloom (Organic)': 120,
  'Monday → Mineral Mix': 80,
  'Tuesday → Water Probiotic': 90,
  'Wednesday → Gut Probiotic': 120,
  'Thursday → Water Probiotic': 90,
  'Friday → Mineral Mix': 80,
  'Saturday → Immunity Booster': 190,
  'Vitamin C': 180,
};

const estimateMedicineCost = (name: string, pondAcreage: number = 1): number => {
  const base = MEDICINE_UNIT_COSTS[name] ?? 100;
  // Scale with pond size (most treatments are per-acre)
  return Math.round(base * Math.max(1, pondAcreage));
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'HIGH': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'LOW': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  }
};

const getTypeAccent = (type: string) => {
  switch (type) {
    case 'MEDICINE': return 'text-emerald-500 bg-emerald-500/10';
    case 'ALERT': return 'text-red-500 bg-red-500/10';
    case 'LUNAR': return 'text-indigo-500 bg-indigo-500/10';
    case 'RULE': return 'text-blue-500 bg-blue-500/10';
    case 'TIP': return 'text-[#C78200] bg-[#C78200]/10';
    case 'FEED': return 'text-amber-600 bg-amber-500/10';
    default: return 'text-emerald-500 bg-emerald-500/10';
  }
};

const getCurrentPhaseIndex = (doc: number) => {
  if (doc <= 0) return -1;
  if (doc >= 1 && doc <= 10) return 0;
  if (doc >= 11 && doc <= 20) return 1;
  if (doc >= 21 && doc <= 30) return 2;
  if (doc >= 31 && doc <= 45) return 3;
  if (doc >= 46 && doc <= 80) return 4;
  if (doc >= 81) return 5;
  return -1;
};

const getNextMilestone = (doc: number): { doc: number; label: string } | null => {
  const milestones = [
    { doc: 3, label: 'Water Probiotic (1st)' },
    { doc: 10, label: 'End of Establishment Phase' },
    { doc: 15, label: 'Vitamin C Booster' },
    { doc: 21, label: 'Risk Stage Begins' },
    { doc: 25, label: 'Immunity Booster & Vibriosis Check' },
    { doc: 31, label: 'CRITICAL STAGE – Max Aeration' },
    { doc: 40, label: 'Vitamin + Mineral Booster' },
    { doc: 50, label: 'Liver Tonic Day' },
    { doc: 81, label: 'Wind-Down / Harvest Prep' },
  ];
  return milestones.find(m => m.doc > doc) || null;
};

// ─── Lunar helpers ───────────────────────────────────────────────────────────
const MOON_META = {
  AMAVASYA: {
    emoji: '🌑',
    label: 'Amavasya — New Moon',
    sublabel: 'CRITICAL HIGH RISK',
    bg: 'bg-black',
    border: 'border-indigo-500/50',
    textColor: 'text-indigo-400',
    badge: 'bg-red-500/20 text-red-300 border-red-400/30',
    rules: [
      '🔴 Reduce feed by 20–30% tonight',
      '🔵 Run ALL aerators through the night',
      '💊 Apply Mineral Mix (High Dose) — morning only',
      '💊 Apply Vitamin C / Immunity boost — morning only',
      '⚠️ Do NOT apply probiotics after 6 PM',
    ],
  },
  ASHTAMI: {
    emoji: '🌓',
    label: 'Ashtami — Molting Begins',
    sublabel: 'SEQUENCE START: 48HR STRESS',
    bg: 'bg-violet-950',
    border: 'border-violet-800/40',
    textColor: 'text-violet-300',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    rules: [
      '🟡 Initial molting stress begins tonight',
      '🟡 Reduce feed by 10% today',
      '🔵 Start intensive aeration (Morning & Night)',
      '💊 Apply Minerals (Evening) for shell hardening',
    ],
  },
  NAVAMI: {
    emoji: '🌙',
    label: 'Navami — Peak Recovery',
    sublabel: 'CRITICAL VIGILANCE',
    bg: 'bg-[#0B1A2E]',
    border: 'border-sky-500/30',
    textColor: 'text-sky-300',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    rules: [
      '🟠 Maximum vigilance for molting recovery tonight',
      '🟠 Watch for soft-shell / slow feeders',
      '🟡 Reduce feed by 15% today if mortality seen',
      '💊 Apply Immunity boosters (Morning)',
      '🔵 Maintain Max Aeration through 2 AM',
    ],
  },
  NORMAL: {
    emoji: '🌕',
    label: 'Normal Moon Phase',
    sublabel: 'SAFE PERIOD',
    bg: 'bg-[#0D523C]',
    border: 'border-emerald-800/40',
    textColor: 'text-emerald-300',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    rules: [
      '✅ Standard feeding schedule applies',
      '✅ Apply medicines as per DOC SOP',
      '💡 Best time to apply: 7–9 AM or 4–6 PM',
    ],
  },
  POURNAMI: {
    emoji: '🌕',
    label: 'Pournami — Full Moon',
    sublabel: 'HIGH BIOLOGICAL DEMAND',
    bg: 'bg-[#1A1C3E]',
    border: 'border-indigo-500/40',
    textColor: 'text-indigo-200',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
    rules: [
      '🔵 High biological activity tonight',
      '🔵 Increase aeration levels (100% capacity)',
      '🟡 Monitor DO levels afternoon & midnight',
      '💊 Mineral application suggested for partial molting',
    ],
  },
};
// ─────────────────────────────────────────────────────────────────────────────

// ─── Season / Weather helpers ────────────────────────────────────────────────
const getCurrentSeason = () => {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 6) return { label: 'Summer', emoji: '☀️', icon: Sun, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20', risk: 'High Temp · Low DO · Vibriosis risk' };
  if (m >= 7 && m <= 10) return { label: 'Monsoon', emoji: '🌧️', icon: CloudRain, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', risk: 'Salinity drops · WSSV peak season' };
  return { label: 'Winter', emoji: '❄️', icon: Snowflake, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20', risk: 'Low temp · WSSV trigger zone' };
};

const getMedicineImportance = (title: string, doc: number, priority: string): 'URGENT' | 'IMPORTANT' | 'ROUTINE' => {
  const isCritSOP = priority === 'HIGH' || priority === 'CRITICAL';
  const isRiskDOC = (doc >= 31 && doc <= 45) || doc >= 75;
  if (isCritSOP && isRiskDOC) return 'URGENT';
  if (isCritSOP || isRiskDOC) return 'IMPORTANT';
  return 'ROUTINE';
};
// ─────────────────────────────────────────────────────────────────────────────

export const MedicineSchedule = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const { ponds, addMedicineLog, medicineLogs, waterRecords, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  // Only show active / planned ponds — no SOPs for harvested/sold ponds
  const activePonds = ponds.filter(p => p.status === 'active' || p.status === 'planned');
  const [selectedPondId, setSelectedPondId] = useState(activePonds[0]?.id || ponds[0]?.id || '');
  const [completedMeds, setCompletedMeds] = useState<string[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'diseases' | 'cycle' | 'lunar' | 'my_sop'>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // ── Custom farmer medicine SOPs (persisted per pond) ──────────────────────────
  // Farmers enter their own medicine types + rates → shown as SOP cards
  interface FarmerSOP {
    id: string;
    name: string;
    type: 'probiotic' | 'mineral' | 'vitamin' | 'antibiotic' | 'feed_additive' | 'other';
    rate: number;          // price per kg or litre
    unit: 'kg' | 'L' | 'g' | 'ml' | 'packet';
    dosePerAcre: string;   // e.g. "250g" or "1 packet"
    docRange: string;      // e.g. "1-30" or "every 5 days"
    notes: string;
  }

  const FARMER_SOP_KEY = `aqua_farmer_sops_${selectedPondId || 'global'}`;
  const [farmerSOPs, setFarmerSOPs] = useState<FarmerSOP[]>(() => {
    try { return JSON.parse(localStorage.getItem(FARMER_SOP_KEY) || '[]'); } catch { return []; }
  });
  const [showSOPForm, setShowSOPForm] = useState(false);
  const [sopForm, setSOPForm] = useState({
    name: '', type: 'probiotic' as FarmerSOP['type'],
    rate: '', unit: 'kg' as FarmerSOP['unit'],
    dosePerAcre: '', docRange: '', notes: '',
  });

  const saveSOPs = (list: FarmerSOP[]) => {
    setFarmerSOPs(list);
    localStorage.setItem(FARMER_SOP_KEY, JSON.stringify(list));
  };

  const addFarmerSOP = () => {
    if (!sopForm.name.trim() || !sopForm.rate) return;
    const entry: FarmerSOP = {
      id: Date.now().toString(),
      name: sopForm.name.trim(),
      type: sopForm.type,
      rate: parseFloat(sopForm.rate),
      unit: sopForm.unit,
      dosePerAcre: sopForm.dosePerAcre,
      docRange: sopForm.docRange,
      notes: sopForm.notes,
    };
    saveSOPs([...farmerSOPs, entry]);
    setSOPForm({ name: '', type: 'probiotic', rate: '', unit: 'kg', dosePerAcre: '', docRange: '', notes: '' });
    setShowSOPForm(false);
  };

  const deleteFarmerSOP = (id: string) => saveSOPs(farmerSOPs.filter(s => s.id !== id));

  const TYPE_META: Record<FarmerSOP['type'], { emoji: string; color: string }> = {
    probiotic: { emoji: '🦠', color: '#10B981' },
    mineral: { emoji: '💎', color: '#3B82F6' },
    vitamin: { emoji: '💊', color: '#8B5CF6' },
    antibiotic: { emoji: '🔬', color: '#EF4444' },
    feed_additive: { emoji: '🌿', color: '#F59E0B' },
    other: { emoji: '📦', color: '#6B7280' },
  };


  const selectedPond = ponds.find(p => p.id === selectedPondId);
  const currentDoc = selectedPond ? calculateDOC(selectedPond.stockingDate) : 0;

  // Season context
  const season = useMemo(() => getCurrentSeason(), []);

  // Data-Driven Risk Analysis
  const pondWaterRecords = useMemo(() =>
    waterRecords
      .filter(r => r.pondId === selectedPond?.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [waterRecords, selectedPond?.id]
  );
  const latestRead = pondWaterRecords[0];
  const isDOCRisk = (currentDoc > 30 && currentDoc < 45) || currentDoc > 75;
  const isWaterRisk = latestRead && (latestRead.do < 4.0 || latestRead.ph > 8.5 || latestRead.temp > 31);
  const riskLevel = (isDOCRisk && isWaterRisk) ? 'CRITICAL' : (isDOCRisk || isWaterRisk) ? 'HIGH' : 'STABLE';

  // Compliance streak — consecutive days with ≥1 medicine logged
  const complianceStreak = useMemo(() => {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 30; i++) {
      const key = new Date(d.getTime() - i * 86400000).toISOString().split('T')[0];
      const hasLog = medicineLogs.some(l => l.pondId === selectedPondId && l.date?.startsWith(key));
      if (hasLog) streak++; else if (i > 0) break;
    }
    return streak;
  }, [medicineLogs, selectedPondId]);

  // Disease risk report — computed once
  const diseaseRiskReport = useMemo(() => computeDiseaseRisk({
    doc: currentDoc,
    temperature: latestRead?.temp,
    doLevel: latestRead?.do,
    ammonia: latestRead?.ammonia,
    ph: latestRead?.ph,
  }), [currentDoc, latestRead]);

  // Lunar forecast for the planner (Extended to 40 days to ensure full culture-cycle coverage)
  const lunarForecast = React.useMemo(() => getLunarForecast(new Date(), 40), []);

  // ─── Simple 4-Day Aligned Forecast (Starting Today) ───
  const compactLunarForecast = React.useMemo(() => {
    if (!selectedPond?.stockingDate) return [];

    const stockingDate = new Date(selectedPond.stockingDate);
    const forecast: any[] = [];

    // Show 32 days (8 rows of 4 days) starting from TODAY to ensure full month coverage
    for (let i = 0; i < 32; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      targetDate.setHours(12, 0, 0, 0);

      const targetDoc = calculateDOC(selectedPond.stockingDate, targetDate.toISOString());

      forecast.push({
        date: targetDate,
        doc: targetDoc,
        status: getLunarStatus(targetDate)
      });
    }
    return forecast;
  }, [selectedPond?.stockingDate, currentDoc]);

  // ─── SYNC ACTIVE POND SELECTION ───────────────────────────────────────────
  useEffect(() => {
    if (!selectedPondId && ponds.length > 0) {
      setSelectedPondId(activePonds[0]?.id || ponds[0]?.id || "");
    }
  }, [ponds, selectedPondId]);

  // Filter logs for this specific pond to show the count
  const pondMedicineLogs = medicineLogs.filter(l => l.pondId === selectedPondId);

  // Lunar status — computed once at render
  const lunar = getLunarStatus(selectedDate);
  const moonMeta = MOON_META[lunar.phase];
  const isHighRiskMoon = lunar.phase !== 'NORMAL';

  // Use the proper sopRules.ts with day-of-week
  const todayGuidance: SOPSuggestion[] = (selectedPond?.status === 'planned' || currentDoc >= 0)
    ? getSOPGuidance(selectedPond?.status === 'planned' ? -1 : currentDoc, selectedDate).filter(s => {
      if (s.type === 'RULE' && s.title === 'Amavasya Tip') return false;
      // If planned, show prep medicines + lunar/weekly model
      if (selectedPond?.status === 'planned') {
        return s.category === 'WATER' || s.applicationType === 'WATER' || s.type === 'RULE' || s.type === 'LUNAR' || s.priority === 'HIGH';
      }
      return true;
    })
    : [];

  const currentPhaseIdx = getCurrentPhaseIndex(currentDoc);
  const nextMilestone = getNextMilestone(currentDoc);

  const toggleMed = (name: string) => {
    setCompletedMeds(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  // ── Pond acreage for cost estimation
  const pondAcreage = Number((selectedPond as any)?.farmSize) || 1;

  // ── Cost for each selected medicine
  const selectedCosts = completedMeds.map(name => ({
    name,
    cost: estimateMedicineCost(name, pondAcreage),
  }));
  const totalEstimatedCost = selectedCosts.reduce((a, c) => a + c.cost, 0);

  const handleLog = async () => {
    if (completedMeds.length === 0 || !selectedPond) return;
    setIsLogging(true);

    try {
      const logPromises = completedMeds.map(medName => {
        const guidance = todayGuidance.find(g => g.title === medName);
        const estimatedCost = estimateMedicineCost(medName, pondAcreage);
        return addMedicineLog({
          pondId: selectedPond.id,
          date: new Date().toISOString(),
          name: medName,
          dosage: guidance?.dose || 'As per SOP',
          doc: currentDoc,
          cost: estimatedCost,   // ← feeds into ROI expense tracking
        });
      });

      await Promise.all(logPromises);
      setCompletedMeds([]);
    } catch (error) {
      console.error('Error logging medication:', error);
      alert('Failed to save logs. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  // ── Medicine compliance tracker
  const today = new Date().toISOString().split('T')[0];
  const pondMedLogs = medicineLogs?.filter((l: any) => l.pondId === selectedPondId) || [];
  const todayMedLogs = pondMedLogs.filter((l: any) => l.date?.startsWith(today));
  const last7DaysMeds = pondMedLogs.filter((l: any) => {
    const d = new Date(l.date); const w = new Date(); w.setDate(w.getDate() - 7);
    return d >= w;
  }).length;
  const isCritical = currentDoc >= 31 && currentDoc <= 45;
  const isWithdrawal = currentDoc >= 90;
  const isApproachingWithdrawal = currentDoc >= 83 && currentDoc < 90;
  const isPrestocking = selectedPond?.status === 'planned';

  const getSituationTag = () => {
    if (selectedPond?.status === 'harvested') return { label: 'HARVESTED — NO SOP', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', emoji: '✅' };
    if (isWithdrawal) return { label: 'WITHDRAWAL PHASE', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', emoji: '🚫' };
    if (isApproachingWithdrawal) return { label: 'PRE-HARVEST CARE', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', emoji: '⏰' };
    if (isCritical) return { label: 'CRITICAL STAGE', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', emoji: '🦠' };
    if (currentDoc >= 20 && currentDoc <= 30) return { label: 'VIBRIOSIS WINDOW', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', emoji: '🔬' };
    return { label: 'STANDARD PROTOCOL', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', emoji: '✅' };
  };
  const situationTag = getSituationTag();

  return (
    <div className="pb-40 bg-transparent min-h-screen text-left relative overflow-hidden">
      {/* ── Page Accents ── */}
      <div className="absolute top-10 right-[-10%] w-[70%] h-[30%] bg-purple-100/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-[10%] left-[-10%] w-[60%] h-[40%] bg-emerald-50/10 rounded-full blur-[120px] -z-10" />
      {/* Sync Success Overlay */}
      <AnimatePresence>
        {isLogging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0D523C]/97 backdrop-blur-xl flex flex-col items-center justify-center text-white"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-32 h-32 bg-card rounded-[2.5rem] flex items-center justify-center text-[#0D523C] shadow-2xl mb-4"
            >
              <ShieldCheck size={64} />
            </motion.div>
            <h3 className="text-3xl font-black tracking-tighter mb-2">Logs Synced!</h3>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Pond health history updated</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Header */}
      <Header
        title={t.medicine}
        showBack={false}
        onMenuClick={onMenuClick}
        rightElement={
          selectedPond && selectedPond.stockingDate && (
            <div className={cn(
              currentDoc > 30 && currentDoc <= 45 ? 'bg-red-500/10 border-red-500/20' : 'bg-primary/10 border-primary/20'
            )}>
              <span className={cn(
                'text-[9px] font-black uppercase tracking-widest whitespace-nowrap',
                currentDoc > 30 && currentDoc <= 45 ? 'text-red-400' : 'text-primary'
              )}>
                {selectedPond.status === 'planned' ? `PREP: ${Math.abs(currentDoc)}d to stock` : `DOC: ${currentDoc}`}
              </span>
            </div>
          )
        }
      />

      <div className="pt-[calc(env(safe-area-inset-top)+6.5rem)] px-5 space-y-5">
        {/* Pond Selector Tabs */}
        {activePonds.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {activePonds.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedPondId(p.id); setCompletedMeds([]); }}
                className={cn(
                  'px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex-shrink-0 flex items-center gap-2',
                  selectedPondId === p.id
                    ? 'bg-[#0D523C] text-white border-[#0D523C] shadow-lg'
                    : p.status === 'harvested'
                      ? 'bg-card text-ink/20 border-card-border line-through'
                      : 'bg-card text-ink/40 border-card-border'
                )}
              >
                {p.name}
                {p.status === 'harvested' && <span className="text-[7px] font-black bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full no-underline">Done</span>}
              </button>
            ))}
          </div>
        ) : (
          /* No Ponds Empty State */
          <div className="mt-8">
            <NoPondState
              isDark={false}
              subtitle="Add a pond to start tracking your daily medicine and SOP schedule."
            />
          </div>
        )}

        {activePonds.length > 0 && selectedPond && (
          <>
            {/* ─── MEDICINE INTELLIGENCE HERO ─── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
              style={{
                background: isPrestocking
                  ? 'linear-gradient(135deg, #0e1a3a 0%, #1a3a5c 100%)'
                  : isCritical
                    ? 'linear-gradient(135deg, #1a0510 0%, #7c1010 50%, #1a0510 100%)'
                    : isWithdrawal
                      ? 'linear-gradient(135deg, #1a0a00 0%, #92400e 100%)'
                      : riskLevel === 'CRITICAL'
                        ? 'linear-gradient(135deg, #0f0a1e 0%, #4c1d95 100%)'
                        : 'linear-gradient(135deg, #022c22 0%, #0D523C 80%, #065f46 100%)'
              }}
            >
              {/* ── Ambient glow ── */}
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[80px] pointer-events-none"
                style={{ background: isCritical ? 'rgba(239,68,68,0.25)' : isWithdrawal ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.15)' }} />

              <div className="p-5 relative z-10">
                {/* ── Row 1: Pond name + DOC ── */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white/30 text-[7px] font-black uppercase tracking-[0.35em] mb-1">
                      Medicine Command Center
                    </p>
                    <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-2">
                      {selectedPond.name}
                    </h2>
                    {/* Situation tag */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-[7px] font-black px-2.5 py-1 rounded-full border', situationTag.bg, situationTag.color)}>
                        {situationTag.emoji} {situationTag.label}
                      </span>
                      {/* Compliance streak badge */}
                      {complianceStreak > 0 && (
                        <span className="text-[7px] font-black px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300">
                          🔥 {complianceStreak}-Day Streak
                        </span>
                      )}
                    </div>
                  </div>
                  {/* DOC number */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-white/25 text-[6px] font-black uppercase tracking-widest">
                      {isPrestocking ? 'Prep Days' : 'Culture Day'}
                    </p>
                    <p className={cn('text-5xl font-black tracking-tighter leading-none',
                      isCritical ? 'text-red-300' : isWithdrawal ? 'text-amber-300' : 'text-white'
                    )}>
                      {isPrestocking ? Math.abs(currentDoc) : currentDoc}
                    </p>
                    <p className="text-[6px] font-black text-white/25 uppercase tracking-widest mt-1">DOC</p>
                  </div>
                </div>

                {/* ── Row 2: DOC Progress bar ── */}
                {!isPrestocking && (
                  <div className="mb-4">
                    <div className="flex justify-between text-[5px] font-black text-white/20 uppercase tracking-widest mb-1">
                      <span>DOC 1</span>
                      <span className="text-white/40">Risk Zone →</span>
                      <span>DOC 100</span>
                    </div>
                    {/* Multi-zone progress bar */}
                    <div className="relative h-2.5 bg-white/10 rounded-full overflow-hidden">
                      {/* Zone markers */}
                      <div className="absolute top-0 left-[30%] w-px h-full bg-amber-400/30 z-10" />
                      <div className="absolute top-0 left-[45%] w-px h-full bg-red-400/30 z-10" />
                      <div className="absolute top-0 left-[90%] w-px h-full bg-orange-400/30 z-10" />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (currentDoc / 100) * 100)}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className={cn('h-full rounded-full',
                          isCritical ? 'bg-gradient-to-r from-red-400 to-red-600' :
                            isWithdrawal ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                              currentDoc < 31 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                'bg-gradient-to-r from-emerald-400 to-amber-400'
                        )}
                      />
                    </div>
                    {/* Context labels */}
                    {isCritical && (
                      <p className="text-[7px] font-black text-red-300 mt-1.5 flex items-center gap-1 animate-pulse">
                        <span>⚠️</span> Peak WSSV Risk Window (DOC 31–45) — Maximum vigilance required
                      </p>
                    )}
                    {isWithdrawal && (
                      <p className="text-[7px] font-black text-amber-300 mt-1.5">
                        🚫 Withdrawal phase — Stop all heavy medicines. Harvest window active.
                      </p>
                    )}
                    {isApproachingWithdrawal && (
                      <p className="text-[7px] font-black text-amber-300 mt-1.5">
                        ⏰ Withdrawal in {90 - currentDoc} days — Start planning harvest logistics now
                      </p>
                    )}
                  </div>
                )}

                {/* ── Row 3: 4-pillar Situation Intelligence Strip ── */}
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5 mb-4 -mx-1 px-1">
                  {[
                    {
                      icon: moonMeta.emoji,
                      label: 'Moon',
                      value: lunar.phase === 'NORMAL' ? 'Normal' : lunar.phase,
                      sub: lunar.phase !== 'NORMAL' ? '⚠ Manage feed' : `↓ Amavasya in ${lunar.daysToAmavasya}d`,
                      urgent: lunar.phase !== 'NORMAL' && lunar.phase !== 'POURNAMI',
                      bg: lunar.phase !== 'NORMAL' ? 'bg-indigo-500/15 border-indigo-400/20' : 'bg-white/5 border-white/8',
                    },
                    {
                      icon: season.emoji,
                      label: 'Season',
                      value: season.label,
                      sub: season.risk.split('·')[0].trim(),
                      urgent: season.label === 'Monsoon',
                      bg: season.label === 'Monsoon' ? 'bg-blue-500/15 border-blue-400/20' : season.label === 'Summer' ? 'bg-orange-500/15 border-orange-400/20' : 'bg-white/5 border-white/8',
                    },
                    {
                      icon: diseaseRiskReport.overallRisk === 'CRITICAL' ? '🔴' : diseaseRiskReport.overallRisk === 'HIGH' ? '🟠' : diseaseRiskReport.overallRisk === 'MODERATE' ? '🟡' : '🟢',
                      label: 'Disease Risk',
                      value: diseaseRiskReport.overallRisk,
                      sub: diseaseRiskReport.topRisks[0]?.shortName || 'Stable',
                      urgent: diseaseRiskReport.overallRisk === 'CRITICAL' || diseaseRiskReport.overallRisk === 'HIGH',
                      bg: (diseaseRiskReport.overallRisk === 'CRITICAL' || diseaseRiskReport.overallRisk === 'HIGH') ? 'bg-red-500/15 border-red-400/20' : 'bg-white/5 border-white/8',
                    },
                    {
                      icon: !latestRead ? '📊' : latestRead.do < 4 ? '🚨' : latestRead.ph > 8.5 ? '⚠️' : '✅',
                      label: 'Water',
                      value: !latestRead ? 'No data' : latestRead.do < 4 ? 'DO Critical' : latestRead.ph > 8.5 ? 'pH High' : 'Normal',
                      sub: latestRead ? `DO: ${latestRead.do?.toFixed(1) ?? '—'} · pH: ${latestRead.ph?.toFixed(1) ?? '—'}` : 'Log water data',
                      urgent: !!latestRead && (latestRead.do < 4 || latestRead.ph > 8.5),
                      bg: (latestRead && (latestRead.do < 4 || latestRead.ph > 8.5)) ? 'bg-red-500/15 border-red-400/20' : 'bg-white/5 border-white/8',
                    },
                  ].map((pill, i) => (
                    <div key={i} className={cn(
                      'flex-shrink-0 rounded-2xl px-3 py-2.5 border min-w-[90px] transition-all',
                      pill.bg
                    )}>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-sm leading-none">{pill.icon}</span>
                        <p className="text-white/30 text-[5px] font-black uppercase tracking-widest">{pill.label}</p>
                        {pill.urgent && <span className="w-1 h-1 bg-red-400 rounded-full animate-pulse ml-auto" />}
                      </div>
                      <p className={cn('text-[9px] font-black leading-none mt-0.5',
                        pill.urgent ? 'text-red-300' : 'text-white/80'
                      )}>{pill.value}</p>
                      <p className="text-white/25 text-[6px] font-medium mt-0.5 leading-tight">{pill.sub}</p>
                    </div>
                  ))}
                </div>

                {/* ── Row 4: Stats + "Why Today Matters" ── */}
                <div className="pt-3 border-t border-white/10">
                  {/* Why today matters — contextual message */}
                  {(() => {
                    let msg = '';
                    if (isCritical) msg = '🦠 WSSV risk peaks now. Every medicine applied today reduces crop loss probability by up to 40%.';
                    else if (isWithdrawal) msg = '🌾 Harvest window open. Stop heavy medicines, check residue clearance and book logistics.';
                    else if (diseaseRiskReport.overallRisk === 'HIGH' || diseaseRiskReport.overallRisk === 'CRITICAL')
                      msg = `⚡ ${diseaseRiskReport.topRisks[0]?.name} risk is elevated at DOC ${currentDoc}. Today's SOP is your shield.`;
                    else if (lunar.phase === 'AMAVASYA') msg = '🌑 Amavasya tonight — shrimp are molting. Reduce feed, maximize aeration, apply minerals.';
                    else if (complianceStreak >= 7) msg = `🔥 ${complianceStreak}-day streak! Consistent medicine logging leads to 20%+ better FCR outcomes.`;
                    else if (isPrestocking) msg = '🏗️ Preparation phase. Clean pond = healthy crop. Follow soil and water SOP strictly before stocking.';
                    else msg = `✅ DOC ${currentDoc} — normal growth phase. Apply today's SOP protocol to maintain crop health.`;

                    return (
                      <div className="mb-3 px-1">
                        <p className="text-white/50 text-[8px] font-medium leading-relaxed italic">{msg}</p>
                      </div>
                    );
                  })()}

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      {
                        label: 'Streak',
                        value: complianceStreak > 0 ? `${complianceStreak}d 🔥` : '—',
                        color: complianceStreak >= 7 ? 'text-yellow-300' : complianceStreak > 0 ? 'text-emerald-400' : 'text-red-400',
                      },
                      {
                        label: 'Today',
                        value: todayMedLogs.length,
                        color: todayMedLogs.length > 0 ? 'text-emerald-400' : 'text-white/40',
                      },
                      {
                        label: '7-Day',
                        value: last7DaysMeds,
                        color: last7DaysMeds > 3 ? 'text-emerald-400' : last7DaysMeds > 0 ? 'text-amber-400' : 'text-red-400',
                      },
                      {
                        label: 'Remaining',
                        value: isWithdrawal ? '🚫' : Math.max(0, 100 - currentDoc),
                        color: isWithdrawal ? 'text-red-400' : currentDoc > 90 ? 'text-amber-400' : 'text-white',
                      },
                    ].map((m, i) => (
                      <div key={i} className="text-center bg-white/5 rounded-xl py-2">
                        <p className={cn('text-base font-black leading-none', m.color)}>{m.value}</p>
                        <p className="text-[5px] font-black text-white/25 uppercase tracking-widest mt-1">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>




            {/* ══════════════════════════════════════════════════════
                TAB NAVIGATION — immediately below hero
            ══════════════════════════════════════════════════════ */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {([
                { id: 'today', label: "Today's SOP", emoji: '💊' },
                { id: 'diseases', label: 'Disease Alerts', emoji: '🦠' },
                { id: 'cycle', label: 'Full Cycle', emoji: '📅' },
                { id: 'lunar', label: 'Lunar', emoji: '🌙' },
                { id: 'my_sop', label: 'My SOP', emoji: '🧪' },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex-shrink-0 flex items-center gap-1.5 py-2.5 px-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap',
                    (activeTab as string) === tab.id
                      ? tab.id === 'my_sop'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                        : tab.id === 'diseases' && (diseaseRiskReport.overallRisk === 'CRITICAL' || diseaseRiskReport.overallRisk === 'HIGH')
                          ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-900/30'
                          : 'bg-[#0D523C] text-white border-[#0D523C] shadow-lg'
                      : isDark
                        ? 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/70'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  )}
                >
                  <span className="text-[11px]">{tab.emoji}</span>
                  {tab.label}
                  {/* Urgent indicator badges */}
                  {tab.id === 'diseases' && (diseaseRiskReport.overallRisk === 'CRITICAL' || diseaseRiskReport.overallRisk === 'HIGH') && (
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                  )}
                  {tab.id === 'today' && todayMedLogs.length === 0 && currentDoc > 0 && !isPrestocking && (
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                  )}
                  {tab.id === 'lunar' && lunar.phase !== 'NORMAL' && (
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                  )}
                  {tab.id === 'my_sop' && farmerSOPs.length > 0 && (
                    <span className="bg-purple-500 text-white text-[6px] font-black px-1.5 py-0.5 rounded-full">{farmerSOPs.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* ══════════════════════════════════════════════════════
                TAB CONTENT — AnimatePresence for smooth transitions
            ══════════════════════════════════════════════════════ */}
            <AnimatePresence mode="wait">

              {/* ─────────────── TAB 1: TODAY'S SOP ─────────────── */}
              {(activeTab as string) === 'today' && (
                <motion.div
                  key="today"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Moon Phase Alert Strip — compact, only if active phase */}
                  {isHighRiskMoon && (
                    <div className={cn('rounded-2xl px-4 py-3 flex items-center gap-3 border', moonMeta.bg, moonMeta.border)}>
                      <span className="text-2xl flex-shrink-0">{moonMeta.emoji}</span>
                      <div className="flex-1">
                        <p className={cn('text-[9px] font-black tracking-tight', moonMeta.textColor)}>
                          {moonMeta.label} — {moonMeta.sublabel}
                        </p>
                        <p className="text-white/50 text-[8px] font-medium mt-0.5">
                          {moonMeta.rules[0]}
                        </p>
                      </div>
                      <span className={cn('text-[7px] font-black px-2 py-1 rounded-xl border whitespace-nowrap', moonMeta.badge)}>
                        {lunar.daysToAmavasya <= 1 ? 'Tonight' : `${lunar.daysToAmavasya}d`}
                      </span>
                    </div>
                  )}

                  {/* Season + next milestone compact strip */}
                  {currentDoc > 0 && (
                    <div className="flex gap-2">
                      <div className={cn('flex-1 rounded-2xl px-4 py-3 border flex items-center gap-2',
                        isDark ? `bg-white/5 border-white/10` : season.bg
                      )}>
                        <span className="text-lg">{season.emoji}</span>
                        <div>
                          <p className={cn('text-[8px] font-black', isDark ? 'text-white/80' : season.color)}>{season.label} Season</p>
                          <p className={cn('text-[7px] font-medium', isDark ? 'text-white/30' : 'text-ink/40')}>{season.risk.split('·')[0].trim()}</p>
                        </div>
                      </div>
                      {nextMilestone && (
                        <div className={cn('flex-1 rounded-2xl px-4 py-3 border flex items-center gap-2',
                          isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'
                        )}>
                          <Clock size={18} className={isDark ? 'text-indigo-400' : 'text-indigo-400'} />
                          <div>
                            <p className={cn('text-[8px] font-black', isDark ? 'text-indigo-300' : 'text-indigo-700')}>{nextMilestone.label}</p>
                            <p className={cn('text-[7px] font-black', isDark ? 'text-indigo-500' : 'text-indigo-400')}>in +{nextMilestone.doc - currentDoc} days</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Not Stocked Empty State (Only for non-planned) */}
                  {(!selectedPond.stockingDate && selectedPond.status !== 'planned') ? (
                    <div className={cn('rounded-[2.5rem] p-10 text-center border border-dashed',
                      isDark ? 'bg-white/[0.03] border-white/10' : 'bg-card border-card-border'
                    )}>
                      <div className={cn('w-12 h-12 rounded-3xl flex items-center justify-center mx-auto mb-4 text-[#C78200]',
                        isDark ? 'bg-white/5' : 'bg-[#F8F9FE]'
                      )}>
                        <Calendar size={32} />
                      </div>
                      <h3 className={cn('font-black text-base tracking-tight mb-2', isDark ? 'text-white' : 'text-ink')}>Culture Not Started</h3>
                      <p className={cn('text-[11px] leading-relaxed', isDark ? 'text-white/40' : 'text-ink/40')}>
                        Set a stocking date for <span className="text-[#C78200] font-black">{selectedPond.name}</span> to begin tracking SOP medicines.
                      </p>
                    </div>
                  ) : (todayGuidance.length === 0 && currentDoc > 0) ? (
                    <div className={cn('rounded-[2.5rem] p-10 text-center border border-dashed',
                      isDark ? 'bg-white/[0.03] border-white/10' : 'bg-card border-card-border'
                    )}>
                      <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
                      <h3 className={cn('font-black text-base tracking-tight mb-2', isDark ? 'text-white' : 'text-ink')}>All Clear Today!</h3>
                      <p className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-ink/40')}>No specific SOP medicines for DOC {currentDoc}. Maintain routine aeration.</p>
                    </div>
                  ) : (
                    <>
                      {/* Guidance or Stocking Day Content */}
                      {(currentDoc <= 0) && todayGuidance.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-100/50 rounded-[2rem] p-3 text-center">
                          <Zap className="text-emerald-500 mx-auto mb-3" size={28} />
                          <h4 className="text-[#0D523C] font-black text-base tracking-tight mb-1">
                            {selectedPond.status === 'planned' ? (
                              Math.abs(currentDoc) > 10 ? 'Stage: Soil Preparation' :
                                Math.abs(currentDoc) > 5 ? 'Stage: Water Sterilization' :
                                  Math.abs(currentDoc) > 2 ? 'Stage: Water Aging' :
                                    'Stage: Final Bloom & Seed Prep'
                            ) : 'Stocking Day (DOC 0)'}
                          </h4>
                          <p className="text-[#0D523C]/50 text-[11px] leading-relaxed mb-4">
                            {selectedPond.status === 'planned'
                              ? (
                                Math.abs(currentDoc) > 10 ? 'Sun-dry pond bottom and till soil until deep cracks appear to eliminate pathogens.' :
                                  Math.abs(currentDoc) > 5 ? 'Ensure water is filled through 60-mesh filters. Apply Disinfectants for sterilization.' :
                                    Math.abs(currentDoc) > 2 ? 'Aging water and ensuring zero chlorine residue. Check ionic balance (Ca, Mg, K).' :
                                      'Developing stable green water bloom. Final minerals and probiotics pulse before seed arrival.'
                              )
                              : 'Congratulations on starting your culture! Initial stress management and gut-health foundation active.'}
                          </p>
                          <span className="text-[9px] font-black uppercase text-emerald-800 tracking-widest bg-emerald-500/20 px-3 py-1.5 rounded-full">
                            {selectedPond.status === 'planned' ? `${Math.abs(currentDoc)} Days to Release` : 'Initial Stress Management'}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between px-1">
                        <div>
                          <h2 className={cn('font-black text-lg tracking-tight', isDark ? 'text-white' : 'text-ink')}>{t.dailySOP}</h2>
                          <p className="text-[#C78200] text-[9px] font-black uppercase tracking-widest mt-0.5">
                            {selectedDate.toDateString() === new Date().toDateString() ? 'Required Today' : `Required on ${selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                            {currentDoc >= 0 ? ` — DOC ${currentDoc}` : ` — Preparation Phase`} ({selectedDate.toLocaleDateString('en-IN', { weekday: 'long' })})
                          </p>
                        </div>
                        <div className={cn(
                          'w-12 h-12 rounded-2xl flex items-center justify-center',
                          currentDoc >= 31 && currentDoc <= 45 ? 'bg-red-500/10 text-red-500' : isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-500/10 text-emerald-500'
                        )}>
                          <ShieldCheck size={24} />
                        </div>
                      </div>

                      <div className="space-y-3">
                        {todayGuidance
                          .map((item, i) => {
                            // Check if this specific medicine was ALREADY logged today for this pond
                            const isAlreadyInHistory = medicineLogs.some(l =>
                              l.pondId === selectedPond.id &&
                              l.name === item.title &&
                              new Date(l.date).toDateString() === new Date().toDateString()
                            );

                            const isCompleted = isAlreadyInHistory || completedMeds.includes(item.title);
                            const Icon = getIconForType(item.type);

                            return (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => !isAlreadyInHistory && item.type === 'MEDICINE' && toggleMed(item.title)}
                                className={cn(
                                  'p-5 rounded-[2rem] shadow-sm border transition-all flex items-center justify-between group',
                                  (item.type === 'MEDICINE' && !isAlreadyInHistory) ? 'cursor-pointer' : 'cursor-default',
                                  isCompleted
                                    ? isDark ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200'
                                    : item.type === 'ALERT' || item.priority === 'HIGH'
                                      ? isDark ? 'bg-red-500/8 border-red-500/20 hover:border-red-500/30' : 'bg-card border-red-100 hover:border-red-200'
                                      : isDark ? 'bg-white/[0.03] border-white/8 hover:border-white/15' : 'bg-card border-card-border hover:border-emerald-200'
                                )}
                              >
                                <div className={cn("flex items-center gap-4 flex-1 min-w-0", isAlreadyInHistory && "opacity-60")}>
                                  <div className={cn(
                                    'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all',
                                    isCompleted
                                      ? 'bg-emerald-500 text-white'
                                      : getTypeAccent(item.type)
                                  )}>
                                    {isCompleted ? <CheckCircle2 size={22} /> : <Icon size={22} />}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                      <h4 className={cn(
                                        'font-black text-sm tracking-tight truncate',
                                        isCompleted
                                          ? isDark ? 'text-emerald-400' : 'text-emerald-800'
                                          : isDark ? 'text-white' : 'text-ink'
                                      )}>
                                        {item.title}
                                      </h4>
                                      {isAlreadyInHistory && (
                                        <span className="text-[7px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white border-none flex-shrink-0 animate-pulse">
                                          Synced
                                        </span>
                                      )}
                                      <span className={cn(
                                        'text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border flex-shrink-0',
                                        getPriorityColor(item.priority)
                                      )}>
                                        {item.priority}
                                      </span>
                                      {item.applicationType && (
                                        <span className={cn(
                                          'text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border flex-shrink-0',
                                          item.applicationType === 'WATER' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        )}>
                                          {item.applicationType === 'WATER' ? 'Water' : 'Feed'}
                                        </span>
                                      )}
                                      {item.type === 'MEDICINE' && !isAlreadyInHistory && (
                                        <span className={cn('text-[7px] font-black px-2 py-0.5 rounded-full border flex-shrink-0',
                                          isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                        )}>
                                          ~{'\u20b9'}{estimateMedicineCost(item.title, pondAcreage)}
                                        </span>
                                      )}
                                    </div>
                                    <p className={cn('text-[10px] font-medium leading-snug',
                                      isAlreadyInHistory
                                        ? isDark ? 'text-emerald-400/60' : 'text-emerald-700/60'
                                        : isDark ? 'text-white/35' : 'text-ink/40'
                                    )}>
                                      {isAlreadyInHistory ? "Already applied and synced for today" : item.description}
                                    </p>
                                    {item.dose && !isAlreadyInHistory && (
                                      <p className={cn('text-[8px] font-black uppercase tracking-widest mt-0.5',
                                        isDark ? 'text-emerald-400/70' : 'text-[#0D523C]'
                                      )}>
                                        Dose: {item.dose}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {item.type === 'MEDICINE' && (
                                  <div className={cn(
                                    'w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ml-3',
                                    isCompleted
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : isDark ? 'border-white/15 text-transparent' : 'border-card-border text-transparent'
                                  )}>
                                    <CheckCircle2 size={16} />
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                      </div>

                      {/* ── HARVESTED POND GUARD ── */}
                      {selectedPond.status === 'harvested' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 text-center">
                          <div className="text-4xl mb-3">🌾</div>
                          <h3 className="text-amber-800 font-black text-sm tracking-tight mb-2">Pond Harvested</h3>
                          <p className="text-amber-700/70 text-[11px] leading-relaxed">
                            This pond has been harvested. No SOP medicines are required.<br />
                            Prepare for next culture cycle or archive this pond.
                          </p>
                        </div>
                      )}

                      {/* ── COST ESTIMATION SUMMARY ── */}
                      {completedMeds.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gradient-to-br from-indigo-950 to-indigo-900 rounded-[2rem] p-5 border border-indigo-800/40 shadow-xl"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-indigo-300/60 text-[7px] font-black uppercase tracking-widest">Estimated Medicine Cost</p>
                              <p className="text-white text-xl font-black tracking-tight mt-0.5">₹{totalEstimatedCost.toLocaleString()}</p>
                              <p className="text-indigo-300/40 text-[7px] font-bold mt-0.5">Will be recorded in ROI → Expenses</p>
                            </div>
                            <div className="w-12 h-12 bg-indigo-800/40 rounded-2xl flex items-center justify-center border border-indigo-700/30">
                              <Pill size={20} className="text-indigo-300" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            {selectedCosts.map((sc, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <p className="text-indigo-200/60 text-[9px] font-bold truncate flex-1 mr-3">{sc.name}</p>
                                <p className="text-indigo-200 text-[9px] font-black flex-shrink-0">₹{sc.cost}</p>
                              </div>
                            ))}
                          </div>
                          {pondAcreage > 1 && (
                            <p className="text-indigo-400/40 text-[7px] font-black uppercase tracking-widest mt-3 border-t border-indigo-800/40 pt-2">
                              Scaled for {pondAcreage} acres
                            </p>
                          )}
                        </motion.div>
                      )}

                      {/* Log Button */}
                      <button
                        onClick={handleLog}
                        disabled={completedMeds.length === 0 || selectedPond.status === 'harvested'}
                        className={cn(
                          'w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3',
                          completedMeds.length > 0 && selectedPond.status !== 'harvested'
                            ? 'bg-[#0D523C] text-white shadow-2xl shadow-emerald-900/20 active:scale-95'
                            : 'bg-[#F0F0F0] text-ink/20 cursor-not-allowed'
                        )}
                      >
                        {isLogging ? 'Syncing...' : (selectedDate.toDateString() === new Date().toDateString() ? `${t.logDailyProtocol || 'Log Protocol'} (${completedMeds.length})` : 'Planning Only')}
                        <ArrowRight size={18} />
                      </button>
                      {selectedDate.toDateString() !== new Date().toDateString() && (
                        <button
                          onClick={() => setSelectedDate(new Date())}
                          className="w-full py-3 text-[10px] font-black uppercase text-indigo-500 bg-indigo-500/10 rounded-2xl tracking-widest"
                        >
                          Return to Today
                        </button>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* ─────────────── TAB 2: DISEASE ALERTS ─────────────── */}
              {activeTab === 'diseases' && (
                <motion.div
                  key="diseases"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {isPrestocking ? (
                    <div className={cn('rounded-[2rem] p-8 text-center border', isDark ? 'bg-white/[0.03] border-white/10' : 'bg-card border-card-border')}>
                      <div className="text-4xl mb-3">🏗️</div>
                      <h3 className={cn('font-black text-sm tracking-tight mb-2', isDark ? 'text-white' : 'text-ink')}>Preparation Phase</h3>
                      <p className={cn('text-[10px] leading-relaxed', isDark ? 'text-white/40' : 'text-ink/40')}>
                        Disease risk alerts activate after stocking. Focus on water quality and pond preparation now.
                      </p>
                    </div>
                  ) : currentDoc === 0 ? (
                    <div className={cn('rounded-[2rem] p-8 text-center border', isDark ? 'bg-white/[0.03] border-white/10' : 'bg-card border-card-border')}>
                      <div className="text-4xl mb-3">✅</div>
                      <h3 className={cn('font-black text-sm tracking-tight mb-2', isDark ? 'text-white' : 'text-ink')}>Stocking Day</h3>
                      <p className={cn('text-[10px] leading-relaxed', isDark ? 'text-white/40' : 'text-ink/40')}>Disease monitoring begins from DOC 1.</p>
                    </div>
                  ) : (() => {
                    const riskReport = diseaseRiskReport;
                    const alerts = riskReport.topRisks.filter(r => r.riskScore > 15).slice(0, 5);
                    const overallColors = RISK_COLORS[riskReport.overallRisk];
                    const stageMeta = STAGE_META[riskReport.stage];
                    const seasonMeta = SEASON_META[riskReport.season];
                    const tips = riskReport.preventionTips;

                    return (
                      <div className="space-y-3">
                        {/* Section header */}
                        <div className="flex items-center justify-between px-1">
                          <div>
                            <h3 className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-ink')}>🦠 Stage Disease Alerts</h3>
                            <p className={cn('text-[8px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/35' : 'text-ink/40')}>
                              {stageMeta.emoji} {stageMeta.label} · DOC {currentDoc} · {seasonMeta.emoji} {seasonMeta.label}
                            </p>
                          </div>
                          <span className={cn('text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border', overallColors.badge)}>
                            Overall: {riskReport.overallRisk}
                          </span>
                        </div>

                        {alerts.length === 0 ? (
                          <div className={cn('rounded-[2rem] p-8 text-center border',
                            isDark ? 'bg-emerald-500/8 border-emerald-500/15' : 'bg-emerald-50 border-emerald-100'
                          )}>
                            <div className="text-4xl mb-3">🛡️</div>
                            <h3 className={cn('font-black text-sm tracking-tight mb-2', isDark ? 'text-emerald-400' : 'text-emerald-800')}>All Clear!</h3>
                            <p className={cn('text-[10px] leading-relaxed', isDark ? 'text-emerald-400/60' : 'text-emerald-700/60')}>No significant disease risk at DOC {currentDoc}. Maintain your SOP protocol.</p>
                          </div>
                        ) : alerts.map((risk, i) => {
                          const rc = RISK_COLORS[risk.riskLevel];
                          const barW = Math.max(5, risk.riskScore);
                          const isCrit = risk.riskScore >= 75;
                          const isHigh = risk.riskScore >= 55 && !isCrit;
                          const isHotZone = isCrit || isHigh;
                          const cardTip = tips[i % tips.length];
                          return (
                            <motion.div
                              key={risk.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.07 }}
                              className={cn(
                                'rounded-[2rem] border overflow-hidden shadow-sm',
                                isCrit
                                  ? isDark ? 'bg-red-500/10 border-red-500/25' : 'bg-red-50 border-red-100'
                                  : isHigh
                                    ? isDark ? 'bg-orange-500/8 border-orange-500/20' : 'bg-orange-50 border-orange-100'
                                    : risk.riskLevel === 'MODERATE'
                                      ? isDark ? 'bg-amber-500/8 border-amber-500/20' : 'bg-amber-50 border-amber-100'
                                      : isDark ? 'bg-white/[0.03] border-white/8' : 'bg-card border-card-border'
                              )}
                            >
                              {/* Top banner: Stage + Season + Level */}
                              <div className={cn(
                                'px-5 py-2.5 flex items-center gap-2 border-b flex-wrap',
                                isCrit
                                  ? isDark ? 'bg-red-500/15 border-red-500/20' : 'bg-red-100/60 border-red-100'
                                  : isHigh
                                    ? isDark ? 'bg-orange-500/10 border-orange-500/15' : 'bg-orange-100/50 border-orange-100'
                                    : risk.riskLevel === 'MODERATE'
                                      ? isDark ? 'bg-amber-500/10 border-amber-500/15' : 'bg-amber-100/40 border-amber-100'
                                      : isDark ? 'bg-white/5 border-white/8' : 'bg-slate-50 border-slate-100'
                              )}>
                                <span className={cn('text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
                                  isDark ? 'bg-white/10 ' + stageMeta.color : 'bg-white/70 ' + stageMeta.color
                                )}>
                                  {stageMeta.emoji} {stageMeta.label}
                                </span>
                                {risk.seasonMatch && (
                                  <span className={cn('text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/70 border',
                                    isCrit ? 'text-red-600 border-red-200' : 'text-amber-600 border-amber-200'
                                  )}>
                                    {seasonMeta.emoji} {season.label} Peak
                                  </span>
                                )}
                                <span className={cn('ml-auto text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', rc.badge)}>
                                  {risk.riskLevel}
                                </span>
                              </div>

                              {/* Card body */}
                              <div className="p-5">
                                {/* Disease name + score */}
                                <div className="flex items-start gap-3 mb-3">
                                  <span className="text-3xl leading-none flex-shrink-0">{risk.emoji}</span>
                                  <div className="flex-1 min-w-0">
                                    <h4 className={cn('font-black text-sm tracking-tight leading-tight mb-0.5',
                                      isCrit ? 'text-red-800' : isHigh ? 'text-orange-800' : 'text-ink'
                                    )}>{risk.name}</h4>
                                    <p className={cn('text-[7px] font-black uppercase tracking-widest', rc.text)}>
                                      {risk.window} · DOC {currentDoc}
                                    </p>
                                  </div>
                                  <div className={cn('w-11 h-11 rounded-2xl flex flex-col items-center justify-center border flex-shrink-0', rc.badge)}>
                                    <span className={cn('text-sm font-black leading-none', rc.text)}>{risk.riskScore}</span>
                                    <span className={cn('text-[5px] font-black', rc.text)}>/100</span>
                                  </div>
                                </div>

                                {/* Why risky now */}
                                <div className={cn('rounded-2xl px-3.5 py-2.5 mb-3 border',
                                  isHotZone ? 'bg-white/80' : 'bg-slate-50 border-slate-100'
                                )}>
                                  <p className={cn('text-[6px] font-black uppercase tracking-widest mb-1',
                                    isCrit ? 'text-red-500' : isHigh ? 'text-orange-500' : 'text-ink/30'
                                  )}>⚡ Why Now (DOC {currentDoc})</p>
                                  <p className={cn('text-[9px] font-semibold leading-relaxed',
                                    isCrit ? 'text-red-800/80' : isHigh ? 'text-orange-800/80' : 'text-ink/60'
                                  )}>{risk.trigger}</p>
                                </div>

                                {/* Risk bar */}
                                <div className="mb-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-[6px] font-black uppercase tracking-widest text-ink/25">Risk Intensity</p>
                                    <p className={cn('text-[8px] font-black', rc.text)}>{risk.riskScore}%</p>
                                  </div>
                                  <div className={cn('h-2 rounded-full overflow-hidden',
                                    isCrit ? 'bg-red-200' : isHigh ? 'bg-orange-200' :
                                      risk.riskLevel === 'MODERATE' ? 'bg-amber-200' : 'bg-slate-200'
                                  )}>
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${barW}%` }}
                                      transition={{ duration: 1.0, delay: i * 0.1, ease: 'easeOut' }}
                                      className={cn('h-full rounded-full', rc.bg)}
                                    />
                                  </div>
                                </div>

                                {/* Action + Tip */}
                                <div className="space-y-2">
                                  <div className={cn('rounded-2xl px-3.5 py-3 border',
                                    isCrit ? isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-100/70 border-red-200' :
                                      isHigh ? isDark ? 'bg-orange-500/10 border-orange-500/20' : 'bg-orange-100/60 border-orange-200' :
                                        risk.riskLevel === 'MODERATE' ? isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-100/50 border-amber-200' :
                                          isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'
                                  )}>
                                    <p className={cn('text-[6px] font-black uppercase tracking-widest mb-1',
                                      isCrit ? 'text-red-400' : isHigh ? 'text-orange-400' :
                                        risk.riskLevel === 'MODERATE' ? 'text-amber-400' : 'text-blue-400'
                                    )}>{isHotZone ? '🚨 Immediate Action' : '💡 Prevention'}</p>
                                    <p className={cn('text-[9px] font-medium leading-relaxed',
                                      isCrit ? 'text-red-300' : isHigh ? 'text-orange-300' : isDark ? 'text-white/60' : 'text-ink/60'
                                    )}>{risk.action.split('.')[0]}.</p>
                                  </div>
                                  {cardTip && (
                                    <div className={cn('rounded-2xl px-3.5 py-2.5 border',
                                      isDark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'
                                    )}>
                                      <p className={cn('text-[6px] font-black uppercase tracking-widest mb-1',
                                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                                      )}>💡 {stageMeta.label} Tip</p>
                                      <p className={cn('text-[9px] font-medium leading-relaxed',
                                        isDark ? 'text-emerald-300/70' : 'text-emerald-800/70'
                                      )}>{cardTip}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </motion.div>
              )}

              {/* ─────────────── TAB 3: FULL CYCLE ─────────────── */}
              {activeTab === 'cycle' && (
                /* Full SOP Cycle View */
                <motion.div
                  key="cycle"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between px-1 mb-3">
                    <div>
                      <h2 className={cn('font-black text-lg tracking-tight', isDark ? 'text-white' : 'text-ink')}>{t.cultureTimeline}</h2>
                      {selectedPond && (
                        <p className="text-[8px] font-black text-[#C78200] uppercase tracking-widest mt-0.5">
                          {selectedPond.status === 'planned' ? 'Phase: Pre-Stocking Preparation' : `Total Cycle: 100 Days • ${100 - currentDoc > 0 ? `${100 - currentDoc} Days Remaining` : 'Culture Complete'}`}
                        </p>
                      )}
                    </div>
                    <span className={cn('text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border',
                      isDark ? 'text-white/30 bg-white/5 border-white/10' : 'text-ink/30 bg-[#F8F9FE] border-card-border'
                    )}>
                      Vannamei SOC
                    </span>
                  </div>

                  {(() => {
                    const phasesToShow = selectedPond?.status === 'planned' ? [PRE_STOCKING_PHASE, ...SOP_CYCLE_PHASES] : SOP_CYCLE_PHASES;
                    return phasesToShow.map((phase, phaseIdx) => {
                      const isPrep = phase.range === 'Prep Days 1-15';
                      const isActive = isPrep ? (currentDoc <= 0) : (selectedPond?.status === 'planned' ? phaseIdx - 1 === currentPhaseIdx : phaseIdx === currentPhaseIdx);
                      const isPast = isPrep ? false : (selectedPond?.status === 'planned' ? phaseIdx - 1 < currentPhaseIdx : phaseIdx < currentPhaseIdx);

                      /* ── Active phase: full card with medicine details ── */
                      if (isActive) {
                        return (
                          <div
                            key={phaseIdx}
                            className={cn(
                              'rounded-[2rem] border overflow-hidden shadow-md',
                              isDark
                                ? 'bg-white/[0.04] border-white/10'
                                : `${phase.bgLight} ${phase.borderColor}`
                            )}
                          >
                            {/* Header */}
                            <div className={cn('px-6 py-4 flex items-center justify-between border-b',
                              isDark ? 'border-white/8' : phase.borderColor
                            )}>
                              <div className="flex items-center gap-3">
                                <div className={cn('w-3 h-3 rounded-full flex-shrink-0', phase.color)} />
                                <div>
                                  <p className={cn('font-black text-sm tracking-tight',
                                    isDark ? 'text-white' : phase.textColor
                                  )}>
                                    {phase.label}
                                  </p>
                                  <div className={cn('text-[9px] font-black uppercase tracking-widest leading-none flex items-center gap-2',
                                    isDark ? 'text-white/35' : 'text-ink/40'
                                  )}>
                                    {phase.range}
                                    <span className="w-1 h-1 bg-current rounded-full opacity-40" />
                                    <span className="text-[#C78200] border border-[#C78200]/20 bg-[#C78200]/5 px-2 py-0.5 rounded-md">
                                      TODAY: {currentDoc <= 0 ? 'PRE-STOCKING' : `DOC ${currentDoc}`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className={cn(
                                'text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border',
                                isDark
                                  ? `bg-white/5 text-white/60 border-white/10`
                                  : `bg-card ${phase.textColor} ${phase.borderColor}`
                              )}>
                                ▶ Active
                              </span>
                            </div>

                            {/* Medicine list */}
                            <div className="px-6 pb-5 space-y-3">
                              {phase.meds.map((med, medIdx) => (
                                <div key={medIdx} className={cn('flex items-start gap-3 pt-3 border-t first:border-t-0 first:pt-0',
                                  isDark ? 'border-white/5' : 'border-card-border'
                                )}>
                                  <Pill size={14} className={cn('flex-shrink-0 mt-0.5', isDark ? 'text-emerald-400' : phase.textColor)} />
                                  <div>
                                    <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-ink')}>{med.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      {med.dose && med.dose !== '—' && (
                                        <span className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/35' : 'text-ink/40')}>{med.dose}</span>
                                      )}
                                      {med.brand && (
                                        <span className="text-[8px] font-black text-[#C78200] bg-[#C78200]/10 px-1.5 py-0.5 rounded-md">{med.brand}</span>
                                      )}
                                      {(med as any).freq && (
                                        <span className={cn('text-[8px] font-black italic', isDark ? 'text-white/25' : 'text-ink/30')}>{(med as any).freq}</span>
                                      )}
                                      <span className={cn(
                                        'text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border',
                                        getPriorityColor(med.priority)
                                      )}>
                                        {med.priority}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      /* ── Past / upcoming phases: compact title-only pill ── */
                      return (
                        <div
                          key={phaseIdx}
                          className={cn(
                            'rounded-2xl border px-5 py-3.5 flex items-center justify-between transition-all',
                            isPast
                              ? isDark ? 'bg-emerald-500/5 border-emerald-500/15 opacity-60' : 'bg-card border-emerald-100/60 opacity-55'
                              : isDark ? 'bg-white/[0.02] border-white/5 opacity-60' : 'bg-card border-card-border opacity-70'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', phase.color)} />
                            <div>
                              <p className={cn('font-black text-[12px] tracking-tight', isDark ? 'text-white/70' : 'text-ink')}>{phase.label}</p>
                              <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-ink/30')}>{phase.range}</p>
                            </div>
                          </div>
                          {isPast ? (
                            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                          ) : (
                            <span className={cn('text-[7px] font-black uppercase tracking-widest flex-shrink-0', isDark ? 'text-white/20' : 'text-ink/20')}>Upcoming</span>
                          )}
                        </div>
                      );
                    });
                  })()}
                </motion.div>
              )}

              {/* ─────────────── TAB 4: LUNAR PLANNER ─────────────── */}
              {activeTab === 'lunar' && (
                <motion.div
                  key="lunar"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3 pb-10"
                >
                  {/* ══════════════════════════════════════════════
                      LUNAR HERO — Premium Moon Phase Intelligence
                  ══════════════════════════════════════════════ */}
                  <div
                    className="rounded-[2.5rem] overflow-hidden relative border border-white/10"
                    style={{ background: 'linear-gradient(160deg, #050d1a 0%, #0d1f3a 40%, #0a1628 100%)' }}
                  >
                    {/* Starfield glow */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-4 right-8 w-1 h-1 bg-white/40 rounded-full" />
                      <div className="absolute top-12 right-24 w-0.5 h-0.5 bg-white/30 rounded-full" />
                      <div className="absolute top-6 left-20 w-0.5 h-0.5 bg-white/20 rounded-full" />
                      <div className="absolute top-20 right-16 w-1 h-1 bg-indigo-400/30 rounded-full" />
                      <div className="absolute bottom-8 left-12 w-0.5 h-0.5 bg-white/25 rounded-full" />
                      <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-[60px]" />
                      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-violet-500/10 rounded-full blur-[50px]" />
                    </div>

                    <div className="relative z-10 p-6">
                      {/* Top row: phase name + lunar day counter */}
                      <div className="flex items-start justify-between mb-5">
                        <div>
                          <p className="text-white/25 text-[6px] font-black uppercase tracking-[0.4em] mb-1">Lunar Intelligence</p>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-5xl leading-none">{moonMeta.emoji}</span>
                            <div>
                              <h3 className={cn('font-black text-xl tracking-tight leading-tight', moonMeta.textColor)}>
                                {moonMeta.label}
                              </h3>
                              <span className={cn('text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border inline-block mt-1', moonMeta.badge)}>
                                {moonMeta.sublabel}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Lunar cycle ring */}
                        <div className="flex flex-col items-center">
                          <div className="relative w-16 h-16">
                            <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                              <circle
                                cx="32" cy="32" r="28"
                                fill="none"
                                stroke={lunar.phase === 'AMAVASYA' ? '#818cf8' : lunar.phase === 'POURNAMI' ? '#34d399' : '#a78bfa'}
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={`${(Math.round(lunar.daysSinceAmavasya) / 29) * 175.9} 175.9`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <p className="text-white font-black text-lg leading-none">{Math.round(lunar.daysSinceAmavasya)}</p>
                              <p className="text-white/30 text-[5px] font-black uppercase tracking-widest">/29</p>
                            </div>
                          </div>
                          <p className="text-white/20 text-[5px] font-black uppercase tracking-widest mt-1">Lunar Day</p>
                        </div>
                      </div>

                      {/* 3-event countdown cards */}
                      <div className="grid grid-cols-3 gap-2 mb-5">
                        {(lunar.phase === 'POURNAMI' ? [
                          { label: 'Ashtami', days: lunar.daysSinceAshtami, emoji: '🌓', color: 'from-violet-900/80 to-violet-800/50', border: 'border-violet-500/30', text: 'text-violet-300', note: 'ago', risk: 'Molt Start' },
                          { label: 'Navami', days: lunar.daysSinceNavami, emoji: '🌙', color: 'from-sky-900/80 to-sky-800/50', border: 'border-sky-500/30', text: 'text-sky-300', note: 'ago', risk: 'Molt Peak' },
                          { label: 'Amavasya', days: lunar.daysSinceAmavasya, emoji: '🌑', color: 'from-indigo-900/80 to-indigo-800/50', border: 'border-indigo-500/30', text: 'text-indigo-300', note: 'ago', risk: 'New Moon' },
                        ] : [
                          { label: 'Ashtami', days: lunar.daysToAshtami, emoji: '🌓', color: 'from-violet-900/80 to-violet-800/50', border: 'border-violet-500/30', text: 'text-violet-300', note: 'd', risk: 'Molt Begins' },
                          { label: 'Navami', days: lunar.daysToNavami, emoji: '🌙', color: 'from-sky-900/80 to-sky-800/50', border: 'border-sky-500/30', text: 'text-sky-300', note: 'd', risk: 'Molt Peak' },
                          { label: 'Amavasya', days: lunar.daysToAmavasya, emoji: '🌑', color: 'from-indigo-900/80 to-indigo-800/50', border: 'border-indigo-500/30', text: 'text-indigo-300', note: 'd', risk: '⚠ Low DO Risk' },
                        ]).map((ev, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className={cn(
                              'rounded-2xl p-3 border bg-gradient-to-b flex flex-col items-center text-center',
                              ev.color, ev.border
                            )}
                          >
                            <span className="text-2xl mb-1.5">{ev.emoji}</span>
                            <p className="text-white/40 text-[5px] font-black uppercase tracking-widest">{ev.label}</p>
                            <p className={cn('text-lg font-black leading-none my-1', ev.text)}>
                              {Math.round(ev.days)}<span className="text-[8px] ml-0.5">{ev.note}</span>
                            </p>
                            <p className="text-white/25 text-[5px] font-black uppercase tracking-widest">{ev.risk}</p>
                          </motion.div>
                        ))}
                      </div>

                      {/* SOP Rules — color coded */}
                      <div className="bg-white/[0.04] rounded-2xl px-4 py-3.5 border border-white/5 mb-3">
                        <p className="text-white/25 text-[6px] font-black uppercase tracking-[0.3em] mb-2">
                          Tonight's SOP — {moonMeta.sublabel}
                        </p>
                        <div className="space-y-1.5">
                          {moonMeta.rules.map((rule, i) => {
                            const isRed = rule.startsWith('🔴');
                            const isOrange = rule.startsWith('🟠');
                            const isYellow = rule.startsWith('🟡');
                            const isBlue = rule.startsWith('🔵');
                            const isMed = rule.startsWith('💊');
                            const isCheck = rule.startsWith('✅');
                            return (
                              <div key={i} className={cn(
                                'flex items-start gap-2 px-2.5 py-1.5 rounded-xl',
                                isRed ? 'bg-red-500/10' : isBlue ? 'bg-blue-500/10' : isMed ? 'bg-purple-500/10' : isYellow ? 'bg-yellow-500/10' : isCheck ? 'bg-emerald-500/10' : 'bg-white/5'
                              )}>
                                <span className="text-sm leading-none flex-shrink-0">{rule.slice(0, 2)}</span>
                                <p className={cn('text-[9px] font-semibold leading-snug',
                                  isRed ? 'text-red-300' : isBlue ? 'text-blue-300' : isMed ? 'text-purple-300' : isYellow ? 'text-yellow-300' : isCheck ? 'text-emerald-300' : 'text-white/60'
                                )}>{rule.slice(2).trim()}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Season × Lunar interaction */}
                      <div className="flex items-center gap-3 bg-white/[0.04] rounded-2xl px-4 py-3 border border-white/5">
                        <span className="text-xl flex-shrink-0">{season.emoji}</span>
                        <div className="flex-1">
                          <p className="text-white/60 text-[9px] font-black tracking-tight">
                            {season.label} × {moonMeta.label.split('—')[0].trim()} Interaction
                          </p>
                          <p className="text-white/35 text-[8px] font-medium mt-0.5 leading-relaxed">
                            {lunar.phase === 'AMAVASYA'
                              ? `${season.label} temps amplify DO crash risk tonight. Run aerators from 9 PM — 5 AM.`
                              : (lunar.phase === 'ASHTAMI' || lunar.phase === 'NAVAMI')
                                ? `${season.label} heat stress compounds molt stress. Monitor O₂ every 2 hrs during night.`
                                : `${season.label} season active. Next major molting event in ${Math.min(lunar.daysToAmavasya, lunar.daysToAshtami, lunar.daysToNavami)} days — prepare Minerals & Probiotics.`}
                          </p>
                        </div>
                        <Thermometer size={16} className="text-white/20 flex-shrink-0" />
                      </div>
                    </div>
                  </div>



                  {!selectedPond ? (
                    <div className="bg-card/80 backdrop-blur-md rounded-[3rem] p-10 text-center border border-card-border shadow-xl">
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500 mx-auto mb-6">
                        <Waves size={40} />
                      </div>
                      <h3 className="text-ink font-black text-xl tracking-tight mb-2">No Pond Selected</h3>
                      <p className="text-ink/40 text-xs font-bold leading-relaxed max-w-[200px] mx-auto">
                        Please select a pond from the dashboard to see its personalized lunar molting schedule.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-[#051F19] p-4 rounded-[3rem] text-white relative overflow-hidden mb-6">
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.3em]">{selectedPond.name}</p>
                            <span className="w-1 h-1 rounded-full bg-emerald-400/30" />
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em]">DOC {currentDoc}</p>
                          </div>
                          <h3 className="text-2xl font-black tracking-tighter mb-4">Culture Cycle Planner</h3>

                          {/* SOP Legend */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {[
                              { label: 'Min', color: 'bg-amber-400' },
                              { label: 'Prob', color: 'bg-blue-400' },
                              { label: 'Gut', color: 'bg-emerald-400' },
                              { label: 'Immune', color: 'bg-red-400' },
                              { label: 'Check', color: 'bg-green-700' }
                            ].map((leg, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 bg-card/5 px-2 py-1 rounded-lg border border-white/5">
                                <div className={cn("w-1.5 h-1.5 rounded-full", leg.color)} />
                                <span className="text-[6px] font-black uppercase text-white/50 tracking-widest">{leg.label}</span>
                              </div>
                            ))}
                          </div>

                          <p className="text-white/40 text-[10px] font-medium leading-relaxed">
                            DOC-Aligned 5-Week Forecast · Lunar Molt Cycles Integrated.
                          </p>
                        </div>
                        <div className="absolute right-[-5%] top-[-10%] opacity-10">
                          <Star size={180} />
                        </div>
                      </div>

                      {/* Column Titles */}
                      <div className="grid grid-cols-4 gap-2 mb-2 px-1">
                        {['DAY 1', 'DAY 2', 'DAY 3', 'DAY 4'].map((title) => (
                          <div key={title} className="text-center">
                            <span className="text-[7px] font-black text-black/30 tracking-[0.2em]">{title}</span>
                          </div>
                        ))}
                      </div>

                      {/* Scrollable Container with 4-day row layout */}
                      <div className="max-h-[520px] overflow-y-auto px-1 pr-2 space-y-4 custom-scrollbar">
                        <motion.div
                          className="grid grid-cols-4 gap-2.5"
                          variants={{
                            show: { transition: { staggerChildren: 0.03 } }
                          }}
                          initial="hidden"
                          animate="show"
                        >
                          {compactLunarForecast.map((day, i) => {
                            const isAmavasya = day.status.phase === 'AMAVASYA';
                            const isPournami = day.status.phase === 'POURNAMI';
                            const isAshtami = day.status.phase === 'ASHTAMI';
                            const isNavami = day.status.phase === 'NAVAMI';
                            const isPeak = isAmavasya || isPournami || isAshtami || isNavami;
                            const isToday = day.date.toDateString() === new Date().toDateString();

                            return (
                              <motion.div
                                key={`compact-frag-${i}`}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.01 }}
                                className={cn(
                                  "relative p-3 rounded-2xl border flex flex-col items-center justify-between transition-all duration-300 min-h-[110px] cursor-pointer",
                                  isAmavasya ? "bg-black border-indigo-500 shadow-[0_10px_30px_-5px_rgba(99,102,241,0.4)] text-white scale-[1.02]" :
                                    isPournami ? "bg-emerald-500 border-white shadow-[0_10px_40px_-5px_rgba(16,185,129,0.5)] text-white scale-[1.02]" :
                                      isAshtami ? "bg-violet-600 border-white shadow-[0_8px_20px_-5px_rgba(139,92,246,0.3)] text-white" :
                                        isNavami ? "bg-sky-500 border-white shadow-[0_8px_20px_-5px_rgba(14,165,233,0.3)] text-white" :
                                          isToday ? "bg-emerald-600 border-white shadow-[0_10px_30px_-5px_rgba(5,150,105,0.4)] text-white ring-2 ring-emerald-300" :
                                            "bg-card border-black/[0.08] shadow-sm hover:shadow-md"
                                )}
                                onClick={() => setSelectedDate(day.date)}
                              >
                                {/* Header Info */}
                                <div className="w-full flex justify-between items-start mb-1">
                                  <div className="flex flex-col">
                                    <span className={cn(
                                      "text-[7px] font-bold uppercase tracking-widest",
                                      isPeak || isToday ? "text-white/80" : "text-black"
                                    )}>
                                      {day.date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                                    </span>
                                    <span className={cn(
                                      "text-[8px] font-black",
                                      isPeak || isToday ? "text-white" : "text-black"
                                    )}>
                                      D{day.doc}
                                    </span>
                                  </div>
                                </div>

                                <div className="relative flex flex-col items-center py-1">
                                  <motion.span
                                    animate={isPeak ? { rotate: 360 } : {}}
                                    transition={isPeak ? { duration: 10, repeat: Infinity, ease: "linear" } : {}}
                                    className={cn(
                                      "transition-all duration-700",
                                      isPournami ? "text-3xl text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] scale-[1.2] brightness-125 focus:ring-emerald-500" :
                                        isAmavasya ? "text-2xl text-indigo-300" :
                                          isAshtami ? "text-2xl text-violet-200" :
                                            isNavami ? "text-2xl text-sky-200" :
                                              isToday ? "text-xl text-emerald-500" : "text-xl text-amber-400"
                                    )}>
                                    {day.status.phase === 'AMAVASYA' ? '🌑' :
                                      day.status.phase === 'POURNAMI' ? '🌕' :
                                        day.status.phase === 'ASHTAMI' ? '🌗' :
                                          day.status.phase === 'NAVAMI' ? '🌘' :
                                            '🌕'}
                                  </motion.span>
                                  {/* Tactically Lean: Medicine SOP Dots */}
                                  <div className="mt-1.5 flex justify-center gap-1">
                                    {(() => {
                                      const docMod = (day.doc - 1) % 7;
                                      const colors = ['bg-amber-400', 'bg-blue-400', 'bg-emerald-400', 'bg-sky-400', 'bg-orange-400', 'bg-red-400', 'bg-green-700'];
                                      return (
                                        <motion.div
                                          initial={false}
                                          animate={{ scale: [1, 1.2, 1] }}
                                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                                          className={cn(
                                            "w-1.5 h-1.5 rounded-full shadow-sm relative z-10",
                                            isPeak || isToday ? "bg-card" : colors[docMod]
                                          )}
                                        />
                                      );
                                    })()}
                                  </div>
                                </div>

                                <div className="text-center w-full mt-auto">
                                  <p className={cn(
                                    "text-[9px] font-black tracking-tighter leading-none mb-1.5",
                                    isPeak || isToday ? "text-white" : "text-black"
                                  )}>
                                    {day.date.getDate()} {day.date.toLocaleDateString('en-US', { month: 'short' })}
                                  </p>
                                  {(isPeak || isToday) && (
                                    <div className={cn(
                                      "py-1 px-1 rounded-lg text-[5px] font-black uppercase tracking-[0.2em] inline-block w-full",
                                      isAmavasya ? "bg-card/20 text-white" :
                                        isPournami ? "bg-card/20 text-white" :
                                          isAshtami ? "bg-card/20 text-white" :
                                            isNavami ? "bg-card/20 text-white" :
                                              isToday ? "bg-emerald-500 text-white" : ""
                                    )}>
                                      {isToday ? (isPeak ? `TODAY - ${day.status.phase}` : 'TODAY') : `${day.status.phase} - MOLT`}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      </div>

                      {/* Quick Medicine Preview for Selected Date */}
                      <motion.div
                        key={selectedDate.toISOString()}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card rounded-[2.5rem] p-3 border border-card-border shadow-lg mt-2"
                      >
                        <div className="flex justify-between items-center mb-5">
                          <div>
                            <p className="text-[#C78200] text-[8px] font-black uppercase tracking-widest leading-none mb-1">Schedule for</p>
                            <h3 className="text-ink text-sm font-black tracking-tighter">
                              {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })} • DOC {calculateDOC(selectedPond.stockingDate, selectedDate.toISOString())}
                            </h3>
                          </div>
                          {getLunarStatus(selectedDate).phase !== 'NORMAL' && (
                            <div className="bg-indigo-500 text-white px-3 py-2 rounded-xl text-center shadow-lg shadow-indigo-500/20 animate-pulse transition-all">
                              <p className="text-[8px] font-black uppercase tracking-widest leading-none mb-0.5">{getLunarStatus(selectedDate).phase}</p>
                              <p className="text-[6px] font-black text-white/50 uppercase leading-none">High Molt</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          {getSOPGuidance(calculateDOC(selectedPond.stockingDate, selectedDate.toISOString()), selectedDate)
                            .filter(s => s.type === 'MEDICINE' || s.type === 'LUNAR')
                            .map((med, idx) => (
                              <div key={idx} className="flex items-center gap-4 p-4 bg-[#F8F9FE] rounded-[1.8rem] border border-card-border shadow-sm group hover:border-[#C78200]/20 transition-all">
                                <div className={cn(
                                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                                  med.type === 'LUNAR' ? "bg-[#1A1C2E] text-white" : "bg-[#C78200] text-white"
                                )}>
                                  {med.type === 'LUNAR' ? <Moon size={18} /> : <Zap size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className="text-ink text-[11px] font-black tracking-tight leading-none truncate">{med.title}</p>
                                    <span className="text-[7px] font-black px-2 py-0.5 rounded-full bg-white border border-card-border text-ink/30 uppercase tracking-widest">{med.applicationType || 'SOP'}</span>
                                  </div>
                                  <p className="text-ink/60 text-[10px] font-medium leading-[1.4] line-clamp-2">
                                    {med.dose && <span className="text-[#C78200] font-black uppercase tracking-widest mr-1">[{med.dose}]</span>}
                                    {med.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          {getSOPGuidance(calculateDOC(selectedPond.stockingDate, selectedDate.toISOString()), selectedDate)
                            .filter(s => s.type === 'MEDICINE' || s.type === 'LUNAR').length === 0 && (
                              <p className="text-ink/30 text-[10px] font-black text-center py-4 uppercase tracking-widest">No primary medicines scheduled</p>
                            )}
                        </div>
                      </motion.div>

                      <div className="bg-[#C78200]/5 p-3 rounded-[2.5rem] border border-[#C78200]/10 mt-6">
                        <div className="flex items-center gap-3 mb-3 text-[#C78200]">
                          <AlertTriangle size={18} />
                          <h4 className="text-[10px] font-black uppercase tracking-widest">personalized Planning Tip</h4>
                        </div>
                        <p className="text-ink/60 text-[11px] leading-relaxed font-bold">
                          Based on your pond's stock date ({selectedPond.shrimpType}), the high-risk molting period is locked to the lunar cycle.
                          <span className="text-indigo-900 font-black ml-1">🌑 New Moon</span> triggers on {lunarForecast.find(d => d.status.phase === 'AMAVASYA')?.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) || 'Cycle Peak'}.
                          Ensure DO is &gt; 5ppm.
                        </p>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Disease Observation Card - Shows only on TODAY tab after DOC 20 or if stress detected */}
            {((currentDoc > 20) || (currentDoc > 0 && riskLevel !== 'STABLE')) && activeTab === 'today' && (
              <section className="bg-red-50 rounded-[2.5rem] p-4 border border-red-100 relative overflow-hidden">
                <div className="flex items-center gap-4 mb-5">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all",
                    riskLevel === 'CRITICAL' ? "bg-red-600 animate-pulse" : "bg-red-500"
                  )}>
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-ink text-lg font-black tracking-tighter">
                      {riskLevel === 'CRITICAL' ? "⚠️ EXTREME RISK ALERT" : t.diseaseAlert}
                    </h2>
                    <p className={cn(
                      "text-[9px] font-black uppercase tracking-widest leading-tight",
                      riskLevel === 'CRITICAL' ? "text-red-700" : "text-red-400"
                    )}>
                      {currentDoc <= 30 ? "Early Risk: Bacteria / PL Stress" :
                        currentDoc <= 60 ? "Critical Zone: Vibriosis / WSSV" :
                          "Late Risk: EHP / EMS Stage"} {riskLevel === 'CRITICAL' && "- ENVIRONMENTAL STRESS DETECTED"}
                    </p>
                  </div>
                </div>

                <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 mb-5">
                  <p className="text-red-900/70 text-[10px] font-black uppercase tracking-widest mb-2">Live Analysis Summary:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-card/50 p-2 rounded-xl border border-red-100">
                      <p className="text-[7px] font-black text-red-400 uppercase">SOP Risk (Age)</p>
                      <p className="text-[11px] font-black text-ink">{isDOCRisk ? 'ACTIVE' : 'STABLE'}</p>
                    </div>
                    <div className="bg-card/50 p-2 rounded-xl border border-red-100">
                      <p className="text-[7px] font-black text-red-400 uppercase">Pond Data (Latest)</p>
                      <p className="text-[11px] font-black text-ink">{isWaterRisk ? 'STRESS DETECTED' : 'NORMAL'}</p>
                    </div>
                  </div>
                  {isWaterRisk && latestRead && (
                    <p className="text-red-600 text-[10px] font-bold mt-3 leading-tight">
                      ⚠️ Detectable risk due to {latestRead.do < 4.0 ? 'LOW DO (' + latestRead.do + ')' : ''}
                      {latestRead.ph > 8.5 ? ' HIGH PH (' + latestRead.ph + ')' : ''}
                      {latestRead.temp > 31 ? ' HIGH TEMP (' + latestRead.temp + ')' : ''}.
                    </p>
                  )}
                </div>

                <p className="text-red-900/50 text-[11px] font-bold tracking-tight leading-relaxed mb-5">
                  Based on **DOC {currentDoc}** + **Daily Pond Data**, monitor these specific symptoms:
                </p>

                <div className="space-y-2.5 mb-6">
                  {currentDoc <= 30 ? (
                    <>
                      <SymptomItem icon={Activity} label="Poor feeding response" />
                      <SymptomItem icon={Eye} label="Slow / Erratic swimming" />
                      <SymptomItem icon={Waves} label="Dirty water / Foaming" />
                    </>
                  ) : currentDoc <= 60 ? (
                    <>
                      <SymptomItem icon={Eye} label={t.opaqueMuscleSign} />
                      <SymptomItem icon={Activity} label={t.softShellSign} />
                      <SymptomItem icon={Zap} label="Reddish body tint" />
                    </>
                  ) : (
                    <>
                      <SymptomItem icon={Zap} label={t.surfaceBubbleSign} />
                      <SymptomItem icon={CheckCircle2} label="White spots on cephalothorax" />
                      <SymptomItem icon={AlertTriangle} label="Empty midgut / Pale liver" />
                    </>
                  )}
                </div>

                <button
                  onClick={() => navigate('/disease-detection')}
                  className="w-full py-4 bg-red-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <span className="animate-pulse">★</span> {t.diagnoseNow}
                </button>
              </section>
            )}


            {/* Weekly Model Card (Hidden on Lunar and Full Cycle tabs to avoid confusion) */}
            {activeTab === 'today' && (
              <section className="bg-card rounded-[2.5rem] p-4 border border-card-border shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-[#C78200]/10 rounded-2xl flex items-center justify-center text-[#C78200]">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="text-ink font-black text-base tracking-tight">Weekly SOP Model</h3>
                    <p className="text-ink/40 text-[9px] font-black uppercase tracking-widest">Recurring schedule</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { day: 'Mon', task: currentDoc < 0 ? 'Chlorine Pulse (Prep)' : 'Mineral Mix Application', color: 'bg-amber-500' },
                    { day: 'Tue', task: currentDoc < 0 ? 'Soil Neutralizer (Prep)' : 'Water Probiotic (1st)', color: 'bg-blue-500' },
                    { day: 'Wed', task: currentDoc < 0 ? 'Water Probiotic (Prep)' : (currentDoc <= 20 ? 'Daily Sequence' : 'Gut Probiotic (Intensive)'), color: 'bg-emerald-500' },
                    { day: 'Thu', task: currentDoc < 0 ? 'Mineral Prep (Prep)' : 'Water Probiotic (2nd)', color: 'bg-blue-400' },
                    { day: 'Fri', task: currentDoc < 0 ? 'Water Probiotic (Prep)' : 'Mineral Stabilization', color: 'bg-amber-400' },
                    { day: 'Sat', task: currentDoc < 0 ? 'Algae Booster (Prep)' : 'Immunity Booster', color: 'bg-red-500' },
                    { day: 'Sun', task: currentDoc < 0 ? 'Quality Audit (Prep)' : 'Full Water Parameter Check', color: 'bg-[#0D523C]' },
                  ].map((item, i) => {
                    const dayIdx = [1, 2, 3, 4, 5, 6, 0][i];
                    const isToday = dayIdx === selectedDate.getDay();
                    return (
                      <div key={i} className={cn(
                        'flex items-center gap-4 p-3 rounded-2xl transition-all',
                        isToday ? 'bg-[#0D523C]/5 border border-[#0D523C]/10' : 'hover:bg-[#F8F9FE]'
                      )}>
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', item.color)}>
                          <span className="text-[9px] font-black text-white">{item.day}</span>
                        </div>
                        <p className={cn('text-[11px] font-black tracking-tight flex-1', isToday ? 'text-[#0D523C]' : 'text-ink')}>
                          {item.task}
                        </p>
                        {isToday && (
                          <span className="text-[7px] font-black text-[#0D523C] bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Today</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ─────────────── TAB 5: MY SOP ─────────────── */}
            {(activeTab as string) === 'my_sop' && (
              <motion.div
                key="my_sop"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[11px] font-black text-ink tracking-tight">My Custom SOPs</h3>
                    <p className="text-[8px] font-bold text-ink/40 uppercase tracking-widest mt-0.5">
                      Your medicines · real rates · personal schedule
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSOPForm(v => !v)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-purple-600 text-white text-[8px] font-black uppercase tracking-widest shadow-lg"
                  >
                    <Plus size={12} />
                    Add Medicine
                  </motion.button>
                </div>

                {/* Add medicine form */}
                <AnimatePresence>
                  {showSOPForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="rounded-[2rem] border border-purple-200 bg-purple-50/60 backdrop-blur-sm overflow-hidden"
                    >
                      <div className="p-5 space-y-3">
                        <p className="text-[8px] font-black text-purple-700 uppercase tracking-widest">🧪 New Custom Medicine SOP</p>

                        {/* Name */}
                        <div>
                          <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-1">Medicine Name *</label>
                          <input
                            className="w-full px-4 py-3 rounded-2xl border border-purple-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-purple-400"
                            placeholder="e.g. Bioclean Aqua Plus"
                            value={sopForm.name}
                            onChange={e => setSOPForm(p => ({ ...p, name: e.target.value }))}
                          />
                        </div>

                        {/* Type + Unit row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-1">Type</label>
                            <select
                              className="w-full px-3 py-3 rounded-2xl border border-purple-200 bg-white text-xs font-bold text-slate-800 outline-none"
                              value={sopForm.type}
                              onChange={e => setSOPForm(p => ({ ...p, type: e.target.value as any }))}
                            >
                              <option value="probiotic">🦠 Probiotic</option>
                              <option value="mineral">💎 Mineral</option>
                              <option value="vitamin">💊 Vitamin</option>
                              <option value="antibiotic">🔬 Antibiotic</option>
                              <option value="feed_additive">🌿 Feed Additive</option>
                              <option value="other">📦 Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-1">Unit</label>
                            <select
                              className="w-full px-3 py-3 rounded-2xl border border-purple-200 bg-white text-xs font-bold text-slate-800 outline-none"
                              value={sopForm.unit}
                              onChange={e => setSOPForm(p => ({ ...p, unit: e.target.value as any }))}
                            >
                              <option value="kg">per kg</option>
                              <option value="L">per Litre</option>
                              <option value="g">per 100g</option>
                              <option value="ml">per 100ml</option>
                              <option value="packet">per Packet</option>
                            </select>
                          </div>
                        </div>

                        {/* Rate + Dose row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-1">Rate (₹) *</label>
                            <input
                              className="w-full px-4 py-3 rounded-2xl border border-purple-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-purple-400"
                              placeholder="e.g. 450"
                              type="number"
                              value={sopForm.rate}
                              onChange={e => setSOPForm(p => ({ ...p, rate: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-1">Dose / Acre</label>
                            <input
                              className="w-full px-4 py-3 rounded-2xl border border-purple-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-purple-400"
                              placeholder="e.g. 250g"
                              value={sopForm.dosePerAcre}
                              onChange={e => setSOPForm(p => ({ ...p, dosePerAcre: e.target.value }))}
                            />
                          </div>
                        </div>

                        {/* DOC Range */}
                        <div>
                          <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-1">DOC Range / Frequency</label>
                          <input
                            className="w-full px-4 py-3 rounded-2xl border border-purple-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-purple-400"
                            placeholder="e.g. DOC 1–30 or Every 5 days"
                            value={sopForm.docRange}
                            onChange={e => setSOPForm(p => ({ ...p, docRange: e.target.value }))}
                          />
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-1">Notes (optional)</label>
                          <input
                            className="w-full px-4 py-3 rounded-2xl border border-purple-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-purple-400"
                            placeholder="e.g. Apply morning only, avoid rainy days"
                            value={sopForm.notes}
                            onChange={e => setSOPForm(p => ({ ...p, notes: e.target.value }))}
                          />
                        </div>

                        {/* Submit */}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={addFarmerSOP}
                            disabled={!sopForm.name.trim() || !sopForm.rate}
                            className="flex-1 py-3 rounded-2xl bg-purple-600 text-white text-[8px] font-black uppercase tracking-widest disabled:opacity-40 shadow-lg"
                          >
                            ✓ Save to My SOP
                          </button>
                          <button onClick={() => setShowSOPForm(false)}
                            className="px-4 py-3 rounded-2xl border border-purple-200 text-[8px] font-black text-purple-600 uppercase tracking-widest"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty state */}
                {farmerSOPs.length === 0 && !showSOPForm && (
                  <div className="rounded-[2rem] border border-dashed border-purple-300/50 bg-purple-50/30 p-8 text-center">
                    <div className="text-4xl mb-3">🧪</div>
                    <p className="text-[10px] font-black text-purple-700 mb-1">No Custom SOPs Yet</p>
                    <p className="text-[8px] text-slate-400 font-medium leading-relaxed">
                      Add your own medicines with exact rates.<br />They'll appear here as your personal SOP.
                    </p>
                  </div>
                )}

                {/* SOP cards list */}
                {farmerSOPs.map((sop, i) => {
                  const meta = TYPE_META[sop.type];
                  const costPerAcre = sop.rate;
                  const totalCost = Math.round(costPerAcre * Math.max(1, pondAcreage));
                  const isSelected = completedMeds.includes(sop.name);
                  return (
                    <motion.div
                      key={sop.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={cn(
                        'rounded-[1.8rem] border p-4 transition-all',
                        isSelected
                          ? 'border-purple-400 bg-purple-500/10'
                          : 'border-purple-100 bg-white'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Type icon */}
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
                            style={{ backgroundColor: `${meta.color}18` }}
                          >
                            {meta.emoji}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="text-[11px] font-black text-slate-900 tracking-tight">{sop.name}</p>
                              <span
                                className="text-[6px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest text-white"
                                style={{ backgroundColor: meta.color }}
                              >
                                {sop.type.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                              {sop.dosePerAcre && (
                                <p className="text-[8px] font-bold text-slate-500">📦 {sop.dosePerAcre}/acre</p>
                              )}
                              {sop.docRange && (
                                <p className="text-[8px] font-bold text-slate-500">📅 {sop.docRange}</p>
                              )}
                              <p className="text-[8px] font-black" style={{ color: meta.color }}>
                                ₹{sop.rate}/{sop.unit} · Est. ₹{totalCost} for {pondAcreage} acre
                              </p>
                            </div>
                            {sop.notes && (
                              <p className="text-[7px] font-medium text-slate-400 mt-1 italic">{sop.notes}</p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => toggleMed(sop.name)}
                            className={cn(
                              'px-3 py-1.5 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all border',
                              isSelected
                                ? 'bg-purple-500 text-white border-purple-500'
                                : 'border-purple-200 text-purple-600'
                            )}
                          >
                            {isSelected ? '✓ Selected' : '+ Select'}
                          </button>
                          <button
                            onClick={() => deleteFarmerSOP(sop.id)}
                            className="px-3 py-1.5 rounded-xl text-[7px] font-black text-red-400 border border-red-100 uppercase tracking-widest"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Log selected farmer SOPs */}
                {completedMeds.filter(m => farmerSOPs.some(s => s.name === m)).length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    onClick={handleLog}
                    disabled={isLogging}
                    className="w-full py-4 rounded-[1.8rem] bg-gradient-to-r from-purple-600 to-purple-800 text-white text-[9px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50"
                  >
                    {isLogging ? '⌛ Saving...' : `📋 Log ${completedMeds.filter(m => farmerSOPs.some(s => s.name === m)).length} Medicine(s) Applied Today`}
                  </motion.button>
                )}
              </motion.div>
            )}

          </>
        )}
      </div>
    </div>

  );
};

const SymptomItem = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <div className="p-4 rounded-2xl bg-card flex items-center gap-4 shadow-sm border border-red-50 transition-all hover:scale-[1.01]">
    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
      <Icon size={18} />
    </div>
    <span className="text-ink text-[11px] font-black tracking-tight">{label}</span>
  </div>
);
