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
  airQuality: number;
  location: string;
}

// ─── OpenWeatherMap API key ───────────────────────────────────────────────────
const OWM_API_KEY = '02eb92440f84d48b0d5df34e44540cb1';
const OWM_BASE    = 'https://api.openweathermap.org/data/2.5';

// ─── Map OWM weather id → our condition code ─────────────────────────────────
const mapConditionCode = (id: number, temp: number): WeatherData['conditionCode'] => {
  if (id >= 200 && id < 300) return 'storm';
  if (id >= 300 && id < 600) return 'rain';
  if (id >= 600 && id < 700) return 'fog';  // snow/sleet
  if (id >= 700 && id < 800) return 'fog';
  if (id === 800) return temp >= 36 ? 'hot' : 'sunny';
  if (id > 800)  return 'cloudy';
  return 'sunny';
};

// ─── Compass direction from degree ───────────────────────────────────────────
const degToCompass = (deg: number): string => {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
};

// ─── Build aquaculture alerts from live weather ───────────────────────────────
const buildAlerts = (
  temp: number, rainPct: number, humidity: number, windKmh: number, hour: number
): WeatherData['alerts'] => {
  const alerts: WeatherData['alerts'] = [];

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
      desc: 'Above optimal range (26–30°C). Increase aeration and monitor DO.',
      type: 'warning',
      aqAction: 'Reduce noon feed by 15%. Check DO at 3 PM.',
    });
  }

  if (rainPct > 70) {
    alerts.push({
      title: 'Heavy Rainfall Warning',
      desc: 'Intense rainfall likely. Salinity may drop sharply. Check pond drainage.',
      type: 'critical',
      aqAction: 'Reduce feed 20%. Run all aerators. Check salinity after rain stops.',
    });
  } else if (rainPct > 40) {
    alerts.push({
      title: 'Rain Expected',
      desc: 'Moderate rain probability. Monitor pond water exchange and salinity.',
      type: 'warning',
      aqAction: 'Reduce feed 10%. Monitor DO and pH after rainfall.',
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

  if (windKmh > 40) {
    alerts.push({
      title: `High Wind Alert — ${windKmh} km/h`,
      desc: 'Strong winds can disturb pond surface and cause wave-stress on shrimp.',
      type: 'warning',
      aqAction: 'Reduce feeding in windy slots. Increase aerator coverage.',
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      title: 'All Clear — Optimal Aquaculture Conditions',
      desc: 'Weather conditions are within SOP parameters. Suitable for shrimp culture.',
      type: 'info',
      aqAction: 'Continue standard SOP. Good time for medicine / mineral application.',
    });
  }

  return alerts;
};

// ─── Lunar simulation (calendar-based) ───────────────────────────────────────
const getLunarPhaseLabel = (): string => {
  const lunarDay = Math.floor(new Date().getDate() % 30);
  if (lunarDay === 0 || lunarDay === 29) return '🌑 Amavasya (New Moon)';
  if (lunarDay === 14 || lunarDay === 15) return '🌕 Pournami (Full Moon)';
  if (lunarDay === 7)  return '🌓 Ashtami (Half Moon)';
  if (lunarDay === 8)  return '🌙 Navami';
  return '🌙 Waxing Moon';
};

// ─── Fallback simulation (used if API fails) ─────────────────────────────────
const getFallbackData = (): WeatherData => {
  const now   = new Date();
  const hour  = now.getHours();
  const month = now.getMonth() + 1;
  const baseTemp = month >= 3 && month <= 5 ? 35 : month >= 6 && month <= 9 ? 30 : month >= 10 && month <= 11 ? 27 : 24;
  const diurnalDelta = hour < 6 ? -5 : hour < 10 ? -2 : hour < 14 ? 0 : hour < 18 ? 2 : 0;
  const temp = baseTemp + diurnalDelta;
  const feelsLike = temp + (month >= 6 && month <= 9 ? 3 : 1);
  const humidity = month >= 6 && month <= 9 ? 82 : month >= 3 && month <= 5 ? 55 : 65;
  const isRainSeason = month >= 6 && month <= 9;
  const rainChance = isRainSeason ? (hour >= 12 && hour <= 18 ? 72 : 45) : 15;
  const conditionCode: WeatherData['conditionCode'] = isRainSeason ? (rainChance > 60 ? 'storm' : 'rain') : temp >= 36 ? 'hot' : hour < 7 || hour > 18 ? 'cloudy' : 'sunny';
  const conditionMap: Record<string, string> = { sunny: 'Sunny & Clear', cloudy: 'Mostly Cloudy', rain: 'Light Showers', storm: 'Heavy Rain Risk', fog: 'Morning Fog', hot: 'Extreme Heat' };
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() + i);
    const rainPct = isRainSeason ? Math.round(30 + Math.random() * 55) : Math.round(5 + Math.random() * 25);
    const hi = Math.round(temp + Math.random() * 3 - 1);
    const lo = Math.round(hi - 6 - Math.random() * 4);
    const icon = rainPct > 60 ? 'storm' : rainPct > 35 ? 'rain' : hi >= 36 ? 'hot' : 'sunny';
    return { day: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : days[d.getDay()], high: hi, low: lo, rainChance: rainPct, icon, aqImpact: rainPct > 60 ? 'Reduce feed' : hi >= 36 ? 'Skip noon feed' : 'SOP Normal' };
  });
  return {
    temp, feelsLike, humidity,
    windSpeed: Math.round(8 + Math.random() * 18),
    windDir: ['NE','N','NW','E','SE','S','SW','W'][Math.floor(Math.random() * 8)],
    uvIndex: Math.round(2 + Math.random() * 8),
    condition: conditionMap[conditionCode],
    conditionCode,
    rainChance,
    alerts: buildAlerts(temp, rainChance, humidity, 12, hour),
    forecast,
    lunarPhase: getLunarPhaseLabel(),
    airQuality: Math.round(30 + Math.random() * 70),
    location: 'Hyderabad',
  };
};

// ─── Main weather fetch: tries live OWM API, falls back to simulation ─────────
export const fetchWeatherData = async (location: string = 'Hyderabad'): Promise<WeatherData> => {
  // Resolve city name — default to Hyderabad if generic string passed
  const city = (!location || location.toLowerCase() === 'current location') ? 'Hyderabad' : location;

  try {
    const url = `${OWM_BASE}/weather?q=${encodeURIComponent(city)}&appid=${OWM_API_KEY}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OWM API ${res.status}`);
    const d = await res.json();

    const temp       = Math.round(d.main.temp);
    const feelsLike  = Math.round(d.main.feels_like);
    const humidity   = d.main.humidity;
    const windKmh    = Math.round((d.wind?.speed || 0) * 3.6);
    const windDir    = degToCompass(d.wind?.deg || 0);
    const weatherId  = d.weather?.[0]?.id || 800;
    const condCode   = mapConditionCode(weatherId, temp);
    const condName   = d.weather?.[0]?.description
      ? d.weather[0].description.replace(/^\w/, (c: string) => c.toUpperCase())
      : 'Clear';
    const hour       = new Date().getHours();

    // OWM free tier doesn't give rain %, so estimate from conditions
    const rainPct = condCode === 'storm' ? 85 : condCode === 'rain' ? 60 : condCode === 'cloudy' ? 20 : 5;

    // Build simple 7-day forecast (simulated with variation around live temp)
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const now  = new Date();
    const forecast = Array.from({ length: 7 }, (_, i) => {
      const d2 = new Date(now); d2.setDate(d2.getDate() + i);
      const rp  = Math.max(0, rainPct + Math.round(Math.random() * 30 - 15));
      const hi  = temp + Math.round(Math.random() * 3 - 1);
      const lo  = hi - Math.round(5 + Math.random() * 4);
      const icon = rp > 60 ? 'storm' : rp > 35 ? 'rain' : hi >= 36 ? 'hot' : 'sunny';
      return {
        day: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : days[d2.getDay()],
        high: hi, low: lo, rainChance: rp, icon,
        aqImpact: rp > 60 ? 'Reduce feed' : hi >= 36 ? 'Skip noon feed' : 'SOP Normal',
      };
    });

    return {
      temp, feelsLike, humidity,
      windSpeed: windKmh,
      windDir,
      uvIndex: Math.round(2 + Math.random() * 8),  // OWM free tier no UV
      condition: condName,
      conditionCode: condCode,
      rainChance: rainPct,
      alerts: buildAlerts(temp, rainPct, humidity, windKmh, hour),
      forecast,
      lunarPhase: getLunarPhaseLabel(),
      airQuality: Math.round(30 + Math.random() * 70),
      location: `${d.name}, ${d.sys?.country || 'IN'}`,
    };

  } catch (err) {
    console.warn('[WeatherService] OWM API failed, using simulation:', err);
    return getFallbackData();
  }
};

// ─── Get farmer's saved location (fallback: Nellore) ──────────────────────────
export const getUserLocation = (): string => {
  try {
    const raw = localStorage.getItem('aqua_user');
    if (!raw) return 'Nellore';
    const u = JSON.parse(raw);
    return u?.location || 'Nellore';
  } catch { return 'Nellore'; }
};

// ─── Client-side weather push trigger ────────────────────────────────────────
// Called from WeatherAlerts.tsx when critical/warning weather is detected.
// Posts to POST /api/push/weather-alert → server fires FCM immediately.
// Cools down using sessionStorage to avoid re-triggering on every re-render.
export const sendWeatherPushAlert = async (
  alert: { title: string; desc: string; aqAction: string; type: 'critical' | 'warning' | 'info' },
  weather: WeatherData,
): Promise<void> => {
  // 3-hour suppress key per alert title per session
  const suppressKey = `wx_push_${alert.title.replace(/\s+/g, '_')}`;
  const lastSent = Number(sessionStorage.getItem(suppressKey) || '0');
  if (Date.now() - lastSent < 3 * 60 * 60 * 1000) return; // already sent in last 3h

  try {
    const raw = localStorage.getItem('aqua_tokens');
    if (!raw) return;
    const tokens = JSON.parse(raw);
    const token = tokens?.access || tokens?.accessToken || '';
    if (!token) return;

    const apiBase = (window as any).__VITE_API_BASE__ || 'https://aquagrow.onrender.com/api';
    const res = await fetch(`${apiBase}/push/weather-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        alertTitle:    alert.title,
        alertBody:     alert.desc,
        aqAction:      alert.aqAction,
        alertType:     alert.type,
        location:      weather.location,
        conditionCode: weather.conditionCode,
        temp:          weather.temp,
        rainPct:       weather.rainChance,
      }),
    });
    if (res.ok) {
      sessionStorage.setItem(suppressKey, String(Date.now()));
      console.log(`[WeatherPush] Triggered FCM for: ${alert.title}`);
    }
  } catch (e) {
    console.warn('[WeatherPush] Failed to trigger FCM:', e);
  }
};
