import { Pond, PondLog, WaterQualityRecord } from '../types';
import { Reminder, ReminderType } from '../types/reminder';
import { calculateDOC } from './pondUtils';
import { getLunarStatus } from './lunarUtils';
import { getSOPGuidance } from './sopRules';

export const generateReminders = (
  ponds: Pond[], 
  feedLogs: any[], 
  waterLogs: WaterQualityRecord[],
  translations: any
): Reminder[] => {
  const reminders: Reminder[] = [];
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const lunar = getLunarStatus(now);

  ponds.forEach(pond => {
    const doc = calculateDOC(pond.stockingDate);
    const dayOfWeek = now.getDay();

    // 🕒 1. DAILY REMINDERS
    // Feed times: 06:00, 10:00, 14:00, 18:00
    const feedTimes = ['06:00', '10:00', '14:00', '18:00'];
    feedTimes.forEach((time, index) => {
      const [h, m] = time.split(':').map(Number);
      const isPast = currentHour > h || (currentHour === h && currentMinute >= m);
      
      reminders.push({
        id: `feed-${pond.id}-${time}`,
        pondId: pond.id,
        pondName: pond.name,
        type: 'feed',
        title: `${translations.timeToFeed} (${index + 1})`,
        description: `Feed ${pond.name} - 10kg estimated`, // Simplified biomass logic
        time,
        status: isPast ? 'completed' : 'pending',
        priority: 'high'
      });
    });

    // Check Feed Trays: 11:00 AM
    reminders.push({
      id: `tray-${pond.id}-1100`,
      pondId: pond.id,
      pondName: pond.name,
      type: 'feed',
      title: translations.checkFeedTrays,
      description: 'Check trays for consumption verification',
      time: '11:00',
      status: (currentHour > 11) ? 'completed' : 'pending',
      priority: 'medium'
    });

    // Aerator ON: 21:00
    reminders.push({
      id: `aerator-${pond.id}-2100`,
      pondId: pond.id,
      pondName: pond.name,
      type: 'risk',
      title: translations.aeratorNightOn,
      description: 'High aeration night mode ON',
      time: '21:00',
      status: (currentHour >= 21) ? 'completed' : 'pending',
      priority: 'high'
    });

    // 📅 2. SOP / DOC-BASED REMINDERS
    const guidance = getSOPGuidance(doc, dayOfWeek);
    guidance.forEach((g, idx) => {
       if (g.type === 'MEDICINE' || g.type === 'ALERT') {
         reminders.push({
            id: `sop-${pond.id}-${doc}-${idx}`,
            pondId: pond.id,
            pondName: pond.name,
            type: g.type === 'MEDICINE' ? 'medicine' : 'risk',
            title: g.title,
            description: g.description,
            time: '09:00', // Default SOP time
            status: (currentHour > 9) ? 'completed' : 'pending',
            priority: g.priority.toLowerCase() as any
         });
       }
    });

    // 🌙 3. LUNAR ALERTS (SOP)
    if (lunar.phase === 'AMAVASYA') {
      reminders.push({
        id: `moon-${pond.id}-amavasya`,
        pondId: pond.id,
        pondName: pond.name,
        type: 'moon',
        title: translations.moonCycleAlert,
        description: translations.reduceFeedAmavasya || 'SOP: Reduce feed 20% tonight',
        time: '07:00',
        status: (currentHour > 7) ? 'completed' : 'pending',
        priority: 'high'
      });
    } else if (lunar.phase === 'POURNAMI') {
      reminders.push({
        id: `moon-${pond.id}-pournami`,
        pondId: pond.id,
        pondName: pond.name,
        type: 'moon',
        title: translations.moonCycleAlert,
        description: 'SOP: Increase aeration for high demand',
        time: '07:00',
        status: (currentHour > 7) ? 'completed' : 'pending',
        priority: 'high'
      });
    } else if (lunar.phase === 'ASHTAMI') {
      reminders.push({
        id: `moon-${pond.id}-ashtami`,
        pondId: pond.id,
        pondName: pond.name,
        type: 'moon',
        title: translations.moonCycleAlert,
        description: translations.addMineralsAshtami || 'SOP: Add minerals for molting support',
        time: '07:00',
        status: (currentHour > 7) ? 'completed' : 'pending',
        priority: 'medium'
      });
    } else if (lunar.phase === 'NAVAMI') {
      reminders.push({
        id: `moon-${pond.id}-navami`,
        pondId: pond.id,
        pondName: pond.name,
        type: 'moon',
        title: translations.moonCycleAlert,
        description: 'SOP: Light feeding today',
        time: '07:00',
        status: (currentHour > 7) ? 'completed' : 'pending',
        priority: 'medium'
      });
    }

    // ⚠️ 4. RISK ALERTS (Mocked from waterLogs)
    const latestWater = waterLogs.filter(wl => wl.pondId === pond.id).pop();
    if (latestWater) {
      if (latestWater.ph < 7.5) {
        reminders.push({
          id: `risk-ph-${pond.id}`,
          pondId: pond.id,
          pondName: pond.name,
          type: 'risk',
          title: translations.applyLimePhLow,
          description: `Current pH: ${latestWater.ph}`,
          time: 'Now',
          status: 'pending',
          priority: 'high'
        });
      }
      // Add similar for DO, Ammonia if data exists
    }
  });

  return reminders;
};
