/**
 * sopTranslations.ts
 * ------------------------------------------------------------------
 * Translation keys for SOP-driven intelligence alerts.
 * Used by: situationEngine.ts, PondDetail, FeedManagement,
 *          MedicineSchedule, DiseaseDetection
 * ------------------------------------------------------------------
 */

import type { Language } from '../types';

// ─── Type Definitions ──────────────────────────────────────────────────────────

export interface SOPTranslations {
  // ── Water Quality Alerts ────────────────────────────────────────
  waterLowDO: string;
  waterLowDOAction: string;
  waterHighPH: string;
  waterHighPHAction: string;
  waterLowPH: string;
  waterLowPHAction: string;
  waterHighAmmonia: string;
  waterHighAmmoniaAction: string;
  waterLowSalinity: string;
  waterHighTemp: string;
  waterHighTempAction: string;
  waterNightDOCrash: string;

  // ── Feed Alerts ─────────────────────────────────────────────────
  feedAmavasyaReduce: string;
  feedAmavasyaReduceDetail: string;
  feedAshtamiMinerals: string;
  feedAshtamiDetail: string;
  feedLowDOReduce: string;
  feedLowDOReduceDetail: string;
  feedHeatStress: string;
  feedHeatStressDetail: string;
  feedRainEvent: string;
  feedRainDetail: string;
  feedFCRHigh: string;
  feedFCRHighDetail: string;
  feedBlindPhase: string;
  feedBlindPhaseDetail: string;
  feedMoltingPhase: string;
  feedMoltingAction: string;

  // ── Disease Risk Alerts ─────────────────────────────────────────
  diseaseWSSVRisk: string;
  diseaseWSSVAction: string;
  diseaseEMSRisk: string;
  diseaseEMSAction: string;
  diseaseVibrioRisk: string;
  diseaseVibrioAction: string;
  diseaseWhiteGutRisk: string;
  diseaseWhiteGutAction: string;
  diseaseEHPRisk: string;
  diseaseEHPAction: string;

  // ── Medicine / Protocol Alerts ──────────────────────────────────
  medicineProbioticDue: string;
  medicineProbioticDetail: string;
  medicineImmunoboosterDue: string;
  medicineImmunoboosterDetail: string;
  medicineMineralDue: string;
  medicineMineralDetail: string;
  medicineZeoliteDue: string;
  medicineZeoliteDetail: string;
  medicineLimeDue: string;
  medicineLimeDetail: string;
  medicineWithdrawalWarning: string;
  medicineWithdrawalDetail: string;

  // ── Harvest Readiness ───────────────────────────────────────────
  harvestReadyAlert: string;
  harvestReadyDetail: string;
  harvestWithdrawalPeriod: string;
  harvestBestWindow: string;

  // ── Compliance / Logging ────────────────────────────────────────
  noWaterLogToday: string;
  noFeedLogToday: string;
  logNowAction: string;
  streakRiskWarning: string;

  // ── Aerator Alerts ──────────────────────────────────────────────
  aeratorNightOn: string;
  aeratorNightOnDetail: string;
  aeratorCheckDue: string;
  aeratorUpgradeNeeded: string;

  // ── Stage Milestones ────────────────────────────────────────────
  stageJuvenile: string;
  stageGrowing: string;
  stagePreharvest: string;
  milestoneDoc30: string;
  milestoneDoc60: string;
  milestoneDoc90: string;
}

// ─── English ───────────────────────────────────────────────────────────────────

const English: SOPTranslations = {
  // Water
  waterLowDO: 'Low Dissolved Oxygen Detected',
  waterLowDOAction: 'Activate all aerators immediately. Stop feeding until DO recovers above 5 mg/L.',
  waterHighPH: 'pH Too High — Algae Bloom Risk',
  waterHighPHAction: 'Increase aeration. Apply organic acid (citric) at 200g/acre. Partial water exchange if pH > 9.',
  waterLowPH: 'pH Too Low — Stress Risk',
  waterLowPHAction: 'Apply agricultural lime (CaCO₃) at 100–200 kg/acre. Check alkalinity.',
  waterHighAmmonia: 'Ammonia Spike — Toxicity Alert',
  waterHighAmmoniaAction: 'Reduce feed by 50% for 2 days. Apply probiotics. Partial water exchange (10–15%).',
  waterLowSalinity: 'Salinity Below Optimal',
  waterHighTemp: 'Water Temperature Too High',
  waterHighTempAction: 'Increase water exchange in evening. Shade critical areas. Reduce afternoon feed slot.',
  waterNightDOCrash: 'Night DO Crash Risk — Algae Bloom',

  // Feed
  feedAmavasyaReduce: 'Amavasya — Reduce Feed Today',
  feedAmavasyaReduceDetail: 'New moon molting risk is high. Reduce feed by 30% and activate aerators through the night.',
  feedAshtamiMinerals: 'Ashtami — Add Mineral Supplement',
  feedAshtamiDetail: 'Apply Ca/Mg mineral supplement (1 kg/acre) to support molting shrimp. Reduce feed by 20%.',
  feedLowDOReduce: 'Low DO — Feed Reduced',
  feedLowDOReduceDetail: 'DO below 4 mg/L. Feed reduced by 30% for this slot to prevent oxygen depletion.',
  feedHeatStress: 'Heat Stress — Reduce Afternoon Feed',
  feedHeatStressDetail: 'Temperature > 32°C. Skip or halve the 12 PM slot. Feed at dawn and dusk when DO is stable.',
  feedRainEvent: 'Rain Event — Feed Suspended',
  feedRainDetail: 'Suspend feeding during rain. Shrimp stop eating and wasted feed increases ammonia. Resume after 1 hour.',
  feedFCRHigh: 'FCR High — Check Feed Trays',
  feedFCRHighDetail: 'FCR above 2.0 detected. Check feed trays for leftovers. Reduce feed by 10% for 2 days.',
  feedBlindPhase: 'Blind Feeding Active (DOC < 10)',
  feedBlindPhaseDetail: 'Shrimp too small to check in trays. Follow standard DOC formula. Check for abnormal mortality.',
  feedMoltingPhase: 'Molting Window — Reduce Feed',
  feedMoltingAction: 'Reduce feed by 20%. Increase Ca/Mg. Avoid disturbances during peak molting hours (night).',

  // Disease
  diseaseWSSVRisk: 'WSSV Risk Elevated This Stage',
  diseaseWSSVAction: 'Check for white spots on shell. Reduce stress. Strengthen biosecurity. No pond entry without disinfection.',
  diseaseEMSRisk: 'EMS/AHPND Risk (Early DOC)',
  diseaseEMSAction: 'Check hepatopancreas color daily. Maintain DO > 5. Use quality-certified seed and avoid overfeeding.',
  diseaseVibrioRisk: 'Vibriosis Risk — Monitor Water',
  diseaseVibrioAction: 'Check for luminescence at night. Apply probiotic (Bacillus) at 1 kg/acre. Reduce organic load.',
  diseaseWhiteGutRisk: 'White Gut Risk — Check Gut Line',
  diseaseWhiteGutAction: 'Inspect gut line. Reduce feed 30%. Apply probiotics in feed. Consider organic acid supplement.',
  diseaseEHPRisk: 'EHP Risk — Monitor Growth Rate',
  diseaseEHPAction: 'Weigh shrimp weekly. If size variation > 20%, test for EHP. Maintain strict biosecurity.',

  // Medicine
  medicineProbioticDue: 'Probiotic Application Due',
  medicineProbioticDetail: 'Apply Bacillus-based probiotic (500g/acre) weekly to maintain gut health and water balance.',
  medicineImmunoboosterDue: 'Immunity Booster Application Due',
  medicineImmunoboosterDetail: 'Mix Vitamin C + β-glucan supplement in feed (2g/kg feed) for 5 consecutive days.',
  medicineMineralDue: 'Mineral Supplement Due',
  medicineMineralDetail: 'Apply Ca/Mg/K mineral mix (1 kg/acre) to support molting and shell formation.',
  medicineZeoliteDue: 'Zeolite Application Due',
  medicineZeoliteDetail: 'Broadcast zeolite (10 kg/acre) in early morning to adsorb ammonia from pond bottom.',
  medicineLimeDue: 'Lime Application Due',
  medicineLimeDetail: 'Apply agricultural lime (50 kg/acre) tonight to stabilize pH and alkalinity.',
  medicineWithdrawalWarning: '⚠ Withdrawal Period Active',
  medicineWithdrawalDetail: 'Medicine applied within the last 14 days. Do not harvest until withdrawal period is complete.',

  // Harvest
  harvestReadyAlert: '🎉 Pond Ready for Harvest',
  harvestReadyDetail: 'Shrimp has reached 90+ DOC. Average weight estimated at 20g+. Optimal harvest window is now.',
  harvestWithdrawalPeriod: 'Withdrawal Period — Cannot Harvest Yet',
  harvestBestWindow: 'Best Harvest Window: DOC 90–120',

  // Compliance
  noWaterLogToday: 'Water Quality Not Logged Today',
  noFeedLogToday: 'Feed Not Logged Today',
  logNowAction: 'Log Now to maintain Trust Score',
  streakRiskWarning: '⚠ Logging streak at risk — log today to preserve your streak',

  // Aerator
  aeratorNightOn: 'Run All Aerators Tonight',
  aeratorNightOnDetail: 'Amavasya / high DO risk night. Keep all aerators running until 6 AM.',
  aeratorCheckDue: 'Aerator Check Due',
  aeratorUpgradeNeeded: 'Aerator Upgrade Recommended',

  // Stage
  stageJuvenile: 'Juvenile Stage (DOC 1–30)',
  stageGrowing: 'Growing Stage (DOC 31–60)',
  stagePreharvest: 'Pre-Harvest Stage (DOC 61–90)',
  milestoneDoc30: '🎯 30-Day Milestone — Check FCR & Growth',
  milestoneDoc60: '🎯 60-Day Milestone — Prepare Harvest Strategy',
  milestoneDoc90: '🏆 90-Day Milestone — Harvest Window Open',
};

// ─── Telugu ────────────────────────────────────────────────────────────────────

const Telugu: SOPTranslations = {
  // Water
  waterLowDO: 'తక్కువ ద్రవీభూత ఆక్సిజన్ గుర్తించబడింది',
  waterLowDOAction: 'అన్ని ఆక్సిజనేటర్లు వెంటనే సక్రియం చేయండి. DO 5 mg/L పైకి రాకపోతే ఆహారం ఆపండి.',
  waterHighPH: 'pH చాలా ఎక్కువ — ఆల్గే పువ్వు ప్రమాదం',
  waterHighPHAction: 'ఆక్సిజనేషన్ పెంచండి. సిట్రిక్ యాసిడ్ 200g/ఎకరా వేయండి. pH > 9 అయితే నీళ్ళు మారుస్తారు.',
  waterLowPH: 'pH చాలా తక్కువ — ఒత్తిడి ప్రమాదం',
  waterLowPHAction: 'వ్యవసాయ సున్నం (CaCO₃) 100–200 కిలో/ఎకరా వేయండి. క్షారత తనిఖీ చేయండి.',
  waterHighAmmonia: 'అమ్మోనియా పెరుగుదల — విషబాధ హెచ్చరిక',
  waterHighAmmoniaAction: '2 రోజుల పాటు ఆహారం 50% తగ్గించండి. ప్రోబయోటిక్ వేయండి. 10–15% నీళ్ళు మార్చండి.',
  waterLowSalinity: 'ఉప్పు సాంద్రత అనుకూల శ్రేణి కంటే తక్కువ',
  waterHighTemp: 'నీటి ఉష్ణోగ్రత చాలా ఎక్కువ',
  waterHighTempAction: 'సాయంత్రం నీళ్ళు మార్చండి. మధ్యాహ్నం ఆహారం స్లాట్ తగ్గించండి.',
  waterNightDOCrash: 'రాత్రి DO తగ్గడం ప్రమాదం — ఆల్గే పువ్వు',

  // Feed
  feedAmavasyaReduce: 'అమావాస్య — ఈ రోజు ఆహారం తగ్గించండి',
  feedAmavasyaReduceDetail: 'అమావాస్య పెళ్ళు ప్రమాదం ఎక్కువ. ఆహారం 30% తగ్గించి రాత్రంతా ఆక్సిజనేటర్లు నడపండి.',
  feedAshtamiMinerals: 'అష్టమి — ఖనిజ అనుబంధం వేయండి',
  feedAshtamiDetail: 'Ca/Mg ఖనిజ మిశ్రమం (1 కిలో/ఎకరా) వేయండి. ఆహారం 20% తగ్గించండి.',
  feedLowDOReduce: 'తక్కువ DO — ఆహారం తగ్గించబడింది',
  feedLowDOReduceDetail: 'DO 4 mg/L కింద ఉంది. ఈ స్లాట్‌కు ఆహారం 30% తగ్గించబడింది.',
  feedHeatStress: 'వేడి ఒత్తిడి — మధ్యాహ్నం ఆహారం తగ్గించండి',
  feedHeatStressDetail: 'ఉష్ణోగ్రత > 32°C. 12 గంటల స్లాట్ వదలండి లేదా సగం వేయండి. తెల్లవారు మరియు సాయంత్రం ఆహారం వేయండి.',
  feedRainEvent: 'వర్షం — ఆహారం నిలిపివేయండి',
  feedRainDetail: 'వర్షం సమయంలో ఆహారం వేయకండి. వర్షం ఆగిన 1 గంట తర్వాత పునఃప్రారంభించండి.',
  feedFCRHigh: 'FCR ఎక్కువ — ఆహారపు ట్రేలు తనిఖీ చేయండి',
  feedFCRHighDetail: 'FCR 2.0 పై ఉంది. ట్రేలలో మిగిలిన ఆహారం చూడండి. 2 రోజుల పాటు ఆహారం 10% తగ్గించండి.',
  feedBlindPhase: 'సంప్రదింపు లేకుండా ఆహారం (DOC < 10)',
  feedBlindPhaseDetail: 'రొయ్యలు చాలా చిన్నగా ఉన్నాయి. DOC సూత్రాన్ని అనుసరించండి.',
  feedMoltingPhase: 'పెళ్ళు సమయం — ఆహారం తగ్గించండి',
  feedMoltingAction: 'ఆహారం 20% తగ్గించండి. Ca/Mg పెంచండి. రాత్రి పెళ్ళు సమయంలో చెరువు దాటడం మానుకోండి.',

  // Disease
  diseaseWSSVRisk: 'ఈ దశలో WSSV ప్రమాదం ఎక్కువ',
  diseaseWSSVAction: 'షెల్‌పై తెల్లని మచ్చలు తనిఖీ చేయండి. జీవ భద్రత బలోపేతం చేయండి.',
  diseaseEMSRisk: 'EMS/AHPND ప్రమాదం (ప్రారంభ DOC)',
  diseaseEMSAction: 'హెపాటోపాన్‌క్రియాస్ రంగు రోజూ తనిఖీ చేయండి. DO > 5 నిర్వహించండి.',
  diseaseVibrioRisk: 'విబ్రియోసిస్ ప్రమాదం — నీళ్ళు పర్యవేక్షించండి',
  diseaseVibrioAction: 'రాత్రి ప్రకాశం తనిఖీ చేయండి. బాసిల్లస్ ప్రోబయోటిక్ 1 కిలో/ఎకరా వేయండి.',
  diseaseWhiteGutRisk: 'వైట్ గట్ ప్రమాదం — పేగు రేఖ తనిఖీ',
  diseaseWhiteGutAction: 'పేగు రేఖ పరిశీలించండి. ఆహారం 30% తగ్గించండి. ప్రోబయోటిక్ వేయండి.',
  diseaseEHPRisk: 'EHP ప్రమాదం — వృద్ధి రేటు పర్యవేక్షించండి',
  diseaseEHPAction: 'వారం ఒకసారి రొయ్యల బరువు కొలవండి. పరిమాణ వ్యత్యాసం > 20% అయితే EHP పరీక్ష చేయించండి.',

  // Medicine
  medicineProbioticDue: 'ప్రోబయోటిక్ అనువర్తనం సమయం',
  medicineProbioticDetail: 'బాసిల్లస్ ఆధారిత ప్రోబయోటిక్ (500g/ఎకరా) వారానికి ఒకసారి వేయండి.',
  medicineImmunoboosterDue: 'రోగనిరోధక పెంపు అనువర్తనం సమయం',
  medicineImmunoboosterDetail: 'ఆహారంలో విటమిన్ C + బీటా-గ్లూకాన్ (2g/కిలో ఆహారం) 5 రోజులు కలపండి.',
  medicineMineralDue: 'ఖనిజ అనుబంధం సమయం',
  medicineMineralDetail: 'Ca/Mg/K ఖనిజ మిశ్రమం (1 కిలో/ఎకరా) వేసి పెళ్ళుకు మద్దతు ఇవ్వండి.',
  medicineZeoliteDue: 'జియోలైట్ అనువర్తనం సమయం',
  medicineZeoliteDetail: 'తెల్లవారు జియోలైట్ (10 కిలో/ఎకరా) వేసి అమ్మోనియా తగ్గించండి.',
  medicineLimeDue: 'సున్నం అనువర్తనం సమయం',
  medicineLimeDetail: 'pH మరియు క్షారత స్థిరీకరించడానికి నేడు రాత్రి సున్నం (50 కిలో/ఎకరా) వేయండి.',
  medicineWithdrawalWarning: '⚠ ఉపసంహరణ కాలం చురుకుగా ఉంది',
  medicineWithdrawalDetail: 'గత 14 రోజులలో మందు వేయబడింది. ఉపసంహరణ కాలం పూర్తయ్యే వరకు కోత వద్దు.',

  // Harvest
  harvestReadyAlert: '🎉 చెరువు కోతకు సిద్ధంగా ఉంది',
  harvestReadyDetail: 'రొయ్యలు 90+ DOC చేరాయి. సగటు బరువు 20g+ అంచనా. సరైన కోత సమయం ఇప్పుడు.',
  harvestWithdrawalPeriod: 'ఉపసంహరణ కాలం — ఇంకా కోత చేయలేరు',
  harvestBestWindow: 'అత్యుత్తమ కోత సమయం: DOC 90–120',

  // Compliance
  noWaterLogToday: 'నేడు నీటి నాణ్యత నమోదు చేయలేదు',
  noFeedLogToday: 'నేడు ఆహారం నమోదు చేయలేదు',
  logNowAction: 'ట్రస్ట్ స్కోర్ నిర్వహించడానికి ఇప్పుడే నమోదు చేయండి',
  streakRiskWarning: '⚠ నమోదు స్ట్రీక్ ప్రమాదంలో ఉంది — నేడు నమోదు చేయండి',

  // Aerator
  aeratorNightOn: 'రాత్రంతా అన్ని ఆక్సిజనేటర్లు నడపండి',
  aeratorNightOnDetail: 'అమావాస్య / అధిక DO ప్రమాదం. ఉదయం 6 వరకు అన్ని ఆక్సిజనేటర్లు నడపండి.',
  aeratorCheckDue: 'ఆక్సిజనేటర్ తనిఖీ సమయం',
  aeratorUpgradeNeeded: 'ఆక్సిజనేటర్ అప్‌గ్రేడ్ సిఫారసు చేయబడింది',

  // Stage
  stageJuvenile: 'కిశోర దశ (DOC 1–30)',
  stageGrowing: 'వృద్ధి దశ (DOC 31–60)',
  stagePreharvest: 'కోత ముందు దశ (DOC 61–90)',
  milestoneDoc30: '🎯 30-రోజుల మైలురాయి — FCR & వృద్ధి తనిఖీ',
  milestoneDoc60: '🎯 60-రోజుల మైలురాయి — కోత వ్యూహం సిద్ధం చేయండి',
  milestoneDoc90: '🏆 90-రోజుల మైలురాయి — కోత సమయం తెరుచుకుంది',
};

// ─── Exports ───────────────────────────────────────────────────────────────────

export const sopTranslations: Record<Language, SOPTranslations> = {
  English,
  Telugu,
  Bengali: English,
  Odia: English,
  Gujarati: English,
  Tamil: English,
  Malayalam: English,
};

/**
 * Helper: get SOP translations for a given language
 */
export const getSOPTranslations = (language: Language = 'English'): SOPTranslations =>
  sopTranslations[language] ?? English;
