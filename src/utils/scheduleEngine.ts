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
    { time: '10:00 AM', task: 'Mid-Morning Feed', type: 'feed' },
    { time: '02:00 PM', task: 'Afternoon Feed (Slot 3)', type: 'feed' },
    { time: '05:00 PM', task: 'Evening Feed (Slot 4)', type: 'feed' },
    { time: '06:00 PM', task: 'Apply Water Probiotic', type: 'med' },
    { time: '09:00 PM', task: 'Aerator ON', type: 'aerator' },
  ];
  if (doc <= 60) return [
    { time: '06:00 AM', task: 'Morning Feed', type: 'feed' },
    { time: '10:00 AM', task: 'Check Feed Trays', type: 'check' },
    { time: '02:00 PM', task: 'Afternoon Feed (Slot 3)', type: 'feed' },
    { time: '05:00 PM', task: 'Evening Feed (Slot 4)', type: 'feed' },
    { time: '07:00 PM', task: 'Apply Soil Probiotic', type: 'med' },
    { time: '09:00 PM', task: 'Aerator Full ON', type: 'aerator' },
  ];
  return [
    { time: '06:00 AM', task: 'Morning Feed', type: 'feed' },
    { time: '10:00 AM', task: 'Water parameters check', type: 'check' },
    { time: '02:00 PM', task: 'Afternoon Feed (Slot 3)', type: 'feed' },
    { time: '05:00 PM', task: 'Evening Feed (Slot 4)', type: 'feed' },
    { time: '07:30 PM', task: 'High Dose Minerals', type: 'med' },
    { time: '08:30 PM', task: 'Aerator 100% Capacity', type: 'aerator' },
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
  latestWater?: { do: number; ph: number; temp: number; ammonia: number }
): EngineResult | null => {
   if (isHarvested) {
      return null; 
   }

   const weather = fetchCurrentConditions();
   const alerts: ScheduleAlert[] = [];
   
   // 1. Water Quality & Real-time Sensor Alerts
   if (latestWater) {
      if (latestWater.do < 4.0) {
        alerts.push({ title: 'CRITICAL: DO Level Dangerous', trigger: `DO at ${latestWater.do} mg/L (Min 4.0)`, type: 'critical' });
      } else if (latestWater.do < 5.0) {
        alerts.push({ title: 'Low Oxygen Warning', trigger: `DO at ${latestWater.do} mg/L`, type: 'warning' });
      }

      if (latestWater.ph < 7.5 || latestWater.ph > 8.5) {
        alerts.push({ title: 'pH Instability Detected', trigger: `pH at ${latestWater.ph} (Optimum: 7.5-8.2)`, type: 'warning' });
      }

      if (latestWater.ammonia > 0.5) {
        alerts.push({ title: 'CRITICAL: Ammonia Toxicity', trigger: `Ammonia at ${latestWater.ammonia} ppm`, type: 'critical' });
      }
   } else {
     // Fallback to weather-based environmental alerts if no sensor data
     if (weather.doLevel < 5) alerts.push({ title: 'Low DO Environment Forecast', trigger: `Est. DO < 5 (${weather.doLevel} ppm)`, type: 'warning' });
   }

   // 2. SOP & Life-cycle Criticality
   if (pondDoc >= 32 && pondDoc <= 48) {
     alerts.push({ title: 'CRITICAL PHASE: White Spot Risk', trigger: `DOC ${pondDoc} (Peak Risk Window)`, type: 'critical' });
   }

   // 3. Environment & Weather
   if (weather.isRaining) {
     alerts.push({ title: 'Heavy Rain: Adjust Ration', trigger: 'Rainfall detected', type: 'critical' });
   }

   if (weather.temp > 33) {
     alerts.push({ title: 'High Temp Stress', trigger: `Temp ${weather.temp}°C`, type: 'warning' });
   }

   // 4. Time-Based Consumption Windows
   const currentHour = new Date().getHours();
   if (currentHour >= 9 && currentHour <= 11) {
     alerts.push({ 
       title: 'Check Feed Trays Now!', 
       trigger: 'Consumption Window (9-11 AM)', 
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
