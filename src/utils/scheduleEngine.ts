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
  if (doc <= 10) return { phase: 1, title: 'Phase 1: DOC 1–10', msg: 'Starter stage – maintain water stability', tasks: [{ t: 'Feed', v: '4–5 times/day' }, { t: 'Probiotic', v: 'every 3 days' }, { t: 'Mineral', v: 'weekly' }] };
  if (doc <= 20) return { phase: 2, title: 'Phase 2: DOC 11–20', msg: 'Ammonia control important', tasks: [{ t: 'Feed', v: 'Increase slowly' }, { t: 'Probiotic', v: 'Start gut probiotic' }, { t: 'Add-on', v: 'Zeolite reminder' }] };
  if (doc <= 30) return { phase: 3, title: 'Phase 3: DOC 21–30', msg: 'Disease risk starting – monitor shrimp', tasks: [{ t: 'Mineral', v: '2 times/week' }, { t: 'Probiotic', v: 'Alternate days' }, { t: 'Risk', v: 'Check for infections' }] };
  if (doc <= 45) return { phase: 4, title: 'Phase 4: DOC 31–45 (Critical)', msg: 'High risk of White Spot Syndrome', tasks: [{ t: 'Feed', v: '3–4 times' }, { t: 'Medicine', v: 'Immunity booster' }, { t: 'Aerator', v: 'Full time (24h)' }] };
  if (doc <= 60) return { phase: 5, title: 'Phase 5: DOC 46–60', msg: 'High biomass – oxygen demand high', tasks: [{ t: 'Feed', v: 'High feeding' }, { t: 'Medicine', v: 'Liver tonic' }, { t: 'Aerator', v: 'Extra aeration needed' }] };
  if (doc <= 80) return { phase: 6, title: 'Phase 6: DOC 61–80', msg: 'Growth stage – maintain stability', tasks: [{ t: 'Feed', v: 'Maintain volumes' }, { t: 'Mineral', v: 'High dose' }, { t: 'Check', v: 'Water toxicity check' }] };
  return { phase: 7, title: 'Phase 7: DOC 81–100', msg: 'Harvest planning stage', tasks: [{ t: 'Feed', v: 'Reduce gradually' }, { t: 'Prep', v: 'Prepare for harvest' }, { t: 'Check', v: 'Size sampling' }] };
};

export const getDailySchedule = (doc: number): DailyTask[] => {
  if (doc <= 30) return [
    { time: '06:00 AM', task: 'Morning Feed', type: 'feed' },
    { time: '09:00 AM', task: 'Check Feed Trays', type: 'check' },
    { time: '10:00 AM', task: 'Mid-Morning Feed', type: 'feed' },
    { time: '02:00 PM', task: 'Afternoon Feed', type: 'feed' },
    { time: '06:00 PM', task: 'Evening Feed + Apply Probiotic', type: 'med' },
    { time: '09:00 PM', task: 'Aerator ON', type: 'aerator' },
  ];
  if (doc <= 60) return [
    { time: '06:00 AM', task: 'Morning Feed', type: 'feed' },
    { time: '09:00 AM', task: 'Water Check (DO/pH)', type: 'check' },
    { time: '12:00 PM', task: 'Mid-Day Feed', type: 'feed' },
    { time: '03:00 PM', task: 'Afternoon Feed', type: 'feed' },
    { time: '06:00 PM', task: 'Apply Probiotic / Liver Tonic', type: 'med' },
    { time: '09:00 PM', task: 'Aerator Full ON', type: 'aerator' },
  ];
  return [
    { time: '06:00 AM', task: 'Morning Feed', type: 'feed' },
    { time: '10:00 AM', task: 'Water parameters check', type: 'check' },
    { time: '12:30 PM', task: 'Mid-Day Feed', type: 'feed' },
    { time: '05:30 PM', task: 'Evening Feed', type: 'feed' },
    { time: '07:00 PM', task: 'High Dose Minerals', type: 'med' },
    { time: '08:00 PM', task: 'Aerator 100% Capacity', type: 'aerator' },
  ];
};

/**
 * Main Execution Function
 * Can be run purely in background via Cron, Node.js server, or invoked by any component.
 */
export const runScheduleEngine = (pondDoc: number, pondSeedCount: number, isHarvested: boolean): EngineResult | null => {
   if (isHarvested) {
      // If harvest is done then don't give suggestions/alerts for that pond
      return null; 
   }

   const weather = fetchCurrentConditions();
   // Calculate dynamic alerts
   const alerts: ScheduleAlert[] = [];
   
   if (weather.doLevel < 5) alerts.push({ title: 'Increase aeration immediately', trigger: `DO < 5 (${weather.doLevel} ppm)`, type: 'critical' });
   if (pondDoc >= 30 && pondDoc <= 45) alerts.push({ title: 'Disease risk extremely high', trigger: `DOC = ${pondDoc}`, type: 'warning' });
   if (weather.isRaining) alerts.push({ title: 'Stop feeding temporarily & check salinity', trigger: 'Rain forecast', type: 'critical' });
   if (weather.temp < 25) alerts.push({ title: 'Reduce feed + check shrimp stress', trigger: 'Temperature drop', type: 'warning' });

   // 🕒 Time-Based SOP Alerts (Feed Tray Checks)
   const currentHour = new Date().getHours();
   if (currentHour >= 9 && currentHour <= 11) {
     alerts.push({ 
       title: 'Check Feed Trays Now!', 
       trigger: 'SOP Consumption Verification Window', 
       type: 'warning' 
     });
   }

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
