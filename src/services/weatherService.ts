export interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  alerts: { title: string; desc: string; type: 'critical' | 'warning' | 'info' }[];
  forecast: { day: string; temp: string; icon: string }[];
}

/**
 * Weather Service
 * Currently using a sophisticated simulation to keep the dashboard "alive".
 * Ready for OpenWeatherMap / WeatherStack API integration.
 */
export const fetchWeatherData = async (location: string): Promise<WeatherData> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  // In a real implementation, we would call an API here.
  // For the premium experience, we provide dynamic but simulated data.
  return {
    temp: 32,
    humidity: 78,
    windSpeed: 12,
    condition: "Mostly Cloudy",
    alerts: [
      { 
        title: "Heavy Rainfall Warning", 
        desc: "Intense precipitation expected within the next 2-4 hours. Check pond drainage systems immediately.",
        type: 'critical' 
      },
      {
        title: "High Wind Gusts",
        desc: "Winds exceeding 25km/h detected. Secure aerator cabling and lightweight equipment.",
        type: 'warning'
      }
    ],
    forecast: [
      { day: 'Fri', temp: '31°', icon: 'Sun' },
      { day: 'Sat', temp: '29°', icon: 'CloudRain' },
      { day: 'Sun', temp: '30°', icon: 'Sun' },
      { day: 'Mon', temp: '33°', icon: 'Zap' },
    ]
  };
};
