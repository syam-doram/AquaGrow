import { getLunarStatus } from './lunarUtils';

export interface SOPSuggestion {
  type: 'MEDICINE' | 'ALERT' | 'RULE' | 'TIP' | 'LUNAR';
  title: string;
  description: string;
  brand?: string;
  dose?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const getSOPGuidance = (doc: number, dayOfWeek?: number): SOPSuggestion[] => {
  const suggestions: SOPSuggestion[] = [];
  const lunar = getLunarStatus(new Date());

  // Lunar-Aware Guidance (High Priority)
  if (lunar.phase === 'AMAVASYA') {
    suggestions.push({
      type: 'LUNAR',
      title: 'Amavasya - High Risk Alert',
      description: 'Strong gravitational pull and DO drop. High risk of mass molting. Reduce feed by 20-30% tonight.',
      priority: 'HIGH'
    });
    suggestions.push({
      type: 'ALERT',
      title: 'Strong Aeration Required',
      description: 'Run all aerators for the full night to support mass molting shrimp and prevent DO drop.',
      priority: 'HIGH'
    });
    suggestions.push({
      type: 'MEDICINE',
      title: 'Mineral Mix (High Dose)',
      description: 'Mass molting support. Prevent weak/soft shells.',
      dose: '15–20 kg/acre',
      priority: 'HIGH'
    });
    suggestions.push({
      type: 'MEDICINE',
      title: 'Vitamin C / Immunity',
      description: 'Boost shrimp defense during molting stress.',
      priority: 'MEDIUM'
    });
  } else if (lunar.phase === 'ASHTAMI_NAVAMI') {
    suggestions.push({
      type: 'LUNAR',
      title: 'Ashtami / Navami Management',
      description: 'Partial moon effect causing partial molting and slight stress. Slightly reduce feed (10-15%).',
      priority: 'MEDIUM'
    });
    suggestions.push({
      type: 'MEDICINE',
      title: 'Mineral Mix (Medium Dose)',
      description: 'Support uneven molting during quarter moon.',
      dose: '10–15 kg/acre',
      priority: 'MEDIUM'
    });
    suggestions.push({
      type: 'ALERT',
      title: 'Night Aeration Must',
      description: 'Ensure stable night oxygen levels for molting shrimp.',
      priority: 'MEDIUM'
    });
  }
  
  // DOC-WISE MEDICINE SCHEDULE
  if (doc >= 1 && doc <= 10) {
    suggestions.push({
      type: 'MEDICINE',
      title: 'Gut Probiotic (Daily)',
      description: 'Mix with feed to improve digestion and early survival.',
      brand: 'CP Gut Probiotic',
      dose: '5–10 g/kg feed',
      priority: 'HIGH'
    });
    if (doc % 3 === 0) {
      suggestions.push({
        type: 'MEDICINE',
        title: 'Water Probiotic',
        description: 'Maintain water quality and early microbial balance.',
        brand: 'Bioclean Aqua Plus',
        dose: '250 g/acre',
        priority: 'MEDIUM'
      });
    }
  } else if (doc >= 11 && doc <= 20) {
    suggestions.push({
      type: 'MEDICINE',
      title: 'Gut Probiotic Continue',
      description: 'Maintain gut health during growth spurt.',
      brand: 'Avanti Gut Health',
      dose: '10g/kg feed',
      priority: 'HIGH'
    });
    if (doc % 5 === 0) {
      suggestions.push({
        type: 'MEDICINE',
        title: 'Water & Soil Probiotic',
        description: 'Clean pond bottom (soil bacteria) and water column.',
        brand: 'Sanolife PRO-W',
        priority: 'MEDIUM'
      });
    }
    if (doc === 15) {
      suggestions.push({
        type: 'ALERT',
        title: 'Vitamin C Booster',
        description: 'Immunity boost for transitioned juveniles.',
        priority: 'HIGH'
      });
    }
  } else if (doc >= 21 && doc <= 30) {
    if (doc % 2 !== 0) { // Alternate days
      suggestions.push({
        type: 'MEDICINE',
        title: 'Water Probiotic',
        description: 'Critical for ammonia control in risk stage.',
        priority: 'HIGH'
      });
    }
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
    if (doc % 3 === 0) {
       suggestions.push({
         type: 'MEDICINE',
         title: 'Water Probiotic',
         description: 'Intensive water conditioning required.',
         priority: 'HIGH'
       });
    }
    if (doc >= 30 && doc <= 35) {
       suggestions.push({
         type: 'MEDICINE',
         title: 'Anti-Stress Tonic',
         description: 'Reduce physiological stress in extreme heat/cold.',
         priority: 'MEDIUM'
       });
    }
    if (doc === 40) {
       suggestions.push({
         type: 'MEDICINE',
         title: 'Vitamin + Mineral Booster',
         description: 'Prepare for high growth stage.',
         priority: 'HIGH'
       });
    }
  } else if (doc >= 46 && doc <= 60) {
    if (doc === 50) {
       suggestions.push({
         type: 'MEDICINE',
         title: 'Liver Tonic',
         description: 'Focus on hepatopancreas health for maximum growth.',
         priority: 'HIGH'
       });
    }
  } else if (doc >= 81 && doc <= 100) {
    suggestions.push({
      type: 'RULE',
      title: 'Final Stage Compliance',
      description: 'Stop heavy medicines now. Maintain clean water for harvest quality.',
      priority: 'HIGH'
    });
  }

  // Simple Weekly Model
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

  // General Rules
  suggestions.push({
    type: 'RULE',
    title: 'Amavasya Tip',
    description: 'Success depends on: Water quality + Aeration + Feed management during Amavasya.',
    priority: 'MEDIUM'
  });

  return suggestions;
};
