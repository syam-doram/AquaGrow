/**
 * AquaGrow Situation Intelligence Engine v3
 * Generates time-aware, context-sensitive SOP push alerts based on:
 * - Pond DOC, status & species profile
 * - Time of day (morning feed, tray check, dusk DO, night aeration windows)
 * - Water quality thresholds from latest logs
 * - Feed compliance & FCR trends
 * - Medicine history & milestone windows
 * - Lunar phase (Amavasya / Pournami / Ashtami)
 * - Weather season & simulated temperature
 * - Disease risk by DOC window
 */

import { getLunarStatus } from './lunarUtils';

export interface SituationAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success' | 'lunar';
  category: 'water' | 'feed' | 'medicine' | 'disease' | 'weather' | 'harvest' | 'economics' | 'prep';
  title: string;
  body: string;
  action?: string;
  actionPath?: string;
  emoji: string;
  urgency: number;    // 1–10
  timestamp: string;
  scheduledFor?: string; // HH:MM label for time-based alerts
}

export interface PondSituationInput {
  pondId: string;
  pondName: string;
  doc: number;
  status: string;
  seedCount: number;
  species: string;
  latestPH?: number;
  latestDO?: number;
  latestTemp?: number;
  latestAmmonia?: number;
  lastWaterLogDate?: string;
  feedLogsCount: number;
  lastFeedDate?: string;
  todayFeedKg?: number;
  todayFeedCount?: number;
  todayMedCount?: number;
  expectedFeedKg?: number;
  totalFeedKg: number;
  estimatedBiomassKg: number;
  medicineLogs7Days: number;
  lastMedicineDate?: string;
  medicineStatus?: string;
  totalExpenseSoFar?: number;
  pondSize?: number;
}

// ─── SPECIES PROFILES ─────────────────────────────────────────────────────────
const SPECIES_PROFILE = {
  Vannamei: {
    criticalDOC: { wssv: [31, 45] as [number, number], vibrio: [20, 30] as [number, number] },
    harvestDOC: 90,
    feedRateMultiplier: 1.0,
    feedTypeChangeDOC: [15, 30, 60],
    gutProbioticDose: '5–10g/kg feed',
    waterProbioticDose: '250 g/acre',
    mineralDose: '15–20 kg/acre',
    trayCheckTime: '1.5–2 hrs',
    fcrTarget: 1.4,
  },
  Tiger: {
    criticalDOC: { wssv: [25, 40] as [number, number], vibrio: [15, 25] as [number, number] },
    harvestDOC: 120,
    feedRateMultiplier: 0.85,
    feedTypeChangeDOC: [20, 40, 70],
    gutProbioticDose: '7g/kg feed',
    waterProbioticDose: '300 g/acre',
    mineralDose: '20–25 kg/acre',
    trayCheckTime: '1 hr',
    fcrTarget: 1.5,
  },
};

// ─── TIME WINDOW HELPERS ─────────────────────────────────────────────────────
const inWindow = (hour: number, start: number, end: number) => hour >= start && hour < end;

const timeLabel = (h: number) =>
  h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;

export const analyzePondSituation = (pond: PondSituationInput): SituationAlert[] => {
  const alerts: SituationAlert[] = [];
  
  // ─── SUPPRESSION LOGIC ─────────────────────────────────────────────────────
  // If the farmer has already marked the pond as 'applied' (under treatment) or 'recovered',
  // we suppress repeated critical noise for that pond to avoid "sticky alert" frustration.
  if (pond.status === 'harvested' || pond.medicineStatus === 'recovered') return [];
  const isUnderTreatment = pond.medicineStatus === 'applied';

  const now   = new Date();
  const lunar = getLunarStatus(now);
  const hour  = now.getHours();
  const month = now.getMonth() + 1;
  const ts    = now.toISOString();

  const species  = (pond.species === 'Tiger' ? 'Tiger' : 'Vannamei') as 'Vannamei' | 'Tiger';
  const profile  = SPECIES_PROFILE[species];
  const isTiger  = species === 'Tiger';
  const isVannamei = species === 'Vannamei';

  // ─── WEATHER MODEL ─────────────────────────────────────────────────────────
  // Seasonal base temperature (India)
  const baseTemp = month >= 3 && month <= 5 ? 34 : month >= 6 && month <= 9 ? 30 : 27;
  const airTemp  = baseTemp - (hour < 6 || hour > 19 ? 5 : hour < 9 ? 2 : 0);
  // Rain probability peaks monsoon June–Sep, higher at noon+
  const rainProb = month >= 6 && month <= 9 ? (hour >= 12 && hour <= 18 ? 0.45 : 0.25) : 0.05;
  const isRaining   = Math.random() < rainProb;
  const isHeatWave  = airTemp >= 36;
  const isPreDawn   = inWindow(hour, 3, 6);    // 3–6 AM — DO crash risk
  const isMorning   = inWindow(hour, 5, 9);    // 5–9 AM — morning feed window
  const isTrayCheck = inWindow(hour, 9, 11);   // 9–11 AM — feed tray check window
  const isNoon      = inWindow(hour, 11, 15);  // 11 AM–3 PM — heat stress
  const isDusk      = inWindow(hour, 16, 20);  // 4–8 PM — dusk DO monitoring
  const isNightfall = inWindow(hour, 20, 24);  // 8 PM–12 — aeration reminder
  
  const loggedToday = pond.lastWaterLogDate === now.toISOString().split('T')[0];
  const fedToday = (pond.todayFeedCount || 0) > 0;
  const medsToday = (pond.todayMedCount || 0) > 0;

  // ─── PLANNED POND — PRE-STOCKING PREP ───────────────────────────────────────
  if (pond.status === 'planned') {
    const prepDay = Math.abs(pond.doc);

    let prepBody = '';
    if (prepDay > 10) {
      prepBody = `${pond.pondName}: Start pond drying & tilling now. Expose soil for 5–7 days to oxidize toxic gases. Apply Lime (500 kg/acre) to neutralize pH and kill pathogens.`;
    } else if (prepDay > 5) {
      prepBody = `${pond.pondName}: Fill pond through 60-mesh filter bags. Apply TCC (Chlorine 30 ppm) for water sterilization. Wait 5–7 days before any seed release.`;
    } else if (prepDay > 2) {
      prepBody = `${pond.pondName}: Water aging phase. Develop stable green-water bloom. Apply Dolomite (100 kg), Zeolite (50 kg/acre), and Molasses + Probiotic to seed beneficial bacteria.`;
    } else {
      prepBody = `${pond.pondName}: FINAL PREP — ${Math.abs(pond.doc)} days to stocking. Run Bloom Developer (Probiotic + Mineral pulse). Check water pH 7.8–8.2, DO > 6 ppm, Alkalinity 80–120 ppm. Order ${species} PL seed.`;
    }

    alerts.push({
      id: `prep-stage-${pond.pondId}`,
      type: 'info',
      category: 'prep',
      emoji: '🏗️',
      title: `Pre-Stocking: Day ${prepDay} of Preparation`,
      body: prepBody,
      action: 'View Prep SOP',
      actionPath: '/medicine',
      urgency: 7,
      timestamp: ts,
    });

    alerts.push({
      id: `feed-prep-${pond.pondId}`,
      type: 'info',
      category: 'feed',
      emoji: '🌾',
      title: `Feed Procurement — ${species}${prepDay <= 2 ? ' (URGENT)' : ''}`,
      body: prepDay <= 3
        ? `Stock up ${isTiger ? 'Crumble No.1 (42% protein, 0.4mm)' : 'Crumble No.1 (40% protein, 0.4mm)'} — starter feed for DOC 1–15. Order minimum 25–50 kg for initial blind feeding @${isTiger ? '1.2–1.5 kg/day' : '1.0–1.5 kg/day'} (first week).`
        : `Plan feed procurement: ${isTiger ? 'Tiger feed has higher protein needs (42%+ starter).' : 'Vannamei starter: 40% protein Crumble No.1.'} Stock 30-day supply before stocking date.`,
      action: 'Plan Feed Order',
      actionPath: '/feed',
      urgency: prepDay <= 3 ? 7 : 4,
      timestamp: ts,
    });

    alerts.push({
      id: `med-prep-${pond.pondId}`,
      type: 'info',
      category: 'medicine',
      emoji: '💊',
      title: `Medicine Stock Check — ${species} Protocol`,
      body: `Pre-stocking medicine kit for ${pond.pondName} (${species}): Gut Probiotic (${profile.gutProbioticDose}) · Vitamin C + Betaine · Water Probiotic (${profile.waterProbioticDose}) · Mineral Mix (${profile.mineralDose}) · Zeolite (50kg/acre)${isTiger ? ' · Beta-Glucan Immunity Booster (Tiger needs extra)' : ''}. Ensure 30-day stock before PL release.`,
      action: 'View Medicine SOP',
      actionPath: '/medicine',
      urgency: prepDay <= 3 ? 8 : 5,
      timestamp: ts,
    });

    return alerts.sort((a, b) => b.urgency - a.urgency);
  }

  // ─── STOCKING DAY (DOC 0 or 1) ──────────────────────────────────────────────
  if (pond.doc === 0 || pond.doc === 1) {
    alerts.push({
      id: `stocking-day-${pond.pondId}`,
      type: 'critical',
      category: 'medicine',
      emoji: '🐟',
      title: `Stocking Day Protocol — ${species}`,
      body: `${pond.pondName}: CRITICAL first 24 hours. Acclimate seed for 30 min (temperature match). Apply Stress Booster immediately (Vit C + Betaine in water). Keep aerators at 100%. NO feed for first 12–24 hours. ${isTiger ? 'Tiger PL: extra sensitivity — monitor for 48hrs, watch for red gill signs.' : 'Vannamei PL: apply gut probiotic in water within first 6 hrs.'}`,
      action: 'Log Medicine',
      actionPath: '/medicine',
      urgency: 10,
      timestamp: ts,
    });

    alerts.push({
      id: `feed-stocking-${pond.pondId}`,
      type: 'warning',
      category: 'feed',
      emoji: '🌱',
      title: `Day 1 Feed Protocol — ${species}`,
      body: `Start BLIND FEEDING at DOC 1–3: Broadcast ${isTiger ? '1.2 kg/acre/day' : '1.0 kg/acre/day'} of Crumble No.1 evenly across pond. DO NOT use feed trays on Day 1. Feed 4x daily (6 AM, 10 AM, 2 PM, 6 PM). Increase 10% each day if no residue.`,
      action: 'Log Feed',
      actionPath: '/feed',
      urgency: 8,
      timestamp: ts,
    });

    return alerts.sort((a, b) => b.urgency - a.urgency);
  }

  // ─── DISEASE / CRITICAL STAGE ALERTS ────────────────────────────────────────
  const wssvWindow = profile.criticalDOC.wssv;
  const vibrioWindow = profile.criticalDOC.vibrio;

  if (pond.doc >= wssvWindow[0] && pond.doc <= wssvWindow[1] && !isUnderTreatment) {
    alerts.push({
      id: `wssv-${pond.pondId}`,
      type: 'critical',
      category: 'disease',
      emoji: '🦠',
      title: `WSSV RISK WINDOW — DOC ${pond.doc} (${species})`,
      body: `${pond.pondName} is in peak disease window (DOC ${wssvWindow[0]}–${wssvWindow[1]}). ${isTiger ? 'Tiger: HIGHLY susceptible to WSSV — check for white spots on shell & tail.' : 'Vannamei: check for white spots on body surface & lethargy.'} Run aerators 24/7. Apply immunity booster. Reduce feed 10% if stressed.`,
      action: 'Check Water Now',
      actionPath: `/ponds/${pond.pondId}/monitor`,
      urgency: 10,
      timestamp: ts,
    });
  }

  if (pond.doc >= vibrioWindow[0] && pond.doc <= vibrioWindow[1]) {
    alerts.push({
      id: `vibrio-${pond.pondId}`,
      type: 'warning',
      category: 'disease',
      emoji: '🔬',
      title: `Vibriosis Risk — DOC ${pond.doc} (${species})`,
      body: `Risk Stage for ${species}. Check for tail redness, gill discoloration. ${isTiger ? 'Tiger: Vibriosis peaks DOC 15–25 — apply probiotic in water every 3 days.' : 'Vannamei: Vibriosis peaks DOC 21–30 — apply gut probiotic daily.'} Apply anti-stress tonic. Reduce afternoon feed by 10%.`,
      action: 'View Medicine SOP',
      actionPath: '/medicine',
      urgency: 7,
      timestamp: ts,
    });
  }

  // ─── WATER QUALITY ALERTS ───────────────────────────────────────────────────
  if (pond.latestDO !== undefined) {
    if (pond.latestDO < 3.0 && !isUnderTreatment) {
      alerts.push({
        id: `do-critical-${pond.pondId}`,
        type: 'critical',
        category: 'water',
        emoji: '🚨',
        title: `EMERGENCY: DO at ${pond.latestDO} mg/L`,
        body: `${pond.pondName} oxygen is CRITICAL. Run ALL aerators immediately. STOP feeding. Apply emergency oxygen granules if available. Mass mortality risk within hours.`,
        action: 'Log Water Now',
        actionPath: `/ponds/${pond.pondId}/water-log`,
        urgency: 10,
        timestamp: ts,
      });
    } else if (pond.latestDO < 4.0) {
      alerts.push({
        id: `do-low-${pond.pondId}`,
        type: 'warning',
        category: 'water',
        emoji: '⚠️',
        title: `Low DO: ${pond.latestDO} mg/L in ${pond.pondName}`,
        body: `Dissolved oxygen below safe threshold (min 4.0 mg/L). Increase aeration, reduce next feed slot by 30%. Monitor every 2 hours.`,
        action: 'Monitor Pond',
        actionPath: '/monitor',
        urgency: 8,
        timestamp: ts,
      });
    }
  }

  if (pond.latestPH !== undefined) {
    if ((pond.latestPH > 8.8 || pond.latestPH < 7.0) && !isUnderTreatment) {
      alerts.push({
        id: `ph-critical-${pond.pondId}`,
        type: 'critical',
        category: 'water',
        emoji: '🧪',
        title: `Critical pH: ${pond.latestPH} in ${pond.pondName}`,
        body: pond.latestPH > 8.8
          ? `High pH causes alkalosis, reduces DO availability. Apply zeolite or organic acids immediately.`
          : `Low pH causes acidosis, gill damage. Apply Dolomite / Agricultural Lime. Stop probiotics until stable.`,
        action: 'Correct Water',
        actionPath: `/ponds/${pond.pondId}/water-log`,
        urgency: 9,
        timestamp: ts,
      });
    } else if (pond.latestPH > 8.5 || pond.latestPH < 7.5) {
      alerts.push({
        id: `ph-warn-${pond.pondId}`,
        type: 'warning',
        category: 'water',
        emoji: '🧪',
        title: `pH Off-Range: ${pond.latestPH} (${pond.pondName})`,
        body: `Target range: 7.5–8.5. ${pond.latestPH > 8.5 ? 'Slight alkalosis risk. Reduce heavy feeding.' : 'Apply lime or bicarbonate to raise pH.'}`,
        action: 'Log Update',
        actionPath: `/ponds/${pond.pondId}/water-log`,
        urgency: 6,
        timestamp: ts,
      });
    }
  }

  if (pond.latestAmmonia !== undefined && pond.latestAmmonia > 0.5 && !isUnderTreatment) {
    alerts.push({
      id: `ammonia-${pond.pondId}`,
      type: 'critical',
      category: 'water',
      emoji: '☠️',
      title: `Ammonia Toxicity: ${pond.latestAmmonia} ppm`,
      body: `EMERGENCY in ${pond.pondName}. Stop ALL feeding immediately. Apply 40–50 kg/acre Zeolite. Do NOT apply probiotics for 24 hours. Check for mortality.`,
      action: 'Apply Zeolite SOP',
      actionPath: '/medicine',
      urgency: 10,
      timestamp: ts,
    });
  }

  // ─── NO WATER LOG ALERT ─────────────────────────────────────────────────────
  if (pond.doc > 0 && pond.status === 'active' && !loggedToday) {
    const lastLog = pond.lastWaterLogDate ? new Date(pond.lastWaterLogDate) : null;
    const hoursWithoutLog = lastLog ? (now.getTime() - lastLog.getTime()) / (1000 * 60 * 60) : 999;
    if (hoursWithoutLog > 22) {
      alerts.push({
        id: `no-water-log-${pond.pondId}`,
        type: 'warning',
        category: 'water',
        emoji: '📊',
        title: `No Water Log: ${pond.pondName}`,
        body: `Water quality not logged today. Daily monitoring is critical for SOP compliance and early disease detection.`,
        action: 'Log Water Quality',
        actionPath: `/ponds/${pond.pondId}/water-log`,
        urgency: 7,
        timestamp: ts,
      });
    }
  }

  // ─── WEATHER ALERTS ──────────────────────────────────────────────────────────
  if (isRaining && pond.doc > 0) {
    alerts.push({
      id: `rain-${pond.pondId}`,
      type: 'warning',
      category: 'weather',
      emoji: '🌧️',
      title: `Rain Alert — Reduce Feed 15%`,
      body: `Rainfall detected. Rain lowers DO and pH. ${pond.pondName}: reduce feed by 15%, increase aeration. ${isTiger ? 'Tiger shrimp more susceptible to sudden salinity drops from rain.' : 'Monitor surface activity and salinity.'}`,
      action: 'View Feed Plan',
      actionPath: '/feed',
      urgency: 6,
      timestamp: ts,
    });
  }

  if (isHeatWave && pond.doc > 0) {
    alerts.push({
      id: `heat-${pond.pondId}`,
      type: 'warning',
      category: 'weather',
      emoji: '🌡️',
      title: `Heat Wave — Temp ${airTemp}°C`,
      body: `Extreme heat stresses shrimp and drops DO. Skip 12 PM–2 PM feeding. Reduce total by 25%. Apply Vitamin C anti-stress. Run night aeration at 100%. ${isVannamei ? 'Vannamei stress threshold: 30°C.' : 'Tiger is less heat-sensitive but still monitor DO.'}`,
      action: 'Adjust Feed',
      actionPath: '/feed',
      urgency: 7,
      timestamp: ts,
    });
  }

  // ─── FEED ALERTS (Species-aware) ─────────────────────────────────────────────
  const fcr = pond.totalFeedKg > 0 && pond.estimatedBiomassKg > 0
    ? pond.totalFeedKg / pond.estimatedBiomassKg
    : 0;

  if (fcr > profile.fcrTarget + 0.2 && pond.doc >= 20) {
    alerts.push({
      id: `fcr-high-${pond.pondId}`,
      type: 'warning',
      category: 'feed',
      emoji: '📉',
      title: `High FCR: ${fcr.toFixed(2)} in ${pond.pondName}`,
      body: `Target FCR ≤ ${profile.fcrTarget} for ${species}. Current ${fcr.toFixed(2)} indicates overfeeding or poor survival. Reduce daily feed by 15%, check tray residue (${profile.trayCheckTime} post-feed). ${isTiger ? 'Tiger: cut afternoon slot first.' : 'Vannamei: reduce morning slot and recheck tray.'}`,
      action: 'View FCR Details',
      actionPath: '/feed',
      urgency: 6,
      timestamp: ts,
    });
  }

  // Feed type upgrade suggestions
  if (profile.feedTypeChangeDOC.includes(pond.doc)) {
    const idx = profile.feedTypeChangeDOC.indexOf(pond.doc);
    const nextTypes = isTiger
      ? ['Pellet No.2 (38% protein, 1.0mm)', 'Grower Pellet No.3 (36%, 1.8mm)', 'Finisher No.4 (34%, 2.5mm)']
      : ['Pellet No.2 (38% protein, 1.0–1.2mm)', 'Grower Pellet No.3 (36%, 1.5–1.8mm)', 'Finisher No.4 (35%, 2.0–2.5mm)'];
    alerts.push({
      id: `feed-type-upgrade-${pond.pondId}`,
      type: 'info',
      category: 'feed',
      emoji: '🔄',
      title: `Feed Type Upgrade — DOC ${pond.doc} (${species})`,
      body: `${pond.pondName}: Time to switch to ${nextTypes[idx] || 'next feed grade'}. Blend old and new feed for 3 days to avoid digestive shock. ${isTiger ? 'Tiger: transition slowly over 5 days.' : 'Vannamei: 3-day blend is sufficient.'}`,
      action: 'Update Feed Log',
      actionPath: '/feed',
      urgency: 6,
      timestamp: ts,
    });
  }

  if (isMorning && pond.doc > 0 && pond.status === 'active' && !fedToday) {
    alerts.push({
      id: `morning-feed-${pond.pondId}`,
      type: 'info',
      category: 'feed',
      emoji: '🌅',
      title: `Morning Feed Window — ${timeLabel(hour)}`,
      body: `${pond.pondName} (DOC ${pond.doc}): First feed slot is 6 AM. Broadcast evenly. ${isTiger ? 'Tiger: 1.2 kg/acre. Feed 5× today.' : 'Vannamei: 1.0 kg/acre. Feed 4× today.'} Avoid cloudy areas. DO must be >5 mg/L before feeding.`,
      action: 'Log Feed',
      actionPath: '/feed',
      urgency: 6,
      timestamp: ts,
      scheduledFor: '06:00 AM',
    });
  }

  if (isTrayCheck && pond.doc > 0 && pond.status === 'active' && (pond.todayFeedCount || 0) < 2) {
    alerts.push({
      id: `tray-check-${pond.pondId}`,
      type: 'info',
      category: 'feed',
      emoji: '🔍',
      title: `Feed Tray Check Time — ${timeLabel(hour)}`,
      body: `${pond.pondName} (DOC ${pond.doc}): Check feed trays now (${profile.trayCheckTime} after morning feed). ${isTiger ? 'Tiger: >10% residue → cut next slot 15%.' : 'Vannamei: >5% residue → cut next slot 10% and check DO.'} Log result.`,
      action: 'Log Feed Update',
      actionPath: '/feed',
      urgency: 5,
      timestamp: ts,
      scheduledFor: '09:30 AM',
    });
  }

  if (isNoon && isHeatWave && pond.doc > 0) {
    alerts.push({
      id: `noon-heat-feed-${pond.pondId}`,
      type: 'warning',
      category: 'feed',
      emoji: '☀️',
      title: `Skip Noon Feed — Heat ${airTemp}°C`,
      body: `${pond.pondName}: Temperature is ${airTemp}°C. Skip the 12:00–2:00 PM feed slot. Shrimp metabolism slows in heat; overfeeding raises DO demand. Resume at 4 PM.`,
      action: 'Update Feed',
      actionPath: '/feed',
      urgency: 7,
      timestamp: ts,
      scheduledFor: '12:00 PM',
    });
  }

  if (isDusk && pond.doc > 0 && pond.status === 'active') {
    alerts.push({
      id: `dusk-do-${pond.pondId}`,
      type: 'info',
      category: 'water',
      emoji: '🌇',
      title: `Dusk DO Check — ${timeLabel(hour)}`,
      body: `${pond.pondName}: Dusk is peak photosynthesis crash hour. Check DO now (must be >5 mg/L). Run additional aerators from 6 PM onwards. ${isVannamei ? 'Vannamei are most active at night — ensure max aeration.' : ''}`,
      action: 'Log Water Quality',
      actionPath: `/ponds/${pond.pondId}/water-log`,
      urgency: 6,
      timestamp: ts,
      scheduledFor: '06:00 PM',
    });
  }

  if (isNightfall && pond.doc > 0 && pond.status === 'active') {
    alerts.push({
      id: `night-aeration-${pond.pondId}`,
      type: 'info',
      category: 'water',
      emoji: '🌙',
      title: `Night Aeration Check — ${timeLabel(hour)}`,
      body: `${pond.pondName}: Ensure ALL aerators are running. Night DO crashes are the #1 mortality cause. Pre-dawn (3–5 AM) is most critical. Set an alarm if needed.`,
      action: 'View Pond',
      actionPath: `/ponds/${pond.pondId}/monitor`,
      urgency: 7,
      timestamp: ts,
      scheduledFor: '08:00 PM',
    });
  }

  if (isPreDawn && pond.doc > 0 && pond.status === 'active') {
    const isCriticalPreDawn = pond.latestDO !== undefined && pond.latestDO < 4.5;
    alerts.push({
      id: `predawn-do-${pond.pondId}`,
      type: isCriticalPreDawn ? 'critical' : 'info',
      category: 'water',
      emoji: '🌑',
      title: `${isCriticalPreDawn ? 'URGENT: ' : ''}Pre-Dawn DO Alert — ${timeLabel(hour)}`,
      body: isCriticalPreDawn 
        ? `${pond.pondName}: DO is dropping (${pond.latestDO}). Run all aerators immediately. High mortality risk.`
        : `${pond.pondName}: This is the highest-risk window (3–6 AM). Ensure all aerators are running.`,
      action: 'Log Water Now',
      actionPath: `/ponds/${pond.pondId}/water-log`,
      urgency: isCriticalPreDawn ? 10 : 6,
      timestamp: ts,
      scheduledFor: '04:00 AM',
    });
  }

  // ─── MEDICINE ALERTS (Species-aware, DOC milestone-based) ───────────────────
  if (pond.doc > 0 && pond.doc <= 10 && pond.medicineLogs7Days === 0) {
    alerts.push({
      id: `gut-probiotic-${pond.pondId}`,
      type: 'warning',
      category: 'medicine',
      emoji: '💊',
      title: `Gut Probiotic Not Logged (DOC ${pond.doc})`,
      body: `${pond.pondName}: Gut probiotic foundation critical DOC 1–10. No medicine logs in 7 days. Apply ${isTiger ? 'Gut Probiotic 7g/kg feed' : 'Gut Probiotic 5–10g/kg feed'}. Water probiotic: ${profile.waterProbioticDose}. DOC ${pond.doc <= 5 ? '5' : '10'} schedule application.`,
      action: 'Log Medicine',
      actionPath: '/medicine',
      urgency: 7,
      timestamp: ts,
    });
  }

  if (pond.doc >= 13 && pond.doc <= 17 && pond.medicineLogs7Days < 2) {
    alerts.push({
      id: `vitc-booster-${pond.pondId}`,
      type: 'warning',
      category: 'medicine',
      emoji: '🍋',
      title: `Vitamin C Booster Day — DOC ${pond.doc}`,
      body: `${pond.pondName}: Scheduled Vitamin C booster for ${species}. Apply high-dose Vitamin C + Betaine in feed. ${isTiger ? 'Tiger dose: 3g Vit C/kg feed + 2g Betaine.' : 'Vannamei dose: 2–3g Vit C/kg feed + 1g Betaine.'} Water probiotic today also.`,
      action: 'Log Medicine',
      actionPath: '/medicine',
      urgency: 8,
      timestamp: ts,
    });
  }

  if (pond.doc >= 23 && pond.doc <= 27 && pond.medicineLogs7Days < 3) {
    alerts.push({
      id: `immunity-booster-${pond.pondId}`,
      type: 'warning',
      category: 'medicine',
      emoji: '🛡️',
      title: `Immunity Booster Window — DOC ${pond.doc}`,
      body: `${pond.pondName}: Apply immunity booster + disease prevention. ${isTiger ? 'Tiger: apply Beta-Glucan + Organic Acids in feed. Check for redleg symptoms.' : 'Vannamei: apply high-dose probiotic + WSSV prevention mineral pack.'} Start increasing aeration hours.`,
      action: 'Log Medicine',
      actionPath: '/medicine',
      urgency: 8,
      timestamp: ts,
    });
  }

  if (pond.doc >= 38 && pond.doc <= 42 && pond.medicineLogs7Days < 2) {
    alerts.push({
      id: `vit-mineral-booster-${pond.pondId}`,
      type: 'info',
      category: 'medicine',
      emoji: '💎',
      title: `Vitamin + Mineral Boost — DOC ${pond.doc}`,
      body: `${pond.pondName}: Critical growth window mineral dose. Apply ${isTiger ? 'Vitamin E + Mineral Mix (20 kg/acre). Tiger: also Phospholipid supplement for shell hardening.' : 'Vitamin C+E + Mineral Mix (15–20 kg/acre). Vannamei: also water probiotic (400g/acre).'}`,
      action: 'Log Medicine',
      actionPath: '/medicine',
      urgency: 7,
      timestamp: ts,
    });
  }

  if (pond.doc >= 48 && pond.doc <= 52 && (pond.todayMedCount || 0) === 0) {
    alerts.push({
      id: `liver-tonic-${pond.pondId}`,
      type: 'info',
      category: 'medicine',
      emoji: '🫀',
      title: `Liver Tonic Day — DOC ${pond.doc}`,
      body: `${pond.pondName}: Apply hepatoprotectant (Liver Tonic) to prevent HP necrosis. ${isTiger ? 'Tiger: apply 3–5g/kg feed liver tonic for 5 consecutive days [high risk].' : 'Vannamei: apply 2–3g/kg feed liver tonic for 3 days.'}`,
      action: 'Log Medicine',
      actionPath: '/medicine',
      urgency: 7,
      timestamp: ts,
    });
  }

  if (pond.doc >= 83) {
    const harvestDOC = profile.harvestDOC;
    const daysLeft = Math.max(0, harvestDOC - pond.doc);
    alerts.push({
      id: `harvest-withdraw-${pond.pondId}`,
      type: pond.doc >= 90 ? 'critical' : 'warning',
      category: 'harvest',
      emoji: '🎣',
      title: pond.doc >= 90
        ? `STOP Heavy Medicines — DOC ${pond.doc} (${species})`
        : `Withdrawal Protocol Begins (${daysLeft}d left)`,
      body: pond.doc >= 90
        ? `${pond.pondName}: Mandatory medicine withdrawal before harvest. ${isTiger ? 'Tiger harvest target: DOC 120. Focus on clean water & size sampling.' : 'Vannamei: harvest at DOC 90–100. Water clarity + residue-free testing required.'} No heavy antibiotics.`
        : `Withdrawal protocol starting for ${pond.pondName} (${species}). Stop all heavy medicines in ${daysLeft} days for safe, residue-free harvest.`,
      action: 'View Harvest Prep',
      actionPath: '/medicine',
      urgency: pond.doc >= 90 ? 9 : 6,
      timestamp: ts,
    });
  }

  // ─── LUNAR ALERTS ────────────────────────────────────────────────────────────
  if (lunar.phase !== 'NORMAL' && pond.doc > 0) {
    const lunarMessages: Record<string, string> = {
      AMAVASYA: `🌑 Amavasya tonight! HIGH mass molting in ${pond.pondName}. Reduce feed ${isTiger ? '30%' : '25%'}, run ALL aerators all night, apply Mineral Mix ${profile.mineralDose}.`,
      POURNAMI: `🌕 Pournami! High biological activity. Increase aeration to 100% for ${pond.pondName}. Monitor DO at midnight. ${isVannamei ? 'Apply water probiotic this evening.' : ''}`,
      ASHTAMI: `🌓 Ashtami: Molting initiation begins. Reduce feed ${isTiger ? '15%' : '10%'} for ${pond.pondName}. Apply minerals (evening). Watch soft-shells.`,
      NAVAMI: `🌙 Navami: Peak molting recovery night. Reduce feed ${isTiger ? '20%' : '15%'} for ${pond.pondName}. Maintain max aeration until 2 AM.`,
    };

    if (lunarMessages[lunar.phase]) {
      alerts.push({
        id: `lunar-${lunar.phase}-${pond.pondId}`,
        type: lunar.phase === 'AMAVASYA' ? 'critical' : 'warning',
        category: 'medicine',
        emoji: lunar.phase === 'AMAVASYA' ? '🌑' : lunar.phase === 'POURNAMI' ? '🌕' : '🌙',
        title: `${lunar.phase} Lunar Alert — ${pond.pondName}`,
        body: lunarMessages[lunar.phase],
        action: 'View SOP',
        actionPath: '/medicine',
        urgency: lunar.phase === 'AMAVASYA' ? 9 : 7,
        timestamp: ts,
      });
    }
  }

  // ─── NEXT MILESTONE APPROACH ─────────────────────────────────────────────────
  const milestones = isTiger
    ? [10, 20, 25, 30, 40, 50, 60, 70, 85, 100, 120]
    : [10, 15, 21, 25, 31, 40, 45, 50, 70, 81, 90, 100];
  const nextMilestone = milestones.find(m => m > pond.doc);
  if (nextMilestone && (nextMilestone - pond.doc) <= 3) {
    const vannameiLabels: Record<number, string> = {
      10: 'End of Nursery Phase', 15: 'Vitamin C Booster Day', 21: 'Risk Stage Begins',
      25: 'Vibriosis Check + Immunity Booster', 31: 'CRITICAL Stage Begins — Max Aeration',
      40: 'Vit+Mineral Booster Day', 45: 'Critical Stage End', 50: 'Liver Tonic Day',
      70: 'Final Immunity Boost', 81: 'Harvest Prep Phase', 90: 'Medicine Withdrawal',
      100: 'Harvest Target',
    };
    const tigerLabels: Record<number, string> = {
      10: 'End of Nursery Phase', 20: 'Vitamin C Booster Day', 25: 'Vibriosis Check',
      30: 'Risk Stage Begins', 40: 'CRITICAL Stage — Max Aeration', 50: 'Liver Tonic Day',
      60: 'Growth Peak', 70: 'Mineral High Dose', 85: 'Harvest Prep Phase',
      100: 'Mid-harvest check', 120: 'Harvest Target',
    };
    const milestoneLabels = isTiger ? tigerLabels : vannameiLabels;

    alerts.push({
      id: `milestone-${nextMilestone}-${pond.pondId}`,
      type: 'info',
      category: 'medicine',
      emoji: '🎯',
      title: `DOC ${nextMilestone} Approaching in ${nextMilestone - pond.doc} Days!`,
      body: `Prepare for: ${milestoneLabels[nextMilestone] || 'Next major SOP event'}. Review medicine stock for ${pond.pondName} (${species}).`,
      action: 'View SOP Planner',
      actionPath: '/sop-library',
      urgency: 5,
      timestamp: ts,
    });
  }

  return alerts.sort((a, b) => b.urgency - a.urgency);
};

/** Build situation inputs from app context data */
export const buildSituationInputs = (
  ponds: any[],
  waterRecords: any[],
  feedLogs: any[],
  medicineLogs: any[],
  calculateDOC: (date: string, asOf?: string) => number
): PondSituationInput[] => {
  return ponds
    .filter(p => p.status === 'active' || p.status === 'planned')
    .map(p => {
      const doc = calculateDOC(p.stockingDate);
      const pondWater = waterRecords
        .filter(w => w.pondId === p.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latest = pondWater[0];

      const pondFeed = feedLogs.filter(f => f.pondId === p.id);
      const totalFeed = pondFeed.reduce((a, f) => a + (f.quantity || 0), 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const pondMeds7 = medicineLogs.filter(
        m => m.pondId === p.id && new Date(m.date) >= weekAgo
      ).length;

      const survivalRate = Math.max(0.78, 1 - doc * 0.002);
      const avgWeight = Math.min(35, doc * 0.38);
      const biomassKg = (Number(p.seedCount || 0) * survivalRate * avgWeight) / 1000;

      const today = new Date().toISOString().split('T')[0];
      const todayFeed = pondFeed.filter(f => f.date === today);
      const todayFeedKg = todayFeed.reduce((acc, f) => acc + (f.quantity || 0), 0);
      const todayMeds = medicineLogs.filter(m => m.pondId === p.id && m.date === today).length;

      return {
        pondId: p.id,
        pondName: p.name,
        doc,
        status: p.status,
        seedCount: Number(p.seedCount || 0),
        species: p.species || 'Vannamei',
        pondSize: Number(p.size || 1),
        latestPH: latest?.ph,
        latestDO: latest?.do,
        latestTemp: latest?.temperature,
        latestAmmonia: latest?.ammonia,
        lastWaterLogDate: latest?.date || latest?.timestamp,
        feedLogsCount: pondFeed.length,
        lastFeedDate: pondFeed[pondFeed.length - 1]?.date,
        todayFeedKg: todayFeedKg,
        todayFeedCount: todayFeed.length,
        todayMedCount: todayMeds,
        totalFeedKg: totalFeed,
        estimatedBiomassKg: biomassKg,
        medicineLogs7Days: pondMeds7,
        medicineStatus: p.customData?.medicineStatus,
      };
    });
};
