import * as React from 'react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Camera, X, AlertTriangle, Sparkles, Waves, ChevronLeft,
  CheckCircle2, ShieldCheck, ArrowRight, Bug, RefreshCw,
  Activity, Eye, Fish, FlaskConical, BookOpen, ChevronRight,
  ChevronDown, Info, Zap, Shield, TrendingUp, Droplets,
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { User } from '../../types';
import { analyzeShrimpHealth } from '../../services/geminiService';
import {
  DISEASE_SOPS, DISEASE_CATALOG, DiseaseSOP,
  mapSymptomsToSOP, mapAIResultToSOP,
} from '../../data/diseaseSOPs';
import { computeDiseaseRisk, RISK_COLORS, STAGE_META, SEASON_META } from '../../utils/diseaseRiskEngine';
import { calculateDOC } from '../../utils/pondUtils';

// ─── SYMPTOM OPTIONS — English ────────────────────────────────────────────────
const SYMPTOM_OPTIONS_EN = [
  // White Gut
  { label: 'White / Pale Gut Line Visible',       key: 'white gut',           disease: 'white_gut'   },
  { label: 'White Fecal Strings in Water',         key: 'fecal strings',       disease: 'white_gut'   },
  { label: 'Uneaten Feed Remaining in Trays',      key: 'uneaten feed',        disease: 'white_gut'   },
  // WSSV
  { label: 'White Spots on Shell / Carapace',      key: 'white spot',          disease: 'wssv'        },
  { label: 'Reddish / Pink Body Color',            key: 'reddish body',        disease: 'wssv'        },
  { label: 'High Mortality (50+ per day)',         key: 'high mortality',      disease: 'wssv'        },
  // EMS / AHPND
  { label: 'Sudden Mass Death (Day 7–30)',         key: 'sudden death',        disease: 'ems_ahpnd'   },
  { label: 'Pale / White Hepatopancreas (Liver)',  key: 'pale hepatopancreas', disease: 'ems_ahpnd'   },
  { label: 'Soft / Wrinkled Shell',               key: 'soft shell',          disease: 'ems_ahpnd'   },
  // EHP
  { label: 'Severely Slow / Stunted Growth',      key: 'slow growth',         disease: 'ehp'         },
  { label: 'Uneven / Mixed Size in Pond',         key: 'size variation',      disease: 'ehp'         },
  // Vibriosis
  { label: 'Glow / Luminescence at Night',        key: 'glowing night',       disease: 'vibriosis'   },
  { label: 'Red / Necrotic Legs or Tail',         key: 'red appendages',      disease: 'vibriosis'   },
  // Black Gill
  { label: 'Black or Dark Brown Gills',           key: 'black gill',          disease: 'black_gill'  },
  { label: 'Shrimp Coming to Surface for Air',    key: 'surfacing',           disease: 'black_gill'  },
  // RMS
  { label: 'Continuous Low Daily Mortality',      key: 'running mortality',   disease: 'rms'         },
  // IHHNV
  { label: 'Bent / Deformed Rostrum or Body',     key: 'deformed rostrum',    disease: 'ihhnv'       },
  // Shell Disease
  { label: 'Black / Brown Spots on Shell',        key: 'shell spots',         disease: 'shell_disease'},
  { label: 'Molting Problems / Stuck in Molt',    key: 'molting trouble',     disease: 'shell_disease'},
  // Fouling
  { label: 'Fuzzy / Dirty Coating on Body',       key: 'fouling coating',     disease: 'fouling'     },
];

// ─── SYMPTOM OPTIONS — Telugu ─────────────────────────────────────────────────
const SYMPTOM_OPTIONS_TE = [
  { label: 'తెలుపు / వెలిసిన పొట్టు రేఖ కనిపిస్తుంది',  key: 'white gut',           disease: 'white_gut'   },
  { label: 'నీళ్ళలో తెలుపు విసర్జన తంతులు',                   key: 'fecal strings',       disease: 'white_gut'   },
  { label: 'ట్రేల్లో తిన్నని మేత మిగిలిపోతుంది',               key: 'uneaten feed',        disease: 'white_gut'   },
  { label: 'చిప్ప / లోపల పొట్టుపై తెలుపు మచ్చలు',          key: 'white spot',          disease: 'wssv'        },
  { label: 'ఎర్రని / గులాబీ శరీర వర్ణం',                    key: 'reddish body',        disease: 'wssv'        },
  { label: 'అధిక మరణాలు (50+ ప్రతి రోజు)',             key: 'high mortality',      disease: 'wssv'        },
  { label: 'ప్రస్తుత మాస మరణం (7-30 రోజులు)',         key: 'sudden death',        disease: 'ems_ahpnd'   },
  { label: 'వెలిసిన హెపాటోపాంక్రియాస్ (కాలేయం)',     key: 'pale hepatopancreas', disease: 'ems_ahpnd'   },
  { label: 'మెత్తని / చురుకలు పోయిన చిప్ప',                  key: 'soft shell',          disease: 'ems_ahpnd'   },
  { label: 'చాలా నిధానంగా పెరుగుతుంది / పెరుగుదల తభ్పు',  key: 'slow growth',         disease: 'ehp'         },
  { label: 'చెరువులో సమాన పరిమాణం లేదు',                   key: 'size variation',      disease: 'ehp'         },
  { label: 'రాత్రిపుడు వెలుతుంది / దీప్తి',                key: 'glowing night',       disease: 'vibriosis'   },
  { label: 'ఎర్రని / కురుచుపట్టిన కాళ్ళు లేదా తణుపు',  key: 'red appendages',      disease: 'vibriosis'   },
  { label: 'నలది / గాఢంగా డార్క్ బ్రౌన్ చెవులు',             key: 'black gill',          disease: 'black_gill'  },
  { label: 'రొయ్య గాలి కోసం పైకి వస్తుంది',                key: 'surfacing',           disease: 'black_gill'  },
  { label: 'నిరంతరం తక్కువ మరణాలు',                          key: 'running mortality',   disease: 'rms'         },
  { label: 'వంకరించిన / వికృత షిక్ష లేదా శరీరం',       key: 'deformed rostrum',    disease: 'ihhnv'       },
  { label: 'చిప్పపై నల్లని / డార్క్ బ్రౌన్ మచ్చలు',    key: 'shell spots',         disease: 'shell_disease'},
  { label: 'షెడ్డింగ్ సమస్యలు / షెడ్డింగ్లో ఇరుకుకుపోవడం',  key: 'molting trouble',     disease: 'shell_disease'},
  { label: 'శరీరంపై ముగ్గు / మురుకు పొత ఉంది',              key: 'fouling coating',     disease: 'fouling'     },
];

const DANGER_CONFIG = {
  low:      { bg: 'bg-blue-500',   light: 'bg-blue-50 border-blue-200 text-blue-800',      dark: 'bg-blue-500/10 border-blue-500/20 text-blue-400',    label: 'LOW' },
  moderate: { bg: 'bg-amber-500',  light: 'bg-amber-50 border-amber-200 text-amber-800',   dark: 'bg-amber-500/10 border-amber-500/20 text-amber-400',  label: 'MODERATE' },
  high:     { bg: 'bg-orange-500', light: 'bg-orange-50 border-orange-200 text-orange-800',dark: 'bg-orange-500/10 border-orange-500/20 text-orange-400', label: 'HIGH' },
  critical: { bg: 'bg-red-600',   light: 'bg-red-50 border-red-200 text-red-800',          dark: 'bg-red-500/10 border-red-500/20 text-red-400',       label: 'CRITICAL' },
};

const SEVERITY_HERO: Record<string, string> = {
  Safe:     'from-emerald-600 to-emerald-800',
  Low:      'from-blue-600 to-blue-900',
  Medium:   'from-amber-600 to-amber-800',
  Moderate: 'from-amber-500 to-amber-800',
  High:     'from-orange-600 to-red-800',
  Critical: 'from-red-600 to-red-900',
  'N/A':    'from-slate-600 to-slate-900',
};

// ─── DISEASE CARD (Knowledge Browser) ────────────────────────────────────────
const DiseaseCard = ({ sop, isDark, onSelect }: { sop: DiseaseSOP; isDark: boolean; onSelect: () => void; key?: React.Key }) => {
  const danger = DANGER_CONFIG[sop.dangerLevel];
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn('rounded-[2rem] border p-4 cursor-pointer transition-all group', isDark ? 'bg-[#0D1520] border-white/5 hover:border-white/15' : 'bg-white border-slate-100 shadow-sm hover:shadow-md')}
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', danger.bg)}>
          <Bug size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn('font-black text-xs tracking-tight leading-snug', isDark ? 'text-white' : 'text-slate-900')}>{sop.name}</h3>
            <ChevronRight size={14} className={cn('flex-shrink-0 mt-0.5 group-hover:translate-x-1 transition-transform', isDark ? 'text-white/20' : 'text-slate-300')} />
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={cn('text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', isDark ? danger.dark : danger.light)}>{danger.label}</span>
            <span className={cn('text-[6px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>{sop.docRisk}</span>
            <span className={cn('text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-slate-100 border-slate-200 text-slate-500')}>{sop.category}</span>
          </div>
          <p className={cn('text-[8px] font-medium leading-relaxed mt-2 line-clamp-2', isDark ? 'text-white/30' : 'text-slate-500')}>{sop.symptoms[0]} · {sop.symptoms[1]}</p>
        </div>
      </div>
    </motion.div>
  );
};

// ─── FULL SOP VIEW ────────────────────────────────────────────────────────────
const SOPView = ({ sop, isDark, onClose, lang }: { sop: DiseaseSOP; isDark: boolean; onClose: () => void; lang: string }) => {
  const isTe = lang === 'Telugu';
  const danger = DANGER_CONFIG[sop.dangerLevel];
  const [openSection, setOpenSection] = useState<string | null>('actions');
  const severityGrad = SEVERITY_HERO[sop.dangerLevel === 'critical' ? 'Critical' : sop.dangerLevel === 'high' ? 'High' : sop.dangerLevel === 'moderate' ? 'Moderate' : 'Low'] ?? 'from-slate-700 to-slate-900';

  const Section = ({ id, title, icon: Icon, color, children }: { id: string; title: string; icon: any; color: string; children: React.ReactNode }) => (
    <div className={cn('rounded-[2rem] border overflow-hidden', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
      <button
        onClick={() => setOpenSection(openSection === id ? null : id)}
        className={cn('w-full px-5 py-4 flex items-center justify-between', isDark ? 'hover:bg-white/3' : 'hover:bg-slate-50')}
      >
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-white', color)}>
            <Icon size={14} />
          </div>
          <p className={cn('font-black text-xs tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{title}</p>
        </div>
        <ChevronDown size={14} className={cn('transition-transform', isDark ? 'text-white/25' : 'text-slate-400', openSection === id ? 'rotate-180' : '')} />
      </button>
      <AnimatePresence>
        {openSection === id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={cn('px-5 pb-5 pt-0 border-t', isDark ? 'border-white/5' : 'border-slate-100')}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-3 pb-10"
    >
      {/* Back */}
      <button onClick={onClose} className={cn('flex items-center gap-2 text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/30 hover:text-white/60' : 'text-slate-400 hover:text-slate-700')}>
        <ChevronLeft size={14} /> {isTe ? 'గ్రంధాలయానికి తిరిగి' : 'Back to library'}
      </button>

      {/* Hero */}
      <div className={cn('rounded-[2.5rem] p-6 text-white relative overflow-hidden', `bg-gradient-to-br ${severityGrad}`)}>
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full blur-[60px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">{danger.label} RISK</span>
            <span className="text-white/40 text-[7px] font-black uppercase tracking-widest">{sop.docRisk}</span>
            <span className="text-white/30 text-[7px] font-bold">{sop.category}</span>
          </div>
          <h2 className="text-xl font-black tracking-tight mb-1">{sop.name}</h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-white/40 text-[7px] font-bold uppercase tracking-widest">{isTe ? 'కారణం:' : 'Caused by:'}</span>
            <span className="text-white/70 text-[8px] font-black">{sop.causedBy}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-white/40 text-[7px] font-black uppercase tracking-widest mb-1">🔍 {isTe ? 'ముఖ్య దృశ్య సంజ్ఞ' : 'Key Visual Marker'}</p>
            <p className="text-white/75 text-[9px] font-bold italic">{sop.visualMarkers[0]}</p>
          </div>
        </div>
      </div>

      {/* Symptoms + Early Warnings */}
      <div className={cn('rounded-[2rem] p-4 border', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
        <p className={cn('text-[8px] font-black uppercase tracking-widest mb-3', isDark ? 'text-white/30' : 'text-slate-400')}>{isTe ? 'ముఖ్య లక్షణాలు' : 'Key Symptoms'}</p>
        <div className="space-y-2 mb-4">
          {sop.symptoms.map((s, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5', danger.bg)} />
              <p className={cn('text-[10px] font-bold leading-snug', isDark ? 'text-white/60' : 'text-slate-600')}>{s}</p>
            </div>
          ))}
        </div>
        {sop.earlyWarnings?.length > 0 && (
          <>
            <p className={cn('text-[8px] font-black uppercase tracking-widest mb-2 mt-3 pt-3 border-t', isDark ? 'text-amber-400/60 border-white/5' : 'text-amber-700 border-slate-100')}>⚠ {isTe ? 'ముందస్తు హెచ్చరిక సంకేతాలు' : 'Early Warning Signs'}</p>
            <div className="space-y-1.5">
              {sop.earlyWarnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 text-[10px] flex-shrink-0">⚠</span>
                  <p className={cn('text-[9px] font-bold', isDark ? 'text-white/50' : 'text-amber-800/70')}>{w}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sections */}
      <Section id="actions" title={isTe ? "వెంటనే చర్యలు (1వ రోజు)" : "Immediate Actions (Day 1)"} icon={AlertTriangle} color="bg-red-500">
        <ul className="space-y-2 mt-4">
          {sop.immediateActions.map((a, i) => (
            <li key={i} className="flex gap-2.5 items-start">
              <span className="text-red-500 font-black text-xs flex-shrink-0">🚨</span>
              <p className={cn('text-[10px] font-bold leading-relaxed', isDark ? 'text-white/70' : 'text-slate-700')}>{a}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="protocol" title={isTe ? "చికిత్స ప్రోటోకాల్" : "Treatment Protocol"} icon={FlaskConical} color="bg-emerald-600">
        <div className="space-y-4 mt-4">
          <div>
            <span className={cn('text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-2', isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700')}>{isTe ? "నీటి చికిత్స" : "Water Treatment"}</span>
            <ul className="space-y-1.5 ml-1">
              {sop.protocol.water.map((m, i) => <li key={i} className={cn('text-[10px] font-bold flex gap-2', isDark ? 'text-white/60' : 'text-slate-600')}><span className="text-emerald-500">•</span>{m}</li>)}
            </ul>
          </div>
          <div>
            <span className={cn('text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-2', isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-700')}>{isTe ? "మేతలో మందులు" : "Feed Medication"}</span>
            <ul className="space-y-1.5 ml-1">
              {sop.protocol.feed.map((m, i) => <li key={i} className={cn('text-[10px] font-bold flex gap-2', isDark ? 'text-white/60' : 'text-slate-600')}><span className="text-blue-500">•</span>{m}</li>)}
            </ul>
          </div>
        </div>
      </Section>

      <Section id="feed" title={isTe ? "మేత విరామ ప్లాన్ (రోజువారీగా)" : "Feed Recovery Plan (Day-by-Day)"} icon={Fish} color="bg-amber-500">
        <div className="grid grid-cols-5 gap-2 mt-4">
          {sop.feedManagement.map((f, i) => (
            <div key={i} className={cn('rounded-xl p-2 text-center border', isDark ? 'bg-white/3 border-white/8' : 'bg-amber-50 border-amber-100')}>
              <p className={cn('text-[6px] font-black uppercase mb-1', isDark ? 'text-white/30' : 'text-amber-700')}>{isTe ? 'రోజు' : 'Day'} {f.day}</p>
              <p className={cn('text-[9px] font-black', isDark ? 'text-white/70' : 'text-amber-900')}>{f.quantity}</p>
              {f.note && <p className={cn('text-[5px] font-bold mt-0.5 leading-tight', isDark ? 'text-white/20' : 'text-amber-600/70')}>{f.note}</p>}
            </div>
          ))}
        </div>
      </Section>

      <Section id="water" title={isTe ? "లక్ష్య నీటి నాణ్యత" : "Target Water Quality"} icon={Waves} color="bg-blue-600">
        <div className="space-y-2 mt-4">
          {sop.waterQuality.map((wq, i) => (
            <div key={i} className={cn('flex items-center justify-between py-2 border-b last:border-0', isDark ? 'border-white/5' : 'border-slate-100')}>
              <span className={cn('text-[9px] font-black uppercase tracking-wider', isDark ? 'text-white/40' : 'text-slate-500')}>{wq.parameter}</span>
              <div className="text-right">
                <span className={cn('text-[10px] font-black', isDark ? 'text-white' : 'text-slate-800')}>{wq.value}</span>
                {wq.action && <p className={cn('text-[7px] font-bold', isDark ? 'text-blue-400/60' : 'text-blue-600/70')}>{wq.action}</p>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="recovery" title={isTe ? "తిరిగి చేరుకోవడం & తప్పిదమలు" : "Recovery Signs & Mistakes"} icon={CheckCircle2} color="bg-purple-600">
        <div className="mt-4 space-y-4">
          <div>
            <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2', isDark ? 'text-emerald-400' : 'text-emerald-700')}>{isTe ? "✔ తిరిగి చేరుకొన్న సంకేతాలు" : "✔ Recovery Signs"}</p>
            {sop.recoverySigns.map((s, i) => <p key={i} className={cn('text-[10px] font-bold mb-1.5', isDark ? 'text-white/60' : 'text-slate-600')}>✓ {s}</p>)}
          </div>
          <div>
            <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2', isDark ? 'text-red-400' : 'text-red-700')}>{isTe ? "✕ చేయకూడని తప్పిదమలు" : "✕ Mistakes to Avoid"}</p>
            <div className="flex flex-wrap gap-1.5">
              {sop.mistakes.map((m, i) => (
                <span key={i} className={cn('text-[7px] font-black uppercase px-2 py-1 rounded-xl border', isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700')}>🚫 {m}</span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section id="prevention" title={isTe ? "నివారణ చిట్కాళు" : "Prevention Tips"} icon={ShieldCheck} color="bg-emerald-700">
        <ul className="space-y-2 mt-4">
          {sop.preventionTips.map((p, i) => (
            <li key={i} className="flex gap-2.5 items-start">
              <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className={cn('text-[10px] font-bold leading-snug', isDark ? 'text-white/60' : 'text-slate-600')}>{p}</p>
            </li>
          ))}
        </ul>
      </Section>
    </motion.div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export const DiseaseDetection = ({ user, t }: { user: User; t: Translations }) => {
  const { isPro, theme, ponds, waterRecords, updatePond } = useData();
  const navigate = useNavigate();
  const isDark   = theme === 'dark' || theme === 'midnight';
  const isTe     = user.language === 'Telugu';
  const SYMPTOM_OPTIONS = isTe ? SYMPTOM_OPTIONS_TE : SYMPTOM_OPTIONS_EN;

  // ── Scan Quota per Plan ──
  const getScanLimit = () => {
    const s = user.subscriptionStatus;
    // Diamond = unlimited (Aqua 9)
    if (s === 'pro_diamond') return Infinity;
    // Gold = 60/month (Aqua 6)
    if (s === 'pro_gold')    return 60;
    // Silver = 25/month (Aqua 3)
    if (s === 'pro_silver')  return 25;
    // Base Pro = 10/month (Aqua 1)
    if (s === 'pro')         return 10;
    // Free = 3/month
    return 3;
  };
  const scanLimit = getScanLimit();
  const isUnlimited = scanLimit === Infinity;

  const getCurrentMonthKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const getScansUsed = (pondId: string) => {
    const pond = ponds.find(p => p.id === pondId);
    if (!pond?.diseaseScans) return 0;
    const monthKey = getCurrentMonthKey();
    // Auto-reset if month changed
    if (pond.diseaseScans.monthKey !== monthKey) return 0;
    return pond.diseaseScans.count;
  };

  // Pond selector for risk engine
  const [selectedPondId, setSelectedPondId] = useState(ponds[0]?.id || '');
  const selectedPond = ponds.find(p => p.id === selectedPondId);
  const currentDoc   = selectedPond ? calculateDOC(selectedPond.stockingDate) : 0;
  const latestWater  = useMemo(() =>
    waterRecords
      .filter(r => r.pondId === selectedPondId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0],
    [waterRecords, selectedPondId]
  );

  // Recalculate scansUsed reactively from selectedPondId
  const scansUsedForPond = getScansUsed(selectedPondId);

  const riskReport = useMemo(() => computeDiseaseRisk({
    doc: currentDoc,
    temperature: latestWater?.temp,
    doLevel: latestWater?.do,
    ammonia: latestWater?.ammonia,
    ph: latestWater?.ph,
  }), [currentDoc, latestWater]);

  const [step,               setStep]               = useState<'intro' | 'upload' | 'scanning' | 'result' | 'manual' | 'library' | 'sop'>('intro');
  const [image,              setImage]              = useState<string | null>(null);
  const [analysis,           setAnalysis]           = useState<any>(null);
  const [mappedSOP,          setMappedSOP]          = useState<DiseaseSOP | null>(null);
  const [selectedSymptoms,   setSelectedSymptoms]   = useState<string[]>([]);
  const [loadingMessage,     setLoadingMessage]     = useState('Initializing…');
  const [browsingSOP,        setBrowsingSOP]        = useState<DiseaseSOP | null>(null);
  const [isCameraActive,     setIsCameraActive]     = useState(false);
  const [stream,             setStream]             = useState<MediaStream | null>(null);
  const [showLimitDialog,    setShowLimitDialog]    = useState(false);  // ← inline limit dialog
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Scanning message cycle
  React.useEffect(() => {
    if (step === 'scanning') {
      const msgs = [
        'Uploading Specimen Image…',
        'Processing Visual Pixels…',
        'Mapping Health Markers…',
        'Identifying Pathogens…',
        'Running Diagnostic Engine…',
        'Generating SOP Plan…',
      ];
      let i = 0;
      const iv = setInterval(() => { setLoadingMessage(msgs[i++ % msgs.length]); }, 1800);
      return () => clearInterval(iv);
    }
  }, [step]);

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(ms);
      if (videoRef.current) videoRef.current.srcObject = ms;
      setIsCameraActive(true);
    } catch (err) { console.error('Camera error:', err); }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || videoRef.current.readyState < 2) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImage(dataUrl);
      stopCamera();
      runAnalysis(dataUrl);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImage(dataUrl);
      runAnalysis(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = async (imgData?: string) => {
    const data = imgData || image;
    if (!data) return;

    // ── Quota gate — show inline dialog instead of navigating ──
    if (!isUnlimited && scansUsedForPond >= scanLimit) {
      setShowLimitDialog(true);
      return;
    }

    setStep('scanning');
    setLoadingMessage('Initialising AI Analysis…');
    try {
      const result = await analyzeShrimpHealth(data, user.language || 'English');
      setAnalysis(result);
      const sop = mapAIResultToSOP(result.disease);
      setMappedSOP(sop);
      setStep('result');

      // ── Persist scan count to DB ──
      if (selectedPondId) {
        const pond = ponds.find(p => p.id === selectedPondId);
        const monthKey = getCurrentMonthKey();
        const prevScans = pond?.diseaseScans;
        const prevCount = prevScans?.monthKey === monthKey ? (prevScans?.count || 0) : 0;
        const prevHistory = prevScans?.history || [];

        await updatePond(selectedPondId, {
          diseaseScans: {
            count: prevCount + 1,
            monthKey,
            lastScanAt: new Date().toISOString(),
            history: [
              { date: new Date().toISOString(), disease: result.disease || 'Unknown', severity: result.severity || 'N/A', pondId: selectedPondId },
              ...prevHistory,
            ].slice(0, 20), // Keep last 20 scan records
          },
        } as any);
      }
    } catch (err: any) {
      const isQuota = err?.code === 'QUOTA_EXCEEDED' || err?.message?.includes('quota') || err?.message?.includes('RESOURCE_EXHAUSTED') || err?.message?.includes('free-tier');
      const is503   = !isQuota && (err?.message?.includes('overloaded') || err?.message?.includes('503') || err?.message?.includes('UNAVAILABLE') || err?.message?.includes('temporarily'));
      const retryAfter: number = err?.retryAfterSeconds || 60;

      setAnalysis({
        disease: isQuota ? 'Daily AI Limit Reached' : is503 ? 'AI Server Busy' : 'Analysis Error',
        confidence: 0,
        severity: 'N/A',
        affectedPart: 'N/A',
        reasoning: isQuota
          ? `The Gemini AI free-tier daily quota has been exhausted. This resets automatically. Please wait ${retryAfter} seconds and try again.`
          : is503
          ? '⚡ Google Gemini AI is experiencing high demand right now. The service auto-retried 3 times before showing this message.'
          : 'The system was unable to process the visual markers clearly.',
        action: isQuota
          ? `QUOTA_EXCEEDED|${retryAfter}`
          : is503
          ? '🔄 Please wait 30–60 seconds and tap "Try Again". The AI server should be available shortly.'
          : (err.message || 'Please try again with a clearer, well-lit photo.'),
      });
      setMappedSOP(null);
      setStep('result');
    }
  };


  const handleManualDiagnosis = () => {
    const sop = mapSymptomsToSOP(selectedSymptoms);
    if (sop) {
      setMappedSOP(sop);
      setAnalysis({
        disease: sop.name,
        confidence: 75,
        severity: sop.dangerLevel === 'critical' ? 'Critical' : sop.dangerLevel === 'high' ? 'High' : sop.dangerLevel === 'moderate' ? 'Medium' : 'Low',
        affectedPart: 'Multiple',
        reasoning: `Based on ${selectedSymptoms.length} symptoms selected — pattern matched to ${sop.shortName} protocol.`,
        action: sop.immediateActions.slice(0, 2).join('; '),
      });
    } else {
      setMappedSOP(null);
      setAnalysis({
        disease: 'Unconfirmed Condition',
        confidence: 40,
        severity: 'Low',
        affectedPart: 'N/A',
        reasoning: 'Symptom pattern does not strongly match known diseases. Monitor closely.',
        action: 'Observe for 24 hours. Check DO and water quality. Consult an expert if symptoms worsen.',
      });
    }
    setStep('result');
  };

  // ── Custom header ──
  const Header = ({ subtitle }: { subtitle: string }) => (
    <header className={cn(
      'fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 backdrop-blur-xl px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center justify-between border-b',
      isDark ? 'bg-[#070D12]/90 border-white/5' : 'bg-white/90 border-slate-100 shadow-sm'
    )}>
      <motion.button whileTap={{ scale: 0.9 }}
        onClick={() => {
          if (step === 'sop') { setStep('library'); setBrowsingSOP(null); }
          else if (step === 'library') setStep('intro');
          else if (step !== 'intro') setStep('intro');
          else navigate(-1);
        }}
        className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border',
          isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-white border-slate-200 text-slate-600 shadow-sm'
        )}>
        <ChevronLeft size={18} />
      </motion.button>
      <div className="text-center">
        <h1 className={cn('text-xs font-black tracking-tight uppercase', isDark ? 'text-white' : 'text-slate-900')}>{t.aiDisease}</h1>
        <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>{subtitle}</p>
      </div>
      <motion.button whileTap={{ scale: 0.9 }}
        onClick={() => setStep('library')}
        className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border',
          step === 'library' || step === 'sop'
            ? isDark ? 'bg-[#C78200]/20 border-[#C78200]/30 text-[#C78200]' : 'bg-amber-100 border-amber-300 text-amber-700'
            : isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white/70' : 'bg-white border-slate-200 text-slate-400 shadow-sm'
        )}>
        <BookOpen size={16} />
      </motion.button>
    </header>
  );

  const stepLabel = step === 'intro' ? t.ddStepPreparation : step === 'upload' ? t.ddStepScanOptions
    : step === 'manual' ? t.ddStepSymptomChecker : step === 'scanning' ? t.ddStepAnalyzing
    : step === 'result' ? t.ddStepDiagnosticComplete : step === 'library' ? t.ddStepDiseaseLibrary
    : step === 'sop' ? (browsingSOP?.shortName ?? t.ddStepSopDetails) : '';

  // ── FREE GATE — inline overlay dialog ──
  if (!isPro) {
    return (
      <div className={cn('min-h-screen pb-40 relative', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
        <Header subtitle="Pro Feature" />

        {/* Blurred library visible behind — shows value */}
        <div className="pt-24 px-4 space-y-4 opacity-30 pointer-events-none select-none" aria-hidden>
          {DISEASE_CATALOG.slice(0, 3).map(sop => (
            <DiseaseCard key={sop.id} sop={sop} isDark={isDark} onSelect={() => {}} />
          ))}
        </div>

        {/* Dim overlay */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30" />

        {/* Bottom Sheet dialog */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-40 bg-[#0A1218]/97 backdrop-blur-2xl rounded-t-[2.5rem] border border-white/10 shadow-2xl px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
        >
          <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-5" />

          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-[#C78200]/20 rounded-lg border border-[#C78200]/30 flex items-center justify-center">
                  <Sparkles size={11} className="text-[#C78200]" />
                </div>
                <p className="text-[#C78200] text-[7px] font-black uppercase tracking-widest">Pro Feature</p>
              </div>
              <h2 className="text-white text-[18px] font-black tracking-tight leading-tight">
                Unlock Smart<br />Diagnostic AI
              </h2>
            </div>
            <div className="bg-[#C78200]/10 border border-[#C78200]/20 rounded-2xl px-3 py-2 text-center">
              <p className="text-[22px] leading-none">🦠</p>
              <p className="text-[#C78200] text-[6px] font-black uppercase tracking-widest mt-1">AI Scan</p>
            </div>
          </div>

          <p className="text-white/40 text-[9px] font-medium leading-relaxed mb-4">
            Scan a shrimp photo — AI instantly detects WSSV, Vibriosis, EHP, White Gut, Black Gill and more, with full 5-day SOP treatment plans.
          </p>

          {/* Disease chips */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {['🦠 WSSV', '⚡ EMS', '🔬 EHP', '💧 White Gut', '🖤 Black Gill', '🧫 Vibriosis'].map((d, i) => (
              <motion.span key={i}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08 * i }}
                className="bg-white/5 border border-white/10 text-white/60 text-[8px] font-black px-2.5 py-1 rounded-full"
              >{d}</motion.span>
            ))}
          </div>

          {/* Plans */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { plan: 'Free', scans: '3/mo', color: 'text-white/40', border: 'border-white/10' },
              { plan: 'Pro Silver', scans: '10/mo', color: 'text-blue-400', border: 'border-blue-500/20' },
              { plan: 'Pro Gold', scans: 'Unlimited', color: 'text-[#C78200]', border: 'border-[#C78200]/30' },
            ].map((p, i) => (
              <div key={i} className={cn('rounded-2xl border py-2 px-2 text-center', p.border, isDark ? 'bg-white/3' : '')}>
                <p className={cn('text-[6px] font-black uppercase tracking-widest', p.color)}>{p.plan}</p>
                <p className="text-white text-[10px] font-black mt-0.5">{p.scans}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex gap-2.5">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(-1)}
              className="flex-1 py-3.5 rounded-2xl border border-white/10 text-white/50 font-black text-[9px] uppercase tracking-widest">
              Go Back
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }}
              onClick={() => navigate('/subscription')}
              className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-[#C78200] to-[#E09400] text-white font-black text-[9px] uppercase tracking-widest shadow-xl shadow-[#C78200]/25 flex items-center justify-center gap-2">
              <Sparkles size={12} /> Upgrade to Pro
            </motion.button>
          </div>
        </motion.div>

        {/* SOP overlay still works for preview */}
        {step === 'sop' && browsingSOP && (
          <div className={cn('fixed inset-0 z-50 overflow-y-auto pb-20 pt-24 px-4', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
            <SOPView sop={browsingSOP} isDark={isDark} lang={user.language} onClose={() => { setStep('intro'); setBrowsingSOP(null); }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen flex flex-col', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header subtitle={stepLabel} />

      {/* ── Scan Limit Dialog (Pro users who exhausted monthly quota) ── */}
      <AnimatePresence>
        {showLimitDialog && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={() => setShowLimitDialog(false)}
            />
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-[70] bg-[#0A1218]/97 backdrop-blur-2xl rounded-t-[2.5rem] border border-white/10 shadow-2xl px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
            >
              <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-4" />
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-red-500/20 rounded-lg border border-red-500/30 flex items-center justify-center">
                      <AlertTriangle size={11} className="text-red-400" />
                    </div>
                    <p className="text-red-400 text-[7px] font-black uppercase tracking-widest">Scan Limit Reached</p>
                  </div>
                  <h2 className="text-white text-[18px] font-black tracking-tight leading-tight">
                    Monthly Quota<br />Exhausted
                  </h2>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-3 py-2 text-center">
                  <p className="text-[22px] leading-none">🔒</p>
                  <p className="text-red-400 text-[6px] font-black uppercase tracking-widest mt-1">{scanLimit} used</p>
                </div>
              </div>
              <p className="text-white/40 text-[9px] font-medium leading-relaxed mb-4">
                You've used all {scanLimit} AI scans for this pond this month. Your quota resets on the 1st of next month — or upgrade to get more scans now.
              </p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { plan: user.subscriptionStatus === 'free' ? 'Free' : 'Pro Silver', scans: user.subscriptionStatus === 'free' ? '3/mo' : '10/mo', color: 'text-white/40', border: 'border-white/10', active: true },
                  { plan: 'Pro Silver', scans: '10/mo', color: 'text-blue-400', border: 'border-blue-500/20', active: false },
                  { plan: 'Pro Gold', scans: 'Unlimited', color: 'text-[#C78200]', border: 'border-[#C78200]/30', active: false },
                ].map((p, i) => (
                  <div key={i} className={cn('rounded-2xl border py-2 px-2 text-center', p.border, p.active ? 'bg-red-500/10' : 'bg-white/3')}>
                    <p className={cn('text-[6px] font-black uppercase tracking-widest', p.color)}>{p.plan}</p>
                    <p className="text-white text-[10px] font-black mt-0.5">{p.scans}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2.5">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowLimitDialog(false)}
                  className="flex-1 py-3.5 rounded-2xl border border-white/10 text-white/50 font-black text-[9px] uppercase tracking-widest">
                  Close
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }}
                  onClick={() => { setShowLimitDialog(false); navigate('/subscription'); }}
                  className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-[#C78200] to-[#E09400] text-white font-black text-[9px] uppercase tracking-widest shadow-xl shadow-[#C78200]/25 flex items-center justify-center gap-2">
                  <Sparkles size={12} /> Upgrade Plan
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 mt-20 pt-4 px-4 pb-10">
        <AnimatePresence mode="wait">

          {/* ── INTRO ── */}
          {step === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 pb-12">
              {/* Pond Selector */}
              {ponds.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {ponds.filter(p => p.status === 'active' || p.status === 'planned').map(p => (
                    <button key={p.id}
                      onClick={() => setSelectedPondId(p.id)}
                      className={cn(
                        'px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap border flex-shrink-0 transition-all',
                        selectedPondId === p.id
                          ? 'bg-[#0D523C] text-white border-[#0D523C] shadow-lg'
                          : isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
                      )}>
                      {p.name}
                    </button>
                  ))}
                </div>
              )}

              {/* ── AI SCAN QUOTA WIDGET ── */}
              {(() => {
                const pct = isUnlimited ? 100 : Math.min(100, (scansUsedForPond / scanLimit) * 100);
                const remaining = isUnlimited ? '∞' : Math.max(0, scanLimit - scansUsedForPond);
                const isExhausted = !isUnlimited && scansUsedForPond >= scanLimit;
                const barColor = isExhausted ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#10B981';
                const planLabel = user.subscriptionStatus === 'pro_gold' ? 'Pro Gold'
                  : user.subscriptionStatus === 'pro_diamond' ? 'Pro Diamond'
                  : user.subscriptionStatus === 'pro_silver' ? 'Pro Silver'
                  : user.subscriptionStatus === 'pro' ? 'Pro'
                  : 'Free';
                return (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className={cn('rounded-2xl border px-4 py-3',
                      isExhausted
                        ? isDark ? 'bg-red-500/8 border-red-500/20' : 'bg-red-50 border-red-200'
                        : isDark ? 'bg-white/3 border-white/8' : 'bg-white border-slate-100 shadow-sm'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={11} className={isExhausted ? 'text-red-400' : 'text-emerald-400'} />
                        <p className={cn('text-[8px] font-black uppercase tracking-widest',
                          isExhausted ? 'text-red-400' : isDark ? 'text-white/50' : 'text-slate-500'
                        )}>
                          AI Scans · {planLabel}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={cn('text-[10px] font-black tabular-nums',
                          isExhausted ? 'text-red-500' : isDark ? 'text-white/80' : 'text-slate-800'
                        )}>
                          {isUnlimited ? '∞' : scansUsedForPond}
                        </span>
                        {!isUnlimited && (
                          <span className={cn('text-[8px] font-medium', isDark ? 'text-white/30' : 'text-slate-400')}>
                            /{scanLimit} <span className={cn('text-[7px]', isDark ? 'text-white/20' : 'text-slate-300')}>this month</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {!isUnlimited && (
                      <div className={cn('h-1.5 rounded-full overflow-hidden mb-1.5', isDark ? 'bg-white/8' : 'bg-slate-100')}>
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: barColor }}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <p className={cn('text-[7px] font-medium', isDark ? 'text-white/25' : 'text-slate-400')}>
                        {isExhausted ? '⚠ Limit reached · resets 1st of next month'
                          : isUnlimited ? '✦ Unlimited scans on your plan'
                          : `${remaining} scan${Number(remaining) !== 1 ? 's' : ''} remaining`}
                      </p>
                      {!isUnlimited && (
                        <button onClick={() => navigate('/profile?tab=billing')}
                          className="text-[7px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors">
                          {user.subscriptionStatus === 'free' ? 'Upgrade →' : 'Go Unlimited →'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })()}

              {/* ── DISEASE RISK INTELLIGENCE PANEL ── */}
              {currentDoc > 0 && (() => {
                const oc = RISK_COLORS[riskReport.overallRisk];
                const stageMeta = STAGE_META[riskReport.stage];
                const seasonMeta = SEASON_META[riskReport.season];
                const topRisks = riskReport.topRisks.filter(r => r.riskScore > 15).slice(0, 5);
                return (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={cn('rounded-[2.5rem] overflow-hidden border shadow-xl',
                      isDark ? 'bg-gradient-to-br from-[#0A0F1A] to-[#0D1520] border-white/5' : 'bg-white border-slate-100')}>
                    {/* Header */}
                    <div className={cn('px-5 py-4 flex items-center justify-between',
                      riskReport.overallRisk === 'CRITICAL' ? 'bg-gradient-to-r from-red-900/60 to-red-800/30' :
                      riskReport.overallRisk === 'HIGH'     ? 'bg-gradient-to-r from-orange-900/50 to-orange-800/20' :
                      riskReport.overallRisk === 'MODERATE' ? 'bg-gradient-to-r from-amber-900/40 to-amber-800/10' :
                      isDark ? 'bg-white/3' : 'bg-emerald-50')}>
                      <div>
                        <p className={cn('text-[7px] font-black uppercase tracking-widest mb-0.5',
                          isDark ? 'text-white/30' : 'text-slate-400')}>{isTe ? 'లైవ్ దశ-ఆధారిత అంచనా' : 'Live Stage-Based Prediction'}</p>
                        <h3 className={cn('font-black text-sm tracking-tight',
                          isDark ? 'text-white' : 'text-slate-900')}>{isTe ? 'వ్యాధి ప్రమాద తెలివి' : 'Disease Risk Intelligence'}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs">{stageMeta.emoji}</span>
                          <span className={cn('text-[7px] font-black', stageMeta.color)}>{stageMeta.label} · DOC {currentDoc}</span>
                          <span className="text-white/20">·</span>
                          <span className="text-[7px] font-black text-white/40">{seasonMeta.emoji} {seasonMeta.label}</span>
                        </div>
                      </div>
                      <div className={cn('px-3 py-2 rounded-2xl border text-center min-w-[72px]', oc.badge)}>
                        <p className="text-[8px] font-black uppercase tracking-widest">{riskReport.overallRisk}</p>
                        <p className={cn('text-[7px] font-bold mt-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>{isTe ? 'మొత్తం' : 'Overall'}</p>
                      </div>
                    </div>

                    {/* Risk rows */}
                    <div className="px-4 py-3 space-y-1">
                      {topRisks.map((risk, i) => {
                        const rc = RISK_COLORS[risk.riskLevel];
                        const barW = Math.max(4, risk.riskScore);
                        return (
                          <div key={i} className={cn('rounded-2xl p-3 border',
                            isDark ? 'border-white/5 bg-white/2' : 'border-slate-50 bg-slate-50')}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-sm">{risk.emoji}</span>
                                <div className="min-w-0">
                                  <p className={cn('text-[10px] font-black tracking-tight',
                                    isDark ? 'text-white/80' : 'text-slate-800')}>{risk.name}</p>
                                  <p className={cn('text-[7px] font-medium truncate',
                                    isDark ? 'text-white/25' : 'text-slate-400')}>{risk.window}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={cn('text-[6px] font-black uppercase tracking-widest px-2 py-1 rounded-xl border', rc.badge)}>
                                  {risk.riskLevel}
                                </span>
                                <span className={cn('text-[10px] font-black w-7 text-right', rc.text)}>{risk.riskScore}</span>
                              </div>
                            </div>
                            {/* Risk bar */}
                            <div className={cn('h-1 rounded-full overflow-hidden', isDark ? 'bg-white/5' : 'bg-slate-200')}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${barW}%` }}
                                transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                                className={cn('h-full rounded-full', rc.bg)}
                              />
                            </div>
                            <p className={cn('text-[7px] font-medium mt-1 leading-relaxed',
                              isDark ? 'text-white/20' : 'text-slate-400')}>{risk.trigger}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Priority action */}
                    {topRisks[0] && topRisks[0].riskScore >= 50 && (
                      <div className={cn('mx-4 mb-4 px-4 py-3 rounded-2xl border',
                        isDark ? 'bg-red-500/8 border-red-500/15' : 'bg-red-50 border-red-200')}>
                        <p className="text-red-500 text-[7px] font-black uppercase tracking-widest mb-1">{isTe ? '⚠ ఇప్పుడే ముఖ్య చర్య' : '⚠ Priority Action Now'}</p>
                        <p className={cn('text-[9px] font-medium leading-relaxed',
                          isDark ? 'text-white/60' : 'text-slate-700')}>{topRisks[0].action}</p>
                      </div>
                    )}

                    {/* Prevention tips */}
                    <div className={cn('mx-4 mb-4 px-4 py-3 rounded-2xl border',
                      isDark ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-emerald-50 border-emerald-100')}>
                      <p className={cn('text-[7px] font-black uppercase tracking-widest mb-2',
                        isDark ? 'text-emerald-400/60' : 'text-emerald-700')}>{isTe ? '💡 దశ నివారణ చిట్కాలు' : '💡 Stage Prevention Tips'}</p>
                      <div className="space-y-1">
                        {riskReport.preventionTips.slice(0, 3).map((tip, i) => (
                          <p key={i} className={cn('text-[8px] font-medium leading-relaxed flex gap-1.5',
                            isDark ? 'text-white/40' : 'text-slate-600')}>
                            <span className="text-emerald-500 flex-shrink-0">›</span>{tip}
                          </p>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

              {/* Hero banner */}
              <div className="bg-gradient-to-br from-[#0D523C] to-[#02130F] rounded-[2.5rem] p-6 text-white relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-[60px]" />
                <div className="relative z-10">
                  <p className="text-emerald-400/60 text-[7px] font-black uppercase tracking-widest mb-1">{isTe ? 'AI రోగ నిర్ధారణ ఇంజిన్ v2' : 'AI Diagnostic Engine v2'}</p>
                  <h2 className="text-xl font-black tracking-tight mb-1">{isTe ? 'సన్నద్ధత ' : 'Preparation '}<span className="text-[#C78200]">{isTe ? 'చెక్‌లిస్ట్' : 'Checklist'}</span></h2>
                  <p className="text-white/40 text-[8px] font-medium">{isTe ? 'అత్యంత ఖచ్చితమైన AI రోగ నిర్ధారణ కోసం ఈ దశలను పాటించండి' : 'Follow these steps for the most accurate AI diagnosis'}</p>
                </div>
              </div>


              {/* Checklist */}
              <div className="space-y-2.5">
                {[
                  { title: isTe ? 'శుభ్రమైన నేపథ్యం' : 'Clean Background', desc: isTe ? 'రొయ్యను తెలుపు లేదా నీలం ట్రేపై పెట్టండి — మట్టి వద్దు' : 'Place shrimp on a white or blue solid tray — no mud/soil', icon: <Waves size={16} />, ok: true },
                  { title: isTe ? 'సహజ వెలుతురు' : 'Natural Lighting', desc: isTe ? 'పరోక్ష సూర్యకాంతి లేదా టార్చ్ — నేరుగా మిరుమిట్లు వద్దు' : 'Indirect sunlight or torch light — avoid direct flash glare', icon: <Sparkles size={16} />, ok: true },
                  { title: isTe ? 'పొట్టు రేఖ కనిపించాలి' : 'Gut Line in Frame', desc: isTe ? 'రొయ్య వెనుక పూర్తి పొడవు కనిపించేలా ఉంచండి' : 'Ensure the full length of the shrimp\'s back is visible and centered', icon: <Eye size={16} />, ok: true },
                  { title: isTe ? 'పొడి & స్పష్టమైన ఉపరితలం' : 'Dry & Clear Surface', desc: isTe ? 'అదనపు నీటిని తుడవండి — తడి ఉపరితలాలు మిరుమిట్లు కలిగిస్తాయి' : 'Wipe excess water — wet surfaces cause glare and blur', icon: <CheckCircle2 size={16} />, ok: true },
                  { title: isTe ? 'మాక్రో దూరం' : 'Macro Distance', desc: isTe ? 'కెమెరాను 15–20 సెమీ దూరంలో పట్టండి — ఫ్రేమ్ నింపండి' : 'Hold camera 15–20 cm from shrimp — fill the frame', icon: <Camera size={16} />, ok: true },
                ].map((item, idx) => (
                  <div key={idx} className={cn('rounded-[2rem] border p-4 flex items-start gap-4', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
                    <div className="w-10 h-10 bg-[#C78200]/10 rounded-2xl flex items-center justify-center text-[#C78200] flex-shrink-0">{item.icon}</div>
                    <div>
                      <h4 className={cn('text-xs font-black uppercase tracking-wider mb-0.5', isDark ? 'text-white' : 'text-slate-900')}>{item.title}</h4>
                      <p className={cn('text-[8px] font-medium leading-relaxed', isDark ? 'text-white/35' : 'text-slate-500')}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('upload')}
                className="w-full bg-gradient-to-br from-[#0D523C] to-[#065F46] text-white font-black py-5 rounded-[1.8rem] shadow-xl shadow-emerald-900/20 uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3"
              >
                Start AI Diagnosis <Plus size={18} />
              </motion.button>
              <div className="flex gap-3">
                <button onClick={() => setStep('manual')}
                  className={cn('flex-1 font-black py-3 rounded-2xl uppercase tracking-widest text-[8px] border transition-all',
                    isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white/60' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 shadow-sm'
                  )}>
                  Manual Checker
                </button>
                <button onClick={() => setStep('library')}
                  className={cn('flex-1 font-black py-3 rounded-2xl uppercase tracking-widest text-[8px] border transition-all flex items-center justify-center gap-2',
                    isDark ? 'bg-[#C78200]/10 border-[#C78200]/20 text-[#C78200]' : 'bg-amber-50 border-amber-200 text-amber-700'
                  )}>
                  <BookOpen size={12} /> Disease Library
                </button>
              </div>
            </motion.div>
          )}

          {/* ── UPLOAD ── */}
          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Upload card */}
              <div className={cn('rounded-[2.5rem] border-2 border-dashed p-8 flex flex-col items-center text-center', isDark ? 'bg-[#0D1520] border-white/10' : 'bg-white border-slate-200')}>
                <div className="w-[72px] h-[72px] bg-[#C78200]/10 rounded-full flex items-center justify-center mb-5 text-[#C78200]">
                  <Camera size={32} />
                </div>
                <h2 className={cn('text-xl font-black tracking-tight mb-2', isDark ? 'text-white' : 'text-slate-900')}>{isTe ? 'రొయ్య స్కాన్' : 'Scan Shrimp'}</h2>
                <p className={cn('text-[9px] font-bold uppercase tracking-widest leading-relaxed px-4 mb-8', isDark ? 'text-white/30' : 'text-slate-500')}>
                  Camera scan or upload a gallery photo for AI diagnosis
                </p>
                <div className="w-full space-y-3">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={startCamera}
                    className="w-full bg-[#C78200] text-white font-black py-4 rounded-3xl shadow-xl shadow-[#C78200]/20 uppercase tracking-[0.2em] text-[9px] flex items-center justify-center gap-2"
                  >
                    <Camera size={15} /> Open Live Camera
                  </motion.button>
                  <div className="relative">
                    <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <button className={cn('w-full border font-black py-4 rounded-3xl uppercase tracking-[0.2em] text-[9px] flex items-center justify-center gap-2', isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-white border-slate-200 text-slate-500')}>
                      <Plus size={14} /> Upload from Gallery
                    </button>
                  </div>
                </div>
              </div>

              {/* Manual alternative */}
              <div onClick={() => setStep('manual')} className="bg-gradient-to-br from-[#4A2C2A] to-[#2d1a18] p-5 rounded-[2.5rem] text-white cursor-pointer active:scale-[0.98] transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black tracking-tight">{isTe ? 'మాన్యువల్ లక్షణ పరీక్ష' : 'Manual Symptom Checker'}</h3>
                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mt-1">{isTe ? 'ఫోటో లేదా? లక్షణాలు మాన్యువల్‌గా ఎంచుకోండి' : 'No photo? Select symptoms manually'}</p>
                  </div>
                  <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                    <AlertTriangle size={18} className="text-[#C78200]" />
                  </div>
                </div>
              </div>

              {/* Photo tips */}
              <div className={cn('rounded-[2rem] p-4 border', isDark ? 'bg-[#C78200]/5 border-[#C78200]/15' : 'bg-amber-50 border-amber-200')}>
                <div className="flex items-start gap-3">
                  <Info size={15} className="text-[#C78200] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={cn('text-[9px] font-black uppercase tracking-widest mb-1', isDark ? 'text-[#C78200]' : 'text-amber-800')}>{isTe ? 'ఉత్తమ ఫోటో చిట్కాలు' : 'Best Photo Tips'}</p>
                    <p className={cn('text-[8px] font-medium leading-relaxed', isDark ? 'text-white/35' : 'text-amber-900/70')}>
                      White tray · Bright indirect light · 15–20 cm distance · Dry surface · Full shrimp visible · No plastic bag distortion
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── MANUAL SYMPTOM CHECKER ── */}
          {step === 'manual' && (
            <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5 pb-12">
              <div className="flex items-center justify-between">
                <h2 className={cn('text-xl font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                  What symptoms do you <span className="text-[#C78200]">observe?</span>
                </h2>
                <span className={cn('text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl border',
                  selectedSymptoms.length > 0
                    ? isDark ? 'bg-[#C78200]/10 border-[#C78200]/20 text-[#C78200]' : 'bg-amber-100 border-amber-200 text-amber-700'
                    : isDark ? 'bg-white/5 border-white/10 text-white/25' : 'bg-slate-100 border-slate-200 text-slate-400'
                )}>{selectedSymptoms.length} {isTe ? 'ఎంచుకున్నారు' : 'selected'}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {SYMPTOM_OPTIONS.map(symp => (
                  <button key={symp.key}
                    onClick={() => setSelectedSymptoms(prev => prev.includes(symp.label) ? prev.filter(s => s !== symp.label) : [...prev, symp.label])}
                    className={cn(
                      'p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all duration-200',
                      selectedSymptoms.includes(symp.label)
                        ? 'bg-[#C78200] border-[#C78200] text-white shadow-lg shadow-amber-900/20'
                        : isDark ? 'bg-[#0D1520] border-white/5 text-white/60 hover:border-white/15' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'
                    )}
                  >
                    <span className="text-[11px] font-black tracking-tight">{symp.label}</span>
                    <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      selectedSymptoms.includes(symp.label) ? 'bg-white/20 border-white text-white' : isDark ? 'border-white/15' : 'border-slate-300'
                    )}>
                      {selectedSymptoms.includes(symp.label) && <CheckCircle2 size={12} />}
                    </div>
                  </button>
                ))}
              </div>

              <motion.button
                disabled={selectedSymptoms.length === 0}
                onClick={handleManualDiagnosis}
                whileTap={{ scale: 0.97 }}
                className={cn('w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-xl flex items-center justify-center gap-3 transition-all',
                  selectedSymptoms.length > 0
                    ? 'bg-[#0D523C] text-white shadow-emerald-900/20'
                    : isDark ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                )}
              >
                Analyze {selectedSymptoms.length > 0 ? `${selectedSymptoms.length} Symptoms` : 'Symptoms'} <Sparkles size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* ── SCANNING ── */}
          {step === 'scanning' && (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
              {/* Animated scanner */}
              <div className="w-36 h-36 relative mb-8">
                {/* Outer ring */}
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className={cn('absolute inset-0 border-4 rounded-full', isDark ? 'border-[#C78200]/15 border-t-[#C78200]' : 'border-[#C78200]/10 border-t-[#C78200]')} />
                {/* Inner ring */}
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-4 border-2 border-dashed border-[#C78200]/20 rounded-full" />
                {/* Pulse */}
                <motion.div animate={{ scale: [0.85, 1.1, 0.85], opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute inset-0 bg-[#C78200]/5 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FlaskConical size={36} className="text-[#C78200]" />
                </div>
              </div>

              <h2 className={cn('text-xl font-black tracking-tighter mb-2', isDark ? 'text-white' : 'text-slate-900')}>{loadingMessage}</h2>
              <p className={cn('text-[8px] font-black uppercase tracking-[0.35em] mb-8', isDark ? 'text-white/20' : 'text-slate-400')}>{isTe ? '5-వ్యాధి నమూనా మ్యాచ్ · Gemini AI' : '5-disease pattern match · Gemini AI'}</p>

              {/* Progress dots */}
              <div className="flex gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div key={i} animate={{ opacity: [0.15, 1, 0.15] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.25 }}
                    className="w-2 h-2 bg-[#C78200] rounded-full" />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── RESULT ── */}
          {step === 'result' && analysis && (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-20">

              {/* ── NO SHRIMP OBSERVED ── */}
              {analysis.shrimpObserved === false ? (
                <>
                  {/* Action row */}
                  <div className="flex items-center justify-between">
                    <button onClick={() => { setStep('upload'); setMappedSOP(null); setImage(null); setSelectedSymptoms([]); }}
                      className={cn('flex items-center gap-2 text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/30 hover:text-white/60' : 'text-slate-400 hover:text-slate-700')}>
                      <RefreshCw size={12} /> New Scan
                    </button>
                  </div>

                  {/* Thumbnail */}
                  {image && (
                    <div className="relative aspect-video rounded-[2rem] overflow-hidden border border-slate-200">
                      <img src={image} alt="Uploaded" className="w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-4 py-2">
                          <span className="text-white text-[8px] font-black uppercase tracking-widest">❌ No Shrimp Found</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Not Detected card */}
                  <div className={cn('rounded-[2.5rem] p-6 border relative overflow-hidden', isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200')}>
                    <div className="absolute right-4 top-4 text-5xl opacity-10">🦐</div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', isDark ? 'bg-slate-700' : 'bg-slate-200')}>
                          <Eye size={22} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-[6px] font-black uppercase tracking-[0.3em]">AI Scan Result</p>
                          <h2 className={cn('font-black text-lg tracking-tight', isDark ? 'text-white' : 'text-slate-800')}>No Shrimp Body Detected</h2>
                        </div>
                      </div>

                      {analysis.notObservedReason && (
                        <div className={cn('rounded-2xl p-4 mb-4 border', isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-100')}>
                          <p className="text-slate-400 text-[6px] font-black uppercase tracking-widest mb-1">What AI Saw</p>
                          <p className={cn('text-[10px] font-medium leading-relaxed', isDark ? 'text-white/70' : 'text-slate-600')}>
                            {analysis.notObservedReason}
                          </p>
                        </div>
                      )}

                      <div className={cn('rounded-2xl p-4 mb-5 border', isDark ? 'bg-amber-900/20 border-amber-700/30' : 'bg-amber-50 border-amber-200')}>
                        <p className="text-amber-600 text-[7px] font-black uppercase tracking-widest mb-2">📸 How to get a correct scan</p>
                        {[
                          'Place 1–3 shrimp on a white/light surface in good light',
                          'Fill the camera frame with the shrimp body',
                          'Ensure the shell, gills or hepatopancreas are clearly visible',
                          'Avoid water glare — take photo out of the pond',
                        ].map((tip, i) => (
                          <div key={i} className="flex gap-2 items-start mb-1">
                            <span className="text-amber-500 text-[8px] flex-shrink-0">{i + 1}.</span>
                            <p className={cn('text-[8px] font-medium', isDark ? 'text-amber-300/70' : 'text-amber-800/70')}>{tip}</p>
                          </div>
                        ))}
                      </div>

                      <button onClick={() => { setStep('upload'); setMappedSOP(null); setImage(null); setSelectedSymptoms([]); }}
                        className="w-full bg-[#C78200] text-white rounded-2xl py-4 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <Camera size={14} /> {t.ddRetakePhoto}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* ── NORMAL RESULT ── */
                <>
              {/* Action row */}
              <div className="flex items-center justify-between">
                <button onClick={() => { setStep('upload'); setMappedSOP(null); setImage(null); setSelectedSymptoms([]); }}
                  className={cn('flex items-center gap-2 text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/30 hover:text-white/60' : 'text-slate-400 hover:text-slate-700')}>
                  <RefreshCw size={12} /> {t.ddNewScan}
                </button>
                {mappedSOP && (
                  <button onClick={() => { setBrowsingSOP(mappedSOP); setStep('sop'); }}
                    className={cn('flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest', isDark ? 'text-[#C78200]' : 'text-amber-700')}>
                    {t.ddFullSOP} <ChevronRight size={12} />
                  </button>
                )}
              </div>

              {/* Specimen photo */}
              {image && (
                <div className="relative aspect-video rounded-[2rem] overflow-hidden border">
                  <img src={image} alt="Specimen" className="w-full h-full object-cover" />
                  {/* Scan line */}
                  <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity }}
                    className="absolute left-0 right-0 h-0.5 bg-emerald-400/60 shadow-[0_0_12px_rgba(52,211,153,0.7)] z-10" />
                  {/* Overlay label */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-black/60 backdrop-blur-sm text-white text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl border border-white/10">
                      {t.ddAiScanned}
                    </span>
                  </div>
                </div>
              )}

              {/* Verdict hero */}
              <div className={cn('rounded-[2.5rem] p-6 text-white relative overflow-hidden',
                `bg-gradient-to-br ${SEVERITY_HERO[analysis.severity as keyof typeof SEVERITY_HERO] ?? 'from-slate-700 to-slate-900'}`
              )}>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-[60px]" />
                <div className="absolute top-4 right-4">
                  <span className="bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-xl text-[7px] font-black uppercase tracking-widest border border-white/20 flex items-center gap-1.5">
                    <ShieldCheck size={10} /> {t.ddDiagnosticVerdict}
                  </span>
                </div>
                <div className="relative z-10 pt-2">
                  <p className="text-[7px] font-black uppercase tracking-[0.3em] opacity-50 mb-2">{t.ddDetectedCondition}</p>
                  <h2 className="text-2xl font-black tracking-tight mb-3 leading-tight">{analysis.disease}</h2>

                  {/* Confidence bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[7px] font-black uppercase tracking-widest opacity-50">{t.ddAiConfidence}</p>
                      <p className="text-sm font-black">{analysis.confidence}%</p>
                    </div>
                    <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${analysis.confidence}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={cn('h-full rounded-full', analysis.confidence >= 70 ? 'bg-white' : 'bg-white/60')} />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    {[
                      { label: t.ddSeverity,      value: analysis.severity },
                        { label: t.ddAffectedPart, value: analysis.affectedPart || '—' },
                        { label: t.ddSource,        value: image ? t.ddAiPhoto : t.ddSymptoms },
                    ].map((s, i) => (
                      <div key={i} className="bg-white/10 rounded-xl py-2 border border-white/10">
                        <p className="opacity-40 text-[6px] font-black uppercase tracking-widest mb-0.5">{s.label}</p>
                        <p className="font-black text-xs tracking-tight">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Reasoning */}
                  {analysis.reasoning && (
                    <p className="text-[9px] font-medium text-white/75 italic border-l-2 border-white/20 pl-3 leading-relaxed">
                      "{analysis.reasoning}"
                    </p>
                  )}
                </div>
              </div>

              {/* Matched SOP / Fallback actions */}
              {mappedSOP ? (
                <SOPView sop={mappedSOP} isDark={isDark} lang={user.language} onClose={() => setMappedSOP(null)} />
              ) : analysis?.action?.startsWith('QUOTA_EXCEEDED|') ? (
                /* ── Quota Exhausted Card ── */
                <div className={cn('rounded-[2rem] p-5 border', isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200')}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">⏳</span>
                    </div>
                    <div>
                      <p className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{t.ddDailyAiLimit}</p>
                      <p className={cn('text-[7.5px] font-black uppercase tracking-widest', isDark ? 'text-amber-400/70' : 'text-amber-700')}>{t.ddGeminiFreeTier}</p>
                    </div>
                  </div>
                  <p className={cn('text-[9.5px] font-medium leading-relaxed mb-3', isDark ? 'text-white/60' : 'text-slate-600')}>
                    {t.ddQuotaMsg}
                  </p>
                  <div className={cn('rounded-2xl px-4 py-3 mb-4 flex items-center gap-3', isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-amber-200')}>
                    <span className="text-2xl">⏱️</span>
                    <div>
                      <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>{t.ddSuggestedWait}</p>
                      <p className={cn('text-base font-black', isDark ? 'text-amber-400' : 'text-amber-700')}>
                        ~{Math.ceil(parseInt(analysis.action.split('|')[1] || '60') / 60)} minute{Math.ceil(parseInt(analysis.action.split('|')[1] || '60') / 60) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { setStep('idle'); setAnalysis(null); }}
                    className="w-full py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest text-white flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
                    {t.ddTryAgain}
                  </button>
                </div>
              ) : (
                <div className={cn('rounded-[2rem] p-5 border', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-[#C78200] rounded-xl flex items-center justify-center">
                      <Activity size={16} className="text-white" />
                    </div>
                    <p className={cn('font-black text-sm tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{t.ddRecommendedActions}</p>
                  </div>
                  <p className={cn('text-[10px] font-bold leading-relaxed mb-4', isDark ? 'text-white/50' : 'text-slate-600')}>{analysis.action}</p>
                  <button onClick={() => navigate('/logs/conditions')}
                    className="w-full py-3.5 bg-[#C78200] text-white rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
                    <Plus size={13} /> {t.ddLogTreatment}
                  </button>
                </div>
              )}


              {/* Disclaimer */}
              <p className={cn('text-center text-[7px] font-bold leading-relaxed px-8', isDark ? 'text-white/15' : 'text-slate-400')}>
                ★ AI and manual suggestions are based on standard aquaculture protocols. Always confirm severe cases with a certified aquaculture expert.
              </p>
              </>
              )}
            </motion.div>
          )}

          {/* ── DISEASE LIBRARY ── */}
          {step === 'library' && !browsingSOP && (
            <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 pb-12">
              {/* Header */}
              <div className="bg-gradient-to-br from-[#0D523C] to-[#02130F] rounded-[2.5rem] p-5 text-white relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-[60px]" />
                <div className="relative z-10">
                  <p className="text-emerald-400/60 text-[7px] font-black uppercase tracking-widest mb-1">{isTe ? 'సూచన' : 'Reference'}</p>
                  <h2 className="text-lg font-black tracking-tight">{isTe ? 'వ్యాధి గ్రంధాలయం' : 'Disease Library'}</h2>
                  <p className="text-white/40 text-[8px] font-medium mt-1">{DISEASE_CATALOG.length} {isTe ? 'వ్యాధులు · ప్రతిదానికి పూర్తి SOP' : 'diseases · Full SOP for each'}</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {DISEASE_CATALOG.map(sop => (
                  <DiseaseCard key={sop.id} sop={sop} isDark={isDark} onSelect={() => { setBrowsingSOP(sop); setStep('sop'); }} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── SOP DETAIL ── */}
          {step === 'sop' && browsingSOP && (
            <motion.div key="sop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-12">
              <SOPView sop={browsingSOP} isDark={isDark} lang={user.language} onClose={() => { setBrowsingSOP(null); setStep('library'); }} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── LIVE CAMERA ── */}
      <AnimatePresence>
        {isCameraActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black flex flex-col">
            <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />

            {/* Scan guide overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner brackets */}
              {[
                'top-[15%] left-[10%] border-t-2 border-l-2 rounded-tl-2xl',
                'top-[15%] right-[10%] border-t-2 border-r-2 rounded-tr-2xl',
                'top-[65%] left-[10%] border-b-2 border-l-2 rounded-bl-2xl',
                'top-[65%] right-[10%] border-b-2 border-r-2 rounded-br-2xl',
              ].map((cls, i) => (
                <div key={i} className={cn('absolute w-10 h-10 border-[#C78200]/60', cls)} />
              ))}
              {/* Scan line in frame */}
              <motion.div animate={{ top: ['18%', '62%', '18%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-[#C78200]/80 to-transparent" />
              {/* Guide text */}
              <div className="absolute bottom-[20%] left-0 right-0 flex justify-center">
                <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10">
                  <p className="text-[#C78200] text-[8px] font-black uppercase tracking-widest text-center">{isTe ? 'ఫ్రేమ్ లోపల రొయ్యను ఉంచండి' : 'Position shrimp inside the frame'}</p>
                </div>
              </div>
            </div>

            {/* Camera controls */}
            <div className="absolute bottom-12 left-0 right-0 px-12 flex justify-between items-center">
              <button onClick={stopCamera} className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/20">
                <X size={24} />
              </button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={capturePhoto}
                className="w-20 h-20 bg-white rounded-full p-2 shadow-2xl">
                <div className="w-full h-full border-4 border-slate-300 rounded-full" />
              </motion.button>
              <div className="w-14 h-14 invisible" />
            </div>

            {/* Status bar */}
            <div className="absolute top-[calc(env(safe-area-inset-top)+1rem)] left-4 right-4 flex justify-between items-center">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-[8px] font-black uppercase tracking-widest">{isTe ? 'AI కెమ్ సిద్ధంగా ఉంది' : 'AI Cam Ready'}</span>
              </div>
              <div className="bg-[#C78200]/80 backdrop-blur-md px-3 py-2 rounded-xl text-[8px] font-black text-white uppercase tracking-widest">
                Tap ● to scan
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};






