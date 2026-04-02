/**
 * Simple Lunar Cycle Utility for Aquaculture
 * Estimates moon phase based on a known New Moon (Amavasya) reference.
 * Approximate synodic month is 29.53 days.
 */

// Reference New Moon: Mar 19, 2026 06:53 AM IST (Actual 2026 Amavasya)
const REFERENCE_AMAVASYA = new Date('2026-03-19T06:53:00').getTime();
const SYNODIC_MONTH = 29.530588 * 24 * 60 * 60 * 1000;

export type MoonPhase = 'AMAVASYA' | 'POURNAMI' | 'ASHTAMI' | 'NAVAMI' | 'NORMAL';

export interface LunarStatus {
  phase: MoonPhase;
  daysToAmavasya: number;
  daysToAshtami: number;
  daysToNavami: number;
  daysSinceAmavasya: number;
  daysSinceAshtami: number;
  daysSinceNavami: number;
  daysSincePournami: number;
  isHighRisk: boolean;
  isExactAmavasya: boolean;
  isExactPournami: boolean;
  isExactAshtami: boolean;
  isExactNavami: boolean;
}

export const getLunarStatus = (date: Date = new Date()): LunarStatus => {
  const currentTime = date.getTime();
  const diff = currentTime - REFERENCE_AMAVASYA;
  
  // Normalize difference to synodic month
  const cycleDay = (diff % (29.53059 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000);
  const normalizedDay = cycleDay < 0 ? (cycleDay + 29.53) % 29.53 : cycleDay % 29.53;

  // Exact Peak Days (1 day each) - Optimized for 2026 Calendar alignment
  const isExactAmavasya = normalizedDay >= 0 && normalizedDay < 1;
  const isExactPournami = normalizedDay >= 14.2 && normalizedDay < 15.2;
  const isExactAshtami = (normalizedDay >= 6.8 && normalizedDay < 7.8) || (normalizedDay >= 21.8 && normalizedDay < 22.8);
  const isExactNavami = (normalizedDay >= 7.8 && normalizedDay < 8.8) || (normalizedDay >= 22.8 && normalizedDay < 23.8);

  // High Risk Windows (3 days around Amavasya)
  const isAmavasyaWindow = normalizedDay >= 28.2 || normalizedDay <= 1.2;

  let currentPhase: MoonPhase = 'NORMAL';
  if (isExactAmavasya) currentPhase = 'AMAVASYA';
  else if (isExactPournami) currentPhase = 'POURNAMI';
  else if (isExactAshtami) currentPhase = 'ASHTAMI';
  else if (isExactNavami) currentPhase = 'NAVAMI';

  const nextAshtamiDays = normalizedDay < 7 ? 7 - normalizedDay : normalizedDay < 22 ? 22 - normalizedDay : 36.53 - normalizedDay;
  const nextNavamiDays = normalizedDay < 8 ? 8 - normalizedDay : normalizedDay < 23 ? 23 - normalizedDay : 37.53 - normalizedDay;

  const daysSinceAshtami = (normalizedDay - 7.3) >= 0 ? (normalizedDay - 7.3) : (normalizedDay - 7.3 + 29.53);
  const daysSinceNavami = (normalizedDay - 8.3) >= 0 ? (normalizedDay - 8.3) : (normalizedDay - 8.3 + 29.53);
  const daysSincePournami = (normalizedDay - 14.7) >= 0 ? (normalizedDay - 14.7) : (normalizedDay - 14.7 + 29.53);

  return {
    phase: currentPhase,
    daysToAmavasya: Math.ceil((29.53 - normalizedDay) % 29.53),
    daysToAshtami: Math.ceil(nextAshtamiDays),
    daysToNavami: Math.ceil(nextNavamiDays),
    daysSinceAmavasya: Math.floor(normalizedDay),
    daysSinceAshtami: Math.floor(daysSinceAshtami % 29.53),
    daysSinceNavami: Math.floor(daysSinceNavami % 29.53),
    daysSincePournami: Math.floor(daysSincePournami % 29.53),
    isHighRisk: isAmavasyaWindow,
    isExactAmavasya,
    isExactPournami,
    isExactAshtami,
    isExactNavami
  };
};

export interface LunarDay {
  date: Date;
  status: LunarStatus;
}

export const getLunarForecast = (startDate: Date = new Date(), days: number = 30): LunarDay[] => {
  const forecast: LunarDay[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    forecast.push({
      date,
      status: getLunarStatus(date)
    });
  }
  return forecast;
};

export const getUpcomingMoonEvents = (limit: number = 10): LunarDay[] => {
  const events: LunarDay[] = [];
  let currentDate = new Date();
  let daysChecked = 0;
  let lastPhase: MoonPhase = 'NORMAL';

  while (events.length < limit && daysChecked < 100) { // Safety limit of 100 days
    const status = getLunarStatus(currentDate);
    if (status.phase !== 'NORMAL' && status.phase !== lastPhase) {
      events.push({
        date: new Date(currentDate),
        status
      });
      lastPhase = status.phase;
    } else if (status.phase === 'NORMAL') {
      lastPhase = 'NORMAL';
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
    daysChecked++;
  }
  return events;
};
