/**
 * FishCast Prediction Service — ProFish
 *
 * Weighted scoring algorithm for fishing activity prediction.
 * Ported from ProHunt's huntPredictionService concept.
 *
 * Factors: weather, pressure, wind, moon phase, solunar periods,
 *          tide state, water temperature, time of day
 *
 * Score: 0-100, with labels: Poor / Fair / Good / Very Good / Excellent
 */

import weatherService from './weatherService';
import solunarService from './solunarService';
import tideService from './tideService';
import cacheService from './cacheService';

const FISHCAST_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ── Scoring weights ─────────────────────────────────────
const WEIGHTS = {
  pressure: 0.2, // Barometric pressure trend
  moonPhase: 0.15, // New/Full moon = best
  solunarPeriod: 0.15, // Major/minor feeding periods
  wind: 0.12, // Light wind = better
  timeOfDay: 0.12, // Dawn/dusk = best
  cloudCover: 0.08, // Overcast = slightly better
  precipitation: 0.08, // Light rain = good, heavy = bad
  tideState: 0.1, // Moving water = better (if coastal)
};

/**
 * Calculate FishCast score for a location and time
 * Returns: { score: 0-100, label: string, factors: {...}, forecast: [...] }
 */
export async function calculateFishCast(
  latitude,
  longitude,
  date = new Date(),
) {
  // Cache by location + hour (score doesn't change minute by minute)
  const hourKey = `${date.getFullYear()}${date.getMonth()}${date.getDate()}${date.getHours()}`;
  const cacheKey = cacheService.coordKey(
    'fishcast_' + hourKey,
    latitude,
    longitude,
  );
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const [weather, solunar, tide] = await Promise.all([
      weatherService.getWeather(latitude, longitude),
      Promise.resolve(
        solunarService.getSolunarPeriods(latitude, longitude, date),
      ),
      tideService.getCurrentTideState(latitude, longitude).catch(() => null),
    ]);

    const factors = {};

    // 1. Barometric pressure
    factors.pressure = scorePressure(weather.pressureMsl);

    // 2. Moon phase
    factors.moonPhase = solunar.moonPhase.fishingRating * 20; // 1-5 → 20-100

    // 3. Solunar period
    factors.solunarPeriod = scoreSolunarPeriod(date, solunar);

    // 4. Wind
    factors.wind = scoreWind(weather.windSpeed);

    // 5. Time of day
    factors.timeOfDay = scoreTimeOfDay(date, weather.sunrise, weather.sunset);

    // 6. Cloud cover
    factors.cloudCover = scoreCloudCover(weather.cloudCover);

    // 7. Precipitation
    factors.precipitation = scorePrecipitation(weather.precipitation);

    // 8. Tide state
    factors.tideState = tide ? scoreTideState(tide) : 50; // Neutral if no tide data

    // Weighted total
    let score = 0;
    for (const [key, weight] of Object.entries(WEIGHTS)) {
      score += (factors[key] || 50) * weight;
    }

    score = Math.round(Math.max(0, Math.min(100, score)));

    const result = {
      score,
      label: getScoreLabel(score),
      factors,
      weather: {
        temp: weather.temperature,
        wind: weather.windSpeed,
        pressure: weather.pressureMsl,
        description: weather.description,
      },
      solunar: {
        moonPhase: solunar.moonPhase.name,
        illumination: solunar.moonPhase.illumination,
        majorPeriods: solunar.major,
        minorPeriods: solunar.minor,
      },
      tide: tide || null,
      calculatedAt: new Date().toISOString(),
    };

    // Cache for 1hr
    await cacheService.set(cacheKey, result, FISHCAST_CACHE_TTL);

    return result;
  } catch (error) {
    console.warn('[FishCast] Calculation failed:', error);
    return {
      score: 50,
      label: 'Fair',
      error: error.message,
      calculatedAt: new Date().toISOString(),
    };
  }
}

// ── Scoring functions ──────────────────────────────────

function scorePressure(pressure) {
  if (!pressure) return 50;
  // Ideal fishing pressure: 1013-1023 hPa (stable/rising)
  if (pressure >= 1013 && pressure <= 1023) return 90;
  if (pressure >= 1005 && pressure < 1013) return 70; // Falling — fish active before front
  if (pressure > 1023 && pressure <= 1030) return 60; // High — stable but slower
  if (pressure < 1005) return 40; // Low pressure — storm
  if (pressure > 1030) return 30; // Very high — sluggish fish
  return 50;
}

function scoreSolunarPeriod(date, solunar) {
  const now = date.getTime();

  // Check if we're in a major period
  for (const period of solunar.major) {
    if (
      now >= new Date(period.start).getTime() &&
      now <= new Date(period.end).getTime()
    ) {
      return 95;
    }
  }

  // Check if we're in a minor period
  for (const period of solunar.minor) {
    if (
      now >= new Date(period.start).getTime() &&
      now <= new Date(period.end).getTime()
    ) {
      return 75;
    }
  }

  return 40; // Outside solunar periods
}

function scoreWind(windSpeed) {
  if (windSpeed === null || windSpeed === undefined) return 50;
  if (windSpeed <= 5) return 85; // Light breeze — ideal
  if (windSpeed <= 12) return 75; // Moderate — good ripple
  if (windSpeed <= 20) return 55; // Breezy — still fishable
  if (windSpeed <= 30) return 30; // Strong — tough conditions
  return 10; // Storm
}

function scoreTimeOfDay(date, sunrise, sunset) {
  const hours = date.getHours();
  // Dawn (1hr before to 2hr after sunrise) and dusk (2hr before to 1hr after sunset)
  if (hours >= 4 && hours <= 8) return 90; // Dawn — peak
  if (hours >= 17 && hours <= 21) return 85; // Dusk — peak
  if (hours >= 8 && hours <= 10) return 65; // Late morning
  if (hours >= 15 && hours <= 17) return 65; // Afternoon
  if (hours >= 21 || hours <= 4) return 50; // Night — varies by species
  return 40; // Midday — slowest
}

function scoreCloudCover(cloudCover) {
  if (cloudCover === null || cloudCover === undefined) return 50;
  if (cloudCover >= 50 && cloudCover <= 80) return 80; // Overcast — ideal
  if (cloudCover >= 30 && cloudCover < 50) return 65; // Partly cloudy — good
  if (cloudCover > 80) return 60; // Heavy cloud
  return 40; // Clear sky — fish see you
}

function scorePrecipitation(precip) {
  if (!precip || precip === 0) return 60; // Dry — normal
  if (precip > 0 && precip <= 2) return 85; // Light rain — excellent!
  if (precip > 2 && precip <= 5) return 65; // Moderate rain — good
  if (precip > 5 && precip <= 10) return 40; // Heavy rain
  return 20; // Downpour — pack up
}

function scoreTideState(tide) {
  if (!tide || tide.state === 'unknown') return 50;
  if (tide.state === 'rising' && tide.progress >= 30 && tide.progress <= 70)
    return 90; // Mid-rising — BEST
  if (tide.state === 'falling' && tide.progress >= 30 && tide.progress <= 70)
    return 80; // Mid-falling — good
  if (tide.progress < 15 || tide.progress > 85) return 40; // Slack tide — slow
  return 60;
}

function getScoreLabel(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Very Good';
  if (score >= 55) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

/**
 * Calculate 7-day FishCast outlook using Open-Meteo daily forecast data.
 * Returns an array of { date, dayName, score, label, highTemp, lowTemp, icon }.
 */
export async function calculate7DayOutlook(latitude, longitude) {
  const cacheKey = cacheService.coordKey('fishcast_7day', latitude, longitude);
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,pressure_msl_max,pressure_msl_min,cloud_cover_mean,weather_code&forecast_days=7&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('7-day forecast API error');

    const data = await response.json();
    const daily = data.daily;
    if (!daily || !daily.time) return [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const solunar = await import('./solunarService').then(m => m.default);

    const outlook = daily.time.map((dateStr, i) => {
      const date = new Date(dateStr);
      const dayName = dayNames[date.getDay()];

      // Simplified scoring for daily overview
      const pressureAvg =
        ((daily.pressure_msl_max?.[i] || 1013) +
          (daily.pressure_msl_min?.[i] || 1013)) /
        2;
      const pScore = scorePressure(pressureAvg);
      const wScore = scoreWind(daily.wind_speed_10m_max?.[i] || 10);
      const cScore = scoreCloudCover(daily.cloud_cover_mean?.[i] || 50);
      const rScore = scorePrecipitation(daily.precipitation_sum?.[i] || 0);

      // Get moon phase for each day
      let moonScore = 50;
      try {
        const sol = solunar.getSolunarPeriods(latitude, longitude, date);
        moonScore = (sol.moonPhase?.fishingRating || 3) * 20;
      } catch {}

      // Dawn/dusk bonus averaged across day
      const todScore = 60;

      const score = Math.round(
        pScore * WEIGHTS.pressure +
          moonScore * WEIGHTS.moonPhase +
          60 * WEIGHTS.solunarPeriod + // average solunar for day
          wScore * WEIGHTS.wind +
          todScore * WEIGHTS.timeOfDay +
          cScore * WEIGHTS.cloudCover +
          rScore * WEIGHTS.precipitation +
          50 * WEIGHTS.tideState, // neutral tide for daily
      );

      return {
        date: dateStr,
        dayName,
        score: Math.max(0, Math.min(100, score)),
        label: getScoreLabel(Math.max(0, Math.min(100, score))),
        highTemp: Math.round(daily.temperature_2m_max?.[i] || 0),
        lowTemp: Math.round(daily.temperature_2m_min?.[i] || 0),
        weatherCode: daily.weather_code?.[i] || 0,
        icon: getWeatherEmoji(daily.weather_code?.[i] || 0),
      };
    });

    await cacheService.set(cacheKey, outlook, 4 * 60 * 60 * 1000); // 4hr cache
    return outlook;
  } catch (error) {
    console.warn('[FishCast] 7-day outlook error:', error);
    return [];
  }
}

function getWeatherEmoji(code) {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌦️';
  if (code <= 65) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌧️';
  return '⛈️';
}

// ── Species-Specific Adjustments ─────────────────────
// Each species has preferred conditions that modify the base score
const SPECIES_ADJUSTMENTS = {
  // Bass prefer low pressure, warm water, overcast
  'largemouth bass': {
    pressure: p => (p < 1010 ? 1.2 : p > 1020 ? 0.8 : 1.0),
    wind: w => (w <= 10 ? 1.1 : w > 25 ? 0.7 : 1.0),
    timeOfDay: h => ((h >= 5 && h <= 9) || (h >= 17 && h <= 21) ? 1.2 : 0.9),
    cloudCover: c => (c >= 60 ? 1.15 : c < 20 ? 0.8 : 1.0),
    idealWaterTemp: [18, 27], // °C
  },
  'smallmouth bass': {
    pressure: p => (p < 1010 ? 1.15 : 1.0),
    wind: w => (w >= 5 && w <= 15 ? 1.1 : 1.0),
    timeOfDay: h => ((h >= 5 && h <= 10) || (h >= 16 && h <= 20) ? 1.15 : 0.9),
    idealWaterTemp: [15, 22],
  },
  trout: {
    pressure: p => (p >= 1010 && p <= 1020 ? 1.1 : 1.0),
    wind: w => (w <= 8 ? 1.15 : w > 20 ? 0.7 : 1.0),
    timeOfDay: h => ((h >= 5 && h <= 9) || (h >= 16 && h <= 19) ? 1.2 : 0.85),
    cloudCover: c => (c >= 50 ? 1.15 : 1.0),
    idealWaterTemp: [7, 16], // Prefer cold water
  },
  'rainbow trout': {
    pressure: p => (p >= 1010 && p <= 1020 ? 1.1 : 1.0),
    wind: w => (w <= 8 ? 1.15 : 1.0),
    timeOfDay: h => (h >= 5 && h <= 9 ? 1.2 : 0.9),
    idealWaterTemp: [7, 16],
  },
  salmon: {
    pressure: p => (p >= 1005 && p <= 1015 ? 1.15 : 1.0),
    tideState: t =>
      t?.state === 'rising' ? 1.2 : t?.state === 'falling' ? 0.9 : 1.0,
    timeOfDay: h => ((h >= 4 && h <= 8) || (h >= 16 && h <= 20) ? 1.15 : 0.85),
    idealWaterTemp: [8, 15],
  },
  pike: {
    pressure: p => (p < 1010 ? 1.2 : 1.0),
    wind: w => (w >= 5 && w <= 18 ? 1.1 : 1.0),
    cloudCover: c => (c >= 60 ? 1.15 : c < 20 ? 0.75 : 1.0),
    timeOfDay: h => ((h >= 6 && h <= 10) || (h >= 15 && h <= 19) ? 1.15 : 0.9),
    idealWaterTemp: [10, 21],
  },
  walleye: {
    timeOfDay: h => ((h >= 17 && h <= 23) || (h >= 0 && h <= 6) ? 1.25 : 0.85),
    cloudCover: c => (c >= 70 ? 1.2 : c < 30 ? 0.7 : 1.0),
    wind: w => (w >= 5 && w <= 15 ? 1.15 : 1.0),
    idealWaterTemp: [10, 18],
  },
  catfish: {
    timeOfDay: h => (h >= 19 || h <= 5 ? 1.3 : 0.8), // Nocturnal feeders
    pressure: p => (p < 1010 ? 1.15 : 1.0),
    precipitation: r => (r > 0 && r <= 5 ? 1.2 : 1.0), // Love rain
    idealWaterTemp: [21, 29],
  },
  redfish: {
    tideState: t =>
      t?.state === 'falling' ? 1.2 : t?.state === 'rising' ? 1.1 : 0.9,
    timeOfDay: h => ((h >= 5 && h <= 9) || (h >= 16 && h <= 20) ? 1.15 : 0.9),
    cloudCover: c => (c >= 40 ? 1.1 : 1.0),
    idealWaterTemp: [18, 28],
  },
  tarpon: {
    tideState: t => (t?.state === 'rising' ? 1.25 : 0.9),
    timeOfDay: h => (h >= 5 && h <= 9 ? 1.2 : 0.9),
    pressure: p => (p >= 1010 && p <= 1020 ? 1.1 : 1.0),
    idealWaterTemp: [24, 32],
  },
  snook: {
    tideState: t => (t?.progress >= 30 && t?.progress <= 70 ? 1.2 : 0.9),
    timeOfDay: h => ((h >= 17 && h <= 22) || (h >= 4 && h <= 7) ? 1.2 : 0.85),
    idealWaterTemp: [22, 30],
  },
  tuna: {
    tideState: t => (t?.state === 'rising' ? 1.15 : 1.0),
    wind: w => (w >= 5 && w <= 20 ? 1.1 : w > 30 ? 0.6 : 1.0),
    timeOfDay: h => (h >= 5 && h <= 10 ? 1.15 : 0.9),
    idealWaterTemp: [18, 28],
  },
  'mahi-mahi': {
    cloudCover: c => (c < 40 ? 1.15 : 1.0), // Prefer clear skies
    wind: w => (w >= 8 && w <= 20 ? 1.1 : 1.0),
    idealWaterTemp: [21, 30],
  },
};

/**
 * Apply species-specific adjustments to a base FishCast score.
 * Returns adjusted score + species insight text.
 */
export function adjustScoreForSpecies(baseResult, species, waterTemp = null) {
  if (!species) return baseResult;
  const key = species.toLowerCase();
  const adj =
    SPECIES_ADJUSTMENTS[key] ||
    // Try partial match
    Object.entries(SPECIES_ADJUSTMENTS).find(
      ([k]) => key.includes(k) || k.includes(key),
    )?.[1];

  if (!adj) return baseResult;

  let multiplier = 1.0;
  const insights = [];

  // Apply condition modifiers
  if (adj.pressure && baseResult.weather?.pressure) {
    const m = adj.pressure(baseResult.weather.pressure);
    multiplier *= m;
    if (m > 1.05) insights.push('Pressure favors this species');
  }
  if (adj.wind && baseResult.weather?.wind != null) {
    const m = adj.wind(baseResult.weather.wind);
    multiplier *= m;
  }
  if (adj.timeOfDay) {
    const hour = new Date().getHours();
    const m = adj.timeOfDay(hour);
    multiplier *= m;
    if (m > 1.1) insights.push('Prime time for this species');
  }
  if (adj.cloudCover && baseResult.factors?.cloudCover != null) {
    // Reverse-engineer cloud cover from factor score (rough)
    const c = baseResult.factors.cloudCover > 70 ? 65 : 30;
    const m = adj.cloudCover(c);
    multiplier *= m;
  }
  if (adj.tideState && baseResult.tide) {
    const m = adj.tideState(baseResult.tide);
    multiplier *= m;
    if (m > 1.1) insights.push('Tide is ideal for this species');
  }
  if (adj.precipitation && baseResult.weather) {
    // Rough check
    const m = adj.precipitation(baseResult.factors?.precipitation > 70 ? 2 : 0);
    multiplier *= m;
  }

  // Water temperature bonus/penalty
  if (adj.idealWaterTemp && waterTemp != null) {
    const [min, max] = adj.idealWaterTemp;
    if (waterTemp >= min && waterTemp <= max) {
      multiplier *= 1.1;
      insights.push(`Water temp ${waterTemp}°C is in the ideal range`);
    } else if (waterTemp < min - 5 || waterTemp > max + 5) {
      multiplier *= 0.8;
      insights.push(`Water temp ${waterTemp}°C is outside preferred range`);
    }
  }

  const adjustedScore = Math.round(
    Math.max(0, Math.min(100, baseResult.score * multiplier)),
  );

  return {
    ...baseResult,
    score: adjustedScore,
    label: getScoreLabel(adjustedScore),
    speciesAdjusted: true,
    speciesName: species,
    speciesInsights: insights,
    originalScore: baseResult.score,
  };
}

/**
 * Location-aware FishCast — auto-detect GPS and calculate for current position.
 * Returns the base result enriched with location metadata.
 */
export async function calculateFishCastForCurrentLocation(getCurrentPosition) {
  return new Promise((resolve, reject) => {
    const fallback = async () => {
      // Default to a general location if GPS fails
      const result = await calculateFishCast(59.33, 18.07);
      resolve({
        ...result,
        locationSource: 'default',
        locationName: 'Stockholm',
      });
    };

    if (!getCurrentPosition) return fallback();

    getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;
          const result = await calculateFishCast(latitude, longitude);

          // Reverse geocode for location name (optional, best-effort)
          let locationName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          try {
            const resp = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`,
            );
            const data = await resp.json();
            if (data.timezone) {
              locationName =
                data.timezone.split('/').pop().replace(/_/g, ' ') ||
                locationName;
            }
          } catch {}

          resolve({
            ...result,
            locationSource: 'gps',
            latitude,
            longitude,
            locationName,
          });
        } catch (e) {
          reject(e);
        }
      },
      () => fallback(),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

export default {
  calculateFishCast,
  calculate7DayOutlook,
  adjustScoreForSpecies,
  calculateFishCastForCurrentLocation,
  SPECIES_ADJUSTMENTS,
};
