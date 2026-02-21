/**
 * Weather Service — ProFish
 * Fetches real-time weather + marine data from Open-Meteo API (FREE)
 *
 * Includes: pressure, wind, wave height (marine), cloud cover
 * Used for: FishCast scoring, weather HUD, wind arrows
 * Cache: 1hr for current weather, 4hr for marine
 */

import cacheService from './cacheService';

const WEATHER_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const MARINE_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours
const FULL_WEATHER_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const weatherService = {
  /**
   * Fetch weather for coordinates (current conditions + pressure)
   */
  async getWeather(latitude, longitude) {
    const cacheKey = cacheService.coordKey('weather', latitude, longitude);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover,pressure_msl,surface_pressure&daily=sunrise,sunset&timezone=auto`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch weather');
      }

      const data = await response.json();
      const current = data.current;

      const result = {
        temperature: Math.round(current.temperature_2m),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        windDirection: current.wind_direction_10m ?? 0,
        precipitation: current.precipitation ?? 0,
        cloudCover: current.cloud_cover,
        apparentTemp: Math.round(current.apparent_temperature),
        weatherCode: current.weather_code,
        pressureMsl: current.pressure_msl ?? null,
        surfacePressure: current.surface_pressure ?? null,
        description: this.getWeatherDescription(current.weather_code),
        sunrise: data.daily?.sunrise?.[0] ?? null,
        sunset: data.daily?.sunset?.[0] ?? null,
        fetchedAt: new Date().toISOString(),
      };

      // Cache result
      await cacheService.set(cacheKey, result, WEATHER_CACHE_TTL);
      // Keep a stale copy for offline fallback (24hr)
      await cacheService.set(cacheKey + '_stale', result, 24 * 60 * 60 * 1000);

      return result;
    } catch (error) {
      // Try returning stale cache on network error
      const stale = await cacheService.get(cacheKey + '_stale');
      if (stale) return { ...stale, _stale: true };
      throw new Error(`Failed to get weather: ${error.message}`);
    }
  },

  /**
   * Fetch marine weather (wave height, sea temp, currents)
   * Only for coastal/ocean coordinates
   */
  async getMarineWeather(latitude, longitude) {
    const cacheKey = cacheService.coordKey('marine', latitude, longitude);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&current=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction&hourly=wave_height,wave_direction,wave_period&timezone=auto`;

      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.json();
      const current = data.current;

      const result = {
        waveHeight: current?.wave_height ?? null,
        waveDirection: current?.wave_direction ?? null,
        wavePeriod: current?.wave_period ?? null,
        swellHeight: current?.swell_wave_height ?? null,
        swellDirection: current?.swell_wave_direction ?? null,
        fetchedAt: new Date().toISOString(),
      };

      await cacheService.set(cacheKey, result, MARINE_CACHE_TTL);
      return result;
    } catch {
      return null;
    }
  },

  /**
   * Get full weather data for FishCast scoring
   */
  async getWeatherData(latitude, longitude) {
    const cacheKey = cacheService.coordKey('weatherfull', latitude, longitude);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure&daily=sunrise,sunset&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,pressure_msl,cloud_cover&forecast_days=16&timezone=auto`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Weather API error');

      const result = await response.json();
      await cacheService.set(cacheKey, result, FULL_WEATHER_CACHE_TTL);
      return result;
    } catch (error) {
      const stale = await cacheService.get(cacheKey + '_stale');
      if (stale) return stale;
      throw new Error(`Failed to get weather data: ${error.message}`);
    }
  },

  /**
   * Get weather description from WMO weather code
   */
  getWeatherDescription(code) {
    const descriptions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail',
    };
    return descriptions[code] || 'Unknown';
  },
};

export default weatherService;
