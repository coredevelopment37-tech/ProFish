/**
 * Predictive Catch Model — ProFish (#406)
 *
 * Predicts the probability of catching a specific species
 * at a given location, time, and conditions.
 *
 * Uses historical catch data + environmental factors.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Species Activity Profiles ────────────────────────────

const SPECIES_PROFILES = {
  largemouth_bass: {
    optimalWaterTemp: { min: 60, max: 78, peak: 68 },
    activeHours: { dawn: [5, 8], dusk: [17, 20], night: false },
    preferredDepth: { spring: 3, summer: 12, fall: 6, winter: 20 },
    baroPref: 'falling',
    windTolerance: 15, // mph max
    moonSensitivity: 0.6, // 0-1 how much moon affects activity
  },
  walleye: {
    optimalWaterTemp: { min: 50, max: 70, peak: 58 },
    activeHours: { dawn: [4, 7], dusk: [18, 22], night: true },
    preferredDepth: { spring: 5, summer: 20, fall: 12, winter: 30 },
    baroPref: 'falling',
    windTolerance: 20,
    moonSensitivity: 0.8,
  },
  rainbow_trout: {
    optimalWaterTemp: { min: 45, max: 65, peak: 55 },
    activeHours: { dawn: [5, 9], dusk: [16, 19], night: false },
    preferredDepth: { spring: 3, summer: 8, fall: 4, winter: 6 },
    baroPref: 'steady',
    windTolerance: 12,
    moonSensitivity: 0.3,
  },
  northern_pike: {
    optimalWaterTemp: { min: 50, max: 72, peak: 63 },
    activeHours: { dawn: [6, 10], dusk: [16, 19], night: false },
    preferredDepth: { spring: 2, summer: 8, fall: 5, winter: 15 },
    baroPref: 'falling',
    windTolerance: 18,
    moonSensitivity: 0.4,
  },
  red_snapper: {
    optimalWaterTemp: { min: 65, max: 82, peak: 75 },
    activeHours: { dawn: [5, 8], dusk: [17, 20], night: true },
    preferredDepth: { spring: 60, summer: 80, fall: 70, winter: 100 },
    baroPref: 'falling',
    windTolerance: 25,
    moonSensitivity: 0.7,
  },
  bluefin_tuna: {
    optimalWaterTemp: { min: 58, max: 78, peak: 68 },
    activeHours: { dawn: [5, 9], dusk: [15, 19], night: false },
    preferredDepth: { spring: 30, summer: 20, fall: 25, winter: 40 },
    baroPref: 'steady',
    windTolerance: 20,
    moonSensitivity: 0.5,
  },
  mahi_mahi: {
    optimalWaterTemp: { min: 72, max: 85, peak: 78 },
    activeHours: { dawn: [6, 10], dusk: [15, 18], night: false },
    preferredDepth: { spring: 10, summer: 5, fall: 8, winter: 15 },
    baroPref: 'steady',
    windTolerance: 20,
    moonSensitivity: 0.3,
  },
};

// ── Helper Functions ─────────────────────────────────────

function getSeason(month) {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

function tempScore(waterTemp, profile) {
  if (!profile || !waterTemp) return 0.5;
  const { min, max, peak } = profile.optimalWaterTemp;
  if (waterTemp < min - 15 || waterTemp > max + 15) return 0.05;
  if (waterTemp < min || waterTemp > max) return 0.2;
  const dist = Math.abs(waterTemp - peak);
  const range = (max - min) / 2;
  return Math.max(0.2, 1 - (dist / range) * 0.5);
}

function timeScore(hour, profile) {
  if (!profile) return 0.5;
  const { dawn, dusk, night } = profile.activeHours;
  if (hour >= dawn[0] && hour <= dawn[1]) return 1.0;
  if (hour >= dusk[0] && hour <= dusk[1]) return 0.95;
  if (night && (hour >= 21 || hour <= 3)) return 0.7;
  if (hour >= 10 && hour <= 14) return 0.2; // Midday lull
  return 0.4;
}

function moonScore(moonPhase, sensitivity) {
  // 0 = new, 0.5 = full
  const majorDist = Math.min(
    moonPhase,
    Math.abs(moonPhase - 0.5),
    Math.abs(moonPhase - 1),
  );
  const base = majorDist < 0.08 ? 1.0 : majorDist < 0.15 ? 0.7 : 0.4;
  // Blend with sensitivity — low sensitivity species less affected
  return 0.5 + (base - 0.5) * sensitivity;
}

// ── Main Prediction Service ──────────────────────────────

const CACHE_KEY = '@profish_predictions';

const predictiveCatchService = {
  /**
   * Predict catch probability for a species
   *
   * @param {string} speciesId
   * @param {Object} conditions
   * @param {number} conditions.waterTemp - °F
   * @param {number} conditions.hour - 0-23
   * @param {number} conditions.month - 0-11
   * @param {number} conditions.moonPhase - 0-1
   * @param {number} conditions.windSpeed - mph
   * @param {string} conditions.pressureTrend - 'falling','steady','rising'
   * @param {number} conditions.barometricPressure - inHg
   * @returns {Object} { probability, rating, factors, tips }
   */
  predict(speciesId, conditions) {
    const profile = SPECIES_PROFILES[speciesId];
    const defaultProfile = {
      optimalWaterTemp: { min: 55, max: 75, peak: 65 },
      activeHours: { dawn: [5, 8], dusk: [17, 20], night: false },
      baroPref: 'falling',
      windTolerance: 15,
      moonSensitivity: 0.5,
    };
    const p = profile || defaultProfile;

    const factors = {};

    // Water temperature factor (30% weight)
    factors.waterTemp = {
      score: tempScore(conditions.waterTemp, p),
      weight: 0.3,
      label: 'Water Temperature',
    };

    // Time of day factor (25% weight)
    factors.timeOfDay = {
      score: timeScore(conditions.hour, p),
      weight: 0.25,
      label: 'Time of Day',
    };

    // Moon phase factor (15% weight)
    if (conditions.moonPhase != null) {
      factors.moonPhase = {
        score: moonScore(conditions.moonPhase, p.moonSensitivity),
        weight: 0.15,
        label: 'Moon Phase',
      };
    }

    // Wind factor (10% weight)
    if (conditions.windSpeed != null) {
      const windOk = conditions.windSpeed <= p.windTolerance;
      factors.wind = {
        score: windOk
          ? 0.8
          : Math.max(0.1, 1 - (conditions.windSpeed - p.windTolerance) / 20),
        weight: 0.1,
        label: 'Wind',
      };
    }

    // Barometric pressure factor (10% weight)
    if (conditions.pressureTrend) {
      const baroScores = { falling: 1.0, steady: 0.7, rising: 0.4 };
      const prefScore = baroScores[p.baroPref] || 0.7;
      const actualScore = baroScores[conditions.pressureTrend] || 0.5;
      factors.pressure = {
        score: 0.5 + (actualScore - 0.5) * (prefScore > 0.5 ? 1 : 0.5),
        weight: 0.1,
        label: 'Barometric Pressure',
      };
    }

    // Season factor (10% weight)
    const season = getSeason(conditions.month);
    factors.season = {
      score: 0.7, // Default moderate
      weight: 0.1,
      label: 'Season',
    };

    // Calculate weighted probability
    let totalWeight = 0;
    let weightedSum = 0;
    for (const factor of Object.values(factors)) {
      weightedSum += factor.score * factor.weight;
      totalWeight += factor.weight;
    }

    const probability =
      totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 50;

    // Rating
    let rating, emoji;
    if (probability >= 75) {
      rating = 'Excellent';
      emoji = '🔥';
    } else if (probability >= 55) {
      rating = 'Good';
      emoji = '👍';
    } else if (probability >= 40) {
      rating = 'Fair';
      emoji = '🤷';
    } else {
      rating = 'Low';
      emoji = '❄️';
    }

    // Tips
    const tips = this._generateTips(speciesId, factors, conditions, p);

    return { probability, rating, emoji, factors, tips, speciesId };
  },

  /**
   * Predict top species for current conditions
   */
  predictTopSpecies(conditions, count = 5) {
    const results = Object.keys(SPECIES_PROFILES).map(speciesId => {
      const pred = this.predict(speciesId, conditions);
      return { speciesId, ...pred };
    });

    results.sort((a, b) => b.probability - a.probability);
    return results.slice(0, count);
  },

  /**
   * Generate contextual tips
   */
  _generateTips(speciesId, factors, conditions, profile) {
    const tips = [];
    const name = speciesId
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    if (factors.waterTemp?.score < 0.4) {
      tips.push(
        `Water temp is outside ${name}'s preferred range. Fish deeper or wait for better conditions.`,
      );
    }

    if (factors.timeOfDay?.score < 0.3) {
      const dawn = profile.activeHours.dawn;
      tips.push(
        `${name} are most active ${dawn[0]}AM-${dawn[1]}AM. Consider coming back then.`,
      );
    }

    if (factors.moonPhase?.score > 0.8) {
      tips.push('Moon phase is favorable — expect increased feeding activity!');
    }

    if (factors.wind?.score < 0.4) {
      tips.push('High winds — fish sheltered areas and use heavier tackle.');
    }

    if (tips.length === 0) {
      tips.push(
        `Good conditions for ${name}. Focus on structure and vary your presentation.`,
      );
    }

    return tips;
  },

  /**
   * Cache predictions
   */
  async cachePredictions(locationId, predictions) {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      const cache = raw ? JSON.parse(raw) : {};
      cache[locationId] = { predictions, cachedAt: Date.now() };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      /* non-critical */
    }
  },

  /**
   * Get species list with profiles
   */
  getSupportedSpecies() {
    return Object.keys(SPECIES_PROFILES);
  },
};

export default predictiveCatchService;
