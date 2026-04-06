import { getLunarStatus } from './lunarUtils';

export interface SOPSuggestion {
  type: 'MEDICINE' | 'ALERT' | 'RULE' | 'TIP' | 'LUNAR';
  title: string;
  description: string;
  brand?: string;
  dose?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const getSOPGuidance = (doc: number, date: Date = new Date()): SOPSuggestion[] => {
  const suggestions: SOPSuggestion[] = [];
  const lunar = getLunarStatus(date);
  const dayOfWeek = date.getDay();

  // --- DOC-BASED FILTERS ---
  const isEarlyStage = doc <= 20;

  // 🕒 1. Lunar-Aware Guidance (SOP - High Priority)
  if (lunar.phase === 'AMAVASYA') {
    suggestions.push({
      type: 'LUNAR',
      title: 'Amavasya - Water Stability',
      description: isEarlyStage ? 'Maintain stable water levels. High molting period for early-stage seed.' : 'SOP: Reduce feed 20-30% tonight due to mass molting risk and low DO.',
      priority: 'HIGH'
    });
    if (!isEarlyStage) {
      suggestions.push({
        type: 'MEDICINE',
        title: 'Mineral Mix (High Dose)',
        description: 'Lunar SOP: Vital for shell hardening during Amavasya molting.',
        dose: '15-20 kg / acre',
        priority: 'HIGH'
      });
    }
  } else if (lunar.phase === 'POURNAMI') {
    suggestions.push({
      type: 'LUNAR',
      title: 'Pournami - Aeration Alert',
      description: 'SOP: Increase aeration to 100% capacity. High biological demand during full moon.',
      priority: 'HIGH'
    });
  }
  
  // 🕒 2. EARLY STAGE SPECIALIZATION (DOC 1-20)
  if (isEarlyStage) {
    if (doc % 5 === 0) {
      suggestions.push({
        type: 'TIP',
        title: 'Water Quality Check',
        description: 'Monitor Alkalinity and pH stability. This is the foundation stage.',
        priority: 'HIGH'
      });
    }
    if (doc === 10 || doc === 20) {
      suggestions.push({
        type: 'RULE',
        title: 'Water Probiotic Tip',
        description: 'Establish beneficial microbial balance for a healthy pond bottom.',
        priority: 'MEDIUM'
      });
    }
  } else {
    // 🕒 3. MATURE STAGE MEDICINE SCHEDULE (DOC 21+)
    if (doc >= 21 && doc <= 30) {
      suggestions.push({
        type: 'ALERT',
        title: 'White Gut (WGD) Check',
        description: 'SOP: Inspect feed trays for white fecal strings or opaque shrimp guts.',
        priority: 'HIGH'
      });

      if (doc === 25) {
        suggestions.push({
          type: 'ALERT',
          title: 'Vibriosis Check Required',
          description: 'Risk starting stage! Check for early signs of Vibriosis.',
          priority: 'HIGH'
        });
        suggestions.push({
          type: 'MEDICINE',
          title: 'Immunity Booster',
          description: 'Bolster defenses before critical stage.',
          priority: 'MEDIUM'
        });
      }
    } else if (doc >= 31 && doc <= 45) {
      suggestions.push({
        type: 'ALERT',
        title: 'CRITICAL STAGE ALERT',
        description: 'High risk of White Spot Syndrome (WSSV). Keep aeration at maximum.',
        priority: 'HIGH'
      });
      suggestions.push({
        type: 'ALERT',
        title: 'White Feces (WFD) Alert',
        description: 'SOP: If white strings are seen, reduce feed by 50% immediately.',
        priority: 'HIGH'
      });
    } else if (doc >= 81 && doc <= 100) {
      suggestions.push({
        type: 'RULE',
        title: 'Final Stage Compliance',
        description: 'Stop heavy medicines now. Maintain clean water for harvest quality.',
        priority: 'HIGH'
      });
    }

    // Weekly Model (Only for Mature Stage)
    if (dayOfWeek !== undefined) {
      const weeklyModel: Record<number, SOPSuggestion[]> = {
        1: [{ type: 'MEDICINE', title: 'Monday → Mineral', description: 'Weekly mineral application day.', priority: 'MEDIUM' }],
        2: [{ type: 'MEDICINE', title: 'Tuesday → Water probiotic', description: 'Condition the water column.', priority: 'HIGH' }],
        3: [{ type: 'MEDICINE', title: 'Wednesday → Gut probiotic', description: 'Intensive gut health feed mix.', priority: 'MEDIUM' }],
        4: [{ type: 'MEDICINE', title: 'Thursday → Water probiotic', description: 'Second water conditioning for the week.', priority: 'HIGH' }],
        5: [{ type: 'MEDICINE', title: 'Friday → Mineral', description: 'Secondary mineral stabilization.', priority: 'MEDIUM' }],
        6: [{ type: 'ALERT', title: 'Saturday → Immunity booster', description: 'Bolster shrimp immunity today.', priority: 'HIGH' }],
        0: [{ type: 'TIP', title: 'Sunday → Check water', description: 'Full water parameter check and maintenance.', priority: 'MEDIUM' }],
      };
      if (weeklyModel[dayOfWeek]) {
        suggestions.push(...weeklyModel[dayOfWeek]);
      }
    }
  }

  // --- FINAL FILTERING ---
  // If Early Stage, strictly remove MEDICINE and ALERT types as requested.
  if (isEarlyStage) {
    return suggestions.filter(s => s.type !== 'MEDICINE' && s.type !== 'ALERT');
  }

  return suggestions;
};
