import { Pond, WaterQualityRecord } from '../types';
import { Reminder } from '../types/reminder';
import { calculateDOC } from './pondUtils';
import { getLunarStatus } from './lunarUtils';
import { getSOPGuidance } from './sopRules';
import { sop100Days } from './sopSchedule';

export const generateReminders = (
  ponds: Pond[], 
  feedLogs: any[], 
  waterLogs: WaterQualityRecord[],
  translations: any,
  targetDate: Date = new Date()
): Reminder[] => {
  const reminders: Reminder[] = [];
  const now = new Date();
  const isToday = targetDate.toDateString() === now.toDateString();
  const targetDateStr = targetDate.toISOString().split('T')[0];
  
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const lunar = getLunarStatus(targetDate);

  ponds.forEach(pond => {
    const doc = calculateDOC(pond.stockingDate, targetDateStr);
    const daySOP = sop100Days.find(s => s.doc === doc);
    
    // Exact Feed Calculation: Base SOP * (Seed Count / 1 Lakh)
    const dailyFeedTotal = daySOP ? (daySOP.feed * (pond.seedCount / 100000)) : 0;
    const feedTimes = ['06:00', '10:00', '14:00', '18:00', '21:30'];
    const feedKgPerSlot = (dailyFeedTotal / feedTimes.length).toFixed(1);

    // 🕒 1. POND-SPECIFIC FEED ALERTS
    feedTimes.forEach((time, index) => {
      const [h, m] = time.split(':').map(Number);
      const isPast = isToday && (currentHour > h || (currentHour === h && currentMinute >= m));
      
      reminders.push({
        id: `feed-${pond.id}-${time}-${targetDateStr}`,
        pondId: pond.id,
        pondName: pond.name,
        type: 'feed',
        title: `${translations.timeToFeed} (${index + 1})`,
        description: `${pond.name} (DOC ${doc}): Apply ${feedKgPerSlot}kg feed`,
        time,
        status: isPast ? 'completed' : 'pending',
        priority: index === 0 ? 'high' : 'medium',
        date: targetDateStr
      });
    });

    // Check Feed Trays: 11:30 AM (Strictly after 10 AM feed)
    reminders.push({
      id: `tray-${pond.id}-1130-${targetDateStr}`,
      pondId: pond.id,
      pondName: pond.name,
      type: 'feed',
      title: translations.checkFeedTrays,
      description: `Analysis for ${pond.name}: Check consumption at Day ${doc}`,
      time: '11:30',
      status: (isToday && (currentHour > 11 || (currentHour === 11 && currentMinute > 30))) ? 'completed' : 'pending',
      priority: 'medium',
      date: targetDateStr
    });

    // Aerator ON: 21:00 (Night Vigilance)
    reminders.push({
      id: `aerator-${pond.id}-2100-${targetDateStr}`,
      pondId: pond.id,
      pondName: pond.name,
      type: 'risk',
      title: translations.aeratorNightOn,
      description: `Target ${pond.name}: High-aeration window for active ${doc}-day biomass`,
      time: '21:00',
      status: (isToday && currentHour >= 21) ? 'completed' : 'pending',
      priority: 'high',
      date: targetDateStr
    });

    // 📅 2. SITUATION-BASED SOP & MEDICINE
    const guidance = getSOPGuidance(doc, targetDate);
    guidance.forEach((g, idx) => {
       if (g.type === 'MEDICINE' || g.type === 'ALERT' || g.type === 'LUNAR') {
         const type: any = g.type === 'MEDICINE' ? 'medicine' : g.type === 'LUNAR' ? 'moon' : 'risk';
         reminders.push({
            id: `sop-${pond.id}-${doc}-${idx}-${targetDateStr}`,
            pondId: pond.id,
            pondName: pond.name,
            type,
            title: g.title,
            description: `${g.description}${g.dose ? ` | Dose: ${g.dose}` : ''}${g.brand ? ` | Ref: ${g.brand}` : ''}`,
            time: g.type === 'MEDICINE' ? '08:30' : '07:00',
            status: (isToday && currentHour > 9) ? 'completed' : 'pending',
            priority: g.priority.toLowerCase() as any,
            date: targetDateStr
         });
       }
    });

    // ⚠️ 3. WATER-SITUATION ALERTS (Real-time Sensor Response)
    if (isToday) {
      const latestWater = waterLogs.filter(wl => wl.pondId === pond.id).pop();
      if (latestWater) {
        if (latestWater.ph < 7.5) {
          reminders.push({
            id: `risk-ph-${pond.id}-${targetDateStr}`,
            pondId: pond.id,
            pondName: pond.name,
            type: 'risk',
            title: translations.applyLimePhLow,
            description: `DANGER: pH at ${latestWater.ph} in ${pond.name}. Apply dolomite immediately.`,
            time: 'Now',
            status: 'pending',
            priority: 'high',
            date: targetDateStr
          });
        }
        if (latestWater.do < 4.0) {
          reminders.push({
             id: `risk-do-${pond.id}-${targetDateStr}`,
             pondId: pond.id,
             pondName: pond.name,
             type: 'risk',
             title: 'CRITICAL: LOW OXYGEN',
             description: `Sensor Alert: DO at ${latestWater.do} for ${pond.name}. Turn ON all aerators.`,
             time: 'Now',
             status: 'pending',
             priority: 'high',
             date: targetDateStr
          });
        }
      }
    }
  });

  return reminders;
};
