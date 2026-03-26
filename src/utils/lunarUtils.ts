/**
 * Simple Lunar Cycle Utility for Aquaculture
 * Estimates moon phase based on a known New Moon (Amavasya) reference.
 * Approximate synodic month is 29.53 days.
 */

// Reference New Moon: Mar 14, 2026
const REFERENCE_AMAVASYA = new Date('2026-03-14T00:00:00').getTime();
const SYNODIC_MONTH = 29.53059 * 24 * 60 * 60 * 1000;

export type MoonPhase = 'AMAVASYA' | 'ASHTAMI_NAVAMI' | 'NORMAL';

export interface LunarStatus {
  phase: MoonPhase;
  daysToAmavasya: number;
  daysSinceAmavasya: number;
  isHighRisk: boolean;
}

export const getLunarStatus = (date: Date = new Date()): LunarStatus => {
  const currentTime = date.getTime();
  const diff = currentTime - REFERENCE_AMAVASYA;
  
  // Normalize difference to synodic month
  const cycleDay = (diff % SYNODIC_MONTH) / (24 * 60 * 60 * 1000);
  const normalizedDay = cycleDay < 0 ? cycleDay + 29.53 : cycleDay;

  // Amavasya Window: Day -1 to Day +1 (approx 28.5 to 1.5)
  const isAmavasyaWindow = normalizedDay >= 28.5 || normalizedDay <= 1.5;
  
  // Ashtami / Navami Window: Day 7 to Day 9 (First Quarter) and Day 21 to 23 (Third Quarter)
  const isAshtamiNavamiWindow = (normalizedDay >= 6.5 && normalizedDay <= 9.5) || (normalizedDay >= 21.5 && normalizedDay <= 23.5);

  return {
    phase: isAmavasyaWindow ? 'AMAVASYA' : isAshtamiNavamiWindow ? 'ASHTAMI_NAVAMI' : 'NORMAL',
    daysToAmavasya: Math.ceil(29.53 - normalizedDay),
    daysSinceAmavasya: Math.floor(normalizedDay),
    isHighRisk: isAmavasyaWindow
  };
};
