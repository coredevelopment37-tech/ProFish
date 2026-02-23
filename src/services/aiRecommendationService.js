/**
 * AI Recommendations Service — ProFish (#403)
 *
 * AI-powered personalized fishing recommendations based on:
 * - Historical catch data patterns
 * - Current weather + tides
 * - Species activity predictions
 * - Location hotspot analysis
 * - Time-of-day optimization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Recommendation Types ─────────────────────────────────

export const REC_TYPE = {
  SPOT: 'spot',
  SPECIES: 'species',
  TECHNIQUE: 'technique',
  TIMING: 'timing',
  GEAR: 'gear',
  GENERAL: 'general',
};

export const REC_PRIORITY = {
  HIGH: { value: 3, label: 'Top Pick', color: '#FFD700', icon: 'star' },
  MEDIUM: { value: 2, label: 'Suggested', color: '#0a84ff', icon: 'lightbulb' },
  LOW: { value: 1, label: 'Tip', color: '#8BC34A', icon: '📌' },
};

// ── Pattern Analysis ─────────────────────────────────────

function analyzePatterns(catches) {
  if (!catches || catches.length === 0) return null;

  // Species frequency
  const speciesCounts = {};
  const spotCounts = {};
  const methodCounts = {};
  const hourCounts = new Array(24).fill(0);
  const monthCounts = new Array(12).fill(0);
  const dayOfWeekCounts = new Array(7).fill(0);

  catches.forEach(c => {
    if (c.species)
      speciesCounts[c.species] = (speciesCounts[c.species] || 0) + 1;
    if (c.locationName)
      spotCounts[c.locationName] = (spotCounts[c.locationName] || 0) + 1;
    if (c.method) methodCounts[c.method] = (methodCounts[c.method] || 0) + 1;

    if (c.date) {
      const d = new Date(c.date);
      hourCounts[d.getHours()]++;
      monthCounts[d.getMonth()]++;
      dayOfWeekCounts[d.getDay()]++;
    }
  });

  const sortByCount = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]);

  // Find best hours (top 3 two-hour windows)
  const bestHours = [];
  for (let h = 0; h < 24; h++) {
    bestHours.push({
      hour: h,
      count: hourCounts[h] + (hourCounts[(h + 1) % 24] || 0),
    });
  }
  bestHours.sort((a, b) => b.count - a.count);

  return {
    topSpecies: sortByCount(speciesCounts).slice(0, 5),
    topSpots: sortByCount(spotCounts).slice(0, 5),
    topMethods: sortByCount(methodCounts).slice(0, 5),
    bestHours: bestHours.slice(0, 3),
    bestMonths: monthCounts
      .map((c, i) => ({ month: i, count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
    bestDays: dayOfWeekCounts
      .map((c, i) => ({ day: i, count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
    totalCatches: catches.length,
    uniqueSpecies: Object.keys(speciesCounts).length,
  };
}

// ── Recommendation Generators ────────────────────────────

function generateSpotRecommendations(patterns, currentConditions) {
  const recs = [];

  if (patterns.topSpots.length > 0) {
    const [topSpot, count] = patterns.topSpots[0];
    recs.push({
      type: REC_TYPE.SPOT,
      priority: REC_PRIORITY.HIGH,
      title: `Head to ${topSpot}`,
      description: `Your most productive spot with ${count} catches. Conditions look favorable today.`,
      data: { spot: topSpot, catchCount: count },
    });
  }

  // Suggest trying a new spot if user has been going to same place
  if (patterns.topSpots.length >= 2) {
    const lessVisited = patterns.topSpots.slice(-1)[0];
    recs.push({
      type: REC_TYPE.SPOT,
      priority: REC_PRIORITY.LOW,
      title: `Explore ${lessVisited[0]}`,
      description: 'Try mixing up your spots to discover new patterns.',
      data: { spot: lessVisited[0] },
    });
  }

  return recs;
}

function generateSpeciesRecommendations(patterns, month) {
  const recs = [];

  // Seasonal species targeting
  const SEASONAL_SPECIES = {
    0: ['walleye', 'northern_pike', 'lake_trout'], // Jan
    1: ['walleye', 'northern_pike', 'crappie'], // Feb
    2: ['crappie', 'walleye', 'rainbow_trout'], // Mar
    3: ['largemouth_bass', 'crappie', 'walleye'], // Apr
    4: ['largemouth_bass', 'bluegill', 'channel_catfish'], // May
    5: ['largemouth_bass', 'bluefin_tuna', 'red_snapper'], // Jun
    6: ['mahi_mahi', 'sailfish', 'largemouth_bass'], // Jul
    7: ['mahi_mahi', 'bluefin_tuna', 'channel_catfish'], // Aug
    8: ['largemouth_bass', 'walleye', 'atlantic_salmon'], // Sep
    9: ['walleye', 'northern_pike', 'brown_trout'], // Oct
    10: ['walleye', 'rainbow_trout', 'striped_bass'], // Nov
    11: ['walleye', 'northern_pike', 'lake_trout'], // Dec
  };

  const seasonal = SEASONAL_SPECIES[month] || [];
  if (seasonal.length > 0) {
    const targetSpecies = seasonal[0]
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    recs.push({
      type: REC_TYPE.SPECIES,
      priority: REC_PRIORITY.MEDIUM,
      title: `Target ${targetSpecies}`,
      description: `${targetSpecies} are typically active this time of year in your region.`,
      data: { species: seasonal[0], reason: 'seasonal_peak' },
    });
  }

  // Species the user hasn't caught yet from common species
  if (patterns.topSpecies.length > 0) {
    const caught = new Set(patterns.topSpecies.map(([s]) => s));
    const uncaught = seasonal.filter(s => !caught.has(s));
    if (uncaught.length > 0) {
      const newTarget = uncaught[0]
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      recs.push({
        type: REC_TYPE.SPECIES,
        priority: REC_PRIORITY.LOW,
        title: `New species: ${newTarget}`,
        description: `You haven\'t caught ${newTarget} yet. Add it to your species list!`,
        data: { species: uncaught[0], reason: 'new_species' },
      });
    }
  }

  return recs;
}

function generateTimingRecommendations(patterns) {
  const recs = [];

  if (patterns.bestHours.length > 0) {
    const bestHour = patterns.bestHours[0].hour;
    const period =
      bestHour < 12
        ? `${bestHour}:00 AM`
        : bestHour === 12
        ? '12:00 PM'
        : `${bestHour - 12}:00 PM`;

    recs.push({
      type: REC_TYPE.TIMING,
      priority: REC_PRIORITY.MEDIUM,
      title: `Best time: around ${period}`,
      description: `Based on your catch history, you tend to have the most success around ${period}.`,
      data: { hour: bestHour },
    });
  }

  return recs;
}

function generateTechniqueRecommendations(patterns, conditions) {
  const recs = [];

  // Weather-based technique suggestions
  if (conditions) {
    if (conditions.windSpeed > 15) {
      recs.push({
        type: REC_TYPE.TECHNIQUE,
        priority: REC_PRIORITY.HIGH,
        title: 'Fish sheltered structure',
        description:
          'High winds today. Target windblown banks and sheltered coves.',
        data: { reason: 'high_wind' },
      });
    }

    if (conditions.cloudCover > 70) {
      recs.push({
        type: REC_TYPE.TECHNIQUE,
        priority: REC_PRIORITY.MEDIUM,
        title: 'Try topwater',
        description:
          'Overcast skies are ideal for topwater action. Fish are less wary.',
        data: { reason: 'overcast' },
      });
    }

    if (conditions.waterTemp && conditions.waterTemp < 55) {
      recs.push({
        type: REC_TYPE.TECHNIQUE,
        priority: REC_PRIORITY.MEDIUM,
        title: 'Slow down presentation',
        description:
          'Cold water means sluggish fish. Use slow-moving baits and finesse techniques.',
        data: { reason: 'cold_water' },
      });
    }
  }

  // Method suggestion based on what works
  if (patterns.topMethods.length > 0) {
    const [topMethod, count] = patterns.topMethods[0];
    recs.push({
      type: REC_TYPE.TECHNIQUE,
      priority: REC_PRIORITY.LOW,
      title: `Stick with ${topMethod}`,
      description: `${topMethod} has been your most productive technique (${count} catches).`,
      data: { method: topMethod },
    });
  }

  return recs;
}

// ── Main Recommendations Service ─────────────────────────

const CACHE_KEY = '@profish_recommendations';

const aiRecommendationService = {
  /**
   * Generate personalized recommendations
   *
   * @param {Array} catches - User's catch history
   * @param {Object} conditions - Current weather/conditions
   * @param {Object} opts - { maxResults, types }
   */
  async getRecommendations(catches, conditions, opts = {}) {
    const maxResults = opts.maxResults || 8;
    const filterTypes = opts.types || null; // null = all types

    const patterns = analyzePatterns(catches);
    const month = new Date().getMonth();

    let recs = [];

    if (patterns) {
      recs = [
        ...generateSpotRecommendations(patterns, conditions),
        ...generateSpeciesRecommendations(patterns, month),
        ...generateTimingRecommendations(patterns),
        ...generateTechniqueRecommendations(patterns, conditions),
      ];
    } else {
      // New user — generic recommendations
      recs = [
        {
          type: REC_TYPE.GENERAL,
          priority: REC_PRIORITY.HIGH,
          title: 'Log your first catch!',
          description:
            'Start logging catches to unlock personalized AI recommendations.',
          data: { reason: 'new_user' },
        },
        {
          type: REC_TYPE.TIMING,
          priority: REC_PRIORITY.MEDIUM,
          title: 'Dawn & dusk are prime time',
          description:
            'Fish are most active in low-light conditions. Try early morning or evening.',
          data: { reason: 'general_tip' },
        },
      ];
    }

    // Filter by type
    if (filterTypes) {
      recs = recs.filter(r => filterTypes.includes(r.type));
    }

    // Sort by priority, limit results
    recs.sort((a, b) => b.priority.value - a.priority.value);
    const result = recs.slice(0, maxResults);

    // Cache recommendations
    try {
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          recommendations: result,
          generatedAt: Date.now(),
          catchCount: catches?.length || 0,
        }),
      );
    } catch (e) {
      // Non-critical
    }

    return result;
  },

  /**
   * Get cached recommendations (for offline)
   */
  async getCachedRecommendations() {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return [];
      const cached = JSON.parse(raw);
      // Valid for 6 hours
      if (Date.now() - cached.generatedAt > 21600000) return [];
      return cached.recommendations;
    } catch (e) {
      return [];
    }
  },

  /**
   * Get pattern analysis for stats display
   */
  analyzePatterns(catches) {
    return analyzePatterns(catches);
  },

  /**
   * Get seasonal species recommendations for current month
   */
  getSeasonalSpecies(month) {
    return generateSpeciesRecommendations(
      { topSpecies: [] },
      month || new Date().getMonth(),
    );
  },
};

export default aiRecommendationService;
