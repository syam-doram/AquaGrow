import { getLunarStatus } from './lunarUtils';
import { sop100Days } from './sopSchedule';

// Types
export interface ScheduleAlert {
  title: string;
  trigger: string;
  type: 'critical' | 'warning' | 'info';
}

export interface DailyTask {
  time: string;
  task: string;
  type: 'feed' | 'check' | 'med' | 'aerator';
}

export interface EngineResult {
  doc: number;
  enginePhase: {
    phase: number;
    title: string;
    msg: string;
    tasks: { t: string; v: string }[];
  };
  dailySchedule: DailyTask[];
  activeAlerts: ScheduleAlert[];
  todayTableSOP: typeof sop100Days[0] | null;
  feedKgAdjusted: number; // multiplied via seedCount logic
}

// Simulated backend Weather environment
export const fetchCurrentConditions = () => {
  const hour = new Date().getHours();
  const month = new Date().getMonth() + 1;
  const baseTemp = month >= 3 && month <= 5 ? 34 : month >= 6 && month <= 9 ? 30 : 27;
  const temp = baseTemp - (hour < 6 || hour > 18 ? 5 : 0);
  const isRaining = month >= 6 && month <= 9 && Math.random() > 0.7;
  const doLevel = temp > 32 ? 4.5 : isRaining ? 5.2 : 6.5; 
  return { temp, isRaining, doLevel };
};

export const getEnginePhase = (doc: number) => {
  if (doc <= 10) return { phase: 1, title: 'Phase 1: DOC 1–10 (Seeding)', msg: 'Starter stage – prioritize water quality & alkalinity', tasks: [{ t: 'Check', v: 'pH & Alkalinity (Daily)' }, { t: 'Water', v: 'Maintain slight green color' }, { t: 'Feed', v: 'Follow tray observations' }] };
  if (doc <= 20) return { phase: 2, title: 'Phase 2: DOC 11–20', msg: 'Transition phase – maintain pH stability & growth', tasks: [{ t: 'Probiotic', v: 'Soil/Water probiotics' }, { t: 'Water', v: 'Monitor early ammonia' }, { t: 'Feed', v: 'Gradual increment' }] };
  if (doc <= 30) return { phase: 3, title: 'Phase 3: DOC 21–30', msg: 'Shrimp observation stage – monitor for stress', tasks: [{ t: 'Disease', v: 'Start body checks' }, { t: 'Water', v: 'Strict pH monitoring' }, { t: 'Feed', v: 'Adjust per check-tray' }] };
  if (doc <= 45) return { phase: 4, title: 'Phase 4: DOC 31–45 (Critical)', msg: 'Peak High Risk Window (WSSV)', tasks: [{ t: 'WSSV', v: 'Check for white spots' }, { t: 'Medicine', v: 'Immunity supplements' }, { t: 'Aerator', v: 'Continuous aeration' }] };
  if (doc <= 60) return { phase: 5, title: 'Phase 5: DOC 46–60', msg: 'Biomass expansion stage', tasks: [{ t: 'Water', v: 'Monitor fecal strings' }, { t: 'Feed', v: 'High protein intake' }, { t: 'Medicine', v: 'Liver protection' }] };
  if (doc <= 80) return { phase: 6, title: 'Phase 6: DOC 61–80', msg: 'Moulting Management', tasks: [{ t: 'Mineral', v: 'Enhance mineral dose' }, { t: 'Water', v: 'Daily DO checks' }, { t: 'Harvest', v: 'Partial planning' }] };
  return { phase: 7, title: 'Phase 7: DOC 81–100', msg: 'Maturity & Final Harvest', tasks: [{ t: 'Harvest', v: 'Clear all stocks' }, { t: 'Final', v: 'Market price check' }, { t: 'Feed', v: 'Stop 12h before' }] };
};

export const getDailySchedule = (doc: number): DailyTask[] => {
  if (doc <= 30) return [
    { time: '06:00 AM', task: 'Morning Feed', type: 'feed' },
    { time: '10:00 AM', task: 'Mid-Morning Feed', type: 'feed' },
    { time: '02:00 PM', task: 'Afternoon Feed (Slot 3)', type: 'feed' },
    { time: '05:00 PM', task: 'Evening Feed (Slot 4)', type: 'feed' },
    { time: '06:00 PM', task: 'Apply Water Probiotic', type: 'med' },
    { time: '06:30 PM', task: 'Aerator ON', type: 'aerator' },
  ];
  if (doc <= 60) return [
    { time: '06:00 AM', task: 'Morning Feed', type: 'feed' },
    { time: '10:00 AM', task: 'Check Feed Trays', type: 'check' },
    { time: '02:00 PM', task: 'Afternoon Feed (Slot 3)', type: 'feed' },
    { time: '05:00 PM', task: 'Evening Feed (Slot 4)', type: 'feed' },
    { time: '07:00 PM', task: 'Apply Soil Probiotic', type: 'med' },
    { time: '06:30 PM', task: 'Aerator Full ON', type: 'aerator' },
  ];
  return [
    { time: '06:00 AM', task: 'Morning Feed', type: 'feed' },
    { time: '10:00 AM', task: 'Water parameters check', type: 'check' },
    { time: '02:00 PM', task: 'Afternoon Feed (Slot 3)', type: 'feed' },
    { time: '05:00 PM', task: 'Evening Feed (Slot 4)', type: 'feed' },
    { time: '07:30 PM', task: 'High Dose Minerals', type: 'med' },
    { time: '06:30 PM', task: 'Aerator 100% Capacity', type: 'aerator' },
  ];
};

/**
 * Main Execution Function
 * Can be run purely in background via Cron, Node.js server, or invoked by any component.
 */
export const runScheduleEngine = (
  pondDoc: number, 
  pondSeedCount: number, 
  isHarvested: boolean,
  latestWater?: { do: number; ph: number; temp: number; ammonia: number },
  medicineStatus?: string
): EngineResult | null => {
   if (isHarvested || medicineStatus === 'recovered') {
      return null; 
   }
   const isUnderTreatment = medicineStatus === 'applied';

    const weather = fetchCurrentConditions();
    const alerts: ScheduleAlert[] = [];
    
    // Legacy alerts removed: Unified into analyzePondSituation (situationEngine)
    // to prevent duplicate notifications and user irritation.

    // Get day's exact requirement from the 100-Day Table
   const todaySOP = sop100Days.find(d => d.doc === pondDoc) || null;
   
   // Apply Farmer Details dynamically: Seed Count determines Feed Multiplier
   const feedKgAdjusted = todaySOP ? Math.round(todaySOP.feed * (pondSeedCount / 200000)) : 0;

   // Fire output
   return {
     doc: pondDoc,
     enginePhase: getEnginePhase(pondDoc),
     dailySchedule: getDailySchedule(pondDoc),
     activeAlerts: alerts,
     todayTableSOP: todaySOP,
     feedKgAdjusted,
   };
};
