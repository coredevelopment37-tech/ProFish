/**
 * ML Best Conditions Service — ProFish (#392)
 *
 * Machine learning model that predicts optimal fishing conditions
 * based on historical catch data, weather, tides, and location.
 *
 * Phase 1: Rule-based scoring with weighted factors
 * Phase 2: TFLite on-device model trained on anonymized catch data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Scoring Weights ──────────────────────────────────────

const WEIGHTS = {
  // Weather factors
  barometric_pressure: 0.15,
  wind_speed: 0.1,
  temperature: 0.08,
  cloud_cover: 0.06,
  precipitation: 0.04,

  // Water factors
  water_temp: 0.12,
  tide_phase: 0.1,
  moon_phase: 0.08,
  current_speed: 0.05,

  // Time factors
  time_of_day: 0.1,
  season: 0.06,

  // Historical
  historical_success: 0.06,
};

// ── Ideal Condition Ranges per Category ──────────────────

const IDEAL_CONDITIONS = {
  freshwater: {
    barometric_pressure: { min: 29.8, max: 30.2, unit: 'inHg' },
    wind_speed: { min: 3, max: 12, unit: 'mph' },
    temperature: { min: 55, max: 80, unit: '°F' },
    water_temp: { min: 55, max: 75, unit: '°F' },
  },
  saltwater: {
    barometric_pressure: { min: 29.7, max: 30.3, unit: 'inHg' },
    wind_speed: { min: 5, max: 15, unit: 'mph' },
    temperature: { min: 60, max: 90, unit: '°F' },
    water_temp: { min: 60, max: 82, unit: '°F' },
  },
};

// ── Time-of-Day Scoring ──────────────────────────────────

function timeOfDayScore(hour) {
  // Dawn (5-7) and dusk (17-19) are best
  if (hour >= 5 && hour <= 7) return 1.0;
  if (hour >= 17 && hour <= 19) return 1.0;
  // Early morning (7-9) and late evening (19-21) are good
  if (hour >= 7 && hour <= 9) return 0.8;
  if (hour >= 19 && hour <= 21) return 0.7;
  // Midday is worst
  if (hour >= 11 && hour <= 14) return 0.3;
  return 0.5;
}

// ── Moon Phase Scoring ───────────────────────────────────

function moonPhaseScore(phase) {
  // 0 = new moon, 0.5 = full moon
  // Major: full (0.5) and new (0/1) are best
  // Minor: quarters (0.25, 0.75) are decent
  const distToMajor = Math.min(
    Math.abs(phase),
    Math.abs(phase - 0.5),
    Math.abs(phase - 1),
  );
  if (distToMajor < 0.05) return 1.0; // Major period
  if (distToMajor < 0.1) return 0.8;
  const distToMinor = Math.min(Math.abs(phase - 0.25), Math.abs(phase - 0.75));
  if (distToMinor < 0.05) return 0.7; // Minor period
  return 0.4;
}

// ── Tide Phase Scoring ───────────────────────────────────

function tidePhaseScore(phase) {
  // 'incoming' / 'moving' tides are best
  const scores = {
    incoming: 1.0,
    outgoing: 0.8,
    high: 0.5,
    low: 0.4,
    slack: 0.3,
  };
  return scores[phase] || 0.5;
}

// ── Range Scoring ────────────────────────────────────────

function rangeScore(value, min, max) {
  if (value >= min && value <= max) return 1.0;
  const range = max - min;
  const dist = value < min ? min - value : value - max;
  const penalty = dist / (range * 0.5);
  return Math.max(0, 1 - penalty);
}

// ── Barometric Pressure Trend ────────────────────────────

function pressureTrendScore(trend) {
  // Falling pressure = fish feed more
  const scores = {
    falling: 1.0,
    steady: 0.7,
    rising: 0.5,
    rapidly_falling: 0.4, // Storm incoming — variable
    rapidly_rising: 0.3, // Post-front — slow
  };
  return scores[trend] || 0.5;
}

// ── Season Scoring (species dependent) ───────────────────

function seasonScore(month, targetSpecies) {
  // Default scoring — spring/fall best for most species
  const defaultScores = [
    0.4,
    0.4,
    0.6,
    0.8,
    1.0,
    0.9, // Jan-Jun
    0.7,
    0.7,
    0.8,
    1.0,
    0.6,
    0.4, // Jul-Dec
  ];

  // Species-specific overrides
  const overrides = {
    largemouth_bass: [
      0.2, 0.3, 0.6, 0.9, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 0.5, 0.2,
    ],
    rainbow_trout: [0.7, 0.8, 1.0, 1.0, 0.8, 0.5, 0.3, 0.3, 0.5, 0.8, 0.9, 0.8],
    atlantic_salmon: [
      0.2, 0.3, 0.4, 0.5, 0.7, 1.0, 1.0, 0.9, 0.8, 0.5, 0.3, 0.2,
    ],
    bluefin_tuna: [0.2, 0.2, 0.3, 0.4, 0.5, 0.8, 0.9, 1.0, 1.0, 0.8, 0.4, 0.2],
    red_snapper: [0.3, 0.3, 0.4, 0.5, 0.6, 1.0, 0.9, 0.8, 0.7, 0.5, 0.4, 0.3],
    walleye: [0.5, 0.6, 0.8, 1.0, 0.9, 0.7, 0.5, 0.5, 0.7, 0.9, 0.8, 0.6],
    northern_pike: [0.3, 0.5, 0.8, 1.0, 0.9, 0.6, 0.4, 0.4, 0.7, 0.9, 0.7, 0.4],
  };

  const month0 = month - 1; // Convert to 0-indexed
  const scores = overrides[targetSpecies] || defaultScores;
  return scores[month0] || 0.5;
}

// ── Main Prediction Engine ───────────────────────────────

const CACHE_KEY = '@profish_ml_conditions_cache';

const mlConditionsService = {
  /**
   * Predict fishing conditions score (0-100)
   *
   * @param {Object} params
   * @param {string} params.habitat - 'freshwater' or 'saltwater'
   * @param {number} params.barometricPressure - in inHg
   * @param {string} params.pressureTrend - 'falling', 'steady', 'rising'
   * @param {number} params.windSpeed - in mph
   * @param {number} params.temperature - air temp in °F
   * @param {number} params.waterTemp - water temp in °F
   * @param {number} params.cloudCover - 0 to 100%
   * @param {number} params.precipitation - chance 0-100
   * @param {string} params.tidePhase - 'incoming', 'outgoing', 'high', 'low', 'slack'
   * @param {number} params.moonPhase - 0 to 1 (0 = new, 0.5 = full)
   * @param {number} params.hour - 0 to 23
   * @param {number} params.month - 1 to 12
   * @param {string} params.targetSpecies - species ID
   * @returns {Object} { score, rating, factors, recommendation }
   */
  predict(params) {
    const {
      habitat = 'freshwater',
      barometricPressure,
      pressureTrend,
      windSpeed,
      temperature,
      waterTemp,
      cloudCover,
      precipitation,
      tidePhase,
      moonPhase,
      hour,
      month,
      targetSpecies,
    } = params;

    const ideal = IDEAL_CONDITIONS[habitat] || IDEAL_CONDITIONS.freshwater;
    const factors = {};

    // Calculate each factor score
    if (barometricPressure != null) {
      factors.barometric_pressure = rangeScore(
        barometricPressure,
        ideal.barometric_pressure.min,
        ideal.barometric_pressure.max,
      );
    }

    if (pressureTrend) {
      factors.barometric_pressure =
        ((factors.barometric_pressure || 0.5) +
          pressureTrendScore(pressureTrend)) /
        2;
    }

    if (windSpeed != null) {
      factors.wind_speed = rangeScore(
        windSpeed,
        ideal.wind_speed.min,
        ideal.wind_speed.max,
      );
    }

    if (temperature != null) {
      factors.temperature = rangeScore(
        temperature,
        ideal.temperature.min,
        ideal.temperature.max,
      );
    }

    if (waterTemp != null) {
      factors.water_temp = rangeScore(
        waterTemp,
        ideal.water_temp.min,
        ideal.water_temp.max,
      );
    }

    if (cloudCover != null) {
      // Moderate cloud cover (40-70%) is ideal — reduces glare/visibility
      factors.cloud_cover = rangeScore(cloudCover, 30, 70);
    }

    if (precipitation != null) {
      // Light rain (10-30%) can be good; heavy rain is bad
      factors.precipitation =
        precipitation < 40 ? 0.8 : precipitation < 70 ? 0.5 : 0.2;
    }

    if (tidePhase) {
      factors.tide_phase = tidePhaseScore(tidePhase);
    }

    if (moonPhase != null) {
      factors.moon_phase = moonPhaseScore(moonPhase);
    }

    if (hour != null) {
      factors.time_of_day = timeOfDayScore(hour);
    }

    if (month != null) {
      factors.season = seasonScore(month, targetSpecies);
    }

    // Calculate weighted score
    let totalWeight = 0;
    let weightedSum = 0;

    for (const [key, weight] of Object.entries(WEIGHTS)) {
      if (factors[key] != null) {
        weightedSum += factors[key] * weight;
        totalWeight += weight;
      }
    }

    const score =
      totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 50;

    // Determine rating
    let rating, emoji, color;
    if (score >= 80) {
      rating = 'Excellent';
      emoji = '🎣';
      color = '#4CAF50';
    } else if (score >= 65) {
      rating = 'Good';
      emoji = '👍';
      color = '#8BC34A';
    } else if (score >= 50) {
      rating = 'Fair';
      emoji = '🤔';
      color = '#FF9800';
    } else if (score >= 35) {
      rating = 'Poor';
      emoji = '👎';
      color = '#F44336';
    } else {
      rating = 'Bad';
      emoji = '⛈️';
      color = '#D32F2F';
    }

    // Generate recommendation
    const recommendation = this._generateRecommendation(score, factors, params);

    return {
      score,
      rating,
      emoji,
      color,
      factors,
      recommendation,
      timestamp: Date.now(),
    };
  },

  /**
   * Generate text recommendation based on factors
   */
  _generateRecommendation(score, factors, params) {
    const tips = [];

    if (factors.time_of_day != null && factors.time_of_day < 0.5) {
      tips.push(
        'Consider fishing at dawn (5-7 AM) or dusk (5-7 PM) for better results.',
      );
    }

    if (
      factors.barometric_pressure != null &&
      factors.barometric_pressure < 0.5
    ) {
      tips.push(
        'Barometric pressure is outside ideal range. Fish may be less active.',
      );
    }

    if (factors.wind_speed != null && factors.wind_speed < 0.4) {
      tips.push(
        params.windSpeed > 15
          ? 'High winds — fish deeper structure and sheltered spots.'
          : 'Very calm conditions — try topwater lures early/late.',
      );
    }

    if (factors.water_temp != null && factors.water_temp < 0.5) {
      tips.push(
        params.waterTemp > 80
          ? "Warm water — fish deeper where it's cooler."
          : 'Cold water — slow your presentation.',
      );
    }

    if (factors.moon_phase != null && factors.moon_phase >= 0.8) {
      tips.push('Major solunar period — fish are typically more active now!');
    }

    if (factors.tide_phase != null && factors.tide_phase >= 0.8) {
      tips.push('Moving tide — excellent time for inshore species.');
    }

    if (tips.length === 0) {
      if (score >= 70) tips.push('Conditions look great! Get out there!');
      else
        tips.push(
          'Average conditions. Focus on structure and bait presentation.',
        );
    }

    return tips;
  },

  /**
   * Get best fishing windows for the next 24 hours
   * @param {Object} hourlyForecast - Array of { hour, temp, windSpeed, pressure, ... }
   * @param {Object} opts - { habitat, targetSpecies, tideData, moonPhase }
   */
  getBestWindows(hourlyForecast, opts = {}) {
    const predictions = hourlyForecast.map(h => {
      const result = this.predict({
        habitat: opts.habitat || 'freshwater',
        barometricPressure: h.pressure,
        windSpeed: h.windSpeed,
        temperature: h.temp,
        waterTemp: h.waterTemp,
        cloudCover: h.cloudCover,
        precipitation: h.precipitation,
        tidePhase: h.tidePhase,
        moonPhase: opts.moonPhase,
        hour: h.hour,
        month: new Date().getMonth() + 1,
        targetSpecies: opts.targetSpecies,
      });
      return { hour: h.hour, ...result };
    });

    // Sort by score, get top 3 windows
    const sorted = [...predictions].sort((a, b) => b.score - a.score);
    const topWindows = sorted.slice(0, 3);

    return {
      predictions,
      topWindows,
      bestHour: topWindows[0],
      avgScore: Math.round(
        predictions.reduce((sum, p) => sum + p.score, 0) / predictions.length,
      ),
    };
  },

  /**
   * Cache prediction for offline use
   */
  async cachePrediction(locationId, prediction) {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      const cache = raw ? JSON.parse(raw) : {};
      cache[locationId] = {
        ...prediction,
        cachedAt: Date.now(),
      };
      // Keep only last 20 locations
      const keys = Object.keys(cache);
      if (keys.length > 20) {
        const oldest = keys.sort(
          (a, b) => cache[a].cachedAt - cache[b].cachedAt,
        );
        delete cache[oldest[0]];
      }
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      // Non-critical
    }
  },

  /**
   * Get cached prediction
   */
  async getCachedPrediction(locationId) {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const cache = JSON.parse(raw);
      const cached = cache[locationId];
      if (cached && Date.now() - cached.cachedAt < 3600000) {
        // 1 hour TTL
        return cached;
      }
      return null;
    } catch (e) {
      return null;
    }
  },
};

export default mlConditionsService;
