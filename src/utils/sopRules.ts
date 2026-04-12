import { getLunarStatus } from './lunarUtils';

export interface SOPSuggestion {
  type: 'MEDICINE' | 'ALERT' | 'RULE' | 'TIP' | 'LUNAR' | 'FEED';
  category: 'MEDICINE' | 'FEED' | 'WATER' | 'MOLTING';
  applicationType?: 'WATER' | 'FEED';
  title: string;
  description: string;
  brand?: string;
  dose?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  // New: situation-aware context
  situationTag?: 'WATER_QUALITY' | 'FCR_ALERT' | 'STRESS' | 'DISEASE_RISK' | 'HARVEST_PREP' | 'CRITICAL_STAGE';
  isAdaptive?: boolean; // true if rule was created due to pond situation
}

export interface PondSituation {
  ph?: number;
  doLevel?: number;          // Dissolved Oxygen (mg/L)
  temperature?: number;      // °C
  ammonia?: number;          // mg/L
  fcr?: number;              // Feed Conversion Ratio
  isRaining?: boolean;
  mortalityDetected?: boolean;
  fcrHigh?: boolean;         // FCR > 1.6
  doLow?: boolean;           // DO < 4 mg/L
  phOutOfRange?: boolean;    // pH < 7.5 or > 8.5
  tempHigh?: boolean;        // temp > 32°C
  ammoniaHigh?: boolean;     // ammonia > 0.25 mg/L
}

/**
 * High-Fidelity Farmer SOP Engine
 * Based on exact expert DOC-wise schedule, brand-specific guidance.
 * NOW ADAPTIVE: Pond situation (water quality, FCR, weather) modifies SOPs.
 */
export const getSOPGuidance = (
  doc: number,
  date: Date = new Date(),
  situation?: PondSituation
): SOPSuggestion[] => {
  const suggestions: SOPSuggestion[] = [];
  const lunar = getLunarStatus(date);
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon...

  // ─── DERIVE SITUATION FLAGS ───────────────────────────────────────────────
  const ph = situation?.ph;
  const doVal = situation?.doLevel;
  const temp = situation?.temperature;
  const ammonia = situation?.ammonia;
  const fcr = situation?.fcr;

  const isDoLow = doVal != null ? doVal < 4.0 : false;
  const isDoVeryLow = doVal != null ? doVal < 3.0 : false;
  const isPhHigh = ph != null ? ph > 8.5 : false;
  const isPhLow = ph != null ? ph < 7.5 : false;
  const isTempHigh = temp != null ? temp > 32 : false;
  const isTempVeryHigh = temp != null ? temp > 34 : false;
  const isAmmoniaHigh = ammonia != null ? ammonia > 0.25 : false;
  const isAmmoniaVeryHigh = ammonia != null ? ammonia > 0.5 : false;
  const isFCRHigh = fcr != null ? fcr > 1.6 : (situation?.fcrHigh ?? false);
  const isRaining = situation?.isRaining ?? false;
  const mortalityDetected = situation?.mortalityDetected ?? false;

  // ─── SITUATION-AWARE EMERGENCY ALERTS (Always shown first) ───────────────
  if (doc > 0) {
    // CRITICAL: Very Low DO - Immediate Action
    if (isDoVeryLow) {
      suggestions.push({
        type: 'ALERT', category: 'WATER',
        title: '🚨 CRITICAL: DO Dangerously Low',
        description: `DO at ${doVal} mg/L — EMERGENCY: Run ALL aerators immediately. Stop feeding. Apply emergency oxygen granules if available.`,
        priority: 'HIGH',
        situationTag: 'WATER_QUALITY',
        isAdaptive: true
      });
    } else if (isDoLow) {
      suggestions.push({
        type: 'ALERT', category: 'WATER',
        title: '⚠️ Low DO Alert',
        description: `DO at ${doVal} mg/L (target: ≥4). Increase aeration. Reduce feed by 30% for next 2 slots. Check pond for surface activity.`,
        priority: 'HIGH',
        situationTag: 'WATER_QUALITY',
        isAdaptive: true
      });
    }

    // HIGH pH (alkalosis risk)
    if (isPhHigh) {
      suggestions.push({
        type: 'ALERT', category: 'WATER',
        title: '⚠️ High pH Alert',
        description: `pH at ${ph} (target: 7.5–8.5). Risk of alkalosis. Apply Zeolite or organic acids. Avoid ammonia-raising products. Check for algal bloom.`,
        priority: 'HIGH',
        situationTag: 'WATER_QUALITY',
        isAdaptive: true
      });
      suggestions.push({
        type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
        title: 'pH Correction — Zeolite/Organic Acid',
        description: 'Apply zeolite or buffered organic acid to lower and stabilize pH. Reduce heavy feeding until corrected.',
        dose: '20-30 kg/acre',
        priority: 'HIGH',
        situationTag: 'WATER_QUALITY',
        isAdaptive: true
      });
    }

    // LOW pH (acidosis risk)
    if (isPhLow) {
      suggestions.push({
        type: 'ALERT', category: 'WATER',
        title: '⚠️ Low pH Alert',
        description: `pH at ${ph} (target: 7.5–8.5). Risk of acidosis and gill damage. Apply Dolomite/Lime. Reduce probiotic application until stabilized.`,
        priority: 'HIGH',
        situationTag: 'WATER_QUALITY',
        isAdaptive: true
      });
      suggestions.push({
        type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
        title: 'pH Stabilizer — Dolomite Lime',
        description: 'Apply dolomite or agricultural lime to raise pH. Monitor every 4 hours after application.',
        dose: '15-25 kg/acre',
        priority: 'HIGH',
        situationTag: 'WATER_QUALITY',
        isAdaptive: true
      });
    }

    // HIGH Temperature
    if (isTempVeryHigh) {
      suggestions.push({
        type: 'ALERT', category: 'WATER',
        title: '🌡️ CRITICAL Heat Stress',
        description: `Temp at ${temp}°C — Extreme heat stress. Reduce feed by 30%. Stop mid-day feeding (12pm–2pm). Maximize night aeration. Check DO every 2 hrs.`,
        priority: 'HIGH',
        situationTag: 'STRESS',
        isAdaptive: true
      });
    } else if (isTempHigh) {
      suggestions.push({
        type: 'ALERT', category: 'WATER',
        title: '🌡️ High Temperature Alert',
        description: `Temp at ${temp}°C (optimal: 27–32°C). Reduce afternoon meal by 20%. Increase aeration especially at noon. Apply Vitamin C booster.`,
        priority: 'MEDIUM',
        situationTag: 'STRESS',
        isAdaptive: true
      });
      suggestions.push({
        type: 'MEDICINE', category: 'MEDICINE', applicationType: 'FEED',
        title: 'Vitamin C Anti-Stress (Heat)',
        description: 'Apply high-dose Vitamin C during heat stress to prevent immunosuppression and oxidative damage.',
        dose: '5g/kg feed',
        priority: 'HIGH',
        situationTag: 'STRESS',
        isAdaptive: true
      });
    }

    // HIGH Ammonia
    if (isAmmoniaVeryHigh) {
      suggestions.push({
        type: 'ALERT', category: 'WATER',
        title: '☠️ CRITICAL: Ammonia Toxicity',
        description: `Ammonia at ${ammonia} mg/L (critical >0.5). EMERGENCY: Stop all feeding. Apply Zeolite immediately. Emergency water exchange if possible.`,
        priority: 'HIGH',
        situationTag: 'WATER_QUALITY',
        isAdaptive: true
      });
      suggestions.push({
        type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
        title: 'Emergency Zeolite Application',
        description: 'Critical ammonia detoxification. Broadcast zeolite across entire pond immediately. Do NOT apply probiotics for 24hrs.',
        dose: '40-50 kg/acre',
        priority: 'HIGH',
        situationTag: 'WATER_QUALITY',
        isAdaptive: true
      });
    } else if (isAmmoniaHigh) {
      suggestions.push({
        type: 'ALERT', category: 'WATER',
        title: '⚠️ Ammonia Rising',
        description: `Ammonia at ${ammonia} mg/L (safe: <0.25). Apply zeolite, increase aeration. Reduce feed quantum by 25% for next 24hrs.`,
        priority: 'HIGH',
        situationTag: 'WATER_QUALITY',
        isAdaptive: true
      });
    }

    // RAIN Event
    if (isRaining) {
      suggestions.push({
        type: 'ALERT', category: 'WATER',
        title: '🌧️ Rain Event — DO Risk',
        description: 'Rain reduces DO and lowers pH. Reduce feed by 15% during rainfall. Increase aeration. Monitor pond activity.',
        priority: 'HIGH',
        situationTag: 'STRESS',
        isAdaptive: true
      });
    }

    // HIGH FCR — Overfeeding or Poor Survival
    if (isFCRHigh) {
      suggestions.push({
        type: 'ALERT', category: 'FEED',
        title: '📊 High FCR Detected',
        description: `FCR ${fcr != null ? fcr.toFixed(2) : '>1.6'} (target: ≤1.4). Review tray checks — likely overfeeding or poor survival. Reduce daily feed by 15% and check mortality.`,
        priority: 'HIGH',
        situationTag: 'FCR_ALERT',
        isAdaptive: true
      });
    }

    // MORTALITY
    if (mortalityDetected) {
      suggestions.push({
        type: 'ALERT', category: 'MEDICINE',
        title: '💀 Mortality Detected',
        description: 'Remove dead shrimp immediately. Increase aeration. Apply Disinfectant (after removing shrimp). Do NOT apply probiotics same day as disinfectant. Check water quality urgently.',
        priority: 'HIGH',
        situationTag: 'DISEASE_RISK',
        isAdaptive: true
      });
    }
  }

  // ─── 0. LUNAR & MOLTING SOPs ─────────────────────────────────────────────
  if (lunar.phase === 'AMAVASYA') {
    suggestions.push({
      type: 'LUNAR', category: 'MOLTING',
      title: 'Amavasya - Liquid Lunar Risk',
      description: doc > 0 ? 'SOP: High molting risk tonight. Reduce feed and maintain max DO.' : 'SOP: Upcoming high-activity lunar cycle. Ensure aeration systems are ready.',
      priority: 'HIGH'
    });
    if (doc > 0) {
      suggestions.push({
        type: 'FEED', category: 'FEED',
        title: 'Feed Reduction (Amavasya)',
        description: 'Lunar SOP: Active molting detected. Reduce total daily feed by 25%.',
        priority: 'HIGH'
      });
      suggestions.push({
        type: 'RULE', category: 'MOLTING',
        title: 'Molting Management',
        description: 'Check check-trays for soft shells. Max molting peak now.',
        priority: 'HIGH'
      });
      suggestions.push({
        type: 'MEDICINE', category: 'MOLTING', applicationType: 'WATER',
        title: 'Mineral Mix (Hardening)',
        description: 'Lunar SOP: Vital for rapid shell hardening.',
        dose: '15-20 kg / acre',
        priority: 'HIGH'
      });
    }
  } else if (lunar.phase === 'POURNAMI') {
    suggestions.push({
      type: 'LUNAR', category: 'MOLTING',
      title: 'Pournami - Aeration Alert',
      description: 'SOP: 100% Aeration. High bio-demand tonight.',
      priority: 'HIGH'
    });
  } else if (lunar.phase === 'ASHTAMI' || lunar.phase === 'NAVAMI') {
    if (doc > 0) {
      suggestions.push({
        type: 'FEED', category: 'FEED',
        title: `Feed Reduction (${lunar.phase})`,
        description: `SOP: Molting stress cycle. Reduce feed by ${lunar.phase === 'NAVAMI' ? '15%' : '10%'}.`,
        priority: 'HIGH'
      });
      suggestions.push({
        type: 'MEDICINE', category: 'MOLTING', applicationType: 'WATER',
        title: 'Mineral Pulse',
        description: 'Pre-molting mineralization for shell stability.',
        dose: '10 kg / acre',
        priority: 'MEDIUM'
      });
    }
  }

  // ─── 1. WEEKLY MILESTONE MODEL ─────────────────────────────────────────────
  const preStockingWeeklyModel: Record<number, SOPSuggestion[]> = {
    1: [{ // Monday
      type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
      title: 'Monday → Chlorine Pulse',
      description: 'Weekly sterilization to kill residual bacteria and pathogens in pond water. Dissolve TCC (Trichloro Cyanuric Acid) or Calcium Hypochlorite in a bucket of water, then broadcast evenly across the pond surface early morning. Run aerators for 4 hours after application. Do NOT apply probiotics for 48 hours after chlorination. Test for chlorine residue before next step.',
      dose: '10–30 ppm (2–5 kg/acre TCC)',
      priority: 'HIGH'
    }],
    2: [{ // Tuesday
      type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
      title: 'Tuesday → Soil Neutralizer',
      description: 'Apply Dolomite (Ca-Mg Carbonate) or Agricultural Lime to stabilize soil and water pH during pond preparation. Broadcast dry powder evenly across pond bottom or dissolve in water and spray. Optimal soil pH target: 7.0–8.0. This prevents toxic H2S gas buildup from acidic bottom sediment. Check soil pH with a meter at 3 spots across the pond after 24 hours.',
      dose: '100–200 kg/acre (Dolomite)',
      priority: 'MEDIUM'
    }],
    3: [{ // Wednesday
      type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
      title: 'Wednesday → Water Probiotic',
      description: 'Develop a stable beneficial microbial community in pre-stocking water. Mix probiotic powder (Bacillus species) with jaggery water (1 kg jaggery in 20L water), activate for 4 hours, then broadcast across pond by boat or splashing. Apply in the morning so bacteria can establish during daylight. This builds competitive exclusion against Vibrio and pathogenic bacteria before shrimp arrive.',
      dose: '250–500 g/acre',
      priority: 'HIGH'
    }],
    4: [{ // Thursday
      type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
      title: 'Thursday → Mineral Prep',
      description: 'Build correct ionic balance (Ca, Mg, K) in water before seed stocking. Dissolve mineral mix in pond water and spread evenly. Target: Calcium >100 ppm, Magnesium >25 ppm, K+ >20 ppm. Correct mineral balance ensures proper shell hardening of seed on day 0 and prevents early molting death. Test water hardness with a kit after application.',
      dose: '10–20 kg/acre (Mineral Mix)',
      priority: 'HIGH'
    }],
    5: [{ // Friday
      type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
      title: 'Friday → Water Probiotic',
      description: 'Second probiotic pulse for bio-floc and green water support. Mix probiotic with molasses (500 ml/acre) and rice bran (1 kg/acre) in 20L water, activate 6 hours, broadcast in evening. This boosts plankton bloom density, which is critical for seed survival nutrition on stocking day. Check water color — target: olive green or brown-green (Secchi depth 25–40 cm).',
      dose: '250 g/acre (Bacillus probiotic)',
      priority: 'HIGH'
    }],
    6: [{ // Saturday
      type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
      title: 'Saturday → Algae Booster',
      description: 'Feed the developing green water bloom with organic nutrients. Mix molasses + rice bran + organic manure in water, ferment for 2 hours, broadcast across pond in morning. This develops stable zooplankton (Chaetoceros, Skeletonema) which acts as natural first food for PL seed on stocking day. Measure Secchi disk depth — target 35–45 cm. Avoid overfeeding (depth <25 cm = too dense).',
      dose: 'Molasses 1 L/acre + Rice Bran 2 kg/acre',
      priority: 'MEDIUM'
    }],
    0: [{ // Sunday
      type: 'TIP', category: 'WATER',
      title: 'Sunday → Quality Audit',
      description: 'Full pre-stocking water quality check. Test and record: pH (target 7.8–8.2), Alkalinity (target 100–150 ppm), Salinity (target 15–25 ppt for vannamei), DO (target >5 mg/L at dawn), Ammonia (<0.1 ppm), Temperature (target 28–32°C), Turbidity (Secchi 30–45 cm). Fix any out-of-range values before stocking. If all parameters are within range, pond is READY for seed. Document results in your farm log.',
      priority: 'MEDIUM'
    }],
  };

  const activeWeeklyModel: Record<number, SOPSuggestion[]> = {
    1: [{ // Monday
      type: 'MEDICINE', category: 'MOLTING', applicationType: 'WATER',
      title: 'Monday → Mineral Mix',
      description: 'Weekly mineralization pulse critical for shell hardening and molt recovery. Dissolve mineral mix (Ca, Mg, K) in a bucket of water, broadcast evenly in early morning across the entire pond. Shrimp require high calcium during weekly molting cycles — insufficient minerals cause soft-shell mortality. After applying, check tray for soft-shell shrimp by evening. Avoid mixing with probiotics on the same day.',
      dose: '15–20 kg/acre (Mineral Mix)',
      priority: 'HIGH'
    }],
    2: [{ // Tuesday
      type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
      title: 'Tuesday → Water Probiotic',
      description: 'Establish and maintain beneficial microbial balance in pond water. Activate probiotics (Bacillus, Lactobacillus) with jaggery water (1 kg/20L) for 4–6 hours before broadcasting. Apply in the morning for maximum daylight activation. This suppresses pathogenic Vibrio growth, reduces bottom sludge, and maintains stable water color (green/brown). Do NOT apply within 24 hours of any disinfectant or antibiotic.',
      dose: '250–500 g/acre',
      priority: 'HIGH'
    }],
    3: [{ // Wednesday
      type: 'MEDICINE', category: 'MEDICINE', applicationType: 'FEED',
      title: 'Wednesday → Gut Probiotic',
      description: 'Intensive mid-week gut health treatment via feed coating. Mix probiotic with a small quantity of vegetable oil or fish oil first (as a carrier), then coat onto feed pellets 20 minutes before each feeding slot. Apply across all 4–5 daily meals. This colonizes the shrimp intestine with beneficial bacteria, improves FCR, increases nutrient absorption, and prevents hepatopancreas infections (EMS). Check tray for leftover feed — if residue is high, shrimp gut health may be compromised.',
      dose: '5–10 g/kg feed',
      priority: 'HIGH'
    }],
    4: [{ // Thursday
      type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
      title: 'Thursday → Water Probiotic',
      description: 'Secondary water probiotic pulse for continuous microbial load management. Activate probiotic in jaggery water (500g jaggery per batch) for 4 hours. Apply in the evening, 2 hours after last feeding slot. Thursday application bridges the week — critical for ponds with moderate feeding rates where waste accumulation increases from Wednesday onward. Observe water color the next morning — fading green indicates need for algae booster.',
      dose: '250 g/acre',
      priority: 'HIGH'
    }],
    5: [{ // Friday
      type: 'MEDICINE', category: 'MOLTING', applicationType: 'WATER',
      title: 'Friday → Mineral Mix',
      description: 'Pre-weekend mineralization to prepare shrimp for weekend molting peak (often linked to lunar cycle + reduced farm activity). Dissolve mineral mix in water and broadcast from boat in the morning. Ensure Ca:Mg ratio is 3:1. Friday application ensures minerals are bioavailable in the water column through the weekend when farm monitoring may be reduced. Check aerator function after applying — minerals can briefly reduce DO for 2–3 hours.',
      dose: '15–20 kg/acre',
      priority: 'HIGH'
    }],
    6: [{ // Saturday
      type: 'MEDICINE', category: 'MEDICINE', applicationType: 'FEED',
      title: 'Saturday → Immunity Booster',
      description: 'Weekly immune priming to prevent viral and bacterial outbreaks. Mix herbal/vitamin supplement (Vitamin C + Vitamin E + Beta-glucan or turmeric extract) with feed oil as carrier, coat onto feed 15–20 minutes before feeding. Apply across all feeding slots. Beta-glucan activates the shrimp innate immune system within 4–6 hours. Vitamin C is water-soluble — feed immediately after coating. Do NOT store vitamin-coated feed for more than 30 minutes. Observe shrimp antennae and body surface for redness or white patches after afternoon feed.',
      dose: 'Vit C: 3g/kg feed + Vit E: 1g/kg + Beta-glucan: 2g/kg',
      priority: 'HIGH'
    }],
    0: [{ // Sunday
      type: 'TIP', category: 'WATER',
      title: 'Sunday → Water Audit',
      description: 'Complete weekly water quality audit. Test and record ALL parameters: (1) pH — target 7.5–8.5, if low apply Dolomite, if high apply Zeolite. (2) Alkalinity — target 80–150 ppm, correct with sodium bicarbonate if below 80. (3) Calcium — target >80 ppm, apply mineral mix if low. (4) Magnesium — target >25 ppm. (5) DO at dawn — must be >4 mg/L, increase aerators if borderline. (6) Ammonia — must be <0.25 ppm, apply Zeolite + reduce feed if rising. (7) Secchi depth — target 25–40 cm. Record all values in your farm log and compare to last week. Rising trends must be acted on immediately, not waited upon.',
      priority: 'MEDIUM'
    }],
  };

  
  if (doc < 0) {
    if (preStockingWeeklyModel[dayOfWeek]) {
       suggestions.push(...preStockingWeeklyModel[dayOfWeek]);
    }
  } else {
    if (activeWeeklyModel[dayOfWeek]) {
      suggestions.push(...activeWeeklyModel[dayOfWeek].filter(s => {
        if (s.title.includes('Gut Probiotic') && doc <= 20) return false;
        return true;
      }));
    }
  }

  // ─── 2. PRE-STOCKING ────────────────────────────────────────────────────────
  if (doc < 0) {
    suggestions.push({
      type: 'RULE', category: 'WATER',
      title: 'Pond Drying & Tilling',
      description: 'SOP: Sun-dry pond bottom for 7-10 days until soil cracks. Expose pathogens.',
      priority: 'HIGH'
    });
    suggestions.push({
      type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
      title: 'Soil Liming (Dolomite)',
      description: 'Adjust soil pH. Apply based on last crop history.',
      dose: '200-500 kg / acre',
      priority: 'MEDIUM'
    });
    suggestions.push({
      type: 'ALERT', category: 'WATER',
      title: 'Water Filling & Sterilization',
      description: 'Fill through 60-mesh filters. Apply TCC (Chlorine) at 30ppm.',
      priority: 'HIGH'
    });
    suggestions.push({
      type: 'RULE', category: 'WATER',
      title: 'Water Aging & De-Chlorination',
      description: 'Allow water to age for 7 days. Ensure zero chlorine residue before bloom development.',
      priority: 'HIGH'
    });
    suggestions.push({
      type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
      title: 'Water Color Bloom (Organic)',
      description: 'Apply Molasses + Rice Bran + Probiotics to develop stable green water.',
      priority: 'HIGH'
    });
  } else {
    // ─── HARVEST / WITHDRAWAL GUARD (DOC >= 90) ──────────────────────────────
    if (doc >= 90) {
      suggestions.push({
        type: 'RULE', category: 'WATER',
        title: '🚫 WITHDRAWAL PERIOD — STOP Heavy Medicines',
        description: doc >= 100
          ? 'FULL STOP: All heavy medicines must be withdrawn. Focus on water clarity and residue clearance for safe harvest. Test for antibiotic residues before sale.'
          : `Withdrawal period active. ${100 - doc} days to harvest target. Maintain water clarity only — NO probiotics, NO gut medicines, NO heavy supplements.`,
        priority: 'HIGH',
        situationTag: 'HARVEST_PREP',
      });
      suggestions.push({
        type: 'TIP', category: 'WATER',
        title: '💡 Harvest Preparation Tips',
        description: 'Maintain strong aeration. Check water colour. Reduce feed to 80% of normal. Begin logistics planning (transport, buyer contact, icing).',
        priority: 'MEDIUM',
      });
      return suggestions; // ← Exit early: no routine SOP items during withdrawal
    }

    // ─── 3. DAILY FEED BASELINE ───────────────────────────────────────────────
    // Adjust feed advice based on situation
    let feedDescription = `Standard Feeding: Apply 4-5 meals today based on tray observations. Focus on FCR optimization.`;
    if (isFCRHigh) {
      feedDescription = `⚠️ HIGH FCR Mode: Reduce daily feed by 15%. Check tray residue after each meal. Target FCR ≤1.4 before increasing.`;
    } else if (isDoLow || isRaining) {
      feedDescription = `⚠️ DO/Rain Mode: Apply only 3 meals today (skip afternoon meal). Check DO before each slot.`;
    } else if (isTempVeryHigh) {
      feedDescription = `⚠️ Heat Mode: Skip 12pm-2pm feeding slot. Apply morning & evening only. Reduce total by 25%.`;
    }

    suggestions.push({
      type: 'FEED', category: 'FEED',
      title: `Daily Feed Cycle - DOC ${doc}`,
      description: feedDescription,
      priority: isFCRHigh || isDoLow ? 'HIGH' : 'MEDIUM',
      isAdaptive: isFCRHigh || isDoLow || isTempVeryHigh
    });

    // ─── COMMON SAFETY RULE ──────────────────────────────────────────────────
    suggestions.push({
      type: 'RULE',
      category: 'WATER',
      title: 'SOP Safety Rule',
      description: 'Do NOT mix Probiotic + Disinfectant on the same day.',
      priority: 'HIGH'
    });

    // ─── DOC 1-10 ────────────────────────────────────────────────────────────
    if (doc >= 1 && doc <= 10) {
      if (doc % 2 === 0) {
        suggestions.push({
          type: 'MEDICINE', category: 'MEDICINE', applicationType: 'FEED',
          title: 'Gut Probiotic Foundation',
          description: 'Importance Day: Establish nursery digestive health.',
          brand: 'CP Gut Probiotic',
          dose: '5-10 g/kg feed',
          priority: 'HIGH'
        });
      }
      if (doc % 7 === 0) {
        suggestions.push({
          type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
          title: 'Water Probiotic (Foundation)',
          description: 'Establishing sustainable microbial baseline.',
          dose: '250 g/acre',
          priority: 'MEDIUM'
        });
      }
    }
    
    // ─── DOC 11-20 ───────────────────────────────────────────────────────────
    else if (doc >= 11 && doc <= 20) {
      if (doc % 3 === 0) {
        suggestions.push({
          type: 'MEDICINE', category: 'MEDICINE', applicationType: 'FEED',
          title: 'Gut Probiotic (Pulse)',
          description: 'Importance Day: Periodic gut conditioning for early growth spurt.',
          brand: 'Avanti Gut Health',
          priority: 'HIGH'
        });
      }
      if (doc % 7 === 0) {
        suggestions.push({
          type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
          title: 'Water & Soil Probiotic',
          description: 'Maintenance SOP: Prevent bottom sludge bacteria buildup.',
          brand: 'Sanolife PRO-W',
          priority: 'HIGH'
        });
      }
      if (doc === 15) {
        suggestions.push({
          type: 'MEDICINE', category: 'MEDICINE', applicationType: 'FEED',
          title: 'Vitamin C Booster',
          description: 'Immunity milestone for establishment phase.',
          priority: 'HIGH'
        });
      }
    }

    // ─── DOC 21-30 ───────────────────────────────────────────────────────────
    else if (doc >= 21 && doc <= 30) {
      if (doc % 3 === 0) {
        suggestions.push({
          type: 'MEDICINE', category: 'MEDICINE', applicationType: 'FEED',
          title: 'Gut Probiotic (Risk Management)',
          description: 'Importance Day: Strategic gut health during risk stage transition.',
          priority: 'HIGH'
        });
      }
      if (doc % 10 === 0) {
         suggestions.push({
           type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
           title: 'Water Probiotic (Maintenance)',
           description: 'Maintain high bio-security during risk stage transition.',
           priority: 'HIGH'
         });
      }
      if (doc === 25) {
         suggestions.push({
           type: 'MEDICINE', category: 'MEDICINE', applicationType: 'FEED',
           title: 'Immunity Booster Pulse',
           description: 'Prepare for critical DOC 30 transition.',
           priority: 'HIGH'
         });
         suggestions.push({
           type: 'ALERT', category: 'MEDICINE',
           title: 'Vibriosis Check Required',
           description: 'Scan shrimp and check for tail redness.',
           priority: 'HIGH'
         });
      }
    }

    // ─── DOC 31-45 (CRITICAL STAGE) ─────────────────────────────────────────
    else if (doc >= 31 && doc <= 45) {
       // Enhanced WSSV alert with situation context
       const wssvDescription = isDoLow || isPhOutOfRange(ph)
         ? `CRITICAL: Water quality out of range increases WSSV susceptibility by 3x. Fix water quality immediately AND maintain max aeration.`
         : `Expert Warning: High risk of White Spot Syndrome in this window. Run max aeration 24/7. Check shrimp for white spots or lethargy.`;
       
       suggestions.push({
         type: 'ALERT', category: 'MEDICINE',
         title: 'CRITICAL STAGE: WSSV ALERT',
         description: wssvDescription,
         priority: 'HIGH',
         situationTag: 'CRITICAL_STAGE',
         isAdaptive: !!(isDoLow || isPhOutOfRange(ph))
       });
       if (doc % 2 === 0) {
         suggestions.push({
           type: 'MEDICINE', category: 'MEDICINE', applicationType: 'FEED',
           title: 'Gut Probiotic (Shield)',
           description: 'Importance Day: Maximum mucosal protection during critical transition.',
           priority: 'HIGH'
         });
       }
       if (doc % 10 === 0) {
          suggestions.push({
            type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
            title: 'Water Probiotic (Pathogen Control)',
            description: 'Strategic microbial load management for critical window.',
            priority: 'HIGH'
          });
       }
       if (doc >= 30 && doc <= 35) {
          suggestions.push({
            type: 'MEDICINE', category: 'MEDICINE', applicationType: 'FEED',
            title: 'Anti-Stress Tonic',
            description: 'Critical stage stress reduction requirement.',
            priority: 'HIGH'
          });
       }
       if (doc === 40) {
          suggestions.push({
            type: 'MEDICINE', category: 'MOLTING', applicationType: 'WATER',
            title: 'Vitamin + Mineral Booster',
            description: 'Deep metabolic boost for critical period end.',
            priority: 'HIGH'
          });
       }
    }

    // ─── DOC 46-60 (HIGH GROWTH) ─────────────────────────────────────────────
    else if (doc >= 46 && doc <= 60) {
      if (doc % 4 === 0) {
        suggestions.push({
          type: 'MEDICINE', category: 'MEDICINE', applicationType: 'FEED',
          title: 'Gut Probiotics (Absorption)',
          description: 'Importance Day: Feed mix for maximum enzymatic absorption during size spike.',
          priority: 'HIGH'
        });
      }
       if (doc % 2 === 0) {
          suggestions.push({
            type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
            title: 'Water Probiotic (Intensive)',
            description: 'High waste removal for high growth stage.',
            priority: 'HIGH'
          });
       }
       if (doc === 50) {
          suggestions.push({
            type: 'MEDICINE', category: 'MEDICINE', applicationType: 'FEED',
            title: 'Liver Tonic (Hepatopancreas)',
            description: 'Maintenance of vital organ health during size spike.',
            priority: 'HIGH'
          });
       }
    }

    // ─── DOC 61-80 (LATE STAGE) ──────────────────────────────────────────────
    else if (doc >= 61 && doc <= 80) {
      if (doc % 5 === 0) {
        suggestions.push({
          type: 'MEDICINE', category: 'MEDICINE', applicationType: 'FEED',
          title: 'Gut Probiotic (Stability Maintenance)',
          description: 'Importance Day: Final stretch intestinal flora support.',
          priority: 'MEDIUM'
        });
      }
       if (doc % 3 === 0) {
          suggestions.push({
            type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
            title: 'Water Probiotic (Regular)',
            description: 'Moderate water conditioning.',
            priority: 'MEDIUM'
          });
       }
       if (doc === 70) {
          suggestions.push({
            type: 'MEDICINE', category: 'MEDICINE', applicationType: 'FEED',
            title: 'Late Immunity Booster',
            description: 'Prevent late-stage crashes.',
            priority: 'HIGH'
          });
       }
    }

    // ─── DOC 81-100 (HARVEST PREP) ───────────────────────────────────────────
    else if (doc >= 81) {
      if (doc % 10 === 0) {
        suggestions.push({
          type: 'MEDICINE', category: 'MEDICINE', applicationType: 'FEED',
          title: 'Light Probiotic maintenance',
          description: 'Importance Day: Final digestive stability check before harvest.',
          priority: 'LOW'
        });
      }
       if (doc % 7 === 0) {
          suggestions.push({
            type: 'MEDICINE', category: 'WATER', applicationType: 'WATER',
            title: 'Water Probiotic (Flush)',
            description: 'Weekly cleaning of harvest-stage water.',
            priority: 'LOW'
          });
       }
       if (doc >= 90) {
          const harvestMsg = doc >= 100
            ? '🔴 FULL STOP: All heavy medicines must be withdrawn. Focus on water clarity and residue clearance for safe harvest. Test for antibiotic residues.'
            : `Stop heavy medicines now. Begin withdrawal period. ${100 - doc} days to harvest target — maintain water clarity.`;
          suggestions.push({
            type: 'RULE', category: 'WATER',
            title: 'HARVEST PREP SOP',
            description: harvestMsg,
            priority: 'HIGH',
            situationTag: 'HARVEST_PREP'
          });
       }
    }
  }

  return suggestions;
};

// Helper to check pH out of range
function isPhOutOfRange(ph?: number): boolean {
  if (ph == null) return false;
  return ph < 7.5 || ph > 8.5;
}
