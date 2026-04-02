import { MoonPhase } from './lunarUtils';

export interface SOPAlert {
  category: 'WEATHER' | 'WATER' | 'DISEASE' | 'FEEDING' | 'LUNAR';
  condition: string;
  alert: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  active?: boolean;
}

export const WEATHER_ALERTS: SOPAlert[] = [
  { category: 'WEATHER', condition: 'Rain', alert: 'Stop feeding', priority: 'HIGH' },
  { category: 'WEATHER', condition: 'Heavy rain', alert: 'Add lime', priority: 'CRITICAL' },
  { category: 'WEATHER', condition: 'Temp low', alert: 'Reduce feed', priority: 'HIGH' },
  { category: 'WEATHER', condition: 'Temp high', alert: 'Increase aeration', priority: 'HIGH' },
  { category: 'WEATHER', condition: 'Wind high', alert: 'Monitor pond', priority: 'MEDIUM' },
  { category: 'WEATHER', condition: 'Cold wave', alert: 'Reduce feeding by 50%', priority: 'CRITICAL' },
  { category: 'WEATHER', condition: 'Overcast skies', alert: 'Reduce feed by 20%', priority: 'MEDIUM' },
  { category: 'WEATHER', condition: 'Heat wave', alert: 'Check DO afternoon', priority: 'HIGH' },
  { category: 'WEATHER', condition: 'Cyclone warning', alert: 'Harvest if ready', priority: 'CRITICAL' },
  { category: 'WEATHER', condition: 'Sudden rain', alert: 'Check salinity drop', priority: 'HIGH' }
];

export const WATER_QUALITY_ALERTS: SOPAlert[] = [
  { category: 'WATER', condition: 'DO < 5', alert: 'Start aerator', priority: 'CRITICAL' },
  { category: 'WATER', condition: 'pH < 7', alert: 'Add lime', priority: 'HIGH' },
  { category: 'WATER', condition: 'pH > 8.5', alert: 'Add probiotics', priority: 'HIGH' },
  { category: 'WATER', condition: 'Ammonia > 0.05', alert: 'Use zeolite', priority: 'CRITICAL' },
  { category: 'WATER', condition: 'Turbidity high', alert: 'Water exchange', priority: 'MEDIUM' },
  { category: 'WATER', condition: 'Salinity < 10', alert: 'Reduce water exchange', priority: 'HIGH' },
  { category: 'WATER', condition: 'Nitrite high', alert: 'Apply Yucca Extract', priority: 'CRITICAL' },
  { category: 'WATER', condition: 'Alkalinity < 100', alert: 'Add Sodium Bicarbonate', priority: 'HIGH' },
  { category: 'WATER', condition: 'Hydrogen Sulfide', alert: 'Increase Aeration + Probiotics', priority: 'CRITICAL' },
  { category: 'WATER', condition: 'Vibrio count high', alert: 'Apply Water Probiotic', priority: 'HIGH' }
];

export const DISEASE_ALERTS: SOPAlert[] = [
  { category: 'DISEASE', condition: 'White Spot Syndrome risk', alert: 'Bio-security + Maximum Aeration', priority: 'CRITICAL' },
  { category: 'DISEASE', condition: 'Vibriosis symptoms', alert: 'Sanitizer + Probiotics', priority: 'HIGH' },
  { category: 'DISEASE', condition: 'Slow movement', alert: 'Check for stress/low DO', priority: 'MEDIUM' },
  { category: 'DISEASE', condition: 'Feed reduction', alert: 'Sample shrimp for health check', priority: 'HIGH' },
  { category: 'DISEASE', condition: 'Running Mortality (RMS)', alert: 'Siphoning + Water Treatment', priority: 'CRITICAL' },
  { category: 'DISEASE', condition: 'White Feces (WFD)', alert: 'Gut Probiotic + Feed Cut', priority: 'HIGH' },
  { category: 'DISEASE', condition: 'Loose Shell', alert: 'Check Minerals + Water Quality', priority: 'MEDIUM' },
  { category: 'DISEASE', condition: 'Soft Shell', alert: 'Increase Mineral application', priority: 'MEDIUM' }
];

export const FEEDING_ALERTS: SOPAlert[] = [
  { category: 'FEEDING', condition: 'Feed not consumed', alert: 'Reduce feed + Check water', priority: 'HIGH' },
  { category: 'FEEDING', condition: 'Overfeeding warning', alert: 'Cut feed 25% + Aeration', priority: 'HIGH' },
  { category: 'FEEDING', condition: 'Increase feed suggestion', alert: 'Monitor growth + Check trays', priority: 'MEDIUM' },
  { category: 'FEEDING', condition: 'Reduce feed suggestion', alert: 'Check DO & Temperature', priority: 'MEDIUM' },
  { category: 'FEEDING', condition: 'Empty gut detected', alert: 'Check feed distribution', priority: 'HIGH' },
  { category: 'FEEDING', condition: 'Broken feed in trays', alert: 'Adjust feeding window', priority: 'MEDIUM' },
  { category: 'FEEDING', condition: 'Uneven growth', alert: 'Check stocking density/feed', priority: 'MEDIUM' }
];

export const getActiveSOPAlerts = (params: {
  temp: number;
  isRaining: boolean;
  isHeavyRain: boolean;
  doLevel: number;
  ph: number;
  ammonia: number;
  turbidity: number;
  windSpeed: number;
  feedConsumed: boolean;
  shrimpMovement: 'normal' | 'slow';
  hasWSSVRisk: boolean;
  hasVibriosisSymptoms: boolean;
}) => {
  const active: SOPAlert[] = [];

  // Weather Logic
  if (params.isHeavyRain) active.push({ ...WEATHER_ALERTS[1], active: true });
  else if (params.isRaining) active.push({ ...WEATHER_ALERTS[0], active: true });
  
  if (params.temp < 25) active.push({ ...WEATHER_ALERTS[2], active: true });
  if (params.temp > 33) active.push({ ...WEATHER_ALERTS[3], active: true });
  if (params.windSpeed > 20) active.push({ ...WEATHER_ALERTS[4], active: true });

  // Water Logic
  if (params.doLevel < 5) active.push({ ...WATER_QUALITY_ALERTS[0], active: true });
  if (params.ph < 7) active.push({ ...WATER_QUALITY_ALERTS[1], active: true });
  if (params.ph > 8.5) active.push({ ...WATER_QUALITY_ALERTS[2], active: true });
  if (params.ammonia > 0.05) active.push({ ...WATER_QUALITY_ALERTS[3], active: true });
  if (params.turbidity > 40) active.push({ ...WATER_QUALITY_ALERTS[4], active: true });

  // Disease Logic
  if (params.hasWSSVRisk) active.push({ ...DISEASE_ALERTS[0], active: true });
  if (params.hasVibriosisSymptoms) active.push({ ...DISEASE_ALERTS[1], active: true });
  if (params.shrimpMovement === 'slow') active.push({ ...DISEASE_ALERTS[2], active: true });
  if (!params.feedConsumed && params.shrimpMovement === 'normal') active.push({ ...DISEASE_ALERTS[3], active: true });

  // Feeding Logic
  if (!params.feedConsumed) active.push({ ...FEEDING_ALERTS[0], active: true });
  
  return active;
};
