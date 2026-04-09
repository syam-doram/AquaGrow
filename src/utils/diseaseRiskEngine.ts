// ─── AquaGrow Disease Risk Prediction Engine ────────────────────────────────
// Computes real-time disease risk based on DOC, season, temp, salinity,
// and water-quality flags. Returns ordered, actionable risk alerts.

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'SAFE';

export interface DiseaseRisk {
  id: string;
  name: string;
  shortName: string;
  riskLevel: RiskLevel;
  riskScore: number;         // 0–100
  trigger: string;           // Why this is flagged
  window: string;            // "DOC 10–30", "All stages"
  action: string;            // What to do NOW
  seasonMatch: boolean;      // Is current season a known high-risk period
  emoji: string;
}

export interface DiseaseRiskReport {
  overallRisk: RiskLevel;
  topRisks: DiseaseRisk[];   // sorted by riskScore desc, max 5
  stage: 'EARLY' | 'MID' | 'LATE' | 'PREP';
  season: 'SUMMER' | 'MONSOON' | 'WINTER';
  alerts: string[];          // Human-readable alert strings
  preventionTips: string[];
}

// ─── Season Helpers ───────────────────────────────────────────────────────────
const getSeason = (month: number): 'SUMMER' | 'MONSOON' | 'WINTER' => {
  if (month >= 3 && month <= 6) return 'SUMMER';
  if (month >= 7 && month <= 10) return 'MONSOON';
  return 'WINTER';
};

const getStage = (doc: number): 'PREP' | 'EARLY' | 'MID' | 'LATE' => {
  if (doc < 0)  return 'PREP';
  if (doc <= 30) return 'EARLY';
  if (doc <= 70) return 'MID';
  return 'LATE';
};

// ─── Score → RiskLevel ────────────────────────────────────────────────────────
const scoreToLevel = (s: number): RiskLevel =>
  s >= 80 ? 'CRITICAL' : s >= 60 ? 'HIGH' : s >= 40 ? 'MODERATE' : s >= 20 ? 'LOW' : 'SAFE';

// ─── MAIN ENGINE ─────────────────────────────────────────────────────────────
export interface RiskInputs {
  doc: number;
  temperature?: number;     // °C — optional
  salinity?: number;        // ppt — optional
  doLevel?: number;         // Dissolved Oxygen mg/L
  ammonia?: number;         // mg/L
  ph?: number;
  isRaining?: boolean;
  mortalityDetected?: boolean;
}

export const computeDiseaseRisk = (inputs: RiskInputs): DiseaseRiskReport => {
  const { doc, temperature, salinity, doLevel, ammonia, ph, isRaining, mortalityDetected } = inputs;
  const month    = new Date().getMonth() + 1;
  const season   = getSeason(month);
  const stage    = getStage(doc);

  const temp      = temperature ?? 29;
  const salin     = salinity    ?? 25;
  const doVal     = doLevel     ?? 5;
  const amm       = ammonia     ?? 0.1;

  const isDoLow           = doVal < 4;
  const isTempHigh        = temp > 32;
  const isTempLow         = temp < 25;
  const isTempFlux        = isTempLow || isTempHigh;
  const isAmmoniaHigh     = amm > 0.25;
  const isSalinityStress  = salin < 10 || salin > 35;
  const poorWaterQuality  = isDoLow || isAmmoniaHigh || (ph != null && (ph < 7.3 || ph > 8.8));

  const risks: DiseaseRisk[] = [];

  // ──────────────────────────────────────────────────────────────────────────
  // 1. EMS / AHPND — Early stage king killer
  // ──────────────────────────────────────────────────────────────────────────
  if (doc >= 0) {
    let score = 0;
    const triggers: string[] = [];
    if (doc >= 10 && doc <= 30)   { score += 50; triggers.push('Peak EMS window: DOC 10–30'); }
    else if (doc < 10)             { score += 20; triggers.push('Seed acclimatization stress'); }
    if (poorWaterQuality)          { score += 25; triggers.push('Poor water quality elevates EMS risk'); }
    if (season === 'MONSOON')      { score += 15; triggers.push('Monsoon season — EMS-prone'); }
    if (mortalityDetected)         { score += 30; triggers.push('💀 Mortality reported'); }
    if (isDoLow)                   { score += 10; triggers.push('Low DO weakens hepatopancreas'); }

    risks.push({
      id: 'ems_ahpnd', name: 'EMS / AHPND', shortName: 'EMS',
      riskScore: Math.min(100, score),
      riskLevel: scoreToLevel(Math.min(100, score)),
      trigger: triggers.slice(0, 2).join(' · '),
      window: 'DOC 10–30 | Peak Early Stage',
      action: score >= 60
        ? 'URGENT: Stop feeding, check hepatopancreas, test water for Vibrio. Consider emergency harvest if DOC > 20.'
        : 'Monitor hepatopancreas color daily. Maintain water probiotics. Ensure zero chlorine in water.',
      seasonMatch: season === 'MONSOON',
      emoji: '🔴',
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. WSSV — The deadliest, hits all stages
  // ──────────────────────────────────────────────────────────────────────────
  {
    let score = 0;
    const triggers: string[] = [];

    // DOC-based risk
    if (doc >= 31 && doc <= 45)    { score += 40; triggers.push('WSSV peak: Critical DOC 31–45 window'); }
    else if (doc >= 70)            { score += 45; triggers.push('Late stage WSSV — full crop loss possible'); }
    else if (doc <= 30 && doc > 0) { score += 20; triggers.push('Early WSSV exposure exists'); }

    // Environmental triggers
    if (isTempFlux)                { score += 25; triggers.push(`Temp ${temp}°C — WSSV trigger zone`); }
    if (season === 'MONSOON')      { score += 20; triggers.push('Monsoon: WSSV peak season'); }
    if (season === 'WINTER')       { score += 20; triggers.push('Winter: Cold temp triggers WSSV'); }
    if (isSalinityStress)          { score += 15; triggers.push(`Salinity ${salin}ppt outside safe range`); }
    if (mortalityDetected)         { score += 30; triggers.push('💀 Mortality reported — rule out WSSV'); }
    if (isRaining)                 { score += 15; triggers.push('Rain: sudden water change triggers WSSV'); }

    risks.push({
      id: 'wssv', name: 'White Spot Disease (WSSV)', shortName: 'WSSV',
      riskScore: Math.min(100, score),
      riskLevel: scoreToLevel(Math.min(100, score)),
      trigger: triggers.slice(0, 2).join(' · '),
      window: 'All stages | Highest: DOC 31–45 & 70+',
      action: score >= 60
        ? 'CRITICAL: Isolate pond. Stop all water exchange. Inspect shell for white spots. Contact disease expert immediately.'
        : 'Prevent bird access. Disinfect equipment. Monitor for white spots & edge-clustering behavior.',
      seasonMatch: season === 'MONSOON' || season === 'WINTER',
      emoji: '🔴',
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. White Gut Disease — Mid stage overfeeding related
  // ──────────────────────────────────────────────────────────────────────────
  {
    let score = 0;
    const triggers: string[] = [];

    if (doc >= 30 && doc <= 60)    { score += 45; triggers.push('White Gut window: DOC 30–60'); }
    if (season === 'SUMMER')       { score += 20; triggers.push('Summer heat causes overfeeding waste buildup'); }
    if (isAmmoniaHigh)             { score += 20; triggers.push('High ammonia — gut bacteria imbalance'); }
    if (isTempHigh)                { score += 15; triggers.push('Heat stress disrupts intestinal flora'); }

    risks.push({
      id: 'white_gut', name: 'White Gut Disease', shortName: 'White Gut',
      riskScore: Math.min(100, score),
      riskLevel: scoreToLevel(Math.min(100, score)),
      trigger: triggers.slice(0, 2).join(' · '),
      window: 'DOC 30–60 | Mid Stage',
      action: score >= 50
        ? 'Reduce feed immediately. Add gut probiotics (5g/kg feed). Check for white fecal strings floating.'
        : 'Apply gut probiotic 3x/week. Observe tray residue after each slot. Avoid overfeeding.',
      seasonMatch: season === 'SUMMER',
      emoji: '🟡',
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Vibriosis — Mid stage, water quality driven
  // ──────────────────────────────────────────────────────────────────────────
  {
    let score = 0;
    const triggers: string[] = [];

    if (doc >= 40 && doc <= 70)    { score += 45; triggers.push('Vibriosis window: DOC 40–70'); }
    if (season === 'SUMMER')       { score += 20; triggers.push('Summer peak for Vibrio bacteria'); }
    if (poorWaterQuality)          { score += 25; triggers.push('High organic waste feeds Vibrio'); }
    if (isAmmoniaHigh)             { score += 20; triggers.push(`Ammonia ${amm} mg/L — Vibrio growth`); }

    risks.push({
      id: 'vibriosis', name: 'Vibriosis', shortName: 'Vibriosis',
      riskScore: Math.min(100, score),
      riskLevel: scoreToLevel(Math.min(100, score)),
      trigger: triggers.slice(0, 2).join(' · '),
      window: 'DOC 40–70 | Mid Stage',
      action: score >= 50
        ? 'Reduce feed by 30%. Apply water probiotic & BKC disinfection. Check for glowing shrimp at night (luminescent Vibrio).'
        : 'Maintain water probiotics. Monitor water quality tightly. Avoid stagnant bottom areas.',
      seasonMatch: season === 'SUMMER',
      emoji: '🟡',
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Black Gill Disease — DO & ammonia driven
  // ──────────────────────────────────────────────────────────────────────────
  {
    let score = 0;
    const triggers: string[] = [];

    if (doc >= 45)                 { score += 40; triggers.push('Black Gill risk: DOC 45+'); }
    if (isDoLow)                   { score += 35; triggers.push(`DO at ${doVal} mg/L — gill hypoxia`); }
    if (isAmmoniaHigh)             { score += 30; triggers.push(`Ammonia ${amm} mg/L — gill irritation`); }
    if (season === 'SUMMER')       { score += 15; triggers.push('Summer low DO accelerates gill damage'); }

    risks.push({
      id: 'black_gill', name: 'Black Gill Disease', shortName: 'Black Gill',
      riskScore: Math.min(100, score),
      riskLevel: scoreToLevel(Math.min(100, score)),
      trigger: triggers.slice(0, 2).join(' · '),
      window: 'DOC 45+ | Mid–Late Stage',
      action: score >= 60
        ? 'URGENT: Maximize aeration immediately. Reduce feed 50%. Apply Zeolite for ammonia. Check shrimp gills on inspection.'
        : 'Run aerators at 80% minimum overnight. Apply zeolite 15kg/acre weekly. Monitor ammonia daily.',
      seasonMatch: season === 'SUMMER',
      emoji: '🟠',
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Running Mortality Syndrome (RMS) — Late stage
  // ──────────────────────────────────────────────────────────────────────────
  {
    let score = 0;
    const triggers: string[] = [];

    if (doc >= 70 && doc <= 100)   { score += 45; triggers.push('RMS window: DOC 70–100'); }
    if (mortalityDetected)         { score += 35; triggers.push('Daily mortality already present'); }
    if (poorWaterQuality)          { score += 20; triggers.push('Multiple water quality stressors'); }

    risks.push({
      id: 'rms', name: 'Running Mortality Syndrome', shortName: 'RMS',
      riskScore: Math.min(100, score),
      riskLevel: scoreToLevel(Math.min(100, score)),
      trigger: triggers.slice(0, 2).join(' · '),
      window: 'DOC 70–100 | Late Stage',
      action: score >= 50
        ? 'Monitor daily mortality strictly. Isolate weak/dead shrimp. Evaluate emergency harvest if biomass > 50%.'
        : 'Continue strong aeration. Reduce feed to 80%. Plan harvest window carefully.',
      seasonMatch: false,
      emoji: '🟠',
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. EHP — Parasitic, visible mid–late
  // ──────────────────────────────────────────────────────────────────────────
  {
    let score = 0;
    const triggers: string[] = [];

    if (doc >= 50 && doc <= 100)   { score += 40; triggers.push('EHP symptoms visible: DOC 50–100'); }
    if (isSalinityStress)          { score += 15; triggers.push('Salinity stress favors EHP spread'); }

    risks.push({
      id: 'ehp', name: 'EHP (Enterocytozoon hepatopenaei)', shortName: 'EHP',
      riskScore: Math.min(100, score),
      riskLevel: scoreToLevel(Math.min(100, score)),
      trigger: triggers.slice(0, 2).join(' · '),
      window: 'DOC 50–120 | Visible Late Stage',
      action: score >= 50
        ? 'Harvest early if severe size variation observed. Start PCR test. Disinfect pond thoroughly before next cycle.'
        : 'Watch for size uniformity at each tray check. Maintain gut probiotic at maximum dose.',
      seasonMatch: false,
      emoji: '🟡',
    });
  }

  // ─── Sort by risk score ───────────────────────────────────────────────────
  const sorted = risks.sort((a, b) => b.riskScore - a.riskScore);
  const topRisks = sorted.slice(0, 5);

  // ─── Overall risk = highest score ────────────────────────────────────────
  const maxScore = topRisks[0]?.riskScore ?? 0;
  const overallRisk = scoreToLevel(maxScore);

  // ─── Human-readable alerts ────────────────────────────────────────────────
  const alerts: string[] = [];
  if (overallRisk === 'CRITICAL' || overallRisk === 'HIGH') {
    const top = topRisks.filter(r => r.riskScore >= 60);
    top.forEach(r => alerts.push(`⚠️ ${r.shortName} — High risk at DOC ${doc}. ${r.action.split('.')[0]}.`));
  }
  if (mortalityDetected) alerts.unshift('💀 MORTALITY ALERT: Remove dead shrimp immediately. Apply disinfectant (not same day as probiotic).');
  if (isDoLow)           alerts.unshift(`🚨 DO CRITICAL: ${doVal} mg/L — run all aerators NOW. Stop feeding temporarily.`);
  if (season === 'MONSOON' && doc > 0) alerts.push('🌧️ Monsoon season active — WSSV and EMS are highest risk. Monitor daily.');
  if (season === 'WINTER' && doc > 0)  alerts.push('❄️ Winter active — Low temp triggers WSSV. Keep pond temp ≥ 25°C.');

  // ─── Prevention tips (stage-based) ───────────────────────────────────────
  const preventionTips: string[] = stage === 'EARLY' ? [
    'Verify PCR-clean seed before stocking',
    'Maintain water probiotic: 250g/acre every 5 days',
    'Monitor hepatopancreas daily for pale/white coloration (EMS sign)',
    'DO must stay ≥ 4 mg/L — run aerators from 10 PM onward',
  ] : stage === 'MID' ? [
    'Watch tray residue after each meal — overfeeding triggers White Gut',
    'Apply water probiotic to prevent Vibrio growth',
    'Check ammonia twice weekly — target < 0.25 mg/L',
    `This is the ${season === 'SUMMER' ? 'high Vibriosis + Black Gill' : 'WSSV + Fouling'} season — stay vigilant`,
  ] : stage === 'LATE' ? [
    'Plan emergency harvest if any sign of WSSV or RMS appears',
    'Reduce feed to 80% — high biomass = high DO demand',
    'Continue max aeration 24/7',
    'Daily mortality count is essential — RMS can escalate rapidly',
  ] : [
    'Ensure complete pond drying before water filling',
    'Apply chlorine at 30ppm. Neutralize before stocking',
    'Build strong plankton bloom (molasses + probiotic)',
  ];

  return {
    overallRisk,
    topRisks,
    stage,
    season,
    alerts,
    preventionTips,
  };
};

// ─── Exported Colors ──────────────────────────────────────────────────────────
export const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string; badge: string }> = {
  CRITICAL: { bg: 'bg-red-500',    text: 'text-red-400',    border: 'border-red-500/30',    badge: 'bg-red-500/10 text-red-400 border-red-500/20'    },
  HIGH:     { bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/30', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  MODERATE: { bg: 'bg-amber-500',  text: 'text-amber-400',  border: 'border-amber-500/30',  badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'  },
  LOW:      { bg: 'bg-blue-500',   text: 'text-blue-400',   border: 'border-blue-500/30',   badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20'    },
  SAFE:     { bg: 'bg-emerald-500',text: 'text-emerald-400',border: 'border-emerald-500/30',badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

export const STAGE_META: Record<string, { label: string; emoji: string; color: string }> = {
  PREP:  { label: 'Preparation',  emoji: '🏗️', color: 'text-slate-400' },
  EARLY: { label: 'Early Stage',  emoji: '🌱', color: 'text-emerald-400' },
  MID:   { label: 'Mid Stage',    emoji: '🌿', color: 'text-blue-400' },
  LATE:  { label: 'Late Stage',   emoji: '🌊', color: 'text-amber-400' },
};

export const SEASON_META: Record<string, { label: string; emoji: string }> = {
  SUMMER:  { label: 'Summer (High Vibrio)', emoji: '☀️' },
  MONSOON: { label: 'Monsoon (WSSV Peak)', emoji: '🌧️' },
  WINTER:  { label: 'Winter (Temp Risk)', emoji: '❄️' },
};
