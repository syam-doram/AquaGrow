export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDir: string;
  uvIndex: number;
  condition: string;
  conditionCode: 'sunny' | 'cloudy' | 'rain' | 'storm' | 'fog' | 'hot';
  rainChance: number;   // %
  alerts: { title: string; desc: string; type: 'critical' | 'warning' | 'info'; aqAction: string }[];
  forecast: { day: string; high: number; low: number; rainChance: number; icon: string; aqImpact: string }[];
  lunarPhase: string;
  airQuality: number;   // AQI value
}

/**
 * AquaGrow Weather Service — Simulation Engine
 * Generates time-of-day and season-aware data.
 * Ready for OpenWeatherMap / WeatherStack API integration.
 */
export const fetchWeatherData = async (_location: string): Promise<WeatherData> => {
  await new Promise(resolve => setTimeout(resolve, 900));

  const now   = new Date();
  const hour  = now.getHours();
  const month = now.getMonth() + 1; // 1–12

  // Season-aware temperature
  const baseTemp = month >= 3 && month <= 5 ? 35
    : month >= 6 && month <= 9 ? 30
    : month >= 10 && month <= 11 ? 27
    : 24;

  const diurnalDelta = hour < 6 ? -5 : hour < 10 ? -2 : hour < 14 ? 0 : hour < 18 ? 2 : 0;
  const temp         = baseTemp + diurnalDelta;
  const feelsLike    = temp + (month >= 6 && month <= 9 ? 3 : 1); // humid in monsoon
  const humidity     = month >= 6 && month <= 9 ? 82 : month >= 3 && month <= 5 ? 55 : 65;
  const isRainSeason = month >= 6 && month <= 9;
  const rainChance   = isRainSeason ? (hour >= 12 && hour <= 18 ? 72 : 45) : 15;
  const conditionCode: WeatherData['conditionCode'] = isRainSeason
    ? (rainChance > 60 ? 'storm' : 'rain')
    : temp >= 36 ? 'hot'
    : hour < 7 || hour > 18 ? 'cloudy' : 'sunny';

  const conditionMap: Record<WeatherData['conditionCode'], string> = {
    sunny:  'Sunny & Clear',
    cloudy: 'Mostly Cloudy',
    rain:   'Light Showers',
    storm:  'Heavy Rain Risk',
    fog:    'Morning Fog',
    hot:    'Extreme Heat',
  };

  // Lunar simulation
  const lunarDay = Math.floor(now.getDate() % 30);
  const lunarPhaseLabel = lunarDay === 0 || lunarDay === 29
    ? '🌑 Amavasya (New Moon)'
    : lunarDay === 14 || lunarDay === 15
    ? '🌕 Pournami (Full Moon)'
    : lunarDay === 7
    ? '🌓 Ashtami (Half Moon)'
    : lunarDay === 8
    ? '🌙 Navami'
    : '🌙 Waxing';

  const alerts: WeatherData['alerts'] = [];

  if (isRainSeason && rainChance > 60) {
    alerts.push({
      title: 'Heavy Rainfall Warning',
      desc: 'Intense rainfall expected in 2–4 hrs. Salinity may drop. Check pond drainage systems.',
      type: 'critical',
      aqAction: 'Reduce feed 20%. Run all aerators. Check salinity after rain stops.',
    });
  }

  if (temp >= 36) {
    alerts.push({
      title: `Extreme Heat Alert — ${temp}°C`,
      desc: 'High temperature causes DO drop and heat stress. Shrimp metabolism slows above 33°C.',
      type: 'critical',
      aqAction: 'Skip noon feed (12–2 PM). Apply Vitamin C. Add aeration at 3 PM.',
    });
  } else if (temp >= 33) {
    alerts.push({
      title: `High Temperature — ${temp}°C`,
      desc: 'Above optimal range (26–30°C). Increase aeration and monitor DO closely.',
      type: 'warning',
      aqAction: 'Reduce noon feed by 15%. Check DO at 3 PM.',
    });
  }

  if (hour >= 3 && hour <= 6) {
    alerts.push({
      title: 'Pre-Dawn DO Risk Window',
      desc: '3–6 AM is the highest-risk period for DO crash. Photosynthesis has stopped.',
      type: 'warning',
      aqAction: 'Ensure all aerators running. Check DO immediately.',
    });
  }

  if (!isRainSeason && temp < 24) {
    alerts.push({
      title: 'Cold Water Alert',
      desc: 'Water temperature may drop below 24°C at night. Shrimp feeding reduces significantly.',
      type: 'warning',
      aqAction: 'Reduce feed by 10%. Monitor morning water temp before first feed.',
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      title: 'All Clear — Optimal Aquaculture Conditions',
      desc: 'Weather conditions are within SOP parameters. Current temperature and conditions are suitable for shrimp culture.',
      type: 'info',
      aqAction: 'Continue standard SOP. Good time for medicine / mineral application.',
    });
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : days[d.getDay()];
    const rainPct = isRainSeason ? Math.round(30 + Math.random() * 55) : Math.round(5 + Math.random() * 25);
    const hi = Math.round(temp + Math.random() * 3 - 1);
    const lo = Math.round(hi - 6 - Math.random() * 4);
    const icon = rainPct > 60 ? 'storm' : rainPct > 35 ? 'rain' : hi >= 36 ? 'hot' : 'sunny';
    const aqImpact = rainPct > 60 ? 'Reduce feed' : rainPct > 35 ? 'Monitor salinity' : hi >= 36 ? 'Skip noon feed' : 'SOP Normal';
    return { day: dayName, high: hi, low: lo, rainChance: rainPct, icon, aqImpact };
  });

  return {
    temp, feelsLike, humidity, windSpeed: Math.round(8 + Math.random() * 18),
    windDir: ['NE', 'N', 'NW', 'E', 'SE', 'S', 'SW', 'W'][Math.floor(Math.random() * 8)],
    uvIndex: Math.round(2 + Math.random() * 8),
    condition: conditionMap[conditionCode],
    conditionCode,
    rainChance,
    alerts,
    forecast,
    lunarPhase: lunarPhaseLabel,
    airQuality: Math.round(30 + Math.random() * 70),
  };
};
