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

    return {
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

export default { calculateFishCast };
