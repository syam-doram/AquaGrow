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
}

/**
 * High-Fidelity Farmer SOP Engine
 * Based on exact expert DOC-wise schedule and brand-specific guidance.
 */
export const getSOPGuidance = (doc: number, date: Date = new Date()): SOPSuggestion[] => {
  const suggestions: SOPSuggestion[] = [];
  const lunar = getLunarStatus(date);
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon...
  const isEarlyStage = doc > 0 && doc <= 20;

  // ─── 0. LUNAR & MOLTING SOPs (Contextual) ───────────────────────────────
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

  // ─── 1. WEEKLY MILESTONE MODEL (Adaptive) ──────────────────────────────
  const preStockingWeeklyModel: Record<number, SOPSuggestion[]> = {
    1: [{ type: 'MEDICINE', category: 'WATER', applicationType: 'WATER', title: 'Monday → Chlorine Pulse', description: 'Importance Day: Periodic sterilization during water preparation.', priority: 'HIGH' }],
    2: [{ type: 'MEDICINE', category: 'WATER', applicationType: 'WATER', title: 'Tuesday → Soil Neutralizer', description: 'Importance Day: Maintaining soil pH stability.', priority: 'MEDIUM' }],
    3: [{ type: 'MEDICINE', category: 'WATER', applicationType: 'WATER', title: 'Wednesday → Water Probiotic', description: 'Importance Day: Developing stable microbial flora.', priority: 'HIGH' }],
    4: [{ type: 'MEDICINE', category: 'WATER', applicationType: 'WATER', title: 'Thursday → Mineral Prep', description: 'Importance Day: Building ionic balance (Ca, Mg, K).', priority: 'HIGH' }],
    5: [{ type: 'MEDICINE', category: 'WATER', applicationType: 'WATER', title: 'Friday → Water Probiotic', description: 'Importance Day: Bio-floc support pulse.', priority: 'HIGH' }],
    6: [{ type: 'MEDICINE', category: 'WATER', applicationType: 'WATER', title: 'Saturday → Algae Booster', description: 'Importance Day: Organic molasses pulse for water color.', priority: 'MEDIUM' }],
    0: [{ type: 'TIP', category: 'WATER', title: 'Sunday → Quality Audit', description: 'Importance Day: Full water chemistry check (Before Stocking).', priority: 'MEDIUM' }],
  };

  const activeWeeklyModel: Record<number, SOPSuggestion[]> = {
    1: [{ type: 'MEDICINE', category: 'MOLTING', applicationType: 'WATER', title: 'Monday → Mineral Mix', description: 'Importance Day: Full mineralization pulse for lunar preparation.', priority: 'HIGH' }],
    2: [{ type: 'MEDICINE', category: 'WATER', applicationType: 'WATER', title: 'Tuesday → Water Probiotic', description: 'Importance Day: Establishing water microbial balance.', priority: 'HIGH' }],
    3: [{ type: 'MEDICINE', category: 'MEDICINE', applicationType: 'FEED', title: 'Wednesday → Gut Probiotic', description: 'Importance Day: Intensive gut-health feed coating.', priority: 'HIGH' }],
    4: [{ type: 'MEDICINE', category: 'WATER', applicationType: 'WATER', title: 'Thursday → Water Probiotic', description: 'Importance Day: Secondary water conditioning.', priority: 'HIGH' }],
    5: [{ type: 'MEDICINE', category: 'MOLTING', applicationType: 'WATER', title: 'Friday → Mineral Mix', description: 'Importance Day: Final mineralization for molting cycle.', priority: 'HIGH' }],
    6: [{ type: 'MEDICINE', category: 'MEDICINE', applicationType: 'FEED', title: 'Saturday → Immunity Booster', description: 'Importance Day: Herbal/Vitamin tonics for crop defense.', priority: 'HIGH' }],
    0: [{ type: 'TIP', category: 'WATER', title: 'Sunday → Water Audit', description: 'Weekly Audit: Full check (pH, Alk, Ca, Mg).', priority: 'MEDIUM' }],
  };
  
  if (doc < 0) {
    if (preStockingWeeklyModel[dayOfWeek]) {
       suggestions.push(...preStockingWeeklyModel[dayOfWeek]);
    }
  } else {
    if (activeWeeklyModel[dayOfWeek]) {
      suggestions.push(...activeWeeklyModel[dayOfWeek].filter(s => {
        // User Request: No Gut Probiotic before DOC 20
        if (s.title.includes('Gut Probiotic') && doc <= 20) return false;
        return true;
      }));
    }
  }

  // ─── 2. PRE-STOCKING (POND PREPARATION) ───────────────────────────────────
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
    // ─── 3. DAILY FEED BASELINE (Always Show if doc > 0) ───
    suggestions.push({
      type: 'FEED', category: 'FEED',
      title: `Daily Feed Cycle - DOC ${doc}`,
      description: `Standard Feeding: Apply 4-5 meals today based on tray observations. Focus on FCR optimization.`,
      priority: 'MEDIUM'
    });

    // ─── 4. DOC-WISE DEPTH SCHEDULE ────────────────────────
  
  // COMMON RULES
  suggestions.push({
    type: 'RULE',
    category: 'WATER',
    title: 'SOP Safety Rule',
    description: 'Do NOT mix Probiotic + Disinfectant on the same day.',
    priority: 'HIGH'
  });

  // DOC 1-10 (NURSERY)
  if (doc >= 1 && doc <= 10) {
    if (doc % 2 === 0) {
      suggestions.push({
        type: 'MEDICINE',
        category: 'MEDICINE',
        applicationType: 'FEED',
        title: 'Gut Probiotic Foundation',
        description: 'Importance Day: Establish nursery digestive health.',
        brand: 'CP Gut Probiotic',
        dose: '5-10 g/kg feed',
        priority: 'HIGH'
      });
    }
    if (doc % 7 === 0) {
      suggestions.push({
        type: 'MEDICINE',
        category: 'WATER',
        applicationType: 'WATER',
        title: 'Water Probiotic (Foundation)',
        description: 'Establishing sustainable microbial baseline.',
        dose: '250 g/acre',
        priority: 'MEDIUM'
      });
    }
  }
  
  // DOC 11-20 (EARLY GROWTH)
  else if (doc >= 11 && doc <= 20) {
    if (doc % 3 === 0) {
      suggestions.push({
        type: 'MEDICINE',
        category: 'MEDICINE',
        applicationType: 'FEED',
        title: 'Gut Probiotic (Pulse)',
        description: 'Importance Day: Periodic gut conditioning for early growth spurt.',
        brand: 'Avanti Gut Health',
        priority: 'HIGH'
      });
    }
    if (doc % 7 === 0) {
      suggestions.push({
        type: 'MEDICINE',
        category: 'WATER',
        applicationType: 'WATER',
        title: 'Water & Soil Probiotic',
        description: 'Maintenance SOP: Prevent bottom sludge bacteria buildup.',
        brand: 'Sanolife PRO-W',
        priority: 'HIGH'
      });
    }
    if (doc === 15) {
      suggestions.push({
        type: 'MEDICINE',
        category: 'MEDICINE',
        applicationType: 'FEED',
        title: 'Vitamin C Booster',
        description: 'Immunity milestone for establishment phase.',
        priority: 'HIGH'
      });
    }
  }

  // DOC 21-30 (RISK STARTING)
  else if (doc >= 21 && doc <= 30) {
    if (doc % 3 === 0) {
      suggestions.push({
        type: 'MEDICINE',
        category: 'MEDICINE',
        applicationType: 'FEED',
        title: 'Gut Probiotic (Risk Management)',
        description: 'Importance Day: Strategic gut health during risk stage transition.',
        priority: 'HIGH'
      });
    }
    if (doc % 10 === 0) {
       suggestions.push({
         type: 'MEDICINE',
         category: 'WATER',
         applicationType: 'WATER',
         title: 'Water Probiotic (Maintenance)',
         description: 'Maintain high bio-security during risk stage transition.',
         priority: 'HIGH'
       });
    }
    if (doc === 25) {
       suggestions.push({
         type: 'MEDICINE',
         category: 'MEDICINE',
         applicationType: 'FEED',
         title: 'Immunity Booster Pulse',
         description: 'Prepare for critical DOC 30 transition.',
         priority: 'HIGH'
       });
       suggestions.push({
         type: 'ALERT',
         category: 'MEDICINE',
         title: 'Vibriosis Check Required',
         description: 'Scan shrimp and check for tail redness.',
         priority: 'HIGH'
       });
    }
  }

  // DOC 31-45 (CRITICAL STAGE)
  else if (doc >= 31 && doc <= 45) {
     suggestions.push({
       type: 'ALERT',
       category: 'MEDICINE',
       title: 'CRITICAL STAGE: WSSV ALERT',
       description: 'Expert Warning: High risk of White Spot Syndrome in this window.',
       priority: 'HIGH'
     });
     if (doc % 2 === 0) {
       suggestions.push({
         type: 'MEDICINE',
         category: 'MEDICINE',
         applicationType: 'FEED',
         title: 'Gut Probiotic (Shield)',
         description: 'Importance Day: Maximum mucosal protection during critical transition.',
         priority: 'HIGH'
       });
     }
     if (doc % 10 === 0) {
        suggestions.push({
          type: 'MEDICINE',
          category: 'WATER',
          applicationType: 'WATER',
          title: 'Water Probiotic (Pathogen Control)',
          description: 'Strategic microbial load management for critical window.',
          priority: 'HIGH'
        });
     }
     if (doc >= 30 && doc <= 35) {
        suggestions.push({
          type: 'MEDICINE',
          category: 'MEDICINE',
          applicationType: 'FEED',
          title: 'Anti-Stress Tonic',
          description: 'Critical stage stress reduction requirement.',
          priority: 'HIGH'
        });
     }
     if (doc === 40) {
        suggestions.push({
          type: 'MEDICINE',
          category: 'MOLTING',
          applicationType: 'WATER',
          title: 'Vitamin + Mineral Booster',
          description: 'Deep metabolic boost for critical period end.',
          priority: 'HIGH'
        });
     }
  }

  // DOC 46-60 (HIGH GROWTH)
  else if (doc >= 46 && doc <= 60) {
    if (doc % 4 === 0) {
      suggestions.push({
        type: 'MEDICINE',
        category: 'MEDICINE',
        applicationType: 'FEED',
        title: 'Gut Probiotics (Absorption)',
        description: 'Importance Day: Feed mix for maximum enzymatic absorption during size spike.',
        priority: 'HIGH'
      });
    }
     if (doc % 2 === 0) {
        suggestions.push({
          type: 'MEDICINE',
          category: 'WATER',
          applicationType: 'WATER',
          title: 'Water Probiotic (Intensive)',
          description: 'High waste removal for high growth stage.',
          priority: 'HIGH'
        });
     }
     if (doc === 50) {
        suggestions.push({
          type: 'MEDICINE',
          category: 'MEDICINE',
          applicationType: 'FEED',
          title: 'Liver Tonic (Hepatopancreas)',
          description: 'Maintenance of vital organ health during size spike.',
          priority: 'HIGH'
        });
     }
  }

  // DOC 61-80 (LATE STAGE)
  else if (doc >= 61 && doc <= 80) {
    if (doc % 5 === 0) {
      suggestions.push({
        type: 'MEDICINE',
        category: 'MEDICINE',
        applicationType: 'FEED',
        title: 'Gut Probiotic (Stability Maintenance)',
        description: 'Importance Day: Final stretch intestinal flora support.',
        priority: 'MEDIUM'
      });
    }
     if (doc % 3 === 0) {
        suggestions.push({
          type: 'MEDICINE',
          category: 'WATER',
          applicationType: 'WATER',
          title: 'Water Probiotic (Regular)',
          description: 'Moderate water conditioning.',
          priority: 'MEDIUM'
        });
     }
     if (doc === 70) {
        suggestions.push({
          type: 'MEDICINE',
          category: 'MEDICINE',
          applicationType: 'FEED',
          title: 'Late Immunity Booster',
          description: 'Prevent late-stage crashes.',
          priority: 'HIGH'
        });
     }
  }

  // DOC 81-100 (FINAL / HARVEST PREP)
  else if (doc >= 81) {
    if (doc % 10 === 0) {
      suggestions.push({
        type: 'MEDICINE',
        category: 'MEDICINE',
        applicationType: 'FEED',
        title: 'Light Probiotic maintenance',
        description: 'Importance Day: Final digestive stability check before harvest.',
        priority: 'LOW'
      });
    }
     if (doc % 7 === 0) {
        suggestions.push({
          type: 'MEDICINE',
          category: 'WATER',
          applicationType: 'WATER',
          title: 'Water Probiotic (Flush)',
          description: 'Weekly cleaning of harvest-stage water.',
          priority: 'LOW'
        });
     }
     if (doc >= 90) {
        suggestions.push({
          type: 'RULE',
          category: 'WATER',
          title: 'HARVEST PREP SOP',
          description: 'Stop heavy medicines. Focus on water clarity and residue withdrawal.',
          priority: 'HIGH'
        });
     }
    }
  }

  return suggestions;
};
