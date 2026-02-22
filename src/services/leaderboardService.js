/**
 * Leaderboard Service — ProFish (#359-362)
 *
 * Handles all leaderboard types:
 *   - Global: All users
 *   - Regional: Per 12 regions (NA, EU, NORDICS, etc.)
 *   - Species: Per species (biggest catch)
 *   - Friends: Only followed users
 *
 * Time filters (#362): weekly, monthly, all-time
 *
 * Data source: Firestore aggregated leaderboard docs + real-time updates.
 *
 * Firestore collections:
 *   - leaderboards/{type}_{region}_{timeframe}/entries/{userId}
 *   - leaderboards_meta/{boardId}: metadata (last updated, participant count)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

let firestore = null;
let auth = null;
try {
  firestore = require('@react-native-firebase/firestore').default;
  auth = require('@react-native-firebase/auth').default;
} catch (e) {}

// ── Leaderboard Types ───────────────────────────────────

export const LEADERBOARD_TYPE = {
  GLOBAL: 'global',
  REGIONAL: 'regional',
  SPECIES: 'species',
  FRIENDS: 'friends',
};

export const LEADERBOARD_METRIC = {
  TOTAL_CATCHES: 'totalCatches',
  BIGGEST_WEIGHT: 'biggestWeight',
  BIGGEST_LENGTH: 'biggestLength',
  SPECIES_COUNT: 'speciesCount',
  LONGEST_TRIP: 'longestTrip',
};

export const TIME_FILTER = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  ALL_TIME: 'allTime',
};

// ── 12 Regions (matching regionGatingService) ───────────

export const LEADERBOARD_REGIONS = [
  { id: 'NA', label: 'North America' },
  { id: 'EU', label: 'Europe' },
  { id: 'NORDICS', label: 'Scandinavia' },
  { id: 'GCC', label: 'Gulf States' },
  { id: 'MENA', label: 'Middle East & N. Africa' },
  { id: 'SA', label: 'South America' },
  { id: 'CA', label: 'Central America' },
  { id: 'SEA', label: 'Southeast Asia' },
  { id: 'EA', label: 'East Asia' },
  { id: 'SA_ASIA', label: 'South Asia' },
  { id: 'OC', label: 'Oceania' },
  { id: 'AF', label: 'Africa' },
];

const CACHE_KEY = '@profish_leaderboard_cache';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// ── Service ─────────────────────────────────────────────

const leaderboardService = {
  _cache: {},
  _listeners: new Map(),

  /**
   * Get a unique board ID for Firestore collection path
   */
  _getBoardId(
    type,
    metric,
    { region = null, species = null, timeFilter = TIME_FILTER.ALL_TIME } = {},
  ) {
    const parts = [type, metric, timeFilter];
    if (region) parts.push(region);
    if (species) parts.push(species.replace(/\s+/g, '_').toLowerCase());
    return parts.join('_');
  },

  /**
   * Compute time boundary for weekly/monthly filters
   */
  _getTimeBoundary(timeFilter) {
    const now = new Date();
    if (timeFilter === TIME_FILTER.WEEKLY) {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return start.toISOString();
    }
    if (timeFilter === TIME_FILTER.MONTHLY) {
      const start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      return start.toISOString();
    }
    return null; // all-time
  },

  /**
   * Fetch leaderboard entries
   * @param {Object} options
   * @param {string} options.type - LEADERBOARD_TYPE
   * @param {string} options.metric - LEADERBOARD_METRIC
   * @param {string} [options.region] - Region ID for regional boards
   * @param {string} [options.species] - Species name for species boards
   * @param {string} [options.timeFilter] - TIME_FILTER
   * @param {number} [options.limit] - Max entries
   * @returns {Promise<Array>} Sorted leaderboard entries
   */
  async getLeaderboard({
    type = LEADERBOARD_TYPE.GLOBAL,
    metric = LEADERBOARD_METRIC.TOTAL_CATCHES,
    region = null,
    species = null,
    timeFilter = TIME_FILTER.ALL_TIME,
    limit = 50,
  } = {}) {
    const boardId = this._getBoardId(type, metric, {
      region,
      species,
      timeFilter,
    });

    // Check cache
    const cacheKey = `${CACHE_KEY}_${boardId}`;
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed._cachedAt < CACHE_TTL) {
          return parsed.entries;
        }
      }
    } catch {}

    if (!firestore) return this._getMockLeaderboard(type, metric, limit);

    try {
      let query = firestore()
        .collection('leaderboards')
        .doc(boardId)
        .collection('entries')
        .orderBy('score', 'desc')
        .limit(limit);

      const snapshot = await query.get();
      const entries = snapshot.docs.map((doc, index) => ({
        rank: index + 1,
        userId: doc.id,
        ...doc.data(),
      }));

      // Cache result
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({
          entries,
          _cachedAt: Date.now(),
        }),
      ).catch(() => {});

      return entries;
    } catch (e) {
      console.warn('[Leaderboard] Fetch error:', e);
      return this._getMockLeaderboard(type, metric, limit);
    }
  },

  /**
   * Subscribe to real-time leaderboard updates
   */
  subscribeLeaderboard({
    type = LEADERBOARD_TYPE.GLOBAL,
    metric = LEADERBOARD_METRIC.TOTAL_CATCHES,
    region = null,
    species = null,
    timeFilter = TIME_FILTER.ALL_TIME,
    limit = 50,
    onUpdate,
    onError,
  }) {
    const boardId = this._getBoardId(type, metric, {
      region,
      species,
      timeFilter,
    });

    // Unsubscribe previous listener for this board
    if (this._listeners.has(boardId)) {
      this._listeners.get(boardId)();
    }

    if (!firestore) {
      onUpdate?.(this._getMockLeaderboard(type, metric, limit));
      return () => {};
    }

    const unsubscribe = firestore()
      .collection('leaderboards')
      .doc(boardId)
      .collection('entries')
      .orderBy('score', 'desc')
      .limit(limit)
      .onSnapshot(
        snapshot => {
          const entries = snapshot.docs.map((doc, index) => ({
            rank: index + 1,
            userId: doc.id,
            ...doc.data(),
          }));
          onUpdate?.(entries);
        },
        error => {
          console.warn('[Leaderboard] Subscribe error:', error);
          onError?.(error);
        },
      );

    this._listeners.set(boardId, unsubscribe);
    return unsubscribe;
  },

  /**
   * Submit/update a user's score on a leaderboard
   */
  async submitScore({
    type = LEADERBOARD_TYPE.GLOBAL,
    metric = LEADERBOARD_METRIC.TOTAL_CATCHES,
    region = null,
    species = null,
    timeFilter = TIME_FILTER.ALL_TIME,
    score,
    metadata = {},
  }) {
    const user = auth?.().currentUser;
    if (!user || !firestore) return false;

    const boardId = this._getBoardId(type, metric, {
      region,
      species,
      timeFilter,
    });

    try {
      await firestore()
        .collection('leaderboards')
        .doc(boardId)
        .collection('entries')
        .doc(user.uid)
        .set(
          {
            userId: user.uid,
            displayName: user.displayName || 'Angler',
            photoURL: user.photoURL || null,
            score,
            region: region || metadata.region || null,
            updatedAt: new Date().toISOString(),
            ...metadata,
          },
          { merge: true },
        );

      // Update board meta
      await firestore()
        .collection('leaderboards_meta')
        .doc(boardId)
        .set(
          {
            lastUpdated: new Date().toISOString(),
            participantCount: firestore.FieldValue.increment(0), // touch
          },
          { merge: true },
        );

      return true;
    } catch (e) {
      console.warn('[Leaderboard] Submit score error:', e);
      return false;
    }
  },

  /**
   * Get friends leaderboard (#361)
   * Only users the current user follows
   */
  async getFriendsLeaderboard({
    metric = LEADERBOARD_METRIC.TOTAL_CATCHES,
    timeFilter = TIME_FILTER.ALL_TIME,
    limit = 50,
  } = {}) {
    const user = auth?.().currentUser;
    if (!user || !firestore)
      return this._getMockLeaderboard(LEADERBOARD_TYPE.FRIENDS, metric, limit);

    try {
      // Get followed user IDs
      const followingSnapshot = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('following')
        .get();

      const followedIds = followingSnapshot.docs.map(doc => doc.id);
      followedIds.push(user.uid); // Include self

      if (followedIds.length === 0) return [];

      // Firestore 'in' queries are limited to 30 items
      const batches = [];
      for (let i = 0; i < followedIds.length; i += 30) {
        batches.push(followedIds.slice(i, i + 30));
      }

      const boardId = this._getBoardId(LEADERBOARD_TYPE.GLOBAL, metric, {
        timeFilter,
      });

      let allEntries = [];

      for (const batch of batches) {
        const snapshot = await firestore()
          .collection('leaderboards')
          .doc(boardId)
          .collection('entries')
          .where('userId', 'in', batch)
          .get();

        allEntries.push(...snapshot.docs.map(doc => doc.data()));
      }

      // Sort by score descending
      allEntries.sort((a, b) => (b.score || 0) - (a.score || 0));
      allEntries = allEntries.slice(0, limit).map((entry, index) => ({
        ...entry,
        rank: index + 1,
        isFriend: entry.userId !== user.uid,
        isMe: entry.userId === user.uid,
      }));

      return allEntries;
    } catch (e) {
      console.warn('[Leaderboard] Friends error:', e);
      return [];
    }
  },

  /**
   * Get regional leaderboard (#359)
   */
  async getRegionalLeaderboard({
    region,
    metric = LEADERBOARD_METRIC.TOTAL_CATCHES,
    timeFilter = TIME_FILTER.ALL_TIME,
    limit = 50,
  } = {}) {
    return this.getLeaderboard({
      type: LEADERBOARD_TYPE.REGIONAL,
      metric,
      region,
      timeFilter,
      limit,
    });
  },

  /**
   * Get species-specific leaderboard (#360)
   */
  async getSpeciesLeaderboard({
    species,
    metric = LEADERBOARD_METRIC.BIGGEST_WEIGHT,
    timeFilter = TIME_FILTER.ALL_TIME,
    limit = 50,
  } = {}) {
    return this.getLeaderboard({
      type: LEADERBOARD_TYPE.SPECIES,
      metric,
      species,
      timeFilter,
      limit,
    });
  },

  /**
   * Update all leaderboards after a new catch is logged
   */
  async onCatchLogged(catchItem, userRegion = null) {
    const user = auth?.().currentUser;
    if (!user) return;

    const metadata = {
      region: userRegion,
      lastCatchSpecies: catchItem.species,
    };

    // Get user's current stats for score calculation
    const stats = await this._getUserStats();

    // Submit to global boards (all time filters)
    const timeFilters = [
      TIME_FILTER.ALL_TIME,
      TIME_FILTER.MONTHLY,
      TIME_FILTER.WEEKLY,
    ];

    for (const tf of timeFilters) {
      // Total catches
      await this.submitScore({
        type: LEADERBOARD_TYPE.GLOBAL,
        metric: LEADERBOARD_METRIC.TOTAL_CATCHES,
        timeFilter: tf,
        score: stats.totalCatches,
        metadata,
      });

      // Biggest weight
      if (catchItem.weight) {
        await this.submitScore({
          type: LEADERBOARD_TYPE.GLOBAL,
          metric: LEADERBOARD_METRIC.BIGGEST_WEIGHT,
          timeFilter: tf,
          score: catchItem.weight,
          metadata,
        });
      }

      // Species count
      await this.submitScore({
        type: LEADERBOARD_TYPE.GLOBAL,
        metric: LEADERBOARD_METRIC.SPECIES_COUNT,
        timeFilter: tf,
        score: stats.speciesCount,
        metadata,
      });

      // Regional board
      if (userRegion) {
        await this.submitScore({
          type: LEADERBOARD_TYPE.REGIONAL,
          metric: LEADERBOARD_METRIC.TOTAL_CATCHES,
          region: userRegion,
          timeFilter: tf,
          score: stats.totalCatches,
          metadata,
        });
      }

      // Species-specific board
      if (catchItem.species && catchItem.weight) {
        await this.submitScore({
          type: LEADERBOARD_TYPE.SPECIES,
          metric: LEADERBOARD_METRIC.BIGGEST_WEIGHT,
          species: catchItem.species,
          timeFilter: tf,
          score: catchItem.weight,
          metadata,
        });
      }
    }
  },

  /**
   * Get user's current rank on a board
   */
  async getUserRank({
    type = LEADERBOARD_TYPE.GLOBAL,
    metric = LEADERBOARD_METRIC.TOTAL_CATCHES,
    region = null,
    species = null,
    timeFilter = TIME_FILTER.ALL_TIME,
  } = {}) {
    const user = auth?.().currentUser;
    if (!user) return null;

    const entries = await this.getLeaderboard({
      type,
      metric,
      region,
      species,
      timeFilter,
      limit: 200,
    });

    const entry = entries.find(e => e.userId === user.uid);
    return entry
      ? { rank: entry.rank, score: entry.score, total: entries.length }
      : null;
  },

  /**
   * Get user stats from local catches
   */
  async _getUserStats() {
    try {
      const catchService = require('./catchService').default;
      const catches = await catchService.getCatches();
      return {
        totalCatches: catches.length,
        biggestWeight: Math.max(0, ...catches.map(c => c.weight || 0)),
        biggestLength: Math.max(0, ...catches.map(c => c.length || 0)),
        speciesCount: new Set(catches.map(c => c.species).filter(Boolean)).size,
      };
    } catch {
      return {
        totalCatches: 0,
        biggestWeight: 0,
        biggestLength: 0,
        speciesCount: 0,
      };
    }
  },

  /**
   * Cleanup listeners on unmount
   */
  unsubscribeAll() {
    for (const [, unsub] of this._listeners) {
      unsub?.();
    }
    this._listeners.clear();
  },

  /**
   * Generate mock leaderboard for offline/development
   */
  _getMockLeaderboard(type, metric, limit = 20) {
    const mockNames = [
      'BassMaster47',
      'TroutWhisperer',
      'ReelDeal',
      'Captain_Jack',
      'TightLines',
      'FishOn_Marco',
      'AnglrPro',
      'CatchKing',
      'LureQueen',
      'PikePredator',
      'SalmonSlayer',
      'WalleyeWizard',
      'CarpCrusher',
      'BonesFisher',
      'TarponKing',
      'MuskieMania',
      'PerchPuncher',
      'CatfishChase',
      'SnapperSnag',
      'DoradoDan',
    ];

    return mockNames.slice(0, limit).map((name, i) => ({
      rank: i + 1,
      userId: `mock_${i}`,
      displayName: name,
      photoURL: null,
      score:
        metric === LEADERBOARD_METRIC.BIGGEST_WEIGHT
          ? Math.round((30 - i * 1.2) * 10) / 10
          : metric === LEADERBOARD_METRIC.SPECIES_COUNT
          ? Math.max(1, 25 - i)
          : Math.max(1, 200 - i * 8),
      region: LEADERBOARD_REGIONS[i % LEADERBOARD_REGIONS.length].id,
      isMe: i === 3,
    }));
  },
};

export default leaderboardService;
